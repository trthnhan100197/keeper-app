import { getRoomOptions, getReadingForRoomPeriod, getActiveBillingConfig } from "@/lib/data";
import { currentPeriod, vnd } from "@/lib/nav";
import { calculateElectricityBill, calculateWaterBill } from "@/lib/billing";
import { TieredToggle } from "@/components/tiered-toggle";

export default async function InvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const { month, year, text: activeMonthText } = currentPeriod(sp);
  const options = await getRoomOptions();
  const currentRoomId = sp.room && options.some((o) => o.id === sp.room) ? sp.room : options[0]?.id;
  const currentRoom = options.find((o) => o.id === currentRoomId);

  if (!currentRoomId || !currentRoom) {
    return <div style={{ font: "500 13px -apple-system,sans-serif", color: "var(--sub)" }}>Chưa có phòng nào.</div>;
  }

  const [reading, config] = await Promise.all([
    getReadingForRoomPeriod(currentRoomId, month, year),
    getActiveBillingConfig(),
  ]);

  if (!config) {
    return (
      <div style={{ font: "500 13px -apple-system,sans-serif", color: "var(--sub)" }}>
        Chưa có cấu hình giá điện nước. Vào màn Cấu hình để thiết lập.
      </div>
    );
  }

  if (!reading) {
    return (
      <div>
        <div style={{ font: "700 20px/1.2 -apple-system,sans-serif", marginBottom: 6 }}>
          Hóa đơn — {currentRoom.no}
        </div>
        <div style={{ font: "500 13px -apple-system,sans-serif", color: "var(--sub)" }}>
          Chưa có chỉ số điện nước cho {activeMonthText}. Vào màn Chỉ số để nhập trước.
        </div>
      </div>
    );
  }

  const elecConsumption = Math.max(0, reading.electricNew - reading.electricOld);
  const waterConsumption = Math.max(0, reading.waterNew - reading.waterOld);

  const elecResult = calculateElectricityBill(elecConsumption, {
    useTiers: config.useTiers,
    flatUnitPrice: config.flatUnitPrice != null ? Number(config.flatUnitPrice) : null,
    vatPercent: Number(config.vatPercent),
    tiers: config.tiers.map((t) => ({
      tierOrder: t.tierOrder,
      fromKwh: t.fromKwh,
      toKwh: t.toKwh,
      unitPrice: Number(t.unitPrice),
    })),
  });
  const waterTotal = calculateWaterBill(waterConsumption, Number(reading.waterUnitPrice));
  const grandTotal = elecResult.total + waterTotal;

  return (
    <div>
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
        <div style={{ font: "700 20px/1.2 -apple-system,sans-serif" }}>Hóa đơn — {currentRoom.no}</div>
        <div style={{ font: "600 12px ui-monospace,monospace", color: "var(--sub)" }}>{activeMonthText}</div>
      </div>

      <TieredToggle configId={config.id} useTiers={config.useTiers} />

      {config.useTiers ? (
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
            <div style={{ width: 90, font: "600 12px ui-monospace,monospace" }}>{vnd(Number(reading.waterUnitPrice))}</div>
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
            <div style={{ width: 90, font: "600 12px ui-monospace,monospace" }}>{vnd(Number(reading.waterUnitPrice))}</div>
            <div style={{ width: 110, textAlign: "right", font: "700 12.5px ui-monospace,monospace" }}>{vnd(waterTotal)}</div>
          </div>
        </div>
      )}

      <div
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
    </div>
  );
}
