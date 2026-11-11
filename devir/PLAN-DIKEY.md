# PLAN-DIKEY — portrait 1080×1920, real-3D halay and new collective game

Adviser plan, 2026-11-10. Planning only; no repo file was edited to write this.
Baseline for all diffs: the last reviewed commit on `claude/tiktok-live-studio-reverse-eng-6x7k2a`
(orchestrator fills in the hash when phase 1 starts; call it `BASE`).

Standing user rules that every worker must obey:
- Portrait 1080×1920 is the default. Viewers' names are the most important objects on screen.
- **Chat comments are triggers only. A viewer's free text is never drawn on screen** (not in DOM, not on canvas).
  Only fixed labels, the viewer's name, emoji chosen by the game, and numbers.
- No betting or chance vocabulary; a gift never buys a chance outcome.
- **Real 3D** (user decision): the halay and the new collective game are real-time 3D and share one 3D core.
  bilye, bilgi, pk and at stay 2D and only move to portrait.

---------------------------------------------------------------------------------------------------

## A. Portrait shell (shared)

### A1. Canvas and scaling
- Design canvas: **1080 × 1920**, `#kok` fixed at that size, scaled by one factor
  `--tt-olcek = min(innerWidth/1080, innerHeight/1920)`, centred (letterboxed if the source is not 9:16).
- `tt.js` sets `html.tt-dikey` by default and `html.tt-yatay` only with `?yatay=1` (see A7).
  It exposes `TT.dikey` (boolean) and `TT.TUVAL = {w, h}`; `TT.yatay` keeps working.

### A2. TikTok's own UI — safe zones
Verified in the clone (`repo-arastirma/s1a-merkezler/klon/duycuf__tiktok-live-kit/docs/THEME.md:34`):
top 240px (channel name, viewer count); 100px each side cropped on tall phones; left half from
y=1250 down (comment box); everything from y=1760 down (input, gift button).

This is one peer's measurement, not TikTok documentation, so follow it with a margin where it is cheap
and loosen it only at the sides:

| Zone | Rule in this project |
|---|---|
| y < 240 | Background only. No text, no names, no counters. |
| x < 60 or x > 1020 | No text. Panels and backgrounds may bleed to the edge. (60, not 100: the 100px figure is for 20:9 phones cropping a 9:16 frame; 60 keeps 960px of width and still clears most phones. Revisit after the first real stream.) |
| x < 540 and y > 1250 | Background only (TikTok comments are drawn here). |
| y > 1760 | Background only. |

