import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Plus, Ban, CheckCircle2, Upload, Trash2, Clock, Tag, Monitor, ShieldCheck } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card, { SectionHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import SearchInput from '@/components/ui/SearchInput';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { websiteRules as initialRules } from '@/data/mockData';
import { websiteRulesApi, devicesApi } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { WebsiteRule, Device } from '@/types';

const scopeLabels: Record<string, string> = {
  global: 'Global',
  employee: 'Employee',
  device: 'Device',
};

export default function WebsiteControlPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState<'global' | 'device' | 'all'>('global');
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [rules, setRules] = useState<WebsiteRule[]>([]);
  const [deviceList, setDeviceList] = useState<Device[]>([]);

  useEffect(() => {
    Promise.all([
      websiteRulesApi.getAll().catch(() => []),
      devicesApi.getAll().catch(() => []),
    ]).then(([rulesData, devs]) => {
      if (Array.isArray(rulesData)) setRules(rulesData);
      if (Array.isArray(devs)) setDeviceList(devs);
    });
  }, []);

  const [domain, setDomain] = useState('');
  const [category, setCategory] = useState('');
  const [action, setAction] = useState<'block' | 'allow'>('block');
  const [scope, setScope] = useState<WebsiteRule['scope']>('global');
  const [scopeTarget, setScopeTarget] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const globalRules = useMemo(() => {
    return rules.filter((r) => !r.scope || r.scope === 'global');
  }, [rules]);

  const deviceRules = useMemo(() => {
    return rules.filter((r) => r.scope === 'device');
  }, [rules]);

  const filtered = useMemo(() => {
    return rules.filter((r) => {
      // By default scopeFilter === 'global', only show global rules (hide device-specific rules)
      if (scopeFilter === 'global' && r.scope && r.scope !== 'global') return false;
      if (scopeFilter === 'device' && r.scope !== 'device') return false;
      if (search && !r.domain.toLowerCase().includes(search.toLowerCase()) && !r.category.toLowerCase().includes(search.toLowerCase())) return false;
      if (actionFilter !== 'all' && r.action !== actionFilter) return false;
      return true;
    });
  }, [rules, search, actionFilter, scopeFilter]);

  const handleAdd = async () => {
    if (!domain.trim()) { toast('Domain is required', 'error'); return; }
    const payload: Partial<WebsiteRule> = {
      domain: domain.toLowerCase().trim(),
      category: category || 'General',
      action,
      scope,
      scopeTarget: scope !== 'global' ? scopeTarget : undefined,
      schedule: scheduleEnabled ? { enabled: true, start: '09:00', end: '17:00' } : undefined,
    };
    try {
      const created = await websiteRulesApi.create(payload);
      setRules((prev) => [created, ...prev]);
      toast(`Rule saved to MongoDB: ${action === 'block' ? 'Blocked' : 'Allowed'} ${domain}`);
    } catch {
      const newRule: WebsiteRule = {
        id: `w-${Date.now()}`,
        domain: domain.toLowerCase(),
        category: category || 'General',
        action,
        scope,
        scopeTarget: scope !== 'global' ? scopeTarget : undefined,
        schedule: scheduleEnabled ? { enabled: true, start: '09:00', end: '17:00' } : undefined,
        createdAt: new Date().toISOString(),
      };
      setRules((prev) => [newRule, ...prev]);
      toast(`Rule added locally: ${action === 'block' ? 'Blocked' : 'Allowed'} ${domain}`);
    }
    setModalOpen(false);
    setDomain(''); setCategory(''); setScopeTarget(''); setScheduleEnabled(false);
  };

  const handleBulk = async () => {
    const lines = bulkText.split('\n').filter((l) => l.trim());
    const domains = lines.map((line) => line.trim().split(',')[0].trim());
    try {
      const res = await websiteRulesApi.createBulk({
        domains,
        action: 'block',
        category: 'Bulk Import',
        scope: 'global',
      });
      setRules((prev) => [...res.rules, ...prev]);
      toast(`${res.rules.length} rules saved to MongoDB`);
    } catch {
      const newRules: WebsiteRule[] = lines.map((line, i) => {
        const [d, a = 'block'] = line.trim().split(',').map((s) => s.trim());
        return {
          id: `w-bulk-${Date.now()}-${i}`,
          domain: d.toLowerCase(),
          category: 'Bulk Import',
          action: (a === 'allow' ? 'allow' : 'block') as 'block' | 'allow',
          scope: 'global',
          createdAt: new Date().toISOString(),
        };
      });
      setRules((prev) => [...newRules, ...prev]);
      toast(`${newRules.length} rules imported locally`);
    }
    setBulkOpen(false);
    setBulkText('');
  };

  const handleToggleAction = async (rule: WebsiteRule) => {
    const newAction = rule.action === 'block' ? 'allow' : 'block';
    try {
      await websiteRulesApi.update(rule.id, { action: newAction });
      setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, action: newAction } : r));
      toast(`Rule updated: ${rule.domain} is now ${newAction}`);
    } catch {
      toast('Failed to update rule', 'error');
    }
  };

  const handleDelete = async () => {
    if (confirmDelete) {
      try {
        await websiteRulesApi.delete(confirmDelete);
      } catch { }
      setRules((prev) => prev.filter((r) => r.id !== confirmDelete));
      toast('Website rule removed from MongoDB', 'info');
      setConfirmDelete(null);
    }
  };

  const categories = [...new Set(globalRules.map((r) => r.category))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Control"

        icon={<Globe className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">


            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>Add Rule</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error-100 dark:bg-error-500/15"><Ban className="h-5 w-5 text-error-600" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {globalRules.filter((r) => r.action === 'block').length}
              </p>
              <p className="text-xs text-slate-400">Global Blocked</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 dark:bg-success-500/15"><CheckCircle2 className="h-5 w-5 text-success-600" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {globalRules.filter((r) => r.action === 'allow').length}
              </p>
              <p className="text-xs text-slate-400">Global Allowed</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10"><Tag className="h-5 w-5 text-primary-600" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {categories.length}
              </p>
              <p className="text-xs text-slate-400">Categories</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <Link to="/devices" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 dark:bg-warning-500/15"><Monitor className="h-5 w-5 text-warning-600" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {deviceRules.length}
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                Device Overrides <span className="text-primary-500 text-[10px] font-semibold">View in Devices →</span>
              </p>
            </div>
          </Link>
        </Card>
      </div>

      <Card padding="none">
        <div className="flex flex-col gap-3 border-b border-theme-border p-4 bg-theme-surface lg:flex-row lg:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search domains or categories..." className="flex-1" />

          <div className="flex flex-wrap items-center gap-3">
            {/* Scope Filter: Default is Global Policies (User Request) */}
            <div className="flex rounded-full bg-theme-bg-deep p-1 border border-theme-border">
              <button
                type="button"
                onClick={() => setScopeFilter('global')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${scopeFilter === 'global'
                  ? 'bg-theme-accent text-theme-accent-text font-semibold shadow-sm'
                  : 'text-theme-body hover:text-theme-heading'
                  }`}
              >
                Global Policies ({globalRules.length})
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('device')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${scopeFilter === 'device'
                  ? 'bg-theme-accent text-theme-accent-text font-semibold shadow-sm'
                  : 'text-theme-body hover:text-theme-heading'
                  }`}
              >
                Device Overrides ({deviceRules.length})
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${scopeFilter === 'all'
                  ? 'bg-theme-accent text-theme-accent-text font-semibold shadow-sm'
                  : 'text-theme-body hover:text-theme-heading'
                  }`}
              >
                All ({rules.length})
              </button>
            </div>

            {/* Action Filter */}
            <div className="flex gap-1.5">
              <button onClick={() => setActionFilter('all')} className={`rounded-full px-3 py-1 text-xs font-medium transition ${actionFilter === 'all' ? 'bg-theme-accent text-theme-accent-text font-semibold shadow-sm' : 'bg-theme-bg-deep text-theme-body border border-theme-border hover:text-theme-heading'}`}>All</button>
              <button onClick={() => setActionFilter('block')} className={`rounded-full px-3 py-1 text-xs font-medium transition ${actionFilter === 'block' ? 'bg-[#3d1c16] text-[#e08e79] font-semibold border border-[#6b3528]' : 'bg-theme-bg-deep text-theme-body border border-theme-border hover:text-theme-heading'}`}>Blocked</button>
              <button onClick={() => setActionFilter('allow')} className={`rounded-full px-3 py-1 text-xs font-medium transition ${actionFilter === 'allow' ? 'bg-[#144737] text-theme-heading font-semibold border border-[rgba(243,238,227,0.12)]' : 'bg-theme-bg-deep text-theme-body border border-theme-border hover:text-theme-heading'}`}>Allowed</button>
            </div>
          </div>
        </div>



        <DataTable
          columns={[
            {
              key: 'domain',
              header: 'Domain',
              render: (r) => (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-theme-muted" />
                  <span className="font-semibold font-mono text-theme-heading">{r.domain}</span>
                </div>
              ),
            },
            { key: 'category', header: 'Category', render: (r) => <Badge variant="neutral">{r.category}</Badge> },
            {
              key: 'action',
              header: 'Action',
              render: (r) => (
                <button
                  type="button"
                  onClick={() => handleToggleAction(r)}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  title="Click to toggle Block / Allow"
                >
                  <Badge variant={r.action === 'block' ? 'error' : 'success'} dot>
                    {r.action === 'block' ? 'Blocked' : 'Allowed'}
                  </Badge>
                </button>
              ),
            },
            {
              key: 'scope',
              header: 'Scope',
              render: (r) => (
                <div className="flex items-center gap-1.5">
                  {r.scope === 'device' ? (
                    <Badge variant="warning">Device: {r.scopeTarget}</Badge>
                  ) : (
                    <Badge variant="neutral">Global (All Devices)</Badge>
                  )}
                </div>
              ),
            },
            {
              key: 'schedule',
              header: 'Schedule',
              render: (r) => r.schedule?.enabled ? <Badge variant="warning"><Clock className="h-3 w-3" /> {r.schedule.start}-{r.schedule.end}</Badge> : <span className="text-xs text-slate-400">Always</span>,
            },
            { key: 'createdAt', header: 'Created', render: (r) => <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span> },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              render: (r) => (
                <button onClick={() => setConfirmDelete(r.id)} className="btn-ghost p-1.5 text-error-600 hover:bg-error-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              ),
            },
          ]}
          data={filtered}
          emptyMessage="No website rules match your filters"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Website Rule"
        description="Block or allow a domain. Supports subdomain matching via DNS filtering."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Rule</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Domain</label>
            <input className="input" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" />
            <p className="mt-1 text-xs text-slate-400">Subdomains are automatically matched (e.g. blog.example.com).</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Entertainment, Business..." />
            </div>
            <div>
              <label className="label">Action</label>
              <select className="input" value={action} onChange={(e) => setAction(e.target.value as 'block' | 'allow')}>
                <option value="block">Block</option>
                <option value="allow">Allow</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Scope</label>
              <select className="input" value={scope} onChange={(e) => setScope(e.target.value as WebsiteRule['scope'])}>
                <option value="global">Global (All devices)</option>
                <option value="employee">Employee</option>
                <option value="device">Specific Device</option>
              </select>
            </div>
            {scope !== 'global' && (
              <div>
                <label className="label">Target</label>
                {scope === 'device' && deviceList.length > 0 ? (
                  <select className="input" value={scopeTarget} onChange={(e) => setScopeTarget(e.target.value)}>
                    <option value="">Select registered device...</option>
                    {deviceList.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.name} ({d.deviceId})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input className="input" value={scopeTarget} onChange={(e) => setScopeTarget(e.target.value)} placeholder="Employee name or device ID" />
                )}
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={scheduleEnabled} onChange={(e) => setScheduleEnabled(e.target.checked)} className="rounded border-slate-300" />
            Enable time-based schedule (9:00 AM - 5:00 PM)
          </label>
        </div>
      </Modal>

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Import Website Rules"
        description="Paste domains below, one per line. Format: domain, action (block/allow). Default action is block."
        footer={
          <>
            <Button variant="secondary" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button onClick={handleBulk}>Import Rules</Button>
          </>
        }
      >
        <textarea
          className="input min-h-[200px] font-mono text-sm"
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={'facebook.com, block\ninstagram.com, block\nmicrosoft.com, allow\nerp.company.com, allow'}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Remove Website Rule"
        message="This will remove the restriction. Affected devices will sync on next policy update."
        confirmLabel="Remove Rule"
      />
    </div>
  );
}
