import type { Playlist } from '@shared/app-types';
import type { ReactElement } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { PlaylistCard } from '@/components/playlists/PlaylistCard';

interface PlaylistGridProps {
  playlists: Playlist[];
  isLoading: boolean;
  onSelect: (playlist: Playlist) => void;
  hoverProps?: Record<string, unknown>;
}

export function PlaylistGrid({ playlists, isLoading, onSelect, hoverProps }: PlaylistGridProps): ReactElement {
  if (isLoading) {
    return <LoadingState label="Загрузка плейлистов..." />;
  }

  if (playlists.length === 0) {
    return <EmptyState title="Плейлистов пока нет." description="Создайте первый плейлист." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {playlists.map((playlist) => (
        <PlaylistCard key={playlist.id} playlist={playlist} onClick={() => onSelect(playlist)} hoverProps={hoverProps} />
      ))}
    </div>
  );
}
