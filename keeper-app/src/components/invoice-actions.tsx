"use client";

import { useState } from "react";
import { vnd } from "@/lib/nav";

const buttonStyle: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  font: "600 12px -apple-system,sans-serif",
  color: "var(--text)",
  cursor: "pointer",
};

function buildMessage(input: {
  roomNo: string;
  propertyName: string;
  activeMonthText: string;
  electricOld: number;
  electricNew: number;
  waterOld: number;
  waterNew: number;
  elecWaterTotalText: string;
  monthlyRent: number;
  grandTotalText: string;
}) {
  return [
    `Hóa đơn ${input.propertyName} - phòng ${input.roomNo} (${input.activeMonthText})`,
    `Điện: ${input.electricOld} -> ${input.electricNew} kWh`,
    `Nước: ${input.waterOld} -> ${input.waterNew} m³`,
    `Tổng tiền điện nước: ${input.elecWaterTotalText}`,
    `Tiền phòng: ${vnd(input.monthlyRent)}`,
    `Tổng cộng: ${input.grandTotalText}`,
    `Vui lòng thanh toán trước ngày 5 hàng tháng. Cảm ơn!`,
  ].join("\n");
}

export function InvoiceActions({
  roomNo,
  propertyName,
  activeMonthText,
  tenantPhone,
  electricOld,
  electricNew,
  waterOld,
  waterNew,
  elecWaterTotalText,
  monthlyRent,
  grandTotalText,
}: {
  roomNo: string;
  propertyName: string;
  activeMonthText: string;
  tenantPhone: string | null;
  electricOld: number;
  electricNew: number;
  waterOld: number;
  waterNew: number;
  elecWaterTotalText: string;
  monthlyRent: number;
  grandTotalText: string;
}) {
  const [copied, setCopied] = useState(false);
  const message = buildMessage({
    roomNo,
    propertyName,
    activeMonthText,
    electricOld,
    electricNew,
    waterOld,
    waterNew,
    elecWaterTotalText,
    monthlyRent,
    grandTotalText,
  });
  const normalizedPhone = tenantPhone?.replace(/[^0-9]/g, "") || "";

  async function onZaloClick() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard API unavailable — still open Zalo, user can type manually
    }
    window.open(`https://zalo.me/${normalizedPhone}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap print:hidden" style={{ gap: 8, marginTop: 16, alignItems: "center" }}>
      <div onClick={() => window.print()} style={buttonStyle}>
        In hóa đơn
      </div>
      {normalizedPhone ? (
        <>
          <div onClick={onZaloClick} style={buttonStyle}>
            {copied ? "Đã copy — dán vào Zalo ✓" : "Nhắn Zalo"}
          </div>
          <a
            href={`sms:${normalizedPhone}?body=${encodeURIComponent(message)}`}
            style={{ ...buttonStyle, textDecoration: "none", display: "inline-block" }}
          >
            Nhắn SMS
          </a>
        </>
      ) : (
        <div style={{ font: "500 12px -apple-system,sans-serif", color: "var(--sub)" }}>
          Chưa có SĐT người thuê — vào màn Phòng để thêm.
        </div>
      )}
    </div>
  );
}
