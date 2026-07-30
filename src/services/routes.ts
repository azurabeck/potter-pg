// src/services/routes.ts
// Fonte unica de rotas da aplicacao. O Navbar le NAV_ITEMS para montar os
// links do topo, e o App.tsx le ROUTES para montar o <Routes> do router.

import type { ComponentType } from "react";
import { User, Scale, Backpack, Feather, Ghost, Handshake, Flame, Castle, Library, Dices } from "lucide-react";
import { SparklesIcon, BeakerIcon } from "@heroicons/react/24/outline";
import Feiticos from "@/pages/feiticos";
import Pocoes from "@/pages/pocoes";
import Plataforma from "@/pages/plataforma";
import Livraria from "@/pages/livraria";
import Misterios from "@/pages/misterios";
import Sessoes from "@/pages/sessoes";
import Inventario from "@/pages/inventario";
import Atributos from "@/pages/atributos";
import Relacoes from "@/pages/relacoes";
import Adversarios from "@/pages/adversarios";
import Locais from "@/pages/locais";
import Personagens from "@/pages/personagens";

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
  LIVRARIA: "/floreios-e-borroes",
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
  { key: "PERSONAGENS", label: "Personagens", path: ROUTES.PERSONAGENS, icon: User, element: Personagens },
  { key: "ATRIBUTOS", label: "Atributos", path: ROUTES.ATRIBUTOS, icon: Scale, element: Atributos },
  { key: "FEITICOS", label: "Feitiços", path: ROUTES.FEITICOS, icon: SparklesIcon, element: Feiticos },
  { key: "POCOES", label: "Poções", path: ROUTES.POCOES, icon: BeakerIcon, element: Pocoes },
  { key: "INVENTARIO", label: "Inventário", path: ROUTES.INVENTARIO, icon: Backpack, element: Inventario },
  { key: "SESSOES", label: "Sessões", path: ROUTES.SESSOES, icon: Feather, element: Sessoes },
  { key: "MISTERIOS", label: "Mistérios", path: ROUTES.MISTERIOS, icon: Ghost, element: Misterios },
  { key: "RELACOES", label: "Relações", path: ROUTES.RELACOES, icon: Handshake, element: Relacoes },
  { key: "ADVERSARIOS", label: "Adversários", path: ROUTES.ADVERSARIOS, icon: Flame, element: Adversarios },
  { key: "LOCAIS", label: "Locais", path: ROUTES.LOCAIS, icon: Castle, element: Locais },
  { key: "LIVRARIA", label: "Floreios e Borrões", path: ROUTES.LIVRARIA, icon: Library, element: Livraria },
  { key: "PLATAFORMA", label: "Plataforma", path: ROUTES.PLATAFORMA, icon: Dices, element: Plataforma },
];
