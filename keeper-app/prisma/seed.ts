import "dotenv/config";
import type { RoomStatus } from "@prisma/client";
import { SEED_TIERS_2026, DEFAULT_FLAT_RATE_FOR_RENTAL_ROOM } from "../src/lib/billing";
import { prisma } from "../src/lib/prisma";

const SAMPLE_MONTH = 7;
const SAMPLE_YEAR = 2026;
const WATER_UNIT_PRICE = 15000;

const BUILDINGS: {
  name: string;
  address: string;
  rooms: { no: string; price: number; status: RoomStatus; missingReading: boolean }[];
}[] = [
  {
    name: "Nhà A",
    address: "Nguyễn Trãi",
    rooms: [
      { no: "P101", price: 2500000, status: "OCCUPIED", missingReading: false },
      { no: "P102", price: 2500000, status: "VACANT", missingReading: false },
      { no: "P103", price: 2800000, status: "OCCUPIED", missingReading: false },
      { no: "P104", price: 2800000, status: "OCCUPIED", missingReading: true },
      { no: "P105", price: 3200000, status: "OCCUPIED", missingReading: false },
      { no: "P106", price: 3200000, status: "VACANT", missingReading: false },
    ],
  },
  {
    name: "Nhà B",
    address: "Lê Văn Sỹ",
    rooms: [
      { no: "P201", price: 2300000, status: "OCCUPIED", missingReading: false },
      { no: "P202", price: 2300000, status: "OCCUPIED", missingReading: false },
      { no: "P203", price: 2600000, status: "OCCUPIED", missingReading: true },
      { no: "P204", price: 2600000, status: "VACANT", missingReading: false },
      { no: "P205", price: 3000000, status: "OCCUPIED", missingReading: false },
      { no: "P206", price: 3000000, status: "OCCUPIED", missingReading: false },
    ],
  },
  {
    name: "Nhà C",
    address: "Phạm Văn Đồng",
    rooms: [
      { no: "P301", price: 2400000, status: "OCCUPIED", missingReading: false },
      { no: "P302", price: 2400000, status: "VACANT", missingReading: false },
      { no: "P303", price: 2700000, status: "OCCUPIED", missingReading: false },
      { no: "P304", price: 2700000, status: "OCCUPIED", missingReading: false },
      { no: "P305", price: 3100000, status: "OCCUPIED", missingReading: true },
      { no: "P306", price: 3100000, status: "OCCUPIED", missingReading: false },
    ],
  },
];

async function main() {
  const existing = await prisma.property.count();
  if (existing > 0) {
    console.log("Database already has data — skipping seed.");
    return;
  }

  const config = await prisma.billingConfig.create({
    data: {
      name: "Bậc thang 2026 (QĐ 14/2025)",
      useTiers: true,
      flatUnitPrice: DEFAULT_FLAT_RATE_FOR_RENTAL_ROOM,
      defaultWaterPrice: WATER_UNIT_PRICE,
      vatPercent: 8.0,
      isActive: true,
      tiers: {
        create: SEED_TIERS_2026.map((t) => ({
          tierOrder: t.tierOrder,
          fromKwh: t.fromKwh,
          toKwh: t.toKwh,
          unitPrice: t.unitPrice,
        })),
      },
    },
  });

  let roomIndex = 0;
  for (const building of BUILDINGS) {
    const property = await prisma.property.create({
      data: { name: building.name, address: building.address },
    });

    for (const room of building.rooms) {
      const createdRoom = await prisma.room.create({
        data: {
          propertyId: property.id,
          name: room.no,
          monthlyRent: room.price,
          status: room.status,
        },
      });

      if (room.status === "OCCUPIED" && !room.missingReading) {
        // P101 matches the original prototype's default reading exactly, for easy test comparison.
        const isP101 = room.no === "P101";
        const electricOld = isP101 ? 1240 : 1000 + roomIndex * 30;
        const electricNew = isP101 ? 1365 : electricOld + 80 + roomIndex * 5;
        const waterOld = isP101 ? 88 : 50 + roomIndex * 3;
        const waterNew = isP101 ? 95 : waterOld + 10 + roomIndex;

        await prisma.meterReading.create({
          data: {
            roomId: createdRoom.id,
            month: SAMPLE_MONTH,
            year: SAMPLE_YEAR,
            electricOld,
            electricNew,
            waterOld,
            waterNew,
            waterUnitPrice: WATER_UNIT_PRICE,
            billingConfigId: config.id,
          },
        });
      }
      roomIndex++;
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
