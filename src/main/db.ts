import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

export interface TrackRow {
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

export interface CreateTrackInput {
  title: string;
  artist: string;
  album?: string | null;
  duration?: number;
  coverPath?: string | null;
  filePath: string;
  sourceUrl: string;
}

export interface PlaylistRow {
  id: number;
  name: string;
  cover_path: string | null;
  source_url: string | null;
  created_at: string;
  track_count: number;
}

export interface PlaylistTrackRow {
  playlist_id: number;
  track_id: number;
  position: number;
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

export interface CreatePlaylistInput {
  name: string;
  coverPath?: string | null;
  sourceUrl?: string | null;
}

const workspaceRoot = path.resolve(__dirname, '../../');

function getWritableRoot(): string {
  if (app.isPackaged) {
    return app.getPath('userData');
  }
  return workspaceRoot;
}

const writableRoot = getWritableRoot();
const databaseDir = path.join(writableRoot, 'database');
const dbPath = path.join(databaseDir, 'app.db');

fs.mkdirSync(databaseDir, { recursive: true });

const db = new Database(dbPath);
let isInitialized = false;

function withExistingMedia<T extends { file_path: string; cover_path: string | null }>(rows: T[]): T[] {
  return rows
    .filter((row) => fs.existsSync(row.file_path))
    .map((row) => ({
      ...row,
      cover_path: row.cover_path && fs.existsSync(row.cover_path) ? row.cover_path : null
    }));
}

export interface UpdateTrackMetadataInput {
  title: string;
  artist: string;
  duration?: number;
  coverPath?: string | null;
  sourceUrl: string;
}

function withExistingCover<T extends { cover_path: string | null }>(row: T): T {
  return {
    ...row,
    cover_path: row.cover_path && fs.existsSync(row.cover_path) ? row.cover_path : null
  };
}

export function initDatabase(): void {
  if (isInitialized) {
    return;
  }

  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album TEXT,
      duration INTEGER DEFAULT 0,
      cover_path TEXT,
      file_path TEXT NOT NULL,
      source_url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cover_path TEXT,
      source_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id INTEGER NOT NULL,
      track_id INTEGER NOT NULL,
      position INTEGER DEFAULT 0,
      PRIMARY KEY (playlist_id, track_id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      track_id INTEGER PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  const playlistColumns = db.prepare(`PRAGMA table_info(playlists)`).all() as Array<{ name: string }>;
  if (!playlistColumns.some((column) => column.name === 'source_url')) {
    db.prepare(`ALTER TABLE playlists ADD COLUMN source_url TEXT`).run();
  }

  isInitialized = true;
}

export function listTracks(): TrackRow[] {
  initDatabase();
  const listTracksStmt = db.prepare(`
    SELECT id, title, artist, album, duration, cover_path, file_path, source_url, created_at
    FROM tracks
    ORDER BY datetime(created_at) DESC
  `);
  return withExistingMedia(listTracksStmt.all() as TrackRow[]);
}

export function createTrack(input: CreateTrackInput): number {
  initDatabase();
  const insertTrackStmt = db.prepare(`
    INSERT INTO tracks (title, artist, album, duration, cover_path, file_path, source_url)
    VALUES (@title, @artist, @album, @duration, @coverPath, @filePath, @sourceUrl)
  `);

  const result = insertTrackStmt.run({
    title: input.title,
    artist: input.artist,
    album: input.album ?? null,
    duration: input.duration ?? 0,
    coverPath: input.coverPath ?? null,
    filePath: input.filePath,
    sourceUrl: input.sourceUrl
  });

  return Number(result.lastInsertRowid);
}

export function findTrackBySourceUrl(sourceUrl: string): TrackRow | null {
  initDatabase();
  const stmt = db.prepare(`
    SELECT id, title, artist, album, duration, cover_path, file_path, source_url, created_at
    FROM tracks
    WHERE source_url = ?
    LIMIT 1
  `);

  return (stmt.get(sourceUrl) as TrackRow | undefined) ?? null;
}

export function updateTrackMetadata(id: number, input: UpdateTrackMetadataInput): void {
  initDatabase();
  const stmt = db.prepare(`
    UPDATE tracks
    SET title = @title,
        artist = @artist,
        duration = @duration,
        cover_path = @coverPath,
        source_url = @sourceUrl
    WHERE id = @id
  `);

  stmt.run({
    id,
    title: input.title,
    artist: input.artist,
    duration: input.duration ?? 0,
    coverPath: input.coverPath ?? null,
    sourceUrl: input.sourceUrl
  });
}

export function deleteTrack(id: number): void {
  initDatabase();
  const getTrackStmt = db.prepare(`
    SELECT file_path, cover_path
    FROM tracks
    WHERE id = ?
  `);
  const deleteTrackStmt = db.prepare(`DELETE FROM tracks WHERE id = ?`);

  const track = getTrackStmt.get(id) as { file_path: string; cover_path: string | null } | undefined;

  deleteTrackStmt.run(id);

  if (!track) return;

  if (track.file_path && fs.existsSync(track.file_path)) {
    fs.unlinkSync(track.file_path);
  }

  if (track.cover_path && fs.existsSync(track.cover_path)) {
    fs.unlinkSync(track.cover_path);
  }
}

export function listPlaylists(): PlaylistRow[] {
  initDatabase();
  const stmt = db.prepare(`
    SELECT
      p.id,
      p.name,
      p.cover_path,
      p.source_url,
      p.created_at,
      COUNT(pt.track_id) AS track_count
    FROM playlists p
    LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
    GROUP BY p.id, p.name, p.cover_path, p.source_url, p.created_at
    ORDER BY datetime(p.created_at) DESC
  `);

  return (stmt.all() as PlaylistRow[]).map(withExistingCover);
}

export function createPlaylist(input: CreatePlaylistInput): number {
  initDatabase();
  const stmt = db.prepare(`
    INSERT INTO playlists (name, cover_path, source_url)
    VALUES (@name, @coverPath, @sourceUrl)
  `);

  const result = stmt.run({
    name: input.name,
    coverPath: input.coverPath ?? null,
    sourceUrl: input.sourceUrl ?? null
  });

  return Number(result.lastInsertRowid);
}

export function findPlaylistBySourceUrl(sourceUrl: string): PlaylistRow | null {
  initDatabase();
  const stmt = db.prepare(`
    SELECT
      p.id,
      p.name,
      p.cover_path,
      p.source_url,
      p.created_at,
      COUNT(pt.track_id) AS track_count
    FROM playlists p
    LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
    WHERE p.source_url = ?
    GROUP BY p.id, p.name, p.cover_path, p.source_url, p.created_at
    LIMIT 1
  `);

  const playlist = stmt.get(sourceUrl) as PlaylistRow | undefined;
  return playlist ? withExistingCover(playlist) : null;
}

export function renamePlaylist(id: number, name: string): void {
  initDatabase();
  const stmt = db.prepare(`UPDATE playlists SET name = ? WHERE id = ?`);
  stmt.run(name, id);
}

export function deletePlaylist(id: number): void {
  initDatabase();
  const coverStmt = db.prepare(`SELECT cover_path FROM playlists WHERE id = ?`);
  const deleteTracksStmt = db.prepare(`DELETE FROM playlist_tracks WHERE playlist_id = ?`);
  const deletePlaylistStmt = db.prepare(`DELETE FROM playlists WHERE id = ?`);

  const playlist = coverStmt.get(id) as { cover_path: string | null } | undefined;

  deleteTracksStmt.run(id);
  deletePlaylistStmt.run(id);

  if (playlist?.cover_path && fs.existsSync(playlist.cover_path)) {
    fs.unlinkSync(playlist.cover_path);
  }
}

export function listPlaylistTracks(playlistId: number): PlaylistTrackRow[] {
  initDatabase();
  const stmt = db.prepare(`
    SELECT
      pt.playlist_id,
      pt.track_id,
      pt.position,
      t.id,
      t.title,
      t.artist,
      t.album,
      t.duration,
      t.cover_path,
      t.file_path,
      t.source_url,
      t.created_at
    FROM playlist_tracks pt
    INNER JOIN tracks t ON t.id = pt.track_id
    WHERE pt.playlist_id = ?
    ORDER BY pt.position ASC, t.id ASC
  `);

  return withExistingMedia(stmt.all(playlistId) as PlaylistTrackRow[]);
}

export function addTracksToPlaylist(playlistId: number, trackIds: number[]): void {
  initDatabase();
  const maxPositionStmt = db.prepare(`SELECT COALESCE(MAX(position), -1) AS max_position FROM playlist_tracks WHERE playlist_id = ?`);
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position)
    VALUES (?, ?, ?)
  `);

  const current = maxPositionStmt.get(playlistId) as { max_position: number };
  let position = (current?.max_position ?? -1) + 1;

  const transaction = db.transaction((ids: number[]) => {
    for (const trackId of ids) {
      insertStmt.run(playlistId, trackId, position);
      position += 1;
    }
  });

  transaction(trackIds);
}

export function removeTrackFromPlaylist(playlistId: number, trackId: number): void {
  initDatabase();
  const deleteStmt = db.prepare(`DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?`);
  const rowsStmt = db.prepare(`SELECT track_id FROM playlist_tracks WHERE playlist_id = ? ORDER BY position ASC, track_id ASC`);
  const updateStmt = db.prepare(`UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?`);

  deleteStmt.run(playlistId, trackId);

  const rows = rowsStmt.all(playlistId) as Array<{ track_id: number }>;
  const transaction = db.transaction((items: Array<{ track_id: number }>) => {
    items.forEach((item, index) => {
      updateStmt.run(index, playlistId, item.track_id);
    });
  });

  transaction(rows);
}

