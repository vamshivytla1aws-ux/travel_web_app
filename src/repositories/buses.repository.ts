import { query } from "@/lib/db";
import { Bus } from "@/lib/types";

type BusRow = {
  id: number;
  bus_number: string;
  registration_number: string;
  make: string;
  model: string;
  seater: number;
  odometer_km: string;
  previous_day_mileage_kmpl: string | null;
  status: Bus["status"];
  last_service_at: string | null;
};

function mapBus(row: BusRow): Bus {
  return {
    id: row.id,
    busNumber: row.bus_number,
    registrationNumber: row.registration_number,
    make: row.make,
    model: row.model,
    seater: row.seater,
    odometerKm: Number(row.odometer_km),
    previousDayMileageKmpl:
      row.previous_day_mileage_kmpl !== null ? Number(row.previous_day_mileage_kmpl) : null,
    status: row.status,
    lastServiceAt: row.last_service_at,
  };
}

export class BusesRepository {
  async list(search = "", status?: Bus["status"]): Promise<Bus[]> {
    const params: unknown[] = [];
    const where: string[] = [];

    if (search) {
      params.push(`%${search}%`);
      where.push(
        `(bus_number ILIKE $${params.length} OR registration_number ILIKE $${params.length})`,
      );
    }
    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const sql = `
      SELECT
        b.id,
        b.bus_number,
        b.registration_number,
        b.make,
        b.model,
        b.seater,
        b.odometer_km,
        pd.previous_day_mileage_kmpl,
        b.status,
        b.last_service_at
      FROM buses b
      LEFT JOIN (
        SELECT
          bus_id,
          (
            SUM(odometer_after_km - odometer_before_km) /
            NULLIF(SUM(liters), 0)
          )::text AS previous_day_mileage_kmpl
        FROM fuel_entries
        WHERE DATE(filled_at) = CURRENT_DATE - INTERVAL '1 day'
        GROUP BY bus_id
      ) pd ON pd.bus_id = b.id
      ${whereSql}
      ORDER BY b.id DESC
    `;
    const result = await query<BusRow>(sql, params);
    return result.rows.map(mapBus);
  }

  async getById(id: number): Promise<Bus | null> {
    const result = await query<BusRow>(
      `SELECT b.id, b.bus_number, b.registration_number, b.make, b.model, b.seater, b.odometer_km,
              pd.previous_day_mileage_kmpl, b.status, b.last_service_at
       FROM buses b
       LEFT JOIN (
         SELECT
           bus_id,
           (
             SUM(odometer_after_km - odometer_before_km) /
             NULLIF(SUM(liters), 0)
           )::text AS previous_day_mileage_kmpl
         FROM fuel_entries
         WHERE DATE(filled_at) = CURRENT_DATE - INTERVAL '1 day'
         GROUP BY bus_id
       ) pd ON pd.bus_id = b.id
       WHERE b.id = $1`,
      [id],
    );
    return result.rows[0] ? mapBus(result.rows[0]) : null;
  }
}
