# s2-motorlar — engine/native TikTok LIVE games and the Chinese danmaku-game genre

Scout report, 2026-11-09. Evidence tags as defined in ORTAK.md section 5. All numbers come from calls made today.

## 1. Summary

1. **The open-source engine segment is real but thin; only one engine project shows clear adoption.**
   `cherry9001/tiktok-live-bar` (Unity + Node bridge, MIT code, Vietnamese) has 126 stars and 141 forks, five
   tagged releases and at least eight separate re-uploads [API][GIT]. Every other TikTok game built with Unity,
   Godot, Pygame or Roblox has 0–64 stars; most are prototypes [API].
2. **The format does come from China, but from Bilibili first and Douyin second, both in the first half of 2022;
   TikTok-side repos start in May 2022.** Earliest repos: Bilibili frameworks and games created January–March 2022,
   Douyin "cloud disco / subway squeeze" games April–July 2022, the first TikTok Pygame game May 2022 [API][GIT].
   Chat-plays-a-game predates all of it (a Bilibili plugin from 2017 [API]; Twitch earlier [MEMORY]).
3. **On Douyin this is an official, monetised product category** called "live mini-play" (直播小玩法): the developer
   ships a Windows exe client, the platform pushes comment/gift/like events to the developer's server, and the
   developer earns 8–23% of the room revenue (up to 50% by special deal). The platform's own rules template uses
   "send 1 to join blue, 2 to join red" and "gift X summons a unit" as its example, and its API has camp reporting
   built in [WEB developer.open-douyin.com].
4. **The Chinese commercial games are closed source.** GitHub and Gitee hold connectors, a few demos, sellers'
   catalogue repos, and — unusually — two studio repos with internal design documents and balance tables left
   public (`skyofzhang/DM_kpbl`, `skyofzhang/DM_CK`) [FILE].
5. **There is no single connection path for TikTok engine games.** In the 35 TikTok-connected repos where
   the path could be identified: Python `TikTokLive` sidecar 10, TikFinity bridge 8, in-engine C#
   `TikTokLiveSharp` 8, Node `tiktok-live-connector` sidecar 6 (plus one as an alternative mode), other 3,
   Streamer.bot 0 [FILE signature scan of 70 clones]. By reach the TikFinity-bridged
   projects lead (tiktok-live-bar, the GTA V plugin, the Minecraft mods).
6. **Architecturally the engine games are the same as ours**: a local bridge process normalises events and feeds a
   renderer over a local WebSocket. `landsbetween/tiktok-marble-race` even uses the same npm library as we do
   (`tiktok-live-connector ^2.5.0`) [FILE server/package.json]. The engine replaces the browser; the window is
   captured in LIVE Studio instead of an embedded browser source.
7. **What they have that our overlays do not**: viewer avatars on every unit, multi-tier gift ladders, gift rules
   editable as data, a second connection provider, native-window capture with full GPU, and (in China) persistent
   progression with daily schedules. All but true 3D are portable to Canvas 2D; one of the Chinese projects
   started as "pure Web Canvas" before moving to Godot [FILE gavenna/livegame design doc].

## 2. Method

- **GitHub repository search** through `ara.py`: 54 queries (5 returned nothing), 1,232 records, 951 unique
  repositories [API]. Chinese: 抖音 弹幕 游戏, 弹幕互动游戏, 直播互动游戏, 弹幕游戏, 弹幕游戏 unity, 直播小玩法,
  无人直播 游戏, 弹幕 阵营/塔防/赛马/攻城, 直播弹幕 unity, plus `in:readme` variants per language. English:
  tiktok live unity/godot/unreal/pygame/roblox/mod, TikTokLiveSharp, TikTokLiveUnity, tikfinity, tiktok minecraft,
  tiktok gta, tiktok plays, crowd control tiktok, tiktok live interactive game, and `language:` filters for C#,
  GDScript, Python, Java, Lua, C++. Vietnamese and Indonesian: game tương tác tiktok, tiktok live tương tác, game
  interaktif tiktok. Further search-bucket calls: metadata, issue counts and two fork-divergence queries. Total
  about 65 search-bucket calls and 7 code-search calls.
