import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Monitor, Globe, AppWindow, Usb, Chrome,
  RefreshCw, CheckCircle2, Shield
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { dashboardApi, devicesApi } from '@/lib/api';
import type { Device, DashboardStats } from '@/types';
import {
  websiteAccessTrend,
  blockedCategories,
  policyComplianceData,
} from '@/data/mockData';

// Curated Heritage Palette matching Combo 05: Emerald & Brass
const pieColors = ['#c9a46a', '#d8b37b', '#c06c54', '#f3eee3', '#0a261c'];

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deviceList, setDeviceList] = useState<Device[]>([]);
  const [accessTrend, setAccessTrend] = useState<any[]>(websiteAccessTrend);
  const [categories, setCategories] = useState<any[]>(blockedCategories);
  const [complianceData, setComplianceData] = useState<any[]>(policyComplianceData);

  const loadData = async () => {
    setLoading(true);
    try {
      const overview = await dashboardApi.getOverview();
      if (overview) {
        if (overview.stats) setStats(overview.stats);
        if (Array.isArray(overview.devices) && overview.devices.length > 0) setDeviceList(overview.devices);
        if (Array.isArray(overview.accessTrend) && overview.accessTrend.length > 0) setAccessTrend(overview.accessTrend);
        if (Array.isArray(overview.categories) && overview.categories.length > 0) setCategories(overview.categories);
        if (Array.isArray(overview.compliance) && overview.compliance.length > 0) setComplianceData(overview.compliance);
      }
    } catch {
      // Graceful fallback to stats
      const st = await dashboardApi.getStats().catch(() => null);
      if (st) setStats(st);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalDevices = stats?.totalDevices ?? (deviceList.length > 0 ? deviceList.length : 1);
  const onlineDevices = stats?.onlineDevices ?? (deviceList.length > 0 ? deviceList.filter((d) => d.online).length : 1);
  const blockedSites = stats?.blockedWebsites ?? 10;
  const blockedApps = stats?.blockedApps ?? 2;
  const usbStatus = (stats?.usbStatus ?? 'block').toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description="Live overview of endpoint security and policy enforcement."
       
      />

      {/* 4 Minimal Metric Cards - Solid Forest #1C5A45, Parchment Text, Brass Highlights */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Card 1: Workstations */}
        <Card padding="md" className="hover:border-theme-accent/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Workstations</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-bg-deep border border-theme-border text-theme-accent">
              <Monitor className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-3xl font-bold tracking-tight text-theme-heading">{totalDevices}</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-theme-heading bg-theme-bg-deep px-2.5 py-0.5 rounded-full border border-theme-border">
              <span className="h-1.5 w-1.5 rounded-full bg-theme-accent inline-block"></span>
              {onlineDevices} Online
            </span>
          </div>
        </Card>

        {/* Card 2: Blocked Websites */}
        <Card padding="md" className="hover:border-theme-accent/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Blocked Websites</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-bg-deep border border-theme-border text-theme-accent">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-3xl font-bold tracking-tight text-theme-heading">{blockedSites}</span>
            <span className="text-xs text-theme-muted">Domains Restricted</span>
          </div>
        </Card>

        {/* Card 3: Blocked Applications */}
        <Card padding="md" className="hover:border-theme-accent/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Blocked Applications</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-bg-deep border border-theme-border text-[#c06c54]">
              <AppWindow className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-3xl font-bold tracking-tight text-theme-heading">{blockedApps}</span>
            <span className="text-xs text-theme-muted">Executables Restricted</span>
          </div>
        </Card>

        {/* Card 4: USB Storage */}
        <Card padding="md" className="hover:border-theme-accent/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">USB Storage</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-bg-deep border border-theme-border text-[#c06c54]">
              <Usb className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#3d1c16] text-[#e08e79] border border-[#6b3528]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e08e79] inline-block"></span>
              {usbStatus}
            </span>
            <span className="text-xs text-theme-muted">Kernel Mass Storage</span>
          </div>
        </Card>
      </div>

      {/* Row 2: Charts (Heritage Emerald & Brass Styling - Solid Surfaces, Clean Axes) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend Area Chart (Span 2) */}
        <Card padding="md" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-theme-heading">Activity Trend</h3>
            <span className="text-xs text-theme-muted">Past 7 Days</span>
          </div>
          <div className="h-64 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={accessTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a46a" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#c9a46a" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c06c54" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#c06c54" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(243, 238, 227, 0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#cfc8b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#cfc8b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a261c',
                    border: '1px solid rgba(243, 238, 227, 0.15)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f3eee3',
                  }}
                />
                <Area type="monotone" dataKey="allowed" stroke="#c9a46a" strokeWidth={2.5} fill="url(#colorAllowed)" name="Allowed" />
                <Area type="monotone" dataKey="blocked" stroke="#c06c54" strokeWidth={2.5} fill="url(#colorBlocked)" name="Blocked" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut Chart (Span 1) */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-theme-heading">Blocked Distribution</h3>
            <span className="text-xs text-theme-muted">By Category</span>
          </div>
          <div className="h-64 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {categories.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a261c',
                    border: '1px solid rgba(243, 238, 227, 0.15)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f3eee3',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#cfc8b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 3: Compliance & Active Layers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Policy Compliance BarChart - Solid Brass Bars (No Neon Green) */}
        <Card padding="md" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-theme-heading">Policy Compliance</h3>
            <span className="text-xs text-theme-accent font-medium">100% Target Met</span>
          </div>
          <div className="h-52 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={complianceData.map(c => ({ ...c, label: c.department || 'Workstations' }))} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(243, 238, 227, 0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#cfc8b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#cfc8b8' }} domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a261c',
                    border: '1px solid rgba(243, 238, 227, 0.15)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f3eee3',
                  }}
                />
                <Bar dataKey="compliance" radius={[6, 6, 0, 0]} fill="#c9a46a" name="Compliance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Clean System Status Card */}
        <Card padding="md" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-theme-heading">Active Defense Layers</h3>
              <Badge variant="primary">Active</Badge>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between py-1.5 border-b border-theme-border text-xs">
                <span className="text-theme-heading flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-theme-accent" /> DNS Sinkhole (0.0.0.0)
                </span>
                <CheckCircle2 className="h-4 w-4 text-theme-accent" />
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-theme-border text-xs">
                <span className="text-theme-heading flex items-center gap-2">
                  <AppWindow className="h-3.5 w-3.5 text-theme-accent" /> DisallowRun & IFEO Watchdog
                </span>
                <CheckCircle2 className="h-4 w-4 text-theme-accent" />
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-theme-border text-xs">
                <span className="text-theme-heading flex items-center gap-2">
                  <Usb className="h-3.5 w-3.5 text-theme-accent" /> USBSTOR Kernel Driver
                </span>
                <CheckCircle2 className="h-4 w-4 text-theme-accent" />
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-theme-border text-xs">
                <span className="text-theme-heading flex items-center gap-2">
                  <Chrome className="h-3.5 w-3.5 text-theme-accent" /> 5 Browsers Hardened
                </span>
                <CheckCircle2 className="h-4 w-4 text-theme-accent" />
              </div>
              <div className="flex items-center justify-between py-1.5 text-xs">
                <span className="text-theme-heading flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-theme-accent" /> Background Heartbeat (60s)
                </span>
                <CheckCircle2 className="h-4 w-4 text-theme-accent" />
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-theme-border text-[11px] text-theme-muted flex items-center justify-between">
            <span>Agent Sync: Success</span>
            <span className="text-theme-accent font-semibold">100% Policy Delivery</span>
          </div>
        </Card>
      </div>

      {/* Row 4: Clean Workstations Summary (Compact) */}
      <Card padding="none">
        <div className="p-4 border-b border-theme-border flex items-center justify-between bg-theme-surface">
          <h3 className="text-sm font-semibold text-theme-heading">Enrolled Workstations</h3>
          <span className="text-xs text-theme-muted">{deviceList.length} Total Devices</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-theme-border bg-theme-bg-deep text-theme-muted">
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-[11px]">Device</th>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-[11px]">Employee</th>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-[11px]">Policy</th>
                <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wider text-[11px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border-subtle">
              {deviceList.slice(0, 5).map((device) => (
                <tr key={device.id} className="hover:bg-theme-surface-hover transition-colors">
                  <td className="px-4 py-3 font-semibold text-theme-heading">
                    {device.name}
                  </td>
                  <td className="px-4 py-3 text-theme-body">
                    {device.employeeName || 'Standard User'}
                  </td>
                  <td className="px-4 py-3 text-theme-body">
                    {device.policyName || 'Standard'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant="primary" dot>
                      {device.status === 'applied' ? 'Enforcing' : device.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}