import type { FormEventHandler, ReactElement } from 'react';

interface UrlDownloadFormProps {
  url: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function UrlDownloadForm({ url, isLoading, onChange, onSubmit }: UrlDownloadFormProps): ReactElement {
  return (
    <form onSubmit={onSubmit} className="space-y-3 text-center">
      <p className="text-sm text-[#9f9f9f]">Вставьте URL SoundCloud</p>
      <div className="mx-auto flex max-w-3xl gap-3">
        <input
          value={url}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 rounded-xl border border-white/10 bg-[#121212] px-4 py-2 text-white outline-none focus:border-[#6d5cff]"
          placeholder="https://soundcloud.com/..."
        />
        <button type="submit" disabled={isLoading} className="rounded-xl bg-[#6d5cff] px-5 py-2 font-medium text-white disabled:opacity-60">
          {isLoading ? 'Проверка...' : 'Получить превью'}
        </button>
      </div>
    </form>
  );
}
