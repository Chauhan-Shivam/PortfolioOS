import React, { useState, useMemo, useCallback } from 'react';
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
 * pane on the left and a file content pane on the right.
 */
const ExplorerWindow: React.FC<ExplorerWindowProps> = ({
  fileSystem,
  currentLocation,
  onLocationChange,
  openFile,
}) => {
  /**
   * State to keep track of the currently selected file's ID.
   */
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  /**
   * Memoized list of navigation locations (e.g., "Projects", "Documents").
   * This array is only recalculated when the fileSystem prop changes.
   */
  const locations = useMemo(() => Object.keys(fileSystem), [fileSystem]);

  /**
   * Memoized list of files to display in the main pane.
   * This array is only recalculated when the fileSystem or currentLocation props change.
   */
  const filesToShow = useMemo(
    () => fileSystem[currentLocation]?.files || [],
    [fileSystem, currentLocation]
  );

  /**
   * Handles clicks on the left navigation pane using event delegation.
   * Reads the 'data-location' attribute from the clicked .nav-item.
   */
  const handleNavClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Find the closest ancestor with the .nav-item class
    const navItem = target.closest<HTMLElement>('.nav-item');
    const location = navItem?.dataset.location;

    if (location) {
      onLocationChange(location);
    }
  }, [onLocationChange]); // Dependency: The prop function it needs to call

  /**
   * Handles single clicks on the main file body using event delegation.
   * Reads the 'data-file-id' attribute to set the selected file.
   */
  const handleFileClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const row = target.closest<HTMLElement>('.explorer-row');
    const fileId = row?.dataset.fileId;

    // Set the selected file ID, or null if clicking outside a row
    setSelectedFile(fileId || null);
  }, []); // Dependency: setSelectedFile is stable and doesn't need to be listed

  /**
   * Handles double clicks on the main file body using event delegation.
   * Reads the 'data-file-id', finds the matching file object, and calls openFile.
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
  }, [filesToShow, openFile]); // Dependencies: The data and the prop function

  return (
    <div className="explorer-window">
      {/* Left Navigation Pane */}
      {/* A single click handler is attached here for event delegation.
        This is more performant than adding a new function to every item.
      */}
      <div className="explorer-nav" onClick={handleNavClick}>
        <div className="nav-header">Favorites</div>
        {locations.map(loc => (
          <div
            key={loc}
            className={`nav-item ${currentLocation === loc ? 'active' : ''}`}
            // The 'data-location' attribute is used by the delegated handler
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
          <div className="explorer-header">
            <div className="explorer-cell name">Name</div>
            <div className="explorer-cell date">Date modified</div>
            <div className="explorer-cell type">Type</div>
          </div>

          {/* Delegated click and double-click handlers are attached to the body.
          */}
          <div
            className="explorer-body"
            onClick={handleFileClick}
            onDoubleClick={handleFileDoubleClick}
          >
            {filesToShow.map((file) => (
              <div
                key={file.id}
                className={`explorer-row ${selectedFile === file.id ? 'selected' : ''}`}
                // The 'data-file-id' is used by the delegated handlers
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