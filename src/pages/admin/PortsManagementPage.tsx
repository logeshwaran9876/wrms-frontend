import { useState, useEffect, useMemo } from 'react';
import {
  Radio,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  Ban,
  Activity,
  Layers,
  MapPin,
  Globe,
  Monitor,
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
import { devicesApi } from '@/lib/api';
import type { Device, MasterPort } from '@/types';

function parsePortProcess(raw?: string) {
  if (!raw || !raw.trim() || raw === 'Listening Service') {
    return { app: 'Listening Service', details: null, isApp: false };
  }
  const match = raw.match(/^([^(·]+?)(?:\s*(?:[(·])\s*(.*?)[)]?\s*)?$/);
  if (match && match[2]) {
    const app = match[1].trim();
    const details = match[2].trim().replace(/\)$/, '');
    const isExe =
      app.toLowerCase().endsWith('.exe') ||
      app.toLowerCase().includes('kernel') ||
      app.toLowerCase().includes('system');
    return { app, details, isApp: isExe };
  }
  const isExe =
    raw.toLowerCase().endsWith('.exe') ||
    raw.toLowerCase().includes('kernel') ||
    raw.toLowerCase().includes('system');
  return { app: raw.trim(), details: null, isApp: isExe };
}

export default function PortsManagementPage() {
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [portsLoading, setPortsLoading] = useState(false);
  const [masterPorts, setMasterPorts] = useState<MasterPort[]>([]);
  const [openPorts, setOpenPorts] = useState<
    Array<{ port: number; protocol: string; processName?: string; isAllowed: boolean; isBlocked?: boolean }>
  >([]);
  const [blockedPorts, setBlockedPorts] = useState<
    Array<{ port: number; protocol: string; blockedAt?: string; reason?: string }>
  >([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'complaints' | 'allowed' | 'blocked'>('all');
  const [search, setSearch] = useState('');
  const [blockingPort, setBlockingPort] = useState<number | null>(null);
  const [togglingFirewall, setTogglingFirewall] = useState(false);

  // Custom Port Blocker Form
  const [customPortInput, setCustomPortInput] = useState('');
  const [customPortProtocol, setCustomPortProtocol] = useState<'TCP' | 'UDP'>('TCP');
  const [customPortReason, setCustomPortReason] = useState('Manual Security Restriction');

  // Master Port Modal
  const [masterModalOpen, setMasterModalOpen] = useState(false);
  const [newMasterPort, setNewMasterPort] = useState('');
  const [newMasterProtocol, setNewMasterProtocol] = useState<'TCP' | 'UDP'>('TCP');
  const [newMasterService, setNewMasterService] = useState('');
  const [newMasterDescription, setNewMasterDescription] = useState('');

  // Initial load
  useEffect(() => {
    loadDevices();
    loadMasterPorts();
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

  const loadMasterPorts = async () => {
    try {
      const ports = await devicesApi.getMasterPorts();
      setMasterPorts(Array.isArray(ports) ? ports : []);
    } catch {
      // fallback
    }
  };

  const selectedDevice = useMemo(() => {
    const active = devices.filter((d) => d.status !== 'uninstalled');
    return active.find((d) => d.id === selectedDeviceId || d.deviceId === selectedDeviceId) || active[0] || null;
  }, [devices, selectedDeviceId]);

  // Load ports for selected device
  useEffect(() => {
    if (!selectedDevice) return;
    loadDevicePorts(selectedDevice.deviceId || selectedDevice.id);
  }, [selectedDevice?.deviceId, selectedDevice?.id]);

  const loadDevicePorts = async (devId: string) => {
    setPortsLoading(true);
    try {
      const data = await devicesApi.getPorts(devId);
      if (data) {
        setOpenPorts(Array.isArray(data.openPorts) ? data.openPorts : []);
        setBlockedPorts(Array.isArray(data.blockedPorts) ? data.blockedPorts : []);
        if (Array.isArray(data.masterPorts)) {
          setMasterPorts(data.masterPorts);
        }
      }
    } catch {
      toast('Failed to fetch open ports for workstation', 'error');
    } finally {
      setPortsLoading(false);
    }
  };

  const handleBlockPort = async (port: number, protocol = 'TCP', reason = 'Manual Admin Block') => {
    if (!selectedDevice) return;
    setBlockingPort(port);
    try {
      const devKey = selectedDevice.deviceId || selectedDevice.id;
      const res = await devicesApi.blockPort(devKey, port, protocol, reason);
      toast(`Port ${port} (${protocol}) successfully blocked.`, 'success');
      if (res?.device) {
        setOpenPorts(res.device.openPorts || []);
        setBlockedPorts(res.device.blockedPorts || []);
      } else {
        loadDevicePorts(devKey);
      }
    } catch {
      toast(`Failed to block port ${port}`, 'error');
    } finally {
      setBlockingPort(null);
    }
  };

  const handleUnblockPort = async (port: number) => {
    if (!selectedDevice) return;
    setBlockingPort(port);
    try {
      const devKey = selectedDevice.deviceId || selectedDevice.id;
      const res = await devicesApi.unblockPort(devKey, port);
      toast(`Port ${port} successfully unblocked.`, 'success');
      if (res?.device) {
        setOpenPorts(res.device.openPorts || []);
        setBlockedPorts(res.device.blockedPorts || []);
      } else {
        loadDevicePorts(devKey);
      }
    } catch {
      toast(`Failed to unblock port ${port}`, 'error');
    } finally {
      setBlockingPort(null);
    }
  };

  const handleToggleFirewall = async (enable: boolean) => {
    if (!selectedDevice) return;
    setTogglingFirewall(true);
    try {
      const devKey = selectedDevice.deviceId || selectedDevice.id;
      await devicesApi.toggleFirewall(devKey, enable);
      toast(
        enable
          ? `Windows Defender Firewall turned ON on ${selectedDevice.name}.`
          : `Windows Defender Firewall turned OFF on ${selectedDevice.name}.`,
        'success'
      );
      setDevices((prev) =>
        prev.map((d) =>
          d.id === selectedDevice.id || d.deviceId === selectedDevice.deviceId
            ? {
                ...d,
                firewallEnabled: enable,
                firewallStatus: enable ? 'enabled' : 'disabled',
                targetFirewallState: enable ? 'on' : 'off',
              }
            : d
        )
      );
    } catch (err: any) {
      toast(err.message || 'Failed to toggle Windows Defender Firewall', 'error');
    } finally {
      setTogglingFirewall(false);
    }
  };

  const handleCustomBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const portNum = Number(customPortInput);
    if (!portNum || portNum < 1 || portNum > 65535) {
      toast('Enter a valid port number (1 - 65535)', 'error');
      return;
    }
    await handleBlockPort(portNum, customPortProtocol, customPortReason);
    setCustomPortInput('');
  };

  const handleAddMasterPort = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(newMasterPort);
    if (!p || p < 1 || p > 65535) {
      toast('Enter a valid port number', 'error');
      return;
    }
    try {
      await devicesApi.saveMasterPort({
        port: p,
        protocol: newMasterProtocol,
        serviceName: newMasterService || `Service ${p}`,
        description: newMasterDescription || 'Custom Master Baseline Port',
      });
      toast(`Port ${p} added to Master Allowed Baseline`, 'success');
      setMasterModalOpen(false);
      setNewMasterPort('');
      setNewMasterService('');
      setNewMasterDescription('');
      loadMasterPorts();
      if (selectedDevice) loadDevicePorts(selectedDevice.deviceId || selectedDevice.id);
    } catch {
      toast('Failed to add master allowed port', 'error');
    }
  };

  const handleDeleteMasterPort = async (port: number) => {
    try {
      await devicesApi.deleteMasterPort(port);
      toast(`Port ${port} removed from Master Allowed Baseline`, 'success');
      loadMasterPorts();
      if (selectedDevice) loadDevicePorts(selectedDevice.deviceId || selectedDevice.id);
    } catch {
      toast(`Failed to remove port ${port}`, 'error');
    }
  };

  // Metrics calculation
  const totalOpenPorts = openPorts.length;
  const disallowedPorts = openPorts.filter((p) => !p.isAllowed && !p.isBlocked);
  const disallowedCount = disallowedPorts.length;
  const disallowedPercentage = totalOpenPorts > 0 ? Math.round((disallowedCount / totalOpenPorts) * 100) : 0;
  const blockedCount = blockedPorts.length;

  // Merge open ports and blocked ports so blocked ports are always displayed
  const allMergedPorts = useMemo(() => {
    const list = [...openPorts];
    for (const bp of blockedPorts) {
      const pNum = Number(bp.port);
      const proto = (bp.protocol || 'TCP').toUpperCase();
      const existing = list.find((p) => p.port === pNum && (p.protocol || 'TCP').toUpperCase() === proto);
      if (existing) {
        existing.isBlocked = true;
      } else {
        list.push({
          port: pNum,
          protocol: proto,
          processName: bp.reason || 'Blocked by Policy',
          isAllowed: false,
          isBlocked: true,
        });
      }
    }
    return list;
  }, [openPorts, blockedPorts]);

  // Filtered port list
  const filteredPorts = useMemo(() => {
    let list = allMergedPorts;
    if (activeFilter === 'complaints') {
      list = list.filter((p) => !p.isAllowed && !p.isBlocked);
    } else if (activeFilter === 'allowed') {
      list = list.filter((p) => p.isAllowed && !p.isBlocked);
    } else if (activeFilter === 'blocked') {
      list = list.filter((p) => p.isBlocked);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.port.toString().includes(q) ||
          p.protocol.toLowerCase().includes(q) ||
          (p.processName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allMergedPorts, activeFilter, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workstation Port Management"
        description="Monitor open listening ports, audit compliance against Master Allowed Baseline, and 1-click enforce port blocking."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setMasterModalOpen(true)}
            >
              Add Baseline Port
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className={`h-4 w-4 ${portsLoading ? 'animate-spin' : ''}`} />}
              onClick={() => {
                if (selectedDevice) loadDevicePorts(selectedDevice.deviceId || selectedDevice.id);
                loadMasterPorts();
              }}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Workstation Selector & Telemetry Banner */}
      <Card className="p-4 bg-theme-surface border-theme-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-accent/10 text-theme-accent border border-theme-accent/20 shadow-sm">
              <Monitor className="h-5 w-5" />
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
                    <option value="" disabled>No active workstations found</option>
                  )}
                </select>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-theme-muted">
                <span className="flex items-center gap-1 font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Local IP: {selectedDevice?.ipAddress || '127.0.0.1'}
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
                    {selectedDevice.location.isp && ` (${selectedDevice.location.isp})`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge variant={selectedDevice?.firewallEnabled ? 'success' : 'error'} dot>
              Firewall {selectedDevice?.firewallEnabled ? 'Active' : 'Disabled'}
            </Badge>

            {selectedDevice?.firewallEnabled ? (
              <Button
                variant="ghost"
                size="sm"
                loading={togglingFirewall}
                onClick={() => handleToggleFirewall(false)}
                className="text-xs text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 font-semibold py-1 px-2.5 h-auto rounded-lg shadow-sm"
                title="Remotely turn off Windows Defender Firewall on this workstation"
              >
                Turn OFF
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                loading={togglingFirewall}
                onClick={() => handleToggleFirewall(true)}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1 px-3 h-auto rounded-lg shadow-sm"
                title="Remotely turn ON Windows Defender Firewall on this workstation"
              >
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                Turn ON Firewall
              </Button>
            )}

            <Badge variant="neutral">
              Agent v{selectedDevice?.agentVersion || '2.4.1'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-theme-border bg-theme-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Total Open Ports</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Radio className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-theme-heading font-mono">{totalOpenPorts}</div>
          <p className="mt-1 text-xs text-theme-muted">Active listening sockets on device</p>
        </Card>

        <Card className="p-4 border-theme-border bg-theme-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 font-bold">Disallowed Complaints</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-500 font-mono">{disallowedCount}</span>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {disallowedPercentage}% Non-compliant
            </span>
          </div>
          <p className="mt-1 text-xs text-theme-muted">Ports outside master allowed policy</p>
        </Card>

        <Card className="p-4 border-theme-border bg-theme-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Master Allowed Baseline</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">{masterPorts.length}</div>
          <p className="mt-1 text-xs text-theme-muted">Standard company baseline ports</p>
        </Card>

        <Card className="p-4 border-theme-border bg-theme-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Admin Blocked Ports</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <Ban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400 font-mono">{blockedCount}</div>
          <p className="mt-1 text-xs text-theme-muted">Actively restricted on firewall</p>
        </Card>
      </div>

      {/* Master Allowed Baseline Section */}
      <Card className="p-5 border-theme-border bg-theme-surface shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-theme-heading flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Master Allowed Ports Baseline
            </h3>
            <p className="text-xs text-theme-muted mt-0.5">
              These ports are universally authorized. Any other active port on a workstation triggers a compliance complaint.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setMasterModalOpen(true)}
          >
            Add Allowed Port
          </Button>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {masterPorts.map((mp) => (
            <div
              key={mp.port}
              className="flex items-center gap-2 rounded-lg border border-theme-border bg-theme-surface-subtle px-3 py-1.5 shadow-xs"
            >
              <span className="font-mono text-sm font-bold text-theme-heading">
                {mp.port}
              </span>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">
                {mp.protocol}
              </span>
              <span className="text-xs text-theme-muted truncate max-w-[120px]">
                {mp.serviceName || mp.description}
              </span>
              {!mp.isDefault && (
                <button
                  type="button"
                  onClick={() => handleDeleteMasterPort(mp.port)}
                  className="text-slate-400 hover:text-rose-400 transition-colors ml-1"
                  title="Remove from allowed baseline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      

      {/* Live Open Ports Table */}
      <Card className="p-5 border-theme-border bg-theme-surface shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-theme-surface-subtle border border-theme-border">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'all'
                  ? 'bg-theme-surface text-theme-heading shadow-xs'
                  : 'text-theme-muted hover:text-theme-heading'
              }`}
            >
              All Ports ({totalOpenPorts})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('complaints')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeFilter === 'complaints'
                  ? 'bg-amber-500/10 text-amber-500 shadow-xs'
                  : 'text-theme-muted hover:text-amber-500'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Disallowed Complaints ({disallowedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('allowed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'allowed'
                  ? 'bg-emerald-500/10 text-emerald-400 shadow-xs'
                  : 'text-theme-muted hover:text-emerald-400'
              }`}
            >
              Master Allowed ({openPorts.filter((p) => p.isAllowed && !p.isBlocked).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('blocked')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'blocked'
                  ? 'bg-rose-500/10 text-rose-400 shadow-xs'
                  : 'text-theme-muted hover:text-rose-400'
              }`}
            >
              Blocked ({blockedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search port number, protocol, service..."
            />
          </div>
        </div>

        {/* Ports DataTable */}
        <div className="overflow-hidden rounded-xl border border-theme-border">
          <DataTable
            data={filteredPorts}
            keyExtractor={(p, idx) => `${p.port}-${p.protocol}-${idx}`}
            columns={[
              {
                key: 'port',
                header: 'Port / Protocol',
                render: (p) => (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-theme-heading">{p.port}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        p.protocol === 'UDP'
                          ? 'bg-sky-500/10 text-sky-400'
                          : 'bg-indigo-500/10 text-indigo-400'
                      }`}
                    >
                      {p.protocol}
                    </span>
                  </div>
                ),
              },
              {
                key: 'processName',
                header: 'Running Application / Service',
                render: (p) => {
                  const { app, details, isApp } = parsePortProcess(p.processName);
                  const isBlocked = p.isBlocked === true;
                  return (
                    <div className="flex items-center gap-2.5 py-0.5">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                          isBlocked
                            ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                            : isApp
                            ? 'border-sky-500/20 bg-sky-500/10 text-sky-400'
                            : 'border-slate-500/20 bg-slate-500/10 text-slate-400'
                        }`}
                      >
                        {isBlocked ? (
                          <Ban className="h-3.5 w-3.5" />
                        ) : isApp ? (
                          <Activity className="h-3.5 w-3.5" />
                        ) : (
                          <Radio className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-theme-heading truncate">
                            {app}
                          </span>
                          {isApp && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              Process
                            </span>
                          )}
                        </div>
                        {details && (
                          <p className="text-[11px] text-theme-muted truncate max-w-xs" title={details}>
                            {details}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                },
              },
              {
                key: 'status',
                header: 'Compliance Evaluation',
                render: (p) => {
                  if (p.isBlocked) {
                    return (
                      <Badge variant="error" dot>
                        Blocked by Admin
                      </Badge>
                    );
                  }
                  if (p.isAllowed) {
                    return (
                      <Badge variant="success" dot>
                        Master Allowed Baseline
                      </Badge>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <AlertTriangle className="h-3 w-3" />
                      Disallowed Complaint
                    </span>
                  );
                },
              },
              {
                key: 'actions',
                header: 'Action',
                className: 'text-right',
                render: (p) => {
                  const isBlocked = p.isBlocked === true;
                  const isWorking = blockingPort === p.port;
                  return (
                    <div className="flex items-center justify-end">
                      {isBlocked ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                          disabled={isWorking}
                          onClick={() => handleUnblockPort(p.port)}
                        >
                          {isWorking ? 'Unblocking...' : 'Unblock'}
                        </Button>
                      ) : (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Ban className="h-3.5 w-3.5" />}
                          disabled={isWorking}
                          onClick={() => handleBlockPort(p.port, p.protocol, 'Manual Admin Restriction')}
                        >
                          {isWorking ? 'Blocking...' : 'Block Port'}
                        </Button>
                      )}
                    </div>
                  );
                },
              },
            ]}
            emptyMessage={
              portsLoading
                ? 'Scanning active listening ports on workstation...'
                : 'No ports found matching your filter.'
            }
          />
        </div>
      </Card>

      {/* Add Master Baseline Port Modal */}
      <Modal
        open={masterModalOpen}
        onClose={() => setMasterModalOpen(false)}
        title="Add Master Allowed Baseline Port"
      >
        <form onSubmit={handleAddMasterPort} className="space-y-4">
          <p className="text-xs text-theme-muted">
            Adding a port to the Master Allowed Baseline authorizes it across all workstations in the company fleet.
          </p>

          <div>
            <label className="block text-xs font-bold text-theme-heading mb-1">Port Number</label>
            <input
              type="number"
              min="1"
              max="65535"
              required
              placeholder="e.g. 8080, 8443, 9000"
              value={newMasterPort}
              onChange={(e) => setNewMasterPort(e.target.value)}
              className="w-full rounded-lg border border-theme-border bg-theme-surface-subtle px-3 py-2 text-sm font-mono text-theme-heading focus:border-theme-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-theme-heading mb-1">Protocol</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-theme-heading cursor-pointer">
                <input
                  type="radio"
                  name="proto"
                  checked={newMasterProtocol === 'TCP'}
                  onChange={() => setNewMasterProtocol('TCP')}
                />
                TCP
              </label>
              <label className="flex items-center gap-2 text-sm text-theme-heading cursor-pointer">
                <input
                  type="radio"
                  name="proto"
                  checked={newMasterProtocol === 'UDP'}
                  onChange={() => setNewMasterProtocol('UDP')}
                />
                UDP
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-theme-heading mb-1">Service / Application Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Jenkins CI, Docker Daemon, Custom API"
              value={newMasterService}
              onChange={(e) => setNewMasterService(e.target.value)}
              className="w-full rounded-lg border border-theme-border bg-theme-surface-subtle px-3 py-2 text-sm text-theme-heading focus:border-theme-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-theme-heading mb-1">Description (Optional)</label>
            <input
              type="text"
              placeholder="Purpose or business justification"
              value={newMasterDescription}
              onChange={(e) => setNewMasterDescription(e.target.value)}
              className="w-full rounded-lg border border-theme-border bg-theme-surface-subtle px-3 py-2 text-sm text-theme-heading focus:border-theme-accent focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setMasterModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add to Baseline
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
