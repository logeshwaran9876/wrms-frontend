import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
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
      setError('Please enter both corporate email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const loggedInUser = await login({ email: email.trim(), password });
      const from = (location.state as any)?.from?.pathname || (loggedInUser.role === 'employee' ? '/employee-portal' : '/');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-theme-bg p-4 relative overflow-hidden font-sans text-theme-heading select-none">
      {/* Background Ambient Aura */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-theme-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-theme-border bg-theme-surface shadow-xl text-theme-heading mb-4">
            <Shield className="h-7 w-7 text-theme-heading" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-heading">WRMS Console</h1>
          <p className="text-xs text-theme-muted mt-1.5 font-medium tracking-wide">
            Windows Restriction & Endpoint Policy Management
          </p>
        </div>

        {/* Solid Theme Card */}
        <div className="rounded-2xl border border-theme-border bg-theme-surface p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-theme-heading">Sign In</h2>
            <p className="text-xs text-theme-muted mt-1 leading-relaxed">
              Enter your corporate credentials to access endpoint policies and workstations.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-error-500/30 bg-error-500/10 p-3.5 text-xs text-error-500 animate-fade-in">
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
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                  className="input pl-10 pr-3.5 py-2.5 text-sm"
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
                  className="input pl-10 pr-10 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-theme-muted hover:text-theme-heading transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-theme-muted hover:text-theme-body transition">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-theme-border bg-theme-bg-deep text-theme-accent focus:ring-0 focus:ring-offset-0"
                />
                <span>Keep session active</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-3 py-2.5 px-4 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer Guarantee */}
        <p className="text-center text-[11px] text-theme-muted mt-6 tracking-wide">
          Enterprise Policy Enforcement · Encrypted Central Telemetry
        </p>
      </div>
    </div>
  );
}
