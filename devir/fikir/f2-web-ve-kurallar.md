# F2 report: interactive TikTok LIVE game formats and rules (research date 2026-11-11)

Method: web search plus page fetches, generic queries only. Almost all format evidence comes from vendors that sell games, so it is marketing, not measured audience data. Nothing here is an independent retention study. No page was downloaded or run.

## 1. Formats table
"Fit" = fit with our rules (no betting, gifts never decide winners, chat text never shown, names and avatars large).

| Format | Viewer verb | Why it holds attention | Evidence | Fit |
|---|---|---|---|---|
| Tug-of-war climb / distance run | gift or like pushes forward, other action pulls back | one state readable "in one glance", forward-and-back tension | scrollplay.live/guides/tiktok-live-game-ideas (calls it "most-streamed format on ScrollPlay", vendor claim) | Risky: gifts decide outcome. Adapt: likes/follows/shares move it, gifts only add a flourish |
| Country / team race (red vs blue) | join a side by comment, then push own runner | tribal identity, comeback always possible | same page; corelive-labs.itch.io/country-race-interactive-tiktok-game; cellphones.com.vn (VN) lists flag guessing and racing | Good if sides are chosen free (comment/like), gifts only spotlight. Turkish city/team sides fit well |
| Two captains / PK-style battle | support one side | rivalry | tik.tools/tr/use-cases (event type `battle`); Turkish blogs claim PK is a big gift driver (unverified, "58%" and "+300%" figures could not be traced) | Streamer already dropped a two-team PK ("nobody plays"). Low priority |
| Viewers are the players (avatars as cars/characters) | gift/follow/comment enters you as an avatar | you see yourself on screen | scrollplay Bumper Brawl (last-one-standing royale) | Avatars good; elimination royale was rejected by streamer. Use non-eliminating variant |
| Beat the bomb / shared countdown | add or burn seconds, rescue at zero | shared deadline, ends in bang, clip-worthy | scrollplay DEFUSE! | Strong fit, close to Düdüklü. Use likes, not gifts, for seconds |
| Stack and merge | volume builds a stack, big moment blows it | calm background game, chat can talk over it | scrollplay Jello Merge | Good for talk-over streams |
| Survive the count | gifts summon attackers vs a rising number | simple, funny hits | scrollplay Classroom Doodle | Medium |
| Money count / gift reveal | gift shows payout counted | viewers see what they sent | scrollplay "money shot" | Weak: gift-centred, near gift-baiting |
| One-button runner | chat decides float or knock back | "understood in two seconds" | scrollplay Flap Dash | Good learning curve |
| Spin wheel / case opening / gift bingo | gift spins, opens, claims tile | suspense reveal | scrollplay | AVOID: gift-to-spin is paying for a chance. See policy 4.1 |
| Chat-command games (chat triggers events, gifts drop items) | comment command, gift drops items | direct control | tik.tools/tr/use-cases; screenapp.io/blog/how-to-play-interactive-games-tiktok-live | Good: comments as triggers matches our design |
| Official drawing mini-game | host draws, viewers guess | classic guess-the-word | shiftdelete.net/tiktok-oyun-isine-giriyor (2022 report of TikTok testing it; status in 2026 not verified) | Ties to quiz the streamer removed; low |
| Plinko / pick-a-room (itch.io) | gift drops a ball | randomness | itch.io tiktok-live tag pages (vendor pages) | AVOID: chance + gift |

Scene facts: Devign lists 18 public-beta games for 2026 at $4.99/month (devignlb.com/work/live-games.html); all react to gifts, likes, comments, follows, shares. Market claim: TikTok LIVE about half of live viewership, ~17 billion hours in Q1 2026 (gaming.devignlb.com/news/live-streaming-market-q1-2026, citing Stream Hatchet; secondary). Vendor pages are mostly gift-driven. I found no vendor evidence that "collective build until it pops" formats outperform; that is our hypothesis.

Vietnamese scene: cellphones.com.vn/sforum/top-game-tuong-tac-hot-nhat-tiktok lists monster-escape, flag guess, item catching, racing, footballer-name guess. Not obviously ahead of the vendor scene above. Indonesian: not found.

