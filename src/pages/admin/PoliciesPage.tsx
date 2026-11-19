import { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Globe,
  AppWindow,
  Chrome,
  Usb,
  Clock,
  History,
  Users,
  Monitor,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card, { SectionHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import SearchInput from '@/components/ui/SearchInput';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { policiesApi, devicesApi, departmentsApi } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type { Policy, Device, Department } from '@/types';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PoliciesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [policyList, setPolicyList] = useState<Policy[]>([]);
  const [deviceList, setDeviceList] = useState<Device[]>([]);
  const [deptList, setDeptList] = useState<Department[]>([]);

  // Modals state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [detailPolicy, setDetailPolicy] = useState<Policy | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assignedDevices: [] as string[],
    assignedDepartments: [] as string[],
    timeEnabled: false,
    timeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    timeStart: '08:00',
    timeEnd: '18:00',
  });

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const [policies, devices, depts] = await Promise.all([
        policiesApi.getAll().catch(() => []),
        devicesApi.getAll().catch(() => []),
        departmentsApi.getAll().catch(() => []),
      ]);
      setPolicyList(Array.isArray(policies) ? policies : []);
      setDeviceList(Array.isArray(devices) ? devices : []);
      setDeptList(Array.isArray(depts) ? depts : []);
      if (isManual) toast('Policies and workstation assignments refreshed');
    } catch {
      toast('Failed to load policies', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingPolicy(null);
    setFormData({
      name: '',
      description: '',
      assignedDevices: [],
      assignedDepartments: [],
      timeEnabled: false,
      timeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      timeStart: '08:00',
      timeEnd: '18:00',
    });
    setEditorOpen(true);
  };

  const openEditModal = (p: Policy) => {
    setEditingPolicy(p);
    setFormData({
      name: p.name,
      description: p.description || '',
      assignedDevices: p.assignments?.devices || [],
      assignedDepartments: p.assignments?.departments || [],
      timeEnabled: p.timeRestrictions?.enabled || false,
      timeDays: p.timeRestrictions?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      timeStart: p.timeRestrictions?.start || '08:00',
      timeEnd: p.timeRestrictions?.end || '18:00',
    });
    setEditorOpen(true);
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast('Policy name is required', 'error');
      return;
    }

    const payload: Partial<Policy> = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      assignments: {
        departments: formData.assignedDepartments,
        employees: editingPolicy?.assignments?.employees || [],
        devices: formData.assignedDevices,
      },
      timeRestrictions: {
        enabled: formData.timeEnabled,
        days: formData.timeDays,
        start: formData.timeStart,
        end: formData.timeEnd,
      },
    };

    try {
      if (editingPolicy) {
        const updated = await policiesApi.update(editingPolicy.id, payload);
        setPolicyList((prev) => prev.map((p) => (p.id === editingPolicy.id ? { ...p, ...updated } : p)));
        toast(`Policy "${updated.name}" updated to v${updated.version}`);
      } else {
        const created = await policiesApi.create(payload);
        setPolicyList((prev) => [created, ...prev]);
        toast(`Policy "${created.name}" created successfully`);
      }
      setEditorOpen(false);
      await loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to save policy', 'error');
    }
  };

  const handleToggleActive = async (policy: Policy) => {
    const newActive = !policy.active;
    try {
      if (newActive) {
        await policiesApi.activate(policy.id);
        toast(`Policy "${policy.name}" activated and enforced on workstations`);
      } else {
        await policiesApi.update(policy.id, { active: false });
        toast(`Policy "${policy.name}" deactivated`);
      }
      await loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to toggle policy status', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await policiesApi.delete(confirmDelete);
      setPolicyList((prev) => prev.filter((p) => p.id !== confirmDelete));
      toast('Policy deleted from system');
      setConfirmDelete(null);
    } catch (err: any) {
      toast(err.message || 'Failed to delete policy', 'error');
    }
  };

  const filtered = useMemo(() => {
    return policyList.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [policyList, search]);

  const activeCount = policyList.filter((p) => p.active).length;
  const assignedWorkstations = new Set(policyList.flatMap((p) => p.assignments?.devices || [])).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Policy Management"
        description="Create, orchestrate, and deploy enterprise security policies across departments and workstation groups."
        icon={<FileText className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
           
            
          </div>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Active Policies</p>
              <p className="mt-1 text-2xl font-bold text-theme-heading">
                {activeCount} of {policyList.length}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-theme-bg-deep border border-theme-border text-theme-accent">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-theme-muted">Actively enforced on workstations</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Assigned Devices</p>
              <p className="mt-1 text-2xl font-bold text-theme-heading">{assignedWorkstations}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-theme-bg-deep border border-theme-border text-theme-accent">
              <Monitor className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xs text-theme-muted">{deviceList.length} total enrolled machines</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Governed Subsystems</p>
              <p className="mt-1 text-2xl font-bold text-theme-heading">4 Modules</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-theme-bg-deep border border-theme-border text-theme-accent">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-theme-muted">Web, Apps, 5 Browsers, USB</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Sync Heartbeat</p>
              <p className="mt-1 text-2xl font-bold text-theme-heading">60s</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-theme-bg-deep border border-theme-border text-theme-accent">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xs text-theme-muted">Automatic Windows Agent sync</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search policies by name or description..."
          className="flex-1 max-w-md"
        />
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((policy) => {
          const isActive = policy.active;
          const assignedDeviceNames = (policy.assignments?.devices || []).map((id) => {
            const dev = deviceList.find((d) => d.id === id || d.deviceId === id || d.name === id);
            return dev ? dev.name : id;
          });

          return (
            <Card
              key={policy.id}
              padding="md"
              className={`group transition border ${
                isActive
                  ? 'border-theme-border bg-theme-surface hover:border-theme-accent/50'
                  : 'border-theme-border bg-theme-surface-subtle opacity-75'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{policy.name}</h3>
                      <Badge variant="neutral">v{policy.version}</Badge>
                      
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {policy.description || 'Enterprise security policy.'}
                    </p>
                  </div>
                </div>

                <Badge variant={isActive ? 'success' : 'neutral'} dot>
                  {isActive ? 'Active & Enforced' : 'Inactive'}
                </Badge>
              </div>

              {/* Dynamic Live Rule Matrix */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center rounded-lg bg-theme-surface-subtle py-2.5 border border-theme-border">
                  <Globe className="h-4 w-4 text-theme-heading" />
                  <p className="mt-1 text-sm font-bold text-theme-heading">{policy.rules?.website || 0}</p>
                  <p className="text-[10px] text-theme-muted">Websites</p>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-theme-surface-subtle py-2.5 border border-theme-border">
                  <AppWindow className="h-4 w-4 text-theme-heading" />
                  <p className="mt-1 text-sm font-bold text-theme-heading">
                    {policy.rules?.application || 0}
                  </p>
                  <p className="text-[10px] text-theme-muted">Applications</p>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-theme-surface-subtle py-2.5 border border-theme-border">
                  <Chrome className="h-4 w-4 text-theme-heading" />
                  <p className="mt-1 text-sm font-bold text-theme-heading">{policy.rules?.browser || 5}</p>
                  <p className="text-[10px] text-theme-muted">5 Browsers</p>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-theme-surface-subtle py-2.5 border border-theme-border">
                  <Usb className="h-4 w-4 text-theme-heading" />
                  <p className="mt-1 text-sm font-bold text-theme-heading">
                    {policy.rules?.usb ? 'Active' : 'Allow'}
                  </p>
                  <p className="text-[10px] text-theme-muted">USB Storage</p>
                </div>
              </div>

              {/* Assignments & Schedule */}
              <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                {/* Workstations */}
                <div className="flex items-center gap-2">
                  <Monitor className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-500">Workstations:</span>
                  {assignedDeviceNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {assignedDeviceNames.slice(0, 3).map((devName) => (
                        <span
                          key={devName}
                          className="px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 font-medium text-[11px]"
                        >
                          {devName}
                        </span>
                      ))}
                      {assignedDeviceNames.length > 3 && (
                        <span className="text-slate-400 text-[11px]">+{assignedDeviceNames.length - 3} more</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">None assigned (Global fallback)</span>
                  )}
                </div>

                {/* Departments */}
                {policy.assignments?.departments && policy.assignments.departments.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-500">Departments:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {policy.assignments.departments.join(', ')}
                    </span>
                  </div>
                )}

                {/* Working Hours */}
                {policy.timeRestrictions?.enabled && (
                  <div className="flex items-center gap-2 text-warning-600 dark:text-warning-400">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      Schedule: {policy.timeRestrictions.days?.join(', ')} ({policy.timeRestrictions.start} -{' '}
                      {policy.timeRestrictions.end})
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span>Created by {policy.createdBy || 'Admin'}</span>
                  <span>Updated {formatDateTime(policy.updatedAt)}</span>
                </div>
              </div>

           
            </Card>
          );
        })}
      </div>

      {/* Policy Editor Modal (Create / Edit) */}
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingPolicy ? `Edit Policy: ${editingPolicy.name}` : 'Create Enterprise Policy'}
        description="Configure policy rules, workstation targets, and time-based access schedules."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePolicy}>Save & Enforce Policy</Button>
          </>
        }
      >
        <form onSubmit={handleSavePolicy} className="space-y-4 text-xs">
          <div>
            <label className="label">Policy Profile Name</label>
            <input
              className="input text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Development - High Security"
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input text-sm min-h-[70px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what access restrictions this profile enforces..."
            />
          </div>

          {/* Workstation Target Assignments */}
          <div>
            <label className="label flex items-center justify-between">
              <span>Assign Workstations ({formData.assignedDevices.length} selected)</span>
              <span className="text-[11px] text-slate-400">Enrolled endpoint machines</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1.5 border rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              {deviceList.length === 0 ? (
                <p className="text-slate-400 col-span-2 text-center py-3">No workstations currently enrolled.</p>
              ) : (
                deviceList.map((dev) => {
                  const devId = dev.id || dev.deviceId;
                  const isChecked = formData.assignedDevices.includes(devId) || formData.assignedDevices.includes(dev.name);
                  return (
                    <label
                      key={devId}
                      className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:border-primary-500 transition"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...formData.assignedDevices, dev.name]
                            : formData.assignedDevices.filter((id) => id !== devId && id !== dev.name);
                          setFormData({ ...formData, assignedDevices: updated });
                        }}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="truncate">
                        <span className="font-semibold text-slate-900 dark:text-white block truncate">{dev.name}</span>
                        <span className="text-[10px] text-slate-400">{dev.employeeName || 'Standard User'}</span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Department Assignments */}
          <div>
            <label className="label">Assign Departments</label>
            <div className="flex flex-wrap gap-2">
              {['Development', 'Finance', 'HR', 'Sales', 'Marketing', 'Administration'].map((deptName) => {
                const isSelected = formData.assignedDepartments.includes(deptName);
                return (
                  <button
                    key={deptName}
                    type="button"
                    onClick={() => {
                      const updated = isSelected
                        ? formData.assignedDepartments.filter((d) => d !== deptName)
                        : [...formData.assignedDepartments, deptName];
                      setFormData({ ...formData, assignedDepartments: updated });
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {deptName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Working Hours Time Restrictions */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning-500" />
                <span className="font-bold text-slate-900 dark:text-white">Working Hours Schedule Restriction</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.timeEnabled}
                  onChange={(e) => setFormData({ ...formData, timeEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {formData.timeEnabled && (
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Active Days</span>
                  <div className="flex gap-1.5">
                    {DAYS_OF_WEEK.map((day) => {
                      const isDaySelected = formData.timeDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const updated = isDaySelected
                              ? formData.timeDays.filter((d) => d !== day)
                              : [...formData.timeDays, day];
                            setFormData({ ...formData, timeDays: updated });
                          }}
                          className={`flex-1 py-1 text-xs font-semibold rounded-lg border transition ${
                            isDaySelected
                              ? 'border-warning-500 bg-warning-50 text-warning-700 dark:bg-warning-950 dark:text-warning-300'
                              : 'border-slate-200 text-slate-500 dark:border-slate-700'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Start Time</label>
                    <input
                      type="time"
                      className="input text-xs"
                      value={formData.timeStart}
                      onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">End Time</label>
                    <input
                      type="time"
                      className="input text-xs"
                      value={formData.timeEnd}
                      onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Policy Detail Modal */}
      <PolicyDetailModal policy={detailPolicy} onClose={() => setDetailPolicy(null)} />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Policy Profile"
        message="Deleting this policy profile will remove all its specific restriction directives. Any assigned workstations will automatically fall back to global enterprise policies."
        confirmLabel="Delete Policy"
      />
    </div>
  );
}

function PolicyDetailModal({ policy, onClose }: { policy: Policy | null; onClose: () => void }) {
  if (!policy) return null;
  return (
    <Modal
      open={!!policy}
      onClose={onClose}
      title={policy.name}
      description={`Version ${policy.version} · Created by ${policy.createdBy}`}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4 text-xs">
        <div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{policy.description || 'Enterprise restriction profile.'}</p>
        </div>

        <div>
          <SectionHeader title="Rule Breakdown" />
          <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { label: 'Blocked Websites', value: policy.rules?.website || 0, icon: Globe, color: 'text-primary-500' },
              { label: 'Blocked Apps', value: policy.rules?.application || 0, icon: AppWindow, color: 'text-purple-500' },
              { label: '5 Browsers', value: policy.rules?.browser || 5, icon: Chrome, color: 'text-cyan-500' },
              { label: 'USB Storage', value: policy.rules?.usb ? 'Active' : 'Allow', icon: Usb, color: 'text-rose-500' },
            ].map((r) => (
              <div key={r.label} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <r.icon className={`h-4 w-4 ${r.color}`} />
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{r.value}</p>
                <p className="text-[11px] text-slate-400">{r.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title="Target Assignments" />
          <div className="mt-2.5 space-y-2">
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <Monitor className="h-4 w-4 text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {policy.assignments?.devices?.length || 0} Workstation(s) Assigned
                {policy.assignments?.devices && policy.assignments.devices.length > 0 && (
                  <span className="text-slate-400 font-normal"> ({policy.assignments.devices.join(', ')})</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {policy.assignments?.departments?.length || 0} Department(s) Assigned
                {policy.assignments?.departments && policy.assignments.departments.length > 0 && (
                  <span className="text-slate-400 font-normal"> ({policy.assignments.departments.join(', ')})</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {policy.timeRestrictions?.enabled && (
          <div>
            <SectionHeader title="Schedule Restrictions" />
            <div className="mt-2 p-2.5 rounded-lg border border-warning-200 bg-warning-50/50 dark:border-warning-500/20 dark:bg-warning-500/5 text-slate-700 dark:text-slate-300">
              <p>
                <strong>Active Days:</strong> {policy.timeRestrictions.days?.join(', ') || 'All Days'}
              </p>
              <p className="mt-0.5">
                <strong>Enforced Hours:</strong> {policy.timeRestrictions.start} to {policy.timeRestrictions.end}
              </p>
            </div>
          </div>
        )}

        <div>
          <SectionHeader title="Version History" action={<History className="h-4 w-4 text-slate-400" />} />
          <div className="mt-2 space-y-1.5">
            {Array.from({ length: Math.min(policy.version, 3) }, (_, i) => policy.version - i).map((v) => (
              <div
                key={v}
                className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30"
              >
                <Badge variant={v === policy.version ? 'success' : 'neutral'}>v{v}</Badge>
                <span className="text-slate-600 dark:text-slate-300">
                  {v === policy.version ? 'Current active revision' : 'Historical revision'}
                </span>
                <span className="ml-auto text-slate-400 text-[11px]">{formatDateTime(policy.updatedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
