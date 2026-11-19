import { useState } from 'react';
import { ShieldCheck, Ban, Globe, AppWindow, Clock, ArrowLeft, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export default function AccessDeniedPage() {
  const { toast } = useToast();
  const [requestOpen, setRequestOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('1 hour');

  const handleSubmit = () => {
    if (!reason.trim()) { toast('Please provide a reason for your request', 'error'); return; }
    toast('Access request submitted. Your administrator will review it shortly.');
    setRequestOpen(false);
    setReason('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="card p-8 text-center animate-scale-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-error-100 dark:bg-error-500/15">
            <Ban className="h-8 w-8 text-error-600" />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Access Denied</h1>

          <div className="mt-4 flex items-center justify-center gap-2">
            <Globe className="h-4 w-4 text-slate-400" />
            <span className="font-mono text-lg font-semibold text-slate-700 dark:text-slate-300">youtube.com</span>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-warning-500 mt-0.5" />
              <p className="text-sm text-slate-600 dark:text-slate-300 text-left">
                Access to this website is restricted by your company's access control policy. This restriction is enforced through DNS filtering on your managed Windows device.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Policy: Development - Standard (v7)
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button icon={<Clock className="h-4 w-4" />} onClick={() => setRequestOpen(true)}>Request Access</Button>
            <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Managed by WRMS · Your organization's Windows Restriction Management System
        </p>
      </div>

      <Modal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Request Access to youtube.com"
        description="Submit a temporary access request. Your administrator will review and respond."
        footer={<><Button variant="secondary" onClick={() => setRequestOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Submit Request</Button></>}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-slate-400" />
              <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">youtube.com</span>
              <Badge variant="error" dot>Blocked</Badge>
            </div>
            <p className="mt-2 text-xs text-slate-400">Device: DEV-LAPTOP-01 · Policy: Development - Standard</p>
          </div>

          <div>
            <label className="label">Reason for Request</label>
            <textarea
              className="input min-h-[100px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Need to watch a work-related training video for compliance preparation."
            />
          </div>

          <div>
            <label className="label">Requested Duration</label>
            <select className="input" value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>2 hours</option>
              <option>4 hours</option>
              <option>8 hours</option>
            </select>
            <p className="mt-1 text-xs text-slate-400">If approved, access will be granted with an explicit expiration time and automatically restored after expiry.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
