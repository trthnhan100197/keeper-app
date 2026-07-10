import { connection } from "next/server";
import Link from "next/link";
import { getActiveBillingConfig, getFeeTypes } from "@/lib/data";
import { ConfigForm } from "@/components/config-form";

export default async function ConfigPage() {
  await connection();
  const [config, feeTypes] = await Promise.all([getActiveBillingConfig(), getFeeTypes()]);

  if (!config) {
    return (
      <div style={{ font: "500 13px -apple-system,sans-serif", color: "var(--sub)" }}>
        Chưa có cấu hình giá điện nước.
      </div>
    );
  }

  return (
    <div>
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
        feeTypes={feeTypes.map((ft) => ({ id: ft.id, name: ft.name, defaultAmount: Number(ft.defaultAmount) }))}
      />
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
        <Link
          href="/settings/api-keys"
          style={{ font: "500 12px -apple-system,sans-serif", color: "var(--sub)" }}
        >
          Quản lý API key cho hệ thống ngoài →
        </Link>
      </div>
    </div>
  );
}
