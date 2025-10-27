import React, { useState, forwardRef, useRef, useLayoutEffect } from 'react';
import '../styles/contextmenu.css';

export interface ContextMenuItem {
  label?: string;
  action?: () => void;
  submenu?: ContextMenuItem[];
  separator?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

/**
 * A recursive component to render a menu list.
 * It renders itself for any submenus.
 */
const Submenu: React.FC<{ items: ContextMenuItem[]; onClose: () => void }> = ({ items, onClose }) => {
  const [activeSubmenuIndex, setActiveSubmenuIndex] = useState<number | null>(null);

  return (
    // This div is the submenu panel
    <div className="context-menu submenu" onMouseLeave={() => setActiveSubmenuIndex(null)}>
      {items.map((item, index) => {
        const hasSubmenu = item.submenu && item.submenu.length > 0;
        return (
          <div
            key={index}
            className="context-item"
            onMouseEnter={() => setActiveSubmenuIndex(index)}
            onClick={(e) => {
              e.stopPropagation(); // Stop click from bubbling to parent menu
              if (item.action) {
                item.action();
                onClose(); // Close the entire menu tree
              }
            }}
          >
            <span>{item.label}</span>
            {hasSubmenu && <span className="submenu-arrow">▸</span>}
            
            {/* --- RECURSION --- */}
            {/* If this item has a submenu and is active, render another Submenu */}
            {hasSubmenu && activeSubmenuIndex === index && (
              <Submenu items={item.submenu!} onClose={onClose} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * The main ContextMenu component.
 * It handles positioning and the top-level menu list.
 */
const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(
  ({ items, x, y, onClose }, ref) => {
    const [activeSubmenuIndex, setActiveSubmenuIndex] = useState<number | null>(null);
    const [position, setPosition] = useState({ x, y });
    const localRef = useRef<HTMLDivElement>(null);

    // This effect adjusts the menu's position if it overflows the viewport
    useLayoutEffect(() => {
      if (localRef.current) {
        const rect = localRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        let newX = x, newY = y;

        // If it goes off-right, move it left
        if (x + rect.width > viewportWidth) newX = x - rect.width;
        // If it goes off-bottom, move it up
        if (y + rect.height > viewportHeight) newY = y - rect.height;
        
        setPosition({ x: newX, y: newY });
      }
    }, [x, y]);

    // Merges the forwarded ref (for click-outside) with our local ref (for layout)
    const mergedRef = (node: HTMLDivElement | null) => {
      localRef.current = node;
      if (ref) {
        if (typeof ref === 'function') ref(node);
        else ref.current = node;
      }
    };

    return (
      <div
        className="context-menu"
        ref={mergedRef}
        style={{ top: position.y, left: position.x }}
        onMouseLeave={() => setActiveSubmenuIndex(null)} // Close submenus on leave
      >
        {items.map((item, index) => {
          // Render a separator
          if (item.separator) {
            return <hr key={index} className="context-separator" />;
          }

          const hasSubmenu = item.submenu && item.submenu.length > 0;
          
          return (
            <div
              key={index}
              className="context-item"
              onMouseEnter={() => setActiveSubmenuIndex(index)}
              onClick={() => {
                if (item.action) {
                  item.action();
                  onClose(); // Close menu on action
                }
              }}
            >
              <span>{item.label}</span>
              {hasSubmenu && <span className="submenu-arrow">▸</span>}
              
              {/* Render the submenu if this item is active */}
              {hasSubmenu && activeSubmenuIndex === index && (
                <Submenu items={item.submenu!} onClose={onClose} />
              )}
            </div>
          );
        })}
      </div>
    );
  }
);

export default ContextMenu;