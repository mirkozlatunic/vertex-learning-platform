import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'

import { dataset, projectId } from '../env'

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({ projectId, dataset })

/** Creates an image URL builder for a source in the configured Sanity project and dataset. */
export const urlFor = (source: SanityImageSource) => {
  return builder.image(source)
}
