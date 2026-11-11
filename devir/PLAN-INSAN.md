# PLAN-INSAN — human characters, avatar faces, automatic zoom, aesthetic pass

Adviser plan, 11 Nov 2026. Research and plan only; nothing here is implemented.
Product after cleanup: `at.html` (2D), `halay.html`, `tencere.html`, hub `oyun.html` (default `at,halay,tencere`).

## 0. Decisions in one page

| Question | Decision | Why |
|---|---|---|
| Rendering path | **(a) Pre-rendered sprites everywhere**, drawn on Canvas2D | Works with no GPU (LIVE Studio worst case) and in OBS; one path |
| Characters | KayKit Adventurers 1.0 (CC0), re-dressed at bake time | Only verified-CC0 animated humanoid pack reachable today |
| Faces | `drawImage` of the profile picture onto the head, straight from the image URL | Display needs no CORS; verified |
| Avatar proxy | **Not built now.** Spec kept in section 6 as a contingency | Needed only if LIVE Studio blocks cross-host images |
| three.js / `sahne3d.js` | Build-time tool only; removed from shipped overlays | No WebGL at run time |
| Zoom | Camera director inside the new stage core; 2D transform of the stage | Section 5 |
| `at.html` human element | Winners' podium with human figures and faces, plus a photo-finish zoom. No riders | Section 7 |
| Aesthetic pass | Token, type, icon and motion changes in the shared shell | Section 2 |

Open facts that can change the plan:
- **LIVE Studio WebGL tier** (streamer is checking). It no longer matters for (a).
- **LIVE Studio "same-host sub-resources"** claim from TERSINE-MUHENDISLIK.md. If true, TikTok CDN avatars will not load there and the section 6 proxy becomes necessary. Ask the streamer one more question: in LIVE Studio, do the small avatar discs in today's halay show real pictures?
- **Avatar pictures shown large are unmoderated viewer imagery.** This is the image version of the "no free chat text" rule. The plan keeps a size cap and a kill switch (section 4.5); the streamer should confirm they want faces on by default.

## 1. Spike results (scratch: `danisman/spike/`)

All at 1080x1920, headless Chromium, machine load 1.2–3.9.

| Path | Scene | Frame cost |
|---|---|---|
| Software WebGL | 150 jointed low-poly humans (instanced parts, 61k triangles, 7 draw calls) | 78–107 ms |
| Software WebGL | same + 4 skinned KayKit heroes, merged to 1 draw call each | 122 ms |
| Software WebGL | same + 8 heroes | 139 ms |
| Software WebGL | 8 heroes alone | 86 ms |
| Software Canvas2D (`--disable-gpu`, accelerated canvas off) | 150 sprites 96x128, depth sort, shadows, face discs, 8 tags, continuous 1x–2.2x zoom | about 10 ms with forced synchronous raster (p95 17 ms) |
| Software Canvas2D | 300 sprites, same | about 10 ms |

- Baking one character (8 directions x 16 frames, 1536x1024 atlas) took 1.5 s and produced a 664 KB PNG.
- Cross-origin image, no CORS headers: draws and displays; `getImageData` and `toDataURL` throw SecurityError afterwards.
- Existing readbacks in the overlays: `kimlik.js:136` and `at.html:314,316` (`toDataURL` on their own pattern canvases), `sahne3d.js:1182` (`readPixels`, test hook). None touches an avatar.

What sprites lose, stated plainly: no free camera orbit; facing snaps to 16 directions; lighting is baked; magnification above about 2x softens unless a larger "hero" cell is baked.

## 2. Aesthetic pass: design-repo rules turned into changes

Sources read as data: pbakaus/impeccable (Apache-2.0; `skill/reference/craft-floor.md`, `animate.md`, `typeset.md`, `colorize.md`) and kylezantos/design-motion-principles (MIT; `references/emil-kowalski.md`, `anti-checklist.md`, `performance.md`). Our lite rule (no filter, shadow, backdrop, mask) overrides their "reach past transform and opacity" advice.

