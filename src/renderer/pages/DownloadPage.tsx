import { motion } from 'framer-motion';
import type { DownloadPreview as DownloadPreviewData, DownloadProgressPayload } from '@shared/app-types';
import type { FormEvent, ReactElement } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { DownloadPreview } from '@/components/download/DownloadPreview';
import { UrlDownloadForm } from '@/components/download/UrlDownloadForm';

interface DownloadPageProps {
  url: string;
  preview: DownloadPreviewData | null;
  isPreviewLoading: boolean;
  isDownloadLoading: boolean;
  downloadProgress: DownloadProgressPayload | null;
  onChangeUrl: (value: string) => void;
  onSubmit: (event: FormEvent) => Promise<void>;
  onDownload: () => Promise<void>;
  getRevealMotion: (delay?: number, y?: number) => Record<string, unknown>;
}

export function DownloadPage({
  url,
  preview,
  isPreviewLoading,
  isDownloadLoading,
  downloadProgress,
  onChangeUrl,
  onSubmit,
  onDownload,
  getRevealMotion
}: DownloadPageProps): ReactElement {
  return (
    <motion.section className="mx-auto max-w-4xl space-y-4" {...getRevealMotion()}>
      <GlassCard className="rounded-2xl p-5">
        <UrlDownloadForm url={url} isLoading={isPreviewLoading} onChange={onChangeUrl} onSubmit={(event) => void onSubmit(event)} />
        {preview ? <div className="mt-4"><DownloadPreview preview={preview} isDownloading={isDownloadLoading} progress={downloadProgress} onDownload={onDownload} /></div> : null}
      </GlassCard>
    </motion.section>
  );
}
