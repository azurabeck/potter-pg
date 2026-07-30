// src/components/character-panel/functions.ts

export type NumericProgress = { atual: number; max: number };

export type CharacterWithProgress = {
  hp?: NumericProgress | number;
  xp?: NumericProgress | number;
  nivel_geral?: number;
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
