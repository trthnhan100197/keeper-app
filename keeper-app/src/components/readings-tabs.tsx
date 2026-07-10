"use client";

import { useState } from "react";

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

export function ReadingsTabs({
  singleTab,
  batchTab,
}: {
  singleTab: React.ReactNode;
  batchTab: React.ReactNode;
}) {
  const [tab, setTab] = useState<"single" | "batch">("single");

  return (
    <div>
      <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 20 }}>
        <div onClick={() => setTab("single")} style={tab === "single" ? tabActiveStyle : tabInactiveStyle}>
          Từng phòng
        </div>
        <div onClick={() => setTab("batch")} style={tab === "batch" ? tabActiveStyle : tabInactiveStyle}>
          Nhập hàng loạt (ảnh / giọng nói)
        </div>
      </div>
      {/* Giữ cả 2 tab trong DOM (chỉ ẩn/hiện) để không mất dữ liệu đang nhập khi chuyển qua lại */}
      <div style={{ display: tab === "single" ? "block" : "none" }}>{singleTab}</div>
      <div style={{ display: tab === "batch" ? "block" : "none" }}>{batchTab}</div>
    </div>
  );
}
