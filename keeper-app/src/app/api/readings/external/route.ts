// Endpoint cho bên thứ 3 (đồng hồ IoT, phần mềm khác) gửi chỉ số điện nước.
// Bảo mật bằng API key riêng (bảng ApiKey), không dùng chung với session người dùng thường.
//
// Body JSON: { propertyName, roomName, month, year, electricNew, waterNew }
// (hoặc dùng roomId thay cho propertyName+roomName nếu hệ thống gửi đã biết sẵn id nội bộ)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateConsumption } from "@/lib/billing";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Thiếu header x-api-key" }, { status: 401 });
  }
  const keyRecord = await prisma.apiKey.findUnique({ where: { key: apiKey } });
  if (!keyRecord || !keyRecord.active) {
    return NextResponse.json({ error: "API key không hợp lệ hoặc đã bị vô hiệu hóa" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body không phải JSON hợp lệ" }, { status: 400 });
  }
  const { roomId, propertyName, roomName, month, year, electricNew, waterNew } = body;

  if (!month || !year || electricNew == null || waterNew == null) {
    return NextResponse.json(
      { error: "Thiếu trường bắt buộc: month, year, electricNew, waterNew" },
      { status: 400 }
    );
  }
  if (!roomId && !(propertyName && roomName)) {
    return NextResponse.json(
      { error: "Phải gửi propertyName và roomName (hoặc roomId nếu đã biết sẵn)" },
      { status: 400 }
    );
  }

  const room = roomId
    ? await prisma.room.findUnique({ where: { id: roomId } })
    : await prisma.room.findFirst({
        where: {
          name: { equals: roomName, mode: "insensitive" },
          property: { name: { equals: propertyName, mode: "insensitive" } },
        },
      });

  if (!room) {
    return NextResponse.json(
      {
        error: roomId
          ? `Không tìm thấy phòng với id: ${roomId}`
          : `Không tìm thấy phòng "${roomName}" thuộc nhà "${propertyName}"`,
      },
      { status: 404 }
    );
  }

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevReading = await prisma.meterReading.findUnique({
    where: { roomId_month_year: { roomId: room.id, month: prevMonth, year: prevYear } },
  });
  const electricOld = prevReading?.electricNew ?? 0;
  const waterOld = prevReading?.waterNew ?? 0;

  try {
    calculateConsumption(electricOld, electricNew);
    calculateConsumption(waterOld, waterNew);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dữ liệu không hợp lệ";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const activeConfig = await prisma.billingConfig.findFirst({ where: { isActive: true } });

  const reading = await prisma.meterReading.upsert({
    where: { roomId_month_year: { roomId: room.id, month, year } },
    update: {
      electricNew,
      waterNew,
      source: "API",
    },
    create: {
      roomId: room.id,
      month,
      year,
      electricOld,
      electricNew,
      waterOld,
      waterNew,
      waterUnitPrice: activeConfig?.defaultWaterPrice ?? 0,
      billingConfigId: activeConfig?.id,
      source: "API",
    },
  });

  await prisma.apiKey.update({
    where: { id: keyRecord.id },
    data: { lastUsedAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    reading: {
      id: reading.id,
      roomId: reading.roomId,
      month: reading.month,
      year: reading.year,
      electricConsumed: electricNew - electricOld,
      waterConsumed: waterNew - waterOld,
    },
  });
}
