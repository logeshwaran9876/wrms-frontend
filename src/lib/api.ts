import type {
  User,
  Department,
  Device,
  DeviceSoftware,
  DailyAppUsageResponse,
  MasterPort,
  WebsiteRule,
  ApplicationRule,
  BrowserRule,
  UsbRule,
  Policy,
  AuditLog,
  PaginatedAuditLogs,
  Notification,
  DashboardStats,
  DashboardComplaints,
  AuthResponse,
  LoginPayload,
} from '@/types';

const envApiUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : '';
const API_BASE = envApiUrl ? `${envApiUrl.replace(/\/+$/, '')}/api` : 'https://wrms-backend-2m6u.onrender.com/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('wrms_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && !url.includes('/api/auth/login')) {
      localStorage.removeItem('wrms_token');
      localStorage.removeItem('wrms_user');
      window.dispatchEvent(new Event('wrms_unauthorized'));
    }
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP error ${res.status}`);
  }

  return res.json();
}

// Authentication API
export const authApi = {
  login: (payload: LoginPayload) =>
    fetchJson<AuthResponse>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => fetchJson<User>(`${API_BASE}/auth/me`),
  logout: () =>
    fetchJson<{ message: string }>(`${API_BASE}/auth/logout`, {
      method: 'POST',
    }),
};

// Users API
export const usersApi = {
  getAll: (params?: { search?: string; role?: string; departmentId?: string; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchJson<User[]>(`${API_BASE}/users${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => fetchJson<User>(`${API_BASE}/users/${id}`),
  getCurrent: () => fetchJson<User>(`${API_BASE}/users/me/current`),
  create: (data: Partial<User>) =>
    fetchJson<User>(`${API_BASE}/users`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<User>) =>
    fetchJson<User>(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchJson<{ message: string; id: string }>(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
    }),
};

