import type { Doc, Page, Block, GlyphId, ColorRole, Persona, Journey } from "./model";

// Seed: EY Global Careers, from the Tonic build sheet (July 2026 analysis).
let n = 0;
const id = () => "s" + (++n).toString(36);

function b(label: string, glyph: GlyphId, opts: Partial<Block> = {}): Block {
  return { id: id(), label, glyph, color: (opts.color ?? "content") as ColorRole,
    note: opts.note ?? "", component: opts.component ?? "", flag: opts.flag ?? "", comments: [] };
}
const header = () => b("Global header", "links", { color: "header", component: "Existing global header. No change." });
const nav = (note = "") => b("Careers nav", "links", { color: "nav", component: "AEM: Sub Navigation", note });
const footer = () => b("Footer", "links", { color: "footer", component: "Existing global footer. No change." });

function page(name: string, parentId: string | null, order: number, note: string, blocks: Block[], external = false): Page {
  return { id: id(), name, parentId, order, note, external, blocks };
}

const home = page("Careers at EY", null, 0,
  "Purpose: the brand front door and the router. A quarter of arrivals return from the application system; most others carry broad job intent from search. Route intent fast, give researchers a reason to believe, hold no detail.\n\nUser wants: find jobs quickly (77% of in-page clicks are Find jobs); reach their own market (country selector is #5 page on ey.com); understand what EY offers.\n\nInheritance: global publishes, AEM rollout carries the change to local sites with release notes, and local teams localise from there. Local publishing is a local action, not automatic: local teams localise, translate and prioritise, prompted by AEM release notes, the Friday comms, and direct briefing from the Global Careers team. Everything on this page propagates, so it is built once and built well.",
  [
    header(),
    nav("Job search, What you can do here, What it's like to work here, How to join us, FAQ. Order reflects usage: Job search carries 79% of subnav clicks."),
    b("Hero with intent CTAs", "hero", { note: "Split the audience by intent in the first viewport: Search jobs / Explore careers at EY. Removes the false-positive problem of high-intent users hitting global site search. Confirmed: EY has approved intent CTAs in the hero; the US-precedent flag is cleared. Hero types beyond the current careers set can be enabled with Rob or Marco's approval, so the hero choice is a design decision, not a constraint.", component: "AEM: Hero Banner, image variant" }),
    b("Market router", "map", { note: "A block placed high on the page that offers visitors their own market: \"Looking for roles in your country?\", linking either to the local careers site or to a job search already filtered to that country.\n\nWhy it is here. Visitors who reached the global site by default should be moved onward to their own market rather than held on a page that cannot serve them. India and the United States together account for 55 per cent of visitors, and 195,260 visits to the country selector show that visitors already localise themselves by hand.\n\nWhat it needs to do. A single call to action whose destination follows the visitor's location. Someone in India reaches Indian roles and someone in Germany reaches German roles, without first having to find and use a country selector.\n\nWe are not proposing how this should be built. EY already publishes experience fragments on this site, and an existing component already holds the full market list of 171 locales across 132 markets, so we do not believe a new page or a new list is required. The delivery approach is EY's to determine.", component: "Existing content component. Delivery approach to be confirmed with EY.", flag: "QUESTION FOR EY\nIs a dynamic or conditional link possible on this page, so that a single call to action resolves to the visitor's own market? If it is, how would EY prefer to deliver it, and what effort is involved?\n\nOne point that may bear on the answer. Careers content sits on one locale per country and which locale varies, so the destination for each market cannot be reliably derived and would need to be recorded. Where a market has no careers page, a job search filtered to that country covers 95 countries independently of the website." }),
    b("Intro, the EVP in brief", "textrows", { note: "Short version of why EY for the exploratory visitor. Concrete, not slogans. Conductor scored current copy 37/100.", component: "AEM: Rich text. Content: rewrite." }),
    b("Main entry points", "cards3", { note: "Route by audience: Experienced professionals, Early careers, service line doorway.", component: "AEM: visual link card row. Content: revise labels and destinations." }),
    b("Search jobs", "search", { note: "Transactional block for people who scrolled past the hero. Same market-aware search as the router, via the same Target experience fragment approach. Verified: the destination supports country filtering at careers.ey.com/ey/search/?optionsFacetsDD_country={ISO alpha-2}. Same locale to ISO mapping caveat as the router.", component: "AEM: job search component" }),
    b("Why EY, proof block", "text2col", { note: "Two or three EVP proof points with substance: the Personal Fulfilment and Inclusive Culture gaps from the Barometer. Written to survive AI extraction.", component: "AEM: feature / promotional banner. Content: new." }),
    b("People stories", "people", { note: "Real named people, the evidence layer. Currently the weakest content on the site.", component: "AEM: editorial card row. Content: new, with Employer Brand." }),
    b("Talent Community sign-up", "form", { note: "Capture path for no-match visitors. Second most engaged in-page action, 49,703 clicks. Keep both variants.", component: "AEM: Promotional Banner. Content: keep, sharpen." }),
    footer(),
  ]);

