"use client";

import { useState } from "react";
import { ChevronDown, Lock, PlayCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

export type CourseContentLesson = {
  _id: string;
  title: string;
  slug: string;
  duration: number;
  freePreview: boolean | null;
};

export type CourseContentModule = {
  _key: string;
  title: string;
  summary?: string | null;
  lessons: CourseContentLesson[];
};

export type CourseContentProps = {
  modules: CourseContentModule[];
  className?: string;
};

const INITIAL_VISIBLE_MODULES = 6;

export function CourseContent({ modules, className }: CourseContentProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);

  const visibleModules = showAll ? modules : modules.slice(0, INITIAL_VISIBLE_MODULES);
  const hasMore = modules.length > INITIAL_VISIBLE_MODULES;

  return (
    <div className={cn("divide-y divide-neutral-200", className)}>
      {visibleModules.map((mod, index) => {
        const isOpen = Boolean(expanded[mod._key]);
        const moduleDuration = mod.lessons.reduce((sum, lesson) => sum + lesson.duration, 0);

        return (
          <div key={mod._key}>
            <button
              type="button"
              onClick={() => setExpanded((prev) => ({ ...prev, [mod._key]: !prev[mod._key] }))}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 py-4 text-left"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-sm font-medium font-sans text-neutral-700">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body-lg font-medium font-sans text-neutral-900">
                  {mod.title}
                </span>
                {mod.summary ? (
                  <span className="mt-0.5 block truncate text-body font-sans text-neutral-500">
                    {mod.summary}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-body font-sans text-neutral-500">
                {formatDuration(moduleDuration)}
              </span>
              <Icon
                icon={ChevronDown}
                size={18}
                className={cn("shrink-0 text-neutral-400 transition-transform", isOpen && "rotate-180")}
              />
            </button>

            {isOpen ? (
              <ul className="pb-4 pl-12">
                {mod.lessons.map((lesson, lessonIndex) => (
                  <li key={lesson._id}>
                    <a
                      href={`/lessons/${lesson.slug}`}
                      className="flex items-center gap-3 rounded-sm py-2 pr-2 text-sm font-sans text-neutral-700 hover:bg-neutral-50"
                    >
                      <Icon
                        icon={lesson.freePreview ? PlayCircle : Lock}
                        size={16}
                        className="shrink-0 text-neutral-400"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {index + 1}.{lessonIndex + 1} {lesson.title}
                      </span>
                      <span className="shrink-0 text-neutral-500">
                        {formatDuration(lesson.duration)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}

      {hasMore ? (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium font-sans text-neutral-700 hover:bg-neutral-100"
          >
            {showAll ? "Show fewer modules" : `Show all ${modules.length} modules`}
            <Icon icon={ChevronDown} size={16} className={cn(showAll && "rotate-180")} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
