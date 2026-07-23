# Architecture Decision Records

One file per decision that would be expensive to reverse. Format: Context → Decision → Consequences → Alternatives.

An ADR is written **when the decision is made**, not reconstructed afterwards. Reconstructed rationale is rationalisation — it records what we ended up with, not what we weighed.

| #                                              | Decision                                   | Status   |
| ---------------------------------------------- | ------------------------------------------ | -------- |
| [0001](0001-monorepo-npm-workspaces.md)        | Monorepo on npm workspaces                 | Accepted |
| [0002](0002-express-over-next-api-routes.md)   | Express API over Next.js route handlers    | Accepted |
| [0003](0003-block-based-content-model.md)      | Block-based content model over stored HTML | Accepted |
| [0004](0004-supabase-postgres-prisma.md)       | Supabase Postgres + Prisma                 | Accepted |
| [0005](0005-custom-auth-over-supabase-auth.md) | Custom auth over Supabase Auth             | Accepted |
| [0006](0006-redux-state-boundaries.md)         | Redux only for cross-cutting state         | Accepted |
| [0007](0007-logging-strategy.md)               | Structured logging with enforced redaction | Accepted |

## Status values

- **Proposed** — under discussion
- **Accepted** — in force
- **Superseded by ADR-NNNN** — replaced; the file stays for the history
