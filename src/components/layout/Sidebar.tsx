import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Monitor,
  Globe,
  AppWindow,
  Chrome,
  Usb,
  FileText,
  BarChart3,
  ScrollText,
  Settings,
  Shield,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
  ShieldCheck,
  Radio,
  Layers,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const dashboardItem: NavItem = {
  to: '/',
  label: 'Dashboard',
  icon: LayoutDashboard,
};

const fleetItems: NavItem[] = [
  { to: '/devices', label: 'Workstations', icon: Monitor, badge: 'Live' },
  { to: '/employees', label: 'Employees', icon: Users },
];

const restrictionItems: NavItem[] = [
  { to: '/ports', label: 'Port Management', icon: Radio },
  { to: '/software', label: 'Software Inventory', icon: Layers },
  { to: '/website-control', label: 'Website Filtering', icon: Globe },
  { to: '/application-control', label: 'Application Control', icon: AppWindow },
  { to: '/usb-control', label: 'USB Storage Control', icon: Usb },
  { to: '/browser-control', label: '5-Browser Hardening', icon: Chrome },
];

const governanceItems: NavItem[] = [
  { to: '/policies', label: 'Policy Management', icon: FileText },
  { to: '/audit-logs', label: 'Audit Trail', icon: ScrollText },
  { to: '/reports', label: 'Compliance Reports', icon: BarChart3 },
];

