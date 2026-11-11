# PLAN-INSAN — human characters, avatar faces, automatic zoom, aesthetic pass

Adviser plan, 11 Nov 2026. Research and plan only; nothing here is implemented.
Product after cleanup: `at.html` (2D), `halay.html`, `tencere.html`, hub `oyun.html` (default `at,halay,tencere`).

## 0. Decisions in one page

| Question | Decision | Why |
|---|---|---|
| Rendering path | **(a) Pre-rendered sprites everywhere**, drawn on Canvas2D | Works with no GPU (LIVE Studio worst case) and in OBS; one path |
| Characters | Decided by the asset scout's report; fallback KayKit Adventurers 1.0 (CC0) re-dressed at bake time | Adventurers fit a wedding dance and a kitchen poorly; the bake tool is asset-agnostic |
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
- **Pending:** scout A1 is looking for CC0 everyday people (Quaternius modular people, other KayKit packs). Its report at `scratchpad/varlik/rapor.md` decides the inputs. What follows is the fallback, and the only pack I verified myself.
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
- Shipped size cap: 22 MB for all atlases (section 4.4). `overlays/_shared/vendor/three.module.min.js` (692 KB) leaves the exe.

## 4. Rendering architecture: `overlays/_shared/sahne2d.js`

### 4.1 Layers
1. Background canvas (static, redrawn only on resize): sky, bunting, floor, platform. Baked as one PNG per theme by the bake tool.
2. Stage canvas, full 1080x1920, redrawn at 30 fps: shadows, crowd, props, heroes, faces, effects.
3. Tag canvas (screen space, never scaled by zoom): name tags, bubbles, avatar discs.
4. DOM shell above, unchanged: ÜST, KOMUT, PANO, AKIŞ, cards.

### 4.2 Atlases (format fixed here so workers M and C can start together)
- **Crowd atlas**, one per body and palette: cell 72x96; 16 facing directions, of which 9 are baked and 7 are drawn mirrored; clips `adim` 8 frames, `sevinc` 8, `dur` 4, `at` 6. 234 cells, laid out 18 x 13 = 1296x1248.
- **Hero atlas**, one per body and palette: cell 192x256; 3 directions (front, +45°, −45° mirrored from +45°, so 2 baked); clips `adim` 8, `sevinc` 8, `dur` 4. 40 cells, 8 x 5 = 1536x1280.
- **Prop atlases** per theme (section 4.8).
- **Sidecar JSON** per atlas: cell size, clip table, direction table, and for every cell:
  - `yuz: {x, y, r, egim, gorunur}` — face centre, radius, tilt in radians, and whether the face is toward the camera;
  - `el: {x, y}` — right-hand anchor, for mendil, glass or ladle;
  - `ayak: {x, y}` — ground contact, used for placement and the shadow.
- Camera pitch 32°, orthographic, fixed for every atlas and background.
- PNGs are quantised to 256 colours with alpha by the bake tool when that keeps the contact sheet visually unchanged.

### 4.3 Colour variety without one atlas per colour
- **3 baked palettes per body, 4 bodies: 12 looks.** Body and palette come from the `Kimlik` hash, so a viewer looks the same every stream.
- **Per-viewer colour is a drawn marker, not a tinted sprite:** the mendil or kuşak (halay), the apron band (Düdüklü), drawn as one small filled shape at the `el` or waist anchor in the viewer's `Kimlik` colour, plus the ring under the feet. One extra fill per figure.
- I rejected run-time tinting of whole atlases: each tinted copy is a full 6.5 MB bitmap, so a cache of 16 costs more than baking 12 looks outright.
- A per-viewer strip built at join time was also rejected: a viewer needs every direction and frame, which is the whole atlas.

### 4.4 Memory and load budget

| Item | Count | Decoded size each | Total |
|---|---|---|---|
| Crowd atlases (1296x1248) | 12 | 6.5 MB | 78 MB |
| Hero atlases (1536x1280), loaded on demand, at most 4 kept | 4 | 7.9 MB | 32 MB |
| Background | 1 | 8.3 MB | 8 MB |
| Prop atlases | 1 theme | up to 12 MB | 12 MB |
| Stage, tag and background canvases (1080x1920) | 3 | 8.3 MB | 25 MB |
| Face discs (96x96) | up to 200 | 37 KB | 7 MB |
| **Cap** | | | **170 MB decoded** |

