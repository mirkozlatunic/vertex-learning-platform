import {
  Bell,
  Search,
  PlayCircle,
  FileText,
  Bookmark,
  BarChart,
  Clock,
  User,
  ChevronRight,
  Eye,
  Grid3x3,
  Target,
  Accessibility,
} from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CourseCard } from "@/components/ui/CourseCard";
import { LessonCard } from "@/components/ui/LessonCard";
import { ResourceCard } from "@/components/ui/ResourceCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Pagination } from "@/components/ui/Pagination";
import { Navbar } from "@/components/brand/Navbar";
import { Logo } from "@/components/brand/Logo";

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-small font-sans font-semibold text-primary-500">{number}</span>
        <h2 className="text-small font-sans font-semibold uppercase tracking-wide text-neutral-500">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, hex }: { name: string; hex: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-16 w-full rounded-sm border border-neutral-100" style={{ background: hex }} />
      <div className="text-small font-sans">
        <div className="font-medium text-neutral-900">{name}</div>
        <div className="text-neutral-500">{hex}</div>
      </div>
    </div>
  );
}

const typeScale = [
  { style: "Display 1", font: "Playfair Display", size: "48 / 56", weight: "Bold", use: "Page titles", className: "font-display text-[48px] font-bold leading-[56px]" },
  { style: "Display 2", font: "Playfair Display", size: "36 / 44", weight: "Bold", use: "Section titles", className: "font-display text-[36px] font-bold leading-[44px]" },
  { style: "Heading 1", font: "Inter", size: "28 / 36", weight: "Semi Bold", use: "Card titles", className: "font-sans text-[28px] font-semibold leading-[36px]" },
  { style: "Heading 2", font: "Inter", size: "22 / 30", weight: "Semi Bold", use: "Sub section", className: "font-sans text-[22px] font-semibold leading-[30px]" },
  { style: "Heading 3", font: "Inter", size: "18 / 26", weight: "Medium", use: "Small titles", className: "font-sans text-[18px] font-medium leading-[26px]" },
  { style: "Body Large", font: "Inter", size: "16 / 24", weight: "Regular", use: "Body copy", className: "font-sans text-[16px] leading-[24px]" },
  { style: "Body", font: "Inter", size: "14 / 20", weight: "Regular", use: "Supporting text", className: "font-sans text-[14px] leading-[20px]" },
  { style: "Small", font: "Inter", size: "12 / 16", weight: "Regular", use: "Captions, meta", className: "font-sans text-[12px] leading-[16px]" },
];

const spacingScale = [
  { px: 4, rem: "0.25rem" },
  { px: 8, rem: "0.5rem" },
  { px: 12, rem: "0.75rem" },
  { px: 16, rem: "1rem" },
  { px: 24, rem: "1.5rem" },
  { px: 32, rem: "2rem" },
  { px: 40, rem: "2.5rem" },
  { px: 48, rem: "3rem" },
  { px: 64, rem: "4rem" },
];

const radiusScale = [
  { label: "4px (xs)", className: "rounded-xs" },
  { label: "8px (sm)", className: "rounded-sm" },
  { label: "12px (md)", className: "rounded-md" },
  { label: "16px (lg)", className: "rounded-lg" },
  { label: "24px (xl)", className: "rounded-xl" },
  { label: "Full (circle)", className: "rounded-full" },
];

const shadowScale = [
  { label: "Sm", value: "0 1px 2px 0", meta: "rgba(15, 23, 42, 0.05)", className: "shadow-sm" },
  { label: "Md", value: "0 4px 12px -2px", meta: "rgba(15, 23, 42, 0.08)", className: "shadow-md" },
  { label: "Lg", value: "0 12px 24px -4px", meta: "rgba(15, 23, 42, 0.10)", className: "shadow-lg" },
  { label: "Xl", value: "0 20px 40px -8px", meta: "rgba(15, 23, 42, 0.12)", className: "shadow-xl" },
];

const outlineIcons = [Bell, Search, PlayCircle, FileText, Bookmark, BarChart, Clock, User, ChevronRight];