- **Code search** (7 calls): `TikTokLiveSharp` in C# = 42 files in about 20 repos; `21213` + tikfinity in C# = 11
  files in 5 repos; Douyin official push endpoint `live_data/task/start` = 17 files in 12 repos; `TikTokLiveClient`
  + pygame = 22 files in 15 repos; tikfinity in Java = 11 files in 3 repos [API]. The code index is incomplete, so
  these are lower bounds.
- **Git**: 84 repositories cloned blobless without checkout (33 MB in total); README, tree and history read for
  all, selected source and config files read for 7. Nothing was built or executed.
- **Other hosts**: Douyin open-platform documentation, 6 pages [WEB]. Gitee: the v5 search API answers with an
  empty list for anonymous callers; the JSON endpoint behind the Gitee search page worked for 5 queries (about
  300 unique repos, 102 keyword-relevant) [WEB so.gitee.com]. WebSearch/WebFetch tools were not used.
- **Excluded**: 14 political/SEO spam repos, 63 bots, downloaders, recorders, scrapers and username checkers
  (keyword match), and the bullet-hell shooters that share the word 弹幕 with this genre.
- **Untrusted text**: several repos carry instruction files for AI coding agents (`CLAUDE.md`, `AGENTS.md`,
  `.claude/`), one studio doc addresses "AI" directly about where to look up documentation, and a few repo
  descriptions are raw LLM prompts. All were treated as data; none was acted on.
- Coordinator leads received mid-run were checked: `rhfbgfgfdg999999/3d-printer-live` (read from the s1b clone),
  `landsbetween/tiktok-marble-race`, `tuncayl/spinwhell`, `Nargor/car-action`, `HarunUcan/Tiktok-Live-Fan-Slap-Game`.

## 3. Landscape

Approximate counts from today's search records after a keyword filter (noisy; treat as order of magnitude) [API]:

| Family | Repos seen | With 5+ stars | Created in 2026 | Typical connection | Notable |
|---|---:|---:|---:|---|---|
| Unity / C# | ~35 | 6 | 16 | in-engine TikTokLiveSharp (hobby), TikFinity or Node bridge (the adopted ones); Douyin official push | tiktok-live-bar 126★/141 forks; GTA V plugin 91★/63 forks |
| Python (Pygame, desktop, scripts) | ~60 | 12 | 35 | `TikTokLive` library; Douyin grabbers | DouYin_control 279★; Tiktok_Live_Game 64★ |
| Java (mostly Minecraft plugins) | ~35 | 7 | 13 | TikFinity socket, EulerStream, Crowd Control | ChatPointsTTV 36★; minecraft-crowdcontrol 28★ |
| Godot | ~13 | 1 | 9 | Node or Python sidecar over WebSocket | landsbetween trio, karmontal set, Marble Royale (MIT) |
| Lua / Roblox | 22 in the Roblox query, all created in 2026 | 0 | 22 | HTTP polling of a local or hosted bridge | none above 1★ |
| C / C++ incl. Unreal | ~9 | 2 | 3 | — | one Unreal 5.8 game (Douyin), one UE4SS mod |

Created-by-year for all keyword-relevant records: 2022: 35, 2023: 40, 2024: 41, 2025: 57, 2026: 315 [API]. The
2026 wave is largely solo builders working with AI coding agents (agent files are present in `gavenna/livegame`,
`skyofzhang/DM_*`, `ambitious2223/marbles-interactive-`, `obrunogonzaga-games/tiktok-live-climb`) [FILE trees].

### Connection paths (question 1)

