# EY, Global Careers website

<!-- scaffolds-md/1 project:ey-global-careers rev:75 -->

## How to edit this file

This is a scaffold: the structure of a website, page by page, and inside each page
the sequence of sections ("blocks") a visitor scrolls through. It came out of
Scaffolds and it can go back in, so keep the shape of the file and change only what
you mean to change.

### Rules

1. **Never change, invent or reuse an id.** Ids sit at the end of a heading and look
   like `pg:a1b2c3` (page), `bl:…` (block), `int:…` (intent), `jr:…` (journey).
   They are how the import recognises what already exists.
2. **To add something**, copy the shape of a neighbour and leave the id off. A new id
   is assigned on import.
3. **To delete something**, delete its whole section. Anything missing from this file
   is removed on import, so never drop a page or block just to keep your answer short.
   If you are only asked about one page, return the entire file with that one page
   changed.
4. **To move a block to another page**, move its whole section under that page and
   keep its id.
5. **To reorder**, reorder the sections. Order in this file is order on the page, and
   the order of pages under a parent is their order in the sitemap.
6. **A field you leave out keeps its current value.** To empty a field, write
   `(none)` as its value. The same goes for the prose note under a block.
7. **Fields first, prose second.** Under a heading, the backticked field lines come
   first; everything after them is that item's note. A field value is one line: write
   `\n` where it needs a line break, and no backticks inside a value.
8. Lines starting with `>` are teammate comments. They are read only, and are
   ignored on import.
9. Do not add new field names, new section levels, or a summary of your changes to
   the file. Explain your reasoning in chat instead, or in the notes where it belongs.

### What the fields mean

- `glyph` - the wireframe elements the block is made of, top to bottom, from the
  ids listed below. Usually one; use a comma-separated list when the section is
  genuinely several things stacked, e.g. `glyph: hero, cards3`. Chosen for what the
  section *is*, not for decoration.
- `role` - structural role. `header` · `nav` · `content` · `footer` · `external`. Header, nav, footer and external are page
  chrome and stay neutral; real content is `content`.
- `intents` - which audiences the block serves, most important first, by name.
  Available here: `Find a role` · `Research the firm` · `Continue an application` · `Reach my local market`. Only use intents that exist in the Intents section.
- `component` - the implementation target, e.g. "AEM: Promotional Banner". Leave it
  alone unless you know the platform.
- `flag` - a red flag: a custom build, an unresolved decision, a risk, a promise
  the site cannot keep. **Do not invent flags and do not clear one** without
  explaining it in the note.
- `external` - `yes` when the page is another system, e.g. an applicant tracker.
- The prose under the fields is the **note**: the argument for that page or block.
  Purpose, evidence, user need, content status, open questions. This is the most
  valuable part of the document. Write it as a working note between colleagues, not
  as marketing copy, and do not pad it.

### Glyph ids

- **Structure** - `hero` (Hero), `herosplit` (Hero, split), `banner` (Notice bar), `tabs` (Tabs), `sidebar` (Content + sidebar), `breadcrumb` (Breadcrumb), `footercols` (Footer columns)
- **Text** - `textrows` (Text rows), `text2col` (Two column text), `article` (Article), `quote` (Quote), `testimonial` (Testimonial)
- **Media** - `image` (Image), `video` (Video), `gallery` (Gallery), `logos` (Logo strip), `split` (Media + text)
- **Collections** - `cards3` (Three cards), `cards4` (Four cards), `grid2x2` (Feature grid), `people` (People cards), `carousel` (Carousel), `related` (Related content), `listrows` (Listing rows), `table` (Table), `pricing` (Pricing)
- **Interactive** - `search` (Search), `filters` (Filters + results), `form` (Form / sign-up), `cta` (CTA banner), `accordion` (Accordion), `steps` (Process steps), `toggle` (Toggle / compare)
- **Wayfinding** - `links` (Link list), `linker` (Prev / next), `map` (Map / locations), `contact` (Contact details), `stats` (Statistics)

### Import it back

Save this file, then in Scaffolds open **Export → Import edited Markdown**, paste or upload it, and review the list of changes before applying. The import is undoable.

## Intents

### Find a role `int:int-role`
`colour: #8b5cf6`

High-intent job seekers. 77% of in-page clicks are Find jobs.

### Research the firm `int:int-research`
`colour: #f59e0b`

Exploratory, search-led arrivals deciding whether EY fits before committing.

### Continue an application `int:int-continue`
`colour: #10b981`

The application loop. A quarter of all visits return from SuccessFactors.