### 2.1 Rules adopted
1. **One authored moment per game**, everything else quiet. Halay: gecenin yıldızı. Düdüklü: the pop. At: the photo finish. (impeccable "one authored moment, not scattered effects".)
2. **Frequency rule** (Emil): events that happen many times a minute get no DOM animation. A chat message moves that viewer's figure on the canvas and nothing else.
3. **Durations:** 100–150 ms feedback, 150–300 ms state change, 300–500 ms banner or card, 500–800 ms only for the authored moment. Exit faster than entrance.
4. **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` for arrivals. No bounce or overshoot on banners, cards or strips. Never animate from `scale(0)`; start at 0.9 or above.
5. **No looping pulse on indicators or text.** Character loops on the canvas are fine.
6. **No stagger**, except the at.html podium once per race.
7. **Drawn icons, not emoji, for interface chrome** (impeccable ban on glyph icons). Emoji stay only in viewer bubbles (the 40-emoji allowlist) and in chat-bot text.
8. **One elevation device:** border or fill step, never border plus shadow. Card radius 16px; pills only for small chips.
9. **No gradient text, no glow, no side-stripe borders, no striped or grid backgrounds.**
10. **Type:** Outfit only (already self-hosted). Fixed role scale. Tracking no tighter than −0.03em. `font-variant-numeric: tabular-nums` on every counter and timer. `text-wrap: balance` on card names.
11. **Colour:** one accent per game owns one region (the ÜST band). Secondary text is tinted from the panel hue, not grey. Contrast at least 4.5:1 for 30px text, 3:1 for 54px and larger.
12. **Copy:** controls name their action; the product's own words.

### 2.2 Changes per surface

| Surface | File | Change |
|---|---|---|
| Tokens | `oyun-tema.css` | Role scale 150 / 72 / 54 / 40 / 30 as the only sizes; radius token 16; one motion token set (`--sure-geri`, `--sure-durum`, `--sure-kart`, `--sure-an`, `--egri`) and every keyframe uses it; secondary-text token derived per panel |
| Icons | new `_shared/ikon.js` (inline SVG, one 3px stroke) | Replace emoji in ÜST badge, timer, KOMUT strip, PANO headers, coşku and pressure labels, legend chips |
| ÜST band | `oyun-tema.css` | Keep as the single accent region; counter in tabular numerals; no animation on number change |
| KOMUT strip | `oyun-tema.css` | Text swap by opacity only, 150 ms; remove `komutDegis` scale |
| Spiker line | `spiker.js`, `oyun-tema.css` | Keep 16px slide; exit 150 ms, entrance 250 ms |
| Gift banner (ULTI) | `ulti.js` | Entrance from scale 0.96 + opacity, 300 ms, no overshoot; minimum on-screen time 800 ms (fixes the 380 ms note); one emoji-free icon |
| Winner card | `finis.js` | The authored moment: name arrives 600 ms, sub-line 250 ms later; confetti only here |
| PANO | game pages | Rows change without animation; the leader row is marked by a fill step, not a border stripe |
| Halay | `halay.html` | Confetti removed from TAKI TÖRENİ (kept for gecenin yıldızı); coşku band label uses icon |
| Düdüklü | `tencere.html` | Remove `titrek` infinite animation on `#bDurum` (tencere.html:36); the pot itself shakes instead |
| At | `at.html` | `dortnal` loop stays (character); lane labels to role scale; podium is the only stagger |
| Panel | `index.html` | Same tokens; no scope beyond colours and type |

## 3. Characters and assets

### 3.1 Choice
- **KayKit Adventurers 1.0**, github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0. `LICENSE.txt` in the clone states CC0. Five GLB characters (Rogue, Rogue_Hooded, Mage, Knight, Barbarian), about 3.6 MB each.
- Measured on Rogue: 4,263 triangles without weapons, 41 joints, one 16 KB palette PNG, 76 clips including Walking_A/B/C, Cheer, Idle, Interact, Throw, PickUp, Sit_Floor_*, Running_A.
- Weapons and cape are separate non-skinned meshes; the bake tool deletes them.

### 3.2 Making them fit the theme (all at bake time)
- Recolour through the palette texture: skin tones, hair, and a neutral grey "outfit" region that the runtime tints (section 4.3).
- Add our own simple meshes parented to bones: kasket and yazma on `head`, mendil on `hand.r`, apron on `chest`, chef hat on `head`, ladle on `hand.r`.
- Halay pose: a bake-time override on the arm bones (arms out at shoulder height) layered on Walking_A, so neighbours read as linked.
- Body set: 4 bodies (2 from Rogue/Mage builds, 2 from Barbarian/Knight builds with helmets removed). If helmets cannot be removed cleanly, ship 3.

