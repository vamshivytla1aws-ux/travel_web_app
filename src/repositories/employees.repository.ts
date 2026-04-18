import { query } from "@/lib/db";
import { Employee } from "@/lib/types";

type EmployeeRow = {
  id: number;
  employee_code: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  gender: string | null;
  blood_group: string | null;
  valid_from: string | null;
  valid_to: string | null;
  has_profile_photo: boolean;
  department: string;
  shift_start: string;
  shift_end: string;
  pickup_address: string;
  drop_address: string;
  is_active: boolean;
};

function mapEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    employeeCode: row.employee_code,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    companyName: row.company_name,
    gender: row.gender,
    bloodGroup: row.blood_group,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    hasProfilePhoto: row.has_profile_photo,
    department: row.department,
    shiftStart: row.shift_start,
    shiftEnd: row.shift_end,
    pickupAddress: row.pickup_address,
    dropAddress: row.drop_address,
    isActive: row.is_active,
  };
}

export class EmployeesRepository {
  async listByDepartment(department?: string): Promise<Employee[]> {
    const result = department
      ? await query<EmployeeRow>(
          `SELECT id, employee_code, full_name, phone, email, company_name, gender, blood_group, valid_from::text, valid_to::text,
                  (profile_photo_data IS NOT NULL) as has_profile_photo,
                  department, shift_start, shift_end, pickup_address, drop_address, is_active
           FROM employees
           WHERE department = $1 AND is_active = true
           ORDER BY full_name ASC`,
          [department],
        )
      : await query<EmployeeRow>(
          `SELECT id, employee_code, full_name, phone, email, company_name, gender, blood_group, valid_from::text, valid_to::text,
                  (profile_photo_data IS NOT NULL) as has_profile_photo,
                  department, shift_start, shift_end, pickup_address, drop_address, is_active
           FROM employees
           WHERE is_active = true
           ORDER BY full_name ASC`,
        );

    return result.rows.map(mapEmployee);
  }

  async getById(id: number): Promise<Employee | null> {
    const result = await query<EmployeeRow>(
      `SELECT id, employee_code, full_name, phone, email, company_name, gender, blood_group, valid_from::text, valid_to::text,
              (profile_photo_data IS NOT NULL) as has_profile_photo,
              department, shift_start, shift_end, pickup_address, drop_address, is_active
       FROM employees
       WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? mapEmployee(result.rows[0]) : null;
  }
}
