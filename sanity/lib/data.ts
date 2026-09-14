import 'server-only'

import { client } from './client'
import {
  CATEGORIES_QUERY,
  COURSES_QUERY,
  COURSE_BY_SLUG_QUERY,
  INSTRUCTOR_BY_SLUG_QUERY,
  LESSON_BY_SLUG_QUERY,
} from './queries'

/** Fetches published courses in title order with their instructor and category details. */
export async function getCourses() {
  return client.fetch(COURSES_QUERY)
}

/**
 * Fetches a published course by slug, including its outcomes and ordered modules.
 *
 * Lesson references in each module are resolved. Returns `null` when no course matches.
 */
export async function getCourseBySlug(slug: string) {
  const course = await client.fetch(COURSE_BY_SLUG_QUERY, { slug })
  return course ?? null
}

/** Fetches published categories in title order. */
export async function getCategories() {
  return client.fetch(CATEGORIES_QUERY)
}

/**
 * Fetches a published instructor by slug together with courses that reference them.
 *
 * Returns `null` when no instructor matches.
 */
export async function getInstructorBySlug(slug: string) {
  const instructor = await client.fetch(INSTRUCTOR_BY_SLUG_QUERY, { slug })
  return instructor ?? null
}

/**
 * Fetches a published lesson by slug and derives its location within the containing course.
 *
 * The module title and one-based module and lesson numbers come from array order. They remain
 * `null` when the lesson is not referenced by a course module. Returns `null` when no lesson
 * matches the slug.
 */
export async function getLessonBySlug(slug: string) {
  const lesson = await client.fetch(LESSON_BY_SLUG_QUERY, { slug })
  if (!lesson) return null

  const modules: { title: string; lessonSlugs: string[] }[] = lesson.course?.modules ?? []
  let moduleNumber: number | null = null
  let lessonNumber: number | null = null
  let moduleTitle: string | null = null

  modules.forEach((mod, moduleIndex: number) => {
    const lessonIndex = (mod.lessonSlugs ?? []).indexOf(slug)
    if (lessonIndex !== -1) {
      moduleNumber = moduleIndex + 1
      lessonNumber = lessonIndex + 1
      moduleTitle = mod.title
    }
  })

  return {
    ...lesson,
    course: lesson.course
      ? {
          _id: lesson.course._id,
          title: lesson.course.title,
          slug: lesson.course.slug,
        }
      : null,
    moduleNumber,
    lessonNumber,
    moduleTitle,
  }
}
