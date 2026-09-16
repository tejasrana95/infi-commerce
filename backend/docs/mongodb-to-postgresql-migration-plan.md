# Backend Migration Plan: MongoDB → PostgreSQL

**Scope:** `backend/` (Express + Mongoose) — migrate all data models, controllers, services, scripts, and backups from MongoDB to PostgreSQL using **Prisma ORM (v8, `@prisma/orm-postgres` driver)**.

**Status:** Planning. This document is the source of truth for sequencing and decisions.

---

## 1. Current State (verified)

| Area | Finding |
|------|---------|
| Models | ~55 domain models in `src/models/` + 7 log models in `src/models/logs/` |
| ODM | Mongoose 8; models define `I* extends Document` interfaces + schemas |
| DB connection | `src/config/database.ts` (mongoose.connect) + `src/config/logDatabase.ts` (separate `LOG_MONGODB_URI`) |
| Prisma | **Not installed.** Verified against `backend/package.json` and `node_modules`: there is no `prisma`, `@prisma/client`, or `@prisma/orm-postgres` entry, and no `schema.prisma` / `prisma.config.ts`. Earlier drafts of this document (and repo notes) claimed otherwise — that was incorrect. If Prisma is still the intended target, it must be added as a new dependency and re-evaluated against the driver-adapter approach below. |
| Prisma tooling | `postinstall: prisma skills sync`, `contract:emit: prisma contract emit` (Prisma VS Code extension "contract" workflow) |
| Placeholders | Empty dirs: `backend/prisma`, `backend/src/prisma`, `backend/src/db/postgres`, `backend/scripts/postgres` |
| Query patterns | `find/findOne/findById`, `.populate()` (47+ files), `.aggregate()` + `groupBy/group` pipelines, `startSession/withTransaction`, `.lean()` |
| Validation | `express-validator` `isMongoId()` + `new mongoose.Types.ObjectId()` in 55 files |
| Backup/restore | Shells out to `mongodump` / `mongorestore` (`src/services/mongodb-backup.service.ts`), plus `backup.service.ts` / `restore.service.ts` |
| Seed/migration scripts | `backend/scripts/seed.ts`, `src/scripts/*` (import-opencart, slug-registry, geo-indexes, etc.) |

---

## 2. Key Decisions (agree before starting)

1. **ORM:** Prisma v8 with the `@prisma/orm-postgres` driver adapter (already a dependency). Uses `prisma.config.ts` instead of the old `schema.prisma` datasource block for env/driver wiring.

2. **Primary keys:** keep IDs as **strings**, preserving the original 24-char Mongo `ObjectId` hex value (`@id @default(uuid())` overridden by the migration script which writes the old hex string as `id`).
   - **Why:** API responses and frontends already use Mongo IDs as strings. Preserving them avoids rewriting every reference and lets us migrate in dependency order without a giant ID remap.
   - Use `@default(cuid())` for *new* rows created after cutover.

3. **Embedded documents → JSONB vs. normalized tables:**
   - **JSONB** for read-only snapshots and rarely-joined data: order `items`, `shippingAddress`, `taxBreakdown`, `returns`, product `seo`, `dimensions`, `geoLimit`, `variants` (if treated as snapshots), settings payloads, layout JSON.
   - **Normalized tables** for anything we filter, sort, join, or aggregate on: `product↔category`, `product↔attribute/specification`, `order↔coupon`, `user.storeIds`, `product.categoryIds`, `category.parentCategory`, `geo.parentId`, cart `items.productId`.

4. **Arrays of `ObjectId` refs** → explicit many-to-many join tables where used in `$in` filters (categories, stores, geo groups); keep as `String[]` JSONB only where never queried.

5. **Logs:** DONE — the 7 log models were removed and the logging subsystem now runs on a **dedicated PostgreSQL server** (`logs` schema, monthly `created_at` range partitions). This was split out as an independent first migration because logs already used a separate connection (`LOG_DATABASE_URL`), so the cutover does not touch domain models or `.populate()` usage. See `backend/scripts/postgres/logs/*.sql` and section 7 below. The remaining ~55 domain models still follow the phases below.