### 3.3 Other sources
| Source | Status from here | Note |
|---|---|---|
| Quaternius Ultimate Animated Character Pack (chef, casual, worker; glTF) | Page says CC0; Google Drive download refused with "quota exceeded" | Best theme fit. Bake tool stays asset-agnostic; retry, or the streamer downloads it |
| KayKit Restaurant Bits, City Builder Bits | Repos reachable; licence files not read yet | Candidate props for Düdüklü; worker M reads the licence before use |
| Kenney, poly.pizza | 403 through the proxy | Not usable |
| three.js RobotExpressive | Reachable, CC0 | A robot; rejected |

### 3.4 Where assets live
- Source GLBs, licences, three.js and its loaders: `tools/sprite-pisir/` (build-time only, not packed into the exe).
- Shipped: `overlays/_shared/sprite/*.png`, `*.json`, `LISANS-KAYKIT.txt`.
- Shipped size budget: 12 MB for all atlases. `overlays/_shared/vendor/three.module.min.js` (692 KB) leaves the exe.

## 4. Rendering architecture: `overlays/_shared/sahne2d.js`

### 4.1 Layers
1. Background canvas (static, redrawn only on resize): sky, bunting, floor, platform. Baked as one PNG per theme by the bake tool.
2. Stage canvas, full 1080x1920, redrawn at 30 fps: shadows, crowd, props, heroes, faces, effects.
3. Tag canvas (screen space, never scaled by zoom): name tags, bubbles, avatar discs.
4. DOM shell above, unchanged: ÜST, KOMUT, PANO, AKIŞ, cards.

### 4.2 Atlases (format fixed here so workers M and C can start together)
- **Crowd atlas**, one per body: cell 72x96, 16 directions of which 9 are baked and 7 mirrored, clips `adim` 8 frames, `sevinc` 8, `dur` 4, `at` 6. 9 x 26 cells.
- **Outfit mask atlas**, one per body, same layout, greyscale shading of the tintable outfit region with alpha.
- **Hero atlas**, one per body: cell 192x256, 3 directions (front, ±45°), clips `adim` 8, `sevinc` 8, `dur` 4.
- **Sidecar JSON** per atlas: cell size, clip table, and for every cell the head anchor `{x, y, r, gorunur}` and hand anchor `{x, y}`.
- Camera pitch 32°, orthographic, fixed for every atlas and for the background.

### 4.3 Per-viewer variety
- Body chosen from `Kimlik` hash.
- Outfit colour: `Kimlik` colour quantised to 8 hues. On first use the core builds a tinted outfit canvas for (body, hue) with `source-in` + `multiply` on our own same-origin mask, and caches it (LRU 16).
- Two `drawImage` calls per figure: base, tinted outfit. Worker C measures this against 4 x 8 pre-baked atlases and keeps the cheaper one within the RAM budget (decoded atlases at most 150 MB).

### 4.4 Heroes
- At most 6 at once: halay başı, the duet pair, top gifter of the song, gecenin yıldızı; usta aşçı and the körük sender in Düdüklü.
- A hero is drawn from the hero atlas at its place in the scene. In a close-up shot the same sprite is drawn at stage centre at up to 2x (section 5).

### 4.5 Faces
- Source: the viewer's avatar URL as delivered by the bridge; `Image` with `referrerPolicy = 'no-referrer'`, no `crossOrigin` attribute.
- On load, draw once into a per-viewer 96px disc canvas (circle clip). That canvas is tainted and is only ever drawn, never read.
- Each frame: if the cell's head anchor is `gorunur`, draw the disc at the anchor, scaled to the head radius. Painter's order (figure, then its own face) gives correct occlusion.
- Who gets a face: every hero, and every figure that currently has a name tag. Other figures keep the baked face.
- Fallback when there is no picture or it fails: the `Kimlik` pattern disc with the first letter of the name.
- Limits: face diameter on screen at most 140px; `?yuz=0` turns faces off; the panel gets one "yüzleri gizle" switch that sets it.
- **Hard rule for every worker:** an avatar image is never drawn into a canvas that is later read (`toDataURL`, `getImageData`, `toBlob`, WebGL upload).

