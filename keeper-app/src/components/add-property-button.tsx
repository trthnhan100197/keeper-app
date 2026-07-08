"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { addProperty } from "@/app/(app)/actions";

export function AddPropertyButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const newPropertyId = await addProperty();
      const params = new URLSearchParams(searchParams.toString());
      params.set("building", newPropertyId);
      router.push(`/rooms?${params.toString()}`);
    });
  }

  return (
    <div
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 8,
        border: "1px dashed var(--sub)",
        font: "500 12px -apple-system,sans-serif",
        color: "var(--sub)",
        cursor: "pointer",
        opacity: isPending ? 0.6 : 1,
      }}
    >
      + Thêm cơ sở
    </div>
  );
}
