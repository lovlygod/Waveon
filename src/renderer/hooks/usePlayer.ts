import { useCallback } from 'react';
import type { PlaylistTrack, QueueTrack, Track } from '@shared/app-types';
import { usePlayerStore } from '@/store/player.store';

interface UsePlayerOptions {
  tracks: Track[];
  playlistTracks: PlaylistTrack[];
}

function mapLibraryQueueTrack(track: Track): QueueTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    file_path: track.file_path,
    cover_path: track.cover_path ?? null,
    source: 'library',
    playlistId: null,
    playlistPosition: null
  };
}

function mapPlaylistQueueTrack(track: PlaylistTrack): QueueTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    file_path: track.file_path,
    cover_path: track.cover_path ?? null,
    source: 'playlist',
    playlistId: track.playlist_id,
    playlistPosition: track.position
  };
}

export function usePlayer({ tracks, playlistTracks }: UsePlayerOptions) {
  const { currentTrack, isPlaying, setIsPlaying, setQueue, playTrack, playNext, playPrev } = usePlayerStore();

  const playLibraryTrack = useCallback((track: Track, sourceTracks: Track[] = tracks) => {
    setQueue(sourceTracks.map(mapLibraryQueueTrack));
    playTrack(mapLibraryQueueTrack(track));
  }, [playTrack, setQueue, tracks]);

  const playPlaylistTrack = useCallback((track: PlaylistTrack, sourceTracks: PlaylistTrack[] = playlistTracks) => {
    setQueue(sourceTracks.map(mapPlaylistQueueTrack));
    playTrack(mapPlaylistQueueTrack(track));
  }, [playTrack, playlistTracks, setQueue]);

  const toggleLibraryTrack = useCallback((track: Track) => {
    const isCurrent = currentTrack?.id === track.id && currentTrack?.source !== 'playlist';
    if (isCurrent) {
      setIsPlaying(!isPlaying);
      return;
    }

    playLibraryTrack(track);
  }, [currentTrack?.id, currentTrack?.source, isPlaying, playLibraryTrack, setIsPlaying]);

  const togglePlaylistTrack = useCallback((track: PlaylistTrack) => {
    const isCurrent = currentTrack?.id === track.id && currentTrack?.playlistId === track.playlist_id;
    if (isCurrent) {
      setIsPlaying(!isPlaying);
      return;
    }

    playPlaylistTrack(track);
  }, [currentTrack?.id, currentTrack?.playlistId, isPlaying, playPlaylistTrack, setIsPlaying]);

  return {
    currentTrack,
    isPlaying,
    setIsPlaying,
    playNext,
    playPrev,
    playLibraryTrack,
    playPlaylistTrack,
    toggleLibraryTrack,
    togglePlaylistTrack
  };
}
