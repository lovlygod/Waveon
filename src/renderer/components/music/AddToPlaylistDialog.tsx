import { Plus, X } from 'lucide-react';
import { useMemo, useState, type ReactElement } from 'react';
import type { Track } from '@shared/app-types';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchInput } from '@/components/common/SearchInput';
import { TrackCover } from '@/components/music/TrackCover';
import { formatTime } from '@/lib/formatTime';
import { useSearch } from '@/hooks/useSearch';

interface AddToPlaylistDialogProps {
  open: boolean;
  playlistName: string;
  tracks: Track[];
  onClose: () => void;
  onSubmit: (trackIds: number[]) => Promise<void> | void;
}

export function AddToPlaylistDialog({ open, playlistName, tracks, onClose, onSubmit }: AddToPlaylistDialogProps): ReactElement | null {
  const [selectedTrackIds, setSelectedTrackIds] = useState<number[]>([]);
  const { query, setQuery, filteredItems, clearQuery } = useSearch({
    items: tracks,
    searchBy: (track) => [track.title, track.artist]
  });

  const selectedCount = useMemo(() => selectedTrackIds.length, [selectedTrackIds]);

  function close(): void {
    clearQuery();
    setSelectedTrackIds([]);
    onClose();
  }

  function toggleTrackSelection(trackId: number): void {
    setSelectedTrackIds((prev) => (prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#181818] p-5 shadow-2xl shadow-black/40">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Добавить треки</h3>
            <p className="text-sm text-[#9f9f9f]">Выберите треки для плейлиста {playlistName}</p>
          </div>
          <button onClick={close} className="rounded-xl border border-white/10 p-2 text-[#9f9f9f]">
            <X size={16} />
          </button>
        </div>

        <div className="mb-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Поиск по названию или автору" />
        </div>

        <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
          {filteredItems.length === 0 ? (
            <EmptyState title="Нет доступных треков для добавления." className="bg-transparent shadow-none" />
          ) : (
            filteredItems.map((track) => {
              const isSelected = selectedTrackIds.includes(track.id);

              return (
                <button
                  key={track.id}
                  onClick={() => toggleTrackSelection(track.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                    isSelected ? 'border-[#6d5cff] bg-[#6d5cff]/10' : 'border-white/10 bg-[#121212] hover:border-[#6d5cff]/40'
                  }`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded-md border ${isSelected ? 'border-[#6d5cff] bg-[#6d5cff]' : 'border-white/15 bg-transparent'}`}>
                    {isSelected ? <Plus size={12} className="rotate-45 text-white" /> : null}
                  </div>
                  <TrackCover title={track.title} coverPath={track.cover_path} className="h-12 w-12 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">{track.title}</p>
                    <p className="truncate text-xs text-[#9f9f9f]">{track.artist}</p>
                  </div>
                  <span className="text-xs text-[#9f9f9f]">{formatTime(track.duration)}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-[#9f9f9f]">Выбрано: {selectedCount}</p>
          <div className="flex gap-2">
            <button onClick={close} className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white">
              Отмена
            </button>
            <button
              onClick={async () => {
                await onSubmit(selectedTrackIds);
                close();
              }}
              disabled={selectedCount === 0}
              className="rounded-2xl bg-[#6d5cff] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Добавить выбранные
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
