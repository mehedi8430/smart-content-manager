# Engineering challenges

### Keeping the first login responsive

After idle periods, users sometimes waited 30–60 seconds for their first login as the hosted API and database woke up. A health endpoint alone did not solve it: first, its route was registered after the 404 handler; later, the scheduled GitHub Actions ping did not reliably run. We moved the database-aware endpoint before the 404 handler and switched to an external five-minute uptime monitor. At the time, its dashboard showed regular pings and login stayed responsive after more than 20 minutes idle. That verification is historical; the external monitor must be checked to confirm it is still active.

**Lesson:** Verify the whole dependency chain, not just that the endpoint works when called manually.

### Removing the dashboard’s per-campaign requests

The dashboard originally fetched posts separately for every campaign, so loading more campaigns meant more network requests. We added up to five posts per campaign to the campaign-list response and used those results on the dashboard, removing the per-campaign request pattern. The sidebar still makes a separate campaign-list request, and the dashboard’s post KPIs can undercount campaigns with more than five posts. Those metrics still need a complete data source and regression tests.
