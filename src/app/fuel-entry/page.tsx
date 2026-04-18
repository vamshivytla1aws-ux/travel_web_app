import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/app-shell";
import { EnterprisePageHeader } from "@/components/enterprise/enterprise-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fuel } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { requireModuleAccess } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { FuelService } from "@/services/fuel.service";

const fuelService = new FuelService();

async function submitFuel(formData: FormData) {
  "use server";
  const session = await requireSession(["admin", "fuel_manager", "dispatcher"]);
  await requireModuleAccess("fuel-entry");

  await fuelService.addFuelEntry({
    busId: Number(formData.get("busId")),
    driverId: formData.get("driverId") ? Number(formData.get("driverId")) : null,
    odometerBeforeKm: Number(formData.get("odometerBeforeKm")),
    odometerAfterKm: Number(formData.get("odometerAfterKm")),
    liters: Number(formData.get("liters")),
    amount: Number(formData.get("amount")),
    fuelStation: String(formData.get("fuelStation") ?? ""),
  });
  await logAuditEvent({
    session,
    action: "create",
    entityType: "fuel_entry",
    details: { busId: Number(formData.get("busId")), liters: Number(formData.get("liters")) },
  });

  revalidatePath("/dashboard");
}

export default async function FuelEntryPage() {
  await requireSession(["admin", "fuel_manager", "dispatcher"]);
  await requireModuleAccess("fuel-entry");
  return (
    <AppShell>
      <EnterprisePageHeader
        title="Diesel Entry"
        subtitle="Capture fuel transactions and mileage metrics"
        icon={Fuel}
        tag="Fuel Ops"
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Diesel Entry and Mileage Calculation</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submitFuel} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="busId">Bus ID</Label>
              <Input id="busId" name="busId" type="number" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="driverId">Driver ID</Label>
              <Input id="driverId" name="driverId" type="number" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="odometerBeforeKm">Odometer Before (km)</Label>
              <Input id="odometerBeforeKm" name="odometerBeforeKm" type="number" step="0.01" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="odometerAfterKm">Odometer After (km)</Label>
              <Input id="odometerAfterKm" name="odometerAfterKm" type="number" step="0.01" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="liters">Diesel (liters)</Label>
              <Input id="liters" name="liters" type="number" step="0.01" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fuelStation">Fuel Station</Label>
              <Input id="fuelStation" name="fuelStation" />
            </div>
            <Button type="submit">Save Entry</Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
