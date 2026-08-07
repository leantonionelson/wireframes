# Scaffolds — development notes

Collaborative sitemaps and wireframes. **A scaffold is a single wireframe; scaffolding is what the user is doing**, which is why the product is plural. Use that vocabulary in copy.

Built as an Octopus.do alternative, but the differentiator is that it **holds the argument**, not just the structure: every block carries evidence, an open question, a red flag and an intent tag. The EY document is a consulting deliverable that happens to look like a sitemap.

- **Live:** https://scaffolds.design (custom domain on Netlify; `scaffoldwires.netlify.app` is the default and still works)
- **Repo:** https://github.com/leantonionelson/wireframes — push to `main` auto-deploys
- **Netlify site id:** `f53d01ee-e35e-4429-8926-63a1624067d4`, team Leantonio Designs
- **Stack:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind, Geist + Geist Mono

## Running it

```bash
npm run dev --prefix ~/projects/scaffolds
```

There is a `.claude/launch.json` config named `scaffolds` (port 3000, autoPort). Use the preview tooling rather than a bare shell so the browser pane can reach it.

**Auth is disabled locally** unless `SCAFFOLD_PASSWORD` is set. To exercise the viewer/editor split, put it in `.env.local` (git-ignored):

```
SCAFFOLD_PASSWORD=anything
```

## Architecture

**One document per project.** The whole `Doc` (pages, blocks, personas, journeys, notes, members) is a single JSON blob with a `rev` counter. Every write is revision-checked and atomic, which is what makes concurrent editing safe without a CRDT. Keep it that way: splitting pages into separate records would break the concurrency model.

`lib/store.ts` is a swappable adapter — Postgres (Netlify DB / Neon, resolved at runtime by `@netlify/database`) in production, JSON files under `data/` locally. Nothing above it knows which.

### Files that matter

| File | What it holds |
|---|---|
| `lib/model.ts` | All types, `normDoc` (backfills old docs), `blockStyle`/`readableOn` (intent colouring), `initialsOf` |
| `lib/store.ts` | Storage adapter, `newProjectDoc` |
| `lib/glyphs.tsx` | 36 wireframe glyphs in 6 groups, two-tone (filled surfaces + stroke detail) |
| `lib/seed.ts` | The EY Global Careers seed project |
| `lib/auth.ts` | Single-password gate, HMAC cookie |
| `lib/md.ts` | The Markdown round trip: `docToMarkdown`, `applyMarkdown`, `starterDoc` |
| `components/Editor.tsx` | Everything canvas-side. Large; the sub-components are at the bottom |
| `components/AiExchange.tsx` | The Markdown export/import modal, both modes, plus `CopyBtn` |
| `components/Auth.tsx` | `useAuth` hook + login modal |

### The two write paths, and why there are two

1. **`PUT /api/doc`** — the whole document. **Password-gated.** Used for all structural editing.
2. **`POST /api/annotate`** — op-based (`note-add`, `note-patch`, `note-delete`, `comment-add`, `member-add`), merged server-side against the latest revision with a retry loop. **Open to viewers**, because client feedback is the point.

This split is load-bearing. Do not move annotations onto the gated PUT, and do not open the PUT.

**A model must never write to either path directly.** A model that returns a doc with a page missing will silently delete that page. Today it cannot: the Markdown round trip puts a human review step between the model and the document (see below). If in-app AI editing ever arrives, extend the annotate op vocabulary rather than letting a model PUT whole documents.

## The Markdown round trip

There is no model in the product. The document goes out as one Markdown file, the author gives it to whichever AI they already pay for, and the edited file comes back. `Export / import` in the editor, `build one from scratch with your AI` on the project list.

**The file carries its own instructions.** `brief()` in `lib/md.ts` writes the editing rules, the field meanings and the full glyph vocabulary into the top of every export, so nothing has to be explained in the prompt. Two flavours: `edit` (an existing scaffold) and `create` (an empty starter from `starterDoc`, which is never persisted; the project is created only when the finished file comes back).

**Identity is the whole trick.** Every page, block, intent and journey carries its id in its heading (`pg:` `bl:` `int:` `jr:`). That is what makes the import a merge rather than a replace: ids survive renames and moves, a heading with no id is new, and anything missing is a deletion. Comments, pinned notes and the roster are never in the file and are re-attached by id.

Three rules keep a careless model from destroying work, and they are load-bearing:

1. **An absent field keeps its current value.** Only a literal `(none)` clears one. A model that drops the `flag:` line does not wipe the flag.
2. **Nothing is written until the author has read the change list.** `applyMarkdown` returns the would-be document *and* every change it makes; removals are counted and confirmed separately. The import then goes through `mutate()`, so it is one undo away.
3. **Unknown values degrade, they do not throw.** An invented glyph or role keeps the old value and adds a warning.

`docToMarkdown` → `applyMarkdown` on the EY document is exactly lossless: 10 pages, 82 blocks, 4 journeys back out with zero reported changes and a deep-equal document. If you change the format, that identity is the test to re-run.

**Field values are one line.** A real line break travels as a literal `\n` and comes back as one, because multi-line flags are common. Backticks in a value would close it, so they become apostrophes.

## Auth model

One shared password in `SCAFFOLD_PASSWORD` (set on Netlify via the CLI). The cookie is an HMAC keyed on the password itself, so **rotating the password logs everyone out**. Unset locally means auth is off entirely.

