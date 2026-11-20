import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, User, Monitor, Globe, AppWindow,
  CheckCircle2, LogOut, Ban, Clock3, Chrome, Usb,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Card, { SectionHeader } from '@/components/ui/Card';
import { devices, websiteRules, applicationRules } from '@/data/mockData';
import { formatDateTime } from '@/lib/format';

type Tab = 'overview' | 'restrictions';

export default function EmployeePortalPage() {
  const [tab, setTab] = useState<Tab>('overview');

  const myDevice = devices[1];

  const blockedWebsites = websiteRules.filter((r) => r.action === 'block').slice(0, 8);
  const blockedApps = applicationRules.filter((r) => r.action === 'block').slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Employee Portal</p>
              <p className="text-xs text-slate-400">WRMS Endpoint Security</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
              MC
            </div>
            <Link to="/" className="btn-ghost p-2 text-slate-400">
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Welcome, Michael Chen</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Development · {myDevice.name}</p>
          </div>
          <Badge variant="success" dot>Policy Active & Enforcing</Badge>
        </div>

        <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/50">
          {([
            { id: 'overview', label: 'Device Overview', icon: User },
            { id: 'restrictions', label: 'Active Restrictions', icon: Ban },
          ] as { id: Tab; label: string; icon: typeof User }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                tab === t.id ? 'bg-white text-primary-700 shadow-sm dark:bg-slate-900 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-theme-bg-deep border border-theme-border text-theme-accent"><Monitor className="h-5 w-5" /></div>
                  <div><p className="text-xs text-theme-muted">My Device</p><p className="text-sm font-bold text-theme-heading">{myDevice.name}</p></div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-theme-bg-deep border border-theme-border text-theme-accent"><CheckCircle2 className="h-5 w-5" /></div>
                  <div><p className="text-xs text-theme-muted">Policy Status</p><p className="text-sm font-bold text-theme-heading">{myDevice.policyName}</p></div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-theme-bg-deep border border-theme-border text-theme-accent"><Clock3 className="h-5 w-5" /></div>
                  <div><p className="text-xs text-theme-muted">Last Sync</p><p className="text-sm font-bold text-theme-heading">15 min ago</p></div>
                </div>
              </Card>
            </div>

            <Card padding="md">
              <SectionHeader title="Device Information" />
              <div className="mt-4 space-y-2 text-sm">
                {[
                  { label: 'Device Name', value: myDevice.name },
                  { label: 'Device ID', value: myDevice.deviceId },
                  { label: 'OS Version', value: myDevice.osVersion },
                  { label: 'Agent Version', value: `v${myDevice.agentVersion}` },
                  { label: 'Assigned Policy', value: myDevice.policyName || '—' },
                  { label: 'Last Sync', value: formatDateTime(myDevice.lastSync) },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between border-b border-theme-border-subtle py-2">
                    <span className="text-theme-muted">{item.label}</span>
                    <span className="font-semibold text-theme-heading">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === 'restrictions' && (
          <div className="space-y-4 animate-fade-in">
            <Card padding="md">
              <SectionHeader title="Blocked Websites" description="Domains restricted by your current policy" action={<Globe className="h-5 w-5 text-theme-muted" />} />
              <div className="mt-4 flex flex-wrap gap-2">
                {blockedWebsites.map((r) => (
                  <div key={r.id} className="flex items-center gap-1.5 rounded-full border border-theme-border bg-theme-bg-deep px-3 py-1.5 text-xs">
                    <Ban className="h-3.5 w-3.5 text-error-500" />
                    <span className="text-theme-heading font-medium font-mono">{r.domain}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card padding="md">
              <SectionHeader title="Blocked Applications" description="Applications restricted by your current policy" action={<AppWindow className="h-5 w-5 text-theme-muted" />} />
              <div className="mt-4 space-y-2">
                {blockedApps.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl border border-theme-border p-3 bg-theme-surface">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-bg-deep border border-theme-border text-rose-400"><Ban className="h-4 w-4" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-theme-heading">{r.appName}</p>
                      <p className="text-xs text-theme-muted">{r.publisher}</p>
                    </div>
                    <Badge variant="error" dot>Blocked</Badge>
                  </div>
                ))}
              </div>
            </Card>
            <Card padding="md">
              <SectionHeader title="Browser & Hardware Hardening" description="Kernel and Registry enforcement layers" action={<ShieldCheck className="h-5 w-5 text-theme-muted" />} />
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 border rounded-xl border-theme-border bg-theme-surface flex items-center gap-3">
                  <Chrome className="h-5 w-5 text-theme-accent" />
                  <div>
                    <p className="text-sm font-bold text-theme-heading">Browser Security</p>
                    <p className="text-xs text-theme-muted">Incognito / InPrivate disabled; URL filtering active</p>
                  </div>
                </div>
                <div className="p-3.5 border rounded-xl border-theme-border bg-theme-surface flex items-center gap-3">
                  <Usb className="h-5 w-5 text-theme-accent" />
                  <div>
                    <p className="text-sm font-bold text-theme-heading">USB Storage Guard</p>
                    <p className="text-xs text-theme-muted">Mass storage governed by policy; HID devices allowed</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
