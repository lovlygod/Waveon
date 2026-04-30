import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Playlist, PlaylistTrack } from '@shared/app-types';
import { useLibraryStore } from '@/store/library.store';
import { useUiStore } from '@/store/ui.store';

export function usePlaylists(enabled = true) {
  const confirmBeforeDelete = useUiStore((state) => state.confirmBeforeDelete);
  const { selectedPlaylist, setSelectedPlaylist } = useLibraryStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  const reloadPlaylists = useCallback(async (): Promise<Playlist[]> => {
    setIsLoadingPlaylists(true);
    try {
      const data = await window.waveon.playlists.list();
      setPlaylists(data);

      setSelectedPlaylist((current) => {
        if (!current) return null;
        return data.find((item) => item.id === current.id) ?? null;
      });

      return data;
    } catch {
      toast.error('Не удалось загрузить плейлисты');
      return [];
    } finally {
      setIsLoadingPlaylists(false);
    }
  }, [setSelectedPlaylist]);

  const reloadPlaylistTracks = useCallback(async (playlistId: number): Promise<void> => {
    try {
      const data = await window.waveon.playlists.getTracks(playlistId);
      setPlaylistTracks(data);
    } catch {
      toast.error('Не удалось загрузить треки плейлиста');
    }
  }, []);

  const clearSelectedPlaylist = useCallback((): void => {
    setSelectedPlaylist(null);
    setPlaylistTracks([]);
  }, [setSelectedPlaylist]);

  const createPlaylist = useCallback(async (name: string, coverPath: string): Promise<void> => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Введите название плейлиста');
      return;
    }

    try {
      const result = await window.waveon.playlists.create({
        name: trimmedName,
        coverPath: coverPath.trim() || null
      });
      const updated = await reloadPlaylists();
      setSelectedPlaylist(updated.find((item) => item.id === result.id) ?? null);
      toast.success('Плейлист создан');
    } catch {
      toast.error('Не удалось создать плейлист');
    }
  }, [reloadPlaylists, setSelectedPlaylist]);

  const renamePlaylist = useCallback(async (playlistId: number, name: string): Promise<void> => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Введите название плейлиста');
      return;
    }

    try {
      await window.waveon.playlists.rename({ id: playlistId, name: trimmedName });
      await reloadPlaylists();
      setSelectedPlaylist((prev) => (prev && prev.id === playlistId ? { ...prev, name: trimmedName } : prev));
      toast.success('Плейлист переименован');
    } catch {
      toast.error('Не удалось переименовать плейлист');
    }
  }, [reloadPlaylists, setSelectedPlaylist]);

  const deletePlaylist = useCallback(async (playlist: Playlist): Promise<void> => {
    if (confirmBeforeDelete && !window.confirm(`Удалить плейлист «${playlist.name}»?`)) return;

    try {
      await window.waveon.playlists.delete(playlist.id);
      setSelectedPlaylist(null);
      setPlaylistTracks([]);
      await reloadPlaylists();
      toast.success('Плейлист удален');
    } catch {
      toast.error('Не удалось удалить плейлист');
    }
  }, [confirmBeforeDelete, reloadPlaylists, setSelectedPlaylist]);

  const addTracksToPlaylist = useCallback(async (playlistId: number, trackIds: number[]): Promise<void> => {
    if (trackIds.length === 0) return;

    try {
      await window.waveon.playlists.addTracks({ playlistId, trackIds });
      await reloadPlaylistTracks(playlistId);
      await reloadPlaylists();
      toast.success('Треки добавлены в плейлист');
    } catch {
      toast.error('Не удалось добавить треки');
    }
  }, [reloadPlaylistTracks, reloadPlaylists]);

  const removeTrackFromPlaylist = useCallback(async (playlistId: number, trackId: number): Promise<void> => {
    if (confirmBeforeDelete && !window.confirm('Убрать трек из плейлиста?')) return;

    try {
      await window.waveon.playlists.removeTrack({ playlistId, trackId });
      await reloadPlaylistTracks(playlistId);
      await reloadPlaylists();
      toast.success('Трек убран из плейлиста');
    } catch {
      toast.error('Не удалось убрать трек из плейлиста');
    }
  }, [confirmBeforeDelete, reloadPlaylistTracks, reloadPlaylists]);

  useEffect(() => {
    if (!enabled) return;
    void reloadPlaylists();
  }, [enabled, reloadPlaylists]);

  useEffect(() => {
    if (!selectedPlaylist) {
      setPlaylistTracks([]);
      return;
    }

    void reloadPlaylistTracks(selectedPlaylist.id);
  }, [selectedPlaylist, reloadPlaylistTracks]);

  return {
    playlists,
    playlistTracks,
    isLoadingPlaylists,
    selectedPlaylist,
    setSelectedPlaylist,
    clearSelectedPlaylist,
    reloadPlaylists,
    reloadPlaylistTracks,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addTracksToPlaylist,
    removeTrackFromPlaylist
  };
}
