import { ListMusic } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Playlist } from '@shared/app-types';
import type { ReactElement } from 'react';
import { fileUrl } from '@/lib/fileUrl';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
  hoverProps?: Record<string, unknown>;
}

export function PlaylistCard({ playlist, onClick, hoverProps }: PlaylistCardProps): ReactElement {
  return (
    <motion.button
      onClick={onClick}
      className="flex min-h-[132px] items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left"
      {...hoverProps}
    >
      {playlist.cover_path ? (
        <img src={fileUrl(playlist.cover_path)} alt={playlist.name} className="h-28 w-28 shrink-0 rounded-2xl object-cover" />
      ) : (
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_25%_20%,rgba(109,92,255,0.35),transparent_32%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.18),transparent_30%),#121212] text-[#9f9f9f]">
          <ListMusic size={32} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold text-white">{playlist.name}</p>
        <p className="mt-1 text-sm text-[#9f9f9f]">{playlist.track_count} треков</p>
      </div>
    </motion.button>
  );
}
