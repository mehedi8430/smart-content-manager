# Technical Decisions and Changelog

## May 21, 2026

### Project Initialization

Selected the following stack:

* Next.js (Frontend)
* Node.js + Express (Backend)
* PostgreSQL
* Prisma
* JWT Authentication
* OpenAI

**Target launch:** 10–12 weeks.

---

## May 21, 2026

### Authentication Strategy

Chose **Express + JWT** over Clerk and Supabase Auth.

**Reason**

* Learn authentication fundamentals.
* Implement bcrypt password hashing.
* Implement refresh token rotation.

---

## May 21, 2026

### Database Selection

Chose **PostgreSQL** over MongoDB.

**Reason**

* Relational data model.
* Better fit for users → campaigns → posts → outputs.
* Hosted on Neon.

---

## June 9, 2026

### Monorepo Migration

Migrated from separate frontend and backend repositories to a monorepo using **pnpm workspaces** and **Turborepo**.

**Reason**

* Unified dependency management.
* Easier CI/CD.
* Future shared packages.
* Simplified development workflow.

---

*New decisions will be documented here as the project evolves.*
