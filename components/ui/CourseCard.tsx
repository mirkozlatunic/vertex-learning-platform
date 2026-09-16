import { type ReactNode } from "react";
import { BarChart, Clock, Layers } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export type CourseCardProps = {
  initial: ReactNode;
  iconClassName?: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  moduleCount: number;
  className?: string;
};

export function CourseCard({
  initial,
  iconClassName,
  title,
  description,
  level,
  duration,
  moduleCount,
  className,
}: CourseCardProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-neutral-900 text-lg font-semibold text-white",
          iconClassName,
        )}
      >
        {initial}
      </div>
      <h3 className="font-display text-heading-3 text-neutral-900">{title}</h3>
      <p className="mt-1 text-body font-sans text-neutral-500">{description}</p>
      <div className="mt-4 flex items-center gap-4 border-t border-neutral-200 pt-4 text-small font-sans text-neutral-500">
        <span className="inline-flex items-center gap-1">
          <Icon icon={BarChart} size={14} />
          {level}
        </span>
        <span className="inline-flex items-center gap-1">
          <Icon icon={Clock} size={14} />
          {duration}
        </span>
        <span className="inline-flex items-center gap-1">
          <Icon icon={Layers} size={14} />
          {moduleCount} modules
        </span>
      </div>
    </div>
  );
}
