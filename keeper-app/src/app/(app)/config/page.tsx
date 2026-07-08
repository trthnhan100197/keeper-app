import { connection } from "next/server";
import { getActiveBillingConfig } from "@/lib/data";
import { ConfigForm } from "@/components/config-form";

export default async function ConfigPage() {
  await connection();
  const config = await getActiveBillingConfig();

  if (!config) {
    return (
      <div style={{ font: "500 13px -apple-system,sans-serif", color: "var(--sub)" }}>
        Chưa có cấu hình giá điện nước.
      </div>
    );
  }

  return (
    <ConfigForm
      configId={config.id}
      useTiers={config.useTiers}
      flatUnitPrice={Number(config.flatUnitPrice ?? 0)}
      defaultWaterPrice={Number(config.defaultWaterPrice)}
      tiers={config.tiers.map((t) => ({
        id: t.id,
        tierOrder: t.tierOrder,
        fromKwh: t.fromKwh,
        toKwh: t.toKwh,
        unitPrice: Number(t.unitPrice),
      }))}
    />
  );
}
