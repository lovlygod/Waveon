import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('waveon', {
  getVersion: () => ipcRenderer.invoke('app:getVersion') as Promise<string>,
  windowControls: {
    minimize: () => ipcRenderer.invoke('window:minimize') as Promise<{ ok: boolean }>,
    toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize') as Promise<{ isMaximized: boolean }>,
    close: () => ipcRenderer.invoke('window:close') as Promise<{ ok: boolean }>
  },
  system: {
    pickPlaylistCover: () => ipcRenderer.invoke('dialog:pickPlaylistCover') as Promise<string | null>
  },
  library: {
    getTracks: () => ipcRenderer.invoke('library:getTracks') as Promise<unknown[]>,
    addTrack: (payload: {
      title: string;
      artist: string;
      album?: string | null;
      duration?: number;
      coverPath?: string | null;
      filePath: string;
      sourceUrl: string;
    }) => ipcRenderer.invoke('library:addTrack', payload) as Promise<{ id: number }>,
    deleteTrack: (id: number) => ipcRenderer.invoke('library:deleteTrack', id) as Promise<{ ok: boolean }>
  },
  playlists: {
    list: () => ipcRenderer.invoke('playlists:list') as Promise<unknown[]>,
    importFromUrl: (url: string) => ipcRenderer.invoke('playlists:importFromUrl', url) as Promise<unknown>,
    onImportProgress: (callback: (payload: unknown) => void) => {
      const listener = (_event: unknown, payload: unknown) => callback(payload);
      ipcRenderer.on('playlists:importProgress', listener as never);
      return () => ipcRenderer.removeListener('playlists:importProgress', listener as never);
    },
    create: (payload: { name: string; coverPath?: string | null }) =>
      ipcRenderer.invoke('playlists:create', payload) as Promise<{ id: number }>,
    rename: (payload: { id: number; name: string }) =>
      ipcRenderer.invoke('playlists:rename', payload) as Promise<{ ok: boolean }>,
    delete: (id: number) => ipcRenderer.invoke('playlists:delete', id) as Promise<{ ok: boolean }>,
    getTracks: (playlistId: number) => ipcRenderer.invoke('playlists:getTracks', playlistId) as Promise<unknown[]>,
    addTracks: (payload: { playlistId: number; trackIds: number[] }) =>
      ipcRenderer.invoke('playlists:addTracks', payload) as Promise<{ ok: boolean }>,
    removeTrack: (payload: { playlistId: number; trackId: number }) =>
      ipcRenderer.invoke('playlists:removeTrack', payload) as Promise<{ ok: boolean }>
  },
  download: {
    getPreview: (url: string) => ipcRenderer.invoke('download:getPreview', url) as Promise<unknown>,
    start: (payload: string | {
      url: string;
      preview?: {
        title: string;
        artist: string;
        duration: number;
        coverUrl: string;
        sourceUrl: string;
      };
    }) => ipcRenderer.invoke('download:start', payload) as Promise<unknown>,
    onProgress: (callback: (payload: unknown) => void) => {
      const listener = (_event: unknown, payload: unknown) => callback(payload);
      ipcRenderer.on('download:progress', listener as never);
      return () => ipcRenderer.removeListener('download:progress', listener as never);
    }
  }
});