// Recreating the exact Thor triangular 3-dots icon (.::) from the screenshot
function ThorDotsIcon() {
  return (
    <div className="flex flex-col items-center justify-center gap-[3px]">
      <span className="h-1 w-1 rounded-full bg-current" />
      <div className="flex gap-[3px]">
        <span className="h-1 w-1 rounded-full bg-current" />
        <span className="h-1 w-1 rounded-full bg-current" />
      </div>
    </div>
  );
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  // On mobile screens, when open is true, force expanded view so user can navigate comfortably
  const isEffectiveCollapsed = collapsed && !open;

  const renderCollapsedItem = (item: NavItem, isInsideCapsule = false) => (
    <li key={item.to} className="relative group flex justify-center">
      <NavLink
        to={item.to}
        end={item.to === '/'}
        onClick={onClose}
        className={({ isActive }) =>
          `flex ${
            isInsideCapsule ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl'
          } items-center justify-center transition-all duration-200 relative ${
            isActive
              ? 'bg-theme-accent text-theme-accent-text font-bold shadow-md shadow-theme-accent/20'
              : 'text-theme-body hover:text-theme-heading hover:bg-theme-surface/70'
          }`
        }
      >
        {({ isActive }) => (
          <item.icon
            className={`${isInsideCapsule ? 'h-4 w-4' : 'h-5 w-5'} ${
              isActive ? 'text-theme-accent-text' : 'text-theme-body'
            }`}
          />
        )}
      </NavLink>

      {/* Right Floating Tooltip matching Thor Collapsed Look */}
      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none animate-scale-in">
        <div className="w-2 h-2 bg-theme-surface border-l border-b border-theme-border rotate-45 -mr-1 z-10" />
        <div className="flex items-center gap-2 rounded-xl border border-theme-border bg-theme-surface px-3.5 py-1.5 text-xs font-semibold text-theme-heading shadow-2xl whitespace-nowrap">
          <span>{item.label}</span>
          {item.badge && (
            <span className="rounded-full bg-theme-accent px-1.5 py-0.5 text-[9px] font-bold text-theme-accent-text">
              {item.badge}
            </span>
          )}
        </div>
      </div>
    </li>
  );

  const renderExpandedItem = (item: NavItem) => (
    <li key={item.to}>
      <NavLink
        to={item.to}
        end={item.to === '/'}
        onClick={onClose}
        className={({ isActive }) =>
          `group flex items-center justify-between rounded-2xl px-3 py-2 text-[13px] transition-all duration-200 ${
            isActive
              ? 'bg-theme-accent text-theme-accent-text font-bold shadow-md'
              : 'text-theme-body hover:bg-theme-surface/70 hover:text-theme-heading font-medium'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
                  isActive
                    ? 'border border-theme-accent-text/25 bg-theme-accent-text/10 text-theme-accent-text'
                    : 'text-theme-muted group-hover:text-theme-heading'
                }`}
              >
                <item.icon className="h-4 w-4" />
              </div>
              <span className="truncate tracking-tight">{item.label}</span>
            </div>
            {item.badge && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? 'bg-black/20 text-theme-accent-text'
                    : 'bg-theme-surface text-theme-accent border border-theme-border'
                }`}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    </li>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Main Floating Capsule Sidebar */}
      <aside
        className={`fixed z-40 flex flex-col bg-theme-bg-deep border border-theme-border shadow-2xl transition-all duration-300 ease-in-out select-none
          ${
            /* Mobile drawer */
            open
              ? 'inset-y-0 left-0 w-72 translate-x-0'
              : '-translate-x-full lg:translate-x-0'
          }
          ${
            /* Desktop floating capsule */
            isEffectiveCollapsed
              ? 'lg:top-3 lg:bottom-3 lg:left-3 lg:w-[68px] lg:rounded-[30px]'
              : 'lg:top-3 lg:bottom-3 lg:left-3 lg:w-[260px] lg:rounded-[28px]'
          }
        `}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center transition-all ${
            isEffectiveCollapsed
              ? 'justify-center pt-4 pb-2'
              : 'justify-between px-4 pt-4 pb-3'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-theme-surface border border-theme-border text-theme-accent shadow-sm flex-shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            {!isEffectiveCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-tight text-base text-theme-heading">
                    WRMS
                  </span>
                  <span className="rounded-full bg-theme-surface px-1.5 py-0.5 text-[9px] font-mono text-theme-accent border border-theme-border">
                    v1.0
                  </span>
                </div>
                
              </div>
            )}
          </div>
        </div>

        {/* Navigation Body */}
        <nav
          className={`flex-1 ${
            isEffectiveCollapsed
              ? 'overflow-visible py-1.5 space-y-2 flex flex-col items-center'
              : 'overflow-y-auto px-3 py-2 space-y-3 scrollbar-none'
          }`}
        >
          {/* Top Standalone Dashboard Item */}
          <ul className={isEffectiveCollapsed ? 'w-full' : 'space-y-1'}>
            {isEffectiveCollapsed
              ? renderCollapsedItem(dashboardItem)
              : renderExpandedItem(dashboardItem)}
          </ul>

          {/* Restriction Engines Section - Sunken Card Enclosure like Thor UI */}
          <div className={isEffectiveCollapsed ? 'w-full flex justify-center' : 'my-1'}>
            {!isEffectiveCollapsed && (
              <p className="mb-1.5 px-3.5 text-[10px] font-bold uppercase tracking-wider text-theme-muted">
                Restriction Engines
              </p>
            )}
            <div
              className={
                isEffectiveCollapsed
                  ? 'w-11 rounded-2xl bg-theme-surface/50 border border-theme-border/40 py-1.5 px-1 flex flex-col items-center gap-1.5'
                  : 'rounded-2xl bg-theme-surface/40 border border-theme-border/50 p-1.5 space-y-1'
              }
            >
              <ul className={isEffectiveCollapsed ? 'space-y-1.5' : 'space-y-1'}>
                {restrictionItems.map((item) =>
                  isEffectiveCollapsed
                    ? renderCollapsedItem(item, true)
                    : renderExpandedItem(item)
                )}
              </ul>
            </div>
          </div>

          {/* Fleet Monitoring Section */}
          <div className={isEffectiveCollapsed ? 'w-full' : ''}>
            {!isEffectiveCollapsed && (
              <p className="mb-1.5 px-3.5 text-[10px] font-bold uppercase tracking-wider text-theme-muted">
                Fleet Monitoring
              </p>
            )}
            <ul className={isEffectiveCollapsed ? 'space-y-2' : 'space-y-1'}>
              {fleetItems.map((item) =>
                isEffectiveCollapsed
                  ? renderCollapsedItem(item)
                  : renderExpandedItem(item)
              )}
            </ul>
          </div>

          {/* Governance & Auditing Section */}
          <div className={isEffectiveCollapsed ? 'w-full' : ''}>
            {!isEffectiveCollapsed && (
              <p className="mb-1.5 px-3.5 text-[10px] font-bold uppercase tracking-wider text-theme-muted">
                Governance & Auditing
              </p>
            )}
            <ul className={isEffectiveCollapsed ? 'space-y-2' : 'space-y-1'}>
              {governanceItems.map((item) =>
                isEffectiveCollapsed
                  ? renderCollapsedItem(item)
                  : renderExpandedItem(item)
              )}
            </ul>
          </div>

          {/* Collapse / Expand Toggle Button matching Thor UI [>] and [<] */}
          <div className="pt-1">
            {isEffectiveCollapsed ? (
              <div className="relative group flex justify-center">
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-theme-muted hover:text-theme-heading hover:bg-theme-surface/70 transition-colors"
                  aria-label="Expand Sidebar"
                >
                  <PanelLeftOpen className="h-4 w-4 text-theme-accent" />
                </button>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none animate-scale-in">
                  <div className="w-2 h-2 bg-theme-surface border-l border-b border-theme-border rotate-45 -mr-1 z-10" />
                  <div className="rounded-xl border border-theme-border bg-theme-surface px-3 py-1.5 text-xs font-semibold text-theme-heading shadow-2xl whitespace-nowrap">
                    Expand Sidebar
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-[13px] font-medium text-theme-body hover:bg-theme-surface/70 hover:text-theme-heading transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg text-theme-muted group-hover:text-theme-heading transition-colors flex-shrink-0">
                  <PanelLeftClose className="h-4 w-4 text-theme-accent" />
                </div>
                <span className="truncate tracking-tight">Collapse Sidebar</span>
              </button>
            )}
          </div>
        </nav>

        {/* Bottom Utility Bar / Thor Triangular 3-Dots matching Thor UI */}
        <div className="mt-auto p-3 pt-1">
          {isEffectiveCollapsed ? (
            <div className="relative group flex justify-center">
              <button
                type="button"
                onClick={() => setFlyoutOpen(!flyoutOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-theme-surface/80 border border-theme-border text-theme-muted hover:text-theme-heading shadow-sm transition"
                aria-label="Quick Actions"
              >
                <ThorDotsIcon />
              </button>

              {/* Collapsed Horizontal Popover Pill matching Thor bottom right */}
              <div
                className={`absolute left-full ml-3 bottom-0 ${
                  flyoutOpen ? 'flex' : 'hidden group-hover:flex'
                } items-center gap-2 rounded-2xl bg-theme-surface border border-theme-border p-1.5 shadow-2xl z-50 animate-scale-in`}
              >
                <div className="w-2 h-2 bg-theme-surface border-l border-b border-theme-border rotate-45 -mr-1 z-10" />
                <button
                  type="button"
                  title="Sync: 60s Pulse Active"
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-theme-muted hover:text-theme-heading hover:bg-theme-surface-subtle transition relative"
                >
                  <Activity className="h-4 w-4 text-theme-accent" />
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-theme-accent animate-pulse" />
                </button>
                <button
                  type="button"
                  title="Active Defense: 5 Layers Enforcing"
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-theme-muted hover:text-theme-heading hover:bg-theme-surface-subtle transition"
                >
                  <ShieldCheck className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Central Theme: Controlled via theme.css"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-theme-accent text-theme-accent-text font-bold shadow-md transition"
                >
                  <Palette className="h-4 w-4" />
                </button>
                <NavLink
                  to="/settings"
                  title="System Settings"
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-theme-muted hover:text-theme-heading hover:bg-theme-surface-subtle transition"
                >
                  <Settings className="h-4 w-4" />
                </NavLink>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-around rounded-2xl bg-theme-surface/50 border border-theme-border/60 p-1.5">
              <div className="group relative">
                <button
                  type="button"
                  title="Agent Sync Pulse"
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-theme-muted hover:text-theme-heading hover:bg-theme-surface/80 transition relative"
                >
                  <Activity className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-theme-accent animate-pulse" />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center z-50 pointer-events-none">
                  <div className="rounded-lg border border-theme-border bg-theme-surface px-2 py-1 text-[10px] font-semibold text-theme-heading shadow-xl whitespace-nowrap">
                    Sync: 60s Pulse
                  </div>
                </div>
              </div>

              <div className="group relative">
                <button
                  type="button"
                  title="Active Defense Layers"
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-theme-muted hover:text-theme-heading hover:bg-theme-surface/80 transition"
                >
                  <ShieldCheck className="h-4 w-4" />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center z-50 pointer-events-none">
                  <div className="rounded-lg border border-theme-border bg-theme-surface px-2 py-1 text-[10px] font-semibold text-theme-heading shadow-xl whitespace-nowrap">
                    5 Defense Layers Active
                  </div>
                </div>
              </div>

              <div className="group relative">
                <button
                  type="button"
                  title="Central Theme (theme.css)"
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-theme-accent bg-theme-accent/15 border border-theme-accent/25 transition"
                >
                  <Palette className="h-4 w-4" />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center z-50 pointer-events-none">
                  <div className="rounded-lg border border-theme-border bg-theme-surface px-2 py-1 text-[10px] font-semibold text-theme-heading shadow-xl whitespace-nowrap">
                    Central theme.css
                  </div>
                </div>
              </div>

          
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
