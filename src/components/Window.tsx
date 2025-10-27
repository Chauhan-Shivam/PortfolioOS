import React from "react";
import { Rnd } from "react-rnd";
import "../styles/window.css";
import type { AppWindow } from "./types";

interface WindowProps {
  windowData: AppWindow;
  bringToFront: () => void;
  close: () => void;
  minimize: () => void;
  toggleMaximize: () => void;
  onDragStop: (newPosition: { x: number; y: number }) => void;
  onResizeStop: (
    newSize: { width: string; height: string },
    newPosition: { x: number; y: number }
  ) => void;
  resizable?: boolean;
}

const Window: React.FC<WindowProps> = ({
  windowData,
  bringToFront,
  close,
  minimize,
  toggleMaximize,
  onDragStop,
  onResizeStop,
  resizable = true,
}) => {
  const {
    title,
    content,
    zIndex,
    position,
    size,
    minimized,
    maximized,
    icon,
  } = windowData;

  if (minimized) {
    return null;
  }

  return (
    <Rnd
      className={`window ${maximized ? "maximized" : ""}`}
      style={{ zIndex }}
      size={maximized ? { width: "100%", height: "100%" } : size}
      position={maximized ? { x: 0, y: 0 } : position}
      onDragStart={bringToFront}
      onDragStop={(_e, d) => {
        if (maximized) return;
        onDragStop({ x: d.x, y: d.y });
      }}
      onResizeStart={bringToFront}
      onResizeStop={(_e, _direction, ref, _delta, position) => {
        onResizeStop(
          { width: ref.style.width, height: ref.style.height },
          position
        );
      }}
      minWidth={300} // Keep existing constraints
      minHeight={200} // Keep existing constraints
      disableDragging={maximized}
      enableResizing={!maximized && resizable}
      // --- End change ---
      bounds=".desktop-main" // Keep existing bounds
      dragHandleClassName="window-header" // Important: Use the correct class for dragging
    >
      {/* This internal wrapper is needed for flex layout if using the provided CSS */}
      <div className="window-body">
        <div className="window-header" onMouseDown={bringToFront}>
          <div className="window-title">
            <img src={icon} alt={title} className="window-title-icon" />{" "}
            {/* Using window-title-icon */}
            <span>{title}</span>
          </div>
          <div className="window-controls">
            <button
              onClick={minimize}
              aria-label="Minimize"
              className="window-btn minimize"
            >
              _
            </button>{" "}
            {/* Using window-btn */}
            <button
              onClick={toggleMaximize}
              aria-label="Maximize"
              className={`window-btn ${maximized ? "restore" : "maximize"}`}
            >
              {" "}
              {/* Using window-btn */}
              {maximized ? "❐" : "□"}
            </button>
            <button
              onClick={close}
              aria-label="Close"
              className="window-btn close"
            >
              X
            </button>{" "}
            {/* Using window-btn */}
          </div>
        </div>
        <div className="window-content">{content}</div>
      </div>
    </Rnd>
  );
};

export default Window;
