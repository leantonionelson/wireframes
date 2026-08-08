# Scaffolds — implementation plan

The working translation of the [technical blueprint v1.0](docs/blueprint-v1.md) into ordered, buildable work. The blueprint describes the end-state (a semantic control layer: intent, architecture, content, components, SEO, accessibility, analytics and live performance as one coherent model); this document decides what gets built, in what order, and what each step actually touches in this codebase.

Two boundaries the blueprint sets, kept here deliberately:

1. **Near-term target is "complete planning source of truth", not a CMS.** Content operation, live analytics and the digital twin come after the planning model is rich enough to make those signals meaningful.
2. **The AI comes last, not first.** Deterministic surfaces (domains, relationships, rules) get built before any internal reasoner. External AI via the Markdown round trip already works and stays the primary reasoning partner throughout.

Sizing is relative: **S** = a session, **M** = a few sessions, **L** = a sustained effort. No dates; the phases are strictly ordered but items inside a phase can interleave.

---

## Where the code is today

~3k lines. One plain-JSON `Doc` per project ([lib/model.ts](lib/model.ts)), revision-checked writes through a storage adapter ([lib/store.ts](lib/store.ts), Neon Postgres or local files), two write paths (gated `PUT /api/doc`, open `POST /api/annotate`), 4-second polling, single-password auth, and an identity-first Markdown round trip ([lib/md.ts](lib/md.ts), `scaffolds-md/1`) with review-before-apply. [components/Editor.tsx](components/Editor.tsx) holds the entire canvas UI in one ~1,600-line file.

What the blueprint calls the strengths to preserve are real and load-bearing: plain JSON as truth, stable ids across AI round trips, no AI in the critical path, the storage abstraction, explicit revisions, and notes-as-rationale.

Known gaps, from [DEVELOPMENT.md](DEVELOPMENT.md): no tenancy of any kind (`GET /api/projects` is ungated), no tests, desktop-only layout, and every richer domain (SEO, content, components, tokens, analytics, accessibility) does not exist yet.

---

## Phase 0 — Stabilise the core

*Blueprint §27 phase 0, §29 steps 1–2. Everything later leans on this.*

### 0.1 Test harness and Markdown golden files — **S**, first — ✅ done

Landed on this branch: vitest, 19 tests in `tests/md.test.ts` against a frozen EY fixture (enriched with comments/notes/members so preservation is actually exercised), a golden file of the export at `tests/golden/`, and a GitHub Action running typecheck + tests on push/PR. Covers identity, annotation preservation, edit reporting, absent-vs-`(none)` field semantics, structural surgery, journey-step integrity, truncation, malformed input, unknown ids/glyphs/roles, escape round-trips, and both create-mode paths.

### 0.2 `schemaVersion` and versioned migrations — **S** — ✅ done

`lib/migrations.ts` holds pure `v(n)→v(n+1)` functions; `migrateDoc` runs the chain at boundaries and `normDoc` is its alias, so no caller changed. New docs are stamped at creation. Tested: v0 lift, idempotence, pass-through, no-collateral-damage.

### 0.3 Repository interfaces — **S** — ✅ done

`lib/repositories/interfaces.ts` defines `ProjectRepository`/`VersionRepository` (whole-doc semantics, revision-checked `save`); implementations moved to `postgres.ts` and `file.ts` unchanged; `lib/store.ts` is now a thin façade. `tests/repository.test.ts` is the contract suite (seven cases including stale-rev conflict and missing-project save) — the Firestore implementation must pass it against the emulator in 1.2.

### 0.4 Split Editor.tsx — **M** — ✅ done

1,615 lines became a 548-line orchestrator plus 13 modules under `components/editor/`: `useDoc` (load/poll/save/undo/mutate/annotate transport), `PageCard`, `FloatingToolbar`, `Inspector`, `DetailModal`, `NotesLayer`, `Journeys` (modal + board + overlay), `HistoryPanel`, `ExportMenu`, `People`, `IntentPicker`, `icons`, `types`. Code moved verbatim; verified live: selection, floating toolbar, inspector, detail modal, journeys, history, export menu, notes mode, and a save→undo round trip through the hook.

