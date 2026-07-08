export const NAV_DEFS = [
  { id: "dashboard", label: "Tổng quan", href: "/dashboard" },
  { id: "rooms", label: "Phòng", href: "/rooms" },
  { id: "readings", label: "Chỉ số", href: "/readings" },
  { id: "invoice", label: "Hóa đơn", href: "/invoice" },
  { id: "config", label: "Cấu hình", href: "/config" },
] as const;

export function vnd(n: number): string {
  return Math.round(n).toLocaleString("vi-VN") + "đ";
}

export function currentPeriod(searchParams: { month?: string; year?: string }) {
  const now = new Date();
  const month = Number(searchParams.month) || now.getMonth() + 1;
  const year = Number(searchParams.year) || now.getFullYear();
  return { month, year, text: `Tháng ${month} · ${year}` };
}
