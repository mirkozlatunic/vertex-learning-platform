import { cn } from "@/lib/cn";

export type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary-500 text-white">
        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden>
          <path d="M2 3h4.2l5.8 13.5L17.8 3H22L13.5 21h-3L2 3z" />
        </svg>
      </span>
      <span className="text-heading-3 font-sans font-semibold text-neutral-900">Vertex</span>
    </span>
  );
}
