import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { getDbConfig } from "@/lib/db-config";

const globalForPg = globalThis as unknown as { pool?: Pool };

export const db =
  globalForPg.pool ??
  new Pool(getDbConfig());

if (process.env.NODE_ENV !== "production") {
  globalForPg.pool = db;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return db.query<T>(text, params);
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
