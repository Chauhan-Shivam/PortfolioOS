import React, { useState, useEffect } from "react";
import "../styles/taskbar.css";
import type { AppWindow, DesktopIconDef } from "./Desktop";

interface Props {
  windows: AppWindow[];
  desktopIcons: DesktopIconDef[];
  openWindow: (icon: DesktopIconDef) => void;
  toggleWindow: (id: string) => void;
  showDesktop: () => void;
  toggleStartMenu: (e: React.MouseEvent) => void;
  toggleCalendar: (e: React.MouseEvent) => void;
}

const Taskbar: React.FC<Props> = ({
  windows,
  desktopIcons,
  openWindow,
  toggleWindow,
  showDesktop,
  toggleStartMenu,
  toggleCalendar,
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // FIXED: Safely find the focused window by handling the initial 'null' case
  const focusedWindow = windows
    .filter((w) => !w.minimized)
    .reduce((prev, current) => {
      if (!prev) return current; // If it's the first item, it's the highest so far
      return prev.zIndex > current.zIndex ? prev : current;
    }, null as AppWindow | null);

  const focusedId = focusedWindow?.id || null;

  const pinnedIcons = desktopIcons.filter((icon) => icon.pinned);
  const openUnpinned = windows.filter(
    (w) => !pinnedIcons.some((p) => p.id === w.id)
  );

  return (
    <div className="taskbar" onClick={(e) => e.stopPropagation()}>
      <div className="taskbar-left">
        <button className="start-btn" onClick={toggleStartMenu} />
        <div className="taskbar-divider" />

        {pinnedIcons.map((icon) => {
          const matchingWindow = windows.find((w) => w.id === icon.id);
          const isOpen = !!matchingWindow;
          const isFocused =
            isOpen &&
            !matchingWindow.minimized &&
            matchingWindow.id === focusedId;

          return (
            <button
              key={`pin-${icon.id}`}
              className={`taskbar-item ${isOpen ? "open" : ""} ${
                isFocused ? "focused" : ""
              }`}
              onClick={() =>
                isOpen ? toggleWindow(icon.id) : openWindow(icon)
              }
              title={icon.title}
            >
              <img src={icon.icon} alt={icon.title} />
            </button>
          );
        })}

        {pinnedIcons.length > 0 && openUnpinned.length > 0 && (
          <div className="taskbar-divider" />
        )}

        {openUnpinned.map((w) => {
          const isFocused = w.id === focusedId && !w.minimized;
          return (
            <button
              key={w.id}
              className={`taskbar-item open ${isFocused ? "focused" : ""}`}
              onClick={() => toggleWindow(w.id)}
              title={w.title}
            >
              <img src={w.icon} alt={w.title} />
              <span>{w.title}</span>
            </button>
          );
        })}
      </div>
      <div className="taskbar-right">
        <div className="system-tray">
          <span>ENG</span>
          <span>📶</span>
          <span>🔊</span>
        </div>
        <div className="taskbar-time" onClick={toggleCalendar}>
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          <br />
          {time.toLocaleDateString([], {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })}
        </div>
        <button className="show-desktop-btn" onClick={showDesktop} />
      </div>
    </div>
  );
};

export default Taskbar;
