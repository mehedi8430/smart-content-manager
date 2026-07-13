# AI Content Generator — Implementation

Real-time, streaming AI content generation (ads, captions, emails) backed by
Anthropic Claude, with Server-Sent Events (SSE) from backend to browser and
persistence in PostgreSQL via Prisma.

## Architecture

```
┌─────────────────────────────── FRONTEND (Next.js) ───────────────────────────────┐
│                                                                                  │
│  GeneratePage (server)                                                           │
│    └── AiGeneratorProvider ("use client" context)                                │
│          ├── GeneratorForm                                                       │
│          │     └── react-hook-form + zod  ──(payload)──┐                         │
│          ├── GeneratorOutput (streaming states)        │                         │
│          │     └── streamRegeneration()                │                         │
│          └── OutputHistorySection                      │                         │
│                └── OutputHistory                       │                         │
│                      └── listAiOutputsAction / deleteAiOutputAction              │
└──────────────────────────────────────┬───────────────────────────────────────────┘
                                        │  POST /generate (SSE stream)
                                        │  GET /ai-outputs, DELETE /ai-outputs/:id
                                        ▼
┌─────────────────────────────── BACKEND (Express) ────────────────────────────────┐
│                                                                                  │
│  aiOutput.routes.ts  (protect, validate, rate-limit)                            │
│    └── aiOutput.controller.ts (generateStream / regenerateStream)               │
│          ├── verifyCampaignOwnership()   (service)                              │
│          ├── streamGenerateContent()     (ai.service.ts — async generator)      │
│          │     ├── getPromptBuilder(type).build()  → { system, user }           │
│          │     ├── anthropic.messages.stream()  (AI_MOCK_MODE → mockService)    │
│          │     └── yields text chunks; returns { content, tokensUsed, model }   │
│          └── createAiOutput() / updateAiOutput()   (Prisma → AiOutput row)      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Backend — Key Files

| Layer        | File                                              | Responsibility                                  |
|--------------|---------------------------------------------------|-------------------------------------------------|
| Route        | `src/routes/aiOutput.routes.ts`                   | Mount, auth, zod validation, AI rate limiter    |
| Controller   | `src/controllers/aiOutput.controller.ts`          | SSE headers, stream loop, DB persistence        |
| Service      | `src/services/aiOutput.service.ts`                | Ownership check + CRUD on `AiOutput`            |
| AI service   | `src/services/ai/ai.service.ts`                   | Async generator over Anthropic stream           |
| Mock service | `src/services/ai/ai.mock.service.ts`              | Word-by-word fake stream when no API key        |
| Prompts      | `src/services/ai/prompts/*`                       | `buildAd/ buildCaption/ buildEmail` builders    |
| Types        | `src/types/ai.types.ts`                           | `GenerateContentInput`, `GenerationResult`      |
| Validator    | `src/validators/aiOutput.validator.ts`            | zod schemas for generate/regenerate params      |
| Config       | `src/config/ai.config.ts`                         | Model, max tokens, `AI_MOCK_MODE`               |

## Frontend — Key Files

| Layer          | File                                                                | Responsibility                          |
|----------------|---------------------------------------------------------------------|-----------------------------------------|
| Page           | `app/dashboard/campaigns/[campaignId]/generate/page.tsx`            | Server page, wraps provider            |
| Provider       | `src/providers/ai-generator-provider.tsx`                           | Streaming state (content, error, done) |
| Form           | `generate/_components/generator-form.tsx`                           | RHF + zod, calls `streamGeneration`    |
| Output viewer  | `generate/_components/generator-output.tsx`                         | Empty / streaming / done / error states|
| SSE client     | `src/lib/ai-stream-client.ts`                                       | `fetch` + ReadableStream SSE parser    |
| Server action  | `src/actions/ai-output.actions.ts`                                  | `list` / `get` / `delete` via fetcher  |
| Types          | `src/types/ai-output.type.ts`                                       | `AiOutput`, response shapes            |

## Data Model (`AiOutput`)

```prisma
model AiOutput {
  id         String   @id @default(uuid())
  type       String   // ad | caption | email
  title      String?
  prompt     String
  tone       String?
  content    String   @db.Text
  status     String   @default("completed") // pending | completed | failed
  model      String?
  tokensUsed Int?
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  campaignId String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

`AiOutput` is nested under `Campaign` and cascade-deleted with it (same
ownership model as `Post`).

## Streaming Protocol (SSE)

The generate/regenerate endpoints do **not** return JSON. They open an
`text/event-stream` and emit one JSON object per `data:` frame, separated by
`\n\n`:

```text
data: {"type":"chunk","content":"Hello"}
data: {"type":"chunk","content":" world"}
data: {"type":"done","output":{ ...AiOutput row... }}
```

Event types:

- `chunk` — a text delta; appended to the on-screen buffer.
- `done`  — final persisted `AiOutput` (includes `id`, `tokensUsed`, `model`).
- `error` — `{ message }`; stream ends.

## Generation Flow

### 1. Route → Controller (auth + validation)

```typescript
// aiOutput.routes.ts
router.post(
  "/:campaignId/ai-outputs/generate",
  aiGenerationLimiter,                              // 5 / min / IP
  validate({ params: campaignIdParamSchema, body: generateContentSchema }),
  generateStream,
);
```

### 2. Controller opens SSE and drives the async generator

```typescript
// aiOutput.controller.ts
res.setHeader("Content-Type", "text/event-stream");
res.flushHeaders();

const generator = streamGenerateContent(data, campaignContext);

for await (const chunk of generator) {
  fullContent += chunk;
  res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`);
}

const final = await generator.next();           // captures return value
const { content, tokensUsed, model } = final.value;

const saved = await createAiOutput(campaignId, userId, { /* ... */ });
res.write(`data: ${JSON.stringify({ type: "done", output: saved })}\n\n`);
res.end();
```

> The streaming consumer loop `for await` drains **yielded chunks**; calling
> `generator.next()` once more retrieves the **returned `GenerationResult`**
> (full content + token usage). A `req.on("close")` guard aborts generation if
> the browser disconnects.

### 3. AI service (async generator over Anthropic)

```typescript
// ai.service.ts
export async function* streamGenerateContent(input, ctx) {
  if (AI_MOCK_MODE) return yield* mockStreamGenerateContent(input);

  const { system, user } = getPromptBuilder(input.type)(input, ctx);
  const stream = await anthropic.messages.stream({ model, max_tokens, system, messages });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;                  // → SSE chunk
    }
  }
  return { content: fullContent, tokensUsed, model };  // → final frame
}
```

### 4. Frontend — SSE client parses the byte stream

```typescript
// ai-stream-client.ts
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });

  const frames = buffer.split("\n\n");
  buffer = frames.pop() || "";                 // keep incomplete frame

  for (const frame of frames) {
    const data = JSON.parse(frame.match(/^data:\s*(.+)$/)[1]);
    if (data.type === "chunk") handlers.onChunk(data.content);
    if (data.type === "done")   return handlers.onDone(data.output);
    if (data.type === "error")  return handlers.onError(data.message);
  }
}
```

### 5. Frontend — Provider + form wire it together

```typescript
// generator-form.tsx
const handleGenerate = (values: FormValues) => {
  startGeneration();
  streamGeneration(
    campaignId,
    { type, prompt, tone, keywords, length },
    {
      onChunk: (t) => appendChunk(t),          // → state.streamedContent
      onDone:  (o) => completeGeneration(o),   // → state.completedOutput
      onError: (m) => setError(m),
    },
    abortController.signal,
  );
};
```

`GeneratorOutput` renders four states from the same provider state:
**empty → streaming (pulsing caret) → done (copy / regenerate / discard) → error**.

## Regeneration Flow

`POST /:campaignId/ai-outputs/:id/regenerate` reuses `regenerateStream`:

1. Load existing `AiOutput` (`getAiOutput`).
2. Merge request body over stored values (body fields optional).
3. Stream again with `streamGeneration(..., signal)`; on `done`, call
   `updateAiOutput(id, ...)` (same `id`, new content).
4. `GeneratorOutput.handleRegenerate` calls `streamRegeneration` with an empty
   payload so the original parameters are reused.

## History & Board Integration

- `OutputHistorySection` → `listAiOutputsAction` (server action → `fetcher` →
  `GET /ai-outputs`) loads saved outputs grouped by type.
- Delete uses **optimistic removal** then reverts via re-fetch on failure
  (`deleteAiOutputAction` → `DELETE /ai-outputs/:id`).
- **Use in Post**: `OutputHistory.handleUseInPost(content)` pushes the user to
  `/board?content=...`; `KanbanBoard` reads `initialContent` and opens the post
  sheet pre-filled (`handleAddPostWithDescription("todo", content)`) — the bridge
  between the AI generator and the drag-and-drop board.

## Key Design Decisions

- **SSE over WebSocket/JSON**: one-directional token streaming maps cleanly to
  `text/event-stream`; no extra infra, works through the existing Express app and
  `fetch` (no EventSource needed because we POST a body).
- **Async generator as the boundary**: `streamGenerateContent` yields chunks but
  *returns* usage metadata — keeps the streaming loop and the final DB write in
  one place.
- **Mock mode by default**: when `ANTHROPIC_API_KEY` is absent,
  `AI_MOCK_MODE` streams canned responses word-by-word so the whole flow works
  locally without credentials.
- **Prompt builders per type**: `ad` / `caption` / `email` each own a
  `build()` returning `{ system, user }`, selected via `getPromptBuilder(type)`.
- **Ownership-first**: every service fn calls `verifyCampaignOwnership` before
  touching `AiOutput` (no per-row ownership column — enforced by campaign).
- **Generator context over props**: a single `AiGeneratorProvider` holds
  streaming state so form, output, and history stay in sync without prop drilling.
- **Optimistic UI**: delete (and generation display) update local state first,
  reverting on API failure — same philosophy as the drag-and-drop board.

## Common Gotchas

1. **Forgetting `generator.next()` after the loop** — you lose `tokensUsed` /
   `model`; chunks come from `yield`, metadata comes from `return`.
2. **SSE buffer framing** — always `split("\n\n")` and keep the trailing
   incomplete frame in `buffer`; a partial JSON line will throw on `JSON.parse`.
3. **No `Content-Type: application/json`** — generate/regenerate are SSE; only
   `list` / `get` / `delete` return JSON via `fetcher`.
4. **Missing `credentials: "include"`** — the request needs the auth cookie or
   `protect` returns 401; the SSE client sets it explicitly.
5. **Disconnect not handled** — without `req.on("close")` the generator keeps
   running (and billing tokens) after the tab closes.
6. **Type casing mismatch** — UI uses `"Ad" | "Caption" | "Email"` while the API
   expects `"ad" | "caption" | "email"`; `generator-form.tsx` maps them.
7. **Not reverting optimistic deletes** — on failure, re-fetch history or state
   drifts from the server.
