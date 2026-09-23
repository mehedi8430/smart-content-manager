<!-- BEGIN:smart-content-manager-web -->
# Smart Content Manager — Web (apps/web)

AI-powered content and campaign management platform. Next.js 16 (App Router) + React 19 + Tailwind 4 + shadcn/ui frontend, talking to an Express 5 API under `/api/v1`.

## Monorepo context

- Turborepo + Bun workspaces. This app lives at `apps/web`; the API lives at `apps/api`.
- Run commands from the repo root with Bun (`bun run dev`, `bun run build`) unless working only within this package.
- Don't duplicate types/schemas that already exist on the API side (e.g. zod schemas) — check `apps/api` first before redefining shapes.

## How the frontend talks to the API

Three distinct patterns are used **on purpose** — match the existing pattern for the kind of call you're adding, don't invent a fourth:

1. **Server Actions** — campaigns/posts/auth mutations that benefit from server-side execution and cookie access.
2. **axios** — general REST calls (`proxy.ts` sets the base URL / auth proxying).
3. **Raw `fetch` + SSE readers** — `ai-stream-client` and `chat-stream-client` handle the two streaming endpoints:
   - `POST /campaigns/:campaignId/ai-outputs/generate` (and `/regenerate`)
   - `POST /chat/sessions/messages/stream`
   Both must support **cancellation via `AbortController`** and be disconnect-safe (partial content should not corrupt UI state).

- API base URL comes from `NEXT_PUBLIC_API_BASE_URL`.
- `proxy.ts` owns route protection: unauthenticated → redirect `/dashboard*` to `/login`; authenticated → redirect away from `/login|/signup`; `/` redirects to dashboard when logged in. Don't reimplement this logic in page components.

## Environment variables

- `NEXT_PUBLIC_API_BASE_URL` — API origin, exposed to the client.
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` — required for Server Actions (campaigns/posts/auth mutations); don't hardcode or omit in deploy configs.

## Data model awareness

Mirror the API's Prisma schema when shaping frontend types/queries — don't invent fields:

- **User** — email, bcrypt hash, refresh token (never expose the hash/token to the client)
- **Campaign** — name, description, owner; cascades to Posts + AiOutputs
- **Post** — title, description, `status` (`todo|in_progress|done`), `order` (kanban position), `dueDate`
- **AiOutput** — `type` (`ad|caption|email`), title, prompt, tone, content, model, tokensUsed
- **ChatSession** — optional `campaignId` (null = general chat), title, ordered by `updatedAt`
- **ChatMessage** — `role` (`user|assistant`), content

## Feature conventions

- **Dashboard**: KPI cards (active campaigns, content pieces, AI outputs, completion rate) + recent-activity feed are backed by a single paginated campaigns query with posts included on the API side — don't add extra client-side round trips per card; consume the one query.
- **Kanban board**: dnd-kit for drag/drop; moves and reorders are optimistic in the UI, then synced via a single bulk `PATCH` of the full board state — don't fire per-card requests on every drag. Supports column/title search, status filter, keyboard/touch interaction, and skeleton loading states.
- **AI generation**: tone (Professional/Playful/Urgent/Friendly/Bold) and length (Short/Medium/Long) are fixed enum-like option sets — reuse the existing constants rather than redefining them per component. "Use in Post" passes generated content via a URL param to prefill a new post.
- **Output history**: grouped by type; PDF export uses lazy-loaded jsPDF (don't move this to a top-level import — keep it code-split; multi-page with a metadata header). Deletes are optimistic with rollback on failure. Include error state with retry and empty state with CTA when building/extending this view.
- **Chat**: user messages are persisted before streaming starts; assistant replies land after the stream ends. Optimistic rendering uses a local stash until the server-confirmed message replaces it. Chat drawer is reachable from the global header (general chat) and from campaign pages ("ask copilot", campaign-scoped).
- **Forms**: react-hook-form + zod everywhere; keep validation schemas close to the form or shared with the API's zod schema if the shape matches exactly.
- **Data fetching/caching**: React Query is the source of truth for server state — don't hand-roll `useEffect` fetch/cache logic for anything already coverable by a query/mutation hook.

## Public / marketing pages

- Landing page: hero, features, pricing, CTA, screenshots gallery — plus `/privacy` and `/terms` legal pages. These are public routes, not behind `proxy.ts` auth redirects (other than the logged-in-user → dashboard redirect on `/`).
- Keep marketing copy/legal pages self-contained (no dashboard-only components/hooks) since they need to render for logged-out visitors.

## Styling & UI

- Tailwind 4 + shadcn/ui. Prefer composing existing shadcn primitives over new one-off components.
- Support light/dark/system theme via the theme toggle — don't hardcode colors that break in dark mode.
- Mobile-responsive is a hard requirement, not an afterthought — check kanban/board and chat drawer at small viewports specifically, since drag/drop and streaming UIs are the easiest to break there.
- Dashboard shell includes a collapsible sidebar, dynamic breadcrumbs, and global campaign search — reuse these rather than building page-specific nav/search.
- Onboarding hints are dismissible **per-hint** (not globally) — preserve that granularity if you add new hints. Toasts use sonner.

## Auth expectations

- Tokens are `httpOnly` cookies, not accessible to client JS — never try to read/write auth tokens from client components.
- Ownership failures from the API return `404`, not `403` (no existence leak) — handle that status accordingly in error states, don't assume 404 means "not found" in the generic sense on owner-scoped resources.
<!-- END:smart-content-manager-web -->