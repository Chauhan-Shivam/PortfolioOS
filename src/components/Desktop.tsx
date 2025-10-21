import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import Window from './Window';
import Taskbar from './Taskbar';
import StartMenu, { type StartMenuItem } from './StartMenu';
import BlueScreen from './BlueScreen';
import Calendar from './Calendar';
import ContextMenu, { type ContextMenuItem } from './contextMenu';
import '../styles/desktop.css';

// Import window content components
import AboutContent from '../windows/About';
import ProjectsContent from '../windows/Projects';
import GamesContent from '../windows/Games';
import ContactContent from '../windows/Contact';

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

const Desktop: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State for interactive elements
  const [windows, setWindows] = useState<AppWindow[]>([]);
  const [zCounter, setZCounter] = useState(1);
  const [currentWallpaper, setCurrentWallpaper] = useState('');
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [iconSize, setIconSize] = useState('medium'); // 'small', 'medium', 'large'
  
  // State for pop-ups
  const [bsod, setBsod] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number }>({ visible: false, x: 0, y: 0 });

  // Refs
  const desktopRef = useRef<HTMLDivElement>(null);
  const startMenuRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const cellSize = iconSize === 'large' ? 120 : iconSize === 'small' ? 80 : 100;

  // --- Effects ---

  useEffect(() => {
    fetch('/portfolio-data.json')
      .then(res => res.json())
      .then(jsonData => {
        setData(jsonData);
        if (jsonData.desktopConfig?.wallpapers?.length > 0) {
          setCurrentWallpaper(jsonData.desktopConfig.wallpapers[0].path);
        }
        setLoading(false);
      })
      .catch(error => console.error("Failed to load portfolio data:", error));
  }, []);

  useEffect(() => {
    const calculateLayout = () => {
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
    };

    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    return () => window.removeEventListener('resize', calculateLayout);
  }, [data, cellSize]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (startMenuRef.current && !startMenuRef.current.contains(event.target as Node)) {
        setStartOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu({ visible: false, x: 0, y: 0 });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Core Functions ---

  const updateIconPosition = (id: string, mouseX: number, mouseY: number) => {
    const rect = desktopRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = mouseX - rect.left;
    const y = mouseY - rect.top;
    const gridX = Math.max(0, Math.round(x / cellSize));
    const gridY = Math.max(0, Math.round(y / cellSize));
    setIconPositions(prev => ({ ...prev, [id]: { x: gridX, y: gridY } }));
  };

  const bringToFront = (id: string) => {
    const topZ = Math.max(...windows.map(w => w.zIndex), 0);
    const targetWindow = windows.find(w => w.id === id);
    if (targetWindow && targetWindow.zIndex <= topZ) {
      const newZ = zCounter + 1;
      setZCounter(newZ);
      setWindows(prev => prev.map(w => (w.id === id ? { ...w, zIndex: newZ } : w)));
    }
  };

  const openWindow = (iconDef: DesktopIconDef) => {
    if (iconDef.filePath) {
      window.open(iconDef.filePath, '_blank');
      return;
    }
    if (!iconDef.content) {
      if (iconDef.id === 'browser') {
        setBsod(true);
        setTimeout(() => setBsod(false), 2000);
      }
      return;
    }
    setWindows(prev => {
      const found = prev.find(w => w.id === iconDef.id);
      if (found) {
        bringToFront(iconDef.id);
        return prev.map(w => w.id === iconDef.id ? { ...w, minimized: false } : w);
      }
      const newZ = zCounter + 1;
      const desktopRect = desktopRef.current?.getBoundingClientRect();
      const cascadeOffset = (prev.length % 10) * 30;
      const initialX = desktopRect ? (desktopRect.width - DEFAULT_WINDOW_SIZE.width) / 2 : 150;
      const initialY = desktopRect ? (desktopRect.height - DEFAULT_WINDOW_SIZE.height) / 2 : 100;

      const newWin: AppWindow = { 
        ...iconDef, 
        minimized: false, 
        maximized: false, 
        zIndex: newZ, 
        position: { x: initialX + cascadeOffset, y: initialY + cascadeOffset },
        size: DEFAULT_WINDOW_SIZE,
      };
      setZCounter(newZ);
      return [...prev, newWin];
    });
  };

  const closeWindow = (id: string) => setWindows(prev => prev.filter(w => w.id !== id));
  const minimizeWindow = (id: string) => setWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: true } : w));
  const toggleMaximize = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w));
    bringToFront(id);
  };

  const handleWindowDrag = (id: string, newPosition: { x: number, y: number }) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, position: newPosition } : w));
  };
  
  const handleWindowResize = (id: string, newSize: { width: string, height: string }, newPosition: { x: number, y: number }) => {
    setWindows(prev => prev.map(w => w.id === id ? { 
      ...w, 
      size: { width: parseInt(newSize.width), height: parseInt(newSize.height) },
      position: newPosition,
    } : w));
  };

  const handleTaskbarClick = (id: string) => {
    const win = windows.find(w => w.id === id);
    if (!win) return;
    const topWindow = windows.filter(w => !w.minimized).reduce((top, w) => (w.zIndex > (top?.zIndex ?? -1) ? w : top), null as AppWindow | null);
    if (win.minimized) {
      setWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: false } : w));
      bringToFront(id);
    } else {
      win.id === topWindow?.id ? minimizeWindow(id) : bringToFront(id);
    }
  };

  const showDesktop = () => setWindows(prev => prev.map(w => ({ ...w, minimized: true })));

  const handleNextWallpaper = () => {
    const wallpapers = data.desktopConfig.wallpapers;
    if (!wallpapers || wallpapers.length === 0) return;
    const currentIndex = wallpapers.findIndex((wp: any) => wp.path === currentWallpaper);
    const nextIndex = (currentIndex + 1) % wallpapers.length;
    setCurrentWallpaper(wallpapers[nextIndex].path);
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };
  
  const contextMenuItems: ContextMenuItem[] = [
    { label: "View", action: () => {} },
    { label: " ▸ Large Icons", action: () => setIconSize('large') },
    { label: " ▸ Medium Icons", action: () => setIconSize('medium') },
    { label: " ▸ Small Icons", action: () => setIconSize('small') },
    { label: "Refresh", action: () => {} },
    { label: "Next Wallpaper", action: handleNextWallpaper },
  ];

  if (loading || !data) {
    return <div>Loading Portfolio...</div>;
  }

  // --- Dynamic Content Generation ---
  const desktopIcons: DesktopIconDef[] = data.desktopConfig.icons.map((icon: any) => ({
    ...icon,
    content: (() => {
      switch(icon.id) {
        case 'about': return <AboutContent info={data.personalInfo} />;
        case 'explorer': return <ProjectsContent portfolioData={data} />;
        case 'games': return <GamesContent />;
        case 'browser': return null;
        default: return null;
      }
    })()
  }));

  const startMenuItems: StartMenuItem[] = [];
  const programs = desktopIcons.filter(icon => !icon.filePath && icon.id !== 'about');
  const files = desktopIcons.filter(icon => icon.filePath);

  // Manually add About and Contact first
  startMenuItems.push({ label: 'About', icon: '/icons/about.png', action: () => openWindow(desktopIcons.find(i => i.id === 'about')!) });
  startMenuItems.push({
    label: 'Contact',
    icon: '/icons/contact.png',
    action: () => {
      setWindows((prev) => {
        const exists = prev.find((w) => w.id === "contact");
        if (exists) {
           bringToFront("contact");
           return prev.map(w => w.id === 'contact' ? {...w, minimized: false} : w);
        }
        const newZ = zCounter + 1;
        const newPosition = { x: 180 + (prev.length % 10) * 30, y: 130 + (prev.length % 10) * 30 };
        const newWin: AppWindow = {
            id: "contact", 
            title: "Contact", 
            content: <ContactContent info={data.personalInfo.contact} />, 
            minimized: false, 
            maximized: false, 
            zIndex: newZ, 
            position: newPosition,
            size: DEFAULT_WINDOW_SIZE, 
            icon: '/icons/contact.png'
        };
        setZCounter(newZ);
        return [...prev, newWin];
      });
    }
  });
  
  // Add other programs and files
  programs.forEach(icon => startMenuItems.push({
    label: icon.title,
    icon: icon.icon,
    action: () => openWindow(icon)
  }));
  startMenuItems.push({ label: '---', icon: '', action: () => {} });
  files.forEach(file => startMenuItems.push({
    label: file.title,
    icon: file.icon,
    action: () => openWindow(file)
  }));

  return (
    <div className="desktop" style={{ backgroundImage: `url(${currentWallpaper})`}}>
      <div className={`desktop-main ${iconSize}-icons`} ref={desktopRef} onContextMenu={handleContextMenu}>
        {desktopIcons.map(icon => (
          <Icon
            key={icon.id}
            id={icon.id}
            title={icon.title}
            icon={icon.icon}
            onDoubleClick={() => openWindow(icon)}
            gridPosition={iconPositions[icon.id] || {x: 0, y: 0}}
            onPositionChange={updateIconPosition}
            cellSize={cellSize}
          />
        ))}
        {windows.map(w =>
          !w.minimized ? (
            <Window
              key={w.id}
              windowData={w}
              onDragStop={(newPos) => handleWindowDrag(w.id, newPos)}
              onResizeStop={(newSize, newPos) => handleWindowResize(w.id, newSize, newPos)}
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
        toggleStartMenu={(e) => { e.stopPropagation(); setCalendarOpen(false); setStartOpen(s => !s);}}
        toggleCalendar={(e) => { e.stopPropagation(); setStartOpen(false); setCalendarOpen(c => !c);}}
      />
      
      <StartMenu 
        ref={startMenuRef}
        open={startOpen} 
        items={startMenuItems} 
        onClose={() => setStartOpen(false)}
      />
      <Calendar 
        ref={calendarRef}
        open={calendarOpen} 
      />
      
      {contextMenu.visible && (
        <ContextMenu 
          ref={contextMenuRef}
          x={contextMenu.x} 
          y={contextMenu.y} 
          items={contextMenuItems}
          onClose={() => setContextMenu({ ...contextMenu, visible: false })}
        />
      )}

      {bsod && <BlueScreen />}
    </div>
  );
};

export default Desktop;