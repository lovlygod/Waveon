import { fileUrl } from '@/lib/fileUrl';
import { cn } from '@/lib/cn';
import type { ReactElement } from 'react';

interface TrackCoverProps {
  title: string;
  coverPath?: string | null;
  className?: string;
}

export function TrackCover({ title, coverPath, className }: TrackCoverProps): ReactElement {
  if (coverPath) {
    return <img src={fileUrl(coverPath)} alt={title} className={cn('object-cover', className)} />;
  }

  return <div className={cn('bg-white/10', className)} />;
}
