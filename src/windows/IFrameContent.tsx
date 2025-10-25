import React, { useState } from "react";

interface IframeContentProps {
  /** The URL or path to the external content/file */
  filePath: string;
}

/**
 * Renders an iframe with a zoom slider control.
 */
const IframeContent: React.FC<IframeContentProps> = ({ filePath }) => {
  // State for the zoom level. Initial value 1.0 (100%)
  const [zoomLevel, setZoomLevel] = useState(1.0); 

  // Handler to update zoom state from the slider
  const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setZoomLevel(parseFloat(event.target.value));
  };

  // The CSS transform style to apply
  const iframeStyle: React.CSSProperties = {
    flexGrow: 1, 
    width: `${100 / zoomLevel}%`, // Adjust width/height to keep container full and content centered
    height: `${100 / zoomLevel}%`,
    border: "none",
    transform: `scale(${zoomLevel})`,
    transformOrigin: "0 0", // Anchor the zoom in the top-left corner
  };
  
  // Wrapper style to handle the scaled content
  const wrapperStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    overflow: "auto", // Allows scrolling when content is larger than 100%
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden", // Hide overflow for the main window content
      }}
    >
      {/* --- Zoom Controls --- */}
      <div 
        style={{ 
          padding: "5px 10px", 
          backgroundColor: "#F0F0F0", 
          borderBottom: "1px solid #C0C0C0",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <label htmlFor="zoom-slider">Zoom:</label>
        <input
          id="zoom-slider"
          type="range"
          min="0.5"   // Minimum zoom (50%)
          max="2.0"   // Maximum zoom (200%)
          step="0.1"
          value={zoomLevel}
          onChange={handleZoomChange}
          style={{ flexGrow: 1 }}
        />
        <span style={{ minWidth: "50px", textAlign: "right", fontWeight: "bold" }}>
          {Math.round(zoomLevel * 100)}%
        </span>
      </div>

      {/* --- Iframe Container --- */}
      <div style={wrapperStyle}>
        <iframe
          src={filePath}
          title={`External Content: ${filePath}`}
          style={iframeStyle}
          allow="fullscreen; payment; geolocation" 
        />
      </div>
    </div>
  );
};

export default IframeContent;