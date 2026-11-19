export type UserRole = 'super_admin' | 'admin' | 'employee';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'revoked';

export type PolicyApplicationStatus = 'applied' | 'partial' | 'failed' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  employeeCount: number;
  deviceCount: number;
  policyCount: number;
  createdAt: string;
}

export interface Device {
  id: string;
  deviceId: string;
  name: string;
  employeeId?: string;
  employeeName?: string;
  departmentId?: string;
  osVersion: string;
  agentVersion: string;
  policyId?: string;
  policyName?: string;
  lastSync: string;
  status: PolicyApplicationStatus;
  online: boolean;
}

export interface WebsiteRule {
  id: string;
  domain: string;
  category: string;
  action: 'block' | 'allow';
  scope: 'global' | 'department' | 'employee' | 'device';
  scopeTarget?: string;
  schedule?: { enabled: boolean; start: string; end: string };
  createdAt: string;
}

export interface ApplicationRule {
  id: string;
  appName: string;
  executableName?: string;
  publisher: string;
  action: 'allow' | 'block';
  version?: string;
  scope: 'global' | 'employee' | 'device';
  scopeTarget?: string;
  createdAt: string;
}

export interface BrowserRule {
  id: string;
  browser: 'chrome' | 'brave' | 'firefox' | 'edge' | 'opera' | 'all';
  controlType: 'private_browsing' | 'extensions';
  name: string;
  description: string;
  enabled: boolean;
  scope?: 'global' | 'device';
  scopeTarget?: string;
}

export interface DeviceBrowserRuleItem {
  browser: 'chrome' | 'brave' | 'firefox' | 'edge' | 'opera';
  controlType: 'private_browsing' | 'extensions';
  name: string;
  description: string;
  globalEnabled: boolean;
  effectiveEnabled: boolean;
  isOverride: boolean;
  overrideRuleId?: string | null;
}

export interface DeviceBrowserRuleSummary {
  deviceId: string;
  deviceName: string;
  hasOverrides: boolean;
  overrideCount: number;
  rules: DeviceBrowserRuleItem[];
}

export interface UsbRule {
  id: string;
  name: string;
  action: 'allow' | 'block' | 'read_only';
  scope: 'global' | 'employee' | 'device';
  scopeTarget?: string;
  exception?: boolean;
  expiresAt?: string;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  version: number;
  createdBy: string;
  updatedAt: string;
  active: boolean;
  assignments: {
    departments: string[];
    employees: string[];
    devices: string[];
  };
  rules: {
    website: number;
    application: number;
    browser: number;
    usb: number;
  };
  timeRestrictions?: { enabled: boolean; days: string[]; start: string; end: string };
}

export interface AuditLog {
  id: string;
  displayId?: string;
  action: string;
  category: 'auth' | 'policy' | 'website' | 'application' | 'permission' | 'device';
  actor: string;
  target: string;
  timestamp: string;
  details: string;
}

export interface PaginatedAuditLogs {
  logs: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  totalEmployees: number;
  totalDepartments: number;
  activePolicies: number;
  pendingRequests: number;
  blockedWebsites?: number;
  blockedApps?: number;
  usbStatus?: 'block' | 'read_only' | 'allow';
  hardenedBrowsers?: number;
  activePolicyName?: string;
  activePolicyVersion?: number | string;
  enforcementLayers?: number;
}
