"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = [2024, 2025, 2026, 2027, 2028];

const selectStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 8,
  font: "600 12px -apple-system,sans-serif",
  background: "var(--bg)",
  color: "var(--text)",
};

export function PeriodSelect({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const now = new Date();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;
  const year = Number(searchParams.get("year")) || now.getFullYear();

  function update(next: { month?: number; year?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", String(next.month ?? month));
    params.set("year", String(next.year ?? year));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <select
        value={month}
        onChange={(e) => update({ month: Number(e.target.value) })}
        style={{ ...selectStyle, flex: 1, padding: mobile ? "8px 10px" : "7px 8px" }}
      >
        {MONTHS.map((m) => (
          <option key={m} value={m}>
            {`Tháng ${m}`}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => update({ year: Number(e.target.value) })}
        style={{ ...selectStyle, width: mobile ? 84 : 70, padding: mobile ? "8px 10px" : "7px 8px" }}
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
