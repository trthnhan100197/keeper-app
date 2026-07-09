"use server";

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

export async function addFeeType(name: string, defaultAmount: number) {
  await prisma.feeType.create({ data: { name, defaultAmount } });
  revalidatePath("/config");
  revalidatePath("/readings");
}

export async function updateFeeType(id: string, data: { name?: string; defaultAmount?: number }) {
  await prisma.feeType.update({ where: { id }, data });
  revalidatePath("/config");
  revalidatePath("/readings");
  revalidatePath("/invoice");
}

export async function deleteFeeType(id: string) {
  await prisma.feeType.delete({ where: { id } });
  revalidatePath("/config");
  revalidatePath("/readings");
  revalidatePath("/invoice");
}

export async function saveConfig(input: {
  configId: string;
  useTiers: boolean;
  flatUnitPrice: number;
  defaultWaterPrice: number;
  tiers: { id: string; unitPrice: number }[];
  feeTypes: { id: string; name: string; defaultAmount: number }[];
}) {
  await prisma.$transaction([
    prisma.billingConfig.update({
      where: { id: input.configId },
      data: {
        useTiers: input.useTiers,
        flatUnitPrice: input.flatUnitPrice,
        defaultWaterPrice: input.defaultWaterPrice,
      },
    }),
    ...input.tiers.map((t) =>
      prisma.electricTier.update({ where: { id: t.id }, data: { unitPrice: t.unitPrice } })
    ),
    ...input.feeTypes.map((ft) =>
      prisma.feeType.update({ where: { id: ft.id }, data: { name: ft.name, defaultAmount: ft.defaultAmount } })
    ),
  ]);
  revalidatePath("/config");
  revalidatePath("/readings");
  revalidatePath("/invoice");
}
