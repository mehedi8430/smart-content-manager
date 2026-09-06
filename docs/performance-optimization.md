# Performance Optimization: Lazy Loading & Caching

**Author:** Smart Content Manager
**Date:** September 6, 2026
**Type:** Architecture Decision Record & Engineering Rationale

---

## The Problem: We Were Shipping Code Nobody Used Yet

This is a product decision as much as an engineering one. Smart Content Manager is a SaaS dashboard — marketers generate AI content, manage campaigns, and chat with an AI copilot. Every millisecond of load time is a conversion risk, and every wasted byte of JavaScript is a tax we collect from every user on every page, whether they need it or not.

When I measured our initial bundle, three problems stood out — none of them hypothetical:

1. **The chat feature was loaded on every dashboard page.** The entire AI copilot UI — the streaming client, message thread, composer, and server-sent-event handling — was bundled into the app shell. A user who never opened the chat drawer still downloaded and parsed all of it. That's a paid cost with zero benefit.

2. **A 419 KB PDF library shipped on the content-generation page** even though exporting a PDF is one optional action buried behind an "Export" button most users never click.

3. **Data fetching was architecturally inconsistent.** The campaigns list page used hand-rolled `useState` + `useEffect` refetching, while the rest of the app had invested in TanStack React Query. Two components doing the same job with different tools means cache misses, duplicate network requests, and code that's harder to reason about.

On the backend, every read request — even the sidebar's "recent campaigns" — hit PostgreSQL directly through Prisma, with no cache in front.

The gap wasn't a lack of effort. It was a lack of discipline about *what* we ship and *when* we compute.

---

## The Approach: Measure, Prioritize, Decide

Senior-level engineering is not about applying every optimization — it's about picking the ones with the highest return and being honest about the rest. My framework was simple:

- **High impact, low risk** → do it now.
- **High impact, high complexity** → design it carefully or defer it.
- **Low impact** → leave it alone. YAGNI.

That filter produced three decisions, one for each layer of the stack.

---

## Decision 1 — Client-Side Lazy Loading: Don't Ship What the User Didn't Ask For

**The decision:** defer the chat drawer and the PDF library until the user actually needs them.

### The chat drawer

The drawer is a *client-only* UI — it's closed on arrival and there's no SEO value in pre-rendering it. The right tool is a dynamic import with SSR disabled, using `next/dynamic`.

One non-obvious constraint surfaced here: **`ssr: false` is only legal inside a Client Component.** A Server Component (our dashboard layout) cannot pass that option. Rather than fight the framework, I extracted a thin `chat-drawer-lazy.tsx` client wrapper that owns the split point:

```tsx
// chat-drawer-lazy.tsx — the only piece that loads eagerly
"use client";
const ChatDrawer = dynamic(
  () => import("./chat-drawer").then((m) => m.ChatDrawer),
  { ssr: false, loading: () => null },
);
```

The dashboard shell now pays for a one-line wrapper; the full chat bundle is downloaded only on the first open. The lightweight `ChatProvider` (pure UI state) stays eager so headers and triggers keep their context without pulling in the heavy components.

### The PDF library

`jspdf` was a static import — ~419 KB of JavaScript committed to the initial bundle. A static import is exactly what the codebase did not need, because the export action is a single user gesture. The fix is a dynamic `import()` *inside the click handler*:

```ts
const { jsPDF } = await import("jspdf");
```

The library now respects the cost model that should apply to every optional feature: you pay when you use it.

---

## Decision 2 — One Source of Truth for Server State (React Query)

A codebase that fetches data two different ways isn't a style inconsistency — it's duplicated work, divergent caching behavior, and a maintenance tax. React Query was already the established pattern, so the fix was consolidation, not invention.

