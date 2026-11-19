import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div className={`relative w-full ${sizeMap[size]} card animate-scale-in`} style={{ padding: 0 }}>
        <div className="flex items-start justify-between border-b border-theme-border p-5">
          <div>
            <h3 className="text-lg font-semibold text-theme-heading">{title}</h3>
            {description && <p className="mt-1 text-sm text-theme-muted">{description}</p>}
          </div>
          <button onClick={onClose} className="btn-ghost -mt-1 -mr-2 p-1.5">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-theme-border p-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
