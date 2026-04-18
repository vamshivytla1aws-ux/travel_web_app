import { revalidatePath } from "next/cache";
import { Route } from "lucide-react";
import { AppShell } from "@/components/app-shell";
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
import { RoutesService } from "@/services/routes.service";

const routesService = new RoutesService();

async function createRoute(formData: FormData) {
  "use server";
  const session = await requireSession(["admin", "dispatcher"]);
  await requireModuleAccess("routes");
  const result = await query<{ id: number }>(
    `INSERT INTO routes(route_code, route_name, start_location, end_location, total_distance_km, estimated_duration_minutes)
     VALUES($1,$2,$3,$4,$5,$6)
     RETURNING id`,
    [
      String(formData.get("routeCode")),
      String(formData.get("routeName")),
      String(formData.get("startLocation")),
      String(formData.get("endLocation")),
      Number(formData.get("totalDistanceKm")),
      Number(formData.get("estimatedDurationMinutes")),
    ],
  );
  await logAuditEvent({ session, action: "create", entityType: "route", entityId: result.rows[0].id });
  revalidatePath("/routes");
}

export default async function RoutesPage() {
  await requireSession();
  await requireModuleAccess("routes");
  const routes = await routesService.listRoutes();

  return (
    <AppShell>
      <EnterprisePageHeader
        title="Route Planner"
        subtitle="Design route coverage and optimize travel distance for shifts"
        icon={Route}
        tag="Route Design"
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-violet-200/70 bg-violet-50/40 dark:border-violet-900 dark:bg-violet-950/20">
          <CardHeader><CardTitle>Create Route</CardTitle></CardHeader>
          <CardContent>
            <form action={createRoute} className="grid gap-2">
              <Label htmlFor="routeCode">Code</Label><Input id="routeCode" name="routeCode" required />
              <Label htmlFor="routeName">Name</Label><Input id="routeName" name="routeName" required />
              <Label htmlFor="startLocation">Start</Label><Input id="startLocation" name="startLocation" required />
              <Label htmlFor="endLocation">End</Label><Input id="endLocation" name="endLocation" required />
              <Label htmlFor="totalDistanceKm">Distance (km)</Label><Input id="totalDistanceKm" name="totalDistanceKm" type="number" step="0.01" required />
              <Label htmlFor="estimatedDurationMinutes">Duration (min)</Label><Input id="estimatedDurationMinutes" name="estimatedDurationMinutes" type="number" required />
              <Button type="submit">Save</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 border-violet-200/70 dark:border-violet-900">
          <CardHeader><CardTitle>Routes</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Distance</TableHead></TableRow></TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell>{route.routeCode}</TableCell>
                    <TableCell>{route.routeName}</TableCell>
                    <TableCell>{route.totalDistanceKm.toFixed(2)} km</TableCell>
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
