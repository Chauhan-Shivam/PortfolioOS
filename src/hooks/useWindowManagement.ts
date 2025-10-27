import { useState, useCallback } from 'react';
// Adjust this path if your types.ts file is elsewhere
import type { AppWindow } from '../components/types';

/**
 * Manages the state and logic for all open application windows.
 */
export const useWindowManagement = () => {
  const [windows, setWindows] = useState<AppWindow[]>([]);

  /**
   * Brings a specific window to the front (highest z-index).
   */
  const bringToFront = useCallback((id: string) => {
    setWindows((prevWindows) => {
      const maxZ = Math.max(...prevWindows.map((w) => w.zIndex), 0);
      return prevWindows.map((w) =>
        w.id === id ? { ...w, zIndex: maxZ + 1, minimized: false } : w
      );
    });
  }, []);

  /**
   * Closes a window by removing it from the state.
   */
  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  /**
   * Minimizes a window.
   */
  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: true } : w))
    );
  }, []);

  /**
   * Toggles a window between maximized and its restored state.
   */
  const toggleMaximize = useCallback(
    (id: string) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w))
      );
      bringToFront(id); // Also bring to front
    },
    [bringToFront]
  );

  /**
   * Updates a window's position during a drag.
   */
  const handleWindowDrag = useCallback(
    (id: string, newPosition: { x: number; y: number }) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, position: newPosition } : w))
      );
    },
    []
  );

  /**
   * Updates a window's size and position during a resize.
   */
  const handleWindowResize = useCallback(
    (
      id: string,
      newSize: { width: string; height: string },
      newPosition: { x: number; y: number }
    ) => {
      setWindows((prev) =>
        prev.map((w) =>
          w.id === id
            ? {
                ...w,
                size: {
                  width: parseInt(newSize.width),
                  height: parseInt(newSize.height),
                },
                position: newPosition,
              }
            : w
        )
      );
    },
    []
  );

  /**
   * Minimizes all open windows.
   */
  const showDesktop = useCallback(() => {
    setWindows((prev) => prev.map((w) => ({ ...w, minimized: true })));
  }, []);

  return {
    windows,
    setWindows, // Exporting setWindows is crucial for openWindow
    bringToFront,
    closeWindow,
    minimizeWindow,
    toggleMaximize,
    handleWindowDrag,
    handleWindowResize,
    showDesktop,
  };
};