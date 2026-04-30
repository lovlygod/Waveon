import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Track } from '@shared/app-types';
import { useUiStore } from '@/store/ui.store';

export function useTracks(enabled = true) {
  const confirmBeforeDelete = useUiStore((state) => state.confirmBeforeDelete);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  const reloadTracks = useCallback(async (): Promise<void> => {
    setIsLoadingTracks(true);
    try {
      const data = await window.waveon.library.getTracks();
      setTracks(data);
    } catch {
      toast.error('Не удалось загрузить библиотеку');
    } finally {
      setIsLoadingTracks(false);
    }
  }, []);

  const deleteTrack = useCallback(
    async (id: number): Promise<void> => {
      if (confirmBeforeDelete && !window.confirm('Удалить трек из библиотеки?')) return;

      try {
        await window.waveon.library.deleteTrack(id);
        setTracks((prev) => prev.filter((track) => track.id !== id));
        toast.success('Трек удален');
      } catch {
        toast.error('Не удалось удалить трек');
      }
    },
    [confirmBeforeDelete]
  );

  useEffect(() => {
    if (!enabled) return;
    void reloadTracks();
  }, [enabled, reloadTracks]);

  return {
    tracks,
    setTracks,
    isLoadingTracks,
    reloadTracks,
    deleteTrack
  };
}
