import React, { useState, useMemo, useCallback } from "react";
import ExplorerWindow, { type SubFile } from "../components/ExplorerWindow";

interface PortfolioData {
  desktopConfig: {
    icons: any[];
  };
  fileSystem: {
    [key: string]: {
      files: SubFile[];
    };
  };
}

interface Props {
  portfolioData: PortfolioData;
}

/**
 * A component that wraps the ExplorerWindow to display the user's projects
 * and other file system data.
 */
const ProjectsContent: React.FC<Props> = ({ portfolioData }) => {
  /**
   * State for the currently selected location (e.g., "Projects", "Desktop")
   * in the ExplorerWindow's navigation pane.
   */
  const [currentLocation, setCurrentLocation] = useState("Projects");

  /**
   * Memoized file system data.
   * This dynamically merges the static file system from props with
   * the desktop icons (as shortcuts).
   * This is memoized so it only recalculates when portfolioData changes,
   * not on every render (e.g., when currentLocation changes).
   */
  const dynamicFileSystem = useMemo(() => {
    // Create a new "Desktop" location that lists all desktop icons as files
    const desktopFiles = portfolioData.desktopConfig.icons.map((icon: any) => ({
      id: `desktop-shortcut-${icon.id}`,
      name: icon.title,
      type: "Shortcut",
      dateModified: "", // Shortcuts don't have a modification date
      icon: icon.icon,
      // Carry over the filePath so opening the "shortcut" works
      filePath: icon.filePath,
    }));

    // Return the original file system with the new "Desktop" location merged in
    return {
      ...portfolioData.fileSystem,
      Desktop: {
        files: desktopFiles,
      },
    };
  }, [portfolioData]); // Dependency: Only recalculate if portfolioData changes

  /**
   * Memoized callback for handling file "open" events from the ExplorerWindow.
   * This is wrapped in useCallback to ensure a stable function reference is
   * passed to ExplorerWindow, preventing unnecessary re-renders.
   */
  const handleOpenFile = useCallback((file: SubFile) => {
    if (file.filePath) {
      // If the file has a path, open it in a new tab
      window.open(file.filePath, "_blank");
    } else {
      // If it's a folder or non-file, show a simple alert
      alert(
        `File not Found\n'${file.name}' may have been moved, renamed, or deleted.`
      );
    }
  }, []); // Empty dependency array: This function never needs to be recreated

  return (
    <ExplorerWindow
      fileSystem={dynamicFileSystem} // Pass the memoized file system
      currentLocation={currentLocation}
      onLocationChange={setCurrentLocation} // setState functions are stable
      openFile={handleOpenFile} // Pass the memoized open handler
    />
  );
};

export default ProjectsContent;