# AI Content Generator — Implementation
### Smart Content & Campaign Manager

**Feature:** AI-powered generation of ads, captions, and emails per campaign, with streaming output, save/reuse, and history.

This guide is split into agent-executable phases, matching how the Kanban board was built: backend service layer → backend API → frontend static UI → frontend data wiring → state/integration. Each phase is a self-contained prompt block you can hand to your coding agent, with explicit file targets and constraints.

---

## 0. Architecture Decisions

| Decision | Choice | Why |
|---|---|---|
| AI Provider | Anthropic API (`@anthropic-ai/sdk`) | Matches your stack notes; swap-friendly if you abstract behind a service interface |
| Model | `claude-sonnet-4-6` (configurable via env) | Good quality/cost balance for marketing copy |
| Transport | Server-Sent Events (SSE) from Express, consumed via `fetch` + `ReadableStream` on the client | Real streaming UX; avoids WebSocket infra overhead |
| Content types | `ad` \| `caption` \| `email` | Matches existing `AiOutput.type` field |
| Persistence | Save on completion (not per-token) | Avoids write amplification; store final content once stream ends |
| Cost control | Separate, stricter rate limiter on generation routes | Generation is expensive; don't let it share the general `/api` limiter budget |

**Key architectural note on streaming + Next.js:** Server Actions do not support streaming responses well (they're designed for single request/response). For the generation endpoint specifically, the frontend will call the Express API **directly** via `fetch` with `credentials: 'include'` from a client component, not through a Next.js server action. All other AI-output operations (list, get, delete, regenerate metadata, save) go through server actions as usual, consistent with your existing pattern.

---

## Phase 1 — Backend: Schema Update

**Goal:** Extend `AiOutput` to support the generator UI (title, tone, generation status, model used, token usage) without breaking existing rows.

**File target:** `prisma/schema.prisma`

**Agent prompt:**

```
Update the AiOutput model in schema.prisma as follows. Do not modify any other models.

model AiOutput {
  id          String   @id @default(uuid())
  type        String   // ad | caption | email
  title       String?
  prompt      String
  tone        String?
  content     String   @db.Text
  status      String   @default("completed") // pending | completed | failed
  model       String?
  tokensUsed  Int?
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

Notes:
- All new fields are optional or have defaults, so this is a non-breaking additive migration.
- Add onDelete: Cascade to match the Post model's existing cascade pattern (currently missing on AiOutput's relation).
- After editing, run: npx prisma migrate dev --name add_ai_output_fields
- Run npx prisma generate afterward.
```

---

## Phase 2 — Backend: AI Service Layer

**Goal:** Provider abstraction, prompt templates, and streaming primitives — isolated from Express so it's testable and swappable.

**File targets:**
- `src/config/ai.config.ts`
- `src/services/ai/ai.service.ts`
- `src/services/ai/prompts/ad.prompt.ts`
- `src/services/ai/prompts/caption.prompt.ts`
- `src/services/ai/prompts/email.prompt.ts`
- `src/services/ai/prompts/index.ts`
- `src/types/ai.types.ts`

**Agent prompt:**

```
Install the Anthropic SDK: npm install @anthropic-ai/sdk

Create src/config/ai.config.ts:
- Export a singleton Anthropic client instantiated with process.env.ANTHROPIC_API_KEY
- Export AI_MODEL = process.env.AI_MODEL || 'claude-sonnet-4-6'
- Export AI_MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || '1024')
- Throw a clear startup error if ANTHROPIC_API_KEY is missing (fail fast, don't fail silently on first request)

Create src/types/ai.types.ts:
- export type ContentType = 'ad' | 'caption' | 'email'
- export interface GenerateContentInput {
    campaignId: string
    type: ContentType
    prompt: string          // user's brief/topic
    tone?: string           // e.g. 'professional', 'playful', 'urgent'
    keywords?: string[]
    length?: 'short' | 'medium' | 'long'
  }
- export interface GenerationResult {
    content: string
    tokensUsed: number
    model: string
  }

Create src/services/ai/prompts/ad.prompt.ts, caption.prompt.ts, email.prompt.ts:
- Each exports a function buildXPrompt(input: GenerateContentInput, campaignContext: { name: string; description: string | null }): { system: string; user: string }
- System prompts should be specific to the content type:
  - ad.prompt.ts: instruct the model to write concise, conversion-focused ad copy with a clear CTA, respecting the requested tone and length
  - caption.prompt.ts: instruct the model to write social-media captions, considering hashtag suggestions as a separate section, matching tone
  - email.prompt.ts: instruct the model to write a marketing email with subject line + body, clearly separated
- User prompt should incorporate: campaign name/description as context, the user's prompt/brief, tone, keywords (if provided), and length guidance mapped to word counts (short: ~50 words, medium: ~150 words, long: ~300 words)

Create src/services/ai/prompts/index.ts:
- Export a map: PROMPT_BUILDERS: Record<ContentType, typeof buildAdPrompt>
- Export getPromptBuilder(type: ContentType) that returns the right builder or throws for invalid types

Create src/services/ai/ai.service.ts:
- export async function generateContent(input, campaignContext): Promise<GenerationResult>
  - Non-streaming variant, used for regenerate-and-save-only flows or testing
  - Calls anthropic.messages.create with the built system/user prompt, max_tokens from config
  - Returns { content, tokensUsed: response.usage.input_tokens + response.usage.output_tokens, model: AI_MODEL }
  - Wrap the call in try/catch; on API error, throw a custom AiGenerationError (define in ai.types.ts) with a safe message — never leak raw SDK error internals to the client

- export async function* streamGenerateContent(input, campaignContext): AsyncGenerator<string, GenerationResult>
  - Streaming variant using anthropic.messages.stream(...)
  - Yields text deltas as they arrive (for SSE relay)
  - On stream 'text' events, yield the delta string
  - Accumulate full content and token usage; return the final GenerationResult when the stream ends (via the generator's return value, captured by the caller)
  - Handle stream errors by throwing AiGenerationError; the controller layer will translate this into an SSE 'error' event

Constraints:
- No Express or HTTP concerns in this layer — pure functions/generators only, so it stays unit-testable.
- No console.log; use the existing logger (src/config/logger) for error-level logs only.
```

---

## Phase 3 — Backend: Routes, Controller, Streaming Endpoint

**Goal:** Wire the service layer into REST + SSE endpoints under the existing `/api/v1/campaigns/:campaignId` namespace, following your existing Post controller conventions.

**File targets:**
- `src/controllers/aiOutput.controller.ts`
- `src/routes/aiOutput.routes.ts`
- `src/middleware/validators/aiOutput.validator.ts`
- `src/routes/index.ts` (register the new router)

**Agent prompt:**

```
Create src/middleware/validators/aiOutput.validator.ts with Zod schemas:
- generateContentSchema: validates { type: enum(['ad','caption','email']), prompt: string().min(3).max(2000), tone: string().optional(), keywords: array(string()).max(10).optional(), length: enum(['short','medium','long']).optional() }
- Follow the same validation middleware pattern used in post.validator.ts (adjust import path if named differently — check existing post validator file for the exact middleware wrapper convention before writing this).

Create src/routes/aiOutput.routes.ts (mergeParams: true, matching post.routes.ts pattern):
  POST   /:campaignId/ai-outputs/generate        -> controller.generateStream   (SSE, heavier rate limit)
  GET    /:campaignId/ai-outputs                 -> controller.list
  GET    /:campaignId/ai-outputs/:id             -> controller.getOne
  DELETE /:campaignId/ai-outputs/:id             -> controller.remove
  POST   /:campaignId/ai-outputs/:id/regenerate  -> controller.regenerateStream (SSE, same shape as generate)

Create a dedicated rate limiter in this routes file (or a shared middleware/rateLimiters.ts if one doesn't exist yet):
  const aiGenerationLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1 minute
    max: 5,                    // 5 generations per minute per IP — adjust after real usage data
    message: { success: false, message: 'Too many generation requests, please slow down.' },
  })
Apply it only to the generate and regenerate routes.

Create src/controllers/aiOutput.controller.ts:

generateStream(req, res):
  1. Validate campaignId belongs to req.user (reuse the existing campaign-ownership check pattern from campaign/post controllers — do not duplicate logic, extract to a shared helper if not already shared)
  2. Fetch campaign { name, description } for prompt context
  3. Set SSE headers:
       res.setHeader('Content-Type', 'text/event-stream')
       res.setHeader('Cache-Control', 'no-cache')
       res.setHeader('Connection', 'keep-alive')
       res.flushHeaders()
  4. Call streamGenerateContent(input, campaignContext)
  5. For each yielded chunk, write: res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
  6. On completion, persist the AiOutput row (status: 'completed', content, tokensUsed, model, title derived from first ~8 words of content or the prompt), then write:
       res.write(`data: ${JSON.stringify({ type: 'done', output: savedRecord })}\n\n`)
     then res.end()
  7. On error, write: res.write(`data: ${JSON.stringify({ type: 'error', message: 'Generation failed, please try again.' })}\n\n`); res.end()
  8. Listen for req.on('close', ...) to abort generation early if the client disconnects (store an AbortController and pass its signal through to the Anthropic SDK call if the SDK version supports it; otherwise just stop writing and skip the save).

regenerateStream(req, res):
  - Same as generateStream but loads the existing AiOutput's prompt/type/tone as defaults (allow override via body), and updates the existing row instead of creating a new one.

list(req, res): standard paginated list, ordered by createdAt desc, scoped to campaignId + ownership check.
getOne(req, res): fetch by id + campaignId, 404 if not found or not owned.
remove(req, res): delete by id + campaignId, ownership check, 204 on success.

All non-streaming handlers follow the same success/error response shape as post.controller.ts ({ success, data, message }).

Register the router in src/routes/index.ts:
  router.use('/campaigns', aiOutputRoutes)
(mirrors how postRoutes is already mounted under /campaigns with mergeParams)
```

---

## Phase 4 — Frontend: Static Generator UI

**Goal:** A generator panel (modal or dedicated route) with type selector, brief input, tone/length controls, and a streaming output pane — no data wiring yet, matching how the Kanban board started as static UI with local state.

**File targets:**
- `app/dashboard/campaigns/[campaignId]/generate/page.tsx`
- `components/ai-generator/generator-form.tsx`
- `components/ai-generator/generator-output.tsx`
- `components/ai-generator/type-tabs.tsx`
- `stores/ai-generator.store.ts` (Zustand, local-only for now)

**Agent prompt:**

```
Build a static AI Content Generator UI at app/dashboard/campaigns/[campaignId]/generate/page.tsx.

Layout: two-column on desktop, stacked on mobile.
  Left column: generator-form.tsx
    - type-tabs.tsx: shadcn Tabs for 'Ad' | 'Caption' | 'Email' (Lucide icons: Megaphone, MessageSquare, Mail)
    - Textarea for the brief/prompt (label: "What should this be about?")
    - Select for tone: Professional, Playful, Urgent, Friendly, Bold
    - Select for length: Short, Medium, Long
    - Optional keywords input (comma-separated, converted to string[] on submit)
    - Generate button (disabled while isGenerating, shows a spinner via Lucide's Loader2)

  Right column: generator-output.tsx
    - Empty state: illustration/placeholder text "Your generated content will appear here"
    - Streaming state: shows accumulating text with a blinking cursor at the end
    - Completed state: content in a card, with action buttons: Copy, Save, Regenerate, Discard
    - Error state: inline error message with a Retry button

Create stores/ai-generator.store.ts (Zustand) with local-only state for now:
  { activeType, prompt, tone, length, keywords, isGenerating, streamedContent, error, savedOutputs: [] }
  and actions: setField, startGeneration, appendChunk, completeGeneration, setError, reset
  (No API calls yet — this phase is pure UI + local state, same as the original Kanban board build.)

Use shadcn/ui components throughout (Tabs, Textarea, Select, Button, Card) and Tailwind for layout. Keep the visual language consistent with the existing dashboard/board pages (check the board page's spacing/typography conventions before writing this).
```

---

## Phase 5 — Frontend: Server Actions + SSE Wiring

**Goal:** Connect the static UI to the real API — CRUD via server actions (consistent with `post.actions.ts`), streaming via direct client-side `fetch`.

**File targets:**
- `actions/ai-output.actions.ts` (server actions — list/get/delete only)
- `lib/ai-stream-client.ts` (client-side streaming helper — NOT a server action)
- Update `components/ai-generator/generator-form.tsx` to trigger real generation
- Update `components/ai-generator/generator-output.tsx` to render live stream state

**Agent prompt:**

```
Create actions/ai-output.actions.ts using the same typed Axios instance pattern as post.actions.ts:
  - listAiOutputs(campaignId): GET /campaigns/:campaignId/ai-outputs
  - getAiOutput(campaignId, id): GET .../ai-outputs/:id
  - deleteAiOutput(campaignId, id): DELETE .../ai-outputs/:id
  Each returns a typed { success, data?, message } shape and handles errors the same way post.actions.ts does (check that file's catch-block pattern and mirror it exactly).

Create lib/ai-stream-client.ts — this is a plain client-side function, NOT a server action, because Server Actions cannot stream partial responses back to the browser:

  export async function streamGeneration(
    campaignId: string,
    payload: GenerateContentInput,
    handlers: {
      onChunk: (text: string) => void
      onDone: (output: AiOutput) => void
      onError: (message: string) => void
    },
    signal?: AbortSignal
  ): Promise<void>

  Implementation:
  - fetch(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${campaignId}/ai-outputs/generate`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal
    })
  - Read response.body as a ReadableStream, decode with TextDecoder, split on '\n\n' to parse individual `data: {...}` SSE frames
  - Parse each frame's JSON and dispatch to onChunk / onDone / onError based on its `type` field
  - Wrap the whole thing in try/catch; on AbortError, silently return (this is an intentional cancel, not a failure)

