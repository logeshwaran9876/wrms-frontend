import type {
  User,
  Department,
  Device,
  WebsiteRule,
  ApplicationRule,
  BrowserRule,
  UsbRule,
  Policy,
  AuditLog,
  Notification,
} from '@/types';

export const currentUser: User = {
  id: 'u-001',
  name: 'Sarah Mitchell',
  email: 'sarah.mitchell@company.com',
  role: 'super_admin',
  status: 'active',
  lastLogin: '2026-11-17T08:42:00Z',
  createdAt: '2025-03-12T10:00:00Z',
};

export const departments: Department[] = [
  { id: 'd-001', name: 'Human Resources', description: 'Recruitment, payroll, and employee relations', employeeCount: 24, deviceCount: 26, policyCount: 3, createdAt: '2025-03-15' },
  { id: 'd-002', name: 'Finance', description: 'Accounting, budgeting, and financial planning', employeeCount: 18, deviceCount: 19, policyCount: 4, createdAt: '2025-03-15' },
  { id: 'd-003', name: 'Development', description: 'Software engineering and DevOps', employeeCount: 47, deviceCount: 52, policyCount: 2, createdAt: '2025-03-15' },
  { id: 'd-004', name: 'Sales', description: 'Client acquisition and account management', employeeCount: 31, deviceCount: 33, policyCount: 3, createdAt: '2025-03-15' },
  { id: 'd-005', name: 'Marketing', description: 'Brand, content, and digital campaigns', employeeCount: 16, deviceCount: 17, policyCount: 2, createdAt: '2025-03-15' },
  { id: 'd-006', name: 'Administration', description: 'Office operations and executive support', employeeCount: 12, deviceCount: 13, policyCount: 5, createdAt: '2025-03-15' },
];

export const users: User[] = [
  currentUser,
  { id: 'u-002', name: 'James Carter', email: 'james.carter@company.com', role: 'admin', departmentId: 'd-003', status: 'active', lastLogin: '2026-11-17T07:15:00Z', createdAt: '2025-04-02' },
  { id: 'u-003', name: 'Emily Rodriguez', email: 'emily.r@company.com', role: 'admin', departmentId: 'd-001', status: 'active', lastLogin: '2026-11-16T16:30:00Z', createdAt: '2025-04-10' },
  { id: 'u-004', name: 'Michael Chen', email: 'm.chen@company.com', role: 'employee', departmentId: 'd-003', status: 'active', lastLogin: '2026-11-17T09:00:00Z', createdAt: '2025-05-20' },
  { id: 'u-005', name: 'Olivia Park', email: 'olivia.park@company.com', role: 'employee', departmentId: 'd-002', status: 'active', lastLogin: '2026-11-17T08:50:00Z', createdAt: '2025-06-01' },
  { id: 'u-006', name: 'David Kumar', email: 'd.kumar@company.com', role: 'employee', departmentId: 'd-004', status: 'active', lastLogin: '2026-11-17T08:30:00Z', createdAt: '2025-06-15' },
  { id: 'u-007', name: 'Aisha Hassan', email: 'aisha.h@company.com', role: 'employee', departmentId: 'd-001', status: 'active', lastLogin: '2026-11-17T08:45:00Z', createdAt: '2025-07-01' },
  { id: 'u-008', name: 'Thomas Wright', email: 't.wright@company.com', role: 'employee', departmentId: 'd-005', status: 'active', lastLogin: '2026-11-16T17:00:00Z', createdAt: '2025-07-12' },
  { id: 'u-009', name: 'Sophia Lindgren', email: 's.lindgren@company.com', role: 'employee', departmentId: 'd-006', status: 'inactive', createdAt: '2025-08-01' },
  { id: 'u-010', name: 'Daniel Foster', email: 'd.foster@company.com', role: 'employee', departmentId: 'd-003', status: 'active', lastLogin: '2026-11-17T09:10:00Z', createdAt: '2025-08-20' },
  { id: 'u-011', name: 'Priya Sharma', email: 'p.sharma@company.com', role: 'employee', departmentId: 'd-005', status: 'active', lastLogin: '2026-11-17T08:00:00Z', createdAt: '2025-09-05' },
  { id: 'u-012', name: 'Marcus Johnson', email: 'm.johnson@company.com', role: 'employee', departmentId: 'd-004', status: 'active', lastLogin: '2026-11-17T07:50:00Z', createdAt: '2025-09-18' },
];

