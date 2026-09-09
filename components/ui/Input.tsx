import { type InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  shortcut?: string;
};

export function Input({ className, shortcut, ...props }: InputProps) {
  return (
    <div className="relative">
      <Icon
        icon={Search}
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
      />
      <input
        className={cn(
          "h-11 w-full rounded-md border border-neutral-200 bg-white pl-11 pr-16 text-sm font-sans text-neutral-900 placeholder:text-neutral-500 outline-none transition-colors focus:border-primary-400",
          className,
        )}
        {...props}
      />
      {shortcut ? (
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-xs border border-neutral-200 px-1.5 py-0.5 text-xs text-neutral-500">
          {shortcut}
        </span>
      ) : null}
    </div>
  );
}
