import { getRoomOptions, getReadingForRoomPeriod, getMostRecentReading, getActiveBillingConfig, getFeeTypes } from "@/lib/data";
import { currentPeriod } from "@/lib/nav";
import { RoomSelect } from "@/components/room-select";
import { ReadingsForm } from "@/components/readings-form";
import { PhotoReadingCapture } from "@/components/photo-reading-capture";
import { VoiceReadingCapture } from "@/components/voice-reading-capture";
import { ReadingsTabs } from "@/components/readings-tabs";

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
    amount: existingFees.get(ft.id) ?? Number(ft.defaultAmount),
  }));

  const roomOptions = options.map((o) => ({ id: o.id, no: o.no, propertyName: o.propertyName }));
  const periodBadge = (
    <div
      style={{
        display: "inline-block",
        padding: "9px 14px",
        border: "1px solid var(--border)",
        borderRadius: 8,
        font: "600 12.5px -apple-system,sans-serif",
        color: "var(--sub)",
      }}
    >
      {activeMonthText}
    </div>
  );

  return (
    <div>
      <div style={{ font: "700 20px/1.2 -apple-system,sans-serif", marginBottom: 14 }}>Nhập chỉ số</div>
      <ReadingsTabs
        singleTab={
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <RoomSelect options={options} current={currentRoomId} />
              {periodBadge}
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
        }
        batchTab={
          <div>
            <div style={{ marginBottom: 16 }}>{periodBadge}</div>
            <div className="flex flex-col min-[900px]:flex-row" style={{ gap: 16, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
                <PhotoReadingCapture rooms={roomOptions} month={month} year={year} />
              </div>
              <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
                <VoiceReadingCapture rooms={roomOptions} month={month} year={year} />
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
