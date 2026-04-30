import { create } from 'zustand';
import type { PlaylistImportProgressPayload, PlaylistImportResult } from '@shared/app-types';

interface PlaylistImportState {
  isImporting: boolean;
  isDialogOpen: boolean;
  progress: PlaylistImportProgressPayload | null;
  result: PlaylistImportResult | null;
  setIsImporting: (isImporting: boolean) => void;
  setDialogOpen: (isDialogOpen: boolean) => void;
  setProgress: (progress: PlaylistImportProgressPayload | null) => void;
  setResult: (result: PlaylistImportResult | null) => void;
  resetImport: () => void;
}

export const usePlaylistImportStore = create<PlaylistImportState>((set) => ({
  isImporting: false,
  isDialogOpen: false,
  progress: null,
  result: null,
  setIsImporting: (isImporting) => set({ isImporting }),
  setDialogOpen: (isDialogOpen) => set({ isDialogOpen }),
  setProgress: (progress) => set({ progress }),
  setResult: (result) => set({ result }),
  resetImport: () => set({ progress: null, result: null })
}));
