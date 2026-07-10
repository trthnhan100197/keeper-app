"use client";

import { useState, useTransition } from "react";
import { addApiKey, toggleApiKey, deleteApiKey } from "@/app/(app)/actions";

type ApiKey = {
  id: string;
  name: string;
  key: string;
  active: boolean;
  lastUsedAt: string | null;
  createdAt: string;
};

function formatDate(iso: string | null) {
  if (!iso) return "Chưa dùng lần nào";
  return new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

export function ApiKeysManager({ keys }: { keys: ApiKey[] }) {
  const [newName, setNewName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onAdd() {
    const name = newName.trim() || "Đồng hồ IoT mới";
    startTransition(async () => {
      await addApiKey(name);
      setNewName("");
    });
  }

  function onCopy(id: string, key: string) {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1400);
  }

  return (
    <div>
      <div style={{ font: "700 20px/1.2 -apple-system,sans-serif", marginBottom: 2 }}>API key</div>
      <div style={{ font: "400 12px -apple-system,sans-serif", color: "var(--sub)", marginBottom: 16 }}>
        Cấp quyền cho hệ thống ngoài (đồng hồ IoT, phần mềm khác) gửi chỉ số điện nước qua API. Gửi kèm header{" "}
        <code style={{ font: "600 11px ui-monospace,monospace" }}>x-api-key</code>.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Tên gợi nhớ, vd: Đồng hồ IoT nhà A"
          style={{
            flex: 1,
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "9px 12px",
            font: "500 12.5px -apple-system,sans-serif",
            background: "var(--bg)",
            color: "var(--text)",
          }}
        />
        <div
          onClick={onAdd}
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            background: "var(--accent)",
            color: "var(--accent-c)",
            font: "600 12.5px -apple-system,sans-serif",
            cursor: "pointer",
            opacity: isPending ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          + Tạo key mới
        </div>
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        {keys.length === 0 && (
          <div style={{ padding: "12px 14px", font: "500 12px -apple-system,sans-serif", color: "var(--sub)" }}>
            Chưa có API key nào.
          </div>
        )}
        {keys.map((k, idx) => (
          <div
            key={k.id}
            style={{
              padding: "12px 14px",
              borderTop: idx === 0 ? "none" : "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ font: "600 13px -apple-system,sans-serif" }}>{k.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  onClick={() => startTransition(() => toggleApiKey(k.id, !k.active))}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    font: "600 10.5px -apple-system,sans-serif",
                    cursor: "pointer",
                    background: k.active ? "var(--accent)" : "var(--surface)",
                    color: k.active ? "var(--accent-c)" : "var(--sub)",
                    border: k.active ? "none" : "1px solid var(--border)",
                  }}
                >
                  {k.active ? "Đang hoạt động" : "Đã tắt"}
                </div>
                <div
                  onClick={() => startTransition(() => deleteApiKey(k.id))}
                  style={{
                    width: 26,
                    height: 26,
                    flex: "none",
                    borderRadius: 7,
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--sub)",
                    font: "600 14px -apple-system,sans-serif",
                  }}
                >
                  ×
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <code
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: "var(--surface)",
                  font: "500 11px ui-monospace,monospace",
                  color: "var(--sub)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {k.key}
              </code>
              <div
                onClick={() => onCopy(k.id, k.key)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  font: "600 10.5px -apple-system,sans-serif",
                  color: "var(--sub)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {copiedId === k.id ? "Đã copy ✓" : "Copy"}
              </div>
            </div>
            <div style={{ font: "400 10.5px -apple-system,sans-serif", color: "var(--sub)" }}>
              Dùng lần cuối: {formatDate(k.lastUsedAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
