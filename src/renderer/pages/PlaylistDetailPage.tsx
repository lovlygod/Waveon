import { ArrowLeft, Image as ImageIcon, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo, useState, type ReactElement } from 'react';
import type { Playlist, PlaylistTrack, QueueTrack, Track } from '@shared/app-types';
import { IconButton } from '@/components/common/IconButton';
import { GlassCard } from '@/components/common/GlassCard';
import { TrackList } from '@/components/music/TrackList';
import { AddToPlaylistDialog } from '@/components/music/AddToPlaylistDialog';
import { DeletePlaylistDialog } from '@/components/playlists/DeletePlaylistDialog';
import { fileUrl } from '@/lib/fileUrl';

interface PlaylistDetailPageProps {
  playlist: Playlist;
  playlistTracks: PlaylistTrack[];
  tracks: Track[];
  currentTrack: QueueTrack | null;
  isPlaying: boolean;
  compactMode: boolean;
  onBack: () => void;
  onRename: () => void;
  onDelete: (playlist: Playlist) => Promise<void>;
  onAddTracks: (trackIds: number[]) => Promise<void>;
  onToggleTrack: (track: PlaylistTrack) => void;
  onPlayTrack: (track: PlaylistTrack) => void;
  onRemoveTrack: (track: PlaylistTrack) => Promise<void>;
  getScaleInMotion: (delay?: number) => Record<string, unknown>;
  getHoverLift: () => Record<string, unknown>;
}

export function PlaylistDetailPage({
  playlist,
  playlistTracks,
  tracks,
  currentTrack,
  isPlaying,
  compactMode,
  onBack,
  onRename,
  onDelete,
  onAddTracks,
  onToggleTrack,
  onPlayTrack,
  onRemoveTrack,
  getScaleInMotion,
  getHoverLift
}: PlaylistDetailPageProps): ReactElement {
  const [isAddTracksOpen, setIsAddTracksOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const existingPlaylistTrackIds = useMemo(() => new Set(playlistTracks.map((item) => item.id)), [playlistTracks]);
  const availableTracksForPlaylist = useMemo(() => tracks.filter((track) => !existingPlaylistTrackIds.has(track.id)), [existingPlaylistTrackIds, tracks]);

  return (
    <motion.div className="space-y-4" {...getScaleInMotion()}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="relative z-10 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white transition hover:border-[#6d5cff]"
        >
          <ArrowLeft size={16} className="shrink-0" />
          <span>Назад</span>
        </button>
      </div>

      <motion.section {...getScaleInMotion(0.05)}>
        <GlassCard className="p-5">
          <div className="flex items-center gap-5">
            {playlist.cover_path ? (
              <img src={fileUrl(playlist.cover_path)} alt={playlist.name} className="h-40 w-40 rounded-3xl object-cover" />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-3xl bg-[radial-gradient(circle_at_25%_20%,rgba(109,92,255,0.35),transparent_32%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.18),transparent_30%),#121212] text-[#9f9f9f]">
                <ImageIcon size={36} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[#9f9f9f]">Плейлист</p>
              <h3 className="truncate text-3xl font-semibold text-white">{playlist.name}</h3>
              <p className="mt-2 text-sm text-[#9f9f9f]">{playlistTracks.length} треков</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <IconButton
                  onClick={() => {
                    const first = playlistTracks[0];
                    if (!first) return;
                    onPlayTrack(first);
                  }}
                  icon={<Play size={14} className="shrink-0" />}
                  label={<span>Слушать</span>}
                  className="bg-white text-black"
                />
                <IconButton
                  onClick={() => setIsAddTracksOpen(true)}
                  icon={<Plus size={14} className="shrink-0" />}
                  label={<span>Добавить треки</span>}
                />
                <IconButton onClick={onRename} icon={<Pencil size={14} className="shrink-0" />} label={<span>Переименовать</span>} />
                <IconButton
                  onClick={() => setIsDeleteDialogOpen(true)}
                  icon={<Trash2 size={14} className="shrink-0" />}
                  label={<span>Удалить</span>}
                  className="border-red-400/30 bg-red-500/5 text-red-300"
                />
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.section>

      <motion.section {...getScaleInMotion(0.08)}>
        <GlassCard className="p-4">
          <TrackList
            tracks={playlistTracks}
            emptyTitle="В этом плейлисте пока нет треков. Добавьте их из библиотеки."
            compact={compactMode}
            getIsCurrent={(track) => ({
              isCurrent: currentTrack?.id === track.id && currentTrack?.playlistId === track.playlist_id,
              isCurrentPlaying: currentTrack?.id === track.id && currentTrack?.playlistId === track.playlist_id && isPlaying
            })}
            onTogglePlay={onToggleTrack}
            onPlay={onPlayTrack}
            onRemove={(track) => onRemoveTrack(track)}
            removeMode="remove"
            hoverProps={getHoverLift()}
          />
        </GlassCard>
      </motion.section>

      <AddToPlaylistDialog
        open={isAddTracksOpen}
        playlistName={playlist.name}
        tracks={availableTracksForPlaylist}
        onClose={() => setIsAddTracksOpen(false)}
        onSubmit={onAddTracks}
      />

      <DeletePlaylistDialog
        open={isDeleteDialogOpen}
        playlist={playlist}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={onDelete}
      />
    </motion.div>
  );
}
