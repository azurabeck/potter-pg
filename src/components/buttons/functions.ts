// src/components/buttons/functions.ts
import { cx } from "@/utils";

export type ButtonVariant = "primary" | "ghost" | "icon";

export function getButtonClassName(
  variant: ButtonVariant,
  active: boolean | undefined,
  className: string | undefined
): string {
  return cx(
    "btn",
    `btn--${variant}`,
    active && "btn--active",
    className ?? undefined
  );
}
