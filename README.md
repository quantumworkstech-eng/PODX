# PODX

PODX is a multi-tenant studio-booking platform (podcast/production studios). Built with Next.js 16 (App Router), NextAuth, Supabase (Postgres), and Razorpay. It supports three distinct user types — customers, studio partners, and platform admins — plus a white-label storefront that partners can brand and put on their own custom domain.

## Contents
- [Local setup](#local-setup)
- [Panels](#panels) — 5 panels total
- [Roles & auth model](#roles--auth-model)
- [Multi-tenant routing (white-label)](#multi-tenant-routing-white-label)
- [Database](#database)

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env` (copy from the existing one, then adjust for local use):
   ```
   NODE_ENV=development
   NEXTAUTH_URL=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
   Keep `AUTH_SECRET`, Supabase, Google OAuth, Resend, and Razorpay values as provided, or swap in your own dev credentials. `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`, `GOOGLE_MAPS_SERVER_KEY`, and `OPENAI_API_KEY` are placeholders — fill them in if you need Maps or AI features.
3. If the database isn't bootstrapped yet, run:
   ```bash
   npm run db:bootstrap
   npm run db:migrate-coupons
   npm run db:migrate-feature-access
   ```
   `db:bootstrap` creates the full schema and seeds default roles, cities, amenities, equipment catalog, add-ons, platform settings, feature flags, and landing page content. It does **not** create an admin login — see [Database](#database) below.
4. Start the dev server:
   ```bash
   npm run dev
   ```
   App runs at http://localhost:3000.

Other scripts: `npm run build`, `npm run start` (production), `npm run lint`.

## Panels

The app has **5 distinct panels/surfaces**:

| # | Panel | Base path | Who it's for | Login |
|---|-------|-----------|---------------|-------|
| 1 | Public storefront | `/` | Anyone browsing PODX directly | n/a to browse |
| 2 | Customer dashboard | `/dashboard` | Logged-in customers (role `user`) | `/auth/login`, `/auth/signup` |
| 3 | Partner panel | `/partner/*` | Studio owners (role `partner`) | `/partner/login`, `/partner/signup` |
| 4 | Admin panel | `/admin/*` | Platform admins | `/admin/login` |
| 5 | White-label storefront | `/p/[partner_slug]` (or a partner's subdomain/custom domain) | Anyone booking through a specific partner's branded site | n/a to browse |

The `/partners` route is a separate marketing/sales page pitching studio owners to sign up — not a logged-in panel, always public.

### 1. Public storefront (`/`)
Main PODX marketing site and booking entry point.
- `/` — landing page (hero, services, how-it-works, testimonials — editable by admins)
- `/studios` — browse all studios
- `/services` — services offered
- `/contact` — contact page
- `/book` — booking flow

### 2. Customer dashboard (`/dashboard`)
For people who book studios. One main page showing booking history/profile (`DashboardContent`).

Auth: NextAuth session, role `user`. Sign in via `/auth/login` (Google OAuth or email OTP) or `/auth/signup`. Related pages: `/auth/forgot-password`, `/auth/google-onboarding` (finish profile after Google sign-in), `/auth/error`.

Access rules: no session → redirected to `/auth/login`. Logged in as a `partner` and you hit `/dashboard` → bounced to `/partner/dashboard` instead.

### 3. Partner panel (`/partner/*`)
For studio owners managing their business. Requires a session with role `partner`.

Pages:
- `/partner/dashboard` — overview
- `/partner/bookings` — manage bookings
- `/partner/studios`, `/partner/studios/create` — manage/add studios
- `/partner/clients`, `/partner/clients/[id]` — customer management
- `/partner/equipment` — equipment inventory
- `/partner/coupons` — discount coupons
- `/partner/earnings`, `/partner/billing` — payouts and subscription billing
- `/partner/analytics` — booking/revenue analytics
- `/partner/reviews` — customer reviews
- `/partner/branding`, `/partner/whitelabel` — customize the white-label storefront (logo, colors, custom domain) — gated by a feature flag
- `/partner/policies` — cancellation policies
- `/partner/settings` — account settings

Sign in via `/partner/login` or `/partner/signup` (also supports Google OAuth, with `/partner/google-onboarding` to finish setup). Logged in as `user` and you hit a `/partner/*` page → redirected to `/partner/signup?wrongRole=1`.

### 4. Admin panel (`/admin/*`)
For platform operators. **Not** part of the NextAuth customer/partner session system — it uses its own signed cookie (`admin_session`), separate from `users.role`.

Pages:
- `/admin` — main dashboard
- `/admin/studios`, `/admin/studios/create`, `/admin/studios/edit/[id]` — studio CRUD across all partners
- `/admin/bookings` — all bookings, platform-wide
- `/admin/partners` — manage partner accounts
- `/admin/users` — manage customer accounts
- `/admin/admins` — manage other admin accounts
- `/admin/payments` — payment records
- `/admin/subscriptions` — partner subscription plans
- `/admin/equipment` — global equipment catalog
- `/admin/addons` — platform add-on services
- `/admin/analytics` — platform-wide analytics
- `/admin/feature-access` — grant/revoke per-partner feature flags (e.g. white-label)
- `/admin/notifications` — notification management
- `/admin/reviews` — moderate reviews
- `/admin/landing` — edit the main site's landing page content
- `/admin/whitelabel` — oversee/disable partner white-label sites
- `/admin/settings` — platform settings

**Logging in as admin** (`/admin/login`) is a 3-step, passwordless-first-time flow:
1. Enter email.
2. If no password is set yet for that admin (fresh account), set one now.
3. Otherwise, enter your existing password.

This mints the `admin_session` cookie. See [Database](#database) for how to create the first admin account.

### 5. White-label storefront (`/p/[partner_slug]`)
A public, per-partner branded booking site — this is what a partner's own customers see, distinct from the main PODX site at `/`. Shows the partner's branded hero, studio picker, and a 3-step booking flow, pulling branding from the `partner_branding` table.

Partners reach their storefront one of two ways:
- **Subdomain**: `{slug}.podx.com` — auto-rewritten to `/p/{slug}`.
- **Custom domain**: any domain the partner has verified (e.g. `bookings.theirstudio.com`) — proxied through `/domain-proxy`, which looks up the partner by domain (must be verified, published, and not disabled by an admin) and serves their storefront.

Partners manage this under `/partner/branding` and `/partner/whitelabel`.

## Roles & auth model

- Customers and partners share one auth system (NextAuth). The role lives in `users.role` (a comma-separated string, e.g. `"user"` or `"partner"`), re-read from the DB on every session refresh — so role changes apply without forcing a re-login.
- Admin is a completely separate system: `admin_credentials` (bcrypt password hashes) + `admins` table (roles `admin`, `super_admin`) + its own `admin_session` cookie, verified in middleware independently of NextAuth.
- Sign-in methods for customers/partners: Google OAuth, or email OTP (one-time code sent via Resend, verified against the `email_otps` table).

## Multi-tenant routing (white-label)

Handled in `src/middleware.ts`:
- Known hosts (`localhost`, `podx.com`, `yanisa.in`, `yanisastudios.com`, etc.) serve the main app normally.
- `{slug}.podx.com` → rewritten internally to `/p/{slug}`.
- Any other host (a partner's custom domain) → rewritten to `/domain-proxy?_domain={host}`, which resolves the partner via `partner_branding.custom_domain` and redirects to their `/p/{slug}` storefront.

## Database

- `npm run db:bootstrap` runs `src/db/bootstrap.sql` — full schema plus seed data (roles, cities, amenities, equipment, add-ons, platform settings, feature flags, default landing content). It does **not** seed a working admin login. To create your first admin:
  ```sql
  INSERT INTO admin_credentials (email) VALUES ('you@example.com');
  ```
  Then go to `/admin/login` and set a password on first sign-in.
- `npm run db:migrate-coupons` — adds partner coupon support (`src/db/coupon_migration.sql`).
- `npm run db:migrate-feature-access` — adds per-partner feature-flag grants (`src/db/feature_access_migration.sql`), used for gating things like white-label access.

## Deployment

See [docs/COOLIFY_DEPLOYMENT.md](docs/COOLIFY_DEPLOYMENT.md) for the Coolify deployment guide, or deploy on [Vercel](https://vercel.com/new).
