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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div
        className={`relative w-full ${sizeMap[size]} rounded-2xl border border-theme-border bg-theme-surface shadow-2xl animate-scale-in overflow-hidden flex flex-col max-h-[90vh]`}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-theme-border px-6 py-5 bg-theme-surface shrink-0">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-theme-heading">{title}</h3>
            {description && <p className="mt-1 text-xs text-theme-muted leading-relaxed">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-theme-muted hover:text-theme-heading hover:bg-theme-surface-subtle transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto px-6 py-5 grow bg-theme-bg/40">{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-theme-border px-6 py-4 bg-theme-surface shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
