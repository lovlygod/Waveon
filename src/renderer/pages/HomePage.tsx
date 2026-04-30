import { motion } from 'framer-motion';
import type { QueueTrack, Track } from '@shared/app-types';
import type { ReactElement } from 'react';
import { NowPlayingHeroBackground } from '@/components/NowPlayingHeroBackground';
import { GlassCard } from '@/components/common/GlassCard';
import { TrackCard } from '@/components/music/TrackCard';
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
  const recentTracks = tracks.slice(0, 6);
  const latestTrack = recentTracks[0] ?? null;
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
    <motion.div className="space-y-4" {...getRevealMotion()}>
      <section>
        <motion.article {...getScaleInMotion()}>
          <GlassCard className="relative h-full overflow-hidden p-5">
            <NowPlayingHeroBackground trackKey={currentOrLatestTrack?.id ?? null} isPlaying={isPlaying} />
            <div className="relative flex h-full items-center justify-between gap-5">
              <div className="max-w-xl">
                <h2 className="mb-2 text-3xl font-semibold leading-tight text-white">
                  {currentOrLatestTrack ? currentOrLatestTrack.title : 'Локальная музыка в одном месте'}
                </h2>
                <p className="mb-4 text-sm text-[#bdbdbd]">
                  {currentOrLatestTrack
                    ? currentOrLatestTrack.artist
                    : 'Ваш локальный музыкальный центр для быстрого доступа к любимым трекам, последним загрузкам и плейлистам.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      if (!currentOrLatestTrack) return;
                      onPlayTrack(currentOrLatestTrack);
                    }}
                    className="rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:opacity-90"
                  >
                    {currentOrLatestTrack ? 'Слушать' : 'Пока пусто'}
                  </button>
                  <button
                    onClick={() => onNavigate('library')}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    Открыть библиотеку
                  </button>
                </div>
              </div>

              <div className="hidden shrink-0 md:block">
                {currentOrLatestTrack ? (
                  <TrackCover title={currentOrLatestTrack.title} coverPath={currentOrLatestTrack.cover_path} className="h-36 w-36 rounded-3xl shadow-2xl shadow-black/40" />
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center rounded-3xl bg-white/5 text-sm text-[#9f9f9f]">Нет обложки</div>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.article>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.25fr)_360px]">
        <motion.div className="self-start" {...getScaleInMotion(0.1)}>
          <GlassCard className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Последние загрузки</h3>
              <button onClick={() => onNavigate('library')} className="text-xs text-[#9f9f9f] transition hover:text-white">
                Вся библиотека
              </button>
            </div>

            <div className="space-y-2.5">
              {recentTracks.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-[#9f9f9f]">
                  Пока нет скачанных треков. Начните с раздела «Скачать».
                </div>
              ) : (
                recentTracks.map((track) => <TrackCard key={track.id} track={track} onClick={() => onPlayTrack(track)} hoverProps={getHoverLift()} />)
              )}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div {...getScaleInMotion(0.14)}>
          <GlassCard className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Быстрые действия</h3>
              <span className="text-xs text-[#8f8f8f]">Навигация</span>
            </div>
            <div className="space-y-2.5">
              {[
                { title: 'Скачать по URL', text: 'Добавить новый трек из SoundCloud', page: 'download' as const },
                { title: 'Открыть библиотеку', text: 'Все локальные треки в одном месте', page: 'library' as const },
                { title: 'Плейлисты', text: 'Собирайте свои подборки', page: 'playlists' as const }
              ].map((item) => (
                <motion.button
                  key={item.title}
                  onClick={() => onNavigate(item.page)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left"
                  {...getHoverLift()}
                >
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-[#9f9f9f]">{item.text}</p>
                </motion.button>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </section>
    </motion.div>
  );
}
