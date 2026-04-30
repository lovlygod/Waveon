import { Pause, Play, Trash2, X } from 'lucide-react';
import type { PlaylistTrack, Track } from '@shared/app-types';
import { memo, type ReactElement } from 'react';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/formatTime';
import { TrackCover } from '@/components/music/TrackCover';

interface TrackRowProps {
  track: Track | PlaylistTrack;
  isCurrent: boolean;
  isCurrentPlaying: boolean;
  compact?: boolean;
  onTogglePlay: () => void;
  onPlay: () => void;
  onRemove?: () => void;
  removeMode?: 'delete' | 'remove';
}

function TrackRowComponent({
  track,
  isCurrentPlaying,
  compact = false,
  onTogglePlay,
  onPlay,
  onRemove,
  removeMode = 'delete'
}: TrackRowProps): ReactElement {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-2xl border border-white/10 bg-[#121212] px-4 transition-colors hover:bg-[#151515]',
        compact ? 'py-2.5' : 'py-3'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button onClick={onTogglePlay} className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
          <TrackCover title={track.title} coverPath={track.cover_path} className="h-12 w-12" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white transition group-hover:bg-black/65">
            {isCurrentPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </span>
        </button>

        <button onClick={onPlay} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-white">{track.title}</p>
            <p className="truncate text-xs text-[#9f9f9f]">{track.artist}</p>
          </div>
          <span className="text-xs text-[#9f9f9f]">{formatTime(track.duration)}</span>
        </button>
      </div>

      {onRemove ? (
        <button
          onClick={onRemove}
          className={cn(
            'ml-3 rounded-md p-2 transition',
            removeMode === 'delete'
              ? 'border border-red-400/30 text-red-300 hover:bg-red-500/10'
              : 'border border-red-400/30 text-red-300 hover:bg-red-500/10'
          )}
          aria-label={removeMode === 'delete' ? 'Удалить трек' : 'Убрать трек'}
        >
          {removeMode === 'delete' ? <Trash2 size={14} /> : <X size={14} />}
        </button>
      ) : null}
    </div>
  );
}

export const TrackRow = memo(TrackRowComponent);
