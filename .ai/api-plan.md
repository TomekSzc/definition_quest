# REST API Plan

## 1. Resources

| Resource | DB Table / View | Description |
|----------|-----------------|-------------|
| `UserProfile` | `user_meta` (+ `auth.users`) | Public-facing user information (display name, avatar). Auth handled by Supabase. |
| `Board` | `boards` | Collection of term–definition pairs. Can be private or public, active or archived. |
| `Pair` | `pairs` | Single term–definition pair belonging to a board. |
| `Score` | `scores` | Best completion time of a user on a board. |
| `AIRequest` | `ai_requests` / `daily_ai_usage` | Audit of AI usage and daily quota enforcement. |

> Note: Materialized view `best_scores` is read-only and exposed through the `Score` resource.

## 2. Endpoints

### 2.1 Authentication (delegated to Supabase)

Supabase provides `/auth/v1/*` routes for sign-up, sign-in, password reset, OAuth etc. The FE obtains a JWT and sends it in the `Authorization: Bearer` header for every request below.

### 2.2 User Profiles

| Method | Path | Description | Req Body | Success (200) | Errors |
|--------|------|-------------|----------|---------------|--------|
| GET | `/users/me` | Return authenticated user profile. | – | `{ id, email, displayName, avatarUrl, createdAt }` | 401 unauthenticated |
| PATCH | `/users/me` | Update own profile. | `{ displayName?, avatarUrl? }` | same as GET | 400 invalid, 409 displayName too long, 429 rate-limit |
| GET | `/users/:id` | Public profile lookup. | – | `{ id, displayName, avatarUrl }` | 404 |

### 2.3 Boards

Common query params for listing:
* `page`, `pageSize` (default 20, max 100)
* `q` – full-text search on title (`search_vector`)
* `tags` – filter by one or more tags (comma-separated)
* `ownerId` – filter by author id
* `sort` – `created`, `updated`, `cardCount`, default `created`
* `direction` – `asc` / `desc`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/boards` | List **public** boards (optionally filtered) – anonymous access allowed. |
| GET | `/boards/mine` | List **own** boards (private + public + archived). Requires auth. |
| GET | `/boards/played` | List **public** boards in which the authenticated user has at least one score. Requires auth. |
| POST | `/boards` | Create board manually (pairs embedded in body). |
| POST | `/boards/generate` | Create board via AI – see AI section. |
| GET | `/boards/:id` | Get board metadata + pairs. Public boards accessible to all, private to owner. |
| PUT | `/boards/:id` | Replace board metadata + pairs. Owner only, prohibited for archived boards. |
| PATCH | `/boards/:id` | Partial update (e.g. title, tags, isPublic, archived). |
| DELETE | `/boards/:id` | Soft-archive board (`archived=true`). |

Request/response shapes (abbreviated):
```jsonc
// POST /boards
{
  "title": "Capital Cities",
  "cardCount": 16,
  "pairs": [
    { "term": "France", "definition": "Paris" },
    // max 24 pairs …
  ],
  "isPublic": false,
  "tags": ["geography", "europe"]
}

// 201 Created
{
  "id": "<uuid>",
  "ownerId": "<uuid>",
  "title": "Capital Cities",
  "cardCount": 16,
  "level": 1,
  "isPublic": false,
  "archived": false,
  "tags": ["geography", "europe"],
  "createdAt": "2025-10-14T12:45:00Z",
  "updatedAt": "2025-10-14T12:45:00Z",
  "pairs": [ { "id": "<uuid>", "term": "France", "definition": "Paris" } ]
}
```
Validation rules enforced server-side:
* `cardCount` ∈ {16, 24}
* number of `pairs` = `cardCount` / 2
* each `term` unique within board
* `level` auto-incremented per owner & title
* `tags` ≤ 10, each ≤ 20 chars

### 2.4 Pairs (sub-resource)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/boards/:boardId/pairs` | Add a new pair. Owner only. |
| PATCH | `/boards/:boardId/pairs/:pairId` | Edit term or definition. |
| DELETE | `/boards/:boardId/pairs/:pairId` | Remove pair. |

### 2.5 Scores

| Method | Path | Description |
|--------|------|-------------|
| POST | `/boards/:boardId/scores` | Submit completion time (ms). Upsert into `scores`. |
| GET | `/boards/:boardId/scores` | List best scores for board (leaderboard). Supports `page` / `pageSize`. |
| GET | `/users/me/scores` | List my best scores across boards. |

POST body:
```jsonc
{ "elapsedMs": 93400 }
```

