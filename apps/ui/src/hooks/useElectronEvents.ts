import { useEffect, useCallback } from 'react';

interface ElectronEventHandlers {
  onOpenFolder?: (folderPath: string) => void;
  onOpenFiles?: (filePaths: string[]) => void;
  onExport?: () => void;
  onSearch?: () => void;
  onZoomToFit?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLayout?: (algorithm: string) => void;
  onToggleSidePanel?: () => void;
  onWindowStateChanged?: (state: { isMaximized?: boolean; isFullScreen?: boolean }) => void;
  onThemeChanged?: (theme: 'dark' | 'light') => void;
}

/**
 * Hook for handling Electron menu events and IPC communication
 * Sets up listeners for menu actions triggered from the native application menu
 */
export function useElectronEvents(handlers: ElectronEventHandlers) {
  useEffect(() => {
    // Check if we're running in Electron
    if (!window.electron) return;

    const cleanupFunctions: (() => void)[] = [];

    // Set up menu event listeners
    if (handlers.onOpenFolder && window.electron.onMenuOpenFolder) {
      const cleanup = window.electron.onMenuOpenFolder(handlers.onOpenFolder);
      cleanupFunctions.push(cleanup);
    }

    if (handlers.onOpenFiles && window.electron.onMenuOpenFiles) {
      const cleanup = window.electron.onMenuOpenFiles(handlers.onOpenFiles);
      cleanupFunctions.push(cleanup);
    }

    if (handlers.onExport && window.electron.onMenuExport) {
      const cleanup = window.electron.onMenuExport(handlers.onExport);
      cleanupFunctions.push(cleanup);
    }

    if (handlers.onSearch && window.electron.onMenuSearch) {
      const cleanup = window.electron.onMenuSearch(handlers.onSearch);
      cleanupFunctions.push(cleanup);
    }

    if (handlers.onZoomToFit && window.electron.onMenuZoomToFit) {
      const cleanup = window.electron.onMenuZoomToFit(handlers.onZoomToFit);
      cleanupFunctions.push(cleanup);
    }

    if (handlers.onZoomIn && window.electron.onMenuZoomIn) {
      const cleanup = window.electron.onMenuZoomIn(handlers.onZoomIn);
      cleanupFunctions.push(cleanup);
    }

    if (handlers.onZoomOut && window.electron.onMenuZoomOut) {
      const cleanup = window.electron.onMenuZoomOut(handlers.onZoomOut);
      cleanupFunctions.push(cleanup);
    }

    if (handlers.onLayout && window.electron.onMenuLayout) {
      const cleanup = window.electron.onMenuLayout(handlers.onLayout);
      cleanupFunctions.push(cleanup);
    }

    if (handlers.onToggleSidePanel && window.electron.onMenuToggleSidePanel) {
      const cleanup = window.electron.onMenuToggleSidePanel(handlers.onToggleSidePanel);
      cleanupFunctions.push(cleanup);
    }

    if (handlers.onWindowStateChanged && window.electron.onWindowStateChanged) {
      const cleanup = window.electron.onWindowStateChanged(handlers.onWindowStateChanged);
      cleanupFunctions.push(cleanup);
    }

    if (handlers.onThemeChanged && window.electron.onThemeChanged) {
      const cleanup = window.electron.onThemeChanged(handlers.onThemeChanged);
      cleanupFunctions.push(cleanup);
    }

    // Cleanup all listeners on unmount
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [handlers]);
}

/**
 * Hook for checking if running in Electron environment
 */
export function useIsElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electron;
}

/**
 * Hook for getting platform information
 */
export function usePlatform() {
  const getPlatform = useCallback(async (): Promise<string> => {
    if (window.electron?.getPlatform) {
      return await window.electron.getPlatform();
    }
    // Fallback to navigator
    if (typeof navigator !== 'undefined') {
      if (navigator.platform.includes('Mac')) return 'darwin';
      if (navigator.platform.includes('Win')) return 'win32';
      return 'linux';
    }
    return 'unknown';
  }, []);

  return { getPlatform };
}

/**
 * Hook for window controls (minimize, maximize, close)
 */
export function useWindowControls() {
  const minimize = useCallback(async () => {
    if (window.electron?.minimizeWindow) {
      await window.electron.minimizeWindow();
    }
  }, []);

  const maximize = useCallback(async () => {
    if (window.electron?.maximizeWindow) {
      await window.electron.maximizeWindow();
    }
  }, []);

  const close = useCallback(async () => {
    if (window.electron?.closeWindow) {
      await window.electron.closeWindow();
    }
  }, []);

  const isMaximized = useCallback(async (): Promise<boolean> => {
    if (window.electron?.isMaximized) {
      return await window.electron.isMaximized();
    }
    return false;
  }, []);

  const isFullScreen = useCallback(async (): Promise<boolean> => {
    if (window.electron?.isFullScreen) {
      return await window.electron.isFullScreen();
    }
    return false;
  }, []);

  return { minimize, maximize, close, isMaximized, isFullScreen };
}

export default useElectronEvents;
