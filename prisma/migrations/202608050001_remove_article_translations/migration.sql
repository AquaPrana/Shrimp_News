-- Intentionally non-destructive.
--
-- The existing Article table already contains every canonical column used by
-- Prisma. Its legacy translation columns are harmless extra database columns,
-- so keep the table and all article rows in place. The following migration adds
-- only the two missing placement flags required by the current Prisma model.
SELECT 1;
