// src/components/character-panel/functions.ts
import {
  Zap,
  BookOpen,
  Fingerprint,
  Swords,
  Star,
  Target,
  Flame,
  Scale,
  Brain,
  Crown,
  Wand2,
  Moon,
  Eye,
  MessageCircle,
  ShieldPlus,
  ShieldCheck,
  HeartPulse,
  Clover,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type NumericProgress = { atual: number; max: number };

export type CharacterWithProgress = {
  hp?: NumericProgress | number;
  xp?: NumericProgress | number;
  nivel_geral?: number;
};

const ATTRIBUTE_LABELS: Record<string, string> = {
  magia: "Magia",
  ataque: "Ataque",
  controle: "Controle",
  defesa: "Proteção",
  protecao: "Proteção",
  precisão: "Precisão",
  precisao: "Precisão",
  agilidade: "Agilidade",
  inteligencia: "Inteligência",
  percepção: "Percepção",
  percepcao: "Percepção",
  coragem: "Coragem",
  carisma: "Carisma",
  resistencia: "Resistência",
  sorte: "Sorte",
};

/** Resolve `hp`/`xp` do personagem (numero solto ou {atual,max}) contra um fallback. */
export function progressValue(
  value: NumericProgress | number | undefined,
  fallback: NumericProgress
): NumericProgress {
  if (typeof value === "number") return { atual: value, max: fallback.max };
  if (value && typeof value.atual === "number" && typeof value.max === "number") return value;
  return fallback;
}

export function progressPercent(progress: NumericProgress): number {
  if (progress.max <= 0) return 0;
  return Math.max(0, Math.min(100, (progress.atual / progress.max) * 100));
}

/** "magia" -> "Magia", "defesa"/"protecao" -> "Proteção" (chaves reais variam). */
export function formatAttributeLabel(key: string): string {
  const normalized = key.toLocaleLowerCase("pt-BR");
  return ATTRIBUTE_LABELS[normalized] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

// Icone por nome de atributo, cobrindo os atributos vistos nos personagens
// reais da colecao "characters". Nomes fora deste mapa caem no fallback
// (Sparkles) em getAttributeIcon.
const ATTRIBUTE_ICONS: Record<string, LucideIcon> = {
  Agilidade: Zap,
  "Aprendizado Mágico": BookOpen,
  Astucia: Fingerprint,
  Ataque: Swords,
  Carisma: Star,
  Controle: Target,
  Coragem: Flame,
  Equilibrio: Scale,
  Inteligência: Brain,
  Liderança: Crown,
  Magia: Wand2,
  "Magia Antiga": Moon,
  Percepção: Eye,
  Persuasão: MessageCircle,
  Precisão: ShieldPlus,
  Proteção: ShieldCheck,
  Resistência: HeartPulse,
  Sorte: Clover,
};

export function getAttributeIcon(name: string): LucideIcon {
  return ATTRIBUTE_ICONS[name] ?? Sparkles;
}
