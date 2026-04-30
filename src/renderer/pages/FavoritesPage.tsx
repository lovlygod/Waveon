import type { ReactElement } from 'react';
import { EmptyState } from '@/components/common/EmptyState';

export function FavoritesPage(): ReactElement {
  return <EmptyState title="Избранное пока не настроено" description="Страница готова для будущей логики избранных треков." />;
}