## 2. Turkish-specific findings
Verified (secondary news of the TikTok/Kearney report, paradergi.com.tr 2025-11-14; habertürk, nefes):
- Turkey live market about $1.6B (2024) to $5B by 2030 (Kearney/TikTok report).
- About 10.2M weekly live viewers, 16% usage, 13 min/day of live per social user, peak about 21:00, 72% aged 18-34.
- Gaming is big but music, chat, sports, education are growing; "chat-based and non-gaming streams are growing", two-way interaction named as key trend.
Not found: any Turkish article naming specific game formats, rituals or themes in LIVE. Turkish search results were SEO blogs on earning/gifts (biroku.com.tr, analyzertr.com) with unverified numbers.
Inference (not verified): peak 21:00 and 18-34 age suggest evening, social, banter-friendly sessions; halay, düdüklü, horse-race forecasts already tap local ritual (wedding dance, kitchen, hippodrome). Other Turkish rituals we could draw on: çay/kahve falı, tavla/okey, "kim kimi" matchmaking banter, city-pride rivalry (plate codes), football club loyalty. These are ideas, not evidence.

## 3. First seconds and retention
All third-party, mostly short-video advice; weak for LIVE.
- Hook in first 0.5-3 seconds, repeat a refreshed hook every 10-15 minutes for newcomers (dropified.com LIVE hook scripts; streamscharts.com TikTok LIVE 2026 guide).
- LIVE ranking reportedly favours retention ("durable attention", viewers staying 30+ s) and interaction over raw gifts; TikTok has not published weights (ttcalculator.net, streamscharts; unverified).
- Reply to 10+ comments; 30-60 min sessions (unverified).
- Format-level: pick games understood in one glance; keep motion between gifts; short rounds ending in a bang for clips (scrollplay.live).
Inference for us: first action must cost one tap (like) or one short word; show the viewer's own name/avatar within seconds of that action (instant reward); show the goal bar and what to do as a 1-line on-screen label, since chat text is never shown; rounds of 60-120 s with a visible finish; stack newcomer-friendly "join now" cue each round start.