- Crowd atlases load lazily per look actually in use; the cap assumes all 12.
- A hero atlas is requested when a viewer becomes a spotlight candidate, before any shot needs it. If it is not decoded in time, the close-up uses the crowd cell at 2x, which is softer but never blank.
- **Download:** estimate 0.7 MB per crowd atlas and 0.9 MB per hero atlas before quantising (my 1536x1024 test atlas was 664 KB), so about 8 MB + 11 MB + 2 MB of backgrounds and props. **Shipped cap: 22 MB.** The exe loses 0.7 MB of three.js.
- **Time to first frame, measured** in Chromium with GPU disabled, files served locally: 12 atlases of 1536x1024 loaded, decoded and drawn in 0.32 s; 24 in 0.52 s. Budget: first frame within 1.0 s of page load; figures may appear as flat silhouettes until their atlas decodes.
- Heroes: at most 6 at once (halay başı, the duet pair, top gifter, gecenin yıldızı; usta aşçı and the körük sender in Düdüklü).

### 4.5 Faces
- **Source:** the viewer's avatar URL as delivered by the bridge; `Image` with `referrerPolicy = 'no-referrer'` and no `crossOrigin` attribute.
- **Disc:** on load, draw once into a per-viewer 96px canvas with a circle clip. That canvas is tainted; it is only ever drawn, never read.
- **Per frame:** read the cell's `yuz` anchor. If `gorunur`, draw the disc at `(x, y)`, scaled to `r`, rotated by `egim`. Painter's order (figure, then its own face) gives correct occlusion by other figures.
- **Back and far-side views show no face:** `gorunur` is false for directions more than 67° away from the camera; the baked hair shows instead.
- **Who gets a face:** every hero, and every figure that currently has a name tag. Other figures keep the baked face.
- **Hero close-up:** the director draws the hero atlas cell (192x256) at stage centre at up to 2x. Its `yuz` radius is about 34px in the cell, so the face is at most 136px across on screen, inside the 140px cap.
- **Fallback** when there is no picture, or it fails or times out after 4 s: the `Kimlik` pattern disc with the first letter of the name in 700 weight. The same disc is used until a late image arrives.
- **Controls:** `?yuz=0` turns faces off and makes no avatar request; the panel gets one "yüzleri gizle" switch.
- **Hard rule for every worker:** an avatar image is never drawn into a canvas that is later read (`toDataURL`, `getImageData`, `toBlob`, WebGL upload).

### 4.6 API: same shape, new backend
`Sahne2D.kur(...)` returns an object with the members the two pages already call. Counts are today's call sites.

| Member | halay | Düdüklü | In `sahne2d.js` |
|---|---|---|---|
| `figur.ekle / cikar / yerlestir` | 1 / 1 / 3 | 1 / 1 / 1 | Same signatures and return values, including `ekle` returning false at capacity |
| `figur.hareket(kid, ad, o)` | 7 | 4 | Same names (`zipla`, `mendil`, `at`, `kollar`); mapped to clips `sevinc`, `at`, `adim` |
| `figur.isaret`, `figur.sayi`, `figur.liste` | 3 | 0 | Same |
| `figur.gizli()` | 2 | 0 | Kept; always returns an empty list (nothing is hidden without tiers) |
| `halka.ayarla / hiz` | 1 / 1 | 1 / 1 | Same |
| `saat.bagla / tempo / vurus` | 1 / 4 / 1 | 1 / 0 / 0 | Same |
| `etiket.ayarla(liste)`, `etiket.enFazla` | 2 / 1 | 2 / 0 | Same; list items keep `{kid, ad, oncelik, avatarUrl, altin}` |
| `simge(kid, parcalar, o)`, `simge.tablo`, `simge.izinli` | 6 / 2 / 1 | 3 / 2 / 0 | Same fixed-table contract: table set once before first use, at most 24 characters per label, returns false for an absent figure |
| `ekran(kid, out)` | 2 | 0 | Same |
| `kadrajla(kutu, r, egim)` | 1 | 1 | Same call; sets the base framing. `egim` is accepted and ignored (pitch is baked) |
| `dinle(olay, fn)` | 1 | 0 | Same; the `kalite` event fires only for `tam` and `yok` |
| `olcum()` | kit | kit | Same keys where they still mean something (`figur`, `cizilen`, `jsMs`, `kareMs`, `fps`); `cizimCagrisi` and `ucgen` are dropped |
| `kalite`, `kaliteSifirla()` | 1 / 1 | 5 / 1 | Kept as a constant `'tam'` (or `'yok'`) and a no-op, so the pages need no edit for them |
| `sahne.add(...)`, `kamera`, `THREE.*` | 2 + 13 | 6 + 32 | **Gone.** Replaced by `prop` (section 4.8) |
| new: `figur.kahraman`, `figur.yuz`, `kamera.cek`, `prop.*` | | | Sections 4.4, 4.5, 5, 4.8 |
| `window.__sahne3d` | kit | kit | Alias of `window.__sahne` for one release |

