import type { ReactElement, ReactNode } from 'react';
import { GlassCard } from '@/components/common/GlassCard';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps): ReactElement {
  return (
    <GlassCard className={className}>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <p className="text-sm text-white">{title}</p>
        {description ? <p className="mt-2 text-sm text-[#9f9f9f]">{description}</p> : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </GlassCard>
  );
}
