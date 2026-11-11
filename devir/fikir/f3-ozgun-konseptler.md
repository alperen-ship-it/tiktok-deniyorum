# F3 — 12 chat-game concepts for the 3D crowd engine

Common assumptions for every concept (not repeated below):
- Join is free: a comment, a like, or a follow puts your character in the scene. Your character carries your profile picture on its head (disc) and a name tag when active.
- Bubbles only ever show fixed labels from a game list (e.g. "BUYUR!", "AFİYET!"). The viewer's text is never displayed; it is only matched against a number, a fixed word, @name, an emoji, or "anything".
- Bots (🤖) fill gaps, never win or take a named role if a real viewer is eligible, never reach TT.soyle.
- Gift rule used everywhere: sender's name always on screen with thanks. A gift only (a) adds a small capped boost, (b) triggers a spotlight (name large, camera zoom, sender's face on a hero for a short moment). It never decides a winner, never is the final push (a gift arriving in the last 10% of a goal is queued to the next round, thanks shown at once; same trick as Düdüklü).
- "Hero" = the engine's character whose face shows a profile picture. Default hero-face source: the stream's biggest donor so far, falling back to the round's top contributor, then to the newest follower. The hero face is a spotlight, never a prize that depends on a gift in the current round.
- Engine pieces assumed existing: crowd (<=150), name tags, avatar discs, fixed-label bubbles, camera director, hero characters, ground/props primitives, SPİKER line, PANO, Finis card.

