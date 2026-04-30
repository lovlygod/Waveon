import type { DownloadPreview as DownloadPreviewData, DownloadProgressPayload } from '@shared/app-types';
import type { ReactElement } from 'react';
import { formatTime } from '@/lib/formatTime';
import { DownloadProgress } from '@/components/download/DownloadProgress';

interface DownloadPreviewProps {
  preview: DownloadPreviewData;
  isDownloading: boolean;
  progress: DownloadProgressPayload | null;
  onDownload: () => Promise<void> | void;
}

export function DownloadPreview({ preview, isDownloading, progress, onDownload }: DownloadPreviewProps): ReactElement {
  return (
    <div className="rounded-xl border border-white/10 bg-[#121212] p-4">
      <div className="flex items-center gap-4">
        <img src={preview.coverUrl} alt={preview.title} className="h-20 w-20 rounded-lg object-cover" />
        <div className="flex-1">
          <p className="text-white">{preview.title}</p>
          <p className="text-sm text-[#9f9f9f]">{preview.artist}</p>
          <p className="text-xs text-[#9f9f9f]">Длительность: {formatTime(preview.duration)}</p>
        </div>
        <button onClick={() => void onDownload()} disabled={isDownloading} className="rounded-xl bg-[#6d5cff] px-5 py-2 font-medium text-white disabled:opacity-60">
          {isDownloading ? `${progress?.percent ?? 0}%` : 'Скачать'}
        </button>
      </div>
      {isDownloading && progress ? <DownloadProgress progress={progress} /> : null}
    </div>
  );
}
