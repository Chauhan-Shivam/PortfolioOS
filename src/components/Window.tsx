import React, { useMemo, useCallback, memo } from "react";
import { Rnd, type Props as RndProps } from "react-rnd";
import "../styles/window.css";
import "../styles/global.css";
import type { AppWindow } from "./Desktop";

interface WindowProps {
  /** The data object containing the window's state (id, title, position, etc.) */
  windowData: AppWindow;
  /** Callback function to close the window. */
  close: () => void;
  /** Callback function to minimize the window. */
  minimize: () => void;
  /** Callback function to toggle the window's maximized state. */
  toggleMaximize: () => void;
  /** Callback function to bring the window to the front (highest z-index). */
  bringToFront: () => void;
  /** Callback fired when dragging stops. */
  onDragStop: (position: { x: number; y: number }) => void;
  /** Callback fired when resizing stops. */
  onResizeStop: (
    size: { width: string; height: string },
    position: { x: number; y: number }
  ) => void;
}

/**
 * A draggable, resizable window component powered by react-rnd.
 *
 * This component is memoized (`React.memo`) for performance. It will only
 * re-render if its specific `windowData` prop or one of the callbacks changes.
 *
 * Callbacks and derived objects (`style`, `size`, `position`) are memoized
 * to ensure prop stability for the underlying <Rnd> component.
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
   * Memoizes the `onDragStop` handler.
   * This creates a stable function reference, preventing unnecessary
   * re-renders of the <Rnd> component.
   */
  const handleDragStop: RndProps["onDragStop"] = useCallback(
    (_e: any, d: { x: any; y: any; }) => {
      onDragStop({ x: d.x, y: d.y });
    },
    [onDragStop] // Dependency: Only re-create if the prop callback changes
  );

  /**
   * Memoizes the `onResizeStop` handler.
   * This creates a stable function reference and properly extracts
   * the size and position data for the parent.
   */
  const handleResizeStop: RndProps["onResizeStop"] = useCallback(
    (_e: any, _direction: any, ref: { style: { width: any; height: any; }; }, _delta: any, pos: { x: number; y: number; }) => {
      onResizeStop({ width: ref.style.width, height: ref.style.height }, pos);
    },
    [onResizeStop] // Dependency: Only re-create if the prop callback changes
  );

  /**
   * Memoizes the `style` object.
   * This ensures the `style` prop passed to <Rnd> is stable
   * as long as the z-index hasn't changed.
   */
  const windowStyle = useMemo(
    () => ({
      zIndex: windowData.zIndex,
    }),
    [windowData.zIndex]
  );

  /**
   * Memoizes the `size` object.
   * This prevents a new object from being created on every render,
   * especially when toggling the maximized state.
   */
  const windowSize = useMemo(
    () =>
      windowData.maximized
        ? { width: "100%", height: "100%" }
        : windowData.size,
    [windowData.maximized, windowData.size]
  );

  /**
   * Memoizes the `position` object.
   * This prevents a new object from being created on every render,
   * especially when toggling the maximized state.
   */
  const windowPosition = useMemo(
    () => (windowData.maximized ? { x: 0, y: 0 } : windowData.position),
    [windowData.maximized, windowData.position]
  );

  return (
    <Rnd
      className={`window glass ${windowData.maximized ? "maximized" : ""}`}
      // Use the memoized values for props
      size={windowSize}
      position={windowPosition}
      style={windowStyle}
      // Use the memoized handlers
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      // Standard props
      minWidth={320}
      minHeight={240}
      bounds="parent"
      enableResizing={!windowData.maximized}
      disableDragging={windowData.maximized}
      onMouseDown={bringToFront} // Passed directly (assumed stable from parent)
      dragHandleClassName="window-header"
    >
      <div className="window-header" onDoubleClick={toggleMaximize}>
        <div className="window-title">
          <img src={windowData.icon} alt="" className="window-title-icon" />
          {windowData.title}
        </div>
        <div className="window-controls">
          {/* These callbacks are passed directly (assumed stable from parent) */}
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
          <button className="window-btn close" onClick={close} aria-label="Close">
            ✕
          </button>
        </div>
      </div>
      <div className="window-content">{windowData.content}</div>
    </Rnd>
  );
};

// Wrap the component in React.memo for a significant performance boost.
// This will prevent the window from re-rendering if its props haven't changed,
// e.g., when another window is being moved.
export default memo(Window);