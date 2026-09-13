# Production Performance Challenges & Resolutions

**Author:** Smart Content Manager
**Date:** September 8, 2026
**Type:** Post-Deployment Engineering Notes

---

## Challenge 1: Slow Login Due to Render Cold Starts

Render's free tier sleeps after ~15 min idle, and Neon's serverless Postgres auto-suspends after ~5 min — stacked together, first login after idle took 30-60+ seconds.

**Root cause of initial fix failing (Sep 8 attempt):** Pool tuning and a DB-aware `/health` endpoint were built, but no external monitor was calling it, so the service kept sleeping regardless.

**Root cause #2 (Sep 13, first retry):** The `/health` route was added in `server.ts` _after_ `app.listen()`, but Express registers middleware in call order — the catch-all 404 handler in `app.ts` was already in place first, so every `/health` request hit that instead. Moved the route into `app.ts`, before the 404 handler.

**Root cause #3:** GitHub Actions' `schedule` trigger is best-effort and got silently deprioritized — the workflow ran fine manually but never fired on its own cron schedule.

**Resolution (Sep 13, final):**

- Fixed `/health` route ordering in `app.ts` so it actually resolves (was returning 404).
- Reverted `sslmode` from `verify-full` to `require` — avoids intermittent cert errors from CA validation Node's `pg` doesn't bundle by default.
- Replaced the GitHub Actions cron with an UptimeRobot HTTP(s) monitor pinging `/health` every 5 minutes — a purpose-built uptime service instead of a general-purpose CI scheduler.

**Verified:** UptimeRobot dashboard shows consistent 5-min pings with no gaps. After 20+ min idle with no manual traffic, login no longer shows the 30-60s delay.

**Lesson:** don't mark external-dependency fixes "done" until the external side is confirmed live and firing — not just that the endpoint it calls returns 200 manually.

---

## Challenge 2: Dashboard N+1 Query Explosion & Slow Sequential Pipeline

After login, the dashboard redirect triggered a flood of sequential API calls: one request for the campaign list, a redundant second `listCampaignsAction` for the same data, then a separate `listPostsAction` for **every** campaign — each a full HTTP round trip that stacked on top of the login request. On a user with 10+ campaigns, that meant 11+ requests just to render the landing page, multiplying the login latency.

**Resolution:** I eliminated the N+1 by including each campaign's latest posts directly in the campaign list API response (`includes: { posts: { take: 5 } }`), and removed the redundant duplicate campaign fetch. The dashboard now reads posts straight from the already-fetched campaign data, collapsing what was 11+ requests into a single one. The result is a lean pipeline: **one login request → one dashboard data request** — the fewest possible round trips between render and content.
