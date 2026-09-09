import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type IconProps = {
  icon: LucideIcon;
  filled?: boolean;
  size?: number;
  className?: string;
};

export function Icon({ icon: LucideIconComponent, filled = false, size = 24, className }: IconProps) {
  return (
    <LucideIconComponent
      size={size}
      strokeWidth={2}
      className={cn(className)}
      fill={filled ? "currentColor" : "none"}
    />
  );
}
