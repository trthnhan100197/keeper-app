import Link from "next/link";
import { getRoomOptions, getReadingForRoomPeriod, getActiveBillingConfig } from "@/lib/data";
import { currentPeriod, vnd } from "@/lib/nav";
import { calculateElectricityBill, calculateWaterBill } from "@/lib/billing";
import { RoomSelect } from "@/components/room-select";
import { InvoiceActions } from "@/components/invoice-actions";

export default async function InvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; room?: string; month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const { month, year, text: activeMonthText } = currentPeriod(sp);
  const options = await getRoomOptions();

  if (options.length === 0) {
    return <div style={{ font: "500 13px -apple-system,sans-serif", color: "var(--sub)" }}>Chưa có phòng nào.</div>;
  }

  const propertyList = Array.from(new Map(options.map((o) => [o.propertyId, o.propertyName])).entries()).map(
    ([id, name]) => ({ id, name })
  );
  const currentPropertyId = propertyList.some((p) => p.id === sp.property) ? (sp.property as string) : propertyList[0].id;
  const roomsInProperty = options.filter((o) => o.propertyId === currentPropertyId);
  const currentRoomId = roomsInProperty.some((o) => o.id === sp.room) ? (sp.room as string) : roomsInProperty[0].id;
  const currentRoom = roomsInProperty.find((o) => o.id === currentRoomId)!;

  const qs = new URLSearchParams();
  if (sp.month) qs.set("month", sp.month);
  if (sp.year) qs.set("year", sp.year);

  const [reading, config] = await Promise.all([
    getReadingForRoomPeriod(currentRoomId, month, year),
    getActiveBillingConfig(),
  ]);

  return (
    <div>
      <div className="flex print:hidden" style={{ gap: 8, margin: "0 0 14px" }}>
        {propertyList.map((p) => {
          const active = p.id === currentPropertyId;
          const params = new URLSearchParams(qs);
          params.set("property", p.id);
          return (
            <Link
              key={p.id}
              href={`/invoice?${params.toString()}`}
              style={
                active
                  ? {
                      padding: "7px 14px",
                      borderRadius: 8,
                      background: "var(--accent)",
                      color: "var(--accent-c)",
                      font: "600 12px -apple-system,sans-serif",
                      cursor: "pointer",
                    }
                  : {
                      padding: "7px 14px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      font: "500 12px -apple-system,sans-serif",
                      color: "var(--sub)",
                      cursor: "pointer",
                    }
              }
            >
              {p.name}
            </Link>
          );
        })}
      </div>
      <div className="print:hidden" style={{ marginBottom: 14 }}>
        <RoomSelect options={roomsInProperty} current={currentRoomId} />
      </div>

      {!config ? (
        <div style={{ font: "500 13px -apple-system,sans-serif", color: "var(--sub)" }}>
          Chưa có cấu hình giá điện nước. Vào màn Cấu hình để thiết lập.
        </div>
      ) : !reading ? (
        <div>
          <div style={{ font: "700 20px/1.2 -apple-system,sans-serif", marginBottom: 6 }}>
            Hóa đơn — {currentRoom.no}
          </div>
          <div style={{ font: "500 13px -apple-system,sans-serif", color: "var(--sub)" }}>
            Chưa có chỉ số điện nước cho {activeMonthText}. Vào màn Chỉ số để nhập trước.
          </div>
        </div>
      ) : (
        <InvoiceBody
          room={currentRoom}
          propertyName={propertyList.find((p) => p.id === currentPropertyId)!.name}
          activeMonthText={activeMonthText}
          reading={reading}
          config={config}
        />
      )}
    </div>
  );
}