### Reach my local market `int:int-local`
`colour: #0ea5e9`

Users who landed on global by default. 195,260 visits to the country selector show them localising by hand.

## Pages

### Careers at EY `pg:sc`
`parent: none`

The global careers homepage is the brand front door and the routing layer. It has two tasks: to move visitors who have job intent quickly towards relevant roles or their own market, and to give visitors who are still deciding a substantive reason to consider EY. It is not intended to hold detail.

Around a quarter of arrivals return from the application system, and most other visitors arrive from search with broad rather than specific intent. Within the page, 77 per cent of clicks go to Find jobs, and the country selector is the fifth most visited page across ey.com, so demand for both routes is already evidenced.

Content published here is inherited by local sites through AEM rollout. Local teams receive release notes and then localise, translate and publish to their own priorities, so publication in each market is a local action rather than an automatic consequence of global publishing.

#### 1. Global header `bl:s1`
`glyph: links` · `role: header`
`component: Existing global header`

The existing global header, carried through unchanged.

#### 2. Careers nav `bl:s2`
`glyph: links` · `role: nav`
`component: AEM Sub Navigation`

Sub navigation across the five careers pages: Job search, What you can do here, What it's like to work here, How to join us, and FAQ. The order reflects observed use, with Job search taking 79 per cent of sub navigation clicks.

#### 3. Hero with intent CTAs `bl:s3`
`glyph: hero` · `role: content` · `intents: Find a role, Research the firm`
`component: AEM Hero Banner, image variant`

The hero separates the audience by intent within the first screen, using two calls to action: Search jobs, and Explore careers at EY.

This addresses a known problem in which visitors with job intent use the global site search and receive site wide results rather than roles.

#### 4. Market router `bl:s4`
`glyph: map` · `role: content` · `intents: Reach my local market`
`component: Existing content component. Delivery approach to be confirmed with EY.`
`flag: QUESTION FOR EY\nIs a dynamic or conditional link possible on this page, so that a single call to action resolves to the visitor's own market? If it is, how would EY prefer to deliver it, and what effort is involved?`

A block placed high on the page that offers visitors their own market: "Looking for roles in your country?", linking either to the local careers site or to a job search already filtered to that country.

Why it is here. Visitors who reached the global site by default should be moved onward to their own market rather than held on a page that cannot serve them. India and the United States together account for 55 per cent of visitors, and 195,260 visits to the country selector show that visitors already localise themselves by hand.

What it needs to do. A single call to action whose destination follows the visitor's location. Someone in India reaches Indian roles and someone in Germany reaches German roles, without first having to find and use a country selector.

> stephanie, 8/7/2026: Can we route by IP as a default?

#### 5. Local market block `bl:lm1`
`glyph: textrows` · `role: content` · `intents: Reach my local market, Find a role`
`component: Authorable slot within an inherited page. Approach to be confirmed with EY.`
`flag: QUESTION FOR EY\nCan a block on the global homepage be left open for local markets to author, while the rest of the page continues to inherit from global? If it can, how would EY prefer to handle it, and what governs the empty state when a market has authored nothing?`

An optional block that a local market authors for itself, shown on the global homepage to visitors from that market. It exists for markets that have no local careers site, or no capacity to run one, but still need to say something specific to their own candidates.

Why it is here. Roughly one in five of the locales tested have no careers page, so for those markets the market router has nowhere to send people. The two blocks work together: the router moves visitors on where a local site exists, and this block serves them where one does not.

What the content should be. Two independent sources point at the same answer. Five questions are already designated in the content plan as asked globally and answered locally: starting salary, benefits, remote and hybrid working, application steps and deadlines, and eligibility or right to work. Conductor scores the current global page 37 out of 100 and names the same gaps: salary and benefits framing, remote policy, process, and locations. These are precisely the questions global cannot answer and local can.

Suggested order, by value and by how easily a market can sustain it.

1. Roles in this market. A job search filtered to the country. This needs no authoring and nothing to maintain, because the application system is the source of truth, and it serves the strongest observed behaviour on the page, where 77 per cent of clicks go to Find jobs.

2. The evergreen answers: eligibility and right to work, the shape of the local application process, and the market's position on flexible working. These change rarely and carry little maintenance.

3. Only where a market can sustain them: pay and benefits framing, and intake dates. These carry the highest demand, since salary is the most asked question of all, but they date quickly and right to work is a stated risk area.

4. Optional: a single local proof point, such as a named person or an office. This addresses the weakest measured area of the site, but it is the most effort to produce.

