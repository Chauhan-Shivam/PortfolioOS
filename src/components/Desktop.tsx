import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Icon from "./Icon";
import Window from "./Window";
import Taskbar from "./Taskbar";
import StartMenu, { type StartMenuItem } from "./StartMenu";
import BlueScreen from "./BlueScreen";
import Calendar from "./Calendar";
import ContextMenu, { type ContextMenuItem } from "./contextMenu";
import Lockscreen from "./Lockscreen";
import "../styles/desktop.css";

// Import window content components
import AboutContent from "../windows/About";
import GamesContent from "../windows/Games";
import ContactContent from "../windows/Contact";
import IframeContent from "../windows/IFrameContent";
import ExplorerWindow, { type SubFile } from "../components/ExplorerWindow";

// --- Interfaces & Constants ---

/**
 * Defines the state for an open application window.
 */
export interface AppWindow {
  id: string;
  title: string;
  content: React.ReactNode;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number | string; height: number | string };
  icon: string;
}

/**
 * Defines the core properties of a desktop icon, including its
 * associated window content.
 */
export interface DesktopIconDef {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode | null;
  filePath?: string;
  pinned?: boolean;
}

/**
 * Defines the structure of the file system, used by ExplorerWindow.
 */
type FileSystemType = {
  [key: string]: {
    files: SubFile[];
  };
};

const DEFAULT_WINDOW_SIZE = { width: 640, height: 480 };

// --- Component ---

/**
 * The main Desktop component.
 * Manages all windows, icons, menus, and global state for the OS simulation.
 */
