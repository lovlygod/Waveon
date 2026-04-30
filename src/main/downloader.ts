import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { app } from 'electron';
import { addTracksToPlaylist, createPlaylist, createTrack, findPlaylistBySourceUrl, findTrackBySourceUrl, updateTrackMetadata } from './db';

const utf8Decoder = new TextDecoder('utf-8');

export interface DownloadPreview {
  title: string;
  artist: string;
  duration: number;
  coverUrl: string;
  sourceUrl: string;
}

export interface DownloadResult {
  title: string;
  artist: string;
  duration: number;
  coverPath: string | null;
  filePath: string;
  sourceUrl: string;
}

export interface DownloadProgress {
  percent: number;
  stage: 'metadata' | 'download' | 'converting' | 'finished';
  text: string;
}

export interface PlaylistImportTrackError {
  title: string;
  url: string;
  message: string;
}

export interface PlaylistImportProgress {
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
  errors: PlaylistImportTrackError[];
}

interface SoundCloudPlaylistEntry {
  id?: string;
  title?: string;
  uploader?: string;
  duration?: number;
  thumbnail?: string;
  thumbnails?: Array<{ url?: string; width?: number }>;
  permalink_url?: string;
  url?: string;
  webpage_url?: string;
  original_url?: string;
}

export interface SoundCloudPlaylistMetadata {
  title: string;
  coverUrl: string | null;
  sourceUrl: string;
  entries: Array<{
    title: string;
    artist: string;
    duration: number;
    coverUrl: string;
    url: string;
  }>;
}

interface SoundCloudOEmbedResponse {
  title?: string;
  thumbnail_url?: string;
}

const SOUNDCLOUD_REGEX = /^https?:\/\/(www\.)?soundcloud\.com\/[\w-]+\/[\w-/?=&%.]+$/i;
const workspaceRoot = path.resolve(__dirname, '../../');

function getWritableRoot(): string {
  if (app.isPackaged) {
    return app.getPath('userData');
  }
  return workspaceRoot;
}

const writableRoot = getWritableRoot();
const musicDir = path.join(writableRoot, 'data', 'music');
const coversDir = path.join(writableRoot, 'data', 'covers');
const previewCache = new Map<string, DownloadPreview>();

let cachedFfmpegCommand: string | null = null;

function getConfiguredFfmpegDirectory(): string | null {
  const raw = process.env.FFMPEG_PATH || process.env.FFMPEG_BIN || null;
  if (!raw) return null;

  const normalized = raw.replace(/\\/g, '/').toLowerCase();
  if (normalized.endsWith('/ffmpeg.exe') || normalized.endsWith('/ffmpeg')) {
    return path.dirname(raw);
  }

  return raw;
}

function ensureDirs(): void {
  fs.mkdirSync(musicDir, { recursive: true });
  fs.mkdirSync(coversDir, { recursive: true });
}

function sanitizeName(value: string): string {
  const sanitized = value
    .replace(/[<>:"/\\|?*]+/g, '_')
    .replace(/[.#]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);

  return sanitized || 'track';
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function normalizeCoverUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith('//')) return `https:${value}`;
  return value;
}

function normalizeSourceUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = '';
    parsed.search = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return url.trim();
  }
}


function normalizePlaylistEntryUrl(url: string): string {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (/(^|\.)soundcloud\.com$/i.test(parsed.hostname)) {
      parsed.hash = '';
      parsed.search = '';
      return parsed.toString().replace(/\/$/, '');
    }
  } catch {
    // fall through to raw URL
  }

  return trimmed;
}

