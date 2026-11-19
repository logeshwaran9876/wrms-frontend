import { Settings, Shield, Bell, Globe, Database, Key, Mail } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card, { SectionHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/context/ThemeContext';

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="System configuration, security, notifications, and appearance preferences."
        icon={<Settings className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card padding="md">
          <SectionHeader title="Organization" description="Company information and branding" />
          <div className="mt-4 space-y-4">
            <div>
              <label className="label">Organization Name</label>
              <input className="input" defaultValue="Acme Corporation" />
            </div>
            <div>
              <label className="label">Admin Contact Email</label>
              <input className="input" defaultValue="it-admin@acme.com" />
            </div>
            <Button onClick={() => toast('Organization settings saved')}>Save Changes</Button>
          </div>
        </Card>

        <Card padding="md">
          <SectionHeader title="Appearance" description="Theme and display preferences" />
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-theme-border p-3.5 bg-theme-surface">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-theme-bg-deep border border-theme-border text-theme-accent">
                  {theme === 'light' ? '☀️' : '🌙'}
                </div>
                <div>
                  <p className="text-sm font-bold text-theme-heading">Theme</p>
                  <p className="text-xs text-theme-muted">Currently using {theme} mode</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={toggleTheme}>Switch to {theme === 'light' ? 'Dark' : 'Light'}</Button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-theme-border p-3.5 bg-theme-surface">
              <div>
                <p className="text-sm font-bold text-theme-heading">Compact mode</p>
                <p className="text-xs text-theme-muted">Reduce spacing in tables and cards</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => toast('Setting saved')}>Enable</Button>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <SectionHeader title="Security" description="Authentication and access control settings" action={<Shield className="h-5 w-5 text-theme-accent" />} />
          <div className="mt-4 space-y-3">
            {[
              { label: 'Two-Factor Authentication', desc: 'Require 2FA for all admin accounts', enabled: true, icon: Key },
              { label: 'Session Timeout', desc: 'Auto-logout after 30 minutes of inactivity', enabled: true, icon: Shield },
              { label: 'IP Allowlist', desc: 'Restrict admin access to known networks', enabled: false, icon: Globe },
              { label: 'Password Rotation', desc: 'Enforce 90-day password changes', enabled: true, icon: Key },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-xl border border-theme-border p-3.5 bg-theme-surface">
                <div className="flex items-center gap-3">
                  <s.icon className="h-4 w-4 text-theme-muted" />
                  <div>
                    <p className="text-sm font-bold text-theme-heading">{s.label}</p>
                    <p className="text-xs text-theme-muted">{s.desc}</p>
                  </div>
                </div>
                <Badge variant={s.enabled ? 'success' : 'neutral'} dot>{s.enabled ? 'Enabled' : 'Disabled'}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="md">
          <SectionHeader title="Notifications" description="Alert and notification preferences" action={<Bell className="h-5 w-5 text-theme-accent" />} />
          <div className="mt-4 space-y-3">
            {[
              { label: 'Policy Sync Failures', desc: 'Alert when a device fails to apply policy', enabled: true, icon: Bell },
              { label: 'Permission Expiring', desc: 'Warn before temporary permissions expire', enabled: true, icon: Bell },
              { label: 'New Device Registration', desc: 'Notify when a new device connects', enabled: false, icon: Bell },
              { label: 'Email Digest', desc: 'Daily summary of all admin actions', enabled: true, icon: Mail },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-xl border border-theme-border p-3.5 bg-theme-surface">
                <div className="flex items-center gap-3">
                  <s.icon className="h-4 w-4 text-theme-muted" />
                  <div>
                    <p className="text-sm font-bold text-theme-heading">{s.label}</p>
                    <p className="text-xs text-theme-muted">{s.desc}</p>
                  </div>
                </div>
                <Badge variant={s.enabled ? 'success' : 'neutral'} dot>{s.enabled ? 'On' : 'Off'}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="md" className="lg:col-span-2">
          <SectionHeader title="System Information" description="Backend and agent version details" action={<Database className="h-5 w-5 text-theme-accent" />} />
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-theme-border p-3.5 bg-theme-surface">
              <p className="text-xs text-theme-muted">Backend Version</p>
              <p className="mt-1 text-sm font-bold text-theme-heading">API v3.2.1</p>
            </div>
            <div className="rounded-xl border border-theme-border p-3.5 bg-theme-surface">
              <p className="text-xs text-theme-muted">Agent Version</p>
              <p className="mt-1 text-sm font-bold text-theme-heading">v2.4.1</p>
            </div>
            <div className="rounded-xl border border-theme-border p-3.5 bg-theme-surface">
              <p className="text-xs text-theme-muted">Database</p>
              <p className="mt-1 text-sm font-bold text-theme-heading">MongoDB 7.0</p>
            </div>
            <div className="rounded-xl border border-theme-border p-3.5 bg-theme-surface">
              <p className="text-xs text-theme-muted">Last Backup</p>
              <p className="mt-1 text-sm font-bold text-theme-heading">2 hours ago</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
