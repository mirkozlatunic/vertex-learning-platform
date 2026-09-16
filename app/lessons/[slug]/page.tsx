import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { ArrowLeft, ArrowRight, BarChart, Bookmark, CheckCircle2, Clock, Lightbulb, Users } from "lucide-react";
import { getLessonBySlug } from "@/sanity/lib/data";
import { Navbar } from "@/components/brand/Navbar";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { LessonResourceItem } from "@/components/ui/LessonResourceItem";
import { LessonSidebar } from "@/components/ui/LessonSidebar";
import { LessonTabs } from "@/components/ui/LessonTabs";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { formatCount, formatDuration } from "@/lib/format";

type LessonPageProps = {
  params: Promise<{ slug: string }>;
};

const portableTextComponents: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h3 className="mt-6 font-display text-heading-3 text-neutral-900 first:mt-0">{children}</h3>
    ),
    normal: ({ children }) => (
      <p className="mt-3 text-body-lg font-sans text-neutral-700 first:mt-0">{children}</p>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="mt-3 list-disc space-y-1 pl-5">{children}</ul>,
  },
  listItem: {
    bullet: ({ children }) => <li className="text-body font-sans text-neutral-700">{children}</li>,
  },
};

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = await getLessonBySlug(slug);
  if (!lesson) return {};
  return { title: lesson.title };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug } = await params;
  const lesson = await getLessonBySlug(slug);
  if (!lesson) notFound();

  const course = lesson.course;
  const modules = course?.modules ?? [];
  const currentModuleKey =
    modules.find((mod) => mod.lessons.some((l) => l.slug === slug))?._key ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Navbar />

      <div className="flex flex-1 flex-col lg:flex-row">
        {course ? (
          <LessonSidebar
            courseTitle={course.title}
            courseSlug={course.slug}
            modules={modules}
            currentModuleKey={currentModuleKey}
            currentLessonSlug={slug}
            className="w-full shrink-0 lg:w-80 lg:border-r"
          />
        ) : null}

        <main className="flex-1 px-6 py-8 pb-16 sm:px-10">
          <div className="mx-auto max-w-4xl">
            <Breadcrumbs
              items={[
                { label: "All Courses", href: "/courses" },
                ...(course ? [{ label: course.title, href: `/courses/${course.slug}` }] : []),
                ...(lesson.moduleTitle ? [{ label: lesson.moduleTitle }] : []),
                { label: lesson.title },
              ]}
            />

            <div className="mt-6 flex items-start justify-between gap-4">
              <div>
                {lesson.moduleNumber != null && lesson.lessonNumber != null ? (
                  <Badge variant="outline">
                    Lesson {lesson.moduleNumber}.{lesson.lessonNumber}
                  </Badge>
                ) : null}
                <h1 className="mt-3 font-display text-display-2 text-neutral-900">{lesson.title}</h1>
              </div>
              <button
                type="button"
                aria-label="Bookmark lesson"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
              >
                <Icon icon={Bookmark} size={18} />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-6 text-sm font-sans text-neutral-500">
              <span className="inline-flex items-center gap-1.5">
                <Icon icon={Clock} size={16} />
                {formatDuration(lesson.duration)}
              </span>
              {course?.level ? (
                <span className="inline-flex items-center gap-1.5">
                  <Icon icon={BarChart} size={16} />
                  {course.level}
                </span>
              ) : null}
              {lesson.studentCount != null ? (
                <span className="inline-flex items-center gap-1.5">
                  <Icon icon={Users} size={16} />
                  {formatCount(lesson.studentCount)} students
                </span>
              ) : null}
            </div>

            <VideoPlayer
              videoUrl={lesson.videoUrl}
              title={lesson.title}
              lessonId={lesson._id}
              className="mt-6"
            />

            <LessonTabs
              lessonId={lesson._id}
              className="mt-8"
              lessonContent={
                <div>
                  {lesson.notes && lesson.notes.length > 0 ? (
                    <section>
                      <h2 className="font-display text-heading-2 text-neutral-900">Overview</h2>
                      <PortableText value={lesson.notes} components={portableTextComponents} />
                    </section>
                  ) : null}

                  {lesson.keyPoints && lesson.keyPoints.length > 0 ? (
                    <section className="mt-8">
                      <h2 className="font-display text-heading-2 text-neutral-900">
                        In this lesson you will:
                      </h2>
                      <ul className="mt-4 space-y-3">
                        {lesson.keyPoints.map((point) => (
                          <li key={point} className="flex items-start gap-2.5">
                            <Icon
                              icon={CheckCircle2}
                              filled
                              size={18}
                              className="mt-0.5 shrink-0 text-primary-500"
                            />
                            <span className="text-body-lg font-sans text-neutral-700">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {lesson.proTip ? (
                    <div className="mt-8 flex gap-3 rounded-md bg-primary-100/60 p-5">
                      <Icon icon={Lightbulb} size={20} className="mt-0.5 shrink-0 text-primary-500" />
                      <div>
                        <h3 className="text-sm font-medium font-sans text-neutral-900">Pro Tip</h3>
                        <p className="mt-1 text-body font-sans text-neutral-700">{lesson.proTip}</p>
                      </div>
                    </div>
                  ) : null}

                  {lesson.resources && lesson.resources.length > 0 ? (
                    <section className="mt-8">
                      <h2 className="font-display text-heading-2 text-neutral-900">Resources</h2>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {lesson.resources.map((resource) => (
                          <LessonResourceItem
                            key={resource._key}
                            type={resource.type}
                            title={resource.title}
                            description={resource.description}
                            url={resource.url}
                            lessonId={lesson._id}
                          />
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              }
            />
          </div>
        </main>
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-neutral-200 bg-white px-6 py-4 sm:px-10">
        {lesson.previousLesson ? (
          <a
            href={`/lessons/${lesson.previousLesson.slug}`}
            className="inline-flex items-center gap-3 rounded-md border border-neutral-200 px-4 py-2.5 hover:bg-neutral-50"
          >
            <Icon icon={ArrowLeft} size={16} className="text-neutral-500" />
            <span className="text-left">
              <span className="block text-xs font-sans text-neutral-500">Previous Lesson</span>
              <span className="block text-sm font-medium font-sans text-neutral-900">
                {lesson.previousLesson.title}
              </span>
            </span>
          </a>
        ) : (
          <span />
        )}

        {lesson.nextLesson ? (
          <a
            href={`/lessons/${lesson.nextLesson.slug}`}
            className="inline-flex items-center gap-3 rounded-md bg-primary-500 px-4 py-2.5 text-white hover:bg-primary-400"
          >
            <span className="text-right">
              <span className="block text-xs font-sans text-white/80">Next Lesson</span>
              <span className="block text-sm font-medium font-sans">{lesson.nextLesson.title}</span>
            </span>
            <Icon icon={ArrowRight} size={16} />
          </a>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
