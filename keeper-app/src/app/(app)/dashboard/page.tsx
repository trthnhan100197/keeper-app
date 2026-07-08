import { getDashboardData } from "@/lib/data";
import { currentPeriod } from "@/lib/nav";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { month, year, text: activeMonthText } = currentPeriod(await searchParams);
  const data = await getDashboardData(month, year);

  return (
    <div>
      <div style={{ font: "700 20px/1.2 -apple-system,sans-serif", marginBottom: 4 }}>Tổng quan</div>
      <div style={{ font: "400 13px -apple-system,sans-serif", color: "var(--sub)", marginBottom: 16 }}>
        {activeMonthText}
      </div>

      {data.hasMissing && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            border: "1px dashed var(--sub)",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "var(--accent)",
              color: "var(--accent-c)",
              flex: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: "700 11px ui-monospace,monospace",
            }}
          >
            !
          </div>
          <div>
            <div style={{ font: "600 13px -apple-system,sans-serif" }}>
              {data.missingCount} phòng chưa nhập chỉ số tháng này
            </div>
            <div style={{ font: "500 11.5px -apple-system,sans-serif", color: "var(--sub)", marginTop: 3 }}>
              {data.missingListText}
            </div>
          </div>
        </div>
      )}

      <div
        className="grid grid-cols-2 min-[760px]:grid-cols-4"
        style={{ gap: 12, marginBottom: 24 }}
      >
        <StatCard label="Tổng số phòng" value={data.totalRooms} />
        <StatCard label="Đang thuê" value={data.occupiedRooms} />
        <StatCard label="Phòng trống" value={data.vacantRooms} />
        <StatCard label="Doanh thu tháng" value={data.revenueText} valueSize={18} />
      </div>

      <div style={{ font: "600 12.5px -apple-system,sans-serif", color: "var(--sub)", marginBottom: 10 }}>
        Trụ sở / Nhà
      </div>
      <div className="grid grid-cols-1 min-[760px]:grid-cols-3" style={{ gap: 12 }}>
        {data.buildingCards.map((b) => (
          <div
            key={b.id}
            style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 14, position: "relative" }}
          >
            {b.missing && (
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  color: "var(--accent-c)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  font: "700 10px ui-monospace,monospace",
                }}
              >
                !
              </div>
            )}
            <div style={{ font: "600 13.5px -apple-system,sans-serif" }}>{b.name}</div>
            <div style={{ font: "400 11.5px -apple-system,sans-serif", color: "var(--sub)", margin: "3px 0 10px" }}>
              {b.roomCount} phòng
            </div>
            <div style={{ font: "600 12px ui-monospace,monospace" }}>{b.occupiedText}</div>
            {b.missing && (
              <div style={{ font: "500 11px -apple-system,sans-serif", color: "var(--sub)", marginTop: 4 }}>
                {b.missingText}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, valueSize = 22 }: { label: string; value: string | number; valueSize?: number }) {
  return (
    <div style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 10 }}>
      <div style={{ font: "500 11px -apple-system,sans-serif", color: "var(--sub)" }}>{label}</div>
      <div style={{ font: `700 ${valueSize}px/1.3 ui-monospace,monospace`, marginTop: 4 }}>{value}</div>
    </div>
  );
}
