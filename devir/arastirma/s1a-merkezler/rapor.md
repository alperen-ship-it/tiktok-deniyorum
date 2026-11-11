# s1a-merkezler — web-tech multi-game hubs, platforms, kits and templates for TikTok LIVE

Scout report, 2026-11-09. All numbers come from calls made today. Evidence tags as defined in ORTAK.md section 5.
Companion file: `adaylar.json` (37 candidates) in this directory.

## 1. Summary

1. **The same kind of product exists many times over, and most of it appeared after we started.** GitHub repos
   matching "tiktok live game" by creation date: 62 before 2025 · 32 in 2025 · 63 in Jan–Jun 2026 · 111 in
   Jul–Sep 2026 · 54 on 1–30 Oct 2026 · 49 since 31 Oct 2026 (ten days) — 371 in total [API]. The last ten days are
   a Vietnamese wave tied to an "online temple" livestream trend that mainstream press covered and a ward police
   office warned about on 2026-11-04 [WEB vietbao.vn, republishing VTC News].
2. **Several are demonstrably in use today.**
   - `Lehaneploxo/donation-race`: its production server answered with 3 rooms, all connected to real TikTok lives,
     gift counters 498 / 47 / 3,672, at 2026-11-09T20:27Z [WEB /status]; 838 commits over eight months [GIT].
   - `vamnguyen/tiktok-live-games`: hosted instance is up and serves the repo's HEAD code; 4 room keys, 3 overlay
     sockets, 0 active TikTok connections at 20:03Z [WEB /api/health]; forks customised in Kenya and Brazil [GIT];
     a Turkish copy exists [FILE].
   - `zahrun5/tts-live-v2`: SaaS live at its own domain, uptime 8.6 h, database connected, payments not enabled
     [WEB /api/health].
   - `hpmediaoffifical/h-p-t-i-k-t-o-k---g-a-m-e` (HP Action LIVE): commercial desktop product at version 1.0.53
     with licence server and EULA in the tree [FILE, GIT].
   - `livecade/*`: 65 repos documenting a hosted commercial game platform with Turkish among 13 overlay languages
     [API, README, WEB].
3. **Every peer hub is portrait 9:16; ours is the only landscape-only design** (section 7).
4. **Verified gaps in our own code relative to peers** (section 5): no retry after a non-offline connect failure,
   no silence watchdog, bridge reachable from the LAN with side-effecting GET endpoints, scores kept in
   origin-scoped browser storage, gift combos counted only when the combo ends, answer order by arrival time.
5. **Hub mechanics we do not have:** audience vote for the next game, carry-over of players and gifts across
   games, crash isolation per game, retention measured per game phase, editable gift rule table (section 8).
6. **Peers are reacting to platform policy.** One hub keeps a written audit of its games against TikTok's LIVE
   rules; two Vietnamese quiz games removed every gift advantage; a Brazilian project ships "no betting, no
   prizes, profile photos off" as defaults. These are the peers' readings, not verified against TikTok by me
   (handoff to s3).
7. **Reusable code is scarce.** Only the duycuf kit and the workaipvlinh-byte games carry an MIT licence file.
   Everything else is unlicensed or proprietary: ideas only.

## 2. Method

**Channels used.** GitHub search API through `ara.py` / `ozet.py` / `gh.sh` (about 50 search-bucket calls and 4
code-search calls); `git clone --filter=blob:none` and `git ls-remote` for histories, trees and fork heads; raw
READMEs; npm registry; direct `curl` probes of five project hosts (all answered 200); two WebSearch calls and one
WebFetch (worked). Nothing downloaded was executed.

**Text addressed to AI agents.** Several repos ship instruction files for coding agents (`AGENTS.md` in
vamnguyen and duycuf, `CLAUDE.md` in the workaipvlinh-byte games, `SKILL.md` in tuna1710). They were read as
data about how the projects are built; none of their instructions were followed.

**Privacy.** Two public status endpoints return streamer usernames. Only counts are reported here; the names
are not reproduced.

**Repository queries (total_count from the API):** `tiktok live game` 371 (read top 100 by stars and top 100 by
update) · `tiktok live games` 54 · `tiktok interactive game` 174 · `tiktok live interactive` 227 ·
`tiktok live kit` 6 · `tiktok live template` 10 · `tiktok live framework` 6 · `topic:tiktok-live` 193 ·
`tiktok live minigame` 2 · `tiktok live mini game` 7 · `tiktok live game pushed:>2026-07-01` 232 ·
`tiktok live in:name,description pushed:>2026-10-01` 922 (read 200) · `tiktok live overlay game` 18 ·
`tiktok live game platform` 5 · Vietnamese `game tương tác tiktok live` 7, `tiktok live trò chơi` 3,
`tiktok live quà tặng` 6 · Indonesian `game interaktif tiktok` 8 · Portuguese `jogos tiktok live` 23 · Spanish
`juegos tiktok live` 17 · Turkish `tiktok canlı yayın oyun` 0, `tiktok yayın oyunu` 2, `tiktok oyun` 13 ·
`tiktok gift game` 29 · `tiktok chat game` 76 · `tiktok live 24/7 game` 1 · owner listings (nine owners 109;
`user:livecade` 65) · three README/OR-style queries that returned mostly unrelated lists (discarded) · six
creation-date slices of `tiktok live game` · fork listings for four repos · issue and PR search for eight repos.

