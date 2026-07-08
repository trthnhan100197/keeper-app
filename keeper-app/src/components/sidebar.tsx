"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { NAV_DEFS } from "@/lib/nav";
import { ThemeToggle } from "./theme-toggle";
import { PeriodSelect } from "./period-select";

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  return (
    <div
      className="hidden min-[760px]:flex"
      style={{
        width: 190,
        flex: "none",
        borderRight: "1px solid var(--border)",
        padding: "24px 16px",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <div
        style={{
          font: "700 17px/1 -apple-system,sans-serif",
          letterSpacing: "-0.02em",
          marginBottom: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        Keeper
        <ThemeToggle />
      </div>
      <div style={{ marginBottom: 20 }}>
        <PeriodSelect />
      </div>
      {NAV_DEFS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.id}
            href={qs ? `${item.href}?${qs}` : item.href}
            style={
              active
                ? {
                    padding: "9px 10px",
                    borderRadius: 7,
                    background: "var(--accent)",
                    color: "var(--accent-c)",
                    font: "600 12.5px -apple-system,sans-serif",
                    cursor: "pointer",
                  }
                : {
                    padding: "9px 10px",
                    font: "500 12.5px -apple-system,sans-serif",
                    color: "var(--sub)",
                    cursor: "pointer",
                  }
            }
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