### 0.5 Mobile projection — **M** — ✅ done

Below 768px the canvas is replaced by `components/editor/MobileSitemap.tsx`: an expandable hierarchy list (block counts, flag badges, comment/note counts, block-colour spines), with the detail view full-screen as the page surface and the mini-stack sidebar hidden. Canvas-only chrome (notes pins/mode, zoom, intent legend, floating toolbar, cursor badge, PNG export) mounts only on desktop, so element ids stay unique. Pinned notes surface as row counts on mobile since they anchor to canvas geometry. Tablet and desktop are unchanged. Covered by the mobile e2e flow.

### 0.6 Critical-flow UI tests — **S** — ✅ done

Playwright (`e2e/critical-flows.spec.ts`, `npm run test:e2e`): create project → add block → rename in inspector → export md → import an edited copy through the review list → apply → undo → verify on disk → purge. Runs its own dev server on port 3100 with auth disabled, so it never touches a normal dev session; CI runs it as a second job with failure artifacts. The mobile-navigation flow gets added with 0.5.

### 0.7 Small hardenings — **S** — ✅ done

`lib/limits.ts`: 2 MB cap on `applyMarkdown` input (refused before parsing, tested), 10k-char bound on annotation text (413), best-effort per-IP sliding-window rate limit on `/api/annotate` (429, verified live), and a `SCAFFOLD_PRIVATE_LISTING` env flag that hides the project list from non-editors until phase-1 tenancy replaces it.

---

## Phase 1 — Platform foundation

*Blueprint §10–§12, §27 phase 1. Prototype auth/storage becomes a durable multi-user platform.*

### 1.1 Firebase Auth + organisations, projects, roles — **L**

- Firebase Auth for identity (email link + Google to start; SSO stays possible later via Identity Platform).
- New entities: `Organisation`, `Membership { userId, orgId, role }`; projects gain `orgId`. Roles per blueprint §11: owner / admin / editor / contributor / reviewer / viewer / external-viewer — but **implement owner, editor, viewer first**; the rest are additive claims checks.
- Server-side enforcement in API routes from day one (verify the Firebase token, check membership); the single-password gate remains as a fallback behind a flag until cut-over, then is removed along with the HMAC cookie.
- Share links become explicit share records (token-scoped read access), replacing guessable-URL-as-permission.
- Immutable audit entries for permission and publish-ish changes (`lib/audit.ts`, append-only).

This closes the tenancy gap that DEVELOPMENT.md calls the blocker for any paid or multi-client use, and it matches the business direction (invite-only, per-workspace).

### 1.2 Firestore repository behind a flag — **L**

- Third implementation of the phase-0 interfaces. Per blueprint §10.3, the doc splits into subcollections (`pages`, `relationships`, `versions`, …) with an exportable aggregate — but **the split happens at the repository boundary**: the app keeps reading/writing a whole `Doc` until selective reads are actually needed. The single-doc revision check is what makes concurrency safe today; per-entity revisions arrive only with transactional writes to back them.
- Migration script: current JSON → subcollection shape; validate by aggregate-export equality against the source (the deep-equal test from 0.1 is the tool).
- Dual-read/shadow validation window, then switch writes. Neon implementation stays in-tree as `legacy/` until two stable releases pass.
- Complete-JSON and Markdown export remain the disaster-recovery path, permanently.

### 1.3 Realtime — **M**

- Firestore snapshot subscriptions replace the 4-second poll in `useDoc`.
- Presence via a separate ephemeral channel (Realtime Database), never the document — the blueprint and DEVELOPMENT.md agree on this. Live cursors ride on this later; `CursorBadge` is most of the rendering already.

### 1.4 Asset library — **M**

- `Asset` entity per blueprint §12; direct signed upload to Cloud Storage, async derivative generation in a Function, usage tracking (`usageRefs` to pages/blocks/notes).
- The two traps already recorded for this work: bucket CORS must be set or `html-to-image` PNG export silently drops images, and Storage security rules are separate from Firestore rules.
- Alt-text and rights fields exist from the start (accessibility domain will lean on them).

---

## Phase 2 — Rich planning model

*Blueprint §14–§20, §27 phase 2. Scaffolds becomes the complete planning source of truth. This is the phase that most changes what the product is.*

