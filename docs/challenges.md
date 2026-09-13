# Production Performance Challenges & Resolutions

**Author:** Smart Content Manager
**Date:** September 8, 2026
**Type:** Post-Deployment Engineering Notes

---

## Challenge 1: Slow Login Due to Render Cold Starts

The backend API on Render's free tier sleeps after ~15 minutes of inactivity, so the first login after idle time could take 30–60+ seconds while the service boots and reconnects to the database. Neon's serverless Postgres compute also auto-suspends after ~5 minutes of inactivity, so a cold Render boot often also has to wait on a cold Neon wake-up, compounding the delay.

Status as of Sep 8: Partially resolved. Connection pool tuning and a DB-aware /health endpoint were built, but no external monitor was actually configured to call it — so the service kept sleeping and the cold-start delay was unchanged. Corrected below.

Resolution:

Connection pool tuning (done, Sep 8): capped max: 5 connections to stay under Neon's free-tier limit, close idle connections after 30s, and fail fast with a 10s connection timeout instead of hanging on a cold/dead connection.
DB-aware /health endpoint (done, Sep 8): runs SELECT 1 against Postgres and reports db: connected / disconnected, so a monitor can verify the full stack (API + DB), not just that the process is alive.
External keep-alive ping (done, Sep 13): added a GitHub Actions scheduled workflow (.github/workflows/keep-alive.yml) that hits /health every 10 minutes, 24/7. This keeps Render's instance from spinning down and keeps Neon's compute endpoint active, eliminating the cold-start penalty in practice rather than just in theory.
Reverted sslmode to require (done, Sep 13): the pool config had been changed to sslmode=verify-full to silence a pg deprecation warning, but verify-full requires validating the server cert against a trusted CA chain, which Node's pg driver doesn't bundle by default. This risked intermittent self-signed certificate in certificate chain errors that could look like cold-start flakiness. Reverted to sslmode=require, which Neon's own docs recommend for pooled connections.

Verification: After ~20 minutes idle (no traffic, no manual pings), login response time was re-measured and confirmed to no longer show the 30–60s spin-up delay. GitHub Actions run history and Render request logs confirm pings are landing every 10 minutes as expected.

---

## Challenge 2: Dashboard N+1 Query Explosion & Slow Sequential Pipeline

After login, the dashboard redirect triggered a flood of sequential API calls: one request for the campaign list, a redundant second `listCampaignsAction` for the same data, then a separate `listPostsAction` for **every** campaign — each a full HTTP round trip that stacked on top of the login request. On a user with 10+ campaigns, that meant 11+ requests just to render the landing page, multiplying the login latency.

**Resolution:** I eliminated the N+1 by including each campaign's latest posts directly in the campaign list API response (`includes: { posts: { take: 5 } }`), and removed the redundant duplicate campaign fetch. The dashboard now reads posts straight from the already-fetched campaign data, collapsing what was 11+ requests into a single one. The result is a lean pipeline: **one login request → one dashboard data request** — the fewest possible round trips between render and content.
