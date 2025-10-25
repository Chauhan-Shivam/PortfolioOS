import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import '../styles/explorer.css';

export interface SubFile {
  id: string;
  name: string;
  type: string;
  dateModified: string;
  icon: string;
  filePath?: string;
}

interface ExplorerWindowProps {
  fileSystem: {
    [key: string]: {
      files: SubFile[];
    };
  };
  currentLocation: string;
  onLocationChange: (newLocation: string) => void;
  openFile: (file: SubFile) => void;
}

/**
 * A component that simulates a file explorer window, with a navigation
 * pane on the left and a file content pane on the right, now featuring
 * resizable columns.
 */
const ExplorerWindow: React.FC<ExplorerWindowProps> = ({
  fileSystem,
  currentLocation,
  onLocationChange,
  openFile,
}) => {
  // --- STATE ---
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Initial column widths: Set Name to a fixed pixel width (not 1fr) 
  // to prevent infinite stretching when the window is wide.
  const [gridColumnWidths, setGridColumnWidths] = useState({
    name: '250px', 
    date: '160px',
    type: '120px',
  });

  // State to track resizing in progress
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const resizeRef = useRef<{ 
    initialX: number; 
    colId: 'name' | 'date' | 'type'; 
    initialWidth: number;
    containerWidth: number;
  } | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // --- MEMOIZED DATA ---

  const locations = useMemo(() => Object.keys(fileSystem), [fileSystem]);

  const filesToShow = useMemo(
    () => fileSystem[currentLocation]?.files || [],
    [fileSystem, currentLocation]
  );
  
  /**
   * Generates the CSS grid-template-columns value from the state.
   */
  const gridColumnsStyle = useMemo(() => 
    `${gridColumnWidths.name} ${gridColumnWidths.date} ${gridColumnWidths.type}`,
    [gridColumnWidths]
  );

  // --- CALLBACKS: UI INTERACTION ---

  /**
   * Handles navigation clicks.
   */
  const handleNavClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const navItem = target.closest<HTMLElement>('.nav-item');
    const location = navItem?.dataset.location;

    if (location) {
      onLocationChange(location);
    }
  }, [onLocationChange]);

  /**
   * Handles single clicks on files.
   */
  const handleFileClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Don't deselect if we are clicking the resize handle
    if (target.classList.contains('resize-handle')) return;

    const row = target.closest<HTMLElement>('.explorer-row');
    const fileId = row?.dataset.fileId;
    setSelectedFile(fileId || null);
  }, []);

  /**
   * Handles double clicks on files to open them.
   */
  const handleFileDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const row = target.closest<HTMLElement>('.explorer-row');
    const fileId = row?.dataset.fileId;

    if (fileId) {
      const fileToOpen = filesToShow.find(f => f.id === fileId);
      if (fileToOpen) {
        openFile(fileToOpen);
      }
    }
  }, [filesToShow, openFile]);
  
  // --- CALLBACKS: COLUMN RESIZING LOGIC ---
  
  /**
   * Initiates the resize process on mouse down on a drag handle.
   */
  const startResize = useCallback((e: React.MouseEvent, colId: 'name' | 'date' | 'type') => {
    e.preventDefault();
    setIsResizing(true);
    
    // Extract the pixel width of the current column
    const currentWidthPx = headerRef.current?.querySelector(`.explorer-cell.${colId}`)?.clientWidth || 0;

    resizeRef.current = {
      initialX: e.clientX,
      colId: colId,
      initialWidth: currentWidthPx,
      containerWidth: headerRef.current?.clientWidth || 0,
    };
  }, []);

  /**
   * Handles mouse move events during a resize drag.
   */
  const resizeColumn = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeRef.current) return;

    const { initialX, colId, initialWidth } = resizeRef.current;
    const dx = e.clientX - initialX;
    
    // Add the drag distance (dx) to increase column width when dragging right.
    let newWidth = initialWidth + dx; 

    // Apply minimum width constraints (e.g., 60px)
    if (newWidth < 60) {
      newWidth = 60;
    }
    
    // Update the state with the new pixel width
    setGridColumnWidths(prev => ({
      ...prev,
      [colId]: `${newWidth}px`,
    }));
  }, [isResizing]);

  /**
   * Finalizes the resize process on mouse up.
   */
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
    
    // Cleanup function 
    return () => {
      document.removeEventListener('mousemove', resizeColumn);
      document.removeEventListener('mouseup', stopResize);
      document.body.style.cursor = 'default';
    };
  }, [isResizing, resizeColumn, stopResize]); 

  // --- RENDER ---

  return (
    // Apply the custom CSS variable for the grid columns
    <div className="explorer-window" style={{ '--grid-columns': gridColumnsStyle } as React.CSSProperties}>
      {/* Left Navigation Pane */}
      <div className="explorer-nav" onClick={handleNavClick}>
        <div className="nav-header">Favorites</div>
        {locations.map(loc => (
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
        {/* The Path Bar */}
        <div className="explorer-path-bar">
          <input type="text" readOnly value={`Computer > ${currentLocation}`} />
        </div>

        <div className="explorer-content">
          {/* Header row, used to track column widths and attach handlers */}
          <div className="explorer-header" ref={headerRef}>
            
            {/* Handle to resize the Name column (between Name and Date) */}
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
              {/* Handle to resize the Date column (between Date and Type) */}
              <div 
                className="resize-handle" 
                onMouseDown={(e) => startResize(e, 'date')} 
                data-column="date"
              />
            </div>
            
            <div className="explorer-cell type">
              Type
              {/* REMOVED: No handle here, as there is nothing to resize to the right. */}
            </div>
          </div>

          {/* Delegated click and double-click handlers are attached to the body. */}
          <div
            className="explorer-body"
            onClick={handleFileClick}
            onDoubleClick={handleFileDoubleClick}
          >
            {filesToShow.map((file) => (
              <div
                key={file.id}
                className={`explorer-row ${selectedFile === file.id ? 'selected' : ''}`}
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