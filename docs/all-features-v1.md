# Smart Content Manager — v1 feature inventory

This document describes the implemented v1 product scope. See the [project brief](./project-brief.md) for product goals and roadmap, and the [root README](../README.md) for setup and release preparation.

## User-facing features

### Authentication

- Email/password registration, login, logout, and current-user endpoints
- Protected dashboard routes and JWT access/refresh sessions delivered in `httpOnly` cookies

### Campaigns and content board

- Create, view, edit, and delete campaigns
- Search, sort, and paginate campaign lists
- A per-campaign kanban board with `todo`, `in_progress`, and `done` columns
- Create and edit posts with title, description, status, and optional due date
- Drag-and-drop ordering and status changes, with optimistic client updates and bulk API synchronization

### AI content studio

- Generate ads, social captions, and emails with campaign context
- Configure tone, length, and optional keywords
- Stream generation output to the browser; cancel in-progress requests
- Save completed outputs with generation metadata, browse history, regenerate, copy, export to PDF, move content to a board post, or delete

Live AI generation requires an Anthropic API key. The API also provides mock mode for local development and automated tests.

### Marketing copilot

- General chat and campaign-scoped chat
- Campaign-scoped context includes campaign tasks and recent generated outputs
- Stream responses, view session history, rename/delete sessions, and retry failed requests

### Dashboard and public pages

- Dashboard KPIs and recent activity
- Responsive navigation, campaign search, theme selection, and dismissible onboarding hints
- Public landing, privacy, and terms pages

## Architecture and operations

| Component | Implementation |
| --- | --- |
| Web | Next.js 16 App Router, React 19, Tailwind CSS 4 |
| API | Express 5 + TypeScript REST API under `/api/v1` |
| Data | PostgreSQL through Prisma; models include User, Campaign, Post, AiOutput, ChatSession, and ChatMessage |
| AI | Anthropic SDK; SSE streaming for generation and chat |
| Workspace | Bun workspaces and Turborepo |
| Local containers | Docker Compose with a local PostgreSQL service and an automatic migration service |

API responses use a consistent `{ success, message?, data? }` envelope. The `/health` endpoint checks database connectivity. API startup in production applies committed Prisma migrations before starting the server.

## Release and test status

- The Playwright E2E workflow runs for pull requests and pushes to `main`.
- The Docker delivery workflow builds and publishes web/API images on pushes to `main`; it does not deploy those images.
- The current E2E specs cover login, signup, campaigns, dashboard, and kanban. They do not cover post CRUD/date clearing, drag-and-drop persistence, AI generation/regeneration, chat streaming, PDF export, or failed mutations. API/web unit and integration coverage is also limited; add regression tests before treating these flows as release-gated.
- The source review found unresolved correctness issues to fix before v1: AI outputs save empty/zero model-usage metadata; clearing a post due date does not clear it on the server; campaign list/dashboard summaries can remain stale after post or output writes; and post-form save errors can be silent.
- The repository does not contain the previously documented keep-alive workflow. Configure external uptime monitoring and alerting in the hosting/monitoring provider if required.

## Not included in v1

Subscriptions, team collaboration, analytics, and third-party integrations are planned follow-up work, not current v1 functionality.
