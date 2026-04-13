# Prisma + Supabase (handoff for Cursor / other projects)

## This repo (`ansh-booking-web`)

| Piece | Where | Env var |
|--------|--------|---------|
| Prisma **CLI** (migrate, db push) | `prisma.config.ts` → `datasource.url` | `DIRECT_URL` **or** fallback `DATABASE_URL` |
| Prisma **runtime** (Next.js API, `adapter-pg`) | `src/lib/prisma.ts` | `DATABASE_URL` |

Supabase’s **recommended Prisma setup** uses the **same pooler host** with two ports:

| Variable | Port | Purpose |
|----------|------|---------|
| `DATABASE_URL` | **6543** + `?pgbouncer=true` | Transaction pooler — app runtime (`src/lib/prisma.ts`), serverless-friendly |
| `DIRECT_URL` | **5432** | Session mode on the pooler — Prisma CLI migrations (`prisma.config.ts`) |

Example shape (replace project ref, region `aws-0-…` / `aws-1-…`, and password from **Project Settings → Database**):

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

You can still use `db.*.supabase.co:5432` for `DIRECT_URL` if you prefer the non-pooler “direct” host; migrations need a connection that is **not** transaction-pooled only.

## Why `P1001: Can't reach database server`

That is **network reachability** from the machine running Prisma (wrong host/port, firewall, VPN, or a sandboxed terminal with **no outbound TCP to Postgres**). It is usually **not** fixed by rotating secrets.

**If you see P1001:** do not keep changing passwords at random — run `npx prisma migrate deploy` (or `db push`) from **your laptop** where Supabase is reachable, paste the SQL from `scripts/supabase-user-profiles.sql` into **Supabase SQL Editor**, or use **CI** with outbound DB access.

## Passwords in URLs

Encode special characters (`@` → `%40`, etc.) in `DATABASE_URL` / `DIRECT_URL`.

## Align environments

Use the **same Supabase project** in local `.env`, Vercel, and CI so “column missing in prod” means the prod DB never received that migration — fix by aligning URLs and applying migrations or SQL once.

## Signup and `user_profiles`

If **email confirmation** is enabled in Supabase, `signUp()` often returns **no session** until the user clicks the link — the app cannot call `/api/auth/profile` as an authenticated follow-up until they sign in.

- **App behavior:** After signup with a session, we upsert the profile immediately; if there is no session, we send the user to `/login` with an info toast.
- **Database (recommended):** Run `scripts/supabase-auth-user-profile-trigger.sql` once in the Supabase SQL editor so a `user_profiles` row is created on every `auth.users` insert, even before the first session exists.