const Desktop: React.FC = () => {
  // --- State ---
  const [data, setData] = useState<any>(null); // Raw JSON data
  const [loading, setLoading] = useState(true);
  const [windows, setWindows] = useState<AppWindow[]>([]); // All open windows
  const [zCounter, setZCounter] = useState(1); // For window stacking
  const [currentWallpaper, setCurrentWallpaper] = useState("");
  const [iconPositions, setIconPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [iconSize, setIconSize] = useState("medium"); // 'small', 'medium', 'large'
  const [bsod, setBsod] = useState(false); // Blue Screen of Death
  const [startOpen, setStartOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });
  const [isLocked, setIsLocked] = useState(true); // Start locked
  const [processedIcons, setProcessedIcons] = useState<DesktopIconDef[]>([]);

  // --- Refs ---
  const desktopRef = useRef<HTMLDivElement>(null);
  const startMenuRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // --- Derived Values ---
  const cellSize = iconSize === "large" ? 120 : iconSize === "small" ? 80 : 100;

  // --- Core Handlers (Memoized) ---

  /**
   * Updates an icon's grid position after a drag-and-drop.
   */
  const updateIconPosition = useCallback(
    (id: string, mouseX: number, mouseY: number) => {
      const rect = desktopRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = mouseX - rect.left;
      const y = mouseY - rect.top;
      const gridX = Math.max(0, Math.round(x / cellSize));
      const gridY = Math.max(0, Math.round(y / cellSize));
      setIconPositions((prev) => ({ ...prev, [id]: { x: gridX, y: gridY } }));
    },
    [cellSize]
  );

  /**
   * Brings a specific window to the front (highest z-index).
   */
  const bringToFront = useCallback((id: string) => {
    setWindows((prevWindows) => {
      // Find the current highest z-index
      const maxZ = Math.max(...prevWindows.map((w) => w.zIndex), 0);
      return prevWindows.map((w) =>
        w.id === id ? { ...w, zIndex: maxZ + 1, minimized: false } : w
      );
    });
  }, []);

  /**
   * Opens a new window or focuses an existing one.
   */
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

        // Case 1: Window is already open
        if (found) {
          // Just bring it to the front
          return prevWindows.map((w) =>
            w.id === found.id ? { ...w, zIndex: maxZ + 1, minimized: false } : w
          );
        }

        // Case 2: Create a new window
        const desktopRect = desktopRef.current?.getBoundingClientRect();
        // The stagger/cascade effect:
        const cascadeOffset = (prevWindows.length % 10) * 30;

        const initialX = desktopRect
          ? (desktopRect.width - (DEFAULT_WINDOW_SIZE.width as number)) / 2
          : 150;
        const initialY = desktopRect
          ? (desktopRect.height - (DEFAULT_WINDOW_SIZE.height as number)) / 2
          : 100;

        // Determine content (file vs. React component)
        let content: React.ReactNode;
        if (iconDef.filePath) {
          content = <IframeContent filePath={iconDef.filePath} />;
        } else {
          content = iconDef.content;
        }

        const newWin: AppWindow = {
          ...iconDef,
          content: content,
          minimized: false,
          maximized: false,
          zIndex: maxZ + 1, // Use the new highest z-index
          position: {
            x: initialX + cascadeOffset,
            y: initialY + cascadeOffset,
          },
          size: DEFAULT_WINDOW_SIZE,
        };

        return [...prevWindows, newWin];
      });
    },
    [] // No dependencies are needed, making this more stable
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: true } : w))
    );
  }, []);

  const toggleMaximize = useCallback(
    (id: string) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w))
      );
      bringToFront(id);
    },
    [bringToFront]
  );

  const handleWindowDrag = useCallback(
    (id: string, newPosition: { x: number; y: number }) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, position: newPosition } : w))
      );
    },
    []
  );

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

  const handleLock = useCallback(() => {
    setIsLocked(true);
    setStartOpen(false);
    setCalendarOpen(false);
    setContextMenu((c) => ({ ...c, visible: false }));
    setWindows((prev) => prev.map((w) => ({ ...w, minimized: true })));
  }, []);

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
  }, []);

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

  const showDesktop = useCallback(() => {
    setWindows((prev) => prev.map((w) => ({ ...w, minimized: true })));
  }, []);

  const handleNextWallpaper = useCallback(() => {
    const wallpapers = data?.desktopConfig?.wallpapers;
    if (!wallpapers || wallpapers.length === 0) return;
    const currentIndex = wallpapers.findIndex(
      (wp: any) => wp.path === currentWallpaper
    );
    const nextIndex = (currentIndex + 1) % wallpapers.length;
    setCurrentWallpaper(wallpapers[nextIndex].path);
  }, [data, currentWallpaper]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const toggleStartMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCalendarOpen(false);
    setStartOpen((s) => !s);
  }, []);

  const toggleCalendar = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setStartOpen(false);
    setCalendarOpen((c) => !c);
  }, []);

  // --- Layout & Click-Outside Effects ---

  /**
   * Fetch initial portfolio data on component mount.
   */
  useEffect(() => {
    fetch("/portfolio-data.json")
      .then((res) => res.json())
      .then((jsonData) => {
        setData(jsonData);
        if (jsonData.desktopConfig?.wallpapers?.length > 0) {
          setCurrentWallpaper(jsonData.desktopConfig.wallpapers[0].path);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load portfolio data:", error);
        setLoading(false);
      });
  }, []);

  /**
   * Calculates the auto-layout grid positions for desktop icons.
   */
  const calculateLayout = useCallback(() => {
    if (!desktopRef.current || !processedIcons.length) return;

    const desktopHeight = desktopRef.current.clientHeight;
    const maxRows = Math.floor(desktopHeight / cellSize);
    if (maxRows <= 0) return;

    const newPositions: Record<string, { x: number; y: number }> = {};
    let col = 0;
    let row = 0;

    for (const icon of processedIcons) {
      newPositions[icon.id] = { x: col, y: row };
      row++;
      if (row >= maxRows) {
        row = 0;
        col++;
      }
    }
    setIconPositions(newPositions);
  }, [processedIcons, cellSize]);

  /**
   * Attaches resize listener to recalculate icon layout.
   */
  useEffect(() => {
    if (!isLocked) {
      calculateLayout();
      window.addEventListener("resize", calculateLayout);
    }
    return () => window.removeEventListener("resize", calculateLayout);
  }, [calculateLayout, isLocked]);

  /**
   * Handles global clicks to close open menus.
   */
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const target = event.target as Node;
      if (startMenuRef.current && !startMenuRef.current.contains(target)) {
        setStartOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(target)) {
        setCalendarOpen(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(target)) {
        closeContextMenu();
      }
    },
    [closeContextMenu]
  );

  /**
   * Attaches/removes the global click listener.
   */
  useEffect(() => {
    if (!isLocked) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside, isLocked]);

  // --- Memoized Derived Data for Rendering ---

  /**
   * This effect processes the raw JSON data and injects the correct
   * React components (e.g., AboutContent, ExplorerWindow) into the
   * icon definitions. This is the "source of truth" for all icons.
   */
  useEffect(() => {
    if (!data) return;

    // 1. Create the list with all content *except* the File Explorer.
    let iconsWithContent: DesktopIconDef[] = data.desktopConfig.icons.map(
      (icon: any) => ({
        ...icon,
        content: (() => {
          switch (icon.id) {
            case "about":
              return <AboutContent info={data.personalInfo} />;
            case "contact":
              return <ContactContent info={data.personalInfo.contact} />;
            case "games":
              return <GamesContent />;
            // 'projects' content is deferred
            default:
              return null;
          }
        })(),
      })
    );

    // 2. Create the ExplorerWindow element, passing it the *full list*
    //    of icons it needs to display shortcuts.
    const explorerWindowElement = (
      <ExplorerWindow
        desktopIcons={iconsWithContent}
        fileSystem={data.fileSystem as FileSystemType}
        openWindow={openWindow}
      />
    );

    // 3. Find the 'projects' icon and inject the ExplorerWindow element
    //    as its content.
    const projectsIconIndex = iconsWithContent.findIndex(
      (icon) => icon.id === "projects"
    );
    if (projectsIconIndex !== -1) {
      iconsWithContent[projectsIconIndex].content = explorerWindowElement;
    }

    // 4. Set the final, processed list to state.
    setProcessedIcons(iconsWithContent);
  }, [data, openWindow]);

  /**
   * Memoized list of items for the Start Menu.
   */
  const startMenuItems: StartMenuItem[] = useMemo(() => {
    if (!processedIcons.length) return [];

    const items: StartMenuItem[] = [];

    // Filter out 'about' AND 'contact' from the main program list
    const programs = processedIcons.filter(
      (icon) => !icon.filePath && icon.id !== "about" && icon.id !== "contact"
    );
    const files = processedIcons.filter((icon) => icon.filePath);

    // Find the 'about' and 'contact' icons
    const aboutIcon = processedIcons.find((i) => i.id === "about");
    const contactIcon = processedIcons.find((i) => i.id === "contact");

    // Add 'About' if it exists
    if (aboutIcon) {
      items.push({
        label: aboutIcon.title,
        icon: aboutIcon.icon,
        action: () => openWindow(aboutIcon),
      });
    }

    // Add 'Contact' if it exists
    if (contactIcon) {
      items.push({
        label: contactIcon.title,
        icon: contactIcon.icon,
        action: () => openWindow(contactIcon),
      });
    }

    // Add the rest of the programs
    programs.forEach((icon) =>
      items.push({
        label: icon.title,
        icon: icon.icon,
        action: () => openWindow(icon),
      })
    );

    // Add files
    files.forEach((file) =>
      items.push({
        label: file.title,
        icon: file.icon,
        action: () => openWindow(file),
      })
    );

    return items;
  }, [processedIcons, openWindow]);
  /**
   * Memoized list of items for the right-click context menu.
   */
  const contextMenuItems: ContextMenuItem[] = useMemo(
    () => [
      { label: "View", action: () => {} },
      { label: " ▸ Large Icons", action: () => setIconSize("large") },
      { label: " ▸ Medium Icons", action: () => setIconSize("medium") },
      { label: " ▸ Small Icons", action: () => setIconSize("small") },
      { label: "Refresh", action: () => {} },
      { label: "Next Wallpaper", action: handleNextWallpaper },
    ],
    [handleNextWallpaper]
  );

  // --- Render ---

  if (loading) {
    return <div>Loading Portfolio...</div>;
  }

  if (!data) {
    return <div>Failed to load portfolio data.</div>;
  }

  return (
    <div
      className="desktop"
      style={
        {
          backgroundImage: `url(${currentWallpaper})`,
        } as React.CSSProperties
      }
    >
      {!isLocked && (
        <>
          <div
            className={`desktop-main ${iconSize}-icons`}
            ref={desktopRef}
            onContextMenu={handleContextMenu}
          >
            {/* Render desktop icons */}
            {processedIcons.map((icon) => (
              <Icon
                key={icon.id}
                id={icon.id}
                title={icon.title}
                icon={icon.icon}
                onDoubleClick={() => openWindow(icon)}
                gridPosition={iconPositions[icon.id] || { x: 0, y: 0 }}
                onPositionChange={updateIconPosition}
                cellSize={cellSize}
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
                />
              ) : null
            )}
          </div>

          <Taskbar
            windows={windows}
            desktopIcons={processedIcons}
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
            items={startMenuItems}
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