## 4. Policy constraints
| # | Rule | Text / source | From TikTok's own page? |
|---|---|---|---|
| 4.1 | Gambling-like: paying for a chance | Gambling.com/covers.com: TikTok defines gambling-like as paying for a chance to win something of value; Shop rules prohibit "lotteries, raffles, wagers, lucky draws, and prize wheels"; LIVE giveaways may not use "games of chance such as spin wheels or lucky draws" (covers.com/industry/tiktok-reaffirms-ban-on-gambling-sweepstakes-promotions-nov-6-2026, updated 2026-11-06, reporting TikTok Shop Seller Academy). Streamer guide: "Promoting betting sites, showing slot play, running raffles or hosting games of chance are prohibited on LIVE" (streamer.guide/guides/tiktok-live-rules) | No. TikTok's regulated-goods guideline URL returned 404 to my fetch |
| 4.2 | Gift pressure | TikTok Integrity guideline (via fetch of tiktok.com/community-guidelines/en/integrity-authenticity): "Content that pressures people into gifting or inflating likes or follows is ineligible for the For You feed." Streamer guide: asking for gifts is allowed; conditioning content on gifts like a transaction is the problem | Partly yes (the sentence is from TikTok's page via a summarising fetch tool, not a verbatim read by me) |
| 4.3 | Low-quality / static / unattended LIVE | Streamer guide: blank screen, static image, sleeping streamer, looping video classed as low-quality; "TikTok wants a live human interacting"; ghost streams are violations. TikTok's own page: not found | No |
| 4.4 | Automation | TikTok integrity page (fetch summary): "strictly prohibit[s] automation tools, scripts, or other tricks designed to bypass our systems." This targets evasion, not on-screen game software; streamer guide says third-party chat bots are violations if they break rules. Our app is an overlay running in the streamer's presence; a game that runs unattended while the streamer is absent is the risk | Partly yes |
| 4.5 | AI-generated content | TikTok integrity page (summary): creators must label AI-generated or significantly edited realistic content; unlabeled may be removed or restricted. Relevant to realistic human 3D characters and avatar face swaps (profile photo on a character face). Stylised 3D probably not "realistic", unverified | Partly yes |
| 4.6 | Minors / age | TikTok accounts-features page (fetched): "You must be 18 and older to go LIVE and to send gifts to a creator during a LIVE session." Other sources say host 18, some say 16 for going live; the page I fetched says 18. Viewers under 18 can still watch and use likes/comments, so profile pictures of minors may appear: treat as a privacy risk (inference) | Yes (accounts-features) |
| 4.7 | Names and profile pictures on screen | No TikTok rule found. Names/avatars arrive via the LIVE event feed and are public. Inference: showing them is common in vendor games (scrollplay Bumper Brawl uses profile pictures). Risk: offensive nicknames or avatars appearing large; add a filter and a streamer kill switch. Could not verify TikTok rule or Turkish KVKK stance | No |
| 4.8 | Off-platform links penalised | streamscharts guide, unverified | No |
| 4.9 | Pretending/restream | Accounts page: "Pretending to be someone else or streaming someone else's content without permission may also lead to restrictions" | Yes |
| 4.10 | Game-content share for Streamlabs users | Turkish news: Streamlabs users with under 50% game content may lose LIVE access from 2025-07-07 (webtekno.com Streamlabs article). Applies to Streamlabs, not our app, unverified | No |
Direct checks failed: tiktok.com/community-guidelines/en/live and /regulated-goods-commercial-activities returned 404; support.tiktok.com LIVE Gifts policy not reached; Virtual Items policy only as third-party mirror. Recommend the streamer read TikTok's LIVE and Virtual Items pages in the app.

## 5. Eight format ideas we do not have (ranked)
1. Ortak Kazan Kapak Sayacı / "Kaynayan Çay Semaveri": a shared countdown where likes stoke a samovar and chat words (join, "hazır") move a named viewer to pour tea. Adds a cooperative deadline and viewer-to-viewer toast ("X ikram etti Y'ye"). Like-powered, gifts only trigger a spotlight. Close to Düdüklü but with giving between viewers.
2. Şehir Çekişmesi (plate-code tug of war): viewers join their city by typing the plate number once; likes pull a shared rope bar; round ends in a bang and the top 3 voters' avatars shown large. Local pride is free, no gift decides. Replaces the removed PK with identity-based sides.
3. Tavla/Zar Gece Turnuvası (free forecast): no betting; viewers like-vote which side of a rolling-dice duel between two avatars; correct forecasters' names rise on a board. Extends horse-race forecast pattern.
4. Büyük Düğün Pastası / Gelin Arabası: everybody adds a layer (like = a layer, share = a candle) until a tower tips or a finale pop; names engraved on layers. Collective build, clip-worthy collapse. Streamer-liked shape.
5. Kim Kime Ekmek? (pass-the-parcel): the object hops between spotlighted viewers by comment "ver"; holder avatar large; timer pops it. Pure viewer-to-viewer, uses comment as trigger only.
6. Havuz Dolduran (fill the bucket): likes fill a bar, follows add a bonus drop; each fill unlocks a character costume change (human 3D). Simple state, repeats every 90 s for newcomers.
7. Mahalle Maçı penalty chain: one shared keeper; each like is a shot attempt by the nearest team avatar; shares unlock a "super save"; no elimination. Football is a safe Turkish theme.
8. Çay Falı (reveal): the first like of a round draws a fortune slip for the viewer whose avatar appears on a cup; pure entertainment, no prize, no chance-for-payment since entry is a free like. Check against gambling rule: keep fixed texts, no value won.

## 6. Searched for and not found
- Any measured audience data on which format earns retention (only vendor claims).
- Turkish-language articles on Turkish-specific game formats or rituals.
- TikTok's own LIVE policy text on unattended/static streams, gift solicitation, games of chance in LIVE (404s or not indexed).
- Indonesian scene; Vietnamese scene gave only a list article.
- TikTok rule on showing viewer names/avatars in overlay games.
- Whether TikTok restricts third-party games by name; only an itch.io forum comment worried about gift bans.
