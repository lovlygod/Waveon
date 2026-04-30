import type { CSSProperties, PropsWithChildren, ReactElement } from 'react';
import { Square, X } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { BottomPlayer } from '@/components/BottomPlayer';
import logo from '@/../assets/logo.svg';

export function AppLayout({ children }: PropsWithChildren): ReactElement {
  async function handleMinimize(): Promise<void> {
    await window.waveon.windowControls.minimize();
  }

  async function handleToggleMaximize(): Promise<void> {
    await window.waveon.windowControls.toggleMaximize();
  }

  async function handleClose(): Promise<void> {
    await window.waveon.windowControls.close();
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#121212] text-white">
      <header
        className="sticky top-0 z-50 flex h-10 shrink-0 items-center justify-between border-b border-transparent bg-[#0f0f0f] pl-3 pr-1"
        style={{ WebkitAppRegion: 'drag' } as CSSProperties}
      >
        <div className="flex items-center gap-2">
          <img src={logo} alt="Waveon" className="h-5 w-5" />
          <span className="text-xs font-semibold tracking-wide text-[#cfcfcf]">Waveon Beta</span>
        </div>

        <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}>
          <button
            onClick={() => void handleMinimize()}
            className="flex h-8 w-10 items-center justify-center rounded-sm text-[#c8c8c8] transition hover:bg-white/10 hover:text-white"
            aria-label="Minimize"
          >
            <span className="h-px w-3 bg-current" />
          </button>
          <button
            onClick={() => void handleToggleMaximize()}
            className="mx-0.5 flex h-8 w-10 items-center justify-center rounded-sm text-[#c8c8c8] transition hover:bg-white/10 hover:text-white"
            aria-label="Maximize"
          >
            <Square size={13} />
          </button>
          <button
            onClick={() => void handleClose()}
            className="flex h-8 w-10 items-center justify-center rounded-sm text-[#ffb4b4] transition hover:bg-[#c42b1c] hover:text-white"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 overflow-auto py-6 pr-4 pl-0 pb-32">{children}</main>
        </div>
      </div>
      <BottomPlayer />
    </div>
  );
}
