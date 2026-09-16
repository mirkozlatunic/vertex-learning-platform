import { HelpCircle, type LucideIcon, icons } from "lucide-react";

function toPascalCase(name: string) {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

export function getIconByName(name: string | null | undefined): LucideIcon {
  if (!name) return HelpCircle;
  return icons[toPascalCase(name) as keyof typeof icons] ?? HelpCircle;
}
