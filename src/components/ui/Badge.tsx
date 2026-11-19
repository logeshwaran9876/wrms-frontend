import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

const styles: Record<NonNullable<BadgeProps['variant']>, string> = {
  success: 'bg-[#144737] text-[#f3eee3] border border-[rgba(243,238,227,0.12)]',
  warning: 'bg-[#3d3019] text-[#d8b37b] border border-[#6b5229]',
  error: 'bg-[#3d1c16] text-[#e08e79] border border-[#6b3528]',
  info: 'bg-theme-surface-subtle text-theme-body border border-theme-border',
  neutral: 'bg-theme-surface-subtle text-theme-body border border-theme-border',
  primary: 'bg-theme-accent text-theme-accent-text font-semibold shadow-sm',
};

const dotColors: Record<NonNullable<BadgeProps['variant']>, string> = {
  success: 'bg-theme-accent',
  warning: 'bg-[#d8b37b]',
  error: 'bg-[#e08e79]',
  info: 'bg-theme-accent',
  neutral: 'bg-theme-muted',
  primary: 'bg-theme-accent-text',
};

export default function Badge({ variant = 'neutral', children, dot, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
