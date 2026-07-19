// src/components/sidebar/functions.ts

export const SIDEBAR_COLLAPSED_STORAGE_KEY = "potter-pg:sidebar-collapsed";

export function isActivePath(currentPath: string, itemPath: string): boolean {
  return currentPath.startsWith(itemPath);
}

/** Lê a preferência salva de sidebar recolhida; sem valor salvo, começa expandida. */
export function readStoredCollapsed(): boolean {
  return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
}
