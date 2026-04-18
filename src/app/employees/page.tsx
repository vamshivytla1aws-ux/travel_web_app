import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EnterprisePageHeader } from "@/components/enterprise/enterprise-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireSession } from "@/lib/auth";
import { requireModuleAccess } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { query } from "@/lib/db";
import { EmployeesService } from "@/services/employees.service";

const employeesService = new EmployeesService();

async function createEmployee(formData: FormData) {
  "use server";
  const session = await requireSession(["admin", "dispatcher"]);
  await requireModuleAccess("employees");
  const employeeCode = String(formData.get("employeeCode"));
  const email = String(formData.get("email") ?? "").trim() || null;
  const existing = await query<{ id: number }>(
    `SELECT id FROM employees
     WHERE employee_code = $1
        OR ($2::varchar IS NOT NULL AND email IS NOT NULL AND lower(email) = lower($2::varchar))
     LIMIT 1`,
    [employeeCode, email],
  );
  if ((existing.rowCount ?? 0) > 0) {
    redirect("/employees?error=duplicate");
  }

  const result = await query<{ id: number }>(
    `INSERT INTO employees(
      employee_code, full_name, phone, email, company_name, gender, blood_group, valid_from, valid_to,
      department, shift_start, shift_end, pickup_address, drop_address
    )
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING id`,
    [
      employeeCode,
      String(formData.get("fullName")),
      String(formData.get("phone")),
      email,
      String(formData.get("companyName")) || null,
      String(formData.get("gender")) || null,
      String(formData.get("bloodGroup")) || null,
      String(formData.get("validFrom")) || null,
      String(formData.get("validTo")) || null,
      String(formData.get("department")),
      "09:00:00",
      "18:00:00",
      String(formData.get("pickupAddress")),
      String(formData.get("dropAddress")),
    ],
  );
  await logAuditEvent({ session, action: "create", entityType: "employee", entityId: result.rows[0].id, details: { employeeCode, email } });
  revalidatePath("/employees");
  redirect("/employees?created=1");
}

async function deleteEmployee(formData: FormData) {
  "use server";
  const session = await requireSession(["admin", "dispatcher"]);
  await requireModuleAccess("employees");
  const employeeId = Number(formData.get("employeeId"));
  if (!employeeId) return;

  await query(`UPDATE employees SET is_active = false, updated_at = NOW() WHERE id = $1`, [employeeId]);
  await logAuditEvent({ session, action: "delete", entityType: "employee", entityId: employeeId });
  revalidatePath("/employees");
  redirect("/employees?deleted=1");
}

type Props = {
  searchParams: Promise<{ error?: string; created?: string; deleted?: string }>;
};

export default async function EmployeesPage(props: Props) {
  await requireSession();
  await requireModuleAccess("employees");
  const searchParams = await props.searchParams;
  const employees = await employeesService.listEmployees();

  return (
    <AppShell>
      <EnterprisePageHeader
        title="Employee Transport Roster"
        subtitle="Manage employee pickup/drop assignments and department coverage"
        icon={Users}
        tag="Workforce"
      />
      {searchParams.error === "duplicate" ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Employee code or email already exists.
        </div>
      ) : null}
      {searchParams.created === "1" ? (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Employee created successfully.
        </div>
      ) : null}
      {searchParams.deleted === "1" ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Employee deleted successfully.
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-blue-200/70 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader><CardTitle>Create Employee</CardTitle></CardHeader>
          <CardContent>
            <form action={createEmployee} className="grid gap-2">
              <Label htmlFor="employeeCode">Code</Label><Input id="employeeCode" name="employeeCode" required />
              <Label htmlFor="fullName">Name</Label><Input id="fullName" name="fullName" required />
              <Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" required />
              <Label htmlFor="email">Email (optional)</Label><Input id="email" name="email" type="email" />
              <Label htmlFor="companyName">Company Name</Label><Input id="companyName" name="companyName" required />
              <Label htmlFor="gender">Gender</Label>
              <select id="gender" name="gender" className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" required>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <Label htmlFor="bloodGroup">Blood Group</Label><Input id="bloodGroup" name="bloodGroup" placeholder="B+" />
              <Label htmlFor="validFrom">Valid From</Label><Input id="validFrom" name="validFrom" type="date" />
              <Label htmlFor="validTo">Valid To / Expiry</Label><Input id="validTo" name="validTo" type="date" />
              <Label htmlFor="department">Department</Label><Input id="department" name="department" required />
              <Label htmlFor="pickupAddress">Pickup Address</Label><Input id="pickupAddress" name="pickupAddress" required />
              <Label htmlFor="dropAddress">Drop Address</Label><Input id="dropAddress" name="dropAddress" required />
              <Button type="submit">Save</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 border-blue-200/70 dark:border-blue-900">
          <CardHeader><CardTitle>Employees</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>S.No</TableHead><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Department</TableHead><TableHead>Phone</TableHead><TableHead>Company</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {employees.slice(0, 100).map((employee, index) => (
                  <TableRow key={employee.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{employee.employeeCode}</TableCell>
                    <TableCell>
                      <Link className="text-blue-600 hover:underline" href={`/employees/${employee.id}`}>
                        {employee.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.phone ?? "-"}</TableCell>
                    <TableCell>{employee.companyName ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <form action={deleteEmployee}>
                        <input type="hidden" name="employeeId" value={employee.id} />
                        <ConfirmSubmitButton
                          label="Delete"
                          message="Are you sure you want to delete this employee?"
                          className="inline-flex h-8 items-center rounded-md bg-destructive px-3 text-xs text-destructive-foreground hover:opacity-90"
                        />
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
