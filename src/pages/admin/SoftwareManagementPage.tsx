import { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  AppWindow,
  Monitor,
  Search,
  RefreshCw,
  Ban,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  ShieldAlert,
  Flame,
  Activity,
  MapPin,
  Globe,
  Trash2,
  History,
  FileText,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import SearchInput from '@/components/ui/SearchInput';
import { DataTable } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { devicesApi, applicationRulesApi } from '@/lib/api';
import type { Device, DeviceSoftware } from '@/types';

export default function SoftwareManagementPage() {
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [softwareLoading, setSoftwareLoading] = useState(false);
  const [softwareList, setSoftwareList] = useState<DeviceSoftware[]>([]);
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
      const list = Array.isArray(data) ? data : [];
      setDevices(list);
      if (list.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(list[0].id || list[0].deviceId);
      }
    } catch {
      toast('Failed to load workstation devices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedDevice = useMemo(() => {
    return devices.find((d) => d.id === selectedDeviceId || d.deviceId === selectedDeviceId) || devices[0] || null;
  }, [devices, selectedDeviceId]);

  useEffect(() => {
    if (!selectedDevice) return;
    loadSoftware(selectedDevice.deviceId || selectedDevice.id);
  }, [selectedDevice?.deviceId, selectedDevice?.id]);

  const loadSoftware = async (devKey: string) => {
    setSoftwareLoading(true);
    try {
      const data = await devicesApi.getSoftware(devKey);
      if (data && Array.isArray(data.software)) {
        setSoftwareList(data.software);
      } else {
        setSoftwareList([]);
      }
    } catch {
      toast('Failed to fetch software inventory', 'error');
    } finally {
      setSoftwareLoading(false);
    }
  };

  const handleBlockApp = async (app: DeviceSoftware) => {
    if (!selectedDevice) return;
    const exe = app.executable || `${app.name.toLowerCase().replace(/\s+/g, '')}.exe`;
    setWorkingApp(exe);
    try {
      await applicationRulesApi.blockInstalled({
        appName: app.name,
        executable: exe,
        publisher: app.publisher,
        scope: 'device',
        scopeTarget: selectedDevice.deviceId,
      });
      toast(`${app.name} (${exe}) blocked and restricted on ${selectedDevice.name}.`, 'success');
      loadSoftware(selectedDevice.deviceId || selectedDevice.id);
    } catch {
      toast(`Failed to block application ${app.name}`, 'error');
    } finally {
      setWorkingApp(null);
    }
  };

  const handleUnblockApp = async (app: DeviceSoftware) => {
    if (!selectedDevice) return;
    const exe = app.executable || `${app.name.toLowerCase().replace(/\s+/g, '')}.exe`;
    setWorkingApp(exe);
    try {
      await applicationRulesApi.unblockInstalled({ executable: exe });
      toast(`${app.name} (${exe}) unblocked on ${selectedDevice.name}.`, 'success');
      loadSoftware(selectedDevice.deviceId || selectedDevice.id);
    } catch {
      toast(`Failed to unblock application ${app.name}`, 'error');
    } finally {
      setWorkingApp(null);
    }
  };

  // Metrics
  const installedApps = useMemo(() => softwareList.filter((s) => s.status === 'installed'), [softwareList]);
  const frequentlyUsedApps = useMemo(
    () =>
      installedApps
        .filter((s) => (s.executionCount || 0) > 0)
        .sort((a, b) => (b.executionCount || 0) - (a.executionCount || 0)),
    [installedApps]
  );
  const uninstalledApps = useMemo(() => softwareList.filter((s) => s.status === 'uninstalled'), [softwareList]);
  const blockedApps = useMemo(() => softwareList.filter((s) => s.isBlocked), [softwareList]);

  // Tab Filtering
  const displayedApps = useMemo(() => {
    let list: DeviceSoftware[] = [];
    if (activeTab === 'frequently_used') {
      list = frequentlyUsedApps;
    } else if (activeTab === 'installed') {
      list = installedApps;
    } else if (activeTab === 'uninstalled') {
      list = uninstalledApps;
    }

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
  }, [activeTab, frequentlyUsedApps, installedApps, uninstalledApps, search]);

  const maxExecutions = frequentlyUsedApps.length > 0 ? frequentlyUsedApps[0].executionCount || 1 : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workstation Software Inventory & Control"
        description="Comprehensive desktop application tracking, execution frequency monitoring, uninstalled history, and 1-click application blocking."
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={`h-4 w-4 ${softwareLoading ? 'animate-spin' : ''}`} />}
            onClick={() => {
              if (selectedDevice) loadSoftware(selectedDevice.deviceId || selectedDevice.id);
            }}
          >
            Refresh Inventory
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
                  {devices.map((d) => (
                    <option key={d.id || d.deviceId} value={d.id || d.deviceId}>
                      {d.name} ({d.employeeName || 'Workstation'})
                    </option>
                  ))}
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
              {installedApps.length} Apps Detected
            </Badge>
            {blockedApps.length > 0 && (
              <Badge variant="error" dot>
                {blockedApps.length} Blocked
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-theme-border bg-theme-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Total Installed Apps</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <AppWindow className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-theme-heading font-mono">{installedApps.length}</div>
          <p className="mt-1 text-xs text-theme-muted">Catalogued in Windows registry</p>
        </Card>

        <Card className="p-4 border-theme-border bg-theme-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 font-bold">Frequently Used</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-500 font-mono">{frequentlyUsedApps.length}</div>
          <p className="mt-1 text-xs text-theme-muted">Apps with execution tracking</p>
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
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Uninstalled History</span>
            <div className="p-2 rounded-lg bg-slate-500/10 text-slate-400">
              <History className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-400 font-mono">{uninstalledApps.length}</div>
          <p className="mt-1 text-xs text-theme-muted">Previously detected removals</p>
        </Card>
      </div>

      {/* Main Software Inventory Card */}
      <Card className="p-5 border-theme-border bg-theme-surface shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
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
              Frequently Used ({frequentlyUsedApps.length})
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
          <div className="w-full md:w-72">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search software name, executable, vendor..."
            />
          </div>
        </div>

        {/* Tab Specific Views */}
        {activeTab === 'frequently_used' && (
          <div className="overflow-hidden rounded-xl border border-theme-border">
            <DataTable
              data={displayedApps}
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
                  header: 'Publisher / Vendor',
                  render: (app) => (
                    <span className="text-xs text-theme-muted">{app.publisher || 'Unknown'}</span>
                  ),
                },
                {
                  key: 'executionCount',
                  header: 'Usage Frequency',
                  render: (app) => {
                    const count = app.executionCount || 0;
                    const pct = Math.min(100, Math.round((count / maxExecutions) * 100));
                    return (
                      <div className="w-48 space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-theme-heading">{count} launches</span>
                          <span className="text-[10px] text-theme-muted">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-theme-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                            style={{ width: `${Math.max(8, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  },
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
                            onClick={() => handleUnblockApp(app)}
                          >
                            {isWorking ? 'Unblocking...' : 'Unblock'}
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Ban className="h-3.5 w-3.5" />}
                            disabled={isWorking}
                            onClick={() => handleBlockApp(app)}
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
                  ? 'Analyzing workstation execution telemetry...'
                  : 'No frequently used applications found.'
              }
            />
          </div>
        )}

        {activeTab === 'installed' && (
          <div className="overflow-hidden rounded-xl border border-theme-border">
            <DataTable
              data={displayedApps}
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
                            onClick={() => handleUnblockApp(app)}
                          >
                            {isWorking ? 'Unblocking...' : 'Unblock'}
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Ban className="h-3.5 w-3.5" />}
                            disabled={isWorking}
                            onClick={() => handleBlockApp(app)}
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

        {activeTab === 'uninstalled' && (
          <div className="overflow-hidden rounded-xl border border-theme-border">
            <DataTable
              data={displayedApps}
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
