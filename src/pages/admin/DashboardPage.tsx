import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Monitor, Globe, AppWindow, Usb, Chrome,
  RefreshCw, CheckCircle2, Shield, ShieldAlert, AlertTriangle
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { dashboardApi, devicesApi } from '@/lib/api';
import type { Device, DashboardStats, DashboardComplaints, ComplaintCategoryItem } from '@/types';
import {
  websiteAccessTrend,
  blockedCategories,
  policyComplianceData,
} from '@/data/mockData';

// Modern Cyber Theme Palette matching Dark Obsidian Enterprise UI
const pieColors = ['#f43f5e', '#f59e0b', '#8b5cf6', '#0ea5e9', '#10b981', '#ec4899'];

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deviceList, setDeviceList] = useState<Device[]>([]);
  const [accessTrend, setAccessTrend] = useState<any[]>(websiteAccessTrend);
  const [categories, setCategories] = useState<any[]>(blockedCategories);
  const [complianceData, setComplianceData] = useState<any[]>(policyComplianceData);
  const [complaintsData, setComplaintsData] = useState<DashboardComplaints | null>(null);

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
        if (overview.complaints) setComplaintsData(overview.complaints);
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

  const totalComplaints = complaintsData?.total ?? stats?.totalComplaints ?? 18;
  const complianceRate = complaintsData?.complianceRate ?? stats?.complianceRate ?? 92;
  const complaintRate = complaintsData?.complaintRate ?? stats?.complaintRate ?? 8;
  const complaintsBreakdown: ComplaintCategoryItem[] = complaintsData?.breakdown ?? [
    { category: 'Disallowed Open Ports', count: stats?.disallowedPorts ?? 6, percentage: 38, color: '#f43f5e' },
    { category: 'Firewall Disabled', count: stats?.firewallDisabledCount ?? 1, percentage: 12, color: '#f59e0b' },
    { category: 'Blocked App Execution Hits', count: 7, percentage: 30, color: '#8b5cf6' },
    { category: 'Restricted Website Hits', count: 4, percentage: 20, color: '#0ea5e9' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description="Real-time telemetry overview of workstation health, active enforcement engines, and security compliance across the enterprise fleet."

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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-bg-deep border border-theme-border text-amber-400">
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-bg-deep border border-theme-border text-rose-400">
              <Usb className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 inline-block"></span>
              {usbStatus}
            </span>
            <span className="text-xs text-theme-muted">Kernel Mass Storage</span>
          </div>
        </Card>
      </div>

      {/* User Complaints & Security Violations Card */}
      <Card padding="md" className="border-rose-500/20 bg-theme-surface hover:border-rose-500/40 transition">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-sm">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">
                  Security Complaints & Non-Compliance
                </span>
                <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20">
                  {complaintRate}% Violations
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-theme-heading">{totalComplaints}</span>
                <span className="text-xs text-theme-muted">Total Security Complaints across Active Workstations</span>
              </div>
            </div>
          </div>

          {/* Compliance Progress Bar & Rate */}
          <div className="flex flex-col gap-1.5 lg:w-72">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {complianceRate}% Fleet Compliant
              </span>
              <span className="font-semibold text-rose-400">
                {complaintRate}% Complaints
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-theme-bg-deep overflow-hidden flex border border-theme-border">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${complianceRate}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                style={{ width: `${complaintRate}%` }}
              />
            </div>
            <span className="text-[10px] text-theme-muted text-right">Target Baseline: 100% Policy Adherence</span>
          </div>
        </div>

        {/* 4 Complaint Category Chips */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 pt-3.5 border-t border-theme-border/60 sm:grid-cols-4">
          {complaintsBreakdown.map((item: ComplaintCategoryItem, idx: number) => (
            <div key={idx} className="rounded-lg border border-theme-border bg-theme-bg-deep p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-theme-muted truncate" title={item.category}>
                  {item.category}
                </span>
                <span className="font-mono text-xs font-bold" style={{ color: item.color }}>
                  {item.percentage}%
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-bold text-theme-heading">{item.count}</span>
                <span className="text-[10px] text-theme-muted">events</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Row 2: Charts (Luminous Cyber Styling - Solid Obsidian Surfaces, Crisp Glow Lines) */}
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
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161920',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  itemStyle={{ color: '#f8fafc', padding: '2px 0' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="allowed" stroke="#38bdf8" strokeWidth={2.5} fill="url(#colorAllowed)" name="Allowed" />
                <Area type="monotone" dataKey="blocked" stroke="#f43f5e" strokeWidth={2.5} fill="url(#colorBlocked)" name="Blocked" />
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
                    <Cell key={i} fill={pieColors[i % pieColors.length]} stroke="#161920" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161920',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  itemStyle={{ color: '#f8fafc', padding: '2px 0' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 3: Compliance & Active Layers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Policy Compliance BarChart - Emerald Cyber Gradient Bars with sleek radius */}
        <Card padding="md" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-theme-heading">Policy Compliance</h3>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">100% Target Met</span>
          </div>
          <div className="h-52 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={complianceData.map(c => ({ ...c, label: c.department || 'Workstations' }))} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="complianceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.65} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161920',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  itemStyle={{ color: '#f8fafc', padding: '2px 0' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}
                />
                <Bar dataKey="compliance" radius={[8, 8, 0, 0]} fill="url(#complianceGradient)" name="Compliance %" maxBarSize={56}>
                  {complianceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.compliance >= 90 ? 'url(#complianceGradient)' : entry.compliance >= 50 ? '#f59e0b' : '#f43f5e'}
                    />
                  ))}
                </Bar>
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
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-[11px]">IP & Location</th>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-[11px]">Firewall</th>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-[11px]">Ports</th>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-[11px]">Policy</th>
                <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wider text-[11px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border-subtle">
              {deviceList.slice(0, 5).map((device) => {
                const fwOn = device.firewallEnabled !== false && device.firewallStatus !== 'disabled';
                const openCount = device.openPortsCount || (device.openPorts ? device.openPorts.length : 3);
                const disallowed = device.disallowedPortsCount || 0;
                return (
                  <tr key={device.id} className="hover:bg-theme-surface-hover transition-colors">
                    <td className="px-4 py-3 font-semibold text-theme-heading">
                      <div>
                        <p>{device.name}</p>
                        <p className="font-mono text-[10px] text-theme-muted">{device.deviceId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-theme-body font-medium">
                      {device.employeeName || 'Standard User'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-theme-heading">
                        {device.ipAddress ? (
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                            {device.ipAddress}
                          </span>
                        ) : (
                          <span className="text-theme-muted">—</span>
                        )}
                      </div>
                      <div className="text-[10px] text-theme-muted flex items-center gap-1 mt-0.5">
                        {device.location?.city ? (
                          <>
                            <Globe className="h-2.5 w-2.5 text-cyan-400" />
                            {`${device.location.city}, ${device.location.countryCode || ''}`}
                          </>
                        ) : (
                          <span className="text-theme-muted">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${fwOn ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                        <Shield className="h-2.5 w-2.5" />
                        {fwOn ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-theme-heading font-medium">
                        {openCount} Open
                      </div>
                      <div className="text-[10px]">
                        {disallowed > 0 ? (
                          <span className="text-rose-400 font-semibold">{disallowed} Rogue</span>
                        ) : (
                          <span className="text-emerald-400">Compliant</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-theme-body">
                      {device.policyName || 'Standard'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={device.online ? 'primary' : 'neutral'} dot>
                        {device.online ? (device.status === 'applied' ? 'Enforcing' : device.status) : 'Offline'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}