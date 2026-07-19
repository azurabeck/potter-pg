// src/services/routes.ts
// Fonte unica de rotas da aplicacao. O Navbar le NAV_ITEMS para montar os
// links do topo, e o App.tsx le ROUTES para montar o <Routes> do router.

import type { ComponentType } from "react";
import { User, Scale, Backpack, Feather, Ghost, Handshake, Flame, Castle, Dices } from "lucide-react";
import { SparklesIcon, BeakerIcon } from "@heroicons/react/24/outline";
import Feiticos from "@/pages/feiticos";
import Plataforma from "@/pages/plataforma";

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
  PLATAFORMA: "/plataforma",
} as const;

export type RouteKey = keyof typeof ROUTES;

interface NavItem {
  key: RouteKey;
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  element?: ComponentType;
}

// `element` so existe para paginas ja implementadas. As demais aparecem no
// menu (fieis ao layout do print) mas ainda nao tem tela construida.
// `icon` mistura lucide-react e @heroicons/react (outline) — cada rota usa a
// biblioteca que tinha o icone mais adequado.
export const NAV_ITEMS: NavItem[] = [
  { key: "PERSONAGENS", label: "Personagens", path: ROUTES.PERSONAGENS, icon: User },
  { key: "ATRIBUTOS", label: "Atributos", path: ROUTES.ATRIBUTOS, icon: Scale },
  { key: "FEITICOS", label: "Feitiços", path: ROUTES.FEITICOS, icon: SparklesIcon, element: Feiticos },
  { key: "POCOES", label: "Poções", path: ROUTES.POCOES, icon: BeakerIcon },
  { key: "INVENTARIO", label: "Inventário", path: ROUTES.INVENTARIO, icon: Backpack },
  { key: "SESSOES", label: "Sessões", path: ROUTES.SESSOES, icon: Feather },
  { key: "MISTERIOS", label: "Mistérios", path: ROUTES.MISTERIOS, icon: Ghost },
  { key: "RELACOES", label: "Relações", path: ROUTES.RELACOES, icon: Handshake },
  { key: "ADVERSARIOS", label: "Adversários", path: ROUTES.ADVERSARIOS, icon: Flame },
  { key: "LOCAIS", label: "Locais", path: ROUTES.LOCAIS, icon: Castle },
  { key: "PLATAFORMA", label: "Plataforma", path: ROUTES.PLATAFORMA, icon: Dices, element: Plataforma },
];
