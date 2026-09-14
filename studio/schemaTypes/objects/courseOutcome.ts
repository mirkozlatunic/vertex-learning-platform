import { SparklesIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export const courseOutcome = defineType({
  name: 'courseOutcome',
  title: 'Outcome',
  type: 'object',
  icon: SparklesIcon,
  fields: [
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'A lucide-react icon name, e.g. "BookOpen" (see lucide.dev/icons).',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'icon' },
  },
})