export const devices: Device[] = [
  { id: 'dev-001', deviceId: 'WIN-FIN-001', name: 'FIN-WORKSTATION-01', employeeId: 'u-005', employeeName: 'Olivia Park', departmentId: 'd-002', osVersion: 'Windows 11 Pro 23H2', agentVersion: '2.4.1', policyId: 'p-001', policyName: 'Finance - Strict', lastSync: '2026-11-17T08:45:00Z', status: 'applied', online: true },
  { id: 'dev-002', deviceId: 'WIN-DEV-001', name: 'DEV-LAPTOP-01', employeeId: 'u-004', employeeName: 'Michael Chen', departmentId: 'd-003', osVersion: 'Windows 11 Pro 23H2', agentVersion: '2.4.1', policyId: 'p-002', policyName: 'Development - Standard', lastSync: '2026-11-17T09:05:00Z', status: 'applied', online: true },
  { id: 'dev-003', deviceId: 'WIN-DEV-002', name: 'DEV-LAPTOP-02', employeeId: 'u-010', employeeName: 'Daniel Foster', departmentId: 'd-003', osVersion: 'Windows 11 Pro 23H2', agentVersion: '2.4.0', policyId: 'p-002', policyName: 'Development - Standard', lastSync: '2026-11-17T09:12:00Z', status: 'applied', online: true },
  { id: 'dev-004', deviceId: 'WIN-HR-001', name: 'HR-DESKTOP-01', employeeId: 'u-007', employeeName: 'Aisha Hassan', departmentId: 'd-001', osVersion: 'Windows 10 Pro 22H2', agentVersion: '2.4.1', policyId: 'p-003', policyName: 'HR - Moderate', lastSync: '2026-11-17T08:50:00Z', status: 'applied', online: true },
  { id: 'dev-005', deviceId: 'WIN-SAL-001', name: 'SAL-LAPTOP-01', employeeId: 'u-006', employeeName: 'David Kumar', departmentId: 'd-004', osVersion: 'Windows 11 Pro 23H2', agentVersion: '2.3.8', policyId: 'p-004', policyName: 'Sales - Standard', lastSync: '2026-11-17T08:35:00Z', status: 'partial', online: true },
  { id: 'dev-006', deviceId: 'WIN-MKT-001', name: 'MKT-DESKTOP-01', employeeId: 'u-008', employeeName: 'Thomas Wright', departmentId: 'd-005', osVersion: 'Windows 11 Pro 23H2', agentVersion: '2.4.1', policyId: 'p-005', policyName: 'Marketing - Moderate', lastSync: '2026-11-16T17:00:00Z', status: 'applied', online: false },
  { id: 'dev-007', deviceId: 'WIN-ADM-001', name: 'ADM-DESKTOP-01', employeeId: 'u-009', employeeName: 'Sophia Lindgren', departmentId: 'd-006', osVersion: 'Windows 11 Pro 23H2', agentVersion: '2.4.1', policyId: 'p-006', policyName: 'Administration - Strict', lastSync: '2026-11-15T18:00:00Z', status: 'failed', online: false },
  { id: 'dev-008', deviceId: 'WIN-MKT-002', name: 'MKT-LAPTOP-02', employeeId: 'u-011', employeeName: 'Priya Sharma', departmentId: 'd-005', osVersion: 'Windows 11 Pro 23H2', agentVersion: '2.4.1', policyId: 'p-005', policyName: 'Marketing - Moderate', lastSync: '2026-11-17T08:10:00Z', status: 'applied', online: true },
  { id: 'dev-009', deviceId: 'WIN-SAL-002', name: 'SAL-LAPTOP-02', employeeId: 'u-012', employeeName: 'Marcus Johnson', departmentId: 'd-004', osVersion: 'Windows 11 Pro 23H2', agentVersion: '2.4.1', policyId: 'p-004', policyName: 'Sales - Standard', lastSync: '2026-11-17T07:55:00Z', status: 'applied', online: true },
  { id: 'dev-010', deviceId: 'WIN-FIN-002', name: 'FIN-WORKSTATION-02', departmentId: 'd-002', osVersion: 'Windows 10 Pro 22H2', agentVersion: '2.4.1', policyId: 'p-001', policyName: 'Finance - Strict', lastSync: '2026-11-17T08:20:00Z', status: 'applied', online: true },
];

