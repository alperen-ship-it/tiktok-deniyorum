# F1 - Game patterns other TikTok LIVE builders ship, and what to add

Scout F1, read-only, 2026-11-11. Sources: s1a/s1b/s2/s3 reports, `_livecade.txt` (65 entries), `_hp-games.json`
(8 entries), the streamer's examples (2 videos, 2 X posts). Nothing was run. All "traction" below is GitHub stars,
forks, dates and vendor claims from those reports; none of it is measured viewer play time. Names of other
people's games are used only to cite where a pattern was seen; our games must be original.

## 1. Taxonomy of patterns

Counts: Livecade (L, 65 entries, all hosted by one vendor, 0-3 stars each, so these show what one vendor judged
worth building, not what viewers like) and HP studio (H, 8 entries, a paid Vietnamese shop; one is an editing app,
so 7 games). The s1b keyword census over 364 repos is a third column (C, approximate, overlapping).

| # | Pattern | L | H | C | Viewer verb | Round ends | Gift | Social type |
|---|---|---|---|---|---|---|---|---|
| P1 | Word / image guessing (hidden word, flag, logo, place, drawing, crossword) | 13 | 1 | 24 words | type the answer | first/Nth correct, or timer | hint reveal or score boost | competitive (race to answer), mild collective |
| P2 | Trivia / vote quiz (letter vote, math, memory, true-false, would-you-rather) | 7 | 0 | 34 quiz | type A-D, a number | timer, reveal | helps (50/50) or none | competitive; "would you rather" is a split vote |
| P3 | Chat vs the streamer / one character (push a boulder, climb stairs, build, slice, save the duck) | 13 | 0 | in 17 boss | type to help, or hinder; likes push | character succeeds or fails; target reached | bigger obstacle or help | collective against a script; helpers vs saboteurs |
| P4 | Team tug of war / two-camp battle (1 vs 2, boys vs girls, two heroes, spawn units) | 5 | 1 | 64 team | type side or 1/2, then spam | bar hits edge, 180 s, best of N | gift = push, unit, skill | competitive team (the field's most common pattern) |
| P5 | Individual elimination arena (blob, tanks, duels, king of the hill, monsters) | 7 | 0 | 8 BR + 3 hill | join by any comment | last one standing | boost or hit rival | competitive; one viewer slaps another (only viewer-to-viewer one) |
| P6 | Race with your own avatar (marble, runner, car) | 4 | 0 | 25 race | any comment/like joins; gifts boost | finish line, elimination heats | boost self, sabotage leader | competitive, passive after joining |
| P7 | Country / team race (horse, boat; crowd pushes a flag) | 3 | 0 | 3 horse | type a country or lane | finish line | push that side | competitive by proxy |
| P8 | Recognition printer (name, face printed on card / coin / diary / photo roast / fortune) | 6 | 0 | 30 printer | any chat, gift, follow appears | none (continuous) | bigger / faster print, queue jump | none; acknowledgment only |
| P9 | Social scene with presence (cloud disco, wedding, bar toast, fishing pond, temple, classroom) | 2 dance | 3 (fishing, wedding, bar) | 25 scene | appear by any comment/gift; "123 cheers", dance, fish | usually none, or a scripted ceremony | cosmetic buff, role, camera zoom on you | viewer-to-viewer and collective, no loser |
| P10 | Territory / horde (paint a map, horde climbs a hill) | 2 | 0 | 8 | type a number | time up | big capture | team/faction |
| P11 | Collective add-to-object until it pops (rubber bands on a melon, build a tower, 3D printer, pyramid) | 1 melon + 1 tower-stack (in P3) | 0 | in "co-op building" | type or like to add one unit | object pops / completes | bigger unit | collective; top contributor named |
| P12 | Hometown / name call-out map (type province, map flies there, gift read aloud with hometown) | 0 | 1 | - | type a place | 2-minute round, top place named | named announcement, queue jump | soft rivalry, collective |
| P13 | Coordinate / co-op hunt (battleship by typing C5) | 0 | 1 | - | type a coordinate | fleet sunk | big weapon | collective vs script |
| P14 | Queue for a throne or stage turn (take the crown, next wedding) | 1 | 1 | 3 hill | enter / queue | each turn timed | queue jump | viewer-to-viewer by turns |
| P15 | Luck machines (wheel, plinko, coin pusher, spinwheel) | 0 | 0 | 13 plinko + 13 wheel | gift or "me" enters | spin result | the only input | chance, gift decides |
| P16 | Tools, not games (AI host answers chat, clip trigger board) | 2 | 1 (editor) | - | ask / trigger | - | trigger | n/a |

Totals: Livecade split P1 13, P2 7, P3 13, P4 5, P5 6, P6 4, P7 3, P8 6, P9 2, P10 2, P11 1, P14 1 (Take the Crown),
P16 2 = 65. In the table P5 shows 7 because Take the Crown is listed in both P5 and P14. The P11 row's "1 melon" is
this P11 entry; tower-stack is counted in P3. HP (7 games): P1 1, P4 1, P9 3 (fishing, wedding, bar), P12 1, P13 1;
the wedding's "next wedding" queue also shows P14.

Traction signals by pattern (stars / forks are GitHub, dates 2026 unless noted):
- P9 social scenes: strongest signal found. temple scene 230 stars / 351 forks in nine days; 3D temple hall 58 / 81;
  another clone 2 / 257 forks; "cloud disco" bar 126 / 141 with eight re-uploads; a classroom 73 / 95 in five days;
  repeated across builders (25 repos, 20 web, 12 with a star, 23 pushed in the last 30 days). The HP shop sells
  fishing (169k VND/month), wedding (up to 798k lifetime) and bar scenes: the paid product mix is also social.
  The Vietnamese wave also drew a police warning (see section 4).
- P8 recognition printers: 240 stars / 122 forks (2022-2025, three platforms), 89 and 54 stars; six separate issues
  from different users. Oldest, steadiest genre.
- P1 word games: 73 stars via the classroom (a mix of word, math, English; a third-party user issue and renamed
  derivatives). Many entries (24 repos), mostly 0 stars.
- P4 team battles: most repos (64) but best web repo is 6 stars (2022). Many builders, little traction. Douyin's own
  rules template uses it as the example, so it is the platform's official default.
- P6 races: 25 repos, best single-game repos 0-1 stars; 13 L entries. One 64-star Pygame game.
- P3 chat vs one character: 13 L entries; a 20-star open-source one ("sabotage the streamer", obstacle size follows
  gift size). Seen across Chinese, Brazilian and Russian builders; the TV-smack example from the streamer is this
  pattern.
- P11 collective add-until-pop: one L entry, but the streamer's own example video is the same idea (chef, giant
  melon, "60 rubber bands" per round, top contributor named in a chip). Seen by the streamer on a real stream.
  Related builders: tower-stack, pyramid, printer queue. Small count, but it is what the streamer likes.
