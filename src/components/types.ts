import type React from 'react';
// Make sure this path is correct for your project
import { type SubFile } from './ExplorerWindow'; 

/**
 * Defines the state for an open application window.
 */
export interface AppWindow {
  id: string;
  title: string;
  content: React.ReactNode;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number | string; height: number | string };
  icon: string;
  resizable?: boolean;
}

/**
 * Defines the core properties of a desktop icon, including its
 * associated window content and data for sorting.
 */
export interface DesktopIconDef {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode | null;
  filePath?: string;
  pinned?: boolean;
  type?: string;
  dateModified?: string;
  showOnDesktop?: boolean;
  resizable?: boolean;
}

/**
 * Defines the structure of the file system, used by ExplorerWindow.
 */
export type FileSystemType = {
  [key: string]: {
    files: SubFile[];
  };
};

/**
 * Defines the available keys for sorting icons.
 */
export type SortKeyType = 'name' | 'type' | 'dateModified';

/**
 * Defines the available sort directions.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Defines the state object for tracking the current sort criteria.
 */
export interface SortState {
  key: SortKeyType;
  direction: SortDirection;
}