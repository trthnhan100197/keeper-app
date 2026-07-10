"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { RoomStatus } from "@prisma/client";

export async function updateProperty(propertyId: string, data: { name?: string; address?: string }) {
  await prisma.property.update({ where: { id: propertyId }, data });
  revalidatePath("/rooms");
  revalidatePath("/dashboard");
}

export async function addProperty() {
  const property = await prisma.property.create({
    data: { name: "Cơ sở mới", address: "" },
  });
  revalidatePath("/rooms");
  revalidatePath("/dashboard");
  return property.id;
}

export async function deleteProperty(propertyId: string) {
  await prisma.property.delete({ where: { id: propertyId } });
  revalidatePath("/rooms");
  revalidatePath("/dashboard");
  revalidatePath("/readings");
  revalidatePath("/invoice");
}

export async function updateRoom(
  roomId: string,
  data: { name?: string; monthlyRent?: number; status?: RoomStatus }
) {
  await prisma.room.update({ where: { id: roomId }, data });
  revalidatePath("/rooms");
  revalidatePath("/dashboard");
  revalidatePath("/readings");
  revalidatePath("/invoice");
}

export async function addRoom(propertyId: string) {
  const property = await prisma.property.findUniqueOrThrow({
    where: { id: propertyId },
    include: { rooms: true },
  });
  await prisma.room.create({
    data: {
      propertyId,
      name: `Phòng mới ${property.rooms.length + 1}`,
      monthlyRent: 0,
      status: "VACANT",
    },
  });
  revalidatePath("/rooms");
  revalidatePath("/dashboard");
}

export async function deleteRoom(roomId: string) {
  await prisma.room.delete({ where: { id: roomId } });
  revalidatePath("/rooms");
  revalidatePath("/dashboard");
  revalidatePath("/readings");
  revalidatePath("/invoice");
}

export async function upsertTenant(roomId: string, data: { name: string; phone: string }) {
  const existing = await prisma.tenant.findFirst({ where: { roomId, active: true } });
  if (existing) {
    await prisma.tenant.update({ where: { id: existing.id }, data: { name: data.name, phone: data.phone } });
  } else {
    await prisma.tenant.create({ data: { roomId, name: data.name, phone: data.phone, active: true } });
  }
  revalidatePath("/rooms");
  revalidatePath("/invoice");
}

export async function saveReading(input: {
  roomId: string;
  month: number;
  year: number;
  electricOld: number;
  electricNew: number;
  waterOld: number;
  waterNew: number;
  waterUnitPrice: number;
  useTiers: boolean;
  fees: { feeTypeId: string; amount: number }[];
}) {
  const { fees, ...readingInput } = input;
  const activeConfig = await prisma.billingConfig.findFirst({ where: { isActive: true } });
  const reading = await prisma.meterReading.upsert({
    where: { roomId_month_year: { roomId: input.roomId, month: input.month, year: input.year } },
    create: { ...readingInput, billingConfigId: activeConfig?.id },
    update: {
      electricOld: readingInput.electricOld,
      electricNew: readingInput.electricNew,
      waterOld: readingInput.waterOld,
      waterNew: readingInput.waterNew,
      waterUnitPrice: readingInput.waterUnitPrice,
      useTiers: readingInput.useTiers,
    },
  });

  const nonZeroFees = fees.filter((f) => f.amount > 0);
  await prisma.$transaction([
    prisma.fee.deleteMany({ where: { meterReadingId: reading.id } }),
    ...(nonZeroFees.length > 0
      ? [
          prisma.fee.createMany({
            data: nonZeroFees.map((f) => ({ meterReadingId: reading.id, feeTypeId: f.feeTypeId, amount: f.amount })),
          }),
        ]
      : []),
  ]);

  revalidatePath("/readings");
  revalidatePath("/invoice");
  revalidatePath("/dashboard");
}

async function upsertPartialReading(input: {
  roomId: string;
  month: number;
  year: number;
  electricNew?: number;
  waterNew?: number;
  source: "PHOTO" | "VOICE";
  needsReview: boolean;
}) {
  const activeConfig = await prisma.billingConfig.findFirst({ where: { isActive: true } });
  const prevMonth = input.month === 1 ? 12 : input.month - 1;
  const prevYear = input.month === 1 ? input.year - 1 : input.year;
  const [existing, prevReading] = await Promise.all([
    prisma.meterReading.findUnique({
      where: { roomId_month_year: { roomId: input.roomId, month: input.month, year: input.year } },
    }),
    prisma.meterReading.findUnique({
      where: { roomId_month_year: { roomId: input.roomId, month: prevMonth, year: prevYear } },
    }),
  ]);

  const electricOld = existing?.electricOld ?? prevReading?.electricNew ?? 0;
  const waterOld = existing?.waterOld ?? prevReading?.waterNew ?? 0;

  await prisma.meterReading.upsert({
    where: { roomId_month_year: { roomId: input.roomId, month: input.month, year: input.year } },
    update: {
      ...(input.electricNew != null ? { electricNew: input.electricNew } : {}),
      ...(input.waterNew != null ? { waterNew: input.waterNew } : {}),
      source: input.source,
      needsReview: input.needsReview,
    },
    create: {
      roomId: input.roomId,
      month: input.month,
      year: input.year,
      electricOld,
      electricNew: input.electricNew ?? electricOld,
      waterOld,
      waterNew: input.waterNew ?? waterOld,
      waterUnitPrice: activeConfig?.defaultWaterPrice ?? 0,
      billingConfigId: activeConfig?.id,
      source: input.source,
      needsReview: input.needsReview,
    },
  });

  revalidatePath("/readings");
  revalidatePath("/invoice");
  revalidatePath("/dashboard");
}