**What changes in `halay.html`:**
1. The script import and `Sahne3D.kur` become `Sahne2D.kur`; the `sahteSahne()` stub is deleted (the core provides it).
2. The 13 `THREE.*` uses go: the davul, zurna and platform props become `s.prop.ekle('davul' …)`; the page's own `CanvasTexture` (halay.html:761) goes.
3. `kameraTik` and `cizilenDisHalka` are deleted; the page calls `s.kadrajla` once per ring-count change and requests shots from the table in 5.3.
4. `etiketModu` stays; its "kart" and "avatar" modes are unchanged.
5. New calls: `s.figur.yuz(kid, url)` on join, `s.figur.kahraman(kid, true|false)` when the halay başı, duet pair or top gifter changes.
6. Nothing else: joins, duets, coşku, gifts, queues, texts, PANO and `tur-bitti` are untouched.

**What changes in `tencere.html`:**
1. Import and `kur` as above.
2. The 32 `THREE.*` uses go: pot, lid, gauge needle, flames, logs, steam and bellows become props. `propGuncelle` keeps its logic but sets prop state (`s.prop.durum('tencere', {basinc, titreme, kapak})`) instead of matrices.
3. `odunFirlat` becomes `s.prop.firlat('odun', kid)`; steam bursts become `s.prop.patlat('buhar', n)`.
4. The `kalite` listener that rebuilds figures after a `yok` → 3D return is deleted.
5. New calls: `figur.yuz`, `figur.kahraman` for usta aşçı and the körük sender, and the shots in 5.3.
6. Nothing else: pressure rules, reservoir, caps, bots, gifts and texts are untouched.

- No quality tiers. One knob: if the 2-second average frame cost exceeds 28 ms, the stage drops to 20 fps and reports it in `s.olcum().kip`.
- `?3d=0` stays as the switch to each game's plain DOM view, and remains the answer if Canvas2D itself fails.

### 4.7 Budgets (kit limits, software Canvas2D, 1080x1920)
- 150 figures, 6 heroes, 8 tags, a zoom in progress: forced-raster frame cost at most 20 ms average, 33 ms p95.
- Page JS at most 4 ms average per frame.
- Heap flat over two songs; decoded bitmaps at most 170 MB (section 4.4).

### 4.8 Props
- `s.prop.ekle(ad, {x, z})`, `s.prop.durum(ad, {...})`, `s.prop.firlat(ad, kid)`, `s.prop.patlat(ad, n)`, `s.prop.cikar(ad)`.
- A prop is a baked sprite or a short baked frame strip, depth-sorted with the figures by its ground y.
- Halay: platform (in the background), davul, zurna, lanterns. Düdüklü: pot with 8 pressure frames, lid, flame strip of 6 frames, log, steam puff, bellows of 4 frames.
- Shake, bob and flight arcs are transforms applied by the core at draw time; nothing is re-baked for them.
- A theme (`meydan`, `ocak`, later `cay`) is one background, one prop atlas and one sidecar. A new game adds a theme and no core code.

## 5. Camera director

### 5.1 Shot model
`s.kamera.cek({ ad, hedef: kid | {x, y}, olcek, sureMs, oncelik, yakin: true|false })`
- **Stage zoom and pan:** one transform on the stage canvas content (scale about the target, then translate so the target sits at the SAHNE box centre, clamped so the background never shows an edge). Scale 0.9 to at most 1.6. Ease in 500 ms with `cubic-bezier(0.16, 1, 0.3, 1)`, hold, ease out 350 ms.
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
| K, new game ÇAY ZİNCİRİ | Sonnet | 9091 | `overlays/cay.html`; the `cay` entries in `ses.js` and `oyun.html` are handed to their owners as a patch | C, E, M (theme `cay`) |
| P, proxy (contingent) | Opus | 9092 | `server/avatar.js`, the route line in `server/bridge.js` | LIVE Studio answer |

