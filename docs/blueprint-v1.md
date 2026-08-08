# Scaffolds — Technical blueprint v1.0 (reference extraction)

> Plain-text extraction of `Scaffolds_Technical_Blueprint_and_Roadmap.docx` (v1.0, 8 August 2026) so the blueprint is readable in-repo. Tables are flattened by the extraction; the docx is the authoritative copy. The actionable version of this document is [IMPLEMENTATION.md](../IMPLEMENTATION.md).

Scaffolds
Technical blueprint, target architecture and eventual roadmap
Version 1.0 • 8 August 2026
Product: scaffolds.design
Repository baseline: leantonionelson/wireframes
North-star definitionScaffolds is the semantic control layer for a website: the place where intent, architecture, content, components, design, SEO, accessibility, analytics, technical dependencies and live performance become one coherent model.
This document defines how to evolve the existing working application into that end-state while preserving its strongest current property: a simple, deterministic, model-agnostic project format that can be handed to any external AI and imported back without making Scaffolds dependent on that AI.
# Contents
1. Executive summary
2. Current product and codebase baseline
3. Architectural principles
4. Target product model
5. Core domain model
6. Views and interaction architecture
7. Markdown interchange and external AI workflow
8. Internal reasoning, rules and knowledge graph
9. Historical corpus ingestion and pattern crystallisation
10. Firebase platform migration
11. Authentication, tenancy and permissions
12. Media and asset management
13. Mobile architecture
14. SEO planning domain
15. Brand and design-token domain
16. Content and CMS domain
17. Component inventory and implementation model
18. Accessibility domain
19. Analytics and measurement domain
20. Technical specification and integrations
21. AI context compiler and implementation handoff
22. Live-site connections and digital twin
23. APIs, events and background processing
24. Security, privacy and governance
25. Observability, reliability and testing
26. Data migration and compatibility
27. Phased roadmap
28. Delivery definition of done
29. Suggested first implementation sequence
Appendix A. Example target schemas
Appendix B. Rule/inference schema
Appendix C. Suggested repository structure
Appendix D. Decision log
# 1. Executive summary
Scaffolds already has the correct foundation for a much larger product. Its current model treats a project as plain JSON; pages form a tree, blocks live inside pages, intents can be attached to blocks, journeys connect pages, and comments/annotations remain attached by stable identifiers. The Markdown export is identity-first: IDs survive renames and moves, omitted fields preserve existing values, and the user reviews the change list before applying an edited file.
The recommended evolution is not to replace this system with an AI-first architecture. Instead, Scaffolds should become progressively richer as a canonical semantic model, while external AI remains the preferred place for broad creative reasoning and an internal model is used only where deterministic rules and learned relationships are insufficient.
Core architectureExplicit project model → relationship graph → deterministic rules → internal reasoner for uncertainty → evidence and feedback → crystallised rules. External AI sits outside this loop and receives task-specific context compiled by Scaffolds.
## End-state
Plan: sitemap, page intent, wireframes, user journeys, SEO, content requirements, components, design tokens, accessibility and analytics.
Build: technical specification, integration map, implementation constraints, AI-ready handoff packages and code scaffolds.
Run: optional CMS/content delivery, media management, analytics, search performance, accessibility health, Core Web Vitals and live integrations.
Learn: compare planned intent with observed behaviour; identify divergence and recommend changes.
Adapt: apply accepted changes back into the semantic model, preserving decision history and provenance.
# 2. Current product and codebase baseline
## 2.1 Verified current capabilities
Area
Current implementation
Framework
Next.js 16.3, React 19.2, TypeScript 5, Tailwind CSS 4.
Canonical project model
One plain-JSON Doc per project containing pages, blocks, personas/intents, journeys, pinned notes and members.
Page architecture
Pages form a tree through parentId; sibling order is explicit.
Wireframe blocks
Typed glyph, structural role, note, component mapping, flag, comments and optional intent IDs.
Collaboration
Optimistic revision checking; client polling; concurrent save conflicts return the server copy rather than silently overwrite.
History
Automatic snapshots throttled to one per ten minutes, retaining up to 100 versions; manual snapshots supported.
Storage
Netlify DB/Neon Postgres when configured; local JSON-file fallback in development.
Authentication
Single-password edit gate; open viewing by link; server-side mutation enforcement.
AI interchange
Markdown export/import with embedded editing rules, stable IDs and review-before-apply.
External AI philosophy
The interface already treats the AI as “your AI, not ours”.
## 2.2 Current domain entities
Doc ├─ Page[] │   └─ Block[] │       └─ Comment[] ├─ Persona[]  // currently functions as intents ├─ Journey[] │   └─ JourneyStep[] ├─ PinNote[] └─ Member[]
## 2.3 Existing strengths to preserve
Plain JSON as the product truth rather than framework-specific state.
Stable identity across AI round trips.
No AI dependency in the critical path.
Storage abstraction already exists, so infrastructure can change without redefining the product.
Explicit revision numbers make collaboration and history understandable.
Notes capture rationale, not only layout. This should remain a first-class concept.
## 2.4 Current constraints
Single-password authentication cannot support proper tenancy, roles, audit history or enterprise collaboration.
Project data is still largely one document; as the model grows, selective reads/writes and subdomain ownership will become important.
Polling every four seconds is sufficient today but should eventually become realtime subscriptions/presence.
The current tree layout is desktop-first and requires a mobile-specific projection.
SEO, content, brand, analytics, accessibility and technical specification are not yet first-class model domains.
There is no evidence/provenance system for inferred relationships or accepted/rejected recommendations.
# 3. Architectural principles
Principle
Meaning
Canonical model first
Every feature adds information to one project model rather than creating disconnected artefacts.
Deterministic before probabilistic
Validation, parsing, referential integrity and known dependencies use code/rules. AI is reserved for ambiguity.
AI-agnostic interoperability
Users remain free to work with ChatGPT, Claude, Gemini, Codex, Cursor or future systems.
Internal AI is optional
A project must remain fully usable if the internal model is unavailable.
Explainability
Every inferred consequence carries reason, source entities, confidence and provenance.
Reversible mutation
AI/rule proposals are previewed, individually selectable and undoable.
Graph relationships
The primary long-term value is not isolated domains but their connections.
Human authority
Accepted/rejected/refined recommendations become evidence; the system does not silently rewrite ambiguous intent.
Adapter boundaries
Firebase, analytics vendors, CMSs and AI providers sit behind adapters so no vendor becomes the product model.
Progressive enrichment
Existing projects remain valid while richer domains are added incrementally.
# 4. Target product model
The long-term product should represent a website at four simultaneous levels: explicit truth, relationships, planned behaviour and observed behaviour.
Project Model (what is explicitly known)      ↓Relationship Graph (what connects to what)      ↓Rules + Reasoner (what follows from those connections)      ↓Observed State (what the live website actually does)      ↓Recommendations / decisions / updated model
## 4.1 Major domain modules
Architecture: pages, hierarchy, templates, routes and page archetypes.
Intent: audiences, user intents, business intents, jobs-to-be-done and success criteria.
Wireframe: blocks, order, responsive variants and interaction states.
Journeys: entry points, steps, decision points, exits, hand-offs and funnel objectives.
Content: content requirements, actual content, ownership, localisation, status and provenance.
Components: component definitions, variants, supported content/interaction contracts and implementation targets.
Brand/design: tokens, typography, colour, spacing, radii, imagery rules, motion and component theming.
SEO: search intent, query/theme targets, metadata, internal links, schema, indexation/canonical strategy.
Accessibility: semantic requirements, keyboard behaviour, status announcements, media alternatives and test evidence.
Analytics: event taxonomy, measurement plan, KPIs, journey mapping and live metrics.
Technical: APIs, ATS/CMS/CRM dependencies, data contracts, performance budgets, hosting and integration constraints.
Assets: media files, derivatives, metadata, rights, alt text, usage and lifecycle.
Operations: decisions, approvals, comments, snapshots, audit history, permissions and release state.
# 5. Core domain model
## 5.1 Recommended root structure
Project ├─ meta ├─ architecture │   ├─ pages[] │   └─ routes[] ├─ intents[] ├─ journeys[] ├─ components[] ├─ contentItems[] ├─ brand │   └─ tokens ├─ seo ├─ analytics ├─ accessibility ├─ technical ├─ integrations[] ├─ assets[] ├─ relationships[] ├─ rules[] ├─ inferences[] ├─ decisions[] ├─ observations[] └─ versions / audit
## 5.2 Page target shape
Page {  id, name, slug, parentId, order, archetype, status,  purpose, userIntents[], businessIntents[], searchIntents[],  journeyRoles[], templateId?, blocks[],  seoRef?, analyticsRef?, accessibilityRef?, technicalRefs[],  contentRefs[], componentRefs[], responsivePolicy?,  evidenceRefs[], flags[], createdAt, updatedAt}
## 5.3 Block target shape
Block {  id, pageId, label, type/glyph, order,  purpose, contentRequirement, contentRefs[],  componentRef?, variant?, intentRefs[],  interactionSpec?, states[], responsiveBehaviour?,  analyticsRefs[], accessibilityRefs[], technicalRefs[],  assetRefs[], designTokenOverrides?,  flags[], evidenceRefs[], comments[]}
## 5.4 Relationship as a first-class entity
Relationship {  id, sourceRef, targetRef, type,  strength: required | expected | suggested | speculative,  origin: explicit | deterministic_rule | learned_rule | model_inference,  confidence, ruleId?, inferenceId?, evidenceRefs[],  createdAt, lastValidatedAt}
Do not bury all dependencies inside nested objects. Cross-domain relationships should be queryable independently so Scaffolds can answer “what depends on this?” without scanning every subdocument.
# 6. Views and interaction architecture
Views should be projections over the same canonical model, not separate artefacts.
View
Primary job
Architecture
Sitemap/tree, page archetypes, routes and hierarchy.
Wireframe
Page/block composition and notes.
Journeys
User flow across pages and external systems.
Content
Requirements, actual content, ownership, localisation and status.
Components
Inventory, mapping, variants and coverage.
SEO
Search intent, metadata, internal links, schema and indexation.
Brand
Tokens and design decisions.
Accessibility
Requirements, risks, checks and evidence.
Analytics
Measurement plan plus observed performance.
Technical
Integrations, APIs, data, performance and implementation notes.
Build
Context-pack generation and implementation readiness.
Health
Cross-domain completeness, contradictions, unresolved implications and live-site divergence.
## 6.1 Shared selection model
Selecting a page or block should establish the same entity context across every view. A user can move from Wireframe → SEO → Analytics while retaining the selected page/block.
## 6.2 Health indicators
Avoid a simplistic percentage unless its calculation is explainable.
Expose missing required fields, unresolved dependencies, stale relationships and contradictions.
Show counts by severity: required, expected, suggested, speculative.
Allow health rules to vary by project archetype and enabled modules.
# 7. Markdown interchange and external AI workflow
The current identity-first Markdown protocol is a strategic asset and should remain the primary portable interchange format. The existing format already carries editing instructions, stable page/block/intent/journey IDs, preserves omitted fields, and treats missing items as deletions only after the caller shows a change list.
## 7.1 Future MD protocol
Version the protocol explicitly, e.g. scaffolds-md/2, scaffolds-md/3.
Add new domain sections gradually rather than changing existing page/block semantics.
Keep stable IDs in headings or machine-readable front matter.
Preserve unknown future fields where possible to support forwards compatibility.
Generate a change manifest before import: additions, removals, moves, edits, new dependencies and broken references.
Run schema validation before semantic reasoning.
## 7.2 Recommended workflow
Create starter brief from project name and optional setup answers.
User copies/downloads the brief and discusses it with their preferred external AI.
External AI returns the complete Markdown file.
Scaffolds parses and validates it deterministically.
User reviews structural changes.
Accepted import updates the canonical model.
Only after import, dependency/rule analysis determines whether downstream implications exist.
If no known rule meets the confidence threshold, invoke the internal reasoner.
Critical boundaryDo not make the internal reasoning model responsible for fixing Markdown format. Import correctness belongs to the parser/schema layer.
# 8. Internal reasoning, rules and knowledge graph
## 8.1 Trigger model
change detected  ↓known deterministic rule? ── yes → propose/apply known consequence  ↓ nolearned rule above threshold? ── yes → propose with confidence  ↓ nointernal model reasoner → infer possible implications  ↓user accepts / rejects / refines  ↓evidence recorded → future rule confidence updated
## 8.2 Model responsibilities
Detect non-obvious cross-domain implications.
Identify contradictions that cannot be resolved with simple predicates.
Suggest missing relationships and explain why.
Generate alternative proposals when context is ambiguous.
Summarise the consequences of a major change.
Help refine a suggestion through a tightly scoped “Add context / Discuss” interaction.
## 8.3 What the model must not own
Markdown parsing and IDs.
Referential integrity.
Permissions.
Version history.
Hard accessibility requirements that are already codified.
Deterministic schema validation.
Silent bulk mutation of project state.
## 8.4 Inference UI
The default interface should remain quiet. Only uncertain or consequential implications should interrupt the user. Each proposal should expose: consequence, affected entities, reason, confidence, provenance and controls for Accept all, Accept selected, Reject, Add context.
## 8.5 Contextual discussion
Use a temporary, inference-scoped exchange rather than a persistent global chatbot. Any additional user context should be stored as evidence/decision metadata and can cause the proposal to be recalculated.
## 8.6 Confidence policy
Class
Suggested behaviour
Required / deterministic
No model call. Present as requirement or automatically maintain if safe and reversible.
High confidence learned rule
Suggest quietly; allow one-click acceptance.
Medium confidence
Show recommendation and reasoning; require user action.
Low confidence / novel
Invoke model; ask for context only if necessary; never auto-apply.
High-impact domains
Raise review threshold for privacy, security, legal, destructive content or critical integrations.
# 9. Historical corpus ingestion and pattern crystallisation
The historical archive of wireframes, audits, requirements, technical recommendations and decisions can seed Scaffolds with a substantial domain knowledge base before the learning loop has accumulated new projects.
## 9.1 Ingestion pipeline
Ingest source artefact and metadata: client/project/date/type/source file.
Extract entities into a staging project representation.
Classify evidence as designed pattern, observed problem, requirement, recommendation, decision or measured outcome.
Extract candidate relationships: A→B, A+C→D, absence(A)→risk(B), change(A)→review(B,C,D).
Cluster semantically similar relationships across projects.
Human-review high-value candidate rules.
Publish validated rules into the shared rule registry with provenance and confidence.
## 9.2 Do not fine-tune first
The recommended initial approach is retrieval + structured graph + rules, not model fine-tuning. This keeps knowledge inspectable, attributable and easy to correct. Fine-tuning should only be reconsidered if a clear recurring reasoning task remains expensive or inconsistent after the structured system matures.
## 9.3 Rule crystallisation
A repeated inference should only become deterministic after enough accepted evidence, low exception rates and review. Rules need scopes (careers, ecommerce, corporate, etc.), confidence, versioning and deprecation.
# 10. Firebase platform migration
## 10.1 Recommended Firebase services
Service
Use
Firebase Authentication
User identity, passwordless/OAuth/SSO-ready auth.
Cloud Firestore
Canonical collaborative project data, metadata, rules, inferences, comments, decisions and version pointers.
Cloud Storage
Images, videos, PDFs and source artefacts; derivatives and thumbnails.
Cloud Functions / Cloud Run
Import processing, AI reasoning, rule extraction, analytics ingestion, webhooks and heavy transformations.
App Check
Reduce abuse against client-exposed Firebase resources.
Firebase Hosting optional
Not required if Netlify remains preferred for Next.js. Firebase can be used purely as backend services.
## 10.2 Keep repository interfaces
ProjectRepositoryAssetRepositoryVersionRepositoryInferenceRepositoryRuleRepositoryAnalyticsRepositoryContentRepositoryFirebase implementations satisfy these interfaces. UI/domain code does not import Firestore directly.
## 10.3 Firestore data-shape recommendation
Do not put the eventual entire project into one Firestore document. Firestore has document-size and contention considerations; the growing model should be split into stable subcollections while retaining an exportable aggregate Project representation.
/organisations/{orgId}/projects/{projectId}/projects/{projectId}/pages/{pageId}/projects/{projectId}/components/{componentId}/projects/{projectId}/content/{contentId}/projects/{projectId}/relationships/{relId}/projects/{projectId}/inferences/{inferenceId}/projects/{projectId}/decisions/{decisionId}/projects/{projectId}/versions/{versionId}/projects/{projectId}/assets/{assetId}/projects/{projectId}/analyticsDefinitions/{metricId}
## 10.4 Realtime
Replace 4-second polling with Firestore snapshot subscriptions for active project entities.
Use presence separately; presence should not become persistent project truth.
Maintain optimistic local UI but use server timestamps and transactional writes for conflicts.
For collaborative editing of long-form content later, consider Yjs/CRDT only where field-level concurrent text editing genuinely requires it.
# 11. Authentication, tenancy and permissions
## 11.1 Target permission model
Role
Typical capability
Owner
Organisation, billing, deletion, integrations, rules, members.
Admin
Projects, permissions, integrations and all project content.
Editor
Create/edit project domains, import/export, approve proposals.
Contributor
Edit assigned content/comments or selected domains.
Reviewer
Comment, approve/reject, view reasoning.
Viewer
Read-only shared access.
External viewer
Token/link-scoped read access to specific projects/views.
## 11.2 Security design
Firebase Auth token establishes identity; server-side APIs validate claims.
Firestore Security Rules enforce organisation/project membership.
Do not trust client role state for mutation authority.
Support project-level sharing links through explicit share records rather than guessable URLs alone.
Store immutable audit entries for permission and publishing changes.
Plan for enterprise SSO/SAML later through Firebase Identity Platform or an external identity layer if required.
# 12. Media and asset management
## 12.1 Asset entity
Asset { id, projectId, storagePath, type, mimeType, bytes, width?, height?, duration?, title, altText?, caption?, rights?, credit?, source?, tags[], derivatives[], usageRefs[], uploadedBy, createdAt, status }
## 12.2 Pipeline
Direct signed upload to Cloud Storage.
Server-side validation of MIME/size; malware scanning if enterprise/external uploads are supported.
Generate responsive derivatives/thumbnails asynchronously.
Extract intrinsic metadata.
Track where an asset is used in pages/blocks/content.
Flag missing alt text or rights metadata contextually.
Later, push/pull assets from external DAMs through adapters.
# 13. Mobile architecture
Do not force the desktop spatial tree onto a phone. The same model should have a mobile-specific projection.
Desktop
Mobile
Infinite spatial canvas / sitemap tree
Hierarchical expandable sitemap/list as default.
Multiple page cards visible
One selected page or compact nested list.
Right/side inspector panels
Bottom sheet or full-screen inspector.
Canvas pan/zoom primary
Map/canvas secondary; list/page navigation primary.
Mouse/keyboard hover affordances
Large touch targets; swipe/next for adjacent pages.
Persistent toolbars
Compact top bar plus contextual bottom actions.
## 13.1 Breakpoint behaviour
< 768px: mobile hierarchy projection; full-screen page detail; drawers as bottom sheets.
768–1199px: tablet canvas with collapsible panels and touch-safe controls.
≥ 1200px: full spatial canvas and persistent side inspector as appropriate.
## 13.2 Performance
Virtualise large mobile lists.
Avoid rendering every off-screen page card at full fidelity.
Lazy-load page detail and media.
Persist viewport/selection per device without polluting shared project state.
# 14. SEO planning domain
## 14.1 Entities
SearchIntent { id, label, type, audienceRef?, queryThemes[], priority }SeoPageSpec { pageId, indexable, canonicalPolicy, titlePattern, metaDescription, h1, searchIntentRefs[], schemaTypes[], internalLinkTargets[], hreflang?, robots?, evidenceRefs[] }
## 14.2 Capabilities
Map search intent to pages and identify collisions/gaps.
Metadata planning and validation.
Schema/structured-data planning by page archetype.
Index/noindex/canonical/hreflang strategy.
Internal-link graph planning.
Later connect Search Console and rank/visibility data.
Reason across SEO ↔ content ↔ architecture ↔ analytics rather than treating SEO as a checklist.
# 15. Brand and design-token domain
## 15.1 Token schema
DesignSystem { colors, typography, spacing, radii, shadows, breakpoints, grid, motion, imagery, iconography, semanticTokens, componentTokens, themes[]}
## 15.2 Token sources
Manual entry/editor.
Import W3C Design Tokens Community Group-compatible JSON when appropriate.
Import from code repositories or design-system exports through adapters.
Allow project overrides but retain source and inheritance.
## 15.3 Relationship behaviour
Component variants should consume tokens by reference. Scaffolds should flag direct values that conflict with an enforced design-system policy but allow intentional exceptions with rationale.
# 16. Content and CMS domain
## 16.1 Separate requirement from instance
A block should be able to say what content is required before actual copy exists. This preserves the planning role while allowing Scaffolds to evolve into a CMS later.
ContentRequirement { id, blockId, type, purpose, fields[], constraints, owner?, status }ContentItem { id, modelId, locale, fields, status, owner, version, publishState, source, evidenceRefs[] }
## 16.2 CMS architecture
Treat Scaffolds-managed content and external CMS content identically at the semantic layer.
Use adapters for Contentful, Sanity, AEM, WordPress, etc.
A content reference records source system, external ID, locale, publish status and sync state.
Publishing from Scaffolds should be optional; the product can remain the brain while another CMS stores the content.
If native CMS is enabled, support drafts, scheduling, localisation, approvals, versioning and webhooks.
## 16.3 Editorial safety
Field-level permissions for sensitive publishing environments.
Preview URLs and environment targeting.
No automatic publishing from AI recommendation without explicit approval.
Immutable publication audit trail.
# 17. Component inventory and implementation model
## 17.1 Component entity
Component { id, name, sourceSystem, implementationRef?, description, supportedBlockTypes[], variants[], propsSchema?, contentModelRef?, accessibilityContract?, analyticsContract?, tokenRefs[], status, evidenceRefs[] }
## 17.2 Uses
Map every wireframe block to an existing, extended or new component.
Identify component gaps across the whole project.
Generate implementation inventory and effort estimates.
Drive AI handoff: coding agents receive exact component contracts instead of vague screenshots.
Later connect Storybook/component repositories and validate drift between planned and implemented interfaces.
# 18. Accessibility domain
## 18.1 Accessibility spec
AccessibilityRequirement { id, scopeRef, standard: WCAG-2.2-AA, criterionRefs[], requirement, testMethod, strength, status, evidenceRefs[], automatedCheckRef? }
## 18.2 Reasoning examples
Video → captions/transcript/media controls requirements.
Async search results → status announcement and focus-management considerations.
Form → labels, instructions, error handling, error summary and keyboard flow.
Carousel → control semantics, pause behaviour and keyboard operation.
## 18.3 Live validation
Later, automated accessibility scans can attach observations to the same requirements, creating a planned-versus-observed view. Automated checks should never be presented as complete WCAG conformance.
# 19. Analytics and measurement domain
## 19.1 Planning schema
MetricDefinition { id, name, description, formula?, owner, target?, guardrail? }EventDefinition { id, name, trigger, scopeRefs[], properties[], destination, privacyClass }Funnel { id, journeyRef, steps[], primaryMetricRef, segmentRules[] }
## 19.2 Data integration
Initially export measurement plans for GA4/GTM or other stacks.
Later ingest aggregated data from GA4, Adobe Analytics, Search Console, ATS/CRM and custom APIs.
Avoid copying unnecessary raw personal data into Scaffolds; prefer aggregated/derived metrics unless raw event analysis is a product requirement.
Maintain semantic mapping from live event names to planned event definitions.
## 19.3 Planned vs observed
This is one of the strongest eventual capabilities. Scaffolds can know that a block exists for a specific intent and compare that intended role with actual engagement, progression and conversion.
Designed journey: Landing → Explore → Search → Job → ApplyObserved journey: Landing → Explore → ExitReasoner: identify divergence, affected page/block, likely contributing changes, and evidence-backed recommendation.
# 20. Technical specification and integrations
## 20.1 Technical domain
TechnicalSpec { hosting, renderingStrategy, environments[], performanceBudgets, browserSupport, securityRequirements[], dataResidency?, integrations[], APIs[], dataFlows[], authentication?, caching?, observability?, deploymentConstraints[]}
## 20.2 Integration entity
Integration { id, name, type, vendor, direction, authMethod, environments, dataContracts[], rateLimits?, webhookEvents[], dependencies[], owner, status, risks[] }
## 20.3 Change propagation
An integration change should be one of the clearest demonstrations of Scaffolds reasoning. Changing Workday → SuccessFactors should cause review of job-search data mapping, apply handoff, event definitions, saved-job behaviour, schemas, personalisation assumptions and technical notes where those relationships exist.
# 21. AI context compiler and implementation handoff
## 21.1 Principle
Scaffolds should not always export the entire project to an AI. It should compile the smallest complete context package for the task.
## 21.2 Task packs
Task
Include
Build page
Page purpose, blocks, components, content, tokens, interactions, accessibility, analytics, technical dependencies.
Write content
Audience/intent, page purpose, block requirements, brand voice, SEO intent, surrounding links and constraints.
Audit SEO
Architecture, search intents, metadata, schema, content hierarchy, internal-link graph and observed search data.
Implement component
Component contract, variants, design tokens, content schema, accessibility and analytics contracts.
Build whole site
Complete project model plus implementation ordering, constraints, unresolved decisions and acceptance criteria.
## 21.3 Export package
/scaffolds-context  project.md  architecture.md  brand.md  seo.md  analytics.md  accessibility.md  technical.md  /pages/*.md  /components/*.md  /data/design-tokens.json  /data/journeys.json  /data/analytics-events.json  /assets/manifest.json  AGENTS.md
Support both Markdown-first human-readable exports and JSON schemas for agents/tools that can consume structured data directly.
# 22. Live-site connections and digital twin
The eventual product can become a digital twin of the website: Scaffolds contains the semantic and operational model while the deployed site is its live manifestation.
## 22.1 Two states
Designed state
Observed state
Intended user journey
Actual journey/funnel behaviour
SEO intent
Search impressions/clicks/rank/landing traffic
Component purpose
Interaction and conversion performance
Content objective
Engagement and downstream outcomes
Accessibility requirement
Audit/test observations
Performance budget
Core Web Vitals and runtime telemetry
Technical dependency
Integration availability/error rates
## 22.2 Coherence engine
Scaffolds can continuously measure the distance between the designed and observed states. That produces recommendations grounded in why something exists, not merely whether a metric moved.
## 22.3 CMS role
If native content publishing is added, Scaffolds can become the control plane for both website intent and website state. It does not need to replace every specialised system; it can orchestrate and understand them through adapters.
# 23. APIs, events and background processing
## 23.1 Internal API boundaries
Project API: create/read/update/archive/export/import.
Page/block APIs or repository calls: granular mutation.
Relationship API: query upstream/downstream dependencies.
Inference API: evaluate change set, list proposals, accept/reject/refine.
Rule API: evaluate deterministic/learned rules; admin rule lifecycle.
Asset API: upload, transform, metadata, usage.
Content API: draft/publish/sync.
Analytics API: definitions, mappings, observations, aggregates.
Integration API: credentials/config references, sync status and webhook handling.
## 23.2 Domain events
project.importedpage.createdpage.updatedblock.updatedrelationship.changedinference.createdinference.acceptedinference.rejecteddecision.recordedasset.uploadedcontent.publishedintegration.changedanalytics.observation.updatedlive_site.scan.completed
Domain events should drive asynchronous reasoning and integrations rather than coupling every feature directly to UI mutations.
## 23.3 Jobs
AI inference requests.
Historical-corpus extraction.
Asset processing.
Analytics aggregation/sync.
Search Console/third-party sync.
Live-site scans.
Rule-confidence recalculation.
Export package generation.
# 24. Security, privacy and governance
## 24.1 Secrets
Store third-party integration credentials in server-side secret management, never Firestore project documents.
Use per-environment credentials and least privilege.
Rotate credentials and record integration owner/status without exposing values.
## 24.2 AI data handling
Make model-provider routing explicit and configurable.
Default to sending only the task-relevant context compiled for an inference.
Classify project fields that must not be sent to external model providers.
Record provider/model/version and context hash for important inferences.
Enterprise option: disable internal AI or route to approved provider/region.
## 24.3 Auditability
Every accepted AI/rule proposal records actor, timestamp, proposal, selected changes and resulting revision.
Keep decision explanations distinct from model-generated reasoning.
Maintain rule versions and provenance.
Allow an inference to be superseded without deleting historical evidence.
# 25. Observability, reliability and testing
## 25.1 Application observability
Structured logs with request/project/org correlation IDs.
Error tracking for client/server exceptions.
Performance monitoring for editor render time, import time and large-project interaction latency.
Metrics for save conflicts, failed imports, AI latency/cost, rule hit rate, inference acceptance rate and sync health.
## 25.2 Testing pyramid
Layer
Tests
Domain
Pure unit tests for model transforms, rules, relationship graph and validation.
Markdown
Golden-file tests, round-trip invariants, malformed AI output, additions/deletions/moves and backwards compatibility.
Repositories
Firestore emulator integration tests; concurrency/transaction tests.
API
Auth, permission, validation and idempotency tests.
UI
Playwright critical flows: create, export, import, edit, undo, review inference, mobile navigation.
Reasoning
Evaluation suite with known change scenarios; measure precision/recall of useful implications and false-positive burden.
Live integrations
Contract tests and sandbox environments for analytics/CMS/ATS connectors.
## 25.3 Performance targets
Editor usable interaction <100 ms for ordinary local edits.
Incremental saves should not re-write/query unrelated project domains.
Large projects should use pagination/virtualisation/selective subscriptions.
AI reasoning must run asynchronously from the edit itself; UI should never block a save on a model response.
# 26. Data migration and compatibility
## 26.1 Current → Firebase
Introduce repository interfaces while retaining current Postgres/file implementation.
Build Firebase repository implementations behind feature flags.
Write an export/migration script from current Doc JSON into new project/subcollection shape.
Migrate a copy of projects and validate aggregate export equality.
Run dual-read or shadow validation for a short period.
Switch writes to Firebase once stable.
Retain export-to-complete-JSON/Markdown as disaster recovery and portability.
## 26.2 Model versioning
Add schemaVersion to Project.
Every migration is pure and testable: v1→v2→v3.
Keep `normDoc`-style compatibility at boundaries, but move migrations into explicit versioned functions as complexity grows.
Never make a historical project unreadable because a new domain became required.
# 27. Phased roadmap
Phase
Objective
Key deliverables
0 — Stabilise current core
Make present product solid and mobile-usable.
Mobile projection; editor usability; schema/version tests; import/export hardening; repository interfaces; design polish.
1 — Platform foundation
Move from prototype auth/storage to durable multi-user platform.
Firebase Auth, Firestore, Storage; organisations/projects/roles; realtime; audit log; asset library.
2 — Rich planning model
Turn Scaffolds into complete website planning system.
Components, content requirements, SEO, brand/tokens, accessibility, analytics plan, technical/integrations.
3 — Dependency graph
Make domains coherent.
Relationship entity; deterministic rules; dependency queries; health/contradiction UI; change-set evaluation.
4 — Internal reasoner
Handle novel implications only.
Model gateway; confidence policy; contextual inference cards; accept/reject/refine; provenance.
5 — Knowledge bootstrap
Distil historical work.
Corpus ingestion pipeline; candidate rules; review UI; scoped rule registry; evidence metrics.
6 — Context compiler
Make Scaffolds executable context.
Task-specific exports; AGENTS.md packs; page/component/build packages; coding-agent workflows.
7 — CMS/content operations
Move from planning content to operating content.
Native content models or CMS adapters; workflow; localisation; media; publishing and previews.
8 — Observed state
Connect real-world behaviour.
GA4/Search Console/other analytics adapters; CWV; accessibility scans; integration health; planned-vs-observed.
9 — Website brain
Continuous coherence loop.
Evidence-backed optimisation recommendations; live dependency health; digital-twin view; controlled publishing/adaptation.
# 28. Delivery definition of done
## For every new domain
Entity schema defined and versioned.
Repository abstraction and Firebase implementation.
Import/export representation where portable context is needed.
Permission policy.
Relationship hooks: what can depend on it and what it can depend on.
Validation rules.
UI view/editor and mobile behaviour.
Audit/version behaviour.
Test coverage.
AI policy: deterministic, learned or reasoned?
Observability metrics.
## For every AI capability
Explicit trigger and confidence threshold.
Minimal context contract.
Structured model output schema; no free-form mutation.
Reason/provenance captured.
Preview and selective acceptance.
Undo/revision integration.
Evaluation cases and false-positive threshold.
Fallback behaviour when model unavailable.
# 29. Suggested first implementation sequence
The fastest route to the long-term architecture is not to implement the AI first. Build the semantic surfaces that give the AI something worthwhile to reason over.
Mobile-specific hierarchy/page-detail experience and general usability polish.
Introduce schemaVersion, repository interfaces and stronger automated Markdown round-trip tests.
Firebase Auth + organisations/projects/roles.
Firestore repository + realtime collaboration; Cloud Storage asset library.
Component inventory and block→component relationships.
Brand/design tokens.
SEO planning.
Content requirements and content references.
Analytics measurement planning.
Accessibility and technical/integration domains.
Generic relationship graph and deterministic dependency rules.
Change-set evaluator: “what else might this affect?” using rules only.
Add internal model only for unresolved/low-confidence implications.
Add contextual Add context/Discuss interaction and evidence recording.
Ingest historical projects and crystallise repeatable rules.
Build contextual AI/export compiler.
Add CMS adapters/native content operation.
Connect live analytics/search/performance/a11y observations.
Close the designed-state ↔ observed-state optimisation loop.
Recommended near-term product boundaryFor the next substantial release, target “Scaffolds as the complete planning source of truth”, not “Scaffolds as a CMS”. CMS and live analytics are valuable later because the planning model will then be rich enough to make those signals meaningful.
# Appendix A. Example target schemas
## A.1 Inference
Inference {  id, projectId, triggerRevision, triggerChanges[],  affectedRefs[], statement, rationale,  proposedChanges[], confidence, impact,  status: open | accepted | partially_accepted | rejected | superseded,  model?: { provider, model, version },  contextHash, evidenceRefs[], ruleCandidateRef?,  createdAt, resolvedAt?, resolvedBy?}
## A.2 Decision
Decision {  id, projectId, scopeRefs[], title, rationale,  source: user | stakeholder | inference_resolution | imported,  supersedesId?, evidenceRefs[], actorId, createdAt}
## A.3 Observation
Observation {  id, projectId, scopeRefs[], sourceSystem, metricRef?,  period, dimensions?, value, comparison?, confidence?,  collectedAt, sourcePointer}
## A.4 Evidence
Evidence {  id, projectId?, sourceType, sourceRef, excerptOrSummary,  classification, createdAt, hash?}
# Appendix B. Rule and inference schema
## B.1 Example deterministic rule
{  "id": "video-accessibility-001",  "scope": ["all"],  "when": [{"field":"block.glyph","op":"eq","value":"video"}],  "then": [    {"ensure":"accessibility.captionRequirement"},    {"ensure":"accessibility.transcriptAssessment"}  ],  "strength": "required",  "origin": "curated",  "version": 1}
## B.2 Example learned rule
{  "id": "external-apply-measurement-014",  "scope": ["careers"],  "when": [    {"field":"block.intent","op":"contains","value":"apply"},    {"field":"integration.category","op":"eq","value":"external_ats"}  ],  "suggest": ["analytics.apply_start", "analytics.handoff"],  "confidence": 0.91,  "observations": 38,  "acceptanceRate": 0.89,  "origin": "crystallised"}
## B.3 Evaluation order
1. schema validators2. referential-integrity validators3. required deterministic rules4. scoped deterministic recommendations5. learned rules above configured threshold6. model inference for unresolved material implications7. user resolution8. evidence + rule-learning update
# Appendix C. Suggested repository structure
app/components/features/  architecture/  wireframe/  journeys/  content/  components/  seo/  brand/  accessibility/  analytics/  technical/  reasoning/domain/  project/  relationships/  rules/  inference/repositories/  interfaces/  firebase/  legacy/integrations/  ai/  analytics/  cms/  search-console/  ats/services/  markdown/  context-compiler/  migrations/  exports/workers/  inference/  ingestion/  assets/  analytics-sync/tests/  fixtures/  markdown-golden/  reasoning-evals/
# Appendix D. Decision log
Decision
Status
Rationale
Keep external AI as primary broad reasoning partner
Recommended
Matches user preference and avoids competing with rapidly changing AI products.
Do not add internal AI to Markdown import
Recommended
Import already has a deterministic identity-preserving format; model involvement adds risk without value.
Use internal AI only below rule-confidence threshold
Recommended
AI handles novelty; repeated patterns become cheap, inspectable rules.
Use contextual discussion, not global chat, initially
Recommended
Keeps AI attached to a concrete implication and turns user feedback into evidence.
Adopt Firebase backend services
Planned
Auth, realtime Firestore and Storage align with collaboration/media roadmap; domain must remain vendor-neutral.
Make mobile a different projection
Recommended
Spatial desktop canvas should not simply shrink to phone size.
Treat CMS as later operational layer
Recommended
First build rich semantic planning model; content operation becomes more valuable once relationships exist.
Connect analytics after measurement semantics exist
Recommended
Observed data is most useful when it can be mapped to planned intent, journeys, blocks and components.
# Source baseline
Current-state claims in this blueprint were grounded against the repository files available on 8 August 2026: package.json, README.md, lib/model.ts, lib/store.ts, lib/md.ts, components/Editor.tsx, components/AiExchange.tsx, components/Auth.tsx and app/globals.css. Future-state sections are architectural recommendations derived from the product direction discussed and should be treated as design decisions rather than descriptions of existing functionality.
Repository: https://github.com/leantonionelson/wireframes
Product: https://scaffolds.design
