// src/components/buttons/index.tsx
import type { ButtonHTMLAttributes } from "react";
import { getButtonClassName, type ButtonVariant } from "./functions";
import "./style.scss";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  active?: boolean;
}

export default function Button({
  variant = "primary",
  active,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={getButtonClassName(variant, active, className)} {...rest}>
      {children}
    </button>
  );
}
