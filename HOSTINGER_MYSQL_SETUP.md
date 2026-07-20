# Shrimp.News — Hostinger MySQL setup

## 1. Install and configure

```bash
npm install
```

Copy `.env.example` to `.env.local` and fill in the server-only values. Never use a `NEXT_PUBLIC_` prefix for database or admin secrets.

```env
MYSQL_HOST=your-remote-mysql-host
MYSQL_PORT=3306
MYSQL_DATABASE=u123456789_shrimpnews
MYSQL_USER=u123456789_shrimpadmin
MYSQL_PASSWORD=use-a-long-unique-password
MYSQL_SSL=true
ADMIN_SESSION_SECRET=at-least-32-random-characters
```

Generate a session secret with `openssl rand -base64 48`, or an equivalent cryptographically secure password generator.

## 2. Create the Hostinger database

1. In hPanel, open **Websites → Dashboard/Manage → Databases Management**.
2. Under **Create a New MySQL Database And Database User**, choose a database name, username, and strong unique password, then create it.
3. The database name and username are listed under **Current MySQL Databases and Users**. The password is the value chosen during creation; reset it there if it is lost.
4. Because Vercel is external to Hostinger, open **Remote MySQL**, select this database, and allow the application’s outbound IP. If the Vercel plan has no fixed outbound IP, Hostinger’s **Any Host** option may be necessary; compensate with a unique high-entropy password, TLS where supported, and least-privilege database permissions. The remote MySQL hostname is displayed at the top of that page; use it for `MYSQL_HOST`. Port `3306` is the default.

Hostinger references: [create a database](https://www.hostinger.com/support/1583542-how-to-create-a-new-mysql-database-in-hostinger/), [find database details](https://support.hostinger.com/en/articles/1583552-how-to-find-your-mysql-database-details), and [configure remote MySQL](https://support.hostinger.com/en/articles/1583546-how-to-set-up-remote-mysql-access-in-hostinger).

## 3. Import the schema

1. In hPanel, open **Databases Management** and select **phpMyAdmin** beside the new database.
2. Select the database, choose the **Import** tab, upload `database/schema.sql`, and click **Go**.
3. Confirm that `admins`, `articles`, and `subscribers` exist and that the indexes in the schema are present.

Hostinger’s current import instructions are available in its [phpMyAdmin import guide](https://www.hostinger.com/support/1884149-how-to-import-a-database-with-phpmyadmin-in-hostinger/).

## 4. Create the first admin

Run this from `website/` after the MySQL variables are loaded in the shell:

```bash
npm run admin:create -- --email admin@example.com --name "Shrimp.News Admin" --password "a-long-unique-password"
```

For better shell-history hygiene, put the password temporarily in `ADMIN_BOOTSTRAP_PASSWORD` and omit `--password`. Remove that temporary variable afterward. The script hashes with bcrypt (cost 12) before writing and never stores a plaintext password.

## 5. Import the existing launch stories

```bash
npm run db:seed-articles
```

This imports the existing 20 stories in English, Hindi, and Telugu. Existing slugs are not overwritten, so the command is safe to run again.

## 6. Configure Vercel

In **Vercel Project → Settings → Environment Variables**, add `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_SSL`, and `ADMIN_SESSION_SECRET` for Production and Preview as appropriate. Redeploy after saving them. Do not add them to Git or expose them to browser code.

## 7. Local and acceptance testing

1. Run `npm run dev` and open `/admin/login`.
2. Sign in, create a draft, and confirm it is visible in Admin → Articles but absent from `/`, `/articles`, and its category page.
3. Publish it with a current `published_at`; confirm it becomes the first card on the homepage, article archive, matching category, and matching language view.
4. Edit only its content and confirm its position does not move. Change the publish date intentionally and confirm the order changes.
5. Open the public article URL, verify image URL, alt text, author, date, and full content, then try an invalid slug and confirm the 404 page.
6. Submit the public newsletter form, then confirm the row in Admin → Subscribers and in phpMyAdmin. Deactivate it, subscribe again, and confirm it is reactivated rather than duplicated.
7. Use **Export CSV** and confirm the downloaded columns and UTF-8 text.
8. Run `npm run lint` and `npm run build` before deployment.

## Image storage

The editor currently accepts and previews a final HTTPS image URL. This is deliberate: Vercel’s temporary filesystem is not used. Upload the image to persistent Hostinger public storage or an approved image CDN, then paste its URL. A credentialed Hostinger upload adapter can be added later without changing article records or the editor contract; MySQL stores only `featured_image_url`.
