"use client";

import { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";
import { captureEvent } from "@/lib/posthog-client";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusIndicator } from "@/components/ui/StatusIndicator";

export type LessonSidebarLesson = {
  _id: string;
  title: string;
  slug: string;
  duration: number;
};

export type LessonSidebarModule = {
  _key: string;
  title: string;
  lessons: LessonSidebarLesson[];
};

export type LessonSidebarProps = {
  courseTitle: string;
  courseSlug: string;
  modules: LessonSidebarModule[];
  currentModuleKey: string | null;
  currentLessonSlug: string;
  className?: string;
};

export function LessonSidebar({
  courseTitle,
  courseSlug,
  modules,
  currentModuleKey,
  currentLessonSlug,
  className,
}: LessonSidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    currentModuleKey ? { [currentModuleKey]: true } : {},
  );

  return (
    <aside className={cn("flex flex-col border-neutral-200 bg-white", className)}>
      <div className="border-b border-neutral-200 p-6">
        <a
          href={`/courses/${courseSlug}`}
          className="inline-flex items-center gap-2 text-sm font-medium font-sans text-neutral-700 hover:text-neutral-900"
        >
          <Icon icon={ArrowLeft} size={16} />
          Back to course
        </a>

        <a
          href={`/courses/${courseSlug}`}
          className="mt-4 flex items-center gap-3 rounded-md border border-neutral-200 p-3 hover:bg-neutral-50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-neutral-900 text-sm font-semibold text-white">
            {courseTitle.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium font-sans text-neutral-900">
              {courseTitle}
            </span>
            <ProgressBar value={0} className="mt-1.5" />
          </div>
        </a>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {modules.map((mod, moduleIndex) => {
          const isOpen = Boolean(expanded[mod._key]);
          const moduleDuration = mod.lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
          const isCurrentModule = mod._key === currentModuleKey;

          return (
            <div key={mod._key} className="border-b border-neutral-200">
              <button
                type="button"
                onClick={() => {
                  setExpanded((prev) => ({ ...prev, [mod._key]: !prev[mod._key] }));
                  captureEvent("course_module_toggled", {
                    module_id: mod._key,
                    module_index: moduleIndex + 1,
                    expanded: !isOpen,
                    lesson_count: mod.lessons.length,
                  });
                }}
                aria-expanded={isOpen}
                className={cn(
                  "flex w-full items-center gap-3 px-6 py-4 text-left",
                  isCurrentModule && "bg-primary-100/40",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium font-sans",
                    isCurrentModule
                      ? "bg-primary-500 text-white"
                      : "border border-neutral-200 text-neutral-700",
                  )}
                >
                  {moduleIndex + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium font-sans text-neutral-900">
                    {mod.title}
                  </span>
                  <span className="block text-xs font-sans text-neutral-500">
                    {formatDuration(moduleDuration)}
                  </span>
                </span>
                <Icon
                  icon={ChevronDown}
                  size={16}
                  className={cn("shrink-0 text-neutral-400 transition-transform", isOpen && "rotate-180")}
                />
              </button>

              {isOpen ? (
                <ul className="pb-2">
                  {mod.lessons.map((lesson, lessonIndex) => {
                    const isCurrent = lesson.slug === currentLessonSlug;
                    return (
                      <li key={lesson._id}>
                        <a
                          href={`/lessons/${lesson.slug}`}
                          className={cn(
                            "flex items-center gap-3 border-l-2 py-2 pl-8 pr-6 text-sm font-sans hover:bg-neutral-50",
                            isCurrent
                              ? "border-primary-500 bg-primary-100/40 text-neutral-900"
                              : "border-transparent text-neutral-700",
                          )}
                          onClick={() =>
                            captureEvent("lesson_selected", {
                              lesson_id: lesson._id,
                              module_id: mod._key,
                              module_index: moduleIndex + 1,
                              lesson_index: lessonIndex + 1,
                              free_preview: false,
                            })
                          }
                        >
                          <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                          {isCurrent ? (
                            <StatusIndicator status="now-playing" className="shrink-0" />
                          ) : (
                            <span className="shrink-0 text-xs text-neutral-500">
                              {formatDuration(lesson.duration)}
                            </span>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