Every domain here follows the blueprint's definition-of-done checklist (§28): versioned schema, repository support, md representation where portable, permission policy, relationship hooks, validation, UI + mobile behaviour, audit, tests, an explicit AI policy, and observability. Domains land one at a time, each ending in a `scaffolds-md/2+` additive section — **never a change to existing page/block semantics**.

Order chosen by immediate consulting value and dependency:

### 2.1 Component inventory — **M**

Blocks already carry a free-text `component` string ("AEM: Promotional Banner"); promote it to an entity.

- `Component { id, name, sourceSystem, variants[], supportedBlockTypes[], status, … }`; block `componentRef` alongside the legacy string (migration maps exact matches, flags the rest).
- Components view: inventory, coverage (which blocks map to nothing), gap list. This directly serves the existing EY-style deliverable — the red-flagged "custom component" blocks become queryable.

### 2.2 Content requirements — **M**

- `ContentRequirement { id, blockId, type, purpose, fields[], status, owner? }` — what a block needs before copy exists. Deliberately *not* content items/instances yet; that is phase 7 (CMS) territory per the near-term boundary.
- Content view: requirements by page, by status, by owner.

### 2.3 SEO planning — **M**

- `SearchIntent` + `SeoPageSpec` per blueprint §14; pages gain `slug` (needed here anyway).
- SEO view: intent→page mapping with collision/gap detection, metadata planning, indexation strategy. No Search Console connection yet (phase 8).

### 2.4 Brand / design tokens — **M**

- `DesignSystem` schema per §15; manual editor first, W3C DTCG-compatible JSON import second.
- `globals.css` already has the shape to emit; the token editor feeds both the app theme preview and, later, the context compiler.

### 2.5 Analytics measurement plan — **M**

- `MetricDefinition`, `EventDefinition`, `Funnel { journeyRef, … }` — journeys already exist and become the funnel skeletons. Export as a GA4/GTM measurement plan. No data ingestion yet.

### 2.6 Accessibility requirements — **S–M**

- `AccessibilityRequirement` per §18. Seeded deterministically from block glyphs (video → captions/transcript; form → labels/errors/keyboard; carousel → controls/pause) — these are the first rules in the codebase, hard-coded here and generalised in phase 3.

### 2.7 Technical spec & integrations — **S–M**

- `TechnicalSpec` + `Integration` entities per §20. The `external` page flag and the SuccessFactors card in the EY project are the seeds. Integration change propagation ("Workday → SuccessFactors touches what?") is the phase-3 demo case.

### 2.8 Markdown protocol v2 — **S per domain, ongoing**

- `scaffolds-md/2`: version marker already in the export header; parser accepts v1 files forever. New domain sections are additive; unknown sections round-trip unparsed rather than being dropped, for forwards compatibility.
- Golden files per domain section from day one.

---

## Phase 3 — Dependency graph and deterministic rules

*Blueprint §5.4, §8, Appendix B, §27 phase 3. The domains become coherent instead of parallel.*

- **Relationship as a first-class entity** — `{ sourceRef, targetRef, type, strength, origin, confidence, evidenceRefs[] }`, stored queryably (own subcollection), never buried in nested objects. "What depends on this?" becomes a query.
- **Deterministic rules engine** — JSON predicate rules per Appendix B (`when` field predicates → `ensure`/`suggest` consequences), versioned, scoped (careers/ecommerce/corporate). The phase-2.6 hard-coded accessibility rules migrate in as the first curated rules.
- **Change-set evaluator** — on import or edit, evaluate rules against the diff and present "what else might this affect" as a preview, reusing the import-review UI pattern (typed change list, selective acceptance, undoable). Rules only; no model.
- **Health view** — missing required fields, unresolved dependencies, stale relationships, contradictions, counted by strength class. Explicitly not a single percentage.

The import pipeline ordering from §7.2 is enforced here: parse → validate → review → apply → *then* rule analysis. Dependency reasoning never blocks or edits an import.

---

## Phase 4 — Internal reasoner

*Blueprint §8, §24.2, §27 phase 4. Only for what rules cannot express.*

