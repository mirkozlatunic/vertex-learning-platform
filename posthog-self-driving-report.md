# PostHog Self-driving setup report

## Summary

PostHog Self-driving is configured with Session Replay, Error Tracking, and Support enabled, plus health, error, and support signal sources. Two Replay Vision monitors and a focused scout troop are active; findings should begin appearing in the [Self-driving inbox](https://us.posthog.com/project/600750/inbox) within about 30 minutes.

## AI data processing

Approved by the wizard's organization-level gate before this setup.

## GitHub

The PostHog GitHub App was already connected before this setup. GitHub Issues was not selected as an inbox source, so no GitHub Issues responder was enabled.

## Products enabled

| Product | Result | Notes |
|---|---|---|
| Session Replay | Already enabled | This is a web app. A recording exists, but no `posthog.init(...)` was found in this repository to validate client-side replay settings. |
| Error Tracking | Already enabled | No active issues were returned by the usage probe. Client initialization still needs verification. |
| Support (Conversations) | Enabled | Tickets will reach Self-driving once an inbound email, inbox, or Slack channel is connected in PostHog. |

## Signal sources

| Source product | Source type | Action |
|---|---|---|
| `health_checks` | `health_issue` | Enabled |
| `error_tracking` | `issue_created` | Enabled |
| `error_tracking` | `issue_reopened` | Enabled |
| `error_tracking` | `issue_spiking` | Enabled |
| `conversations` | `ticket` | Enabled |
| `signals_scout` | `cross_source_issue` | No row created; scout findings are enabled by default. |
| `session_replay` | `session_analysis_cluster` | Deliberately skipped; retired source, replaced by Replay Vision monitors. |
| `replay_vision` | — | No source row needed; each scanner emits its own findings. |

## Connected tools

No external issue tracker, support desk, error tracker, security scanner, feedback platform, or search analytics source was selected. The project had no data warehouse sources at the time of setup.

## Scout troop

**Run budget:** 100 maximum runs per day; 0 used today; 100 remaining. The project is enrolled in early access. Announcement: “Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more.”

### Active scouts (7)

| Scout | Why enabled |
|---|---|
| `signals-scout-general` | Cross-product coverage for surfaces without a dedicated active specialist. |
| `signals-scout-product-analytics` | Product engagement and core flow regressions are central to this learning product. |
| `signals-scout-web-analytics` | Watches site traffic, attribution, and course landing-page health. |
| `signals-scout-health-checks` | Surfaces actionable PostHog setup-health issues. |
| `signals-scout-observability-gaps` | Finds high-volume product behavior missing analytics coverage. |
| `signals-scout-course-discovery-learning` | Approved custom coverage for the course-to-lesson journey. |
| `signals-scout-account-access-intent` | Approved custom coverage for sign-in and registration intent. |

### Disabled built-in scouts (22)

| Scouts | Reason |
|---|---|
| `signals-scout-error-tracking` | Covered by the enabled native Error Tracking responder. |
| `signals-scout-session-replay` | Covered by the enabled Replay Vision monitors. |
| `signals-scout-ai-observability`, `signals-scout-apm`, `signals-scout-csp-violations` | No current implementation evidence for LLM observability, tracing, or CSP reporting. |
| `signals-scout-conversations` | Support is newly enabled but no inbound channel or ticket activity is configured yet. |
| `signals-scout-customer-analytics` | No account/group analytics evidence. |
| `signals-scout-data-pipelines`, `signals-scout-data-warehouse` | No configured pipeline or warehouse source. |
| `signals-scout-experiments`, `signals-scout-feature-flags` | No active experiment or feature-flag usage evidenced in the repository/profile. |
| `signals-scout-inbox-validation` | Fresh setup has no resolved reports or shipped fixes to validate. |
| `signals-scout-insight-alerts`, `signals-scout-anomaly-detection` | No saved alert or established insight evidence; the targeted product and web scouts cover the current need. |
| `signals-scout-logs`, `signals-scout-mcp-tool-calls`, `signals-scout-skills-store`, `signals-scout-tasks` | No confirmed usage of these surfaces. |
| `signals-scout-replay-vision` | No historic Replay Vision observations yet; it can be enabled later to analyze scanner trends. |
| `signals-scout-revenue-analytics` | No payment SDK or revenue data source was detected. |
| `signals-scout-surveys` | No surveys exist in the project. |
| `signals-scout-web-vitals` | Web traffic coverage is active; no Web Vitals usage evidence yet. |

## Custom scouts

| Scout | What it watches | Signal-vs-noise discriminator | Why custom coverage is useful |
|---|---|---|---|
| `signals-scout-course-discovery-learning` | The journey from selecting a course, through module exploration, to selecting a lesson. | A sustained decline in people reaching a lesson after selecting a course, especially with repeated module browsing. | The built-in product analytics scout watches saved generic flows; this explicitly owns the learning product’s discovery-to-learning path. |
| `signals-scout-account-access-intent` | Sign-in and registration intent compared with course and lesson activity. | A persistent divergence in access starts relative to learning activity, rather than raw traffic movement. | No active built-in scout specifically compares account-access demand with learning engagement. |

Considered but not proposed: error tracking and session replay are already covered by their dedicated responder/scanner routes; revenue, surveys, CSP, logs, experiments, flags, warehouse, and LLM observability lacked concrete usage evidence. No proposal was declined.

If either custom scout is noisy, set its config’s `emit` value to `false` in PostHog to run it in dry-run mode without filing inbox reports.

## Replay Vision scanners

A scanner is an LLM that watches individual session recordings on a schedule and pushes clear findings to the inbox. These are the only items in this setup that spend Replay Vision quota. Findings arrive at half weight, so independently corroborating findings are needed before they promote into an inbox report.

| Scanner | Status | Scope and rationale | Sampling | Estimate |
|---|---|---|---|---|
| Vertex course learning breakage | Created | Monitors recordings whose URL contains `/courses`, the implemented catalog and course-content path where a learner browses courses, expands modules, and starts a lesson. It watches visible load, navigation, and control failures. | 50% | 0 matched sessions in the one-day estimate; 0 observations and 0 credits/month projected. |
| Vertex learning frustration | Created | Monitors recordings containing `$rageclick`, with no URL filter, for observable repeated interaction and abandonment in the learning flow. | 100% | 0 matched sessions in the one-day estimate; 0 observations and 0 credits/month projected. |

Replay Vision currently has 2,500 credits remaining, is not exhausted, and had no other scanner spend projected. A replay recording exists, but neither new scanner’s current scope matched sessions in the estimate window; both remain armed and will scan matching recordings as they arrive. Rate future observations with thumbs up or down in the scanner UI to receive configuration recommendations.

## Follow-ups

- [ ] Add and verify a browser `posthog.init(...)` at the application client entry point. This repository imports and calls `posthog-js` but no initialization call was located, so captures, replay, and exception reporting from this repo may not be sent. Keep default capture and recording behavior; do not disable replay or exception capture.
- [ ] Connect an inbound Support channel (email, inbox, or Slack) in PostHog so the enabled Support responder receives tickets.
- [ ] Revisit the disabled scouts when the corresponding product surfaces become active, especially feature flags, experiments, AI observability, revenue, surveys, and Web Vitals.
- [ ] Review the first scanner observations and rate their usefulness to refine the two Replay Vision monitors.

## What happens next

The scout coordinator picks up fresh configurations within about 30 minutes. Each run draws from the daily budget, findings cluster into reports in the [Self-driving inbox](https://us.posthog.com/project/600750/inbox), and immediately actionable reports can begin coding tasks.