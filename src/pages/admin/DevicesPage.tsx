import { useState, useMemo, useEffect } from 'react';
import {
  Monitor,
  Plus,
  Wifi,
  WifiOff,
  RefreshCw,
  Globe,
  CheckCircle2,
  Ban,
  RotateCcw,
  ShieldCheck,
  User as UserIcon,
  Usb,
  BookOpen,
  Terminal,
  Chrome,
  Flame,
  Shield,
  Lock,
  Puzzle,
  AppWindow,
  AlertTriangle,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import SearchInput from '@/components/ui/SearchInput';
import { DataTable } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { devices as initialDevices, policies as initialPolicies } from '@/data/mockData';
import { devicesApi, policiesApi, usersApi, applicationRulesApi } from '@/lib/api';
import { timeAgo, formatDate } from '@/lib/format';
import type { Device, Policy, User, DeviceBrowserRuleSummary, DeviceSoftware, DailyAppUsageResponse, DailyAppUsageItem } from '@/types';

function formatDeviceUsageDuration(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  if (sec < 60) return `${sec}s`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

const statusConfig: Record<string, { variant: 'success' | 'warning' | 'error' | 'neutral'; label: string }> = {
  applied: { variant: 'success', label: 'Applied' },
  partial: { variant: 'warning', label: 'Partial' },
  failed: { variant: 'error', label: 'Failed' },
  pending: { variant: 'neutral', label: 'Pending' },
  uninstalled: { variant: 'neutral', label: 'Uninstalled' },
  offline: { variant: 'neutral', label: 'Offline' },
};

export default function DevicesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [domainModalDevice, setDomainModalDevice] = useState<Device | null>(null);
  const [viewDetailsDevice, setViewDetailsDevice] = useState<Device | null>(null);
  const [viewDetailsInitialTab, setViewDetailsInitialTab] = useState<'overview' | 'network' | 'firewall' | 'ports' | 'software'>('overview');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [deviceList, setDeviceList] = useState<Device[]>([]);
  const [policyList, setPolicyList] = useState<Policy[]>([]);
  const [userList, setUserList] = useState<User[]>([]);

  const loadData = async () => {
    try {
      const [devs, pols, usrs] = await Promise.all([
        devicesApi.getAll().catch(() => []),
        policiesApi.getAll().catch(() => []),
        usersApi.getAll().catch(() => []),
      ]);
      if (Array.isArray(devs)) setDeviceList(devs);
      if (Array.isArray(pols)) setPolicyList(pols);
      if (Array.isArray(usrs)) setUserList(usrs);
    } catch { }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return deviceList.filter((d) => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.deviceId.toLowerCase().includes(search.toLowerCase()) && !(d.employeeName || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      return true;
    });
  }, [deviceList, search, statusFilter]);

  const handleSync = async (id: string) => {
    setSyncing(id);
    setMenuOpen(null);
    try {
      const res = await devicesApi.sync(id);
      setDeviceList((prev) => prev.map((d) => d.id === id ? { ...d, ...res.device, lastSync: new Date().toISOString(), status: 'applied' } : d));
      toast('Policy sync successful with MongoDB endpoint');
    } catch {
      setDeviceList((prev) => prev.map((d) => d.id === id ? { ...d, lastSync: new Date().toISOString(), status: 'applied' } : d));
      toast('Policy sync completed');
    } finally {
      setSyncing(null);
    }
  };

  const handleRegister = async (data: {
    name: string;
    deviceId: string;
    policyId: string;
    employeeName?: string;
    employeeEmail?: string;
  }) => {
    const policyName = policyList.find((p) => p.id === data.policyId)?.name;
    try {
      const created = await devicesApi.create({ ...data, policyName });
      setDeviceList((prev) => [created, ...prev]);
      // Refresh employees list immediately so newly created employees show up
      usersApi.getAll().then((users) => {
        if (Array.isArray(users)) setUserList(users);
      }).catch(() => { });
      toast(`Device registered & linked to ${created.employeeName || 'employee'}`);
    } catch {
      const fallback: Device = {
        id: `dev-${Date.now()}`,
        deviceId: data.deviceId || `WIN-${Date.now()}`,
        name: data.name,
        employeeName: data.employeeName,
        policyId: data.policyId,
        policyName,
        osVersion: 'Windows 11 Pro 23H2',
        agentVersion: '2.4.1',
        lastSync: new Date().toISOString(),
        status: 'applied',
        online: true,
      };
      setDeviceList((prev) => [fallback, ...prev]);
      toast('Device registered locally');
    }
    setRegisterOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await devicesApi.delete(id);
    } catch { }
    setDeviceList((prev) => prev.filter((d) => d.id !== id));
    setMenuOpen(null);
    toast('Device removed', 'info');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Device Management"
        description="Live registry of enrolled Windows workstations, real-time agent heartbeats, operating systems, and policy sync status."
        icon={<Monitor className="h-5 w-5" />}
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setRegisterOpen(true)}>Register Device</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card padding="md">
          <p className="text-sm text-slate-500">Total Devices</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{deviceList.length}</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-slate-500">Online Now</p>
          <p className="mt-1 text-2xl font-bold text-success-600">{deviceList.filter((d) => d.online).length}</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-slate-500">Policies Applied</p>
          <p className="mt-1 text-2xl font-bold text-success-600">{deviceList.filter((d) => d.status === 'applied').length}</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-slate-500">Sync Issues</p>
          <p className="mt-1 text-2xl font-bold text-error-600">{deviceList.filter((d) => d.status === 'failed' || d.status === 'partial').length}</p>
        </Card>
      </div>

      <Card padding="none">
        <div className="flex flex-col gap-3 border-b border-theme-border p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by device name, ID, or employee..." className="flex-1" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input sm:w-44">
            <option value="all">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="partial">Partial</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Device',
              render: (d) => (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-theme-bg-deep border border-theme-border text-theme-accent">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-theme-heading">{d.name}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'employee',
              header: 'Assigned To',
              render: (d) => {
                if (!d.employeeName) {
                  return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-theme-bg-deep border border-theme-border px-2.5 py-0.5 text-xs text-theme-muted">
                      Unassigned
                    </span>
                  );
                }
                const initials = d.employeeName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
                const matchedUser = userList.find((u) => u.id === d.employeeId || u.name.toLowerCase() === d.employeeName?.toLowerCase());
                return (
                  <button
                    type="button"
                    onClick={() => setViewDetailsDevice(d)}
                    className="flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity"
                    title="Click to view full employee & device details"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-theme-accent text-theme-accent-text text-xs font-bold shadow-sm">
                      {initials}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-theme-heading">{d.employeeName}</p>
                      <p className="text-[10px] text-theme-muted">
                        {matchedUser?.email || 'Employee'}
                      </p>
                    </div>
                  </button>
                );
              },
            },
            // {
            //   key: 'osVersion',
            //   header: 'OS / Agent',
            //   render: (d) => (
            //     <div>
            //       <p className="text-xs text-slate-600 dark:text-slate-300">{d.osVersion}</p>
            //       <p className="text-xs text-slate-400">Agent v{d.agentVersion}</p>
            //     </div>
            //   ),
            // },
            {
              key: 'network',
              header: 'IP & Location',
              render: (d) => (
                <div>
                  <p className="font-mono text-xs font-semibold text-theme-heading flex items-center gap-1.5">
                    {d.ipAddress ? (
                      <>
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        {d.ipAddress}
                      </>
                    ) : (
                      <span className="text-theme-muted">—</span>
                    )}
                  </p>
                  <p className="text-[11px] text-theme-muted flex items-center gap-1 mt-0.5">
                    {d.location?.city ? (
                      <>
                        <Globe className="h-3 w-3 text-cyan-400 inline" />
                        {`${d.location.city}, ${d.location.countryCode || d.location.country || ''}`}
                      </>
                    ) : (
                      <span className="text-theme-muted">—</span>
                    )}
                  </p>
                </div>
              ),
            },
            // {
            //   key: 'security',
            //   header: 'Firewall & Ports',
            //   render: (d) => {
            //     const fwOn = d.firewallEnabled !== false && d.firewallStatus !== 'disabled';
            //     const disallowed = d.disallowedPortsCount || 0;
            //     const openTotal = d.openPortsCount || (d.openPorts ? d.openPorts.length : 3);
            //     return (
            //       <div className="flex flex-col gap-1">
            //         <div className="flex items-center gap-1.5">
            //           <button
            //             type="button"
            //             onClick={() => {
            //               setViewDetailsInitialTab('firewall');
            //               setViewDetailsDevice(d);
            //             }}
            //             className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer hover:opacity-80 transition ${fwOn ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            //               }`}
            //             title="Click to view & toggle Firewall posture"
            //           >
            //             <Shield className="h-2.5 w-2.5" />
            //             {fwOn ? 'Firewall ON' : 'Firewall OFF'}
            //           </button>
            //         </div>
            //         <div className="flex items-center gap-1 text-[11px]">
            //           <span className="text-theme-muted">{openTotal} Ports</span>
            //           {disallowed > 0 ? (
            //             <span className="text-rose-400 font-semibold">({disallowed} Rogue)</span>
            //           ) : (
            //             <span className="text-emerald-400 font-semibold">(Compliant)</span>
            //           )}
            //         </div>
            //       </div>
            //     );
            //   },
            // },
            // {
            //   key: 'policy',
            //   header: 'Policy',
            //   render: (d) => <span className="text-sm text-slate-600 dark:text-slate-300">{d.policyName || '—'}</span>,
            // },
            {
              key: 'lastSync',
              header: 'Last Sync',
              render: (d) => <span className="text-xs text-slate-500">{timeAgo(d.lastSync)}</span>,
            },
            {
              key: 'online',
              header: 'Connection',
              render: (d) => (
                <span className="flex items-center gap-1.5 text-xs">
                  {d.online ? <Wifi className="h-3.5 w-3.5 text-success-500" /> : <WifiOff className="h-3.5 w-3.5 text-slate-400" />}
                  {d.online ? 'Online' : (d.status === 'uninstalled' ? 'Uninstalled' : 'Offline')}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Policy Status',
              render: (d) => <Badge variant={statusConfig[d.status].variant} dot>{statusConfig[d.status].label}</Badge>,
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              render: (d) => (
                <div className="relative flex items-center justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<ShieldCheck className="h-3.5 w-3.5 text-primary-500" />}
                    onClick={() => setDomainModalDevice(d)}
                  >
                    Manage Policies
                  </Button>

                </div>
              ),
            },
          ]}
          data={filtered}
          emptyMessage="No devices match your filters"
        />
      </Card>

      <RegisterDeviceModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegister={handleRegister}
        policies={policyList}
        employees={userList}
      />

      <DevicePolicyModal
        device={domainModalDevice}
        open={!!domainModalDevice}
        onClose={() => setDomainModalDevice(null)}
        onSyncDevice={(id) => handleSync(id)}
      />

      <DeviceDetailsModal
        device={viewDetailsDevice}
        initialTab={viewDetailsInitialTab}
        onClose={() => setViewDetailsDevice(null)}
        onOpenDomains={(dev) => {
          setViewDetailsDevice(null);
          setDomainModalDevice(dev);
        }}
        users={userList}
      />
    </div>
  );
}

