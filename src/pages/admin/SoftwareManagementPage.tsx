import { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  AppWindow,
  RefreshCw,
  Ban,
  CheckCircle2,
  Clock,
  Flame,
  MapPin,
  Globe,
  History,
  Calendar,
  Timer,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import SearchInput from '@/components/ui/SearchInput';
import { DataTable } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { devicesApi, applicationRulesApi } from '@/lib/api';
import type { Device, DeviceSoftware, DailyAppUsageResponse, DailyAppUsageItem } from '@/types';

function getLocalDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDuration(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  if (sec < 60) return `${sec}s`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function formatShortTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function SoftwareManagementPage() {
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [softwareLoading, setSoftwareLoading] = useState(false);
  const [softwareList, setSoftwareList] = useState<DeviceSoftware[]>([]);
  const [usageData, setUsageData] = useState<DailyAppUsageResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString(0));
  const [dateRange, setDateRange] = useState<'today' | '7d'>('today');
  const [activeTab, setActiveTab] = useState<'frequently_used' | 'installed' | 'uninstalled'>('frequently_used');
  const [search, setSearch] = useState('');
  const [workingApp, setWorkingApp] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const data = await devicesApi.getAll();
      const list = Array.isArray(data)
        ? data.filter((d: Device) => d.status !== 'uninstalled')
        : [];
      setDevices(list);
      if (list.length > 0 && (!selectedDeviceId || !list.some((d) => (d.id || d.deviceId) === selectedDeviceId))) {
        setSelectedDeviceId(list[0].id || list[0].deviceId);
      }
    } catch {
      toast('Failed to load workstation devices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedDevice = useMemo(() => {
    const active = devices.filter((d) => d.status !== 'uninstalled');
    return active.find((d) => d.id === selectedDeviceId || d.deviceId === selectedDeviceId) || active[0] || null;
  }, [devices, selectedDeviceId]);

  useEffect(() => {
    if (!selectedDevice) return;
    loadTelemetry(selectedDevice.deviceId || selectedDevice.id, selectedDate, dateRange);
  }, [selectedDevice?.deviceId, selectedDevice?.id, selectedDate, dateRange]);

  const loadTelemetry = async (devKey: string, date: string, range: 'today' | '7d') => {
    setSoftwareLoading(true);
    try {
      const [swRes, usageRes] = await Promise.all([
        devicesApi.getSoftware(devKey).catch(() => ({ deviceId: devKey, total: 0, software: [] })),
        devicesApi.getAppUsage(devKey, { date, range }).catch(() => null),
      ]);
      setSoftwareList(Array.isArray(swRes?.software) ? swRes.software : []);
      setUsageData(usageRes);
    } catch {
      toast('Failed to fetch software usage telemetry', 'error');
    } finally {
      setSoftwareLoading(false);
    }
  };

  const handleBlock = async (appName: string, executable: string, publisher: string) => {
    if (!selectedDevice) return;
    const exe = executable || `${appName.toLowerCase().replace(/\s+/g, '')}.exe`;
    setWorkingApp(exe);
    try {
      await applicationRulesApi.blockInstalled({
        appName,
        executable: exe,
        publisher: publisher || 'Unknown',
        scope: 'device',
        scopeTarget: selectedDevice.deviceId,
      });
      toast(`${appName} (${exe}) blocked and restricted on ${selectedDevice.name}.`, 'success');
      loadTelemetry(selectedDevice.deviceId || selectedDevice.id, selectedDate, dateRange);
    } catch {
      toast(`Failed to block application ${appName}`, 'error');
    } finally {
      setWorkingApp(null);
    }
  };

  const handleUnblock = async (appName: string, executable: string) => {
    if (!selectedDevice) return;
    const exe = executable || `${appName.toLowerCase().replace(/\s+/g, '')}.exe`;
    setWorkingApp(exe);
    try {
      await applicationRulesApi.unblockInstalled({ executable: exe });
      toast(`${appName} (${exe}) unblocked on ${selectedDevice.name}.`, 'success');
      loadTelemetry(selectedDevice.deviceId || selectedDevice.id, selectedDate, dateRange);
    } catch {
      toast(`Failed to unblock application ${appName}`, 'error');
    } finally {
      setWorkingApp(null);
    }
  };

  // Metrics
  const installedApps = useMemo(() => softwareList.filter((s) => s.status === 'installed'), [softwareList]);
  const uninstalledApps = useMemo(() => softwareList.filter((s) => s.status === 'uninstalled'), [softwareList]);
  const blockedApps = useMemo(() => softwareList.filter((s) => s.isBlocked), [softwareList]);

  const usageApps = useMemo(() => {
    const raw = usageData?.apps || [];
    const q = search.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter(
      (a) =>
        a.appName.toLowerCase().includes(q) ||
        a.executable.toLowerCase().includes(q) ||
        (a.publisher || '').toLowerCase().includes(q)
    );
  }, [usageData, search]);

  const displayedInventory = useMemo(() => {
    let list = activeTab === 'installed' ? installedApps : uninstalledApps;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.executable || '').toLowerCase().includes(q) ||
          (s.publisher || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, installedApps, uninstalledApps, search]);

  const topUsedApp = usageData?.apps?.[0] || null;
  const maxActiveSeconds = topUsedApp && topUsedApp.activeSeconds > 0 ? topUsedApp.activeSeconds : 1;
  const todayStr = getLocalDateString(0);
  const yesterdayStr = getLocalDateString(1);

  const rangeLabel =
    dateRange === '7d'
      ? 'Last 7 Days'
      : selectedDate === todayStr
      ? 'Today'
      : selectedDate === yesterdayStr
      ? 'Yesterday'
      : selectedDate;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workstation Software & Daily Screen Time"
        description="Real-time active foreground application screen time, daily launch tracking, installed inventory, and 1-click blocking."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={`h-4 w-4 ${softwareLoading ? 'animate-spin' : ''}`} />}
            onClick={() => {
              if (selectedDevice) loadTelemetry(selectedDevice.deviceId || selectedDevice.id, selectedDate, dateRange);
            }}
          >
            Refresh Usage
          </Button>
        }
      />

      {/* Target Workstation Selector Banner */}
      <Card className="p-4 bg-theme-surface border-theme-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-accent/10 text-theme-accent border border-theme-accent/20 shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Target Workstation:</span>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="rounded-lg border border-theme-border bg-theme-surface-subtle px-3 py-1.5 text-sm font-bold text-theme-heading focus:border-theme-accent focus:outline-none cursor-pointer"
                >
                  {devices
                    .filter((d) => d.status !== 'uninstalled')
                    .map((d) => (
                      <option key={d.id || d.deviceId} value={d.id || d.deviceId}>
                        {d.name} ({d.employeeName || 'Workstation'})
                      </option>
                    ))}
                  {devices.filter((d) => d.status !== 'uninstalled').length === 0 && (
                    <option value="" disabled>
                      {loading ? 'Loading workstations...' : 'No active workstations found'}
                    </option>
                  )}
                </select>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-theme-muted">
                <span className="flex items-center gap-1 font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  IP: {selectedDevice?.ipAddress || '127.0.0.1'}
                </span>
                {selectedDevice?.publicIp && (
                  <span className="flex items-center gap-1 font-mono">
                    <Globe className="h-3 w-3 text-sky-400" />
                    Public IP: {selectedDevice.publicIp}
                  </span>
                )}
                {selectedDevice?.location?.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-rose-400" />
                    {selectedDevice.location.city}, {selectedDevice.location.country}
                  </span>
                )}
                <span className="text-theme-muted/70">
                  OS: {selectedDevice?.osVersion || 'Windows 11'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success" dot>
              {installedApps.length} Installed
            </Badge>
            {blockedApps.length > 0 && (
              <Badge variant="error" dot>
                {blockedApps.length} Blocked
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* 4 Daily Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-theme-border bg-theme-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">Active Screen Time</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Timer className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-500 font-mono">
            {formatDuration(usageData?.totalActiveSeconds || 0)}
          </div>
          <p className="mt-1 text-xs text-theme-muted">Focused usage ({rangeLabel})</p>
        </Card>

        <Card className="p-4 border-theme-border bg-theme-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Apps Used ({rangeLabel})</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <AppWindow className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-theme-heading font-mono">
            {usageData?.apps?.length || 0}
          </div>
          <p className="mt-1 text-xs text-theme-muted truncate">
            {topUsedApp ? `Top: ${topUsedApp.appName} (${formatDuration(topUsedApp.activeSeconds)})` : 'No desktop sessions yet'}
          </p>
        </Card>

        <Card className="p-4 border-theme-border bg-theme-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Blocked Applications</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <Ban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400 font-mono">{blockedApps.length}</div>
          <p className="mt-1 text-xs text-theme-muted">Enforced by Application Control</p>
        </Card>

        <Card className="p-4 border-theme-border bg-theme-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Idle / Away Time</span>
            <div className="p-2 rounded-lg bg-slate-500/10 text-slate-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-400 font-mono">
            {formatDuration(usageData?.totalIdleSeconds || 0)}
          </div>
          <p className="mt-1 text-xs text-theme-muted">Inactive &gt; 2m or Screen Locked</p>
        </Card>
      </div>

      {/* Main Software Usage & Inventory Card */}
      <Card className="p-5 border-theme-border bg-theme-surface shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-theme-surface-subtle border border-theme-border">
            <button
              type="button"
              onClick={() => setActiveTab('frequently_used')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'frequently_used'
                  ? 'bg-amber-500/10 text-amber-500 shadow-xs'
                  : 'text-theme-muted hover:text-amber-500'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              Daily Screen Time ({usageData?.apps?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('installed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'installed'
                  ? 'bg-theme-surface text-theme-heading shadow-xs'
                  : 'text-theme-muted hover:text-theme-heading'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Installed Applications ({installedApps.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('uninstalled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'uninstalled'
                  ? 'bg-theme-surface text-theme-heading shadow-xs'
                  : 'text-theme-muted hover:text-theme-heading'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Uninstalled History ({uninstalledApps.length})
            </button>
          </div>

          {/* Search Filter */}
          <div className="w-full lg:w-72">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search app name, .exe, vendor..."
            />
          </div>
        </div>

        {/* Date Filter Bar for Daily Screen Time */}
        {activeTab === 'frequently_used' && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-theme-border bg-theme-surface-subtle px-3.5 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="h-4 w-4 text-theme-accent" />
              <button
                type="button"
                onClick={() => {
                  setDateRange('today');
                  setSelectedDate(todayStr);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  dateRange === 'today' && selectedDate === todayStr
                    ? 'bg-theme-accent text-theme-accent-text'
                    : 'border border-theme-border text-theme-muted hover:text-theme-heading'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateRange('today');
                  setSelectedDate(yesterdayStr);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  dateRange === 'today' && selectedDate === yesterdayStr
                    ? 'bg-theme-accent text-theme-accent-text'
                    : 'border border-theme-border text-theme-muted hover:text-theme-heading'
                }`}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateRange('7d');
                  setSelectedDate(todayStr);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  dateRange === '7d'
                    ? 'bg-theme-accent text-theme-accent-text'
                    : 'border border-theme-border text-theme-muted hover:text-theme-heading'
                }`}
              >
                Last 7 Days
              </button>
              <input
                type="date"
                value={selectedDate}
                max={todayStr}
                onChange={(e) => {
                  if (e.target.value) {
                    setDateRange('today');
                    setSelectedDate(e.target.value);
                  }
                }}
                className="rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1 text-xs text-theme-heading focus:border-theme-accent focus:outline-none"
              />
            </div>

            <span className="text-[11px] font-mono text-theme-muted">
              {usageData?.lastUpdatedAt
                ? `Synced: ${formatShortTime(usageData.lastUpdatedAt)}`
                : 'Awaiting session tracker sync'}
            </span>
          </div>
        )}

        {/* Tab 1: Real Daily Active Screen Time */}
        {activeTab === 'frequently_used' && (
          <div className="overflow-hidden rounded-xl border border-theme-border">
            <DataTable<DailyAppUsageItem>
              data={usageApps}
              keyExtractor={(app, idx) => `${app.executable}-${idx}`}
              columns={[
                {
                  key: 'appName',
                  header: 'Application',
                  render: (app) => (
                    <div>
                      <span className="font-bold text-sm text-theme-heading block">{app.appName}</span>
                      <span className="text-xs font-mono text-theme-muted">{app.executable}</span>
                    </div>
                  ),
                },
                {
                  key: 'publisher',
                  header: 'Publisher',
                  render: (app) => (
                    <span className="text-xs text-theme-muted">{app.publisher || 'Unknown'}</span>
                  ),
                },
                {
                  key: 'activeSeconds',
                  header: 'Active Time Spent',
                  render: (app) => {
                    const sec = app.activeSeconds || 0;
                    const barPct = Math.min(100, Math.round((sec / maxActiveSeconds) * 100));
                    const sharePct = app.percentage ?? 0;
                    return (
                      <div className="w-52 space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-theme-heading">{formatDuration(sec)}</span>
                          <span className="text-[10px] text-theme-muted">{sharePct}% of day</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-theme-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                            style={{ width: `${sec > 0 ? Math.max(6, barPct) : 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  },
                },
                {
                  key: 'launchCount',
                  header: 'Launches',
                  render: (app) => (
                    <span className="font-mono text-xs font-semibold text-theme-heading bg-theme-surface-subtle px-2 py-0.5 rounded border border-theme-border">
                      {app.launchCount} {app.launchCount === 1 ? 'launch' : 'launches'}
                    </span>
                  ),
                },
                {
                  key: 'window',
                  header: 'Activity Window',
                  render: (app) => (
                    <div className="text-[11px] font-mono text-theme-muted">
                      <div>First: {formatShortTime(app.firstUsedAt)}</div>
                      <div>Last: {formatShortTime(app.lastUsedAt)}</div>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Policy Status',
                  render: (app) => (
                    <Badge variant={app.isBlocked ? 'error' : 'success'} dot>
                      {app.isBlocked ? 'Blocked' : 'Active'}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Action',
                  className: 'text-right',
                  render: (app) => {
                    const isWorking = workingApp === app.executable;
                    return (
                      <div className="flex items-center justify-end">
                        {app.isBlocked ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                            disabled={isWorking}
                            onClick={() => handleUnblock(app.appName, app.executable)}
                          >
                            {isWorking ? 'Unblocking...' : 'Unblock'}
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Ban className="h-3.5 w-3.5" />}
                            disabled={isWorking}
                            onClick={() => handleBlock(app.appName, app.executable, app.publisher)}
                          >
                            {isWorking ? 'Blocking...' : 'Block App'}
                          </Button>
                        )}
                      </div>
                    );
                  },
                },
              ]}
              emptyMessage={
                softwareLoading
                  ? 'Loading real-time application screen time...'
                  : `No active desktop application usage recorded for ${rangeLabel}.`
              }
            />
          </div>
        )}

        {/* Tab 2: Installed Applications */}
        {activeTab === 'installed' && (
          <div className="overflow-hidden rounded-xl border border-theme-border">
            <DataTable
              data={displayedInventory}
              keyExtractor={(app, idx) => app.id || `${app.name}-${app.version || ''}-${idx}`}
              columns={[
                {
                  key: 'name',
                  header: 'Application Name',
                  render: (app) => (
                    <div>
                      <span className="font-bold text-sm text-theme-heading block">{app.name}</span>
                      <span className="text-xs font-mono text-theme-muted">{app.executable || '—'}</span>
                    </div>
                  ),
                },
                {
                  key: 'version',
                  header: 'Version',
                  render: (app) => (
                    <span className="font-mono text-xs text-theme-heading bg-theme-surface-subtle px-2 py-0.5 rounded border border-theme-border">
                      v{app.version || '1.0.0'}
                    </span>
                  ),
                },
                {
                  key: 'publisher',
                  header: 'Publisher',
                  render: (app) => (
                    <span className="text-xs text-theme-muted">{app.publisher || 'Unknown'}</span>
                  ),
                },
                {
                  key: 'installDate',
                  header: 'Install Date',
                  render: (app) => (
                    <span className="text-xs text-theme-muted">{app.installDate || '—'}</span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (app) => (
                    <Badge variant={app.isBlocked ? 'error' : 'success'} dot>
                      {app.isBlocked ? 'Blocked' : 'Installed'}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: '1-Click Action',
                  className: 'text-right',
                  render: (app) => {
                    const exe = app.executable || `${app.name.toLowerCase().replace(/\s+/g, '')}.exe`;
                    const isWorking = workingApp === exe;
                    return (
                      <div className="flex items-center justify-end">
                        {app.isBlocked ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                            disabled={isWorking}
                            onClick={() => handleUnblock(app.name, exe)}
                          >
                            {isWorking ? 'Unblocking...' : 'Unblock'}
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Ban className="h-3.5 w-3.5" />}
                            disabled={isWorking}
                            onClick={() => handleBlock(app.name, exe, app.publisher)}
                          >
                            {isWorking ? 'Blocking...' : 'Block App'}
                          </Button>
                        )}
                      </div>
                    );
                  },
                },
              ]}
              emptyMessage={
                softwareLoading
                  ? 'Loading installed applications catalog...'
                  : 'No installed applications found matching your search.'
              }
            />
          </div>
        )}

        {/* Tab 3: Uninstalled History */}
        {activeTab === 'uninstalled' && (
          <div className="overflow-hidden rounded-xl border border-theme-border">
            <DataTable
              data={displayedInventory}
              keyExtractor={(app, idx) => app.id || `${app.name}-${app.version || ''}-${idx}`}
              columns={[
                {
                  key: 'name',
                  header: 'Application',
                  render: (app) => (
                    <div>
                      <span className="font-bold text-sm text-theme-heading block">{app.name}</span>
                      <span className="text-xs font-mono text-theme-muted">{app.executable || '—'}</span>
                    </div>
                  ),
                },
                {
                  key: 'publisher',
                  header: 'Publisher',
                  render: (app) => (
                    <span className="text-xs text-theme-muted">{app.publisher || 'Unknown'}</span>
                  ),
                },
                {
                  key: 'version',
                  header: 'Last Known Version',
                  render: (app) => (
                    <span className="font-mono text-xs text-theme-muted">v{app.version || '1.0.0'}</span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: () => (
                    <Badge variant="neutral" dot>
                      Uninstalled
                    </Badge>
                  ),
                },
              ]}
              emptyMessage={
                softwareLoading
                  ? 'Checking uninstalled software history...'
                  : 'No uninstalled applications detected on this workstation.'
              }
            />
          </div>
        )}
      </Card>
    </div>
  );
}