A caution. This is inherited content on EY's global homepage, so an unmaintained version is publicly wrong at global level. Anything perishable should carry an owner and a review date, and the block should fall back to the global default when empty rather than showing content that has dated.

#### 6. Intro, the EVP in brief `bl:s5`
`glyph: textrows` · `role: content` · `intents: Research the firm`
`component: AEM Rich Text. Content to be rewritten.`

A short and concrete statement of what EY offers, written for the visitor who is still deciding. The current copy scores 37 out of 100 for content quality, assessed as inspirational but without substance.

#### 7. Main entry points `bl:s6`
`glyph: cards3` · `role: content` · `intents: Find a role, Research the firm`
`component: Existing visual link card row. Labels and destinations to be revised.`

Three routes by audience: experienced professionals, early careers, and the service line doorway.

#### 8. Search jobs `bl:s7`
`glyph: search` · `role: content` · `intents: Find a role, Reach my local market`
`component: Existing job search component`

The transactional block for visitors who have scrolled past the hero. It uses the same market aware search as the router above.

The application system supports country filtering directly in the link, using a two letter ISO country code. The same maintained mapping applies as for the router.

#### 9. Why EY, proof block `bl:s8`
`glyph: text2col` · `role: content` · `intents: Research the firm`
`component: AEM feature or promotional banner. New content.`

Two or three employer brand proof points with genuine substance, addressing the Personal Fulfilment and Inclusive Culture gaps identified in the Barometer.

Written so that it survives extraction by AI answer engines.

#### 10. People stories `bl:s9`
`glyph: people` · `role: content` · `intents: Research the firm`
`component: Link to the existing Shapers of the Future page`

Named individuals and their accounts, forming the evidence layer. This is currently the weakest content on the site.

Content already exists. The former People stories page has been retired and now redirects to Shapers of the Future at /en_gl/careers/shapers-of-the-future, which is live and carries named individuals with country attribution and video. This block should route to that page rather than commission new content. Shapers of the future is now represented in this wireframe as a page under What it's like to work here, so this block is a route into it rather than a content commission.

Before the retired pages are deleted, 22 individual person pages in the content inventory should be harvested. They record zero views and are all marked for deletion, but they hold named individuals with quotes and stories, which is the raw material this block needs.

#### 11. Talent Community sign-up `bl:sa`
`glyph: form` · `role: content` · `intents: Find a role`
`component: AEM Promotional Banner. Copy to be sharpened.`

The capture route for visitors without a current match. It is already the second most engaged element on the page at 49,703 clicks. Both variants are retained, early careers and experienced.

#### 12. Footer `bl:sb`
`glyph: links` · `role: footer`
`component: Existing global footer`

The existing global footer, carried through unchanged.

### Job search `pg:sm`
`parent: pg:sc (Careers at EY)`

The transaction hub. Its purpose is to reach relevant roles in the fewest steps, in the visitor's own market where one exists.

Within the Job search menu, experienced professionals account for 50 per cent of clicks and students and entry level for 29 per cent, so the page leads with those two routes.

This page hands candidates over to careers.ey.com and the SuccessFactors application system. The outbound link must carry market context, and the return path must not deposit candidates on an unrelated market's page.

#### 1. Global header `bl:sd`
`glyph: links` · `role: header`
`component: Existing global header`

The existing global header, carried through unchanged.

#### 2. Careers nav `bl:se`
`glyph: links` · `role: nav`
`component: AEM Sub Navigation`

Sub navigation across the five careers pages: Job search, What you can do here, What it's like to work here, How to join us, and FAQ. The order reflects observed use, with Job search taking 79 per cent of sub navigation clicks.

#### 3. Hero, slim `bl:sf`
`glyph: hero` · `role: content` · `intents: Find a role`

Title and search only. No narrative content on this page.

#### 4. Market-aware job search `bl:sg`
`glyph: search` · `role: content` · `intents: Find a role, Reach my local market`
`flag: The same decisions apply as for the homepage router: one global fragment or one per market, and confirmation of consistent delivery through Target. The locale to country mapping requires a maintained table, since an unrecognised value returns an empty result set rather than an error.`

The same component and behaviour as the market router on the homepage, delivered as an Adobe Target experience fragment with no custom code.

Country filtering is supported directly in the job search link using a two letter ISO country code.

#### 5. Experienced professionals route `bl:sh`
`glyph: cta` · `role: content` · `intents: Find a role`
`component: AEM Promotional Banner`

The larger of the two routes, taking 50 per cent of Job search menu clicks and 8,209 clicks today. Retained.

