import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Navbar } from "@/components/brand/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CourseCardLink } from "@/components/ui/CourseCardLink";
import { HeroSearchForm } from "@/components/search/HeroSearchForm";
import { Icon } from "@/components/ui/Icon";
import { getCourses } from "@/sanity/lib/data";

const barHeights = [40, 64, 96, 56, 128, 72, 104, 48, 88, 120, 60];

export default async function Home() {
  const courses = (await getCourses()).slice(0, 3);
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
            <Link href="/courses">
              <Button variant="primary" icon={<Icon icon={ArrowRight} size={18} />}>
                Explore Courses
              </Button>
            </Link>
          </div>
          <div className="mx-auto mt-8 max-w-xl">
            <HeroSearchForm />
          </div>
        </section>

        <section className="px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-display text-display-2 text-neutral-900">All Courses</h2>
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 text-sm font-medium font-sans text-primary-500 hover:text-primary-400"
              >
                View all courses
                <Icon icon={ArrowRight} size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCardLink key={course._id} course={course} />
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-6 pt-8 pb-0 sm:px-10">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <span className="h-px flex-1 bg-neutral-200" aria-hidden />
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <Icon icon={Star} size={16} className="text-primary-400" />
              <p className="text-body font-sans text-neutral-500">
                New courses and lessons added every week.
              </p>
            </span>
            <span className="h-px flex-1 bg-neutral-200" aria-hidden />
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
