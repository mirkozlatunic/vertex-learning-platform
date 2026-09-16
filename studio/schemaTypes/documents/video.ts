import { PlayIcon } from '@sanity/icons'
import { defineArrayMember, defineField, defineType } from 'sanity'

export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      description: 'Provider-prefixed ID derived from the video URL, e.g. "youtube-9602Yzvd7ik". Built by the ingestion pipeline.',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      description: 'Must match a lesson’s videoUrl exactly — lessons link to videos by URL, not by reference.',
      type: 'url',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'chapters',
      title: 'Chapters',
      description: 'The table of contents. Matched first when resolving a search result’s timestamp.',
      type: 'array',
      of: [defineArrayMember({ type: 'videoChapter' })],
    }),
    defineField({
      name: 'chunks',
      title: 'Transcript chunks',
      description: 'The transcript split into short timestamped pieces. Matched only as a fallback when no chapter matches.',
      type: 'array',
      of: [defineArrayMember({ type: 'videoChunk' })],
    }),
  ],
  preview: {
    select: { title: 'id', subtitle: 'url' },
  },
})
