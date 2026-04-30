import { Download, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Playlist } from '@shared/app-types';
import type { ReactElement } from 'react';
import { PlaylistGrid } from '@/components/playlists/PlaylistGrid';

interface PlaylistsPageProps {
  playlists: Playlist[];
  isLoadingPlaylists: boolean;
  onCreate: () => void;
  onImport: () => void;
  onSelect: (playlist: Playlist) => void;
  getRevealMotion: (delay?: number, y?: number) => Record<string, unknown>;
  getHoverLift: () => Record<string, unknown>;
}

export function PlaylistsPage({ playlists, isLoadingPlaylists, onCreate, onImport, onSelect, getRevealMotion, getHoverLift }: PlaylistsPageProps): ReactElement {
  return (
    <motion.section className="space-y-4" {...getRevealMotion()}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Ваши плейлисты</h2>
          <p className="text-sm text-[#9f9f9f]">Создавайте свои подборки и добавляйте в них треки из библиотеки</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onImport} className="inline-flex items-center rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-[#6d5cff]">
            <Download size={14} className="mr-2 shrink-0" /> Импортировать плейлист
          </button>
          <button onClick={onCreate} className="inline-flex items-center rounded-2xl bg-[#6d5cff] px-4 py-2 text-sm font-medium text-white">
            <Plus size={14} className="mr-2 shrink-0" /> Создать плейлист
          </button>
        </div>
      </div>

      <PlaylistGrid playlists={playlists} isLoading={isLoadingPlaylists} onSelect={onSelect} hoverProps={getHoverLift()} />
    </motion.section>
  );
}
