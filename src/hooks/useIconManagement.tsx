import { useState, useEffect, useCallback, type RefObject } from "react";

// Adjust these import paths
import type {
  DesktopIconDef,
  SortState,
  SortKeyType,
  FileSystemType,
} from "../components/types";
import AboutContent from "../windows/About";
import GamesContent from "../windows/Games";
import ContactContent from "../windows/Contact";
import ExplorerWindow from "../components/ExplorerWindow";

/**
 * Manages all logic for desktop icons: processing, sorting, layout, and interaction.
 * @param data The raw portfolio data.
 * @param openWindow The function from Desktop.tsx to open a new window.
 * @param desktopRef Ref to the main desktop area (for layout).
 * @param cellSize The calculated size of an icon cell.
 * @param iconSize The current size setting ('small', 'medium', 'large').
 */
export const useIconManagement = (
  data: any,
  openWindow: (iconDef: DesktopIconDef) => void,
  desktopRef: RefObject<HTMLDivElement | null>,
  cellSize: number
) => {
  const [processedIcons, setProcessedIcons] = useState<DesktopIconDef[]>([]);
  const [iconPositions, setIconPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [sortState, setSortState] = useState<SortState>({
    key: "name",
    direction: "asc",
  });

  /**
   * This effect processes, sorts, and injects content into icons.
   */
  useEffect(() => {
    if (!data) return;

    // 1. Map and inject React component content
    let iconsWithContent: DesktopIconDef[] = data.desktopConfig.icons.map(
      (icon: any) => ({
        ...icon,
        content: (() => {
          switch (icon.id) {
            case "about":
              return <AboutContent info={data.personalInfo} />;
            case "contact":
              return <ContactContent info={data.personalInfo.contact} />;
            case "games":
              return <GamesContent />;
            default:
              return null;
          }
        })(),
      })
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

    // 3. Create and inject the ExplorerWindow element
    const explorerWindowElement = (
      <ExplorerWindow
        desktopIcons={iconsWithContent}
        fileSystem={data.fileSystem as FileSystemType}
        openWindow={openWindow}
      />
    );

    const projectsIconIndex = iconsWithContent.findIndex(
      (icon) => icon.id === "projects"
    );
    if (projectsIconIndex !== -1) {
      iconsWithContent[projectsIconIndex].content = explorerWindowElement;
    }

    // 4. Set the final, sorted list to state
    setProcessedIcons(iconsWithContent);
  }, [data, openWindow, sortState]);

  /**
   * Calculates the auto-layout grid positions for desktop icons.
   */
  const calculateLayout = useCallback(() => {
    if (!desktopRef.current || !processedIcons.length) return;

    const desktopHeight = desktopRef.current.clientHeight;
    const maxRows = Math.floor(desktopHeight / cellSize);
    if (maxRows <= 0) return;

    const newPositions: Record<string, { x: number; y: number }> = {};
    let col = 0;
    let row = 0;

    for (const icon of processedIcons) {
      newPositions[icon.id] = { x: col, y: row };
      row++;
      if (row >= maxRows) {
        row = 0;
        col++;
      }
    }
    setIconPositions(newPositions);
  }, [processedIcons, cellSize, desktopRef]);

  /**
   * Attaches resize listener to recalculate icon layout.
   */
  useEffect(() => {
    // Note: The 'isLocked' check will be in Desktop.tsx
    calculateLayout();
    window.addEventListener("resize", calculateLayout);
    return () => window.removeEventListener("resize", calculateLayout);
  }, [calculateLayout]);

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

  return {
    processedIcons,
    iconPositions,
    sortState,
    sortIcons,
    updateIconPosition,
  };
};
