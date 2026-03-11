---
date: 2026-03-11
tags:
  - security
  - supabase
  - database
description: Explains deny-by-default RLS setup that blocks Supabase REST API while keeping Drizzle access intact
---

# RLS setup

## Why RLS without policies?

Supabase exposes every table via its REST and GraphQL APIs by default. Any client with the `anon` or `service_role` key can query or mutate data unless Row Level Security restricts access.

Kamertool does not use the Supabase client library or REST API -- all database access goes through Drizzle on the server side. Enabling RLS with **zero policies** means:

- The `anon` and `authenticated` Supabase roles are denied all access (SELECT, INSERT, UPDATE, DELETE) on every table.
- The application's `DATABASE_URL` role has the **BYPASSRLS** privilege, so Drizzle queries work exactly as before -- RLS is transparently skipped.

This is a deny-by-default posture: nothing is exposed unless you explicitly create a policy for it.

## Running the script

The SQL script lives at `scripts/enable-rls.sql`. Run it against the database using the `DATABASE_URL` from `.env.local`:

```bash
set -a && source .env.local && set +a && node -e "const pg = require('postgres'); const sql = pg(process.env.DATABASE_URL); require('fs').readFileSync('scripts/enable-rls.sql','utf8').split(';').filter(s=>s.trim()).reduce((p,s)=>p.then(()=>sql.unsafe(s)),Promise.resolve()).then(()=>{console.log('Done');process.exit()}).catch(e=>{console.error(e);process.exit(1)})"
```

The final query in the script prints all public tables with their `rowsecurity` status. Every table should show `true`.

## Disabling the Supabase Data API (PostgREST)

RLS blocks access through the REST API, but you can go one step further and disable PostgREST entirely:

1. Open the Supabase dashboard for the project.
2. Go to **Settings > API > Data API Settings**.
3. Toggle **Enable Data API** to off.
4. Save.

After disabling, any request to `https://<project>.supabase.co/rest/v1/` should return a **404**. This confirms that the REST and GraphQL endpoints are no longer reachable.

## BYPASSRLS and the application role

The `DATABASE_URL` connection string uses a PostgreSQL role that has the `BYPASSRLS` attribute. You can verify this:

```sql
SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname = current_user;
```

If `rolbypassrls` is `true`, RLS policies (or the absence thereof) do not affect queries made through that role. This is why Drizzle continues to function normally even though no policies exist.

## Adding policies later

If you ever need to expose specific tables through the Supabase REST API (for example, for a mobile client), create explicit policies:

```sql
CREATE POLICY "allow authenticated read" ON some_table
  FOR SELECT
  TO authenticated
  USING (true);
```

Until such a policy is created, the table remains inaccessible to non-BYPASSRLS roles.
