"use client";

import { useState, useTransition } from "react";
import { addFeeType, updateFeeType, deleteFeeType } from "@/app/(app)/actions";

type FeeType = { id: string; name: string; defaultAmount: number };

export function FeeTypeManager({ feeTypes }: { feeTypes: FeeType[] }) {
  const [, startTransition] = useTransition();

  return (
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
          <FeeTypeRow key={ft.id} feeType={ft} />
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
  );
}

function FeeTypeRow({ feeType }: { feeType: FeeType }) {
  const [name, setName] = useState(feeType.name);
  const [amount, setAmount] = useState(feeType.defaultAmount);
  const [, startTransition] = useTransition();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderTop: "1px solid var(--border)" }}>
      <div style={{ flex: 1 }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== feeType.name && startTransition(() => updateFeeType(feeType.id, { name }))}
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
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          onBlur={() => amount !== feeType.defaultAmount && startTransition(() => updateFeeType(feeType.id, { defaultAmount: amount }))}
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
        onClick={() => startTransition(() => deleteFeeType(feeType.id))}
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
  );
}
