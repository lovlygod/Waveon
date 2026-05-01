import { create } from 'zustand';

interface AudioVisualizerState {
  bassLevel: number;
  energyLevel: number;
  setLevels: (payload: { bassLevel: number; energyLevel: number }) => void;
  reset: () => void;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export const useAudioVisualizerStore = create<AudioVisualizerState>((set) => ({
  bassLevel: 0,
  energyLevel: 0,
  setLevels: ({ bassLevel, energyLevel }) => set({
    bassLevel: clamp01(bassLevel),
    energyLevel: clamp01(energyLevel)
  }),
  reset: () => set({ bassLevel: 0, energyLevel: 0 })
}));

