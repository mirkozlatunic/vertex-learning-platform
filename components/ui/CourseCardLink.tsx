"use client";

import { CourseCard } from "@/components/ui/CourseCard";
import { urlFor } from "@/sanity/lib/image";
import { formatDuration } from "@/lib/format";
import { captureEvent } from "@/lib/posthog-client";
import type { COURSES_QUERY_RESULT } from "@/sanity.types";

export type CourseCardLinkProps = {
  course: COURSES_QUERY_RESULT[number];
};

export function CourseCardLink({ course }: CourseCardLinkProps) {
  return (
    <a
      href={`/courses/${course.slug}`}
      className="block"
      onClick={() =>
        captureEvent("course_selected", {
          course_id: course._id,
          course_level: course.level,
          module_count: course.moduleCount ?? 0,
        })
      }
    >
      <CourseCard
        initial={
          course.coverImage ? (
            <img
              src={urlFor(course.coverImage).width(96).height(96).url()}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            course.title.charAt(0)
          )
        }
        iconClassName={course.coverImage ? "overflow-hidden bg-white p-0" : undefined}
        title={course.title}
        description={course.summary ?? ""}
        level={course.level}
        duration={formatDuration(course.totalDuration ?? 0)}
        moduleCount={course.moduleCount ?? 0}
      />
    </a>
  );
}
