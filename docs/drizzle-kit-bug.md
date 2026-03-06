---
date: 2026-03-06
tags:
  - drizzle
  - database
  - bug
---

# Drizzle-kit push: broken met Supabase

## Probleem

`drizzle-kit push` werkt niet met Supabase's transaction pooler (port 6543):

- **Stable (v0.31.9):** crasht op check constraint introspection — foreign keys worden verkeerd geclassificeerd als check constraints, waardoor `checkValue.replace()` faalt op `undefined`.
- **Beta (v1.0.0-beta.16):** crash is gefixt, maar het commando hangt oneindig omdat de beta prepared statements gebruikt die PgBouncer (transaction pooler) niet ondersteunt.
- **Directe connectie (port 5432):** niet bereikbaar vanuit ons netwerk (Supabase plan of IP-restrictie).

## Root cause

GitHub issues: [#4496](https://github.com/drizzle-team/drizzle-orm/issues/4496), [#3766](https://github.com/drizzle-team/drizzle-orm/issues/3766), [#3156](https://github.com/drizzle-team/drizzle-orm/issues/3156)

De Drizzle-kit introspection query haalt alle constraints op zonder te filteren op `contype = 'c'` (check constraints only). Foreign key constraints hebben geen `checkValue`, dus `.replace()` crasht.

De v1 rewrite ([PR #4439](https://github.com/drizzle-team/drizzle-orm/pull/4439)) herschrijft de volledige alternation engine met ~9000 tests. Dit lost de crash op, maar `drizzle-kit push` ondersteunt nog steeds geen `prepare: false` in `drizzle.config.ts`.

## Workaround

Pas migraties toe via directe SQL met `postgres.js`:

```bash
set -a && source .env.local && set +a && node -e "
const sql = require('postgres')(process.env.DATABASE_URL, { prepare: false });
sql\`ALTER TABLE briefing ADD COLUMN IF NOT EXISTS \"partyId\" text REFERENCES party(id)\`
  .then(() => { console.log('done'); return sql.end() });
"
```

## Wanneer opnieuw proberen

Check of drizzle v1 stable is uitgebracht:

```bash
npm view drizzle-kit dist-tags --json | grep latest
```

Wanneer `latest` naar `1.x.x` springt, probeer `drizzle-kit push` opnieuw. Test eerst lokaal.

## Onderzocht op

2026-03-06. Geteste versies: stable v0.31.9, beta v1.0.0-beta.16.
