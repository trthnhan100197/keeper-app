"use client";

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
  elecConsumption: number;
  waterConsumption: number;
  grandTotalText: string;
}) {
  return `Hóa đơn điện nước ${input.propertyName} - phòng ${input.roomNo} (${input.activeMonthText}): Điện ${input.elecConsumption}kWh, Nước ${input.waterConsumption}m³. Tổng cộng: ${input.grandTotalText}. Vui lòng thanh toán trước ngày 5 hàng tháng. Cảm ơn!`;
}

export function InvoiceActions({
  roomNo,
  propertyName,
  activeMonthText,
  tenantPhone,
  elecConsumption,
  waterConsumption,
  grandTotalText,
}: {
  roomNo: string;
  propertyName: string;
  activeMonthText: string;
  tenantPhone: string | null;
  elecConsumption: number;
  waterConsumption: number;
  grandTotalText: string;
}) {
  const message = buildMessage({ roomNo, propertyName, activeMonthText, elecConsumption, waterConsumption, grandTotalText });
  const normalizedPhone = tenantPhone?.replace(/[^0-9]/g, "") || "";

  return (
    <div className="flex flex-wrap print:hidden" style={{ gap: 8, marginTop: 16 }}>
      <div onClick={() => window.print()} style={buttonStyle}>
        In hóa đơn
      </div>
      {normalizedPhone ? (
        <>
          <a
            href={`https://zalo.me/${normalizedPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...buttonStyle, textDecoration: "none", display: "inline-block" }}
          >
            Nhắn Zalo
          </a>
          <a
            href={`sms:${normalizedPhone}?body=${encodeURIComponent(message)}`}
            style={{ ...buttonStyle, textDecoration: "none", display: "inline-block" }}
          >
            Nhắn SMS
          </a>
        </>
      ) : (
        <div style={{ font: "500 12px -apple-system,sans-serif", color: "var(--sub)", alignSelf: "center" }}>
          Chưa có SĐT người thuê — vào màn Phòng để thêm.
        </div>
      )}
    </div>
  );
}
