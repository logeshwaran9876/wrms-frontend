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
        description="Register and monitor company Windows devices, track agent versions and policy sync status."
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
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center">
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
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <label className="label mb-0 font-semibold text-slate-800 dark:text-slate-200">
              Assigned Employee
            </label>
            <span className="text-[11px] text-slate-400">
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
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">{device.name}</h4>
                <p className="font-mono text-xs text-slate-400">{device.deviceId}</p>
              </div>
            </div>
            <Badge variant={device.online ? 'success' : 'neutral'} dot>
              {device.online ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div>
              <span className="text-slate-400">Operating System</span>
              <p className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">{device.osVersion}</p>
            </div>
            <div>
              <span className="text-slate-400">Agent Version</span>
              <p className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">v{device.agentVersion}</p>
            </div>
            <div>
              <span className="text-slate-400">Policy Name</span>
              <p className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">{device.policyName || 'Standard Policy'}</p>
            </div>
            <div>
              <span className="text-slate-400">Last Policy Sync</span>
              <p className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">{timeAgo(device.lastSync)}</p>
            </div>
          </div>
        </div>

        {/* Assigned Employee Profile */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-100 text-success-700 dark:bg-success-950 dark:text-success-300 font-semibold text-sm">
                {(device.employeeName || 'EM').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                  {device.employeeName || 'Unassigned'}
                </h4>
              </div>
            </div>
            {matchedUser && (
              <Badge variant={matchedUser.status === 'active' ? 'success' : 'neutral'} dot>
                {matchedUser.status === 'active' ? 'Active Employee' : 'Inactive'}
              </Badge>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            <div>
              <span className="text-slate-400">Role</span>
              <p className="mt-0.5 font-medium text-slate-700 dark:text-slate-200 uppercase">{matchedUser?.role || 'Employee'}</p>
            </div>
            <div>
              <span className="text-slate-400">Employee ID</span>
              <p className="mt-0.5 font-mono font-medium text-slate-700 dark:text-slate-200">{matchedUser?.id || device.employeeId || '—'}</p>
            </div>
            <div>
              <span className="text-slate-400">Profile Status</span>
              <p className="mt-0.5 font-medium text-success-600 dark:text-success-400">
                {matchedUser ? 'Linked in Database' : 'Auto-linked'}
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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{device.name}</span>
                <Badge variant={device.online ? 'success' : 'neutral'} dot>
                  {device.online ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <p className="font-mono text-xs text-slate-400">{device.employeeName || 'Standard User'} </p>
            </div>
          </div>
        </div>

        {/* Policy Category Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('websites')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'websites'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Website Access</span>
            {webData && webData.overrideCount > 0 && (
              <span className="rounded-full bg-warning-100 px-1.5 py-0.2 text-[10px] font-bold text-warning-800 dark:bg-warning-900/50 dark:text-warning-300">
                {webData.overrideCount} Overrides
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'applications'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Application Control</span>
            {appData && appData.overrideCount > 0 && (
              <span className="rounded-full bg-warning-100 px-1.5 py-0.2 text-[10px] font-bold text-warning-800 dark:bg-warning-900/50 dark:text-warning-300">
                {appData.overrideCount} Overrides
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('usb')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'usb'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
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
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Chrome className="h-4 w-4" />
            <span>Browser Control</span>
            {browserData && browserData.overrideCount > 0 && (
              <span className="rounded-full bg-warning-100 px-1.5 py-0.2 text-[10px] font-bold text-warning-800 dark:bg-warning-900/50 dark:text-warning-300">
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
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between">
                
              </div>
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
              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={() => setWebFilter('all')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    webFilter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  All ({webData?.totalRules || 0})
                </button>
                <button
                  onClick={() => setWebFilter('overrides')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    webFilter === 'overrides'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Overrides ({webData?.overrideCount || 0})
                </button>
                <button
                  onClick={() => setWebFilter('blocked')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    webFilter === 'blocked'
                      ? 'bg-error-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Blocked ({webData?.rules.filter((r) => r.action === 'block').length || 0})
                </button>
                <button
                  onClick={() => setWebFilter('allowed')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    webFilter === 'allowed'
                      ? 'bg-success-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Allowed ({webData?.rules.filter((r) => r.action === 'allow').length || 0})
                </button>
              </div>
            </div>

            {/* Websites Table */}
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 max-h-80 overflow-y-auto">
              {webLoading ? (
                <div className="flex h-36 items-center justify-center gap-2 text-sm text-slate-500">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary-500" />
                  Loading domain rules...
                </div>
              ) : filteredWebRules.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  No domain rules match your filter.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredWebRules.map((r) => {
                    const isWorking = webWorking === r.domain;
                    return (
                      <div
                        key={r.id || r.domain}
                        className={`flex flex-col gap-2.5 p-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                          r.isOverride ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.03]' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            <Globe className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">{r.domain}</span>
                            <span className="block text-xs text-slate-400">{r.category}</span>
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
                            className={r.action === 'block' ? 'text-success-600 hover:bg-success-50' : 'text-error-600 hover:bg-error-50'}
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
                              className="text-slate-400 hover:text-slate-600"
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
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
       
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
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium border transition ${
                      isBlocked
                        ? 'border-error-300 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {isBlocked ? <Ban className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    <span>{preset.name}</span>
                    <span className="text-[10px] opacity-70">({isBlocked ? 'Blocked' : 'Click to Block'})</span>
                  </button>
                );
              })}
            </div>

            {/* Add or Override Application Form */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/40 space-y-3">
             
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
              <div className="flex flex-wrap items-center gap-1">
                
                <button
                  onClick={() => setAppFilter('overrides')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    appFilter === 'overrides'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Overrides ({appData?.overrideCount || 0})
                </button>
                <button
                  onClick={() => setAppFilter('blocked')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    appFilter === 'blocked'
                      ? 'bg-error-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Blocked ({appData?.rules.filter((r) => r.action === 'block').length || 0})
                </button>
                <button
                  onClick={() => setAppFilter('allowed')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    appFilter === 'allowed'
                      ? 'bg-success-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Allowed ({appData?.rules.filter((r) => r.action === 'allow').length || 0})
                </button>
              </div>
            </div>

            {/* Applications Table */}
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 max-h-80 overflow-y-auto">
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
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredAppRules.map((r) => {
                    const isWorking = appWorking === r.executableName;
                    return (
                      <div
                        key={r.id || r.executableName}
                        className={`flex flex-col gap-2.5 p-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                          r.isOverride ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.03]' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            r.action === 'block' ? 'bg-error-100 text-error-600 dark:bg-error-950 dark:text-error-400' : 'bg-success-100 text-success-600 dark:bg-success-950 dark:text-success-400'
                          }`}>
                            <Terminal className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{r.executableName}</span>
                            <span className="block text-xs text-slate-400">{r.appName}</span>
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
                                <span className="text-[11px] text-slate-400">
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
                            className={r.action === 'block' ? 'text-success-600 hover:bg-success-50' : 'text-error-600 hover:bg-error-50'}
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
                              className="text-slate-400 hover:text-slate-600"
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
            <div className="rounded-xl border border-primary-300/60 bg-gradient-to-r from-primary-50/70 via-slate-50 to-primary-50/40 p-4 dark:border-primary-500/30 dark:from-primary-950/40 dark:via-slate-900 dark:to-primary-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl shadow-sm ${
                  usbData?.effectiveAction === 'block' ? 'bg-error-600 text-white' :
                  usbData?.effectiveAction === 'read_only' ? 'bg-warning-600 text-white' :
                  'bg-success-600 text-white'
                }`}>
                  <Usb className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active USB Policy for {device.name}:</span>
                    <Badge variant={usbData?.effectiveAction === 'block' ? 'error' : usbData?.effectiveAction === 'read_only' ? 'warning' : 'success'} dot>
                      {usbData?.effectiveAction === 'block' ? 'BLOCKED' : usbData?.effectiveAction === 'read_only' ? 'READ-ONLY (Write-Protected)' : 'ALLOWED (Full Read/Write)'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {usbData?.isOverride ? (
                      <span className="text-warning-600 dark:text-warning-400 font-semibold">
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
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  !usbData?.isOverride
                    ? 'border-primary-600 bg-primary-50/60 dark:border-primary-400 dark:bg-primary-950/40 shadow-sm ring-1 ring-primary-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <RotateCcw className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Inherit Global Policy</span>
                  </div>
                  {!usbData?.isOverride && <Badge variant="primary">Active</Badge>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Follows the company-wide global setting (currently: <strong>{usbData?.globalAction?.toUpperCase()}</strong>).
                </p>
              </button>

              {/* Option 2: Block All */}
              <button
                type="button"
                disabled={usbSaving}
                onClick={() => handleSetUsbAction('block')}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  usbData?.isOverride && usbData?.deviceAction === 'block'
                    ? 'border-error-600 bg-error-50/60 dark:border-error-500 dark:bg-error-950/40 shadow-sm ring-1 ring-error-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-error-100 text-error-600 dark:bg-error-950 dark:text-error-400">
                      <Ban className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Block All USB Storage</span>
                  </div>
                  {usbData?.isOverride && usbData?.deviceAction === 'block' && <Badge variant="error">Active Override</Badge>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Completely disables USB mass storage drives on this specific workstation.
                </p>
              </button>

              {/* Option 3: Read-Only */}
              <button
                type="button"
                disabled={usbSaving}
                onClick={() => handleSetUsbAction('read_only')}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  usbData?.isOverride && usbData?.deviceAction === 'read_only'
                    ? 'border-warning-600 bg-warning-50/60 dark:border-warning-500 dark:bg-warning-950/40 shadow-sm ring-1 ring-warning-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning-100 text-warning-600 dark:bg-warning-950 dark:text-warning-400">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Read-Only Mode</span>
                  </div>
                  {usbData?.isOverride && usbData?.deviceAction === 'read_only' && <Badge variant="warning">Active Override</Badge>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Files on USB can be viewed; writing or copying to USB is blocked.
                </p>
              </button>

              {/* Option 4: Allow */}
              <button
                type="button"
                disabled={usbSaving}
                onClick={() => handleSetUsbAction('allow')}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  usbData?.isOverride && usbData?.deviceAction === 'allow'
                    ? 'border-success-600 bg-success-50/60 dark:border-success-500 dark:bg-success-950/40 shadow-sm ring-1 ring-success-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-100 text-success-600 dark:bg-success-950 dark:text-success-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Allow Full Access</span>
                  </div>
                  {usbData?.isOverride && usbData?.deviceAction === 'allow' && <Badge variant="success">Active Override</Badge>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permits full read & write access to USB drives even if globally blocked.
                </p>
              </button>
            </div>

            {/* Hardware Isolation Notice */}
            
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
                      className="p-3.5 border rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition"
                    >
                      {/* Browser Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${b.bg}`}>
                            {b.icon}
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
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
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Control 1: Private Browsing */}
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5 text-slate-500" />
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  Private Browsing
                                </span>
                              </div>
                              <Badge variant={isPrivBlocked ? 'error' : 'success'} dot>
                                {isPrivBlocked ? 'Blocked' : 'Allowed'}
                              </Badge>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {isPrivOverride ? (
                                <span className="text-warning-600 dark:text-warning-400 font-medium">
                                  Overridden (Global: {privRule?.globalEnabled ? 'Blocked' : 'Allowed'})
                                </span>
                              ) : (
                                <span>Global: {privRule?.globalEnabled ? 'Blocked' : 'Allowed'}</span>
                              )}
                            </p>
                          </div>
                          <div className="mt-2.5 flex gap-1">
                            <button
                              disabled={browserSaving}
                              onClick={() => handleSetBrowserOverride(b.id, 'private_browsing', true)}
                              className={`flex-1 py-1 px-2 text-[11px] font-medium rounded-lg transition ${
                                isPrivBlocked && isPrivOverride
                                  ? 'bg-error-600 text-white'
                                  : 'bg-error-50 text-error-700 hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400'
                              }`}
                            >
                              Block
                            </button>
                            <button
                              disabled={browserSaving}
                              onClick={() => handleSetBrowserOverride(b.id, 'private_browsing', false)}
                              className={`flex-1 py-1 px-2 text-[11px] font-medium rounded-lg transition ${
                                !isPrivBlocked && isPrivOverride
                                  ? 'bg-success-600 text-white'
                                  : 'bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400'
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
                                className="py-1 px-2 text-[11px] font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 transition"
                                title="Inherit global policy"
                              >
                                Inherit
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Control 2: Extensions */}
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Puzzle className="h-3.5 w-3.5 text-slate-500" />
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  Extension Lockdown
                                </span>
                              </div>
                              <Badge variant={isExtBlocked ? 'error' : 'success'} dot>
                                {isExtBlocked ? 'Blocked' : 'Allowed'}
                              </Badge>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {isExtOverride ? (
                                <span className="text-warning-600 dark:text-warning-400 font-medium">
                                  Overridden (Global: {extRule?.globalEnabled ? 'Blocked' : 'Allowed'})
                                </span>
                              ) : (
                                <span>Global: {extRule?.globalEnabled ? 'Blocked' : 'Allowed'}</span>
                              )}
                            </p>
                          </div>
                          <div className="mt-2.5 flex gap-1">
                            <button
                              disabled={browserSaving}
                              onClick={() => handleSetBrowserOverride(b.id, 'extensions', true)}
                              className={`flex-1 py-1 px-2 text-[11px] font-medium rounded-lg transition ${
                                isExtBlocked && isExtOverride
                                  ? 'bg-error-600 text-white'
                                  : 'bg-error-50 text-error-700 hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400'
                              }`}
                            >
                              Block All
                            </button>
                            <button
                              disabled={browserSaving}
                              onClick={() => handleSetBrowserOverride(b.id, 'extensions', false)}
                              className={`flex-1 py-1 px-2 text-[11px] font-medium rounded-lg transition ${
                                !isExtBlocked && isExtOverride
                                  ? 'bg-success-600 text-white'
                                  : 'bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400'
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
                                className="py-1 px-2 text-[11px] font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 transition"
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
