// src/components/sidebar/functions.ts

export function isActivePath(currentPath: string, itemPath: string): boolean {
  return currentPath.startsWith(itemPath);
}
