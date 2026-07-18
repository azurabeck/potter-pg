// src/components/sidebar/functions.ts
import {
  User,
  Scale,
  BookOpen,
  CalendarRange,
  Wand2,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/services/routes";


export interface SidebarItem {
  key: string;
  icon: LucideIcon;
  path: string;
  label: string;
}

// Barra de icones vertical, fixa, à esquerda do app inteiro (fora do
// conteudo das paginas) — atalhos rapidos para as secoes mais usadas.
export const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: "perfil", icon: User, path: ROUTES.PERSONAGENS, label: "Perfil" },
  { key: "justica", icon: Scale, path: ROUTES.ADVERSARIOS, label: "Atributos" },
  { key: "justica", icon: Scale, path: ROUTES.ADVERSARIOS, label: "Inventário" },
  { key: "grimorio", icon: BookOpen, path: ROUTES.FEITICOS, label: "Criaturas" },
  { key: "feiticos", icon: Wand2, path: ROUTES.FEITICOS, label: "Feitiços" },
  { key: "feiticos", icon: Wand2, path: ROUTES.FEITICOS, label: "Poções" },
  { key: "grimorio", icon: BookOpen, path: ROUTES.FEITICOS, label: "Adversários" },
  { key: "justica", icon: Scale, path: ROUTES.ADVERSARIOS, label: "Npcs" },
  { key: "agenda", icon: CalendarRange, path: ROUTES.SESSOES, label: "Sessões" },
  { key: "grimorio", icon: BookOpen, path: ROUTES.FEITICOS, label: "Mistérios" },
  { key: "feiticos", icon: Wand2, path: ROUTES.FEITICOS, label: "Locais" },
  { key: "eventos", icon: Ticket, path: ROUTES.MISTERIOS, label: "Eventos" },
  { key: "eventos", icon: Ticket, path: ROUTES.MISTERIOS, label: "Plataforma" },
];
