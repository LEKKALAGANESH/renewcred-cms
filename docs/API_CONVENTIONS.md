# API Conventions

Locked before the first route is written. Retrofitting a response shape across a built API is the kind of cleanup that never quite finishes.

---

## 1. Base path and versioning

All routes live under `/api/v1`. The version is in the path, not a header — it is visible in logs, `curl`, and browser address bars without extra tooling.

```
/api/v1/auth          login, refresh, logout, me
/api/v1/standards     public read
/api/v1/navigation    public read — header, footer, legal menus
/api/v1/settings      public read — address, tagline, copyright
/api/v1/search        public read
/api/v1/admin/*       authenticated mutations
```

## 2. Response envelope

Every response — success or failure — uses one shape:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}
```

```json
{
  "success": false,
  "data": null,
  "meta": {},
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request body failed validation",
    "details": [
      { "path": "content.0.blocks.2.rows", "message": "Row 3 has 4 cells; 3 headers defined" }
    ],
    "requestId": "01J8Z3K9P2QYVN4M7T0RBXWCFA"
  }
}
```

`meta` carries pagination and nothing else for now:

```json
{ "meta": { "page": 1, "perPage": 20, "total": 137 } }
```

### Typed as a discriminated union, not optional fields

The wire format above is exactly as specified. In TypeScript it is modelled as a union discriminated on `success`, so `data` narrows to non-null in the success branch:

```ts
export type ApiResponse<TData, TMeta = Record<string, never>> =
  | { success: true; data: TData; meta: TMeta; error: null }
  | { success: false; data: null; meta: TMeta; error: ApiError };
```

A flat shape with `data?: T` and `error?: E` would force a non-null assertion at every call site. The union makes `if (res.success)` sufficient — the compiler does the rest.

## 3. Status codes

| Code  | Constant            | When                                                          |
| ----- | ------------------- | ------------------------------------------------------------- |
| `200` | —                   | successful read or update                                     |
| `201` | —                   | resource created; `Location` header set                       |
| `204` | —                   | successful delete or logout; no body                          |
| `400` | `VALIDATION_FAILED` | Zod rejected the payload                                      |
| `401` | `UNAUTHENTICATED`   | credentials missing, malformed, **or expired**                |
| `403` | `FORBIDDEN`         | authenticated, but the role is insufficient                   |
| `404` | `NOT_FOUND`         | no such resource, or not visible to this caller               |
| `409` | `CONFLICT`          | slug/version collision, or a stale-write precondition failure |
| `422` | `UNPROCESSABLE`     | structurally valid but semantically impossible                |
| `429` | `RATE_LIMITED`      | login throttle exceeded; `Retry-After` set                    |
| `500` | `INTERNAL`          | unexpected — message is generic, details go to logs only      |

**401 vs 403 is not interchangeable here.** An expired token is _invalid credentials_ (401), not _insufficient permission_ (403) — per RFC 9110 §15.5.2 and RFC 6750 §3.1. The distinction is load-bearing for the client: 401 means "refresh and retry", 403 means "stop, this will never work". Collapsing both to 403 destroys that signal and puts the admin panel into a retry loop it cannot escape.

**404 over 403 for hidden resources.** A draft version requested by an unauthenticated caller returns 404, not 403 — a 403 confirms the resource exists, which leaks the existence of unpublished content.

## 4. Request IDs

Every request gets an ID at the earliest middleware:

- Honour an inbound `X-Request-Id` when present (so a trace survives a proxy hop), otherwise generate a ULID.
- Echo it on the response as `X-Request-Id`.
- Attach it to the request-scoped logger, so **every** log line from that request carries it without call sites passing it around.
- Include it in every error body.

ULID over UUIDv4: lexicographically sortable by creation time, so sorting log lines by request ID sorts them chronologically for free.

**Errors are correlated, not exposed.** A 500 returns a generic message plus the request ID. The stack trace goes to the log under that same ID. The reviewer gets something actionable; the attacker gets nothing.

## 5. Validation

One Zod schema per endpoint, applied as middleware _before_ the controller. Params, query, and body are each validated. The controller receives typed, parsed input and never touches `req.body` directly.

Block content is validated in full against the shared `packages/schema` union on every write. The same schemas are imported by both frontends — one definition, no drift.

## 6. Auth transport

| Token       | Form                   | Storage                                                    | Lifetime |
| ----------- | ---------------------- | ---------------------------------------------------------- | -------- |
| **Access**  | JWT, signed            | memory only — never `localStorage`, never a cookie         | 15 min   |
| **Refresh** | opaque random, 256-bit | httpOnly · Secure · SameSite=Strict cookie; hashed at rest | 7 days   |

Refresh rotates on every use. A replayed token means theft — revoke the entire session family and log `auth.refresh.reuse_detected`.

## 7. Public reads are unauthenticated

`GET /api/v1/standards/*`, `/navigation`, and `/settings` take no token. Draft content is excluded **in the query layer**, not by a controller check — a controller-level filter is one forgotten line away from leaking unpublished standards.

## 8. CORS

Explicit origin allowlist from `CORS_ORIGINS`. Never `*` on any authenticated route. Credentials enabled only for the origins that need the refresh cookie.
