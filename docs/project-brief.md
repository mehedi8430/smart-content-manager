# Project Brief

## Overview

Smart Content Manager is a full-stack SaaS application that unifies **AI-powered content generation** and **campaign planning** in a single dashboard. It helps small businesses, solo marketers, and freelancers go from brief to publishable content faster by combining a kanban workflow with an Anthropic Claude–backed content studio and a campaign-aware marketing copilot.

## Problem Statement

Small businesses and solo marketers struggle with content creation and campaign organization. Existing tools are either too expensive, overly complex, or lack structured workflow management. This project delivers a lightweight, single-dashboard platform that combines AI content generation, task planning, and campaign management without the enterprise overhead.

## Target Users

- **Freelance marketers** managing multiple client campaigns
- **Small business owners** handling their own marketing
- **Startup teams** without dedicated marketing tooling
- **Developers** looking for a production-ready, real-world SaaS reference architecture

---

## Core Features

### 1. Secure Authentication & User Sessions

- Email/password registration, login, logout, and "get me" endpoints
- bcrypt password hashing with JWT **access + refresh token** flow
- Tokens delivered as `httpOnly` cookies; refresh tokens persisted in the database, rotated on refresh, and revoked on logout
- Route protection on the API (`protect` middleware) and the frontend (proxy redirects) keep `/dashboard` private while logged-in users are redirected away from login/signup

### 2. Campaign Management

- Full CRUD for campaigns with owner-scoped access (ownership checks return 404 to avoid leaking resource existence)
- Searchable (case-insensitive), sortable (`name`/`createdAt`), and paginated listing with an `all` mode
- Per-user in-memory TTL cache with explicit invalidation on writes for fast, read-heavy dashboards
- Post/output counts and recent posts included in list responses to eliminate N+1 queries
- UI: data table with create/edit modals and delete confirmation

### 3. Kanban Content Board

- Three-stage pipeline — `todo` / `in_progress` / `done` — with cards ordered by an explicit position field
- Full drag-and-drop reordering and cross-column moves (dnd-kit) with **optimistic updates** synced via a single bulk-update transaction
- Create/edit posts (title, description, status, due date) in a side sheet; delete with confirmation
- Column filtering, title search, keyboard/touch accessibility, loading skeletons, and a drag overlay ghost card

### 4. AI Content Generator (Claude, streamed)

- Generate **ads, social captions, and emails**, each with a tailored prompt builder (CTAs, subject lines, hashtags, platform best practices)
- Control **tone** (Professional, Playful, Urgent, Friendly, Bold), **length** (Short/Medium/Long), and optional **keywords**; campaign name + description are injected as context
- **Real-time SSE streaming** — content renders token-by-token with cancel support and disconnect-safe handling
- Results auto-titled, persisted with model + token usage, and available in history
- **Regenerate** an existing output with the same (or overridden) parameters
- **Output history**: grouped by type, with actions to copy, export as **PDF** (lazy-loaded jsPDF, multi-page, metadata header), push into a board post ("Use in Post"), or delete optimistically

### 5. AI Marketing Copilot (Chat)

- Chat drawer with session list ordered most-recent-first, auto-derived titles, manual rename, and delete
- **General chat** (generic marketing copilot) and **campaign-scoped chat** that injects the campaign's current tasks and recent generated content directly into the AI's context
- **SSE streaming** replies; user messages persisted before streaming and assistant replies committed in a transaction after completion, so nothing is lost on disconnects
- Optimistic message rendering, retry on failure, and per-session message history

### 6. Dashboard & UX Polish

- KPI cards — active campaigns, content pieces, AI outputs, completion rate — plus a recent-activity feed
- Collapsible sidebar, dynamic breadcrumbs, global campaign search, and light/dark/system theme toggle
- Dismissable onboarding hints, responsive/mobile layouts, and toast notifications
- Public marketing site (hero, features, pricing, screenshot gallery) plus privacy and terms pages

---

## Technical Highlights

- **Monorepo**: Turborepo + Bun workspaces (`apps/web`, `apps/api`)
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind 4, shadcn/ui, React Query, react-hook-form + zod, dnd-kit
- **Backend**: Express 5 + TypeScript, REST API under `/api/v1`
- **Database**: PostgreSQL via Prisma 7, schema: User, Campaign, Post, AiOutput, ChatSession, ChatMessage
- **AI**: Anthropic Claude SDK with SSE streaming and a mock mode for development without an API key
- **Hardening**: helmet, CORS, request validation (zod), global + AI-specific rate limiting, compression, winston rotating logs, centralized error handling, and a DB-pinging `/health` endpoint
- **Production**: API deployed on Render (auto-migrates on startup); frontend connects via `NEXT_PUBLIC_API_BASE_URL`

## Milestones

| Phase | Scope | Status |
| --- | --- | --- |
| 1 — Foundation | Auth, user management, campaign CRUD | ✅ Done |
| 2 — AI Content | AI generation, output/history management | ✅ Done |
| 3 — Productivity | Marketing copilot chat, kanban board, PDF export, UX polish | ✅ Done |
| 4 — Growth | Subscriptions, team collaboration, analytics, integrations | 🚧 Planned |

## Success Criteria

- Users can create and manage campaigns entirely from one dashboard.
- AI-generated content meaningfully reduces manual marketing effort.
- The codebase demonstrates production-ready architecture, security, and performance best practices.
- The project stands as a portfolio-quality full-stack SaaS application.
- The architecture scales to support future features and integrations.