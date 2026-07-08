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

export async function saveReading(input: {
  roomId: string;
  month: number;
  year: number;
  electricOld: number;
  electricNew: number;
  waterOld: number;
  waterNew: number;
  waterUnitPrice: number;
}) {
  const activeConfig = await prisma.billingConfig.findFirst({ where: { isActive: true } });
  await prisma.meterReading.upsert({
    where: { roomId_month_year: { roomId: input.roomId, month: input.month, year: input.year } },
    create: { ...input, billingConfigId: activeConfig?.id },
    update: {
      electricOld: input.electricOld,
      electricNew: input.electricNew,
      waterOld: input.waterOld,
      waterNew: input.waterNew,
      waterUnitPrice: input.waterUnitPrice,
    },
  });
  revalidatePath("/readings");
  revalidatePath("/invoice");
  revalidatePath("/dashboard");
}

export async function toggleUseTiers(configId: string, useTiers: boolean) {
  await prisma.billingConfig.update({ where: { id: configId }, data: { useTiers } });
  revalidatePath("/invoice");
  revalidatePath("/config");
}

export async function saveConfig(input: {
  configId: string;
  useTiers: boolean;
  flatUnitPrice: number;
  defaultWaterPrice: number;
  tiers: { id: string; unitPrice: number }[];
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
  ]);
  revalidatePath("/config");
  revalidatePath("/invoice");
}
