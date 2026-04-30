import { Download, FolderKanban, Home, Library, Settings } from 'lucide-react';
import type { AppPage } from '@shared/app-types';

export interface NavigationItem {
  id: AppPage;
  label: string;
  icon: typeof Home;
}

export const navigationItems: NavigationItem[] = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'download', label: 'Скачать', icon: Download },
  { id: 'library', label: 'Библиотека', icon: Library },
  { id: 'playlists', label: 'Плейлисты', icon: FolderKanban },
  { id: 'settings', label: 'Настройки', icon: Settings }
];

export const pageTitles: Record<AppPage, string> = {
  home: 'Главная',
  download: 'Скачать',
  library: 'Библиотека',
  playlists: 'Плейлисты',
  favorites: 'Избранное',
  settings: 'Настройки'
};