### 4.6 API (kept close to `sahne3d.js` so the game logic survives)
```
Sahne2D.kur({ kap, tema: 'meydan' | 'ocak', enCokFigur })  ->  s
s.figur.ekle(kid, {renk, bot}) / cikar / yerlestir / hareket / isaret / sayi / liste
s.figur.kahraman(kid, true|false)          // hero sprite on or off
s.figur.yuz(kid, url|null)                 // face source
s.halka.ayarla / hiz     s.saat.bagla / tempo
s.etiket.ayarla(liste)   s.simge(kid, parcalar, o)   s.simge.tablo(obj)
s.kamera.cek(cekim)      s.kamera.durum()  // section 5
s.ekran(kid)             s.olcum()         s.deneme.*
window.__sahne  (and window.__sahne3d as an alias for the kit, one release)
```
- No quality tiers. One knob: if the 2-second average frame cost exceeds 28 ms, the stage drops to 20 fps and says so in `s.olcum().kip`.
- `?3d=0` is kept as an alias for the plain DOM view each game already has; it remains the answer when Canvas2D itself fails.

### 4.7 Budgets (kit limits, software Canvas2D, 1080x1920)
- 150 figures, 6 heroes, 8 tags, a zoom in progress: forced-raster frame cost at most 20 ms average, 33 ms p95.
- Page JS at most 4 ms average per frame.
- Heap flat over two songs; decoded atlases at most 150 MB.

## 5. Camera director

### 5.1 Shot model
`s.kamera.cek({ ad, hedef: kid | {x, y}, olcek, sureMs, oncelik, yakin: true|false })`
- **Stage zoom:** the stage canvas content scales around the target, 1.0 to at most 1.6. Ease in 500 ms with `cubic-bezier(0.16, 1, 0.3, 1)`, hold, ease out 350 ms.
- **Close-up (`yakin`):** stage zooms to 1.3 and dims with a flat 45% fill; the target's hero sprite is drawn at stage centre at up to 2x with its face and its name at 54px under it. This is the one high-impact moment.
- The tag canvas and the DOM shell do not scale. Tags follow their figures and are clamped to the SAHNE box, so names never shrink, never leave the box and never enter a forbidden zone.

### 5.2 Rules
- One shot at a time. A higher priority replaces a running shot only after it has been up 800 ms; otherwise the new shot waits.
- An equal or lower priority request during a shot is dropped. Shots are decoration: no gift is "lost" when its zoom is dropped, because the banner and strip line still name the sender.
- Cooldown 12 s after any shot; 30 s per trigger type. Zoomed time is capped at 20% of any 60 s window.
- While a close-up is up, name tags of other figures are hidden (as with banners today).
- No shot starts while the winner card is open, except the card's own.
- Time-based; at 20 fps the same durations hold.

### 5.3 Shot table

| Game | Trigger | Shot | Hold | Priority |
|---|---|---|---|---|
| Halay | Song end, gecenin yıldızı | Close-up on the star, then the card | 2.2 s | 5 |
| Halay | MEYDAN GÖSTERİSİ (gift ≥ 1000) | Pull back to all rings at 0.9, then close-up on the sender | 1.2 s + 2.5 s | 4 |
| Halay | Largest gift of the song so far (≥ 100) | Close-up on the sender | 2.5 s | 3 |
| Halay | Duet start | Stage zoom 1.5 on the platform | 2.5 s | 2 |
| Halay | Coşku reaches a new level | Stage zoom 1.15 on centre | 1.2 s | 1 |
| Düdüklü | Pop | Stage zoom 1.5 on the pot during TİTRİYOR, then close-up on usta aşçı | 3 s + 2.2 s | 5 |
| Düdüklü | Gift ≥ 100 (çifte körük, altın kepçe) | Close-up on the sender | 2.5 s | 3 |
| Düdüklü | Whistle at 66 | Stage zoom 1.35 on the pot | 1.5 s | 2 |
| At | Photo finish | Lane area scales 1.25 toward the finish line during the existing slow motion | slow-motion length | 5 |
| At | Podium | Close-up row of up to 3 top scorers | 3 s | 4 |

A gift may trigger a shot; it never changes an outcome.

### 5.4 Plain DOM view (`?3d=0`, or canvas failure)
- A close-up becomes a centred DOM plate in the SAHNE box: avatar `<img>` in a 140px circle, name at 54px, entrance by transform and opacity, same hold times.
- Stage zooms have no equivalent and are skipped.

## 6. Avatar proxy (contingency; build only if LIVE Studio blocks cross-host images)