const jobsearch = page("Job search", home.id, 0,
  "Purpose: the transaction hub. Right roles in the fewest moves, in the visitor's market where one exists. This page passes candidates to careers.ey.com / SuccessFactors; the pass must carry market context, and the return path must not deposit them on an arbitrary market's page.",
  [
    header(), nav(),
    b("Hero, slim", "hero", { note: "Title plus search. No storytelling here." }),
    b("Market-aware job search", "search", { note: "Same component as home. Target experience fragment, no custom code. Country filter verified: optionsFacetsDD_country takes ISO 3166-1 alpha-2 codes.", flag: "Same open Marco question as the home router: one global fragment or one per location; Target consistency. Locale to ISO mapping needs a maintained table: en_uk maps to GB, and invalid codes return zero results silently." }),
    b("Experienced professionals route", "cta", { note: "50% of Job search dropdown clicks. Keep, 8,209 clicks today.", component: "AEM: Promotional Banner" }),
    b("Early careers route", "cta", { note: "29% of dropdown clicks. Keep, 4,862 clicks.", component: "AEM: Promotional Banner" }),
    b("Service line roles", "carousel", { note: "Keep, revise.", component: "AEM: Carousel" }),
    b("Talent Community fallback", "form", { note: "The no-match capture.", component: "AEM: Promotional Banner" }),
    footer(),
  ]);

const wycdh = page("What you can do here", home.id, 1,
  "Purpose: role and service-line discovery. 141k visits, 1:17 dwell, 21% bounce; thin content is the audited cause. Parthenon proves the fix: role-relevant depth earns 2:42 dwell, the highest on the site. Fewer, deeper.",
  [
    header(), nav(),
    b("Hero, video variant", "video", { note: "Keep as today.", component: "AEM: Hero Banner, video" }),
    b("Intro", "textrows", { note: "Rewrite: what the work is, plainly.", component: "AEM: Rich text" }),
    b("Service line explorer", "carousel", { note: "Each card leads to a service line page on the template. Revise.", component: "AEM: Carousel / card grid" }),
    b("What working on it is like", "image", { note: "Links the two culture pages. New.", component: "AEM: feature block" }),
    b("Index Page Linker", "linker", { note: "Keep, drives 2k+ next-page clicks.", component: "AEM: Index Page Linker" }),
    footer(),
  ]);

const slTemplate = page("Service line template", wycdh.id, 0,
  "One card stands for the retained set; Parthenon is the model. Everything else in the service tail is retired. Retained list to confirm against the content inventory.",
  [
    header(), nav(),
    b("Hero", "hero", {}),
    b("Intro with role types", "textrows", {}),
    b("The work, named examples", "text2col", { note: "Parthenon model: its Strategy Consulting link takes 39% of page clicks." }),
    b("Role family links", "links", { component: "AEM: Visual Link" }),
    b("Specialisms", "accordion", { note: "As on Consulting today.", component: "AEM: Accordion" }),
    b("Find jobs, pre-filtered", "search", { note: "Verified: country and service line combine in one URL. optionsFacetsDD_country=GB with optionsFacetsDD_customfield1=Consulting returns 89 roles. Business area values are plain labels: Assurance, CBS, Consulting, Strategy and Transactions, Tax.", flag: "The per-service-line link set needs an owner, labels must match the ATS values exactly, and the locale to ISO mapping applies here too." }),
    footer(),
  ]);

