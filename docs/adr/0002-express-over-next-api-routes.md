# ADR-0002 — Express API over Next.js route handlers

**Status:** Accepted · **Date:** 2026-07-23

## Context

The public site is Next.js, which can serve its own API through route handlers. Using them would remove a deployable unit and let page code call the database directly. Three consumers need data: the public site, the admin panel (Vite, not Next), and future integrations.

## Decision

A standalone Express service owns all business logic and is the **only** database client. Both frontends are HTTP clients of it.

## Consequences

**Good**

- One place for validation, authorisation, rate limiting, audit logging, and error shaping. Every consumer gets the same guarantees rather than each re-implementing them.
- The admin panel is not a Next.js app, so a Next-only API would have needed a second mechanism anyway.
- The `service_role` key stays in one process. No bundler config decides whether a database credential reaches a browser.
- Satisfies the brief's requirement that the public frontend consume content "through your APIs rather than relying on hardcoded data" — going straight to the database from a server component would render dynamically while bypassing the API layer being evaluated.

**Bad**

- One more service to run, containerise, and deploy.
- A network hop between the Next server and the API that a direct database call would not have. Mitigated by ISR: public pages are generated, not fetched per request.
- Types must be shared deliberately (`packages/schema`) rather than inferred across a single codebase.

## Alternatives considered

**Next.js route handlers only.** Fewer moving parts, but the admin panel would need its own API surface or an awkward dependency on the public app. Rejected.

**tRPC.** Excellent type safety, but the brief names Express and a REST-shaped API is easier for a reviewer to exercise with `curl`. Rejected on legibility, not merit.