export const websiteRules: WebsiteRule[] = [
  { id: 'w-001', domain: 'youtube.com', category: 'Entertainment', action: 'block', scope: 'global', createdAt: '2025-04-01' },
  { id: 'w-002', domain: 'facebook.com', category: 'Social Media', action: 'block', scope: 'global', createdAt: '2025-04-01' },
  { id: 'w-003', domain: 'instagram.com', category: 'Social Media', action: 'block', scope: 'global', createdAt: '2025-04-01' },
  { id: 'w-004', domain: 'tiktok.com', category: 'Entertainment', action: 'block', scope: 'global', createdAt: '2025-04-01' },
  { id: 'w-005', domain: 'twitch.tv', category: 'Gaming', action: 'block', scope: 'global', createdAt: '2025-04-01' },
  { id: 'w-006', domain: 'reddit.com', category: 'Social Media', action: 'block', scope: 'department', scopeTarget: 'Finance', createdAt: '2025-05-10' },
  { id: 'w-007', domain: 'microsoft.com', category: 'Business', action: 'allow', scope: 'global', createdAt: '2025-04-01' },
  { id: 'w-008', domain: 'erp.company.com', category: 'Business', action: 'allow', scope: 'global', createdAt: '2025-04-01' },
  { id: 'w-009', domain: 'github.com', category: 'Development', action: 'allow', scope: 'department', scopeTarget: 'Development', createdAt: '2025-05-15' },
  { id: 'w-010', domain: 'linkedin.com', category: 'Business', action: 'allow', scope: 'department', scopeTarget: 'Sales', createdAt: '2025-06-01', schedule: { enabled: true, start: '09:00', end: '17:00' } },
  { id: 'w-011', domain: 'netflix.com', category: 'Entertainment', action: 'block', scope: 'global', createdAt: '2025-04-01' },
  { id: 'w-012', domain: 'stackoverflow.com', category: 'Development', action: 'allow', scope: 'department', scopeTarget: 'Development', createdAt: '2025-05-15' },
];

export const applicationRules: ApplicationRule[] = [
  { id: 'a-001', appName: 'Microsoft Office 365', executableName: 'office.exe', publisher: 'Microsoft Corporation', action: 'allow', scope: 'global', createdAt: '2025-04-01' },
  { id: 'a-002', appName: 'Visual Studio Code', executableName: 'code.exe', publisher: 'Microsoft Corporation', action: 'allow', scope: 'global', createdAt: '2025-04-15' },
  { id: 'a-003', appName: 'Steam', executableName: 'steam.exe', publisher: 'Valve Corporation', action: 'block', scope: 'global', createdAt: '2025-04-01' },
  { id: 'a-004', appName: 'Epic Games Launcher', executableName: 'epicgameslauncher.exe', publisher: 'Epic Games', action: 'block', scope: 'global', createdAt: '2025-04-01' },
  { id: 'a-005', appName: 'Docker Desktop', executableName: 'docker.exe', publisher: 'Docker Inc.', action: 'allow', scope: 'global', createdAt: '2025-05-01' },
  { id: 'a-006', appName: 'Spotify', executableName: 'spotify.exe', publisher: 'Spotify AB', action: 'block', scope: 'global', createdAt: '2025-05-20' },
  { id: 'a-007', appName: 'Adobe Creative Suite', executableName: 'photoshop.exe', publisher: 'Adobe Inc.', action: 'allow', scope: 'global', createdAt: '2025-06-10' },
  { id: 'a-008', appName: 'Zoom', executableName: 'zoom.exe', publisher: 'Zoom Communications', action: 'allow', scope: 'global', createdAt: '2025-04-01' },
  { id: 'a-009', appName: 'Tor Browser', executableName: 'tor.exe', publisher: 'The Tor Project', action: 'block', scope: 'global', createdAt: '2025-04-01' },
  { id: 'a-010', appName: 'PowerShell ISE', executableName: 'powershell_ise.exe', publisher: 'Microsoft Corporation', action: 'allow', version: '7.4+', scope: 'global', createdAt: '2025-05-15' },
];

