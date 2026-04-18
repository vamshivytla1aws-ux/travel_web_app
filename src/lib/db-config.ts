import type { PoolConfig } from "pg";

function asString(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getDbConfig(): PoolConfig {
  const host = asString(process.env.PGHOST);
  const user = asString(process.env.PGUSER);
  const password = asString(process.env.PGPASSWORD);
  const database = asString(process.env.PGDATABASE);
  const port = Number(process.env.PGPORT ?? "5432");

  if (host && user && database) {
    return {
      host,
      user,
      password: password ?? "",
      database,
      port,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    };
  }

  const connectionString = asString(process.env.DATABASE_URL);
  if (!connectionString) {
    throw new Error(
      "Database config missing. Set PGHOST/PGUSER/PGPASSWORD/PGDATABASE (recommended) or DATABASE_URL.",
    );
  }

  return {
    connectionString,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  };
}
