import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { DownloadPreview, DownloadProgressPayload } from '@shared/app-types';

interface UseDownloadOptions {
  onDownloaded?: () => Promise<void> | void;
}

export function useDownload({ onDownloaded }: UseDownloadOptions = {}) {
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<DownloadPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDownloadLoading, setIsDownloadLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgressPayload | null>(null);

  useEffect(() => {
    const unsubscribe = window.waveon.download.onProgress((payload) => {
      setDownloadProgress((prev) => {
        if (
          prev
          && prev.percent === payload.percent
          && prev.stage === payload.stage
          && prev.text === payload.text
        ) {
          return prev;
        }
        return payload;
      });
    });

    return () => unsubscribe();
  }, []);

  async function handleGetPreview(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!url.trim()) {
      toast.error('Введите ссылку SoundCloud');
      return;
    }

    setIsPreviewLoading(true);
    setPreview(null);

    try {
      const data = await window.waveon.download.getPreview(url.trim());
      setPreview(data);
      toast.success('Превью получено');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка получения превью';
      toast.error(message);
    } finally {
      setIsPreviewLoading(false);
    }
  }

  async function handleDownload(): Promise<void> {
    if (!preview) return;

    setIsDownloadLoading(true);
    setDownloadProgress({ percent: 0, stage: 'metadata', text: 'Подготовка...' });

    try {
      await window.waveon.download.start({
        url: preview.sourceUrl,
        preview
      });
      setDownloadProgress({ percent: 100, stage: 'finished', text: 'Готово' });
      toast.success('Трек добавлен в библиотеку');
      await onDownloaded?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка при скачивании';
      toast.error(message);
    } finally {
      setIsDownloadLoading(false);
    }
  }

  return {
    url,
    setUrl,
    preview,
    isPreviewLoading,
    isDownloadLoading,
    downloadProgress,
    handleGetPreview,
    handleDownload
  };
}
