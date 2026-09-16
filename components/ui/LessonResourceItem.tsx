"use client";

import { Code2, ExternalLink, FileText, Link as LinkIcon, PlayCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { captureEvent } from "@/lib/posthog-client";
import { Icon } from "@/components/ui/Icon";

export type LessonResourceItemProps = {
  type: string;
  title: string;
  description?: string | null;
  url: string;
  lessonId: string;
  className?: string;
};

const iconByType: Record<string, typeof FileText> = {
  pdf: FileText,
  article: FileText,
  code: Code2,
  video: PlayCircle,
  link: LinkIcon,
};

export function LessonResourceItem({
  type,
  title,
  description,
  url,
  lessonId,
  className,
}: LessonResourceItemProps) {
  const ResourceIcon = iconByType[type] ?? LinkIcon;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={() => captureEvent("lesson_resource_opened", { lesson_id: lessonId, resource_type: type })}
      className={cn(
        "flex items-start gap-3 rounded-md border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary-100 text-primary-500">
        <Icon icon={ResourceIcon} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium font-sans text-neutral-900">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs font-sans text-neutral-500">{description}</p>
        ) : null}
      </div>
      <Icon icon={ExternalLink} size={16} className="mt-0.5 shrink-0 text-neutral-500" />
    </a>
  );
}
