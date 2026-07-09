"use client";

import { useState, useTransition } from "react";
import { saveConfig, addFeeType, deleteFeeType } from "@/app/(app)/actions";

type Tier = { id: string; tierOrder: number; fromKwh: number; toKwh: number | null; unitPrice: number };
type FeeType = { id: string; name: string; defaultAmount: number };

const tabActiveStyle: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 8,
  background: "var(--accent)",
  color: "var(--accent-c)",
  font: "600 12.5px -apple-system,sans-serif",
  cursor: "pointer",
};
const tabInactiveStyle: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  font: "500 12.5px -apple-system,sans-serif",
  color: "var(--sub)",
  cursor: "pointer",
};

export function ConfigForm({
  configId,
  useTiers,
  flatUnitPrice,
  defaultWaterPrice,
  tiers,
  feeTypes,
}: {
  configId: string;
  useTiers: boolean;
  flatUnitPrice: number;
  defaultWaterPrice: number;
  tiers: Tier[];
  feeTypes: FeeType[];
}) {
  const [configTab, setConfigTab] = useState<"tiered" | "flat">("tiered");
  const [applyScope, setApplyScope] = useState<"current" | "next">("current");
  const [tierPrices, setTierPrices] = useState(Object.fromEntries(tiers.map((t) => [t.id, t.unitPrice])));
  const [flatPrice, setFlatPrice] = useState(flatUnitPrice);
  const [waterPrice, setWaterPrice] = useState(defaultWaterPrice);
  const [feeTypeEdits, setFeeTypeEdits] = useState<Record<string, { name?: string; defaultAmount?: number }>>({});
  const [savedFlash, setSavedFlash] = useState(false);
  const [isPending, startTransition] = useTransition();

  function feeTypeValue(ft: FeeType) {
    return {
      name: feeTypeEdits[ft.id]?.name ?? ft.name,
      defaultAmount: feeTypeEdits[ft.id]?.defaultAmount ?? ft.defaultAmount,
    };
  }

  function onSave() {
    startTransition(async () => {
      await saveConfig({
        configId,
        useTiers,
        flatUnitPrice: flatPrice,
        defaultWaterPrice: waterPrice,
        tiers: tiers.map((t) => ({ id: t.id, unitPrice: tierPrices[t.id] })),
        feeTypes: feeTypes.map((ft) => ({ id: ft.id, ...feeTypeValue(ft) })),
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1400);
    });
  }

  return (
    <div>
      <div style={{ font: "700 20px/1.2 -apple-system,sans-serif", marginBottom: 2 }}>Cấu hình giá điện nước</div>
      <div style={{ font: "400 12px -apple-system,sans-serif", color: "var(--sub)", marginBottom: 16 }}>
        Áp dụng ngay cho chỉ số và hóa đơn
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ font: "500 12px -apple-system,sans-serif", color: "var(--sub)" }}>Áp dụng thay đổi giá cho</div>
        <select
          value={applyScope}
          onChange={(e) => setApplyScope(e.target.value as "current" | "next")}
          style={{
            padding: "7px 12px",
            border: "1px solid var(--border)",
            borderRadius: 8,
            font: "600 12px -apple-system,sans-serif",
            background: "var(--bg)",
            color: "var(--text)",
          }}
        >
          <option value="current">Tháng hiện tại</option>
          <option value="next">Từ tháng tiếp theo</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <div onClick={() => setConfigTab("tiered")} style={configTab === "tiered" ? tabActiveStyle : tabInactiveStyle}>
          Bậc thang
        </div>
        <div onClick={() => setConfigTab("flat")} style={configTab === "flat" ? tabActiveStyle : tabInactiveStyle}>
          Giá cố định
        </div>
      </div>

      {configTab === "tiered" ? (
        <div>
          <div style={{ font: "600 13px -apple-system,sans-serif", marginBottom: 2 }}>Bảng giá điện bậc thang</div>
          <div style={{ font: "400 11.5px -apple-system,sans-serif", color: "var(--sub)", marginBottom: 14 }}>
            Cập nhật khi EVN ban hành biểu giá mới
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                padding: "9px 14px",
                background: "var(--surface)",
                font: "600 10.5px -apple-system,sans-serif",
                color: "var(--sub)",
              }}
            >
              <div style={{ width: 60 }}>Bậc</div>
              <div style={{ flex: 1 }}>Từ (kWh)</div>
              <div style={{ flex: 1 }}>Đến (kWh)</div>
              <div style={{ width: 150 }}>Đơn giá (đ/kWh)</div>
            </div>
            {tiers.map((t) => (
              <div
                key={t.id}
                style={{ display: "flex", alignItems: "center", padding: "9px 14px", borderTop: "1px solid var(--border)", font: "600 12.5px -apple-system,sans-serif" }}
              >
                <div style={{ width: 60 }}>{t.tierOrder}</div>
                <div style={{ flex: 1, font: "600 12px ui-monospace,monospace" }}>{t.fromKwh}</div>
                <div style={{ flex: 1, font: "600 12px ui-monospace,monospace" }}>{t.toKwh ?? "—"}</div>
                <input
                  type="number"
                  value={tierPrices[t.id]}
                  onChange={(e) => setTierPrices((prev) => ({ ...prev, [t.id]: Number(e.target.value) || 0 }))}
                  style={{
                    width: 150,
                    border: "1px solid var(--border)",
                    borderRadius: 7,
                    padding: "6px 10px",
                    font: "600 12px ui-monospace,monospace",
                    background: "var(--bg)",
                    color: "var(--text)",
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ font: "500 12px -apple-system,sans-serif", color: "var(--sub)" }}>+ Thêm bậc</div>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ font: "600 13px -apple-system,sans-serif", marginBottom: 2 }}>
            Giá cố định (không theo bậc thang)
          </div>
          <div style={{ font: "400 11.5px -apple-system,sans-serif", color: "var(--sub)", marginBottom: 14 }}>
            Dùng khi tắt tính bậc thang trong hóa đơn
          </div>
          <div className="grid grid-cols-1 min-[760px]:grid-cols-2" style={{ gap: 20 }}>
            <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
              <div style={{ font: "500 11px -apple-system,sans-serif", color: "var(--sub)", marginBottom: 8 }}>
                Giá điện (đ/kWh)
              </div>
              <input
                type="number"
                value={flatPrice}
                onChange={(e) => setFlatPrice(Number(e.target.value) || 0)}
                style={{
                  width: "100%",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  font: "700 15px ui-monospace,monospace",
                  background: "var(--bg)",
                  color: "var(--text)",
                }}
              />
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
              <div style={{ font: "500 11px -apple-system,sans-serif", color: "var(--sub)", marginBottom: 8 }}>
                Giá nước (đ/m³)
              </div>
              <input
                type="number"
                value={waterPrice}
                onChange={(e) => setWaterPrice(Number(e.target.value) || 0)}
                style={{
                  width: "100%",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  font: "700 15px ui-monospace,monospace",
                  background: "var(--bg)",
                  color: "var(--text)",
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <div style={{ font: "600 13px -apple-system,sans-serif", marginBottom: 2 }}>Các khoản phí khác</div>
        <div style={{ font: "400 11.5px -apple-system,sans-serif", color: "var(--sub)", marginBottom: 14 }}>
          Phí quản lý, mạng, rác... tự định nghĩa — nhập số tiền cụ thể theo từng phòng ở màn Chỉ số
        </div>
        <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              padding: "9px 14px",
              background: "var(--surface)",
              font: "600 10.5px -apple-system,sans-serif",
              color: "var(--sub)",
            }}
          >
            <div style={{ flex: 1 }}>Tên khoản phí</div>
            <div style={{ width: 150 }}>Giá gợi ý (đ)</div>
            <div style={{ width: 28 }} />
          </div>
          {feeTypes.length === 0 && (
            <div style={{ padding: "12px 14px", font: "500 12px -apple-system,sans-serif", color: "var(--sub)" }}>
              Chưa có khoản phí nào.
            </div>
          )}
          {feeTypes.map((ft) => (
            <div
              key={ft.id}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderTop: "1px solid var(--border)" }}
            >
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={feeTypeValue(ft).name}
                  onChange={(e) =>
                    setFeeTypeEdits((prev) => ({ ...prev, [ft.id]: { ...prev[ft.id], name: e.target.value } }))
                  }
                  style={{
                    width: "100%",
                    border: "1px solid var(--border)",
                    borderRadius: 7,
                    padding: "7px 10px",
                    font: "600 12.5px -apple-system,sans-serif",
                    background: "var(--bg)",
                    color: "var(--text)",
                  }}
                />
              </div>
              <div style={{ width: 150 }}>
                <input
                  type="number"
                  value={feeTypeValue(ft).defaultAmount}
                  onChange={(e) =>
                    setFeeTypeEdits((prev) => ({
                      ...prev,
                      [ft.id]: { ...prev[ft.id], defaultAmount: Number(e.target.value) || 0 },
                    }))
                  }
                  style={{
                    width: "100%",
                    border: "1px solid var(--border)",
                    borderRadius: 7,
                    padding: "7px 10px",
                    font: "600 12px ui-monospace,monospace",
                    background: "var(--bg)",
                    color: "var(--text)",
                  }}
                />
              </div>
              <div
                onClick={() => startTransition(() => deleteFeeType(ft.id))}
                style={{
                  width: 28,
                  height: 28,
                  flex: "none",
                  borderRadius: 7,
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--sub)",
                  font: "600 15px -apple-system,sans-serif",
                }}
              >
                ×
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <div
            onClick={() => startTransition(() => addFeeType("Phí mới", 0))}
            style={{
              display: "inline-block",
              padding: "9px 16px",
              borderRadius: 8,
              border: "1px dashed var(--sub)",
              font: "500 12px -apple-system,sans-serif",
              color: "var(--sub)",
              cursor: "pointer",
            }}
          >
            + Thêm loại phí
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
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
          {savedFlash ? "Đã lưu ✓" : "Lưu thay đổi"}
        </div>
      </div>
    </div>
  );
}
