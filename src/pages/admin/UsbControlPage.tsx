import { useState, useMemo, useEffect } from 'react';
import { Usb, Plus, Ban, CheckCircle2, Clock, Trash2, ShieldOff, RefreshCw, HardDrive, BookOpen, Monitor } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { usbRulesApi, devicesApi } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/format';
import type { UsbRule, Device } from '@/types';

const scopeLabels: Record<string, string> = {
  global: 'Global',
  employee: 'Employee',
  device: 'Specific Device',
};

export default function UsbControlPage() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [actionFilter, setActionFilter] = useState<'all' | 'block' | 'read_only' | 'allow'>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [rules, setRules] = useState<UsbRule[]>([]);
  const [deviceList, setDeviceList] = useState<Device[]>([]);

  // Form states
  const [name, setName] = useState('');
  const [action, setAction] = useState<UsbRule['action']>('block');
  const [scope, setScope] = useState<UsbRule['scope']>('global');
  const [scopeTarget, setScopeTarget] = useState('');
  const [exception, setException] = useState(false);

  const loadData = () => {
    Promise.all([
      usbRulesApi.getAll().catch(() => []),
      devicesApi.getAll().catch(() => []),
    ]).then(([rulesData, devs]) => {
      if (Array.isArray(rulesData)) setRules(rulesData);
      if (Array.isArray(devs)) setDeviceList(devs.filter((d: Device) => d.status !== 'uninstalled'));
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return rules.filter((r) => {
      if (actionFilter !== 'all' && r.action !== actionFilter) return false;
      return true;
    });
  }, [rules, actionFilter]);

  const effectiveGlobalAction = useMemo(() => {
    const globalRules = rules.filter((r) => r.scope === 'global');
    if (globalRules.some((r) => r.action === 'block')) return 'block';
    if (globalRules.some((r) => r.action === 'read_only')) return 'read_only';
    return 'allow';
  }, [rules]);

  const handleAdd = async () => {
    if (!name.trim()) { toast('Policy name is required', 'error'); return; }
    const payload: Partial<UsbRule> = {
      name: name.trim(),
      action,
      scope,
      scopeTarget: scope !== 'global' ? scopeTarget : undefined,
      exception,
      expiresAt: exception ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined,
    };
    try {
      const created = await usbRulesApi.create(payload);
      setRules((prev) => [created, ...prev]);
      toast(`USB policy created: ${name}`);
    } catch {
      const newRule: UsbRule = {
        id: `u-${Date.now()}`,
        name: name.trim(),
        action,
        scope,
        scopeTarget: scope !== 'global' ? scopeTarget : undefined,
        exception,
        expiresAt: exception ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined,
      };
      setRules((prev) => [newRule, ...prev]);
      toast('USB policy created locally');
    }
    setModalOpen(false);
    setName('');
    setScopeTarget('');
    setException(false);
  };

  const handleQuickPreset = (targetAction: UsbRule['action'], presetName: string) => {
    setName(presetName);
    setAction(targetAction);
    setScope('global');
    setException(false);
    setModalOpen(true);
  };

  const handleToggleAction = async (rule: UsbRule) => {
    const nextAction: UsbRule['action'] = rule.action === 'block' ? 'read_only' : rule.action === 'read_only' ? 'allow' : 'block';
    try {
      await usbRulesApi.update(rule.id, { action: nextAction });
    } catch { }
    setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, action: nextAction } : r));
    toast(`${rule.name} updated to ${nextAction === 'block' ? 'Blocked' : nextAction === 'read_only' ? 'Read-Only' : 'Allowed'}`);
  };

  const handleDelete = async () => {
    if (confirmDelete) {
      try {
        await usbRulesApi.delete(confirmDelete);
      } catch { }
      setRules((prev) => prev.filter((r) => r.id !== confirmDelete));
      toast('USB policy removed', 'info');
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="USB Storage Control"
        description="Manage USB mass storage device rules, read/write restrictions, and hardware unauthorized drive blocks."
        icon={<Usb className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">

            <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setName(''); setScopeTarget(''); setModalOpen(true); }}>Add USB Policy</Button>
          </div>
        }
      />






      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error-100 dark:bg-error-500/15">
              <Ban className="h-5 w-5 text-error-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{rules.filter((r) => r.action === 'block').length}</p>
              <p className="text-xs text-slate-400">Block Policies</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 dark:bg-warning-500/15">
              <BookOpen className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{rules.filter((r) => r.action === 'read_only').length}</p>
              <p className="text-xs text-slate-400">Read-Only Policies</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 dark:bg-success-500/15">
              <CheckCircle2 className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{rules.filter((r) => r.action === 'allow').length}</p>
              <p className="text-xs text-slate-400">Allow Policies</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-500/10">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{rules.filter((r) => r.exception).length}</p>
              <p className="text-xs text-slate-400">Active Exceptions</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="none">
        <div className="flex flex-col gap-3 border-b border-theme-border p-4 sm:flex-row sm:items-center sm:justify-between bg-theme-surface">
          <div className="flex gap-1 bg-theme-bg-deep p-1 rounded-full border border-theme-border">
            <button
              type="button"
              onClick={() => setActionFilter('all')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${actionFilter === 'all' ? 'bg-theme-accent text-theme-accent-text font-semibold shadow-sm' : 'text-theme-body hover:text-theme-heading'}`}
            >
              All Policies
            </button>
            <button
              type="button"
              onClick={() => setActionFilter('block')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${actionFilter === 'block' ? 'bg-[#3d1c16] text-[#e08e79] font-semibold border border-[#6b3528]' : 'text-theme-body hover:text-theme-heading'}`}
            >
              Blocked
            </button>
            <button
              type="button"
              onClick={() => setActionFilter('read_only')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${actionFilter === 'read_only' ? 'bg-[#3d3019] text-[#d8b37b] font-semibold border border-[#6b5229]' : 'text-theme-body hover:text-theme-heading'}`}
            >
              Read-Only
            </button>
            <button
              type="button"
              onClick={() => setActionFilter('allow')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${actionFilter === 'allow' ? 'bg-[#144737] text-theme-heading font-semibold border border-[rgba(243,238,227,0.12)]' : 'text-theme-body hover:text-theme-heading'}`}
            >
              Allowed
            </button>
          </div>
        </div>

        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Policy Name',
              render: (r) => (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-bg-deep border border-theme-border text-theme-accent">
                    <HardDrive className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-theme-heading">{r.name}</span>
                </div>
              ),
            },
            {
              key: 'action',
              header: 'Enforcement Status',
              render: (r) => (
                <button
                  type="button"
                  onClick={() => handleToggleAction(r)}
                  className="hover:opacity-80 transition cursor-pointer"
                  title="Click to cycle: Block -> Read-Only -> Allow"
                >
                  <Badge variant={r.action === 'block' ? 'error' : r.action === 'read_only' ? 'warning' : 'success'} dot>
                    {r.action === 'block' ? 'Blocked' : r.action === 'read_only' ? 'Read-Only' : 'Allowed'}
                  </Badge>
                </button>
              ),
            },
            {
              key: 'scope',
              header: 'Scope',
              render: (r) => (
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-medium">{scopeLabels[r.scope] || 'Global'}</span>
                  {r.scopeTarget ? ` · ${r.scopeTarget}` : ''}
                </span>
              ),
            },
            {
              key: 'precedence',
              header: 'Active Status',
              render: (r) => {
                if (r.scope === 'device') {
                  return <Badge variant="primary" dot>Device Override</Badge>;
                }
                if (r.scope === 'employee') {
                  return <Badge variant="neutral" dot>Employee Policy</Badge>;
                }
                const isActive = r.action === effectiveGlobalAction;
                return isActive ? (
                  <Badge variant="success" dot>Active Global</Badge>
                ) : (
                  <span className="inline-flex items-center text-[11px] font-medium text-slate-400 dark:text-slate-500 italic bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded">
                    Superseded by {effectiveGlobalAction.toUpperCase()}
                  </span>
                );
              },
            },
            {
              key: 'exception',
              header: 'Exception',
              render: (r) => r.exception ? (
                <Badge variant="warning">
                  <Clock className="h-3 w-3 mr-1" /> Until {r.expiresAt ? formatDate(r.expiresAt) : '24h'}
                </Badge>
              ) : (
                <span className="text-xs text-slate-400">None</span>
              ),
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              render: (r) => (
                <button
                  onClick={() => setConfirmDelete(r.id)}
                  className="btn-ghost p-1.5 text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
                  title="Delete policy"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ),
            },
          ]}
          data={filtered}
          emptyMessage="No USB policies configured"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add USB Storage Policy"

        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Policy</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Policy Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Block USB Storage Drives"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Action</label>
              <select className="input" value={action} onChange={(e) => setAction(e.target.value as UsbRule['action'])}>
                <option value="block">Block USB Storage (No Access)</option>
                <option value="read_only">Read-Only Mode (Write Protected)</option>
                <option value="allow">Allow USB Storage (Full Access)</option>
              </select>
            </div>
            <div>
              <label className="label">Scope</label>
              <select className="input" value={scope} onChange={(e) => setScope(e.target.value as UsbRule['scope'])}>
                <option value="global">Global (Fleet-wide)</option>
                <option value="device">Specific Device</option>
              </select>
            </div>
          </div>

          {scope !== 'global' && (
            <div>
              <label className="label">Target Workstation</label>
              {deviceList.length > 0 ? (
                <select
                  className="input"
                  value={scopeTarget}
                  onChange={(e) => setScopeTarget(e.target.value)}
                >
                  <option value="">Select registered device...</option>
                  {deviceList.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.name} ({d.deviceId})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  value={scopeTarget}
                  onChange={(e) => setScopeTarget(e.target.value)}
                  placeholder="Device name or device ID"
                />
              )}
            </div>
          )}


        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Remove USB Policy"
        message="Are you sure you want to remove this USB storage restriction? The affected device will revert to standard USB access upon next sync."
        confirmLabel="Remove"
      />
    </div>
  );
}
