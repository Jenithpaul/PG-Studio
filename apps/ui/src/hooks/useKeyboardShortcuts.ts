import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

// Detect if we're on macOS
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/**
 * Hook for managing keyboard shortcuts with OS-specific conventions
 * On macOS: Uses Cmd key
 * On Windows/Linux: Uses Ctrl key
 */
export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                         target.tagName === 'TEXTAREA' || 
                         target.isContentEditable;

    for (const shortcut of shortcutsRef.current) {
      if (shortcut.enabled === false) continue;

      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      
      // Handle modifier keys with OS-specific behavior
      // On Mac: meta (Cmd) is primary, ctrl is secondary
      // On Windows/Linux: ctrl is primary
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;
      const wantsModifier = shortcut.ctrl || shortcut.meta;
      const modifierMatches = wantsModifier ? modifierKey : !event.ctrlKey && !event.metaKey;
      
      const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatches = shortcut.alt ? event.altKey : !event.altKey;

      if (keyMatches && modifierMatches && shiftMatches && altMatches) {
        // Allow search shortcut even in input fields
        if (isInputField && shortcut.key !== 'f') {
          continue;
        }

        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        return;
      }
    }
  }, [enabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Return helper function to format shortcut display text
  const formatShortcut = useCallback((shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    
    if (shortcut.ctrl || shortcut.meta) {
      parts.push(isMac ? '⌘' : 'Ctrl');
    }
    if (shortcut.shift) {
      parts.push(isMac ? '⇧' : 'Shift');
    }
    if (shortcut.alt) {
      parts.push(isMac ? '⌥' : 'Alt');
    }
    
    // Format the key
    let keyDisplay = shortcut.key.toUpperCase();
    if (shortcut.key === ' ') keyDisplay = 'Space';
    if (shortcut.key === 'escape') keyDisplay = 'Esc';
    if (shortcut.key === 'enter') keyDisplay = '↵';
    if (shortcut.key === 'arrowup') keyDisplay = '↑';
    if (shortcut.key === 'arrowdown') keyDisplay = '↓';
    if (shortcut.key === 'arrowleft') keyDisplay = '←';
    if (shortcut.key === 'arrowright') keyDisplay = '→';
    
    parts.push(keyDisplay);
    
    return parts.join(isMac ? '' : '+');
  }, []);

  return { formatShortcut, isMac };
}

/**
 * Common shortcuts configuration
 */
export function createCommonShortcuts(handlers: {
  onSearch?: () => void;
  onExport?: () => void;
  onOpenFolder?: () => void;
  onOpenFiles?: () => void;
  onZoomToFit?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLayoutHierarchical?: () => void;
  onLayoutForceDirected?: () => void;
  onLayoutGrid?: () => void;
  onToggleSidePanel?: () => void;
  onEscape?: () => void;
}): KeyboardShortcut[] {
  return [
    {
      key: 'f',
      ctrl: true,
      action: handlers.onSearch || (() => {}),
      description: 'Search tables',
      enabled: !!handlers.onSearch
    },
    {
      key: 'e',
      ctrl: true,
      action: handlers.onExport || (() => {}),
      description: 'Export schema',
      enabled: !!handlers.onExport
    },
    {
      key: 'o',
      ctrl: true,
      action: handlers.onOpenFolder || (() => {}),
      description: 'Open folder',
      enabled: !!handlers.onOpenFolder
    },
    {
      key: 'o',
      ctrl: true,
      shift: true,
      action: handlers.onOpenFiles || (() => {}),
      description: 'Open SQL files',
      enabled: !!handlers.onOpenFiles
    },
    {
      key: '0',
      ctrl: true,
      action: handlers.onZoomToFit || (() => {}),
      description: 'Zoom to fit',
      enabled: !!handlers.onZoomToFit
    },
    {
      key: '=',
      ctrl: true,
      action: handlers.onZoomIn || (() => {}),
      description: 'Zoom in',
      enabled: !!handlers.onZoomIn
    },
    {
      key: '-',
      ctrl: true,
      action: handlers.onZoomOut || (() => {}),
      description: 'Zoom out',
      enabled: !!handlers.onZoomOut
    },
    {
      key: '1',
      ctrl: true,
      action: handlers.onLayoutHierarchical || (() => {}),
      description: 'Hierarchical layout',
      enabled: !!handlers.onLayoutHierarchical
    },
    {
      key: '2',
      ctrl: true,
      action: handlers.onLayoutForceDirected || (() => {}),
      description: 'Force-directed layout',
      enabled: !!handlers.onLayoutForceDirected
    },
    {
      key: '3',
      ctrl: true,
      action: handlers.onLayoutGrid || (() => {}),
      description: 'Grid layout',
      enabled: !!handlers.onLayoutGrid
    },
    {
      key: 'b',
      ctrl: true,
      action: handlers.onToggleSidePanel || (() => {}),
      description: 'Toggle side panel',
      enabled: !!handlers.onToggleSidePanel
    },
    {
      key: 'Escape',
      action: handlers.onEscape || (() => {}),
      description: 'Close dialogs',
      enabled: !!handlers.onEscape
    }
  ];
}

export default useKeyboardShortcuts;
