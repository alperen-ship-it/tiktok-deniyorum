# s3-urunlesme — productization and operations of TikTok LIVE interactivity

Scout report, 2026-11-09. Evidence tags as defined in ORTAK.md section 5. All stars, forks, dates and counts come
from calls made today. Candidate records: `adaylar.json` (47 entries) in this directory.

## 1. Summary

1. **All four distribution models exist and each has at least one example that is demonstrably in use.** Hosted
   arcades (Livecade: 64 games, Free / Pro $12.99 per month [WEB]), desktop apps with accounts and paid plans
   (TikLiveTTS: Free / $3 / $8 per month [WEB]), a shop renting Windows games by the month
   (baotran113a-dev/hp-game-shop: 8 products, 47 release tags in 6 days [GIT]), and free code with a fork-and-run
   community (zane-tv/tiktok-live-temple-rpc: 230 stars, 351 forks, created 2026-10-31 [API]).
2. **The closest thing to "what we would become if we sold our exe" already runs, and it is run by a non-engineer.**
   hp-game-shop documents the whole back office: trial build with simulated events, machine code, bank-transfer QR,
   offline-verifiable signed licence key, signed revocation list, update feed, bad-word filter, referral codes
   [FILE CLAUDE.md, cap-ma/server.mjs, docs/games.json]. It moved from "send the key by chat" to "key appears on the
   page 10-60 s after the transfer" within five days [GIT 2026-11-04 → 2026-11-09].
3. **The scarce resource in every model is the sign server, and projects solve it in four different ways**: each
   user brings a free EulerStream key (botexe-studio, tokio), the vendor runs a relay with a key pool (Lulu-Finity),
   the app listens to TikFinity Desktop on the same PC and needs no sign server (duycuf kit, cherry9001, chatrd), or
   one hosted process uses one key or none for all tenants (tts-live-v2, vamnguyen) [FILE, see section 5.3].
4. **A direct hosted competitor covers our exact game set.** Livecade lists marble race (viewer photo inside the
   marble, up to 80), horse race, tug of war, trivia and take-the-crown, with 13 overlay languages including Turkish
   [FILE livecade/marble-race-tiktok-live-game/README.md] [API org:livecade = 65 repos].
5. **Most products that bundle `tiktok-live-connector` ignore its licence change.** npm marks 2.4.1 and later as
   AGPL-3.0-only (2.4.0 and earlier MIT) [NPM]. I found it at ≥ 2.4.3 inside a closed paid desktop app, two paid
   hosted services, a "source-available, no redistribution" app whose notice file still calls it MIT, and a wave of
   repos labelled MIT [FILE, section 5.5]. Ours pins `^2.4.3` and bundles it into the exe.
6. **Evidence of real use lives outside GitHub issues.** Ten top repos have 22 issues in total; of the 14 I could
   inspect, 3 came from people other than the owner [API]. The signals that do exist are forks, release cadence,
   price lists, licence infrastructure and community links to Zalo, Discord and Facebook.
7. **Unattended 24/7 interactive setups are a thin segment.** I found one twin of our "open it and leave it"
   rotation (Mateus0790/tiktokfarm, 2 stars) and no complete VPS/headless-OBS setup for interactive TikTok overlays.
8. **No ban report was found, but one repo contains a written policy audit that maps directly onto our design.**
   Two targeted issue searches returned nothing usable. Lehaneploxo/donation-race holds a dated summary of TikTok's
   LIVE rules with a risk table per mechanic [FILE ПРАВИЛА_TIKTOK.md]. By its reading, the risky patterns are a gift
   tied to a chance outcome, a stream that runs with no creator present, and unmarked bots. Our horse race shows
   "bahis açık" and an odds board, and a gift multiplies the viewer's bet up to ×5
   [FILE overlays/at.html:135,156,510-516,695-703]; our README sells "open it, leave it". I could confirm on
   TikTok's own page only that creators answer for third-party tools and that LIVE and gifts are 18+ [WEB]; the
   rest of the audit is unverified.
9. **A Turkish peer already ships the pieces we lack on the text side.** cemo702/FreeTiktokTTS is a free AGPL
   desktop app with a Turkish-aware profanity and spam filter and auto-update [FILE src/main/filters.js, package.json].
   We display viewer names as the largest element on screen and I found no name filter in our code.

## 2. Method

- **Repo search**: 30 queries with results, and two more that returned nothing, through `ara.py` (English,
  Vietnamese, Indonesian, Portuguese, Spanish, Turkish;
  owner listings; README-scoped monetisation queries). 1,251 unique repos returned. Five README-scoped queries
  (`license key`, `zalo`, `stripe subscription`, `multi-tenant`, `browser source`) returned 100 results each, mostly
  unrelated; the Vietnamese one (`"tương tác"`) was the most productive single query.
- **Code search**: 7 of 8 budgeted calls, all "connector next to X in package.json": electron-updater (26 files /
  17 repos), stripe (7 / 7), @supabase/supabase-js (17 / 16), javascript-obfuscator (2 / 2), node-machine-id (1 / 1),
  mercadopago (2 / 1), `hwid` (1, irrelevant).
- **Fork ecosystems**: 3 searches with `fork:only`. **Issues**: 10 repo lookups plus 2 ban-related searches.
- **Search-bucket calls used**: about 56 of 70. Code-search calls: 7 of 8.
- **Clones**: 89 repos cloned, history plus working tree for repos under 60 MB, tree-only above. The 27 that are
  not cited in this report were deleted afterwards; 62 remain (654 MB) under `klon/` for spot checks. Nothing
  was installed, built or run. A read-only digest script (`not/incele.py`) extracted history, tags, manifests,
  licence and keyword-group hits; I then read selected files. One repo (Lehaneploxo/donation-race) was read from
  s1b's clone without modifying it.
- **Web**: WebFetch worked today, 16 fetches. Product sites with content: livecade.io (home, one game page,
  terms), tokelements.com, tiklivetts.es, duycuf.vn, tiktok-live-games.onrender.com, tikfinity.zerody.one. Title or
  app shell only: tuyendungidol.vn/game, live.albiontools.fun. Branded 404: tiktok.gentok.fr. TikTok's own policy
  pages: one rendered the relevant text (accounts-features), three did not (monetization guidelines,
  regulated-commercial-activities, fyf-standards).
- **Leads from the coordinator** (originating with s1b) were checked after the first pass: the livecade org,
  four product repos and one policy document. They are in sections 4.2, 4.11 and 4.12.
- **Excluded, not analysed** (about 100, counted by keyword, so approximate): downloaders/scrapers 53, live
  recorders 14, view/like/follower bots 15, stream-key generators 9, SEO spam about bandwidth/VPS and fake "full
  version" downloads 10, captcha 1.
- **Text addressed to AI agents**: many repos carry `CLAUDE.md` / `AGENTS.md` files and one README contains a
  ready-made prompt for coding agents. I treated all of it as data and followed none of it. It is itself a finding:
  a large share of these products are built by non-engineers directing AI agents.
