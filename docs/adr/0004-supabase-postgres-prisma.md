# ADR-0004 — Supabase Postgres + Prisma

**Status:** Accepted · **Date:** 2026-07-23

## Context

The brief leaves the database open. The content model (ADR-0003) is a document tree, but versioning, navigation, assets, and users are relational. Assets also need object storage.

## Decision

Supabase (hosted Postgres) with Prisma as the client. `Section[]` content is stored as `jsonb`; everything else is relational. Supabase Storage holds uploaded assets.

## Consequences

**Good**

- `jsonb` stores the block tree natively and is GIN-indexable, so full-text search over content does not need a separate engine.
- Real foreign keys and cascades for versions → revisions → assets, which a document store would leave to application code.
- Prisma's generated types line up with the shared Zod schemas, so the boundary is typed on both sides.
- Supabase Storage removes a whole local-disk/volume/serving problem.
- The CLI runs the entire stack in Docker locally, so a reviewer needs no cloud account.

**Bad**

- Connection pooling has a real trap: the app must use the Supavisor **transaction** pooler (port 6543, `pgbouncer=true`, which disables prepared statements), while migrations need a **direct session** connection (port 5432) via Prisma's `directUrl`. Getting this wrong produces hanging migrations or connection exhaustion. Note that Supavisor _session_ mode on 6543 was deprecated in Feb 2025, so older tutorials show the wrong arrangement.
- `service_role` bypasses RLS entirely, so a leak of that key is total. Mitigated: server-only, RLS enabled with no permissive policies as a backstop, Data API left unexposed.
- `assetId` references live inside `jsonb` and get no referential integrity. Mitigated by service-layer validation and graceful degradation on a dangling reference.

## Alternatives considered

**MongoDB + Mongoose.** The natural fit for document content and the direction the reference material leaned. Rejected: versions, navigation trees, and assets are genuinely relational, and modelling them in a document store means manual joins and no cascade guarantees. The block tree — the one genuinely document-shaped thing — is served just as well by `jsonb`.

**Plain Postgres in Docker.** No vendor coupling. Rejected: Supabase gives Storage and a hosted demo environment for free, and its CLI still provides the local Docker path.
