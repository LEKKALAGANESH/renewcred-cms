# ADR-0007 — Structured logging with enforced redaction

**Status:** Accepted · **Date:** 2026-07-23

## Context

The project standard requires errors logged with enough context to reproduce (request id, user id, input shape) and never logging PII or secrets. Those two pull against each other: the most useful context is often adjacent to the most sensitive fields.

`console.log` cannot satisfy either — unstructured, unfilterable, and unredacted.

## Decision

`@renewcred/logger` wraps pino with a fixed redaction list, a service tag, ISO timestamps, and a typed `LogEvent` union. Every app logs through it. `console.log` is an ESLint error in application code.

Redaction is configured centrally, not at call sites.

## Consequences

**Good**

- Redaction that depends on every call site remembering will fail. Configuring paths once means a developer who logs `{ req }` wholesale still cannot leak the `authorization` header.
- The typed `LogEvent` union makes auth events (`auth.login.failure`, `auth.refresh.reuse_detected`) greppable and enumerable rather than free-text.
- Structured JSON is queryable by any aggregator without parsing rules.
- The logger accepts an injected destination stream, so redaction is tested against the real path list rather than a duplicate of it — a redaction test that reimplements the config proves nothing.

**Bad**

- The redaction list must be maintained. A new secret-bearing field name added without updating it will log in the clear.
- pino's pretty transport is a dev-only dependency that must not reach production.

## Alternatives considered

**Winston.** More transports, notably slower, and redaction is not first-class. Rejected.

**`console.log` plus discipline.** Discipline is not a control. Rejected.
