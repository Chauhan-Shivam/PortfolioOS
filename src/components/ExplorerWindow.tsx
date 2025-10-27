import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import '../styles/explorer.css';
import type { DesktopIconDef } from './Desktop'; // Import the one true type

// --- TYPE DEFINITIONS ---

/**
 * Defines the structure for a file or folder shown in the explorer.
 */
export interface SubFile {
  id: string;
  name: string;
  type: string;
  dateModified: string;
  icon: string;
  filePath?: string;
}

/**
 * An explicit type for the file system object.
 */
type FileSystemType = {
  [key: string]: {
    files: SubFile[];
  };
};

// --- UPDATED PROP INTERFACE ---
interface ExplorerWindowProps {
  desktopIcons: DesktopIconDef[]; // <-- CHANGED
  fileSystem: FileSystemType;    // <-- CHANGED
  openWindow: (iconDef: DesktopIconDef) => void;
}

/**
 * A component that simulates a file explorer window.
 * This component contains its own state management for
 * navigation and file system logic.
 */
const ExplorerWindow: React.FC<ExplorerWindowProps> = ({
  desktopIcons, // <-- CHANGED
  fileSystem,    // <-- CHANGED
  openWindow,
}) => {
  // --- STATE & REFS (for UI: resizing, selection) ---
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [gridColumnWidths, setGridColumnWidths] = useState({
    name: '250px',
    date: '160px',
    type: '120px',
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const resizeRef = useRef<{
    initialX: number;
    colId: 'name' | 'date' | 'type';
    initialWidth: number;
    containerWidth: number;
  } | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // --- FILE SYSTEM & NAVIGATION LOGIC ---

  /**
   * Memoized file system data, merging desktop icons as shortcuts.
   */
  const dynamicFileSystem = useMemo((): FileSystemType => {
    // Use the processed desktopIcons prop
    const desktopFiles: SubFile[] = desktopIcons.map((icon) => ({
      id: `desktop-shortcut-${icon.id}`,
      name: icon.title,
      type: 'Shortcut',
      dateModified: '',
      icon: icon.icon,
      filePath: icon.filePath,
    }));

    return {
      // Use the raw fileSystem prop
      ...fileSystem,
      Desktop: {
        files: desktopFiles,
      },
    };
  }, [desktopIcons, fileSystem]); // <-- Dependencies updated

  /**
   * Memoized list of available navigation locations.
   */
  const locations = useMemo(
    () => Object.keys(dynamicFileSystem),
    [dynamicFileSystem]
  );

  /**
   * Internal state for the current folder being viewed.
   */
  const [currentLocation, setCurrentLocation] = useState(
    () => locations[0] || 'Desktop'
  );

  /**
   * Memoized list of files to display based on the current location.
   */
  const filesToShow = useMemo(
    () => dynamicFileSystem[currentLocation]?.files || [],
    [dynamicFileSystem, currentLocation]
  );

  /**
   * Memoized callback for handling file "open" events.
   */
  const handleOpenFile = useCallback(
    (file: SubFile) => {
      // Case 1: Check if it's a "Desktop Shortcut"
      if (file.id.startsWith('desktop-shortcut-')) {
        const originalId = file.id.replace('desktop-shortcut-', '');
        
        // Find the icon from the processed desktopIcons list
        const originalIconDef = desktopIcons.find(
          (icon) => icon.id === originalId
        );

        if (originalIconDef) {
          // This originalIconDef NOW has the .content property
          openWindow(originalIconDef);
        } else {
          alert(`Shortcut target not found for ${file.name}.`);
        }
      }
      // Case 2: Check if it's a regular file *with* a path
      else if (file.filePath) {
        const iconToOpen: DesktopIconDef = {
          id: file.id,
          title: file.name,
          icon: file.icon,
          filePath: file.filePath,
          content: null,
        };
        openWindow(iconToOpen);
      }
      // Case 3: It's a file with *no* path and *not* a shortcut
      else {
        alert(
          `File not Found\n'${file.name}' may have been moved, renamed, or deleted.`
        );
      }
    },
    [openWindow, desktopIcons] // <-- Dependency updated
  );

  /**
   * Generates the CSS grid-template-columns value from the state.
   */
  const gridColumnsStyle = useMemo(
    () =>
      `${gridColumnWidths.name} ${gridColumnWidths.date} ${gridColumnWidths.type}`,
    [gridColumnWidths]
  );

  // --- CALLBACKS: UI INTERACTION ---

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const navItem = target.closest<HTMLElement>('.nav-item');
      const location = navItem?.dataset.location;

      if (location) {
        setCurrentLocation(location);
      }
    },
    [setCurrentLocation]
  );

  const handleFileClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle')) return;

    const row = target.closest<HTMLElement>('.explorer-row');
    const fileId = row?.dataset.fileId;
    setSelectedFile(fileId || null);
  }, []);

  const handleFileDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const row = target.closest<HTMLElement>('.explorer-row');
      const fileId = row?.dataset.fileId;

      if (fileId) {
        const fileToOpen = filesToShow.find((f) => f.id === fileId);
        if (fileToOpen) {
          handleOpenFile(fileToOpen);
        }
      }
    },
    [filesToShow, handleOpenFile]
  );

  // --- CALLBACKS: COLUMN RESIZING LOGIC ---

  const startResize = useCallback(
    (e: React.MouseEvent, colId: 'name' | 'date' | 'type') => {
      e.preventDefault();
      setIsResizing(true);
      const currentWidthPx =
        headerRef.current?.querySelector(`.explorer-cell.${colId}`)
          ?.clientWidth || 0;
      resizeRef.current = {
        initialX: e.clientX,
        colId: colId,
        initialWidth: currentWidthPx,
        containerWidth: headerRef.current?.clientWidth || 0,
      };
    },
    []
  );

  const resizeColumn = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return;
      const { initialX, colId, initialWidth } = resizeRef.current;
      const dx = e.clientX - initialX;
      let newWidth = initialWidth + dx;
      if (newWidth < 60) newWidth = 60;
      setGridColumnWidths((prev) => ({
        ...prev,
        [colId]: `${newWidth}px`,
      }));
    },
    [isResizing]
  );

  const stopResize = useCallback(() => {
    setIsResizing(false);
    resizeRef.current = null;
  }, []);

  // --- EFFECT: BIND GLOBAL EVENT LISTENERS ---

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resizeColumn);
      document.addEventListener('mouseup', stopResize);
      document.body.style.cursor = 'col-resize';
    } else {
      document.removeEventListener('mousemove', resizeColumn);
      document.removeEventListener('mouseup', stopResize);
      document.body.style.cursor = 'default';
    }
    return () => {
      document.removeEventListener('mousemove', resizeColumn);
      document.removeEventListener('mouseup', stopResize);
      document.body.style.cursor = 'default';
    };
  }, [isResizing, resizeColumn, stopResize]);

  // --- RENDER ---

  return (
    <div
      className="explorer-window"
      style={{ '--grid-columns': gridColumnsStyle } as React.CSSProperties}
    >
      {/* Left Navigation Pane */}
      <div className="explorer-nav" onClick={handleNavClick}>
        <div className="nav-header">Favorites</div>
        {locations.map((loc) => (
          <div
            key={loc}
            className={`nav-item ${currentLocation === loc ? 'active' : ''}`}
            data-location={loc}
          >
            {loc}
          </div>
        ))}
      </div>

      {/* Right Content Pane */}
      <div className="explorer-main">
        <div className="explorer-path-bar">
          <input type="text" readOnly value={`Computer > ${currentLocation}`} />
        </div>

        <div className="explorer-content">
          <div className="explorer-header" ref={headerRef}>
            <div className="explorer-cell name">
              Name
              <div
                className="resize-handle"
                onMouseDown={(e) => startResize(e, 'name')}
                data-column="name"
              />
            </div>
            <div className="explorer-cell date">
              Date modified
              <div
                className="resize-handle"
                onMouseDown={(e) => startResize(e, 'date')}
                data-column="date"
              />
            </div>
            <div className="explorer-cell type">Type</div>
          </div>

          <div
            className="explorer-body"
            onClick={handleFileClick}
            onDoubleClick={handleFileDoubleClick}
          >
            {filesToShow.map((file) => (
              <div
                key={file.id}
                className={`explorer-row ${
                  selectedFile === file.id ? 'selected' : ''
                }`}
                data-file-id={file.id}
              >
                <div className="explorer-cell name">
                  <img src={file.icon} alt={file.type} className="file-icon" />
                  <span>{file.name}</span>
                </div>
                <div className="explorer-cell date">{file.dateModified}</div>
                <div className="explorer-cell type">{file.type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplorerWindow;