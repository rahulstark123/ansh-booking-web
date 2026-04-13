# Prisma + Supabase (handoff for Cursor / other projects)

## This repo (`ansh-booking-web`)

| Piece | Where | Env var |
|--------|--------|---------|
| Prisma **CLI** (migrate, db push) | `prisma.config.ts` → `datasource.url` | `DIRECT_URL` **or** fallback `DATABASE_URL` |
| Prisma **runtime** (Next.js API, `adapter-pg`) | `src/lib/prisma.ts` | `DATABASE_URL` |

Use a **direct** Postgres URL for migrations (port `5432` / session mode). Use a **pooler** URL for production app traffic on serverless (port `6543`, `pgbouncer=true`) when Supabase recommends it.

## Why `P1001: Can't reach database server`

That is **network reachability** from the machine running Prisma (wrong host/port, firewall, VPN, or a sandboxed terminal with **no outbound TCP to Postgres**). It is usually **not** fixed by rotating secrets.

**If you see P1001:** do not keep changing passwords at random — run `npx prisma migrate deploy` (or `db push`) from **your laptop** where Supabase is reachable, paste the SQL from `scripts/supabase-user-profiles.sql` into **Supabase SQL Editor**, or use **CI** with outbound DB access.

## Passwords in URLs

Encode special characters (`@` → `%40`, etc.) in `DATABASE_URL` / `DIRECT_URL`.

## Align environments

Use the **same Supabase project** in local `.env`, Vercel, and CI so “column missing in prod” means the prod DB never received that migration — fix by aligning URLs and applying migrations or SQL once.
