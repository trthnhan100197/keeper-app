"use client";

import { useState, useTransition } from "react";
import { saveReading } from "@/app/(app)/actions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "9px 12px",
  font: "600 14px ui-monospace,monospace",
  background: "var(--bg)",
  color: "var(--text)",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: 16,
};

export function ReadingsForm({
  roomId,
  month,
  year,
  initialElecOld,
  initialElecNew,
  initialWaterOld,
  initialWaterNew,
  waterUnitPrice,
  initialUseTiers,
}: {
  roomId: string;
  month: number;
  year: number;
  initialElecOld: number;
  initialElecNew: number;
  initialWaterOld: number;
  initialWaterNew: number;
  waterUnitPrice: number;
  initialUseTiers: boolean;
}) {
  const [oldElec, setOldElec] = useState(initialElecOld);
  const [newElec, setNewElec] = useState(initialElecNew);
  const [oldWater, setOldWater] = useState(initialWaterOld);
  const [newWater, setNewWater] = useState(initialWaterNew);
  const [useTiers, setUseTiers] = useState(initialUseTiers);
  const [savedFlash, setSavedFlash] = useState(false);
  const [isPending, startTransition] = useTransition();

  const elecConsumption = Math.max(0, newElec - oldElec);
  const waterConsumption = Math.max(0, newWater - oldWater);

  function onSave() {
    startTransition(async () => {
      await saveReading({
        roomId,
        month,
        year,
        electricOld: oldElec,
        electricNew: newElec,
        waterOld: oldWater,
        waterNew: newWater,
        waterUnitPrice,
        useTiers,
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1400);
    });
  }

  const trackStyle: React.CSSProperties = {
    width: 38,
    height: 22,
    borderRadius: 11,
    position: "relative",
    cursor: "pointer",
    ...(useTiers
      ? { background: "var(--accent)" }
      : { background: "var(--surface2)", border: "1px solid var(--border)" }),
  };
  const thumbStyle: React.CSSProperties = {
    width: 18,
    height: 18,
    borderRadius: "50%",
    position: "absolute",
    top: 1,
    ...(useTiers ? { right: 2, background: "var(--bg)" } : { left: 2, background: "var(--sub)" }),
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          border: "1px solid var(--border)",
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ font: "600 12.5px -apple-system,sans-serif" }}>Tính theo bậc thang nhà nước</div>
          <div style={{ font: "400 11px -apple-system,sans-serif", color: "var(--sub)", marginTop: 2 }}>
            {useTiers ? "Đang bật — tính theo biểu giá bậc thang EVN" : "Đang tắt — áp dụng đơn giá bình quân"}
          </div>
        </div>
        <div onClick={() => setUseTiers((v) => !v)} style={trackStyle}>
          <div style={thumbStyle} />
        </div>
      </div>

      <div className="grid grid-cols-1 min-[760px]:grid-cols-2" style={{ gap: 20 }}>
        <div style={cardStyle}>
          <div style={{ font: "600 12.5px -apple-system,sans-serif", marginBottom: 12 }}>Điện (kWh)</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <Field label="Số cũ" value={oldElec} onChange={setOldElec} />
            <Field label="Số mới" value={newElec} onChange={setNewElec} />
          </div>
          <ConsumptionRow text={`${elecConsumption} kWh`} />
        </div>
        <div style={cardStyle}>
          <div style={{ font: "600 12.5px -apple-system,sans-serif", marginBottom: 12 }}>Nước (m³)</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <Field label="Số cũ" value={oldWater} onChange={setOldWater} />
            <Field label="Số mới" value={newWater} onChange={setNewWater} />
          </div>
          <ConsumptionRow text={`${waterConsumption} m³`} />
        </div>
      </div>
      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
        <div
          onClick={onSave}
          style={{
            padding: "11px 22px",
            borderRadius: 8,
            background: "var(--accent)",
            color: "var(--accent-c)",
            font: "600 13px -apple-system,sans-serif",
            cursor: "pointer",
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {savedFlash ? "Đã lưu ✓" : "Lưu chỉ số"}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ font: "500 11px -apple-system,sans-serif", color: "var(--sub)", marginBottom: 6 }}>{label}</div>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} style={inputStyle} />
    </div>
  );
}

function ConsumptionRow({ text }: { text: string }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 8,
        padding: "10px 12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ font: "500 11.5px -apple-system,sans-serif", color: "var(--sub)" }}>Tiêu thụ</span>
      <span style={{ font: "700 15px ui-monospace,monospace" }}>{text}</span>
    </div>
  );
}
