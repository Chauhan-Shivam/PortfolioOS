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
import Lockscreen from "./Lockscreen"; // Ensure this is imported
import "../styles/desktop.css";

// Import window content components
import AboutContent from "../windows/About";
import ProjectsContent from "../windows/Projects";
import GamesContent from "../windows/Games";
import ContactContent from "../windows/Contact";

// --- Interfaces & Constants ---

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

export interface DesktopIconDef {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode | null;
  filePath?: string;
  pinned?: boolean;
}

const DEFAULT_WINDOW_SIZE = { width: 640, height: 480 };

// --- Component ---

const Desktop: React.FC = () => {
  // --- State ---

  /** Raw data fetched from the JSON file */
  const [data, setData] = useState<any>(null);
  /** Loading state for the initial data fetch */
  const [loading, setLoading] = useState(true);
  /** Array of all currently open application windows */
  const [windows, setWindows] = useState<AppWindow[]>([]);
  /** Counter to ensure new windows always get the highest z-index */
  const [zCounter, setZCounter] = useState(1);
  /** Path to the currently displayed wallpaper image */
  const [currentWallpaper, setCurrentWallpaper] = useState("");
  /** A record of grid coordinates for each desktop icon */
  const [iconPositions, setIconPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  /** Current size setting for desktop icons */
  const [iconSize, setIconSize] = useState("medium"); // 'small', 'medium', 'large'
  /** Toggles the "Blue Screen of Death" component */
  const [bsod, setBsod] = useState(false);
  /** Toggles the visibility of the Start Menu */
  const [startOpen, setStartOpen] = useState(false);
  /** Toggles the visibility of the Calendar */
  const [calendarOpen, setCalendarOpen] = useState(false);
  /** State for the right-click context menu (visibility and position) */
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });
  /** State for the lock screen visibility */
  const [isLocked, setIsLocked] = useState(true); // Start locked

  // --- Refs ---

  /** Ref to the main desktop area (used for bounds calculation and click-outside) */
  const desktopRef = useRef<HTMLDivElement>(null);
  /** Ref to the Start Menu (for click-outside detection) */
  const startMenuRef = useRef<HTMLDivElement>(null);
  /** Ref to the Calendar (for click-outside detection) */
  const calendarRef = useRef<HTMLDivElement>(null);
  /** Ref to the Context Menu (for click-outside detection) */
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // --- Derived Values ---

  /** Pixel size of the icon grid cell based on the iconSize state */
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
   * Brings a specific window to the front by giving it the highest z-index.
   * Also un-minimizes it if it was minimized.
   */
  const bringToFront = useCallback(
    (id: string) => {
      const newZ = zCounter + 1;
      setZCounter(newZ);
      setWindows((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, zIndex: newZ, minimized: false } : w
        )
      );
    },
    [zCounter]
  );

  /**
   * Opens a new window or focuses an existing one.
   */
  const openWindow = useCallback(
    (iconDef: DesktopIconDef) => {
      // 1. Handle external file links
      if (iconDef.filePath) {
        window.open(iconDef.filePath, "_blank");
        return;
      }

      // 2. Handle apps with no content (e.g., BSOD trigger)
      if (!iconDef.content) {
        if (iconDef.id === "browser") {
          setBsod(true);
          setTimeout(() => setBsod(false), 2000);
        }
        return;
      }

      // 3. Handle regular app windows
      setWindows((prev) => {
        const found = prev.find((w) => w.id === iconDef.id);

        if (found) {
          bringToFront(iconDef.id);
          return prev;
        }

        const newZ = zCounter + 1;
        const desktopRect = desktopRef.current?.getBoundingClientRect();
        const cascadeOffset = (prev.length % 10) * 30;

        const initialX = desktopRect
          ? (desktopRect.width - (DEFAULT_WINDOW_SIZE.width as number)) / 2
          : 150;
        const initialY = desktopRect
          ? (desktopRect.height - (DEFAULT_WINDOW_SIZE.height as number)) / 2
          : 100;

        const newWin: AppWindow = {
          ...iconDef,
          minimized: false,
          maximized: false,
          zIndex: newZ,
          position: {
            x: initialX + cascadeOffset,
            y: initialY + cascadeOffset,
          },
          size: DEFAULT_WINDOW_SIZE,
        };

        setZCounter(newZ);
        return [...prev, newWin];
      });
    },
    [zCounter, bringToFront]
  );

  /** Closes a window by removing it from the state. */
  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  /** Minimizes a window. */
  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: true } : w))
    );
  }, []);

  /** Toggles a window between maximized and restored, bringing it to front. */
  const toggleMaximize = useCallback(
    (id: string) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w))
      );
      bringToFront(id);
    },
    [bringToFront]
  );

  /** Updates a window's position (called from <Window> drag). */
  const handleWindowDrag = useCallback(
    (id: string, newPosition: { x: number; y: number }) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, position: newPosition } : w))
      );
    },
    []
  );

  /** Updates a window's size and position (called from <Window> resize). */
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

  // --- Handlers for Lockscreen ---
  const handleLock = useCallback(() => {
    setIsLocked(true);
    setStartOpen(false); // Close start menu when locking
    setCalendarOpen(false); // Close calendar
    setContextMenu((c) => ({ ...c, visible: false })); // Close context menu
    // You might also want to minimize all windows when locking
    setWindows((prev) => prev.map((w) => ({ ...w, minimized: true })));
  }, []);

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
  }, []);

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

  /** Minimizes all open windows. */
  const showDesktop = useCallback(() => {
    setWindows((prev) => prev.map((w) => ({ ...w, minimized: true })));
  }, []);

  /** Cycles to the next wallpaper in the data. */
  const handleNextWallpaper = useCallback(() => {
    const wallpapers = data?.desktopConfig?.wallpapers;
    if (!wallpapers || wallpapers.length === 0) return;
    const currentIndex = wallpapers.findIndex(
      (wp: any) => wp.path === currentWallpaper
    );
    const nextIndex = (currentIndex + 1) % wallpapers.length;
    setCurrentWallpaper(wallpapers[nextIndex].path);
  }, [data, currentWallpaper]);

  /** Shows the right-click context menu at the cursor's position. */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  }, []);

  /** Closes the context menu. */
  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  /** Toggles the Start Menu, closing the calendar. */
  const toggleStartMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCalendarOpen(false);
    setStartOpen((s) => !s);
  }, []);

  /** Toggles the Calendar, closing the Start Menu. */
  const toggleCalendar = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setStartOpen(false);
    setCalendarOpen((c) => !c);
  }, []);

  // --- Layout & Click-Outside Effects ---

  /** Effect for fetching initial portfolio data */
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

  /** Memoized function to calculate icon grid layout */
  const calculateLayout = useCallback(() => {
    if (!desktopRef.current || !data) return;

    const desktopHeight = desktopRef.current.clientHeight;
    const maxRows = Math.floor(desktopHeight / cellSize);
    if (maxRows <= 0) return;

    const newPositions: Record<string, { x: number; y: number }> = {};
    let col = 0;
    let row = 0;

    for (const icon of data.desktopConfig.icons) {
      newPositions[icon.id] = { x: col, y: row };
      row++;
      if (row >= maxRows) {
        row = 0;
        col++;
      }
    }
    setIconPositions(newPositions);
  }, [data, cellSize]);

  /** Effect to run layout calculation on load and resize */
  useEffect(() => {
    // Only calculate layout if not locked
    if (!isLocked) {
      calculateLayout();
      window.addEventListener("resize", calculateLayout);
    }
    return () => window.removeEventListener("resize", calculateLayout);
  }, [calculateLayout, isLocked]); // Recalculate if locked state changes

  /** Memoized function to handle clicks outside of menus */
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

  /** Effect to add/remove the global click listener */
  useEffect(() => {
    // Only listen for outside clicks if not locked
    if (!isLocked) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside, isLocked]); // Re-add listener if unlocked

  // --- Memoized Derived Data for Rendering ---

  /** Memoized array of desktop icon definitions, created only when data changes */
  const desktopIcons: DesktopIconDef[] = useMemo(() => {
    if (!data) return [];
    return data.desktopConfig.icons.map((icon: any) => ({
      ...icon,
      content: (() => {
        switch (icon.id) {
          case "about":
            return <AboutContent info={data.personalInfo} />;
          case "explorer":
            return <ProjectsContent portfolioData={data} />;
          case "games":
            return <GamesContent />;
          case "browser":
            return null;
          default:
            return null;
        }
      })(),
    }));
  }, [data]);

  /** Special handler for the 'Contact' start menu item */
  const openContactWindow = useCallback(() => {
    setWindows((prev) => {
      const exists = prev.find((w) => w.id === "contact");
      if (exists) {
        bringToFront("contact");
        return prev;
      }

      const newZ = zCounter + 1;
      const newPosition = {
        x: 180 + (prev.length % 10) * 30,
        y: 130 + (prev.length % 10) * 30,
      };
      const newWin: AppWindow = {
        id: "contact",
        title: "Contact",
        content: <ContactContent info={data.personalInfo.contact} />,
        minimized: false,
        maximized: false,
        zIndex: newZ,
        position: newPosition,
        size: DEFAULT_WINDOW_SIZE,
        icon: "/icons/contact.png",
      };
      setZCounter(newZ);
      return [...prev, newWin];
    });
  }, [zCounter, data, bringToFront]);

  /** Memoized array of start menu items, created only when icons/handlers change */
  const startMenuItems: StartMenuItem[] = useMemo(() => {
    if (!desktopIcons.length) return [];

    const items: StartMenuItem[] = [];
    const programs = desktopIcons.filter(
      (icon) => !icon.filePath && icon.id !== "about"
    );
    const files = desktopIcons.filter((icon) => icon.filePath);
    const aboutIcon = desktopIcons.find((i) => i.id === "about");

    if (aboutIcon) {
      items.push({
        label: "About",
        icon: aboutIcon.icon,
        action: () => openWindow(aboutIcon),
      });
    }
    items.push({
      label: "Contact",
      icon: "/icons/contact.png",
      action: openContactWindow,
    });

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
  }, [desktopIcons, openWindow, openContactWindow]);

  /** Memoized array of context menu items */
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
            {desktopIcons.map((icon) => (
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
            desktopIcons={desktopIcons}
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
            onLock={handleLock} // Pass the lock handler
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

      {/* =================================================================== */}
      {/* Lockscreen is rendered outside the conditional block */}
      {/* =================================================================== */}
      {isLocked && (
        <Lockscreen
          onUnlock={handleUnlock}
          userName={data.personalInfo.name}
          hint={data.personalInfo.passwordHint}
        />
      )}

      {/* Overlays */}
      {bsod && <BlueScreen />}
    </div>
  );
};

export default Desktop;