Kinds of fun covered: 6 viewer-acts-on-viewer (1-6), 6 collective goals (2, 7, 8, 9, 11, 12; #2 is both), 1 race (10), plus reveal, steering, sync-moment and build-together.

---

## 1. ŞEKER VAR MI KOMŞU? (neighbour's doorbell)
**Pitch:** A 3D apartment block, one window/door per viewer. Ring a neighbour's bell, ask for sugar, and the whole building warms up.
- **3-second read:** a cut-away building with lit windows, each with a tiny face disc; a bubble "ŞEKER VAR MI?" pops from one window toward another. Caption: "KOMŞUNUN ZİLİNİ ÇAL: @İSİM veya KAT NUMARASI YAZ". First action: type a floor/flat number or @name.
- **Verbs:** `@name` or a flat number (1-24 shown on windows) = ring that neighbour's bell (fixed bubble "ŞEKER VAR MI?"). Receiver answers by writing "anything" within 20 s: their door opens, bubble "BUYUR KOMŞU!", a sugar bowl flies back. Like = "kapı önüne paspas": tiny coşku-style meter bump, batched. Follow = you get a flat and a free first doorbell ring. Share = your window gets a flowerpot (cosmetic, once).
- **Loop:** 0:00 empty block, bots ring each other (demo). 0:10-2:20 viewers ring and answer; each answered ring = one "hoşbeş" (mutual visit) and a light bulb turns warm in both windows. A neighbour can receive several rings; answering the first one in the queue is enough, the rest get "sonra gelin" (fixed label, no penalty). Meter "MAHALLE SICAKLIĞI" fills with distinct answered pairs. Ends at goal (about 1/3 of active viewers paired, min 8 pairs) or 2:30 timer: the building "çay saati" party, rooftop fireworks.
- **Viewer-to-viewer:** the core. Ring, answer, a pair link line between windows.
- **Zoom moment:** each answered ring: camera dives to the two windows, ringer's face on the left, answerer's on the right, sugar bowl passes. Final: biggest donor's face on the hero "bina yöneticisi" who raps the roof with a tea glass; a second zoom on the pair that closed the most rings ("EN İYİ KOMŞU", chosen by distinct answered pairs, cap 6 per person so spam cannot dominate).
- **Gift:** small = "ŞEKER KÜPÜ": sender's window gets glowing and meter +1 pair equivalent (cap 3 per round). Large = spotlight: camera zoom on the sender's window, name large, the neighbour next to them gets a visit from every bot. Never the last pair.
- **Scale:** 2 viewers + bots: bots ring them, they answer, 8 pairs in about 90 s (bots reply only to real viewers fast so nobody feels ignored). 30: crowded building, many chains, goal in about 70 s. 300: building holds 150 windows; extras are "balkon" silhouettes counted in a number; rings to extra viewers still work by @name, shown as a tag flying to the roof.
- **Reuses / new:** crowd, tags, name matching (`adEsle`, `komutCoz` from halay), bubbles, camera director. New: building prop with 24-150 windows, bell/answer queues, pair-link lines. **Cost M.**
- **Risks:** being rung by strangers 20 times (fixed: answer is optional, no negative state; rate limit 2 outgoing rings per viewer per 10 s). Name harassment: only the name tag shows, no text. No betting reading. No sensitive theme.

## 2. ÇAY ZİNCİRİ (the tea glass chain)
**Pitch:** One hot tea glass travels from person to person before it goes cold; how long a chain can the room build?
- **3-second read:** a tulip glass with steam, held by a character with a big name tag; a timer ring around it ("SOĞUMADAN VER"). Caption "ÇAYI BİRİNE VER: @İSİM veya NUMARA". First action: if you are holder, write @name or number; everyone else: write to join (you become pass-able).
- **Verbs:** only the current holder's `@name` / number passes the glass (the holder gets a 15 s window, then the glass is auto-passed to a random fresh viewer with "soğumasın!" so a sleeping holder never blocks). Everyone else: any comment = "sıraya otur" (becomes eligible, nobody can be passed to twice in a chain). Like = "demle": a small slice of the glass's heat timer returns (batched, hard cap +10 s per chain). Follow = a seat in the circle. Share = nothing special.
- **Loop:** chains of 15 unique holders ("TEPSİ DOLDU" bonus); goal per round: 40 unique holders over up to 3 chains. The glass flies in an arc between characters, each hand-off adds a link of a visible chain and a "afiyet olsun" bubble. If the glass goes cold (45 s without 5 passes) the chain breaks (shatter, no blame, nothing named) and a new chain starts. Ends at 40 unique holders or 2:40: "ÇAY DEMLENDİ" card.
- **Viewer-to-viewer:** each pass names the next person; strong "you are called" feeling. Holder picks a friend or a stranger.
- **Zoom:** every 10th link the camera follows the glass in slow motion over the shoulders of two faces; chain end: close-up on the last holder, face on the glass-holding hero too if they are the biggest donor ("çaycı" hero hands out the glass at the start with the donor's face).
- **Gift:** gifts add "şeker": +10 s on the timer once per chain (cap), and spotlight on the sender's face as the glass is handed to them (they can pass it on, no extra reward). Never the 40th holder: if a gift would complete it, the thank-you is shown and the effect queues.
- **Scale:** 2 viewers + bots: bots pass among themselves and to the viewers, 15-link chains, goal is lowered by bot count to 20. 30: perfect size, round in about 90 s. 300: only the first 150 appear as characters; passing by @name still works for hidden ones (face flies in), 40 unique holders done in 60 s so goal scales to 60.
- **Reuses / new:** crowd, tags, bubbles, camera (follow). New: glass prop + arc animation + chain graphic + pass queue. **Cost S-M.**
- **Risks:** a friend group passing only to each other (unique-holder counter prevents loops); autopass picks any random eligible, not "popular". Easily explained. No sensitive theme.

## 3. SAKLAMBAÇ (hide and seek)
**Pitch:** The crowd hides behind a village square; the ebe looks; faces are revealed one by one.
- **3-second read:** square with 6 hiding spots (çeşme, kuyu, odunluk, çınar, araba, ... numbered 1-6) and an ebe covering eyes, counting "1...10" with the biggest donor's face on the ebe. Caption "SAKLAN: 1-6 YAZ". First action: write 1-6.
- **Verbs:** a number 1-6 picks a hiding spot (can re-pick until count ends). `@name` after hiding = "ihbar": you tell the ebe where that person hides (fixed bubble "ORADA!"); the ihbarcı gets a harmless "GAMMAZ" label. Like = "ayak sesi" (nothing, purely a rustle effect) — or none; likes make your character nervously wobble, mild. Follow = full life as hider (just joins). Share: none.
- **Loop:** 0:00-0:25 hiding with countdown. 0:25-2:00 the ebe checks spots in order of crowdedness with an automatic camera: at each spot the camera zooms in, the curtain/lid opens, and the faces behind it are shown with names ("BULUNDU!" or, if the spot is empty, "BOŞ" laugh). Found viewers sit on the ebe bench and keep playing (they can ihbar). Nobody is eliminated from anything; no score is lost. Ends when all spots are checked: "EN İYİ SAKLANAN" = viewer whose spot the ebe checked last among occupied spots (not the cleverest, purely order), with a short second round if time allows (spots reshuffle).
- **Viewer-to-viewer:** ihbar and "kankanı sakla" (writing the same number as a friend = hide together).
- **Zoom:** each spot opening (face reveal) is the whole point; final spot: slow zoom with the last hider's face.
- **Gift:** big gift = "ebenin gözlüğü": the camera peeks into one spot that the gifter points at only after the count (the gifter does not choose spot by text, the engine picks the most crowded one); name large. It never selects who "wins" because there is no gift-weighted result. Small gifts: balloon with name floats over the square.
- **Scale:** 2 viewers + bots: bots hide in spots, 2 real viewers reveal quickly: they are always found last-ish (rotate order). 30: great, 6 spots with 5 faces. 300: 6 spots with 50 each; show only the top 6 name tags per spot and a "+44" counter, face reveal as a face carousel.
- **Reuses / new:** crowd, hero face, tags, strong use of camera director. New: hiding-spot props and reveal animation, order logic. **Cost M.**
- **Risks:** could read as "pick a number" lottery; no reward, no money. If one viewer is found by a rival's ihbar feel bullied: the label is playful, never a negative; throttle ihbar to 1 per round. Elimination-ish feel is avoided: found players join the bench, still active.

## 4. FİNCAN KAPAT (the coffee cup)
**Pitch:** Turn a friend's cup upside down and read it; a silly fixed "fal" appears on a big cup, face of the friend next to it.
- **3-second read:** a Turkish coffee cup and saucer on a low table, cosy kahve ocağı, a "falcı teyze" hero. Caption "BİR ARKADAŞINA FAL BAK: @İSİM". First action: `@name`.
- **Verbs:** `@name` = open their cup, they enter the queue; a fixed fal is drawn from a library of 60 light, silly lines (e.g. "Kapında bir börek kokusu var", "Yakında bir çay içeceksin") — no money, health, love, marriage, death or luck-prediction lines. Likes = "fincanı soğut" (speeds the queue a bit). A reader can only read for 1 person per 40 s (anti-spam). Follow = your cup is on the table (queue eligible), share nothing.
- **Loop:** 0:00 fincans on the table; 0:15-2:15 each reading: the cup lifts, camera dives into the cup, the grounds make a picture (fixed shape: bird, cat, key, simit), then a bubble with the fixed line. The reader's face is small on the teyze's apron, receiver's face is big. Ends after 8 readings or 2:30 with a card "KAHVEN KISMET OLSUN" (no: use "KAHVEN AFİYET OLSUN"), the room's "en çok bakılan fincan" (most readings received).
- **Viewer-to-viewer:** yes, one gives a reading to another.
- **Zoom:** into the cup grounds, then out to the receiver's face. Biggest donor's face on the teyze who reads for the first.
- **Gift:** a gifted "fincan" jumps the queue by one position (capped once per 60 s per sender); spotlight on the sender with their own reading as the next one (it is a free reading, not a prize).
- **Scale:** 2 + bots: bots ask each other and the two real ones; 30: best; 300: queue of 8, many pending: "sırada 40 fincan" counter.
- **Reuses / new:** hero, camera, tags, bubbles. New: cup/saucer prop, ground-pattern shapes, 60 fixed lines. **Cost M.**
- **Risks:** **Sensitive:** fortune-telling (fal) is rejected by some religious viewers; keep it clearly comic, no predictions about real life events, label "eğlence". Fal lines are fixed and pre-reviewed. Could be read as "chance": no stakes, no money, no reward for a good fal.

## 5. ÖNCE SİZ (after you!)
**Pitch:** The Turkish "buyurun, siz geçin" contest: everyone insists others go first through a narrow door.
- **3-second read:** a narrow door in a wall (ekmek fırını/otobüs kapısı), two characters bowing to each other, bubble "BUYUR!" Caption "KAPIDA KİMİ GEÇİRECEKSİN? @İSİM". First action: `@name`.
- **Verbs:** `@name` = let that person pass the door first ("buyur, sen geç": your character steps back with a hand gesture, the target walks through, a "TEŞEKKÜRLER" bubble). A target who also writes @name back inside 8 s creates a comedy loop "Yok sen!" for that pair (3 times max, then both squeeze through together: "BERABER GEÇTİK" bonus). Likes = "kapıyı tut" (the door stays open longer, batched). Follow = your place in the queue. Share none.
- **Loop:** 0:00 queue forms; viewers let others pass; each let-through adds to the shared "NEZAKET" meter and a name on the wall plaque (top 5 "centilmen": most distinct people let through, cap per person 8). Goal: the whole queue gets through (maybe 30 persons) before the shop shutter closes at 2:30; unfinished: the last few squeeze through together (always ends).
- **Viewer-to-viewer:** whole point: the generosity contest.
- **Zoom:** each "yok sen!" loop: camera cuts between the two faces at the door, 3 beats, then both squeeze through together. End: top "centilmen" face on the doorman hero (biggest donor's face as the shop owner holding the door).
- **Gift:** gift = "tepsi": a bonus pass line gets a few extra queued people through (cap 5), sender's name on the shopkeeper's sign. Never the last person through.
- **Scale:** 2 + bots: bots queue and let real viewers pass; 30: perfect; 300: queue of 150 compressed into a snake line with a counter.
- **Reuses / new:** crowd, tags, bubbles, camera, `adEsle`. New: door prop, queue logic, bow/pass animations. **Cost S-M.**
- **Risks:** low. Gift buying position: it is a bonus pass for the whole queue, not for the gifter. No sensitive theme. Reads as polite, not competitive betting.

## 6. MAHALLE BERBERİ (barber / hat swap)
**Pitch:** Give your friend a ridiculous haircut or hat from a fixed menu; the hero models it for the room.
- **3-second read:** barber chair with a hero whose face is a viewer, a wall menu of six looks with numbers (1 bıyık, 2 şapka, 3 gözlük, 4 çiçek taç, 5 kavuk-free "fötr", 6 saç kabarık). Caption "ARKADAŞINA TARZ VER: @İSİM 1-6". First action: `@name 3`.
- **Verbs:** `@name` + number 1-6 (or the number alone gives the current hero a look). The target's own character gets that accessory for 60 s. Target can "beğenmedim" by writing anything first within 8 s: look removed with "OLMAMIŞ" (the giver sees it, no reward lost). Likes = "ayna": the hero's mirror shines and the look lasts 15 s longer (batched, capped). Follow = a free first look. Share none.
- **Loop:** 0:00-2:30: a stream of makeovers; hero chair rotates through the viewer who received the most looks (distinct givers count, cap 3 per giver); the camera zooms on the hero whenever a new look lands. Ends with a "defile" lasting 15 s: all styled viewers walk the runway in order of how many distinct people styled them; the most styled is "MAHALLE ŞIKI".
- **Viewer-to-viewer:** yes.
- **Zoom:** at each look landing, on the hero face; final runway: tight close on the "şık" face.
- **Gift:** gift = a golden scissors: sender picks nothing; the engine puts a one-off "altın tarak" (cosmetic crown) on their own character for the stream, plus spotlight with their face on the hero chair for 8 s. Does not change the order of the runway.
- **Scale:** 2 + bots: bots give looks to the viewers too; 30: good; 300: the chair rotates quickly; only top 20 appear on the runway.
- **Reuses / new:** crowd, hero face, tags, camera. New: 6 accessory models (primitives), chair prop, runway. **Cost M.**
- **Risks:** mockery/harassment (an unwanted ugly look on someone): menu is flattering/funny only, target can veto, no text. Beauty-contest feel: the winner is "most styled", not "prettiest". Avoid any religious headgear (no sarık/fes) or national flag motifs; no football scarves. No betting reading.

## 7. SOFRAYI KUR (laying the table)
**Pitch:** Guests arrive in 2 minutes and the table must be complete; each viewer carries one dish.
- **3-second read:** a long empty sofra, six empty slots with icons (çorba, ana yemek, pilav, salata, tatlı, çay) and a hero "misafir" at the door (donor face). Caption "SOFRAYA BİR ŞEY GETİR: ÇORBA / PİLAV / TATLI ... YAZ". First action: write one dish word (or a number 1-6).
- **Verbs:** a fixed dish word or its number brings that dish (the viewer's character walks a bowl to the slot, their name in a small label on the dish); "anything" brings the dish with the fewest hands so far. Like = "tuz biber" (a seasoning meter that makes the table glow, batched cap). Follow = dish bag. Share none.
- **Loop:** goal: each of 6 slots needs 4 distinct carriers (scaled by bots, min 2). Slots grow plates visually. At 1:30 "misafirler yaklaşıyor" siren; at full table the guests sit and the camera pulls back to a feast; if not full at 2:30, the table is set "az ama gönülden" with whatever is there (a softer ending, still ends).
- **Viewer-to-viewer:** light: "@name" = "senin tabağına ekmek koy" (their dish gets a bread, both names tagged).
- **Zoom:** at each slot completion: camera onto that dish with the carriers' faces in a row; end: the hero guest's face sits at the head of the table, applauds.
- **Gift:** small: "tuz": cosmetic + a seasoning cap bonus; large: the guest hero gets the sender's face for a toast with the name spotlight. No gift completes a slot.
- **Scale:** 2 + bots: bots fill; 30: ideal; 300: the 4-carrier rule becomes 12, table is crowded with name labels, show top ones.
- **Reuses / new:** crowd, bubbles, camera, hero. New: table + 6 dishes models and slot logic. **Cost M.**
- **Risks:** low. Avoid alcohol or pork items, and no fasting-related (iftar) framing. Not a vote, not betting.

## 8. KİLİM DOKU (weave the kilim together)
**Pitch:** Every viewer weaves a coloured row, and a huge kilim appears under the crowd.
- **3-second read:** a loom frame seen from above with an empty grid, thread spools in red, blue, yellow, green, black, white. Caption "İP SEÇ: KIRMIZI / MAVİ / SARI / YEŞİL YAZ". First action: write a colour word (or any text = a random colour).
- **Verbs:** a colour word weaves one block of that colour at the next empty cell; the cell carries that viewer's tiny avatar sparkle when it lands and a name tag on hover (latest 6 only). Likes = "çıkrık" (loom speeds up, tiny). Follow = your first block is a corner motif. Share none.
- **Loop:** a 12x20 grid (240 cells) goal; the pattern template (a classic motif outline: elibelinde, koçboynuzu as a faint guide) tells which colour belongs in which cell; matching the guide scores "doğru ilmek" and speeds the finished look but wrong colours simply look "modern" (no punishment). Per-person cap 10% of cells. Round ends at completion or 2:30 (unfilled cells get "çile" bots-filled threads with 🤖 name).
- **Viewer-to-viewer:** "@name" = "sana motif bırakıyorum": the next block placed carries both names (very light).
- **Zoom:** the loom camera follows the weft; at completion the camera lifts and rotates, the kilim flies out and lands under the crowd; a hero weaver shows the biggest weaver's face (top contributors by distinct blocks) and the donor's face on the "usta dokumacı" at the loom edge.
- **Gift:** small gift = "çile": adds 3 blocks (cap 12 per round) with the sender's colour; large = gold thread border motif with their name; never the last cell (queued).
- **Scale:** 2 + bots: bots weave slowly, grid scaled to 120 cells; 30: ~60 s; 300: grid grows to 480 cells; the name-sparkle shows the freshest few only.
- **Reuses / new:** crowd (weavers stand around the loom as a ring), tags, camera, SPİKER. New: loom/grid renderer, motif templates, colour-word map. **Cost M.**
- **Risks:** colour words matching red/white could drift into nationalism (flag colours) or club colours (sarı-lacivert, kırmızı-siyah): **flag**. Use a motif palette that avoids a red-white flag look or club pairs and do not display "sarı-lacivert" combos as a meter; leave motif choice to the system. Low otherwise.

## 9. UÇURTMA ŞENLİĞİ (the kite festival)
**Pitch:** A hill, a kite and the room's likes as wind: keep the kite aloft together.
- **3-second read:** a big colourful kite on a hill over a plain; a "RÜZGAR" gauge and a rope. Caption "RÜZGAR ESTİR: ❤️ BEĞEN  ·  İP SAL: SAL YAZ  ·  İP ÇEK: ÇEK YAZ". First action: tap like.
- **Verbs:** like = wind (the main lever, batched); "SAL" (fixed word) lets line out (higher kite, more points but more fragile); "ÇEK" reels in (stable); any other comment: a child character runs along the hill (cosmetic and adds a little "koşu" to wind). Follow: a new kid joins the hill. Share: a second kite appears for a few seconds.
- **Loop:** the kite must stay inside a green altitude band for a total of 75 s (not necessarily consecutive); wind gusts from natural randomness; too much "SAL" and the room needs "ÇEK". Like input has a cap per viewer per 10 s; no single person can sustain the band alone with their own taps. Ends at 75 s accumulated or 2:45 ("rüzgar yattı", kite lands gently).
- **Viewer-to-viewer:** light: "@name" = hand the spool to that kid; the name's kid pulls strongest for 10 s (a visible "ip sende" tag).
- **Zoom:** at every 25 s milestone: sweeping camera up to the kite with the "ip sahibi" face; end: kite loop-de-loop, top "ip tutucu" faces.
- **Gift:** gift = "gökkuşağı kuyruk": adds a tail and a +8 s credit (cap +20 s per round); never the last seconds. Spotlight on sender's kid pulling the string.
- **Scale:** 2 + bots: bots pump wind slowly, the band is wide and forgiving; 30: lively; 300: band gets harder, the more wind, a huge crowd on the hill; stays tense.
- **Reuses / new:** hero face on the child holding the spool (donor), camera, tags. New: kite physics (simple), hill scene, gauge. **Cost M.**
- **Risks:** a like-only game may get boring if the band is trivial: add gust events; bots shouldn't flood likes. No sensitive theme. No betting.

## 10. ÇEKİRDEK ATIŞI (seed-spitting)
**Pitch:** A picnic watermelon contest: pick an angle, charge your breath, send the seed flying; the longest flight gets the golden slice.
- **3-second read:** a picnic blanket at a lake, characters with a slice, a distance board and a wind flag. Caption "AÇI SEÇ: 1-9 YAZ  ·  DOLDUR: YAZDIKÇA GÜÇ ARTAR". First action: write a number 1-9.
- **Verbs:** a number 1-9 sets your angle (5 is best in calm wind; wind flag shifts the optimum: see the flag!). Each comment adds a bit of breath power up to a cap (about 6 comments); likes top up a small bonus. Follow: joins the line. Share none.
- **Loop:** 0:00-0:40 charging, then a volley: all seeds fly (a few characters at a time, one at a time in camera for the top and last). 3 volleys of 25 s; best flight of each viewer counts. After volley 3: finalists' replays. Ends with "ÇEKİRDEK ŞAMPİYONU" = longest distance across volleys. Race #1.
- **Viewer-to-viewer:** "@name" = "rüzgarını kes" hmm; better: "@name" = lend your breath: your next comment's power goes to that person (a gift of effort, capped). Light.
- **Zoom:** camera follows the longest flight in slow motion; the landing is a splash with the winner's face on the splash plaque; the hero is the donor face "hakem".
- **Gift:** gift = tail wind of +3 percent on the sender's seed? No: gift is not allowed to decide: instead a gift triggers a "rüzgar": a wind flag swing for all and a spotlight, nothing for the sender's distance.
- **Scale:** 2 + bots: bots compete, a real viewer can win; 30: fine; 300: seeds fly in waves of 30; only top 10 shown in replays.
- **Reuses / new:** crowd, tags, camera. New: ballistic arc, wind flag, picnic scene. **Cost M.**
- **Risks:** "pick a number and hope" reads like luck; mitigated by the visible wind flag (skill). Racing genre, kept to one. No sensitive theme. Spitting seeds is mildly gross (use "fırlat" wording).

## 11. DÜĞÜN FOTOĞRAFI (wedding photo)
**Pitch:** The photographer yells "Hazır!"; everyone must be in the frame, smiling, at the same moment.
- **3-second read:** a wedding hall steps with the crowd arranged in rows, a photographer hero with a big camera, the couple in the centre (faces: donor and a top supporter). Caption "FLAŞ PATLAYINCA: 'GÜLÜMSE' YAZ". First action: write "gülümse" at the flash countdown.
- **Verbs:** during the 6-second window after the "HAZIR OL, 3-2-1" countdown, any comment (or the word "GÜLÜMSE") = your character smiles; outside the window = "göz kırptı" (blink). Like = "cilalı ayakkabı" (cosmetic). Follow = a place in the front row. Share none.
- **Loop:** 5 flashes of 25 s each; after each flash, the polaroid prints with all faces, smiling ones lit; goal "ALBÜM": at least 60% of seen viewers smiling in 3 of 5 shots. Between flashes, rows reshuffle with new arrivals (their faces lighten as they walk in). Ends after flash 5: the album page flips, the best picture is held on screen for 8 s.
- **Viewer-to-viewer:** "@name" = "yanıma gel": drags that person into your row for the next photo (an invitation like halay).
- **Zoom:** at flash: camera pulls out in a snap, then zooms to the polaroid; the best-smiling row close-up. Hero faces: bride/groom = donor and top supporter.
- **Gift:** gift = a floral background in the photo plus a spotlight on the sender with their name as "photo credit"; never counts towards the 60%.
- **Scale:** 2 + bots: smile counts scale with bots; 30: good; 300: the 150 characters in rows, others in a "+150" balloon but count in the percent.
- **Reuses / new:** crowd arrangement (row steps), hero faces, camera director. New: flash, polaroid compositor, timing window logic. **Cost S-M.**
- **Risks:** latency of TikTok chat (hence a 6 s window); wedding theme: skip anything marriage-religious (nikah). Not betting. Low.

## 12. MÜSAİT BİR YERDE (dolmuş steers)
**Pitch:** The room is the passengers of a dolmuş and votes at each fork where the driver goes; "inecek var!" decides the stops.
- **3-second read:** a dolmuş seen from behind/side on a road with a fork ahead, signs "SOL: SAHİL / SAĞ: ÇARŞI", the driver hero with a face. Caption "YOL AYRIMI: 1 SOL  ·  2 SAĞ  ·  İNECEK VAR". First action: write 1 or 2.
- **Verbs:** 1 or 2 votes the next turn (free, visible split bar, no stakes); "İNECEK VAR" asks for a stop: when 5 or more ask, the driver brakes: "MÜSAİT BİR YERDE!" and a stop scene plays (simit seller, çay bahçesi, köprü). Likes = "müzik": the radio gets louder; at 10 likes the driver sings (fixed animation). Follow = you get on at the next stop. Share none.
- **Loop:** four forks with scenes (sahil, pazar, orman yolu, son durak) = 4 x 30 s + stops. The road ends at "SON DURAK" at 2:20-2:40; passengers hop out in a line with their faces.
- **Viewer-to-viewer:** "@name" = "yan koltuğa geç": your seat neighbour changes; the two get a "yol arkadaşı" label (cheap).
- **Zoom:** at each fork the camera swoops to the driver's face and then the road; at stops, close-ups on passengers getting out; the final stop shows each passenger's face as they step off.
- **Gift:** gift = "korna": a honk and spotlight, plus +1 stop credit; does not tilt the vote; never forces a route.
- **Scale:** 2 + bots: bots vote and the 2 viewers can tilt; 30: great; 300: the votes are shown as a split bar and only 14 seat-faces rotate.
- **Reuses / new:** hero face, camera director heavily, tags. New: vehicle, road scenes, vote logic. **Cost L** (scenes).
- **Risks:** vote bars may read as "betting on outcome" if one side is "winning": keep options neutral scenes with no payout. Avoid city/football/political landmarks on stops. Medium.

---

## Ranking: top 4
1. **ŞEKER VAR MI KOMŞU?** (#1)
2. **KİLİM DOKU** (#8)
3. **ÇAY ZİNCİRİ** (#2)
4. **DÜĞÜN FOTOĞRAFI** (#11)

**Why.** The streamer's own words were "viewer-interactive, like inviting someone to dance" and "everyone adds to one object". #1 is the doorbell version of the dance invitation: `@name` or a number, a visible answer, a pair line, and every exchange is a natural camera zoom on two faces, with no winner and no gift decision. #8 is the strongest "everyone adds to one object" after the pressure cooker but with a different payoff: a beautiful rug built from many hands, instantly readable, one cheap action, per-person cap that blocks solo play, and a result you keep looking at; the only care is colour choice (flags and club colours). #2 combines both asks (each pass names someone, and the room builds one chain), is cheap (S-M), plays with 2 or 300 viewers and every hand-off is a zoom on faces. #11 is cheapest to build and the best use of the camera director: a countdown, flash, snap-zoom and polaroid is a moment people wait for in a 2-minute round, and it works for any room size. The ones left out are fine but costlier or riskier: #4 (fal) and #12 (vote bars) need a careful sensitivity review, #10 is a race and luck-flavoured, #3 is lovely but needs the most staging.
