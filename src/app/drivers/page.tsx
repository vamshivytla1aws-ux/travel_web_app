import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CarFront } from "lucide-react";
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
import { ensureTransportEnhancements } from "@/lib/schema-ensure";
import { DriversService } from "@/services/drivers.service";

const driversService = new DriversService();

async function createDriver(formData: FormData) {
  "use server";
  const session = await requireSession(["admin", "dispatcher"]);
  await requireModuleAccess("drivers");
  await ensureTransportEnhancements();
  const phone = String(formData.get("phone"));
  const licenseNumber = String(formData.get("licenseNumber"));
  const companyName = String(formData.get("companyName"));
  const bankName = String(formData.get("bankName") ?? "");
  const bankAccountNumber = String(formData.get("bankAccountNumber") ?? "");
  const bankIfsc = String(formData.get("bankIfsc") ?? "");
  const pfAccountNumber = String(formData.get("pfAccountNumber") ?? "");
  const uanNumber = String(formData.get("uanNumber") ?? "");

  const existing = await query<{ id: number }>(
    `SELECT id
     FROM drivers
     WHERE phone = $1 OR license_number = $2
     LIMIT 1`,
    [phone, licenseNumber],
  );
  if ((existing.rowCount ?? 0) > 0) {
    redirect("/drivers?error=duplicate");
  }

  const result = await query<{ id: number }>(
    `INSERT INTO drivers(
      full_name, phone, company_name, bank_name, bank_account_number, bank_ifsc, pf_account_number, uan_number,
      license_number, license_expiry, experience_years
    )
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [
      String(formData.get("fullName")),
      phone,
      companyName,
      bankName || null,
      bankAccountNumber || null,
      bankIfsc || null,
      pfAccountNumber || null,
      uanNumber || null,
      licenseNumber,
      String(formData.get("licenseExpiry")),
      Number(formData.get("experienceYears")),
    ],
  );
  await logAuditEvent({ session, action: "create", entityType: "driver", entityId: result.rows[0].id, details: { phone, licenseNumber } });
  revalidatePath("/drivers");
  redirect("/drivers?created=1");
}

async function deleteDriver(formData: FormData) {
  "use server";
  const session = await requireSession(["admin", "dispatcher"]);
  await requireModuleAccess("drivers");
  const driverId = Number(formData.get("driverId"));
  if (!driverId) return;

  await query(`UPDATE drivers SET is_active = false, updated_at = NOW() WHERE id = $1`, [driverId]);
  await logAuditEvent({ session, action: "delete", entityType: "driver", entityId: driverId });
  revalidatePath("/drivers");
  redirect("/drivers?deleted=1");
}

type Props = {
  searchParams: Promise<{ error?: string; created?: string; deleted?: string }>;
};

export default async function DriversPage(props: Props) {
  await requireSession();
  await requireModuleAccess("drivers");
  await ensureTransportEnhancements();
  const searchParams = await props.searchParams;
  const drivers = await driversService.listDrivers();

  return (
    <AppShell>
      <EnterprisePageHeader
        title="Driver Operations"
        subtitle="Maintain licensed driver profiles and contact readiness"
        icon={CarFront}
        tag="Driver Ops"
      />
      {searchParams.error === "duplicate" ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Driver phone or license number already exists.
        </div>
      ) : null}
      {searchParams.created === "1" ? (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Driver created successfully.
        </div>
      ) : null}
      {searchParams.deleted === "1" ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Driver deleted successfully.
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-emerald-200/70 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardHeader><CardTitle>Create Driver</CardTitle></CardHeader>
          <CardContent>
            <form action={createDriver} className="grid gap-2">
              <Label htmlFor="fullName">Name</Label><Input id="fullName" name="fullName" required />
              <Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" required />
              <Label htmlFor="companyName">Company Name</Label><Input id="companyName" name="companyName" required />
              <Label htmlFor="licenseNumber">License</Label><Input id="licenseNumber" name="licenseNumber" required />
              <Label htmlFor="bankName">Bank Name</Label><Input id="bankName" name="bankName" />
              <Label htmlFor="bankAccountNumber">Bank Account Number</Label><Input id="bankAccountNumber" name="bankAccountNumber" />
              <Label htmlFor="bankIfsc">IFSC</Label><Input id="bankIfsc" name="bankIfsc" />
              <Label htmlFor="pfAccountNumber">PF Account</Label><Input id="pfAccountNumber" name="pfAccountNumber" />
              <Label htmlFor="uanNumber">UAN</Label><Input id="uanNumber" name="uanNumber" />
              <Label htmlFor="licenseExpiry">License Expiry</Label><Input id="licenseExpiry" name="licenseExpiry" type="date" required />
              <Label htmlFor="experienceYears">Experience (Years)</Label><Input id="experienceYears" name="experienceYears" type="number" required />
              <Button type="submit">Save</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 border-emerald-200/70 dark:border-emerald-900">
          <CardHeader><CardTitle>Drivers</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>S.No</TableHead><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Company</TableHead><TableHead>License</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {drivers.slice(0, 100).map((driver, index) => (
                  <TableRow key={driver.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Link className="text-blue-600 hover:underline" href={`/drivers/${driver.id}`}>
                        {driver.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{driver.phone}</TableCell>
                    <TableCell>{driver.companyName ?? "-"}</TableCell>
                    <TableCell>{driver.licenseNumber}</TableCell>
                    <TableCell className="text-right">
                      <form action={deleteDriver}>
                        <input type="hidden" name="driverId" value={driver.id} />
                        <ConfirmSubmitButton
                          label="Delete"
                          message="Are you sure you want to delete this driver?"
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