Model note: E needs judgement and restraint more than volume, so I would not give it to Sonnet. M and C are engine work. The three ports are mechanical once the core exists.

### Tasks that can start now, before the rest of the plan is settled
- **M (bake tool)** and **C (stage core)** are the long poles and depend only on sections 4.2, 4.5, 4.6 and 4.8, which are fixed. Start both now.
- **E (aesthetic pass)** touches only shell files and can start now.
- **K (new game, section 11)** can start once C has a demo page; its rules do not depend on the asset choice.
- H, N and A wait for gate 1.

### M — bake tool
- Lives in `tools/sprite-pisir/`; runs here in headless Chromium; three.js r170 and GLTFLoader come from the npm package into `tools/sprite-pisir/node_modules` or a tools-side vendor folder, never into `overlays/`.
- Asset-agnostic: a small JSON per character names the GLB, the clips to use for `adim`, `sevinc`, `dur`, `at`, the meshes to drop, the bones for head and right hand, and the palettes. The asset scout's report (`scratchpad/varlik/rapor.md`) decides the inputs; KayKit with gear stripped plus our own headgear and apron meshes is the fallback.
- Records, for every input file: source URL or repo and commit, licence file path, SHA-256.
- Build `tools/sprite-pisir/pisir.js` (Node + the Chromium already on the build machine) and `pisir.html` (three.js r170 + GLTFLoader from the npm package, both vendored under `tools/sprite-pisir/vendor/` with licence files).
- Input: GLBs under `varlik/`. Output: the atlases and sidecars of 4.2, and one background PNG per theme (`meydan`, `ocak`).
- Strip weapons and capes; add kasket, yazma, mendil, apron, chef hat, ladle as simple meshes on bones; apply the halay arm pose.
- Head and hand anchors come from projecting the bone positions, not from guessing.
- Deterministic: two runs give byte-identical PNGs. Downloaded assets are data; never execute anything from them.
- Deliver: atlases, a contact sheet PNG per body at 1x and at phone scale, total shipped size, licence files, and the exact commit or download source of each asset.
- Self-checks: every cell non-empty; no cell touches its border; anchors inside the cell; shipped total at most 22 MB.

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
- Remove the GPU-check text from README (OBS step 5 and the "ekran kartı" notes) and from the panel.
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
12. **Memory:** two songs or four pot rounds with heap and DOM flat; decoded bitmaps within 170 MB; first frame within 1.0 s of load.
13. **Regress, sound, hub:** `regress.js` green for the three games and the hub; `ses-karsilastir.js` exit 0; hub switches only at `tur-bitti`.
14. **Pack:** no `three` or `sahne3d` in the shipped tree; sprites and their licence files present; shipped sprite total at most 22 MB.
15. **Proxy (only if built):** the ten sec-probe additions of section 6, plus the existing 117 probes unchanged.

### 10.3 What only the streamer can verify
- LIVE Studio Link source: the page renders, runs near 30 fps, and shows real avatar pictures.
- OBS: the same.
- Whether faces at this size are acceptable on their stream.

## 11. The next game

### 11.1 Ranking
Scores 1 (poor) to 5 (good); for the two risk columns 5 means low risk. Evidence for every format is weak: F2's sources are vendors, and F1 counts what people build, not what people watch.

| Candidate | Read in 3 s | Something to do every ~10 s | Viewer to viewer | Humans, faces, camera | 2 + bots | 300 | Build cost on the stage | Abuse / sensitivity | Policy | Total |
|---|---|---|---|---|---|---|---|---|---|---|
| **Pass chain (ÇAY ZİNCİRİ)** | 5 | 3 | 5 | 5 | 5 | 3 | 4 | 5 | 5 | **40** |
| Open offers (ŞEKER VAR MI KOMŞU, moved onto the character stage) | 3 | 5 | 5 | 4 | 4 | 5 | 3 | 4 | 5 | 38 |
| Stage queue (Sahne sırası) | 5 | 2 | 2 | 5 | 5 | 2 | 5 | 3 | 5 | 34 |
| Build together (kilim, sofra, cake) | 4 | 4 | 2 | 3 | 4 | 5 | 3 | 4 | 5 | 34 |
| Wedding photo / ceremony | 4 | 3 | 2 | 5 | 4 | 4 | 3 | 2 | 4 | 31 |
| 81 il call-out map | 4 | 3 | 1 | 2 | 4 | 5 | 2 | 3 | 5 | 29 |
| Split choice (Hangisi?) | 5 | 2 | 1 | 3 | 3 | 5 | 4 | 3 | 4 | 30 |