| Path | Where seen [FILE] | Comment |
|---|---|---|
| TikFinity bridge: local WebSocket `ws://127.0.0.1:21213` or webhooks | tiktok-live-bar (default), KopruKaosu, tiktok-live-climb, GTA5-TikTok-Integration, TikTokLIVEMC, tikfinity_mod, perang-wilayah-bridge, MayhemDeck | The path with the most adoption. The streamer installs TikFinity; the game needs no signing. |
| Node sidecar with `tiktok-live-connector` | landsbetween (3 games), BallsBattleGame, quan-tra-da, tiktok-live-bar (alternative) | Identical to our bridge. |
| Python sidecar with `TikTokLive` | Tiktok_Live_Game, car-action, karmontal, TikTokLive-Gift, Comment-Game-Controller and 5 more | Most common by count. |
| In-engine C# `TikTokLiveSharp` / `TikTokLiveUnity` | spinwhell, tiktok-live-arena, Fan-Slap-Game, unity-plinko, 4wins, DungeonBoss, overszboy | Hobby projects. `egunde/tiktok-pvz` README says it no longer connects because of a library bug. |
| Streamer.bot | none | 0 hits in the scanned files. |
| Douyin official open platform | DM_kpbl, DM_CK, DM_ZG, dmServer, chorus | Signed HTTPS push to the developer's server, then WebSocket to the Unity client; a Unity SDK also exists [FILE DM_kpbl docs/douyin_integration_guide.md][WEB]. |
| Douyin unofficial grabbers | DouYin_control (DouyinBarrageGrab, local port 8888), Dy-Ai-Live, douyin_live (Python scraper posting to Unity), 3d-printer-live (reads WebSocket frames from a real Chrome via DevTools protocol) | No signing server. |
| Bilibili | official open-live key (Bilibili_LiveGame, GDBlive, open-block-war) or unofficial WebSocket libraries | — |

## 4. Profiles of the top repos

