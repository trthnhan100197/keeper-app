"use client";

import { useRef, useState, useTransition } from "react";
import { savePhotoReading } from "@/app/(app)/actions";

type RoomOption = { id: string; no: string; propertyName: string };

type PendingPhoto = {
  id: string;
  previewUrl: string;
  status: "reading" | "done" | "error" | "saved";
  reading: number | null;
  confidence: "high" | "low" | null;
  reason: string | null;
  roomId: string;
  error?: string;
};

export function PhotoReadingCapture({
  rooms,
  month,
  year,
}: {
  rooms: RoomOption[];
  month: number;
  year: number;
}) {
  const [meterType, setMeterType] = useState<"electric" | "water">("electric");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFilesSelected(files: FileList) {
    const entries: PendingPhoto[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      previewUrl: URL.createObjectURL(file),
      status: "reading",
      reading: null,
      confidence: null,
      reason: null,
      roomId: "",
    }));
    setPhotos((prev) => [...prev, ...entries]);

    await Promise.all(
      Array.from(files).map(async (file, idx) => {
        const entry = entries[idx];
        const body = new FormData();
        body.append("image", file);
        body.append("meterType", meterType);
        try {
          const res = await fetch("/api/readings/photo", { method: "POST", body });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Lỗi không xác định");
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === entry.id
                ? { ...p, status: "done", reading: data.reading, confidence: data.confidence, reason: data.reason }
                : p
            )
          );
        } catch (err) {
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === entry.id
                ? { ...p, status: "error", error: err instanceof Error ? err.message : "Lỗi khi đọc ảnh" }
                : p
            )
          );
        }
      })
    );
  }

  function updatePhoto(id: string, patch: Partial<PendingPhoto>) {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function onSave(p: PendingPhoto) {
    if (!p.roomId || p.reading == null) return;
    startTransition(async () => {
      await savePhotoReading({
        roomId: p.roomId,
        month,
        year,
        meterType,
        newValue: p.reading!,
        needsReview: p.confidence === "low",
      });
      updatePhoto(p.id, { status: "saved" });
    });
  }

  return (
    <div style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 10, marginBottom: 16 }}>
      <div style={{ font: "700 14px -apple-system,sans-serif", marginBottom: 4 }}>📷 Chụp / Upload ảnh chỉ số</div>
      <div style={{ font: "400 11.5px -apple-system,sans-serif", color: "var(--sub)", marginBottom: 12 }}>
        Trên điện thoại sẽ mở camera chụp trực tiếp; trên máy tính sẽ chọn file ảnh có sẵn. AI đọc số giúp bạn —
        luôn cần xác nhận phòng + kiểm tra số trước khi lưu, không tự động lưu.
      </div>

      <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 12 }}>
        <div
          onClick={() => setMeterType("electric")}
          style={{
            padding: "7px 14px",
            borderRadius: 7,
            cursor: "pointer",
            font: "600 12px -apple-system,sans-serif",
            background: meterType === "electric" ? "var(--accent)" : "var(--surface)",
            color: meterType === "electric" ? "var(--accent-c)" : "var(--sub)",
          }}
        >
          Đồng hồ điện
        </div>
        <div
          onClick={() => setMeterType("water")}
          style={{
            padding: "7px 14px",
            borderRadius: 7,
            cursor: "pointer",
            font: "600 12px -apple-system,sans-serif",
            background: meterType === "water" ? "var(--accent)" : "var(--surface)",
            color: meterType === "water" ? "var(--accent-c)" : "var(--sub)",
          }}
        >
          Đồng hồ nước
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(e.target.files);
          }
          e.target.value = "";
        }}
      />
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          display: "inline-block",
          padding: "9px 16px",
          borderRadius: 8,
          border: "1px dashed var(--sub)",
          font: "500 12px -apple-system,sans-serif",
          color: "var(--sub)",
          cursor: "pointer",
          marginBottom: 14,
        }}
      >
        + Chụp / chọn ảnh (nhiều ảnh cho nhiều phòng)
      </div>

      {photos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {photos.map((p) => (
            <div
              key={p.id}
              style={{
                padding: 10,
                border: "1px solid var(--border)",
                borderRadius: 8,
                opacity: p.status === "saved" ? 0.55 : 1,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div className="flex items-center" style={{ gap: 10 }}>
                <img
                  src={p.previewUrl}
                  alt=""
                  style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, flex: "none" }}
                />
                {p.status === "reading" && (
                  <div style={{ font: "500 12px -apple-system,sans-serif", color: "var(--sub)" }}>
                    Đang đọc ảnh...
                  </div>
                )}
                {p.status === "error" && (
                  <div style={{ font: "500 12px -apple-system,sans-serif", color: "#e5484d" }}>{p.error}</div>
                )}
                {(p.status === "done" || p.status === "saved") && (
                  <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
                    <input
                      type="number"
                      value={p.reading ?? ""}
                      disabled={p.status === "saved"}
                      onChange={(e) => updatePhoto(p.id, { reading: Number(e.target.value) || 0 })}
                      style={{
                        width: 100,
                        border: "1px solid var(--border)",
                        borderRadius: 7,
                        padding: "6px 10px",
                        font: "600 13px ui-monospace,monospace",
                        background: "var(--bg)",
                        color: "var(--text)",
                      }}
                    />
                    {p.confidence === "low" && (
                      <div
                        style={{
                          padding: "3px 8px",
                          borderRadius: 6,
                          font: "600 10px -apple-system,sans-serif",
                          background: "#fff4d6",
                          color: "#946200",
                        }}
                      >
                        Cần kiểm tra lại
                      </div>
                    )}
                  </div>
                )}
              </div>

              {(p.status === "done" || p.status === "saved") && (
                <select
                  value={p.roomId}
                  disabled={p.status === "saved"}
                  onChange={(e) => updatePhoto(p.id, { roomId: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    border: "1px solid var(--border)",
                    borderRadius: 7,
                    font: "500 12px -apple-system,sans-serif",
                    background: "var(--bg)",
                    color: "var(--text)",
                  }}
                >
                  <option value="">— Chọn phòng —</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.propertyName} · {r.no}
                    </option>
                  ))}
                </select>
              )}

              {p.reason && (
                <div style={{ font: "400 10.5px -apple-system,sans-serif", color: "var(--sub)" }}>{p.reason}</div>
              )}

              {(p.status === "done" || p.status === "saved") && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div
                    onClick={() => p.status === "done" && p.roomId && p.reading != null && onSave(p)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 7,
                      font: "600 11.5px -apple-system,sans-serif",
                      cursor: p.status === "done" && p.roomId ? "pointer" : "default",
                      background: p.status === "saved" ? "var(--surface)" : "var(--accent)",
                      color: p.status === "saved" ? "var(--sub)" : "var(--accent-c)",
                      opacity: p.status === "done" && !p.roomId ? 0.4 : isPending ? 0.6 : 1,
                    }}
                  >
                    {p.status === "saved" ? "Đã lưu ✓" : "Lưu"}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
