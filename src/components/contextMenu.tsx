import { forwardRef } from 'react';
import '../styles/contextmenu.css';

export interface ContextMenuItem {
  label: string;
  action: () => void;
}

interface Props {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu = forwardRef<HTMLDivElement, Props>(({ x, y, items, onClose }, ref) => {
  return (
    <div className="context-menu" style={{ top: y, left: x }} ref={ref}>
      <ul>
        {items.map((item, index) => (
          // The item's own stopPropagation is no longer needed but is harmless
          <li key={index} onClick={() => { item.action(); onClose(); }}>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
});

export default ContextMenu;