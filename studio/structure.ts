import { BookIcon, TagIcon, UserIcon } from '@sanity/icons'
import type { StructureResolver } from 'sanity/structure'

/** Builds the Studio content list with primary types first and all remaining types afterward. */
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
