import { AppShell } from "@/components/app-shell";
import { EnterprisePageHeader } from "@/components/enterprise/enterprise-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPinned } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { requireModuleAccess } from "@/lib/auth";
import { query } from "@/lib/db";

export default async function TrackingPage() {
  await requireSession();
  await requireModuleAccess("tracking");
  const logs = await query<{
    bus_number: string;
    logged_at: string;
    latitude: string;
    longitude: string;
    speed_kmph: string;
  }>(
    `SELECT b.bus_number, g.logged_at::text, g.latitude::text, g.longitude::text, g.speed_kmph::text
     FROM gps_logs g
     JOIN buses b ON b.id = g.bus_id
     ORDER BY g.logged_at DESC
     LIMIT 100`,
  );

  return (
    <AppShell>
      <EnterprisePageHeader
        title="Live Tracking"
        subtitle="Track current GPS positions and speed snapshots"
        icon={MapPinned}
        tag="Tracking"
      />
      <Card>
        <CardHeader>
          <CardTitle>Mock Live Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bus</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Latitude</TableHead>
                <TableHead>Longitude</TableHead>
                <TableHead>Speed (km/h)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.rows.map((log, idx) => (
                <TableRow key={`${log.bus_number}-${idx}`}>
                  <TableCell>{log.bus_number}</TableCell>
                  <TableCell>{new Date(log.logged_at).toLocaleString()}</TableCell>
                  <TableCell>{Number(log.latitude).toFixed(5)}</TableCell>
                  <TableCell>{Number(log.longitude).toFixed(5)}</TableCell>
                  <TableCell>{Number(log.speed_kmph).toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
