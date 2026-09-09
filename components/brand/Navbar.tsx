import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/Logo";

export type NavbarProps = {
  className?: string;
};

const links = [
  { label: "Courses", href: "#" },
  { label: "My Learning", href: "#" },
];

export function Navbar({ className }: NavbarProps) {
  return (
    <nav
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-4",
        className,
      )}
    >
      <Logo />
      <div className="flex items-center gap-6">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-sm font-medium font-sans text-neutral-700 hover:text-neutral-900"
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
