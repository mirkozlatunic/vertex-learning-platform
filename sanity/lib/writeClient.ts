import 'server-only'

import { createClient, type SanityClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'
import { apiWriteToken } from '../env.server'

/**
 * Server-only write client for progress records (AGENTS.md §8). `null` when
 * SANITY_API_WRITE_TOKEN isn't configured — callers check this before writing.
 */
export const writeClient: SanityClient | null = apiWriteToken
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      token: apiWriteToken,
      useCdn: false,
      perspective: 'published',
    })
  : null
