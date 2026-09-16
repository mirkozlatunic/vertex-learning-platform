import posthog from "posthog-js";

export const isPostHogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST,
);

type PostHogEventName =
  | "course_selected"
  | "course_module_toggled"
  | "course_modules_toggled"
  | "lesson_selected"
  | "sign_in_started"
  | "sign_up_started";

export function captureEvent(
  eventName: PostHogEventName,
  properties?: Record<string, string | number | boolean | null>,
) {
  if (!isPostHogConfigured) return;
  posthog.capture(eventName, properties);
}