6. **Dual-run / rollback:** keep MongoDB fully operational until the final cutover. Run Postgres as a parallel write in staging; Mongo remains the rollback source in production.

---

## 3. Target Folder Layout

```
backend/
  prisma.config.ts                       # Prisma v8 config (env, driver adapter, seed)
  prisma/
    schema.prisma                        # all models (grows module-by-module)
    migrations/                          # generated
  src/
    prisma/
      client.ts                          # singleton PrismaClient (+ event handlers)
      transaction.ts                     # helper for interactive transactions
    repositories/                        # (optional) per-module data-access layer
      category.repo.ts
      product.repo.ts
      ...
    scripts/
      migrate-mongo-to-postgres/
        run.ts                           # orchestrator
        lib/mongo.ts                     # raw mongodb driver client
        lib/pg.ts                        # Prisma client
        lib/common.ts                    # type coercion, id mapping, JSONB helpers
        modules/
          users.ts
          categories.ts
          products.ts
          orders.ts
          ...
        verify.ts                        # count + sample-integrity checks
```

---

## 4. Phase 0 — Prisma & Postgres Foundation

**Goal:** a working Prisma client + empty Postgres that the app can connect to, without touching Mongo.

1. Add env vars to `src/config/index.ts` + `.env.example`:
   - `DATABASE_URL` (Postgres connection string, e.g. `postgresql://user:pass@localhost:5432/infi_commerce`)
   - `DIRECT_URL` (unpooled, used by migrations) — or rely on `DATABASE_URL` for dev.
2. Create `prisma.config.ts` (Prisma v8) wiring the `@prisma/orm-postgres` driver adapter.
3. Create minimal `prisma/schema.prisma` with generator + datasource (no models yet).
4. `docker-compose.yml` (or `backend/scripts/postgres/`) with a local Postgres 16 container for dev.
5. `npm run prisma generate` → `src/prisma/client.ts` singleton.
6. Add a `/health` check that pings Postgres alongside Mongo.
7. Verify `prisma contract emit` still works (it drives the VS Code contract workflow).

**Exit criteria:** `DATABASE_URL` configured, Prisma client generates, app boots and reports Postgres reachable.

---

## 5. Phase 1 — Schema Design + Data Migration Script

**Goal:** a complete, idempotent Mongo→Postgres ETL that can be run repeatedly in staging.

### 5.1 Schema authoring order (parents first)

Group models into dependency tiers; add them to `schema.prisma` in this order so migrations and ETL both respect foreign keys:

| Tier | Models |
|------|--------|
| **T0 — Global reference** | `Settings`, `Currencies`, `Geos`, `GeoGroups`, `TaxRates`, `Stores`, `Users`, `ApiKeys`, `PaymentGatewayConfigs`, `Files`, `SlugRegistries` |
| **T1 — Catalog primitives** | `Attributes`, `ProductOptions`, `Brands`, `Categories`, `Products` (products last — depends on category/brand/tax/attribute) |
| **T2 — Content & design** | `Banners`, `BannerSliders`, `HeroBanners`, `HeroSliders`, `BlogCategories`, `BlogPosts`, `Pages`, `Layouts`, `HeaderLayouts`, `FooterLayouts`, `Menus`, `Themes`, `Testimonials`, `BrandShowcases`, `ContentCardCategories`, `ContentCards`, `Forms`, `FormSubmissions`, `NewsletterSubscribers`, `Redirections` |
| **T3 — Commerce** | `Coupons`, `Carts`, `Orders`, `OrderAccountings`, `Sales`, `ReturnRequests`, `ShippingRules`, `Reviews` |
| **T4 — POS** | `POSHoldOrders` (`POSHeldOrder`), `POSSessions` (`POSSession`) |
| **T5 — Comms / misc** | `Notifications`, `NotificationTemplates`, `NotificationQueues`, `ChatHistory` (model `ChatHistory`), `UserInterests` |

### 5.2 ETL script requirements