#### 6. Early careers route `bl:si`
`glyph: cta` · `role: content` · `intents: Find a role`
`component: AEM Promotional Banner`
`flag: Decision required on where Student and entry-level programs content lives.`

The second route, taking 29 per cent of Job search menu clicks and 4,862 clicks today. Retained.

Decision required. Student and entry-level programs is the eighth most visited page in the estate at 37,779 views and has no home in the six page structure. Either it is retained as a page in its own right, or its content is split between this route and How to join us. It should not be retired by omission.

#### 7. Service line roles `bl:sj`
`glyph: carousel` · `role: content` · `intents: Find a role, Research the firm`
`component: AEM Carousel`

Retained, with content revised.

#### 8. Talent Community fallback `bl:sk`
`glyph: form` · `role: content` · `intents: Find a role`
`component: AEM Promotional Banner`

The capture route for visitors who find no suitable match.

#### 9. Footer `bl:sl`
`glyph: links` · `role: footer`
`component: Existing global footer`

The existing global footer, carried through unchanged.

### What you can do here `pg:sv`
`parent: pg:sc (Careers at EY)`

Role and service line discovery. This page explains what the work actually involves.

It receives 141,000 visits but holds attention for only one minute and 17 seconds, with a 21 per cent bounce rate. Thin content is the identified cause. The Parthenon page demonstrates the remedy: role relevant depth holds attention for two minutes and 42 seconds, the strongest engagement on the site.

The content principle is fewer pages with greater depth. Each service line follows the Parthenon pattern rather than a short card.

One item from the content inventory to place deliberately. AI and Careers (4,307 views) is marked for deletion. The substance is worth keeping somewhere on this page or the Technology service line page, because 70 per cent of candidates use generative AI to evaluate employers and EY's own research names uncertainty about AI as the driver behind most candidate questions.

#### 1. Global header `bl:sn`
`glyph: links` · `role: header`
`component: Existing global header`

The existing global header, carried through unchanged.

#### 2. Careers nav `bl:so`
`glyph: links` · `role: nav`
`component: AEM Sub Navigation`

Sub navigation across the five careers pages: Job search, What you can do here, What it's like to work here, How to join us, and FAQ. The order reflects observed use, with Job search taking 79 per cent of sub navigation clicks.

> claude, 8/7/2026: Copy still pending from brand.

#### 3. Hero, video variant `bl:sp`
`glyph: video` · `role: content` · `intents: Research the firm`
`component: AEM Hero Banner, video variant`

Retained as currently published.

#### 4. Intro `bl:sq`
`glyph: textrows` · `role: content` · `intents: Research the firm`
`component: AEM Rich Text`

To be rewritten as a plain account of what the work involves.

#### 5. Service line explorer `bl:sr`
`glyph: carousel` · `role: content` · `intents: Research the firm, Find a role`
`component: AEM Carousel or card grid`

Each card leads to a service line page built on the template below. To be revised.

#### 6. What working on it is like `bl:ss`
`glyph: image` · `role: content` · `intents: Research the firm`
`component: AEM feature block`

Connects this page to the two culture pages. New content.

#### 7. Index Page Linker `bl:st`
`glyph: linker` · `role: content` · `intents: Research the firm`
`component: AEM Index Page Linker`

Retained. It currently drives more than 2,000 onward clicks.

#### 8. Footer `bl:su`
`glyph: links` · `role: footer`
`component: Existing global footer`

The existing global footer, carried through unchanged.

### Service line template `pg:s15`
`parent: pg:sv (What you can do here)`

One card represents the retained set of service line pages, with Parthenon as the model to follow. The remaining service line pages are retired.

The retained list is to be confirmed against the content inventory.

Two points from the content inventory. Careers in People Advisory Services (5,450 views) is marked for deletion because that service line now sits within Tax and Consulting, so its content should be split between those two pages. Careers in Strategy and Transactions and Careers in EY-Parthenon both report 40,369 views against a note reading "Two URLS for page", so they are one page on two addresses and need canonicalising to a single URL.

#### 1. Global header `bl:sw`
`glyph: links` · `role: header`
`component: Existing global header`

The existing global header, carried through unchanged.

#### 2. Careers nav `bl:sx`
`glyph: links` · `role: nav`
`component: AEM Sub Navigation`

Sub navigation across the five careers pages: Job search, What you can do here, What it's like to work here, How to join us, and FAQ. The order reflects observed use, with Job search taking 79 per cent of sub navigation clicks.

#### 3. Hero `bl:sy`
`glyph: hero` · `role: content` · `intents: Research the firm`

