# ADR-0001 — Monorepo on npm workspaces

**Status:** Accepted · **Date:** 2026-07-23

## Context

Three deployable units (API, admin, public site) share a block schema, design tokens, and env/logging helpers. The block schema in particular must be validated identically on the server and both clients — a drifted copy is how malformed content reaches the database.

## Decision

Single repository, npm workspaces, packages under `packages/*` and apps under `apps/*`.

## Consequences

**Good**

- One definition of the block schema, imported everywhere. Impossible for server and client validation to drift.
- One toolchain: one TypeScript config, one ESLint config, one Prettier config, one `npm run validate`.
- A reviewer clones once and runs `npm install` once.

**Bad**

- npm workspaces hoists dependencies, so a package can import something it never declared (phantom dependency) and only fail once deployed alone. pnpm's strict linking prevents this; npm does not.
- No build orchestration or caching. TypeScript project references cover incremental builds; anything more would need Turborepo or Nx.

## Alternatives considered

**pnpm workspaces.** Strictly better dependency isolation and faster installs. Rejected on reviewer friction: it requires a global install before the project runs at all, and the brief is evaluated by someone cloning cold. The phantom-dependency risk is accepted and noted.

**Separate repositories.** Realistic for independently deployed services, but the shared schema would need publishing to a registry or a git submodule. Disproportionate for this scope.