- Read via the **raw `mongodb` driver** (bypass Mongoose hooks/middleware — avoids double-side-effects during migration).
- Write via Prisma, **one model per file** under `src/scripts/migrate-mongo-to-postgres/modules/`, orchestrated by `run.ts`.
- **ID preservation:** `id = doc._id.toHexString()`.
- **Type coercion:** Mongo `Decimal128` → `Decimal`, `Date` → `DateTime`, `ObjectId` → `String`, `Map` → `Json`.
- **Embedded docs** → `JSON.parse(JSON.stringify(...))` into JSONB columns.
- **Array-of-refs** → insert join-table rows.
- **Idempotent:** `upsert` on `id`; safe to re-run.
- **Resumable:** process in batches (`skip`/`limit` or cursor), log progress, skip already-migrated IDs.
- **Order:** follow the tiers above (foreign keys must exist first).
- **Verification:** `verify.ts` compares per-collection counts (Mongo `countDocuments` vs Prisma `count`) and samples joins (e.g., every `order.storeId` exists in `stores`).

**Exit criteria:** ETL runs clean on a staging Mongo dump; row counts match; FK integrity verified.

---

## 6. Phase 2 — Module-by-Module App Migration (the "one by one" work)

For **each** model, execute the same recipe. Do simple non-relational modules first, complex ones last (see §6.2).

### 6.1 Per-module recipe

1. **Schema:** add the Prisma model (+ relations) → `prisma migrate dev --name add_<model>`.
2. **Data access:** add repository functions (or keep direct Prisma calls) in `src/repositories/<model>.repo.ts`; expose the same operations the controller used (`find`, `findById`, `findOne`, `create`, `update`, `delete`, `count`, `aggregate` equivalents).
3. **Controller rewrite:**
   - `Model.find(filter)` → `prisma.<model>.findMany({ where, include, orderBy, skip, take })`.
   - `Model.findById(id)` → `findUnique({ where: { id } })`.
   - `.populate('x', 'a b')` → `include: { x: { select: { a: true, b: true } } }`.
   - `.lean()` docs → plain Prisma result objects (already plain).
   - `.select()` → `select`.
   - `.sort()` → `orderBy`.
   - `new mongoose.Types.ObjectId(id)` → `id` (string); `$in` arrays → `{ in: ids }`.
   - Aggregation pipelines (`$match/$group/$lookup/$unwind/$facet`) → Prisma `groupBy`/`aggregate` or `$queryRaw` SQL. Dashboard/revenue/stats queries are the main hotspots (`dashboard.controller.ts`, `review.controller.ts`, `notification.service.ts`, `restore.service.ts`, `blog.controller.ts`).
4. **Validation:** replace `isMongoId()` with `isUUID()` (or `isString().isLength({min:1,max:64})`) and update the shared validators.
5. **Services:** update every service that touches the model (e.g., `slug.service.ts`, `shipping-calculator.service.ts`, `accounting.service.ts`, `barcode.service.ts`, `google-merchant.service.ts`, `pos.service.ts`).
6. **Transactions:** `session.withTransaction(...)` → `prisma.$transaction(async (tx) => {...})` (checkout, order placement, accounting, POS sessions).
7. **Tests:** update Jest/supertest fixtures; run `npm run test:contracts`.
8. **Smoke test:** exercise the module's endpoints via Swagger/curl against the dev Postgres.

### 6.2 Sequencing (simple → complex)

Follow the user's ordering, grouped for efficiency:

1. **Wave 1 — non-relational & read-mostly:** `apikeys`, `currencies`, `settings`, `files`, `pages`, `testimonials`, `newslettersubscribers`, `redirections`, `themes`, `notificationtemplates`.
2. **Wave 2 — catalog primitives (reference data):** `attributes`, `productoptions`, `brands`, `categories`, `taxrates`, `shippingrules`, `geos`, `geogroups`.
3. **Wave 3 — content & design:** `banners`, `bannersliders`, `herobanners`, `herosliders`, `blogcategories`, `blogposts`, `contentcardcategories`, `contentcards`, `forms`, `formsubmissions`, `layouts`, `headerlayouts`, `footerlayouts`, `menus`, `brandshowcases`.
4. **Wave 4 — core entities:** `stores`, `users`, `customers`, `paymentgatewayconfigs`, `slugregistries`, `carts`.
5. **Wave 5 — commerce transactions:** `coupons`, `orders`, `sales`, `orderaccountings`, `returnrequests`, `reviews`.
6. **Wave 6 — complex/relational (highest risk, do last):**
   - **Products** + variants + `productoptions`/`attributes`/`specifications` + `categoryIds` + `taxClassId` + `brand` (many joins, aggregation-heavy `product.controller.ts`).
   - **Orders** + `items` JSONB + `taxBreakdown` + `returns` + `OrderAccounting` + `ReturnRequest` links (transactions, money math).
   - **POS** (`possessions` → `POSSession`, `posholders` → `POSHeldOrder`) + `pos.service.ts` / `pos.controller.ts` sessions.
7. **Wave 7 — comms:** `notifications`, `notificationqueues`, `chat`/`chathistories`, `userinterests`.

---

## 7. Phase 3 — Cross-cutting Concerns

| Concern | Action |
|---------|--------|
| Auth middleware | `src/middleware/auth.ts` loads `User`/`Customer` — switch to Prisma; ensure `req.user` shape (id as string) is preserved. |
| Channel middleware | `src/middleware/channel.middleware.ts` — update any store lookups. |
| Activity/API logger | `src/middleware/activityLogger.middleware.ts` writes to log models on the **separate** log DB. Keep on Mongo initially (see §2 decision 5). |
| Cache service | `redis`/`memcached` keyed by IDs — verify no Mongo-specific key format; IDs stay strings so keys remain valid. |
| Events | `src/events/handlers` — update any model access. |
| Backup/restore | Replace `mongodump/mongorestore` flow with `pg_dump`/`pg_restore`; rewrite `mongodb-backup.service.ts`, `backup.service.ts`, `restore.service.ts`. |
| Seed & scripts | Port `backend/scripts/seed.ts`, `src/scripts/import-opencart.ts`, `migration-slug-registry.ts`, `migrate-geo-indexes.ts`, `migrate-pos-payment-settings.ts` to Prisma. |
| Swagger | `swagger-spec.json` / JSDoc — update `example` IDs from ObjectId format to uuid/cuid format (cosmetic only). |

---

## 8. Phase 4 — Cutover & Rollback

1. **Staging:** run ETL on a recent production Mongo dump; run `verify.ts`; run full contract tests against Postgres.
2. **Dual-write (optional):** during a soak window, write to both Mongo and Postgres behind a feature flag (`DB_ENGINE=mongo|postgres|dual`) to compare behavior with zero read impact.
3. **Read cutover:** point `DB_ENGINE=postgres` in staging → QA pass.
4. **Production cutover:**
   - Freeze writes (brief maintenance window).
   - Run final incremental ETL.
   - Flip `DB_ENGINE=postgres`, deploy, smoke test.
5. **Rollback:** `DB_ENGINE=mongo` flag instantly reverts reads/writes to Mongo (Mongo kept until Postgres has run clean for N days).
6. **Post-cutover:** monitor latency on heavy queries (product list, dashboard revenue aggregation, checkout), add Postgres indexes for the filters/orderBy that were previously `$in`/sort.

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Aggregation pipelines (`$group/$lookup/$facet`) don't map 1:1 to Prisma | Use `groupBy` where possible, else `$queryRaw` SQL; write equivalent SQL for dashboard/revenue/stats queries first. |
| `.populate()` deep nesting changes response shape | Map to `include` with `select`; snapshot API responses in staging and diff against Mongo. |
| ObjectId → string ID type errors across 55 files | Preserve IDs as strings; use a shared `ID` type; fix TypeScript compile errors file-by-file (compile gates each wave). |
| Transaction semantics differ (Mongo sessions vs SQL transactions) | Port each `withTransaction` to `prisma.$transaction` interactively; test checkout/accounting/POS heavily. |
| JSONB vs normalized over/under-modeling | Decide per-field using §2 rule 3; revisit during Wave 6. |
| Money math (`Decimal128` vs `Decimal`) | Normalize to Prisma `Decimal` (or integer cents); add accounting tests. |
| Backup/restore regression | Implement `pg_dump` flow before cutover; test restore in staging. |
| Long tail of scripts (import-opencart, seeds) | List them all (§7) and port in Phase 3; don't leave Mongo-only scripts in the repo. |

