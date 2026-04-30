import type { Playlist } from '@shared/app-types';
import type { ReactElement } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface DeletePlaylistDialogProps {
  open: boolean;
  playlist: Playlist | null;
  onClose: () => void;
  onConfirm: (playlist: Playlist) => Promise<void> | void;
}

export function DeletePlaylistDialog({ open, playlist, onClose, onConfirm }: DeletePlaylistDialogProps): ReactElement | null {
  if (!playlist) return null;

  return (
    <ConfirmDialog
      open={open}
      title="Удалить плейлист"
      description={`Плейлист «${playlist.name}» будет удален.`}
      confirmLabel="Удалить"
      onCancel={onClose}
      onConfirm={async () => {
        await onConfirm(playlist);
        onClose();
      }}
      danger
    />
  );
}
