import { Circle, CheckCircle2, PlayCircle, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export type Status = "in-progress" | "completed" | "now-playing" | "locked";

const config: Record<Status, { icon: typeof Circle; label: string; className: string; filled?: boolean }> = {
  "in-progress": { icon: Circle, label: "In Progress", className: "text-neutral-500" },
  completed: { icon: CheckCircle2, label: "Completed", className: "text-green-600", filled: true },
  "now-playing": { icon: PlayCircle, label: "Now Playing", className: "text-primary-500", filled: true },
  locked: { icon: Lock, label: "Locked", className: "text-neutral-300" },
};

export type StatusIndicatorProps = {
  status: Status;
  className?: string;
};

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const { icon, label, className: colorClassName, filled } = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-sans text-neutral-700", className)}>
      <Icon icon={icon} filled={filled} size={16} className={colorClassName} />
      {label}
    </span>
  );
}
