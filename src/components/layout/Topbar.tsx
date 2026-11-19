import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Settings as SettingsIcon,
  User as UserIcon,
  Activity,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { currentUser as fallbackUser, notifications } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { timeAgo } from '@/lib/format';

const typeStyles: Record<string, string> = {
  info: 'bg-theme-accent/15 text-theme-accent border border-theme-accent/30',
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  error: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  const activeUser = user || fallbackUser;

  const handleSignOut = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 px-3 sm:px-6 lg:px-8 pt-3 pb-2 bg-theme-bg/85 backdrop-blur-md select-none transition-all">
      {/* Floating Capsule Bar matching Floating Sidebar Aesthetic */}
      <div className="flex h-14 items-center justify-between gap-3 rounded-[22px] bg-theme-bg-deep border border-theme-border px-3.5 sm:px-5 shadow-2xl">
        {/* Left Section: Mobile Menu Trigger + Context Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-theme-surface/70 border border-theme-border text-theme-muted hover:text-theme-heading hover:bg-theme-surface lg:hidden transition"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Context / Breadcrumb Pill */}
          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-theme-surface/60 border border-theme-border/60 px-3 py-1.5 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-theme-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-theme-accent" />
            </span>
            <span className="font-bold tracking-tight text-theme-heading">WRMS</span>
          </div>
        </div>

        {/* Center Section: Modern Pill Search Bar */}
        <div className="relative flex-1 max-w-xs sm:max-w-md mx-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-theme-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search workstations, policies, rules..."
            className="w-full rounded-xl bg-theme-surface/70 border border-theme-border/70 pl-9 pr-14 py-1.5 text-xs text-theme-heading placeholder-theme-muted focus:border-theme-accent focus:bg-theme-surface focus:outline-none transition shadow-inner"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md bg-theme-bg-deep border border-theme-border/80 px-1.5 py-0.5 text-[9px] font-mono text-theme-muted hidden sm:inline-block">
            Ctrl K
          </kbd>
        </div>

        {/* Right Section: Sync Status + Notifications + Profile Pill */}
        <div className="flex items-center gap-2.5">
          {/* Quick Fleet Health Badge */}
       

          {/* Notifications Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-theme-surface/60 border border-theme-border/70 text-theme-muted hover:text-theme-heading hover:bg-theme-surface transition shadow-sm"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-theme-accent text-theme-accent-text text-[9px] font-bold px-1 shadow-sm">
                  {unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2.5 w-80 rounded-2xl bg-theme-surface border border-theme-border shadow-2xl p-1 z-50 animate-scale-in overflow-hidden">
                <div className="flex items-center justify-between border-b border-theme-border/70 px-4 py-2.5 bg-theme-surface-subtle/50 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-theme-heading">Notifications</p>
                    {unread > 0 && (
                      <span className="rounded-full bg-theme-accent/20 text-theme-accent border border-theme-accent/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                        {unread} new
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-theme-muted font-mono">Live Feed</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-theme-border/30 p-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex gap-3 rounded-xl p-2.5 hover:bg-theme-surface-hover/80 transition"
                    >
                      <div
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                          typeStyles[n.type]
                        }`}
                      >
                        {n.type[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-theme-heading leading-tight truncate">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-theme-body leading-tight mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="mt-1 text-[10px] text-theme-muted font-mono">
                          {timeAgo(n.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Pill Trigger */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2.5 rounded-xl bg-theme-surface/60 border border-theme-border/70 p-1 pr-2.5 hover:bg-theme-surface hover:border-theme-border transition cursor-pointer shadow-sm"
              aria-label="User menu"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-accent text-xs font-bold text-theme-accent-text shadow-sm flex-shrink-0">
                {activeUser.name
                  ? activeUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'A'}
              </div>
              <div className="hidden text-left sm:block min-w-0">
                <p className="text-xs font-bold text-theme-heading leading-tight truncate max-w-[110px]">
                  {activeUser.name}
                </p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-theme-muted leading-none mt-0.5">
                  {activeUser.role?.replace('_', ' ') || 'Super Admin'}
                </p>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-theme-muted sm:block flex-shrink-0" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2.5 w-60 rounded-2xl bg-theme-surface border border-theme-border shadow-2xl p-1.5 z-50 animate-scale-in overflow-hidden">
                {/* User Card */}
                <div className="rounded-xl bg-theme-bg-deep/70 p-3 border border-theme-border/60 mb-1">
                  <p className="text-xs font-bold text-theme-heading truncate">
                    {activeUser.name}
                  </p>
                  <p className="text-[11px] text-theme-accent font-mono truncate mt-0.5">
                    {activeUser.email}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-theme-muted">
                      {activeUser.role?.replace('_', ' ') || 'Super Admin'}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-theme-body hover:bg-theme-surface-hover hover:text-theme-heading transition"
                  >
                    <SettingsIcon className="h-3.5 w-3.5 text-theme-muted" />
                    <span>System Settings</span>
                  </Link>

                  <Link
                    to="/employee-portal"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-theme-body hover:bg-theme-surface-hover hover:text-theme-heading transition"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-theme-muted" />
                    <span>Employee Portal</span>
                  </Link>

                  <div className="my-1 border-t border-theme-border/50" />

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-error-500 hover:bg-error-500/10 transition cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
