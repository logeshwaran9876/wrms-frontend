import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated && user) {
    const from = (location.state as any)?.from?.pathname || (user.role === 'employee' ? '/employee-portal' : '/');
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const loggedInUser = await login({ email: email.trim(), password });
      const from = (location.state as any)?.from?.pathname || (loggedInUser.role === 'employee' ? '/employee-portal' : '/');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillSuperAdmin = () => {
    setEmail('admin@company.com');
    setPassword('Admin@12345');
    setError(null);
  };

  const fillEmployee = () => {
    setEmail('logesh@company.local');
    setPassword('Logesh@12345');
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-theme-bg p-4 relative overflow-hidden font-sans text-theme-heading">
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-theme-accent text-theme-accent-text font-bold mb-4 shadow-sm">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-heading">WRMS Console</h1>
          <p className="text-xs text-theme-muted mt-1">
            Windows Restriction Management System · Security Portal
          </p>
        </div>

        {/* Solid Card - Zero Glass */}
        <div className="rounded-2xl border border-theme-border bg-theme-surface p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-theme-heading">Sign In</h2>
            <p className="text-xs text-theme-muted mt-0.5">
              Enter your credentials to manage endpoint policies and workstations.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-error-500/30 bg-error-500/10 p-3 text-xs text-error-500 animate-fade-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-theme-body mb-1.5 uppercase tracking-wider">
                Corporate Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-theme-muted">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  autoComplete="email"
                  required
                  className="input pl-10 pr-3.5 py-2.5"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-theme-body uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-theme-muted">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="input pl-10 pr-10 py-2.5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-theme-muted hover:text-theme-heading transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-theme-muted">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-theme-border bg-theme-bg-deep text-theme-accent focus:ring-0 focus:ring-offset-0"
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 py-2.5 px-4 text-sm font-semibold rounded-xl"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Super Admin</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Fast Fill Presets for Quick Testing */}
          <div className="mt-6 pt-5 border-t border-theme-border">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider block mb-2 text-center">
              Quick 1-Click Credentials
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillSuperAdmin}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-theme-border bg-theme-surface-subtle text-theme-accent hover:border-theme-accent text-xs font-medium transition cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Super Admin</span>
              </button>
              <button
                type="button"
                onClick={fillEmployee}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-theme-border bg-theme-surface-subtle text-theme-muted hover:border-theme-accent text-xs font-medium transition cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Employee</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <p className="text-center text-[11px] text-theme-muted mt-6">
          Protected by Windows Restriction Management System · Central Theme Configured
        </p>
      </div>
    </div>
  );
}
