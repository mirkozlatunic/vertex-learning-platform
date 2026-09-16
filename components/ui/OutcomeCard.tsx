import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export type OutcomeCardProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
};

export function OutcomeCard({ icon, title, description, className }: OutcomeCardProps) {
  return (
    <div
      className={cn(
        "flex gap-4 rounded-md border border-neutral-200 bg-white p-5",
        className,
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-primary-200 text-primary-500">
        <Icon icon={icon} size={20} />
      </div>
      <div>
        <h3 className="font-display text-heading-3 text-neutral-900">{title}</h3>
        {description ? (
          <p className="mt-1 text-body font-sans text-neutral-500">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