As currently published.

#### 4. Intro with role types `bl:sz`
`glyph: textrows` · `role: content` · `intents: Research the firm, Find a role`

An introduction covering the types of role available.

#### 5. The work, named examples `bl:s10`
`glyph: text2col` · `role: content` · `intents: Research the firm`

Depth on the Parthenon model, using named examples of the work. On the Parthenon page, the Strategy Consulting link alone takes 39 per cent of clicks, which indicates the appetite for this level of detail.

#### 6. Role family links `bl:s11`
`glyph: links` · `role: content` · `intents: Find a role, Research the firm`
`component: AEM Visual Link`

Visual links through to role families.

#### 7. Specialisms `bl:s12`
`glyph: accordion` · `role: content` · `intents: Research the firm`
`component: AEM Accordion`

An accordion of specialisms, following the pattern used on the Consulting page today.

#### 8. Find jobs, pre-filtered `bl:s13`
`glyph: search` · `role: content` · `intents: Find a role, Reach my local market`
`flag: The set of per service line links requires a named owner. Labels must match the application system values exactly, and the country mapping described on the homepage router applies here as well.`

A job search pre-filtered to this service line.

Country and business area can be combined in a single link. Business area values are the plain labels used by the application system: Assurance, CBS, Consulting, Strategy and Transactions, and Tax.

#### 9. Footer `bl:s14`
`glyph: links` · `role: footer`
`component: Existing global footer`

The existing global footer, carried through unchanged.

### What it's like to work here `pg:s1g`
`parent: pg:sc (Careers at EY)`

The culture evidence. This is where the employer brand gaps are most visible: the Barometer scores EY weakest on Personal Fulfilment, covering flexibility and supportive management, and on Inclusive Culture.

The page also bounces hardest of the five at 26 per cent and produces the least onward movement. Its most clicked element today is the My EY login, which indicates that visitors are transacting even here.

The content principle is evidence rather than description. Named people and specific detail, written to be quotable, because external sites currently supply the answers to what working at EY is like.

#### 1. Global header `bl:s16`
`glyph: links` · `role: header`
`component: Existing global header`

The existing global header, carried through unchanged.

#### 2. Careers nav `bl:s17`
`glyph: links` · `role: nav`
`component: AEM Sub Navigation`

Sub navigation across the five careers pages: Job search, What you can do here, What it's like to work here, How to join us, and FAQ. The order reflects observed use, with Job search taking 79 per cent of sub navigation clicks.

#### 3. Hero `bl:s18`
`glyph: hero` · `role: content` · `intents: Research the firm`

Retained as currently published.

#### 4. Culture, answered properly `bl:s19`
`glyph: textrows` · `role: content` · `intents: Research the firm`
`component: AEM Rich Text`

A substantive account of the culture, including how experience varies between teams. EY's own research identifies this uncertainty as the driver behind most candidate questions to AI tools. New content.

#### 5. Personal Fulfilment proof `bl:s1a`
`glyph: image` · `role: content` · `intents: Research the firm`
`component: AEM feature block`

Evidence against the Personal Fulfilment gap identified in the Barometer, covering flexibility and supportive management.

This block consolidates two existing pages rather than starting from nothing: Personalized career development (7,607 views) and Flexibility and mobility (7,594 views), which are both retired into this page. Note that policy detail, hours and remote specifics are among the questions answered locally, so only the principle and the commitment belong here.

#### 6. Inclusive Culture proof `bl:s1b`
`glyph: image` · `role: content` · `intents: Research the firm`
`component: AEM feature block`

Evidence against the Inclusive Culture gap identified in the Barometer.

This block consolidates three existing pages rather than starting from nothing: Inclusiveness across socio-economic backgrounds (1,589 views), Inclusiveness for everyone (1,573) and Inclusiveness and your career (373). Their combined traffic is small, but they are the substance this page currently lacks.

#### 7. People stories `bl:s1c`
`glyph: people` · `role: content` · `intents: Research the firm`
`component: Link to the existing Shapers of the Future page`

Named individuals and their accounts. New content.

Content already exists. The former People stories page has been retired and now redirects to Shapers of the Future at /en_gl/careers/shapers-of-the-future, which is live and carries named individuals with country attribution and video. This block should route to that page rather than commission new content. Shapers of the future is now represented in this wireframe as a page under What it's like to work here, so this block is a route into it rather than a content commission.

Before the retired pages are deleted, 22 individual person pages in the content inventory should be harvested. They record zero views and are all marked for deletion, but they hold named individuals with quotes and stories, which is the raw material this block needs.