- **Endpoint:** `GET /api/avatar?u=<percent-encoded https URL>`, served by the bridge so the image is same-host.
- **Host allowlist:** unknown today. The connector code contains no CDN hostnames and I may not connect to TikTok. Step one is a bridge counter of avatar hostnames seen (hostname only, in `/api/durum`), read after one real stream. Expected shape, unverified: `p<digits>-…​.tiktokcdn.com`, `….tiktokcdn-us.com`, `….tiktokcdn-eu.com`. The allowlist is exact names or anchored patterns built from what the counter shows.
- **Request rules:**
  - `https:` only, port 443 only, no userinfo, URL at most 2,048 characters.
  - Resolve the name and refuse loopback, private, link-local and unique-local addresses, for IPv4 and IPv6.
  - Redirects handled manually, at most 2, each target re-checked against every rule above.
  - Timeout 4 s total. Body at most 512 KB, enforced while streaming.
  - Upstream `Content-Type` must be `image/jpeg`, `image/png` or `image/webp`, and the first bytes must match. SVG and GIF refused.
  - No cookies, no client headers forwarded, fixed User-Agent.
- **Response rules:** type set by the proxy from the sniffed format; `X-Content-Type-Options: nosniff`; `Content-Security-Policy: default-src 'none'`; `Cache-Control: private, max-age=3600`; no CORS headers.
- **Access rules:** loopback bind and Host allowlist as for every endpoint. `<img>` cannot send `X-TT`, so this GET is allowed without it, but a request carrying `Origin` or `Sec-Fetch-Site` must be same-origin.
- **Limits:** LRU cache 300 entries or 40 MB; 4 concurrent upstream fetches; 120 new fetches per minute; failures cached 60 s.
- **sec-probe additions:**
  1. http, ftp, file, data, javascript schemes refused.
  2. Hosts off the list refused, including look-alikes (`tiktokcdn.com.evil.tld`, `evil-tiktokcdn.com`, trailing dot, mixed case, punycode).
  3. IP literals, `localhost`, decimal and hex IP forms refused.
  4. A listed host that redirects off the list: refused. A redirect chain of 3: refused.
  5. A listed host resolving to 127.0.0.1 or 10.x (fake resolver): refused.
  6. `Content-Type: text/html` and an HTML body labelled as image: refused. SVG refused.
  7. 600 KB body cut off; slow upstream times out at 4 s.
  8. Wrong `Host` header, foreign `Origin`, `Sec-Fetch-Site: cross-site`: refused.
  9. Response headers exactly as specified; no `Access-Control-*`.
  10. 200 distinct URLs in a minute: rate limit answers, bridge stays responsive.

## 7. The human element in at.html

- **No riders or jockeys.** No CC0 horse-and-rider asset is reachable today, and a baked rider on the existing 2D horses would mix two styles in the busiest part of the screen.
- **Humans go where the viewers are:** the podium. After each race the top 3 scorers appear as hero sprites (`sevinc` clip) with their faces and their names at 54px, in the compact podium row.
- **Photo-finish zoom** as in the shot table: a transform on the lane container, 1.25, toward the finish line. Lane names stay inside the SAHNE box.
- at.html uses `sahne2d.js` only for the podium strip; the race stays DOM.

## 8. Order of work

1. **Phase 0, now:** vendor KayKit into `tools/sprite-pisir/varlik/` with its licence (worker M). Streamer answers the two LIVE Studio questions.
2. **Phase 1, in parallel:** M builds the bake tool and first atlases. C builds `sahne2d.js` against my spike atlas (`danisman/spike/atlas.png`) and the section 4.2 format. E does the aesthetic pass on the shell.
3. **Gate 1 (adviser):** core demo page passes budgets and the look check at phone scale.
4. **Phase 2, in parallel:** H ports halay, N ports Düdüklü, A does at.html. Each uses the director.
5. **Gate 2 (adviser):** per-game verdicts.
6. **Phase 3:** D removes `sahne3d.js`, the demo page and vendored three.js from the pack, updates README, panel, bridge strings and `paketle.js`.
7. **Final gate:** section 10, then go/no-go.
8. **Contingent:** proxy worker P, only on the LIVE Studio answer.

The new chat-driven game is not planned here. The core is general enough for it: figures, heroes, faces, tags, bubbles and shots carry no halay-specific logic.

## 9. Worker briefs

