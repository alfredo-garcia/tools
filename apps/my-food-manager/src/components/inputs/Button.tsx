import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary-500 text-primary-contrast",
  secondary: "bg-surface-2 text-text border-border",
  ghost: "bg-transparent text-primary-500",
  danger: "bg-transparent text-danger-500 border-danger-500",
};

export function Button({
  variant = "primary",
  loading = false,
  icon: Icon,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-transparent px-5 text-[14px] font-bold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        Icon && <Icon className="size-5" aria-hidden />
      )}
      {children}
    </button>
  );
}
