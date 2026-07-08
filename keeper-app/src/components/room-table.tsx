"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RoomStatus } from "@prisma/client";
import { updateProperty, updateRoom, addRoom, deleteRoom, deleteProperty } from "@/app/(app)/actions";

type Room = { id: string; name: string; monthlyRent: number; status: RoomStatus };

const propertyFieldInputStyle: React.CSSProperties = {
  flex: 1,
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "9px 12px",
  font: "600 13px -apple-system,sans-serif",
  background: "var(--bg)",
  color: "var(--text)",
};

export function RoomTable({
  propertyId,
  propertyName,
  propertyAddress,
  rooms,
}: {
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  rooms: Room[];
}) {
  const router = useRouter();
  const [name, setName] = useState(propertyName);
  const [address, setAddress] = useState(propertyAddress);
  const [, startTransition] = useTransition();

  function onDeleteProperty() {
    const confirmed = window.confirm(
      `Xoá cơ sở "${propertyName}"? Toàn bộ ${rooms.length} phòng, chỉ số và hóa đơn liên quan sẽ bị xoá vĩnh viễn. Không thể hoàn tác.`
    );
    if (!confirmed) return;
    startTransition(async () => {
      await deleteProperty(propertyId);
      router.push("/rooms");
    });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ font: "500 12px -apple-system,sans-serif", color: "var(--sub)", whiteSpace: "nowrap" }}>
          Tên cơ sở
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== propertyName && startTransition(() => updateProperty(propertyId, { name }))}
          style={propertyFieldInputStyle}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ font: "500 12px -apple-system,sans-serif", color: "var(--sub)", whiteSpace: "nowrap" }}>
          Địa chỉ
        </div>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onBlur={() => address !== propertyAddress && startTransition(() => updateProperty(propertyId, { address }))}
          style={propertyFieldInputStyle}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <div
          onClick={onDeleteProperty}
          style={{
            padding: "7px 14px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            font: "500 12px -apple-system,sans-serif",
            color: "var(--sub)",
            cursor: "pointer",
          }}
        >
          Xoá cơ sở
        </div>
      </div>
      <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: "var(--surface)",
            font: "600 11px -apple-system,sans-serif",
            color: "var(--sub)",
          }}
        >
          <div style={{ flex: 1 }}>Tên phòng</div>
          <div style={{ flex: 1 }}>Giá thuê</div>
          <div style={{ width: 130 }}>Trạng thái</div>
          <div style={{ width: 28 }} />
        </div>
        {rooms.map((r) => (
          <RoomRow key={r.id} room={r} />
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <div
          onClick={() => startTransition(() => addRoom(propertyId))}
          style={{
            display: "inline-block",
            padding: "9px 16px",
            borderRadius: 8,
            border: "1px dashed var(--sub)",
            font: "500 12px -apple-system,sans-serif",
            color: "var(--sub)",
            cursor: "pointer",
          }}
        >
          + Thêm phòng
        </div>
      </div>
    </div>
  );
}

function RoomRow({ room }: { room: Room }) {
  const [no, setNo] = useState(room.name);
  const [price, setPrice] = useState(room.monthlyRent);
  const [, startTransition] = useTransition();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderTop: "1px solid var(--border)" }}>
      <div style={{ flex: 1 }}>
        <input
          type="text"
          value={no}
          onChange={(e) => setNo(e.target.value)}
          onBlur={() => no !== room.name && startTransition(() => updateRoom(room.id, { name: no }))}
          style={{
            width: "100%",
            border: "1px solid var(--border)",
            borderRadius: 7,
            padding: "7px 10px",
            font: "700 13px -apple-system,sans-serif",
            background: "var(--bg)",
            color: "var(--text)",
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value) || 0)}
          onBlur={() => price !== room.monthlyRent && startTransition(() => updateRoom(room.id, { monthlyRent: price }))}
          style={{
            width: "100%",
            border: "1px solid var(--border)",
            borderRadius: 7,
            padding: "7px 10px",
            font: "600 12.5px ui-monospace,monospace",
            background: "var(--bg)",
            color: "var(--text)",
          }}
        />
      </div>
      <div style={{ width: 130 }}>
        <select
          value={room.status}
          onChange={(e) => startTransition(() => updateRoom(room.id, { status: e.target.value as RoomStatus }))}
          style={{
            width: "100%",
            border: "1px solid var(--border)",
            borderRadius: 7,
            padding: "7px 8px",
            font: "600 11px -apple-system,sans-serif",
            background: "var(--bg)",
            color: "var(--text)",
          }}
        >
          <option value="OCCUPIED">Đang thuê</option>
          <option value="VACANT">Trống</option>
        </select>
      </div>
      <div
        onClick={() => startTransition(() => deleteRoom(room.id))}
        style={{
          width: 28,
          height: 28,
          flex: "none",
          borderRadius: 7,
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--sub)",
          font: "600 15px -apple-system,sans-serif",
        }}
      >
        ×
      </div>
    </div>
  );
}
