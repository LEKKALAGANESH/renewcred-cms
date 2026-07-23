-- Row Level Security — appended to the initial migration, never a follow-up.
--
-- A table that exists for even one migration without RLS is a table that
-- shipped without RLS. See docs/DATA_WORKFLOW.md for the append procedure.
--
-- SCHEMA ISOLATION
-- Everything here is scoped to the "renewcred" schema, never "public". The
-- Supabase project is shared with an unrelated live application whose tables
-- live in public; a REVOKE on SCHEMA public would break that app's Data API
-- instantly, and a migrate reset against public would drop its data. Scoping
-- to a dedicated schema makes the shared project safe: Prisma manages only
-- this schema, so drift detection, resets, and grants cannot reach anything
-- else. See ADR-0004.
--
-- POSTURE
-- RLS ENABLED with ZERO permissive policies. Express connects as service_role,
-- which bypasses RLS entirely, so this is not the primary access control — the
-- API layer is. That is precisely why it must be on: with RLS enabled and no
-- policies, every non-service_role request returns zero rows. It is the
-- backstop for the day a key leaks or a table is accidentally exposed.
--
-- Do NOT add permissive policies "to make something work". If a query needs to
-- bypass this, it is being run by the wrong role.

ALTER TABLE "renewcred"."users"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "renewcred"."sessions"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "renewcred"."standards"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "renewcred"."standard_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "renewcred"."revisions"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "renewcred"."navigation_items"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "renewcred"."assets"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "renewcred"."site_settings"     ENABLE ROW LEVEL SECURITY;

-- FORCE applies RLS to the table owner as well. Without it the owning role
-- silently bypasses every policy, which makes the protection untestable and
-- gives false confidence.
ALTER TABLE "renewcred"."users"             FORCE ROW LEVEL SECURITY;
ALTER TABLE "renewcred"."sessions"          FORCE ROW LEVEL SECURITY;
ALTER TABLE "renewcred"."standards"         FORCE ROW LEVEL SECURITY;
ALTER TABLE "renewcred"."standard_versions" FORCE ROW LEVEL SECURITY;
ALTER TABLE "renewcred"."revisions"         FORCE ROW LEVEL SECURITY;
ALTER TABLE "renewcred"."navigation_items"  FORCE ROW LEVEL SECURITY;
ALTER TABLE "renewcred"."assets"            FORCE ROW LEVEL SECURITY;
ALTER TABLE "renewcred"."site_settings"     FORCE ROW LEVEL SECURITY;

-- Deny Data API access to this schema. Scoped to "renewcred" only — revoking
-- on public would break the co-tenant application.
REVOKE ALL ON ALL TABLES    IN SCHEMA "renewcred" FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "renewcred" FROM anon, authenticated;
REVOKE ALL ON SCHEMA        "renewcred"           FROM anon, authenticated;

-- Applies to tables created by future migrations too, so a new table is not
-- exposed for the window between its migration and the next RLS pass.
ALTER DEFAULT PRIVILEGES IN SCHEMA "renewcred"
  REVOKE ALL ON TABLES FROM anon, authenticated;

-- Full-text search over content (region D-04). GIN over the denormalised
-- searchText column, rebuilt from documentToPlainText() on every write.
CREATE INDEX IF NOT EXISTS "standard_versions_search_idx"
  ON "renewcred"."standard_versions"
  USING GIN (to_tsvector('english', "searchText"));
