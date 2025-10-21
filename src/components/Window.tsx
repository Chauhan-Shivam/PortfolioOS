import React from "react"; // Removed useState
import { Rnd } from "react-rnd";
import "../styles/window.css";
import "../styles/global.css";
import type { AppWindow } from "./Desktop";

interface WindowProps {
  windowData: AppWindow;
  close: () => void;
  minimize: () => void;
  toggleMaximize: () => void;
  bringToFront: () => void;
  onDragStop: (position: { x: number; y: number }) => void;
  onResizeStop: (
    size: { width: string; height: string },
    position: { x: number; y: number }
  ) => void;
}

const Window: React.FC<WindowProps> = ({
  windowData,
  close,
  minimize,
  toggleMaximize,
  bringToFront,
  onDragStop,
  onResizeStop,
}) => {
  // REMOVED: Internal state for size and position is gone.

  return (
    <Rnd
      className={`window glass ${windowData.maximized ? "maximized" : ""}`}
      // FIXED: Size and position are now taken directly from props
      size={
        windowData.maximized
          ? { width: "100%", height: "100%" }
          : windowData.size
      }
      position={windowData.maximized ? { x: 0, y: 0 } : windowData.position}
      // Pass the events up to the Desktop component to update the state
      onDragStop={(_e, d) => onDragStop({ x: d.x, y: d.y })}
      onResizeStop={(_e, _direction, ref, _delta, pos) => {
        onResizeStop({ width: ref.style.width, height: ref.style.height }, pos);
      }}
      minWidth={320}
      minHeight={240}
      bounds="parent"
      style={{ zIndex: windowData.zIndex }}
      enableResizing={!windowData.maximized}
      disableDragging={windowData.maximized}
      onMouseDown={bringToFront}
      dragHandleClassName="window-header"
    >
      <div className="window-header" onDoubleClick={toggleMaximize}>
        <div className="window-title">
          <img src={windowData.icon} alt="" className="window-title-icon" />
          {windowData.title}
        </div>
        <div className="window-controls">
          <button className="window-btn minimize" onClick={minimize}>
            ─
          </button>
          <button className="window-btn maximize" onClick={toggleMaximize}>
            □
          </button>
          <button className="window-btn close" onClick={close}>
            ✕
          </button>
        </div>
      </div>
      <div className="window-content">{windowData.content}</div>
    </Rnd>
  );
};

export default Window;
