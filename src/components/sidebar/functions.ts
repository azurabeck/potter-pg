// src/components/sidebar/functions.ts
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
  Dices,
  type LucideIcon,
} from "lucide-react";
import type { RouteKey } from "@/services/routes";

// Icones do novo print (ainda sem mapeamento final — a ideia e trocar os
// icones acima por estes conforme cada um for encaixado no lugar certo).
// De cima pra baixo na imagem: pessoa, balanca, livro, calendario,
// sparkle (ativo/Feiticos), grade, foto, chama, calendario (variante 1),
// calendario (variante 2), compartilhar/abrir.
import {
  User,
  Scale,
  BookOpen,
  Calendar,
  Flame,
  CalendarClock,
} from "lucide-react";
import {
  SparklesIcon,
  Squares2X2Icon,
  PhotoIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

export const NEW_ICONS = {
  pessoa: User,
  balanca: Scale,
  livro: BookOpen,
  calendario: Calendar,
  sparkle: SparklesIcon,
  grade: Squares2X2Icon,
  foto: PhotoIcon,
  chama: Flame,
  calendarioVariante1: CalendarDays,
  calendarioVariante2: CalendarClock,
  compartilhar: ArrowTopRightOnSquareIcon,
};

// Icone por item de navegacao — mesma chave/ordem de NAV_ITEMS
// (services/routes.ts), a fonte unica das rotas/rotulos.
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
  PLATAFORMA: Dices,
};

export function isActivePath(currentPath: string, itemPath: string): boolean {
  return currentPath.startsWith(itemPath);
}
