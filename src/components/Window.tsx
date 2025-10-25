import React, { useMemo, useCallback, memo } from "react";
import { Rnd, type Props as RndProps } from "react-rnd";
import "../styles/window.css";
import "../styles/global.css";
// Assuming AppWindow is defined in a type file, e.g., './Desktop'
import type { AppWindow } from "./Desktop"; 

interface WindowProps {
  /** The data object containing the window's state (id, title, position, etc.) */
  windowData: AppWindow;
  /** Callback function invoked when the 'close' button is clicked. */
  close: () => void;
  /** Callback function invoked when the 'minimize' button is clicked. */
  minimize: () => void;
  /** Callback function invoked when the 'maximize' button or header is double-clicked. */
  toggleMaximize: () => void;
  /** Callback function invoked on mousedown to bring the window to the front (highest z-index). */
  bringToFront: () => void;
  /** Callback fired when dragging stops, returning the new position. */
  onDragStop: (position: { x: number; y: number }) => void;
  /** Callback fired when resizing stops, returning the new size and position. */
  onResizeStop: (
    size: { width: string; height: string },
    position: { x: number; y: number }
  ) => void;
}

/**
 * A draggable, resizable, and memoized window component.
 *
 * This component acts as the visual container for an application,
 * handling its position, size, and state (maximized, z-index).
 * It uses `react-rnd` for drag and resize functionality and `React.memo`
 * to prevent unnecessary re-renders when other windows are manipulated.
 *
 * The internal layout (header and content) is managed by a flexbox
 * wrapper (`.window-body`) to avoid conflicts with react-rnd's handles.
 */
const Window: React.FC<WindowProps> = ({
  windowData,
  close,
  minimize,
  toggleMaximize,
  bringToFront,
  onDragStop,
  onResizeStop,
}) => {
  /**
   * Memoizes the `onDragStop` handler for `react-rnd`.
   * The argument types are correctly inferred from RndProps["onDragStop"].
   */
  const handleDragStop: RndProps["onDragStop"] = useCallback(
    (_e: any, d: { x: any; y: any; }) => {
      onDragStop({ x: d.x, y: d.y });
    },
    [onDragStop]
  );

  /**
   * Memoizes the `onResizeStop` handler for `react-rnd`.
   * The argument types are correctly inferred from RndProps["onResizeStop"],
   * resolving the previous 'implicitly has an any type' error.
   */
  const handleResizeStop: RndProps["onResizeStop"] = useCallback(
    (_e: any, _direction: any, ref: { style: { width: any; height: any; }; }, _delta: any, pos: { x: number; y: number; }) => {
      onResizeStop(
        { width: ref.style.width, height: ref.style.height },
        pos
      );
    },
    [onResizeStop]
  );

  /**
   * Memoizes the `style` object for `react-rnd`.
   */
  const windowStyle = useMemo(
    () => ({
      zIndex: windowData.zIndex,
    }),
    [windowData.zIndex]
  );

  /**
   * Memoizes the `size` object for `react-rnd`, handling the maximized state.
   */
  const windowSize = useMemo(
    () =>
      windowData.maximized
        ? { width: "100%", height: "100%" }
        : windowData.size,
    [windowData.maximized, windowData.size]
  );

  /**
   * Memoizes the `position` object for `react-rnd`, handling the maximized state.
   */
  const windowPosition = useMemo(
    () => (windowData.maximized ? { x: 0, y: 0 } : windowData.position),
    [windowData.maximized, windowData.position]
  );

  return (
    <Rnd
      className={`window glass ${windowData.maximized ? "maximized" : ""}`}
      size={windowSize}
      position={windowPosition}
      style={windowStyle}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      minWidth={320}
      minHeight={240}
      bounds="parent"
      enableResizing={!windowData.maximized}
      disableDragging={windowData.maximized}
      onMouseDown={bringToFront}
      dragHandleClassName="window-header"
    >
      {/* The .window-body wrapper ensures the internal flex layout
        does not interfere with react-rnd's resize handles.
      */}
      <div className="window-body">
        <div className="window-header" onDoubleClick={toggleMaximize}>
          <div className="window-title">
            <img src={windowData.icon} alt="" className="window-title-icon" />
            {windowData.title}
          </div>
          <div className="window-controls">
            <button
              className="window-btn minimize"
              onClick={minimize}
              aria-label="Minimize"
            >
              ─
            </button>
            <button
              className="window-btn maximize"
              onClick={toggleMaximize}
              aria-label="Maximize"
            >
              □
            </button>
            <button
              className="window-btn close"
              onClick={close}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="window-content">{windowData.content}</div>
      </div>
    </Rnd>
  );
};

// Memoize the component for performance.
export default memo(Window);