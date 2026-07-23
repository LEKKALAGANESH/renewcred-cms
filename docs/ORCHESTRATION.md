# Orchestration Contract

How the remaining work is coordinated. Adapted from a 13-agent proposal to match the project's real dependency structure — see [§Why not 13 agents](#why-not-13-agents).

---

## Contract Preservation Rule

**Every completed step is a versioned contract. Later work treats it as authoritative.**

It may be **extended**. It may not be modified, replaced, or invalidated without all four of:

1. A **concrete defect** — a failing test, a reproduction, or a specification conflict. Not "a different approach seems better."
2. The **impact** — what breaks, and where.
3. A **backward-compatible migration** where one is possible.
4. **Approval** for anything breaking.

This is the rule that prevents the dominant failure mode: later work "improving" earlier work and causing architectural drift. Preference is not a defect.

### Locked contracts

| Contract                         | Locked at | Extension allowed                                   |
| -------------------------------- | --------- | --------------------------------------------------- |
| Toolchain, gate, `env`, `logger` | `5879114` | new packages, new lint rules                        |
| Block/section/inline schema      | `463b61f` | **new block types, new marks, new optional fields** |
| `BLOCK_REGISTRY` shape           | `463b61f` | new metadata fields (optional only)                 |
| API conventions                  | Step 0    | new endpoints, new error codes                      |
| Domain vocabulary                | Step 1    | new terms; renaming an existing term is breaking    |

**Schema extension is additive by construction.** A new block type extends the union and adds a registry entry; stored documents stay valid, so `CURRENT_SCHEMA_VERSION` does not move. Bumping it on additive changes forces no-op migrations and trains everyone to ignore the version.

---

## Dependency order

Sequential. Nothing starts before its dependency is green.

```
Schema (done) → Database → Repositories → Services → Controllers → API → Frontend → Integration
```

Two lanes run genuinely independent of that chain:

- **Design system** — tokens are already extracted; components depend on no backend work
- **Review lanes** — security, accessibility, performance, QA; these fan out _after_ a step lands, across dimensions, and are the one place concurrency pays

---

## Roles

Roles are hats, not headcount. Whoever holds the hat owns the listed files for that step.

| Role              | Owns                                                           | Runs        |
| ----------------- | -------------------------------------------------------------- | ----------- |
| **Architect**     | ADRs, dependency graph, integration, contract approval         | continuous  |
| **Database**      | `prisma/`, migrations, RLS, seed                               | Step 2      |
| **Backend**       | `apps/api/src/**` — routes, services, repositories, middleware | Steps 3,5   |
| **Auth**          | `apps/api/src/modules/auth/**`, session/token logic            | Step 4      |
| **Frontend**      | `apps/admin/src/**` architecture, routing, state boundaries    | Step 6      |
| **Design system** | `packages/ui/**`, token wiring                                 | parallel    |
| **Public site**   | `apps/web/src/**`                                              | Step 7      |
| **Review lanes**  | no ownership — report findings only                            | after steps |

**Backend, Auth, and CMS work are one lane, not three.** They share `apps/api/src` and would collide. They are separated by _step_, not by concurrent agent.

### Isolation, not just allocation

Allocation is a plan; a plan does not prevent collision. Enforcement:

- **Reads** parallelise freely.
- **Writes** are serialised through one owner per step, or given a git worktree.
- **Cross-cutting files are never parallelised** — barrels (`packages/*/src/index.ts`), `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, the Prisma schema. One owner, always.
- Review lanes are **read-only** and return findings; fixes are applied by the owner.

---

## Quality gate

A step is complete only when **all** hold:

```
✓ npm run validate exits 0     (typecheck · lint · format · test)
✓ functionality verified by running it, not by reading it
✓ tests added for the logic that can silently be wrong
✓ error, loading, empty, retry, and permission-denied states exist
✓ accessibility checked against docs/DEFINITION_OF_DONE.md
✓ security reviewed — validation, secrets, authorization
✓ documentation and DECISIONS.md updated
✓ responsive at the CURRENT target tier only
```

Responsive tiers are gated: **desktop → review → tablet → review → mobile.** Never mixed.

---

## Step report

Emitted after every step:

```
Step N — <name>
Completed:        <what now works>
Files:            <added / modified>
Tests:            <added, total, pass/fail>
Contract impact:  <extended | unchanged | BREAKING + justification>
Security:         <changes, residual risk>
Accessibility:    <changes, or N/A + reason>
Performance:      <changes, or N/A + reason>
Risks:            <known, with mitigation>
Tech debt:        <accepted, with the reason it was accepted>
Next:             <next step and its dependency>
```

---

## Stop conditions

Halt and report rather than continue:

- a dependency is incomplete
- a locked contract would break without the four-part justification
- `npm run validate` fails
- security, accessibility, or architecture regresses
- an assumption would have to be invented where the PDF, Figma, tokens, ADRs, or existing code already answer it

Otherwise continue without asking.

---

## Before asking a question

Exhaust, in order: the assignment PDF · `figma/file.json` · `figma/design-tokens.json` · existing code · ADRs · `docs/` · established engineering standards.

Ask only when the answer **materially changes the implementation**. Batch every open question into one message. Never claim to have read a source that was not accessible.

---

## Why not 13 agents

Recorded so the decision is not relitigated.

The proposed structure assigned 13 specialised agents with per-concern file ownership. Rejected for three reasons:

1. **The dependency graph is sequential.** Database → repositories → services → controllers → API → frontend admits almost no concurrency. Thirteen agents against a sequential chain buy no wall-clock time and add a handoff at every boundary.
2. **Per-concern ownership does not partition a layered codebase.** "Backend owns middleware", "Auth owns auth middleware", and "CMS owns controllers" describe the same files. File collisions — not role ambiguity — are what actually corrupt parallel work.
3. **Five of the thirteen are review roles.** Security, accessibility, performance, QA, and architecture audit what exists; they run after a step, not beside it.

**Kept:** the Contract Preservation Rule, the quality gate, the step report, stop conditions, the no-assumptions ladder, and gated responsive tiers. Those are what make the process work, and none of them depend on agent count.

**Actual concurrency:** 2–4 workers at peak — the design-system lane beside backend work, and review dimensions fanned out after a step lands.
