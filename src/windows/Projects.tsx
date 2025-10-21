import React, { useState } from "react";
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

const ProjectsContent: React.FC<Props> = ({ portfolioData }) => {
  const [currentLocation, setCurrentLocation] = useState("Projects");

  const dynamicFileSystem = {
    ...portfolioData.fileSystem,
    Desktop: {
      files: portfolioData.desktopConfig.icons.map((icon: any) => ({
        id: `desktop-shortcut-${icon.id}`,
        name: icon.title,
        type: "Shortcut",
        dateModified: "",
        icon: icon.icon,
        // Carry over the filePath if it exists, so desktop shortcuts also work from here
        filePath: icon.filePath,
      })),
    },
  };

  // FIXED: This function now opens files correctly
  const handleOpenFile = (file: SubFile) => {
    if (file.filePath) {
      window.open(file.filePath, "_blank");
    } else {
      alert(
        `File not Found\n'${file.name}' may have been moved, renamed, or deleted.`
      );
    }
  };

  return (
    <ExplorerWindow
      fileSystem={dynamicFileSystem}
      currentLocation={currentLocation}
      onLocationChange={setCurrentLocation}
      openFile={handleOpenFile}
    />
  );
};

export default ProjectsContent;
