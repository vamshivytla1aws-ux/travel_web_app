import { describe, expect, it } from "vitest";
import { getDbConfig } from "@/lib/db-config";

function withEnv<T>(env: NodeJS.ProcessEnv, fn: () => T): T {
  const original = { ...process.env };
  process.env = { ...original, ...env };
  try {
    return fn();
  } finally {
    process.env = original;
  }
}

describe("getDbConfig", () => {
  it("prefers PG* environment variables", () =>
    withEnv(
      {
        PGHOST: "localhost",
        PGPORT: "5432",
        PGDATABASE: "employee_transport",
        PGUSER: "postgres",
        PGPASSWORD: "secret",
        DATABASE_URL: "postgresql://ignored",
      },
      () => {
        const config = getDbConfig();
        expect(config).toMatchObject({
          host: "localhost",
          user: "postgres",
          database: "employee_transport",
          port: 5432,
        });
      },
    ));

  it("falls back to DATABASE_URL", () =>
    withEnv(
      {
        PGHOST: "",
        PGUSER: "",
        PGDATABASE: "",
        DATABASE_URL: "postgresql://postgres:pass@localhost:5432/employee_transport",
      },
      () => {
        const config = getDbConfig();
        expect(config).toMatchObject({
          connectionString: "postgresql://postgres:pass@localhost:5432/employee_transport",
        });
      },
    ));
});