export async function savePhotoReading(input: {
  roomId: string;
  month: number;
  year: number;
  meterType: "electric" | "water";
  newValue: number;
  needsReview: boolean;
}) {
  await upsertPartialReading({
    roomId: input.roomId,
    month: input.month,
    year: input.year,
    electricNew: input.meterType === "electric" ? input.newValue : undefined,
    waterNew: input.meterType === "water" ? input.newValue : undefined,
    source: "PHOTO",
    needsReview: input.needsReview,
  });
}

export async function saveVoiceReading(input: {
  roomId: string;
  month: number;
  year: number;
  electricNew?: number;
  waterNew?: number;
  needsReview: boolean;
}) {
  await upsertPartialReading({ ...input, source: "VOICE" });
}

export async function addApiKey(name: string) {
  const key = `kpr_${randomBytes(24).toString("hex")}`;
  await prisma.apiKey.create({ data: { name, key } });
  revalidatePath("/settings/api-keys");
}

export async function toggleApiKey(id: string, active: boolean) {
  await prisma.apiKey.update({ where: { id }, data: { active } });
  revalidatePath("/settings/api-keys");
}

export async function deleteApiKey(id: string) {
  await prisma.apiKey.delete({ where: { id } });
  revalidatePath("/settings/api-keys");
}

export async function saveConfig(input: {
  configId: string;
  useTiers: boolean;
  flatUnitPrice: number;
  defaultWaterPrice: number;
  // tier/feeType không có `id` (hoặc id bắt đầu bằng "new-") nghĩa là dòng mới thêm ở UI, chưa có trong DB
  tiers: { id: string; tierOrder: number; fromKwh: number; toKwh: number | null; unitPrice: number }[];
  deletedTierIds: string[];
  feeTypes: { id: string; name: string; defaultAmount: number }[];
  deletedFeeTypeIds: string[];
}) {
  // Validate cả trong 1 bậc (Đến >= Từ) lẫn giữa các bậc liên tiếp (Từ bậc sau phải nối đúng ngay
  // sau Đến bậc trước — không được chồng lấn/có khoảng trống, nếu không tiền điện sẽ tính sai vì
  // calculateElectricityBill duyệt tuần tự theo bậc và trừ dần kWh còn lại).
  const sortedTiers = [...input.tiers].sort((a, b) => a.tierOrder - b.tierOrder);
  sortedTiers.forEach((t, i) => {
    if (t.toKwh != null && t.toKwh < t.fromKwh) {
      throw new Error(`Bậc ${t.tierOrder}: "Đến" (${t.toKwh}) không được nhỏ hơn "Từ" (${t.fromKwh})`);
    }
    if (i < sortedTiers.length - 1 && t.toKwh == null) {
      throw new Error(`Bậc ${t.tierOrder}: chỉ bậc cuối cùng mới được để "Đến" trống (không giới hạn)`);
    }
    if (i > 0) {
      const prev = sortedTiers[i - 1];
      if (prev.toKwh != null && t.fromKwh !== prev.toKwh + 1) {
        throw new Error(
          `Bậc ${t.tierOrder}: "Từ" (${t.fromKwh}) phải nối tiếp ngay sau bậc ${prev.tierOrder} (đến ${prev.toKwh}) — phải là ${prev.toKwh + 1}`
        );
      }
    }
  });

  const newTiers = input.tiers.filter((t) => t.id.startsWith("new-"));
  const existingTiers = input.tiers.filter((t) => !t.id.startsWith("new-"));
  const newFeeTypes = input.feeTypes.filter((f) => f.id.startsWith("new-"));
  const existingFeeTypes = input.feeTypes.filter((f) => !f.id.startsWith("new-"));
  // dùng deleteMany (khớp theo id: {in}) thay vì delete từng id — an toàn nếu deletedIds có phần tử
  // trùng lặp hoặc trỏ tới bản ghi không còn tồn tại, tránh lỗi P2025 làm rollback cả transaction
  const deletedTierIds = [...new Set(input.deletedTierIds)];
  const deletedFeeTypeIds = [...new Set(input.deletedFeeTypeIds)];

  await prisma.$transaction([
    prisma.billingConfig.update({
      where: { id: input.configId },
      data: {
        useTiers: input.useTiers,
        flatUnitPrice: input.flatUnitPrice,
        defaultWaterPrice: input.defaultWaterPrice,
      },
    }),
    prisma.electricTier.deleteMany({ where: { id: { in: deletedTierIds } } }),
    ...existingTiers.map((t) =>
      prisma.electricTier.update({
        where: { id: t.id },
        data: { tierOrder: t.tierOrder, fromKwh: t.fromKwh, toKwh: t.toKwh, unitPrice: t.unitPrice },
      })
    ),
    ...newTiers.map((t) =>
      prisma.electricTier.create({
        data: {
          billingConfigId: input.configId,
          tierOrder: t.tierOrder,
          fromKwh: t.fromKwh,
          toKwh: t.toKwh,
          unitPrice: t.unitPrice,
        },
      })
    ),
    prisma.feeType.deleteMany({ where: { id: { in: deletedFeeTypeIds } } }),
    ...existingFeeTypes.map((ft) =>
      prisma.feeType.update({ where: { id: ft.id }, data: { name: ft.name, defaultAmount: ft.defaultAmount } })
    ),
    ...newFeeTypes.map((ft) =>
      prisma.feeType.create({ data: { name: ft.name, defaultAmount: ft.defaultAmount } })
    ),
  ]);
  revalidatePath("/config");
  revalidatePath("/readings");
  revalidatePath("/invoice");
}