function InvoiceBody({
  room,
  propertyName,
  activeMonthText,
  reading,
  config,
}: {
  room: { id: string; no: string; tenantName: string | null; tenantPhone: string | null };
  propertyName: string;
  activeMonthText: string;
  reading: { electricOld: number; electricNew: number; waterOld: number; waterNew: number; useTiers: boolean };
  config: NonNullable<Awaited<ReturnType<typeof getActiveBillingConfig>>>;
}) {
  const elecConsumption = Math.max(0, reading.electricNew - reading.electricOld);
  const waterConsumption = Math.max(0, reading.waterNew - reading.waterOld);

  const elecResult = calculateElectricityBill(elecConsumption, {
    useTiers: reading.useTiers,
    flatUnitPrice: config.flatUnitPrice != null ? Number(config.flatUnitPrice) : null,
    vatPercent: Number(config.vatPercent),
    tiers: config.tiers.map((t) => ({
      tierOrder: t.tierOrder,
      fromKwh: t.fromKwh,
      toKwh: t.toKwh,
      unitPrice: Number(t.unitPrice),
    })),
  });
  const waterUnitPrice = Number(config.defaultWaterPrice);
  const waterTotal = calculateWaterBill(waterConsumption, waterUnitPrice);
  const grandTotal = elecResult.total + waterTotal;

  return (
    <div>
      <div className="hidden print:block" style={{ marginBottom: 14 }}>
        <div style={{ font: "700 16px -apple-system,sans-serif" }}>{propertyName}</div>
        {room.tenantName && <div style={{ font: "500 12px -apple-system,sans-serif", marginTop: 2 }}>Người thuê: {room.tenantName}</div>}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ font: "700 20px/1.2 -apple-system,sans-serif" }}>Hóa đơn — {room.no}</div>
        <div style={{ font: "600 12px ui-monospace,monospace", color: "var(--sub)" }}>{activeMonthText}</div>
      </div>

      <div
        className="print:hidden"
        style={{
          padding: "12px 14px",
          border: "1px solid var(--border)",
          borderRadius: 10,
          marginBottom: 14,
        }}
      >
        <div style={{ font: "600 12.5px -apple-system,sans-serif" }}>Tính theo bậc thang nhà nước</div>
        <div style={{ font: "400 11px -apple-system,sans-serif", color: "var(--sub)", marginTop: 2 }}>
          {reading.useTiers
            ? "Có áp dụng — tính theo biểu giá bậc thang EVN (chốt lúc nhập chỉ số)"
            : "Không áp dụng — dùng đơn giá cố định (chốt lúc nhập chỉ số)"}
        </div>
      </div>

      {reading.useTiers ? (
        <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              padding: "9px 14px",
              background: "var(--surface)",
              font: "600 10.5px -apple-system,sans-serif",
              color: "var(--sub)",
            }}
          >
            <div style={{ flex: 1 }}>Bậc</div>
            <div style={{ width: 100 }}>Sản lượng</div>
            <div style={{ width: 90 }}>Đơn giá</div>
            <div style={{ width: 110, textAlign: "right" }}>Thành tiền</div>
          </div>
          {elecResult.breakdown.map((row) => (
            <div
              key={row.tierOrder}
              style={{ display: "flex", alignItems: "center", padding: "9px 14px", borderTop: "1px solid var(--border)", font: "500 12px -apple-system,sans-serif" }}
            >
              <div style={{ flex: 1 }}>Bậc {row.tierOrder}</div>
              <div style={{ width: 100, font: "600 12px ui-monospace,monospace" }}>{row.kwhUsed} kWh</div>
              <div style={{ width: 90, font: "600 12px ui-monospace,monospace" }}>{vnd(row.unitPrice)}</div>
              <div style={{ width: 110, textAlign: "right", font: "600 12px ui-monospace,monospace" }}>{vnd(row.amount)}</div>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", padding: "9px 14px", borderTop: "1px solid var(--border)", font: "700 12px -apple-system,sans-serif" }}>
            <div style={{ flex: 1 }}>Điện · {elecConsumption} kWh</div>
            <div style={{ width: 100 }} />
            <div style={{ width: 90 }} />
            <div style={{ width: 110, textAlign: "right", font: "700 12px ui-monospace,monospace" }}>{vnd(elecResult.total)}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", padding: "9px 14px", borderTop: "1px solid var(--border)", font: "600 12px -apple-system,sans-serif" }}>
            <div style={{ flex: 1 }}>Nước · {waterConsumption} m³</div>
            <div style={{ width: 100 }} />
            <div style={{ width: 90, font: "600 12px ui-monospace,monospace" }}>{vnd(waterUnitPrice)}</div>
            <div style={{ width: 110, textAlign: "right", font: "600 12px ui-monospace,monospace" }}>{vnd(waterTotal)}</div>
          </div>
        </div>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              padding: "9px 14px",
              background: "var(--surface)",
              font: "600 10.5px -apple-system,sans-serif",
              color: "var(--sub)",
            }}
          >
            <div style={{ flex: 1 }}>Khoản mục</div>
            <div style={{ width: 120 }}>Sản lượng</div>
            <div style={{ width: 90 }}>Đơn giá</div>
            <div style={{ width: 110, textAlign: "right" }}>Thành tiền</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", padding: "12px 14px", borderTop: "1px solid var(--border)", font: "600 12.5px -apple-system,sans-serif" }}>
            <div style={{ flex: 1 }}>Điện</div>
            <div style={{ width: 120, font: "600 12px ui-monospace,monospace" }}>{elecConsumption} kWh</div>
            <div style={{ width: 90, font: "600 12px ui-monospace,monospace" }}>{vnd(Number(config.flatUnitPrice ?? 0))}</div>
            <div style={{ width: 110, textAlign: "right", font: "700 12.5px ui-monospace,monospace" }}>{vnd(elecResult.total)}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", padding: "12px 14px", borderTop: "1px solid var(--border)", font: "600 12.5px -apple-system,sans-serif" }}>
            <div style={{ flex: 1 }}>Nước</div>
            <div style={{ width: 120, font: "600 12px ui-monospace,monospace" }}>{waterConsumption} m³</div>
            <div style={{ width: 90, font: "600 12px ui-monospace,monospace" }}>{vnd(waterUnitPrice)}</div>
            <div style={{ width: 110, textAlign: "right", font: "700 12.5px ui-monospace,monospace" }}>{vnd(waterTotal)}</div>
          </div>
        </div>
      )}

      <div
        className="invoice-total"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 16px",
          borderRadius: 10,
          background: "var(--accent)",
          color: "var(--accent-c)",
        }}
      >
        <div style={{ font: "600 13px -apple-system,sans-serif" }}>Tổng cộng</div>
        <div style={{ font: "700 18px ui-monospace,monospace" }}>{vnd(grandTotal)}</div>
      </div>

      <InvoiceActions
        roomNo={room.no}
        propertyName={propertyName}
        activeMonthText={activeMonthText}
        tenantPhone={room.tenantPhone}
        elecConsumption={elecConsumption}
        waterConsumption={waterConsumption}
        grandTotalText={vnd(grandTotal)}
      />
    </div>
  );
}
