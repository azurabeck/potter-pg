// src/utils/index.ts
// Funcoes utilitarias puras, sem dependencia de React ou Firebase,
// pensadas para serem reaproveitadas em varias paginas/components.

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
import { CURRENT_CHARACTER_STUB } from "@/services/genene_settings";
import type { Character, Potion, Spell } from "./types";

/** "1" -> "1º ANO" (usado no badge do card de feitico). */
export function formatAno(ano: number): string {
  return `${ano}º`;
}

/**
 * Extrai só a parte curta do alcance. "Médio (até 30 metros)" -> "Médio".
 * A maioria dos feitiços reais não tem `range` cadastrado; "—" nesse caso.
 */
export function shortRange(range: string | undefined): string {
  if (!range) return "—";
  return range.split("(")[0].trim();
}

/** Maior valor de dano/efeito descrito em mastery_effects (ex: card "DANO MÁXIMO"). */
export function highestMasteryValue(spell: Spell): string {
  const effects = spell.attributes.mastery_effects;
  if (effects && effects.length > 0) return effects[effects.length - 1].value.toUpperCase();
  return spell.attributes.effect_value?.toUpperCase() ?? "-";
}

/** Menor valor (mastery inicial), usado no card como "DANO INICIAL". */
export function lowestMasteryValue(spell: Spell): string {
  const effects = spell.attributes.mastery_effects;
  if (effects && effects.length > 0) return effects[0].value.toUpperCase();
  return spell.attributes.effect_value?.toUpperCase() ?? "-";
}

/**
 * Define se um feitico esta bloqueado para o personagem atual: desbloqueado
 * quando o personagem tem uma entrada em `habilidades` cuja chave é o id
 * do feitico (mesmo id do documento na colecao "spells"). Sem personagem
 * ativo, cai na regra antiga (nivel_geral do stub vs `required` do feitico).
 */
export function isSpellLocked(spell: Spell, activeCharacter: Character | null): boolean {
  if (activeCharacter) {
    return !(spell.id in activeCharacter.habilidades);
  }
  return spell.attributes.required > CURRENT_CHARACTER_STUB.nivel_geral;
}

/**
 * Mesma lógica de `isSpellLocked`, mas pra poções: desbloqueada quando o
 * personagem tem uma entrada em `pocoes` cuja chave é o id da poção
 * (mesmo id do documento na coleção "potions"). Sem personagem ativo,
 * considera bloqueada — poção não tem um campo `required` pra comparar
 * contra o stub como feitiço tem.
 */
export function isPotionLocked(potion: Potion, activeCharacter: Character | null): boolean {
  if (!activeCharacter) return true;
  return !(potion.id in activeCharacter.pocoes);
}

// As chaves reais de `Character.atributos` variam por personagem: alguns
// (criados pelo wizard) usam slug em minúsculo ("magia", "protecao"/
// "defesa"), outros (fichas mais antigas/importadas) usam o próprio nome
// em português já formatado como chave ("Aprendizado Mágico", "Magia
// Antiga"). `formatAttributeLabel`/`getAttributeIcon` cobrem os dois
// casos — usado tanto por `CharacterPanel` quanto por `pages/atributos`,
// por isso mora aqui (compartilhado) em vez de duplicado por página.
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

/** "magia" -> "Magia", "defesa"/"protecao" -> "Proteção" (chaves reais variam). Chave já formatada (ex. "Aprendizado Mágico") passa direto. */
export function formatAttributeLabel(key: string): string {
  const normalized = key.toLocaleLowerCase("pt-BR");
  return ATTRIBUTE_LABELS[normalized] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

// Icone por nome de atributo (já formatado, ver formatAttributeLabel),
// cobrindo os atributos vistos nos personagens reais da colecao
// "characters". Nomes fora deste mapa caem no fallback (Sparkles) em
// getAttributeIcon.
const ATTRIBUTE_ICONS: Record<string, LucideIcon> = {
  Agilidade: Zap,
  "Aprendizado Mágico": BookOpen,
  Astucia: Fingerprint,
  Astúcia: Fingerprint,
  Ataque: Swords,
  Carisma: Star,
  Controle: Target,
  Coragem: Flame,
  Equilibrio: Scale,
  Equilíbrio: Scale,
  Furtividade: Fingerprint,
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

export interface ResolvedMoney {
  galeoes: number;
  sicles: number;
  nuques: number;
}

/**
 * `dinheiro` é o campo principal de dinheiro do personagem, mas o wizard
 * de criação já grava ele zerado (`{galeoes:0, sicles:0, nuques:0}`) em
 * todo personagem novo — então um `??` simples contra o legado
 * (`inventario.{goldens,sicles,nuquens}`) nunca cai no fallback quando
 * `dinheiro` está zerado "de propósito" só porque nunca foi usado: `0`
 * já é um valor válido pro `??`, não vira `undefined`. Por isso decide
 * pelo TOTAL de cada lado: só usa `dinheiro` se ele tiver algum valor de
 * verdade; senão usa o legado; se os dois estiverem zerados, o
 * personagem não tem dinheiro mesmo. Sem personagem, devolve `null` (o
 * chamador decide o fallback — stub, zero, etc.).
 */
export function resolveCharacterMoney(character: Character | null | undefined): ResolvedMoney | null {
  if (!character) return null;

  const primary = {
    galeoes: character.dinheiro?.galeoes ?? 0,
    sicles: character.dinheiro?.sicles ?? 0,
    nuques: character.dinheiro?.nuques ?? 0,
  };
  if (primary.galeoes + primary.sicles + primary.nuques > 0) return primary;

  const legacy = {
    galeoes: character.inventario?.goldens ?? 0,
    sicles: character.inventario?.sicles ?? 0,
    nuques: character.inventario?.nuquens ?? 0,
  };
  if (legacy.galeoes + legacy.sicles + legacy.nuques > 0) return legacy;

  return primary;
}

/** Normaliza a categoria do card para exibicao (ex: "ofensivo" -> "Ofensivo"). */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Junta classes CSS condicionalmente, ignorando valores falsy. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** "Tomas Black" -> "TB" (usado nos avatares quando não há foto). */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("");
}