Update generator-form.tsx's submit handler:
  - Build an AbortController, store it in the Zustand store so a "Cancel" button (add one next to Generate) can call .abort()
  - Call streamGeneration(...) with handlers wired to the store's appendChunk / completeGeneration / setError actions

Update generator-output.tsx to read streamedContent / isGenerating / error directly from the Zustand store (already wired in Phase 4, now receiving real data).

Add NEXT_PUBLIC_API_URL to .env.local if not already present, pointing at the Express backend base URL (e.g. http://localhost:5000/api/v1).
```

---

## Phase 6 — Frontend: Save, History & Reuse

**Goal:** Persist generated content the user wants to keep, list past outputs per campaign, and let them reuse output text inside a Post (title/description).

**File targets:**
- `components/ai-generator/output-history.tsx`
- Update `stores/ai-generator.store.ts` to sync with server data post-generation
- Update the Post creation/edit form (wherever it lives from the Kanban build) to accept a "generated content" prefill

**Agent prompt:**

```
Note: content is already persisted server-side automatically when a generation stream completes (Phase 3's 'done' event includes the saved record) — so "Save" in the UI really means "keep it visible / mark as used," not a separate write. Confirm this and simplify generator-output.tsx's Save button accordingly (it can just be a no-op success toast, or removed entirely in favor of auto-save framing — your call, but don't build a redundant save endpoint).

Build output-history.tsx:
  - Fetches via listAiOutputs(campaignId) on mount (use the server action from Phase 5)
  - Renders a list/grid of past generations grouped by type, each showing: title/preview, createdAt (relative, via date-fns), type badge, tone badge
  - Actions per item: Copy, Delete (calls deleteAiOutput, optimistic removal from list), "Use in Post" (see below)
  - Empty state and loading skeleton (match the loading pattern used elsewhere in the dashboard)

Wire "Use in Post":
  - Locate the existing Post create/edit form/modal from the Kanban board build
  - Add a way to prefill its description field from a given AiOutput's content (e.g. pass initialDescription prop, or a query param if it's a route-based form)
  - Do not change the Post form's existing validation or submit logic — this is additive prefill only

Add the /generate route as a nav link from the campaign board page (small "Generate Content" button in the board header, matching existing header button styling).
```

---

## Production Checklist

Before shipping this feature, verify:

- [ ] `ANTHROPIC_API_KEY` is server-side only — never sent to or readable by the client bundle
- [ ] Generation route has its own stricter rate limiter, separate from the general `/api` limiter
- [ ] SSE connections are cleaned up on client disconnect (no orphaned streams burning tokens)
- [ ] Failed generations don't silently save empty/partial content — only persist on the `done` event
- [ ] Prompt inputs are length-capped (Zod `.max()`) to prevent runaway token costs
- [ ] Errors returned to the client never include raw SDK/stack trace details
- [ ] `AbortController` on the client actually cancels the in-flight fetch (test by clicking Cancel mid-stream)
- [ ] Campaign-ownership checks are enforced on every AI-output route, not just generate
- [ ] Logging captures generation failures (model, type, campaignId, error) for debugging without logging full prompt content (privacy)
- [ ] Token usage (`tokensUsed`) is actually being stored — useful later for a usage dashboard or cost alerts
- [ ] Manual test: generate → cancel mid-stream → generate again on the same campaign → regenerate → delete

---

## Suggested Build Order

1. Phase 1 (schema) → migrate
2. Phase 2 (service layer) → test with a small standalone script before wiring to Express
3. Phase 3 (routes/controller) → test the SSE endpoint with `curl -N` before touching the frontend
4. Phase 4 (static UI) → visually verify all states (empty/streaming/done/error) with fake local data
5. Phase 5 (real streaming wiring) → the riskiest phase, test thoroughly with slow network throttling
6. Phase 6 (history + reuse) → ties it back into the existing Kanban board
