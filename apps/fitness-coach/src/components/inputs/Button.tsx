import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  variant: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "xl";
  loading?: boolean;
  icon?: LucideIcon;
  /** Stretch to the container width (`xl` always does). */
  fullWidth?: boolean;
  children?: ReactNode;
};

const VARIANTS: Record<Props["variant"], string> = {
  primary: "bg-primary-500 text-primary-contrast",
  secondary: "bg-surface-2 text-text",
  ghost: "bg-transparent text-text hover:bg-surface-2",
  danger: "bg-transparent text-danger-500 border-2 border-danger-500",
};

/** Kit `Button` (ui_kit_registry): pill, 52 px (`md`) or 72 px full width (`xl`). */
export function Button({
  variant,
  size = "md",
  loading = false,
  icon: Icon,
  fullWidth = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}: Props) {
  const iconOnly = !children;
  const height =
    size === "xl"
      ? "h-(--size-button-xl-height)"
      : iconOnly
        ? "h-(--size-touch-min)"
        : "h-(--size-button-height)";
  const width = size === "xl" || fullWidth ? "w-full" : iconOnly ? "w-(--size-touch-min)" : "";
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        "inline-flex items-center justify-center gap-sm rounded-full text-label transition-opacity duration-(--duration-fast)",
        "disabled:cursor-not-allowed disabled:opacity-50",
        iconOnly ? "" : "px-lg",
        height,
        width,
        VARIANTS[variant],
        className,
      ].join(" ")}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="size-(--icon-md) animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        Icon && <Icon aria-hidden className="size-(--icon-md)" />
      )}
      {children}
    </button>
  );
}
