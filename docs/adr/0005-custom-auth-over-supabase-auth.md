# ADR-0005 — Custom authentication over Supabase Auth

**Status:** Accepted · **Date:** 2026-07-23

## Context

Supabase is the database (ADR-0004) and ships a complete auth product: sessions, password hashing, refresh rotation, email flows. Using it would delete most of this work.

The brief names authentication as one of only two explicitly-required functional capabilities, and names Express as the preferred backend.

## Decision

Implement authentication in Express: bcrypt password hashing, short-lived JWT access tokens held in memory, opaque refresh tokens in an httpOnly cookie, rotation on every use, hashed refresh-token storage, and reuse detection. Supabase Auth is not used.

## Consequences

**Good**

- The security reasoning is visible and reviewable — rotation, reuse detection, hashed storage at rest, and the 401-vs-403 distinction are all our decisions to defend.
- No token-shape coupling between the auth provider and the API's authorisation model.
- Keeps Express as a real service rather than a proxy in front of a BaaS.

**Bad**

- More code to write and more surface to get wrong. Auth is exactly the area where rolling your own is normally poor advice.
- No email verification or password reset flows without additional work. Out of scope; single seeded admin.
- We own the consequences of any mistake here.

## Alternatives considered

**Supabase Auth.** Battle-tested, less code, and in a real product with delivery pressure this would be the right call — that judgement is recorded deliberately, because "always build it yourself" is not the lesson here. Rejected for this context only: the brief evaluates backend engineering, and delegating the one capability being examined would leave little to assess.

**Passport.js.** Middleware ecosystem for strategies we do not need. Adds a dependency without removing the decisions that matter. Rejected.

## Note

Reversible cheaply until the admin API is built (roadmap step 6); expensive after. Flagged as B12 in `PHASE1_BLUEPRINT.md`.
