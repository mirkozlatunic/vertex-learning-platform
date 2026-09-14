import 'server-only'

import { client } from './client'
import {
  CATEGORIES_QUERY,
  COURSES_QUERY,
  COURSE_BY_SLUG_QUERY,
  INSTRUCTOR_BY_SLUG_QUERY,
  LESSON_BY_SLUG_QUERY,
} from './queries'

/** Fetches published course-card data ordered by course title. */
export async function getCourses() {
  return client.fetch(COURSES_QUERY)
}

/** Fetches a published course with its resolved content, or `null` when the slug is not found. */
export async function getCourseBySlug(slug: string) {
  const course = await client.fetch(COURSE_BY_SLUG_QUERY, { slug })
  return course ?? null
}

/** Fetches published category data ordered by category title. */
export async function getCategories() {
  return client.fetch(CATEGORIES_QUERY)
}

/** Fetches a published instructor and their courses, or `null` when the slug is not found. */
export async function getInstructorBySlug(slug: string) {
  const instructor = await client.fetch(INSTRUCTOR_BY_SLUG_QUERY, { slug })
  return instructor ?? null
}

/**
 * Fetches a published lesson and derives its one-based module and lesson positions from course
 * order. Position fields are `null` when the lesson is not referenced by a course module, and the
 * function returns `null` when the slug is not found.
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
