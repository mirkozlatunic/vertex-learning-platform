import { BookIcon, TagIcon, UserIcon } from '@sanity/icons'
import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('course').icon(BookIcon),
      S.documentTypeListItem('instructor').icon(UserIcon),
      S.documentTypeListItem('category').icon(TagIcon),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => !['course', 'instructor', 'category'].includes(item.getId() ?? ''),
      ),
    ])
