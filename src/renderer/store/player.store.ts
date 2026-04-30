import { create } from 'zustand';
import type { QueueTrack } from '@shared/app-types';

interface PlayerState {
  queue: QueueTrack[];
  currentTrack: QueueTrack | null;
  isPlaying: boolean;
  setQueue: (tracks: QueueTrack[]) => void;
  playTrack: (track: QueueTrack) => void;
  playNext: () => void;
  playPrev: () => void;
  setIsPlaying: (value: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  queue: [],
  currentTrack: null,
  isPlaying: false,
  setQueue: (queue) => set({ queue }),
  playTrack: (currentTrack) => set({ currentTrack, isPlaying: true }),
  playNext: () =>
    set((state) => {
      if (!state.currentTrack || state.queue.length === 0) return state;
      const indexById = state.queue.findIndex((item) => item.id === state.currentTrack?.id);
      const indexByPath = state.queue.findIndex((item) => item.file_path === state.currentTrack?.file_path);
      const index = indexById >= 0 ? indexById : indexByPath;
      const safeIndex = index >= 0 ? index : 0;
      const next = state.queue[(safeIndex + 1) % state.queue.length] ?? state.currentTrack;
      return { currentTrack: next, isPlaying: true };
    }),
  playPrev: () =>
    set((state) => {
      if (!state.currentTrack || state.queue.length === 0) return state;
      const indexById = state.queue.findIndex((item) => item.id === state.currentTrack?.id);
      const indexByPath = state.queue.findIndex((item) => item.file_path === state.currentTrack?.file_path);
      const index = indexById >= 0 ? indexById : indexByPath;
      const safeIndex = index >= 0 ? index : 0;
      const prev = state.queue[(safeIndex - 1 + state.queue.length) % state.queue.length] ?? state.currentTrack;
      return { currentTrack: prev, isPlaying: true };
    }),
  setIsPlaying: (isPlaying) => set({ isPlaying })
}));
