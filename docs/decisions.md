# Technical Decisions and Changelog

## May 21, 2026

### Project Initialization

Selected the following stack:

- Next.js (Frontend)
- Node.js + Express (Backend)
- PostgreSQL
- Prisma
- JWT Authentication
- OpenAI

**Target launch:** 10–12 weeks.

---

## May 21, 2026

### Authentication Strategy

Chose **Express + JWT** over Clerk and Supabase Auth.

**Reason**

- Implement bcrypt password hashing.
- Implement JWT-based authentication.
- Use short-lived access tokens and refresh token rotation.
- Store refresh tokens securely in HTTP-only cookies.
- Gain full control over the authentication flow and session management.

---

## May 21, 2026

### Database Selection

Chose **PostgreSQL** over MongoDB.

**Reason**

- Relational data model.
- Better fit for users → campaigns → posts → outputs.
- Hosted on Neon.

---

## June 9, 2026

### Monorepo Migration

Migrated from separate frontend and backend repositories to a monorepo using **pnpm workspaces** and **Turborepo**.

**Reason**

- Unified dependency management.
- Easier CI/CD.
- Future shared packages.
- Simplified development workflow.

---

## June 11, 2026

### Validation Strategy

Chose **Zod** over express-validator.

**Reason**

- Strong TypeScript integration and type inference.
- Reusable schemas across the application.
- Ability to share validation logic with the frontend in the future.
- Cleaner and more maintainable validation code.
- Better support for complex and nested data structures.
- Framework-agnostic approach, not tied to Express.

---

## July 13, 2026

### Server State Management

Introduced **TanStack React Query** for server state management across the frontend.

**Reason**

- Centralized server state management for API data.
- Automatic caching and background refetching.
- Built-in loading, error, and stale state handling.
- Optimistic updates for a more responsive user experience.
- Query invalidation after mutations instead of manual refetch logic.
- Request deduplication and cancellation to prevent duplicate network requests.
- Cleaner separation of server state from UI state through reusable custom hooks.
- Improved scalability and maintainability for data-intensive dashboard features.

---

_New decisions will be documented here as the project evolves._
