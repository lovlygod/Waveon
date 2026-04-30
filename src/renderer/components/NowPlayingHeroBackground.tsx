import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';

interface NowPlayingHeroBackgroundProps {
  trackKey: string | number | null;
  isPlaying: boolean;
}

interface BlobState {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
}

function getSeed(input: string | number | null): number {
  if (input === null) return 1;
  const text = String(input);
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return (hash % 997) + 1;
}

export function NowPlayingHeroBackground({ trackKey, isPlaying }: NowPlayingHeroBackgroundProps): ReactElement {
  const seed = useMemo(() => getSeed(trackKey), [trackKey]);
  const [time, setTime] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    elapsedRef.current = 0;
    startedAtRef.current = null;
    setTime(0);
  }, [trackKey]);

  useEffect(() => {
    if (!isPlaying) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      startedAtRef.current = null;
      return;
    }

    const tick = (timestamp: number) => {
      if (startedAtRef.current === null) {
        startedAtRef.current = timestamp - elapsedRef.current;
      }

      elapsedRef.current = timestamp - startedAtRef.current;
      setTime(elapsedRef.current / 1000);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [isPlaying]);

  const blobs = useMemo<BlobState[]>(() => {
    const base = time + seed * 0.017;
    const pulseA = (Math.sin(base * 2.4) + 1) / 2;
    const pulseB = (Math.cos(base * 3.1 + seed * 0.03) + 1) / 2;

    return [
      {
        x: 12 + Math.sin(base * 0.9) * 11,
        y: 18 + Math.cos(base * 0.72) * 12,
        size: 34 + Math.sin(base * 1.8) * 5 + pulseA * 6,
        opacity: 0.46,
        color: 'rgba(109,92,255,0.72)'
      },
      {
        x: 28 + Math.cos(base * 1.02) * 14,
        y: 74 + Math.sin(base * 1.18) * 10,
        size: 24 + Math.cos(base * 2.1) * 3.5 + pulseB * 5,
        opacity: 0.3,
        color: 'rgba(168,85,247,0.54)'
      },
      {
        x: 50 + Math.sin(base * 1.1) * 12,
        y: 28 + Math.cos(base * 1.45) * 9,
        size: 28 + Math.sin(base * 2.7) * 4 + pulseA * 3.5,
        opacity: 0.34,
        color: 'rgba(59,130,246,0.52)'
      },
      {
        x: 70 + Math.cos(base * 0.88) * 13,
        y: 68 + Math.sin(base * 1.05) * 11,
        size: 30 + Math.cos(base * 2.2) * 3.5 + pulseB * 3.2,
        opacity: 0.28,
        color: 'rgba(236,72,153,0.48)'
      },
      {
        x: 88 + Math.sin(base * 1.36) * 8,
        y: 24 + Math.cos(base * 1.24) * 9,
        size: 22 + Math.sin(base * 3.1) * 3 + pulseA * 3,
        opacity: 0.28,
        color: 'rgba(6,182,212,0.48)'
      }
    ];
  }, [seed, time]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(109,92,255,0.1),transparent_38%)]" />
      {blobs.map((blob, index) => (
        <div
          key={`${seed}-${index}`}
          className="absolute rounded-full blur-[80px] will-change-transform"
          style={{
            left: `${blob.x}%`,
            top: `${blob.y}%`,
            width: `${blob.size}rem`,
            height: `${blob.size}rem`,
            opacity: blob.opacity,
            background: `radial-gradient(circle, ${blob.color} 0%, transparent 72%)`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}
    </div>
  );
}
