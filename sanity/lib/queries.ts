import { defineQuery } from 'next-sanity'

const outcomeProjection = /* groq */ `
  outcomes[]{
    _key,
    icon,
    title,
    description,
  },
`

const resourceProjection = /* groq */ `
  resources[]{
    _key,
    type,
    title,
    description,
    url,
  },
`

const lessonCardProjection = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  videoUrl,
  poster,
  duration,
  freePreview,
  studentCount,
`

const courseCardProjection = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  summary,
  coverImage,
  level,
  price,
  popular,
  studentCount,
  "instructor": instructor->{ _id, name, "slug": slug.current, photo },
  "category": category->{ _id, title, "slug": slug.current },
  "moduleCount": count(modules),
  "totalDuration": math::sum(modules[].lessons[]->duration),
`

export const COURSES_QUERY = defineQuery(`
  *[_type == "course" && defined(slug.current)] | order(title asc) {
    ${courseCardProjection}
  }
`)

export const COURSE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "course" && slug.current == $slug][0]{
    ${courseCardProjection}
    ${outcomeProjection}
    modules[]{
      _key,
      title,
      summary,
      lessons[]->{
        ${lessonCardProjection}
      },
    },
  }
`)

export const LESSON_BY_SLUG_QUERY = defineQuery(`
  *[_type == "lesson" && slug.current == $slug][0]{
    ${lessonCardProjection}
    notes,
    keyPoints,
    proTip,
    ${resourceProjection}
    "course": *[_type == "course" && references(^._id)][0]{
      _id,
      title,
      "slug": slug.current,
      modules[]{
        _key,
        title,
        "lessonSlugs": lessons[]->slug.current,
      },
    },
  }
`)

export const INSTRUCTOR_BY_SLUG_QUERY = defineQuery(`
  *[_type == "instructor" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    photo,
    expertise,
    bio,
    "courses": *[_type == "course" && references(^._id)]{
      ${courseCardProjection}
    },
  }
`)

export const CATEGORIES_QUERY = defineQuery(`
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    description,
  }
`)