`?guvenli=1` must shade exactly these four zones in translucent red (replace today's `kilavuzCiz`).

### A3. Fixed boxes (design pixels; all text inside x 60–1020)

| Id | Box (x, y, w, h) | Content |
|---|---|---|
| ÜST `#ust` | 60, 252, 960, 128 | Game icon 96px, title, state line, round/timer chips, small counter |
| KOMUT `#katilCagri` | 60, 392, 960, 84 | One horizontal strip: "💬 YAZ" + the command. Replaces the 360px right column. Live viewer count at the right end, small and muted |
| SAHNE (game-owned) | 60, 488, 960, 672 | The game itself (ends at y=1160) |
| SPİKER `#akis` | 60, 1170, 960, 64 | One line at a time |
| PANO (game-owned) | 560, 1250, 460, 490 | Leaderboard / latest joiners / results (ends at y=1740) |
| SOL ALT | 60, 1250, 480, 490 | Empty: TikTok comments sit here |
| KAZANAN `#kazanan` | 60, 488, 960, 746 | Finis card: covers SAHNE + SPİKER, never ÜST or KOMUT |
| ULTI bant | full width, centred on y=316 | Over ÜST, never over SAHNE |

The shell publishes these as CSS variables on `:root` (`--dk-sahne-x/y/w/h`, `--dk-pano-x/y/w/h`, …) and as
`TT.KUTU = { ust, komut, sahne, akis, pano, kazanan }` so games do not hard-code numbers.

### A4. Type scale
A 390pt-wide phone shows the 1080 canvas at 1/2.77 (it was 1/4.92 for the 1920 canvas).

| Token | Was (1920 canvas) | Now (1080 canvas) | On a 390pt phone |
|---|---|---|---|
| `--tip-kucuk` (absolute floor) | 26px → 5.3pt | **30px** | 10.8pt |
| `--tip-isim` (viewer names) | 46px → 9.3pt | **54px** | 19.5pt |
| `--tip-baslik` | 44px | **48px** | 17.3pt |
| `--tip-vurgu` | 56px | **72px** | 26pt |
| `--tip-dev` | 140px | **150px** | 54pt |

**No text under 30px anywhere**, including badge digits and canvas-drawn text. Viewer names in lists are 54px;
a name that does not fit shrinks to 40px, then wraps; it is never ellipsised.

### A5. Header, command chip, call-to-action
- ÜST keeps title + state line (48px / 30px). The old in-header `#komut` chip moves out: the KOMUT strip is the
  single place that says what to type. Format: `💬 YAZ →` (34px, muted) + command (46px, 900 weight).
- "OYUNA KATILMAK İÇİN MESAJ AT" becomes the KOMUT strip's idle text when a game sets no command.
- The "son yazan" name that lived at the bottom of the old column moves into the SPİKER line (it is a name, 40px+).

### A6. Shared overlays
- **Finis card**: box KAZANAN. Name starts at 110px, shrinks to 56px, then wraps (move the halay page-local
  wrap fix into `finis.js` so every game gets it). Sub-line 34px. Confetti canvas uses the scaled `#kok` box, not the window.
- **Spiker**: one line, 36px, names (`.kim`) 40px; queue rules unchanged.
- **ULTI banner**: `top: calc(316px * var(--tt-olcek))`; name 64px, label 30px; the queue rule from the reviewed fix stays.
  Font sizes must scale with `--tt-olcek` (today they do not).
- **Welcome / greeting strips** (tt.js `karsila`): through the SPİKER line only.
- **`TT.uyanis` curtain**: box SAHNE only; title 72px, lines 34px.

### A7. Landscape
Recommendation: **keep landscape for one release behind `?yatay=1`, frozen**. The existing 1920×1080 rules stay
as they are, scoped under `html.tt-yatay`; all new rules are written under `html.tt-dikey`. bilye, bilgi, pk and at
must still load without errors with `?yatay=1` (smoke test only, no layout polish). Halay and the new game are
portrait-only (and 3D). Remove the flag after two clean real streams.

### A8. Hub (`overlays/oyun.html`)
Iframe fills the window. The "birazdan: …" badge is shown **inside KOMUT's box, replacing the strip for the last
45 s** (same box, same size, 40px text). It must not go into the top 240px.

---------------------------------------------------------------------------------------------------

## B. Per-game portrait layout

All five: ÜST / KOMUT / SPİKER / KAZANAN come from the shell. Each game owns SAHNE (960×672) and PANO (460×490).

### bilye (marble race) — gains the most
- Track runs **top to bottom** in SAHNE as a serpentine of 5 rows (960 wide, ~125px per row), marbles 44px.
  The 10 stages are 10 half-rows; stage flags at row ends. Gravity now reads naturally.
- Camera: no scrolling; the whole track is visible. The leader gets a name tag (40px) that follows it; at most
  3 tags at once (leader, last message sender, last gift sender), tags never overlap (drop the lowest priority).
- PANO: top 6 ranking, names 54px, position digits 30px. Goes away: the wide side ranking with plates.

### bilgi (quiz)
- SAHNE top 250px: question card, 44–56px text (shrink to fit, min 40px).
- SAHNE rest: four answer rows stacked, each 960×96, letter badge 72px, answer text 44px, live bar behind the row.
- PANO: top 6 scorers. Countdown lives in ÜST's timer chip. Goes away: the 2×2 answer grid.

### pk (tug of war)
- SAHNE top 300px: the two sides side by side (470px each): emblem, side name 56px, the word to type 72px.
- SAHNE middle 120px: the rope/bar across the full 960px.
- SAHNE bottom 250px: two MVP columns (3 names each, 54px → 44px to fit 470px).
- PANO: latest pushers with side colour. The gift banner is the shared ULTI banner with the **name as the big line**
  and a neutral label (the open follow-up from the horse-race review).

### at (horse race)
- SAHNE: 8 lanes, each 960×84. Lane number badge 56px and horse name 40px sit **inside the lane's left 300px**;
  the horse runs in the remaining 660px. Form digits ("3-5-4") go away from the lane (they move to PANO in the lobby).
- PANO rotates by phase: lobby = ÇARPAN TAHTASI (8 rows are too many at 54px: show 2 columns × 4, 40px names, 30px numbers);
  race = top 4 live positions; result = podium 3 + winners list (names 54px).
- Leaderboard "EN İYİ TAHMİNCİLER" alternates with the board in the lobby (8 s each).

### halay — rings in real 3D (see section G for the engine)
**Layout decision: concentric rings ("halka / meydan"), not a line.** A line of 60 needs three cramped rows on a
1080-wide canvas; rings fill a portrait frame, read as a halay at a glance, and both Turkish reference streams use a circle.
- Three rings around a round central platform: 24 / 40 / 86 places = **150 figures** (today's cap is 60). Rings fill
  inside-out; alternate rings turn in opposite directions; the step is locked to `Ses.muzikSaat()`.
- The platform is the "orta": davul and zurna players stand at its back edge; a duet or solo happens on it.
- Halay başı: first place of the inner ring, golden halo ring on the ground and a mendil in the raised hand.
- Camera: fixed, about 38° above the ground, framed so the outer ring's ellipse fits x 60–1020, y 520–1130.
  The 3D canvas covers the whole 1080×1920 behind the DOM; ground, sky and the kilim garland may extend into the
  safe zones (they are background), figures and tags may not.
- Name tags (overlay layer, section G3): always for halay başı, the pair on the platform and the newest arrival;
  plus up to 6 most recently active. 40px minimum, never overlapping (lowest priority hidden).
- Avatars: a round face disc on every figure's head, drawn in the overlay layer.
- 76px coşku strip across the full width at y 1084–1160 (number 64px), over the 3D ground.
- PANO: the 4-view rotating panel (SON GİRENLER, COŞTURANLAR, DESTEKÇİLER; halay başı plate as its header), plus
  the small counter "halkada N kişi" (30px, muted).
- Duet/solo names: a DOM card on SAHNE's lower edge (y 950–1070), two names 72px, shown while the pair is on the platform.
- Legend: 2×2 icon chips with one word each in KOMUT's alternate state.
- **Logic is not rewritten.** Name matching (`adEsle`, `komutCoz`), invitation rules and queues, coşku, gift queue,
  greeting strips, round end and `window.Halay.ozet()` stay as reviewed. Only rendering and layout are replaced.
- **`balonMetni()` stays the single gate** for anything derived from a viewer's message: a bubble (overlay layer)
  may only show what `balonMetni` returns after worker C's change (chants and emoji). No other code path may read
  `ev.comment` for display.
- Adopted from the HalkaLive example: (1) the ring layout and floating name tags; (2) a small gift (< 10 diamonds)
  becomes **"TEMPO"**: coşku +8 (at most 3 such boosts per 20 s) with the sender's name, instead of a 15 s halay
  başı turn; (3) the top tier (≥ 1000) adds **"MEYDAN GÖSTERİSİ"**: 8 s of whole-square choreography (rings
  counter-rotate faster, everyone's arms up, confetti once) under the sender's name, on top of the halay başı turn.
  Not adopted: "Hediye gönder — halkada yerini al". Here everyone joins free by writing or liking; the screen never
  asks for a gift in exchange for a place.

---------------------------------------------------------------------------------------------------

## C. New game — "DÜDÜKLÜ" (pressure cooker)

### C1. Theme decision
I weighed three:
- **Düdüklü tencere** (chosen). Every Turkish kitchen has one; "patlayacak mı" is a shared joke; it has a
  natural gauge, a whistle for intermediate thresholds and a lid for the climax. It reads in one glance on a phone.
- Mısır patlatma (popcorn): per-viewer kernels are charming but the object is generic, and the climax is weak.
- Semaver / çay: strong culture, but nothing bursts.

Two changes to the orchestrator's sketch, both for the policy rules:
1. **No "soğuk su" gift.** A paid action that undoes other viewers' work reads as paying to make others lose,
   and it stretches rounds. Pressure drops by itself when the room goes quiet (C4), which gives the same tension for free.
2. **The spotlight is not "whoever's action makes it blow".** That is a timing lottery that a well-timed gift can buy.
   The spotlight goes to the round's **top contributor by capped participation** ("USTA AŞÇI"); the last action is
   named in a small line only ("son odun: <ad>"), and a gift can never be the last action (C3).

### C2. Screen (real 3D, portrait)
- A village-square "ocakbaşı": a big pressure cooker on a wood fire in the centre, built from primitives in the
  page (cylinder body, domed lid, valve, handles). A round gauge on the lid (needle + three coloured arcs).
- **Each active viewer is a 3D figure** from the shared figure system, standing in up to two rings around the fire
  (16 / 32 places; further contributors are counted in PANO but share the 48 figures by recency). An odun makes that
  viewer's figure do a throw; a small log arcs into the fire; the flames grow with pressure.
- Name tags and avatar discs come from the overlay layer: the 8 most recently active plus the current top contributor.
- Above the pot (DOM): the big shared number `%62` (150px) — the room's common goal.
- The lid rattle, steam puffs at the whistles and the lid launch at the climax are 3D transforms on a time clock.
- PANO: "OCAKBAŞI" = this round's contributors, top 6 by contribution, names 54px, a small flame count 30px.
- KOMUT: `💬 YAZ → BİR ŞEY · ❤️ BEĞEN → ATEŞİ HARLA`.

### C3. Action table

| Viewer action | Effect | Shown |
|---|---|---|
| Any chat message (text is discarded) | 1 "odun": spends one of the viewer's tokens, adds pressure (C4) | Their flame jumps; first action of the round: name in the SPİKER line |
| Chant word "fokur" (also "fokur fokur") | Same as a message, plus the pot visibly rattles; counts as 1.5 odun | Fixed label "FOKUR!" above their flame (a game string, not their text) |
| Like | Batched: every 10 likes = 1 odun, same token limit | Heart rises from their flame |
| Follow | Joins with a full token bucket | SPİKER: "<ad> ocağa katıldı" |
| Gift < 10 diamonds — "ODUN" | +2 pressure outside the personal cap; thank-you banner | ULTI banner, name big |
| Gift 10–99 — "KÖRÜK" | For 8 s every viewer's odun counts ×1.5 | Banner + bellows animation; name on the bellows |
| Gift 100–999 — "ÇİFTE KÖRÜK" | Same for 15 s | Same, gold |
| Gift ≥ 1000 — "ALTIN KEPÇE" | Körük 20 s + a gold ladle badge next to their name for the stream | Banner, confetti once |

Gift rules: streak ticks ignored; gifts add at most 25 pressure per round in total; a gift is never applied when
pressure ≥ 95 (it is queued and applied to the next round, with the thank-you shown now) so a gift cannot be the action that pops it.
Gifts do not count toward USTA AŞÇI.

### C4. Pressure, pacing and anti-solo
- Pressure P is 0–100. Each viewer has a bucket of 3 tokens, refilling 1 per 4 s.
- One odun adds `Δ = 55 / max(6, A)` where A = distinct contributors this round (bots count).
- **Personal cap: a viewer's odun can add at most 30 pressure per round.** One person can never pass 30 alone.
- Leak: after 4 s without any odun, P falls 1.5 per second (never below the last whistle threshold reached).
- Whistles at 33 and 66: short whistle, steam puff, the threshold becomes the new floor, SPİKER names the three
  top contributors so far.
- At 100: "TİTRİYOR" for 3 s (lid rattles, input still counts for USTA AŞÇI), then the pop.
- Round limit 150 s. If P < 100 at the limit the cooker "kıvamında pişti": the lid opens with steam, no burst,
  and the same card is shown. So every round ends within ~165 s and the hub always gets its boundary.
- Target feel: 5 viewers pop it in ~70 s, 50 viewers in ~45 s, 2 viewers need the bots and take ~120 s.

### C5. Climax staging
1. t=0: the lid launches up out of frame, the pot shakes, burst sound, a steam column (instanced quads), figures
   throw their arms up.
2. Contributors' avatar discs (overlay layer) fly out of the pot in an arc and settle in PANO order (up to 12).
3. t=0.9 s: `Finis.kart(kazananEl, { kupa: '👨‍🍳', isim: <USTA AŞÇI>, alt: 'usta aşçı · N odun · M kişi pişirdi' })`.
   Finis plays the victory sound; the game plays none.
4. Small line under the card: "son odun: <ad>" (30px).
5. `TT.soyle('🍲 Düdüklü patladı! Usta aşçı: @<uid> — M kişi birlikte pişirdi 🎉')` (not for bots, not in the demo).
6. 10 s later: `parent.postMessage({ tt: 'tur-bitti' }, '*')`, new round, next dish name (cosmetic rotation:
   kuru fasulye, nohut, etli pilav, dolma, aşure).

### C6. Empty room
With 0 real viewers, 6 demo bots (`Kimlik.bot`, 🤖 names) feed the pot slowly so a round pops in ~100 s;
with 1–3 real viewers, bots fill up to 4 contributors. Bots never win USTA AŞÇI if any real viewer contributed,
never go to `TT.soyle`, never enter `Profil`.

### C7. Sounds (additive only)
New in `ses.js`: recipes `fokur` (two low sine blips), `duduk` (sine 1900→2500 Hz, 0.5 s, tremolo), `patla`
(sawtooth 220→40 Hz sweep + square click), and a music pattern `tencere` (bpm 104, 8-step arrays like the four
existing ones; `Ses.muzikTempo` raises it with pressure). Nothing existing may change:
`node ses-karsilastir.js` must exit 0.

### C8. Words
Allowed vocabulary: odun, ateş, körük, fokur, düdük, basınç, pişir, usta aşçı, kepçe. Forbidden everywhere visible:
bahis, şans, oran, ödeme, kazanç, çekiliş, ikramiye, tahmin (this is not a guessing game).

---------------------------------------------------------------------------------------------------

## G. 3D core (shared by halay and the new game)

### G1. Engine and packaging
- **Three.js, MIT, vendored**: npm package `three`, pinned to **0.170.0**, file `build/three.module.min.js`
  (692 KB) copied to `overlays/_shared/vendor/three.module.min.js` together with the package's `LICENSE` as
  `overlays/_shared/vendor/THREE-LICENSE.txt` and a one-line `SURUM.txt` (version + npm tarball integrity). No CDN.
- It is an **ES module**. 3D pages load it with `<script type="module">`; the shared classic scripts (tt.js,
  finis.js, …) keep loading as classic scripts before it and stay available as globals.
- Serving: the bridge already sends `.js` as `text/javascript`, which module scripts require; keep the `.js`
  extension (the MIME table has no `.mjs`). `paketle.js` embeds every file under `overlays/`, so the exe grows by
  about 0.7 MB (of ~90 MB) with no build change. Module scripts do not load from `file://`; 3D pages are bridge-only.
- Verified here: the module imports from a static server in headless Chromium and renders 150 instanced figures
  (4 draw calls, 54k triangles) — see G5 for the numbers.

### G2. Module `overlays/_shared/sahne3d.js` (the only file games import)
```
import { Sahne3D, THREE } from './_shared/sahne3d.js';
const s = Sahne3D.kur({ kap: <element>, tema: 'meydan' | 'ocakbasi', enCokFigur: 150 });
s.figur.ekle(kid, { renk, baslik: 'kasket' | 'yazma' | 'yok', bot: false })   // rounded capsule body + sphere head + cap/headscarf
s.figur.cikar(kid)
s.figur.yerlestir(kid, { halka, sira } | { x, z }, { sureMs })                // eased move, time-based
s.figur.hareket(kid, 'adim' | 'zipla' | 'kollar' | 'at' | 'mendil', { sureMs })
s.figur.isaret(kid, 'hale' | 'mendil' | null)                                 // halay başı
s.halka.ayarla([{ yaricap, kapasite, yon }])                                  // rings; step phase from s.saat
s.saat.bagla(() => Ses.muzikSaat && Ses.muzikSaat())                          // music clock; falls back to performance.now
s.ekran(kid) -> { x, y, olcek, gorunur }                                      // head position in design px (1080×1920)
s.etiket.ayarla([{ kid, ad, oncelik, avatarUrl, altin }])                     // overlay layer, see G3
s.sahne, s.kamera                                                             // for page-built props (pot, platform, garland)
s.kalite -> 'tam' | 'orta' | 'dusuk' | 'yok'                                  // see G4
s.olcum() -> { kalite, figur, cizimCagrisi, ucgen, jsMs, kareMs, pikselOrani, webgl }   // test hook
```
Rules for the core: one `InstancedMesh` each for bodies, heads, headgear and blob shadows (per-instance colour);
`MeshLambertMaterial` (or toon) only; one hemisphere + one directional light; **no real shadows, no post-processing**;
all animation from the clock (dt), never per-frame steps; the renderer is capped at 30 fps; nothing is allocated per frame.
Shared props built once in the core because both games use them: ground disc, sky gradient, kilim garland along the
top. Game-specific props (pot, platform, davul) are built by the game page from `THREE` primitives.

### G3. Avatars and names without a proxy (decision)
**No avatar proxy.** WebGL textures from TikTok's CDN need CORS headers we do not control; a proxy in the bridge
would be a new fetch-any-URL surface on a server we just hardened. Instead the core owns a **transparent Canvas2D
overlay** exactly on top of the WebGL canvas:
- each frame it projects every figure's head with `s.ekran(kid)` and draws the avatar as a round disc
  (`drawImage` from a plain `<img>`, no `crossOrigin`; a tainted 2D canvas is fine because nothing reads pixels);
  back-to-front order; if an avatar fails to load the figure keeps its plain 3D head;
- name tags are drawn on the same overlay: 40px minimum, pill background, priority list from `etiket.ayarla`,
  overlapping tags dropped by priority; tags never enter the forbidden zones of A2;
- viewer names reach the overlay only through `fillText` (no HTML); chat text never reaches it except through the
  game's `balonMetni` gate (halay) — the core has no API that takes free text.
Upgrade path if faces-on-3D-heads are wanted later: a strict proxy (TikTok CDN host allowlist, loopback only, size
and time limits, cache, no cross-host redirects) — a separate, separately reviewed task. Not in this plan.

### G4. GPU detection and fallback
The streamer uses OBS, whose browser source is hardware-accelerated by default. TikTok LIVE Studio's embedded
browser has no GPU. The core decides at start and keeps measuring:
1. `tam`: WebGL2 context created, renderer string is not SwiftShader/llvmpipe → pixel ratio 1, up to 150 figures.
2. `orta`: average frame time over 3 s above 40 ms → pixel ratio 0.66, blob shadows off.
3. `dusuk`: still above 40 ms, or a software renderer was detected at start → pixel ratio 0.5, at most 60 figures
   drawn (the rest are counted and listed, not drawn), render at 20 fps.
4. `yok`: no WebGL, context lost twice, or `dusuk` still above 80 ms → the 3D canvas is hidden and the page shows
   its **DOM-only view**: the shell's ÜST / KOMUT / SPİKER / PANO plus a large coşku (or pressure) meter and the
   name boards in SAHNE. Every game mechanic keeps working; only the stage picture is gone.
   `?3d=0` forces this view; `?kalite=dusuk|orta|tam` forces a tier (for tests).
The page never changes tier more than once per 10 s and never goes back up within a round. CSS `lite` rules do not
affect canvas drawing; `?lite=1` stays on for the DOM.

### G5. Performance budget and how it is measured
Absolute fps cannot be judged in this sandbox: headless Chromium has WebGL only through SwiftShader (software).
Reference measured here with a bare scene (150 instanced figures, 1080×1920, pixel ratio 1): **55 ms per frame,
1.0 ms of JavaScript, 4 draw calls, 54k triangles** on SwiftShader. Acceptance numbers, read from `s.olcum()`:

| Metric (150 figures, tier `tam`) | Limit |
|---|---|
| Draw calls per frame | ≤ 40 |
| Triangles per frame | ≤ 160,000 |
| JavaScript per frame (update + overlay) | ≤ 6 ms average, ≤ 12 ms p95 |
| SwiftShader frame time, pixel ratio 1 | ≤ 90 ms average (bare-scene reference is 55) |
| SwiftShader frame time, tier `dusuk` | ≤ 45 ms average |
| JS heap after 4 short rounds | flat within 10 % (no per-frame allocation) |
| Tier logic | forced slow frames step `tam → orta → dusuk → yok` in order; DOM-only view works with `?3d=0` |

The real check is on the streamer's PC: one line in the panel/console showing tier and frame time (section F).
Test discipline: one browser, runs of at most 60 s, no soak longer than 4 short rounds until the final acceptance.

### G6. Look
Warm and readable: evening village square (or wedding-hall floor) in the project's purple/gold palette, kilim-pattern
diamond garland along the top, round wooden platform with davul and zurna players, lantern-coloured ground glow under
the rings. Figures: rounded capsule body in the viewer's identity colour, sphere head, kasket or yazma (alternating by
hash of the viewer id), halay başı with a white mendil. For the new game: the same square with a stone hearth and the
cooker in the centre.

---------------------------------------------------------------------------------------------------

## D. Work breakdown and file ownership

Ports: adviser 9061–9069. Workers as listed. One Chromium at a time per worker; no background loops.

### Phase 0 — adviser (before phase 1 is delivered)
Extend the kit (section E). Files only in `scratchpad/danisman/`.

### Phase 1 — two workers in parallel: "S" (shell, ports 9070–9072) and "K" (3D core, ports 9079–9081).
Owns: `overlays/_shared/tt.js`, `overlays/_shared/oyun-tema.css`, `overlays/_shared/base.css`,
`overlays/_shared/finis.js`, `overlays/_shared/spiker.js`, `overlays/_shared/ulti.js`, `overlays/_shared/juice.js`,
`overlays/oyun.html`.
Must not touch: any game page, `ses.js`, `server/`, `README.md`, `index.html`.
Worker K owns: `overlays/_shared/vendor/` (new: `three.module.min.js`, `THREE-LICENSE.txt`, `SURUM.txt`),
`overlays/_shared/sahne3d.js` (new), `overlays/sahne3d-deneme.html` (new demo/test page).
K must not touch anything else (no shell file, no game page, no `server/`). K codes against the boxes of A3 as
constants until S lands, then switches to `TT.KUTU`.
Phase 1 is done when the adviser accepts both; the four games will look broken in portrait at that point — that is expected.

### Phase 2 — parallel, after phase 1 is accepted

| Worker | Owns (and nothing else) | Port |
|---|---|---|
| G1 | `overlays/bilye.html` | 9073 |
| G2 | `overlays/bilgi.html`, `overlays/pk.html` | 9074 |
| G3 | `overlays/at.html` | 9075 |
| G4 | `overlays/halay.html` → 3D rings (starts only after worker C's change is accepted and phase 1 is accepted) | 9076 |
| G5 | `overlays/tencere.html` (new, 3D), `overlays/_shared/ses.js` (additions only), `overlays/oyun.html` (only the `OYUNLAR` entry `tencere`, not the default rotation) | 9077 |
| G6 | `overlays/index.html`, `README.md`, the console banner text in `server/bridge.js` (strings only) | 9078 |

If a phase-2 worker needs a shell or 3D-core change, it reports the need; it does not edit those files.
G4 and G5 are the two heaviest tasks; G1–G3 and G6 are small. Suggested order if workers are limited: G4 and G5 first.

### Brief: common block (prepend to every worker brief)

```
You work in /home/user/tiktok-deniyorum on TikTok LIVE chat games for a Turkish streamer.
Do NOT commit, checkout, reset, stash or clean. Edit only the files listed under OWNS. If you need a change
elsewhere, stop and report it.
Read first: /tmp/claude-0/-home-user-tiktok-deniyorum/641b8bd3-baa8-54a7-9936-ea040ee0b2a8/scratchpad/danisman/PLAN-DIKEY.md
(sections A and your part of B/C). It is the spec; where your brief and the plan disagree, the plan wins.

House rules — every one is checked by the adviser's kit:
1. Canvas 1080x1920. All text inside x 60..1020. Nothing but background in: y<240; x<540 with y>1250; y>1760.
2. No text under 30px (DOM or canvas). Viewer names 54px in lists; a long name shrinks to 40px, then wraps; never "…".
   Test names of 3, 12, 20 and 28 characters.
3. Production runs with ?lite=1, which forces filter, box-shadow, text-shadow, backdrop-filter and mask-image to none.
   Animate only transform and opacity. No infinite scale animation on text.
4. OBS renders at 30 fps: motion is time-based (dt or a clock), never per-frame steps.
5. Viewer strings (names) go to the DOM with textContent only. A viewer's chat text is NEVER shown: comments are
   triggers. Only fixed game labels, names, numbers and game-chosen emoji appear.
6. Finis.kart plays the victory sound itself; do not play another.
7. No betting or chance words in anything a viewer can see (bahis, oran, ödeme, şans, kumar, çekiliş, ikramiye).
   A gift never changes who wins and never buys a chance outcome. Ignore gift events with gift.streaking === true.
   No gift is silently dropped: every gift shows the sender's name.
8. Keep the round boundary: at the end of each round post {tt:'tur-bitti'} to the parent, as today.
9. Testing: page-internal mock is ?mock=1 (see overlays/_shared/tt.js); inject events with TT.fire(ev).
   Serve the repo statically on YOUR port only. Chromium: require('playwright'),
   chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] }).
   ONE browser at a time, close it before starting another, no long background loops (the container restarted
   twice today under parallel Chromium load). Never connect to TikTok or EulerStream.
10. Put scripts, logs and screenshots in your own scratch folder (given below), never in the repo.

When done, report: files changed with line ranges; what you tested and the numbers; screenshots at 1080x1920 and
downscaled to 390px wide for each game state; every deviation from the plan; every open question.
```

### Brief: worker S (phase 1)

```
OWNS: overlays/_shared/tt.js, oyun-tema.css, base.css, finis.js, spiker.js, ulti.js, juice.js; overlays/oyun.html.
SCRATCH: …/scratchpad/isci-s/   PORTS: 9070-9072
TASK: build the portrait shell exactly as PLAN-DIKEY.md section A.
- tt.js: portrait default; html.tt-dikey / html.tt-yatay (?yatay=1); --tt-olcek = min(w/1080, h/1920) in portrait
  and the old formula in landscape; TT.dikey, TT.TUVAL, TT.KUTU; ?guvenli=1 shades the four forbidden zones;
  #katilCagri becomes the horizontal KOMUT strip (keep ids kcKomut, kcIzSay, kcSonYazan working; kcSonYazan
  now writes through Spiker).
- oyun-tema.css / base.css: the boxes of A3 as CSS variables and default placement for #ust, #katilCagri, #akis,
  #kazanan; the type scale of A4; every existing landscape rule kept but scoped under html.tt-yatay.
- finis.js: card in box KAZANAN; name 110px -> 56px, then wrap (no ellipsis); confetti inside the #kok box.
- ulti.js: banner centred on y=316 design px, sizes scaled by --tt-olcek, name 64px / label 30px. Keep the queue rule.
- spiker.js: 36px line, names 40px. juice.js: canvas sized to the scaled #kok box.
- oyun.html: full-window iframe; the "birazdan" badge shown inside the KOMUT box for the last 45 s.
DO NOT touch game pages or ses.js. The games will look wrong in portrait after your change; that is expected.
They must still load without console errors in portrait, and look unchanged with ?yatay=1 at 1920x1080.
SELF-CHECK: a blank test page in your scratch folder that uses the shell (#kok.tt-oyun with #ust, #akis, #kazanan)
at 1080x1920 and at 390x693; ?guvenli=1; Finis.kart with 3/12/20/28-character names; ULTI banner; ?yatay=1 at 1920x1080
for at.html compared with a screenshot taken before your change.
```

### Brief: worker K (phase 1, 3D core)

```
OWNS: overlays/_shared/vendor/ (new), overlays/_shared/sahne3d.js (new), overlays/sahne3d-deneme.html (new).
SCRATCH: …/scratchpad/isci-k/   PORTS: 9079-9081
TASK: build the shared 3D core exactly as PLAN-DIKEY.md section G (G1 packaging, G2 API, G3 overlay layer,
G4 tiers and DOM-only fallback signal, G5 budget, G6 look).
1. Vendor Three.js: in your scratch folder run `npm pack three@0.170.0`, copy build/three.module.min.js and LICENSE
   into overlays/_shared/vendor/ (names in G1), write SURUM.txt with the version and the tarball's sha512 integrity
   from `npm view three@0.170.0 dist.integrity`. Do not add node_modules or any other build file to the repo.
2. sahne3d.js: an ES module exporting { Sahne3D, THREE } with the API of G2. InstancedMesh for bodies, heads,
   headgear, blob shadows; Lambert materials; two lights; no shadows, no post-processing; 30 fps cap; time-based
   animation from s.saat; zero allocations per frame.
3. Overlay layer (G3): a Canvas2D on top; avatar discs from plain <img> (no crossOrigin attribute); name tags
   40px minimum with overlap dropping; nothing drawn in the forbidden zones (plan A2). Names only via fillText.
   The core must expose NO function that accepts free chat text.
4. Quality tiers and fallback (G4): detection, stepping rules, s.kalite, an event 'kalite' the page can listen to,
   ?3d=0 and ?kalite= overrides, WebGL context-loss handling.
5. s.olcum() test hook (G2).
6. sahne3d-deneme.html: a demo page using the shell (#kok.tt-oyun) with buttons/URL params to place 12 / 50 / 100 /
   150 figures in three rings, trigger each hareket, toggle tiers, show s.olcum() live. This page is also the
   streamer's GPU check, so print tier, renderer name and average frame time in 34px text inside SAHNE.
SELF-CHECK (one Chromium, runs under 60 s, launch with args ['--no-proxy-server', '--enable-unsafe-swiftshader']):
150 figures: draw calls, triangles, jsMs avg/p95, SwiftShader frame time at tier tam and dusuk (limits in G5);
forced slow frames walk tam -> orta -> dusuk -> yok in order; ?3d=0 shows no canvas and no errors; avatar URL that
404s leaves the plain head; a 28-character name tag stays inside x 60..1020; heap flat over 4×30 s.
Also confirm the bridge serves the module: start `node server/bridge.js --port 9079 --no-80` (no username = test
mode, never connects anywhere) and load http://localhost:9079/overlays/sahne3d-deneme.html.
```

### Brief: workers G1–G3 (phase 2, 2D games to portrait; one per row of the table)

```
OWNS: <files from the table>.   SCRATCH: …/scratchpad/isci-<g1..g3>/   PORT: <from the table>
TASK: convert your game(s) to the portrait shell: PLAN-DIKEY.md section B, your game's paragraph, and section A
for the boxes. Use TT.KUTU / the --dk-* variables; do not hard-code box numbers. SAHNE is 960x672, PANO is 460x490.
Remove your page's own header command chip and any right-column assumptions; the shell provides ÜST, KOMUT, SPİKER
and KAZANAN. Write all new rules under html.tt-dikey; leave the existing rules working under html.tt-yatay.
Game logic, scoring, storage keys and URL parameters must not change. (G3: the reviewed gift rules stay exactly
as they are: thank-you banner with the name as the big line, capped race cheer, streak ticks ignored.)
(G2: pk's gift banner must show the viewer's name as the big line with a neutral label, like at.html line ~703.)
SELF-CHECK per game: 25 s with ?lite=1&mock=1 at 1080x1920: no console errors, no NaN/undefined; ?guvenli=1
screenshot with nothing in the red zones; text-size scan (nothing under 30px); the four name lengths in every list
and on the winner card; one full round to the tur-bitti message.
```

### Brief: worker G4 (halay in 3D)

```
OWNS: overlays/halay.html.   SCRATCH: …/scratchpad/isci-g4/   PORT: 9076
START only when the orchestrator says worker C's change is accepted AND phase 1 (shell + 3D core) is accepted.
TASK: replace halay's RENDERING and LAYOUT with the 3D rings of PLAN-DIKEY.md section B "halay" on the shared core
(section G). Portrait only; delete the landscape rules and the old Canvas2D figure drawing.
KEEP UNCHANGED (they are reviewed and tested): adEsle, komutCoz, sade/katla, tezahurat and its token rule, the
invitation queue and cooldowns (ortaIste, ortaKabul, 15 s accept window, cap 5), coşku maths, hediyeAl and its
queue, greeting strips, demo bots, round end (Finis.kart, TT.soyle, tur-bitti), window.Halay.ozet() and its fields,
URL parameters. balonMetni() stays the ONLY gate for message-derived bubbles; draw a bubble only with its return
value, through the core's overlay; no other code may read ev.comment for display.
CHANGE: capacity 60 -> 150 in three rings (24/40/86), numbers 1..150; duet/solo on the central platform with the
DOM name card; halay başı = hale + mendil; tags and avatar discs via s.etiket; coşku strip and boards per the plan;
small gift (<10) = "TEMPO" boost, top tier (>=1000) adds "MEYDAN GÖSTERİSİ" (8 s) — exact rules in section B.
Fallback: listen to the core's 'kalite' event; at 'yok' (or ?3d=0) show the DOM-only view (large coşku meter and
the boards in SAHNE); every mechanic must still work there.
SELF-CHECK: the common checks, plus: window.Halay.ozet() still answers the adviser's halay-kit (invitation by
@name and number, accept, timeout, cooldowns, queue cap, gift queue); 150 simulated viewers: s.olcum() within G5;
?3d=0 full round with no errors; 20 distinctive chat strings never appear on screen; one full song to tur-bitti.
```

### Brief: worker G5 (new game, 3D)

```
OWNS: overlays/tencere.html (new); overlays/_shared/ses.js (ADD ONLY: new recipes fokur, duduk, patla and a new
pattern 'tencere'; do not change one existing line); overlays/oyun.html (ONLY add the entry
tencere: { dosya: 'tencere.html', ad: 'Düdüklü', ikon: '🍲' } to OYUNLAR; do not change the default rotation).
SCRATCH: …/scratchpad/isci-g5/   PORT: 9077
TASK: build "DÜDÜKLÜ" exactly as PLAN-DIKEY.md section C (C2 screen, C3 action table, C4 numbers, C5 climax order,
C6 empty room, C7 sounds, C8 words) on the shared 3D core (section G): figures from s.figur, tags from s.etiket,
the cooker, hearth, logs and steam built in your page from THREE primitives (instanced where repeated).
Model the page structure on overlays/halay.html (shell usage, Kimlik bots, Profil, Finis, round boundary).
Portrait only. At core tier 'yok' or ?3d=0 show the DOM-only view: the big pressure number, a wide pressure bar
and the OCAKBAŞI board in SAHNE; every mechanic must still work.
Expose a read-only window.Tencere.ozet() returning { durum, tur, basinc, kalanSn, katilanlar:[{kid, ad, odun, pay}],
hediyeBasinc, koruk:{kalan}, ustaAsci } for the adviser's tests.
SELF-CHECK: (1) one viewer alone, acting as fast as allowed for 150 s, never exceeds 30 pressure of own contribution
and the pot does not pop without other contributors; (2) 5, 20 and 60 simulated viewers: time to pop;
(3) a gift at pressure 96 does not pop the pot and its thank-you is shown at once; (4) 12 gifts in 1 s, biggest first:
the biggest sender's name is shown; (5) a round always ends within 165 s and posts tur-bitti;
(6) chat text with <img onerror>, 300 characters, RTL marks: nothing of it appears anywhere;
(7) node …/danisman/ses-karsilastir.js exits 0; (8) a 60 s run: no console errors; (9) s.olcum() within the
limits of G5 with 48 figures; (10) ?3d=0 full round with no errors.
```

### Brief: worker G6 (docs and panel)

```
OWNS: overlays/index.html, README.md, server/bridge.js (console banner STRINGS only, no logic).
SCRATCH: …/scratchpad/isci-g6/   PORT: 9078
TASK: update everything the streamer reads to portrait: 1080x1920 in the panel's URL hints and preview frames
(9:16 thumbnails), README install/OBS section replaced with PLAN-DIKEY.md section F verbatim, the bridge banner's
"(1920x1080, tek link)" line, mention of ?yatay=1 as the temporary way back, a panel card for Düdüklü (opt-in via
?oyunlar=…,tencere) and for Halay. No viewer-visible game text is in your files; keep the README's reviewed
sentences about gifts and security unchanged.
```

---------------------------------------------------------------------------------------------------

## E. Acceptance tests (adviser kit, portrait)

New script `dikey-kit.js` plus portrait switches on the existing ones. All at viewport 1080×1920 with `?lite=1`.

| Test | Rule | Applies to |
|---|---|---|
| Safe-zone intrusion | No visible text node (DOM) intersects the four forbidden zones; for canvases, the `?guvenli=1` screenshot is pixel-checked: inside the zones only background colours may change between two frames 2 s apart | phase 1 test page; every game |
| Text floor | Effective font size ≥ 30px for every visible text node; names in lists ≥ 40px | all |
| Truncation | Names of 3 / 12 / 20 / 28 characters appear in full somewhere on screen in every state; no `text-overflow: ellipsis` hit on a name | all |
| Phone screenshots | Each fixed moment saved at 1080×1920 and at 390×693; reviewed by eye for the four moments that matter per game | all |
| `regress.js` (portrait) | No console/page errors, no NaN/undefined, `#kok` not overflowing, 25 s each | 5 games + new game + hub |
| Landscape smoke | `?yatay=1` at 1920×1080: bilye, bilgi, pk, at load with no errors and no `#kok` overflow | phase 1 and phase 2 |
| `ses-karsilastir.js` | Exit 0: the four games' audio call timelines identical to `BASE`; API a superset | any change to `ses.js` |
| `at-probe.js` | 0 findings (vocabulary, equal rewards, gift feedback, banner geometry against the new header box) | at |
| `halay-kit.js` | All tests pass with portrait boxes; plus: no chat text on screen | halay |
| Hub | Switch only after `tur-bitti`; default rotation unchanged; "birazdan" badge inside the KOMUT box | phase 1; G5 |
| New game | The eight self-checks in G5's brief re-run by me through `Tencere.ozet()`; no-raw-text injection; vocabulary sweep; round ≤ 165 s; lone viewer cannot pop | tencere |
| 3D budget (`s.olcum()`) | Draw calls ≤ 40, triangles ≤ 160k, JS ≤ 6 ms avg / 12 ms p95, SwiftShader ≤ 90 ms at `tam` and ≤ 45 ms at `dusuk`, heap flat over 4 short rounds | sahne3d demo, halay, tencere |
| 3D tiers and fallback | Forced slow frames step `tam → orta → dusuk → yok` in order, never back up within a round; `?3d=0` runs a full round with no canvas and no errors | sahne3d demo, halay, tencere |
| Vendored engine | `three.module.min.js` sha matches the npm tarball for 0.170.0; licence file present; no network request leaves the page (request log) | phase 1 |
| Overlay layer | Tags ≥ 40px, no tag in a forbidden zone, a 404 avatar leaves the plain head, no API accepts free text | sahne3d demo, halay, tencere |
| No raw chat text | For every game: send 20 distinctive comment strings; none may appear in `innerText`, in any canvas text call (canvas `fillText`/`strokeText` are hooked), or in `TT.soyle` | all |

Phase 1 is accepted when the first five rows pass on the shell test page, landscape smoke passes, and the four
3D rows pass on `sahne3d-deneme.html`. 3D runs are kept under 60 s each, one browser, until final acceptance.
Phase 2 is accepted per worker; nothing ships until `regress.js` is green for all games together.

---------------------------------------------------------------------------------------------------

## F. OBS talimatı (kullanıcı için)

1. **Tuvali dikey yap:** OBS → Ayarlar → Video → *Temel (Tuval) Çözünürlük* ve *Çıkış Çözünürlüğü*: **1080x1920**. FPS 30.
2. **Tarayıcı kaynağını ayarla:** oyun kaynağına çift tıkla → *Genişlik* **1080**, *Yükseklik* **1920**.
   Adres aynı kalıyor: `http://localhost:8787/overlays/oyun.html?lite=1`
   (LIVE Studio kullanıyorsan: `http://localtest.me:8787/overlays/oyun.html?lite=1`)
3. Kaynağı tuvale tam oturt: kaynağa sağ tıkla → *Dönüştür* → *Ekrana Sığdır*.
4. **Kontrol et** (yayına çıkmadan önce bir kez): adresin sonuna `&guvenli=1` ekle. Kırmızı gölgeli yerler
   TikTok'un kendi düğmelerinin ve yorumların duracağı yerlerdir; oyunun yazıları kırmızının içine girmemeli.
   Baktıktan sonra `&guvenli=1` kısmını sil.
5. **3D kontrolü (halay ve Düdüklü için):** OBS → Ayarlar → Gelişmiş → *Tarayıcı Kaynağı Donanım Hızlandırmasını
   Etkinleştir* işaretli olsun (varsayılan böyledir). Sonra tarayıcıda şu adresi aç:
   `http://localhost:8787/overlays/sahne3d-deneme.html?kisi=150` — ekranda "kalite: tam" ve 33 ms civarı bir kare süresi
   yazmalı. "dusuk" ya da "yok" yazıyorsa bilgisayarın 3D'yi zor çeviriyor demektir; oyun yine çalışır ama sahne sade görünür. Bunu bize bildir.
6. Telefonundan kendi yayınına bak: izleyici adları rahat okunuyor mu, üstte kanal adın oyunun başlığını kapatıyor mu,
   sol altta yorumlar oyunun bir yerini örtüyor mu? Bir sorun görürsen ekran görüntüsü al.
7. Eski yatay düzene dönmen gerekirse (geçici, yalnızca misket, bilgi, kapışma ve at yarışı için): tuvali ve kaynağı yeniden 1920x1080 yap ve adrese `&yatay=1` ekle.