- **Winner: the pass chain.** One object, one timer and one named face at a time is the easiest screen to read, and every pass is a ready-made close-up of a new viewer, which is the name-and-face recognition F1 found traction in. It is the same verb as "dansa kaldır", which the streamer already likes.
- **Its real weakness:** only the holder has the important action. The design below answers it with several glasses at once, a "raise your hand" verb for everyone else, and likes that extend the holder's time. In a room of 300 most viewers will still wait; I score that honestly as 3.
- **Runner-up: open offers**, not the wedding. Anyone offers to anyone at any time and the target answers, so it scales to 300 and keeps everyone busy. It is harder to read, because many pairs act at once.
- **Where I disagree with your reading:** the wedding convergence is real, but I would not build it next.
  - It needs roles such as bride and groom, which we would assign to viewers we know nothing about.
  - It sits next to halay, which is already a wedding dance.
  - Its "everyone at once" moment depends on chat delay we cannot measure from here.
  - It has almost no viewer-to-viewer action.

### 11.2 ÇAY ZİNCİRİ — full design (`overlays/cay.html`, hub key `cay`, theme `cay`)

**One sentence:** a hot glass of tea travels from viewer to viewer; hand it on before it cools, and the room builds a chain.

#### Screen (portrait boxes as in PLAN-DIKEY)
- **ÜST:** "ÇAY ZİNCİRİ", sub-line "çay bahçesi", timer, counter "N ÇAYDA".
- **KOMUT (rotates every 7 s):** "BİR ŞEY YAZ → EL KALDIR" · "BARDAK SENDEYSE → @İSİM ya da NUMARA" · "BEĞEN → DEMLE".
- **Top of SAHNE, chain band:** large "14 / 30" and a row of the last 6 links as small face discs joined by a line.
- **SAHNE:** a tea garden. Viewers stand in two arcs around a samovar table; the çaycı (a 🤖 character) stands at the table. Each glass holder has a name tag, a ring timer around the glass and their face on their head.
- **AKIŞ:** one line per pass: "☕ Ali → Ayşe".
- **PANO:** "SIRADAKİLER": the next 3 raised hands with number, disc and name at 54px; below it "DEMLEYEN: name".
- **KAZANAN card:** "TEPSİ DOLDU" or "ÇAY BİTTİ", then names (below).

#### Actions

| Viewer does | Effect | Limit |
|---|---|---|
| Comment, any text | Joins and raises a hand (enters the waiting line). Text is discarded | One place in the line at a time |
| Comment while holding a glass: `@isim` or a number on a tag | Passes the glass to that person | Target must be present, must not hold a glass, and must not be among that glass's last 3 holders |
| Comment while holding a glass: anything else | Passes the glass to the longest-waiting raised hand | |
| Like | Joins and raises a hand. Every 10 likes from one viewer = one "demle": +2 s on every glass's timer | At most +6 s per glass per hold; at most 1 demle per viewer per 4 s |
| Follow | Joins at the front of the waiting line, once per stream; strip line "name çay bahçesine geldi" | Once |
| Share | The çaycı waves; strip line with the name | Once per round |
| Gift | Always: banner and strip line with the sender's name. Effects below | Never adds a link |

#### Gifts
- Under 10 diamonds, "ŞEKER": +3 s on every glass's timer (at most twice per hold) and a 🎁 bubble on the sender.
- 10–99, "TAZE DEM": the same, plus a close-up of the sender.
- 100–999, "SEMAVER": the same, plus the sender's face on the çaycı for 20 s.
- 1000 and above, "ALTIN TEPSİ": the same, plus a gold saucer badge for the rest of the stream and 6 s in which every character raises a glass.
- A gift never passes a glass, never adds a link and never ends a round, so nothing needs queueing. `gift.streaking === true` is ignored until the final event.

