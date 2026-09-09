import { type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-md border border-neutral-200 bg-white pl-4 pr-11 text-sm font-sans text-neutral-900 outline-none transition-colors focus:border-primary-400",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <Icon
        icon={ChevronDown}
        size={18}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500"
      />
    </div>
  );
}
