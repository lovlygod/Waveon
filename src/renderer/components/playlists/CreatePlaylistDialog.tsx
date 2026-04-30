import { Image as ImageIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

interface CreatePlaylistDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, coverPath: string) => Promise<void> | void;
}

export function CreatePlaylistDialog({ open, onClose, onCreate }: CreatePlaylistDialogProps): ReactElement | null {
  const [name, setName] = useState('');
  const [coverPath, setCoverPath] = useState('');

  async function handlePickPlaylistCover(): Promise<void> {
    const selectedPath = await window.waveon.system.pickPlaylistCover();
    if (!selectedPath) return;
    setCoverPath(selectedPath);
  }

  function close(): void {
    setName('');
    setCoverPath('');
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#181818] p-5 shadow-2xl shadow-black/40">
        <h3 className="mb-4 text-lg font-semibold text-white">Создать плейлист</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-[#9f9f9f]">Название</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white outline-none focus:border-[#6d5cff]"
              placeholder="Например: Night Drive"
            />
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm text-[#9f9f9f]">
              <ImageIcon size={14} /> Обложка плейлиста
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handlePickPlaylistCover()}
                className="rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white transition hover:border-[#6d5cff]"
              >
                Выбрать изображение
              </button>
              {coverPath ? (
                <button
                  type="button"
                  onClick={() => setCoverPath('')}
                  className="rounded-2xl border border-red-400/30 bg-red-500/5 px-4 py-3 text-sm text-red-300 transition hover:bg-red-500/10"
                >
                  Убрать
                </button>
              ) : null}
            </div>
            {coverPath ? <p className="mt-2 truncate text-xs text-[#9f9f9f]">{coverPath}</p> : null}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={close} className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white">
            Отмена
          </button>
          <button
            onClick={async () => {
              await onCreate(name, coverPath);
              close();
            }}
            className="rounded-2xl bg-[#6d5cff] px-4 py-2 text-sm font-medium text-white"
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}
