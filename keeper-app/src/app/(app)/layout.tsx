import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { MobileTopBar, MobileBottomNav } from "@/components/mobile-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <div className="flex-1 min-w-0 overflow-y-auto p-[18px] pb-[80px] min-[760px]:p-[28px_32px] min-[760px]:pb-[28px]">
        <Suspense fallback={null}>
          <MobileTopBar />
        </Suspense>
        {children}
      </div>
      <Suspense fallback={null}>
        <MobileBottomNav />
      </Suspense>
    </div>
  );
}
