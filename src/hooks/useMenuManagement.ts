import { useState, useCallback, type RefObject } from 'react';

// Define the shape of the context menu state
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
}

/**
 * Manages the state for all pop-up menus.
 * @param startMenuRef Ref to the Start Menu component.
 * @param calendarRef Ref to the Calendar component.
 * @param contextMenuRef Ref to the Context Menu component.
 */
export const useMenuManagement = (
  startMenuRef: RefObject<HTMLDivElement | null>,
  calendarRef: RefObject<HTMLDivElement | null>,
  contextMenuRef: RefObject<HTMLDivElement | null>
) => {
  const [startOpen, setStartOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
  });

  /**
   * Closes the context menu.
   */
  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  /**
   * Opens the context menu at the cursor's position.
   */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  }, []);

  /**
   * Toggles the Start Menu, closing the calendar.
   */
  const toggleStartMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCalendarOpen(false);
    setStartOpen((s) => !s);
  }, []);

  /**
   * Toggles the Calendar, closing the Start Menu.
   */
  const toggleCalendar = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setStartOpen(false);
    setCalendarOpen((c) => !c);
  }, []);

  /**
   * Handles global clicks to close all open menus.
   * This is exported so Desktop.tsx can control when it's active.
   */
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const target = event.target as Node;
      if (startMenuRef.current && !startMenuRef.current.contains(target)) {
        setStartOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(target)) {
        setCalendarOpen(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(target)) {
        closeContextMenu();
      }
    },
    [closeContextMenu] // Removed refs, they are stable
  );

  return {
    startOpen,
    setStartOpen,
    calendarOpen,
    setCalendarOpen,
    contextMenu,
    setContextMenu,
    closeContextMenu,
    handleContextMenu,
    toggleStartMenu,
    toggleCalendar,
    handleClickOutside, // Export this for Desktop.tsx
  };
};