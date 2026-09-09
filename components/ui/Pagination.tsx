import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export type PaginationProps = {
  page: number;
  pageCount: number;
  className?: string;
};

function pageWindow(page: number, pageCount: number): (number | "ellipsis")[] {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  if (page <= 3) {
    return [1, 2, 3, "ellipsis", pageCount];
  }
  if (page >= pageCount - 2) {
    return [1, "ellipsis", pageCount - 2, pageCount - 1, pageCount];
  }
  return [1, "ellipsis", page, "ellipsis", pageCount];
}

export function Pagination({ page, pageCount, className }: PaginationProps) {
  const pages = pageWindow(page, pageCount);
  return (
    <nav className={cn("flex items-center gap-1", className)} aria-label="Pagination">
      <button
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-sm text-neutral-500 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        <Icon icon={ChevronLeft} size={16} />
      </button>
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-sm font-sans text-neutral-500">
            …
          </span>
        ) : (
          <button
            key={p}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-sm text-sm font-sans",
              p === page
                ? "border border-primary-500 text-primary-500"
                : "text-neutral-700 hover:bg-neutral-100",
            )}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        ),
      )}
      <button
        disabled={page >= pageCount}
        className="flex h-9 w-9 items-center justify-center rounded-sm text-neutral-500 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        <Icon icon={ChevronRight} size={16} />
      </button>
    </nav>
  );
}
