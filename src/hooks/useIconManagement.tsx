import React, { useState, useEffect, useCallback, type RefObject } from "react";

// Adjust these import paths
import type {
  DesktopIconDef,
  SortState,
  SortKeyType,
  FileSystemType,
} from "../components/types";

// --- Import ALL potential window content components ---
import AboutContent from "../windows/About";
import GamesContent from "../windows/Games";
import ContactContent from "../windows/Contact";
import ExplorerWindow from "../components/ExplorerWindow";
import Minesweeper from "../windows/Minesweeper";
import Calculator from "../windows/Calculator";
// Add imports for Browser, Flexordle iframe wrapper, etc. as you create them

// --- Create the App Component Map ---
const appComponentMap: { [key: string]: React.ComponentType<any> } = {
  about: AboutContent,
  contact: ContactContent,
  games: GamesContent,
  explorer: ExplorerWindow,
  minesweeper: Minesweeper,
  calculator: Calculator,
  // Add browser: BrowserComponent, etc. here
};

/**
 * Manages desktop icons: processing, sorting, layout, filtering, and interaction.
 * @param data The raw portfolio data.
 * @param openWindow Function to open a new window.
 * @param desktopRef Ref to the main desktop area.
 * @param cellSize The calculated size of an icon cell.
 * @param isLocked Whether the desktop is locked.
 */
export const useIconManagement = (
  data: any,
  openWindow: (iconDef: DesktopIconDef) => void,
  desktopRef: RefObject<HTMLDivElement | null>,
  cellSize: number,
  isLocked: boolean
) => {
  // Contains ALL icons (for Start Menu, Taskbar)
  const [allProcessedIcons, setAllProcessedIcons] = useState<DesktopIconDef[]>(
    []
  );
  // Filtered list for desktop rendering
  const [desktopIconsToRender, setDesktopIconsToRender] = useState<
    DesktopIconDef[]
  >([]);

  const [iconPositions, setIconPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [sortState, setSortState] = useState<SortState>({
    key: "name",
    direction: "asc",
  });

  /**
   * Processes raw data, injects components using the map, sorts,
   * and sets the state for all icons.
   */
  useEffect(() => {
    if (!data?.desktopConfig?.icons) return;

    // 1. Map raw icon data and inject content using the appComponentMap
    let iconsWithContent: DesktopIconDef[] = data.desktopConfig.icons.map(
      (iconData: any) => {
        const AppComponent = appComponentMap[iconData.id];
        let contentElement: React.ReactNode = null;

        // Special handling for components needing specific props
        if (AppComponent) {
          if (iconData.id === "about") {
            contentElement = <AboutContent info={data.personalInfo} />;
          } else if (iconData.id === "contact") {
            contentElement = (
              <ContactContent info={data.personalInfo.contact} />
            );
          } else if (iconData.id === "explorer") {
            // ExplorerWindow needs the full icon list later, handle specially
            contentElement = null; // Placeholder
          } else {
            // Generic case for simple components
            contentElement = <AppComponent />;
          }
        }

        return {
          ...iconData,
          content: contentElement,
        };
      }
    );

    // 2. Sort the icons
    iconsWithContent.sort((a, b) => {
      let result = 0;
      switch (sortState.key) {
        case "type":
          result = (a.type || "").localeCompare(b.type || "");
          break;
        case "dateModified":
          const dateA = a.dateModified ? new Date(a.dateModified).getTime() : 0;
          const dateB = b.dateModified ? new Date(b.dateModified).getTime() : 0;
          result = dateA - dateB;
          break;
        case "name":
        default:
          result = a.title.localeCompare(b.title);
          break;
      }
      return sortState.direction === "asc" ? result : -result;
    });

    const explorerWindowElement = (
      <ExplorerWindow
        desktopIcons={iconsWithContent}
        fileSystem={data.fileSystem as FileSystemType}
        openWindow={openWindow}
      />
    );

    const explorerIconIndex = iconsWithContent.findIndex(
      (icon) => icon.id === "explorer"
    );
    if (explorerIconIndex !== -1) {
      iconsWithContent[explorerIconIndex].content = explorerWindowElement;
    }

    setAllProcessedIcons(iconsWithContent);
  }, [data, openWindow, sortState]); // Re-run when data, openWindow, or sort criteria change

  /**
   * Effect to filter ALL icons down to just those shown on the desktop.
   * This runs whenever allProcessedIcons changes.
   */
  useEffect(() => {
    setDesktopIconsToRender(
      allProcessedIcons.filter((icon) => icon.showOnDesktop)
    );
  }, [allProcessedIcons]);

  /**
   * Calculates layout based ONLY on the icons visible on the desktop.
   */
  const calculateLayout = useCallback(() => {
    // Use desktopIconsToRender for layout calculation
    if (!desktopRef.current || !desktopIconsToRender.length) return;

    const desktopHeight = desktopRef.current.clientHeight;
    const maxRows = Math.floor(desktopHeight / cellSize);
    if (maxRows <= 0) return;

    const newPositions: Record<string, { x: number; y: number }> = {};
    let col = 0;
    let row = 0;

    // Iterate over ONLY the icons being rendered on the desktop
    for (const icon of desktopIconsToRender) {
      newPositions[icon.id] = { x: col, y: row };
      row++;
      if (row >= maxRows) {
        row = 0;
        col++;
      }
    }
    setIconPositions(newPositions);
  }, [desktopIconsToRender, cellSize, desktopRef]); // Depend on the filtered list

  /**
   * Attaches resize listener and runs layout calculation.
   */
  useEffect(() => {
    if (!isLocked) {
      calculateLayout();
      window.addEventListener("resize", calculateLayout);
      return () => window.removeEventListener("resize", calculateLayout);
    }
  }, [calculateLayout, isLocked]);

  /**
   * Updates an icon's grid position after a drag-and-drop.
   */
  const updateIconPosition = useCallback(
    (id: string, mouseX: number, mouseY: number) => {
      const rect = desktopRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = mouseX - rect.left;
      const y = mouseY - rect.top;
      const gridX = Math.max(0, Math.round(x / cellSize));
      const gridY = Math.max(0, Math.round(y / cellSize));
      setIconPositions((prev) => ({ ...prev, [id]: { x: gridX, y: gridY } }));
    },
    [cellSize, desktopRef]
  );

  /**
   * Sets the sort key, toggling direction if the key is the same.
   */
  const sortIcons = useCallback((key: SortKeyType) => {
    setSortState((prevState) => {
      if (prevState.key === key) {
        return {
          key,
          direction: prevState.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  }, []);

  // Return values needed by Desktop.tsx
  return {
    allProcessedIcons, // Needed for Start Menu, Taskbar
    desktopIconsToRender, // Needed for rendering icons on desktop
    iconPositions,
    sortState,
    sortIcons,
    updateIconPosition,
  };
};
