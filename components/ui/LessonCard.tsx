import { PlayCircle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";

type LessonCardBase = {
  title: string;
  description: string;
  className?: string;
};

export type LessonCardVideoProps = LessonCardBase & {
  variant: "video";
  lessonLabel: string;
  timestamp: string;
};

export type LessonCardLessonProps = LessonCardBase & {
  variant: "lesson";
  moduleLabel: string;
};

export type LessonCardProps = LessonCardVideoProps | LessonCardLessonProps;

export function LessonCard(props: LessonCardProps) {
  const { title, description, className } = props;
  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <Badge variant={props.variant}>{props.variant}</Badge>
      <h3 className="mt-3 text-heading-3 font-sans text-neutral-900">{title}</h3>
      <p className="mt-1 text-body font-sans text-neutral-500">{description}</p>
      {props.variant === "video" ? (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-small font-sans text-neutral-500">
            {props.lessonLabel} · {props.timestamp}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-medium font-sans text-primary-500">
            <Icon icon={PlayCircle} size={16} />
            Watch from {props.timestamp}
          </span>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-small font-sans text-neutral-500">{props.moduleLabel}</span>
          <span className="inline-flex items-center gap-1 text-sm font-medium font-sans text-primary-500">
            View lesson
            <Icon icon={ArrowUpRight} size={16} />
          </span>
        </div>
      )}
    </div>
  );
}
