import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "video" | "lesson" | "popular" | "outline";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  video: "bg-primary-500 text-white",
  lesson: "bg-neutral-900 text-white",
  popular: "bg-primary-100 text-primary-500",
  outline: "bg-primary-100/60 text-primary-500 border border-primary-200",
};

export function Badge({ variant = "lesson", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xs px-2 py-0.5 text-xs font-medium font-sans uppercase tracking-wide",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
