import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label?: ReactNode;
}

export function IconButton({ icon, label, className, ...props }: IconButtonProps): ReactElement {
  return (
    <button
      {...props}
      className={cn('flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white', className)}
    >
      {icon}
      {label}
    </button>
  );
}
