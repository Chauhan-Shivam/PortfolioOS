// src/components/BlueScreen.tsx
import React from "react";
import "../styles/global.css"; // For font

const BlueScreen: React.FC = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "#0000aa",
      color: "white",
      zIndex: 99999,
      fontFamily: "monospace",
      padding: "50px",
    }}
  >
    <h1>:(</h1>
    <p>
      Your PC ran into a problem and needs to restart. We're just collecting
      some error info, and then we'll restart for you.
    </p>
    <p style={{ marginTop: "20px" }}>Stop code: 0x0000001A MEMORY_MANAGEMENT</p>
  </div>
);

export default BlueScreen;
