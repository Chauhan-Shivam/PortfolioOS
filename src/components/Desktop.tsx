import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";

// --- Component Imports ---
import Icon from "./Icon";
import Window from "./Window";
import Taskbar from "./Taskbar";
import StartMenu, { type StartMenuItem } from "./StartMenu";
import BlueScreen from "./BlueScreen";
import Calendar from "./Calendar";
import ContextMenu, { type ContextMenuItem } from "./contextMenu";
import Lockscreen from "./Lockscreen";
import IframeContent from "../windows/IFrameContent";
import "../styles/desktop.css";

// --- Type Imports ---
import type { AppWindow, DesktopIconDef, SortKeyType } from "./types"; // Now importing from central types file

// --- Hook Imports ---
import { usePortfolioData } from "../hooks/usePortfolioData";
import { useWindowManagement } from "../hooks/useWindowManagement";
import { useDesktopMeta } from "../hooks/useDesktopMeta";
import { useMenuManagement } from "../hooks/useMenuManagement";
import { useIconManagement } from "../hooks/useIconManagement";

// --- Constants ---
const DEFAULT_WINDOW_SIZE = { width: 640, height: 480 };

// --- Component ---
const Desktop: React.FC = () => {
  // --- 1. Initialize Hooks ---

  const { data, loading } = usePortfolioData();
  const {
    windows,
    setWindows,
    bringToFront,
    closeWindow,
    minimizeWindow,
    toggleMaximize,
    handleWindowDrag,
    handleWindowResize,
    showDesktop,
  } = useWindowManagement();

  const {
    currentWallpaper,
    bsod,
    setBsod,
    isLocked,
    setIsLocked,
    handleUnlock,
    handleNextWallpaper,
  } = useDesktopMeta(data);

  // Refs must stay in the component that renders the elements
  const desktopRef = useRef<HTMLDivElement>(null);
  const startMenuRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const {
    startOpen,
    setStartOpen,
    calendarOpen,
    setCalendarOpen,
    contextMenu,
    setContextMenu,
    closeContextMenu,
    handleContextMenu,
    toggleStartMenu,
    toggleCalendar,
    handleClickOutside, // Get the handler from the hook
  } = useMenuManagement(startMenuRef, calendarRef, contextMenuRef);

  const [iconSize, setIconSize] = useState("medium"); // 'small', 'medium', 'large'

  // The 'openWindow' function must be defined *before* useIconManagement
  const openWindow = useCallback(
    (iconDef: DesktopIconDef) => {
      // Handle special "apps" that don't open windows
      if (!iconDef.content && !iconDef.filePath) {
        if (iconDef.id === "browser") {
          setBsod(true);
          setTimeout(() => setBsod(false), 2000);
          return;
        }
      }

      setWindows((prevWindows) => {
        const found = prevWindows.find((w) => w.id === iconDef.id);
        const maxZ = Math.max(...prevWindows.map((w) => w.zIndex), 0);

        if (found) {
          // Window is already open, just bring it to front
          return prevWindows.map((w) =>
            w.id === found.id ? { ...w, zIndex: maxZ + 1, minimized: false } : w
          );
        }

        // Determine Size based on the resizable flag from the icon data
        // Default to true if 'resizable' is missing or explicitly true
        const isResizable = iconDef.resizable ?? true;
        const initialSize = !isResizable
          ? { width: "auto", height: "auto" } // Use 'auto' if not resizable
          : DEFAULT_WINDOW_SIZE; // Use default otherwise

        // Calculate initial position
        const desktopRect = desktopRef.current?.getBoundingClientRect();
        const cascadeOffset = (prevWindows.length % 10) * 30;
        const initialX = desktopRect
          ? (desktopRect.width -
              (initialSize.width === "auto"
                ? 400
                : (initialSize.width as number))) /
            2 // Estimate width if 'auto'
          : 150;
        const initialY = desktopRect
          ? (desktopRect.height -
              (initialSize.height === "auto"
                ? 300
                : (initialSize.height as number))) /
            2 // Estimate height if 'auto'
          : 100;

        // Determine content (iframe or React component)
        let content: React.ReactNode;
        if (iconDef.filePath) {
          content = <IframeContent filePath={iconDef.filePath} />;
        } else {
          content = iconDef.content;
        }

        // Create the new window state object
        const newWin: AppWindow = {
          id: iconDef.id, // Ensure all necessary properties are included
          title: iconDef.title,
          icon: iconDef.icon,
          content: content,
          minimized: false,
          maximized: false,
          zIndex: maxZ + 1,
          position: {
            x: initialX + cascadeOffset,
            y: initialY + cascadeOffset,
          },
          size: initialSize,
          resizable: isResizable, // Store the resizable flag in the window state
        };

        return [...prevWindows, newWin];
      });
    },
    [setBsod, setWindows] // Dependencies
  );

  // 1. Calculate cellSize using the local iconSize state
  const cellSize = useMemo(
    () => (iconSize === "large" ? 120 : iconSize === "small" ? 80 : 100),
    [iconSize]
  );

  // 2. Call the hook, which now returns two lists of icons
  const {
    allProcessedIcons, // Get all icons
    desktopIconsToRender, // Get filtered icons for desktop
    iconPositions,
    sortState,
    sortIcons,
    updateIconPosition,
  } = useIconManagement(data, openWindow, desktopRef, cellSize, isLocked);

  // --- 2. Orchestration Logic (Functions that use multiple hooks) ---

  /**
   * Locks the screen. This action needs to coordinate multiple hooks.
   */
  const handleLock = useCallback(() => {
    setIsLocked(true);
    setStartOpen(false);
    setCalendarOpen(false);
    setContextMenu((c) => ({ ...c, visible: false }));
    // Minimize all windows (uses useWindowManagement's setWindows)
    setWindows((prev) => prev.map((w) => ({ ...w, minimized: true })));
  }, [setIsLocked, setStartOpen, setCalendarOpen, setContextMenu, setWindows]);

  /**
   * Handles clicking a window's icon in the taskbar.
   */
  const handleTaskbarClick = useCallback(
    (id: string) => {
      const win = windows.find((w) => w.id === id);
      if (!win) return;

      const topWindow = windows
        .filter((w) => !w.minimized)
        .reduce(
          (top, w) => (w.zIndex > (top?.zIndex ?? -1) ? w : top),
          null as AppWindow | null
        );

      if (win.minimized) {
        bringToFront(id);
      } else {
        if (win.id === topWindow?.id) {
          minimizeWindow(id);
        } else {
          bringToFront(id);
        }
      }
    },
    [windows, bringToFront, minimizeWindow]
  );

  /**
   * Attaches/removes the global click listener based on lock state.
   */
  useEffect(() => {
    if (!isLocked) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isLocked, handleClickOutside]);

  // --- 3. Memoized Props (Combining data from multiple hooks) ---

  /**
   * Memoized list of items for the Start Menu.
   */
  const startMenuItems: StartMenuItem[] = useMemo(() => {
    // Use allProcessedIcons
    if (!allProcessedIcons.length) return [];

    const items: StartMenuItem[] = [];
    const programs = allProcessedIcons.filter(
      (icon) => !icon.filePath && icon.id !== "about" && icon.id !== "contact"
    );
    const files = allProcessedIcons.filter((icon) => icon.filePath);
    const aboutIcon = allProcessedIcons.find((i) => i.id === "about");
    const contactIcon = allProcessedIcons.find((i) => i.id === "contact");

    if (aboutIcon) {
      items.push({
        label: aboutIcon.title,
        icon: aboutIcon.icon,
        action: () => openWindow(aboutIcon),
      });
    }
    if (contactIcon) {
      items.push({
        label: contactIcon.title,
        icon: contactIcon.icon,
        action: () => openWindow(contactIcon),
      });
    }
    programs.forEach((icon) =>
      items.push({
        label: icon.title,
        icon: icon.icon,
        action: () => openWindow(icon),
      })
    );
    files.forEach((file) =>
      items.push({
        label: file.title,
        icon: file.icon,
        action: () => openWindow(file),
      })
    );
    return items;
  }, [allProcessedIcons, openWindow]); // Dependency updated

  /**
   * Memoized list of items for the right-click context menu.
   */
  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    const getSortLabel = (label: string, key: SortKeyType): string => {
      if (sortState.key === key) {
        return `${label} ${sortState.direction === "asc" ? "▲" : "▼"}`;
      }
      return label;
    };

    return [
      {
        label: "View",
        submenu: [
          { label: "Large Icons", action: () => setIconSize("large") },
          { label: "Medium Icons", action: () => setIconSize("medium") },
          { label: "Small Icons", action: () => setIconSize("small") },
        ],
      },
      {
        label: "Sort by",
        submenu: [
          {
            label: getSortLabel("Name", "name"),
            action: () => sortIcons("name"),
          },
          {
            label: getSortLabel("Item type", "type"),
            action: () => sortIcons("type"),
          },
          {
            label: getSortLabel("Date modified", "dateModified"),
            action: () => sortIcons("dateModified"),
          },
        ],
      },
      { label: "Refresh", action: () => {} },
      { separator: true },
      { label: "Next Wallpaper", action: handleNextWallpaper },
    ];
  }, [handleNextWallpaper, sortIcons, sortState, setIconSize]);
  // --- 4. Render ---

  if (loading) {
    return <div>Loading Portfolio...</div>;
  }

  if (!data) {
    return <div>Failed to load portfolio data.</div>;
  }

  return (
    <div
      className="desktop"
      style={{ backgroundImage: `url(${currentWallpaper})` }}
    >
      {!isLocked && (
        <>
          <div
            className={`desktop-main ${iconSize}-icons`}
            ref={desktopRef}
            onContextMenu={handleContextMenu}
          >
            {/* Render desktop icons */}
            {desktopIconsToRender.map((icon) => (
              <Icon
                key={icon.id}
                id={icon.id}
                title={icon.title}
                icon={icon.icon}
                onDoubleClick={() => openWindow(icon)}
                gridPosition={iconPositions[icon.id] || { x: 0, y: 0 }}
                onPositionChange={updateIconPosition}
                cellSize={cellSize} // Pass the calculated cellSize
              />
            ))}

            {/* Render open, non-minimized windows */}
            {windows.map((w) =>
              !w.minimized ? (
                <Window
                  key={w.id}
                  windowData={w}
                  onDragStop={(newPos) => handleWindowDrag(w.id, newPos)}
                  onResizeStop={(newSize, newPos) =>
                    handleWindowResize(w.id, newSize, newPos)
                  }
                  close={() => closeWindow(w.id)}
                  minimize={() => minimizeWindow(w.id)}
                  toggleMaximize={() => toggleMaximize(w.id)}
                  bringToFront={() => bringToFront(w.id)}
                  // Pass the resizable flag from the window's state
                  resizable={w.resizable}
                />
              ) : null
            )}
          </div>

          <Taskbar
            windows={windows}
            desktopIcons={allProcessedIcons} // Pass ALL icons here
            openWindow={openWindow}
            toggleWindow={handleTaskbarClick}
            showDesktop={showDesktop}
            toggleStartMenu={toggleStartMenu}
            toggleCalendar={toggleCalendar}
          />

          {/* Pop-up Menus */}
          <StartMenu
            ref={startMenuRef}
            open={startOpen}
            items={startMenuItems} // Based on all icons
            userName={data.personalInfo.name}
            onClose={() => setStartOpen(false)}
            onLock={handleLock}
          />
          <Calendar ref={calendarRef} open={calendarOpen} />
          {contextMenu.visible && (
            <ContextMenu
              ref={contextMenuRef}
              x={contextMenu.x}
              y={contextMenu.y}
              items={contextMenuItems}
              onClose={closeContextMenu}
            />
          )}
        </>
      )}

      {/* Lockscreen Overlay */}
      {isLocked && (
        <Lockscreen
          onUnlock={handleUnlock}
          userName={data.personalInfo.name}
          hint={data.personalInfo.passwordHint}
        />
      )}

      {/* BSOD Overlay */}
      {bsod && <BlueScreen />}
    </div>
  );
};

export default Desktop;
