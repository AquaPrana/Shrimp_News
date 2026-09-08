# Article scheduling deployment

The active database model is Prisma `Article`. The lowercase `articles` SQL schema is legacy and is not changed. Status is derived from the existing `isPublished` flag and nullable `scheduledAt`: future schedule = Scheduled; due schedule or published flag = Published; otherwise Draft. This preserves compatibility with existing boolean publishing requests without introducing a second conflicting status column.

## Deployment order

1. Apply the additive migration before deploying the new app. For this repository's manually maintained MySQL installations, run `npm run db:migrate-article-scheduling` with the intended database's `.env.local`. It is safe to rerun. For installations with a fully baselined Prisma migration history, apply `202609080001_article_scheduling/migration.sql` through the existing migration process instead. Do not use `db push --accept-data-loss` or reset the database.
2. Build/deploy normally; `prisma generate` runs at install. Existing rows retain their content, flags, creation dates and the publication dates previously displayed.
3. Set the existing `CRON_SECRET` variable on the Vercel production project to a strong random secret. The new `/api/cron/publish-articles` endpoint accepts only an exact `Authorization: Bearer <CRON_SECRET>` header. Never put the secret in a URL or client variable.
4. `vercel.json` registers a daily reconciliation job at 00:00 UTC, compatible with Vercel Hobby and paid plans. It atomically promotes all overdue rows, preserving their scheduled publication timestamps, even with no visitors. The existing newsletter job remains unchanged. If minute-by-minute persisted flag updates are needed, use `* * * * *` on Vercel Pro, or configure a Hostinger/server cron to call the same authenticated endpoint each minute. Vercel Hobby restricts cron frequency to daily: https://vercel.com/docs/cron-jobs/usage-and-pricing .

Public availability does **not** wait for this job: every public list and individual article lookup applies the deadline on the server. Due schedules are immediately eligible on the next request even when cron is late or unavailable. Future schedules remain excluded even if an inconsistent row has `isPublished=true`. These public pages/APIs remain dynamic. Already-open pages refresh through their existing navigation/loading behavior.

Admin date/time inputs and schedule labels use Asia/Kolkata (IST, UTC+05:30), independent of browser/server timezone. Instants are stored as UTC `DATETIME(3)`. The promotion query uses `UTC_TIMESTAMP(3)` and is idempotent. Draft cancels a schedule, Publish Now clears it, and editing/rescheduling retains all editor and placement controls. No newsletter sending is enabled by this change.

## Verification

Run `npm run test:articles`, `npm run test:admin-search`, `npm run test:newsletter`, `npm run test:ticker`, `npx tsc --noEmit`, and `npm run build`. On a staging database, schedule a test draft, confirm all public lists and its direct URL hide it before the deadline, confirm visibility after the deadline with the dashboard closed, and call the protected job twice to check the second call reports zero promotions. Check cancel/reschedule/publish-now and delete the staging test article afterward.

Thumbnail containers use 16:9 with full-size centered `object-fit: cover`. This removes added image margins and letterboxing without modifying uploads. Different source ratios necessarily crop; overlays and hover transforms remain in place.
