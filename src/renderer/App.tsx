import type { ReactElement } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { MainContent } from './pages/MainContent';

export function App(): ReactElement {
  return (
    <AppLayout>
      <MainContent />
    </AppLayout>
  );
}
