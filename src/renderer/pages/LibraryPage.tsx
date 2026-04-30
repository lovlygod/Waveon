import { motion } from 'framer-motion';
import type { QueueTrack, Track } from '@shared/app-types';
import type { ReactElement } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { TrackList } from '@/components/music/TrackList';

interface LibraryPageProps {
  tracks: Track[];
  isLoadingTracks: boolean;
  currentTrack: QueueTrack | null;
  isPlaying: boolean;
  compactMode: boolean;
  onRefresh: () => Promise<void>;
  onToggleTrack: (track: Track) => void;
  onPlayTrack: (track: Track) => void;
  onDeleteTrack: (trackId: number) => Promise<void>;
  getRevealMotion: (delay?: number, y?: number) => Record<string, unknown>;
  getHoverLift: () => Record<string, unknown>;
}

export function LibraryPage({
  tracks,
  isLoadingTracks,
  currentTrack,
  isPlaying,
  compactMode,
  onRefresh,
  onToggleTrack,
  onPlayTrack,
  onDeleteTrack,
  getRevealMotion,
  getHoverLift
}: LibraryPageProps): ReactElement {
  return (
    <motion.section {...getRevealMotion()}>
      <GlassCard className="rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-[#9f9f9f]">Локальная библиотека</p>
          <button onClick={() => void onRefresh()} className="rounded-lg border border-white/10 px-3 py-1 text-xs text-[#9f9f9f] hover:text-white">
            Обновить
          </button>
        </div>

        <TrackList
          tracks={tracks}
          isLoading={isLoadingTracks}
          emptyTitle="Библиотека пока пустая"
          compact={compactMode}
          loadingLabel="Загрузка..."
          getIsCurrent={(track) => ({
            isCurrent: currentTrack?.id === track.id && currentTrack?.source !== 'playlist',
            isCurrentPlaying: currentTrack?.id === track.id && currentTrack?.source !== 'playlist' && isPlaying
          })}
          onTogglePlay={onToggleTrack}
          onPlay={onPlayTrack}
          onRemove={(track) => onDeleteTrack(track.id)}
          removeMode="delete"
          hoverProps={getHoverLift()}
        />
      </GlassCard>
    </motion.section>
  );
}
