import { useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { PlaylistImportResult } from '@shared/app-types';
import { usePlaylistImportStore } from '@/store/playlist-import.store';

interface UsePlaylistImportOptions {
  onImported?: (result: PlaylistImportResult) => Promise<void> | void;
}

export function usePlaylistImport(options: UsePlaylistImportOptions = {}) {
  const { onImported } = options;
  const {
    isImporting,
    isDialogOpen,
    progress,
    result,
    setIsImporting,
    setDialogOpen,
    setProgress,
    setResult,
    resetImport
  } = usePlaylistImportStore();

  useEffect(() => {
    return window.waveon.playlists.onImportProgress((payload) => {
      setProgress(payload);
    });
  }, [setProgress]);

  const importPlaylistFromUrl = useCallback(async (url: string): Promise<PlaylistImportResult> => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      throw new Error('Вставьте ссылку SoundCloud');
    }

    setIsImporting(true);
    setResult(null);

    try {
      const importResult = await window.waveon.playlists.importFromUrl(trimmedUrl);
      setResult(importResult);
      await onImported?.(importResult);

      const successfulTracks = importResult.totalTracks - importResult.failedTracks;
      if (importResult.failedTracks > 0) {
        toast.success(`Импорт завершен частично: ${successfulTracks} из ${importResult.totalTracks}`);
      } else {
        toast.success(`Импорт завершен: ${importResult.totalTracks} из ${importResult.totalTracks}`);
      }

      return importResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось импортировать плейлист';
      toast.error(message);
      throw error;
    } finally {
      setIsImporting(false);
    }
  }, [onImported, setIsImporting, setResult]);

  return {
    isImporting,
    isDialogOpen,
    progress,
    result,
    setDialogOpen,
    resetImport,
    importPlaylistFromUrl
  };
}
