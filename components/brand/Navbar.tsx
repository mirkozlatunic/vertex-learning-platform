import { Bell } from "lucide-react";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";

export type NavbarProps = {
  className?: string;
};

const links = [
  { label: "Courses", href: "/courses" },
  { label: "My Learning", href: "/my-learning" },
];

export function Navbar({ className }: NavbarProps) {
  return (
    <nav
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-4",
        className,
      )}
    >
      <div className="flex items-center gap-8">
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
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100"
        >
          <Icon icon={Bell} size={20} />
        </button>
        <Show when="signed-out">
          <SignInButton>
            <button
              type="button"
              className="text-sm font-medium font-sans text-neutral-700 hover:text-neutral-900"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton>
            <button
              type="button"
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium font-sans text-white hover:bg-neutral-800"
            >
              Sign up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </nav>
  );
}
