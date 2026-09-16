import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, BarChart, Bookmark, Clock, Layers, Users } from "lucide-react";
import { getCourseBySlug } from "@/sanity/lib/data";
import { urlFor } from "@/sanity/lib/image";
import { Navbar } from "@/components/brand/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { CourseContent } from "@/components/ui/CourseContent";
import { Icon } from "@/components/ui/Icon";
import { OutcomeCard } from "@/components/ui/OutcomeCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCount, formatDuration } from "@/lib/format";
import { getIconByName } from "@/lib/icons";

type CoursePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return {};
  return {
    title: course.title,
    description: course.summary ?? undefined,
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const lessons = course.modules.flatMap((mod) => mod.lessons);
  const totalDuration = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
  const moduleCount = course.modules.length;
  const firstLessonSlug = lessons[0]?.slug;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 pb-24">
      <Navbar />

      <main className="flex-1 px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs
            items={[
              { label: "All Courses", href: "/courses" },
              { label: course.title },
            ]}
          />

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
            <div className="aspect-square w-full overflow-hidden rounded-md bg-neutral-900">
              {course.coverImage ? (
                <img
                  src={urlFor(course.coverImage).width(560).height(560).url()}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-6xl font-semibold text-white">
                  {course.title.charAt(0)}
                </div>
              )}
            </div>

            <div>
              {course.popular ? <Badge variant="popular">Popular</Badge> : null}
              <h1 className="mt-4 font-display text-display-2 text-neutral-900">{course.title}</h1>
              {course.summary ? (
                <p className="mt-4 max-w-2xl text-body-lg font-sans text-neutral-500">
                  {course.summary}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-6 text-sm font-sans text-neutral-500">
                <span className="inline-flex items-center gap-1.5">
                  <Icon icon={BarChart} size={16} />
                  {course.level}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon icon={Clock} size={16} />
                  {formatDuration(totalDuration)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon icon={Layers} size={16} />
                  {moduleCount} module{moduleCount === 1 ? "" : "s"}
                </span>
                {course.studentCount != null ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon icon={Users} size={16} />
                    {formatCount(course.studentCount)} students
                  </span>
                ) : null}
              </div>

              <div className="mt-8 flex items-center gap-3">
                <a
                  href={firstLessonSlug ? `/lessons/${firstLessonSlug}` : "#"}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-md bg-primary-500 px-4 text-base font-medium font-sans text-white transition-colors hover:bg-primary-400"
                >
                  Continue Learning
                  <Icon icon={ArrowRight} size={18} />
                </a>
                <Button variant="tertiary" icon={<Icon icon={Bookmark} size={18} />} iconPosition="left">
                  Bookmark
                </Button>
              </div>
            </div>
          </div>

          {course.outcomes && course.outcomes.length > 0 ? (
            <section className="mt-12 rounded-md border border-neutral-200 bg-white p-6 sm:p-8">
              <h2 className="font-display text-heading-1 text-neutral-900">What you&rsquo;ll learn</h2>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {course.outcomes.map((outcome) => (
                  <OutcomeCard
                    key={outcome._key}
                    icon={getIconByName(outcome.icon)}
                    title={outcome.title}
                    description={outcome.description ?? undefined}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-heading-1 text-neutral-900">Course Content</h2>
              <span className="text-sm font-sans text-neutral-500">
                {moduleCount} module{moduleCount === 1 ? "" : "s"} &bull; {formatDuration(totalDuration)}
              </span>
            </div>
            <div className="rounded-md border border-neutral-200 bg-white px-6">
              <CourseContent modules={course.modules} />
            </div>
          </section>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-6 flex justify-center px-6 sm:px-10">
        <div className="flex w-full max-w-6xl flex-col items-center gap-4 rounded-lg border border-neutral-200 bg-white px-6 py-4 shadow-lg sm:flex-row sm:justify-between">
          <div className="w-full sm:max-w-sm">
            <span className="text-sm font-sans text-neutral-500">Your Progress</span>
            <ProgressBar value={0} className="mt-2" />
          </div>
          {firstLessonSlug ? (
            <a
              href={`/lessons/${firstLessonSlug}`}
              className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-md bg-primary-500 px-4 text-base font-medium font-sans text-white transition-colors hover:bg-primary-400 sm:w-auto"
            >
              Continue Learning
              <Icon icon={ArrowRight} size={18} />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
