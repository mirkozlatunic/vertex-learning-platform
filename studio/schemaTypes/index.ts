import { type SchemaTypeDefinition } from 'sanity'

import { category } from './documents/category'
import { instructor } from './documents/instructor'
import { lesson } from './documents/lesson'
import { course } from './documents/course'
import { video } from './documents/video'
import { progress } from './documents/progress'
import { courseOutcome } from './objects/courseOutcome'
import { lessonResource } from './objects/lessonResource'
import { module_ } from './objects/module'
import { videoChapter } from './objects/videoChapter'
import { videoChunk } from './objects/videoChunk'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // Documents
    course,
    lesson,
    instructor,
    category,
    video,
    progress,
    // Objects
    module_,
    courseOutcome,
    lessonResource,
    videoChapter,
    videoChunk,
  ],
}
