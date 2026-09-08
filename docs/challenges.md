# Production Performance Challenges & Resolutions

**Author:** Smart Content Manager
**Date:** September 8, 2026
**Type:** Post-Deployment Engineering Notes

---

## Challenge 1: Slow Login Due to Render Cold Starts

The backend API on Render's free tier sleeps after inactivity, so the first login after idle time could take 30-60 seconds while the service boots and reconnects to the database. This is a poor first impression for any production app.

**Resolution:** I tuned the database connection pool to fail fast and stay efficient — capping max connections (prevents exhausting Neon's free-tier limit), closing idle connections after 30s, and adding a 10s connection timeout so the app never hangs on a dead connection. I also upgraded the `/health` endpoint to ping the database with a `SELECT 1` query, so an external uptime monitor (cron-job.org, UptimeRobot, or Render's own cron) can hit it every 10 minutes and keep the service warm — eliminating the cold-start penalty entirely.

---

## Challenge 2: Dashboard N+1 Query Explosion & Slow Sequential Pipeline

After login, the dashboard redirect triggered a flood of sequential API calls: one request for the campaign list, a redundant second `listCampaignsAction` for the same data, then a separate `listPostsAction` for **every** campaign — each a full HTTP round trip that stacked on top of the login request. On a user with 10+ campaigns, that meant 11+ requests just to render the landing page, multiplying the login latency.

**Resolution:** I eliminated the N+1 by including each campaign's latest posts directly in the campaign list API response (`includes: { posts: { take: 5 } }`), and removed the redundant duplicate campaign fetch. The dashboard now reads posts straight from the already-fetched campaign data, collapsing what was 11+ requests into a single one. The result is a lean pipeline: **one login request → one dashboard data request** — the fewest possible round trips between render and content.