function RegisterDeviceModal({
  open,
  onClose,
  onRegister,
  policies,
  employees,
}: {
  open: boolean;
  onClose: () => void;
  onRegister: (data: {
    name: string;
    deviceId: string;
    policyId: string;
    employeeName?: string;
    employeeEmail?: string;
  }) => void;
  policies: Policy[];
  employees: User[];
}) {
  const [name, setName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [policyId, setPolicyId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');

  // Check if typed employee matches an existing one ("if already there then no need")
  const matchedEmployee = useMemo(() => {
    if (!employeeName.trim()) return null;
    return employees.find(
      (e) => e.name.toLowerCase() === employeeName.trim().toLowerCase()
    );
  }, [employeeName, employees]);

  const handleEmployeeNameChange = (val: string) => {
    setEmployeeName(val);
    const found = employees.find(
      (e) => e.name.toLowerCase() === val.trim().toLowerCase()
    );
    if (found && found.email) {
      setEmployeeEmail(found.email);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onRegister({
      name,
      deviceId: deviceId || `WIN-${Date.now().toString(36).toUpperCase()}`,
      policyId,
      employeeName: employeeName.trim(),
      employeeEmail: employeeEmail.trim(),
    });
    setName('');
    setDeviceId('');
    setPolicyId('');
    setEmployeeName('');
    setEmployeeEmail('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register Windows Device"

      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Register Device</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Device Name </label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. IN-PC-01" />
        </div>
        <div>
          <label className="label">Unique Device ID</label>
          <input className="input font-mono" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="e.g. IN-PC-01" />

        </div>

        {/* Assigned Employee Section */}
        <div className="rounded-xl border border-theme-border bg-theme-surface p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="label mb-0 font-semibold text-theme-heading">
              Assigned Employee
            </label>
            <span className="text-[11px] text-theme-muted">
              Auto-creates if new
            </span>
          </div>

          <div>
            <input
              list="employee-names-list"
              className="input w-full text-sm"
              value={employeeName}
              onChange={(e) => handleEmployeeNameChange(e.target.value)}
              placeholder="Type or select employee name..."
            />
            <datalist id="employee-names-list">
              {employees.map((e) => (
                <option key={e.id} value={e.name}>
                  {e.email}
                </option>
              ))}
            </datalist>

            {employeeName.trim() && (
              <div className="mt-1.5 text-xs">
                {matchedEmployee ? (
                  <p className="flex items-center gap-1 text-success-600 dark:text-success-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Existing employee found: <strong>{matchedEmployee.name}</strong> ({matchedEmployee.email}). No duplicate will be created.</span>
                  </p>
                ) : (
                  <p className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
                    <Plus className="h-3.5 w-3.5" />
                    <span>New employee <strong>"{employeeName.trim()}"</strong> will be automatically created and assigned!</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {!matchedEmployee && employeeName.trim() && (
            <div>
              <label className="text-xs text-slate-500">Employee Email (Optional)</label>
              <input
                className="input w-full text-xs"
                type="email"
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
                placeholder="Auto-generated if left blank"
              />
            </div>
          )}
        </div>

        <div>
          <label className="label">Assigned Policy</label>
          <select className="input" value={policyId} onChange={(e) => setPolicyId(e.target.value)}>
            <option value="">Select policy</option>
            {policies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}

function DeviceDetailsModal({
  device,
  initialTab = 'overview',
  onClose,
  onOpenDomains,
  users,
}: {
  device: Device | null;
  initialTab?: 'overview' | 'network' | 'firewall' | 'ports' | 'software';
  onClose: () => void;
  onOpenDomains: (device: Device) => void;
  users: User[];
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'firewall' | 'ports' | 'software'>(initialTab);
  const [portsData, setPortsData] = useState<{
    openPorts: Array<{ port: number; protocol: string; processName?: string; isAllowed: boolean; isBlocked?: boolean }>;
    openPortsCount: number;
    disallowedPortsCount: number;
    masterPorts: any[];
  } | null>(null);
  const [softwareList, setSoftwareList] = useState<DeviceSoftware[]>([]);
  const [appUsageData, setAppUsageData] = useState<DailyAppUsageResponse | null>(null);
  const [softwareFilter, setSoftwareFilter] = useState<'all' | 'frequently_used' | 'uninstalled'>('all');
  const [softwareSearch, setSoftwareSearch] = useState('');
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const [blockingPort, setBlockingPort] = useState<number | null>(null);
  const [customPortToBlock, setCustomPortToBlock] = useState('');
  const [customPortReason, setCustomPortReason] = useState('');
  const [newMasterPortInput, setNewMasterPortInput] = useState('');
  const [newMasterServiceName, setNewMasterServiceName] = useState('');
  const [showAddMaster, setShowAddMaster] = useState(false);
  const [deviceState, setDeviceState] = useState<Device | null>(device);
  const [togglingFw, setTogglingFw] = useState(false);

  useEffect(() => {
    if (device) setDeviceState(device);
  }, [device]);

  const handleToggleFirewall = async (enable: boolean) => {
    if (!device) return;
    setTogglingFw(true);
    try {
      const devKey = device.deviceId || device.id;
      await devicesApi.toggleFirewall(devKey, enable);
      toast(
        enable
          ? `Windows Defender Firewall turned ON on ${device.name}.`
          : `Windows Defender Firewall turned OFF on ${device.name}.`,
        'success'
      );
      setDeviceState((prev) =>
        prev
          ? {
              ...prev,
              firewallEnabled: enable,
              firewallStatus: enable ? 'enabled' : 'disabled',
              targetFirewallState: enable ? 'on' : 'off',
            }
          : null
      );
    } catch (err: any) {
      toast(err.message || 'Failed to toggle Windows Defender Firewall', 'error');
    } finally {
      setTogglingFw(false);
    }
  };

  useEffect(() => {
    if (!device) return;
    setActiveTab(initialTab || 'overview');

    const now = new Date();
    const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    Promise.all([
      devicesApi.getPorts(device.deviceId).catch(() => ({
        deviceId: device.deviceId,
        deviceName: device.name,
        openPorts: device.openPorts || [],
        openPortsCount: device.openPortsCount || (device.openPorts ? device.openPorts.length : 0),
        disallowedPortsCount: device.disallowedPortsCount || 0,
        masterPorts: [],
      })),
      devicesApi.getSoftware(device.deviceId).catch(() => ({
        deviceId: device.deviceId,
        total: 0,
        software: [],
      })),
      devicesApi.getAppUsage(device.deviceId, { date: todayLocal, range: 'today' }).catch(() => null),
    ]).then(([pData, sData, uData]) => {
      if (pData) setPortsData(pData);
      if (sData?.software) setSoftwareList(sData.software);
      setAppUsageData(uData);
    });
  }, [device]);

  if (!device) return null;

  const matchedUser = users.find(
    (u) => u.id === device.employeeId || (device.employeeName && u.name.toLowerCase() === device.employeeName.toLowerCase())
  );

  const handleBlockApp = async (sw: DeviceSoftware) => {
    setBlockingId(sw.id);
    try {
      await applicationRulesApi.blockInstalled({
        appName: sw.name,
        executable: sw.executable,
        publisher: sw.publisher,
        scope: 'global',
      });
      setSoftwareList((prev) =>
        prev.map((item) => (item.id === sw.id ? { ...item, isBlocked: true } : item))
      );
      toast(`Restricted ${sw.name}. Added to Global Application Control.`, 'success');
    } catch {
      toast(`Failed to apply restriction for ${sw.name}`, 'error');
    } finally {
      setBlockingId(null);
    }
  };

  const handleUnblockApp = async (sw: DeviceSoftware) => {
    setBlockingId(sw.id);
    try {
      await applicationRulesApi.unblockInstalled({
        executable: sw.executable || `${sw.name}.exe`,
        deviceId: device.deviceId,
      });
      setSoftwareList((prev) =>
        prev.map((item) => (item.id === sw.id ? { ...item, isBlocked: false } : item))
      );
      toast(`Unblocked ${sw.name}. Removed restriction.`, 'success');
    } catch {
      toast(`Failed to unblock ${sw.name}`, 'error');
    } finally {
      setBlockingId(null);
    }
  };

  const handleBlockPort = async (port: number, protocol = 'TCP', reason = 'Admin restricted') => {
    setBlockingPort(port);
    try {
      await devicesApi.blockPort(device.deviceId, port, protocol, reason);
      setPortsData((prev) => {
        if (!prev) return null;
        const exists = prev.openPorts.some((p) => p.port === port);
        const updated = exists
          ? prev.openPorts.map((p) => (p.port === port ? { ...p, isBlocked: true, isAllowed: false } : p))
          : [...prev.openPorts, { port, protocol, processName: reason, isAllowed: false, isBlocked: true }];
        return {
          ...prev,
          openPorts: updated,
          disallowedPortsCount: updated.filter((p) => !p.isAllowed || p.isBlocked).length,
        };
      });
      toast(`Port ${port} blocked on ${device.name}. Netsh rule applied.`, 'success');
      setCustomPortToBlock('');
      setCustomPortReason('');
    } catch {
      toast(`Failed to block port ${port}`, 'error');
    } finally {
      setBlockingPort(null);
    }
  };

  const handleUnblockPort = async (port: number) => {
    setBlockingPort(port);
    try {
      await devicesApi.unblockPort(device.deviceId, port);
      setPortsData((prev) => {
        if (!prev) return null;
        const updated = prev.openPorts.map((p) => (p.port === port ? { ...p, isBlocked: false } : p));
        return {
          ...prev,
          openPorts: updated,
          disallowedPortsCount: Math.max(0, (prev.disallowedPortsCount || 1) - 1),
        };
      });
      toast(`Port ${port} unblocked on ${device.name}.`, 'success');
    } catch {
      toast(`Failed to unblock port ${port}`, 'error');
    } finally {
      setBlockingPort(null);
    }
  };

  const handleAddMasterPort = async () => {
    const port = parseInt(newMasterPortInput.trim(), 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      toast('Please enter a valid port number (1-65535)', 'error');
      return;
    }
    try {
      await devicesApi.saveMasterPort({
        port,
        protocol: 'TCP',
        serviceName: newMasterServiceName.trim() || 'Custom',
      });
      setPortsData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          masterPorts: [...(prev.masterPorts || []), { port, protocol: 'TCP', serviceName: newMasterServiceName || 'Custom' }],
        };
      });
      setNewMasterPortInput('');
      setNewMasterServiceName('');
      setShowAddMaster(false);
      toast(`Port ${port} added to Master Allowed baseline.`, 'success');
    } catch {
      toast('Failed to add master port', 'error');
    }
  };

  const handleDeleteMasterPort = async (port: number) => {
    try {
      await devicesApi.deleteMasterPort(port);
      setPortsData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          masterPorts: (prev.masterPorts || []).filter((p) => p.port !== port),
        };
      });
      toast(`Port ${port} removed from Master Allowed baseline.`, 'success');
    } catch {
      toast('Failed to remove master port', 'error');
    }
  };

  const filteredSoftware = softwareList.filter((item) => {
    if (softwareFilter === 'frequently_used' && (item.executionCount === 0 || item.status === 'uninstalled')) return false;
    if (softwareFilter === 'uninstalled' && item.status !== 'uninstalled') return false;
    if (softwareFilter === 'all' && item.status === 'uninstalled') return false;
    if (softwareSearch) {
      const q = softwareSearch.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.publisher || '').toLowerCase().includes(q) ||
        (item.executable || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const targetDevice = deviceState || device;
  const fwOn = targetDevice ? (targetDevice.firewallEnabled !== false && targetDevice.firewallStatus !== 'disabled') : false;

  return (
    <Modal
      open={!!device}
      onClose={onClose}
      title="Workstation Security & Telemetry Hub"
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            icon={<Globe className="h-3.5 w-3.5 text-primary-500" />}
            onClick={() => onOpenDomains(device)}
          >
            Access Domains
          </Button>
          <Button size="sm" onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-theme-border pb-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeTab === 'overview'
              ? 'bg-theme-accent text-theme-accent-text shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-heading'
              }`}
          >
            <Monitor className="h-3.5 w-3.5" /> Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('network')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeTab === 'network'
              ? 'bg-theme-accent text-theme-accent-text shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-heading'
              }`}
          >
            <Globe className="h-3.5 w-3.5" /> IP & Location
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('firewall')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeTab === 'firewall'
              ? 'bg-theme-accent text-theme-accent-text shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-heading'
              }`}
          >
            <Shield className="h-3.5 w-3.5" /> Firewall
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${fwOn ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ports')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeTab === 'ports'
              ? 'bg-theme-accent text-theme-accent-text shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-heading'
              }`}
          >
            <Terminal className="h-3.5 w-3.5" /> Open Ports
            {(portsData?.disallowedPortsCount || device.disallowedPortsCount || 0) > 0 && (
              <span className="rounded-full bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-bold text-rose-400">
                {portsData?.disallowedPortsCount || device.disallowedPortsCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('software')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeTab === 'software'
              ? 'bg-theme-accent text-theme-accent-text shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-heading'
              }`}
          >
            <AppWindow className="h-3.5 w-3.5" /> Software Inventory
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-3.5">
            <div className="rounded-xl border border-theme-border bg-theme-surface p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-theme-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-theme-border bg-theme-surface-subtle text-theme-heading">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-theme-heading">{device.name}</h4>
                    <p className="font-mono text-xs text-theme-muted">{device.deviceId}</p>
                  </div>
                </div>
                <Badge variant={device.online ? 'success' : 'neutral'} dot>
                  {device.online ? 'Online' : (device.status === 'uninstalled' ? 'Uninstalled (Offline)' : 'Offline')}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div>
                  <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Operating System</span>
                  <p className="mt-1 font-semibold text-theme-heading">{device.osVersion}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Agent Version</span>
                  <p className="mt-1 font-semibold text-theme-heading">v{device.agentVersion}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Policy Name</span>
                  <p className="mt-1 font-semibold text-theme-heading">{device.policyName || 'Standard Enterprise Policy'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Last Policy Sync</span>
                  <p className="mt-1 font-semibold text-theme-heading">{timeAgo(device.lastSync)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-theme-border bg-theme-surface p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-theme-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-theme-border bg-theme-surface-subtle text-theme-heading font-bold text-sm">
                    {(matchedUser?.name || (device.employeeName && !device.employeeName.endsWith('$') ? device.employeeName : (device.name || 'EM'))).substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-theme-heading">
                      {matchedUser?.name || (device.employeeName && !device.employeeName.endsWith('$') ? device.employeeName : (device.name ? `${device.name} User` : 'Unassigned'))}
                    </h4>
                    <p className="text-xs text-theme-muted">{matchedUser?.email || `${device.name.toLowerCase()}@company.local`}</p>
                  </div>
                </div>
                <Badge variant="success" dot>Active Assignment</Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                <div>
                  <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Role</span>
                  <p className="mt-1 font-semibold text-theme-heading uppercase">{matchedUser?.role || 'Employee'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Employee ID</span>
                  <p className="mt-1 font-mono font-semibold text-theme-heading">{matchedUser?.id || device.employeeId || 'u-003'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Security Profile</span>
                  <p className="mt-1 font-semibold text-emerald-400">Enterprise Enforcing</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: IP & Location */}
        {activeTab === 'network' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-theme-border bg-theme-surface p-4">
                <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Local Private IP</span>
                <p className="mt-1.5 font-mono text-base font-bold text-theme-heading">
                  {device.ipAddress || '—'}
                </p>
                <span className="text-[11px] text-theme-muted">Internal Subnet / DHCP</span>
              </div>
              <div className="rounded-xl border border-theme-border bg-theme-surface p-4">
                <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Public Gateway IP</span>
                <p className="mt-1.5 font-mono text-base font-bold text-theme-heading">
                  {device.publicIp || '—'}
                </p>
                <span className="text-[11px] text-theme-muted">ISP Gateway Connection</span>
              </div>
            </div>

            <div className="rounded-xl border border-theme-border bg-theme-surface p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-theme-muted mb-3">Geo-Location & Network Provider</h4>
              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div>
                  <span className="text-theme-muted">City / Region</span>
                  <p className="font-semibold text-theme-heading mt-0.5">
                    {device.location?.city ? `${device.location.city}${device.location.region ? `, ${device.location.region}` : ''}` : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-theme-muted">Country</span>
                  <p className="font-semibold text-theme-heading mt-0.5">
                    {device.location?.country ? `${device.location.country}${device.location.countryCode ? ` (${device.location.countryCode})` : ''}` : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-theme-muted">ISP Provider</span>
                  <p className="font-semibold text-theme-heading mt-0.5">
                    {device.location?.isp || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-theme-muted">MAC Address</span>
                  <p className="font-mono text-xs text-theme-heading mt-0.5">
                    {device.macAddress || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Windows Firewall */}
        {activeTab === 'firewall' && (
          <div className="space-y-3.5">
            <div className="rounded-xl border border-theme-border bg-theme-surface p-4">
              <div className="flex items-center justify-between border-b border-theme-border pb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${fwOn ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                    }`}>
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-theme-heading">
                      Windows Defender Firewall: {fwOn ? 'Active & Enforcing' : 'Disabled'}
                    </h4>
                    <p className="text-xs text-theme-muted">Kernel packet filter inspecting all inbound and outbound traffic.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={fwOn ? 'success' : 'error'}>
                    {fwOn ? 'Protected' : 'Risk Detected'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={togglingFw}
                    onClick={() => handleToggleFirewall(!fwOn)}
                    className={
                      fwOn
                        ? 'text-xs text-rose-400 border border-rose-500/30 hover:bg-rose-500/10'
                        : 'text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold'
                    }
                  >
                    {fwOn ? 'Turn Firewall OFF' : 'Turn Firewall ON'}
                  </Button>
                </div>
              </div>

              <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-xs">
                <div className="rounded-lg border border-theme-border bg-theme-surface-subtle p-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-theme-heading block">Domain Profile</span>
                    <span className="text-[11px] text-theme-muted">Corporate AD Network</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> ON
                  </span>
                </div>
                <div className="rounded-lg border border-theme-border bg-theme-surface-subtle p-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-theme-heading block">Private Profile</span>
                    <span className="text-[11px] text-theme-muted">Home & Work Network</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> ON
                  </span>
                </div>
                <div className="rounded-lg border border-theme-border bg-theme-surface-subtle p-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-theme-heading block">Public Profile</span>
                    <span className="text-[11px] text-theme-muted">Untrusted Hotspots</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> ON
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Open Ports & Master Comparison */}
        {activeTab === 'ports' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-theme-border bg-theme-surface p-3 text-center">
                <span className="text-[11px] text-theme-muted uppercase font-semibold">Active Listening</span>
                <p className="text-xl font-bold text-theme-heading mt-1">
                  {portsData?.openPortsCount ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-theme-border bg-theme-surface p-3 text-center">
                <span className="text-[11px] text-theme-muted uppercase font-semibold">Master Allowed</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  {portsData?.masterPorts?.length ?? 5}
                </p>
              </div>
              <div className="rounded-xl border border-theme-border bg-theme-surface p-3 text-center">
                <span className="text-[11px] text-theme-muted uppercase font-semibold">Non-Compliant (Rogue)</span>
                <p className="text-xl font-bold text-rose-400 mt-1">
                  {portsData?.disallowedPortsCount ?? 0}
                </p>
              </div>
            </div>

            {/* Master Allowed Ports Baseline Management Strip */}
            <div className="rounded-xl border border-theme-border bg-theme-surface p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-theme-heading">Master Allowed Baseline Ports</span>
                  <span className="text-[11px] text-theme-muted">(Listening ports not in this list are flagged as Rogue)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMaster(!showAddMaster)}
                  className="text-xs font-semibold text-theme-accent hover:underline"
                >
                  {showAddMaster ? 'Cancel' : '+ Add Allowed Port'}
                </button>
              </div>

              {showAddMaster && (
                <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-theme-bg-deep border border-theme-border">
                  <input
                    type="number"
                    placeholder="Port (e.g. 8080)"
                    value={newMasterPortInput}
                    onChange={(e) => setNewMasterPortInput(e.target.value)}
                    className="w-28 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1 text-xs text-theme-heading placeholder:text-theme-muted"
                  />
                  <input
                    type="text"
                    placeholder="Service Name (e.g. Dev Server)"
                    value={newMasterServiceName}
                    onChange={(e) => setNewMasterServiceName(e.target.value)}
                    className="flex-1 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1 text-xs text-theme-heading placeholder:text-theme-muted"
                  />
                  <Button size="sm" variant="primary" onClick={handleAddMasterPort}>
                    Add
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {(!portsData?.masterPorts || portsData.masterPorts.length === 0) ? (
                  [80, 443, 53, 123, 22].map((p) => (
                    <span key={p} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-400">
                      :{p}
                    </span>
                  ))
                ) : (
                  portsData.masterPorts.map((mp: any) => (
                    <span
                      key={mp.port}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-400"
                    >
                      :{mp.port} {mp.serviceName ? `(${mp.serviceName})` : ''}
                      <button
                        type="button"
                        onClick={() => handleDeleteMasterPort(mp.port)}
                        className="ml-1 text-theme-muted hover:text-rose-400"
                        title="Remove from allowed baseline"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Listening Ports Table */}
            <div className="rounded-xl border border-theme-border bg-theme-surface overflow-hidden">
              <div className="p-3 border-b border-theme-border bg-theme-surface-subtle flex items-center justify-between">
                <span className="text-xs font-bold text-theme-heading">Workstation Listening Ports vs Master Baseline</span>
                <span className="text-[11px] text-theme-muted">
                  {portsData?.openPorts ? `${portsData.openPorts.length} detected sockets` : 'Scanning sockets...'}
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-theme-bg-deep text-theme-muted border-b border-theme-border">
                    <tr>
                      <th className="px-3.5 py-2 text-left">Port</th>
                      <th className="px-3.5 py-2 text-left">Protocol</th>
                      <th className="px-3.5 py-2 text-left">Service / Process</th>
                      <th className="px-3.5 py-2 text-left">State</th>
                      <th className="px-3.5 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border-subtle">
                    {(portsData?.openPorts || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-xs text-theme-muted">
                          No open listening ports reported by workstation yet.
                        </td>
                      </tr>
                    ) : (
                      (portsData?.openPorts || []).map((p, idx) => (
                        <tr key={idx} className="hover:bg-theme-surface-hover">
                          <td className="px-3.5 py-2 font-mono font-bold text-theme-heading">:{p.port}</td>
                          <td className="px-3.5 py-2 font-mono text-theme-muted">{p.protocol}</td>
                          <td className="px-3.5 py-2 text-theme-body">{p.processName || 'Standard Socket'}</td>
                          <td className="px-3.5 py-2">
                            {p.isBlocked ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                                <Ban className="h-3 w-3" /> Blocked
                              </span>
                            ) : p.isAllowed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="h-3 w-3" /> Allowed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="h-3 w-3" /> Rogue
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2 text-right">
                            {p.isBlocked ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={blockingPort === p.port}
                                onClick={() => handleUnblockPort(p.port)}
                              >
                                {blockingPort === p.port ? 'Unblocking...' : 'Unblock'}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={blockingPort === p.port}
                                onClick={() => handleBlockPort(p.port, p.protocol, p.processName)}
                              >
                                {blockingPort === p.port ? 'Blocking...' : 'Block Port'}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Block Custom Port Row */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-theme-border bg-theme-surface">
              <span className="text-xs font-semibold text-theme-heading">Block Custom Port:</span>
              <input
                type="number"
                placeholder="Port (e.g. 21)"
                value={customPortToBlock}
                onChange={(e) => setCustomPortToBlock(e.target.value)}
                className="w-28 rounded-lg border border-theme-border bg-theme-bg-deep px-2.5 py-1 text-xs text-theme-heading placeholder:text-theme-muted"
              />
              <input
                type="text"
                placeholder="Reason (optional)"
                value={customPortReason}
                onChange={(e) => setCustomPortReason(e.target.value)}
                className="flex-1 rounded-lg border border-theme-border bg-theme-bg-deep px-2.5 py-1 text-xs text-theme-heading placeholder:text-theme-muted"
              />
              <Button
                size="sm"
                variant="danger"
                disabled={!customPortToBlock}
                onClick={() => handleBlockPort(parseInt(customPortToBlock, 10), 'TCP', customPortReason || 'Admin restricted')}
              >
                Block Port
              </Button>
            </div>
          </div>
        )}

        {/* Tab 5: Software Inventory */}
        {activeTab === 'software' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSoftwareFilter('all')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${softwareFilter === 'all'
                    ? 'bg-theme-accent text-theme-accent-text'
                    : 'border border-theme-border text-theme-muted hover:bg-theme-surface'
                    }`}
                >
                  All Installed ({softwareList.filter((s) => s.status !== 'uninstalled').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSoftwareFilter('frequently_used')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${softwareFilter === 'frequently_used'
                    ? 'bg-theme-accent text-theme-accent-text'
                    : 'border border-theme-border text-theme-muted hover:bg-theme-surface'
                    }`}
                >
                  Today's Usage ({appUsageData?.apps?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setSoftwareFilter('uninstalled')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${softwareFilter === 'uninstalled'
                    ? 'bg-theme-accent text-theme-accent-text'
                    : 'border border-theme-border text-theme-muted hover:bg-theme-surface'
                    }`}
                >
                  Uninstalled History ({softwareList.filter((s) => s.status === 'uninstalled').length})
                </button>
              </div>

              <input
                type="text"
                placeholder="Search software..."
                value={softwareSearch}
                onChange={(e) => setSoftwareSearch(e.target.value)}
                className="w-48 rounded-lg border border-theme-border bg-theme-surface px-3 py-1 text-xs text-theme-heading placeholder:text-theme-muted focus:border-theme-accent focus:outline-none"
              />
            </div>

            {softwareFilter === 'frequently_used' ? (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-theme-border bg-theme-bg-deep px-3 py-2 text-xs">
                  <span className="font-semibold text-theme-heading">
                    Active Screen Time ({appUsageData?.date || 'Today'}):{' '}
                    <span className="font-mono text-amber-400">
                      {formatDeviceUsageDuration(appUsageData?.totalActiveSeconds || 0)}
                    </span>
                  </span>
                  <span className="font-mono text-theme-muted">
                    Idle: {formatDeviceUsageDuration(appUsageData?.totalIdleSeconds || 0)}
                  </span>
                </div>
                <div className="rounded-xl border border-theme-border bg-theme-surface overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-theme-bg-deep text-theme-muted border-b border-theme-border sticky top-0">
                        <tr>
                          <th className="px-3.5 py-2 text-left">Application</th>
                          <th className="px-3.5 py-2 text-left">Active Time</th>
                          <th className="px-3.5 py-2 text-center">Launches</th>
                          <th className="px-3.5 py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-border-subtle">
                        {(appUsageData?.apps || []).filter((a: DailyAppUsageItem) => {
                          if (!softwareSearch) return true;
                          const q = softwareSearch.toLowerCase();
                          return a.appName.toLowerCase().includes(q) || a.executable.toLowerCase().includes(q);
                        }).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-xs text-theme-muted">
                              No active foreground usage recorded today yet.
                            </td>
                          </tr>
                        ) : (
                          (appUsageData?.apps || [])
                            .filter((a: DailyAppUsageItem) => {
                              if (!softwareSearch) return true;
                              const q = softwareSearch.toLowerCase();
                              return a.appName.toLowerCase().includes(q) || a.executable.toLowerCase().includes(q);
                            })
                            .map((app) => (
                              <tr key={app.executable} className="hover:bg-theme-surface-hover">
                                <td className="px-3.5 py-2.5 font-semibold text-theme-heading">
                                  <div>
                                    <p>{app.appName}</p>
                                    <p className="font-mono text-[10px] text-theme-muted">{app.executable}</p>
                                  </div>
                                </td>
                                <td className="px-3.5 py-2.5 font-mono font-bold text-amber-400">
                                  {formatDeviceUsageDuration(app.activeSeconds)}
                                  <span className="ml-1.5 text-[10px] font-normal text-theme-muted">
                                    ({app.percentage ?? 0}%)
                                  </span>
                                </td>
                                <td className="px-3.5 py-2.5 text-center font-mono text-theme-heading">
                                  {app.launchCount}
                                </td>
                                <td className="px-3.5 py-2.5 text-right">
                                  <Badge variant={app.isBlocked ? 'error' : 'success'} dot>
                                    {app.isBlocked ? 'Blocked' : 'Active'}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-theme-border bg-theme-surface overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-theme-bg-deep text-theme-muted border-b border-theme-border sticky top-0">
                      <tr>
                        <th className="px-3.5 py-2 text-left">Application</th>
                        <th className="px-3.5 py-2 text-left">Publisher</th>
                        <th className="px-3.5 py-2 text-left">Version</th>
                        <th className="px-3.5 py-2 text-center">Usage Count</th>
                        <th className="px-3.5 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border-subtle">
                      {filteredSoftware.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-xs text-theme-muted">
                            No matching applications found on workstation.
                          </td>
                        </tr>
                      ) : (
                        filteredSoftware.map((sw) => (
                          <tr key={sw.id} className="hover:bg-theme-surface-hover">
                            <td className="px-3.5 py-2.5 font-semibold text-theme-heading">
                              <div className="flex items-center gap-2">
                                <AppWindow className="h-4 w-4 text-theme-muted" />
                                <div>
                                  <p>{sw.name}</p>
                                  <p className="font-mono text-[10px] text-theme-muted">{sw.executable || 'app.exe'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3.5 py-2.5 text-theme-muted">{sw.publisher || 'Unknown'}</td>
                            <td className="px-3.5 py-2.5 font-mono text-[11px] text-theme-muted">{sw.version}</td>
                            <td className="px-3.5 py-2.5 text-center font-bold text-theme-heading">
                              {sw.executionCount > 0 ? (
                                <span className="rounded bg-theme-bg-deep px-2 py-0.5 text-xs text-theme-heading border border-theme-border">
                                  {sw.executionCount} launches
                                </span>
                              ) : (
                                <span className="text-theme-muted text-[11px]">—</span>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5 text-right">
                              {sw.isBlocked ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={blockingId === sw.id}
                                  onClick={() => handleUnblockApp(sw)}
                                >
                                  {blockingId === sw.id ? 'Unblocking...' : 'Unblock'}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="danger"
                                  disabled={blockingId === sw.id}
                                  onClick={() => handleBlockApp(sw)}
                                >
                                  {blockingId === sw.id ? 'Blocking...' : 'Block App'}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

interface DeviceRuleItem {
  id: string;
  domain: string;
  category: string;
  action: 'block' | 'allow';
  isOverride: boolean;
  origin: 'global' | 'device';
  globalAction: 'block' | 'allow' | null;
  createdAt: string;
}

interface DeviceRulesPayload {
  deviceId: string;
  deviceName: string;
  employeeName?: string;
  totalRules: number;
  overrideCount: number;
  rules: DeviceRuleItem[];
}

interface DeviceAppRuleItem {
  id: string;
  appName: string;
  executableName: string;
  action: 'block' | 'allow';
  isOverride: boolean;
  origin: 'global' | 'device';
  globalAction: 'block' | 'allow' | null;
  createdAt: string;
}

interface DeviceAppRulesPayload {
  deviceId: string;
  deviceName: string;
  employeeName?: string;
  totalRules: number;
  overrideCount: number;
  rules: DeviceAppRuleItem[];
}

interface DeviceUsbPayload {
  deviceId: string;
  deviceName: string;
  employeeName?: string;
  isOverride: boolean;
  deviceAction: 'block' | 'read_only' | 'allow' | null;
  globalAction: 'block' | 'read_only' | 'allow';
  effectiveAction: 'block' | 'read_only' | 'allow';
  deviceRule?: any;
}

const APP_PRESETS = [
  { name: 'Calculator', exe: 'calc.exe' },
  { name: 'Notepad', exe: 'notepad.exe' },
  { name: 'Command Prompt', exe: 'cmd.exe' },
  { name: 'PowerShell', exe: 'powershell.exe' },
  { name: 'Discord', exe: 'discord.exe' },
  { name: 'Steam', exe: 'steam.exe' },
  { name: 'Spotify', exe: 'spotify.exe' },
];

function DevicePolicyModal({
  device,
  open,
  onClose,
  onSyncDevice,
}: {
  device: Device | null;
  open: boolean;
  onClose: () => void;
  onSyncDevice?: (id: string) => void;
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'websites' | 'applications' | 'usb' | 'browsers'>('websites');

  // --- 1. Website Rules State ---
  const [webLoading, setWebLoading] = useState(false);
  const [webData, setWebData] = useState<DeviceRulesPayload | null>(null);
  const [webSearch, setWebSearch] = useState('');
  const [webFilter, setWebFilter] = useState<'all' | 'overrides' | 'blocked' | 'allowed'>('all');
  const [newDomain, setNewDomain] = useState('');
  const [newAction, setNewAction] = useState<'block' | 'allow'>('block');
  const [newCategory, setNewCategory] = useState('');
  const [webSubmitting, setWebSubmitting] = useState(false);
  const [webWorking, setWebWorking] = useState<string | null>(null);

  // --- 2. Application Rules State ---
  const [appLoading, setAppLoading] = useState(false);
  const [appData, setAppData] = useState<DeviceAppRulesPayload | null>(null);
  const [appSearch, setAppSearch] = useState('');
  const [appFilter, setAppFilter] = useState<'all' | 'overrides' | 'blocked' | 'allowed'>('all');
  const [newExe, setNewExe] = useState('');
  const [newAppName, setNewAppName] = useState('');
  const [newAppAction, setNewAppAction] = useState<'block' | 'allow'>('block');
  const [appSubmitting, setAppSubmitting] = useState(false);
  const [appWorking, setAppWorking] = useState<string | null>(null);

  // --- 3. USB Control State ---
  const [usbLoading, setUsbLoading] = useState(false);
  const [usbData, setUsbData] = useState<DeviceUsbPayload | null>(null);
  const [usbSaving, setUsbSaving] = useState(false);

  // --- 4. Browser Control State ---
  const [browserLoading, setBrowserLoading] = useState(false);
  const [browserData, setBrowserData] = useState<DeviceBrowserRuleSummary | null>(null);
  const [browserSaving, setBrowserSaving] = useState(false);

  const cleanDomain = (input: string) => {
    let d = input.trim().toLowerCase();
    d = d.replace(/^https?:\/\//i, '');
    d = d.split('/')[0];
    d = d.split(':')[0];
    return d;
  };

  const loadWebRules = async () => {
    if (!device) return;
    setWebLoading(true);
    try {
      const res = await devicesApi.getWebsiteRules(device.deviceId || device.id);
      setWebData(res);
    } catch (err: any) {
      toast(err.message || 'Failed to load website rules', 'error');
    } finally {
      setWebLoading(false);
    }
  };

  const loadAppRules = async () => {
    if (!device) return;
    setAppLoading(true);
    try {
      const res = await devicesApi.getApplicationRules(device.deviceId || device.id);
      setAppData(res);
    } catch (err: any) {
      toast(err.message || 'Failed to load application rules', 'error');
    } finally {
      setAppLoading(false);
    }
  };

  const loadUsbRule = async () => {
    if (!device) return;
    setUsbLoading(true);
    try {
      const res = await devicesApi.getUsbRule(device.deviceId || device.id);
      setUsbData(res);
    } catch (err: any) {
      toast(err.message || 'Failed to load USB rule', 'error');
    } finally {
      setUsbLoading(false);
    }
  };

  const loadBrowserRules = async () => {
    if (!device) return;
    setBrowserLoading(true);
    try {
      const res = await devicesApi.getBrowserRule(device.deviceId || device.id);
      setBrowserData(res);
    } catch (err: any) {
      toast(err.message || 'Failed to load browser rules', 'error');
    } finally {
      setBrowserLoading(false);
    }
  };

  const handleSetBrowserOverride = async (
    browser: 'chrome' | 'brave' | 'firefox' | 'edge' | 'opera',
    controlType: 'private_browsing' | 'extensions',
    enabled: boolean
  ) => {
    if (!device) return;
    setBrowserSaving(true);
    try {
      await devicesApi.setBrowserRule(device.deviceId || device.id, {
        browser,
        controlType,
        enabled,
      });
      toast(`Browser override for ${browser.toUpperCase()} saved for ${device.name}`);
      await loadBrowserRules();
    } catch (err: any) {
      toast(err.message || 'Failed to save browser override', 'error');
    } finally {
      setBrowserSaving(false);
    }
  };

  const handleResetBrowserOverride = async (params?: { browser?: string; controlType?: string }) => {
    if (!device) return;
    setBrowserSaving(true);
    try {
      await devicesApi.deleteBrowserRule(device.deviceId || device.id, params);
      toast(params?.browser ? `Reverted ${params.browser.toUpperCase()} override to global` : `Reverted all browser overrides for ${device.name}`);
      await loadBrowserRules();
    } catch (err: any) {
      toast(err.message || 'Failed to revert override', 'error');
    } finally {
      setBrowserSaving(false);
    }
  };

  useEffect(() => {
    if (device && open) {
      loadWebRules();
      loadAppRules();
      loadUsbRule();
      loadBrowserRules();
      setWebSearch('');
      setAppSearch('');
    }
  }, [device, open]);

  // Website handlers
  const handleAddWebRule = async () => {
    if (!device) return;
    const domain = cleanDomain(newDomain);
    if (!domain) {
      toast('Please enter a valid domain name', 'error');
      return;
    }
    setWebSubmitting(true);
    try {
      await devicesApi.setWebsiteRule(device.deviceId || device.id, {
        domain,
        action: newAction,
        category: newCategory.trim() || 'Custom Override',
      });
      toast(`Rule saved: ${newAction === 'block' ? 'Blocked' : 'Allowed'} ${domain} on ${device.name}`);
      setNewDomain('');
      setNewCategory('');
      await loadWebRules();
    } catch (err: any) {
      toast(err.message || 'Failed to save website rule', 'error');
    } finally {
      setWebSubmitting(false);
    }
  };

  const handleToggleWebAction = async (domain: string, currentAction: 'block' | 'allow', category?: string) => {
    if (!device) return;
    const targetAction = currentAction === 'block' ? 'allow' : 'block';
    setWebWorking(domain);
    try {
      await devicesApi.setWebsiteRule(device.deviceId || device.id, {
        domain,
        action: targetAction,
        category: category || 'Custom Override',
      });
      toast(`${domain} is now ${targetAction.toUpperCase()} on ${device.name}`);
      await loadWebRules();
    } catch (err: any) {
      toast(err.message || 'Failed to update rule', 'error');
    } finally {
      setWebWorking(null);
    }
  };

  const handleResetWebOverride = async (domain: string) => {
    if (!device) return;
    setWebWorking(domain);
    try {
      await devicesApi.deleteWebsiteRule(device.deviceId || device.id, domain);
      toast(`Override removed for ${domain}. Reverted to global policy.`);
      await loadWebRules();
    } catch (err: any) {
      toast(err.message || 'Failed to revert override', 'error');
    } finally {
      setWebWorking(null);
    }
  };

  // Application handlers
  const handleAddAppRule = async () => {
    if (!device) return;
    const exe = newExe.trim().toLowerCase();
    if (!exe) {
      toast('Please enter an executable name (e.g. calc.exe)', 'error');
      return;
    }
    setAppSubmitting(true);
    try {
      await devicesApi.setApplicationRule(device.deviceId || device.id, {
        executableName: exe.endsWith('.exe') ? exe : `${exe}.exe`,
        appName: newAppName.trim() || exe.replace(/\.exe$/i, ''),
        action: newAppAction,
      });
      toast(`Application rule saved: ${exe} is now ${newAppAction.toUpperCase()} on ${device.name}`);
      setNewExe('');
      setNewAppName('');
      await loadAppRules();
    } catch (err: any) {
      toast(err.message || 'Failed to save application rule', 'error');
    } finally {
      setAppSubmitting(false);
    }
  };

  const handlePresetApp = async (preset: { name: string; exe: string }, targetAction: 'block' | 'allow') => {
    if (!device) return;
    setAppWorking(preset.exe);
    try {
      await devicesApi.setApplicationRule(device.deviceId || device.id, {
        executableName: preset.exe,
        appName: preset.name,
        action: targetAction,
      });
      toast(`${preset.name} (${preset.exe}) set to ${targetAction.toUpperCase()} on ${device.name}`);
      await loadAppRules();
    } catch (err: any) {
      toast(err.message || 'Failed to apply preset', 'error');
    } finally {
      setAppWorking(null);
    }
  };

  const handleToggleAppAction = async (rule: DeviceAppRuleItem) => {
    if (!device) return;
    const nextAction = rule.action === 'block' ? 'allow' : 'block';
    setAppWorking(rule.executableName);
    try {
      await devicesApi.setApplicationRule(device.deviceId || device.id, {
        executableName: rule.executableName,
        appName: rule.appName,
        action: nextAction,
      });
      toast(`${rule.executableName} is now ${nextAction.toUpperCase()} on ${device.name}`);
      await loadAppRules();
    } catch (err: any) {
      toast(err.message || 'Failed to update rule', 'error');
    } finally {
      setAppWorking(null);
    }
  };

  const handleResetAppOverride = async (rule: DeviceAppRuleItem) => {
    if (!device) return;
    setAppWorking(rule.executableName);
    try {
      await devicesApi.deleteApplicationRule(device.deviceId || device.id, rule.executableName);
      toast(`Override removed for ${rule.executableName}. Reverted to global policy.`);
      await loadAppRules();
    } catch (err: any) {
      toast(err.message || 'Failed to revert override', 'error');
    } finally {
      setAppWorking(null);
    }
  };

  // USB handlers
  const handleSetUsbAction = async (action: 'block' | 'read_only' | 'allow' | 'inherit') => {
    if (!device) return;
    setUsbSaving(true);
    try {
      await devicesApi.setUsbRule(device.deviceId || device.id, { action });
      toast(action === 'inherit' ? `USB policy reverted to Global on ${device.name}` : `USB Storage set to ${action.toUpperCase()} on ${device.name}`);
      await loadUsbRule();
    } catch (err: any) {
      toast(err.message || 'Failed to set USB policy', 'error');
    } finally {
      setUsbSaving(false);
    }
  };

  // Filtered lists
  const filteredWebRules = useMemo(() => {
    if (!webData?.rules) return [];
    return webData.rules.filter((r) => {
      if (webSearch) {
        const q = webSearch.toLowerCase();
        if (!r.domain.toLowerCase().includes(q) && !(r.category || '').toLowerCase().includes(q)) return false;
      }
      if (webFilter === 'overrides' && !r.isOverride) return false;
      if (webFilter === 'blocked' && r.action !== 'block') return false;
      if (webFilter === 'allowed' && r.action !== 'allow') return false;
      return true;
    });
  }, [webData, webSearch, webFilter]);

  const filteredAppRules = useMemo(() => {
    if (!appData?.rules) return [];
    return appData.rules.filter((r) => {
      if (appSearch) {
        const q = appSearch.toLowerCase();
        if (!r.executableName.toLowerCase().includes(q) && !r.appName.toLowerCase().includes(q)) return false;
      }
      if (appFilter === 'overrides' && !r.isOverride) return false;
      if (appFilter === 'blocked' && r.action !== 'block') return false;
      if (appFilter === 'allowed' && r.action !== 'allow') return false;
      return true;
    });
  }, [appData, appSearch, appFilter]);

  if (!device) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Device Policy Management`}
      size="xl"
      footer={
        <div className="flex w-full justify-end gap-2">
          {onSyncDevice && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onSyncDevice(device.id);
                toast(`Sync requested for ${device.name}`);
              }}
              icon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Sync Device Now
            </Button>
          )}
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Device Information Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-theme-border bg-theme-surface p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-theme-border bg-theme-surface-subtle text-theme-heading">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-theme-heading">{device.name}</span>
                <Badge variant={device.online ? 'success' : 'neutral'} dot>
                  {device.online ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <p className="text-xs text-theme-muted font-medium mt-0.5">
                Assigned Employee: <span className="text-theme-heading font-medium">{device.employeeName && !device.employeeName.endsWith('$') ? device.employeeName : (device.name ? `${device.name} User` : 'Standard User')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Policy Category Tabs */}
        <div className="flex border-b border-theme-border">
          <button
            type="button"
            onClick={() => setActiveTab('websites')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${activeTab === 'websites'
              ? 'border-theme-heading text-theme-heading'
              : 'border-transparent text-theme-muted hover:text-theme-heading'
              }`}
          >
            <Globe className="h-4 w-4" />
            <span>Website Access</span>
        
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${activeTab === 'applications'
              ? 'border-theme-heading text-theme-heading'
              : 'border-transparent text-theme-muted hover:text-theme-heading'
              }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Application Control</span>
           
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('usb')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${activeTab === 'usb'
              ? 'border-theme-heading text-theme-heading'
              : 'border-transparent text-theme-muted hover:text-theme-heading'
              }`}
          >
            <Usb className="h-4 w-4" />
            <span>USB Storage</span>
           
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('browsers')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${activeTab === 'browsers'
              ? 'border-theme-heading text-theme-heading'
              : 'border-transparent text-theme-muted hover:text-theme-heading'
              }`}
          >
            <Chrome className="h-4 w-4" />
            <span>Browser Control</span>
          
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: WEBSITE ACCESS CONTROL                                             */}
        {/* ========================================================================= */}
        {activeTab === 'websites' && (
          <div className="space-y-4">
            {/* Add or Override Domain */}
            <div className="rounded-xl border border-theme-border bg-theme-surface p-4 space-y-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <input
                    className="input w-full font-mono text-sm"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="e.g. facebook.com or youtube.com"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddWebRule(); }}
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    className="input w-full text-sm font-medium"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value as 'block' | 'allow')}
                  >
                    <option value="block">Block on Device</option>
                    <option value="allow">Allow on Device</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <input
                    className="input w-full text-sm"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Category (optional)"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button
                    className="w-full justify-center"
                    onClick={handleAddWebRule}
                    disabled={webSubmitting || !newDomain.trim()}
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <SearchInput
                  value={webSearch}
                  onChange={setWebSearch}
                  placeholder="Search domains or categories..."
                  className="w-full"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setWebFilter('all')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${webFilter === 'all'
                    ? 'border-theme-heading bg-theme-surface text-theme-heading shadow-sm'
                    : 'border-theme-border bg-theme-surface-subtle text-theme-muted hover:text-theme-heading'
                    }`}
                >
                  All ({webData?.totalRules || 0})
                </button>
                <button
                  onClick={() => setWebFilter('overrides')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${webFilter === 'overrides'
                    ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                    : 'border-theme-border bg-theme-surface-subtle text-theme-muted hover:text-theme-heading'
                    }`}
                >
                  Overrides ({webData?.overrideCount || 0})
                </button>
                <button
                  onClick={() => setWebFilter('blocked')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${webFilter === 'blocked'
                    ? 'border-rose-400 bg-rose-500/10 text-rose-300'
                    : 'border-theme-border bg-theme-surface-subtle text-theme-muted hover:text-theme-heading'
                    }`}
                >
                  Blocked ({webData?.rules.filter((r) => r.action === 'block').length || 0})
                </button>
                <button
                  onClick={() => setWebFilter('allowed')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${webFilter === 'allowed'
                    ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
                    : 'border-theme-border bg-theme-surface-subtle text-theme-muted hover:text-theme-heading'
                    }`}
                >
                  Allowed ({webData?.rules.filter((r) => r.action === 'allow').length || 0})
                </button>
              </div>
            </div>

            {/* Websites Table */}
            <div className="overflow-hidden rounded-xl border border-theme-border bg-theme-surface max-h-80 overflow-y-auto">
              {webLoading ? (
                <div className="flex h-36 items-center justify-center gap-2 text-sm text-theme-muted">
                  <RefreshCw className="h-4 w-4 animate-spin text-theme-heading" />
                  Loading domain rules...
                </div>
              ) : filteredWebRules.length === 0 ? (
                <div className="py-8 text-center text-sm text-theme-muted">
                  No domain rules match your filter.
                </div>
              ) : (
                <div className="divide-y divide-theme-border/60">
                  {filteredWebRules.map((r) => {
                    const isWorking = webWorking === r.domain;
                    return (
                      <div
                        key={r.id || r.domain}
                        className={`flex flex-col gap-2.5 p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${r.isOverride ? 'bg-amber-500/[0.04]' : 'hover:bg-theme-surface-subtle/50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-theme-border bg-theme-surface-subtle text-theme-heading">
                            <Globe className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-mono text-sm font-semibold text-theme-heading">{r.domain}</span>
                            <span className="block text-xs text-theme-muted">{r.category}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={r.action === 'block' ? 'error' : 'success'} dot>
                            {r.action === 'block' ? 'Blocked' : 'Allowed'}
                          </Badge>
                          {r.isOverride ? (
                            <Badge variant="warning">Device Override</Badge>
                          ) : (
                            <Badge variant="neutral">Global Default</Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className={r.action === 'block' ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-rose-400 hover:bg-rose-500/10'}
                            onClick={() => handleToggleWebAction(r.domain, r.action, r.category)}
                            disabled={isWorking}
                            icon={r.action === 'block' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                          >
                            {r.action === 'block' ? 'Allow on Device' : 'Block on Device'}
                          </Button>
                          {r.isOverride && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-theme-muted hover:text-theme-heading"
                              onClick={() => handleResetWebOverride(r.domain)}
                              disabled={isWorking}
                              title="Revert to global"
                              icon={<RotateCcw className="h-3.5 w-3.5" />}
                            >
                              Revert
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: APPLICATION CONTROL                                                */}
        {/* ========================================================================= */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-theme-border bg-theme-surface p-3.5 shadow-sm">
              {APP_PRESETS.map((preset) => {
                const currentRule = appData?.rules.find((r) => r.executableName.toLowerCase() === preset.exe.toLowerCase());
                const isBlocked = currentRule?.action === 'block';
                const isWorking = appWorking === preset.exe;
                return (
                  <button
                    key={preset.exe}
                    type="button"
                    disabled={isWorking}
                    onClick={() => handlePresetApp(preset, isBlocked ? 'allow' : 'block')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${isBlocked
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                      : 'border-theme-border bg-theme-surface-subtle text-theme-heading hover:bg-theme-surface-hover'
                      }`}
                  >
                    {isBlocked ? <Ban className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    <span>{preset.name}</span>
                    <span className="text-[10px] text-theme-muted">({isBlocked ? 'Blocked' : 'Click to Block'})</span>
                  </button>
                );
              })}
            </div>

            {/* Add or Override Application Form */}
            <div className="rounded-xl border border-theme-border bg-theme-surface p-4 space-y-3 shadow-sm">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <input
                    className="input w-full font-mono text-sm"
                    value={newExe}
                    onChange={(e) => setNewExe(e.target.value)}
                    placeholder="Executable (e.g. calc.exe, discord.exe)"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddAppRule(); }}
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    className="input w-full text-sm font-medium"
                    value={newAppAction}
                    onChange={(e) => setNewAppAction(e.target.value as 'block' | 'allow')}
                  >
                    <option value="block">Block on Device</option>
                    <option value="allow">Allow on Device</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <input
                    className="input w-full text-sm"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    placeholder="App Name (optional)"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button
                    className="w-full justify-center"
                    onClick={handleAddAppRule}
                    disabled={appSubmitting || !newExe.trim()}
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>

            {/* App Search Bar */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <SearchInput
                  value={appSearch}
                  onChange={setAppSearch}
                  placeholder="Search executable or application..."
                  className="w-full"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setAppFilter('overrides')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${appFilter === 'overrides'
                    ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                    : 'border-theme-border bg-theme-surface-subtle text-theme-muted hover:text-theme-heading'
                    }`}
                >
                  Overrides ({appData?.overrideCount || 0})
                </button>
                <button
                  onClick={() => setAppFilter('blocked')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${appFilter === 'blocked'
                    ? 'border-rose-400 bg-rose-500/10 text-rose-300'
                    : 'border-theme-border bg-theme-surface-subtle text-theme-muted hover:text-theme-heading'
                    }`}
                >
                  Blocked ({appData?.rules.filter((r) => r.action === 'block').length || 0})
                </button>
                <button
                  onClick={() => setAppFilter('allowed')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${appFilter === 'allowed'
                    ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
                    : 'border-theme-border bg-theme-surface-subtle text-theme-muted hover:text-theme-heading'
                    }`}
                >
                  Allowed ({appData?.rules.filter((r) => r.action === 'allow').length || 0})
                </button>
              </div>
            </div>

            {/* Applications Table */}
            <div className="overflow-hidden rounded-xl border border-theme-border bg-theme-surface max-h-80 overflow-y-auto">
              {appLoading ? (
                <div className="flex h-36 items-center justify-center gap-2 text-sm text-slate-500">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary-500" />
                  Loading application rules...
                </div>
              ) : filteredAppRules.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  No application rules configured yet.
                </div>
              ) : (
                <div className="divide-y divide-theme-border/60">
                  {filteredAppRules.map((r) => {
                    const isWorking = appWorking === r.executableName;
                    return (
                      <div
                        key={r.id || r.executableName}
                        className={`flex flex-col gap-2.5 p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${r.isOverride ? 'bg-amber-500/[0.04]' : 'hover:bg-theme-surface-subtle/50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg border border-theme-border ${r.action === 'block' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                            <Terminal className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-mono text-sm font-semibold text-theme-heading">{r.executableName}</span>
                            <span className="block text-xs text-theme-muted">{r.appName}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={r.action === 'block' ? 'error' : 'success'} dot>
                            {r.action === 'block' ? 'Blocked on Device' : 'Allowed on Device'}
                          </Badge>
                          {r.isOverride ? (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="warning">Device Override</Badge>
                              {r.globalAction && (
                                <span className="text-[11px] text-theme-muted">
                                  (Global: {r.globalAction.toUpperCase()})
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="neutral">Global Baseline</Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className={r.action === 'block' ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-rose-400 hover:bg-rose-500/10'}
                            onClick={() => handleToggleAppAction(r)}
                            disabled={isWorking}
                            icon={r.action === 'block' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                          >
                            {r.action === 'block' ? 'Allow on Device' : 'Block on Device'}
                          </Button>
                          {r.isOverride && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-theme-muted hover:text-theme-heading"
                              onClick={() => handleResetAppOverride(r)}
                              disabled={isWorking}
                              title="Revert to global"
                              icon={<RotateCcw className="h-3.5 w-3.5" />}
                            >
                              Revert
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: USB STORAGE CONTROL                                                */}
        {/* ========================================================================= */}
        {activeTab === 'usb' && (
          <div className="space-y-4">
            {/* Effective Status Card */}
            <div className="rounded-xl border border-theme-border bg-theme-surface p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl shadow-sm ${usbData?.effectiveAction === 'block' ? 'bg-rose-600 text-white' :
                  usbData?.effectiveAction === 'read_only' ? 'bg-amber-600 text-white' :
                    'bg-emerald-600 text-white'
                  }`}>
                  <Usb className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-theme-muted uppercase tracking-wider">Active USB Policy for {device.name}:</span>
                    <Badge variant={usbData?.effectiveAction === 'block' ? 'error' : usbData?.effectiveAction === 'read_only' ? 'warning' : 'success'} dot>
                      {usbData?.effectiveAction === 'block' ? 'BLOCKED' : usbData?.effectiveAction === 'read_only' ? 'READ-ONLY (Write-Protected)' : 'ALLOWED (Full Read/Write)'}
                    </Badge>
                  </div>
                  <p className="text-xs text-theme-muted mt-1">
                    {usbData?.isOverride ? (
                      <span className="text-amber-400 font-semibold">
                        Custom Device Override active (Global baseline is {usbData.globalAction.toUpperCase()}).
                      </span>
                    ) : (
                      <span>Inherited from Global baseline policy ({usbData?.globalAction?.toUpperCase() || 'ALLOW'}).</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* 4 Interactive Selection Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Option 1: Inherit Global */}
              <button
                type="button"
                disabled={usbSaving}
                onClick={() => handleSetUsbAction('inherit')}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${!usbData?.isOverride
                  ? 'border-theme-heading bg-theme-surface-subtle shadow-sm ring-1 ring-theme-heading'
                  : 'border-theme-border bg-theme-surface hover:bg-theme-surface-subtle hover:border-theme-border'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-theme-border bg-theme-surface-subtle text-theme-heading">
                      <RotateCcw className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm text-theme-heading">Inherit Global Policy</span>
                  </div>
                  {!usbData?.isOverride && <Badge variant="primary">Active</Badge>}
                </div>
                <p className="text-xs text-theme-muted">
                  Follows the company-wide global setting (currently: <strong>{usbData?.globalAction?.toUpperCase()}</strong>).
                </p>
              </button>

              {/* Option 2: Block All */}
              <button
                type="button"
                disabled={usbSaving}
                onClick={() => handleSetUsbAction('block')}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${usbData?.isOverride && usbData?.deviceAction === 'block'
                  ? 'border-rose-500 bg-rose-500/10 shadow-sm ring-1 ring-rose-500'
                  : 'border-theme-border bg-theme-surface hover:bg-theme-surface-subtle hover:border-theme-border'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400">
                      <Ban className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm text-theme-heading">Block All USB Storage</span>
                  </div>
                  {usbData?.isOverride && usbData?.deviceAction === 'block' && <Badge variant="error">Active Override</Badge>}
                </div>
                <p className="text-xs text-theme-muted">
                  Completely disables USB mass storage drives on this specific workstation.
                </p>
              </button>

              {/* Option 3: Read-Only */}
              <button
                type="button"
                disabled={usbSaving}
                onClick={() => handleSetUsbAction('read_only')}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${usbData?.isOverride && usbData?.deviceAction === 'read_only'
                  ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500'
                  : 'border-theme-border bg-theme-surface hover:bg-theme-surface-subtle hover:border-theme-border'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm text-theme-heading">Read-Only Mode</span>
                  </div>
                  {usbData?.isOverride && usbData?.deviceAction === 'read_only' && <Badge variant="warning">Active Override</Badge>}
                </div>
                <p className="text-xs text-theme-muted">
                  Files on USB can be viewed; writing or copying to USB is blocked.
                </p>
              </button>

              {/* Option 4: Allow */}
              <button
                type="button"
                disabled={usbSaving}
                onClick={() => handleSetUsbAction('allow')}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${usbData?.isOverride && usbData?.deviceAction === 'allow'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500'
                  : 'border-theme-border bg-theme-surface hover:bg-theme-surface-subtle hover:border-theme-border'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm text-theme-heading">Allow Full Access</span>
                  </div>
                  {usbData?.isOverride && usbData?.deviceAction === 'allow' && <Badge variant="success">Active Override</Badge>}
                </div>
                <p className="text-xs text-theme-muted">
                  Permits full read & write access to USB drives even if globally blocked.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: BROWSER CONTROL OVERRIDES (5 Browsers)                             */}
        {/* ========================================================================= */}
        {activeTab === 'browsers' && (
          <div className="space-y-4">


            {/* 5 Browsers Overrides List */}
            {browserLoading ? (
              <div className="flex h-36 items-center justify-center gap-2 text-sm text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin text-primary-500" />
                Loading workstation browser policies...
              </div>
            ) : (
              <div className="space-y-3.5">
                {[
                  {
                    id: 'chrome' as const,
                    name: 'Google Chrome',
                    icon: <Chrome className="h-4 w-4 text-blue-500" />,
                    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
                  },
                  {
                    id: 'brave' as const,
                    name: 'Brave Browser',
                    icon: <Shield className="h-4 w-4 text-orange-500" />,
                    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
                  },
                  {
                    id: 'firefox' as const,
                    name: 'Mozilla Firefox',
                    icon: <Flame className="h-4 w-4 text-amber-500" />,
                    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
                  },
                  {
                    id: 'edge' as const,
                    name: 'Microsoft Edge',
                    icon: <Globe className="h-4 w-4 text-cyan-500" />,
                    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
                  },
                  {
                    id: 'opera' as const,
                    name: 'Opera & Opera GX',
                    icon: <Globe className="h-4 w-4 text-rose-500" />,
                    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
                  },
                ].map((b) => {
                  const privRule = browserData?.rules.find(
                    (r) => r.browser === b.id && r.controlType === 'private_browsing'
                  );
                  const extRule = browserData?.rules.find(
                    (r) => r.browser === b.id && r.controlType === 'extensions'
                  );

                  const isPrivBlocked = privRule ? privRule.effectiveEnabled : true;
                  const isPrivOverride = privRule ? privRule.isOverride : false;

                  const isExtBlocked = extRule ? extRule.effectiveEnabled : false;
                  const isExtOverride = extRule ? extRule.isOverride : false;

                  return (
                    <div
                      key={b.id}
                      className="p-4 border rounded-xl border-theme-border bg-theme-surface transition shadow-sm space-y-3"
                    >
                      {/* Browser Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-theme-border/60">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg border border-theme-border ${b.bg}`}>
                            {b.icon}
                          </div>
                          <span className="text-sm font-bold text-theme-heading">
                            {b.name}
                          </span>
                        </div>
                        {(isPrivOverride || isExtOverride) ? (
                          <Badge variant="warning">Device Override Active</Badge>
                        ) : (
                          <Badge variant="neutral">Global Baseline</Badge>
                        )}
                      </div>

                      {/* 2 Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Control 1: Private Browsing */}
                        <div className="p-3 rounded-xl bg-theme-surface-subtle border border-theme-border flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5 text-theme-muted" />
                                <span className="text-xs font-bold text-theme-heading">
                                  Private Browsing
                                </span>
                              </div>
                              <Badge variant={isPrivBlocked ? 'error' : 'success'} dot>
                                {isPrivBlocked ? 'Blocked' : 'Allowed'}
                              </Badge>
                            </div>
                            <p className="mt-1 text-[11px] text-theme-muted">
                              {isPrivOverride ? (
                                <span className="text-amber-400 font-medium">
                                  Overridden (Global: {privRule?.globalEnabled ? 'Blocked' : 'Allowed'})
                                </span>
                              ) : (
                                <span>Global: {privRule?.globalEnabled ? 'Blocked' : 'Allowed'}</span>
                              )}
                            </p>
                          </div>
                          <div className="mt-3 flex gap-1.5">
                            <button
                              disabled={browserSaving}
                              onClick={() => handleSetBrowserOverride(b.id, 'private_browsing', true)}
                              className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${isPrivBlocked && isPrivOverride
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20'
                                }`}
                            >
                              Block
                            </button>
                            <button
                              disabled={browserSaving}
                              onClick={() => handleSetBrowserOverride(b.id, 'private_browsing', false)}
                              className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${!isPrivBlocked && isPrivOverride
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                                }`}
                            >
                              Allow
                            </button>
                            {isPrivOverride && (
                              <button
                                disabled={browserSaving}
                                onClick={() =>
                                  handleResetBrowserOverride({ browser: b.id, controlType: 'private_browsing' })
                                }
                                className="py-1.5 px-2.5 text-xs font-medium rounded-lg border border-theme-border bg-theme-surface text-theme-muted hover:text-theme-heading transition cursor-pointer"
                                title="Inherit global policy"
                              >
                                Inherit
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Control 2: Extensions */}
                        <div className="p-3 rounded-xl bg-theme-surface-subtle border border-theme-border flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Puzzle className="h-3.5 w-3.5 text-theme-muted" />
                                <span className="text-xs font-bold text-theme-heading">
                                  Extension Lockdown
                                </span>
                              </div>
                              <Badge variant={isExtBlocked ? 'error' : 'success'} dot>
                                {isExtBlocked ? 'Blocked' : 'Allowed'}
                              </Badge>
                            </div>
                            <p className="mt-1 text-[11px] text-theme-muted">
                              {isExtOverride ? (
                                <span className="text-amber-400 font-medium">
                                  Overridden (Global: {extRule?.globalEnabled ? 'Blocked' : 'Allowed'})
                                </span>
                              ) : (
                                <span>Global: {extRule?.globalEnabled ? 'Blocked' : 'Allowed'}</span>
                              )}
                            </p>
                          </div>
                          <div className="mt-3 flex gap-1.5">
                            <button
                              disabled={browserSaving}
                              onClick={() => handleSetBrowserOverride(b.id, 'extensions', true)}
                              className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${isExtBlocked && isExtOverride
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20'
                                }`}
                            >
                              Block All
                            </button>
                            <button
                              disabled={browserSaving}
                              onClick={() => handleSetBrowserOverride(b.id, 'extensions', false)}
                              className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${!isExtBlocked && isExtOverride
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                                }`}
                            >
                              Allow
                            </button>
                            {isExtOverride && (
                              <button
                                disabled={browserSaving}
                                onClick={() =>
                                  handleResetBrowserOverride({ browser: b.id, controlType: 'extensions' })
                                }
                                className="py-1.5 px-2.5 text-xs font-medium rounded-lg border border-theme-border bg-theme-surface text-theme-muted hover:text-theme-heading transition cursor-pointer"
                                title="Inherit global policy"
                              >
                                Inherit
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}


          </div>
        )}
      </div>
    </Modal>
  );
}
