# Admin CMS migration

The CMS authentication upgrade is additive. It extends the existing Prisma
`Admin` table and creates session, password-reset, and login-audit tables. It
does not modify public content records.

Before applying it:

```powershell
npm run db:backup-events-ticker
npx prisma migrate status
```

The configured database currently has older unrelated migrations pending.
Do not run `prisma migrate deploy` until those have been safely baselined or
resolved, because a deploy applies every pending migration.

After the migration is safely applied, provision the single Super Admin with:

```powershell
npm run admin:create -- --email admin@example.com --name "Shrimp.News Admin"
```

Provide the password through `ADMIN_BOOTSTRAP_PASSWORD` or the `--password`
argument. It is validated against the CMS password policy and stored only as a
bcrypt hash.