- **Depth of the 47 candidates**: 11 code-read, 27 readme, 9 tree.

## 3. Landscape

### 3.1 By distribution model

| Model | Examples examined | How it reaches the streamer | Model grade and one line of evidence |
|---|---|---|---|
| (i) Local desktop app | dOtExE97/botexe-studio, iKhunsa/tiktok-tts, tokio-app/tokio, talkaboutdesign/tiklive, Mikasita25/Lulu-Finity, Tigrou6996/gentokinity, pixieontv/pixelychat-releases, kitakeyos-dev/TikDesk, vvrgs/prizvo | Installer from GitHub Releases, vendor site or Microsoft Store; overlay URL on localhost | **A** — TikLiveTTS has 53 tags, 6 authors and a live price page [GIT][WEB] |
| (ii) Hosted web app | livecade/*, tokelements/tokelements, zahrun5/tts-live-v2, vamnguyen/tiktok-live-games, jjHernandez17/interaktik-platform, RICX-FN/PlatChat, OliviaGG/HangStream, dawitmek/Hyperion | Streamer types a username, pastes one browser-source URL | **A** for closed products (Livecade, TokElements price pages [WEB]); **B** for every open-source implementation (complete, real traffic unproven) |
| (iii) Games sold or rented | baotran113a-dev/hp-game-shop, appvidlab/…become-a-king, AthallahDzaki/SA-CHAOS-ELECTRON, hahieume-ui/tikfinity-license-server, kobato-chan1912/tiktok-idol-live | Closed installer plus licence key; sale closed in a chat app or on a static page | **A** — hp-game-shop: price list, 47 release tags, 6 revoked keys in a signed list [FILE][GIT] |
| (iv) Free code with a community | zane-tv/tiktok-live-temple-rpc, Tradingliving/chanh-dien-online, workaipvlinh-byte/*, cherry9001/tiktok-live-bar, duycuf/tiktok-live-kit, steveseguin/social_stream, vortisrd/chatrd | `git clone` or ZIP plus a double-click `.bat`; support in Zalo/Discord/Facebook | **A** — 340 forks found for one repo, at least 8 of the 100 newest pushed after upstream stopped [API] |

### 3.2 Top repos

| Repo | What | Stack / connection | Stars | Forks | Last push | Licence | Grade | Rel. |
|---|---|---|---|---|---|---|---|---|
| baotran113a-dev/hp-game-shop | Shop renting Windows LIVE games; licence back office | static site + Express tool + Worker / unknown | 0 | 0 | 2026-11-09 | none | A | 5 |
| livecade/marble-race-tiktok-live-game (1 of 65) | Listing repo of a hosted game arcade | hosted, closed / third-party connector [WEB] | 1 | 0 | 2026-11-04 | none | A | 5 |
| dOtExE97/botexe-studio | Free local TikFinity replacement (Windows) | Electron Forge + React / tiktok-live-connector ^2.4.3 | 3 | 2 | 2026-10-16 | custom source-available | A | 5 |
| duycuf/tiktok-live-kit | Theme-based overlay/game framework with 5-tab panel | Node + ws + vanilla SDK / TikFinity bridge, connector fallback | 21 | 32 | 2026-11-02 | MIT | B | 5 |
| zahrun5/tts-live-v2 | Multi-tenant SaaS, 11 games, plans, Midtrans | Express + Socket.IO + MongoDB / tiktok-live-connector ^2.5.0 | 0 | 0 | 2026-10-20 | none | B | 5 |
| talkaboutdesign/tiklive | Connector + local event server + overlays; desktop, CLI, npm | TypeScript + Bun/Node + Electron / own signing (claimed) | 7 | 2 | 2026-10-30 | MIT | B | 5 |
| Mateus0790/tiktokfarm | Six self-rotating games, audience votes next | Node + ws + Canvas / tiktok-live-connector 2.5.0 | 2 | 0 | 2026-10-23 | MIT (package.json) | B | 5 |
| iKhunsa/tiktok-tts | TTS + overlays app with Free / No-Promos / Pro | Electron / own client | 7 | 2 | 2026-11-09 | MIT | A | 4 |
| Mikasita25/Lulu-Finity | TikFinity-style app with vendor key relay | Electron + Railway relay / connector 2.4.3 | 0 | 0 | 2026-11-06 | AGPL-3.0-or-later (package.json) | B | 4 |
| vamnguyen/tiktok-live-games | Hosted link generator, one process for many rooms | Express + Socket.IO / connector ^1.1.9 | 75 | 37 | 2026-03-28 | MIT (package.json) | B | 4 |
| zane-tv/tiktok-live-temple-rpc | Most-forked repo of the Vietnamese wave | Bun + ws + Python TTS / connector ^2.1.0 | 230 | 351 | 2026-11-05 | none | A | 3 |
| workaipvlinh-byte/lop-hoc-chu | MIT quiz game already resold by a shop | Vite + Express / connector ^2.5.0 | 73 | 95 | 2026-11-07 | MIT | A | 4 |

## 4. Profiles of the top repos

### 4.1 baotran113a-dev/hp-game-shop — the shop (grade A)
- **What it is**: the public site and the private tooling of a brand that rents closed Windows games by the month
  and recruits streamers for a creator agency on the same site. The games are Electron apps kept outside the repo.
- **Catalogue and prices** [FILE docs/games.json]: fishing 169,000 VND / month and 299,000 / 3 months; wedding
  189,000 / 488,000 / 798,000 lifetime; two-side battle 169,000 / 300,000; province roll-call 150,000 / 300,000;
  battleship 88,000 / 190,000; beer club 120,000 / 280,000; word classroom 50,000 / 100,000; a video-editing app
  150,000 / 300,000.
- **Sales flow** [FILE docs/site.json `game.buySteps`, docs/assets/app.js:154-415]: download the trial → the app
  shows a machine code `XXXXX-XXXXX` → the site draws a bank-transfer QR whose memo carries game and machine code →
  a Cloudflare Worker endpoint returns the key to the waiting page; chat support as fallback. The trial download is
  password-gated, and the password is handed out in a Zalo community group.
- **Licence design** [FILE cap-ma/server.mjs:30-63]: key = `HP1.<base64url {game, machine, expiry, nonce}>.<Ed25519
  signature>`; the issuing tool runs only on 127.0.0.1; renewals extend from the old expiry; revocation is a signed
  JSON on the static site that clients fetch every 30 minutes from three mirrors, with a three-day offline grace
  [FILE CLAUDE.md].
- **Product rules** [FILE docs/site.json `faq`]: the trial plays everything with simulated buttons under a
  "TRIAL" label; only the real LIVE connection needs a key; a key is bound to one PC; minimum spec Windows 10/11
  64-bit, 8 GB RAM; "the game only reads public comments, likes and gifts, no TikTok login"; a "safe mode" makes
  gifts trigger thanks only.
- **Evidence of customers**: the signed revocation list holds 6 revoked key hashes [FILE docs/thu-hoi.json]; the
  agency page lists 97 creators [FILE SESSION_HANDOFF.md]; the domain answers with the shop title [WEB].
- **Caveat**: one sold title is repackaged from workaipvlinh-byte/lop-hoc-chu (MIT) with an activation lock
  [FILE CLAUDE.md]; that upstream depends on the AGPL connector [FILE lop-hoc-chu package.json].

### 4.2 Livecade — the hosted arcade (grade A)
- **What is public**: 65 listing repos created between 2026-08-18 and 2026-11-06. None has a detected programming
  language; sizes run from 56 to 408 KB; no licence; 10 stars and 1 fork across the whole organisation [API]. The
  two I cloned hold a README and three images each [FILE]. Nothing beyond READMEs is public: no client, no SDK, no
  game code. The terms forbid "reverse-engineering or extracting game logic" [WEB livecade.io/terms].
- **What the READMEs are for**: each has the rules, a default gift→action table ("every action is rebindable"),
  settings, languages, a FAQ and a gameplay video on the vendor's CDN, with UTM-tagged links back to the game page.
  The repos are search-engine and GitHub-search landing pages.
- **Claims** [WEB livecade.io]: "Interactive TikTok LIVE games your audience plays in real time"; "60+ live games"
  in the hero and "All 64 games" in the feature list; works in OBS Studio, Streamlabs, XSplit and TikTok LIVE
  Studio; runs in the browser, so macOS, Windows, Linux and Chromebooks.
- **How a streamer connects** [WEB game page, home]: create a Livecade account, pick a game in the dashboard, set
  triggers or keep the defaults, paste one permanent overlay URL as a browser source, go live. The public TikTok
  username is all it asks for; it "never asks for your TikTok password and never logs into your account", reads
  the public LIVE feed "through a third-party connector" and does not use an official TikTok API.
- **Pricing** [WEB]: Free $0 = all free games, unlimited sessions, 60 minutes of live time per day, up to 3 TikTok
  accounts. Pro $12.99/month = unlimited live time, Pro games and premium settings, up to 100 TikTok accounts, 200
  AI credits, priority support. A yearly option is labelled "Save 26%". Card or crypto.
- **Languages and markets**: the marble-race README lists 13 overlay languages — English, Spanish, Portuguese,
  French, German, Italian, Indonesian, Arabic, Turkish, Russian, Hindi, Romanian, Filipino [FILE]; the horse-race
  page says twelve [WEB]. A "For agencies" partner link and the 100-account Pro limit point at agencies.
- **Legal** [WEB terms]: operator named only as "Livecade", Danish law and courts, no company number or address;
  "You are responsible for complying with TikTok's own Terms of Service and Community Guidelines"; liability capped
  at the fees of the previous 12 months; no uptime guarantee; refunds in a separate policy I did not fetch.
- **Detail worth noting**: the horse race exposes "idle drift" and a minimum gift amount as live settings, and six
  settings change without a restart [WEB game page].

### 4.3 dOtExE97/botexe-studio — the solo-built desktop app (grade A)
- 506 commits and 120 tags in three months by one author working with an AI pair programmer [GIT][FILE README.md].
- Distribution: `Setup.exe` on GitHub Releases, background auto-update (Squirrel via `update-electron-app`),
  unsigned, with a three-case guide for SmartScreen, blocked downloads and Smart App Control [FILE README.md].
- Onboarding: first-run tour, a guided "get a free key" step, import of TikFinity `.tfc` profiles, live widget
  preview in the palette, a pre-filled bug/feature form [FILE README.md].
- Operations know-how, the best found in this segment [FILE apps/desktop/src/main/services/key-rotator.ts:1-24,
  apps/desktop/src/main/adapters/tiktok-adapter.ts:136-180]: free EulerStream plan described as 10 WebSockets and
  1000 requests per day; close code 1011 means either "quota exhausted" or "streamer not resolvable", so retry the
  same key twice before rotating; 4401/4403 rotate immediately; 1006/4404/4005 never rotate; an exhausted key stays
  locked until local midnight; silence watchdog after 5 minutes, deliberately late because each reconnect costs
  quota; live-check every 30 s for the same reason.
- Licence: source-available, personal use of official builds only, "commercial / agency / white-label on request"
  [FILE LICENSE]. Its third-party notice lists the connector as MIT [FILE THIRD-PARTY-LICENSES.md:5,21].
- Outside use: 5 issues, 2 by other people, one asking for an English version [API].

### 4.4 duycuf/tiktok-live-kit — the kit (grade B)
- One core, themes dropped into `themes/`, switchable live. No ready-made themes ship; the README tells the user to
  build one with an AI coding agent [FILE README.md].
- Control panel with five tabs: Live (source, status, "last event N s ago"), Rules (gift tiers, per-gift overrides
  from a library that learns gifts seen on live, chat commands with cooldowns, ▶ preview per row), Test (fake
  viewers, bursts of 10/30/60/400, auto mode), Stats (leaderboard, CSV, goals, new session), Guide [FILE README.md].
- `docs/GO-LIVE.md`: three setups (LIVE Studio window capture of a Chrome window, OBS virtual camera into LIVE
  Studio, OBS with a stream key), pre-stream checks, a 12-row symptom→fix table, the safe zone (`/overlay?safe`).
- Event source: TikFinity Desktop first, direct connector as fallback, "Auto" mode, backoff 2-30 s, watchdog,
  `maxJoinsPerSecond` [FILE README.md Configuration].
- Business: none in the repo. The homepage is the author's site for AI teaching and building services and does not
  mention the kit [WEB]. All 32 forks are unmodified copies [API].

### 4.5 zahrun5/tts-live-v2 — open-source multi-tenant SaaS (grade B)
- Per-user room, dashboard and `/overlay/<username>`; state on disk per user; MongoDB for accounts [FILE README.md].
- Auth: password (bcrypt) and Google OAuth with one-time code exchange; JWT; rate limits (login 5/min, registration
  3/h, 200/min per IP); `ALLOW_REGISTER=false` to close sign-ups [FILE README.md, server/.env.example].
- Plans as data: Free 30-day trial (4 gift mappings), Basic Rp 25,000 (20), Pro Rp 50,000 (unlimited, AI questions,
  branding, stats) [FILE server/config/plans.js]. Midtrans is still in sandbox "waiting for approval"
  [FILE server/.env.example].
- Connection manager: one upstream connection per user, 10 retries with delay up to 60 s, a persisted live target
  that reconnects after a server restart for about 15 minutes, gift-streak and msgId de-duplication
  [FILE server/services/tiktokManager.js:9-202].
- Hosting: pm2 behind a Cloudflare Tunnel, with the WebSocket ingress settings written down [FILE README.md].

### 4.6 iKhunsa/tiktok-tts (TikLiveTTS) — open source with a paid account layer (grade A)
- MIT Electron app, 1013 commits, 53 tags, 6 authors, auto-update from GitHub Releases, unsigned [GIT][FILE README.md].
- Plans [WEB tiklivetts.es]: Free; "No Promos" US$3/month or US$25/year; Pro US$8/month or US$85/year; donations.
  The changelog shows the mechanics: Google-only sign-up with a unique nickname, billing screen with invoices,
  discount codes, a Pro paywall on the mobile panel, and spoken sponsor lines on the free tier (first after 15
  minutes, then at most every 25 minutes, only with an audience) [FILE CHANGELOG.md].
- Telemetry: Sentry plus self-hosted Aptabase [FILE package.json, .env.example].
- Connection: its own client package, not `tiktok-live-connector`; the package is not on public npm [NPM 404].

### 4.7 talkaboutdesign/tiklive — a second connection stack with product packaging (grade B)
- Desktop app (macOS, Windows), `npx tiklive`, npm library; MIT; npm shows 9 versions since 2026-10-12 [NPM].
- Claims: no third-party signing service, no login, no headless browser; read-only; "behind a VPN or a datacenter
  IP, TikTok may refuse the connection" [FILE README.md]. I did not test any of this.
- `username=demo` gives fake events; the server refuses non-localhost binding without a token; stable builds are
  promoted nightlies [FILE README.md, docs/operations/release.md].

### 4.8 Mikasita25/Lulu-Finity — vendor relay (grade B)
- 77 tags; auto-update via electron-updater from GitHub Releases; ZIP copies only open the release page
  [FILE NOTICE.md].
- The official build connects to the vendor's WebSocket relay on Railway; the relay holds an `EULER_API_KEYS` array
  and rotates with separate cooldowns for rate/concurrency errors and quota/billing errors
  [FILE RAILWAY_RELAY.md]. The document admits the client token inside an installer can be extracted.
- Declares AGPL-3.0-or-later and names the connector in a NOTICE file — the only AGPL-consistent distributor seen.

### 4.9 Mateus0790/tiktokfarm — our twin (grade B)
- Six games rotate by themselves; people who interacted recently are carried into the next game; in the interval
  the audience votes 1/2/3 and gifts add votes; YouTube chat is merged, Super Chats converted to diamonds
  [FILE README.md].
- Unattended checklist for OBS: reconnect automatically (10 s), do not shut the browser source down when hidden,
  route audio through OBS; simulator from the panel or `--sim`; simulated players stay out of the real ranking.

### 4.10 The Vietnamese wave (grade A as a phenomenon)
- zane-tv/tiktok-live-temple-rpc 230 stars / 351 forks; Tradingliving/chanh-dien-online 2 / 257;
  cherry9001/tiktok-live-bar 126 / 141; workaipvlinh-byte/lop-hoc-chu 73 / 95 and di-chua-online 58 / 81;
  Miinh2k4/LiveTikTokDiChuaCauAn 43 / 49 [API]. Most were created between 2026-10-31 and 2026-11-07.
- Fork behaviour differs: temple-rpc forks are modified (sizes 16.9-41.1 MB against 19.7 MB upstream, pushes after
  upstream's last); about 80 of the 100 newest chanh-dien forks are untouched copies from the creation day [API].
- Shared packaging: Node plus a double-click `.bat`, control page on localhost, LIVE Studio window capture or OBS
  browser source, Microsoft Edge TTS, MIT label, donation QR or a contact in Zalo [FILE READMEs].
- Shared compliance language: "entertainment, not a temple; gifts are not offerings" (di-chua-online), "check
  TikTok's terms before using it on your channel" (chanh-dien-online).

### 4.11 Four product leads passed on by the coordinator
- **cemo702/FreeTiktokTTS (grade B, relevance 5)** — Turkish, free, AGPL-3.0. Electron app reading comments with a
  local Piper voice, including a packaged Turkish voice model; 7 tags in ten days; auto-update through
  electron-updater; per-user install without admin rights; SmartScreen instructions in Turkish [FILE README.md,
  package.json]. Its filter module folds Turkish letters, maps leetspeak, strips links, mentions, hashtags, brackets
  and emoji, and offers mask / `***` / beep / skip modes plus cooldowns, black- and whitelists and regex rules
  [FILE src/main/filters.js:1-30, README.md]. Connection code retries at 2/5/10/20/30 s and carries a note that
  the connector's `disconnect()` must not be awaited, because on a half-open socket it may never resolve and the
  app then stays silent when the stream starts [FILE src/main/tiktok-source.js:10, 340-342]. It is one of two
  projects seen whose own licence matches the connector's (the other is Lulu-Finity). 0 stars, 0 forks [API].
- **isaackogan/TikTokLivePrinter (grade B)** — prints gifts and follows on a thermal receipt printer. Ships "one
  file for macOS, Windows and Linux" that starts a local server on 127.0.0.1 and opens the browser, and an npm
  library; both need an Euler Stream API key [FILE README.md, announcement.md]. The repo description still says
  "(Purchasable)" [API], but the README offers a free download; the money sits in the API key. The licence is "MIT
  with an Excluded Party Restriction" naming the service tik.tools as excluded [FILE LICENSE]. 33 stars, 12 forks.
- **faisalrasheed442/playzy-public (grade B)** — releases, guide and landing page of a closed free Windows app for
  GTA V, Minecraft and "any PC game"; 18 tags; "no event limits, no watermark, no account" [FILE README.md]. Uses
  the Python TikTokLive library with free signing; after a refusal it waits 3 minutes, and after a long wait for the
  stream it "only looks every few minutes" [FILE guide/playzy-guide.md:128-130, 630]. Queue rule: gifts wait during
  a cooldown and are never dropped, likes and chat are dropped instead [FILE guide:542-550]. Donation funding file.
- **Papouth/TikTok-Live-Diamond-Heist (grade C)** — README plus `version.json`. "You need to buy a licence",
  contact on Discord, download from Releases, YouTube setup video [FILE README.md]. No price. 2 stars.

### 4.12 The policy audit in Lehaneploxo/donation-race
`ПРАВИЛА_TIKTOK.md` (Russian, committed 2026-10-12, 17.9 KB) is the author's summary of TikTok's Community
Guidelines and LIVE Monetization Guidelines, with every statement tagged official / third-party / own conclusion and
the source URLs listed. It is a third party's reading. What I could and could not confirm is in section 8.

What the document says [FILE ПРАВИЛА_TIKTOK.md §1-§6]:
- Gambling and "gambling-like" activity is not allowed in LIVE; "gambling-like" may involve no money (social
  casino, mystery boxes); the definition given is staking money or something of value on an uncertain outcome.
- The creator answers for everything in the LIVE, including third-party tools that read or display comments.
- Monetisation can be removed for "inauthentic LIVE" — looped or recorded video presented as live, or content
  "mainly created or run by automation (AI, third-party tools) without meaningful presence of the creator" — and
  for "low quality": passive or unattended streams, static screens.
- "Fake engagement": mechanically repeated requests for gifts, gifts in exchange for actions, and the format "two
  sides, send gifts or likes for yours" as the only content.
- Penalties escalate from an in-app warning to temporary and then permanent loss of gifts, LIVE Match and rankings.
- A LIVE that is not eligible for the For You feed is not eligible for monetisation either.

Its own risk table [FILE §7], abridged:

| Mechanic | Risk it assigns | Mitigation it lists |
|---|---|---|
| Looped AI video of a "streamer" | high | real webcam or label it |
| Games that run by themselves | medium | creator present on camera or by voice, reacting to names and gifts |
| Bots with realistic nicknames | low to medium | mark them visibly (icon, "BOT", grey) |
| Gift speeds up or hits | fine | outcome depends on participation; do not promise prizes |
| Any random outcome for a gift (roulette, random prize) | high | do not build it; do not present chance as a win for a gift |
| Promo links on screen | low | keep small |
| Empty waiting screen | low | keep motion on screen |
| Table "Rose = Turbo" with gift images | fine | explain rules, do not pressure |

The same repo shows an invite-only hosted setup: a hard-coded list of usernames allowed to open a room, deployed on
Railway with restart-on-failure [FILE РАЗРЕШЁННЫЕ_АККАУНТЫ.md, railway.json].

## 5. Answers to the six questions

### 5.1 Distribution models
- **(i) Desktop.** Update: electron-updater or Squirrel reading GitHub Releases (botexe-studio, TikLiveTTS, tiklive,
  tokio, Lulu-Finity), a vendor URL (Gentok `publish.url` [FILE package.json]), Velopack with a signed release
  index (SA-CHAOS [FILE main/server/updater.js]), or only an in-app notice read from a public JSON (hp-game-shop).
  Licence: none (free apps), online key + machine id (kobato [FILE license.js]), key + e-mail + device count
  (hahieume [FILE server.js:41]), token + expiry + hardware id (SA-CHAOS [FILE scripts/schema.sql]), offline signed
  key (hp-game-shop). Protection: javascript-obfuscator (2 repos [API code search]), bytenode (TikControl extract
  [FILE .tikcontrol-extract/package.json]) — and the extract proves it gets unpacked. **Nobody signs their Windows
  build**: botexe-studio, tiklive, TikLiveTTS, GoldenRelay, Nexus and hp-game-shop all document the SmartScreen
  click-through [FILE READMEs, site.json]. PixelyChat avoids it through the Microsoft Store [FILE README.md].
- **(ii) Hosted.** Many rooms = one process holding one upstream connection per username, reference-counted and
  dropped after idle (vamnguyen [FILE TikTokService.js:63-72, 313-331]; tts-live-v2 [FILE tiktokManager.js]); a
  separate worker for sockets (Klaups). Sign keys: one shared optional key (tts-live-v2, interaktik) or none
  (vamnguyen). No proxy handling was seen in any open hosted project. Auth: none (vamnguyen), a hard-coded
  allowlist of streamer usernames (donation-race [FILE РАЗРЕШЁННЫЕ_АККАУНТЫ.md]), password + Google
  (tts-live-v2), Google + official TikTok OAuth for channel ownership (HangStream [FILE README.md:136-188]).
  Payments: Midtrans, MercadoPago + Wompi, Stripe subscriptions, Stripe Connect, PayPal. Per-streamer data: folder
  per user on disk, MongoDB, PostgreSQL, SQLite, Supabase, or nothing but Stripe metadata (PlatChat).
- **(iii) Sold games.** One working shop (4.1), one Telegram-only listing from 2023 (appvidlab), one licence
  server for a football game (hahieume), one token-licensed game mod (SA-CHAOS). Custom work is offered in passing
  ("need a game for your room, message me" [FILE docs/site.json `game.author`]); no price for custom work anywhere.
- **(iv) Free with community.** See 4.10, plus long-running tools (Social Stream Ninja: 6877 commits, 50 authors).

### 5.2 Monetisation evidence

| Product | What is charged | Source |
|---|---|---|
| Livecade | Free (60 min/day, 3 accounts) / Pro $12.99 per month, yearly discount | [WEB] |
| TokElements | Free / Pro $18 per month or $151.20 per year, merchant of record Creem | [WEB] |
| TikLiveTTS | Free / No-Promos $3 per month / Pro $8 per month | [WEB] |
| Gentok | 8.99 / 24.99 / 44.99 / 79.99 EUR for 1 / 3 / 6 / 12 months, one-off payments | [FILE src/server.js:270-275] |
| hp-game-shop | 50,000-189,000 VND per game per month; one lifetime plan 798,000 VND; 10% referral | [FILE docs/games.json] |
| tts-live-v2 | Rp 25,000 / Rp 50,000 per 30 days after a 30-day trial (sandbox) | [FILE server/config/plans.js] |
| PlatChat | Stripe monthly + annual, 7-day trial; amounts live in Stripe | [FILE README.md:60-73] |
| SeliGames | free / basic / pro / ultra with admin-approved pending payments | [FILE subscription.js:62-104] |
| Nexus Multi-Streamer | one-time key by e-mail, three PCs | [FILE README.md] |
| botexe-studio | free; agency / white-label licence on request; "gift me on my LIVE" | [FILE LICENSE, README.md] |
| TikTok-Live-Diamond-Heist | paid licence bought through Discord; no price published | [FILE README.md] |
| TikTokLivePrinter | app free; needs an Euler Stream API key | [FILE README.md] |
| Playzy, FreeTiktokTTS | free; donation buttons / funding file | [FILE README.md, .github/FUNDING.yml] |
| Vietnamese free repos | donation QR, coffee tip, contact in Zalo/Facebook | [FILE READMEs] |

Licence-server quality varies. The football licence server leaves every admin route open (`requireAdmin` is a
no-op) and ships sample admin credentials [FILE server.js:20-31, database.sample.json]. The offline signed key of
hp-game-shop needs no server at all.

### 5.3 Operations
- **Sign-server quota**: per-user free key with rotation (botexe-studio), vendor relay with key pool (Lulu-Finity),
  TikFinity Desktop as the local source (duycuf, cherry9001, chatrd, zane-tv's RPC), one shared key (hosted).
  interaktik's env file says the keyless community limit is "easily exhausted with many users" [FILE .env.example].
- **Reconnect**: 2→32 s with ±30% jitter, 5 tries, only while someone watches (vamnguyen); 10 tries up to 60 s plus
  a 15-minute restore after restart (tts-live-v2); 2→30 s plus silence watchdog (duycuf); 5-minute silence watchdog
  and an `isReconnect` flag so leaderboards survive (botexe-studio); duplicates removed by message id (tiklive,
  tts-live-v2); a 2/5/10/20/30 s ladder and "never await disconnect()" (FreeTiktokTTS); waiting for the stream
  slows to every few minutes, and a refused sign request pauses 3 minutes (Playzy).
- **Load shedding**: gifts queue and are never dropped, likes and chat are dropped (Playzy); join floods capped per
  second (duycuf).
- **Unattended running**: tiktokfarm's OBS checklist; vamnguyen says "designed for 24/7 streaming with OBS" without
  detail; one planning repo for FFmpeg loops on a VPS (not interactive); one headless-OBS container for another
  platform. tiklive warns datacenter IPs may be refused, which matters for any VPS plan.
- **Logging and analytics**: Sentry (botexe-studio, TikLiveTTS), self-hosted Aptabase (TikLiveTTS), session history
  by week/month/year (botexe-studio), coin statistics by date range (tokio), CSV of supporters (duycuf), a
  revenue-per-streamer table on the vendor side (SA-CHAOS).
- **Moderation**: shared filter with hide/mute lists and a name-only list, written "to avoid TikTok locking or
  killing the live" [FILE hp-game-shop loc-tu-bay/loc-tu-bay.mjs:2-88]; blocked words per account (TikLiveTTS);
  per-viewer cooldown and queue caps (tokio); escaping viewer names before `innerHTML` (tts-live-v2) and before
  TTS XML (Tradingliving).
- **TTS**: Microsoft Edge voices almost everywhere, with pre-rendered fixed lines and a local Windows fallback
  (duycuf, Lulu-Finity); local models (Piper, ZeroTTS) in a few.
- **Languages**: 13 (Livecade), 15 (PixelyChat), 10 TTS languages (TikLiveTTS), EN/ES (tokio); most small projects
  are single-language.

### 5.4 Onboarding
- Panels with a gift→action editor: duycuf (learned gift library, per-row preview), botexe-studio (trigger rules,
  visual gift picker), tts-live-v2 (gift mappings capped by plan), SA-CHAOS (gift vote points), Livecade (rebindable
  actions).
- Test modes: `username=demo` (tiklive), Test tab with crowd bursts (duycuf), simulator and `--sim` (tiktokfarm),
  trial build that is fully playable on simulated events (hp-game-shop), debug page listing raw events (vamnguyen),
  fake viewers through the real preset (Playzy), "Test print" (TikTokLivePrinter).
- Settings portability: export and import of the whole configuration as one JSON file (TikTokLivePrinter).
- Docs and video: GO-LIVE guide with troubleshooting (duycuf), first-run tour (botexe-studio), per-game guide pages
  and embedded YouTube demos (hp-game-shop), tutorial page inside the app (SA-CHAOS), docs site (tokio), manual and
  video tour (PixelyChat).

### 5.5 Risk and compliance
- **Statements found**: "not affiliated" (Livecade, TikFinity, tokio, duycuf, Lulu-Finity); "private protocol, may
  break, check TikTok's terms" (tiklive, Tradingliving, di-chua-online); "you are responsible for your LIVE content"
  (hp-game-shop FAQ, Livecade); terms that disclaim third-party outages (tts-live-v2).
- **Gambling-like mechanics** are common and unremarked: wheels, slot machine and "lucky card" (botexe-studio has
  a design spec literally named "gambling family"), roulette repos, a fortune wheel with Stripe and a winners page
  (YehorBelenkov/Egorly). The only mitigations seen are hp-game-shop's "safe mode" and Livecade's "no gift needed".
- **Ban reports**: none found. The four "banned" hits in the connector's issue tracker are connection errors by
  title [API].
- **TikTok's own text, as far as I could fetch it** [WEB tiktok.com/community-guidelines/en/accounts-features]:
  "LIVE creators are responsible for anything that happens during their sessions", "even when it involves
  third-party tools like voice-to-text software"; "You must be 18 and older to go LIVE and to send gifts"; released
  August 25, 2026, effective September 24, 2026.
- **A third party's reading of the rest**: section 4.12. Its claims on gambling-like activity, unattended or
  automated streams and gift solicitation were not confirmed today.
- **Policy-driven design in other repos**: a filter written "to avoid TikTok locking or killing the live"
  (hp-game-shop), a disclaimer that gifts are not offerings (di-chua-online), "Rockstar bans accounts" warnings for
  game mods (Playzy guide), "check TikTok's terms" (Tradingliving, tiklive).
- **Who bundles `tiktok-live-connector` at an AGPL version (≥ 2.4.1 [NPM])** — recorded for s4, not analysed:
  - closed and paid: Tigrou6996/gentokinity (^2.4.4, desktop, Stripe); zahrun5/tts-live-v2 (^2.5.0, hosted, plans);
    OliviaGG/HangStream (^2.5.0, hosted, Stripe optional); ZextyFL/Klaups (^2.5.0, hosted, Stripe Connect);
    hp-game-shop's repackaged word game (upstream ^2.5.0) [INFERRED from CLAUDE.md];
  - free but under another licence: dOtExE97/botexe-studio (^2.4.3, source-available, notice says MIT);
    RICX-FN/PlatChat (^2.5.0, MIT, paid service); duycuf/tiktok-live-kit (^2.5.0, MIT, fallback only);
    Tradingliving/chanh-dien-online (2.5.0), workaipvlinh-byte/* (^2.5.0), Mateus0790/tiktokfarm (2.5.0),
    nqthaivl/chuaonline-electron-no-api (^2.5.0), dawitmek/Hyperion (^2.5.0, GPL-3.0-or-later);
  - consistent: Mikasita25/Lulu-Finity (AGPL-3.0-or-later + NOTICE.md) and cemo702/FreeTiktokTTS (2.5.0; LICENSE
    AGPL-3.0, package.json AGPL-3.0-only, README names the connector's licence);
  - MIT-era pins: vamnguyen (^1.1.9), SA-CHAOS (^1.1.9), TikControl extract (2.1.0), interaktik, SeliGames and
    donation-race (2.1.1-beta1), kobato (^2.0.3), zane-tv (^2.1.0). Caret ranges on 2.x resolve to the newest 2.x
    on a fresh install unless a lockfile pins them [INFERRED];
  - avoiding it: TikLiveTTS (own client), tiklive (own, MIT), tokio (`@tokioapp/connector`, MIT, only dependency
    `ws` [NPM]), TikTokLivePrinter (Euler Stream WebSocket SDK), Playzy (Python TikTokLive), and every
    TikFinity-bridge project.

### 5.6 Bottom line for a solo streamer with one exe

| Next step | Realistic? | What it requires | Who shows it works |
|---|---|---|---|
| A. Keep one exe, make it robust enough to hand to a few other streamers for free | Yes, small | update notice from a public JSON (we already have `--klasor`), SmartScreen instructions, a source switch (direct / TikFinity) with a "last event" indicator, a troubleshooting page, each user's own sign key | botexe-studio, duycuf kit |
| B. Publish the code and grow a fork-and-run community | Yes, small — but give up control | a licence decision that fits the connector, a one-click launcher, a chat group for support; expect resellers | Vietnamese wave; hp-game-shop reselling an MIT game |
| C. Rent the exe by the month | Possible for one person, medium | everything in A, plus: trial gated on the real connection, signed offline keys and a revocation list, a payment rail and a chat support channel, releases per version, a connector licence that allows a closed paid binary, a per-customer answer to sign quota | hp-game-shop (8 products, non-engineer owner) |
| D. Sell through an agency or to agencies | Possible, depends on a relationship | B2B contact with a LIVE agency; multi-account pricing; on-site setup help | hp-game-shop (97 agency creators), Livecade Pro "up to 100 accounts" |
| E. Hosted service where the streamer only pastes a URL | Not as a next step | multi-tenant server, accounts, payments, legal pages, paid sign capacity or a key pool, an answer to datacenter-IP refusal, uptime, and network-service obligations of the connector licence; a competitor already sells 64 games with Turkish UI for $12.99 | Livecade, TokElements (closed); tts-live-v2 (open, payments not live) |

## 6. Comparison with ours

| Topic | Ours [FILE] | What others do |
|---|---|---|
| Packaging | Node SEA single exe, about 90 MB, built in GitHub Actions on dispatch or tag (`server/paketle.js`, `exe-uret.yml`) | Electron installers (most), Bun-compiled binaries per OS (mashupsolution), Node + `.bat` (Vietnamese wave) |
| Getting the exe | Actions artifact (30-day retention) or a tagged Release (`README.md`) | Release page with "latest" link; Microsoft Store (PixelyChat); vendor site |
| Updates | none automatic; `--klasor` loads overlay files from a folder (`server/bridge.js:62-93`) | background auto-update, or an in-app notice from a public JSON |
| Signing | unsigned | unsigned everywhere, but documented |
| Licence / payments / accounts | none | see 5.2 |
| Sign key | optional `--key` / `EULER_API_KEY`, keyless by default (`bridge.js:641-657`) | guided free-key step per user; key rotation; relay; TikFinity |
| Waiting for the stream | retry every 15 s by default (`bridge.js:79, 709-711, 788-790`) | 30 s chosen explicitly to spare quota (botexe-studio) |
| Drop handling | fixed 10 s reconnect (`bridge.js:718`); I saw no silence watchdog in a keyword scan | backoff with jitter, silence watchdog, reconnect flag, dedupe |
| Event source choice | `tt.js` already speaks the TikFinity format (`server/package.json` notes) | exposed as a panel switch with "Auto" (duycuf) |
| Test mode | `--mock`, `?mock=1`, "send test event" in the panel | same idea, plus crowd bursts and "simulated players not ranked" |
| Measurement | `server/istatistik.js`: unique chatters, first-time and returning viewers, messages, likes, gifts per game, local JSON | session totals, leaderboards, CSV, week/month/year history; none of those read shows first-time or returning viewers per game |
| Moderation | no name or comment filter found in a keyword scan of `overlays/` and `server/` | filters for names and comments before display and speech; a Turkish-aware one exists (FreeTiktokTTS) |
| Chance and gifts | horse race shows "bahis açık" and an "ORAN TAHTASI" (odds board), pays points by pari-mutuel odds, and a gift multiplies the viewer's bet up to ×5 with the announcer line "bahsini katladı" (`overlays/at.html:5,135,156,291-300,510-516,695-703`) | the audit in 4.12 rates "random outcome for a gift" as its highest risk; Livecade's horse race is a push race with no wager [WEB]; hp-game-shop ships a "safe mode" |
| Unattended running | README promises "aç, bırak, karışma" and rotation without the streamer (`README.md:5-9, 74-80`) | the audit rates self-running games as medium risk unless the creator is present by voice; tiktokfarm makes the same promise as ours |
| Bots in an empty room | marked with 🤖 according to `overlays/_shared/tt.js:904` and the README | the audit asks for exactly that; Livecade uses "idle drift" instead of fake players |
| Layout | fixed 1920×1080 landscape | almost everyone else targets 1080×1920 portrait |

Two points where we are ahead of what I read: the per-game engagement-breadth measurement, and bots that are
labelled as bots. One point where we differ from nearly the whole field: landscape canvas. Two points where our
current wording and mechanics sit on the wrong side of the one policy audit I found: the betting vocabulary with a
gift multiplier, and the "streamer does nothing" promise. Both are flagged on a third party's reading of the rules,
not on TikTok's text.

## 7. Ideas worth taking

1. **Quota-aware waiting and reconnect** — poll for "is live" less often, treat ambiguous close codes with a retry
   before giving up, add a silence watchdog. dOtExE97/botexe-studio
   `apps/desktop/src/main/services/key-rotator.ts`, `apps/desktop/src/main/adapters/tiktok-adapter.ts:136-180`.
2. **Do not reset round state on a short reconnect** — same adapter, `isReconnect` flag (lines 9-42).
3. **Source switch in the panel: Direct / TikFinity / Auto, with "last event N s ago"** — duycuf/tiktok-live-kit
   `src/providers/manager.js`, README "Control panel". Our `tt.js` already understands both formats.
4. **Crowd-burst test and unranked simulated players** — duycuf README "Test" tab; Mateus0790/tiktokfarm README §3.
5. **A go-live page with a symptom→fix table and a safe-zone view** — duycuf `docs/GO-LIVE.md`.
6. **Update notice from a static JSON (version, download, changes)** — hp-game-shop `docs/games.json` + `CLAUDE.md`.
7. **Filter names and comments before they reach the screen or a voice; separate "hide" and "mute" lists** —
   hp-game-shop `loc-tu-bay/loc-tu-bay.mjs`. Escape viewer strings — zahrun5/tts-live-v2 `server/public/shared/safe.js`.
8. **A "gifts are thanks only" switch and a plain "no gift needed to play" line**, relevant to our horse-race
   predictions — hp-game-shop `docs/site.json` (faq), Livecade README FAQ.
9. **Let the audience vote for the next game between rounds** — tiktokfarm README.
10. **Unattended-OBS checklist in our README** — tiktokfarm README §4.
11. **CSV of supporters and a per-session history** on top of `istatistik.js` — duycuf README "Stats";
    botexe-studio `docs/plans/2026-06-13-live-feedback-5h-stream.md` (B3.3).
12. **A NOTICE file naming the unofficial connector, its licence, what leaves the PC and how updates are fetched**
    — Mikasita25/Lulu-Finity `NOTICE.md`.
13. **Only if selling**: offline signed keys with a signed revocation list — hp-game-shop `cap-ma/server.mjs`;
    trial gated on the real connection — hp-game-shop `docs/site.json`.
14. **A Turkish-aware filter for names and comments** (letter folding, leetspeak, link and emoji stripping, mask or
    skip modes) — cemo702/FreeTiktokTTS `src/main/filters.js`. AGPL-3.0: usable as code only if our distribution is
    AGPL-compatible; otherwise as a design.
15. **Decouple gifts from chance in the horse race and drop the betting vocabulary** ("bahis", "oran", "bahsini
    katladı") — reasoning in Lehaneploxo/donation-race `ПРАВИЛА_TIKTOK.md` §3 and §7; a non-wager alternative is
    Livecade's push race (livecade/horse-race-tiktok-live-game `README.md`).
16. **Never drop a gift-triggered effect; drop likes and chat under load instead** — faisalrasheed442/playzy-public
    `guide/playzy-guide.md:542-550`.
17. **Do not await the connector's `disconnect()` in the retry path** — cemo702/FreeTiktokTTS
    `src/main/tiktok-source.js:340-342`. Worth checking against our `server/bridge.js`.
18. **Slow the "waiting for the stream" poll after a long wait** — playzy `guide/playzy-guide.md:630`; botexe-studio
    uses 30 s for the same reason.
19. **Keep our own one-page rules audit** with a row per game, in the form of donation-race `ПРАВИЛА_TIKTOK.md` §7.

## 8. Could not verify

- Download counts and user counts of anything (release API blocked; no product states a number).
- Sales or revenue of any seller. For hp-game-shop the only customer evidence is 6 revoked key hashes and the
  agency roster.
- Whether Livecade and TokElements use `tiktok-live-connector` (closed; Livecade only says "third-party connector").
- tiklive's claim to work without a signing service; the behaviour of `@tokioapp/connector`; TikLiveTTS's client.
- EulerStream free-tier limits. Projects state different figures: 10 WebSockets and 1000 requests per day
  (botexe-studio code comment), 2500 requests per day (our own notes), "community limit" (interaktik).
- Whether our 15-second waiting loop consumes sign-server quota on every attempt.
- Any ban or restriction caused by these tools. No report found; absence of reports is not evidence of safety.
- TikTok's own rules. Confirmed on TikTok's page today: creator responsibility for third-party tools, 18+ for LIVE
  and gifts, and the guideline dates. **Not confirmed**: that gambling-like activity is banned in LIVE and how it
  is defined; that unattended or automation-run streams lose monetisation; the gift-solicitation and "two sides"
  rules; the penalty ladder. Three official pages returned no usable text (monetization guidelines,
  regulated-commercial-activities, fyf-standards). Those points rest on one repo author's summary dated 2026-10-12.
- Whether our horse race would actually be treated as gambling-like. The flag in section 6 is my inference from
  that summary.
- Livecade: company identity, refund policy, pricing page beyond the home page, the agencies page, user numbers.
- Whether TikTokLivePrinter was ever sold ("Purchasable" appears only in the repo description).
- Live status of tts-live-v2 (shell only) and Gentok (404 at the root); real payments in tts-live-v2 (sandbox).
- Homepages not attempted: ongchummo.com, tik.tools, pixelychat.com, tokio.ialfaro.com, interaktik, cayvoy.com,
  mionova.xyz, hyperion.dawitmek.dev.
- Code not read beyond manifest and tree: Hyperion, interaktik, TikLiveTTS, SeliGames, Klaups, novaboost-live,
  Sardwyn/scraplet-dashboard, the 17 Electron apps from the electron-updater code search other than Lulu-Finity.
- Payment rails available to a seller in Turkey: not researched.
- Code-signing cost and the Microsoft Store route for a Node SEA exe: not researched.

## 9. Handoffs

**To s4-baglanti**
- talkaboutdesign/tiklive — MIT connector claiming no sign server; npm `tiklive` 0.6.0.
- tokio-app/tokio and its `@tokioapp/connector` (MIT, depends only on `ws`, uses the user's EulerStream key).
- iKhunsa/tiktok-tts — private client `@tiklivetts/tiktok-live-client`.
- dOtExE97/botexe-studio `key-rotator.ts` — close-code table and quota figures; Mikasita25/Lulu-Finity
  `railway-relay/` — key pool relay.
- The bundling list in 5.5. EulerStream/TikTok-Live-Api, EulerStream/TikTok-LIVE-Overlays, tiktool/tiktok-live-agency
  and tiktooldev/obs-tiktok-captions (tik.tools), nglmercer/obs-tiktok-widgets (Rust connection).
- isaackogan/TikTokLivePrinter `LICENSE` — an MIT variant that excludes the service tik.tools by name: providers of
  the connection layer compete through licence terms.
- cemo702/FreeTiktokTTS `src/main/tiktok-source.js:340-342` — note on not awaiting `disconnect()` of
  tiktok-live-connector 2.5.0; and a complete AGPL-consistent packaging of that connector by a Turkish developer.
- faisalrasheed442/playzy-public `guide/playzy-guide.md:126-130` — user-facing explanation of free signing limits
  with the Python TikTokLive library ("sign server is busy", 3-minute wait).

**To s1a-merkezler**
- Mateus0790/tiktokfarm — self-rotating six-game hub with interval voting.
- duycuf/tiktok-live-kit — core + themes architecture; vamnguyen/tiktok-live-games; zahrun5/tts-live-v2 (11 games
  per room); ThangBaymau123/tiktok-live-overlay (boss battle, quests); obulut05/tiktok-live-games (Turkish
  platform); lordtx/integra-contexto; Jaisartuyk/LiveGames-SaaS; onykage/tiktok-live-toolkit.

**To s1b-mekanikler**
- livecade/* — 65 game READMEs with rules and default gift mappings, including marble race, horse race, boys vs
  girls, trivia and take-the-crown.
- hp-game-shop `docs/games.json` — feature lists of fishing, battleship, province roll-call and two-side battle games.
- workaipvlinh-byte/* (quiz, wedding, fish pond), zane-tv and the temple clones, omerfys/tiktok-live-rating-overlay
  (Turkish 1-10 rating), k0d1r/tiktok-live-interactive-game, kiozhu/battle-ring, YehorBelenkov/Egorly (fortune wheel).

**To s2-motorlar**
- cherry9001/tiktok-live-bar (Unity, 126 stars, 141 forks) and its fork mynh19122003/dj-live-stage.
- AthallahDzaki/SA-CHAOS-ELECTRON (GTA San Andreas), MiokoTech/MioNova-Tiktok-Interagtion (GTA V),
  PrintGoldenMan/goldenrelay-releases (Minecraft RCON), TimeCodings/TikTokLIVEMC, jakob-kruse/tikfinity_mod,
  speedTD/Tiktok_Live_bar_Donate, obrunogonzaga-games/tiktok-live-climb, RedruM-AU/RedruMs_Interactive_Zombies_Tool,
  dawitmek/Hyperion (chat presses keys), edgehacker/live-helper and SwaggyMacro/BarrageGPT (Chinese platforms).
- faisalrasheed442/playzy-public — GTA V script with 56 effects and 20 challenges, Minecraft RCON, key presses.
- Papouth/TikTok-Live-Diamond-Heist — paid game, engine unknown.

**Back to s1b-mekanikler**
- Lehaneploxo/donation-race: I used only its policy audit and hosting files; its games remain yours. The audit's
  risk table (section 4.12) applies to any mechanic where a gift buys a chance outcome.
