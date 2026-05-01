import { SkipBack, Play, SkipForward, Volume2, VolumeX, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { usePlayerStore } from '@/store/player.store';
import { useAudioVisualizerStore } from '@/store/audio-visualizer.store';
import { DragSlider } from './DragSlider';
import { formatTime } from '@/lib/formatTime';
import { fileUrl } from '@/lib/fileUrl';
import { TrackCover } from '@/components/music/TrackCover';

export function BottomPlayer(): ReactElement {
  const { currentTrack, isPlaying, setIsPlaying, playNext, playPrev } = usePlayerStore();
  const setVisualizerLevels = useAudioVisualizerStore((state) => state.setLevels);
  const resetVisualizer = useAudioVisualizerStore((state) => state.reset);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isSeeking, setIsSeeking] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<number | null>(null);

  const displayPosition = isSeeking && previewPosition !== null ? previewPosition : position;

  const progress = useMemo(() => {
    if (!duration) return 0;
    return Math.min(100, Math.max(0, (displayPosition / duration) * 100));
  }, [displayPosition, duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack?.file_path) {
      const src = fileUrl(currentTrack.file_path);
      if (audio.src !== src) {
        audio.src = src;
        audio.load();
        setPosition(0);
        setDuration(0);
        setPreviewPosition(null);
      }
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
      setPreviewPosition(null);
    }
  }, [currentTrack?.file_path, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlaying || !currentTrack) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      resetVisualizer();
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const context = audioContextRef.current;

    if (context.state === 'suspended') {
      void context.resume();
    }

    if (!sourceNodeRef.current) {
      sourceNodeRef.current = context.createMediaElementSource(audio);
      sourceNodeRef.current.connect(context.destination);
    }

    if (!analyserRef.current) {
      analyserRef.current = context.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.78;
      sourceNodeRef.current.connect(analyserRef.current);
    }

    const analyser = analyserRef.current;
    const bins = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(bins);

      const bassBandEnd = Math.max(6, Math.floor(bins.length * 0.11));
      let bassSum = 0;
      for (let i = 0; i < bassBandEnd; i += 1) bassSum += bins[i];
      const bassLevel = bassSum / (bassBandEnd * 255);

      let allSum = 0;
      for (let i = 0; i < bins.length; i += 1) allSum += bins[i];
      const energyLevel = allSum / (bins.length * 255);

      setVisualizerLevels({ bassLevel, energyLevel });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [currentTrack, isPlaying, resetVisualizer, setVisualizerLevels]);

  function togglePlay(): void {
    if (!currentTrack) return;
    setIsPlaying(!isPlaying);
  }

  function handleSeek(next: number): void {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(next)) return;
    audio.currentTime = next;
    setPosition(next);
  }

  function startSeek(next: number): void {
    setIsSeeking(true);
    setPreviewPosition(next);
  }

  function endSeek(next: number): void {
    handleSeek(next);
    setIsSeeking(false);
    setPreviewPosition(null);
  }

  function handleVolumeInput(value: number): void {
    if (!Number.isFinite(value)) return;
    setVolume(value);
  }

  return (
    <footer className="fixed bottom-4 left-[288px] right-4 z-40 bg-transparent p-0">
      <audio
        ref={audioRef}
        onError={() => setIsPlaying(false)}
        onTimeUpdate={(event) => {
          if (isSeeking) return;
          setPosition(event.currentTarget.currentTime);
        }}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onEnded={() => playNext()}
      />

      <div className="grid h-24 w-full grid-cols-[1fr_auto_1fr] items-center rounded-[32px] border border-white/10 bg-[#181818]/20 px-6 shadow-[0_18px_40px_rgba(0,0,0,0.10)] backdrop-blur-2xl">
        <div className="flex min-w-0 items-center gap-3 justify-self-start">
          <TrackCover title={currentTrack?.title ?? 'Ничего не выбрано'} coverPath={currentTrack?.cover_path} className="h-12 w-12 rounded-2xl" />
          <div className="min-w-0">
            <div className="truncate text-sm text-white">{currentTrack ? currentTrack.title : 'Ничего не выбрано'}</div>
            <div className="truncate text-xs text-[#9f9f9f]">{currentTrack ? currentTrack.artist : ''}</div>
          </div>
        </div>

        <div className="flex w-[560px] flex-col items-center gap-2 justify-self-center">
          <div className="flex items-center gap-4 text-[#9f9f9f]">
            <button onClick={playPrev} className="hover:text-white"><SkipBack size={18} /></button>
            <motion.button
              onClick={togglePlay}
              whileTap={{ scale: 0.95 }}
              className="rounded-[20px] bg-white p-2 text-black"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </motion.button>
            <button onClick={playNext} className="hover:text-white"><SkipForward size={18} /></button>
          </div>
          <div className="flex w-full items-center gap-2 text-xs text-[#9f9f9f]">
            <span>{formatTime(displayPosition)}</span>
            <div className="relative flex-1">
              <DragSlider
                value={displayPosition}
                max={Math.max(duration, 0.0001)}
                onChange={(next) => {
                  if (!isSeeking) {
                    startSeek(next);
                    return;
                  }

                  setPreviewPosition(next);
                }}
                onCommit={endSeek}
                fillClassName="bg-gradient-to-r from-[#6d5cff] to-[#8a7cff]"
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-self-end gap-2 text-[#9f9f9f]">
          {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          <div className="relative w-24">
            <DragSlider value={volume} max={100} onChange={handleVolumeInput} fillClassName="bg-white" showThumb={false} />
          </div>
        </div>
      </div>
    </footer>
  );
}
