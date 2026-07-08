"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function RoomSelect({ options, current }: { options: { id: string; no: string }[]; current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      value={current}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("room", e.target.value);
        router.push(`${pathname}?${params.toString()}`);
      }}
      style={{
        padding: "9px 14px",
        border: "1px solid var(--border)",
        borderRadius: 8,
        font: "600 12.5px -apple-system,sans-serif",
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.no}
        </option>
      ))}
    </select>
  );
}
