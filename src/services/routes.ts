// src/services/routes.ts
// Fonte unica de rotas da aplicacao. O Navbar le NAV_ITEMS para montar os
// links do topo, e o App.tsx le ROUTES para montar o <Routes> do router.

import type { ComponentType } from "react";
import Feiticos from "@/pages/feiticos";

export const ROUTES = {
  PERSONAGENS: "/personagens",
  ATRIBUTOS: "/atributos",
  FEITICOS: "/feiticos",
  POCOES: "/pocoes",
  INVENTARIO: "/inventario",
  SESSOES: "/sessoes",
  MISTERIOS: "/misterios",
  RELACOES: "/relacoes",
  ADVERSARIOS: "/adversarios",
  LOCAIS: "/locais",
} as const;

export type RouteKey = keyof typeof ROUTES;

interface NavItem {
  key: RouteKey;
  label: string;
  path: string;
  element?: ComponentType;
}

// `element` so existe para paginas ja implementadas. As demais aparecem no
// menu (fieis ao layout do print) mas ainda nao tem tela construida.
export const NAV_ITEMS: NavItem[] = [
  { key: "PERSONAGENS", label: "Personagens", path: ROUTES.PERSONAGENS },
  { key: "ATRIBUTOS", label: "Atributos", path: ROUTES.ATRIBUTOS },
  { key: "FEITICOS", label: "Feitiços", path: ROUTES.FEITICOS, element: Feiticos },
  { key: "POCOES", label: "Poções", path: ROUTES.POCOES },
  { key: "INVENTARIO", label: "Inventário", path: ROUTES.INVENTARIO },
  { key: "SESSOES", label: "Sessões", path: ROUTES.SESSOES },
  { key: "MISTERIOS", label: "Mistérios", path: ROUTES.MISTERIOS },
  { key: "RELACOES", label: "Relações", path: ROUTES.RELACOES },
  { key: "ADVERSARIOS", label: "Adversários", path: ROUTES.ADVERSARIOS },
  { key: "LOCAIS", label: "Locais", path: ROUTES.LOCAIS },
];
