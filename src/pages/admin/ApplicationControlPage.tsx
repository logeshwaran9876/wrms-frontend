import { useState, useMemo, useEffect } from 'react';
import { AppWindow, Plus, Ban, CheckCircle2, Trash2, Tag, ShieldAlert, Monitor, Terminal, Flame, Music, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import SearchInput from '@/components/ui/SearchInput';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { applicationRulesApi, devicesApi } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { ApplicationRule, Device } from '@/types';

const scopeLabels: Record<string, string> = {
  global: 'Global',
  employee: 'Employee',
  device: 'Device',
};

const COMMON_PRESETS = [
  { name: 'Calculator', exe: 'calc.exe', icon: Terminal },
  { name: 'Notepad', exe: 'notepad.exe', icon: AppWindow },
  { name: 'Command Prompt', exe: 'cmd.exe', icon: Terminal },
  { name: 'PowerShell', exe: 'powershell.exe', icon: Terminal },
  { name: 'Discord', exe: 'discord.exe', icon: AppWindow },
  { name: 'Steam', exe: 'steam.exe', icon: Flame },
  { name: 'Spotify', exe: 'spotify.exe', icon: Music },
];

export default function ApplicationControlPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | 'allow' | 'block'>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'global' | 'device'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [rules, setRules] = useState<ApplicationRule[]>([]);
  const [deviceList, setDeviceList] = useState<Device[]>([]);

  // Form states
  const [appName, setAppName] = useState('');
  const [executableName, setExecutableName] = useState('');
  const [publisher, setPublisher] = useState('');
  const [action, setAction] = useState<'allow' | 'block'>('block');
  const [scope, setScope] = useState<ApplicationRule['scope']>('global');
  const [scopeTarget, setScopeTarget] = useState('');
  const [version, setVersion] = useState('');

  const loadData = () => {
    Promise.all([
      applicationRulesApi.getAll().catch(() => []),
      devicesApi.getAll().catch(() => []),
    ]).then(([rulesData, devs]) => {
      if (Array.isArray(rulesData)) setRules(rulesData);
      if (Array.isArray(devs)) setDeviceList(devs.filter((d: Device) => d.status !== 'uninstalled'));
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAppNameChange = (val: string) => {
    setAppName(val);
    if (!executableName || executableName === `${appName.toLowerCase().replace(/\s+/g, '')}.exe`) {
      let clean = val.trim().toLowerCase().replace(/\s+/g, '');
      if (clean && !clean.endsWith('.exe')) {
        clean = `${clean}.exe`;
      }
      setExecutableName(clean);
    }
  };

  const filtered = useMemo(() => {
    return rules.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesName = r.appName.toLowerCase().includes(q);
        const matchesExe = (r.executableName || '').toLowerCase().includes(q);
        const matchesPub = r.publisher.toLowerCase().includes(q);
        if (!matchesName && !matchesExe && !matchesPub) return false;
      }
      if (actionFilter !== 'all' && r.action !== actionFilter) return false;
      if (scopeFilter !== 'all' && r.scope !== scopeFilter) return false;
      return true;
    });
  }, [rules, search, actionFilter, scopeFilter]);

  const handleAdd = async () => {
    if (!appName.trim()) { toast('Application name is required', 'error'); return; }

    let cleanExe = (executableName || appName).trim().toLowerCase();
    cleanExe = cleanExe.split(/[\\/]/).pop() || cleanExe;
    if (cleanExe && !cleanExe.endsWith('.exe')) cleanExe += '.exe';

    const payload: Partial<ApplicationRule> = {
      appName: appName.trim(),
      executableName: cleanExe,
      publisher: publisher || 'Unknown',
      action,
      version: version || undefined,
      scope,
      scopeTarget: scope !== 'global' ? scopeTarget : undefined,
    };

    try {
      const created = await applicationRulesApi.create(payload);
      setRules((prev) => [created, ...prev]);
      toast(`Application rule saved: ${appName} (${cleanExe})`);
    } catch {
      const newRule: ApplicationRule = {
        id: `a-${Date.now()}`,
        appName: appName.trim(),
        executableName: cleanExe,
        publisher: publisher || 'Unknown',
        action,
        version: version || undefined,
        scope,
        scopeTarget: scope !== 'global' ? scopeTarget : undefined,
        createdAt: new Date().toISOString(),
      };
      setRules((prev) => [newRule, ...prev]);
      toast(`Application rule added locally: ${appName}`);
    }

    setModalOpen(false);
    setAppName('');
    setExecutableName('');
    setPublisher('');
    setVersion('');
    setScopeTarget('');
  };

  const handleQuickAddPreset = (preset: { name: string; exe: string }) => {
    setAppName(preset.name);
    setExecutableName(preset.exe);
    setAction('block');
    setScope('global');
    setModalOpen(true);
  };

  const handleToggleAction = async (rule: ApplicationRule) => {
    const newAction = rule.action === 'block' ? 'allow' : 'block';
    try {
      await applicationRulesApi.update(rule.id, { action: newAction });
    } catch { }
    setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, action: newAction } : r));
    toast(`${rule.appName} is now ${newAction === 'block' ? 'Blocked' : 'Allowed'}`);
  };

  const handleDelete = async () => {
    if (confirmDelete) {
      try {
        await applicationRulesApi.delete(confirmDelete);
      } catch { }
      setRules((prev) => prev.filter((r) => r.id !== confirmDelete));
      toast('Application rule removed', 'info');
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application Control"
        description="Execution restrictions and process control rules to prohibit unapproved software and unauthorized executables."
        icon={<AppWindow className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">

            <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setAppName(''); setExecutableName(''); setModalOpen(true); }}>Add Rule</Button>
          </div>
        }
      />

      {/* Quick Add Presets */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-theme-border bg-theme-surface p-3">
        {COMMON_PRESETS.map((preset) => (
          <button
            key={preset.exe}
            type="button"
            onClick={() => handleQuickAddPreset(preset)}
            className="flex items-center gap-1.5 rounded-full border border-theme-border bg-theme-bg-deep px-3 py-1.5 text-xs font-medium text-theme-body hover:border-theme-accent/60 hover:text-theme-heading transition"
          >
            <preset.icon className="h-3.5 w-3.5 text-theme-accent" />
            <span>{preset.name}</span>
            <code className="text-[10px] text-theme-muted font-mono">({preset.exe})</code>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error-100 dark:bg-error-500/15">
              <Ban className="h-5 w-5 text-error-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{rules.filter((r) => r.action === 'block').length}</p>
              <p className="text-xs text-slate-400">Blocked Applications</p>
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
              <p className="text-xs text-slate-400">Allowed Applications</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10">
              <ShieldAlert className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{rules.filter((r) => r.scope === 'global').length}</p>
              <p className="text-xs text-slate-400">Global Policies</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-500/10">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{rules.filter((r) => r.scope === 'device').length}</p>
              <p className="text-xs text-slate-400">Device Overrides</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="none">
        <div className="flex flex-col gap-3 border-b border-theme-border p-4 sm:flex-row sm:items-center bg-theme-surface">
          <SearchInput value={search} onChange={setSearch} placeholder="Search apps, executables, or publishers..." className="flex-1" />

          <div className="flex items-center gap-2">
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as any)}
              className="input text-xs sm:w-36 rounded-full"
            >
              <option value="all">All Scopes</option>
              <option value="global">Global Only</option>
              <option value="device">Device Overrides</option>
            </select>

            <div className="flex gap-1 bg-theme-bg-deep p-1 rounded-full border border-theme-border">
              <button
                type="button"
                onClick={() => setActionFilter('all')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${actionFilter === 'all' ? 'bg-theme-accent text-theme-accent-text font-semibold shadow-sm' : 'text-theme-body hover:text-theme-heading'}`}
              >
                All
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
                onClick={() => setActionFilter('allow')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${actionFilter === 'allow' ? 'bg-[#144737] text-theme-heading font-semibold border border-[rgba(243,238,227,0.12)]' : 'text-theme-body hover:text-theme-heading'}`}
              >
                Allowed
              </button>
            </div>
          </div>
        </div>

        <DataTable
          columns={[
            {
              key: 'appName',
              header: 'Application & Executable',
              render: (r) => (
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${r.action === 'block' ? 'bg-error-50 text-error-600 dark:bg-error-950 dark:text-error-400' : 'bg-success-50 text-success-600 dark:bg-success-950 dark:text-success-400'}`}>
                    <AppWindow className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-theme-heading">{r.appName}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <code className="rounded bg-theme-bg-deep border border-theme-border px-1.5 py-0.5 font-mono text-[11px] text-theme-body">
                        {r.executableName || `${r.appName.toLowerCase().replace(/\s+/g, '')}.exe`}
                      </code>
                      {r.version && <span className="text-[11px] text-theme-muted">v{r.version}</span>}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'publisher',
              header: 'Publisher',
              render: (r) => <span className="text-xs text-theme-body">{r.publisher || 'Standard Executable'}</span>,
            },
            {
              key: 'action',
              header: 'Status',
              render: (r) => (
                <button
                  type="button"
                  onClick={() => handleToggleAction(r)}
                  className="hover:opacity-80 transition cursor-pointer"
                  title="Click to toggle Block / Allow"
                >
                  <Badge variant={r.action === 'allow' ? 'success' : 'error'} dot>
                    {r.action === 'allow' ? 'Allowed' : 'Blocked'}
                  </Badge>
                </button>
              ),
            },
            {
              key: 'scope',
              header: 'Scope',
              render: (r) => (
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-medium">{scopeLabels[r.scope]}</span>
                  {r.scopeTarget ? ` · ${r.scopeTarget}` : ''}
                </span>
              ),
            },
            {
              key: 'createdAt',
              header: 'Created',
              render: (r) => <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>,
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              render: (r) => (
                <button
                  onClick={() => setConfirmDelete(r.id)}
                  className="btn-ghost p-1.5 text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
                  title="Delete rule"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ),
            },
          ]}
          data={filtered}
          emptyMessage="No application rules match your filters"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Application Restriction Rule"
        description="Define an application to block or allow across your Windows fleet. Enforced at kernel/shell level."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Rule</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Application Name</label>
            <input
              className="input"
              value={appName}
              onChange={(e) => handleAppNameChange(e.target.value)}
              placeholder="e.g. Calculator or Notepad"
            />
          </div>

          <div>
            <label className="label">Executable File Name (.exe)</label>
            <input
              className="input font-mono"
              value={executableName}
              onChange={(e) => setExecutableName(e.target.value)}
              placeholder="e.g. calc.exe or notepad.exe"
            />
            <p className="mt-1 text-xs text-slate-400">
              The Windows process binary name blocked from execution (e.g. <code>calc.exe</code>, <code>notepad.exe</code>, <code>cmd.exe</code>).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Action</label>
              <select className="input" value={action} onChange={(e) => setAction(e.target.value as 'allow' | 'block')}>
                <option value="block">Block Execution</option>
                <option value="allow">Allow Execution</option>
              </select>
            </div>
            <div>
              <label className="label">Publisher (Optional)</label>
              <input
                className="input"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="e.g. Microsoft Corporation"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Scope</label>
              <select className="input" value={scope} onChange={(e) => setScope(e.target.value as ApplicationRule['scope'])}>
                <option value="global">Global (Fleet-wide)</option>
                <option value="employee">Specific Employee</option>
                <option value="device">Specific Device</option>
              </select>
            </div>
            {scope !== 'global' && (
              <div>
                <label className="label">Target</label>
                {scope === 'device' && deviceList.length > 0 ? (
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
                    placeholder="Employee name or device ID"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Remove Application Rule"
        message="Are you sure you want to remove this application rule? If previously blocked, the application will be permitted to run again upon next sync."
        confirmLabel="Remove"
      />
    </div>
  );
}
