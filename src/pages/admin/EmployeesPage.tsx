import { useState, useMemo, useEffect } from 'react';
import { Users, Plus, Mail, ShieldCheck, MoreVertical, Pencil, Power, Trash2, Monitor, Eye } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import SearchInput from '@/components/ui/SearchInput';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { DataTable } from '@/components/ui/DataTable';
import { usersApi, devicesApi } from '@/lib/api';
import { formatDate, timeAgo } from '@/lib/format';
import type { User, Device } from '@/types';

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  employee: 'Employee',
};

const roleBadge: Record<string, 'primary' | 'info' | 'neutral'> = {
  super_admin: 'primary',
  admin: 'info',
  employee: 'neutral',
};

export default function EmployeesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [viewEmployee, setViewEmployee] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [employeeList, setEmployeeList] = useState<User[]>([]);
  const [deviceList, setDeviceList] = useState<Device[]>([]);

  useEffect(() => {
    Promise.all([
      usersApi.getAll().catch(() => []),
      devicesApi.getAll().catch(() => []),
    ]).then(([users, devs]) => {
      if (Array.isArray(users)) setEmployeeList(users);
      if (Array.isArray(devs)) setDeviceList(devs);
    });
  }, []);

  const filtered = useMemo(() => {
    return employeeList.filter((u) => {
      if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      return true;
    });
  }, [employeeList, search, statusFilter]);

  const handleSave = async (data: Partial<User>) => {
    if (editing) {
      try {
        const updated = await usersApi.update(editing.id, data);
        setEmployeeList((prev) => prev.map((u) => (u.id === editing.id ? { ...u, ...updated } : u)));
        toast('Employee updated successfully');
      } catch (e: any) {
        setEmployeeList((prev) => prev.map((u) => (u.id === editing.id ? { ...u, ...data } : u)));
        toast('Employee updated locally');
      }
    } else {
      const payload: Partial<User> = {
        name: data.name || '',
        email: data.email || '',
        role: data.role || 'employee',
        status: 'active',
      };
      try {
        const created = await usersApi.create(payload);
        setEmployeeList((prev) => [created, ...prev]);
        toast('Employee created successfully');
      } catch (e: any) {
        const fallback: User = {
          id: `u-${Date.now()}`,
          name: data.name || '',
          email: data.email || '',
          role: (data.role as User['role']) || 'employee',
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        setEmployeeList((prev) => [fallback, ...prev]);
        toast('Employee created locally');
      }
    }
    setModalOpen(false);
    setEditing(null);
  };

  const toggleStatus = async (id: string) => {
    const target = employeeList.find((u) => u.id === id);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    try {
      await usersApi.update(id, { status: newStatus });
    } catch {}
    setEmployeeList((prev) => prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)));
    setMenuOpen(null);
    toast('Employee status updated');
  };

  const handleDelete = async () => {
    if (confirmDelete) {
      try {
        await usersApi.delete(confirmDelete);
      } catch {}
      setEmployeeList((prev) => prev.filter((u) => u.id !== confirmDelete));
      toast('Employee removed', 'info');
      setConfirmDelete(null);
    }
  };

  const selectedEmployeeDevice = useMemo(() => {
    if (!viewEmployee) return undefined;
    return deviceList.find(
      (d) => d.employeeId === viewEmployee.id || (d.employeeName && d.employeeName.toLowerCase() === viewEmployee.name.toLowerCase())
    );
  }, [viewEmployee, deviceList]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Management"
        description="Create and manage employee accounts and linked Windows workstations."
        icon={<Users className="h-5 w-5" />}
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setModalOpen(true); }}>Add Employee</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card padding="md">
          <p className="text-sm text-slate-500">Total Employees</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{employeeList.length}</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-slate-500">Active Accounts</p>
          <p className="mt-1 text-2xl font-bold text-success-600">{employeeList.filter((u) => u.status === 'active').length}</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-slate-500">Workstations Assigned</p>
          <p className="mt-1 text-2xl font-bold text-primary-600">
            {employeeList.filter((u) => deviceList.some((d) => d.employeeId === u.id || d.employeeName?.toLowerCase() === u.name.toLowerCase())).length}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-slate-500">Online Workstations</p>
          <p className="mt-1 text-2xl font-bold text-success-600">{deviceList.filter((d) => d.online).length}</p>
        </Card>
      </div>

      <Card padding="none">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." className="flex-1" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input sm:w-40">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Employee',
              render: (u) => (
                <button
                  type="button"
                  onClick={() => setViewEmployee(u)}
                  className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                  title="Click to view full details"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-theme-accent text-theme-accent-text text-sm font-bold shadow-sm">
                    {u.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-theme-heading">{u.name}</p>
                    <p className="flex items-center gap-1 text-xs text-theme-muted"><Mail className="h-3 w-3" />{u.email}</p>
                  </div>
                </button>
              ),
            },
            {
              key: 'device',
              header: 'Assigned Workstation',
              render: (u) => {
                const dev = deviceList.find(
                  (d) => d.employeeId === u.id || (d.employeeName && d.employeeName.toLowerCase() === u.name.toLowerCase())
                );
                if (!dev) {
                  return <span className="text-xs text-theme-muted italic">No device</span>;
                }
                return (
                  <button
                    type="button"
                    onClick={() => setViewEmployee(u)}
                    className="flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity"
                    title="Click to view full device specs & employee details"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-bg-deep border border-theme-border text-theme-accent">
                      <Monitor className={`h-4 w-4 ${dev.online ? 'text-theme-accent' : 'text-theme-muted'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-theme-heading">{dev.name}</span>
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${dev.online ? 'bg-theme-accent' : 'bg-theme-muted'}`} />
                      </div>
                      <span className="font-mono text-[10px] text-theme-muted">{dev.deviceId}</span>
                    </div>
                  </button>
                );
              },
            },
            {
              key: 'role',
              header: 'Role',
              render: (u) => <Badge variant={roleBadge[u.role]}>{roleLabels[u.role]}</Badge>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (u) => <Badge variant={u.status === 'active' ? 'success' : 'neutral'} dot>{u.status === 'active' ? 'Active' : 'Inactive'}</Badge>,
            },
            {
              key: 'createdAt',
              header: 'Joined',
              render: (u) => <span className="text-xs text-theme-muted">{formatDate(u.createdAt)}</span>,
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              render: (u) => (
                <div className="relative flex justify-end">
                  <button
                    onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                    className="btn-ghost p-1.5"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menuOpen === u.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                      <div className="absolute right-0 z-20 mt-1 w-44 card shadow-elevated animate-scale-in" style={{ padding: 0 }}>
                        <button
                          onClick={() => { setViewEmployee(u); setMenuOpen(null); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4 text-primary-500" /> View Full Details
                        </button>
                        <button
                          onClick={() => { setEditing(u); setModalOpen(true); setMenuOpen(null); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={() => toggleStatus(u.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Power className="h-4 w-4" /> {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => { setConfirmDelete(u.id); setMenuOpen(null); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
                        >
                          <Trash2 className="h-4 w-4" /> Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ),
            },
          ]}
          data={filtered}
          emptyMessage="No employees match your filters"
        />
      </Card>

      <EmployeeModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        employee={editing}
      />

      <EmployeeDetailsModal
        user={viewEmployee}
        device={selectedEmployeeDevice}
        onClose={() => setViewEmployee(null)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Remove Employee"
        message="Are you sure you want to remove this employee? This will revoke their access but preserve audit history."
        confirmLabel="Remove"
      />
    </div>
  );
}

function EmployeeDetailsModal({
  user,
  device,
  onClose,
}: {
  user: User | null;
  device?: Device;
  onClose: () => void;
}) {
  if (!user) return null;

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title="Employee & Linked Workstation Details"
      description={`Full account details and workstation assignment for ${user.name}.`}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-end">
          <Button size="sm" onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Employee Profile Section */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                {user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</h4>
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <Mail className="h-3 w-3" /> {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={roleBadge[user.role]}>{roleLabels[user.role]}</Badge>
              <Badge variant={user.status === 'active' ? 'success' : 'neutral'} dot>
                {user.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            <div>
              <span className="text-slate-400">Account ID</span>
              <p className="mt-0.5 font-mono font-medium text-slate-700 dark:text-slate-200">{user.id}</p>
            </div>
            <div>
              <span className="text-slate-400">Last Login</span>
              <p className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">
                {user.lastLogin ? timeAgo(user.lastLogin) : 'Never'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Member Since</span>
              <p className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Assigned Device Section */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                  {device ? device.name : 'No Workstation Assigned'}
                </h4>
                <p className="font-mono text-xs text-slate-400">
                  {device ? device.deviceId : 'Register or link a device from Devices tab'}
                </p>
              </div>
            </div>
            {device && (
              <Badge variant={device.online ? 'success' : 'neutral'} dot>
                {device.online ? 'Online' : 'Offline'}
              </Badge>
            )}
          </div>

          {device ? (
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
                <span className="text-slate-400">Assigned Policy</span>
                <p className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">{device.policyName || 'Standard Policy'}</p>
              </div>
              <div>
                <span className="text-slate-400">Last Sync</span>
                <p className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">{timeAgo(device.lastSync)}</p>
              </div>
            </div>
          ) : (
            <div className="mt-3 text-xs text-slate-500">
              When a device is registered with this employee's name, it will automatically link and display its live status here.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

interface EmployeeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<User>) => void;
  employee: User | null;
}

function EmployeeModal({ open, onClose, onSave, employee }: EmployeeModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('employee');

  useMemo(() => {
    if (employee) {
      setName(employee.name);
      setEmail(employee.email);
      setRole(employee.role);
    } else {
      setName('');
      setEmail('');
      setRole('employee');
    }
  }, [employee, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={employee ? 'Edit Employee' : 'Add Employee'}
      description={employee ? 'Update employee name and role.' : 'Create a new employee account.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ name, email, role: role as User['role'] })}>
            <ShieldCheck className="h-4 w-4" /> {employee ? 'Save Changes' : 'Create Employee'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" />
        </div>
        <div>
          <label className="label">Email Address</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john.smith@company.com" />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="employee">Employee</option>
            <option value="admin">Administrator</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
