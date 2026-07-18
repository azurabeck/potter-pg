// src/components/navbar/functions.ts
import {
  Users,
  BarChart3,
  Wand2,
  FlaskConical,
  Backpack,
  CalendarDays,
  Sparkles,
  Heart,
  Swords,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import type { RouteKey } from "@/services/routes";

// Mapa de icone por item de navegacao, na mesma ordem do NAV_ITEMS.
export const NAV_ICONS: Record<RouteKey, LucideIcon> = {
  PERSONAGENS: Users,
  ATRIBUTOS: BarChart3,
  FEITICOS: Wand2,
  POCOES: FlaskConical,
  INVENTARIO: Backpack,
  SESSOES: CalendarDays,
  MISTERIOS: Sparkles,
  RELACOES: Heart,
  ADVERSARIOS: Swords,
  LOCAIS: MapPin,
};

export function isActivePath(currentPath: string, itemPath: string): boolean {
  return currentPath.startsWith(itemPath);
}