const wiltwh = page("What it's like to work here", home.id, 2,
  "Purpose: the culture proof. The Barometer's weakest EVP scores live here (Personal Fulfilment, Inclusive Culture) and the page bounces hardest of the five (26%). Top click today is the My EY login. Proof, not adjectives: Reddit and Glassdoor currently supply the answers.",
  [
    header(), nav(),
    b("Hero", "hero", { note: "Keep." }),
    b("Culture, answered properly", "textrows", { note: "Substantive account, including how experience varies by team, the anxiety EY's own research says drives most AI prompts. New.", component: "AEM: Rich text" }),
    b("Personal Fulfilment proof", "image", { note: "New.", component: "AEM: feature block" }),
    b("Inclusive Culture proof", "image", { note: "New.", component: "AEM: feature block" }),
    b("People stories", "people", { note: "New.", component: "AEM: editorial cards" }),
    b("Talent Community", "form", { note: "Keep.", component: "AEM: Promotional Banner" }),
    b("Index Page Linker", "linker", { component: "AEM: Index Page Linker" }),
    footer(),
  ]);

const htju = page("How to join us", home.id, 3,
  "Purpose: expectation-setting, conceptually. Stages and intent, not market mechanics (those are local). Resolves how-we-hire and interview-tips, which breach the content parameters at global level. Owns the post-application moment: a quarter of all traffic returns from the application system.",
  [
    header(), nav(),
    b("Hero, slim", "hero", {}),
    b("The process, conceptually", "textrows", { note: "Numbered stages: what each stage is for. No formats, timings or booking.", component: "AEM: Rich text" }),
    b("What we look for", "text2col", { note: "New." }),
    b("After you apply", "textrows", { note: "What happens next, status via My EY, what to do while waiting. Addresses post-apply silence, rated Critical in EY's research.", component: "New content" }),
    b("FAQ routing block", "linker", { note: "Into the FAQ page." }),
    b("Find jobs", "search", { note: "Keep." }),
    footer(),
  ]);

const postApply = page("Post-application landing", htju.id, 0,
  "Where the return link should deposit candidates instead of the generic homepage. Acknowledges the just-applied state: application received, next steps, browse more roles in your market, join the Talent Community, read about EY.",
  [
    header(),
    b("Application received", "cta", { note: "Confirmation state, next steps.", flag: "Depends on the SuccessFactors return-link work with EY. Wireframed now so the destination exists when the link is fixed." }),
    b("More roles in your market", "search", {}),
    b("Talent Community", "form", {}),
    b("About EY, brand layer", "cards3", {}),
    footer(),
  ]);

const faq = page("FAQ", home.id, 4,
  "Purpose: answer the questions candidates actually ask, in their words, and define how EY is described by AI answer engines (70% of candidates use GenAI to evaluate employers; ChatGPT referrals already in the logs). Named a global-owned page in EY's content strategy. Fifteen global questions in four groups; five more route local (salary, benefits, remote, steps, eligibility), acknowledged then directed onward. Every answer self-contained and extraction-ready.",
  [
    header(), nav(),
    b("Hero, slim", "hero", {}),
    b("What EY is and offers", "accordion", { note: "4 questions.", component: "AEM: Accordion" }),
    b("Getting in", "accordion", { note: "4 questions.", component: "AEM: Accordion" }),
    b("What working here is like", "accordion", { note: "5 questions.", component: "AEM: Accordion" }),
    b("Applying and after", "accordion", { note: "2 questions, plus the five local-routing entries.", component: "AEM: Accordion", flag: "Structured data is configuration; the case is AI extraction, not rich results. Do not promise snippets." }),
    b("Still have a question", "form", { note: "Talent Community and contact routing." }),
    footer(),
  ]);