- P12/P13/P14: one HP entry each; no stars visible (paid products, no public repo). Weak evidence.
- P15 luck machines: 26 repos, 0-2 stars on web; flagged as high policy risk by one peer's audit.

Example videos / posts from the streamer, mapped: (a) looped stone track with yellow balls carrying HP numbers
and a base in the middle (a lane/track defense: creatures walk a loop, viewers spawn or hit; closest to P4/P5 with
a P3 flavour); (b) chef and melon with rubber bands = P11; (c) virtual zikir circle with chains, coşku bar, chat
words as triggers, avatars sitting in a ring, an "invite" tag = P9 (and related to our Halay); (d) TV smack =
P3/P9: a gift sends the character to hit the TV, picture clears, goal.

## 2. Mapping to the removed games and to the streamer's likes

Resemble the removed games:
- Marble race: P6 (4 L), P7 (3 L): the viewer joins, then watches a race with no further verb. With 2-50 chatters
  the field is mostly bots, and the viewer's only action after joining is a gift or like.
- Quiz: P1 + P2 (20 L entries, the biggest single cluster). Only the fastest correct typist feels included; the
  rest of a small room never gets named on screen. It also asks the viewer to read, while our screens never show
  chat text.
- Two-team PK: P4 (5 L, 64 repos): needs two sides with enough people each, rewards spam and gifts, and a small room
  is always lopsided. Battle royale (rejected earlier): P5 (7 L): losers are eliminated and leave.

Resemble what the streamer likes:
- Viewer-to-viewer: P9 (cheers, dance, wedding roles), P14 (queue for a turn), the slap-off-the-pier game in P5,
  the "invite to dance" mechanic in our own Halay.
- Collective add-to-one-object-until-it-pops: P11 (melon, tower, printer queue), P3 (all chat pushes one boulder or
  character).