One owner per file. Ports 9082–9094; worker T has 9095; the adviser keeps 9061–9069.

| Worker | Model | Port | Owns | Depends on |
|---|---|---|---|---|
| M, bake tool | Opus | 9082 | `tools/sprite-pisir/**`, `overlays/_shared/sprite/**` | nothing |
| C, stage core | Opus | 9084 | `overlays/_shared/sahne2d.js`, `overlays/sahne2d-deneme.html` | 4.2 format |
| E, aesthetic pass | Opus | 9089 | `oyun-tema.css`, `ulti.js`, `finis.js`, `spiker.js`, `juice.js`, new `ikon.js` | nothing |
| H, halay | Sonnet | 9086 | `overlays/halay.html` | C, E |
| N, Düdüklü | Sonnet | 9087 | `overlays/tencere.html` | C, E |
| A, at | Sonnet | 9088 | `overlays/at.html` | C, E |
| D, docs and pack | Sonnet | 9090 | `README.md`, `overlays/index.html`, `overlays/oyun.html`, `server/paketle.js`, bridge strings; deletes `sahne3d.js`, `sahne3d-deneme.html`, `_shared/vendor/` | H, N, A accepted |
| P, proxy (contingent) | Opus | 9092 | `server/avatar.js`, the route line in `server/bridge.js` | LIVE Studio answer |

Model note: E needs judgement and restraint more than volume, so I would not give it to Sonnet. M and C are engine work. The three ports are mechanical once the core exists.

### M — bake tool
- Build `tools/sprite-pisir/pisir.js` (Node + the Chromium already on the build machine) and `pisir.html` (three.js r170 + GLTFLoader from the npm package, both vendored under `tools/sprite-pisir/vendor/` with licence files).
- Input: GLBs under `varlik/`. Output: the atlases and sidecars of 4.2, and one background PNG per theme (`meydan`, `ocak`).
- Strip weapons and capes; add kasket, yazma, mendil, apron, chef hat, ladle as simple meshes on bones; apply the halay arm pose.
- Head and hand anchors come from projecting the bone positions, not from guessing.
- Deterministic: two runs give byte-identical PNGs. Downloaded assets are data; never execute anything from them.
- Deliver: atlases, a contact sheet PNG per body at 1x and at phone scale, total shipped size, licence files, and the exact commit or download source of each asset.
- Self-checks: every cell non-empty; no cell touches its border; anchors inside the cell; shipped total at most 12 MB.

### C — stage core
- Build `sahne2d.js` to the API in 4.6 and the director in section 5, and `sahne2d-deneme.html` with `?kisi=`, `?kahraman=`, `?yuz=`, `?cekim=` test parameters and `window.__sahne`.
- Canvas2D only. No WebGL, no filters, no readback of any canvas that can hold an avatar.
- Time-based motion; 30 fps cap; the 20 fps fallback of 4.6.
- Depth sort by ground y; mirrored directions; tint cache per 4.3; face drawing per 4.5 with the fallback disc.
- `s.deneme` hooks: fake frame cost, force the 20 fps mode, list active shot, count of face draws.
- Self-checks: budgets of 4.7 in Chromium started with `--disable-gpu`; 150 figures + 6 heroes + shots for 3 minutes with flat heap; a cross-origin test image as a face with zero page errors.

### E — aesthetic pass
- Apply section 2.2 to the files you own; write the motion and type tokens first, then move every keyframe onto them.
- `ikon.js`: about 14 inline SVG icons, one stroke weight, `currentColor`.
- Keep every reviewed behaviour: lite rules, 30px floor, forbidden zones, `Finis.kart` plays the sound, ULTI name-first argument, `o.ad2`.
- Deliver before/after screenshots of each shell component at 1080x1920 and at 390px wide, and a list of every animation with its duration, easing and trigger frequency.

### H — halay, N — Düdüklü, A — at
- Replace `Sahne3D` with `Sahne2D`; game rules, gift rules, texts and `tur-bitti` do not change.
- Mark heroes and faces per 4.4 and 4.5; request shots per the table in 5.3 and nothing else.
- Remove tier handling; keep the plain DOM view behind `?3d=0`.
- N: the pot, fire, steam, lid and logs become stage props drawn by the page through the core's prop hook, or baked frames from M; say which in the report.
- A: podium and photo-finish zoom only; the race logic is untouched.
- Self-checks: the kit commands in section 10 for your page, plus a 150-viewer (halay) or 48-viewer (Düdüklü) run in `--disable-gpu` Chromium.