#### Numbers (first values; the worker tunes them with a simulation and reports)
- `A` = participants this round, bots included.
- Glasses in play `G = clamp(ceil(A / 12), 1, 4)`, re-evaluated every 5 s; a new glass starts at the çaycı.
- Hold time: 15 s for a real viewer (TikTok delay eats several seconds), 4–6 s for a bot. The ring turns coral in the last 4 s.
- Timeout: the glass goes to the longest-waiting hand with the bubble "SOĞUMASIN!". That link is drawn grey and **does not count**. The holder is not named in any text.
- A counted link = a pass made by the holder's own comment. A pass to a named person is worth the same as an unnamed one; naming is its own reward (the close-up).
- Goal `HEDEF = clamp(8 + round(A / 2), 12, 60)`, recomputed until 30 s into the round, then fixed.
- Round ends at the goal ("TEPSİ DOLDU") or at 150 s ("ÇAY BİTTİ · N halka"). Celebration 10 s, then `tur-bitti`.
- Expected length: 6 participants about 75 s; 30 about 100 s; 150 about 100 s.

#### Anti-solo and fairness
- Nobody can pass to themselves, to the person who just gave them the glass, or to that glass's last 3 holders, so two friends cannot ping-pong.
- A viewer can hold again only after everyone who was waiting when they last held has had a turn.
- Counted links per viewer are capped at `max(2, HEDEF / 5)` per round; further passes still move the glass.
- A named target who is not in the scene is treated as "anything else".
- "DEMLEYEN" is the viewer with the most demle this round (likes, capped as above); ties go to the earlier one. Gifts do not count toward it.

#### Zoom moments
| Trigger | Shot | Priority |
|---|---|---|
| Round end at the goal | Pull back to 0.9 while everyone raises a glass, then a close-up of the last holder | 5 (the authored moment) |
| Gift of 10 or more | Close-up of the sender | 3 |
| Every 5th counted link | Close-up of the receiver | 2 |
| A named pass | Stage zoom 1.25 following the glass for its 0.6 s flight | 1 |

#### Empty room
- Bots fill to 6 participants and pass among themselves. A real viewer who raises a hand goes to the front of the line, so their first glass arrives within one bot hold.
- With real viewers present, bots prefer passing to a real viewer who has not held yet.
- A round with no real link posts nothing to chat.

#### Words
- Bubbles (fixed table): "BUYUR!", "AFİYET!", "BANA DA!", "SOĞUMASIN!", "sıra sende", "o şimdi içti", "sağ ol".
- Strip: "☕ {ad} → {ad}", "🫖 {ad} demledi", "🎁 {ad}, sağ ol! Taze dem".
- Card at the goal: title "TEPSİ DOLDU", name line = last holder, second name line = demleyen, sub-line "N halkalık zincir · K kişi içti".
- Chat line: "☕ Çay zinciri: N halka! Son yudum @x, demleyen @y 🎉".
- No word from the betting list; nothing is "won".

#### Sounds (`ses.js`, additions only)
- Pattern `cay`: slow, light; tempo follows links per minute.
- Recipes: `tin` (spoon on glass, on every counted pass), `demle` (short pour), `tepsi` (tray flourish at the goal). `hediye` and `bitis` are reused.

#### Test hooks
- `?hiz=N`, `?sure=`, `?kutlama=`, `?bot=0`, `?hedef=N`, `?tut=N` (hold seconds).
- `window.Cay.ozet()` → `{durum, tur, halka, hedef, kalanSn, bardaklar: [{kid, ad, kalan, sonUc}], bekleyen: [kid…], katilan, demle: [{kid, n}], gri}`; read-only.

#### Self-checks for worker K
1. One real viewer, bots on: gets a glass within 8 s of the first comment; round reaches the goal.
2. Two viewers trying to pass only to each other: refused after one exchange, with the "o şimdi içti" bubble.
3. A holder who never types: glass leaves at 15 s, link is grey, counter unchanged, no text names them.
4. 150 viewers: 4 glasses, goal 60, round between 80 and 150 s.
5. Gift flood of 30: counter unchanged by gifts; every sender named.
6. 40 free-text comments: none appears anywhere.
7. Plain DOM view (`?3d=0`): full round, holder shown as a plate with disc and name.
