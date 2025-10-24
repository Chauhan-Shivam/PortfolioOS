import { forwardRef, useMemo, useCallback } from 'react';
import '../styles/contextmenu.css';

/**
 * Defines the shape of a single item in the context menu.
 */
export interface ContextMenuItem {
  label: string;
  action: () => void;
}

/**
 * Props for the ContextMenu component.
 */
interface Props {
  /** The horizontal (x-coordinate) position of the menu. */
  x: number;
  /** The vertical (y-coordinate) position of the menu. */
  y: number;
  /** An array of menu items to display. */
  items: ContextMenuItem[];
  /** A callback function to close the menu. */
  onClose: () => void;
}

/**
 * A floating context menu component that appears at a specified (x, y) coordinate.
 *
 * It renders a list of clickable items and uses `forwardRef` to allow
 * parent components to get a reference to the main div element,
 * (e.g., for detecting clicks outside to close it).
 */
const ContextMenu = forwardRef<HTMLDivElement, Props>(({ x, y, items, onClose }, ref) => {
  /**
   * Memoizes the style object.
   * This prevents a new object from being created on every render,
   * optimizing performance by providing a stable reference to the `style` prop.
   */
  const menuStyle = useMemo(() => ({
    top: y,
    left: x,
  }), [y, x]);

  /**
   * Handles clicks on the list using event delegation.
   * This single, stable function is more performant than creating
   * a new onClick handler for every single <li> item.
   */
  const handleClick = useCallback((e: React.MouseEvent<HTMLUListElement>) => {
    // Find the closest 'li' element that was clicked
    const target = e.target as HTMLElement;
    const li = target.closest('li');

    // Ensure a <li> was clicked and it has a data-index attribute
    if (!li || li.dataset.index === undefined) {
      return;
    }

    // Get the item's index from the data attribute
    const index = parseInt(li.dataset.index, 10);
    const item = items[index];

    // If the item exists, execute its action and then close the menu
    if (item) {
      item.action();
      onClose();
    }
  }, [items, onClose]); // Dependencies: re-create if items or onClose changes

  return (
    <div
      className="context-menu"
      style={menuStyle}
      ref={ref}
    >
      {/* Attach the single event handler to the list container */}
      <ul onClick={handleClick}>
        {items.map((item, index) => (
          <li
            /**
             * Use a stable key. item.label is better than index,
             * assuming labels are unique.
             */
            key={item.label}
            /**
             * Store the index in a data attribute.
             * The delegated click handler will read this to know which item was clicked.
             */
            data-index={index}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
});

export default ContextMenu;