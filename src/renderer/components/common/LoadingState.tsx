import type { ReactElement } from 'react';
import { GlassCard } from '@/components/common/GlassCard';

interface LoadingStateProps {
  label: string;
  className?: string;
}

export function LoadingState({ label, className }: LoadingStateProps): ReactElement {
  return (
    <GlassCard className={className}>
      <div className="rounded-2xl border border-white/10 p-6 text-center text-[#9f9f9f]">{label}</div>
    </GlassCard>
  );
}