const principles = [
  { icon: Eye, title: "Clarity First", body: "Every element should communicate clearly." },
  { icon: Grid3x3, title: "Consistency", body: "Use components and patterns consistently across the platform." },
  { icon: Target, title: "Focus & Calm", body: "Remove noise and help learners focus on what matters." },
  { icon: Accessibility, title: "Accessible", body: "Design with accessibility and inclusion in mind." },
];

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <header className="border-b border-neutral-200 bg-white px-6 py-12 sm:px-10">
        <Logo />
        <h1 className="mt-6 font-display text-[48px] font-bold leading-[56px] text-neutral-900">
          Design System
        </h1>
        <p className="mt-3 max-w-xl text-body-lg font-sans text-neutral-500">
          A unified design language for Vertex learning platform. Clean, modern and focused on
          clarity, consistency and intuitive learning experiences.
        </p>
        <p className="mt-4 text-small font-sans font-medium uppercase tracking-wide text-neutral-500">
          Version 1.0 · May 2025
        </p>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pt-8 sm:px-10">
        <Section number="01" title="Colors">
          <div className="mb-4 text-small font-sans font-medium text-neutral-500">Primary</div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Swatch name="Primary 500" hex="#F97316" />
            <Swatch name="Primary 400" hex="#FB923C" />
            <Swatch name="Primary 300" hex="#FDBA74" />
            <Swatch name="Primary 200" hex="#FED7AA" />
            <Swatch name="Primary 100" hex="#FFEEE5" />
          </div>
          <div className="mt-6 mb-4 text-small font-sans font-medium text-neutral-500">Neutral</div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            <Swatch name="Neutral 900" hex="#0F172A" />
            <Swatch name="Neutral 700" hex="#33415F" />
            <Swatch name="Neutral 500" hex="#64748B" />
            <Swatch name="Neutral 300" hex="#CBD5E1" />
            <Swatch name="Neutral 200" hex="#E2E8F0" />
            <Swatch name="Neutral 100" hex="#F1F5F9" />
            <Swatch name="Neutral 50" hex="#FAFAFC" />
            <Swatch name="White" hex="#FFFFFF" />
          </div>
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section number="02" title="Typography">
            <div className="flex flex-col gap-6">
              <div>
                <div className="font-display text-5xl font-bold text-neutral-900">Ag</div>
                <div className="mt-2 text-body font-sans font-medium text-neutral-900">Playfair Display</div>
                <div className="text-small font-sans text-neutral-500">Elegant · Readable · Timeless</div>
              </div>
              <div>
                <div className="font-sans text-5xl font-semibold text-neutral-900">Ag</div>
                <div className="mt-2 text-body font-sans font-medium text-neutral-900">Inter</div>
                <div className="text-small font-sans text-neutral-500">Clean · Modern · Highly legible</div>
              </div>
            </div>
          </Section>

          <Section number="03" title="Type Scale">
            <div className="flex flex-col divide-y divide-neutral-100">
              {typeScale.map((row) => (
                <div key={row.style} className="flex items-center justify-between gap-4 py-3">
                  <span className={row.className}>{row.style}</span>
                  <span className="whitespace-nowrap text-small font-sans text-neutral-500">{row.use}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section number="04" title="Spacing System">
            <div className="mb-4 text-small font-sans text-neutral-500">Base unit: 4px</div>
            <div className="flex flex-wrap items-end gap-4">
              {spacingScale.map((s) => (
                <div key={s.px} className="flex flex-col items-center gap-2">
                  <div
                    className="rounded-xs bg-primary-100"
                    style={{ width: Math.max(8, s.px), height: Math.max(8, s.px) }}
                  />
                  <div className="text-center text-small font-sans text-neutral-500">
                    {s.px}
                    <br />
                    {s.rem}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section number="05" title="Radius & Shadows">
            <div className="mb-4 text-small font-sans text-neutral-500">Radius</div>
            <div className="mb-6 flex flex-wrap gap-4">
              {radiusScale.map((r) => (
                <div key={r.label} className="flex flex-col items-center gap-2">
                  <div className={`h-12 w-12 border border-neutral-200 bg-neutral-50 ${r.className}`} />
                  <div className="text-small font-sans text-neutral-500">{r.label}</div>
                </div>
              ))}
            </div>
            <div className="text-small font-sans text-neutral-500">Shadows</div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {shadowScale.map((s) => (
                <div
                  key={s.label}
                  className={`rounded-sm border border-neutral-100 bg-white p-3 text-small font-sans ${s.className}`}
                >
                  <div className="font-medium text-neutral-900">{s.label}</div>
                  <div className="text-neutral-500">{s.value}</div>
                  <div className="text-neutral-500">{s.meta}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr_1fr]">
          <Section number="06" title="Icons">
            <div className="mb-2 text-small font-sans text-neutral-500">Outline Style</div>
            <div className="mb-4 flex flex-wrap gap-3">
              {outlineIcons.map((I, i) => (
                <span key={i} className="flex h-9 w-9 items-center justify-center rounded-sm border border-neutral-100 text-neutral-700">
                  <Icon icon={I} size={20} />
                </span>
              ))}
            </div>
            <div className="mb-2 text-small font-sans text-neutral-500">Filled Style</div>
            <div className="mb-4 flex flex-wrap gap-3">
              {outlineIcons.map((I, i) => (
                <span key={i} className="flex h-9 w-9 items-center justify-center rounded-sm border border-neutral-100 text-neutral-700">
                  <Icon icon={I} filled size={20} />
                </span>
              ))}
            </div>
            <ul className="list-inside list-disc text-small font-sans text-neutral-500">
              <li>24x24px grid</li>
              <li>2px stroke width (outline)</li>
              <li>Rounded line caps</li>
              <li>Consistent optical balance</li>
            </ul>
          </Section>

          <Section number="07" title="Buttons">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Get Started</Button>
                <Button variant="secondary">Explore Courses</Button>
                <Button variant="tertiary" icon={<Icon icon={ChevronRight} size={16} />}>
                  View Lesson
                </Button>
                <Button variant="text" icon={<Icon icon={PlayCircle} size={16} />} iconPosition="left">
                  Watch Video
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 opacity-60">
                <Button variant="primary" disabled>
                  Get Started
                </Button>
                <Button variant="secondary" disabled>
                  Explore Courses
                </Button>
                <Button variant="tertiary" disabled icon={<Icon icon={ChevronRight} size={16} />}>
                  View Lesson
                </Button>
                <Button variant="text" disabled icon={<Icon icon={PlayCircle} size={16} />} iconPosition="left">
                  Watch Video
                </Button>
              </div>
              <p className="text-small font-sans text-neutral-500">
                Hover any enabled button above to preview its hover state.
              </p>
              <ul className="list-inside list-disc text-small font-sans text-neutral-500">
                <li>Height: 44px (default)</li>
                <li>Padding: 0 16px (lg), 0 12px (md)</li>
                <li>Radius: 12px</li>
                <li>Font: Inter Medium (14–16px)</li>
              </ul>
            </div>
          </Section>

          <Section number="08" title="Inputs">
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-2 text-small font-sans text-neutral-500">Search / Text Input</div>
                <Input placeholder="Search anything..." shortcut="⌘K" />
              </div>
              <div>
                <div className="mb-2 text-small font-sans text-neutral-500">Select</div>
                <Select defaultValue="relevant">
                  <option value="relevant">Most Relevant</option>
                  <option value="newest">Newest</option>
                  <option value="popular">Most Popular</option>
                </Select>
              </div>
              <ul className="list-inside list-disc text-small font-sans text-neutral-500">
                <li>Height: 44px</li>
                <li>Radius: 12px</li>
                <li>Border: 1px solid #E2E8F0</li>
                <li>Padding: 0 16px</li>
                <li>Focus: Border color #FB923C</li>
              </ul>
            </div>
          </Section>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Section number="09" title="Badges / Tags">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Badge variant="video">Video</Badge>
                <span className="text-small font-sans text-neutral-500">Video</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="lesson">Lesson</Badge>
                <span className="text-small font-sans text-neutral-500">Lesson</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="popular">Popular</Badge>
                <span className="text-small font-sans text-neutral-500">Popular</span>
              </div>
            </div>
          </Section>

          <Section number="10" title="Status / Indicators">
            <div className="flex flex-col gap-3">
              <StatusIndicator status="in-progress" />
              <StatusIndicator status="completed" />
              <StatusIndicator status="now-playing" />
              <StatusIndicator status="locked" />
            </div>
          </Section>

          <Section number="11" title="Progress Bar">
            <ProgressBar value={35} />
          </Section>
        </div>

        <Section number="12" title="Cards">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-2 text-small font-sans text-neutral-500">Course Card</div>
              <CourseCard
                initial="N"
                title="Next.js for Production"
                description="Build scalable, high-performance web applications with Next.js."
                level="Intermediate"
                duration="18h 24m"
                moduleCount={12}
              />
            </div>
            <div>
              <div className="mb-2 text-small font-sans text-neutral-500">Lesson Card (Video)</div>
              <LessonCard
                variant="video"
                title="Data Fetching in Server Components"
                description="Learn how to fetch data on the server using async/await and Next.js best practices."
                lessonLabel="Lesson 5.1"
                timestamp="12:45"
              />
            </div>
            <div>
              <div className="mb-2 text-small font-sans text-neutral-500">Lesson Card (Lesson)</div>
              <LessonCard
                variant="lesson"
                title="Data Fetching & Caching"
                description="Explore different data fetching methods in Next.js and how to cache and revalidate data for optimal performance."
                moduleLabel="Module 5"
              />
            </div>
            <div>
              <div className="mb-2 text-small font-sans text-neutral-500">Resource Card</div>
              <ResourceCard
                title="Caching and Revalidation Guide"
                description="Deep dive into Next.js caching strategies."
                format="PDF"
                size="1.2 MB"
              />
            </div>
          </div>
        </Section>

        <Section number="13" title="Navigation">
          <div className="flex flex-col gap-6">
            <Navbar className="rounded-md border" />
            <div>
              <div className="mb-2 text-small font-sans text-neutral-500">Breadcrumbs</div>
              <Breadcrumbs
                items={[
                  { label: "All Courses", href: "#" },
                  { label: "Next.js for Production", href: "#" },
                  { label: "Data Fetching & Caching" },
                ]}
              />
            </div>
            <div>
              <div className="mb-2 text-small font-sans text-neutral-500">Pagination</div>
              <Pagination page={1} pageCount={8} />
            </div>
          </div>
        </Section>

        <Section number="14" title="Principles">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((p) => (
              <div key={p.title} className="flex flex-col gap-2">
                <Icon icon={p.icon} size={20} className="text-neutral-700" />
                <div className="text-body font-sans font-medium text-neutral-900">{p.title}</div>
                <div className="text-small font-sans text-neutral-500">{p.body}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
