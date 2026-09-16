import 'server-only'

// Never expose this to the browser. Required to read the private dataset.
export const apiReadToken = assertValue(
  process.env.SANITY_API_READ_TOKEN,
  'Missing environment variable: SANITY_API_READ_TOKEN'
)

// Never expose this to the browser. Used only by the progress write route —
// checked at request time there, not required for the rest of the app to build/run.
export const apiWriteToken = process.env.SANITY_API_WRITE_TOKEN

/** Returns a defined value or throws an error with the supplied message. */
function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }

  return v
}
