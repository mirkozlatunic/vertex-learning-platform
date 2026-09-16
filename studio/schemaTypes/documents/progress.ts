import { CheckmarkCircleIcon } from '@sanity/icons'
import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * One document per learner, `_id` deterministic as `progress.<clerkUserId>`
 * (AGENTS.md §8). Written only by the server-only progress route — never
 * edited by hand in Studio in normal operation.
 */
export const progress = defineType({
  name: 'progress',
  title: 'Progress',
  type: 'document',
  icon: CheckmarkCircleIcon,
  fields: [
    defineField({
      name: 'userId',
      title: 'Clerk user ID',
      type: 'string',
      validation: (rule) => rule.required(),
      readOnly: true,
    }),
    defineField({
      name: 'completedLessons',
      title: 'Completed lessons',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'completedLesson',
          fields: [
            defineField({ name: 'lesson', type: 'reference', to: [{ type: 'lesson' }], validation: (rule) => rule.required() }),
            defineField({ name: 'completedAt', type: 'datetime', validation: (rule) => rule.required() }),
          ],
          preview: {
            select: { title: 'lesson.title', subtitle: 'completedAt' },
          },
        }),
      ],
    }),
    defineField({
      name: 'lessonPositions',
      title: 'Lesson resume positions',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'lessonPosition',
          fields: [
            defineField({ name: 'lesson', type: 'reference', to: [{ type: 'lesson' }], validation: (rule) => rule.required() }),
            defineField({ name: 'positionSeconds', type: 'number', validation: (rule) => rule.required().min(0) }),
            defineField({ name: 'updatedAt', type: 'datetime', validation: (rule) => rule.required() }),
          ],
          preview: {
            select: { title: 'lesson.title', subtitle: 'positionSeconds' },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'userId' },
  },
})
