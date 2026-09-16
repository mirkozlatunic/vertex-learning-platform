import { ArrowUpRight, FileText, Folder, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatTimestamp } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import type { SearchResult } from "@/lib/search-schema";

export type SearchResultCardProps = {
  result: SearchResult;
  onSelect?: () => void;
  className?: string;
};

export function SearchResultCard({ result, onSelect, className }: SearchResultCardProps) {
  const lessonLabel = `Lesson ${result.moduleNumber}.${result.lessonNumber}`;
  const moduleLabel = `Module ${result.moduleNumber}`;
  const href =
    result.kind === "video" && result.matchedSecond != null
      ? `/lessons/${result.lessonSlug}?t=${result.matchedSecond}`
      : `/lessons/${result.lessonSlug}`;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-md border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row",
        className,
      )}
    >
      {result.kind === "video" ? (
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-sm bg-neutral-900 sm:w-56">
          {result.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                <Icon icon={Play} filled size={16} className="ml-0.5 text-neutral-900" />
              </div>
            </div>
          )}
          {result.clipLengthSeconds != null ? (
            <span className="absolute bottom-2 right-2 rounded-xs bg-neutral-900/80 px-1.5 py-0.5 text-xs font-sans text-white">
              {formatTimestamp(result.clipLengthSeconds)}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="w-full shrink-0 rounded-sm bg-neutral-50 p-4 sm:w-56">
          <Icon icon={FileText} size={18} className="text-neutral-400" />
          {result.keyPoints && result.keyPoints.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {result.keyPoints.slice(0, 3).map((point) => (
                <li key={point} className="flex items-start gap-1.5 text-xs font-sans text-neutral-500">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-neutral-400" />
                  <span className="line-clamp-1">{point}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-neutral-900 text-[10px] font-semibold text-white">
              {result.courseTitle.charAt(0)}
            </span>
            <span className="truncate text-xs font-sans text-neutral-500">{result.courseTitle}</span>
          </div>
          <Badge variant={result.kind === "video" ? "outline" : "neutral"} className="shrink-0">
            {result.kind}
          </Badge>
        </div>

        <h3 className="mt-2 text-heading-3 font-sans font-semibold text-neutral-900">
          {result.lessonTitle}
        </h3>
        <p className="mt-1 line-clamp-2 text-body font-sans text-neutral-500">{result.description}</p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-small font-sans text-neutral-500">
            <Icon icon={result.kind === "video" ? FileText : Folder} size={14} />
            {result.kind === "video" ? (
              <>
                {lessonLabel} · {result.moduleTitle}
              </>
            ) : (
              moduleLabel
            )}
          </span>
          <a
            href={href}
            onClick={onSelect}
            className="inline-flex items-center gap-1 text-sm font-medium font-sans text-primary-500 hover:text-primary-400"
          >
            {result.kind === "video" && result.matchedSecond != null ? (
              <>
                <Icon icon={Play} filled size={14} />
                Watch from {formatTimestamp(result.matchedSecond)}
              </>
            ) : (
              <>
                View lesson
                <Icon icon={ArrowUpRight} size={14} />
              </>
            )}
          </a>
        </div>
      </div>
    </div>
  );
}
