import React, { useState, useEffect, useCallback, type RefObject } from "react";

// Adjust these import paths
import type {
  DesktopIconDef,
  SortState,
  FileSystemType,
} from "../components/types";
import type { SortKeyType } from "../components/types";

// --- Import ALL potential window content components ---
import AboutContent from "../windows/About";
import GamesContent from "../windows/GamesContent";
import ContactContent from "../windows/Contact";
import ExplorerWindow from "../components/ExplorerWindow";
import Minesweeper from "../windows/Minesweeper";
import Calculator from "../windows/Calculator";

// --- Create the App Component Map ---
const appComponentMap: { [key: string]: React.ComponentType<any> } = {
  about: AboutContent,
  contact: ContactContent,
  games: GamesContent,
  explorer: ExplorerWindow,
  minesweeper: Minesweeper,
  calculator: Calculator,
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
  // setSortState *is* used below in sortIcons, the linter might be mistaken
  const [sortState, setSortState] = useState<SortState>({
    key: "name",
    direction: "asc",
  });

  /**
   * Processes raw data, injects components, sorts, and sets state.
   */
  useEffect(() => {
    // ... (rest of useEffect is unchanged)
    if (!data?.desktopConfig?.icons) return;

    let iconsWithContent: DesktopIconDef[] = data.desktopConfig.icons.map(
      (iconData: any) => {
        const AppComponent = appComponentMap[iconData.id];
        let contentElement: React.ReactNode = null;
        if (iconData.id === "about") {
          contentElement = <AboutContent info={data.personalInfo} />;
        } else if (iconData.id === "contact") {
          contentElement = <ContactContent info={data.personalInfo.contact} />;
        } else if (iconData.id === "games") {
          contentElement = null; // Placeholder
        } else if (iconData.id === "explorer") {
          contentElement = null; // Placeholder
        } else if (AppComponent) {
          contentElement = <AppComponent />;
        }
        return { ...iconData, content: contentElement };
      }
    );

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

    const gamesContentElement = (
      <GamesContent allIcons={iconsWithContent} openWindow={openWindow} />
    );
    const gamesIconIndex = iconsWithContent.findIndex(
      (icon) => icon.id === "games"
    );
    if (gamesIconIndex !== -1) {
      iconsWithContent[gamesIconIndex].content = gamesContentElement;
    }

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
  }, [data, openWindow, sortState]);

  useEffect(() => {
    setDesktopIconsToRender(
      allProcessedIcons.filter((icon) => icon.showOnDesktop)
    );
  }, [allProcessedIcons]);

  const calculateLayout = useCallback(() => {
    if (!desktopRef.current || !desktopIconsToRender.length) return;
    const desktopHeight = desktopRef.current.clientHeight;
    const maxRows = Math.floor(desktopHeight / cellSize);
    if (maxRows <= 0) return;
    const newPositions: Record<string, { x: number; y: number }> = {};
    let col = 0;
    let row = 0;
    for (const icon of desktopIconsToRender) {
      newPositions[icon.id] = { x: col, y: row };
      row++;
      if (row >= maxRows) {
        row = 0;
        col++;
      }
    }
    setIconPositions(newPositions);
  }, [desktopIconsToRender, cellSize, desktopRef]);

  useEffect(() => {
    if (!isLocked) {
      calculateLayout();
      window.addEventListener("resize", calculateLayout);
      return () => window.removeEventListener("resize", calculateLayout);
    }
  }, [calculateLayout, isLocked]);

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
    allProcessedIcons,
    desktopIconsToRender,
    iconPositions,
    sortState,
    sortIcons,
    updateIconPosition,
  };
};
