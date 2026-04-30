import type { PropsWithChildren, ReactElement } from 'react';
import { cn } from '@/lib/cn';

interface ContentShellProps extends PropsWithChildren {
  className?: string;
}

export function ContentShell({ className, children }: ContentShellProps): ReactElement {
  return <div className={cn('space-y-4', className)}>{children}</div>;
}
