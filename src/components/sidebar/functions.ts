// src/components/sidebar/functions.ts

export const SIDEBAR_COLLAPSED_STORAGE_KEY = "potter-pg:sidebar-collapsed";

// Mesmo valor do `@media (max-width: 720px)` de style.scss (onde o menu já
// vira "só ícones" sempre) — repetido aqui como número porque `index.tsx`
// precisa dele em `window.matchMedia`, que não lê variável SCSS nenhuma.
export const MOBILE_SIDEBAR_BREAKPOINT = 720;

export function isActivePath(currentPath: string, itemPath: string): boolean {
  return currentPath.startsWith(itemPath);
}

/** Lê a preferência salva de sidebar recolhida; sem valor salvo, começa expandida. */
export function readStoredCollapsed(): boolean {
  return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
}
