import { prisma } from "./prisma";

export async function getPropertiesWithRooms() {
  return prisma.property.findMany({
    include: {
      rooms: {
        include: { tenants: { where: { active: true }, take: 1 } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getReadingsForPeriod(month: number, year: number) {
  return prisma.meterReading.findMany({ where: { month, year } });
}

export async function getRoomOptions() {
  const properties = await getPropertiesWithRooms();
  return properties.flatMap((p) =>
    p.rooms.map((r) => ({
      id: r.id,
      no: r.name,
      propertyId: p.id,
      propertyName: p.name,
      monthlyRent: Number(r.monthlyRent),
      tenantName: r.tenants[0]?.name ?? null,
      tenantPhone: r.tenants[0]?.phone ?? null,
    }))
  );
}

export async function getReadingForRoomPeriod(roomId: string, month: number, year: number) {
  return prisma.meterReading.findUnique({
    where: { roomId_month_year: { roomId, month, year } },
    include: { fees: { include: { feeType: true } } },
  });
}

export async function getFeeTypes() {
  return prisma.feeType.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getMostRecentReading(roomId: string) {
  return prisma.meterReading.findFirst({
    where: { roomId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

export async function getApiKeys() {
  return prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getActiveBillingConfig() {
  return prisma.billingConfig.findFirst({
    where: { isActive: true },
    include: { tiers: { orderBy: { tierOrder: "asc" } } },
  });
}

export async function getDashboardData(month: number, year: number) {
  const properties = await getPropertiesWithRooms();
  const readings = await getReadingsForPeriod(month, year);
  const roomIdsWithReading = new Set(readings.map((r) => r.roomId));

  const allRooms = properties.flatMap((p) => p.rooms);
  const totalRooms = allRooms.length;
  const occupiedRooms = allRooms.filter((r) => r.status === "OCCUPIED").length;
  const vacantRooms = totalRooms - occupiedRooms;
  const revenue = allRooms
    .filter((r) => r.status === "OCCUPIED")
    .reduce((sum, r) => sum + Number(r.monthlyRent), 0);

  const missingRooms = allRooms.filter(
    (r) => r.status === "OCCUPIED" && !roomIdsWithReading.has(r.id)
  );

  const buildingCards = properties.map((p) => {
    const occ = p.rooms.filter((r) => r.status === "OCCUPIED").length;
    const missing = p.rooms.filter(
      (r) => r.status === "OCCUPIED" && !roomIdsWithReading.has(r.id)
    ).length;
    return {
      id: p.id,
      name: p.name,
      roomCount: p.rooms.length,
      occupiedText: `${occ}/${p.rooms.length} đang thuê`,
      missing: missing > 0,
      missingText: `${missing} phòng chưa nhập chỉ số`,
    };
  });

  const missingListText = missingRooms
    .map((r) => {
      const property = properties.find((p) => p.rooms.some((room) => room.id === r.id));
      return `${r.name} · ${property?.name ?? ""}`;
    })
    .join(" · ");

  return {
    totalRooms,
    occupiedRooms,
    vacantRooms,
    revenueText: (revenue / 1_000_000).toFixed(1).replace(".", ",") + "tr",
    hasMissing: missingRooms.length > 0,
    missingCount: missingRooms.length,
    missingListText,
    buildingCards,
  };
}
