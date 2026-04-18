import { AppShell } from "@/components/app-shell";
import { DashboardLiveStats } from "@/components/dashboard/dashboard-live-stats";
import { EnterprisePageHeader } from "@/components/enterprise/enterprise-page-header";
import { Gauge } from "lucide-react";
import { FuelTrendChart } from "@/components/fuel-trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardService } from "@/services/dashboard.service";
import { requireSession } from "@/lib/auth";
import { requireModuleAccess } from "@/lib/auth";

const dashboardService = new DashboardService();

export default async function DashboardPage() {
  await requireSession();
  await requireModuleAccess("dashboard");
  const data = await dashboardService.getSummary();

  return (
    <AppShell>
      <div className="space-y-6">
        <EnterprisePageHeader
          title="Operations Dashboard"
          subtitle="Fleet health, fuel trends, and recent transport activity"
          icon={Gauge}
          tag="Control Center"
        />
        <div className="-mt-5 px-1">
          <DashboardLiveStats />
        </div>
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Buses</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{data.fleet.total}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Drivers</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{data.drivers.total}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Buses</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{data.fleet.active}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Employees Served</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{data.employees.total}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Fuel Today (L)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {Number(data.fuelToday.liters).toFixed(2)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Trips In Progress</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{data.tripStats.in_progress}</CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Fuel Trend (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <FuelTrendChart data={data.fuelTrend} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Trip Snapshot Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded border p-2">
                <span>Planned</span>
                <span className="font-semibold">{data.tripStats.planned}</span>
              </div>
              <div className="flex items-center justify-between rounded border p-2">
                <span>In Progress</span>
                <span className="font-semibold">{data.tripStats.in_progress}</span>
              </div>
              <div className="flex items-center justify-between rounded border p-2">
                <span>Completed</span>
                <span className="font-semibold">{data.tripStats.completed}</span>
              </div>
              <div className="flex items-center justify-between rounded border p-2">
                <span>Cancelled</span>
                <span className="font-semibold">{data.tripStats.cancelled}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentActivity.map((event, index) => (
              <div key={`${event.type}-${index}`} className="rounded border p-2 text-sm">
                <p className="font-medium">{event.title}</p>
                <p className="text-xs text-slate-500">{new Date(event.at).toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
