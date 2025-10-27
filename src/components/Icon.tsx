import React, { useState, useRef, useCallback, useMemo } from "react";
import "../styles/icon.css";
import "../styles/global.css";

interface Props {
  id: string;
  title: string;
  icon: string;
  gridPosition: { x: number; y: number };
  cellSize: number;
  onDoubleClick: () => void;
  onPositionChange: (id: string, mouseX: number, mouseY: number) => void;
}

/**
 * A threshold (in pixels) to differentiate a click from a drag.
 * The user must move the mouse this far for a drag to begin.
 */
const DRAG_THRESHOLD = 5;

/**
 * A draggable desktop icon component.
 * It handles its own grid-based position and drag-and-drop logic.
 */
const Icon: React.FC<Props> = ({
  id,
  title,
  icon,
  gridPosition,
  cellSize,
  onDoubleClick,
  onPositionChange,
}) => {
  /**
   * Tracks the visual "dragging" state to apply a CSS class.
   */
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Tracks the pixel offset from the icon's starting position during a drag.
   * This is a "controlled" state that updates on mouse move.
   */
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  /**
   * Ref to store the initial mouse position when a drag starts.
   * Using a ref prevents re-renders when this value changes.
   */
  const startMousePos = useRef({ x: 0, y: 0 });

  /**
   * Ref to track if the mouse has moved past the DRAG_THRESHOLD.
   * This helps prevent a simple click from being treated as a drag.
   */
  const hasMoved = useRef(false);

  /**
   * Memoized event handler for mouse movement during a drag.
   * This function is attached to the 'document' on mousedown.
   */
  const handleMouseMove = useCallback((moveEvent: MouseEvent) => {
    // Calculate the distance moved from the start
    const dx = moveEvent.clientX - startMousePos.current.x;
    const dy = moveEvent.clientY - startMousePos.current.y;

    // Check if the drag threshold has been surpassed
    if (!hasMoved.current && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
      hasMoved.current = true;
      setIsDragging(true); // Now we are officially dragging
    }

    // If we are in a dragging state, update the visual offset
    if (hasMoved.current) {
      setOffset({ x: dx, y: dy });
    }
  }, []); // Empty dependency array: this function is stable

  /**
   * Memoized event handler for mouse release, ending a drag.
   * This function is attached to the 'document' on mousedown.
   */
  const handleMouseUp = useCallback(
    (upEvent: MouseEvent) => {
      // Always remove global listeners on mouse up
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      // If the mouse actually moved, notify the parent of the new position
      if (hasMoved.current) {
        // Pass the final raw mouse coordinates for the parent to calculate
        onPositionChange(id, upEvent.clientX, upEvent.clientY);
      }

      // Reset all drag-related state
      setIsDragging(false);
      setOffset({ x: 0, y: 0 });
      hasMoved.current = false; // Reset for the next mousedown
    },
    [id, onPositionChange, handleMouseMove]
  ); // Depends on props and the memoized mousemove handler

  /**
   * Memoized event handler for the initial mouse down on the icon.
   * This function initiates the drag-and-drop process.
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent text selection or image drag

      // Store the starting position of the drag
      hasMoved.current = false;
      startMousePos.current = { x: e.clientX, y: e.clientY };

      // Add global listeners to track mouse movement anywhere on the page
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp]
  ); // Depends on the memoized handlers

  /**
   * Memoizes the calculation of the icon's CSS `transform` style.
   * This avoids creating a new style object on every render,
   * especially during the drag operation which triggers many re-renders.
   */
  const iconStyle = useMemo(() => {
    // Calculate the icon's base position from the grid
    const initialX = gridPosition.x * cellSize;
    const initialY = gridPosition.y * cellSize;

    // Apply the drag offset to the base position
    return {
      transform: `translate(${initialX + offset.x}px, ${
        initialY + offset.y
      }px)`,
    };
  }, [gridPosition, cellSize, offset]); // Recalculate if grid or offset changes

  return (
    <div
      className={`desktop-icon ${isDragging ? "dragging" : ""}`}
      onDoubleClick={onDoubleClick}
      onMouseDown={handleMouseDown}
      style={iconStyle}
    >
      <img src={icon} alt={title} className="icon-image" />
      <span className="icon-title">{title}</span>
    </div>
  );
};

export default Icon;
