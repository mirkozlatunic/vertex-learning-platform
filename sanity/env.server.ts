import 'server-only'

// Never expose this to the browser. Required to read the private dataset.
export const apiReadToken = assertValue(
  process.env.SANITY_API_READ_TOKEN,
  'Missing environment variable: SANITY_API_READ_TOKEN'
)

/** Returns a configured value, or throws with the supplied message when it is undefined. */
function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }

  return v
}
