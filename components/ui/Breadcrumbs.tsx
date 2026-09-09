import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn("flex items-center gap-2 text-sm font-sans", className)} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <a href={item.href} className="text-neutral-500 hover:text-neutral-900">
                {item.label}
              </a>
            ) : (
              <span className={isLast ? "text-neutral-900" : "text-neutral-500"}>{item.label}</span>
            )}
            {!isLast ? <Icon icon={ChevronRight} size={14} className="text-neutral-300" /> : null}
          </span>
        );
      })}
    </nav>
  );
}
