import { create } from 'zustand';
import type { Playlist } from '@shared/app-types';

interface LibraryState {
  selectedPlaylist: Playlist | null;
  setSelectedPlaylist: (playlist: Playlist | null | ((current: Playlist | null) => Playlist | null)) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  selectedPlaylist: null,
  setSelectedPlaylist: (selectedPlaylist) =>
    set((state) => ({
      selectedPlaylist:
        typeof selectedPlaylist === 'function'
          ? selectedPlaylist(state.selectedPlaylist)
          : selectedPlaylist
    }))
}));