---

## 10. Suggested Milestone Checklist

- [ ] Phase 0: Prisma client + Postgres connect in dev
- [ ] Phase 1: full `schema.prisma` + ETL + verify script
- [ ] Wave 1–2 modules migrated (non-relational + catalog reference data)
- [ ] Wave 3–4 modules migrated (content + core entities)
- [ ] Wave 5–6 modules migrated (commerce + products/orders/accounting/POS)
- [ ] Wave 7 modules migrated (comms)
- [ ] Phase 3: auth, cache, events, backup/restore, seed/scripts
- [ ] Phase 4: staging ETL + contract tests green on Postgres
- [ ] Production cutover + rollback flag verified
- [ ] Remove Mongoose models/deps + Mongo connection code (post-soak cleanup)

---

## 11. Open Questions (confirm with team)

1. **ID strategy:** preserve 24-hex ObjectId strings (recommended) vs. migrate to UUIDs with a remap table? (Preserving is much less invasive.)
2. ~~**Logs DB:** migrate the 7 log models to Postgres too, or leave on Mongo indefinitely?~~ **RESOLVED** — migrated to a dedicated PostgreSQL server. See section 12.
3. **Products variants:** model `variants` as a normalized `ProductVariant` table (queryable) or keep as JSONB snapshot?
4. **Money:** store as `Decimal` (Prisma) or integer minor units?
5. **Dual-write:** worth the extra engineering for zero-downtime cutover, or is a short maintenance window acceptable?

---

## 12. Logs Subsystem Migration (COMPLETE)

Migrated ahead of the domain models because logs already used a separate
connection, so the cutover was self-contained and did not touch `.populate()`,
`ObjectId` casting, or the ~55 domain models.

### Architecture

| Concern | Location |
|---------|----------|
| Schema, partitioned tables, indexes, partition functions | `scripts/postgres/logs/001_logs_schema.sql` |
| 15-minute rollup tables + `refresh_rollups()` | `scripts/postgres/logs/002_logs_rollups.sql` |
| Connection pool (`LOG_DATABASE_URL`) | `src/db/postgres/logsClient.ts` |
| Partition lifecycle + retention | `src/db/postgres/logsPartitions.ts` |
| Bulk insert + query layer | `src/repositories/logRepository.ts` |
| Dashboard analytics | `src/repositories/logAnalytics.repository.ts` |
| Scheduler (rollups + partitions + retention) | `src/services/log-maintenance.service.ts` |
| Schema applier | `scripts/postgres/apply-logs-schema.ts` |
| Historical backfill | `scripts/postgres/backfill-logs-from-mongo.ts` |
| End-to-end smoke test (71 assertions) | `scripts/postgres/smoke-test-logs.ts` |

The 7 Mongoose log models under `src/models/logs/` were deleted.

### Decisions and rationale

1. **`pg` (node-postgres), not Prisma, for this subsystem.** Prisma cannot express
   declarative `PARTITION BY RANGE`, so raw DDL was required regardless; Prisma
   allows only one datasource per schema file while logs live on a *separate*
   server; and multi-row `INSERT` outperforms Prisma's `createMany` for this
   write pattern. Data access is behind `logRepository.ts`, so swapping to Prisma
   later means reimplementing one file only.
2. **Partition by `created_at`, monthly.** Retention becomes `DROP PARTITION` —
   O(1) metadata work instead of a TTL delete loop competing with ingestion.
   Every table also has a `*_default` partition so an out-of-range timestamp can
   never fail an insert.