export const browserRules: BrowserRule[] = [
  // Google Chrome
  { id: 'b-chrome-private', browser: 'chrome', controlType: 'private_browsing', name: 'Chrome Incognito Mode', description: 'Disable Incognito private browsing in Google Chrome', enabled: true, scope: 'global', scopeTarget: 'all' },
  { id: 'b-chrome-ext', browser: 'chrome', controlType: 'extensions', name: 'Chrome Extension Lockdown', description: 'Block unauthorized extensions in Google Chrome', enabled: false, scope: 'global', scopeTarget: 'all' },

  // Brave Browser
  { id: 'b-brave-private', browser: 'brave', controlType: 'private_browsing', name: 'Brave Private & Tor Window', description: 'Disable Private Windows and Tor windows in Brave', enabled: true, scope: 'global', scopeTarget: 'all' },
  { id: 'b-brave-ext', browser: 'brave', controlType: 'extensions', name: 'Brave Extension Lockdown', description: 'Block unauthorized extensions in Brave', enabled: false, scope: 'global', scopeTarget: 'all' },

  // Mozilla Firefox
  { id: 'b-firefox-private', browser: 'firefox', controlType: 'private_browsing', name: 'Firefox Private Browsing', description: 'Disable Private Browsing windows in Mozilla Firefox', enabled: true, scope: 'global', scopeTarget: 'all' },
  { id: 'b-firefox-ext', browser: 'firefox', controlType: 'extensions', name: 'Firefox Extension Lockdown', description: 'Block unauthorized add-ons in Mozilla Firefox', enabled: false, scope: 'global', scopeTarget: 'all' },

  // Microsoft Edge
  { id: 'b-edge-private', browser: 'edge', controlType: 'private_browsing', name: 'Edge InPrivate Browsing', description: 'Disable InPrivate browsing in Microsoft Edge', enabled: true, scope: 'global', scopeTarget: 'all' },
  { id: 'b-edge-ext', browser: 'edge', controlType: 'extensions', name: 'Edge Extension Lockdown', description: 'Block unauthorized extensions in Microsoft Edge', enabled: false, scope: 'global', scopeTarget: 'all' },

  // Opera / Opera GX
  { id: 'b-opera-private', browser: 'opera', controlType: 'private_browsing', name: 'Opera Private Window', description: 'Disable Private Browsing in Opera & Opera GX', enabled: true, scope: 'global', scopeTarget: 'all' },
  { id: 'b-opera-ext', browser: 'opera', controlType: 'extensions', name: 'Opera Extension Lockdown', description: 'Block unauthorized extensions in Opera', enabled: false, scope: 'global', scopeTarget: 'all' },
];

export const usbRules: UsbRule[] = [
  { id: 'u-001', name: 'Global - Block USB Storage', action: 'block', scope: 'global' },
  { id: 'u-002', name: 'Workstation - Read Only USB', action: 'read_only', scope: 'global' },
  { id: 'u-003', name: 'Authorized Workstation - Allow USB', action: 'allow', scope: 'device', scopeTarget: 'FIN-PC-01' },
  { id: 'u-004', name: 'Temporary Exemption Exception', action: 'allow', scope: 'device', scopeTarget: 'DEV-WS-02', exception: true, expiresAt: '2026-11-20T17:00:00Z' },
];

