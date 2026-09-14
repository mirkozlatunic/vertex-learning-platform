import { FolderIcon } from '@sanity/icons'
import { defineArrayMember, defineField, defineType } from 'sanity'

export const module_ = defineType({
  name: 'module',
  title: 'Module',
  type: 'object',
  icon: FolderIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'lessons',
      title: 'Lessons',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'lesson' }] })],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { title: 'title', lessons: 'lessons' },
    /** Formats the module preview with the number of referenced lessons. */
    prepare({ title, lessons }) {
      const count = Array.isArray(lessons) ? lessons.length : 0
      return { title, subtitle: `${count} lesson${count === 1 ? '' : 's'}` }
    },
  },
})
