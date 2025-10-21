import React from 'react';
import '../styles/explorer.css';

export interface SubFile {
  id: string;
  name: string;
  type: string;
  dateModified: string;
  icon: string;
  filePath?: string; // Important for the next fix
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

const ExplorerWindow: React.FC<ExplorerWindowProps> = ({
  fileSystem,
  currentLocation,
  onLocationChange,
  openFile,
}) => {
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const locations = Object.keys(fileSystem);
  const filesToShow = fileSystem[currentLocation]?.files || [];

  return (
    <div className="explorer-window">
      {/* Left Navigation Pane */}
      <div className="explorer-nav">
        <div className="nav-header">Favorites</div>
        {locations.map(loc => (
          <div
            key={loc}
            className={`nav-item ${currentLocation === loc ? 'active' : ''}`}
            onClick={() => onLocationChange(loc)}
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

          <div className="explorer-body">
            {filesToShow.map((file) => (
              <div
                key={file.id}
                className={`explorer-row ${selectedFile === file.id ? 'selected' : ''}`}
                onClick={() => setSelectedFile(file.id)}
                onDoubleClick={() => openFile(file)}
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