export const policies: Policy[] = [
  {
    id: 'p-001',
    name: 'Finance - Strict',
    description: 'Strict access controls for Finance department. Blocks social media, entertainment, and restricts USB storage.',
    version: 4,
    createdBy: 'Sarah Mitchell',
    updatedAt: '2026-11-10T14:30:00Z',
    active: true,
    assignments: { departments: ['d-002'], employees: [], devices: ['dev-001', 'dev-010'] },
    rules: { website: 12, application: 8, browser: 6, usb: 2 },
    timeRestrictions: { enabled: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], start: '08:00', end: '18:00' },
  },
  {
    id: 'p-002',
    name: 'Development - Standard',
    description: 'Standard policy for development team. Allows dev tools and repositories, blocks entertainment.',
    version: 7,
    createdBy: 'James Carter',
    updatedAt: '2026-11-15T11:20:00Z',
    active: true,
    assignments: { departments: ['d-003'], employees: [], devices: ['dev-002', 'dev-003'] },
    rules: { website: 9, application: 10, browser: 4, usb: 1 },
  },
  {
    id: 'p-003',
    name: 'HR - Moderate',
    description: 'Moderate restrictions for HR. Blocks social media, allows business platforms.',
    version: 3,
    createdBy: 'Emily Rodriguez',
    updatedAt: '2026-11-08T09:15:00Z',
    active: true,
    assignments: { departments: ['d-001'], employees: [], devices: ['dev-004'] },
    rules: { website: 8, application: 6, browser: 4, usb: 2 },
  },
  {
    id: 'p-004',
    name: 'Sales - Standard',
    description: 'Standard policy for Sales. Allows LinkedIn and CRM, blocks entertainment.',
    version: 5,
    createdBy: 'Sarah Mitchell',
    updatedAt: '2026-11-12T16:00:00Z',
    active: true,
    assignments: { departments: ['d-004'], employees: [], devices: ['dev-005', 'dev-009'] },
    rules: { website: 10, application: 7, browser: 4, usb: 1 },
  },
  {
    id: 'p-005',
    name: 'Marketing - Moderate',
    description: 'Moderate policy allowing creative tools and social media management platforms.',
    version: 2,
    createdBy: 'Sarah Mitchell',
    updatedAt: '2026-11-05T13:45:00Z',
    active: true,
    assignments: { departments: ['d-005'], employees: [], devices: ['dev-006', 'dev-008'] },
    rules: { website: 7, application: 8, browser: 4, usb: 1 },
  },
  {
    id: 'p-006',
    name: 'Administration - Strict',
    description: 'Strict controls for Administration. Maximum restriction level.',
    version: 6,
    createdBy: 'Sarah Mitchell',
    updatedAt: '2026-11-14T10:30:00Z',
    active: true,
    assignments: { departments: ['d-006'], employees: [], devices: ['dev-007'] },
    rules: { website: 14, application: 9, browser: 6, usb: 2 },
    timeRestrictions: { enabled: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], start: '07:00', end: '19:00' },
  },
];

export const auditLogs: AuditLog[] = [
  { id: 'log-001', action: 'Admin Login', category: 'auth', actor: 'Sarah Mitchell', target: 'System', timestamp: '2026-11-17T08:42:00Z', details: 'Successful login from 192.168.1.42' },
  { id: 'log-002', action: 'Policy Updated', category: 'policy', actor: 'James Carter', target: 'Development - Standard (v7)', timestamp: '2026-11-15T11:20:00Z', details: 'Added github.com to allowlist' },
  { id: 'log-003', action: 'Permission Approved', category: 'permission', actor: 'Sarah Mitchell', target: 'Thomas Wright', timestamp: '2026-11-16T14:30:00Z', details: 'Approved Adobe Creative Suite for 4 hours' },
  { id: 'log-004', action: 'Permission Rejected', category: 'permission', actor: 'Emily Rodriguez', target: 'Aisha Hassan', timestamp: '2026-11-16T11:15:00Z', details: 'Rejected facebook.com access request' },
  { id: 'log-005', action: 'Website Rule Added', category: 'website', actor: 'Sarah Mitchell', target: 'tiktok.com', timestamp: '2026-11-14T09:00:00Z', details: 'Added global block rule' },
  { id: 'log-006', action: 'Policy Created', category: 'policy', actor: 'Sarah Mitchell', target: 'Administration - Strict', timestamp: '2026-11-14T10:30:00Z', details: 'Created new strict policy for Administration' },
  { id: 'log-007', action: 'Application Rule Added', category: 'application', actor: 'James Carter', target: 'PowerShell ISE', timestamp: '2026-11-13T15:45:00Z', details: 'Added allow rule for Development' },
  { id: 'log-008', action: 'Device Policy Applied', category: 'device', actor: 'Agent WIN-DEV-001', target: 'DEV-LAPTOP-01', timestamp: '2026-11-17T09:05:00Z', details: 'Policy v7 applied successfully' },
  { id: 'log-009', action: 'Device Policy Failed', category: 'device', actor: 'Agent WIN-ADM-001', target: 'ADM-DESKTOP-01', timestamp: '2026-11-15T18:00:00Z', details: 'Failed: agent could not reach AppLocker service' },
  { id: 'log-010', action: 'Admin Login', category: 'auth', actor: 'Emily Rodriguez', target: 'System', timestamp: '2026-11-16T16:30:00Z', details: 'Successful login from 192.168.1.55' },
];

