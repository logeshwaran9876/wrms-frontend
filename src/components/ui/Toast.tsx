import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export type ToastOptions =
  | string
  | {
      message?: string;
      description?: string;
      title?: string;
      type?: ToastType;
    };

interface ToastContextValue {
  toast: (content: ToastOptions, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const config: Record<ToastType, { icon: typeof CheckCircle2; color: string }> = {
  success: { icon: CheckCircle2, color: 'text-success-600' },
  error: { icon: XCircle, color: 'text-error-600' },
  info: { icon: Info, color: 'text-primary-600' },
  warning: { icon: AlertCircle, color: 'text-warning-600' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((content: ToastOptions, typeParam: ToastType = 'success') => {
    let messageStr = '';
    let resolvedType: ToastType = typeParam;

    if (typeof content === 'string') {
      messageStr = content;
    } else if (content && typeof content === 'object') {
      messageStr = content.message || content.description || content.title || '';
      if (content.type) {
        resolvedType = content.type;
      }
    }

    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type: resolvedType, message: messageStr }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => {
          const Icon = config[t.type].icon;
          return (
            <div
              key={t.id}
              className="card flex items-center gap-3 p-4 shadow-elevated animate-slide-in"
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${config[t.type].color}`} />
              <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">
                {typeof t.message === 'string' ? t.message : String(t.message || '')}
              </p>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
