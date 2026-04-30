import { useCallback, useState, type ReactElement } from 'react';
import { pageTitles } from '@/constants/navigation';
import { useDownload } from '@/hooks/useDownload';
import { usePlayer } from '@/hooks/usePlayer';
import { usePlaylistImport } from '@/hooks/usePlaylistImport';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useTracks } from '@/hooks/useTracks';
import { useUiStore } from '@/store/ui.store';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContentShell } from '@/components/layout/ContentShell';
import { EmptyState } from '@/components/common/EmptyState';
import { CreatePlaylistDialog } from '@/components/playlists/CreatePlaylistDialog';
import { ImportPlaylistDialog } from '@/components/playlists/ImportPlaylistDialog';
import { RenamePlaylistDialog } from '@/components/playlists/RenamePlaylistDialog';
import { DownloadPage } from '@/pages/DownloadPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { HomePage } from '@/pages/HomePage';
import { LibraryPage } from '@/pages/LibraryPage';
import { PlaylistDetailPage } from '@/pages/PlaylistDetailPage';
import { PlaylistsPage } from '@/pages/PlaylistsPage';
import { SettingsPage } from '@/pages/SettingsPage';

export function MainContent(): ReactElement {
  const {
    activePage,
    setActivePage,
    animationsEnabled,
    setAnimationsEnabled,
    confirmBeforeDelete,
    setConfirmBeforeDelete,
    compactMode,
    setCompactMode
  } = useUiStore();

  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isRenamePlaylistOpen, setIsRenamePlaylistOpen] = useState(false);

  const shouldAnimate = animationsEnabled;
  const tracksState = useTracks(activePage === 'home' || activePage === 'library' || activePage === 'playlists');
  const playlistsState = usePlaylists(activePage === 'home' || activePage === 'playlists');
  const handlePlaylistImported = useCallback(async (result: { playlistId: number }) => {
    await tracksState.reloadTracks();
    const updated = await playlistsState.reloadPlaylists();
    playlistsState.setSelectedPlaylist(updated.find((item) => item.id === result.playlistId) ?? null);
  }, [playlistsState, tracksState]);
  const playlistImport = usePlaylistImport({ onImported: handlePlaylistImported });
  const player = usePlayer({ tracks: tracksState.tracks, playlistTracks: playlistsState.playlistTracks });
  const download = useDownload({
    onDownloaded: async () => {
      await tracksState.reloadTracks();
    }
  });

  function getRevealMotion(delay = 0, y = 18) {
    if (!shouldAnimate) return {};

    return {
      initial: { opacity: 0, y },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as const }
    };
  }

  function getScaleInMotion(delay = 0) {
    if (!shouldAnimate) return {};

    return {
      initial: { opacity: 0, scale: 0.96 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] as const }
    };
  }

  function getHoverLift() {
    if (!shouldAnimate) return {};

    return {
      whileHover: { y: -2, scale: 1.01 },
      transition: { duration: 0.2 }
    };
  }

  let pageContent: ReactElement;

  if (activePage === 'home') {
    pageContent = (
      <HomePage
        tracks={tracksState.tracks}
        currentTrack={player.currentTrack}
        isPlaying={player.isPlaying}
        onPlayTrack={player.playLibraryTrack}
        onNavigate={setActivePage}
        getRevealMotion={getRevealMotion}
        getScaleInMotion={getScaleInMotion}
        getHoverLift={getHoverLift}
      />
    );
  } else if (activePage === 'download') {
    pageContent = (
      <DownloadPage
        url={download.url}
        preview={download.preview}
        isPreviewLoading={download.isPreviewLoading}
        isDownloadLoading={download.isDownloadLoading}
        downloadProgress={download.downloadProgress}
        onChangeUrl={download.setUrl}
        onSubmit={download.handleGetPreview}
        onDownload={download.handleDownload}
        getRevealMotion={getRevealMotion}
      />
    );
  } else if (activePage === 'library') {
    pageContent = (
      <LibraryPage
        tracks={tracksState.tracks}
        isLoadingTracks={tracksState.isLoadingTracks}
        currentTrack={player.currentTrack}
        isPlaying={player.isPlaying}
        compactMode={compactMode}
        onRefresh={tracksState.reloadTracks}
        onToggleTrack={player.toggleLibraryTrack}
        onPlayTrack={player.playLibraryTrack}
        onDeleteTrack={tracksState.deleteTrack}
        getRevealMotion={getRevealMotion}
        getHoverLift={getHoverLift}
      />
    );
  } else if (activePage === 'playlists') {
    pageContent = playlistsState.selectedPlaylist ? (
      <PlaylistDetailPage
        playlist={playlistsState.selectedPlaylist}
        playlistTracks={playlistsState.playlistTracks}
        tracks={tracksState.tracks}
        currentTrack={player.currentTrack}
        isPlaying={player.isPlaying}
        compactMode={compactMode}
        onBack={playlistsState.clearSelectedPlaylist}
        onRename={() => setIsRenamePlaylistOpen(true)}
        onDelete={playlistsState.deletePlaylist}
        onAddTracks={(trackIds) => playlistsState.addTracksToPlaylist(playlistsState.selectedPlaylist!.id, trackIds)}
        onToggleTrack={player.togglePlaylistTrack}
        onPlayTrack={player.playPlaylistTrack}
        onRemoveTrack={(track) => playlistsState.removeTrackFromPlaylist(track.playlist_id, track.id)}
        getScaleInMotion={getScaleInMotion}
        getHoverLift={getHoverLift}
      />
    ) : (
      <PlaylistsPage
        playlists={playlistsState.playlists}
        isLoadingPlaylists={playlistsState.isLoadingPlaylists}
        onCreate={() => setIsCreatePlaylistOpen(true)}
        onImport={() => {
          playlistImport.resetImport();
          playlistImport.setDialogOpen(true);
        }}
        onSelect={playlistsState.setSelectedPlaylist}
        getRevealMotion={getRevealMotion}
        getHoverLift={getHoverLift}
      />
    );
  } else if (activePage === 'favorites') {
    pageContent = <FavoritesPage />;
  } else if (activePage === 'settings') {
    pageContent = (
      <SettingsPage
        animationsEnabled={animationsEnabled}
        confirmBeforeDelete={confirmBeforeDelete}
        compactMode={compactMode}
        setAnimationsEnabled={setAnimationsEnabled}
        setConfirmBeforeDelete={setConfirmBeforeDelete}
        setCompactMode={setCompactMode}
        getRevealMotion={getRevealMotion}
        getScaleInMotion={getScaleInMotion}
      />
    );
  } else {
    pageContent = <EmptyState title="Раздел находится в каркасе и готов для наполнения логикой." />;
  }

  return (
    <ContentShell>
      <PageHeader title={pageTitles[activePage]} />
      {pageContent}

      <CreatePlaylistDialog
        open={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onCreate={playlistsState.createPlaylist}
      />

      <ImportPlaylistDialog
        open={playlistImport.isDialogOpen}
        isImporting={playlistImport.isImporting}
        progress={playlistImport.progress}
        onClose={() => {
          playlistImport.setDialogOpen(false);
          playlistImport.resetImport();
        }}
        onHide={() => playlistImport.setDialogOpen(false)}
        onImport={async (url) => {
          await playlistImport.importPlaylistFromUrl(url);
        }}
      />

      <RenamePlaylistDialog
        open={isRenamePlaylistOpen}
        playlist={playlistsState.selectedPlaylist}
        onClose={() => setIsRenamePlaylistOpen(false)}
        onRename={playlistsState.renamePlaylist}
      />
    </ContentShell>
  );
}