What this implies:
1. The patterns the field builds most (P1, P2, P4, P5, P6, P7: about 40 of 65 Livecade entries) are the patterns the
   streamer rejected. Frequency of building is not evidence of viewing; the traction found (stars/forks) sits with P9
   social scenes and P8 recognition, not with competition.
2. The rejected games share a failure shape: one winner, many losers, a mostly passive middle. The liked games share
   the opposite: every actor appears on screen and nobody is eliminated.
3. Our rules (names and faces large, text never shown, no betting) fit P8, P9, P11, P14 naturally, so new games
   should be "everyone appears, everyone contributes, there is a shared goal, a few people are spotlighted".
4. Competition can still exist, but as soft rivalry (provinces, "which side is bigger") and never as the only reason to play.

## 3. Ten patterns most worth considering (we do not have them), ranked

Ranking logic: fit to what the streamer likes first, then works with 2 viewers plus bots, then fit to 3D humans,
face-on-head and auto camera, then traction evidence. All gifts only trigger a spotlight (name read, face shown,
camera zoom); no outcome depends on them.

1. **Pas zinciri (pass the item).** A glowing item (ball, lantern, tray) sits with one spotlighted viewer. A holder
   passes it on with "@name" or a number before a fuse runs out; each successful pass adds to a shared chain
   counter and the item gets bigger or faster, a miss resets only the chain, nobody is eliminated. The next
   holder is shown large with a face on the character's head. Seen as: hot-potato/pass-the-parcel (not in the
   catalogue directly; closest are slap-arena and queue games), so evidence is weak, but it is exactly the
   "invite someone to dance" verb. Works with 2 viewers plus bots (bots pass to each other and to the real ones), and
   with 300 (many parallel chains in one big circle). Camera: auto zoom to each receiver, a short tracking shot as
   the item flies; human characters can catch, juggle, trip comically on a miss.
2. **Sahne sırası (queue for the stage).** Viewers type one word to join a queue; each gets a timed turn (8-12 s) as
   the on-stage character wearing their face; the audience's likes or triggers raise a shared "alkış" bar during
   each turn. Round ends when the queue is empty or a time cap. Genre: throne/queue and "next wedding" (2 builders).
   Gift moves your name to a spotlight turn, never changes a score. Perfect for the incoming spotlighted-face
   feature; one viewer is enough to run it, bots fill the line; with 300 people show a "sırada 12 kişi" ribbon of
   faces. Camera: zoom in on the performer, wide shot during applause.
3. **81 il yoklama (home-town call-out).** A relief map of Turkey (or a 3D country diorama); a viewer types a plate
   number or province name; the camera flies there, a character plants a flag with the viewer's face and name, and
   the province's counter rises. Round ends at a timer with the top province named and the top contributor's face
   shown. Genre: hometown call-out map (HP catalogue, plus Livecade country races). Typed text is never shown, only
   turned into a flag, which keeps our rule. Rivalry is soft (pride, not sides). Works for 2 viewers (still fun: it
   reads two names and places) and for 300. Camera zoom is the entire payoff. Add a short folk-dress or local snack
   gag per province for 3D characters.
4. **Ortak yapı (build together).** Every viewer adds one block, tile, layer or decoration, each stamped with a face;
   a human builder character stacks them; the object (cake, tower, bridge, düğün pastası) completes at a goal height
   or breaks into a celebration. Genre: co-op building/queue (tower-stack, pyramid, printer queue; 240-star printer
   as indirect evidence). Close cousin of Düdüklü, so make the difference "grows up and gets finished" not "pops",
   and give it a different feel (slow, tidy, a 3D worker). A gift triggers a golden block with the giver's name.
   One viewer plus bots can still finish it slowly; 300 finish it in seconds, so the goal scales with room size.
5. **Düğün / kına gecesi (ceremony scene).** A short scripted ritual with 5-6 stages (arrival, kına, dance, cheers,
   cake, photo); viewers are guests with faces; spotlighted viewers (by activity, never by gift) take roles such as
   gelin, damat, kına anası; the group does a synchronised "şerefe / hep beraber" moment (everyone types within one
   short window, the sync percentage fills a meter). Genre: social scene (wedding product with a paid 798k lifetime
   plan; bar-toast sync; Livecade dance games). Existing Halay is the sibling; this reuses its crowd. Works at any
   size; camera does the ceremony shots automatically.
