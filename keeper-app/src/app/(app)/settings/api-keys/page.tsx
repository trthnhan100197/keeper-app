import { connection } from "next/server";
import { getApiKeys } from "@/lib/data";
import { ApiKeysManager } from "@/components/api-keys-manager";

export default async function ApiKeysPage() {
  await connection();
  const keys = await getApiKeys();

  return (
    <ApiKeysManager
      keys={keys.map((k) => ({
        id: k.id,
        name: k.name,
        key: k.key,
        active: k.active,
        lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
        createdAt: k.createdAt.toISOString(),
      }))}
    />
  );
}
