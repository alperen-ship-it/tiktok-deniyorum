# s4-baglanti — connection layer: connector libraries, sign servers, licences, health of our dependency

Date of all measurements: 2026-11-09. Nothing was connected to TikTok or to any sign server; every statement
about "works / does not work" is static evidence (source, registries, git history, issues, third-party reports).

Evidence tags: `[API]` GitHub search API today · `[FILE path:line]` file read today · `[GIT]` git history/tags ·
`[README]` author's own claim · `[ISSUE repo#n]` · `[NPM]`/`[PYPI]` registry · `[WEB]` page fetched today through
WebFetch/WebSearch (the fetch tool summarises pages with a small model, so quoted sentences are as that tool
returned them) · `[INFERRED]` · `[MEMORY]`.

---

## 1. Summary

1. **The July exe (connector 2.4.3) most likely still connects, but this is unverified — risk MEDIUM.**
   Between 2.4.3 and the current release 2.5.0 the built library differs in 58 lines: the 429 error object,
   session-cookie handling, and the handshake error text `[FILE dist/lib-*.js of both tarballs]`. The WebSocket
   layer, default parameters, device presets, room-ID routes, protobuf schema (0.2.4) and Euler SDK
   (0.4.0-beta1) are identical from tag v2.4.3 to today's HEAD `[GIT diff]`. The sign route it calls,
   `GET /webcast/rooms/{room_id}/connect`, is still in EulerStream's public spec regenerated 2026-11-04, with
   "Anonymous access is supported" `[FILE EulerStream/TikTok-Live-Api spec/openapi.json]`.
2. **What changed since July is on the server side.** On 2026-09-09 TikTok tightened its webcast endpoints;
   EulerStream's signing broke for about a day and it began handing clients a socket on its own proxy
   (`wss://ws-fallback.eulerstream.com/`) instead of a TikTok address
   `[ISSUE isaackogan/TikTokLive#376, #379; zerodytrash/TikTok-Live-Connector#329; EulerStream/TikTok-Live-Api#9]`
   `[GIT isaackogan/TikTokLive be3dceb]`.
3. **2.4.3 handles failure badly.** A rate-limit answer (429) throws
   `TypeError: Cannot read properties of undefined (reading 'retry-after')` `[ISSUE zerodytrash#330]`
   `[FILE tiktok-live-connector@2.4.3 dist/lib-CbB_CSnH.js:916]`; our bridge then prints that text and stops
   retrying `[FILE server/bridge.js:795-829]`. Fixed in 2.5.0.
4. **Cheapest fix: press "Run workflow".** We have no lockfile and CI runs `npm install`
   `[FILE .github/workflows/exe-uret.yml]`, so `^2.4.3` now resolves to 2.5.0 `[NPM dist-tags.latest]`. The export
   list is identical `[FILE dist/index.js of both]` — no code change is required.
5. **Licence: our use is allowed.** 2.4.1+ is AGPL-3.0-only plus custom Section-7 permissions; Section 18 names
   "TikTok LIVE Overlay services, TikTok LIVE games, TikTok LIVE Stream Bots" as uses that do not require AGPL
   adoption; Section 19 excludes hosted SaaS / relay / scraping API `[FILE LICENSE:671-696]`. The maintainer
   approved a *paid* desktop app that bundles the library `[WEB zerodytrash#332]`.
6. **A route without any third-party sign server exists and is spreading.** Three independent code bases open
   `wss://webcast-ws.tiktok.com/webcast/im/ws_proxy/ws_reuse_supplement/` with only a guest `ttwid` cookie:
   PirateTok (0BSD), tiklive (MIT), and (with a locally computed signature) nglmercer/tiktok-signer.
   Code search finds this URL pattern in 25 repos `[API]`. One contrary lab measurement exists (section 6.3).
7. **Everything established depends on one person's service.** Node, Python, Java, Go, C# and the Rust port
   all sign through EulerStream; its operator is also the connector's active maintainer
   `[README of each library]` `[NPM maintainers]`.
8. **tik.tools is a second paid service, not a free alternative.** Its free tier became a 7-day evaluation on
   2026-09-28 `[GIT tiktool/tiktok-live-api 172ff72]`.

---

## 2. Method

Channels used: GitHub search API through the shared helpers (about 22 search-bucket calls, 21 code-search
calls), `git clone --filter=blob:none` for history, npm/PyPI registries, `npm pack --ignore-scripts` tarballs
read without installing, raw.githubusercontent.com for single files, and WebFetch/WebSearch (worked today:
10 fetches, 2 searches). `/repos/...` endpoints and the GitHub MCP tool were refused for repositories outside
this session; both suggested attaching the repository with `add_repo`. I did not do that — it was not asked for.
Issue *comments* therefore come from WebFetch on the public issue page.