6. **Bir karaktere yardım (help-or-hinder one character).** A human 3D character attempts a silly task (climb stairs,
   carry a tray over a wobbly plank, push a wardrobe, hit the TV until the picture clears). Chat triggers push him
   along; likes add steady power; scripted hazards (not money chance) appear. The round ends when he makes it or
   the timer ends; he reacts to the top few helpers by name. Genre: P3, the 13-entry cluster plus the streamer's
   TV-smack post. Keep it purely cooperative (no two camps). Works with 2 plus bots, and scaling by tuning the
   difficulty to room size. Camera follows the character; zoom on his face when it nearly fails.
7. **Hangisi? (split-choice parade).** Two options (A/B, e.g. "çay mı kahve mi"); viewers type A or B; their faces
   run to one of two platforms; the 3D host reacts to the majority and picks out the lone dissenter by name
   ("tek başına kalan"). No right answer, no score, only the reveal. Genre: would-you-rather (L) with the quiz
   removed. Avoids "nobody plays quizzes" because no one can be wrong. Works at 2 (host teases both) and 300 (two big
   crowds). Camera zoom on the minority. Text is only a letter, never shown.
8. **Ortak av (co-op grid hunt).** A hidden treasure on a numbered or lettered grid; viewers type a cell number or
   coordinate; the cell opens showing their face and either empty, warm, or the treasure; shared goal, ends when
   found or at a timer. Genre: battleship-by-coordinate (HP) plus the number-typing verb already used in At Yarışı
   (1-8). Collective against a script, no losers. Works with 2 (smaller grid) and 300 (larger grid). A character
   digs; camera zooms into the cell.
9. **Yüz madalyası (recognition showpieces).** A short filler scene where an engraver or press stamps each recent
   chatter's face and name on a medal, card or coin and drops it into a display case; follows, shares and first
   comments get different stamps. No ending; ideal rotation gap-filler. Genre: recognition printer, the longest
   lived pattern found (240 / 89 / 54 stars). Works at every room size. Do NOT make it a roast of faces (section 4).
   Camera zoom on the freshest medal.
10. **Göl kenarı (pond or idle scene).** Viewers stand in a row of 3D characters fishing or doing a calm activity, each
    with their face; catches appear on activity, rare items (cosmetic only) are shown with a zoom and the person's
    name; a room quest (everyone catches N fish) fills a shared bar. Genre: fishing scene (paid product, 169k VND/month;
    camera zoom on catch is a feature of the original). Soft and social, no ending needed. Weakest on viewer-to-viewer,
    so add trade-a-fish by "@name". Cosmetic randomness must stay free of any gift link.

## 4. Patterns to avoid (our rules or platform policy)

- Gift-decides outcomes (luck machines, wheel, plinko, coin pusher, gift-as-vote): breaks our rule; one peer's rule audit marks it high risk.
- Betting / odds / stake multipliers (even renamed "pick"): our rule and a flagged "gambling-like" mechanic. Free forecast only.
- Two sides where gifts are the only content ("send gifts to make your side win"): listed as fake engagement in one audit; also our PK removal.
- Battle royale / elimination of viewers: rejected by the streamer; losers leave in 2-50 rooms.
- Marble-style join-then-watch races and plain quizzes: removed for low engagement; do not re-add as-is.
- Any scene that displays typed text (printer, name diary, chat bubbles, trivia answers, four-pics): our rule; use only triggers.
- Religious ritual with gifts (temple / zikir scenes): drew press and a police warning in Vietnam; peers add "gifts are not offerings"; do not tie gifts to a sacred act.
- Roasting or rating viewers' profile photos: insults named real people; also a child-safety risk.
- Gift-bought advantage in kids' content: peers quote TikTok rules; keep gifts to spotlights.
- Unmarked bots / fully unattended runs: audit lists bots must be visibly marked and unattended streams as medium risk; keep the streamer present.
- Real logos, flags of disputed places, copyrighted characters ("celebrity vs celebrity"): copyright and neutrality issues.
- 150-unit simulations (tank swarms): performance cost on a Windows exe with 3D humans, little payoff in a small room.
- Cosmetic loot linked to gifts (gacha): chance plus payment; keep any randomness free of gifts.

## 5. Caveats
- Census counts come from keyword search of "tiktok" repos; games sold elsewhere are invisible. Stars are weak evidence. Livecade is one vendor's
  marketing list, not a popularity measure. The HP catalogue has prices but no usage numbers.
- Ranking is judgement from fit to the streamer's stated likes, not from measured play data.
- The PNG covers are stills; mechanics for the two videos are inferred from frames and post text.
