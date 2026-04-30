import type { PlaylistTrack, Track } from '@shared/app-types';
import type { ReactElement } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { TrackRow } from '@/components/music/TrackRow';

interface TrackListProps<T extends Track | PlaylistTrack> {
  tracks: T[];
  isLoading?: boolean;
  emptyTitle: string;
  compact?: boolean;
  getIsCurrent: (track: T) => { isCurrent: boolean; isCurrentPlaying: boolean };
  onTogglePlay: (track: T) => void;
  onPlay: (track: T) => void;
  onRemove?: (track: T) => void;
  removeMode?: 'delete' | 'remove';
  hoverProps?: Record<string, unknown>;
  loadingLabel?: string;
}

export function TrackList<T extends Track | PlaylistTrack>({
  tracks,
  isLoading = false,
  emptyTitle,
  compact,
  getIsCurrent,
  onTogglePlay,
  onPlay,
  onRemove,
  removeMode,
  hoverProps,
  loadingLabel = 'Загрузка...'
}: TrackListProps<T>): ReactElement {
  if (isLoading) {
    return <LoadingState label={loadingLabel} />;
  }

  if (tracks.length === 0) {
    return <EmptyState title={emptyTitle} />;
  }

  return (
    <div className="space-y-2">
      {tracks.map((track) => {
        const { isCurrent, isCurrentPlaying } = getIsCurrent(track);
        const key = 'playlist_id' in track ? `${track.playlist_id}-${track.track_id}` : track.id;

        return (
          <TrackRow
            key={key}
            track={track}
            isCurrent={isCurrent}
            isCurrentPlaying={isCurrentPlaying}
            compact={compact}
            onTogglePlay={() => onTogglePlay(track)}
            onPlay={() => onPlay(track)}
            onRemove={onRemove ? () => onRemove(track) : undefined}
            removeMode={removeMode}
          />
        );
      })}
    </div>
  );
}
