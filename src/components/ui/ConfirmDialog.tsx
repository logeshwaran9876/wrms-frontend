import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="flex gap-3">
        {variant === 'danger' && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#3d1c16] text-[#e08e79] border border-[#6b3528]">
            <AlertTriangle className="h-5 w-5 text-error-500" />
          </div>
        )}
        <p className="text-sm text-theme-body">{message}</p>
      </div>
    </Modal>
  );
}
