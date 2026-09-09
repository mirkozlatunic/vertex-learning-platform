import { FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export type ResourceCardProps = {
  title: string;
  description: string;
  format: string;
  size: string;
  className?: string;
};

export function ResourceCard({ title, description, format, size, className }: ResourceCardProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <Icon icon={FileText} className="mt-0.5 shrink-0 text-neutral-500" />
      <div className="min-w-0 flex-1">
        <h3 className="text-heading-3 font-sans text-neutral-900">{title}</h3>
        <p className="mt-1 text-body font-sans text-neutral-500">{description}</p>
        <span className="mt-3 block text-small font-sans text-neutral-500">
          {format} · {size}
        </span>
      </div>
      <Icon icon={ExternalLink} size={16} className="shrink-0 text-neutral-500" />
    </div>
  );
}
