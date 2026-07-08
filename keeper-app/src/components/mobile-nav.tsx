"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { NAV_DEFS } from "@/lib/nav";
import { ThemeToggle } from "./theme-toggle";
import { PeriodSelect } from "./period-select";

export function MobileTopBar() {
  return (
    <div className="min-[760px]:hidden print:hidden">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ font: "700 17px -apple-system,sans-serif" }}>Keeper</div>
        <ThemeToggle />
      </div>
      <div style={{ marginBottom: 18 }}>
        <PeriodSelect mobile />
      </div>
    </div>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  return (
    <div
      className="flex min-[760px]:hidden print:hidden"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: 60,
        borderTop: "1px solid var(--border)",
        background: "var(--bg)",
        alignItems: "center",
        justifyContent: "space-around",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {NAV_DEFS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.id}
            href={qs ? `${item.href}?${qs}` : item.href}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: active ? "var(--text)" : "var(--dot)",
              }}
            />
            <div
              style={{
                font: active ? "600 9.5px -apple-system,sans-serif" : "500 9.5px -apple-system,sans-serif",
                color: active ? "var(--text)" : "var(--sub)",
              }}
            >
              {item.label}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