- **Model gateway** as an adapter (`integrations/ai/`): provider-agnostic, explicit routing, context assembled per-task, provider/model/version + context hash recorded per inference. The app must remain fully usable with the gateway disabled.
- **Confidence policy** per §8.6: deterministic → no model call; high-confidence learned rule → quiet suggestion; medium → recommendation requiring action; low/novel → model, never auto-applied; high-impact domains → raised thresholds.
- **Inference cards**: consequence, affected entities, reason, confidence, provenance; accept all / accept selected / reject / add context. Accepted and rejected proposals are recorded as `Evidence`, feeding rule confidence.
- **Contextual discussion**, inference-scoped, not a global chatbot.
- Reasoning evaluation suite (known change scenarios, precision/recall, false-positive budget) is part of the definition of done, not an afterthought.

Hard boundaries, from §8.3, enforced structurally: the model never touches Markdown parsing, ids, referential integrity, permissions, version history, or bulk mutation. Structured output schemas only.

---

## Phase 5+ — Sketched, deliberately not planned in detail

Each of these gets its own plan when its predecessor phase is real:

- **Knowledge bootstrap (§9):** ingest the historical corpus (audits, wireframes, recommendations in Drive), extract candidate relationships, human-review into the rule registry. Retrieval + graph + rules; no fine-tuning unless a specific reasoning task stays expensive after the structured system matures.
- **Context compiler (§21):** task-scoped export packs (`/scaffolds-context` with per-page/per-component md + JSON data + AGENTS.md). The md emitter already walks the whole tree; this is a third `Mode` plus filtering, and it is the "coding-agent export" item DEVELOPMENT.md already ranks highest-value.
- **CMS / content operation (§16):** adapters first (Contentful/Sanity/AEM), native content items only if demand appears. Publishing always behind explicit approval.
- **Observed state (§19, §22):** GA4/Search Console/CWV/a11y-scan adapters mapping observations onto planned definitions; planned-vs-observed views; the coherence loop.

---

## Cross-cutting decisions (adopted from the blueprint's decision log)

| Decision | Consequence here |
|---|---|
| External AI stays the broad reasoning partner | The md round trip is a permanent API surface; protocol versioning and golden files are non-negotiable |
| No internal AI in md import | The parser/schema layer owns correctness; keep it deterministic forever |
| Internal AI only below rule-confidence threshold | Rules engine (phase 3) must exist before the reasoner (phase 4) |
| Firebase for auth/data/storage, behind interfaces | Phase 0.3 interfaces are the migration mechanism; no vendor import above the repository boundary |
| Mobile is a projection, not a shrink | Phase 0.5 ships a second layout, not responsive tweaks |
| CMS later | Phase 2 stores requirements, not content instances |
| Analytics after measurement semantics | Phase 2.5 plans; phase 8 connects |

## Risks worth naming now

- **Firestore split vs. the concurrency model.** The single-doc `rev` check is what makes collaborative editing safe without a CRDT. Splitting into subcollections trades that for transactions. Mitigation: keep whole-doc semantics at the repository boundary (1.2) until per-entity writes are genuinely needed, and require the aggregate-equality test to pass throughout.
- **Editor.tsx split regressions.** The three recorded traps are exactly the kind of thing a refactor reintroduces. Mitigation: 0.6 Playwright flows before 0.4 lands on main.
- **Domain sprawl.** Phase 2 is seven domains; each is individually small but collectively they can stall. Mitigation: strict one-domain-at-a-time landing, each fully done (checklist) before the next starts, order re-evaluated after 2.1.
- **Auth cut-over.** Rotating from shared-password to Firebase Auth logs everyone out and changes the sharing model. Mitigation: flag-gated parallel running (1.1), share-record links before the old links stop working.

## Immediate next steps

1. **0.1 test harness** — the only step with no dependencies and the one that protects all the others.
2. **0.2 schemaVersion + 0.3 repository interfaces** — small, and they unblock phase 1 planning.
3. **0.4 Editor split**, then **0.5 mobile projection** on the clean structure.
4. Re-evaluate phase 1 (Firebase) commitment once 0.x is green — it is the largest irreversible-ish decision in the plan and deserves its own go/no-go with the migration script already prototyped.
