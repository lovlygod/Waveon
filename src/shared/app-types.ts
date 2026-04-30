export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string | null;
  duration: number;
  cover_path: string | null;
  file_path: string;
  source_url: string;
  created_at: string;
}

export interface AddTrackPayload {
  title: string;
  artist: string;
  album?: string | null;
  duration?: number;
  coverPath?: string | null;
  filePath: string;
  sourceUrl: string;
}

export interface DownloadPreview {
  title: string;
  artist: string;
  duration: number;
  coverUrl: string;
  sourceUrl: string;
}

export interface DownloadTrackResult {
  id: number;
  title: string;
  artist: string;
  duration: number;
  coverPath: string | null;
  filePath: string;
  sourceUrl: string;
}

export interface DownloadProgressPayload {
  percent: number;
  stage: 'metadata' | 'download' | 'converting' | 'finished';
  text: string;
}

export interface Playlist {
  id: number;
  name: string;
  cover_path: string | null;
  source_url: string | null;
  created_at: string;
  track_count: number;
}

export interface PlaylistTrack extends Track {
  playlist_id: number;
  track_id: number;
  position: number;
}

export interface PlaylistImportProgressPayload {
  playlistName: string;
  totalTracks: number;
  processedTracks: number;
  importedTracks: number;
  skippedTracks: number;
  failedTracks: number;
  currentTrack: string | null;
  percent: number;
  stage: 'metadata' | 'creating' | 'downloading' | 'skipped' | 'failed' | 'finished';
}

export interface PlaylistImportResult {
  playlistId: number;
  playlistName: string;
  totalTracks: number;
  importedTracks: number;
  skippedTracks: number;
  failedTracks: number;
  errors: Array<{
    title: string;
    url: string;
    message: string;
  }>;
}

export type AppPage = 'home' | 'download' | 'library' | 'playlists' | 'favorites' | 'settings';

export interface QueueTrack {
  id: number;
  title: string;
  artist: string;
  file_path: string;
  cover_path?: string | null;
  source?: 'library' | 'playlist';
  playlistId?: number | null;
  playlistPosition?: number | null;
}

export type Theme = 'dark' | 'light' | 'pure-black' | 'glass' | 'purple-night';
