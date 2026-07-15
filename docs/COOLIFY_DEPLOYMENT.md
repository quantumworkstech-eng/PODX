# Deploy PodX on Coolify

This guide deploys both PodX and its data on your Coolify server.

> Important: deploy **Supabase**, not only PostgreSQL. PodX uses Supabase's API and authentication services in addition to PostgreSQL. Coolify's one-click Supabase service includes PostgreSQL and keeps all database data on your server.

## 1. Push these files

Commit and push the new `Dockerfile`, `.dockerignore`, and `next.config.ts` change before creating the application.

## 2. Create Supabase in Coolify

1. Open your Coolify project and select the **Production** environment.
2. Select **New Resource** → **Services** → **Supabase**.
3. Keep the generated passwords and deploy it.
4. Add an HTTPS domain to the Supabase **Kong/API** service, for example `https://supabase.example.com`. Do not use the Studio/dashboard domain for the application.
5. Once it is healthy, open the Supabase service's **Environment Variables** page and copy these generated values somewhere safe:

   | PodX variable | Copy from the Supabase service |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | The Kong/API HTTPS URL, e.g. `https://supabase.example.com` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `SERVICE_SUPABASEANON_KEY` |
   | `SUPABASE_SERVICE_ROLE_KEY` | `SERVICE_SUPABASESERVICE_KEY` |

Keep Supabase and PodX in the same Coolify project, environment, and destination. Do not expose the database port publicly.

## 3. Create the database schema

Run the one combined file: `src/db/bootstrap.sql`. It contains `schema.sql` followed by every migration in dependency order.

### Easiest: Supabase Studio

1. Open the Supabase Studio/dashboard from the Coolify service.
2. Open **SQL Editor** → **New query**.
3. Copy the contents of `src/db/bootstrap.sql` into the editor and click **Run**.
4. Confirm the query succeeds.

### Or: use a database URL from a trusted terminal

If your terminal can reach the database, run this once from a clone of this repository:

```powershell
$env:DATABASE_URL = 'postgresql://<user>:<password>@<host>:5432/<database>'
npm run db:bootstrap
```

Run it from your computer or a one-off trusted terminal that can reach the database—not from the website/frontend application. Do not add an API route that runs this file. It performs database-definition changes and must not be reachable by website visitors. This bootstrap is for a new, empty database only; do not run it again after data exists. Do not run `src/db/seed.sql` in production unless you specifically want sample data.

## 4. Create the PodX application

1. In the same Coolify project and environment, select **New Resource** → your Git repository.
2. Select your production branch.
3. Choose the **Dockerfile** build pack.
4. Set **Base Directory** to `/`.
5. Set **Port Exposes** to `3000`.
6. Add your app domain, for example `https://app.example.com`, and enable HTTPS.

Leave the install, build, and start commands empty. The Dockerfile handles them.

## 5. Paste PodX environment variables

Open the application’s **Environment Variables** → **Developer View** and paste this. Replace every placeholder before saving.

```dotenv
NODE_ENV=production
NEXTAUTH_URL=https://app.example.com
NEXT_PUBLIC_APP_URL=https://app.example.com
AUTH_SECRET=<generate-a-long-random-string>

NEXT_PUBLIC_SUPABASE_URL=https://supabase.example.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SERVICE_SUPABASEANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_SUPABASESERVICE_KEY>

GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>

RESEND_API_KEY=<resend-api-key>
SUPPORT_EMAIL=support@example.com

RAZORPAY_KEY_ID=<razorpay-key-id>
RAZORPAY_KEY_SECRET=<razorpay-key-secret>
NEXT_PUBLIC_RAZORPAY_KEY_ID=<razorpay-key-id>

NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=<browser-maps-key>
GOOGLE_MAPS_SERVER_KEY=<server-maps-key>

OPENAI_API_KEY=<optional-openai-key>
```

Set the three `NEXT_PUBLIC_*` variables to **Build Variable** and **Runtime Variable**. Set all secrets to **Runtime Variable** only, except when a build log proves a specific secret is required during the build. Never use `NEXT_PUBLIC_` for a secret.

## 6. Configure sign-in and deploy

1. In Google Cloud, add this exact authorized redirect URI:

   ```text
   https://app.example.com/api/auth/callback/google
   ```

2. In Supabase, add `https://app.example.com` to its permitted application/site URLs if applicable.
3. Click **Deploy** in Coolify.
4. When the deployment is healthy, open `https://app.example.com` and test sign-in, a Supabase-backed page, and a Razorpay test payment.

## If deployment fails

| Error | Fix |
| --- | --- |
| `No Available Server` or 502 | Confirm the build pack is **Dockerfile** and **Port Exposes** is `3000`. |
| Supabase requests fail | Verify the URL is the Supabase **Kong/API** HTTPS URL, not Studio, and recopy both Supabase keys. |
| Google callback error | `NEXTAUTH_URL` and the Google redirect URI must exactly match the app’s HTTPS domain. |
| Browser still uses an old public URL/key | Redeploy after changing any `NEXT_PUBLIC_*` variable; those values are compiled into the browser bundle. |

Official references: [Coolify Next.js](https://coolify.io/docs/applications/nextjs), [Coolify Supabase](https://coolify.io/docs/services/supabase), and [Coolify environment variables](https://coolify.io/docs/knowledge-base/environment-variables).
