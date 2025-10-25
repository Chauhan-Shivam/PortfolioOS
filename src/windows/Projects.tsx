// This file is likely named Projects.tsx (which exports ProjectsContent)
// based on your Desktop.tsx import

import React, { useState, useMemo, useCallback } from "react";
import ExplorerWindow, { type SubFile } from "../components/ExplorerWindow";

// You may need to import this type from your Desktop.tsx file,
// or you can just use 'any' in the prop definition below.
import type { DesktopIconDef } from "../components/Desktop"; 

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
  openWindow: (iconDef: DesktopIconDef) => void; // <-- 1. ACCEPT THE PROP
}

/**
 * A component that wraps the ExplorerWindow to display the user's projects
 * and other file system data.
 */
const ProjectsContent: React.FC<Props> = ({ portfolioData, openWindow }) => {
  /**
   * Memoized file system data.
   */
  const dynamicFileSystem = useMemo(() => {
    const desktopFiles = portfolioData.desktopConfig.icons.map((icon: any) => ({
      id: `desktop-shortcut-${icon.id}`,
      name: icon.title,
      type: "Shortcut",
      dateModified: "", 
      icon: icon.icon,
      filePath: icon.filePath,
    }));

    return {
      ...portfolioData.fileSystem,
      Desktop: {
        files: desktopFiles,
      },
    };
  }, [portfolioData]); 

  const availableLocations = useMemo(
    () => Object.keys(dynamicFileSystem),
    [dynamicFileSystem]
  );

  const [currentLocation, setCurrentLocation] = useState(
    () => availableLocations[0] || "Desktop"
  );

  /**
   * Memoized callback for handling file "open" events.
   */
  const handleOpenFile = useCallback((file: SubFile) => {
    if (file.filePath) {
      // --- 2. THIS IS THE FIX ---
      // Convert the 'SubFile' into a 'DesktopIconDef'
      // that openWindow understands.
      const iconToOpen: DesktopIconDef = {
        id: file.id,
        title: file.name,
        icon: file.icon,
        filePath: file.filePath,
        content: null, // It's a file, so no React content
      };
      // Use the function from Desktop.tsx
      openWindow(iconToOpen);
      
    } else {
      alert(
        `File not Found\n'${file.name}' may have been moved, renamed, or deleted.`
      );
    }
  }, [openWindow]); // <-- 3. ADD openWindow as a dependency

  return (
    <ExplorerWindow
      fileSystem={dynamicFileSystem}
      currentLocation={currentLocation}
      onLocationChange={setCurrentLocation}
      openFile={handleOpenFile} // Pass the NEW handler
    />
  );
};

export default ProjectsContent;