**The implementation:** a `useCampaigns` hook with its own key factory (`campaignKeys`), mirroring the existing AI-output and chat-session hooks. Queries cache per page/search/sort combination; every CRUD mutation invalidates the relevant list. The hand-rolled `useState`/`useEffect` machinery in the campaigns client is gone — replaced by the same declarative, cache-aware model the rest of the app uses.

Two refinements followed:

- **`refetchOnWindowFocus: false`** — this is user-scoped data, not a real-time feed. Refetching on every focus event is noise that burns network and CPU for nothing.
- **Server-side cache coherence** — the Next.js data cache is tagged (`tags: ["campaigns"]`, `force-cache`) so the backend isn't hammered on every SSR pass. The key detail: mutations call `revalidateTag("campaigns", "max")`, which in Next.js 16 means *stale-while-revalidate* — users see cached data instantly while fresh data is fetched in the background. No blocking waits, no stale reads.

---

## Decision 3 — Backend Caching, Sized to the Deployment

The backend had nothing in front of Postgres. My instinct was to reach for Redis — but that would be **over-engineering for a single-instance deployment**. Redis introduces a whole infrastructure surface (provisioning, connection management, a new failure mode) to solve a problem a process-local cache already solves.

**The decision:** a ~40-line dependency-free `TTLCache` — keys with expiry, max-size eviction, and explicit invalidation. That's it. No new dependencies, no new infrastructure.

Security and correctness shaped the design:

- **Tenant isolation by construction.** Every cache key contains the owning `userId` (`campaigns:{userId}:{query}`, `campaign:{id}:{userId}`), so one user's cached rows can never leak to another. The cache is shared infrastructure, but the keys are namespaced like data.
- **Coherent invalidation.** A cache is only as good as its invalidation discipline. Every write path (`create`, `update`, `delete`) purges the user's cached lists, and `update`/`delete` additionally purge the campaign detail key. The service layer owns both the write and the invalidation, so the coupling is explicit and impossible to bypass.

Only the hot, low-churn reads are cached: campaign lists and campaign details. High-write data (posts, AI outputs, chat messages) is deliberately not cached — the invalidation complexity would outweigh the benefit.

---

## What I Deliberately Did Not Do

An engineering story is incomplete without naming what was rejected:

- **No Redis yet.** It's documented as the upgrade path for multi-instance scaling, but introducing it today would be speculative complexity.
- **No premature N+1 endpoint.** The dashboard loads posts per campaign and hits N+1 complexity. I mitigated it with the existing data cache and tags rather than building a bespoke aggregation endpoint before product data showed it was necessary. I'd rather load real usage numbers than guess.
- **I left pre-existing lint debt untouched** (an ESLint 9 / `.eslintrc.json` incompatibility predating this work). Fixing it is valuable but out of scope for a performance pass; mixing unrelated changes into this work would have muddied the review.

This is not indecision — it's the discipline of scoping a change to a *decision,* not to a codebase's every wart.

---

## Verification: Claims Are Only as Good as Their Evidence

I don't consider an optimization done until the build artifacts say so:

- `bun run build` passes on the frontend and `bun run type-check` passes on the API.
- The generated `react-loadable-manifest.json` proves the chat drawer is its own on-demand chunk, separate from every page's eager entry.
- The `jspdf` chunk (419 KB) is confirmed **absent from all eager entry files** across every route — it exists only behind the dynamic import, waiting for the click that needs it.
- Where the app previously served a unified bundle on every dashboard visit, it now serves the shell — and pulls exactly the functionality a user actually opens.

---

## TL;DR — The Story in One Paragraph

The app was imposing a cost on all users for features used by few, and computing data it had already computed. I restructured the frontend so heavy UI ships on *interaction*, not *arrival*; consolidated all server-state management under one cache-aware model; and gave the API a small, tenant-safe, correctly-invalidated cache that matches the deployment's actual shape. Every choice was gated by one principle: **ship what's needed, compute what's stale, and let the architecture grow into Redis and N+1 endpoints when the product data — not my imagination — demands them.**