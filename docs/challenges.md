# Production Performance Challenges & Resolutions

**Author:** Smart Content Manager
**Date:** September 8, 2026
**Type:** Post-Deployment Engineering Notes

---

## Challenge 1: Slow Login Due to Render Cold Starts

Render's free tier sleeps after ~15 min idle, and Neon's serverless Postgres auto-suspends after ~5 min — stacked together, first login after idle took 30-60+ seconds.

**Root cause of initial fix failing:** Sep 8 changes (pool tuning, DB-aware `/health` endpoint) only built the *capability* to stay warm — no external monitor was actually calling it, so the service kept sleeping regardless.

**Resolution (Sep 13):**
- Added a GitHub Actions cron (`.github/workflows/keep-alive.yml`) pinging `/health` every 10 min, keeping both Render and Neon warm.
- Reverted `sslmode` from `verify-full` to `require` — the stricter mode needs CA validation Node's `pg` doesn't bundle by default, risking intermittent cert errors that could masquerade as cold-start issues.

**Verified:** After 20+ min idle with no manual traffic, login no longer shows the 30-60s delay. Confirmed via GitHub Actions run history and Render request logs.

**Lesson:** don't mark external-dependency fixes "done" until the external side is confirmed live, not just the endpoint it calls.

---

## Challenge 2: Dashboard N+1 Query Explosion & Slow Sequential Pipeline

After login, the dashboard redirect triggered a flood of sequential API calls: one request for the campaign list, a redundant second `listCampaignsAction` for the same data, then a separate `listPostsAction` for **every** campaign — each a full HTTP round trip that stacked on top of the login request. On a user with 10+ campaigns, that meant 11+ requests just to render the landing page, multiplying the login latency.

**Resolution:** I eliminated the N+1 by including each campaign's latest posts directly in the campaign list API response (`includes: { posts: { take: 5 } }`), and removed the redundant duplicate campaign fetch. The dashboard now reads posts straight from the already-fetched campaign data, collapsing what was 11+ requests into a single one. The result is a lean pipeline: **one login request → one dashboard data request** — the fewest possible round trips between render and content.
