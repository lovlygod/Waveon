import type { PropsWithChildren, ReactElement } from 'react';
import { cn } from '@/lib/cn';

interface GlassCardProps extends PropsWithChildren {
  className?: string;
}

export function GlassCard({ className, children }: GlassCardProps): ReactElement {
  return (
    <div className={cn('rounded-3xl border border-white/10 bg-[#181818] shadow-2xl shadow-black/20', className)}>
      {children}
    </div>
  );
}
