import React, { useState, useEffect, useMemo, useCallback } from "react";
import "../styles/taskbar.css";
import type { AppWindow, DesktopIconDef } from "./types";

interface Props {
  /** The complete list of currently open windows. */
  windows: AppWindow[];
  /** The list of all available desktop icons (used to find pinned icons). */
  desktopIcons: DesktopIconDef[];
  /** Callback to open a new window from an icon definition. */
  openWindow: (icon: DesktopIconDef) => void;
  /** Callback to toggle a window's minimized/focused state. */
  toggleWindow: (id: string) => void;
  /** Callback to minimize all windows. */
  showDesktop: () => void;
  /** Callback to toggle the Start Menu's visibility. */
  toggleStartMenu: (e: React.MouseEvent) => void;
  /** Callback to toggle the Calendar's visibility. */
  toggleCalendar: (e: React.MouseEvent) => void;
}

/**
 * The main Taskbar component for the desktop.
 * It displays pinned icons, open windows, and system tray items.
 * It also houses the clock, which updates every second.
 */
const Taskbar: React.FC<Props> = ({
  windows,
  desktopIcons,
  openWindow,
  toggleWindow,
  showDesktop,
  toggleStartMenu,
  toggleCalendar,
}) => {
  /**
   * State for the current time, updated by an interval.
   */
  const [time, setTime] = useState(new Date());

  /**
   * Effect to set up a 1-second interval to update the clock.
   * Cleans up the interval on component unmount.
   */
  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => setTime(new Date()), 1000);
    // Clear the interval when the component is unmounted
    return () => clearInterval(timer);
  }, []); // Empty dependency array means this runs once on mount

  /**
   * Memoized calculation to find the ID of the top-most (focused) window.
   * This re-runs only when the 'windows' prop changes, not every second.
   */
  const focusedId = useMemo(() => {
    const focusedWindow = windows
      .filter((w) => !w.minimized)
      .reduce((prev, current) => {
        if (!prev) return current; // First item is highest so far
        return prev.zIndex > current.zIndex ? prev : current;
      }, null as AppWindow | null);

    return focusedWindow?.id || null;
  }, [windows]);

  /**
   * Memoized list of icons that are marked as 'pinned'.
   * This re-runs only when the 'desktopIcons' prop changes.
   */
  const pinnedIcons = useMemo(() => {
    return desktopIcons.filter((icon) => icon.pinned);
  }, [desktopIcons]);

  /**
   * Memoized list of open windows that are *not* pinned.
   * This re-runs only when 'windows' or the memoized 'pinnedIcons' list changes.
   */
  const openUnpinned = useMemo(() => {
    return windows.filter((w) => !pinnedIcons.some((p) => p.id === w.id));
  }, [windows, pinnedIcons]);

  /**
   * Memoized formatted time and date strings.
   * This re-runs only when the 'time' state changes (once per second).
   */
  const { timeString, dateString } = useMemo(() => {
    return {
      timeString: time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      dateString: time.toLocaleDateString([], {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }),
    };
  }, [time]);

  /**
   * Memoized handler for the taskbar container to stop clicks
   * from propagating to the desktop (which would close menus).
   */
  const handleTaskbarClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  /**
   * Memoized handler for all taskbar item clicks using event delegation.
   * This single function handles clicks for all pinned and open items,
   * avoiding the creation of new functions on every render.
   */
  const handleTaskbarItemClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      // Find the button, whether the user clicked the icon, text, or button
      const button = target.closest<HTMLButtonElement>(".taskbar-item");

      if (!button) {
        return; // Clicked on a divider or empty space
      }

      const { id, action } = button.dataset;

      if (!id) {
        return;
      }

      // Perform the action defined in the button's data attribute
      if (action === "open") {
        const iconToOpen = pinnedIcons.find((icon) => icon.id === id);
        if (iconToOpen) {
          openWindow(iconToOpen);
        }
      } else if (action === "toggle") {
        toggleWindow(id);
      }
    },
    [openWindow, toggleWindow, pinnedIcons]
  ); // Depends on props and memoized data

  return (
    <div className="taskbar" onClick={handleTaskbarClick}>
      {/* A single onClick handler (handleTaskbarItemClick) is attached here
        to manage all item clicks via event delegation.
      */}
      <div className="taskbar-left" onClick={handleTaskbarItemClick}>
        <button
          className="start-btn"
          onClick={toggleStartMenu}
          aria-label="Start Menu"
        />
        <div className="taskbar-divider" />

        {/* Render Pinned Icons */}
        {pinnedIcons.map((icon) => {
          const matchingWindow = windows.find((w) => w.id === icon.id);
          const isOpen = !!matchingWindow;
          const isFocused =
            isOpen &&
            !matchingWindow!.minimized &&
            matchingWindow!.id === focusedId;

          return (
            <button
              key={`pin-${icon.id}`}
              className={`taskbar-item ${isOpen ? "open" : ""} ${
                isFocused ? "focused" : ""
              }`}
              title={icon.title}
              // Data attributes are used by the delegated click handler
              data-id={icon.id}
              data-action={isOpen ? "toggle" : "open"}
            >
              <img src={icon.icon} alt={icon.title} />
            </button>
          );
        })}

        {/* Divider between pinned and unpinned items */}
        {pinnedIcons.length > 0 && openUnpinned.length > 0 && (
          <div className="taskbar-divider" />
        )}

        {/* Render Open, Unpinned Windows */}
        {openUnpinned.map((w) => {
          const isFocused = w.id === focusedId && !w.minimized;
          return (
            <button
              key={w.id}
              className={`taskbar-item open ${isFocused ? "focused" : ""}`}
              title={w.title}
              // Data attributes are used by the delegated click handler
              data-id={w.id}
              data-action="toggle"
            >
              <img src={w.icon} alt={w.title} />
              <span>{w.title}</span>
            </button>
          );
        })}
      </div>

      {/* System Tray and Clock */}
      <div className="taskbar-right">
        <div className="system-tray">
          <span>ENG</span>
          <span>📶</span>
          <span>🔊</span>
        </div>
        <div className="taskbar-time" onClick={toggleCalendar}>
          {/* Use memoized time strings */}
          {timeString}
          <br />
          {dateString}
        </div>
        <button
          className="show-desktop-btn"
          onClick={showDesktop}
          aria-label="Show Desktop"
        />
      </div>
    </div>
  );
};

export default Taskbar;
