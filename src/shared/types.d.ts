import type {
  AddTrackPayload,
  DownloadPreview,
  DownloadProgressPayload,
  DownloadTrackResult,
  Playlist,
  PlaylistImportProgressPayload,
  PlaylistImportResult,
  PlaylistTrack,
  Track
} from './app-types';

export {};

declare global {
  interface Window {
    waveon: {
      getVersion: () => Promise<string>;
      windowControls: {
        minimize: () => Promise<{ ok: boolean }>;
        toggleMaximize: () => Promise<{ isMaximized: boolean }>;
        close: () => Promise<{ ok: boolean }>;
      };
      system: {
        pickPlaylistCover: () => Promise<string | null>;
      };
      library: {
        getTracks: () => Promise<Track[]>;
        addTrack: (payload: AddTrackPayload) => Promise<{ id: number }>;
        deleteTrack: (id: number) => Promise<{ ok: boolean }>;
      };
      playlists: {
        list: () => Promise<Playlist[]>;
        importFromUrl: (url: string) => Promise<PlaylistImportResult>;
        onImportProgress: (callback: (payload: PlaylistImportProgressPayload) => void) => () => void;
        create: (payload: { name: string; coverPath?: string | null }) => Promise<{ id: number }>;
        rename: (payload: { id: number; name: string }) => Promise<{ ok: boolean }>;
        delete: (id: number) => Promise<{ ok: boolean }>;
        getTracks: (playlistId: number) => Promise<PlaylistTrack[]>;
        addTracks: (payload: { playlistId: number; trackIds: number[] }) => Promise<{ ok: boolean }>;
        removeTrack: (payload: { playlistId: number; trackId: number }) => Promise<{ ok: boolean }>;
      };
      download: {
        getPreview: (url: string) => Promise<DownloadPreview>;
        start: (payload: string | { url: string; preview?: DownloadPreview }) => Promise<DownloadTrackResult>;
        onProgress: (callback: (payload: DownloadProgressPayload) => void) => () => void;
      };
    };
  }
}