// Departments API
export const departmentsApi = {
  getAll: (params?: { search?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchJson<Department[]>(`${API_BASE}/departments${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => fetchJson<Department>(`${API_BASE}/departments/${id}`),
  create: (data: Partial<Department>) =>
    fetchJson<Department>(`${API_BASE}/departments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Department>) =>
    fetchJson<Department>(`${API_BASE}/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchJson<{ message: string; id: string }>(`${API_BASE}/departments/${id}`, {
      method: 'DELETE',
    }),
};

// Devices API
export const devicesApi = {
  getAll: (params?: { search?: string; status?: string; departmentId?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchJson<Device[]>(`${API_BASE}/devices${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => fetchJson<Device>(`${API_BASE}/devices/${id}`),
  create: (data: Partial<Device> & { employeeEmail?: string }) =>
    fetchJson<Device>(`${API_BASE}/devices`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Device>) =>
    fetchJson<Device>(`${API_BASE}/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  sync: (id: string) =>
    fetchJson<{ message: string; device: Device }>(`${API_BASE}/devices/${id}/sync`, {
      method: 'POST',
    }),
  uninstall: (id: string) =>
    fetchJson<{ message: string; device: Device }>(`${API_BASE}/devices/${id}/uninstall`, {
      method: 'POST',
    }),
  getPorts: (id: string) =>
    fetchJson<{
      deviceId: string;
      deviceName: string;
      openPorts: Array<{ port: number; protocol: string; processName?: string; isAllowed: boolean; isBlocked?: boolean }>;
      openPortsCount: number;
      disallowedPortsCount: number;
      blockedPorts?: Array<{ port: number; protocol: string; blockedAt?: string; reason?: string }>;
      masterPorts: MasterPort[];
    }>(`${API_BASE}/devices/${id}/ports`),
  getSoftware: (id: string, filter?: string) =>
    fetchJson<{
      deviceId: string;
      total: number;
      software: DeviceSoftware[];
    }>(`${API_BASE}/devices/${id}/software${filter ? `?filter=${filter}` : ''}`),
  getAppUsage: (id: string, params?: { date?: string; range?: 'today' | '7d' | '30d' }) => {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.range) query.set('range', params.range);
    const qs = query.toString();
    return fetchJson<DailyAppUsageResponse>(`${API_BASE}/devices/${id}/app-usage${qs ? `?${qs}` : ''}`);
  },
  getMasterPorts: () => fetchJson<MasterPort[]>(`${API_BASE}/devices/master-ports`),
  saveMasterPort: (data: Partial<MasterPort>) =>
    fetchJson<MasterPort>(`${API_BASE}/devices/master-ports`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteMasterPort: (port: number) =>
    fetchJson<{ message: string }>(`${API_BASE}/devices/master-ports/${port}`, {
      method: 'DELETE',
    }),
  blockPort: (deviceId: string, port: number, protocol?: string, reason?: string) =>
    fetchJson<{ message: string; device: Device }>(`${API_BASE}/devices/${deviceId}/block-port`, {
      method: 'POST',
      body: JSON.stringify({ port, protocol, reason }),
    }),
  unblockPort: (deviceId: string, port: number) =>
    fetchJson<{ message: string; device: Device }>(`${API_BASE}/devices/${deviceId}/unblock-port`, {
      method: 'POST',
      body: JSON.stringify({ port }),
    }),
  toggleFirewall: (deviceId: string, enabled: boolean) =>
    fetchJson<{ message: string; device: Device; targetFirewallState: string; firewallEnabled: boolean }>(
      `${API_BASE}/devices/${deviceId}/toggle-firewall`,
      {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      }
    ),
  delete: (id: string) =>
    fetchJson<{ message: string; id: string }>(`${API_BASE}/devices/${id}`, {
      method: 'DELETE',
    }),
  getWebsiteRules: (deviceId: string) =>
    fetchJson<{
      deviceId: string;
      deviceName: string;
      employeeName?: string;
      totalRules: number;
      overrideCount: number;
      rules: Array<{
        id: string;
        domain: string;
        category: string;
        action: 'block' | 'allow';
        isOverride: boolean;
        origin: 'global' | 'device';
        globalAction: 'block' | 'allow' | null;
        createdAt: string;
      }>;
    }>(`${API_BASE}/devices/${deviceId}/website-rules`),
  setWebsiteRule: (deviceId: string, data: { domain: string; action: 'block' | 'allow'; category?: string }) =>
    fetchJson<{ message: string; rule: WebsiteRule }>(`${API_BASE}/devices/${deviceId}/website-rules`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteWebsiteRule: (deviceId: string, ruleIdOrDomain: string) =>
    fetchJson<{ message: string; domain: string }>(`${API_BASE}/devices/${deviceId}/website-rules/${encodeURIComponent(ruleIdOrDomain)}`, {
      method: 'DELETE',
    }),
  getApplicationRules: (deviceId: string) =>
    fetchJson<{
      deviceId: string;
      deviceName: string;
      employeeName?: string;
      totalRules: number;
      overrideCount: number;
      rules: Array<{
        id: string;
        appName: string;
        executableName: string;
        action: 'block' | 'allow';
        isOverride: boolean;
        origin: 'global' | 'device';
        globalAction: 'block' | 'allow' | null;
        createdAt: string;
      }>;
    }>(`${API_BASE}/devices/${deviceId}/application-rules`),
  setApplicationRule: (
    deviceId: string,
    data: { appName?: string; executableName: string; action: 'block' | 'allow' }
  ) =>
    fetchJson<{ message: string; rule: ApplicationRule }>(`${API_BASE}/devices/${deviceId}/application-rules`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteApplicationRule: (deviceId: string, ruleIdOrExe: string) =>
    fetchJson<{ message: string; executableName: string }>(
      `${API_BASE}/devices/${deviceId}/application-rules/${encodeURIComponent(ruleIdOrExe)}`,
      {
        method: 'DELETE',
      }
    ),
  getUsbRule: (deviceId: string) =>
    fetchJson<{
      deviceId: string;
      deviceName: string;
      employeeName?: string;
      isOverride: boolean;
      deviceAction: 'block' | 'read_only' | 'allow' | null;
      globalAction: 'block' | 'read_only' | 'allow';
      effectiveAction: 'block' | 'read_only' | 'allow';
      deviceRule: UsbRule | null;
    }>(`${API_BASE}/devices/${deviceId}/usb-rule`),
  setUsbRule: (deviceId: string, data: { action: 'block' | 'read_only' | 'allow' | 'inherit' }) =>
    fetchJson<{ message: string; action: string; isOverride: boolean; rule?: UsbRule }>(
      `${API_BASE}/devices/${deviceId}/usb-rule`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  deleteUsbRule: (deviceId: string) =>
    fetchJson<{ message: string; isOverride: boolean }>(`${API_BASE}/devices/${deviceId}/usb-rule`, {
      method: 'DELETE',
    }),
  getBrowserRule: (deviceId: string) =>
    fetchJson<{
      deviceId: string;
      deviceName: string;
      hasOverrides: boolean;
      overrideCount: number;
      rules: Array<{
        browser: 'chrome' | 'brave' | 'firefox' | 'edge' | 'opera';
        controlType: 'private_browsing' | 'extensions';
        name: string;
        description: string;
        globalEnabled: boolean;
        effectiveEnabled: boolean;
        isOverride: boolean;
        overrideRuleId?: string | null;
      }>;
    }>(`${API_BASE}/devices/${deviceId}/browser-rule`),
  setBrowserRule: (
    deviceId: string,
    data: {
      browser: 'chrome' | 'brave' | 'firefox' | 'edge' | 'opera';
      controlType: 'private_browsing' | 'extensions';
      enabled: boolean;
    }
  ) =>
    fetchJson<{ message: string; rule: BrowserRule }>(`${API_BASE}/devices/${deviceId}/browser-rule`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteBrowserRule: (deviceId: string, params?: { browser?: string; controlType?: string }) => {
    const q = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return fetchJson<{ message: string; deletedCount: number }>(
      `${API_BASE}/devices/${deviceId}/browser-rule${q ? `?${q}` : ''}`,
      {
        method: 'DELETE',
      }
    );
  },
};

// Website Rules API
export const websiteRulesApi = {
  getAll: (params?: { search?: string; action?: string; scope?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchJson<WebsiteRule[]>(`${API_BASE}/website-rules${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => fetchJson<WebsiteRule>(`${API_BASE}/website-rules/${id}`),
  create: (data: Partial<WebsiteRule>) =>
    fetchJson<WebsiteRule>(`${API_BASE}/website-rules`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createBulk: (payload: { domains: string[]; action: string; category?: string; scope?: string }) =>
    fetchJson<{ message: string; rules: WebsiteRule[] }>(`${API_BASE}/website-rules/bulk`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, data: Partial<WebsiteRule>) =>
    fetchJson<WebsiteRule>(`${API_BASE}/website-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchJson<{ message: string; id: string }>(`${API_BASE}/website-rules/${id}`, {
      method: 'DELETE',
    }),
};

// Application Rules API
export const applicationRulesApi = {
  getAll: (params?: { search?: string; action?: string; scope?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchJson<ApplicationRule[]>(`${API_BASE}/application-rules${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => fetchJson<ApplicationRule>(`${API_BASE}/application-rules/${id}`),
  create: (data: Partial<ApplicationRule>) =>
    fetchJson<ApplicationRule>(`${API_BASE}/application-rules`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  blockInstalled: (data: { appName: string; executable?: string; publisher?: string; scope?: string; scopeTarget?: string }) =>
    fetchJson<{ message: string; rule: ApplicationRule }>(`${API_BASE}/application-rules/block-installed`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  unblockInstalled: (data: { executable: string; deviceId?: string }) =>
    fetchJson<{ message: string }>(`${API_BASE}/application-rules/unblock-installed`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<ApplicationRule>) =>
    fetchJson<ApplicationRule>(`${API_BASE}/application-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchJson<{ message: string; id: string }>(`${API_BASE}/application-rules/${id}`, {
      method: 'DELETE',
    }),
};

// Browser Rules API (5 Browsers: Chrome, Brave, Firefox, Edge, Opera)
export const browserRulesApi = {
  getAll: (params?: { browser?: string; controlType?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchJson<BrowserRule[]>(`${API_BASE}/browser-rules${query ? `?${query}` : ''}`);
  },
  toggle: (data: {
    browser: 'chrome' | 'brave' | 'firefox' | 'edge' | 'opera' | 'all';
    controlType: 'private_browsing' | 'extensions';
    enabled: boolean;
  }) =>
    fetchJson<{ message: string; rules: BrowserRule[] }>(`${API_BASE}/browser-rules/toggle`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<BrowserRule>) =>
    fetchJson<BrowserRule>(`${API_BASE}/browser-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// USB Rules API
export const usbRulesApi = {
  getAll: (params?: { search?: string; action?: string; scope?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchJson<UsbRule[]>(`${API_BASE}/usb-rules${query ? `?${query}` : ''}`);
  },
  create: (data: Partial<UsbRule>) =>
    fetchJson<UsbRule>(`${API_BASE}/usb-rules`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<UsbRule>) =>
    fetchJson<UsbRule>(`${API_BASE}/usb-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchJson<{ message: string; id: string }>(`${API_BASE}/usb-rules/${id}`, {
      method: 'DELETE',
    }),
};

// Policies API
export const policiesApi = {
  getAll: (params?: { search?: string; active?: boolean }) => {
    const query = new URLSearchParams(
      params ? { ...params, active: params.active !== undefined ? String(params.active) : '' } : {}
    ).toString();
    return fetchJson<Policy[]>(`${API_BASE}/policies${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => fetchJson<Policy>(`${API_BASE}/policies/${id}`),
  create: (data: Partial<Policy>) =>
    fetchJson<Policy>(`${API_BASE}/policies`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Policy>) =>
    fetchJson<Policy>(`${API_BASE}/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchJson<{ message: string; id: string }>(`${API_BASE}/policies/${id}`, {
      method: 'DELETE',
    }),
  activate: (id: string) =>
    fetchJson<{ message: string; policy: Policy }>(`${API_BASE}/policies/${id}/activate`, {
      method: 'POST',
    }),
};

// Audit Logs API (Server-Side Pagination & Formatting)
export const auditLogsApi = {
  getAll: (params?: { search?: string; category?: string; page?: number; limit?: number }) => {
    const q: Record<string, string> = {};
    if (params?.search) q.search = params.search;
    if (params?.category) q.category = params.category;
    if (params?.page) q.page = String(params.page);
    if (params?.limit) q.limit = String(params.limit);
    const query = new URLSearchParams(q).toString();
    return fetchJson<PaginatedAuditLogs>(`${API_BASE}/audit-logs${query ? `?${query}` : ''}`);
  },
  create: (data: Partial<AuditLog>) =>
    fetchJson<AuditLog>(`${API_BASE}/audit-logs`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  clearAll: () =>
    fetchJson<{ message: string }>(`${API_BASE}/audit-logs`, {
      method: 'DELETE',
    }),
  getExportCsvUrl: (params?: { search?: string; category?: string }) => {
    const q: Record<string, string> = {};
    if (params?.search) q.search = params.search;
    if (params?.category) q.category = params.category;
    const query = new URLSearchParams(q).toString();
    return `${API_BASE}/audit-logs/export/csv${query ? `?${query}` : ''}`;
  },
};

// Notifications API
export const notificationsApi = {
  getAll: () => fetchJson<Notification[]>(`${API_BASE}/notifications`),
  markAsRead: (id: string) =>
    fetchJson<Notification>(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllAsRead: () =>
    fetchJson<{ message: string }>(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
    }),
  delete: (id: string) =>
    fetchJson<{ message: string; id: string }>(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
    }),
};

// Reports & Compliance API (Single unified endpoint)
export const reportsApi = {
  getOverview: () =>
    fetchJson<{
      success: boolean;
      devices: Device[];
      webRules: WebsiteRule[];
      appRules: ApplicationRule[];
      usbRules: UsbRule[];
      browserRules: BrowserRule[];
      trend: Array<{ date: string; blocked: number; allowed: number }>;
      categories: Array<{ category: string; count: number }>;
      compliance: Array<{ department: string; compliance: number; devices: number }>;
      auditLogs: any[];
    }>(`${API_BASE}/reports/overview`),
};

// Dashboard & Analytics API
export const dashboardApi = {
  getOverview: () =>
    fetchJson<{
      success: boolean;
      stats: DashboardStats;
      devices: Device[];
      accessTrend: Array<{ date: string; blocked: number; allowed: number }>;
      categories: Array<{ category: string; count: number }>;
      compliance: Array<{ department: string; compliance: number; devices: number }>;
      complaints?: DashboardComplaints;
    }>(`${API_BASE}/dashboard/overview`),
  getStats: () =>
    fetchJson<DashboardStats>(`${API_BASE}/dashboard/stats`),
  getBlockedEvents: () =>
    fetchJson<Array<{ time: string; device: string; domain: string; employee: string; category?: string }>>(
      `${API_BASE}/dashboard/blocked-events`
    ),
  getRecentActions: () =>
    fetchJson<Array<{ id?: string; displayId?: string; action: string; target: string; actor: string; time: string; details?: string; category?: string }>>(
      `${API_BASE}/dashboard/recent-actions`
    ),
  getAccessTrend: () =>
    fetchJson<Array<{ date: string; blocked: number; allowed: number }>>(
      `${API_BASE}/dashboard/access-trend`
    ),
  getBlockedCategories: () =>
    fetchJson<Array<{ category: string; count: number }>>(
      `${API_BASE}/dashboard/blocked-categories`
    ),
  getCompliance: () =>
    fetchJson<Array<{ department: string; compliance: number; devices: number }>>(
      `${API_BASE}/dashboard/compliance`
    ),
};

// Seed & Database Management
export const seedApi = {
  reseed: () =>
    fetchJson<{ success: boolean; counts: Record<string, number> }>(`${API_BASE}/seed`, {
      method: 'POST',
    }),
  healthCheck: () =>
    fetchJson<{
      status: string;
      uptime: number;
      timestamp: string;
      database: { connected: boolean; name: string; host: string };
    }>(`${API_BASE}/health`),
};
