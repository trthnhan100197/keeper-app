"use client";

import { useTransition } from "react";
import { toggleUseTiers } from "@/app/(app)/actions";

export function TieredToggle({ configId, useTiers }: { configId: string; useTiers: boolean }) {
  const [isPending, startTransition] = useTransition();

  const trackStyle: React.CSSProperties = {
    width: 38,
    height: 22,
    borderRadius: 11,
    position: "relative",
    cursor: "pointer",
    opacity: isPending ? 0.6 : 1,
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        border: "1px solid var(--border)",
        borderRadius: 10,
        margin: "14px 0 18px",
      }}
    >
      <div>
        <div style={{ font: "600 12.5px -apple-system,sans-serif" }}>Tính theo bậc thang nhà nước</div>
        <div style={{ font: "400 11px -apple-system,sans-serif", color: "var(--sub)", marginTop: 2 }}>
          {useTiers ? "Đang bật — tính theo biểu giá bậc thang EVN" : "Đang tắt — áp dụng đơn giá bình quân"}
        </div>
      </div>
      <div onClick={() => startTransition(() => toggleUseTiers(configId, !useTiers))} style={trackStyle}>
        <div style={thumbStyle} />
      </div>
    </div>
  );
}
