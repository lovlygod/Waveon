import type { Track } from '@shared/app-types';
import type { ReactElement } from 'react';
import { motion } from 'framer-motion';
import { formatTime } from '@/lib/formatTime';
import { TrackCover } from '@/components/music/TrackCover';

interface TrackCardProps {
  track: Track;
  onClick: () => void;
  hoverProps?: Record<string, unknown>;
}

export function TrackCard({ track, onClick, hoverProps }: TrackCardProps): ReactElement {
  return (
    <motion.button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left"
      {...hoverProps}
    >
      <TrackCover title={track.title} coverPath={track.cover_path} className="h-12 w-12 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white">{track.title}</p>
        <p className="truncate text-xs text-[#9f9f9f]">{track.artist}</p>
      </div>
      <span className="text-xs text-[#9f9f9f]">{formatTime(track.duration)}</span>
    </motion.button>
  );
}