Repository searches (result counts): `org:EulerStream` 7 · `user:tiktool` 12 · `user:tiktooldev` 3 ·
`org:PirateTok` 16 · `TikTokLiveSharp in:name` 4 · `tiktok live connector language:Rust` 4 ·
`tiktok sign server webcast` 1.
Issue searches: zerodytrash/TikTok-Live-Connector (284 total, 40 newest read) · isaackogan/TikTokLive (283 total,
40 newest read) · org:PirateTok (4) · org:EulerStream (9).

Code searches (total_count today):

| Query | Hits | Distinct repos in the page returned |
|---|---:|---:|
| `"tiktok-live-connector" filename:package.json` | 657 | 97 of first 100 |
| `TikTokLive filename:requirements.txt` | 160 | 99 of first 100 |
| `TikTokLiveSharp` (any file) | 164 | 52 |
| `TikTokLiveSharp filename:csproj` / `filename:manifest.json` (Unity) | 8 / 9 | 3 / 9 |
| `"ws://localhost:21213"` (TikFinity) | 89 | 42 |
| `"127.0.0.1:21213"` (TikFinity; some unrelated hits) | 114 | 38 |
| `ws.eulerstream.com` (Euler managed WebSocket) | 90 | 39 |
| `api.tik.tools` | 136 | 18 (mostly tiktool's own repos) |
| `"@tiktool/live" filename:package.json` | 10 | 10 |
| `"piratetok-live-js" filename:package.json` | 10 | 10 |
| `ws_reuse_supplement ws_direct` (direct socket implementations) | 33 | 25 |
| `"tiktok-live-api-sdk"` / `"@eulerstream/euler-api-sdk"` in package.json | 5 / 9 | 5 / 8 |
| `TikTokLiveJava filename:pom.xml` / `gotiktoklive filename:go.mod` | 8 / 11 | 2 / 11 |
| `signApiKey TikTokLiveConnection` | 146 | 70 |
| `EULER_API_KEY` / `SIGN_API_KEY tiktok` | 279 / 407 | 49 / 57 |
| `"SignConfig.basePath"` / `skipFetchRoomIdFromEulerRoute` | 34 / 13 | 26 / 6 |
| `"ws-fallback.eulerstream.com"` | 4 | 3 |
| `webSocketFrameReceived tiktok webcast` (browser capture) | 18 | 9 |
| `deserializeWebSocketMessage tiktok-live-connector` | 16 | 8 |
| `piratetok` | 752 | 22 |

Excluded, not analysed: 3 live recorders (tiktool/tiktok-live-recorder, renmu123/biliLive-tools,
hua0512/rust-srec), 1 stream-key tool (yesidcasallas/TikTok-OBS-Connector), 1 view-bot spam issue
(zerodytrash#293).

Text addressed to AI agents that I met and did not act on: `AGENTS.md` in tiktool/docs (a Mintlify template),
`CLAUDE.md` in workaipvlinh-byte/lop-hoc-chu and ymstar/dyhub, `.claude/agents/` in cevikademm/Tiktok-V.1.01.

Scope decision: the brief says "do not connect to TikTok or any sign server". I read EulerStream's public
pricing and docs pages through WebFetch (marketing site, not the API) and searched developers.tiktok.com through
WebSearch. No request was sent to api.eulerstream.com, api.tik.tools or any TikTok live endpoint.

---

## 3. Our dependency: tiktok-live-connector

### 3.1 State today
2293 stars, 496 forks, licence AGPL-3.0, default branch `ts-rewrite`, 27 tags (latest v2.5.0), 284 issues in
total, last push 2026-11-04 `[API]`. 451 commits; since April 2026 almost all by isaackogan plus release
bots `[GIT]`. npm maintainers: zerodytrash, isaackogan `[NPM]`.

### 3.2 Changelog from v2.4.3

| Version | Published `[NPM]` | What changed `[GIT]` | Breaking? |
|---|---|---|---|
| 2.4.3 | 2026-07-22 | adds WebcastLinkMicBattleItemCard, proto 0.2.4 | our July build |
| 2.4.4 | 2026-08-18 | README, description, package.json only (4 files, no `src/` except version) | no |
| 2.5.0 | 2026-09-16 | (a) 429 handling passes the response, so `SignatureRateLimitError` with `retryAfter` works (PR #331); (b) `authenticateWs` is honoured without `useMobile`, and when it is off the WebSocket handshake carries an **anonymous** cookie string (`getAnonymousCookieString`); (c) a refused upgrade now rejects with `Error connecting to WebSocket with message: <handshake-msg>`; (d) `useMobile` without `authenticateWs` throws `TypeError` | only for callers using `useMobile` |
| HEAD (unreleased) | — | `options` defaults to `{}`; Docker image; documentation site | no |

No new required configuration: README 2.5.0 says "Connecting requires a signed WebSocket token, provided by
Euler Stream with free community rate limits; an API key raises those limits" `[FILE README.md:1333-1334]`.
Dependencies are unchanged from 2.4.3 to 2.5.0 (`tiktok-live-api-sdk@0.4.0-beta1`, `tiktok-live-proto@0.2.4`,
`got ^15`, `ws ^8`) `[NPM]`. `tiktok-live-proto` 0.3.0 (2026-09-28, TikTok 47.1.41) and `tiktok-live-api-sdk`
0.5–0.8 exist but no connector release uses them `[NPM]`.

### 3.3 How 2.4.3 connects `[FILE, tag v2.4.3]`
1. Room ID: TikTok HTML scrape → TikTok `api-live` → EulerStream fallback
   (`src/lib/web/routes/composite/fetch-room-id.ts:43-85`).
2. Room info directly from TikTok (`fetchRoomInfoOnConnect` default true).
3. `GET https://api.eulerstream.com/webcast/rooms/{room_id}/connect` with `client=ttlive-node`, the client's
   User-Agent, `client_enter=true`, `platform=web` (`.../euler/config.ts:15-18`,
   `.../euler/fetch-signed-websocket-euler.ts:93-114`). The answer is a protobuf carrying `pushServer`,
   `routeParams`, cursor, and cookies in `x-set-tt-cookie`.
4. The client opens a WebSocket to **whatever `pushServer` it was given** and adds its own default parameters
   through `URLSearchParams` (`src/lib/ws/lib/ws-client.ts:55-57`).

Consequences: signing logic is entirely server-side, so TikTok changes are normally absorbed by EulerStream
without a client update; and the same mechanism lets EulerStream route the socket through its own proxy.
The newest SDK (0.8.0, 2026-11-05) still calls the same path with a subset of the same query parameters
`[FILE both SDK tarballs]`, so the request our build sends is still well-formed.

### 3.4 Breakage reports since 2026-07-01
| Date | Report | Meaning for us |
|---|---|---|
| 2026-06-09 → open | zerodytrash#324 "Sudden error": users on v1.x get sign 404; one user gets "This endpoint requires a Business plan" on *some* streams while polling 100 rooms `[WEB]` | v1 path is dead; plan errors appear under multi-room load |
| 2026-08-14 | all-chat: 12 simultaneous connects exhausted the free sign limit; connector threw the `retry-after` TypeError `[FILE caesarakalaeii/all-chat docs/adr/0052]` | confirms #330 in production |
| 2026-09-09 → 09-10 | Sign API returned the ws-fallback stub; handshake refused with HTTP 400/200, "illegal app_id"; all client versions, with or without key `[ISSUE ttl#376, ttl#379, tlc#329, Euler#9]` | about a day of total outage for the whole ecosystem |
| 2026-09-10 | Maintainer: cause was "the new system failing to recycle agents when they retire"; Python needed 7.0.1 for the fallback; "when signing is working, prior versions will work" `[WEB ttl#376, #379]` | old clients are expected to keep working |
| 2026-09-14 | all-chat held 43 connections through Euler on connector **2.4.0**, "every connection is proxied via ws-fallback.eulerstream.com"; above the free concurrent cap the proxy "silently withholds live push" `[FILE all-chat ADR-0052 + package-lock.json]` | a pre-2.5.0 client worked after the change |
| 2026-09-30 → open | Euler#10: authenticated signing rejects valid session IDs for 13 days; "Anonymous signing still works" `[ISSUE]` | anonymous path alive at that date |
| after 2026-09-16 | no connection-failure issue filed against the Node library (#333 constructor default, #338 empty) `[API]` | weak positive: most support happens on Discord |

False "offline": the last cluster was zerodytrash#323 (2026-05-27, closed 2026-06-14). Nothing since.

---

## 4. Licence

### 4.1 What the text says
| Package | Version in the July exe | `license` field `[NPM]` | LICENSE file |
|---|---|---|---|
| tiktok-live-connector | 2.4.3 | AGPL-3.0-only | 720 lines: stock AGPL-3.0 + "Additional Permissions & Exceptions (Pursuant to Section 7)", sections 18–21 `[FILE LICENSE:663-720]` |
| tiktok-live-connector | 2.5.0 / HEAD | AGPL-3.0-only | byte-identical to 2.4.3 (`cmp` on tarballs and git) |
| tiktok-live-proto | 0.2.4 | AGPL-3.0-only | byte-identical to the connector's |
| tiktok-live-api-sdk | 0.4.0-beta1 | MIT | none in tarball |
| got, ws, typed-emitter / @bufbuild/protobuf | — | MIT / Apache-2.0 AND BSD-3-Clause | — |

History: connector ≤ 2.4.0 (2026-06-15) and proto ≤ 0.2.3 were MIT; the change landed in 2.4.1 on 2026-07-16
`[NPM per-version license]` `[GIT 2026-07-11 commits]`.

- **§18**: integration into "derivative works for commercial and non-commercial purposes" without AGPL,
  "provided they do not trigger Section 19"; examples: LIVE overlay services, LIVE games, stream bots.
- **§19**: the exception "strictly DOES NOT APPLY" if the program powers "a commercial, closed-source, or hosted
  Software-as-a-Service (SaaS) platform, including but not limited to a WebSocket relay service, data-scraping
  API, or managed hosting solution offered to third parties over a network".
- **§20**: violating use falls back to plain AGPL-3.0. **§21**: TikFinity / STV GmbH and Euler Stream Inc. are
  exempt from §19.

### 4.2 Issue #332 (opened 2026-09-14, closed 2026-09-20 by isaackogan) `[API body]` `[WEB comment]`
Asked by the developer of a paid Electron overlay app ("CommeMix") that ships tiktok-live-connector 2.4.4
unmodified inside its binary, serving only `127.0.0.1`: (1) does §18 cover a paid desktop app, (2) does it cover
redistributing the unmodified library inside a sold binary, (3) any obligation to publish source, (4) what
attribution, (5) anything required for the in-app licence screen, (6) extra conditions for unmodified use,
(7) anything to watch on the EulerStream side.

Answer (one comment, five sentences):
- "Standard license attribution is fince, additional credit is not required."
- "Generally the 'hard line' is to not wrap the app up in a no-value-added SaaS API to sell TikTok LIVE connections."
- "You can treat this message as approval of your use." · "The same applies for tiktok-live-proto."

Not answered: source publication (3), licence screen (5), unmodified-use conditions (6), EulerStream terms (7).

### 4.3 What this allows us `[INFERRED — not legal advice]`
- Personal use, not distributed: no condition applies.
- Giving or selling the exe to other streamers: covered by §18 and by the #332 precedent; ship the LICENSE text
  of the connector and of tiktok-live-proto with it. Today the esbuild bundle carries no notices
  `[FILE server/paketle.js:150-159]`, and the repo has no third-party notice for these two packages.
- A hosted, multi-streamer version of the bridge: §19. Either publish the whole server under AGPL-3.0, or use
  the last MIT pair (connector 2.4.0 + proto 0.2.3, as all-chat does), or another connector.
- The wording "commercial, closed-source, or hosted SaaS platform" is ambiguous; the maintainer's comment is the
  only guide to the intended reading. For anything hosted, ask in writing first.

---

## 5. EulerStream today

- Organisation: 7 repositories `[API]`. Active: TikTok-Live-Api (SDKs + spec, pushed 2026-11-05),
  Euler-WebSocket-SDK (1.1.0 on 2026-10-25). Euler-Connect is archived. The sign server is closed source.
- Auth: `apiKey` query, `x-api-key` header, or `x-jwt-key`; the connect route is scope `PUBLIC` with anonymous
  access `[FILE spec/openapi.json]`. Docs: "the current rate limits for anonymous connections are as follows"
  (numbers did not load) and a key gives "an immediate free increase to the rate limit" `[WEB docs/api/rate-limits]`.
- Scopes that explain "Business plan" errors: room-ID lookup `GET /webcast/anchors/{creator_id}/room_id` = `PRO`;
  room gifts and send-chat = `WEBCAST_PREMIUM`; connect-by-username = "Requires the Business plan" `[FILE spec]`.
- Free tier, two different numbers:
  - GitHub README, unchanged since 2026-07-10: Community "Free, forever", 2,500 requests/day, 25 cloud
    WebSockets, 5 alerts; Business $50/month, 10,000/day `[FILE README.md, GIT]`. A user's key reported
    day 2500 / hour 500 / minute 60 on 2026-09-30 `[ISSUE Euler#10]`.
  - Pricing page today: Community "$0/ forever", "1.5K requests", "100 rooms" (distinct LIVE rooms per day),
    "25 WebSockets", "5 alerts", "Business TikTok Routes: Not included"; Business 10K $50, 50K $100, 100K $150,
    200K $250; add-on "Premium Webcast Routes" $50/month (send chat, room gift catalogue) `[WEB]`.
- Changed since July: SDK 0.5.2 → 0.8.0 (four releases); public spec committed from 2026-09-21 and reshaped on
  2026-10-17 (90 paths now); the September incident and the fallback push server; the lower free quota on the
  pricing page. Our own note "2500 istek/gün" `[FILE server/package.json:22]` may be out of date.

---

## 6. Alternatives

### 6.1 tik.tools (`tiktool/*`, `tiktooldev/*`; npm `tiktok-live-api`, `@tiktool/live`, `tiktok-live-events`, `tiktok-live-mcp`)
- Who: brand "TikTool", npm account `tiktools` (plus `barebase` on the MCP package), contact support@tik.tools;
  every commit is authored "TikTool"; no person or company is named `[NPM] [GIT]`. First release 2026-02-12.
  The same account pushed an unrelated mouse-recorder today `[API]`.
- How: an API key is mandatory. "Direct" mode: tik.tools issues connection credentials, the socket goes from
  your IP to TikTok. "Relayed" mode: everything flows through `wss://api.tik.tools`
  `[FILE @tiktool/live README.md:56-64,101-141]`.
- Price: Sandbox = "7-day evaluation, no credit card… Refused after 7 days from account creation"; Basic
  $7/week or $19/month; Pro $49; Ultra $149; Agency $399 `[FILE same README:472-488]`.
- Maturity: 70 versions of `@tiktool/live` in 9 months; 54 stars, 11 forks, 0 issues; 10 package.json
  dependents `[NPM] [API]`. Heavy keyword SEO (the package lists `tiktok-live-connector` as a keyword).
- Verdict: a paid substitute for EulerStream, not a way out of third-party signing. Four game repos in s1b's
  clones adopted it believing it was free (section 9).

### 6.2 Other language ports
| Library | Signing | State `[API]/[GIT]` |
|---|---|---|
| isaackogan/TikTokLive (Python) | EulerStream | 7.0.1 on 2026-09-10, 1645 stars |
| jwdeveloper/TikTokLiveJava | EulerStream (has a dedicated Euler WebSocket client) | 1.13.1 on 2026-10-10, MIT |
| steampoweredtaco/gotiktoklive | EulerStream by default | last commit 2025-09-14 |
| frankvHoof93/TikTokLiveSharp (C#/Unity) | EulerStream ("Signing-Server" credit) | last commit 2025-01-28 |
| jwdeveloper/TikTokLiveRust | — | archived 2024 |
| simnJS/tiktok-live-connector-rs | EulerStream | 2 commits, 2026-09-30 |

### 6.3 Routes with no third-party sign server
| Route | Implementations | Evidence it works | Evidence against / cost |
|---|---|---|---|
| **A. Unsigned direct socket** — guest `ttwid` cookie from a plain GET to tiktok.com, then `wss://webcast-ws.tiktok.com/webcast/im/ws_proxy/ws_reuse_supplement/?…ws_direct=1…` | PirateTok/live-js (0BSD) `[FILE src/connection/url.ts:18-49, src/auth/ttwid.ts]`; talkaboutdesign/tiklive (MIT) `[FILE packages/core/src/LiveConnection.ts:4-5,81-82,350-378]` | third-party user, 2026-09-16: "~17 events / 20s", "first event arrives in ~2s" on Windows 11 `[ISSUE PirateTok/live-js#1]`; v0.3.0 released 2026-10-05; tiklive built 2026-10-11..30; 9 downstream package.json dependents incl. two projects using it as primary provider | all-chat lab, 2026-09-18: with a page-recorded URL, "stripping [X-Bogus] → instant 200-rejection" `[FILE all-chat docs/phase-reports/TIKTOK_NO_BROWSER_TRANSPORT_SPIKE_2026-09-18.md]`; `ttwid` is granted on only ~1 in 8 anonymous requests; "~15 WS connect attempts in an hour got that surface throttled"; tiklive warns VPN/datacenter IPs may be refused |
| **B. Locally signed socket** — run TikTok's own `webmssdk` bundle in an embedded JS engine | nglmercer/tiktok-signer (Rust + Node `ttl-live`) | author's audit 2026-10-25: "100 distinct real LIVE rooms… All 100 rooms delivered events" `[FILE LIVE-AUDIT.md]` | no root licence file; downloads and executes TikTok's obfuscated bundle (pinned hash) in `node:vm`; signing interface already changed once (X-Gnarly → X-Bogus) |
| **C. Browser capture** — open the real live page, read WebSocket frames over DevTools, decode with the connector's exported `deserializeWebSocketMessage` | tanthuan031/StudioLive `[FILE src/direct.js:1-21]`; metalalchemist/VeTube (extension) `[FILE FIRMADOR_LOCAL.md]`; 9 repos in code search | StudioLive: 26 stars, 29 forks in 6 days | a browser process; licences NOASSERTION / GPL-3.0 → ideas only |
| **D. Own headless signer** | caesarakalaeii/all-chat (AGPL-3.0), carcabot/tiktok-signature | all-chat runs it in production | since 2026-09-09 "anonymous, non-browser fetchers get an empty 200 or a 403 regardless of signature quality" on `/webcast/im/fetch` `[FILE all-chat ADR-0052]` — a maintenance treadmill |

Route C is exactly "path B" of our `TERSINE-MUHENDISLIK.md` section 8. Route A did not exist in our notes: the
statement there that the socket address "must be signed" is contradicted by three shipping code bases, with the
caveat in the right-hand column.

### 6.4 TikFinity
Closed source, no repository. Its local WebSocket (`ws://localhost:21213`) appears in 89 files / 42 repos
`[API]`. Our overlays already speak it `[FILE server/package.json:24]`. The connector's licence names
"TikFinity / STV GmBH" as an excepted party `[FILE LICENSE:719]`. How it connects is not visible; one user saw it
fail together with the library in May 2026 `[ISSUE zerodytrash#323]`.

### 6.5 Official TikTok route
None found. developers.tiktok.com lists Login Kit, Share Kit, Content Posting API, Research API, Display API,
Data Portability API, Commercial Content API and webhooks for posting / Minis / sharing — nothing for LIVE events
`[WEB search]`. Both vendors say the same in their FAQs `[README]`. Our own notes reached the same conclusion
`[FILE TERSINE-MUHENDISLIK.md:233-239]`. Whether a closed partner programme for interactive LIVE games exists
outside public documentation: unknown `[MEMORY: none that is public]`.

---

## 7. What deployed projects use, and how they hold keys

Ranking by code-search footprint `[API]`: tiktok-live-connector (657 package.json) ≫ TikTokLive Python (160
requirements.txt) > TikFinity local socket (~80 repos across two spellings, overlapping) ≈ EulerStream managed
WebSocket (39 repos) > direct-socket implementations (25 repos) > TikTokLiveSharp in Unity (9 manifests) ≈
tik.tools (10) ≈ piratetok-live-js (10).

Name/description heuristic on the 97 repos of the first result page for the Node connector: 32 look like
games, 38 like overlays/bots `[INFERRED]`.

Version ranges in 91 of those package.json files `[FILE raw fetch]`: `^2.5.0` 15 · `^2.1.x` 17 · `^1.0.x` 15 ·
`^2.4.x` 12 · `^2.0.x` 10 · others 22. Fifty of 91 float to 2.5.0 on a fresh install.

How the sign key is supplied (248 files fetched from five result sets; 116 repos with a key assignment)
`[FILE raw fetch, values never printed]`: environment variable / config / runtime input 77 · passed through a
variable 24 · unclassified expression 9 · placeholder, empty or unset 3 · **hard-coded literal 3** (IgnitionRage/IgnitionRage.github.io
`raffle/index.html`, SashaZt/my_projects_in_python `…/main_old.py`, marfente/slot-machine-tiktok `bot.js`).
Seen separately: ethemkurtt/SeliGames commits an EulerStream key in a Markdown file and uses it from an Electron
renderer. Names used: `EULER_API_KEY` (279 hits) and `SIGN_API_KEY` (407; the library's own variable).
Many projects run with no key at all (e.g. workaipvlinh-byte/lop-hoc-chu, 73 stars, created 2026-11-04,
connector `^2.5.0`, `[FILE server.ts:221-225]`).

---

## 8. Comparison with ours

| Topic | Ours `[FILE]` | Finding |
|---|---|---|
| Version | `^2.4.3`, no lockfile, CI `npm install` | July exe = 2.4.3; a rebuild silently becomes 2.5.0 plus newer transitive packages |
| Key | `--key` / `EULER_API_KEY` → `SignConfig.apiKey` (bridge.js:645-657) | matches the dominant pattern; the library's own variable is `SIGN_API_KEY` |
| Error handling | retries only when the message matches `/offline|room ?id/` (bridge.js:772-793); otherwise logs and stops (795-829) | with 2.4.3 a 429 arrives as a TypeError that matches nothing; after 2.5.0 `err.retryAfter` is available |
| "IMZALAMA PAYWALL" branch | `/Business plan|requires a .*plan|MissingTokens/` (bridge.js:800) | per the spec this text comes from PRO/premium routes (room-ID fallback, gifts), not from the public connect route |
| Waiting mode | re-runs `connect()` every 15 s | each poll may reach EulerStream's room-ID route, which is PRO-scoped and cannot succeed on a free account (`fetch-room-id.ts:67-85`) — wasted quota `[INFERRED]` |
| Bot session | `setSessionBundle` before connect when a session was saved (bridge.js:740-746) | in 2.4.3 the handshake sends the whole cookie jar, including `sessionid`, to the push server chosen by the sign server (`client/index.ts:482`, `cookie-jar.ts:39-48,105-107`) — possibly EulerStream's proxy. 2.5.0 strips it |
| Event time | `ev.ts = Date.now()` (bridge.js:364) | TikTok's own timestamp is available and unused (section 9.4) |
| Fallback | TikFinity mentioned in logs | still the only zero-code fallback; a keyless direct source is now feasible |

---

## 9. Leads from s1b-mekanikler (read in s1b's clones)

### 9.1 `piratetok-live-js` in two Turkish repos
kadirkrga25/tiktok-live-cark-oyunu (12 commits 2026-11-03..04, +0300) — README: "Bu sürüm, Euler Stream imzalama
servisini kullanmak yerine `piratetok-live-js` paketini kullanır. API anahtarı veya ücretli Euler planı
gerektirmez." `[FILE README.md:25]`; omerabc2006-cpu/taraftar-arena-server (7 commits 2026-11-06..07, depends on
`latest`). A third Turkish one from code search: threedeetr/tavuk-ciftligi-live.
Assessment of the library: route A above; 0BSD; one author (Zmole Cristian, 18 commits, v0.3.0 on 2026-10-05);
site piratetok.rosint.org with a donation page; ports in 12 languages kept in step on 2026-10-04; needs
Node ≥ 22.19. Works-today evidence: the 2026-09-16 third-party report and November adopters — circumstantial.

### 9.2 Chahmetski/live-loop-racers vendors "ttl-live"
`ttl-live` is the Node package of nglmercer/tiktok-signer, vendored at upstream revision 886157c (2026-10-10)
with `UPSTREAM.json`, an MIT LICENSE and notices `[FILE server/vendor/ttl-live/]`. It signs by downloading
`webmssdk.js` 1.0.0.388 from TikTok's static CDN, checking a pinned SHA-256, caching it in the temp directory
and running it in `node:vm`; the signature is appended as `X-Gnarly` `[FILE src/signer.ts:39-40,72,139; src/player.ts:249]`.
Route B above. Upstream is one very active author (179 commits since 2026-08-10) with no root licence file; the
schemas inside are the modified-AGPL ones. Riskier than route A for us: more moving parts, executes TikTok code.

### 9.3 tik.tools in four repos
doncabrone-lab/tiktok-race-game (`@tiktool/live` 2.12.1, relayed mode, key in a Render env var) ·
TochdownBoy/tiktok-tower-defense · ElProfessor-spain/tiktok-horse-race (npm `tiktok-live-api`) ·
aminmaskur88/tebak-kata (browser connects to `wss://api.tik.tools` with a pasted key). Two of them state the
motive: Euler's "signing route now needs a paid Business plan" `[FILE ElProfessor-spain server.js:29-32]`,
"the old Euler Stream signing endpoint is paywalled" `[FILE TochdownBoy backend/.env.example:6-7]`. That belief
conflicts with the spec and with keyless projects running in November; and tik.tools' own free tier ended on
2026-09-28, so these games now need a paid plan after seven days.

### 9.4 `createTime` on chat events — confirmed
In tiktok-live-connector 2.4.3 (and 2.5.0) the `chat` listener receives the decoded `WebcastChatMessage`
unchanged `[FILE v2.4.3 src/types/events.ts:188, src/lib/client/index.ts:571-661]`. Its `common` header carries
`createTime: string` and `clientSendTime: string` (64-bit integers as decimal strings) plus `msgId`
`[FILE tiktok-live-proto@0.2.4 dist/node/v2.d.ts:827-852]`; the message also has `screenTime`
`[FILE same:2871-2896]`. The legacy adapter flattens these to top-level `createTime` / `msgId`
`[FILE src/lib/client/legacy/data-converter.ts:38-44,205-206]`. Unit: milliseconds, as used by
workaipvlinh-byte/lop-hoc-chu (`Number(data?.common?.createTime)`, `server.ts:260`) `[INFERRED from that code]`.
The field can be absent; that repo falls back to arrival time. PirateTok exposes the same two fields;
`@tiktool/live` exposes `timestamp` and optional `createTime`.

---

## 10. Ideas worth taking

1. Rebuild on 2.5.0 and commit a lockfile; pin `2.5.0` exactly. — zerodytrash/TikTok-Live-Connector v2.5.0.
2. `RoomIdRouteConfig.skipFetchRoomIdFromEulerRoute = true` (it is exported). — connector
   `src/lib/web/routes/composite/fetch-room-id.ts:15-19`; rationale in all-chat `docs/adr/0052` ("Lever 1").
3. Retry every connect error with backoff, honouring `err.retryAfter`. — connector `src/types/errors.ts`.
4. A second, keyless source behind a switch, with a provider adapter and an error taxonomy
   (offline / not found / blocked / network). — RM70N/ehsmaha `tiktok-relay/src/providers/piratetokProvider.js`;
   NabeelFK/tiktok-live-minecraft-bridge `docs/SETUP.md` §7; PirateTok/live-js `src/connection/url.ts`,
   `src/connection/wss.ts`, `src/auth/ttwid.ts` (0BSD, may be vendored).
5. Prove which calls still need EulerStream by pointing `SignConfig.basePath` at a closed port in a test.
   — all-chat `services/tiktok-listener/src/sign/euler-free.live.test.ts`.
6. Forward `common.createTime` and `common.msgId` in our chat event; rank trivia answers by TikTok time with a
   skew estimate; de-duplicate by `msgId`. — workaipvlinh-byte/lop-hoc-chu `server.ts:260`,
   `src/game/quiz.ts:938-1004`; Chahmetski/live-loop-racers `server/tiktok.js`.
7. Browser-capture source as a third option. — tanthuan031/StudioLive `src/direct.js` (ideas only).
8. Record vendored-code provenance. — Chahmetski/live-loop-racers `server/vendor/ttl-live/UPSTREAM.json`,
   `THIRD_PARTY_LICENSES.md`.
9. A "check my quota" diagnostic via `GET /accounts/me/rate_limits`. — EulerStream/TikTok-Live-Api
   `spec/openapi.json`.

---

## 11. Bottom line for us

**Risk that the July exe does not connect today: MEDIUM.** No static evidence of a client-side break, and
three independent signs that pre-2.5.0 clients kept working after September; but it cannot be confirmed without
a real stream, the service had a day-long outage two months ago, and the July build turns the most likely
failure (rate limit) into an unreadable error and gives up.

**Cheapest path.**
1. Run the "EXE uret" workflow again → 2.5.0, no code change.
2. Create a free EulerStream key and supply it through `EULER_API_KEY` (never in the repository or the exe).
3. Do not use the saved bot session (`--oturum`) with the July exe.
4. Three small edits for the same rebuild: skip the Euler room-ID fallback; retry with backoff; add
   `package-lock.json` and use `npm ci`.
5. Test once on a real stream before relying on it; update the "2500/gün" note.

**Fallback.** Add a keyless direct source (route A, `piratetok-live-js`, 0BSD) behind a source switch and prove
it on a real stream. Until that exists, TikFinity Desktop is the zero-code stopgap.

---

## 12. Could not verify

- Whether the July exe, or 2.5.0, connects today — not attempted, by instruction.
- Whether EulerStream currently returns a direct TikTok socket or its own proxy; the anonymous rate limits;
  which of 2,500 and 1.5K is the real free quota; whether room-ID fallback calls count against it.
- Whether the unsigned route (A) works from a Turkish home connection today; two sources disagree on whether
  the socket URL needs a signature.
- The exact wording of the maintainer's comment on #332 — obtained through a summarising fetch tool.
- How TikFinity connects and whether it shares EulerStream's failure modes.
- Release download counts, npm download counts — unavailable in this sandbox.
- Stars/forks of frankvHoof93/TikTokLiveSharp — not returned by the search API.
- Who operates tik.tools.
- Any non-public official TikTok programme for interactive LIVE games.

---

## 13. Handoffs (seen, not analysed)

- **s1a-merkezler**: talkaboutdesign/tiklive (overlay server + desktop app); tanthuan031/StudioLive;
  Loggableim/ltth.app and Bluscream/ltth; ethemkurtt/SeliGames (Turkish Electron games); duycuf/tiktok-live-kit;
  cherry9001/tiktok-live-bar; vamnguyen/tiktok-live-games; LinhTN11/TikTokLive_DashBoard; batbomb/Batlay;
  darinh/tiktok-overlays; kaduwaengertner/tiktok-live-overlays; nuttylmao/nutty.gg.
- **s1b-mekanikler**: threedeetr/tavuk-ciftligi-live (Turkish, PirateTok); marfente/slot-machine-tiktok;
  ImAAhmad/TiktokWheel; landsbetween/tiktok-snake-live; ma1orek/edward-battle-tiktok; byteofcuong/S-race-online;
  angel-sisamon/flagmaster-live; AlexanderVerenzuela/juegofutboltiktok; CKCommish/TheMaze2; datngo68/HunterSnake;
  Khikyy/Game-Tebak-Kalimat; wiburga/tiktok-battle-server; phamtuyennasani/game-3d.
- **s2-motorlar**: Unity + TikTokLiveSharp: absravdev/tiktok-live-arena, thmsmarque/Unity3d-DungeonBoss-TiktokLive,
  DevyRis/unity-plinko-2.5d, overszboy/TikTokLiveGame, HarunUcan/Tiktok-Live-Fan-Slap-Game, MrChriwo/4wins-tiktok,
  Ratthabhumi/5-Last-Survivors, tuncayl/spinwhell, egunde/tiktok-pvz. Minecraft/Roblox:
  NabeelFK/tiktok-live-minecraft-bridge, jamesd5V5/TikFinity_McJava, elcreado/Minecraft-RCON,
  RADD95/Minecraft-TikTok-Bridge-Using-Rcon-Backend, EricHossain/TikTok-LIVE-to-Roblox-Event-Relay,
  ryanrn/tiktok-roblox-live, ijustseen/take-your-minestream, hristrix/chatrix. tik.tools advertises an Unreal plugin.
- **s3-urunlesme**: issue #332's "CommeMix" (paid Electron overlay app; licence precedent); connector issue #325
  (a company seeking a paid maintainer with a 2-hour SLA); EulerStream and tik.tools price ladders;
  EulerStream/TikTok-LIVE-Overlays; steveseguin/social_stream + ssn_app; isaackogan/TikTokLivePrinter;
  alvaro-salort/Tiktato; metalalchemist/VeTube; caesarakalaeii/all-chat (allch.at); tiktooldev/obs-tiktok-captions;
  licence §19 as a constraint on any hosted business model.
