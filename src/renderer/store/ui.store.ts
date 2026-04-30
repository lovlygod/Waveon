import { create } from 'zustand';
import type { AppPage, Theme } from '@shared/app-types';

const STORAGE_KEY = 'waveon-ui-store';

interface PersistedUiState {
  animationsEnabled?: boolean;
  confirmBeforeDelete?: boolean;
  compactMode?: boolean;
}

function loadPersistedUiState(): PersistedUiState {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as { state?: PersistedUiState };
    return parsed.state ?? {};
  } catch {
    return {};
  }
}

function loadAnimationsEnabled(): boolean {
  return loadPersistedUiState().animationsEnabled ?? true;
}

function loadConfirmBeforeDelete(): boolean {
  return loadPersistedUiState().confirmBeforeDelete ?? true;
}

function loadCompactMode(): boolean {
  return loadPersistedUiState().compactMode ?? false;
}

function persistUiState(partial: PersistedUiState): void {
  if (typeof window === 'undefined') return;

  try {
    const previous = loadPersistedUiState();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          ...previous,
          ...partial
        }
      })
    );
  } catch {
    // ignore storage write errors
  }
}

interface UiState {
  activePage: AppPage;
  theme: Theme;
  animationsEnabled: boolean;
  confirmBeforeDelete: boolean;
  compactMode: boolean;
  setActivePage: (page: AppPage) => void;
  setTheme: (theme: Theme) => void;
  setAnimationsEnabled: (value: boolean) => void;
  setConfirmBeforeDelete: (value: boolean) => void;
  setCompactMode: (value: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activePage: 'home',
  theme: 'dark',
  animationsEnabled: loadAnimationsEnabled(),
  confirmBeforeDelete: loadConfirmBeforeDelete(),
  compactMode: loadCompactMode(),
  setActivePage: (activePage) => set({ activePage }),
  setTheme: (theme) => set({ theme }),
  setAnimationsEnabled: (animationsEnabled) => {
    persistUiState({ animationsEnabled });
    set({ animationsEnabled });
  },
  setConfirmBeforeDelete: (confirmBeforeDelete) => {
    persistUiState({ confirmBeforeDelete });
    set({ confirmBeforeDelete });
  },
  setCompactMode: (compactMode) => {
    persistUiState({ compactMode });
    set({ compactMode });
  }
}));
