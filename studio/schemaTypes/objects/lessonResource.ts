import { DocumentIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export const lessonResource = defineType({
  name: 'lessonResource',
  title: 'Resource',
  type: 'object',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'PDF', value: 'pdf' },
          { title: 'Article', value: 'article' },
          { title: 'Code', value: 'code' },
          { title: 'Video', value: 'video' },
          { title: 'Link', value: 'link' },
        ],
      },
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
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'type' },
  },
})
