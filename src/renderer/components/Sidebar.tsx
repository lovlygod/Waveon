import { motion } from 'framer-motion';
import { useUiStore } from '@/store/ui.store';
import { usePlaylistImportStore } from '@/store/playlist-import.store';
import { navigationItems } from '@/constants/navigation';
import logo from '@/../assets/logo.png';
import type { ReactElement } from 'react';

export function Sidebar(): ReactElement {
  const { activePage, setActivePage } = useUiStore();
  const { isImporting, progress, setDialogOpen } = usePlaylistImportStore();

  return (
    <div className="shrink-0 w-[288px]">
      <aside
        className="fixed left-4 top-[3.25rem] bottom-4 w-[260px] rounded-[32px] border border-white/10 bg-[#181818] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
      >
        <div
          className="mb-6 flex items-center justify-center p-3 select-none"
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
          onMouseDown={(event) => event.preventDefault()}
          onContextMenu={(event) => event.preventDefault()}
        >
          <img
            src={logo}
            alt="Waveon logo"
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            style={{ userSelect: 'none' } as React.CSSProperties}
            className="h-12 w-auto select-none object-contain pointer-events-none"
          />
        </div>
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActivePage(item.id)}
              className={`flex w-full items-center gap-3 rounded-full px-3 py-2 text-left transition ${
                isActive ? 'bg-[#6d5cff] text-white shadow-lg shadow-[#6d5cff]/30' : 'text-[#9f9f9f] hover:bg-white/5 hover:text-white'
              }`}
            >
                <Icon size={18} />
                <span>{item.label}</span>
              </motion.button>
            );
          })}
        </nav>
        {isImporting && progress ? (
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="absolute right-4 bottom-4 left-4 rounded-2xl border border-[#6d5cff]/40 bg-[#121212] p-3 text-left shadow-lg shadow-black/20 transition hover:border-[#6d5cff]"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-white">Импорт плейлиста</span>
              <span className="shrink-0 text-xs font-medium text-[#b8b0ff]">{progress.percent}%</span>
            </div>
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#6d5cff]" style={{ width: `${progress.percent}%` }} />
            </div>
            <p className="truncate text-xs text-[#cfcfcf]">
              {progress.processedTracks} из {progress.totalTracks}
            </p>
            {progress.currentTrack ? (
              <p className="mt-1 truncate text-xs text-[#9f9f9f]">{progress.currentTrack}</p>
            ) : null}
          </button>
        ) : null}
      </aside>
    </div>
  );
}
