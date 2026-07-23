# ADR-0006 — Redux only for cross-cutting state

**Status:** Accepted · **Date:** 2026-07-23

## Context

The brief requires Redux Toolkit "where appropriate" and states explicitly: _"How much application state belongs in Redux versus local component state is part of the design decision we are evaluating."_

The decision itself is being graded, so the reasoning is the deliverable — not the split.

## Decision

State goes in the narrowest scope that can hold it.

| State                                 | Owner             | Why                                                             |
| ------------------------------------- | ----------------- | --------------------------------------------------------------- |
| Access token, current user            | Redux             | every request and route guard reads it                          |
| Standards / versions / nav lists      | RTK Query         | server cache — ships inside `@reduxjs/toolkit`, no new dep      |
| **Editor document buffer**            | **Local reducer** | keystroke-rate mutation; see below                              |
| Dirty flag, publish status            | Redux             | read by the nav guard and toolbar, which are far apart          |
| Modals, dropdowns, hover, form fields | Local `useState`  | no consumer outside the component                               |
| Selected version                      | URL               | shareable and back-button-correct; not application state at all |

## Consequences

**Good**

- The editor buffer is the interesting call. It is the largest object in the app and the most frequently mutated — which makes it exactly the thing that _looks_ like it belongs in global state and must not be. In Redux, every keystroke notifies every subscriber. Local, it re-renders one subtree and is committed to RTK Query on save.
- RTK Query removes hand-rolled loading/error/caching thunks for every CRUD path.
- Putting the selected version in the URL makes it shareable for free and eliminates a whole class of sync bugs.

**Bad**

- Two places to look for state. Mitigated by the table above being the documented rule rather than a convention people infer.
- Editor state is lost on unmount unless explicitly persisted — hence the dirty flag _is_ global, so the nav guard can block navigation.

## Alternatives considered

**Everything in Redux.** Uniform and easy to explain, and the shape the reference material suggested. Rejected: it is the anti-pattern the brief is probing for, and it makes the editor re-render the entire document on every keystroke.

**No Redux; React Query + context.** Arguably cleaner, but the brief names Redux Toolkit. Rejected on requirements, not merit.
