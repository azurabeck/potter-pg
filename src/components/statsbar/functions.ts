// src/components/statsbar/functions.ts
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

export function percent(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, (current / max) * 100));
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