function createUniqueBaseName(safeBase: string): string {
  return `${safeBase}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isPlaceholderTrack(title: string, artist: string, coverPath?: string | null): boolean {
  return artist === 'Unknown artist' || /^Track \d+$/i.test(title) || !coverPath;
}

async function getPlaylistEntryPreview(entry: SoundCloudPlaylistMetadata['entries'][number]): Promise<DownloadPreview> {
  try {
    return await getPreviewByUrl(entry.url, { skipValidation: true });
  } catch (error) {
    if (isSoundCloudUrl(entry.url)) {
      throw error;
    }
  }

  const fallbackPreview: DownloadPreview = {
    title: entry.title,
    artist: entry.artist,
    duration: entry.duration,
    coverUrl: entry.coverUrl,
    sourceUrl: entry.url
  };

  return fallbackPreview;
}

function getBestThumbnail(data: Record<string, unknown>): string | null {
  if (typeof data.thumbnail === 'string' && data.thumbnail) {
    return data.thumbnail;
  }

  if (Array.isArray(data.thumbnails)) {
    const thumbnails = data.thumbnails
      .filter((item): item is { url: string; width?: number } => {
        return Boolean(item && typeof item === 'object' && typeof (item as { url?: unknown }).url === 'string');
      })
      .sort((a, b) => (b.width ?? 0) - (a.width ?? 0));

    return thumbnails[0]?.url ?? null;
  }

  return null;
}

async function getSoundCloudOEmbedMetadata(url: string): Promise<{ title: string | null; coverUrl: string | null }> {
  try {
    const endpoint = new URL('https://soundcloud.com/oembed');
    endpoint.searchParams.set('format', 'json');
    endpoint.searchParams.set('url', url);

    const response = await fetch(endpoint);
    if (!response.ok) {
      return { title: null, coverUrl: null };
    }

    const data = await response.json() as SoundCloudOEmbedResponse;
    return {
      title: data.title || null,
      coverUrl: data.thumbnail_url || null
    };
  } catch {
    return { title: null, coverUrl: null };
  }
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      await worker(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
}

function runCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const ffmpegDir = getConfiguredFfmpegDirectory();
    const child = spawn(command, args, {
      windowsHide: true,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
        PATH: ffmpegDir ? `${ffmpegDir};${process.env.PATH || ''}` : process.env.PATH
      }
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += utf8Decoder.decode(chunk, { stream: true });
    });

    child.stderr.on('data', (chunk) => {
      stderr += utf8Decoder.decode(chunk, { stream: true });
    });

    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        const error = new Error(stderr || stdout || `Command failed with code ${code}`);
        (error as Error & { commandFailed?: boolean }).commandFailed = true;
        reject(error);
      }
    });
  });
}

function extractProgressPercent(line: string): number | null {
  const match = line.match(/(\d{1,3}(?:\.\d+)?)%/);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, value));
}

async function runYtDlpWithProgress(args: string[], onProgress?: (progress: DownloadProgress) => void): Promise<void> {
  const attempts: Array<{ command: string; args: string[] }> = [
    { command: 'yt-dlp', args },
    { command: 'python', args: ['-m', 'yt_dlp', ...args] },
    { command: 'py', args: ['-m', 'yt_dlp', ...args] }
  ];

  let lastError: unknown;

  for (const attempt of attempts) {
    try {
      await new Promise<void>((resolve, reject) => {
        const ffmpegDir = getConfiguredFfmpegDirectory();
        const child = spawn(attempt.command, attempt.args, {
          windowsHide: true,
          env: {
            ...process.env,
            PYTHONIOENCODING: 'utf-8',
            PYTHONUTF8: '1',
            PATH: ffmpegDir ? `${ffmpegDir};${process.env.PATH || ''}` : process.env.PATH
          }
        });

        let stderr = '';
        let pending = '';

        child.stderr.on('data', (chunk) => {
          const text = utf8Decoder.decode(chunk, { stream: true });
          stderr += text;
          pending += text;

          const lines = pending.split(/\r?\n/);
          pending = lines.pop() ?? '';

          for (const line of lines) {
            const lowered = line.toLowerCase();
            if (lowered.includes('destination')) {
              onProgress?.({ percent: 5, stage: 'download', text: line.trim() });
            }
            if (lowered.includes('ffmpeg') || lowered.includes('post-process')) {
              onProgress?.({ percent: 92, stage: 'converting', text: line.trim() });
            }
            const percent = extractProgressPercent(line);
            if (percent !== null) {
              onProgress?.({ percent, stage: 'download', text: line.trim() });
            }
          }
        });

        child.on('error', reject);
        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            const error = new Error(stderr || `Command failed with code ${code}`);
            (error as Error & { commandFailed?: boolean }).commandFailed = true;
            reject(error);
          }
        });
      });

      return;
    } catch (error) {
      if ((error as Error & { commandFailed?: boolean }).commandFailed) {
        throw error;
      }
      lastError = error;
    }
  }

  throw new Error(
    `yt-dlp не найден. Установите yt-dlp (команда ${'[`pip install -U yt-dlp`](src/main/downloader.ts:67)'}), либо добавьте yt-dlp.exe в PATH.\nТехническая ошибка: ${String(lastError)}`
  );
}

async function runYtDlp(args: string[]): Promise<string> {
  const attempts: Array<{ command: string; args: string[] }> = [
    { command: 'yt-dlp', args },
    { command: 'python', args: ['-m', 'yt_dlp', ...args] },
    { command: 'py', args: ['-m', 'yt_dlp', ...args] }
  ];

  let lastError: unknown;

  for (const attempt of attempts) {
    try {
      return await runCommand(attempt.command, attempt.args);
    } catch (error) {
      if ((error as Error & { commandFailed?: boolean }).commandFailed) {
        throw error;
      }
      lastError = error;
    }
  }

  throw new Error(
    `yt-dlp не найден. Установите yt-dlp (команда ${'[`pip install -U yt-dlp`](src/main/downloader.ts:67)'}), либо добавьте yt-dlp.exe в PATH.\nТехническая ошибка: ${String(lastError)}`
  );
}

async function resolveFfmpegCommand(): Promise<string> {
  if (cachedFfmpegCommand) {
    return cachedFfmpegCommand;
  }

  const configuredDir = getConfiguredFfmpegDirectory();
  if (configuredDir) {
    const ffmpegExe = path.join(configuredDir, 'ffmpeg.exe');
    const ffprobeExe = path.join(configuredDir, 'ffprobe.exe');

    if (fs.existsSync(ffmpegExe) && fs.existsSync(ffprobeExe)) {
      cachedFfmpegCommand = configuredDir;
      return configuredDir;
    }
  }

  const candidates = [
    process.env.FFMPEG_PATH,
    process.env.FFMPEG_BIN,
    'C:/Users/muzal/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe',
    'ffmpeg',
    'ffmpeg.exe'
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    try {
      await runCommand(candidate, ['-version']);
      const normalized = candidate.replace(/\\/g, '/');
      const directory = normalized.toLowerCase().endsWith('/ffmpeg.exe') || normalized.toLowerCase().endsWith('/ffmpeg')
        ? path.dirname(candidate)
        : candidate;

      const ffprobeCandidate = path.join(directory, 'ffprobe.exe');
      if (fs.existsSync(ffprobeCandidate)) {
        cachedFfmpegCommand = directory;
        return directory;
      }
    } catch {
      // try next candidate
    }
  }

  throw new Error('ffmpeg не найден. Перезапустите VS Code/терминал после установки FFmpeg или задайте FFMPEG_PATH с полным путем к ffmpeg.exe.');
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Не удалось скачать обложку: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
}

export function isSoundCloudUrl(url: string): boolean {
  return SOUNDCLOUD_REGEX.test(url.trim());
}

export async function getPreviewByUrl(url: string, options: { skipValidation?: boolean } = {}): Promise<DownloadPreview> {
  const normalizedUrl = url.trim();

  if (!options.skipValidation && !isSoundCloudUrl(normalizedUrl)) {
    throw new Error('Невалидный URL. Поддерживаются только ссылки SoundCloud.');
  }

  const cached = previewCache.get(normalizedUrl);
  if (cached) {
    return cached;
  }

  const raw = await runYtDlp([
    '--no-playlist',
    '--skip-download',
    '--no-warnings',
    '--encoding',
    'utf-8',
    '--print',
    '%(title)s\n%(uploader)s\n%(duration)s\n%(thumbnail)s\n%(webpage_url)s',
    normalizedUrl
  ]);

  const [title, artist, durationRaw, coverUrlRaw, sourceUrlRaw] = raw.split(/\r?\n/);

  const preview: DownloadPreview = {
    title: title || 'Unknown title',
    artist: artist || 'Unknown artist',
    duration: Number.parseInt(durationRaw || '0', 10) || 0,
    coverUrl: coverUrlRaw || 'https://placehold.co/300x300/181818/ffffff?text=Waveon',
    sourceUrl: normalizeSourceUrl(sourceUrlRaw || normalizedUrl)
  };

  previewCache.set(normalizedUrl, preview);
  return preview;
}

export async function getSoundCloudPlaylistMetadata(url: string): Promise<SoundCloudPlaylistMetadata> {
  const normalizedUrl = normalizeSourceUrl(url);

  if (!isSoundCloudUrl(normalizedUrl) || !/\/sets\//i.test(normalizedUrl)) {
    throw new Error('Невалидный URL. Вставьте ссылку на плейлист SoundCloud.');
  }

  const raw = await runYtDlp([
    '--skip-download',
    '--no-warnings',
    '--encoding',
    'utf-8',
    '--flat-playlist',
    '--dump-single-json',
    normalizedUrl
  ]);

  const data = JSON.parse(raw) as Record<string, unknown>;
  const rawEntries = Array.isArray(data.entries) ? data.entries as SoundCloudPlaylistEntry[] : [];
  const oEmbed = await getSoundCloudOEmbedMetadata(normalizedUrl);
  const playlistTitle = typeof data.title === 'string' && data.title ? data.title : oEmbed.title || 'SoundCloud playlist';
  const playlistCoverUrl = getBestThumbnail(data) || oEmbed.coverUrl;

  const seenUrls = new Set<string>();
  const entries = rawEntries
    .map((entry, index) => {
      const trackUrl = entry.webpage_url ?? entry.permalink_url ?? entry.original_url ?? entry.url ?? '';
      const normalizedTrackUrl = normalizePlaylistEntryUrl(trackUrl);
      const entryData = entry as unknown as Record<string, unknown>;
      return {
        title: entry.title || `Track ${index + 1}`,
        artist: entry.uploader || 'Unknown artist',
        duration: Number.isFinite(entry.duration) ? Math.round(entry.duration ?? 0) : 0,
        coverUrl: getBestThumbnail(entryData) || playlistCoverUrl || 'https://placehold.co/300x300/181818/ffffff?text=Waveon',
        url: normalizedTrackUrl
      };
    })
    .filter((entry) => {
      if (!isHttpUrl(entry.url) || seenUrls.has(entry.url)) return false;
      seenUrls.add(entry.url);
      return true;
    });

  if (entries.length === 0) {
    throw new Error('В плейлисте не найдено доступных треков.');
  }

  return {
    title: playlistTitle,
    coverUrl: playlistCoverUrl,
    sourceUrl: normalizeSourceUrl(typeof data.webpage_url === 'string' && data.webpage_url ? data.webpage_url : normalizedUrl),
    entries
  };
}

async function getPlaylistMetadataByUrl(url: string): Promise<SoundCloudPlaylistMetadata> {
  const normalizedUrl = normalizeSourceUrl(url);
  if (isSoundCloudUrl(normalizedUrl) && /\/sets\//i.test(normalizedUrl)) {
    return getSoundCloudPlaylistMetadata(normalizedUrl);
  }
  throw new Error('Невалидный URL. Поддерживаются только плейлисты SoundCloud.');
}

async function savePlaylistCover(metadata: SoundCloudPlaylistMetadata): Promise<string | null> {
  if (!metadata.coverUrl) return null;

  try {
    ensureDirs();
    const safeBase = sanitizeName(metadata.title || 'SoundCloud playlist');
    const localCover = path.join(coversDir, `${safeBase}-playlist.jpg`);
    await downloadFile(metadata.coverUrl, localCover);
    return localCover;
  } catch {
    return null;
  }
}

async function saveTrackCover(preview: DownloadPreview): Promise<string | null> {
  if (!preview.coverUrl) return null;

  try {
    ensureDirs();
    const safeBase = sanitizeName(`${preview.artist} - ${preview.title}`);
    const localCover = path.join(coversDir, `${safeBase}-${Date.now()}.jpg`);
    await downloadFile(preview.coverUrl, localCover);
    return localCover;
  } catch {
    return null;
  }
}

function buildImportProgress(
  metadata: SoundCloudPlaylistMetadata,
  state: {
    processedTracks: number;
    importedTracks: number;
    skippedTracks: number;
    failedTracks: number;
    currentTrack: string | null;
    percent: number;
    stage: PlaylistImportProgress['stage'];
  }
): PlaylistImportProgress {
  return {
    playlistName: metadata.title,
    totalTracks: metadata.entries.length,
    processedTracks: state.processedTracks,
    importedTracks: state.importedTracks,
    skippedTracks: state.skippedTracks,
    failedTracks: state.failedTracks,
    currentTrack: state.currentTrack,
    percent: Math.min(100, Math.max(0, Math.round(state.percent))),
    stage: state.stage
  };
}

export async function importSoundCloudPlaylist(
  url: string,
  onProgress?: (progress: PlaylistImportProgress) => void
): Promise<PlaylistImportResult> {
  const requestedSourceUrl = normalizeSourceUrl(url);
  const existingPlaylist = findPlaylistBySourceUrl(requestedSourceUrl);
  if (existingPlaylist) {
    throw new Error(`Плейлист «${existingPlaylist.name}» уже импортирован`);
  }

  const metadata = await getPlaylistMetadataByUrl(url);
  const existingByMetadataUrl = findPlaylistBySourceUrl(metadata.sourceUrl);
  if (existingByMetadataUrl) {
    throw new Error(`Плейлист «${existingByMetadataUrl.name}» уже импортирован`);
  }

  const totalTracks = metadata.entries.length;
  let processedTracks = 0;
  let importedTracks = 0;
  let skippedTracks = 0;
  let failedTracks = 0;
  const errors: PlaylistImportTrackError[] = [];
  const playlistTrackIds: Array<{ index: number; id: number }> = [];

  onProgress?.(buildImportProgress(metadata, {
    processedTracks,
    importedTracks,
    skippedTracks,
    failedTracks,
    currentTrack: null,
    percent: 2,
    stage: 'metadata'
  }));

  const coverPath = await savePlaylistCover(metadata);
  const playlistId = createPlaylist({ name: metadata.title, coverPath, sourceUrl: metadata.sourceUrl });

  onProgress?.(buildImportProgress(metadata, {
    processedTracks,
    importedTracks,
    skippedTracks,
    failedTracks,
    currentTrack: null,
    percent: 5,
    stage: 'creating'
  }));

  await runWithConcurrency(metadata.entries, 5, async (entry, index) => {
    let currentTrack = `${entry.artist} - ${entry.title}`;

    try {
      const existingByFlatUrl = findTrackBySourceUrl(entry.url);
      const preview = await getPlaylistEntryPreview(entry);
      currentTrack = `${preview.artist} - ${preview.title}`;

      const existingTrack = findTrackBySourceUrl(preview.sourceUrl) ?? existingByFlatUrl;
      if (existingTrack) {
        if (isPlaceholderTrack(existingTrack.title, existingTrack.artist, existingTrack.cover_path)) {
          const coverPath = existingTrack.cover_path ?? await saveTrackCover(preview);
          updateTrackMetadata(existingTrack.id, {
            title: preview.title,
            artist: preview.artist,
            duration: preview.duration,
            coverPath,
            sourceUrl: preview.sourceUrl
          });
        }

        playlistTrackIds.push({ index, id: existingTrack.id });
        skippedTracks += 1;
        onProgress?.(buildImportProgress(metadata, {
          processedTracks: processedTracks + 1,
          importedTracks,
          skippedTracks,
          failedTracks,
          currentTrack,
          percent: ((processedTracks + 1) / totalTracks) * 100,
          stage: 'skipped'
        }));
        return;
      }

      onProgress?.(buildImportProgress(metadata, {
        processedTracks,
        importedTracks,
        skippedTracks,
        failedTracks,
        currentTrack,
        percent: (processedTracks / totalTracks) * 100,
        stage: 'downloading'
      }));

      const result = await downloadTrackByPreview(preview, (downloadProgress) => {
        onProgress?.(buildImportProgress(metadata, {
          processedTracks,
          importedTracks,
          skippedTracks,
          failedTracks,
          currentTrack,
          percent: ((processedTracks + downloadProgress.percent / 100) / totalTracks) * 100,
          stage: 'downloading'
        }));
      });

      const duplicateAfterDownload = findTrackBySourceUrl(result.sourceUrl);
      if (duplicateAfterDownload) {
        playlistTrackIds.push({ index, id: duplicateAfterDownload.id });
        skippedTracks += 1;
      } else {
        const trackId = createTrack({
          title: result.title,
          artist: result.artist,
          duration: result.duration,
          coverPath: result.coverPath,
          filePath: result.filePath,
          sourceUrl: result.sourceUrl
        });
        playlistTrackIds.push({ index, id: trackId });
        importedTracks += 1;
      }
    } catch (error) {
      failedTracks += 1;
      errors.push({
        title: currentTrack,
        url: entry.url,
        message: error instanceof Error ? error.message : String(error)
      });
      onProgress?.(buildImportProgress(metadata, {
        processedTracks: processedTracks + 1,
        importedTracks,
        skippedTracks,
        failedTracks,
        currentTrack,
        percent: ((processedTracks + 1) / totalTracks) * 100,
        stage: 'failed'
      }));
    } finally {
      processedTracks += 1;
    }
  });

  const orderedTrackIds = playlistTrackIds
    .sort((a, b) => a.index - b.index)
    .map((item) => item.id);
  addTracksToPlaylist(playlistId, orderedTrackIds);

  onProgress?.(buildImportProgress(metadata, {
    processedTracks,
    importedTracks,
    skippedTracks,
    failedTracks,
    currentTrack: null,
    percent: 100,
    stage: 'finished'
  }));

  return {
    playlistId,
    playlistName: metadata.title,
    totalTracks,
    importedTracks,
    skippedTracks,
    failedTracks,
    errors
  };
}

export async function importPlaylistFromUrl(
  url: string,
  onProgress?: (progress: PlaylistImportProgress) => void
): Promise<PlaylistImportResult> {
  return importSoundCloudPlaylist(url, onProgress);
}

export async function downloadTrackByUrl(
  url: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<DownloadResult> {
  const preview = await getPreviewByUrl(url);
  return downloadTrackByPreview(preview, onProgress);
}

export async function downloadTrackByPreview(
  preview: DownloadPreview,
  onProgress?: (progress: DownloadProgress) => void
): Promise<DownloadResult> {
  ensureDirs();
  const ffmpegCommand = await resolveFfmpegCommand();

  const safeBase = sanitizeName(`${preview.artist} - ${preview.title}`);
  const uniqueBase = createUniqueBaseName(safeBase);
  const outputTemplate = path.join(musicDir, `${uniqueBase}.%(ext)s`);
  await runYtDlpWithProgress([
    '--no-playlist',
    '--no-warnings',
    '--encoding',
    'utf-8',
    '--newline',
    '-x',
    '--audio-format',
    'mp3',
    '--audio-quality',
    '0',
    '--ffmpeg-location',
    ffmpegCommand,
    '-o',
    outputTemplate,
    preview.sourceUrl
  ], onProgress);

  const filePath = path.join(musicDir, `${uniqueBase}.mp3`);
  if (!fs.existsSync(filePath)) {
    throw new Error('Файл mp3 не найден после скачивания. Проверьте yt-dlp и ffmpeg.');
  }

  let coverPath: string | null = null;
  if (preview.coverUrl) {
    try {
      const localCover = path.join(coversDir, `${safeBase}.jpg`);
      await downloadFile(preview.coverUrl, localCover);
      coverPath = localCover;
    } catch {
      coverPath = null;
    }
  }

  return {
    title: preview.title,
    artist: preview.artist,
    duration: preview.duration,
    coverPath,
    filePath,
    sourceUrl: preview.sourceUrl
  };
}
