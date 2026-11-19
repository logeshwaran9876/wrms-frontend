import { useState, useEffect, useCallback } from 'react';
import {
  ScrollText,
  Search,
  Download,
  RefreshCw,
  Eye,
  User,
  Monitor,
  Shield,
  Globe,
  AppWindow,
  KeyRound,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { auditLogsApi } from '@/lib/api';
import { formatDateTime, timeAgo } from '@/lib/format';
import type { AuditLog } from '@/types';

const categoryConfig: Record<
  string,
  { variant: 'info' | 'success' | 'warning' | 'error' | 'neutral' | 'primary'; label: string; icon: any }
> = {
  auth: { variant: 'info', label: 'Authentication', icon: KeyRound },
  policy: { variant: 'primary', label: 'Policy Engine', icon: Shield },
  website: { variant: 'warning', label: 'Website Control', icon: Globe },
  application: { variant: 'error', label: 'Application Control', icon: AppWindow },
  permission: { variant: 'success', label: 'Permissions', icon: CheckCircle2 },
  device: { variant: 'neutral', label: 'Workstation / Agent', icon: Monitor },
};

export default function AuditLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Server-side pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await auditLogsApi.getAll({
          search: debouncedSearch || undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          page,
          limit,
        });

        if (res && res.logs) {
          setLogs(res.logs);
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
        } else if (Array.isArray(res)) {
          // Fallback if array returned
          setLogs(res);
          setTotal((res as any[]).length);
          setTotalPages(1);
        }

        if (isManual) toast('Audit logs refreshed from server');
      } catch (err: any) {
        toast(err.message || 'Failed to load audit logs', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [debouncedSearch, categoryFilter, page, limit, toast]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCsv = () => {
    try {
      const url = auditLogsApi.getExportCsvUrl({
        search: debouncedSearch || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      window.open(url, '_blank');
      toast('Exporting audit logs as CSV...');
    } catch {
      toast('Failed to export CSV', 'error');
    }
  };

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        
        icon={<ScrollText className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExportCsv}>
              Export CSV
            </Button>
          </div>
        }
      />

   

      {/* Search & Category Filter Toolbar */}
      <Card padding="none">
        <div className="p-4 border-b border-theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-theme-surface">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted" />
            <input
              type="text"
              placeholder="Search by action, who, for who, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 pr-3 text-xs rounded-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-theme-muted" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="input h-9 px-3 text-xs rounded-full w-auto"
            >
              <option value="all">All Categories</option>
              <option value="policy">Policy Engine</option>
              <option value="website">Website Control</option>
              <option value="application">Application Control</option>
              <option value="device">Workstation / Device</option>
              <option value="auth">Authentication</option>
              <option value="permission">Permissions</option>
            </select>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="input h-9 px-3 text-xs rounded-full w-auto"
              title="Rows per page"
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-theme-border text-xs font-semibold uppercase tracking-wider text-theme-muted bg-theme-bg-deep">
                <th className="px-4 py-3">Log ID</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Who (Actor)</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">For Who (Target)</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-3 py-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border-subtle text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-theme-muted">
                  
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-theme-muted">
                    No audit records match your search or filter.
                  </td>
                </tr>
              ) : (
                logs.map((l) => {
                  const conf = categoryConfig[l.category] || {
                    variant: 'neutral' as const,
                    label: l.category,
                    icon: Shield,
                  };
                  const Icon = conf.icon;

                  return (
                    <tr
                      key={l.id}
                      className="hover:bg-theme-surface-hover transition cursor-pointer"
                      onClick={() => setSelectedLog(l)}
                    >
                      {/* Log ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-semibold text-theme-heading bg-theme-bg-deep border border-theme-border px-2 py-0.5 rounded text-[11px]">
                          {l.displayId || `#${l.id.slice(-6)}`}
                        </span>
                      </td>

                      {/* When */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-theme-heading">{formatDateTime(l.timestamp)}</p>
                        <p className="text-[11px] text-theme-muted">{timeAgo(l.timestamp)}</p>
                      </td>

                      {/* Who (Actor) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-theme-muted" />
                          <span className="font-semibold text-theme-heading">{l.actor}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-theme-heading">{l.action}</span>
                      </td>

                      {/* For Who (Target) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Monitor className="h-3.5 w-3.5 text-theme-accent" />
                          <span className="text-theme-body font-medium">{l.target}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={conf.variant} dot>
                          <span className="flex items-center gap-1">
                            <Icon className="h-3 w-3" />
                            {conf.label}
                          </span>
                        </Badge>
                      </td>

                      {/* Details */}
                      <td className="px-4 py-3 max-w-xs truncate text-slate-500 dark:text-slate-400" title={l.details}>
                        {l.details || '—'}
                      </td>

                      {/* Inspect Button */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(l);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="View Full Audit Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{startRecord}</span> to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{endRecord}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span> audit records
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 py-1 font-medium text-slate-700 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Audit Log Inspect Modal */}
      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Entry Details"
        description={`Record ${selectedLog?.displayId || selectedLog?.id} · Captured via WRMS System Event Engine`}
        footer={
          <Button variant="secondary" onClick={() => setSelectedLog(null)}>
            Close
          </Button>
        }
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            {/* Top Key Facts */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                  Who (Actor)
                </span>
                <p className="mt-1 font-bold text-sm text-slate-900 dark:text-white">{selectedLog.actor}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                  For Who (Target)
                </span>
                <p className="mt-1 font-bold text-sm text-primary-600 dark:text-primary-400">{selectedLog.target}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                  When (Timestamp)
                </span>
                <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                  {formatDateTime(selectedLog.timestamp)}
                </p>
                <p className="text-slate-400 text-[10px]">{timeAgo(selectedLog.timestamp)}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                  Event Category
                </span>
                <div className="mt-1">
                  <Badge variant={categoryConfig[selectedLog.category]?.variant || 'neutral'}>
                    {categoryConfig[selectedLog.category]?.label || selectedLog.category}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action & Explanation */}
            <div>
              <span className="text-slate-400 block font-semibold text-[11px] uppercase tracking-wider">
                Action Performed
              </span>
              <p className="mt-1 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white text-sm">
                {selectedLog.action}
              </p>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold text-[11px] uppercase tracking-wider">
                Event Description & Details
              </span>
              <p className="mt-1 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900">
                {selectedLog.details || 'No additional parameters logged for this event.'}
              </p>
            </div>

            {/* Raw System Metadata */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Internal Ref: {selectedLog.id}</span>
              <span>Audited</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