- **Editors** (password): everything.
- **Viewers** (link only): read everything, plus add notes and comments, plus add themselves to the roster. They can edit and delete only their own notes, matched by author name.

Every mutation is enforced server-side. The UI gating is convenience, not security.

**Known gap:** `GET /api/projects` is not gated, so anyone can list every project. Fine for one client, not fine for two. There is **no tenancy at all** — no `userId`, `ownerId` or `workspace` anywhere. This is the blocker before any paid or multi-client use.

## Conventions

- Pills everywhere; glass/backdrop-blur only on floating chrome, solid `--card` on modals
- CSS custom-property tokens in `globals.css`, light + dark via `data-theme`
- No raw scrollbars for structured content — pan/zoom or explicit controls; plain scroll is fine for text
- Everything editable in place
- **No em-dashes in client-facing copy**
- Block colour means **intent**, never structural role. Chrome roles (header/nav/footer/external) stay neutral grey. `blockStyle()` is the single source of truth — use it, don't read `COLOR_STYLES` directly

## Traps, all of which have already bitten

- **Overlays kill canvas interaction.** Three separate regressions came from putting an interaction layer *on top of* the canvas: it swallows wheel and pointer events, so pan and zoom die. Notes mode now intercepts clicks in the **capture phase** on the root instead. Follow that pattern; do not add another full-screen catcher.
- **The loader gates canvas mount.** `cycleDone` holds the loader for one animation cycle, so `canvasRef` is null for the first ~1.6s. Any effect touching `canvasRef` must include `cycleDone` in its deps or it will attach to nothing.
- **Notes are content, not a mode.** Pins render whenever the doc has any. Notes mode is only the crosshair for placing them. Gating rendering on the mode made other people's notes invisible.
- **`getComputedStyle` lies in headless Chrome** for compositor-driven animation, and smooth `scrollIntoView` is disabled there. Verify animation via the Web Animations API and scroll via transform matrices, or test in a real browser.
- **Pinned notes store fractional coordinates** inside their anchor's rect, so they survive zoom and layout changes. They fall back to the page when their block is deleted.
- **Journey steps reference page ids.** Copying a doc between environments requires remapping them by page name, or every journey breaks silently.

## Roadmap, in the order I would do it

1. **Tenancy + real accounts** — Firebase Auth is the obvious fit and solves it directly. Keep Postgres; Firebase Auth alongside it is a normal architecture. Gate `GET /api/projects` at the same time.
2. **Images in notes, comments and block writeups** — Firebase **Storage** (not Firestore), URLs in the doc, never binary. Two traps: set bucket **CORS** or `html-to-image` PNG export silently drops the images, and Storage security rules are separate from database rules.
3. **Coding-agent export** — the highest-value/lowest-effort item, and `lib/md.ts` is now most of the machinery: the emitter already walks the tree and knows every field. A build brief is a third `Mode`, not a new module. The document is already close to a build brief: page tree = routes, blocks = component sequence, glyph = type, `component` = implementation target, `note` = spec, `intents` = who it serves, journeys = flows that must work. **The red flags are the most valuable field**, because they tell an agent what *not* to invent. Output a scaffold (routes, stubs, notes as TODOs), not a finished site.
4. **Design tokens** — only as far as step 3 needs: brand colour, neutrals, semantic colours, type family + scale, spacing unit, radius. `globals.css` already has the shape to emit.
5. **In-app AI editing** — via the annotate ops from step 3. Lower priority now that the Markdown round trip exists: it costs nothing to run, uses the AI the client already trusts, and the review step is a feature rather than a compromise. Build this only when someone asks to skip the copy and paste.
6. **Live cursors** — needs an ephemeral channel, **never the document** (30–60 updates/sec would spam the rev counter and version history). Firebase **Realtime Database** is the right tool, not Firestore: cheap at high write rates and `onDisconnect()` handles ghost cursors. Ably/Pusher are the alternative. Netlify functions cannot hold websockets. Broadcast **canvas coordinates**, not screen pixels, so cursors land on the same block at different zoom levels. The local `CursorBadge` is most of the rendering already.

### Firestore note if the DB ever moves

1 MiB cap is **per document**, so per project; total storage is unlimited. The EY project is 41.8 KB, about 4% — roughly 25× headroom, or ~250 pages. Text will never hit it. One 200 KB base64 image in a note would be 26% of the cap in a single field, which is why images must live in Storage.

## Business direction

Not self-serve SaaS. **Invite-only, per-workspace, invoiced** — same revenue from a few agencies, none of the signup/billing/support surface. Gate on **client sharing** rather than project count: a freelancer's one free project is their real project forever, but the moment it is client-facing it is billable work. LLM access stays paid, since it has marginal cost.

`scaffolds.com` sits on the Afternic aftermarket (likely five figures) and carries construction-industry search competition; `.design` disambiguates and the `.com` remains a reversible upgrade later.

## The EY project

`lib/seed.ts` seeds "EY, Global Careers website" — 10 pages, 82 blocks, 4 intents, 4 journeys. It is a live client deliverable, not demo data. The source documents live in
`~/Library/CloudStorage/GoogleDrive-leantonio.nelson@gmail.com/My Drive/Tonic/ey/EY Global/`, including the build sheet, the retired-pages analysis and the content inventory.

Seed changes only affect **newly created** documents. The live EY project predates most of them and is patched directly through the API.