#### 8. Talent Community `bl:s1d`
`glyph: form` · `role: content` · `intents: Find a role`
`component: AEM Promotional Banner`

Retained.

#### 9. Index Page Linker `bl:s1e`
`glyph: linker` · `role: content` · `intents: Research the firm`
`component: AEM Index Page Linker`

Retained.

#### 10. Footer `bl:s1f`
`glyph: links` · `role: footer`
`component: Existing global footer`

The existing global footer, carried through unchanged.

### Shapers of the future `pg:shp1`
`parent: pg:s1g (What it's like to work here)`

A retained page, not a new one. This is where the people evidence already lives, at /en_gl/careers/shapers-of-the-future. The former People stories page has been retired and its URL now redirects here.

What is already on it. Eleven named individuals across eleven markets (United Kingdom, United States, Brazil, Finland, Canada, Australia, South Africa, India, Philippines and Germany), fourteen videos, and Find jobs calls to action. The stories run inline; there are no separate pages behind the individuals. India appears twice, which matters given India is 43 per cent of visitors to the global site.

Why it sits here. What it's like to work here carries the culture argument; this page carries the proof. The People stories blocks on the homepage and on the culture page should route to it rather than commission new content, which the earlier wireframe assumed was needed.

What needs to change. Discovery, not content. The page is not linked from the careers sub navigation and did not appear among the careers links on the global homepage when checked, which is consistent with its predecessor drawing only 3,319 views. The work here is to connect a strong asset into the model, not to build one.

#### 1. Global header `bl:sh1`
`glyph: links` · `role: header`
`component: Existing global header`

The existing global header, carried through unchanged.

#### 2. Careers nav `bl:sh2`
`glyph: links` · `role: nav`
`component: AEM Sub Navigation`
`flag: Decision required from EY: add Shapers of the future to the careers sub navigation, or route to it prominently from the culture page and homepage instead.`

Sub navigation. This page is not currently in the careers sub navigation, which is the main reason a strong asset goes unseen. Adding it is the single highest value change to this page.

#### 3. Hero `bl:sh3`
`glyph: hero` · `role: content` · `intents: Research the firm`
`component: AEM Hero Banner`

As published: "Will you shape the future or be shaped by it?" Retained.

#### 4. The Shapers proposition `bl:sh4`
`glyph: textrows` · `role: content` · `intents: Research the firm`
`component: AEM Rich Text`

The existing introduction, covering what an EY Shaper is and the inclusive culture claim. Retained, with copy reviewed against the Barometer gaps so that it reads as evidence rather than assertion.

#### 5. People stories `bl:sh5`
`glyph: people` · `role: content` · `intents: Research the firm, Find a role`
`component: AEM eycom-tier3-casestudy, as published`

Eleven named individuals with country attribution, and fourteen videos. The stories run inline on this page; there are no separate pages behind them. This is the strongest people content in the estate and it is already built.

No per person template is needed, and the evidence argues against one. The previous generation of individual person pages, 22 of them in the content inventory, recorded zero views and are all marked for deletion. The service line pattern does not transfer here: candidates search by service line, which is why depth per page earns dwell on Parthenon, but they do not search for an individual by name. Keep the stories inline and invest in the card and video module instead of a page template.

Before the retired pages are deleted, harvest the 22 zero-view person pages from the content inventory. They are marked for deletion but hold further named individuals who could extend this set.

#### 6. Find jobs `bl:sh6`
`glyph: search` · `role: content` · `intents: Find a role, Research the firm`
`component: Existing job search component`

Already present on the page. Keep, and point it at the same market aware search used elsewhere so that a visitor persuaded by a story can act on it without returning to the homepage.

#### 7. Footer `bl:sh7`
`glyph: links` · `role: footer`
`component: Existing global footer`

The existing global footer, carried through unchanged.

### How to join us `pg:s1q`
`parent: pg:sc (Careers at EY)`

Expectation setting for the recruitment process at a conceptual level. It covers the stages and their purpose, not market specific mechanics such as formats, timings or booking, which belong to local sites.

This page also resolves the how we hire and interview tips content, which sits outside the agreed content parameters at global level.

It owns the post application moment. A quarter of all traffic to the global careers page is people returning from the application system, and that state currently has no destination.

This page absorbs the two pages that breach the content parameters, and they carry real traffic: How we hire (23,336 views) and Interview tips (16,364), together 39,700. Their stages and intent are rewritten conceptually here, while formats, timings and booking move to local sites. What we look for (5,218 views) folds in wholesale. Each retired URL needs a redirect to this page rather than to the careers homepage.