3. **Primary key is `(id, created_at)`** because PostgreSQL requires the
   partition key in the PK. `id` is TEXT holding the original 24-char ObjectId
   hex (or a fresh one), so `_id` in API responses is byte-identical and **no
   frontend change was needed**.
4. **No `CHECK` constraints on enum-like columns.** Log ingestion must never
   fail on an unexpected value; a rejected row would vanish behind the queue's
   error handling. Values are coerced defensively in the repository instead.
5. **Index count dropped from ~20 per collection to the set actually queried**,
   using partial indexes for the long tail (errors, slow requests, non-null
   actor). Over-indexing was the main storage-growth driver before.
6. **15-minute rollup buckets**, not hourly. Hourly UTC buckets mis-slice trend
   charts for half-hour offsets (Asia/Kolkata, +05:30 — relevant given
   Razorpay/INR). 15-minute buckets align with every real UTC offset, so they sum
   exactly into local hours, matching the previous `$dateToString` behaviour.
7. **Retention is opt-in** (`LOG_RETENTION_ENABLED`, default `false`) because
   dropping partitions is irreversible and the compliance window is not yet
   decided. The scheduler creates partitions regardless.

### Verification performed

Against a throwaway PostgreSQL 14.16 instance, plus a real backfill from the local
Mongo log cluster:

- `smoke-test-logs.ts`: **71/71 assertions pass** — inserts of all 6 log types,
  response-shape parity (incl. `_id`), sparse-key behaviour, filter translation,
  SQL-injection safety, keyset pagination, rollups, dashboard shape, timezone
  bucketing, default-partition routing **and** relocation, and partition retention.
- Real backfill: 1,809 API + 103 activity + 45 audit + 12 security + 7 search rows
  migrated, **0 rows left in catch-all default partitions**.
- `tsc --noEmit` clean; `npm run build` clean.

### Bugs found and fixed during verification

1. **Bulk insert column/value misalignment.** Row builders emit
   `[...columnValues, id, createdAt]` but the INSERT column list was
   `['id','created_at', ...columns]`, so values were bound to the wrong columns
   (e.g. `session_id` into `created_at`). *Every log write would have failed.*
2. **`refresh_rollups` snapped `p_to` downward**, excluding the in-progress
   bucket and leaving the dashboard permanently up to 15 minutes stale.
3. **Backfill wrote history into the default partition** because partitions did
   not exist for the historical range. Fixed with `logs.ensure_partitions_range()`
   called before insert.
4. **`partition_health()` counted partition indexes as partitions** (69 instead
   of 4) — index relkinds had to be excluded.
5. **Archive export loaded whole date ranges into memory** (`find().lean()`),
   and its CSV derived headers from `Object.keys(rows[0])` with `JSON.stringify`
   escaping. Now keyset-streamed with fixed schema headers and RFC4180 quoting.

### Operational runbook

```bash
# one-time
npm run logs:apply-schema          # creates schema, tables, indexes, partitions
npm run logs:backfill              # copies history (add --dry-run first)
                                   # ...and refreshes rollups for the migrated range

# optional: verify on a throwaway database before trusting a deployment
npm run logs:smoke-test            # refuses to run if the DB already has log data

# cron (or rely on the in-process scheduler, LOG_MAINTENANCE_ENABLED)
npm run logs:ensure-partitions     # hourly; add --retention once compliance is set
```

### Deferred (not done, still recommended)

- **Payload size cap.** `sanitizePayload()` still stores request bodies in full
  with no truncation, so one large upload can still add megabytes per row. This
  is now the single largest remaining growth driver.
- **Filtering of noisy routes.** Every GET/health/static request still produces
  an `ApiLog` row.
- **Dual-write during cutover.** Cutover is currently backfill-then-switch;
  consider brief dual-write if losing in-flight logs during the switch matters.
- **`pg_trgm` indexes** for the free-text `searchKeyword` filter (currently
  `ILIKE`, same as the old unindexed `$regex`).

