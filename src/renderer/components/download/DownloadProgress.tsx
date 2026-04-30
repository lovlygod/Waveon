import type { DownloadProgressPayload } from '@shared/app-types';
import type { ReactElement } from 'react';

interface DownloadProgressProps {
  progress: DownloadProgressPayload;
}

export function DownloadProgress({ progress }: DownloadProgressProps): ReactElement {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between text-xs text-[#9f9f9f]">
        <span>{progress.text}</span>
        <span>{progress.percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-[#6d5cff] transition-all duration-300" style={{ width: `${progress.percent}%` }} />
      </div>
    </div>
  );
}
