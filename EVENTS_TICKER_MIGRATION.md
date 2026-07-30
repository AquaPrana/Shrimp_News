# Events and flexible ticker migration

Run these commands in order against each target database:

```powershell
npm run db:backup-events-ticker
npx prisma migrate status
npx prisma migrate deploy
npm run db:import-events
npm run db:migrate-flexible-ticker
```

Only run `prisma migrate deploy` when `migrate status` confirms there are no
unrelated pending migrations. If an older migration is also pending, baseline
or resolve that migration separately first; do not let this rollout alter an
unrelated table.

The first command creates a read-only JSON snapshot under the ignored `backups/`
directory before any schema or data write. The Prisma migration only creates the
`Event` table and adds flexible columns and indexes to `TickerItem`; it does not
drop, truncate, or reseed any table.

Both import commands make another pre-write snapshot, reuse existing records,
and print inserted/skipped/total counts. Event slugs are checked before insert.
Legacy ticker labels are matched to existing rows and are not duplicated.