#### 1. Global header `bl:s1h`
`glyph: links` · `role: header`
`component: Existing global header`

The existing global header, carried through unchanged.

#### 2. Careers nav `bl:s1i`
`glyph: links` · `role: nav`
`component: AEM Sub Navigation`

Sub navigation across the five careers pages: Job search, What you can do here, What it's like to work here, How to join us, and FAQ. The order reflects observed use, with Job search taking 79 per cent of sub navigation clicks.

#### 3. Hero, slim `bl:s1j`
`glyph: hero` · `role: content` · `intents: Research the firm`

Title and short introduction.

#### 4. The process, conceptually `bl:s1k`
`glyph: textrows` · `role: content` · `intents: Research the firm, Continue an application`
`component: AEM Rich Text`

Numbered stages explaining what each stage of the process is for. No formats, timings or booking detail, which belong to local sites.

#### 5. What we look for `bl:s1l`
`glyph: text2col` · `role: content` · `intents: Research the firm`

What EY assesses against, described plainly. New content.

#### 6. After you apply `bl:s1m`
`glyph: textrows` · `role: content` · `intents: Continue an application`
`component: New content`

What happens next, how to check status through My EY, and what candidates can do while waiting.

This addresses the silence following application, which EY's own research rates as a critical friction point.

#### 7. FAQ routing block `bl:s1n`
`glyph: linker` · `role: content` · `intents: Research the firm, Continue an application`

A route through to the FAQ page.

#### 8. Find jobs `bl:s1o`
`glyph: search` · `role: content` · `intents: Find a role`

Retained.

#### 9. Footer `bl:s1p`
`glyph: links` · `role: footer`
`component: Existing global footer`

The existing global footer, carried through unchanged.

### Post-application landing `pg:s1x`
`parent: pg:s1q (How to join us)`

The destination the application system should return candidates to, in place of the generic homepage.

It acknowledges the state the candidate is actually in: the application has been received, these are the next steps, here are further roles in their market, the Talent Community, and background on EY.

This is wireframed now so that the destination exists when the return link is corrected.

#### 1. Global header `bl:s1r`
`glyph: links` · `role: header`
`component: Existing global header`

The existing global header, carried through unchanged.

#### 2. Application received `bl:s1s`
`glyph: cta` · `role: content` · `intents: Continue an application`
`flag: Dependent on the SuccessFactors return link work with EY. Wireframed now so that the destination exists once the link is corrected.`

Confirmation that the application has been received, followed by the next steps.

#### 3. More roles in your market `bl:s1t`
`glyph: search` · `role: content` · `intents: Continue an application, Reach my local market`

Further roles in the candidate's own market, using the same filtered job search as the router.

#### 4. Talent Community `bl:s1u`
`glyph: form` · `role: content` · `intents: Continue an application`

The capture route for candidates who wish to stay in contact.

#### 5. About EY, brand layer `bl:s1v`
`glyph: cards3` · `role: content` · `intents: Research the firm`

Background on EY, for the candidate who has just applied and is now researching the firm.

#### 6. Footer `bl:s1w`
`glyph: links` · `role: footer`
`component: Existing global footer`

The existing global footer, carried through unchanged.

### FAQ `pg:s27`
`parent: pg:sc (Careers at EY)`

A new page answering the questions candidates actually ask, in their own words. It also determines how EY is described by AI answer engines, which now matters directly: 70 per cent of candidates use generative AI to evaluate employers, and referrals from ChatGPT already appear in EY's own analytics. At present external forums supply these answers.

This page is identified as globally owned in EY's content strategy.

The structure is fifteen global questions in four groups. A further five questions are acknowledged and then directed to local sites, covering salary, benefits, remote working, application steps and eligibility.

Every answer is written to stand alone, to lead with the answer, and to name EY rather than using the first person.

#### 1. Global header `bl:s1y`
`glyph: links` · `role: header`
`component: Existing global header`

The existing global header, carried through unchanged.

#### 2. Careers nav `bl:s1z`
`glyph: links` · `role: nav`
`component: AEM Sub Navigation`

Sub navigation across the five careers pages: Job search, What you can do here, What it's like to work here, How to join us, and FAQ. The order reflects observed use, with Job search taking 79 per cent of sub navigation clicks.

#### 3. Hero, slim `bl:s20`
`glyph: hero` · `role: content` · `intents: Research the firm`

Title and short introduction.