**Code-search queries:** `KIT_THEMES_DIR` (2 repos, both the kit author's) · `"TikTokBridge.on"` (3 repos) ·
`"NameBatcher" "GiftThanker"` (5 repos) · `"temple.burnIncense"` (7 repos).

**Volume.** 954 unique repositories passed through the result lists. Rough keyword classification: 530 game-like
or unclassified · 139 spam or unrelated lists (excluded) · 97 overlay/bot/tool projects (s3) · 77 engine/native
(s2) · 60 downloaders, scrapers, recorders, stream-key tools (excluded) · 31 connectors/sign servers (s4) ·
20 view/like/boost bots (excluded). One phishing-kit repo appeared and was excluded.

**Depth.** 8 repos code-read with file:line evidence, 9 at tree level, 20 at README level (`adaylar.json`).

**Scope decisions.** (a) `zane-tv/tiktok-live-temple-rpc` is one experience, not a hub, but it is kept because it
functions as the scene's template (351 forks). (b) The workaipvlinh-byte games are single games each, kept as a
family because they share one copied "live layer". (c) `Lehaneploxo/donation-race` was first classified as a
single-mechanic game from its description; s1b's lead showed it is a hub, and it was read from s1b's clone.

## 3. Landscape (top of the segment)

Stars/forks/dates/licence/size: [API] today. "MIT*" = MIT declared only in package.json or README, no licence file.

| Repo | What | Stack · connection | ★ / forks | Created → last push | Licence | Grade | Rel. |
|---|---|---|---|---|---|---|---|
| Lehaneploxo/donation-race | 7 active crowd games behind a launcher; Railway + Postgres; allow-listed accounts | Node, ws, pg, canvas · connector 2.1.1-beta1 + session cookies | 6 / 4 | 2026-03-10 → 2026-11-07 | none | A | 5 |
| vamnguyen/tiktok-live-games | Hosted multi-tenant platform + client SDK; 1 game at HEAD | Node, socket.io · connector 1.1.9 | 75 / 37 | 2026-01-04 → 2026-03-28 | none (MIT*) | A | 5 |
| workaipvlinh-byte/lop-hoc-chu | Classroom quiz show with recess mini-games and contests | Node, SSE, React · connector 2.5.0 | 73 / 95 | 2026-11-04 → 2026-11-07 | MIT | A | 5 |
| duycuf/tiktok-live-kit | Framework: core + swappable themes + control panel | Node, ws, canvas/Three.js · TikFinity first, connector fallback | 21 / 32 | 2026-10-31 → 2026-11-02 | MIT | B | 5 |
| Mateus0790/tiktokfarm | Six games auto-rotating in one canvas with audience vote; TikTok + YouTube | Node, ws, canvas · connector 2.5.0 | 2 / 0 | 2026-10-21 → 2026-10-23 | none (MIT*) | B | 5 |
| zahrun5/tts-live-v2 | Multi-tenant SaaS, 16 word/quiz games, accounts, plans | Node, socket.io, MongoDB, React · connector 2.5.0 | 0 / 0 | 2026-09-29 → 2026-10-20 | none | B | 5 |
| zane-tv/tiktok-live-temple-rpc | Temple stage with JSON-RPC API; the scene's template | Bun, ws, canvas/Three.js, local TTS · connector 2.1.0 | 230 / 351 | 2026-10-31 → 2026-11-05 | none | A | 4 |
| workaipvlinh-byte/ai-la-trang-nguyen | A–D quiz show, ~5,000 questions, team scoring | Node, React · connector | 4 / 15 | 2026-11-07 → 2026-11-08 | MIT | B | 4 |
| workaipvlinh-byte/dam-cuoi-online | Wedding crowd scene with the shared live layer | Node, SSE, React · connector 2.5.0 | 7 / 8 | 2026-11-03 → 2026-11-03 | MIT file (API: unclear) | B | 4 |
| livecade/* (65 repos) | Hosted commercial game platform, docs only | closed | ≤3 each | 2026-08-18 → 2026-11-06 | none | A | 4 |
| dazevedodev/lives-tiktok | Two unattended team games with safety defaults | Node, ws, Three.js/Matter.js · connector | 0 / 0 | 2026-11-03 → 2026-11-03 | none | B | 4 |
| obulut05/tiktok-live-games | Turkish copy of vamnguyen + admin + 3 games, "reference only" | Node, socket.io · connector | 0 / 0 | 2026-06-25 → 2026-06-25 | none (MIT*) | C | 4 |
| hpmediaoffifical/h-p-t-i-k-t-o-k---g-a-m-e | Commercial Electron game library with licence keys | Electron, socket.io, Matter.js · connector 2.0.6 + own sign URL | 0 / 0 | 2026-05-11 → 2026-11-07 | proprietary | A | 3 |
| workaipvlinh-byte/di-chua-online | 3D temple hall | Node, React, Three.js · connector | 58 / 81 | 2026-11-01 → 2026-11-02 | unclear | B | 3 |
| duycuf/tiktok-live-pgd | Temple theme running on the kit | theme on kit | 17 / 18 | 2026-11-01 → 2026-11-02 | MIT | B | 3 |
| mashupsolution/tu-tien-online | Cultivation idle game, SQLite progression | Phaser 4, React, SQLite | 10 / 20 | 2026-11-03 → 2026-11-03 | none | B | 3 |
| broneotodak/tiktokgame | Eight overlay/game pages on one server | Node, socket.io, Three.js · connector 2.1.1-beta1 | 7 / 3 | 2026-02-23 → 2026-03-02 | none (ISC*) | C | 3 |
| ntanh23112005/tiktok-live-template | Three mini-game tools shared free | Node + browser | 5 / 2 | 2026-11-09 → 2026-11-09 | none | B | 3 |
| tuna1710/tiktok-live-game-skill | Agent "skill" + example games + headless cloud streaming | Node, socket.io, Colab | 0 / 0 | 2026-11-07 → 2026-11-09 | none | C | 3 |

Remaining candidates (forks, copies, long tail) are in `adaylar.json`.

## 4. Profiles of the top repos

### 4.1 Lehaneploxo/donation-race — the most developed and most provably live peer
- **What.** A launcher page (`client/launcher.html`) from which an allow-listed streamer starts one game with
  `?username=`; 7 active entries (6 distinct games + a copy for a second account), 3 hidden, 5 archived, all
  tracked in a registry file [FILE GAMES.md:5-45].
- **Deployment.** Railway with restart policy [FILE railway.json]; production `/status` showed 3 rooms in mode
  `tiktok` with gift counters 498 / 47 / 3,672 at 20:27Z [WEB]. 838 commits by one author, 2026-03-10 to
  2026-11-08, active every month [GIT].
- **Event path.** `WebcastPushConnection` per room → Room object → `ws` broadcast to game pages; rooms keyed by
  username, created only for names in a hard-coded allow-list [FILE server/server.js:1161-1168].
- **Connection handling (unique among peers).** Back-off of 15 minutes when the sign service reports a rate
  limit, 60 s for other failures [FILE server/tiktokConnector.js:211-216]; 3 s → 60 s exponential only while a
  live connection flaps, reset after one stable minute [160-181, 195-198]; connection paused while no overlay
  page is open [50-65]; room kept 5 minutes after the last client leaves [server/server.js:1385-1398].
- **Persistence.** PostgreSQL: per-game ratings, weekly champions and history, daily tops reset at midnight, a
  lifetime level, and a snapshot of the running round restored after refresh or redeploy
  [FILE server/db.js:240-275; server/server.js:1093-1136].
- **Identity on screen.** Named character sprites; only the kart game draws avatars [FILE client/kart.html:614].
- **Voice.** Browser speech synthesis with templates and nickname filtering [FILE client/voice.js:1-12].
- **Layout.** Portrait: canvases 1080×1800 and 600×1000, orientation lock [FILE client/newyear.html:43, 2485;
  client/streetfighter_arena.html:30, 1088].
- **Policy audit.** `ПРАВИЛА_TIKTOK.md` (dated 2026-10-12, sources listed) rates the author's own features:
  automation without the author present = medium risk; any "gift → random outcome" = high risk ("gambling-like");
  realistic-looking bots = low/medium risk, mark them; gifts that speed up or hit = acceptable; empty waiting
  screen = low risk [FILE ПРАВИЛА_TIKTOK.md:99-111]. Peer's reading, not verified by me.
- **Weak points.** `/status` and `/admin/*` are unauthenticated on a public host [FILE server/server.js:157-206];
  the server stores the streamer's TikTok session cookie in environment variables [FILE SHPARGALKA.md:11-18].
- **Licence.** None → ideas only.

### 4.2 vamnguyen/tiktok-live-games — hosted "platform" with an SDK
- **What.** Dashboard: type a username, pick a game, copy the overlay URL. Client SDK `TikTokBridge`
  [FILE public/lib/tiktok-bridge.js]. One game at HEAD (horse race); two earlier games were deleted on 2026-03-27
  [GIT 70cabee: 99 files, 12,274 deletions].
- **Hosted wiring (Q3).** Any socket may `join-room` with any username, no login
  [FILE src/server.js:89-128]; one upstream connection per username shared by everyone in that room
  [FILE src/services/TikTokService.js:63-72]; `tiktok-live-connector ^1.1.9` with no sign key configured
  [FILE package.json; TikTokService.js:78-84]; no rate-limit branch — a failed connect returns false and the client
  gets "connection-error"; after a drop, 5 retries with jittered exponential back-off, then it gives up
  [TikTokService.js:191-249; src/lib/tiktokReconnectPolicy.js:10-41]; idle upstream closed after 5 minutes with
  no clients [317-333]. `/api/stats` lists room names publicly [src/server.js:70-72].
- **Rules.** Four price tiers × five lanes so each lane has an equal-cost gift; distance = 5 + 3·√diamonds; chat
  aliases as free votes [FILE public/games/horse-racing/config.js:35-109, 165-187].
- **Missing.** Persistence, avatars, TTS, demo mode, rotation.
- **Licence.** README and package.json say MIT, but there is no licence file and the API reports none.

### 4.3 duycuf/tiktok-live-kit — the only real framework, MIT
- **Pipeline.** Providers (TikFinity local WebSocket first, direct connector as fallback, demo) → one normaliser
  → engine: msgId dedupe → gift-streak delta → rule table → session → WebSocket with `control` and `overlay` roles
  [FILE src/providers/manager.js:22-64; src/core/engine.js:45-111].
- **Rule table.** Gift ID → gift name → price tier; chat commands with match mode and cooldown; join-by-keyword
  mode; edited in the control panel, stored per theme, and the overlay draws its "what each gift does" board from
  the same data [FILE src/core/rules.js:6-44; src/server.js:268-269, 302-308].
- **Control panel.** Five tabs: Live, Rules, Test (fake viewers, crowd bursts of 10–400), Stats (leaderboard,
  titles, CSV export, goals), Guide [README.md:82-97].
- **Resilience.** Back-off 2 → 30 s, automatic source switching, reconnect after 180 s of silence
  [FILE src/providers/manager.js:66-90]; session file written atomically and reloaded
  [FILE src/core/session.js:22-37]; overlay rebuilds the current crowd from a snapshot after reload
  [FILE src/server.js:273-274].
- **Security.** Binds 127.0.0.1, Host/Origin allow-list, LAN access opt-in
  [FILE config.json; src/server.js:193, 232-235].
- **Voice.** Edge TTS templates with per-type cooldowns, spoken-name cleaning and a filter for links, profanity
  and emoji-only comments [FILE src/core/voice.js:7-69].
- **Layout.** 1080×1920 with documented safe zones (section 7).
- **Deployment.** Release 1.0.1 three days after creation; a commit titled "kit after the test live" [GIT]; the
  author's own temple theme runs on it [API]. No third-party use found: 32 forks, none diverged [GIT].

### 4.4 workaipvlinh-byte — six games in six days on one copied "live layer", MIT
- **Who.** The profile README says the author cannot code and builds everything by prompting an AI assistant
  [FILE profile README]. Games: lop-hoc-chu, ai-la-trang-nguyen, di-chua-online, cuoi-lien-tay, dam-cuoi-online,
  ho-ca-live.
- **Shared layer.** `server.ts` ("shared server for every TikTok live game") plus `src/live/*` (voice queue,
  name cleaning, greeting batcher, gift thank-you throttle, scoreboard) [FILE dam-cuoi-online server.ts:1-10;
  src/live/]. Events reach the React stage over Server-Sent Events; the stage posts a state snapshot back so the
  dashboard preview always matches the live page [FILE lop-hoc-chu CLAUDE.md, "File" section].
- **lop-hoc-chu specifics.** Answer order by TikTok's send timestamp [FILE server.ts:258-260]; reconnect forever
  with 15 s → 120 s back-off, `fetchIsLive()` pre-check and a 30 s connect timeout [167-187, 327-334]; launcher
  restarts a crashed server and the server re-joins the remembered account [FILE BAT-LIVE.bat; server.ts:927-929];
  viewer count sampled every 15 s per game phase and reported as viewers gained or lost per minute per phase
  [812-858]; ranking in three horizons (round, stream, week) plus a lifetime record [FILE CLAUDE.md, rules
  section]; one app cycles lesson → recess mini-game → contest, which is a hub with a narrative.
- **Policy stance.** Gifts give no advantage in the quiz games [FILE lop-hoc-chu README.md:26; ai-la-trang-nguyen
  README]; the temple game runs an on-screen disclaimer [FILE di-chua-online README].
- **Use by others.** 95 forks of lop-hoc-chu (2 of 92 diverged) [GIT]; derivative repos returned by search
  (`tobi1008/lop-hoc-chu`, `nhatktb1/lop-hoc-gplx`); the live layer reused in two unrelated repos [API code]; one
  third-party issue [ISSUE #1].

### 4.5 Mateus0790/tiktokfarm — architectural twin of our hub
- **Hub.** One page, one canvas, one manager; games are classes with a common interface
  (`join/onChat/onLike/onGift/update/draw/result/giftGuide/botAct`) [FILE public/js/games/base.js:11-65].
- **Switching.** Per-game duration → result screen → intermission with a vote among three games; gifts add votes;
  the last game is excluded; no votes → random [FILE public/js/main.js:302-355].
- **Continuity.** Viewers active in the last 5 minutes join the next game automatically; gifts sent during the
  intermission are queued and applied [main.js:390-411].
- **Unattended running.** A game exception skips to the next game [main.js:439-447]; the overlay reloads itself
  every N hours between games [373-377]; offline retry every 60 s and a silence watchdog
  [FILE server/tiktok.js:54-76, 113-120]; launcher restarts the server [README section 5].
- **Persistence and identity.** Leaderboard JSON written atomically on the server, bots excluded
  [FILE server/store.js:25-70]; avatars are the characters, with an allow-listed caching proxy as fallback
  [FILE server/avatar.js].
- **Deployment.** Eight commits in three days, 2 stars, no forks [GIT, API]: complete, real use unproven.

### 4.6 zahrun5/tts-live-v2 — multi-tenant SaaS
- **Wiring (Q3).** Accounts (password or Google), one room and one TikTok connection per account
  [FILE server/services/tiktokManager.js:1-31]; a single optional operator-wide `EULER_API_KEY`
  [27-31; server/.env.example]; 10 reconnects with 5 → 60 s back-off [101-126]; after a server restart it retries
  the saved target for up to 15 minutes [167-190]; no rate-limit branch.
- **Games.** 16 server-authoritative modules behind a written contract
  [FILE server/games/game-registry.js; server/games/GAME-INTERFACE.md].
- **Switching.** Streamer picks a game or a random pool; viewers can trigger a vote: 10 distinct viewers typing a
  keyword within a sliding 30 s open a two-option vote, first to 10 wins; the same mechanism skips a question or
  reveals an answer [FILE server/vote-controller.js:1-40].
- **Gift mapping.** Per-user table gift name → `skip_round | next_question | reveal_answer | bonus_score`, count
  limited by plan [FILE server/services/giftTrigger.js:45-127; server/config/plans.js:21-27].
- **Deployment.** Live, uptime 8.6 h, `midtrans.ready=false` [WEB]. No stars or forks [API].

### 4.7 zane-tv/tiktok-live-temple-rpc — the template of the Vietnamese wave
- 230 stars, 351 forks in nine days [API]. One initial commit by the owner, then 757 commits on a single day from
  one outside contributor, merged by pull request [GIT]. No licence.
- JSON-RPC 2.0 over HTTP and WebSocket so external tools can trigger the same actions as chat
  [FILE README.md:91-140; server.js handleRpcCall]; local TTS worker; state file on disk; name and comment
  sanitiser [FILE server.js:341-395]. No reconnect after a drop [server.js:889-896].

### 4.8 hpmediaoffifical/h-p-t-i-k-t-o-k---g-a-m-e — sold product
- Electron app, version 1.0.53, four games plus a sound board; licence-key activation against the vendor's server;
  self-update [FILE package.json; server.js:15-21, 364-410]. Sign requests go to a non-EulerStream endpoint since
  2026-09-12 [GIT; FILE server.js:1, 1105-1110]. Proprietary.

## 5. Comparison with ours

Our side verified in `/home/user/tiktok-deniyorum` today.

| Dimension | Ours | Peers (best examples) |
|---|---|---|
| Event path | connector → `server/bridge.js` normalisers → own WebSocket → `tt.js` bus in each iframe | Same shape everywhere. duycuf adds dedupe + streak delta + rules in the core; zahrun5 and donation-race keep game state on the server |
| Game switching | iframe hub, fixed order, 6-minute slices, switch only at round end, 45 s "next" badge, 30 s heartbeat watchdog (`overlays/oyun.html:86-149`) | tiktokfarm: result screen + audience vote + carry-over. zahrun5: crowd-triggered vote. lop-hoc-chu: lesson/recess/contest cycle. Others: streamer picks |
| Streamer UI | panel with URLs, test events, connect/stop; settings by URL parameter | duycuf 5-tab panel with rule editing and per-row preview; lop-hoc-chu settings applied live + report page; zahrun5 web dashboard |
| Gift → action | fixed per game in code | duycuf editable table; tiktokfarm 4 diamond tiers with on-screen table; zahrun5 per-user mapping; livecade every action rebindable |
| Persistence | browser `localStorage` per origin (`overlays/_shared/profil.js:27-94`) + stats JSON | server-side JSON (duycuf, tiktokfarm, zane-tv), SQLite (tu-tien), PostgreSQL (donation-race), MongoDB (zahrun5) |
| Viewer identity | names + generated skins; no avatars in the four rotating games | avatars in workaipvlinh, tiktokfarm, zahrun5 (toggle), livecade, duycuf; deliberately off in dazevedodev; sprites only in donation-race |
| TTS | none (text announcer) | Edge TTS (duycuf, workaipvlinh), local model (zane-tv), browser speech (donation-race, dazevedodev) |
| Themes | none | duycuf theme folders; lop-hoc-chu background and persona |
| i18n | Turkish | livecade 13 languages; duycuf docs EN/VI; others one language |
| Demo for an empty room | demo bots, marked 🤖, real round on first chat (`overlays/_shared/kimlik.js:155-158`) | comparable: tiktokfarm fills to 8 and excludes bots from ranking; duycuf never fakes gifts on air; donation-race replaces bots as viewers arrive |
| Unattended running | waits for the live, reconnects after a drop, rotates, single exe | adds: supervisor loop, silence watchdog, back-off, rate-limit back-off, remembered target, overlay self-reload, error → next game |
| Layout | fixed 1920×1080 (`overlays/_shared/oyun-tema.css:105`) | portrait 1080×1920 nearly everywhere (section 7) |

**Gaps verified in our code**
1. *No retry after a non-offline connect failure.* The catch block retries only when the message matches
   offline/room-id; any other error (rate limit, network, sign outage) is logged and the bridge stays idle
   [FILE server/bridge.js:772-792 vs 794-830].
2. *No silence watchdog* (no such logic in `server/bridge.js`); waiting uses a fixed 10–15 s interval with no
   back-off [790].
3. *Bridge exposed.* Listens on 0.0.0.0 on the main port and on port 80 [865, 980]; `/api/fire`, `/api/soyle`,
   `/api/baglan`, `/api/kapat` are GET requests with side effects and `access-control-allow-origin: *`
   [124-199]; no Host/Origin check.
4. *Gift combos* are counted only on the closing event [451-458]; a viewer holding a combo sees nothing until
   release, and a combo is lost if the connection drops first.
5. *Event time* is stamped on arrival [364]; trivia order follows network delay.
6. *Scores live in the browser profile* and are tied to the page origin, so `localhost`, `localtest.me` and
   port 80 each see different data.

**Where ours is ahead** (none of the peers read has these together): single-file Windows exe; round-aware
switching with a heartbeat watchdog; iframe isolation that frees memory on every switch; wait-for-live loop that
connects by itself; honest bot labelling; cross-game profile.

## 6. Hosted or local, and fork behaviour

**Hosted or local (Q3).** Local on the streamer's PC: duycuf, workaipvlinh, zane-tv, tiktokfarm, dazevedodev, HP
(Electron), ours. Hosted: vamnguyen (open, no login), zahrun5 (accounts, plans), donation-race (allow-list),
livecade and LIVE Quán (accounts). Sign-server sources seen: library default with no key (vamnguyen,
workaipvlinh); optional operator key (zahrun5, duycuf, tiktokfarm, donation-race); vendor endpoint (HP); TikFinity
as primary source (duycuf); session cookies + a no-op local sign endpoint (donation-race,
[FILE server/server.js:144-155]); a signing-free connector in one fork (davijannotti). Only donation-race treats a
rate-limit answer differently from other failures.

**Fork behaviour (Q4).** Fork heads compared with upstream history by `git ls-remote`:

| Upstream | Forks checked | Identical | Stale | Diverged |
|---|---|---|---|---|
| vamnguyen/tiktok-live-games | 36 | 28 | 4 | 4 |
| duycuf/tiktok-live-kit | 32 | 27 | 5 | 0 |
| workaipvlinh-byte/lop-hoc-chu | 92 | 17 | 73 | 2 |
| zane-tv/tiktok-live-temple-rpc | 200 of 340 | 13 | 148 | 39 |

- vamnguyen's four diverged forks: two edit only the lane config (Kenya, one unknown); `davijannotti` adds four
  Brazilian games, an OBS profile/scene export and a different connector; `G4lile00` adds an election-themed
  game in nine commits [GIT].
- zane-tv's diverged forks include Docker and Windows installers, a Catholic-church variant with a moderation
  engine, and a fishing variant (`gunticit`, 20 stars, 19 forks) on whose commit 14 further forks sit [GIT].
- Independent non-fork copies found by code search: 6 for zane-tv, 2 for vamnguyen's SDK, 2 for the workaipvlinh
  live layer [API code]; plus `obulut05` (Turkish) and `duyduoc03` copies of vamnguyen [FILE].
- Conclusion: most forks are bookmarks. A minority run their own variants, and that minority is real.
- Issue trackers are almost empty: 1 issue and 3 pull requests across the eight top repos [API].

## 7. Layout: portrait or landscape (adviser's extra question)

| Project | Layout | Pointer |
|---|---|---|
| duycuf/tiktok-live-kit | 1080×1920 | `themes/template/theme.json:4-5` |
| workaipvlinh-byte (all) | 1080×1920 frame scaled to fit | `src/live/StageFrame.tsx:4-21`; lop-hoc-chu suggests 1620×2880 for sharper text (`README.md:70`) |
| zane-tv temple | 1080×1920 | `public/css/live.css:48, 73-74` |
| Mateus0790/tiktokfarm | 1080×1920 | `public/js/core.js:3-4` |
| Lehaneploxo/donation-race | 1080×1800 and 600×1000, orientation lock | `client/newyear.html:43, 2485`; `client/streetfighter_arena.html:30` |
| broneotodak/tiktokgame | portrait 9:16 | `public/marathon3d.html:12-15` |
| tuna1710 skill | 1080×1920 | `SKILL.md:12` |
| HP Action LIVE, tu-tien-online | 1080×1920 | README / repo description |
| zahrun5/tts-live-v2 | 412×732 portrait first; landscape 732×412 added by a patch | `rotasi-layar.patch:9-21` |
| vamnguyen | follows the window size | `public/games/horse-racing/game.js:35-36` |
| **ours** | **1920×1080 only** | `overlays/_shared/oyun-tema.css:105`; `overlays/_shared/tt.js:106` |

No peer hub is landscape-only. The duycuf kit documents the areas TikTok's own interface covers on a 1080×1920
frame: top 240 px (channel name, viewers), 100 px on each side (cropped on tall phones), the left half from
y = 1250 down (comment box), everything below y = 1760 (input box, gift button); it adds that text shrinks to
about a third on a phone and offers `/overlay?safe` to shade those areas [FILE docs/THEME.md:32-34;
docs/GO-LIVE.md:47, 94]. donation-race's 1080×1800 canvas is consistent with leaving the bottom strip free.

## 8. Ideas worth taking

Licence in brackets. "Idea only" = no licence file, do not copy code.

**Reliability**
1. Retry after every connect failure, with back-off, a long back-off on rate limit, and a silence watchdog —
   `Lehaneploxo/donation-race server/tiktokConnector.js:160-216` [idea only];
   `duycuf/tiktok-live-kit src/providers/manager.js:66-90` [MIT];
   `workaipvlinh-byte/lop-hoc-chu server.ts:167-187, 327-334` [MIT].
2. Launcher that restarts the server, and a server that re-joins the remembered account —
   `lop-hoc-chu BAT-LIVE.bat`, `server.ts:927-929` [MIT].
3. Local-only server: bind 127.0.0.1, Host/Origin allow-list — `dam-cuoi-online server.ts:30-37` [MIT];
   `tiktok-live-kit src/server.js:193, 232-235` [MIT].
4. Scores on disk on the server side with atomic writes — `tiktok-live-kit src/core/session.js:22-37` [MIT];
   `tiktokfarm server/store.js:53-70` [MIT declared in package.json only].
5. Snapshot of the running round restored after a page refresh — `donation-race server/db.js:240-275` [idea only].

**Game feel and fairness**
6. Gift-combo delta accounting — `tiktok-live-kit src/core/streaks.js:8-17` [MIT]; same idea in
   `dam-cuoi-online server.ts:171-194` [MIT].
7. Fastest-answer order by TikTok's send time — `lop-hoc-chu server.ts:258-260` [MIT].
8. Audience vote for the next game, carry-over of recent players, queued intermission gifts —
   `tiktokfarm public/js/main.js:302-355, 390-411` [MIT declared only]; crowd-triggered variant
   `tts-live-v2 server/vote-controller.js` [idea only].
9. Game exception → skip to the next game — `tiktokfarm public/js/main.js:439-447` [MIT declared only].
10. Three ranking horizons (round, stream, week) — `lop-hoc-chu CLAUDE.md` rules section [MIT].

**Presentation**
11. Portrait layout with explicit safe zones and a `?safe` debug view — `tiktok-live-kit docs/THEME.md:32-34` [MIT].
12. Avatars with fallbacks: prefer JPEG/PNG — `tiktok-live-kit src/core/normalize.js:33-44` [MIT]; allow-listed
    caching proxy — `tiktokfarm server/avatar.js` [MIT declared only].
13. Name cleaning for display and speech (fancy Unicode fonts, emoji, banned words) —
    `dam-cuoi-online src/live/names.ts:34-66` [MIT].
14. Host voice: queue with priority lane, staleness drop and stall guard — `dam-cuoi-online src/live/voice.ts:32-120`
    [MIT]; greeting batcher `src/live/scoreboard.ts:48-80` [MIT]. Needs `msedge-tts` (MIT [NPM]), which uses an
    unofficial Microsoft endpoint.

**Operation and insight**
15. Editable gift rule table with on-screen guide generated from it — `tiktok-live-kit src/core/rules.js`,
    `src/server.js:268-269` [MIT].
16. Viewers gained or lost per game phase — `lop-hoc-chu server.ts:812-858` [MIT]. We already report the active
    game to the bridge (`/api/oyun`).
17. Importable OBS profile and scene collection — `davijannotti/tiktok-live-games obs/` [idea only].
18. Written policy self-audit kept in the repo — `donation-race ПРАВИЛА_TIKTOK.md` [idea only].

## 9. Could not verify

- Live audience sizes, earnings, or how often any of these projects are actually on air. Only three servers
  exposed any state, and only at one moment each.
- Whether the vamnguyen room keys belong to real streamers; two look like keyboard tests. Uptime unknown.
- User numbers of zahrun5's SaaS and of Livecade; Livecade's architecture (closed).
- Release download counts (API endpoint blocked).
- README claims: "ran on real lives", "measured 13,000 viewers", "runs for days".
- TikTok's actual policy text. The policy statements above are the peers' interpretations.
- 140 of zane-tv's 340 forks and all forks of di-chua-online were not checked for divergence.
- Code was read, never run; behaviour is inferred from source.
- Whether our 10–15 s wait loop consumes sign-server quota while the streamer is offline (s4).
- Communities outside GitHub (Zalo, Facebook, Discord, TikTok) where real usage would show.

## 10. Handoffs

**s3-urunlesme**
- `Lehaneploxo/donation-race` — `ПРАВИЛА_TIKTOK.md`: TikTok LIVE rule audit with official source links.
- `livecade/*` — 65 hosted games, 13 languages incl. Turkish; marble race with profile photos.
- `hpmediaoffifical/h-p-t-i-k-t-o-k---g-a-m-e` — licence server, Cloudflare Worker variant, EULA, release workflow.
- `zahrun5/tts-live-v2` — plan table (free 30 days, Rp 25,000, Rp 50,000), Midtrans billing, legal pages.
- `Esnutbear/chispalive` (Spanish games + trial via Discord), `soykoru/koru-juegos` (game packs for a launcher),
  `baotran113a-dev/hp-game-shop` (shop site), `dOtExE97/botexe-studio`, `ThangBaymau123/tiktok-live-overlay`,
  `talkaboutdesign/tiklive`, `steveseguin/social_stream`, `gormgaming/TikControl-Releases`,
  `faisalrasheed442/playzy-public`.
- `tuna1710/tiktok-live-game-skill` — headless cloud streaming to TikTok over RTMP (operational and policy risk).
- Vietnamese press and police warning about gift-for-blessing livestreams (2026-11-04).
- Our own wording: "bahis" on screen in `overlays/at.html`, and the "open it and leave" promise in `README.md`.

**s4-baglanti**
- `PirateTok/live-js` (npm `piratetok-live-js` 0.3.0, 0BSD, 7 stars) — connector described as needing no sign
  service; used by `davijannotti/tiktok-live-games`.
- HP Action LIVE switched its sign endpoint away from EulerStream on 2026-09-12 (`server.js:1`).
- `Lehaneploxo/donation-race` — session-cookie + msToken connection, no-op local sign endpoint, library patched
  at install (`scripts/patch-tiktok.js`), rate-limit back-off.
- `nglmercer/tiktok-signer` (self-hosted transport), `tiktool/tiktok-live-api`, `EulerStream/TikTok-Live-Api`.
- `tiktok-live-connector` latest is 2.5.0, licence AGPL-3.0-only [NPM]; chat text moved to `content` in the newer
  protocol (peers read both fields).
- TikFinity as primary source with the connector as fallback (`duycuf/tiktok-live-kit`).

**s1b-mekanikler**
- `workaipvlinh-byte/ai-la-trang-nguyen` (quiz show), `workaipvlinh-byte/lop-hoc-chu` question formats and
  scoring, `mashupsolution/tu-tien-online`, `k0d1r/tiktok-live-interactive-game`, `kiozhu/battle-ring`,
  `noema-ai-open/noema-live-games-tiktok`, `northoniserhardt/tiktok-live-game`, `oguzhankayan/SlimeTiktok`,
  `raldblox/tiktok-live-interactive` (gift queue), Turkish small repos `osmanek93/HalatSavasi`,
  `uzunbugra/TiktokHoron`, `zuhayr635/kadro-kur-tiktok`, `batuhanyardimci/TakTuk-TikTok-Interactive-Game`.

**s2-motorlar**
- `RealShibaGames/TikTokPlugin` (Unreal), `tuncayl/spinwhell`, `absravdev/tiktok-live-arena`,
  `karmontal/TiktokLiveInteractiveGames` (Godot), `landsbetween/tiktok-pyramid-live`,
  `savacezarmarian14/TikTokGames` and `Alepe01/TikTokGames` (Python collections), `adrian13508/Tiktok_Live_Game`,
  `GospelBG/ChatPointsTTV`, `qixils/minecraft-crowdcontrol`, `BedrockLive/TNTCoin`,
  `RedruM-AU/RedruMs_Interactive_Zombies_Tool`, `SwaggyMacro/BarrageGPT`, `rhfbgfgfdg999999/3d-printer-live`.
