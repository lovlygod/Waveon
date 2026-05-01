import { motion } from 'framer-motion';
import type { QueueTrack, Track } from '@shared/app-types';
import type { ReactElement } from 'react';
import { NowPlayingHeroBackground } from '@/components/NowPlayingHeroBackground';
import { GlassCard } from '@/components/common/GlassCard';
import { TrackCover } from '@/components/music/TrackCover';
import type { AppPage } from '@shared/app-types';

interface HomePageProps {
  tracks: Track[];
  currentTrack: QueueTrack | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onNavigate: (page: AppPage) => void;
  getRevealMotion: (delay?: number, y?: number) => Record<string, unknown>;
  getScaleInMotion: (delay?: number) => Record<string, unknown>;
  getHoverLift: () => Record<string, unknown>;
}

export function HomePage({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onNavigate,
  getRevealMotion,
  getScaleInMotion,
  getHoverLift
}: HomePageProps): ReactElement {
  const latestTrack = tracks[0] ?? null;
  const currentOrLatestTrack = currentTrack
    ? tracks.find((track) => track.id === currentTrack.id) ?? {
        id: currentTrack.id,
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: null,
        duration: 0,
        created_at: '',
        file_path: currentTrack.file_path,
        cover_path: currentTrack.cover_path ?? null,
        source_url: ''
      }
    : latestTrack;
  return (
    <motion.div {...getRevealMotion()}>
      <section className="min-h-[calc(100vh-16rem)] pb-4">
        <motion.article className="h-full" {...getScaleInMotion()}>
          <GlassCard className="relative h-full min-h-[calc(100vh-16rem)] overflow-hidden p-6 md:p-8">
            <NowPlayingHeroBackground trackKey={currentOrLatestTrack?.id ?? null} isPlaying={isPlaying} />
            <div className="relative flex h-full min-h-[26rem] items-start justify-between gap-8 pt-2 md:pt-3">
              <div className="max-w-2xl pr-2">
                <div>
                  <h2 className="mb-3 text-4xl font-semibold leading-tight text-white md:text-5xl">
                    {currentOrLatestTrack ? currentOrLatestTrack.title : 'Локальная музыка в одном месте'}
                  </h2>
                  <p className="text-base text-[#c7c7c7] md:text-lg">
                    {currentOrLatestTrack
                      ? currentOrLatestTrack.artist
                      : 'Ваш локальный музыкальный центр для быстрого доступа к любимым трекам, последним загрузкам и плейлистам.'}
                  </p>
                </div>

              </div>

              <div className="hidden shrink-0 md:block">
                {currentOrLatestTrack ? (
                  <TrackCover title={currentOrLatestTrack.title} coverPath={currentOrLatestTrack.cover_path} className="h-52 w-52 rounded-3xl shadow-2xl shadow-black/45" />
                ) : (
                  <div className="flex h-52 w-52 items-center justify-center rounded-3xl bg-white/5 text-sm text-[#9f9f9f]">Нет обложки</div>
                )}
              </div>

            </div>
          </GlassCard>
        </motion.article>
      </section>
    </motion.div>
  );
}
