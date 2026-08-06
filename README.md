# Octo

Collaborative sitemaps and wireframes. Octopus.do-style tree of page cards,
each a stack of colour-coded wireframe blocks with notes, components, red
flags and comments. Multi-project, shareable URLs, PNG export.

## Run locally

```bash
npm install
npm run dev
```

No database needed locally: projects persist as JSON under `data/projects/`.

## Deploy (Netlify + Netlify DB)

1. Push to GitHub and link the repo in Netlify.
2. `netlify db init` to provision Netlify DB (Neon Postgres). This sets
   `NETLIFY_DATABASE_URL`; the app detects it and switches to Postgres with
   atomic revision-checked writes.
3. Deploy. The `projects` table is created automatically on first request and
   seeded with the demo project if empty.

## Concurrency model

Every save is an optimistic-concurrency UPDATE (`WHERE rev = baseRev`), so
concurrent editors cannot silently overwrite each other; the loser receives
the server copy. Clients poll every 4 seconds for teammates' changes. The
storage adapter lives in `lib/store.ts`; swapping in a realtime layer (Ably,
Pusher, Yjs) only touches that file and the fetch layer in `components/Editor.tsx`.
