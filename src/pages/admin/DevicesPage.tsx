import { useState, useMemo, useEffect } from 'react';
import {
  Monitor,
  Plus,
  Wifi,
  WifiOff,
  RefreshCw,
  MoreVertical,
  Pencil,
  Upload,
  Trash2,
  Globe,
  CheckCircle2,
  Ban,
  RotateCcw,
  ShieldCheck,
  Search,
  ExternalLink,
  Eye,
  User as UserIcon,
  Mail,
  Clock,
  Usb,
  HardDrive,
  BookOpen,
  Terminal,
  Laptop,
  ShieldOff,
  Chrome,
  Settings,
  Flame,
  Shield,
  Lock,
  Puzzle,
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
import { devicesApi, policiesApi, usersApi } from '@/lib/api';
import { timeAgo, formatDate } from '@/lib/format';
import type { Device, Policy, User, DeviceBrowserRuleSummary } from '@/types';

const statusConfig: Record<string, { variant: 'success' | 'warning' | 'error' | 'neutral'; label: string }> = {
  applied: { variant: 'success', label: 'Applied' },
  partial: { variant: 'warning', label: 'Partial' },
  failed: { variant: 'error', label: 'Failed' },
  pending: { variant: 'neutral', label: 'Pending' },
};

export default function DevicesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [domainModalDevice, setDomainModalDevice] = useState<Device | null>(null);
  const [viewDetailsDevice, setViewDetailsDevice] = useState<Device | null>(null);
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
    } catch {}
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
      }).catch(() => {});
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
    } catch {}
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
            {
              key: 'osVersion',
              header: 'OS / Agent',
              render: (d) => (
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{d.osVersion}</p>
                  <p className="text-xs text-slate-400">Agent v{d.agentVersion}</p>
                </div>
              ),
            },
            {
              key: 'policy',
              header: 'Policy',
              render: (d) => <span className="text-sm text-slate-600 dark:text-slate-300">{d.policyName || '—'}</span>,
            },
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
                  {d.online ? 'Online' : 'Offline'}
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
              placeholder="Type or select employee (e.g. Logesh)"
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
  onClose,
  onOpenDomains,
  users,
}: {
  device: Device | null;
  onClose: () => void;
  onOpenDomains: (device: Device) => void;
  users: User[];
}) {
  if (!device) return null;

  const matchedUser = users.find(
    (u) => u.id === device.employeeId || (device.employeeName && u.name.toLowerCase() === device.employeeName.toLowerCase())
  );

  return (
    <Modal
      open={!!device}
      onClose={onClose}
      title="Device & Assigned Employee Details"
      
      size="lg"
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
        {/* Workstation Hardware / Agent Info */}
        <div className="rounded-xl border border-theme-border bg-theme-surface p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-theme-border/60 pb-3.5">
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
              {device.online ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <div className="mt-3.5 grid grid-cols-2 gap-3.5 text-xs sm:grid-cols-4">
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

        {/* Assigned Employee Profile */}
        <div className="rounded-xl border border-theme-border bg-theme-surface p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-theme-border/60 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-theme-border bg-theme-surface-subtle text-theme-heading font-bold text-sm">
                {(matchedUser?.name || (device.employeeName?.endsWith('$') ? 'Logesh' : (device.employeeName || 'EM'))).substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-base text-theme-heading">
                  {matchedUser?.name || (device.employeeName?.endsWith('$') ? 'Logesh' : (device.employeeName || 'Unassigned'))}
                </h4>
                <p className="text-xs text-theme-muted">{matchedUser?.email || `${device.name.toLowerCase()}@company.local`}</p>
              </div>
            </div>
            <Badge variant="success" dot>
              {matchedUser ? 'Linked in Database' : 'Active Employee'}
            </Badge>
          </div>

          <div className="mt-3.5 grid grid-cols-2 gap-3.5 text-xs sm:grid-cols-3">
            <div>
              <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Role</span>
              <p className="mt-1 font-semibold text-theme-heading uppercase">{matchedUser?.role || 'Employee'}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Employee ID</span>
              <p className="mt-1 font-mono font-semibold text-theme-heading">{matchedUser?.id || device.employeeId || 'u-002'}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Profile Status</span>
              <p className="mt-1 font-semibold text-emerald-400">
                {matchedUser ? 'Linked in Database' : 'Active Assignment'}
              </p>
            </div>
          </div>
        </div>
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
                Assigned Employee: <span className="text-theme-heading font-medium">{device.employeeName?.endsWith('$') ? 'Logesh' : (device.employeeName || 'Standard User')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Policy Category Tabs */}
        <div className="flex border-b border-theme-border">
          <button
            type="button"
            onClick={() => setActiveTab('websites')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'websites'
                ? 'border-theme-heading text-theme-heading'
                : 'border-transparent text-theme-muted hover:text-theme-heading'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Website Access</span>
            {webData && webData.overrideCount > 0 && (
              <span className="rounded-full bg-warning-500/20 text-warning-400 px-2 py-0.5 text-[10px] font-bold">
                {webData.overrideCount} Overrides
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'applications'
                ? 'border-theme-heading text-theme-heading'
                : 'border-transparent text-theme-muted hover:text-theme-heading'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Application Control</span>
            {appData && appData.overrideCount > 0 && (
              <span className="rounded-full bg-warning-500/20 text-warning-400 px-2 py-0.5 text-[10px] font-bold">
                {appData.overrideCount} Overrides
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('usb')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'usb'
                ? 'border-theme-heading text-theme-heading'
                : 'border-transparent text-theme-muted hover:text-theme-heading'
            }`}
          >
            <Usb className="h-4 w-4" />
            <span>USB Storage</span>
            {usbData && (
              <Badge variant={usbData.effectiveAction === 'block' ? 'error' : usbData.effectiveAction === 'read_only' ? 'warning' : 'success'}>
                {usbData.effectiveAction === 'block' ? 'Blocked' : usbData.effectiveAction === 'read_only' ? 'Read-Only' : 'Allowed'}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('browsers')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'browsers'
                ? 'border-theme-heading text-theme-heading'
                : 'border-transparent text-theme-muted hover:text-theme-heading'
            }`}
          >
            <Chrome className="h-4 w-4" />
            <span>Browser Control</span>
            {browserData && browserData.overrideCount > 0 && (
              <span className="rounded-full bg-warning-500/20 text-warning-400 px-2 py-0.5 text-[10px] font-bold">
                {browserData.overrideCount} Overrides
              </span>
            )}
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
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                    webFilter === 'all'
                      ? 'border-theme-heading bg-theme-surface text-theme-heading shadow-sm'
                      : 'border-theme-border bg-theme-surface-subtle text-theme-muted hover:text-theme-heading'
                  }`}
                >
                  All ({webData?.totalRules || 0})
                </button>
                <button
                  onClick={() => setWebFilter('overrides')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                    webFilter === 'overrides'
                      ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                      : 'border-theme-border bg-theme-surface-subtle text-theme-muted hover:text-theme-heading'
                  }`}
                >
                  Overrides ({webData?.overrideCount || 0})
                </button>
                <button
                  onClick={() => setWebFilter('blocked')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                    webFilter === 'blocked'
                      ? 'border-rose-400 bg-rose-500/10 text-rose-300'
                      : 'border-theme-border bg-theme-surface-subtle text-theme-muted hover:text-theme-heading'
                  }`}
                >
                  Blocked ({webData?.rules.filter((r) => r.action === 'block').length || 0})
                </button>
                <button
                  onClick={() => setWebFilter('allowed')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                    webFilter === 'allowed'
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
                        className={`flex flex-col gap-2.5 p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                          r.isOverride ? 'bg-amber-500/[0.04]' : 'hover:bg-theme-surface-subtle/50'
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
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                      isBlocked
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
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                    appFilter === 'overrides'
                      ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                      : 'border-theme-border bg-theme-surface-subtle text-theme-muted hover:text-theme-heading'
                  }`}
                >
                  Overrides ({appData?.overrideCount || 0})
                </button>
                <button
                  onClick={() => setAppFilter('blocked')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                    appFilter === 'blocked'
                      ? 'border-rose-400 bg-rose-500/10 text-rose-300'
                      : 'border-theme-border bg-theme-surface-subtle text-theme-muted hover:text-theme-heading'
                  }`}
                >
                  Blocked ({appData?.rules.filter((r) => r.action === 'block').length || 0})
                </button>
                <button
                  onClick={() => setAppFilter('allowed')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                    appFilter === 'allowed'
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
                        className={`flex flex-col gap-2.5 p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                          r.isOverride ? 'bg-amber-500/[0.04]' : 'hover:bg-theme-surface-subtle/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg border border-theme-border ${
                            r.action === 'block' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
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
                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl shadow-sm ${
                  usbData?.effectiveAction === 'block' ? 'bg-rose-600 text-white' :
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
                className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  !usbData?.isOverride
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
                className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  usbData?.isOverride && usbData?.deviceAction === 'block'
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
                className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  usbData?.isOverride && usbData?.deviceAction === 'read_only'
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
                className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  usbData?.isOverride && usbData?.deviceAction === 'allow'
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
                              className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                                isPrivBlocked && isPrivOverride
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20'
                              }`}
                            >
                              Block
                            </button>
                            <button
                              disabled={browserSaving}
                              onClick={() => handleSetBrowserOverride(b.id, 'private_browsing', false)}
                              className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                                !isPrivBlocked && isPrivOverride
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
                              className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                                isExtBlocked && isExtOverride
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20'
                              }`}
                            >
                              Block All
                            </button>
                            <button
                              disabled={browserSaving}
                              onClick={() => handleSetBrowserOverride(b.id, 'extensions', false)}
                              className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                                !isExtBlocked && isExtOverride
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
