import type { ReactElement } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Отмена',
  onConfirm,
  onCancel,
  danger = false
}: ConfirmDialogProps): ReactElement | null {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#181818] p-5 shadow-2xl shadow-black/40">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-[#9f9f9f]">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={danger ? 'rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300' : 'rounded-2xl bg-[#6d5cff] px-4 py-2 text-sm font-medium text-white'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
