"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveVoiceReading } from "@/app/(app)/actions";
import { matchRoomIdFromText } from "@/lib/room-match";

type RoomOption = { id: string; no: string; propertyName: string };

type VoiceEntry = {
  id: string;
  roomText: string | null;
  roomId: string;
  electricReading: number | null;
  waterReading: number | null;
  confidence: "high" | "low";
  status: "pending" | "saved";
};

// Web Speech API chưa có type chuẩn trong TS lib.dom — khai báo tối thiểu phần dùng tới.
interface SpeechRecognitionResultLike {
  [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike {
  results: { [index: number]: SpeechRecognitionResultLike; length: number };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function VoiceReadingCapture({
  rooms,
  month,
  year,
}: {
  rooms: RoomOption[];
  month: number;
  year: number;
}) {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [entries, setEntries] = useState<VoiceEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const ctor =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;
    if (!ctor) {
      setSupported(false);
      return;
    }
    const recognition = new ctor();
    recognition.lang = "vi-VN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        finalText += event.results[i][0].transcript;
      }
      setTranscript(finalText);
    };
    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
  }, []);

  function startRecording() {
    setTranscript("");
    setError(null);
    setEntries([]);
    recognitionRef.current?.start();
    setRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  async function processTranscript() {
    if (!transcript.trim()) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/readings/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi không xác định");
      const newEntries: VoiceEntry[] = (
        data.entries as {
          roomText: string | null;
          electricReading: number | null;
          waterReading: number | null;
          confidence: "high" | "low";
        }[]
      ).map((e, idx) => ({
        id: `${Date.now()}-${idx}`,
        roomText: e.roomText,
        roomId: matchRoomIdFromText(e.roomText, rooms) ?? "",
        electricReading: e.electricReading,
        waterReading: e.waterReading,
        confidence: e.confidence,
        status: "pending" as const,
      }));
      setEntries(newEntries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi xử lý giọng nói");
    } finally {
      setProcessing(false);
    }
  }

  function updateEntry(id: string, patch: Partial<VoiceEntry>) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function onSave(entry: VoiceEntry) {
    if (!entry.roomId || (entry.electricReading == null && entry.waterReading == null)) return;
    startTransition(async () => {
      await saveVoiceReading({
        roomId: entry.roomId,
        month,
        year,
        electricNew: entry.electricReading ?? undefined,
        waterNew: entry.waterReading ?? undefined,
        needsReview: true,
      });
      updateEntry(entry.id, { status: "saved" });
    });
  }

  return (
    <div style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 10 }}>
      <div style={{ font: "700 14px -apple-system,sans-serif", marginBottom: 4 }}>🎤 Ghi âm chỉ số</div>
      <div style={{ font: "400 11.5px -apple-system,sans-serif", color: "var(--sub)", marginBottom: 12 }}>
        Đọc liền mạch nhiều phòng trong 1 lần ghi âm, vd: &quot;phòng một trăm lẻ một điện một nghìn ba trăm sáu
        mươi lăm nước chín mươi lăm, phòng một trăm lẻ hai điện...&quot;. AI sẽ thử tự khớp tên phòng — luôn kiểm
        tra lại phòng + số trước khi lưu. Chỉ hoạt động tốt trên trình duyệt Chrome/Edge (kể cả trên điện thoại).
      </div>

      {!supported && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            background: "#fff4d6",
            color: "#946200",
            font: "500 12px -apple-system,sans-serif",
          }}
        >
          Trình duyệt hiện tại không hỗ trợ ghi âm nhận diện giọng nói. Vui lòng dùng Chrome hoặc Edge.
        </div>
      )}

      {supported && (
        <>
          <div className="flex flex-wrap items-center" style={{ gap: 8, marginBottom: 12 }}>
            <div
              onClick={recording ? stopRecording : startRecording}
              style={{
                padding: "9px 16px",
                borderRadius: 8,
                cursor: "pointer",
                font: "600 12.5px -apple-system,sans-serif",
                background: recording ? "#e5484d" : "var(--accent)",
                color: recording ? "#fff" : "var(--accent-c)",
              }}
            >
              {recording ? "⏹ Dừng ghi âm" : "🎙 Bắt đầu ghi âm"}
            </div>
            {transcript && !recording && (
              <div
                onClick={processTranscript}
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  font: "600 12.5px -apple-system,sans-serif",
                  color: "var(--text)",
                  opacity: processing ? 0.6 : 1,
                }}
              >
                {processing ? "Đang xử lý..." : "Xử lý văn bản"}
              </div>
            )}
          </div>

          {transcript && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                background: "var(--surface)",
                font: "500 12px -apple-system,sans-serif",
                color: "var(--text)",
                marginBottom: 12,
              }}
            >
              {transcript}
            </div>
          )}

          {error && (
            <div style={{ font: "500 12px -apple-system,sans-serif", color: "#e5484d", marginBottom: 12 }}>
              {error}
            </div>
          )}

          {entries.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    padding: 10,
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    opacity: entry.status === "saved" ? 0.55 : 1,
                  }}
                >
                  <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
                    <div
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        font: "600 10px -apple-system,sans-serif",
                        background: "#fff4d6",
                        color: "#946200",
                      }}
                    >
                      Cần xác nhận
                    </div>
                    {entry.roomText && (
                      <div style={{ font: "400 10.5px -apple-system,sans-serif", color: "var(--sub)" }}>
                        Nghe được: &quot;{entry.roomText}&quot;
                      </div>
                    )}
                  </div>

                  <select
                    value={entry.roomId}
                    disabled={entry.status === "saved"}
                    onChange={(e) => updateEntry(entry.id, { roomId: e.target.value })}
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

                  <div className="grid grid-cols-2" style={{ gap: 8 }}>
                    <div>
                      <label style={{ font: "500 11px -apple-system,sans-serif", color: "var(--sub)" }}>Điện</label>
                      <input
                        type="number"
                        value={entry.electricReading ?? ""}
                        disabled={entry.status === "saved"}
                        onChange={(e) =>
                          updateEntry(entry.id, {
                            electricReading: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        placeholder="—"
                        style={{
                          width: "100%",
                          border: "1px solid var(--border)",
                          borderRadius: 7,
                          padding: "6px 10px",
                          font: "600 13px ui-monospace,monospace",
                          background: "var(--bg)",
                          color: "var(--text)",
                          marginTop: 4,
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ font: "500 11px -apple-system,sans-serif", color: "var(--sub)" }}>Nước</label>
                      <input
                        type="number"
                        value={entry.waterReading ?? ""}
                        disabled={entry.status === "saved"}
                        onChange={(e) =>
                          updateEntry(entry.id, {
                            waterReading: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        placeholder="—"
                        style={{
                          width: "100%",
                          border: "1px solid var(--border)",
                          borderRadius: 7,
                          padding: "6px 10px",
                          font: "600 13px ui-monospace,monospace",
                          background: "var(--bg)",
                          color: "var(--text)",
                          marginTop: 4,
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div
                      onClick={() =>
                        entry.status === "pending" &&
                        entry.roomId &&
                        (entry.electricReading != null || entry.waterReading != null) &&
                        onSave(entry)
                      }
                      style={{
                        padding: "7px 14px",
                        borderRadius: 7,
                        font: "600 11.5px -apple-system,sans-serif",
                        cursor: entry.status === "pending" && entry.roomId ? "pointer" : "default",
                        background: entry.status === "saved" ? "var(--surface)" : "var(--accent)",
                        color: entry.status === "saved" ? "var(--sub)" : "var(--accent-c)",
                        opacity: entry.status === "pending" && !entry.roomId ? 0.4 : isPending ? 0.6 : 1,
                      }}
                    >
                      {entry.status === "saved" ? "Đã lưu ✓" : "Lưu"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
