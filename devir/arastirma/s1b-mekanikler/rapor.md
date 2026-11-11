# s1b-mekanikler — single-mechanic web games: game-design comparison

Date 2026-11-09. Scout segment: web-tech single-game repos (JS/TS/HTML). Everything below was fetched today.
Clones (read-only, no binaries) are in `klon/<owner>__<repo>/` next to this file; file:line tags refer to them.
Evidence tags as defined in ORTAK.md section 5.

## 1. Summary

1. **Others have built the same mechanics, but the ones that are demonstrably in use are not our closest
   look-alikes.** Proven use sits with (a) a commercial hosted vendor, Livecade, which publishes 65 README-only
   repos, one per game, including marble race, horse race, tug-of-war, trivia and territory war [API][README];
   (b) Vietnamese vertical "TTS-hosted show" games — `workaipvlinh-byte/lop-hoc-chu` reached 73 stars / 95 forks
   five days after creation and already has a third-party user issue and renamed derivatives [API][ISSUE #1];
   (c) recognition toys ("avatar printer": 240, 89 and 54 stars) [API]. The open-source repos that copy our four
   mechanics most directly are almost all one-author, 0-star, 1–70-commit projects from the last three months.
2. **Our two flagship mechanics are rare in open-source web code.** Marble race: the searches return one hosted
   product page, one Godot project and one 143-line page without a TikTok connector [API][FILE]. Horse race:
   three web repos, all 0 stars; none uses pool odds [API][FILE]. Team battles (about 45 web repos) and quiz plus
   word games (about 38) are where builders cluster [API census, section 3].
3. **Layout: nearly everyone designs for a 9:16 phone frame; we ship fixed 1920×1080 landscape.** Of 59 cloned
   code repos, 26 mention portrait/9:16/1080×1920 and 18 mention only that; one mentions only landscape
   [FILE regex census, section 6]. Three unrelated repos state the same rule: keep the lower part of the frame free
   for TikTok's own chat and gift UI.
4. **Self-recognition: the convergent answer is the viewer's profile picture plus a name tag on their own piece.**
   33 of 59 code repos carry the TikTok avatar into the scene [FILE regex census]; Livecade puts the photo inside
   every marble and a place+name tag above every marble [README]. Our four games use a generated skin, no
   avatar, and label only the leader on the track.
5. **Gift design splits into three camps; ours is a fourth, and one part of it is the riskiest.** Camp A: gifts
   give no advantage at all (the two most-forked quiz games say so and cite TikTok rules). Camp B: bounded,
   tiered boosts and sabotage, usually with thresholds near 1/10/100/1000 diamonds — the same ladder as our
   `ulti.js`. Camp C: the gift is the only input and decides outright. Nobody else found multiplies a team's chat
   for 15 s (our `carpanlar`) or multiplies a stake on a race (our horse race). The second is exactly what one
   long-running peer's written rule audit marks as "gambling-like" [FILE], and the one jockey-race repo renamed
   its command from `!bet` to `!pick` and pays fixed points [FILE].
6. **Round timings converge and ours mostly match, with two outliers.** Team rounds are 180 s almost everywhere
   (ours 180). Quiz questions run 20–30 s (ours 25) but games are 20 questions (ours 40). Races run 40–90 s with
   16–24 racers by default (ours up to 50 and roughly half a minute — [INFERRED] from the tuning note at
   `bilye.html:141`, which records 23 s before gravity was lowered; not measured today).
7. **Fair "first correct" needs TikTok's timestamp.** Four repos rank answers by the message's `createTime`
   rather than arrival order, and ignore answers sent before the question was shown [FILE]. Our bridge does not
   pass that field; `bilgi.html` ranks by arrival order.
8. **Unattended operation is a stated policy risk, not only a product feature.** A peer with 838 commits wrote a
   self-audit against TikTok's LIVE rules: automation without the host present = medium risk; gift → random
   outcome = high risk; "two sides, send gifts" as the only content is listed under fake engagement; bots must
   be visibly marked [FILE]. Secondary web sources agree on unattended streams [WEB]; TikTok's own page could not
   be read (section 8).

## 2. Method

Channels: GitHub repository search through the shared helpers (about 60 search-bucket calls, 0 code-search
calls), `git clone --filter=blob:none` with a sparse checkout that leaves out images, audio, models and archives
(no API cost), one npm registry lookup, one WebFetch (failed: page has no readable text) and one WebSearch
(worked). Nothing downloaded was executed, installed or opened in a browser.

Queries (sorted by stars unless noted; total results in brackets):
`tiktok live game` [371; also by updated], `tiktok marble race` [4], `tiktok live marble` [2], `tiktok marbles` [1],
`tiktok live race` [21], `tiktok live comment race` [1], `tiktok live quiz` [16], `tiktok trivia` [37],
`tiktok wordle` [11], `tiktok hangman` [33], `tiktok guess word live` [4], `tiktok live word game` [15],
`tiktok live battle` [49], `tiktok country war` [1], `tiktok tug of war` [3], `tiktok boys vs girls` [3],
`tiktok horse race` [3], `tiktok live bet` [4], `tiktok live prediction` [4], `tiktok plinko` [9],
`tiktok live zombie` [6], `tiktok battle royale` [7], `tiktok live territory` [2], `tiktok pixel war` [1],
`tiktok tower defense` [2], `tiktok king of the hill` [0], `tiktok live wheel` [5], `tiktok live roulette` [2],
`tiktok gift race` [0], `tiktok live flag` [4], `tiktok live boss` [10], `tiktok live snake` [16],
`tiktok live printer` [29], `tiktok live phaser` [3], `tiktok live matter.js` [2], `tiktok live three.js game` [2],
`topic:tiktok-live game` [72], `user:livecade` [65], `user:workaipvlinh-byte` [7];
Vietnamese `game tương tác tiktok live` [7], `tiktok live đua` [5], `tiktok đoán chữ` [2];
Turkish `tiktok canlı yayın oyun` [0], `tiktok canlı yayın` [8], `tiktok oyun` [13];
Spanish `tiktok live juego` [18]; Portuguese `tiktok live jogo` [24];
Indonesian `tiktok live interaktif game` [7], `tiktok tebak kata` [1].

Result: 493 unique repos. Excluded without analysis: 64 — about 33 "TikTok Youth Camp 2022" hangman class
projects, about 8 "MulaStar/HomeArm" earn-money SEO repos, trivia-answer helper bots, video bots, prediction-market
apps, connector libraries (handed to s4) and the unrelated 558-star spam repo `pxvr-official/1`. Livecade's 65
marketing repos are counted separately. 364 repos remain; 82 were cloned (34 triage-only clones deleted afterwards, 48 kept for spot checks), 39 are in `adaylar.json`.

Text addressed to an AI agent or to the reader was treated as data and not acted on: `CLAUDE.md` files in the
`workaipvlinh-byte` repos (instructions for an AI coding agent), and a README asking readers to star the repo
before forking (`acrey1-haule/Zodiac-race-acrey-for-tiktok-live`).

## 3. Landscape — how often each mechanic appears

Keyword census over the 364 non-excluded repos (name + description + topics). Categories overlap, counts are
approximate, and the sample is only what the queries above returned [API].

| mechanic | repos | web-tech | web with ≥1★ | pushed since 2026-10-10 | Livecade games | most-starred web repo |
|---|---|---|---|---|---|---|
| team battle / tug-of-war / vs / arena | 64 | 45 | 9 | 17 | 17 | ijalalfrz/tiktok-fight-live-game (6★, 2022) |
| quiz / trivia (A–D, math, flags) | 34 | 21 | 6 | 13 | 10 | workaipvlinh-byte/ai-la-trang-nguyen (4★, 15 forks) |
| word games (guess word, wordle) | 24 | 17 | 9 | 8 | 8 | workaipvlinh-byte/lop-hoc-chu (73★, 95 forks) |
| printer / name-and-avatar recognition toys | 30 | 20 | 10 | 12 | 4 | rhfbgfgfdg999999/3d-printer-live (240★, 122 forks) |
| social scene / life-sim (temple, wedding, classroom, fish tank) | 25 | 20 | 12 | 23 | 2 | workaipvlinh-byte/di-chua-online (58★, 81 forks) |
| race (marble, car, boat, animal, runner) | 25 | 17 | 5 | 8 | 13 | hub repos; single-game race repos are 0–1★ |
| snake / maze / arcade classics | 18 | 13 | 4 | 4 | 4 | Dyoniso/tiktok-breakout-game (12★, 2023) |
| boss raid / tower defence / zombie | 17 | 8 | 1 | 2 | 3 | — |
| plinko / physics drop | 13 | 10 | 2 | 3 | 3 | — |
| wheel / roulette / raffle | 13 | 8 | 2 | 2 | 1 | — |
| battle royale / last standing | 8 | 7 | 2 | 2 | 4 | — |
| territory / map painting | 8 | 3 | 1 | 3 | 6 | — |
| horse race specifically | 3 | 3 | 0 | 0 | 2 | — |
| king of the hill / throne | 3 | 1 | 0 | 2 | 2 | — |
| "pixel war", "country war", "PK" as a named game | 0–1 | 0 | 0 | 0 | — | — |

Shape of the field [API]: 270 of the 364 repos were created in 2026; 140 were pushed in the last 30 days; only 32
have five or more stars and 13 have twenty or more; 70 carry a licence. Stars do not separate good from bad here.

Regional scenes seen: Vietnamese (largest and most active: vertical shows with a Vietnamese TTS host, many
look-alikes of the temple and classroom games), Russian (3D races and arena fighters), Brazilian/Spanish (snake,
battle, printer), Indonesian (word games), Turkish (about 20 repos, all 0 stars: football-club fan battles such as
`lexkral31321/tiktok-stad-oyunu` and `omerabc2006-cpu/taraftar-arena-server`, wheel games, a tug-of-war
prototype) [API][FILE].

## 4. Profiles of the top repos

**workaipvlinh-byte/lop-hoc-chu** — MIT, 73★/95 forks, created 2026-11-04, 51 commits [API][GIT]. Grade A.
A 9:16 classroom: a TTS teacher reads a clue, scrambled letters appear, viewers type the word.
- Round: 20 questions in a fixed plan mixing six question types; question 20 scores double
  [FILE src/game/config.ts:61-74]. 20 s per question [config.ts:86]; closes 3 s after the fifth correct answer
  [config.ts:80-81]; with fewer than five active players it closes 8 s after the first correct answer
  [config.ts:88-90]. If nobody is right, one letter opens and 10 s are added [config.ts:110].
- Fairness: ranks by TikTok's `createTime` [FILE server.ts:260]; answers sent more than 0.5 s before the board
  appears do not count and do not cost the turn [config.ts:82-83].
- Scoring: top five get 10/7/5/3/3, everyone later gets 1 [config.ts:122-123]; streak bonus at 5, 12, 17 correct
  [config.ts:126-127].
- Presence on screen: 30 seats in four rows, bottom row left empty because it lies under TikTok's UI
  [config.ts:209-211]; idle viewers lose the seat to the most active waiting viewer [config.ts:15-17,197]; chat
  bubble above the head for 5 s, never showing answers [config.ts:104].
- Gifts: `hintGiftCoins: 0` — no in-game advantage, with the comment that TikTok forbids encouraging children to
  gift [config.ts:239-241]; the giver's character walks to the podium and the teacher thanks them [config.ts:103].
- Empty room: after 5 minutes without any event the next period re-asks old questions and saves new ones
  [config.ts:92-94]. No bots.
- Persistence: lifetime points → school grade 1–12 [config.ts:199-201], attendance streak milestones
  [config.ts:190].
- Operations: reconnect back-off 15 s doubling to 120 s [server.ts:173]; viewer count sampled per phase for a
  post-live report [server.ts:826-829].
- Deployment evidence: issue #1 from a user asking where to add their own questions; derivatives
  `tobi1008/lop-hoc-chu`, `nhatktb1/lop-hoc-gplx`, `mrt98dev/lop-hoc-tiktok`; config comments record changes
  decided "by the channel owner" on dated sessions, e.g. 45 seats tried and reverted [config.ts:210].

**workaipvlinh-byte/ai-la-trang-nguyen** — MIT, 4★/15 forks, created 2026-11-07 [API]. Grade B.
A/B/C/D quiz in four stages of five questions: 10/15/20/25 s and 100/200/300/500 maximum points
[FILE src/game/config.ts:31-34]; a correct answer at the buzzer still earns 50% [config.ts:37]; wrong answers lose
points and the last question is doubled [README]. Three regional teams by typing a region [README]. In the final
stage 200 hearts within one question remove two wrong options [config.ts:39]. The host never reads comments
verbatim [README]. Gifts give no advantage "per TikTok rules" [README.md:15].

**Livecade (65 README-only repos; hosted product, no source)** — Grade A as a product, all facts [README].
- Marble Race: any comment or a like joins; lobby 45 s (15–120), starts early when full; 24 marbles by default,
  up to 80; profile photo inside the marble, tag with place and name above each one; Rose boosts your own marble
  for 2.5 s, other gifts banana or shell the leader or shake the whole pack; a boost from a non-racer goes to the
  last-place marble in the giver's name; elimination rounds drop the last five each race; race length about
  40/60/90 s; every trigger rebindable; 13 languages including Turkish.
- Boys vs Girls: comment joins a side; likes nudge, gifts shove in three sizes, special gifts bank a round point
  outright; fill the bar to take the round, best of N; idle recentering.
- Trivia Time: one letter to vote, avatars appear as votes land, faster answers score more, vote counts hidden
  until the reveal, about 20 s per question, runs without a host, question read aloud, 24,000 questions.
- Million Quiz: the whole chat is one contestant on a 15-step ladder; gifts buy 50/50 and Skip.
- Horse Race / Nations Derby: horses are countries; gifts and likes push; "boosts only help", gentle catch-up;
  join once by typing a lane or country, later gifts all go to that side.
- Territory War: type a number, get a ball with your face that paints ground; castles cannot be captured.
- Take the Crown: viewers entering the live are queued automatically; a fight is HP subtraction; HP never resets.

**SantoSteffano/tiktok-live-race** — no licence, 0★, 10 commits on 2026-10-16 [API][GIT]. Grade B.
3D runner race rendered server-side. Lobby 22 s, results 12 s, 1500 m, at least 60 s, 16 racers, bots fill to 5
[FILE config.json:5-13]. Any comment joins [config.json:17]. Like ×1.15 for 1 s, follow ×2.2 for 5 s, share =
40 m jetpack [config.json:23-25]. Gifts by diamonds: ≥1 turbo, ≥10 jetpack 120 m, ≥30 lightning stops the leader
2.5 s, ≥100 "nuke" [config.json:34-39]; repeat capped at 10 [config.json:40]. Persistent "aura" points and titles
[config.json:42-56].

**doncabrone-lab/tiktok-race-game** — no licence, 0★, 73 commits [API][GIT]. Grade B.
Viewers type `!race` during a 15 s window to be one of nine jockeys [FILE server/gameEngine.ts:212]; random draw
when oversubscribed and a two-race cooldown [gameEngine.ts:628,1936]; then 30 s to `!pick 1-9`
[gameEngine.ts:550]. "`!pick` is the official command; `!bet` remains supported as a backwards-compatible alias"
[gameEngine.ts:2454-2458]. A pick pays +20/+10/+5 for first/second/third [gameEngine.ts:1175-1207]. Likes and
gifts boost the picked lane during the race only [gameEngine.ts:2638-2660,2832-2860].

**Chahmetski/live-loop-racers** — MIT, 0★, one commit 2026-10-31 [API][GIT]. Grade B.
Automatic 3D car races, simulation capacity 1,000, tests and soak test [README]. A follow creates the viewer's
car and it persists [FILE README_RU.md:75]; gift ladder at 1/5/30/199/500/1000/2988/5000 coins, each a distinct
effect [README_RU.md:38-47]; bots off by default.

**hamid49174/gift-wars** — MIT, 0★ [API]. Grade B. Comment = join as a circle with profile picture + 1 point;
3-minute round and 10 s winner screen [README]; gift repeat within 15 s builds a combo up to ×1.6
[FILE server/src/game/GameEngine.js:22-23]; tiers at 10/100/1000/5000 points [GameEngine.js:27-31].

**RafaelCorreaj/tiktok-battle** — README says MIT, no licence file, 0★ [API][FILE]. Grade B. Comments only:
180 s round, knockout when the hit gap reaches 8 [FILE server.js:21-22]; every matching comment counts, no
per-user limit [server.js:280-285].

**k0d1r/tiktok-live-interactive-game** — no licence, 11★/10 forks [API]. Grade B. Red vs blue towers: chat picks
a team and spawns a soldier, 1 damage per diamond, likes fill a shared bar that triggers 60 s power mode, 5-minute
match, sudden death ×5, like and gift batching [FILE server.js:16-35].

**duongtn811/english-live-quiz** — no licence, 1★ [API]. Grade B. 10 points + up to 10 speed bonus, once per
viewer per round [FILE server/game.js:312-313]; a gift reveals the next letter for everyone, one reveal per giver
per 2.5 s [game.js:341-355].

**alexdhg/tiktok-printer-live** — MIT, 89★/25 forks, 2022–2025 [API]. Grade A (six issues from different users
[ISSUE #1-#6]). Every chat, gift, like, follow and join line is "printed" with the name
[FILE public/assets/js/app.js:308-348], plus a word game with TTS.

**lean1835/tiktok-dog-battle** — no own licence, 0★ [API]. Grade B; the author says it has not yet been accepted
in a real LIVE session [README]. 2-minute match, 3-minute break, always bot-filled to 5v5, chat bubbles above
each dog, viewers hidden after 3 minutes idle, honours board that awards nothing, per-asset licence ledger.

## 5. Comparison with ours, mechanic by mechanic

Our facts are from the working tree: `overlays/bilye.html`, `bilgi.html`, `pk.html`, `at.html`, `_shared/ulti.js`.

### 5.1 Marble and type-to-join races
Ours: any chat message joins [bilye.html:971]; join window 25 s, up to 50 marbles, 7 s celebration, 8 stages
[bilye.html:129-132]; six named stage types [bilye.html:230]; a gift adds a flat forward impulse to your own
marble, stored if sent before the start [bilye.html:1001]; no like/follow/share handler; bots when fewer than
five join; only the leader is labelled on the track; personal race/win record in localStorage.

They do, we don't
- Profile picture on the racer and a name tag on every racer (Livecade [README]; `SantoSteffano` face/skin).
- Like, follow and share have an effect (`SantoSteffano` config.json:23-25; Livecade: a like joins).
- Value-tiered gifts with different effects, including hitting the leader (config.json:34-39; Livecade).
- Elimination rounds, 40–90 s races, smaller default field (Livecade 24, `SantoSteffano` 16).
- Lobby starts early when full; a non-racer's boost goes to last place (Livecade).

We do, they don't
- Crowd-size tiers that multiply everyone's XP [bilye.html `KADEMELER`].
- Bot count scaled so a lone viewer is not buried (others fill to a flat 5 or use none).
- Named stages announced by a commentator; rubber-band for stragglers; GPU-less quality fallback.
- Cross-game profile XP.

Worth trying
- Tag more than the leader: at least the top few and anyone who just chatted (Livecade marble-race README; idea
  only, no licence).
- Let a like join or give a brief nudge (config.json:23; idea only — repo has no licence).
- Reuse our existing diamond tiers for different marble effects instead of one flat impulse (config.json:34-39).
- An elimination "cup" every few races (Livecade README).

### 5.2 Quiz, trivia, word guessing
Ours: 25 s question, 9 s reveal, 60 likes remove one option, 40 questions per round [bilgi.html:159-166];
rank-normalized 100→50 across all correct answers with a streak multiplier [bilgi.html:302-316]; first answer
only [bilgi.html:462]; a gift multiplies your own score for that question up to ×3 [bilgi.html:497]; bots answer
in an empty room [bilgi.html:507].

They do, we don't
- Rank by TikTok's timestamp and ignore answers sent before the question is visible
  (`lop-hoc-chu` server.ts:260, config.ts:82-83; `ai-la-trang-nguyen` config.ts:45).
- Close early once enough people are right, and faster in a small room (`lop-hoc-chu` config.ts:80-81,88-90).
- A voiced host; the clock waits while the question is read (config.ts:252-254).
- Seats: answering puts your name at a desk, so dozens are visible, not only a top list (both Vietnamese games).
- Wrong answers cost points (`ai-la-trang-nguyen` README); teams inside the quiz; 20-question games ending on a
  double-score question (config.ts:61-74).
- Gifts with no advantage (config.ts:239-241), or a gift that helps the whole room (`english-live-quiz`
  game.js:341-355).
- Empty room = replay old questions (config.ts:92-94). Today/week/all-time boards (`emoji-quiz` game.js:20).

We do, they don't
- Scoring that keeps separating players beyond the top five (theirs flattens to 1 point or decays by time only).
- Likes as a shared hint on every question (the nearest is 200 hearts in the final stage only).
- A gift as a private score multiplier.
- Bots answering in an empty room.

Worth trying
- Pass `createTime` through the bridge and rank by it (`lop-hoc-chu` server.ts:260 — MIT).
- Early close: 3 s after the fifth correct, 8 s after the first in a small room (config.ts:80-90 — MIT).
- 20-question rounds with a double-score finale (config.ts:61-74 — MIT).
- Daily and weekly boards beside the all-time one (`sonlamdev/emoji-quiz-tiktok-live` public/game.js:20,285 — MIT).
- Per-game viewer-count sampling for a post-stream report (`lop-hoc-chu` server.ts:826-829 — MIT).

### 5.3 Team battle, tug-of-war
Ours: 180 s round, last 30 s "speed", 10 s celebration; message +1, like 0.12 [pk.html:143-148]; side chosen by
typing its name [pk.html:390]; a gift multiplies the sender's team messages for 15 s (×1.35–×2.75 by diamond tier)
plus an instant push capped at 15% of the total [pk.html:437-460]; no per-user message limit [pk.html:272-279];
30 debate topics; bots leave when a real viewer picks a side.

They do, we don't
- Knockout: the round ends when one side reaches the edge (`RafaelCorreaj` server.js:22; Livecade), then best of N
  with recentering and idle drift back to centre (Livecade Boys vs Girls [README]).
- Gift bound to a side, so a gift is itself the vote (`carlotata` duck race README; `alex54210` README; Turkish
  club battles `omerabc2006-cpu` server.mjs:175-202).
- Viewers sit on their team with avatar and name (`dua-ghe-ngo` index.html:659-675; `gift-wars`).
- Per-event caps and per-user pacing (`dua-ghe-ngo` index.html:1268 caps a like burst at 50; `lop-hoc-chu`
  config.ts:202-203 counts one comment per 2 s).
- Sudden death on a close finish (`k0d1r` server.js:32); clamp on a single gift (`dua-ghe-ngo` index.html:1275).

We do, they don't
- Debate topics as sides; everyone else uses boys/girls, colours, countries or clubs.
- The gift as a time-boxed multiplier of the team's chat, and the 15% cap on the instant push.
- A final "speed" phase.

Worth trying
- Knockout plus best-of-three inside the same three minutes (`RafaelCorreaj` server.js:22; idea, no licence file).
- One comment per viewer per second or two counts (`lop-hoc-chu` config.ts:202-203 — MIT).
- A football-club topic pack for a Turkish room (`lexkral31321/tiktok-stad-oyunu` teams.js; idea only).

### 5.4 Horse race, betting, predictions
Ours: eight fixed horses with persistent names and results [at.html:187-196]; 25 s betting, 20 s race, 10 s
celebration [at.html:181-183]; pool odds clamped 1.2–15 [at.html:295-303]; chat and likes during the race are
capped cheering [at.html:645,690]; a gift multiplies the stake up to ×5 before the race [at.html:697-704].

They do, we don't
- The crowd moves the horse directly; outcome is effort, not chance (`ElProfessor-spain` README; Livecade Horse
  Race and Nations Derby [README]).
- Viewers ride: nine viewer jockeys with rotation fairness (`doncabrone-lab` gameEngine.ts:212,628,1936).
- Fixed points for first, second and third, and picks stay open during the race (gameEngine.ts:1175-1207,2456-2465).
- Horses are countries or teams, not house horses (Livecade; `carlotata`).
- "Pick" wording instead of "bet" (gameEngine.ts:2454).

We do, they don't
- Pool odds that reward going against the crowd — not found anywhere else.
- A persistent stable with history and form.
- A gift that multiplies a stake on a chance outcome.

Worth trying
- Say "pick/tahmin" instead of "bahis", and pay second and third place too (gameEngine.ts:1175-1207; idea only).
- Move the gift from "multiply my stake" to a visible, bounded cheer effect (Livecade Nations Derby README).

### 5.5 Other mechanics (we have unrotated overlays for several)
- King of the hill — ours `tepe.html`: messages step toward the throne, a gift pushes the rival ahead back.
  `CarlJohnCarrascal/TiktokLive-King-Of-Hill`: gift-only, HP = coins, leftover damage carries over [README].
  Livecade Take the Crown: everyone entering the live is queued automatically; HP never resets [README].
- Plinko — ours `plinko.html`: every comment drops a ball. `MatiasJMB/plinko-live` (MIT): only gifts drop
  marbles; tiers at 1/5/100/500/5000 diamonds [FILE src/giftMap.js:8-40, README].
- Territory — ours `bolge.html`. Livecade Territory War: your ball carries your face; nobody is knocked out.
- Recognition toys and social scenes — the most-starred and most-forked web genres this month; we have neither.

## 6. Convergence check across the 59 cloned code repos

Regex presence test over source files (mentions, not behaviour) [FILE `not/yakinsama.json`]:
avatar field used 33 · like handler 33 · bots/simulator/demo 36 · diamond value used 29 · persistence 28 ·
portrait/9:16 mentioned 26 (18 only portrait, 1 only landscape, 8 both) · cooldown or rate limit 21 ·
follow handler 20 · share handler 17 · TTS 16 · `createTime` 4.
Connection: tiktok-live-connector 44 · tik.tools 4 · Python TikTokLive 2 · TikFinity 1 · none/mock about 8.

## 7. Ideas worth taking (ranked)

| # | idea | source | licence |
|---|---|---|---|
| 1 | Rank trivia answers by TikTok `createTime`; ignore answers sent before the options appear | lop-hoc-chu `server.ts:260`, `src/game/config.ts:82-83` | MIT |
| 2 | Close a question early: 3 s after the 5th correct; 8 s after the 1st when under 5 active | lop-hoc-chu `config.ts:80-90` | MIT |
| 3 | 20-question rounds with a double-score last question | lop-hoc-chu `config.ts:61-74`; ai-la-trang-nguyen `config.ts:31-34` | MIT |
| 4 | Name tag on every marble (or top N + recent chatters); avatar where available | Livecade marble-race README | none — idea only |
| 5 | Horse race: "pick" wording, place payouts, picks open during the race; drop gift × stake | doncabrone-lab `server/gameEngine.ts:1175-1207,2454-2465` | none — idea only |
| 6 | Tug-of-war knockout and best-of-N within the round; sudden death on a tie | RafaelCorreaj `server.js:22`; k0d1r `server.js:32`; Livecade README | none — idea only |
| 7 | Like/follow/share effects in the marble race; tiered gift effects | SantoSteffano `config.json:23-39` | none — idea only |
| 8 | Sample viewer count per game phase; report which game loses viewers | lop-hoc-chu `server.ts:826-829` | MIT |
| 9 | Today / week / all-time boards | sonlamdev/emoji-quiz `public/game.js:20,285` | MIT |
| 10 | Gift value = diamonds × repeat, counted once at streak end | MatiasJMB/plinko-live `src/giftMap.js:4-6`; alex54210 `server.mjs:48-51` | MIT / none |
| 11 | A vertical 9:16 layout with the lower part left free | Clempiq README; philkraft1 README; lop-hoc-chu `config.ts:209` | idea only |
| 12 | Read one peer's rule audit before promoting "open and forget" | Lehaneploxo `ПРАВИЛА_TIKTOK.md:42-111` | none — read only |

## 8. Could not verify

- Behaviour: nothing was run. All claims come from reading code, config and READMEs.
- Real use: no release download counts, no observation of live channels. Grades rest on forks, issues, commit
  history and files in the repo.
- TikTok policy: the official LIVE monetization page returned no readable text. The policy points are from one
  peer's notes dated 2026-10-12 [FILE] and from secondary sources found by web search [WEB]
  (streamer.guide/guides/tiktok-live-rules, sirency.com/blog/tiktok-live-not-eligible-for-recommendation,
  newsroom.tiktok.com/tiktoklive). No source confirmed wording about "gambling-like" LIVE games.
- Livecade: vendor claims only; there is no source code and the site was not visited.
- `lop-hoc-chu`'s "13,000 people" load figure is a README claim.
- Frequency numbers come from about 50 keyword queries and keyword classification; games not described with
  the word "tiktok" are invisible to this census.
- Not read beyond triage: `di-chua-online`, `ho-ca-live`, `cuoi-lien-tay`, `broneotodak/tiktokgame`, the code of
  `Pauluwu18/guerra-live-tiktok`, `TochdownBoy/tiktok-tower-defense`, `CarlJohnCarrascal/TiktokLive-King-Of-Hill`.
- Two READMEs state MIT without a licence file (`RafaelCorreaj/tiktok-battle`, `Pauluwu18/guerra-live-tiktok`).

## 9. Handoffs (seen, not analyzed)

**s1a-merkezler** — `Lehaneploxo/donation-race` (nine-game hub, Postgres, allow-list of streamer accounts, 838
commits); `broneotodak/tiktokgame` (3D marathon + five more games); `vamnguyen/tiktok-live-games` (75★, hosted);
`duycuf/tiktok-live-kit` (21★/32 forks kit); `ntanh23112005/tiktok-live-template`;
`hpmediaoffifical/h-p-t-i-k-t-o-k---g-a-m-e` and `baotran113a-dev/hp-game-shop`; `obulut05/tiktok-live-games`
(Turkish platform); `Jaisartuyk/LiveGames-SaaS`; `zahrun5/tts-live-v2`; `dazevedodev/lives-tiktok`;
`Esnutbear/chispalive`; `Server173/tiktok-live-studio-hub`; `ThangBaymau123/tiktok-live-overlay`;
`LARSENZA/game-night-live`; `yanjigb/auto-game-live-tiktok-template`.

**s2-motorlar** — `rhfbgfgfdg999999/3d-printer-live` (240★/122 forks, Douyin/Kuaishou/TikTok avatar printer) and
`TravenCode/3d-printer-live-x`; `landsbetween/tiktok-marble-race` (Godot 4 marble race) and
`landsbetween/tiktok-snake-live`; `adrian13508/Tiktok_Live_Game` (64★ Pygame); Unity: `tuncayl/spinwhell`,
`Nargor/car-action`, `absravdev/tiktok-live-arena`, `HarunUcan/Tiktok-Live-Fan-Slap-Game`,
`thanhduc270998/livestream-tiktok-game`, `MinhThuan0709/tiktok-quan-tra-da-via-he`; Minecraft:
`GospelBG/ChatPointsTTV`, `qixils/minecraft-crowdcontrol`; `Lorrn-ro/TikTok-LIVE-Tug-of-War` (Lua);
`karmontal/TiktokLiveInteractiveGames` (Godot); `cristopher-catalan/TROMPOS` (LÖVE); `egunde/tiktok-pvz`.

**s3-urunlesme** — the `livecade` org (65 marketing repos pointing to livecade.io, rebindable triggers, 13
languages including Turkish); `isaackogan/TikTokLivePrinter` ("Purchasable"); `Papouth/TikTok-Live-Diamond-Heist`
("need to buy a licence"); `appvidlab/*`; `faisalrasheed442/playzy-public`; `soykoru/koru-juegos`;
`brofinity/brofinity`; `battles-app/battles.app`; `newakungchgamer-maker/SwimLive`; `cemo702/FreeTiktokTTS`;
`RyanLowk/algoliveagency.`; the avatar-printer author's paid customization offer (600–1800 RMB) [README]; a product
called "Tream" named as a comment-race reference in `dua-ghe-ngo` [FILE index.html:555].

**s4-baglanti** — `piratetok-live-js` (npm 0.3.0, 0BSD, first published 2026-04-04, 7 versions [NPM]) used as a
no-EulerStream connector by `kadirkrga25/tiktok-live-cark-oyunu` and `omerabc2006-cpu/taraftar-arena-server`
[FILE]; `tiktok-live-connector-legacy` as a dependency in the former; `Chahmetski/live-loop-racers` vendors a
"ttl-live" transport and says no paid key is needed [FILE server/vendor/ttl-live, README_RU.md:71]; tik.tools /
`@tiktool/live` in `doncabrone-lab`, `TochdownBoy`, `ElProfessor-spain`, `aminmaskur88`; `tiktool/tiktok-live-api`
(54★); `Lehaneploxo` patches tiktok-live-connector in a postinstall script [FILE package.json];
`lop-hoc-chu` (`lvh.me`) and `emoji-quiz` (`localtest.me`) use the same LIVE Studio hostname workaround as ours,
while `philkraft1/wheel-of-fortune` gives up on the Link source and captures a window [README].
