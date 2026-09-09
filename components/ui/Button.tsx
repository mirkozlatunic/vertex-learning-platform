import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "text";
export type ButtonSize = "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-500 text-white hover:bg-primary-400 disabled:bg-primary-200 disabled:text-white/70",
  secondary:
    "bg-white text-primary-500 border border-primary-500 hover:bg-primary-100 disabled:border-neutral-200 disabled:text-neutral-300",
  tertiary:
    "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100 disabled:text-neutral-300",
  text: "bg-transparent text-primary-500 hover:text-primary-400 disabled:text-neutral-300",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "h-11 px-3 text-sm",
  lg: "h-11 px-4 text-base",
};

export function Button({
  variant = "primary",
  size = "lg",
  icon,
  iconPosition = "right",
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium font-sans transition-colors disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {icon && iconPosition === "left" ? icon : null}
      {children}
      {icon && iconPosition === "right" ? icon : null}
    </button>
  );
}