Constraints:
* `elapsedMs` > 0
* Upsert keeps only best (lower) value.

### 2.6 AI

| Method | Path | Description |
|--------|------|-------------|
| POST | `/boards/generate` | Generate pairs from raw text ≤ 5 000 chars. Returns generated pairs for editing before board creation. Counts toward daily quota (50). |
| GET | `/ai/usage` | Return { remaining: number, resetAt: ISO-date }. Uses `daily_ai_usage` view. |

POST body example:
```jsonc
{
  "title": "Organic Chemistry Basics",
  "inputText": "Alkanes are hydrocarbons…",
  "cardCount": 24,
  "isPublic": false,
  "tags": ["chemistry", "organic"]
}
```
Success (200 OK): returns generated pairs array for editing before board creation.
```jsonc
{
  "pairs": [
    { "term": "Alkane", "definition": "Saturated hydrocarbon with single bonds" },
    // ... more pairs
  ],
  "requestId": "<uuid>"
}
```

### 2.7 Analytics (optional)

Events sent client-side directly to GA; no API routes required.

## 3. Authentication & Authorisation

1. **JWT Auth** – FE obtains JWT from Supabase Auth and sends it in `Authorization: Bearer <token>`.
2. **RLS** – Tables have policies mirroring business rules; API layer performs no extra row filtering beyond verifying JWT.
3. **Role Checks** – Endpoints verify `req.auth` vs table policies (e.g. writes allowed only for owner).
4. **Public Access** – Endpoints that list or fetch public boards permit anonymous access; write endpoints always require auth.

## 4. Validation & Business Logic

| Resource | Rule | Source |
|----------|------|--------|
| Board | `cardCount` ∈ (16, 24) | DB CHECK |
| Board | Unique (ownerId, title, level) | DB CONSTRAINT |
| Board | `tags` ≤ 10 & each ≤ 20 chars | DB CHECK |
| Pair | Unique (boardId, term) | DB CONSTRAINT |
| Score | `elapsedMs` > 0 | DB CHECK |
| AI | ≤ 50 requests / user / day | PRD §3.3 + view `daily_ai_usage` |

Server performs early validation and returns `422 Unprocessable Entity` on failure.

### Business Logic Flow Examples

1. **Generate Board via AI**
   1. Check daily quota in `daily_ai_usage` view.
   2. Insert row into `ai_requests` with status `pending`.
   3. Invoke OpenRouter AI; parse ≤ 24 pairs.
   4. Within single TX create board + pairs.
   5. Update `ai_requests.status` to `ok` & record tokens/cost.

2. **Submit Score**
   1. Validate JWT, ensure user is not board owner for self-practice edgecase.
   2. Upsert into `scores` (keep lower `elapsed_ms`).
   3. Refresh `best_scores` materialised view (ON COMMIT).

## 5. Pagination, Filtering & Sorting

* **Pagination** – `page` & `pageSize` (offset/limit); metadata returned `{ page, pageSize, total }`.
* **Filtering** – query params listed per endpoint; unknown params ignored.
* **Sorting** – `sort` & `direction` with whitelist of sortable fields.

## 6. Error Handling

| Code | Meaning |
|------|---------|
| 400 | Malformed input / validation failed |
| 401 | Missing or invalid JWT |
| 403 | Authenticated but not authorised (fails RLS) |
| 404 | Resource not found or not visible to caller |
| 409 | Conflict (duplicate title / term etc.) |
| 422 | Data valid JSON but violates business constraints |
| 429 | Rate limit or AI quota exceeded |
| 500 | Unhandled server error |

Errors return shape:
```jsonc
{
  "error": {
    "code": 409,
    "message": "Title already exists at this level",
    "details": { "field": "title" }
  }
}
```

## 7. Security & Performance Considerations

* **Rate Limiting** – 60 req/min/user; separate bucket for AI generation (50/day).
* **Input Sanitisation** – strip HTML, enforce UTF-8.
* **Compression** – Enable gzip / brotli.
* **Caching** – `GET /boards/:id` & leaderboard endpoints cache public responses (ETag, 60 s).
* **Index Usage** – API search & filters rely on indexes: `(is_public, archived, owner_id)` for list, `search_vector` GIN for full-text, GIN `tags`.
* **CORS** – Allow FE origins; deny others.
* **HTTPS** mandatory; HSTS 1 year.

---

This plan aligns with Astro 5 + React 19 FE, Supabase BaaS, and OpenRouter AI integration, covers CRUD + business endpoints, enforces validation & RLS, and meets PRD requirements.
