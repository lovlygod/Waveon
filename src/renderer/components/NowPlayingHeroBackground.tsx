import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useAudioVisualizerStore } from '@/store/audio-visualizer.store';

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

interface WaveState {
  top: number;
  left: number;
  width: number;
  height: number;
  rotate: number;
  opacity: number;
  colorA: string;
  colorB: string;
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
  const rawBassLevel = useAudioVisualizerStore((state) => state.bassLevel);
  const rawEnergyLevel = useAudioVisualizerStore((state) => state.energyLevel);
  const [time, setTime] = useState(0);
  const [smoothedLevels, setSmoothedLevels] = useState({ bass: 0, energy: 0 });
  const [bassBurst, setBassBurst] = useState(0);
  const [bassBurstPoint, setBassBurstPoint] = useState({ x: 50, y: 50, hue: 255 });
  const frameRef = useRef<number | null>(null);
  const smoothFrameRef = useRef<number | null>(null);
  const lastBurstAtRef = useRef(0);
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

  useEffect(() => {
    const targetBass = rawBassLevel;
    const targetEnergy = rawEnergyLevel;

    const tick = () => {
      setSmoothedLevels((prev) => {
        const nextBass = prev.bass + (targetBass - prev.bass) * 0.08;
        const nextEnergy = prev.energy + (targetEnergy - prev.energy) * 0.07;
        return {
          bass: Math.max(0, Math.min(1, nextBass)),
          energy: Math.max(0, Math.min(1, nextEnergy))
        };
      });

      smoothFrameRef.current = requestAnimationFrame(tick);
    };

    if (smoothFrameRef.current !== null) {
      cancelAnimationFrame(smoothFrameRef.current);
    }
    smoothFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (smoothFrameRef.current !== null) {
        cancelAnimationFrame(smoothFrameRef.current);
        smoothFrameRef.current = null;
      }
    };
  }, [rawBassLevel, rawEnergyLevel]);

  useEffect(() => {
    const now = performance.now();
    const bassDelta = rawBassLevel - smoothedLevels.bass;
    const adaptiveThreshold = 0.36 + smoothedLevels.energy * 0.12;
    const isStrongBassHit = rawBassLevel > adaptiveThreshold && bassDelta > 0.012;

    if (isStrongBassHit && now - lastBurstAtRef.current > 90) {
      const intensity = Math.min(1, Math.max(0, (rawBassLevel - adaptiveThreshold) / Math.max(0.12, 1 - adaptiveThreshold)));
      const t = time + seed * 0.013 + now * 0.00035;
      const x = 14 + (((Math.sin(t * 1.9) + 1) / 2) * 72);
      const y = 16 + (((Math.cos(t * 1.45 + 0.7) + 1) / 2) * 66);
      const hue = 210 + (((Math.sin(t * 1.7) + 1) / 2) * 90);

      const burstStrength = 0.22 + intensity * 1.08;
      setBassBurst((prev) => Math.max(prev, burstStrength));
      setBassBurstPoint({ x, y, hue });
      lastBurstAtRef.current = now;
      return;
    }

    setBassBurst((prev) => {
      if (prev <= 0.001) return 0;
      return prev * 0.915;
    });
  }, [rawBassLevel, seed, smoothedLevels.bass, smoothedLevels.energy, time]);

  const blobs = useMemo<BlobState[]>(() => {
    const base = time + seed * 0.017;
    const pulseA = (Math.sin(base * (1.35 + smoothedLevels.bass * 0.4)) + 1) / 2;
    const pulseB = (Math.cos(base * (1.1 + smoothedLevels.energy * 0.35) + seed * 0.03) + 1) / 2;
    const bassBoost = smoothedLevels.bass * 1.2;
    const energyBoost = smoothedLevels.energy * 0.75;

    return [
      {
        x: 12 + Math.sin(base * 0.9) * 11,
        y: 18 + Math.cos(base * 0.72) * 12,
        size: 38 + Math.sin(base * 0.8) * 4 + pulseA * (6 + bassBoost * 5),
        opacity: 0.26 + bassBoost * 0.1,
        color: `rgba(109,92,255,${0.44 + bassBoost * 0.14})`
      },
      {
        x: 24 + Math.cos(base * 0.72) * 11,
        y: 72 + Math.sin(base * 0.86) * 8,
        size: 30 + Math.cos(base * 1.2) * 3.5 + pulseB * (4 + energyBoost * 4),
        opacity: 0.17 + energyBoost * 0.11,
        color: `rgba(168,85,247,${0.32 + energyBoost * 0.12})`
      },
      {
        x: 50 + Math.sin(base * 0.68) * 9,
        y: 30 + Math.cos(base * 0.95) * 6,
        size: 34 + Math.sin(base * 1.35) * 3 + pulseA * (3.2 + bassBoost * 3.2),
        opacity: 0.2 + energyBoost * 0.1,
        color: `rgba(59,130,246,${0.32 + energyBoost * 0.11})`
      },
      {
        x: 72 + Math.cos(base * 0.62) * 9,
        y: 66 + Math.sin(base * 0.78) * 7,
        size: 32 + Math.cos(base * 1.3) * 3 + pulseB * (2.8 + energyBoost * 3),
        opacity: 0.16 + energyBoost * 0.1,
        color: `rgba(236,72,153,${0.26 + energyBoost * 0.1})`
      },
      {
        x: 86 + Math.sin(base * 0.92) * 6,
        y: 24 + Math.cos(base * 0.88) * 6,
        size: 28 + Math.sin(base * 1.5) * 2.5 + pulseA * (2.5 + bassBoost * 2.5),
        opacity: 0.16 + bassBoost * 0.09,
        color: `rgba(6,182,212,${0.24 + bassBoost * 0.1})`
      }
    ];
  }, [seed, smoothedLevels.bass, smoothedLevels.energy, time]);

  const waves = useMemo<WaveState[]>(() => {
    const base = time + seed * 0.011;
    const drive = 0.35 + smoothedLevels.energy * 0.45 + smoothedLevels.bass * 0.35;

    return [
      {
        top: 42 + Math.sin(base * 0.26) * 3,
        left: 48 + Math.cos(base * 0.23) * 2,
        width: 134 + drive * 16,
        height: 58 + drive * 10,
        rotate: -11 + Math.sin(base * 0.31) * 2,
        opacity: 0.2 + smoothedLevels.energy * 0.08,
        colorA: 'rgba(99,102,241,0.24)',
        colorB: 'rgba(59,130,246,0.02)'
      },
      {
        top: 56 + Math.cos(base * 0.19) * 3,
        left: 44 + Math.sin(base * 0.21) * 3,
        width: 148 + drive * 14,
        height: 64 + drive * 11,
        rotate: 7 + Math.cos(base * 0.27) * 1.8,
        opacity: 0.16 + smoothedLevels.bass * 0.07,
        colorA: 'rgba(192,132,252,0.22)',
        colorB: 'rgba(244,114,182,0.02)'
      }
    ];
  }, [seed, smoothedLevels.bass, smoothedLevels.energy, time]);


  const glowOpacity = useMemo(
    () => 0.08 + smoothedLevels.bass * 0.14 + smoothedLevels.energy * 0.1,
    [smoothedLevels.bass, smoothedLevels.energy]
  );

  const parallaxShiftX = useMemo(() => Math.sin(time * 0.12 + seed * 0.01) * (4 + smoothedLevels.energy * 6), [seed, smoothedLevels.energy, time]);
  const parallaxShiftY = useMemo(() => Math.cos(time * 0.1 + seed * 0.01) * (3 + smoothedLevels.bass * 5), [seed, smoothedLevels.bass, time]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, rgba(109,92,255,${0.06 + smoothedLevels.bass * 0.08}), transparent 44%)`
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 78% at 20% 20%, rgba(99,102,241,${0.12 + smoothedLevels.energy * 0.06}) 0%, transparent 52%), radial-gradient(95% 72% at 85% 24%, rgba(236,72,153,${0.09 + smoothedLevels.bass * 0.06}) 0%, transparent 55%)`
        }}
      />
      {waves.map((wave, index) => (
        <div
          key={`wave-${seed}-${index}`}
          className="absolute rounded-[999px] blur-[38px]"
          style={{
            top: `${wave.top}%`,
            left: `${wave.left}%`,
            width: `${wave.width}%`,
            height: `${wave.height}%`,
            opacity: wave.opacity,
            background: `linear-gradient(90deg, ${wave.colorA} 0%, ${wave.colorB} 100%)`,
            transform: `translate(-50%, -50%) rotate(${wave.rotate}deg) translate(${parallaxShiftX * (index === 0 ? 0.5 : 0.35)}px, ${parallaxShiftY * (index === 0 ? 0.55 : 0.4)}px)`
          }}
        />
      ))}
      <div
        className="absolute -bottom-6 left-1/2 h-[42%] w-[125%] -translate-x-1/2 rounded-[100%] blur-[55px]"
        style={{
          background: `conic-gradient(from ${220 + Math.sin(time * 0.14) * 18}deg at 50% 50%, rgba(59,130,246,${0.18 + smoothedLevels.energy * 0.1}), rgba(56,189,248,${0.17 + smoothedLevels.bass * 0.1}), rgba(14,165,233,${0.16 + smoothedLevels.energy * 0.09}), rgba(37,99,235,${0.17 + smoothedLevels.energy * 0.1}), rgba(79,70,229,${0.18 + smoothedLevels.bass * 0.1}), rgba(99,102,241,${0.18 + smoothedLevels.energy * 0.1}), rgba(129,140,248,${0.17 + smoothedLevels.bass * 0.09}), rgba(139,92,246,${0.17 + smoothedLevels.energy * 0.09}), rgba(167,139,250,${0.16 + smoothedLevels.bass * 0.09}), rgba(168,85,247,${0.18 + smoothedLevels.energy * 0.1}), rgba(192,132,252,${0.16 + smoothedLevels.bass * 0.08}), rgba(236,72,153,${0.15 + smoothedLevels.energy * 0.08}), rgba(244,114,182,${0.14 + smoothedLevels.bass * 0.08}), rgba(59,130,246,${0.18 + smoothedLevels.energy * 0.1}))`
        }}
      />
      <div
        className="absolute rounded-full blur-[38px]"
        style={{
          width: `${13 + bassBurst * 28}rem`,
          height: `${13 + bassBurst * 28}rem`,
          opacity: 0.1 + bassBurst * 0.28,
          background: `radial-gradient(circle, hsla(${bassBurstPoint.hue}, 98%, 70%, ${0.24 + bassBurst * 0.34}) 0%, hsla(${(bassBurstPoint.hue + 18) % 360}, 95%, 64%, ${0.18 + bassBurst * 0.24}) 30%, hsla(${(bassBurstPoint.hue + 36) % 360}, 92%, 60%, ${0.14 + bassBurst * 0.2}) 50%, hsla(${(bassBurstPoint.hue + 54) % 360}, 90%, 56%, ${0.1 + bassBurst * 0.16}) 66%, transparent 80%)`,
          left: `${bassBurstPoint.x}%`,
          top: `${bassBurstPoint.y}%`,
          transform: `translate(-50%, -50%) scale(${1 + bassBurst * 0.22})`
        }}
      />
      <div
        className="absolute -inset-10 blur-[90px]"
        style={{
          background: `radial-gradient(circle at 40% 50%, rgba(124, 58, 237, ${glowOpacity}) 0%, rgba(59,130,246,${glowOpacity * 0.62}) 40%, transparent 74%)`,
          transform: `translate(${parallaxShiftX * 0.45}px, ${parallaxShiftY * 0.45}px)`
        }}
      />
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
