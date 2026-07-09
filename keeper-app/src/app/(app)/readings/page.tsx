import { getRoomOptions, getReadingForRoomPeriod, getMostRecentReading, getActiveBillingConfig, getFeeTypes } from "@/lib/data";
import { currentPeriod } from "@/lib/nav";
import { RoomSelect } from "@/components/room-select";
import { ReadingsForm } from "@/components/readings-form";

export default async function ReadingsPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const { month, year, text: activeMonthText } = currentPeriod(sp);
  const options = await getRoomOptions();
  const currentRoomId = sp.room && options.some((o) => o.id === sp.room) ? sp.room : options[0]?.id;

  if (!currentRoomId) {
    return <div style={{ font: "500 13px -apple-system,sans-serif", color: "var(--sub)" }}>Chưa có phòng nào.</div>;
  }

  const [reading, mostRecent, activeConfig, feeTypes] = await Promise.all([
    getReadingForRoomPeriod(currentRoomId, month, year),
    getMostRecentReading(currentRoomId),
    getActiveBillingConfig(),
    getFeeTypes(),
  ]);

  const initialElecOld = reading?.electricOld ?? mostRecent?.electricNew ?? 0;
  const initialElecNew = reading?.electricNew ?? initialElecOld;
  const initialWaterOld = reading?.waterOld ?? mostRecent?.waterNew ?? 0;
  const initialWaterNew = reading?.waterNew ?? initialWaterOld;
  const waterUnitPrice = reading ? Number(reading.waterUnitPrice) : Number(activeConfig?.defaultWaterPrice ?? 0);
  const initialUseTiers = reading?.useTiers ?? mostRecent?.useTiers ?? activeConfig?.useTiers ?? true;

  const existingFees = new Map(reading?.fees.map((f) => [f.feeTypeId, Number(f.amount)]) ?? []);
  const feeInputs = feeTypes.map((ft) => ({
    feeTypeId: ft.id,
    name: ft.name,
    amount: existingFees.get(ft.id) ?? (reading ? 0 : Number(ft.defaultAmount)),
  }));

  return (
    <div>
      <div style={{ font: "700 20px/1.2 -apple-system,sans-serif", marginBottom: 14 }}>Nhập chỉ số</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <RoomSelect options={options} current={currentRoomId} />
        <div style={{ padding: "9px 14px", border: "1px solid var(--border)", borderRadius: 8, font: "600 12.5px -apple-system,sans-serif", color: "var(--sub)" }}>
          {activeMonthText}
        </div>
      </div>
      <ReadingsForm
        key={`${currentRoomId}-${month}-${year}`}
        roomId={currentRoomId}
        month={month}
        year={year}
        initialElecOld={initialElecOld}
        initialElecNew={initialElecNew}
        initialWaterOld={initialWaterOld}
        initialWaterNew={initialWaterNew}
        waterUnitPrice={waterUnitPrice}
        initialUseTiers={initialUseTiers}
        feeInputs={feeInputs}
      />
    </div>
  );
}
