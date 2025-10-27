import { useState, useCallback, useEffect } from 'react';

/**
 * Manages the "meta" state of the desktop (wallpaper, lock screen, BSOD).
 * @param data The raw portfolio data (from usePortfolioData).
 */
export const useDesktopMeta = (data: any) => {
  const [currentWallpaper, setCurrentWallpaper] = useState("");
  const [bsod, setBsod] = useState(false);
  const [isLocked, setIsLocked] = useState(true); // Start locked

  // Effect to set the initial wallpaper once data is loaded
  useEffect(() => {
    if (data?.desktopConfig?.wallpapers?.length > 0) {
      setCurrentWallpaper(data.desktopConfig.wallpapers[0].path);
    }
  }, [data]);

  /**
   * Unlocks the screen.
   */
  const handleUnlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  /**
   * Cycles to the next wallpaper in the list.
   */
  const handleNextWallpaper = useCallback(() => {
    const wallpapers = data?.desktopConfig?.wallpapers;
    if (!wallpapers || wallpapers.length === 0) return;
    const currentIndex = wallpapers.findIndex(
      (wp: any) => wp.path === currentWallpaper
    );
    const nextIndex = (currentIndex + 1) % wallpapers.length;
    setCurrentWallpaper(wallpapers[nextIndex].path);
  }, [data, currentWallpaper]);

  return {
    currentWallpaper,
    bsod,
    setBsod,
    isLocked,
    setIsLocked,
    handleUnlock,
    handleNextWallpaper,
  };
};