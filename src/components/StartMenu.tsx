import { useState, forwardRef, useCallback } from "react";
import "../styles/startmenu.css";
import "../styles/global.css";

/**
 * Defines the shape of a single item in the Start Menu.
 */
export interface StartMenuItem {
  label: string;
  icon: string;
  action: () => void;
}

interface Props {
  /** Controls if the start menu is visible. */
  open: boolean;
  userName: string;
  /** The list of menu items to display. */
  items: StartMenuItem[];
  /** A callback function to close the menu (e.g., when an item is clicked). */
  onClose: () => void;
  onLock: () => void;
}

// Static Helper Functions
// These are defined outside the component because they do not
// depend on props or state, preventing them from being recreated.

/** Triggers a browser-level page reload. */
const handleRestart = () => {
  window.location.reload();
};

/** Attempts to close the browser tab/window. */
const handleShutdown = () => {
  window.close();
};

/**
 * A component that renders the application's Start Menu.
 * It's forwardRef-enabled to allow parent components to detect
 * clicks outside of it.
 */
const StartMenu = forwardRef<HTMLDivElement, Props>(
  ({ open, items, userName, onClose, onLock }, ref) => {
    /**
     * Manages the visibility of the "Power" sub-menu (Restart/Shut Down).
     */
    const [powerMenuOpen, setPowerMenuOpen] = useState(false);

    /**
     * Memoized handler to stop click events from propagating
     * up to the document (which would close the menu).
     */
    const handleContainerClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
      },
      []
    );

    /**
     * Memoized handler to toggle the power sub-menu.
     * Stops propagation to prevent the main container handler from firing.
     */
    const handleTogglePowerMenu = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setPowerMenuOpen((p) => !p);
      },
      []
    ); // setPowerMenuOpen is stable and doesn't need to be a dependency.

    const handleLockClick = useCallback(() => {
      onLock();
      onClose();
    }, [onLock, onClose]);

    /**
     * Memoized handler for clicking items in the main menu list.
     * This uses **event delegation**: one handler is attached to the parent
     * list, rather than a new function for every single item.
     */
    const handleMenuItemClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        // Find the '.start-item' element that was clicked
        const target = e.target as HTMLElement;
        const itemElement = target.closest<HTMLElement>(".start-item");
        const indexStr = itemElement?.dataset.index;

        if (indexStr) {
          // Get the item's index from the data attribute
          const index = parseInt(indexStr, 10);
          const item = items[index];

          // If the item exists, execute its action and close the menu
          if (item) {
            item.action();
            onClose();
          }
        }
      },
      [items, onClose]
    ); // Re-create this handler only if items or onClose changes.

    // If the menu isn't open, render nothing.
    if (!open) {
      return null;
    }

    return (
      <div
        className="start-menu glass"
        ref={ref}
        onClick={handleContainerClick}
      >
        {/* The main list of programs.
        A single onClick handler is used for event delegation.
      */}
        <div className="start-menu-left" onClick={handleMenuItemClick}>
          {items.map((item, index) => (
            <div
              key={item.label} // Assuming labels are unique
              className="start-item"
              // Store the index in a data attribute for the delegated handler
              data-index={index}
            >
              <img
                src={item.icon}
                alt={item.label}
                className="start-item-icon"
              />
              <span className="start-item-label">{item.label}</span>
            </div>
          ))}
        </div>

        {/* The right-side panel with user and power controls */}
        <div className="start-menu-right">
          <div className="user-info">
            <div className="user-avatar"></div>
            <span className="user-name">{userName}</span>
          </div>
          <div className="power-controls">
            {powerMenuOpen && (
              <div className="power-menu glass">
                {/* These handlers are stable because they are defined outside */}
                <div className="power-menu-item" onClick={handleRestart}>
                  Restart
                </div>
                <div className="power-menu-item" onClick={handleShutdown}>
                  Shut Down
                </div>
              </div>
            )}
            <button
              className="power-btn lock-btn"
              title="Lock"
              onClick={handleLockClick}
            >
              &#128274;
            </button>
            <button
              className="power-btn"
              onClick={handleTogglePowerMenu} // Use the memoized handler
            >
              ▶ Power
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export default StartMenu;
