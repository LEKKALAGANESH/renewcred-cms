# Data Workflow

Migration, generation, and seed conventions — fixed before the first model exists so the commands never drift.

---

## Commands

Defined in `apps/api/package.json`, surfaced at the root so a reviewer never needs to `cd`:

| Command                  | Does                                                           |
| ------------------------ | -------------------------------------------------------------- |
| `npm run generate`       | `prisma generate` — regenerate the typed client                |
| `npm run migrate`        | `prisma migrate dev` — author + apply a migration locally      |
| `npm run migrate:deploy` | `prisma migrate deploy` — apply pending migrations, no prompts |
| `npm run seed`           | idempotent seed                                                |
| `npm run db:reset`       | `prisma migrate reset` — drop, re-migrate, re-seed             |
| `npm run db:studio`      | `prisma studio` — inspect data                                 |

**Rules**

- Migrations are **committed**. The generated client is **not** (`**/generated/` is gitignored) — it is rebuilt from the schema.
- `migrate dev` runs against the **direct** connection (`DIRECT_URL`, port 5432). It needs session-level features the transaction pooler cannot carry. Running migrations through the pooler is the failure that presents as a hang with no error.
- Never hand-edit an applied migration. Write a new one.
- `db:reset` is local-only. It exists so a reviewer can always get back to a known-good state in one command.

## Fallback — applying a migration when the session pooler is unreachable

`migrate dev` and `migrate:deploy` both need `DIRECT_URL`, a session-mode connection. Some networks accept TCP on port 5432 but never complete the Postgres handshake, and Supabase's direct host (`db.<ref>.supabase.co`) publishes only an `AAAA` record — unusable without an IPv6 route. The transaction pooler on 6543 is unaffected, so the app runs and seeds fine while Prisma's migration engine has no endpoint.

**Diagnose first — do not assume the project is paused.** `P1001` covers every failure from a bad hostname to a refused handshake:

```bash
# 1. Is the tenant actually reachable? A healthy pooler answers 'S' to SSLRequest
#    and then sends an AuthenticationRequest.
node scripts/pg-probe.mjs <pooler-host> 6543 postgres.<ref> postgres

# 2. If 6543 answers and 5432 times out, it is the network, not the database.
```

A `P1001` on **both** ports usually means the URL is unparseable — check that the password is percent-encoded before suspecting the server.

**Then split generation from application:**

```bash
# Generate the migration offline — no database connection required.
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script \
  > prisma/migrations/<timestamp>_<name>/migration.sql
```

Apply that SQL through the Supabase control plane (dashboard SQL editor or MCP), wrapped so it cannot land in `public`:

```sql
CREATE SCHEMA IF NOT EXISTS "renewcred";
SET search_path TO "renewcred";
-- …contents of migration.sql…
```

The wrapper is **never** committed into `migration.sql`. Prisma derives the schema from `?schema=` in the connection URL; hard-coding `SET search_path` would make the migration non-portable and silently override that.

Finally, record it in Prisma's ledger so `migrate status` reflects reality:

```sql
INSERT INTO "renewcred"."_prisma_migrations"
  (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
VALUES (gen_random_uuid()::text, '<sha256-of-migration.sql>', now(), '<migration_name>', now(), 1);
```

The checksum is the SHA-256 of the committed file. Computing it from the file rather than inventing one means a later edit surfaces as a Prisma checksum mismatch instead of silent drift.

**Verify isolation after every out-of-band DDL step** — the control plane defaults to `search_path = public`:

```sql
SELECT table_schema, count(*) FROM information_schema.tables
WHERE table_schema IN ('renewcred','public') AND table_type='BASE TABLE'
GROUP BY table_schema;
```

## RLS in migrations

Every table gets RLS in the same migration that creates it — never a follow-up. A table that exists for one migration without RLS is a table that shipped without RLS.

```sql
ALTER TABLE "Standard" ENABLE ROW LEVEL SECURITY;
-- No permissive policies: Express connects as service_role, which bypasses RLS.
-- With RLS on and zero policies, every other role reads zero rows. That is the
-- correct default when the only legitimate client is a trusted server.
```

Run `supabase db advisors` before committing any migration.

## Seed strategy

The seed is not a smoke test — it is the reviewer's first impression. Someone evaluating this clones, boots, and looks. An empty CMS looks broken even when it is perfect.

**Idempotent** — `upsert` by natural key throughout, so re-running never duplicates and never fails.

### What gets seeded

| Data                   | Why                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Admin user             | credentials documented in the README                                                                                                |
| Navigation — header    | Buyers, Suppliers, Climate & Us, Science, Standards, Contact Us (2 with children, matching the design's dropdown chevrons)          |
| Navigation — footer    | primary column + legal links                                                                                                        |
| Site settings          | address, email, tagline, CIN, newsletter headline, copyright                                                                        |
| 4 standards            | EV, Biochar, Methane, Renewable Energy — matching the index page                                                                    |
| Version history        | at least one standard with ≥2 versions in different statuses, so the version selector and consultation panel have something to show |
| **Rich demo document** | see below                                                                                                                           |

### The rich demo document

At least one standard version must contain **every supported block type**, because the Figma demonstrates none of them and a reviewer cannot evaluate a capability they never see.

- Multi-level section tree — deep enough to produce `2.1.1` ordinals and exercise derived numbering
- Multiple paragraphs with inline formatting — bold, italic, links
- **A paragraph with inline math mid-sentence** — the single hardest requirement, and the one that proves the inline-node model works
- A block equation
- An unordered list nested ≥3 levels
- An ordered list
- A table with a header row, including **math inside a cell**
- A callout
- A code block

This doubles as the fixture set for schema tests: the same document that proves the API works proves the validator accepts what it should.

## Migration → seed ordering

`db:reset` runs migrate then seed. The seed must never assume prior state beyond a migrated schema — it creates everything it needs.