#### 4. What EY is and offers `bl:s21`
`glyph: accordion` · `role: content` · `intents: Research the firm`
`component: AEM Accordion`

Four questions.

#### 5. Getting in `bl:s22`
`glyph: accordion` · `role: content` · `intents: Research the firm, Find a role`
`component: AEM Accordion`

Four questions.

#### 6. What working here is like `bl:s23`
`glyph: accordion` · `role: content` · `intents: Research the firm`
`component: AEM Accordion`

Five questions.

#### 7. Applying and after `bl:s24`
`glyph: accordion` · `role: content` · `intents: Continue an application`
`component: AEM Accordion`
`flag: Structured data is a configuration task. The case for it is extraction by AI answer engines rather than rich results in search, which are no longer available to most sites. It should not be presented as delivering search snippets.`

Two questions, together with the five entries that are acknowledged here and then routed to local sites.

#### 8. Still have a question `bl:s25`
`glyph: form` · `role: content` · `intents: Research the firm`

Talent Community sign up and contact routing.

#### 9. Footer `bl:s26`
`glyph: links` · `role: footer`
`component: Existing global footer`

The existing global footer, carried through unchanged.

### careers.ey.com / SuccessFactors `pg:s2b`
`parent: pg:sc (Careers at EY)` · `external: yes`

The external application system. This is not part of the build and is shown because the candidate journey crosses it.

Three conditions apply. Outbound links must carry market context. The return link currently resolves to an effectively arbitrary market and requires explanation from EY. The loop accounts for 242,466 visits, a quarter of all traffic to the global careers page.

The job search accepts filters in the URL: country as a two letter ISO code, business area as a plain label, and city. Country and business area can be combined in a single link. An unrecognised value does not produce an error, it returns an empty result set, so every generated link requires checking before release.

#### 1. Job board (SF Recruiting) `bl:s28`
`glyph: search` · `role: external`

The external job board. Accepts country, business area and city filters in the link.

#### 2. Application portal (career5) `bl:s29`
`glyph: form` · `role: external`

The external application portal, where candidates complete and submit applications.

#### 3. Return link, market-aware `bl:s2a`
`glyph: linker` · `role: external`
`flag: To be established with EY: what sets this link, why it defaults to the United Kingdom before a role is chosen, and whether it can follow the candidate's own market.`

The link returning candidates to the EY website after they leave the application system.

## Journeys

### Straight to a role `jr:jn-role`
`intent: Find a role` · `goal: Get to relevant roles and apply, with minimum friction.` · `entry: Search with role intent, or typed ey.com/careers. Natural search is 41% of known-source visits.` · `exit: SuccessFactors application portal. The hand-off must carry market context.`

1. Careers at EY `pg:sc` — Clicks Find jobs almost immediately. 77% of in-page clicks.
2. Job search `pg:sm` — Market-aware search; experienced route takes 50% of dropdown clicks.
3. careers.ey.com / SuccessFactors `pg:s2b` — Crosses into the job board and applies.

### Decide whether EY fits `jr:jn-research`
`intent: Research the firm` · `goal: Understand what EY is, what the work is, and what it is like before applying.` · `entry: General or brand search, "EY careers". No named role yet.` · `exit: Job search once convinced, or the Talent Community if nothing fits yet.`

1. Careers at EY `pg:sc` — Takes the Explore careers path from the hero.
2. What you can do here `pg:sv` — Service-line discovery, depth on the Parthenon model.
3. What it's like to work here `pg:s1g` — Culture proof. The Barometer's weakest EVP areas answered here.
4. FAQ `pg:s27` — Their questions in their words, extraction-ready for AI answers too.

### Back from the application system `jr:jn-continue`
`intent: Continue an application` · `goal: Resume or check an application, research the firm just applied to, or find another role.` · `entry: SuccessFactors return link. 242,466 visits, a quarter of the page.` · `exit: Status via My EY, more roles in their market, or the Talent Community.`

1. careers.ey.com / SuccessFactors `pg:s2b` — Completes or abandons an application.
2. Post-application landing `pg:s1x` — Lands in a just-applied state instead of the generic homepage.
3. FAQ `pg:s27` — What happens after I apply, answered before they have to ask.

### Get to my market `jr:jn-local`
`intent: Reach my local market` · `goal: Reach their own country's careers site and its roles.` · `entry: Defaulted onto global: typed ey.com/careers, or search resolved to the global page.` · `exit: Local careers site, or a pre-filtered local job search.`

1. Careers at EY `pg:sc` — Met by the market router in the first viewport, instead of hunting for the country selector.
