import Link from "next/link";
import { getPropertiesWithRooms } from "@/lib/data";
import { RoomTable } from "@/components/room-table";
import { AddPropertyButton } from "@/components/add-property-button";

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ building?: string; month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const properties = await getPropertiesWithRooms();
  const current = properties.find((p) => p.id === sp.building) ?? properties[0];

  const qs = new URLSearchParams();
  if (sp.month) qs.set("month", sp.month);
  if (sp.year) qs.set("year", sp.year);

  if (!current) {
    return <div style={{ font: "500 13px -apple-system,sans-serif", color: "var(--sub)" }}>Chưa có trụ sở nào.</div>;
  }

  const occ = current.rooms.filter((r) => r.status === "OCCUPIED").length;
  const summary = `${current.rooms.length} phòng · ${current.rooms.length - occ} trống`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ font: "700 20px/1.2 -apple-system,sans-serif" }}>Phòng</div>
        <div style={{ font: "600 12.5px ui-monospace,monospace", color: "var(--sub)" }}>{summary}</div>
      </div>
      <div style={{ display: "flex", gap: 8, margin: "14px 0 14px" }}>
        {properties.map((p) => {
          const active = p.id === current.id;
          const params = new URLSearchParams(qs);
          params.set("building", p.id);
          return (
            <Link
              key={p.id}
              href={`/rooms?${params.toString()}`}
              style={
                active
                  ? {
                      padding: "7px 14px",
                      borderRadius: 8,
                      background: "var(--accent)",
                      color: "var(--accent-c)",
                      font: "600 12px -apple-system,sans-serif",
                      cursor: "pointer",
                    }
                  : {
                      padding: "7px 14px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      font: "500 12px -apple-system,sans-serif",
                      color: "var(--sub)",
                      cursor: "pointer",
                    }
              }
            >
              {p.name}
            </Link>
          );
        })}
        <AddPropertyButton />
      </div>
      <RoomTable
        key={current.id}
        propertyId={current.id}
        propertyName={current.name}
        propertyAddress={current.address}
        rooms={current.rooms.map((r) => ({
          id: r.id,
          name: r.name,
          monthlyRent: Number(r.monthlyRent),
          status: r.status,
          tenantName: r.tenants[0]?.name ?? "",
          tenantPhone: r.tenants[0]?.phone ?? "",
        }))}
      />
    </div>
  );
}
