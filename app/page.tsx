import { ArrowRight, Star } from "lucide-react";
import { Navbar } from "@/components/brand/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CourseCard } from "@/components/ui/CourseCard";
import { Icon } from "@/components/ui/Icon";

const courses = [
  {
    initial: "N",
    iconClassName: "bg-neutral-900 text-white",
    title: "Next.js for Production",
    description: "Build scalable, high-performance web applications with Next.js.",
    level: "Intermediate",
    duration: "18h 24m",
    moduleCount: 12,
  },
  {
    initial: "🐳",
    iconClassName: "bg-white border border-neutral-200 text-2xl",
    title: "Docker Essentials",
    description: "Containerize applications and streamline your development workflow.",
    level: "Beginner",
    duration: "10h 12m",
    moduleCount: 8,
  },
  {
    initial: "TS",
    iconClassName: "bg-blue-600 text-white",
    title: "TypeScript Deep Dive",
    description: "Go beyond the basics and write safer, more expressive code.",
    level: "Intermediate",
    duration: "14h 36m",
    moduleCount: 10,
  },
];

const barHeights = [40, 64, 96, 56, 128, 72, 104, 48, 88, 120, 60];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-neutral-200 px-6 py-20 text-center sm:px-10">
          <Badge variant="outline">Intelligent Learning</Badge>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-display-1 text-neutral-900">
            Search your learning in plain English.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-body-lg font-sans text-neutral-500">
            Vertex understands what you want to learn and finds the exact lessons across all your
            courses.
          </p>
          <div className="mt-8 flex justify-center">
            <Button variant="primary" icon={<Icon icon={ArrowRight} size={18} />}>
              Explore Courses
            </Button>
          </div>
          <div className="mx-auto mt-8 max-w-xl">
            <Input placeholder="Ask anything about your learning..." shortcut="⌘K" />
          </div>
        </section>

        <section className="px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-display text-display-2 text-neutral-900">All Courses</h2>
              <a
                href="/courses"
                className="inline-flex items-center gap-1.5 text-sm font-medium font-sans text-primary-500 hover:text-primary-400"
              >
                View all courses
                <Icon icon={ArrowRight} size={16} />
              </a>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.title} {...course} />
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-6 pt-8 pb-0 sm:px-10">
          <div className="mx-auto flex max-w-xl items-center justify-center gap-2 border-t border-neutral-200 pt-8">
            <Icon icon={Star} size={16} className="text-primary-400" />
            <p className="text-body font-sans text-neutral-500">
              New courses and lessons added every week.
            </p>
          </div>
          <div
            aria-hidden
            className="mx-auto mt-10 hidden max-w-5xl items-end justify-center gap-3 sm:flex"
          >
            {barHeights.map((height, i) => (
              <div
                key={i}
                className="w-10 rounded-t-sm bg-linear-to-t from-primary-300 to-primary-100/0"
                style={{ height }}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
