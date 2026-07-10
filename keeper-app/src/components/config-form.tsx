"use client";

import { useState, useTransition } from "react";
import { saveConfig } from "@/app/(app)/actions";

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
  const [tierDrafts, setTierDrafts] = useState<Tier[]>(tiers);
  const [deletedTierIds, setDeletedTierIds] = useState<string[]>([]);
  const [flatPrice, setFlatPrice] = useState(flatUnitPrice);
  const [waterPrice, setWaterPrice] = useState(defaultWaterPrice);
  const [feeTypeDrafts, setFeeTypeDrafts] = useState<FeeType[]>(feeTypes);
  const [deletedFeeTypeIds, setDeletedFeeTypeIds] = useState<string[]>([]);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const lastTierId = tierDrafts[tierDrafts.length - 1]?.id;

  // Validate cả trong 1 bậc (Đến >= Từ) lẫn giữa các bậc liên tiếp (Từ bậc sau phải nối đúng ngay
  // sau Đến bậc trước — không được chồng lấn hoặc có khoảng trống, nếu không tiền điện sẽ tính sai
  // vì calculateElectricityBill duyệt tuần tự theo bậc và trừ dần kWh còn lại).
  const tierErrors = new Map<string, string>();
  const sortedTierDrafts = [...tierDrafts].sort((a, b) => a.tierOrder - b.tierOrder);
  sortedTierDrafts.forEach((t, i) => {
    if (t.toKwh != null && t.toKwh < t.fromKwh) {
      tierErrors.set(t.id, `"Đến" (${t.toKwh}) không được nhỏ hơn "Từ" (${t.fromKwh})`);
      return;
    }
    if (i < sortedTierDrafts.length - 1 && t.toKwh == null) {
      tierErrors.set(t.id, `Chỉ bậc cuối cùng mới được để "Đến" trống (không giới hạn)`);
      return;
    }
    if (i > 0) {
      const prev = sortedTierDrafts[i - 1];
      if (prev.toKwh != null && t.fromKwh !== prev.toKwh + 1) {
        tierErrors.set(
          t.id,
          `"Từ" (${t.fromKwh}) phải nối tiếp ngay sau bậc ${prev.tierOrder} (đến ${prev.toKwh}) — phải là ${prev.toKwh + 1}`
        );
      }
    }
  });
  const hasTierError = tierErrors.size > 0;

  function updateTierDraft(id: string, patch: Partial<Tier>) {
    setTierDrafts((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function addTierDraft() {
    setTierDrafts((prev) => {
      const last = prev[prev.length - 1];
      if (!last) {
        return [{ id: `new-${Date.now()}`, tierOrder: 1, fromKwh: 0, toKwh: null, unitPrice: 0 }];
      }
      // Nếu bậc cuối đã có "Đến" (người dùng tự nhập) thì tôn trọng đúng giá trị đó — bậc mới nối
      // tiếp ngay sau, không ghi đè. Chỉ khi bậc cuối còn "không giới hạn" (chưa từng chỉnh) mới
      // tự đặt mốc +100 làm gợi ý mặc định, vì không phải bậc nào cũng cách nhau 100kWh.
      const hasExplicitBoundary = last.toKwh != null;
      const newFromKwh = hasExplicitBoundary ? last.toKwh! + 1 : last.fromKwh + 100;
      const updatedLast = hasExplicitBoundary ? last : { ...last, toKwh: newFromKwh - 1 };
      return [
        ...prev.map((t) => (t.id === last.id ? updatedLast : t)),
        {
          id: `new-${Date.now()}`,
          tierOrder: last.tierOrder + 1,
          fromKwh: newFromKwh,
          toKwh: null,
          unitPrice: last.unitPrice,
        },
      ];
    });
  }

  function deleteTierDraft(id: string) {
    setTierDrafts((prev) => {
      if (prev.length <= 1) return prev; // luôn giữ tối thiểu 1 bậc
      if (prev[prev.length - 1].id !== id) return prev; // chỉ cho xóa bậc cuối
      if (!id.startsWith("new-")) setDeletedTierIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
      const rest = prev.slice(0, -1);
      const newLast = rest[rest.length - 1];
      if (newLast) rest[rest.length - 1] = { ...newLast, toKwh: null };
      return rest;
    });
  }

  function updateFeeTypeDraft(id: string, patch: Partial<FeeType>) {
    setFeeTypeDrafts((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function addFeeTypeDraft() {
    setFeeTypeDrafts((prev) => [...prev, { id: `new-${Date.now()}`, name: "Phí mới", defaultAmount: 0 }]);
  }

  function deleteFeeTypeDraft(id: string) {
    if (!id.startsWith("new-")) setDeletedFeeTypeIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
    setFeeTypeDrafts((prev) => prev.filter((f) => f.id !== id));
  }

  function onSave() {
    if (hasTierError) return;
    setSaveError(null);
    startTransition(async () => {
      try {
        await saveConfig({
          configId,
          useTiers,
          flatUnitPrice: flatPrice,
          defaultWaterPrice: waterPrice,
          tiers: tierDrafts,
          deletedTierIds,
          feeTypes: feeTypeDrafts,
          deletedFeeTypeIds,
        });
        setDeletedTierIds([]);
        setDeletedFeeTypeIds([]);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1400);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Lưu thất bại, vui lòng thử lại.");
      }
    });
  }

  return (
    <div>
      <div style={{ font: "700 20px/1.2 -apple-system,sans-serif", marginBottom: 2 }}>Cấu hình giá điện nước</div>
      <div style={{ font: "400 12px -apple-system,sans-serif", color: "var(--sub)", marginBottom: 16 }}>
        Chỉnh xong nhớ bấm &quot;Lưu thay đổi&quot; ở cuối trang — mọi thay đổi bên dưới chưa được ghi lại cho tới
        lúc đó.
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
              <div style={{ width: 28 }} />
            </div>
            {tierDrafts.map((t) => {
              const error = tierErrors.get(t.id) ?? null;
              return (
                <div key={t.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <div
                    className="flex flex-wrap min-[640px]:flex-nowrap"
                    style={{ alignItems: "center", gap: 8, padding: "9px 14px" }}
                  >
                    <div style={{ width: 60, font: "600 12.5px -apple-system,sans-serif" }}>{t.tierOrder}</div>
                    <input
                      type="number"
                      value={t.fromKwh}
                      onChange={(e) => updateTierDraft(t.id, { fromKwh: Number(e.target.value) || 0 })}
                      style={{
                        flex: 1,
                        minWidth: 80,
                        border: error ? "1px solid #e5484d" : "1px solid var(--border)",
                        borderRadius: 7,
                        padding: "6px 10px",
                        font: "600 12px ui-monospace,monospace",
                        background: "var(--bg)",
                        color: "var(--text)",
                      }}
                    />
                    <input
                      type="number"
                      value={t.toKwh ?? ""}
                      placeholder="Không giới hạn"
                      onChange={(e) =>
                        updateTierDraft(t.id, { toKwh: e.target.value === "" ? null : Number(e.target.value) || 0 })
                      }
                      style={{
                        flex: 1,
                        minWidth: 100,
                        border: error ? "1px solid #e5484d" : "1px solid var(--border)",
                        borderRadius: 7,
                        padding: "6px 10px",
                        font: "600 12px ui-monospace,monospace",
                        background: "var(--bg)",
                        color: "var(--text)",
                      }}
                    />
                    <input
                      type="number"
                      value={t.unitPrice}
                      onChange={(e) => updateTierDraft(t.id, { unitPrice: Number(e.target.value) || 0 })}
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
                    {t.id === lastTierId && tierDrafts.length > 1 ? (
                      <div
                        onClick={() => deleteTierDraft(t.id)}
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
                    ) : (
                      <div style={{ width: 28, flex: "none" }} />
                    )}
                  </div>
                  {error && (
                    <div style={{ padding: "0 14px 9px", font: "500 11px -apple-system,sans-serif", color: "#e5484d" }}>
                      {error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div
              onClick={addTierDraft}
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
              + Thêm bậc
            </div>
            {hasTierError && (
              <div style={{ font: "500 12px -apple-system,sans-serif", color: "#e5484d" }}>
                Sửa lỗi ở bảng bậc thang phía trên trước khi lưu.
              </div>
            )}
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
          {feeTypeDrafts.length === 0 && (
            <div style={{ padding: "12px 14px", font: "500 12px -apple-system,sans-serif", color: "var(--sub)" }}>
              Chưa có khoản phí nào.
            </div>
          )}
          {feeTypeDrafts.map((ft) => (
            <div
              key={ft.id}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderTop: "1px solid var(--border)" }}
            >
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={ft.name}
                  onChange={(e) => updateFeeTypeDraft(ft.id, { name: e.target.value })}
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
                  value={ft.defaultAmount}
                  onChange={(e) => updateFeeTypeDraft(ft.id, { defaultAmount: Number(e.target.value) || 0 })}
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
                onClick={() => deleteFeeTypeDraft(ft.id)}
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
            onClick={addFeeTypeDraft}
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

      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
        {saveError && (
          <div style={{ font: "500 12px -apple-system,sans-serif", color: "#e5484d" }}>{saveError}</div>
        )}
        <div
          onClick={onSave}
          style={{
            padding: "11px 22px",
            borderRadius: 8,
            background: hasTierError ? "var(--surface)" : "var(--accent)",
            color: hasTierError ? "var(--sub)" : "var(--accent-c)",
            font: "600 13px -apple-system,sans-serif",
            cursor: hasTierError ? "not-allowed" : "pointer",
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {savedFlash ? "Đã lưu ✓" : "Lưu thay đổi"}
        </div>
      </div>
    </div>
  );
}
