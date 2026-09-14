import 'server-only'

import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'
import { apiReadToken } from '../env.server'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token: apiReadToken,
  useCdn: false,
  perspective: 'published',
})