export const notifications: Notification[] = [
  { id: 'n-001', title: 'New Access Request', message: 'Olivia Park requested access to youtube.com', type: 'info', timestamp: '2026-11-17T08:50:00Z', read: false },
  { id: 'n-002', title: 'Policy Sync Failed', message: 'ADM-DESKTOP-01 failed to apply policy v6', type: 'error', timestamp: '2026-11-15T18:00:00Z', read: false },
  { id: 'n-003', title: 'Permission Expiring', message: 'Thomas Wright\'s Adobe Creative Suite access expires in 2 hours', type: 'warning', timestamp: '2026-11-17T16:00:00Z', read: false },
  { id: 'n-004', title: 'New Device Registered', message: 'MKT-LAPTOP-02 registered and synced successfully', type: 'success', timestamp: '2026-11-17T08:10:00Z', read: true },
];

export const blockedAccessEvents = [
  { time: '2026-11-17T09:12:00Z', device: 'WIN-FIN-001', domain: 'facebook.com', employee: 'Olivia Park' },
  { time: '2026-11-17T09:08:00Z', device: 'WIN-HR-001', domain: 'instagram.com', employee: 'Aisha Hassan' },
  { time: '2026-11-17T08:55:00Z', device: 'WIN-SAL-001', domain: 'tiktok.com', employee: 'David Kumar' },
  { time: '2026-11-17T08:40:00Z', device: 'WIN-FIN-001', domain: 'youtube.com', employee: 'Olivia Park' },
  { time: '2026-11-17T08:30:00Z', device: 'WIN-ADM-001', domain: 'netflix.com', employee: 'Sophia Lindgren' },
  { time: '2026-11-17T08:15:00Z', device: 'WIN-MKT-002', domain: 'twitch.tv', employee: 'Priya Sharma' },
];

export const recentAdminActions = [
  { action: 'Updated policy', target: 'Development - Standard', actor: 'James Carter', time: '2026-11-15T11:20:00Z' },
  { action: 'Approved request', target: 'Thomas Wright - Adobe Creative Suite', actor: 'Sarah Mitchell', time: '2026-11-16T14:30:00Z' },
  { action: 'Created policy', target: 'Administration - Strict', actor: 'Sarah Mitchell', time: '2026-11-14T10:30:00Z' },
  { action: 'Added website rule', target: 'tiktok.com - Global Block', actor: 'Sarah Mitchell', time: '2026-11-14T09:00:00Z' },
];

export const websiteAccessTrend = [
  { date: 'Mon', allowed: 120, blocked: 12 },
  { date: 'Tue', allowed: 145, blocked: 18 },
  { date: 'Wed', allowed: 160, blocked: 14 },
  { date: 'Thu', allowed: 138, blocked: 22 },
  { date: 'Fri', allowed: 175, blocked: 19 },
  { date: 'Sat', allowed: 65, blocked: 6 },
  { date: 'Sun', allowed: 80, blocked: 8 },
];

export const blockedCategories = [
  { category: 'Restricted Websites', count: 4 },
  { category: 'Blocked Applications', count: 2 },
  { category: 'USB Mass Storage', count: 1 },
  { category: 'Browser Hardening', count: 5 },
];

export const policyComplianceData = [
  { department: 'Fleet Agent Sync', compliance: 100, devices: 1 },
  { department: 'Firewall Protection', compliance: 100, devices: 1 },
  { department: 'Port Whitelist Adherence', compliance: 8, devices: 1 },
  { department: 'USB Storage Lockdown', compliance: 100, devices: 1 },
];