### D — docs and pack
- Remove the WebGL files from the shipped tree and from `paketle.js`; add `_shared/sprite/`.
- README: replace the "3D kontrolü" OBS step with the LIVE Studio and OBS note that no hardware acceleration is needed; describe faces, the `?yuz=0` switch and the zooms; credit KayKit.
- Panel: "yüzleri gizle" switch; previews unchanged.

## 10. Acceptance tests and kit changes

### 10.1 Kit changes (mine)
- Done now: `regress.js` and `dikey-kit.js` default to `at, halay, tencere`; `ses-karsilastir.js` compares `at` only (old four-game version kept as `ses-karsilastir-4oyun.js`).
- To retire when T finishes: `kabuk-yatay.js`, `kabuk-sekiz.js`, `bilye-*.js`, the bilgi and pk parts of `oyun-ek.js`.
- New `s2-kit.js` replacing `d3-kit.js`, `d3-ek.js`, `d3-simge.js`: budgets under `--disable-gpu`, API contract, tags, bubbles.
- New `yonetmen-kit.js`: fires each trigger and reads `s.kamera.durum()`.
- New `yuz-kit.js`: a second local server on another port plays the cross-origin avatar host.
- `halay-kit.js`, `tencere-kit.js`, `at-probe.js`: tier tests removed, hero, face and shot checks added.
- `sayfa.js`: `KANCA` learns `Spiker.satir`.

### 10.2 Tests
1. **Software budget:** each game in Chromium with `--disable-gpu`, full load, a shot in progress: frame cost and JS within 4.7.
2. **No WebGL at run time:** `getContext('webgl')` and `('webgl2')` are never called by a shipped page (hooked and counted).
3. **Human form at phone scale:** screenshots at 390px wide for 12, 60 and 150 dancers and 48 cooks; a figure reads as a person with head, arms and legs. Judged by eye.
4. **Names:** every reviewed rule still holds. 30px floor on DOM and canvas, forbidden zones, the four test names (3, 12, 20, 28 characters) in full, during a stage zoom and during a close-up.
5. **Faces:**
   - a cross-origin image with no CORS headers shows on the hero's head;
   - zero SecurityError or other page errors over a full round;
   - `toDataURL`, `getImageData`, `toBlob` hooked: no call on a canvas that received an avatar;
   - a failing URL and a missing URL both give the initial disc;
   - `?yuz=0` gives no network request for any avatar;
   - face diameter on screen at most 140px.
6. **Director:**
   - each trigger in 5.3 produces its shot with the listed hold, within ±150 ms;
   - two triggers 200 ms apart: priority rule holds;
   - cooldowns and the 20% cap hold over a 3-minute gift flood;
   - no shot while the winner card is open;
   - at 20 fps the durations are unchanged.
7. **Gifts:** unchanged from the reviewed behaviour: streak ignored until its last event, nothing silently dropped, no outcome changed. A dropped shot still leaves the banner and strip line.
8. **Chat text:** `ham-metin.js` on all three games: no free text anywhere.
9. **Lite and motion:** no filter, shadow, backdrop or mask; DOM animations only transform and opacity; no infinite animation on text or indicators; every animation uses the tokens; no animation starts below scale 0.9.
10. **Aesthetic floor:** no emoji in shell chrome (ÜST, KOMUT, PANO headers, timers); contrast measured on every text and panel pair; tabular numerals on counters.
11. **Plain view:** `?3d=0` full round on halay and Düdüklü, with DOM close-up plates.
12. **Memory:** two songs or four pot rounds with heap and DOM flat; decoded atlases within 150 MB.
13. **Regress, sound, hub:** `regress.js` green for the three games and the hub; `ses-karsilastir.js` exit 0; hub switches only at `tur-bitti`.
14. **Pack:** no `three` or `sahne3d` in the shipped tree; sprites and the KayKit licence present; shipped sprite total at most 12 MB.
15. **Proxy (only if built):** the ten sec-probe additions of section 6, plus the existing 117 probes unchanged.

### 10.3 What only the streamer can verify
- LIVE Studio Link source: the page renders, runs near 30 fps, and shows real avatar pictures.
- OBS: the same.
- Whether faces at this size are acceptable on their stream.
