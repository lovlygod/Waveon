import { useEffect, useState, type ReactElement } from 'react';
import type { Playlist } from '@shared/app-types';

interface RenamePlaylistDialogProps {
  open: boolean;
  playlist: Playlist | null;
  onClose: () => void;
  onRename: (playlistId: number, name: string) => Promise<void> | void;
}

export function RenamePlaylistDialog({ open, playlist, onClose, onRename }: RenamePlaylistDialogProps): ReactElement | null {
  const [name, setName] = useState('');

  useEffect(() => {
    setName(playlist?.name ?? '');
  }, [playlist]);

  if (!open || !playlist) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#181818] p-5 shadow-2xl shadow-black/40">
        <h3 className="mb-4 text-lg font-semibold text-white">Переименовать плейлист</h3>
        <label className="mb-2 block text-sm text-[#9f9f9f]">Название</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white outline-none focus:border-[#6d5cff]"
          placeholder="Новое название"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white">
            Отмена
          </button>
          <button
            onClick={async () => {
              await onRename(playlist.id, name);
              onClose();
            }}
            className="rounded-2xl bg-[#6d5cff] px-4 py-2 text-sm font-medium text-white"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
