import { Download, Loader2 } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import type { PlaylistImportProgressPayload } from '@shared/app-types';

interface ImportPlaylistDialogProps {
  open: boolean;
  isImporting: boolean;
  progress: PlaylistImportProgressPayload | null;
  onClose: () => void;
  onHide: () => void;
  onImport: (url: string) => Promise<void>;
}

export function ImportPlaylistDialog({
  open,
  isImporting,
  progress,
  onClose,
  onHide,
  onImport
}: ImportPlaylistDialogProps): ReactElement | null {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) return;
    setUrl('');
    setError('');
  }, [open]);

  if (!open) return null;

  const isFinished = progress?.stage === 'finished';
  const processedText = progress
    ? `Обработано ${progress.processedTracks} из ${progress.totalTracks}`
    : 'Создаем плейлист и загружаем треки';

  async function handleImport(): Promise<void> {
    setError('');
    const trimmedUrl = url.trim();

    try {
      await onImport(trimmedUrl);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Проверьте ссылку SoundCloud и попробуйте снова');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#181818] p-5 shadow-2xl shadow-black/40">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#6d5cff]/15 text-[#b8b0ff]">
            {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Импорт плейлиста</h3>
            <p className="mt-1 text-sm leading-5 text-[#9f9f9f]">
              Вставьте ссылку на плейлист SoundCloud. Waveon создаст новый плейлист, перенесет его название, обложку и скачает все треки в библиотеку.
            </p>
          </div>
        </div>

        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          disabled={isImporting}
          className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white outline-none transition placeholder:text-[#646464] focus:border-[#6d5cff] disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="https://soundcloud.com/.../sets/..."
        />

        {progress ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#121212] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {isFinished ? 'Плейлист успешно импортирован' : 'Импортируем плейлист...'}
                </p>
                <p className="mt-1 truncate text-xs text-[#9f9f9f]">{progress.playlistName || 'Создаем плейлист и загружаем треки'}</p>
              </div>
              <span className="shrink-0 text-sm font-medium text-[#b8b0ff]">{progress.percent}%</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#6d5cff] transition-all" style={{ width: `${progress.percent}%` }} />
            </div>

            <div className="mt-3 space-y-1 text-sm text-[#cfcfcf]">
              <p>{processedText}</p>
              {progress.currentTrack ? <p className="truncate">Сейчас: {progress.currentTrack}</p> : null}
              {progress.failedTracks > 0 ? <p className="text-red-300">Ошибок: {progress.failedTracks}</p> : null}
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <p className="font-medium">Не удалось импортировать плейлист</p>
            <p className="mt-1 text-red-200/80">{error}</p>
          </div>
        ) : null}

        {isImporting ? (
          <p className="mt-3 text-sm text-[#9f9f9f]">
            Это окно можно скрыть: импорт продолжится в фоновом режиме.
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={isImporting ? onHide : onClose}
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isImporting ? 'Скрыть' : 'Отмена'}
          </button>
          <button
            onClick={() => void handleImport()}
            disabled={isImporting}
            className="rounded-2xl bg-[#6d5cff] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7b6dff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Импортировать
          </button>
        </div>
      </div>
    </div>
  );
}