**cherry9001/tiktok-live-bar** — A. "Cloud disco": viewers who type `hey` or send a gift appear as dancing 3D
characters with their TikTok avatar. Unity 6 client, Node 20 bridge, web control panel. The bridge has two
providers behind one event shape: TikFinity (default) and `tiktok-live-connector` with an optional EulerStream key
[FILE TikTokBridge/server.js:12,55-56,677]. Gift rules are data: Rose (1) = camera zoom on you for 4 s; a
10-diamond gift = VIP wings for 60 s; TikTok (1) = change character; Galaxy = "TOP DJ" for 12 s with six firework
bursts; 500+ and 1000+ diamond bands trigger fireworks; cumulative 10/50/200/1000 unlock titles
[FILE TikTokBridge/config/master.json, gifts.json]. Up to 400 avatars, 10-minute idle expiry, beat clock at 128 bpm
[FILE config/game.json]. Ordinary viewers are drawn dim and translucent as a crowd; a gifter lights up, the camera
zooms to that person, and name, avatar, banner and wings scale with the gift; the top three stand on podiums
[FILE Documentation/HUONG_DAN_SU_DUNG.txt]. Sold by a Vietnamese vendor who then published the full source under MIT; the README says
buyers may add their own licence system [FILE README-BAT-DAU.txt, LICENSE]. Of 100 sampled forks only 7 were pushed
after forking; forks were created in two waves, 72 in August and 21 in November 2026 [API]. Art is third-party
(GIFs from Weibo and Giphy, with a note to verify terms) [FILE TikTokBridge/assets/*/sources.json].

**dhrdzy/DanMuGame** — A, closed. Catalogue repo of a Chinese vendor's launcher: about 14 games for Bilibili,
Douyin, TikTok, Kuaishou and others. Price list: 498–1000 CNY per game per month, 1300 CNY for all, or a free
tier where the vendor takes 8% of room revenue; full source offered for 45,000 CNY [README]. 149 commits over 13
months, last push 2024-03-01 [GIT][API]. Its game list is the clearest statement of what streamers pay for
(section 5).

**skyofzhang/DM_kpbl and DM_CK** — B, studio internals. `DM_kpbl` is a two-camp push battle ("Capybara Duel") with
a Node server and Unity client; its docs contain the complete gift → unit → push-force table and a step-by-step
Douyin integration guide marked "end-to-end verified 2026-02-13" [FILE docs/gift_config.md,
docs/douyin_integration_guide.md]. `DM_CK` (198 commits) is a persistent cultivation RPG with a ten-module design
set ordered "attract → join → core loop → growth → gifts → social → retention" [FILE
claude-other-data/docs1111/modules/INDEX.md]. Both are unlicensed; the README of the first says "private project".

**gavenna/livegame** — B. Medieval two-camp siege. Node server, Canvas 2D front end, later a Godot client,
packaged to one exe; template + LLM + TTS announcer [FILE tree, package.json]. Its design doc gives the full
free-keyword tier and gift ladder and names the payment driver: gifters pay to be seen, so the avatar rides on the
unit and a banner names the sender [FILE docs/项目规划/游戏设计.md]. No README, no licence.

**landsbetween/tiktok-marble-race, tiktok-pyramid-live** — B. Godot 4, native portrait window, Node bridge with
our library. Marble race: 25 s lobby, up to 50 marbles, avatar inside the marble plus a name tag, gift = boost,
named gifts = bomb at the leader, race ends 3 s after the third finisher [FILE README.md, game/scripts/main.gd].
Pyramid: cooperative building where likes spawn a personal worker and viewers level up from likes and coins
[README]. No licence.

**karmontal/TiktokLiveInteractiveGames** — B. The nearest engine analogue to our product: tug of war, quiz, tower
climb and a 3D arena behind one launcher; Godot 4.3 plus a tested Python bridge with mock source, event injection
and a banned-words filter. Ships an ideas document ranking eight formats [FILE tiktok-live-game-ideas.md,
bridge/README.md]. No licence.

**ambitious2223/marbles-interactive- ("Marble Royale")** — B, MIT. Twelve commits on top of the MIT Godot game
`MechanicalFlower/Marble` (17★ [API]). The game has no TikTok code; a local hub routes gifts to effects the game
declares in a manifest [FILE README.md, docs/TIKORA_INTEGRATION.md]. Assets carry per-file licences
[FILE .reuse/dep5].

**rhfbgfgfdg999999/3d-printer-live** — A with a caveat. Web/Three.js "avatar printer" for Douyin with an English
page for TikTok; 240 stars and 122 forks nine days after creation, MIT, daily pushes [API][GIT]. Free program used
to sell custom builds [README]. Connection by reading the live page's WebSocket frames from a real Chrome
[FILE douyin-bridge.mjs]. s1b owns the analysis; noted here for the Douyin path. Star authenticity not verifiable.

**KeJunMao/open-block-war** — A, historical, MIT. The colour-territory war that was popular on Bilibili in 2022,
open-sourced after "the hype passed", with nine skins on one rule set and a per-room paid authorisation table
[README]. Web tech; handed to s1b.

**obrunogonzaga-games/tiktok-live-climb** — C but well specified: seven-rung gift ladder with coin fallback, speech
throttle, a versioned event schema, and a safe-zone table for the 9:16 LIVE screen [FILE README.md,
docs/overlay-capture.md].

## 5. Recurring formats (question 2)

| # | Format | Examples | Chat | Like | Gift |
|---|---|---|---|---|---|
| 1 | Two-camp push / tug of war | DM_kpbl; Douyin official rules template; karmontal; Roblox tug of war; Fan-Slap-Game | `1`/`2` (or side name) joins a camp, locked for the round | short small push | unit or boost for N seconds; bigger gift = stronger and longer |
| 2 | Camp battle with spawned units (lane war, siege) | dhrdzy (3 titles), gavenna/livegame, lieguo-fenzheng, douyin-live-redalert, chorus | keyword = free basic troop, rate-limited | militia | ladder of units, then field-wide skills with a full-screen banner |
| 3 | Territory / conquest map with factions | open-block-war 112★, unlizhao 23★, conquest-tiktok-game, perang-wilayah | join faction | attack power | large capture; map may persist between streams |
| 4 | Race (marble, marathon, car) | dhrdzy (4 titles), landsbetween, Marble Royale, car-action, Tiktok_Live_Game 64★ | join | nudge | boost or nitro; special gifts sabotage the leader |
| 5 | Co-op defence against monsters | dhrdzy (2 titles), dyYeyouGame, DungeonBoss | join / small heal | damage or heal | weapons, allies, revives |
| 6 | Social presence ("cloud disco") | tiktok-live-bar 126★/141 forks, dhrdzy, Gitee sellers from 2022 | keyword = appear; commands = dance, walk | energy | camera zoom, size, wings, stage; cumulative titles |
| 7 | Co-op building / queue | pyramid-live, tower-stack, 3d-printer-live 240★ | block / print | worker / block | gold blocks, larger print, queue jump |
| 8 | Chat sabotages a bot or the streamer | tiktok-live-climb, TNTCoin 20★/17 forks, GTA V plugin | — | — | obstacle size follows gift size |
| 9 | Quiz and word games | karmontal quiz, ordin20118 word game | answer | — | hints, score multipliers |
| 10 | Luck machines | spinwhell 18★, coin pusher, plinko, pinball | `me` = enter | coins | extra entries |
| 11 | Persistent idle RPG | DM_CK, dhrdzy pet manor, xiuXianInvest | join, query own stats, open chests | — | revive, damage, draws; VIP levels |

Formats 1–4 are the ones present both in paid Chinese catalogues and in independent open-source builds. Our four
games map to 4 (marble, horse), 9 (trivia) and 1 (PK).

A constraint stated by a 2022 Bilibili author applies equally to TikTok: stream delay of about five seconds forces
low-interaction designs [README wangwenxi-handsome/bilibili-bullet-chat-game].

## 6. What they do that web overlays do not, and what is portable (question 3)

| Capability | Seen in | Portable to Canvas 2D? |
|---|---|---|
| Real 3D scenes, cinematic or selectable cameras | tiktok-live-bar, car-action, Marble Royale | Not as 3D. A 2D pan/zoom "camera" and a spotlight queue give most of the effect. |
| Viewer avatar on every marble, unit or billboard, cached across restarts | almost every engine game; 3d-printer-live | Yes. Needs avatar URLs through the bridge and an image cache. |
| Rigid-body tracks regenerated every round, power-ups aimed at the leader | landsbetween, Marble Royale | Yes; we already run a marble race. |
| Unit spawning with tiered stats and counters | DM_kpbl, livegame, dhrdzy | Yes; livegame's first version was Canvas. Sprite count is the limit, not the technique. |
| Persistent worlds and progression (levels, titles, VIP, pity counters, maps that survive) | DM_CK, pyramid-live, conquest-tiktok-game | Yes, with local storage or a JSON file; no accounts needed. |
| Native window with full GPU | all engine games; 3d-printer-live runs its page in a separate browser window for the same reason | Partly: run the overlay in a real browser window and capture the window instead of using the embedded browser. |
| Rules as editable data and an operator panel with simulator | tiktok-live-bar, karmontal, climb | Yes. |
| Spoken thanks and commentary (TTS, LLM announcer) | climb, livegame, 3d-printer-live | Yes. |

## 7. Reusable material with licences (question 4)

| Item | Where | Licence | Usable by us |
|---|---|---|---|
| Dual-provider Node bridge and rule engine | cherry9001/tiktok-live-bar `TikTokBridge/` | MIT (code) | Code yes; bundled images no (third-party) |
| Marble-race power-ups, track blocks, hub protocol | ambitious2223/marbles-interactive-, upstream MechanicalFlower/Marble | MIT (code, 3D blocks) | Yes, with attribution |
| Sounds and font listed in that repo | `.reuse/dep5` | boost.ogg CC0, font box_pixies CC0, marble textures CC0, countdown sounds CC-BY-3.0; `assets/sounds/sfx` CC-BY-NC-ND | CC0 and CC-BY yes; NC-ND no |
| Territory-war game with nine skins | KeJunMao/open-block-war | MIT | Yes (web code) |
| Avatar-printer scene and Douyin bridge | rhfbgfgfdg999999/3d-printer-live | MIT | Yes |
| Tug-of-war gift table and level ladder | skyofzhang/DM_kpbl `docs/gift_config.md` | none ("private") | Ideas and proportions only |
| Monetisation and retention module docs | skyofzhang/DM_CK `…/modules/M02, M05, M07` | none | Ideas only |
| Siege design doc with troop ladder | gavenna/livegame `docs/项目规划/游戏设计.md` | none | Ideas only |
| Seven-faction gift table and balance targets | yuanlongdong/lieguo-fenzheng `README.md` | README says MIT, no LICENSE file | Treat as unlicensed until confirmed |
| Format ranking and event mappings | karmontal `tiktok-live-game-ideas.md` | none | Ideas only |
| Safe-zone table, gift ladder | obrunogonzaga-games/tiktok-live-climb `docs/overlay-capture.md` | none | Ideas only; author says to verify on a phone |
| Official rules-card template and gift configuration limits | Douyin open-platform docs | public documentation | Ideas |

Not reusable: craftpix backgrounds in `adrian13508/Tiktok_Live_Game`; the effects pack bundled in
`tuncayl/spinwhell`; models in the `DM_*` repos (their own docs say assets were extracted from another game).

Balance numbers worth keeping [FILE]:
- DM_kpbl gifts (Douyin coins → push force, duration): 10 → 343, 30 s; 52 → 808, 90 s; 99 → 1415, 120 s;
  199 → 2679, 150 s; 520 → 6988, 160 s. Force × seconds per coin: about 1,030, 1,400, 1,715, 2,020, 2,150
  [INFERRED from the table]. A 0.1-coin gift is a permanent level-up over ten levels.
- livegame: prep 30 s, battle 15–20 min, result 20 s; castle HP 10,000; price points 1, 5, 10, 30, 99, 199, 299,
  520, 1200, 3000 coins; "10–100 yuan" marked as the main revenue band.
- lieguo-fenzheng targets: 45–60 min rounds; free actions about 44% of contribution in a 500-viewer room.
- tiktok-live-bar: spotlight 4–15 s, queue of 8; combo window 5 s; titles at 10/50/200/1000.
- landsbetween marble race: lobby 25 s, 50 marbles max, bots fill to 6, timeout 100 s, podium 7 s.

## 8. "Chat controls the game the streamer is playing" (question 5)

A separate category of roughly 60–80 small repos today: about 50 keyword-relevant hits for TikTok + Minecraft, 22
for Roblox (all created in 2026, none above 1 star), 8 for GTA, about 20 game mods (Terraria, Risk of Rain 2, Black
Ops 3 Zombies, BeamNG, Silksong, Thronefall and others) [API]. Leaders: `lishang520/DouYin_control` 279★/48 forks
(Douyin → key presses), `smeysu/GTA5-TikTok-Integration` 91★/63 forks/26 issues/13 tags,
`benioriginal/TikTokLive-Gift` 71★/128 forks/80 issues, `GospelBG/ChatPointsTTV` 36★ with 19 tags and four
plugin-site listings, `qixils/minecraft-crowdcontrol` 28★ with 31 tags, `BedrockLive/TNTCoin` 20★/17 forks
[API][GIT]. The usual wiring is TikFinity webhooks into a game-specific mod. Closed free tools now compete here
(`faisalrasheed442/playzy-public`, `Obiwayne/MayhemDeck`) [README]. Not our product; one borrowable format is the
TNT challenge ("streamer builds, chat destroys").

## 9. Comparison with ours

Based on our README and ORTAK.md only.

- **Same**: bridge + local WebSocket + renderer; auto-running rounds; demo bots when the room is empty (several
  engine games have the same idea); persistent boards.
- **We are ahead on**: four games in one rotation, single exe with no runtime to install, zero-touch operation.
  Most engine repos ship one game and need Unity, Node or Python on the streamer's PC; the most adopted one still
  needs Node 20 and TikFinity [README].
- **We are behind on**: avatars; multi-tier gift ladders; rules as data; a fallback connection provider; GPU (our
  README needs `?lite=1` because the embedded browser has no GPU, engine games capture a native window); a free
  status path for non-payers shown separately from donors.
- **Policy note**: Douyin's official programme requires a real person on camera and forbids unattended streams
  [WEB]. Our pitch is "open it and leave it". Whether TikTok has a comparable rule was not checked.

## 10. Ideas worth taking

1. Add TikFinity's local WebSocket as a second provider behind our event bus — `cherry9001/tiktok-live-bar`
   `TikTokBridge/server.js`, `src/tiktok/normalize-tikfinity-event.js` (MIT, code reusable).
2. Give PK a real gift ladder in which bigger gifts are stronger, last longer and are better value per coin, with a
   cheapest gift that upgrades permanently — `skyofzhang/DM_kpbl` `docs/gift_config.md`.
3. Marble race: gift during the race = boost, named gifts = bomb at the leader, finish 3 s after third place, kick
   stuck marbles, gold marble for followers — `landsbetween/tiktok-marble-race` `README.md`,
   `game/scripts/main.gd`; banana/shell power-ups from `ambitious2223/marbles-interactive-` `README.md`.
4. Show avatars and cache them, with a generated initial-letter fallback — `landsbetween/tiktok-marble-race`
   `main.gd:112-175`; `rhfbgfgfdg999999/3d-printer-live` `README.md`.
5. "Pay to be seen": keep the crowd dim and light up the gifter with a short, queued spotlight on their own
   piece — `tiktok-live-bar` `Documentation/HUONG_DAN_SU_DUNG.txt`, `TikTokBridge/config/master.json`,
   `config/game.json`; rationale in `gavenna/livegame`
   `docs/项目规划/游戏设计.md` section 3.2.
6. Run the overlay in a real browser window and capture the window to regain the GPU —
   `3d-printer-live` `README.md`; `tiktok-live-climb` `docs/overlay-capture.md`.
7. Free status path: per-stream level from likes and a separate top-likers board —
   `landsbetween/tiktok-pyramid-live` `README.md`.
8. Several join keywords per side and friendly on-screen translation of commands — `DM_kpbl`
   `Server/config/default.json`; `gavenna/livegame` `PROGRESS.md`.
9. Speech budget (one spoken thank-you per 2.5 s) and coin-value fallback for unlisted gifts —
   `tiktok-live-climb` `README.md`.
10. A name/comment filter in the bridge — `karmontal/TiktokLiveInteractiveGames`
    `bridge/livebridge/moderation.py`.
11. A `!me`-style query that shows the viewer's own stats, and special rounds at fixed clock times —
    `skyofzhang/DM_CK` `…/modules/M02_interaction_entry.md`, `M07_retention_loop.md`.
12. One rule set, several skins, to vary the rotation cheaply — `KeJunMao/open-block-war` `readme.md` (MIT).
13. If the streamer ever goes portrait: a safe-zone table — `tiktok-live-climb` `docs/overlay-capture.md`.

## 11. Could not verify

- Actual on-air use by third parties for any open-source engine game. Release download counts are unreachable;
  forks are mostly unmodified copies. The tiktok-live-bar demo video link was not opened.
- Authenticity of star and fork counts for `3d-printer-live` (240 stars in nine days) and `tiktok-live-bar`.
- Revenue and popularity claims inside READMEs and design docs (vendor price lists, "60M+ CNY monthly" for a
  reference game, "attracted many users").
- The size of the Chinese market: the commercial games are closed, and Gitee search coverage was five queries.
- The full official Douyin gift price list and the Unity SDK pages; six documentation pages were read.
- Whether TikTok offers an official programme comparable to Douyin's, and TikTok's rules on unattended streams.
- TikFinity's API contract from its own documentation; seen only through consumers' code.
- Which TikTok connector the closed `dhrdzy` client uses, and whether its TikTok support works.
- Gameplay of `ModifiedMonkee0/KopruKaosu_TikTok` and other repos without a README.
- "Complete and runnable" judgements rest on reading, not on running anything.
- Statements about our own project rest on its README and ORTAK.md.

## 12. Handoffs

- **s1a-merkezler**: `duycuf/tiktok-live-kit` (21★/32 forks), `vamnguyen/tiktok-live-games` (75★/37 forks),
  `mashupsolution/tu-tien-online` (10★/20 forks), the "Tikora" hub referenced by Marble Royale (hub repo not
  located), `livecade/*` per-game repos.
- **s1b-mekanikler**: `KeJunMao/open-block-war` (112★, MIT), `mcube-12139/danmaku-game` (95★, MIT, Bilibili
  minesweeper/sudoku), `abdusalam1/avatar-arena` (MIT, Canvas 2D, like = enter, comment = grow),
  `yuanlongdong/lieguo-fenzheng`, `li-ming111/douyin-live-game` (GPL-3.0), `tenyear-10/danmu-nightwatch` (Phaser
  co-op tower defence, 3-minute rounds), `xiehaibo11/douyin-live-redalert`, `ye-cool/danmaku-kitchen`,
  `broneotodak/tiktokgame`, `kiozhu/battle-ring`. Chinese-language queries surface several web games that English
  queries miss.
- **s3-urunlesme**: `dhrdzy/DanMuGame` pricing (monthly rent or 8% share, source for sale); Douyin's official
  8–23% developer share [WEB]; `Papouth/TikTok-Live-Diamond-Heist` (licence sold through Discord);
  `faisalrasheed442/playzy-public`; `Obiwayne/MayhemDeck`; `speedTD/Tiktok_Live_bar_Donate` (README mentions the
  original seller's licence server); `baotran113a-dev/hp-game-shop`; `appvidlab/*`; AI-host suites
  (`wqlttt/TikTok_2D_Live`, `gavenna/live-waifu`).
- **s4-baglanti**: `frankvHoof93/TikTokLiveSharp` (216★/58 forks, last push 2025-12-13 [API]; a consumer reports it
  no longer connects); `sebheron/TikTokLiveSharp` archived; TikFinity local API as the de-facto engine bridge;
  `landsbetween` on `tiktok-live-connector ^2.5.0` while we pin `^2.4.3`; `NANDOBRTV/tiktok-live-arena` uses
  `tiktool`; `PirateTok/live-cs`, `live-java`, `live-lua` (0BSD); Douyin grabbers `ape-byte/DouyinBarrageGrab`
  (1,706★/252 forks, MIT), `skmcj/dycast` (860★/215 forks), `scx567888/live-room-watcher` (512★/121 forks, MIT),
  `wushuaihua520/BarrageGrab` (423★, AGPL-3.0); Bilibili `a820715049/BiliBiliLive` (166★), `Fantety/GDBlive` (17★,
  MIT).

Files: `adaylar.json` (40 candidates) and this report in
`/tmp/claude-0/-home-user-tiktok-deniyorum/641b8bd3-baa8-54a7-9936-ea040ee0b2a8/scratchpad/repo-arastirma/s2-motorlar/`;
search records in `not/arama.jsonl`, READMEs in `not/readme/`, per-repo history summaries in `not/ozet/`.
