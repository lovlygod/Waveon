import { app, BrowserWindow, ipcMain, protocol, net, dialog, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import {
  addTracksToPlaylist,
  createPlaylist,
  createTrack,
  deletePlaylist,
  deleteTrack,
  initDatabase,
  listPlaylistTracks,
  listPlaylists,
  listTracks,
  removeTrackFromPlaylist,
  renamePlaylist
} from './db';
import { downloadTrackByPreview, downloadTrackByUrl, getPreviewByUrl, importPlaylistFromUrl } from './downloader';

const isDev = !!process.env.VITE_DEV_SERVER_URL;

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'waveon',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

function normalizeWaveonPath(url: string): string {
  const parsed = new URL(url);
  const queryPath = parsed.searchParams.get('path');
  if (queryPath) {
    return path.normalize(queryPath);
  }

  const rawPath = decodeURIComponent(parsed.pathname || '');
  const windowsPath = rawPath.replace(/^\//, '').replace(/\//g, '\\');
  const unixPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return process.platform === 'win32' ? path.normalize(windowsPath) : path.normalize(unixPath);
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';

  return 'application/octet-stream';
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#121212',
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL as string);
  } else {
    win.loadFile(path.join(__dirname, '../index.html'));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      void shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (/^https?:\/\//i.test(url)) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });
}

function getPrimaryWindow(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;
}

app.whenReady().then(() => {
  protocol.handle('waveon', async (request) => {
    const filePath = normalizeWaveonPath(request.url);
    const stat = await fs.promises.stat(filePath);
    const fileSize = stat.size;
    const contentType = getContentType(filePath);
    const range = request.headers.get('range');

    if (range) {
      const [rawStart, rawEnd] = range.replace(/bytes=/i, '').split('-');
      const start = Number.parseInt(rawStart, 10);
      const end = rawEnd ? Number.parseInt(rawEnd, 10) : fileSize - 1;
      const safeStart = Number.isFinite(start) ? start : 0;
      const safeEnd = Number.isFinite(end) ? end : fileSize - 1;
      const chunkSize = safeEnd - safeStart + 1;
      const stream = fs.createReadStream(filePath, { start: safeStart, end: safeEnd });

      return new Response(Readable.toWeb(stream) as unknown as BodyInit, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(chunkSize),
          'Content-Range': `bytes ${safeStart}-${safeEnd}/${fileSize}`,
          'Accept-Ranges': 'bytes'
        }
      });
    }

    const stream = fs.createReadStream(filePath);
    return new Response(Readable.toWeb(stream) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes'
      }
    });
  });

  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('app:getVersion', () => app.getVersion());

ipcMain.handle('window:minimize', () => {
  const win = getPrimaryWindow();
  win?.minimize();
  return { ok: true };
});

ipcMain.handle('window:toggleMaximize', () => {
  const win = getPrimaryWindow();
  if (!win) return { isMaximized: false };
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
  return { isMaximized: win.isMaximized() };
});

ipcMain.handle('window:close', () => {
  const win = getPrimaryWindow();
  win?.close();
  return { ok: true };
});

ipcMain.handle('dialog:pickPlaylistCover', async () => {
  const window = getPrimaryWindow();
  const result = window
    ? await dialog.showOpenDialog(window, {
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
    })
    : await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('library:getTracks', () => {
  return listTracks();
});

ipcMain.handle('library:addTrack', (_event, payload: {
  title: string;
  artist: string;
  album?: string | null;
  duration?: number;
  coverPath?: string | null;
  filePath: string;
  sourceUrl: string;
}) => {
  const id = createTrack(payload);
  return { id };
});

ipcMain.handle('library:deleteTrack', (_event, id: number) => {
  deleteTrack(id);
  return { ok: true };
});

ipcMain.handle('download:getPreview', (_event, url: string) => {
  return getPreviewByUrl(url);
});

ipcMain.handle('download:start', async (_event, payload: string | {
  url: string;
  preview?: {
    title: string;
    artist: string;
    duration: number;
    coverUrl: string;
    sourceUrl: string;
  };
}) => {
  const win = BrowserWindow.getAllWindows()[0];
  const url = typeof payload === 'string' ? payload : payload.url;
  const preview = typeof payload === 'string' ? await getPreviewByUrl(url) : payload.preview ?? await getPreviewByUrl(url);

  win?.webContents.send('download:progress', {
    percent: 8,
    stage: 'metadata',
    text: preview ? 'Метаданные уже получены, начинаю скачивание...' : 'Получение метаданных...'
  });

  const result = await downloadTrackByPreview(preview, (progress) => {
    win?.webContents.send('download:progress', progress);
  });
  const id = createTrack({
    title: result.title,
    artist: result.artist,
    duration: result.duration,
    coverPath: result.coverPath,
    filePath: result.filePath,
    sourceUrl: result.sourceUrl
  });

  win?.webContents.send('download:progress', { percent: 100, stage: 'finished', text: `${preview.title} готов` });

  return { id, ...result };
});

ipcMain.handle('playlists:list', () => {
  return listPlaylists();
});

ipcMain.handle('playlists:importFromUrl', async (_event, url: string) => {
  const win = BrowserWindow.getAllWindows()[0];
  return importPlaylistFromUrl(url, (progress) => {
    win?.webContents.send('playlists:importProgress', progress);
  });
});

ipcMain.handle('playlists:create', (_event, payload: { name: string; coverPath?: string | null }) => {
  const id = createPlaylist(payload);
  return { id };
});

ipcMain.handle('playlists:rename', (_event, payload: { id: number; name: string }) => {
  renamePlaylist(payload.id, payload.name);
  return { ok: true };
});

ipcMain.handle('playlists:delete', (_event, id: number) => {
  deletePlaylist(id);
  return { ok: true };
});

ipcMain.handle('playlists:getTracks', (_event, playlistId: number) => {
  return listPlaylistTracks(playlistId);
});

ipcMain.handle('playlists:addTracks', (_event, payload: { playlistId: number; trackIds: number[] }) => {
  addTracksToPlaylist(payload.playlistId, payload.trackIds);
  return { ok: true };
});

ipcMain.handle('playlists:removeTrack', (_event, payload: { playlistId: number; trackId: number }) => {
  removeTrackFromPlaylist(payload.playlistId, payload.trackId);
  return { ok: true };
});