const sf = page("careers.ey.com / SuccessFactors", home.id, 5,
  "External system, not our build, shown for the hand-off. Outbound passes must carry market context. The return link currently resolves to an effectively arbitrary market and is with EY to explain. The loop is 242,466 visits, a quarter of the global page.",
  [
    b("Job board (SF Recruiting)", "search", { color: "external" }),
    b("Application portal (career5)", "form", { color: "external" }),
    b("Return link, market-aware", "linker", { color: "external", flag: "With EY: what sets it, why it defaults to UK, can it follow the candidate's market." }),
  ], true);

const personas: Persona[] = [
  { id: "int-role", name: "Find a role", color: "#8b5cf6", desc: "High-intent job seekers. 77% of in-page clicks are Find jobs." },
  { id: "int-research", name: "Research the firm", color: "#f59e0b", desc: "Exploratory, search-led arrivals deciding whether EY fits before committing." },
  { id: "int-continue", name: "Continue an application", color: "#10b981", desc: "The application loop. A quarter of all visits return from SuccessFactors." },
  { id: "int-local", name: "Reach my local market", color: "#0ea5e9", desc: "Users who landed on global by default. 195,260 visits to the country selector show them localising by hand." },
];

const journeys: Journey[] = [
  { id: "jn-role", personaId: "int-role", name: "Straight to a role",
    goal: "Get to relevant roles and apply, with minimum friction.",
    entry: "Search with role intent, or typed ey.com/careers. Natural search is 41% of known-source visits.",
    exit: "SuccessFactors application portal. The hand-off must carry market context.",
    steps: [
      { pageId: home.id, note: "Clicks Find jobs almost immediately. 77% of in-page clicks." },
      { pageId: jobsearch.id, note: "Market-aware search; experienced route takes 50% of dropdown clicks." },
      { pageId: sf.id, note: "Crosses into the job board and applies." },
    ] },
  { id: "jn-research", personaId: "int-research", name: "Decide whether EY fits",
    goal: "Understand what EY is, what the work is, and what it is like before applying.",
    entry: "General or brand search, \"EY careers\". No named role yet.",
    exit: "Job search once convinced, or the Talent Community if nothing fits yet.",
    steps: [
      { pageId: home.id, note: "Takes the Explore careers path from the hero." },
      { pageId: wycdh.id, note: "Service-line discovery, depth on the Parthenon model." },
      { pageId: wiltwh.id, note: "Culture proof. The Barometer's weakest EVP areas answered here." },
      { pageId: faq.id, note: "Their questions in their words, extraction-ready for AI answers too." },
    ] },
  { id: "jn-continue", personaId: "int-continue", name: "Back from the application system",
    goal: "Resume or check an application, research the firm just applied to, or find another role.",
    entry: "SuccessFactors return link. 242,466 visits, a quarter of the page.",
    exit: "Status via My EY, more roles in their market, or the Talent Community.",
    steps: [
      { pageId: sf.id, note: "Completes or abandons an application." },
      { pageId: postApply.id, note: "Lands in a just-applied state instead of the generic homepage." },
      { pageId: faq.id, note: "What happens after I apply, answered before they have to ask." },
    ] },
  { id: "jn-local", personaId: "int-local", name: "Get to my market",
    goal: "Reach their own country's careers site and its roles.",
    entry: "Defaulted onto global: typed ey.com/careers, or search resolved to the global page.",
    exit: "Local careers site, or a pre-filtered local job search.",
    steps: [
      { pageId: home.id, note: "Met by the market router in the first viewport, instead of hunting for the country selector." },
    ] },
];

export function seedDoc(): Doc {
  return {
    id: "ey-global-careers",
    name: "EY, Global Careers website",
    rev: 1,
    updatedAt: Date.now(),
    updatedBy: "seed",
    pages: [home, jobsearch, wycdh, slTemplate, wiltwh, htju, postApply, faq, sf],
    personas,
    journeys,
  };
}
