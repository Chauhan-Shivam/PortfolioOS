import React, { useState, useRef } from 'react';
import '../styles/icon.css';
import '../styles/global.css';

interface Props {
  id: string;
  title: string;
  icon: string;
  gridPosition: { x: number; y: number };
  cellSize: number;
  onDoubleClick: () => void;
  onPositionChange: (id: string, mouseX: number, mouseY: number) => void;
}

const DRAG_THRESHOLD = 5;

const Icon: React.FC<Props> = ({ id, title, icon, gridPosition, cellSize, onDoubleClick, onPositionChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const startMousePos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    hasMoved.current = false;
    startMousePos.current = { x: e.clientX, y: e.clientY };

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startMousePos.current.x;
      const dy = moveEvent.clientY - startMousePos.current.y;

      if (!hasMoved.current && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        hasMoved.current = true;
        setIsDragging(true);
      }

      if (hasMoved.current) {
        setOffset({ x: dx, y: dy });
      }
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      if (hasMoved.current) {
        // FIXED: Pass the final raw mouse coordinates to the parent
        onPositionChange(id, upEvent.clientX, upEvent.clientY);
      }
      
      setIsDragging(false);
      setOffset({ x: 0, y: 0 });
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const initialX = gridPosition.x * cellSize;
  const initialY = gridPosition.y * cellSize;

  return (
    <div
      className={`desktop-icon ${isDragging ? 'dragging' : ''}`}
      onDoubleClick={onDoubleClick}
      onMouseDown={handleMouseDown}
      style={{
        transform: `translate(${initialX + offset.x}px, ${initialY + offset.y}px)`,
      }}
    >
      <img src={icon} alt={title} className="icon-image" />
      <span className="icon-title">{title}</span>
    </div>
  );
};

export default Icon;