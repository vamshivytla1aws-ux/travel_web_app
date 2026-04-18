import { query } from "@/lib/db";
import { ensureDocumentTables } from "@/lib/document-storage";

export async function ensureTransportEnhancements() {
  await query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'buses' AND column_name = 'capacity'
      ) THEN
        ALTER TABLE buses RENAME COLUMN capacity TO seater;
      END IF;
    END $$;
  `);
  await query(`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS company_name VARCHAR(120);`);
  await query(`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS bank_name VARCHAR(120);`);
  await query(`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(40);`);
  await query(`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(30);`);
  await query(`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS pf_account_number VARCHAR(40);`);
  await query(`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS uan_number VARCHAR(40);`);
  await query(`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS profile_photo_name VARCHAR(255);`);
  await query(`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS profile_photo_mime VARCHAR(120);`);
  await query(`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS profile_photo_data BYTEA;`);

  await query(`ALTER TABLE employees ALTER COLUMN email DROP NOT NULL;`);
  await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS company_name VARCHAR(120);`);
  await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender VARCHAR(20);`);
  await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);`);
  await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS valid_from DATE;`);
  await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS valid_to DATE;`);
  await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_photo_name VARCHAR(255);`);
  await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_photo_mime VARCHAR(120);`);
  await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_photo_data BYTEA;`);
  await query(`ALTER TABLE fuel_entries ADD COLUMN IF NOT EXISTS company_name VARCHAR(120);`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS module_access TEXT[] NOT NULL DEFAULT ARRAY['dashboard'];`);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_status') THEN
        CREATE TYPE trip_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
      END IF;
    END $$;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS trip_runs (
      id BIGSERIAL PRIMARY KEY,
      trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
      shift_label VARCHAR(50) NOT NULL,
      bus_id BIGINT NOT NULL REFERENCES buses(id),
      driver_id BIGINT NOT NULL REFERENCES drivers(id),
      route_id BIGINT NOT NULL REFERENCES routes(id),
      assignment_id BIGINT REFERENCES bus_assignments(id),
      status trip_status NOT NULL DEFAULT 'planned',
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      odometer_start_km NUMERIC(12,2),
      odometer_end_km NUMERIC(12,2),
      km_run NUMERIC(12,2),
      liters_filled NUMERIC(10,2),
      mileage_kmpl NUMERIC(10,2),
      remarks TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(bus_id, trip_date, shift_label)
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_trip_runs_date_status ON trip_runs(trip_date, status);`);
  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES users(id),
      user_email VARCHAR(160),
      action VARCHAR(40) NOT NULL,
      entity_type VARCHAR(60) NOT NULL,
      entity_id BIGINT,
      details JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);`);
  await ensureDocumentTables();
}
