import "server-only";

import { PostHog } from "posthog-node";

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

export const isPostHogServerConfigured = Boolean(posthogToken && posthogHost);

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (!posthogToken || !posthogHost) return null;
  if (!client) {
    // flushAt/flushInterval: each request handler is short-lived (serverless),
    // so every capture must send before the handler returns — see captureServerEvent.
    client = new PostHog(posthogToken, { host: posthogHost, flushAt: 1, flushInterval: 0 });
  }
  return client;
}

type ServerEventName = "resume_used" | "lesson_completed";

export async function captureServerEvent(
  distinctId: string,
  event: ServerEventName,
  properties?: Record<string, string | number | boolean | null>,
) {
  const ph = getClient();
  if (!ph) return;
  ph.capture({ distinctId, event, properties });
  await ph.flush();
}
