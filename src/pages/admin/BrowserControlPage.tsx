import { useState, useEffect } from 'react';
import {
  Chrome,
  Globe,
  Flame,
  Shield,
  ShieldCheck,
  Lock,
  Puzzle,
  RefreshCw,
  CheckCircle2,
  Ban,
  Search,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { browserRulesApi, devicesApi } from '@/lib/api';
import type { BrowserRule, Device } from '@/types';

type SupportedBrowser = 'chrome' | 'brave' | 'firefox' | 'edge' | 'opera';

interface BrowserMeta {
  id: SupportedBrowser;
  name: string;
  vendor: string;
  regPath: string;
  icon: (className?: string) => React.ReactNode;
}

const BROWSERS: BrowserMeta[] = [
  {
    id: 'chrome',
    name: 'Google Chrome',
    vendor: 'Google LLC',
    regPath: 'HKLM\\SOFTWARE\\Policies\\Google\\Chrome',
    icon: (cls = 'h-5 w-5') => <Chrome className={cls} />,
  },
  {
    id: 'brave',
    name: 'Brave Browser',
    vendor: 'Brave Software Inc.',
    regPath: 'HKLM\\SOFTWARE\\Policies\\BraveSoftware\\Brave',
    icon: (cls = 'h-5 w-5') => <Shield className={cls} />,
  },
  {
    id: 'firefox',
    name: 'Mozilla Firefox',
    vendor: 'Mozilla Corporation',
    regPath: 'HKLM\\SOFTWARE\\Policies\\Mozilla\\Firefox',
    icon: (cls = 'h-5 w-5') => <Flame className={cls} />,
  },
  {
    id: 'edge',
    name: 'Microsoft Edge',
    vendor: 'Microsoft Corporation',
    regPath: 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge',
    icon: (cls = 'h-5 w-5') => <Globe className={cls} />,
  },
  {
    id: 'opera',
    name: 'Opera & Opera GX',
    vendor: 'Opera Software AS',
    regPath: 'HKLM\\SOFTWARE\\Policies\\Opera & Chromium',
    icon: (cls = 'h-5 w-5') => <Globe className={cls} />,
  },
];

export default function BrowserControlPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<BrowserRule[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingKey, setWorkingKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [browserFilter, setBrowserFilter] = useState<'all' | SupportedBrowser>('all');

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [fetchedRules, fetchedDevices] = await Promise.all([
        browserRulesApi.getAll().catch(() => []),
        devicesApi.getAll().catch(() => []),
      ]);
      setRules(Array.isArray(fetchedRules) ? fetchedRules : []);
      setDevices(Array.isArray(fetchedDevices) ? fetchedDevices.filter((d: Device) => d.status !== 'uninstalled') : []);
      if (isManual) toast('5-Browser policies and workstations refreshed');
    } catch {
      toast('Failed to load browser policies', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getRule = (browser: SupportedBrowser, controlType: 'private_browsing' | 'extensions') => {
    return rules.find((r) => r.browser === browser && r.controlType === controlType);
  };

  const isBlocked = (browser: SupportedBrowser, controlType: 'private_browsing' | 'extensions') => {
    const r = getRule(browser, controlType);
    if (!r) return controlType === 'private_browsing';
    return r.enabled !== false;
  };

  const handleToggle = async (
    browser: SupportedBrowser | 'all',
    controlType: 'private_browsing' | 'extensions',
    enabled: boolean
  ) => {
    const key = `${browser}-${controlType}`;
    setWorkingKey(key);
    try {
      const res = await browserRulesApi.toggle({ browser, controlType, enabled });
      if (res && res.rules) {
        setRules(res.rules);
      } else {
        await loadData();
      }
      toast(
        browser === 'all'
          ? `All 5 browsers: ${controlType === 'private_browsing' ? 'Private Browsing' : 'Extensions'} set to ${enabled ? 'BLOCKED' : 'ALLOWED'}`
          : `${browser.toUpperCase()}: ${controlType === 'private_browsing' ? 'Private Browsing' : 'Extensions'} set to ${enabled ? 'BLOCKED' : 'ALLOWED'}`
      );
    } catch (err: any) {
      toast(err.message || 'Failed to update browser policy', 'error');
    } finally {
      setWorkingKey(null);
    }
  };

  // Metrics
  const privateBlockedCount = BROWSERS.filter((b) => isBlocked(b.id, 'private_browsing')).length;
  const extensionsBlockedCount = BROWSERS.filter((b) => isBlocked(b.id, 'extensions')).length;
  const allPrivateBlocked = privateBlockedCount === BROWSERS.length;
  const allExtensionsBlocked = extensionsBlockedCount === BROWSERS.length;

  const filteredBrowsers = BROWSERS.filter((b) => {
    if (browserFilter !== 'all' && b.id !== browserFilter) return false;
    if (searchTerm) {
      return (
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.regPath.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Browser Control Center"
        description="Dedicated Windows policy hardening for Google Chrome, Brave, Firefox, Edge, and Opera."
        icon={<Chrome className="h-5 w-5" />}
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={() => loadData(true)}
            disabled={refreshing}
          >
            Refresh
          </Button>
        }
      />

      {/* 4 Metric / Quick Action Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Card 1: Private Browsing Status */}
        <Card padding="md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Incognito / Private</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-bg-deep border border-theme-border text-theme-accent">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <div>
              <span className="text-2xl font-bold tracking-tight text-theme-heading">{privateBlockedCount} / {BROWSERS.length}</span>
              <span className="block text-[11px] text-theme-muted">Browsers Enforced</span>
            </div>
            <Button
              size="sm"
              variant={allPrivateBlocked ? 'secondary' : 'primary'}
              className="text-xs px-3 py-1 font-semibold"
              disabled={workingKey === 'all-private_browsing'}
              onClick={() => handleToggle('all', 'private_browsing', !allPrivateBlocked)}
            >
              {allPrivateBlocked ? 'Allow All' : 'Block All'}
            </Button>
          </div>
        </Card>

        {/* Card 2: Extension Lockdown Status */}
        <Card padding="md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Extensions Policy</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-bg-deep border border-theme-border text-theme-accent">
              <Puzzle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <div>
              <span className="text-2xl font-bold tracking-tight text-theme-heading">{extensionsBlockedCount} / {BROWSERS.length}</span>
              <span className="block text-[11px] text-theme-muted">Browsers Enforced</span>
            </div>
            <Button
              size="sm"
              variant={allExtensionsBlocked ? 'secondary' : 'primary'}
              className="text-xs px-3 py-1 font-semibold"
              disabled={workingKey === 'all-extensions'}
              onClick={() => handleToggle('all', 'extensions', !allExtensionsBlocked)}
            >
              {allExtensionsBlocked ? 'Allow All' : 'Block All'}
            </Button>
          </div>
        </Card>

        {/* Card 3: Registry Subsystem */}
        <Card padding="md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Registry Engine</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-bg-deep border border-theme-border text-theme-accent">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-theme-heading">HKLM Policy</span>
            <span className="block text-[11px] text-theme-muted">5 Dedicated Hives</span>
          </div>
        </Card>

        {/* Card 4: Agent Heartbeat */}
        <Card padding="md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Agent Enforcement</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-bg-deep border border-theme-border text-theme-accent">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#144737] text-theme-heading border border-[rgba(243,238,227,0.12)]">
              <span className="h-1.5 w-1.5 rounded-full bg-theme-accent inline-block"></span>
              Active
            </span>
            <span className="block text-[11px] text-theme-muted mt-1">{devices.length} Connected Workstations</span>
          </div>
        </Card>
      </div>

      {/* 5-Browser Dedicated Policies Matrix */}
      <Card padding="lg" className="border border-theme-border bg-theme-surface">
        {/* Section Header & Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-theme-border pb-5">
          <div>
            <h3 className="text-lg font-bold text-theme-heading tracking-tight">
              5-Browser Dedicated Policies
            </h3>
            <p className="text-xs text-theme-muted mt-1">
              Granular toggle controls and registry enforcement per browser engine.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted" />
              <input
                type="text"
                placeholder="Search browser..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-9 pr-3 text-xs w-48 rounded-full"
              />
            </div>
            <div className="flex rounded-full bg-theme-bg-deep p-1 border border-theme-border">
              {(['all', 'chrome', 'brave', 'firefox', 'edge', 'opera'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setBrowserFilter(tab)}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold capitalize transition ${
                    browserFilter === tab
                      ? 'bg-theme-accent text-theme-accent-text shadow-sm'
                      : 'text-theme-body hover:text-theme-heading'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5 Browser Cards Grid with Proper Padding & Balanced Gutters */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrowsers.map((b) => {
            const privateRestricted = isBlocked(b.id, 'private_browsing');
            const extensionsRestricted = isBlocked(b.id, 'extensions');
            const isWorkingPrivate = workingKey === `${b.id}-private_browsing`;
            const isWorkingExt = workingKey === `${b.id}-extensions`;

            return (
              <div
                key={b.id}
                className="rounded-2xl border border-theme-border bg-theme-bg-deep/70 p-5 hover:border-theme-accent/50 transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-theme-surface border border-theme-border text-theme-accent shadow-sm">
                        {b.icon('h-5 w-5')}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-theme-heading tracking-tight">{b.name}</h4>
                        <p className="text-xs text-theme-muted mt-0.5">{b.vendor}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-theme-border bg-theme-surface text-theme-accent font-semibold">
                      {b.id}
                    </span>
                  </div>

                  {/* Registry Target Key */}
                  <div className="mt-3.5 rounded-xl bg-theme-surface border border-theme-border px-3.5 py-2 text-[11px] font-mono text-theme-body flex items-center justify-between">
                    <span className="text-theme-muted font-sans text-[10px] uppercase font-bold tracking-wider">Reg Key</span>
                    <span className="truncate max-w-[210px] text-theme-body" title={b.regPath}>{b.regPath}</span>
                  </div>
                </div>

                {/* Two Controls */}
                <div className="space-y-3.5 pt-1">
                  {/* 1. Private Browsing Control */}
                  <div className="p-4 rounded-xl border border-theme-border bg-theme-surface space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-theme-accent" />
                        <span className="text-xs font-bold text-theme-heading">
                          Private Browsing
                        </span>
                      </div>
                      <Badge variant={privateRestricted ? 'error' : 'success'} dot>
                        {privateRestricted ? 'Blocked' : 'Allowed'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-theme-muted leading-relaxed">
                      {b.id === 'chrome' && 'Disables Chrome Incognito window mode'}
                      {b.id === 'brave' && 'Disables Brave Private window and Tor mode'}
                      {b.id === 'firefox' && 'Disables Firefox Private Browsing mode'}
                      {b.id === 'edge' && 'Disables Edge InPrivate window mode'}
                      {b.id === 'opera' && 'Disables Opera Private window mode'}
                    </p>
                    {/* Segmented Pill Toggle - Fixed Equal Padding & Harmonized Colors */}
                    <div className="pt-1">
                      <div className="flex rounded-full bg-theme-bg-deep p-0.5 border border-theme-border">
                        <button
                          type="button"
                          disabled={isWorkingPrivate}
                          onClick={() => handleToggle(b.id, 'private_browsing', true)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            privateRestricted
                              ? 'bg-[#3d1c16] text-[#e08e79] font-bold border border-[#6b3528]'
                              : 'text-theme-muted hover:text-theme-heading'
                          }`}
                        >
                          <Ban className="h-3 w-3" />
                          Block
                        </button>
                        <button
                          type="button"
                          disabled={isWorkingPrivate}
                          onClick={() => handleToggle(b.id, 'private_browsing', false)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            !privateRestricted
                              ? 'bg-theme-accent text-theme-accent-text font-bold shadow-sm'
                              : 'text-theme-muted hover:text-theme-heading'
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Allow
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. Extension Lockdown Control */}
                  <div className="p-4 rounded-xl border border-theme-border bg-theme-surface space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Puzzle className="h-3.5 w-3.5 text-theme-accent" />
                        <span className="text-xs font-bold text-theme-heading">
                          Extension Lockdown
                        </span>
                      </div>
                      <Badge variant={extensionsRestricted ? 'error' : 'success'} dot>
                        {extensionsRestricted ? 'Blocked' : 'Allowed'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-theme-muted leading-relaxed">
                      {b.id === 'firefox'
                        ? 'Blocks about:addons page and extension installs'
                        : 'Sets ExtensionInstallBlocklist to "*"'}
                    </p>
                    {/* Segmented Pill Toggle - Fixed Equal Padding & Harmonized Colors */}
                    <div className="pt-1">
                      <div className="flex rounded-full bg-theme-bg-deep p-0.5 border border-theme-border">
                        <button
                          type="button"
                          disabled={isWorkingExt}
                          onClick={() => handleToggle(b.id, 'extensions', true)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            extensionsRestricted
                              ? 'bg-[#3d1c16] text-[#e08e79] font-bold border border-[#6b3528]'
                              : 'text-theme-muted hover:text-theme-heading'
                          }`}
                        >
                          <Ban className="h-3 w-3" />
                          Block
                        </button>
                        <button
                          type="button"
                          disabled={isWorkingExt}
                          onClick={() => handleToggle(b.id, 'extensions', false)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            !extensionsRestricted
                              ? 'bg-theme-accent text-theme-accent-text font-bold shadow-sm'
                              : 'text-theme-muted hover:text-theme-heading'
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Allow
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
