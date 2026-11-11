# Scout A1 report: free 3D people for sprite baking

> Handoff note: the scratch folder named below no longer exists. The scripts are now in
> `tools/sprite-pisir/arac/`, the previews in `devir/varlik-onizleme/`, and the chosen pack in
> `tools/sprite-pisir/varlik/quaternius-animated-people/`. The other downloads were not kept.

Folder: /tmp/claude-0/-home-user-tiktok-deniyorum/641b8bd3-baa8-54a7-9936-ea040ee0b2a8/scratchpad/varlik/
Scripts: varlik/_arac/ (inspect.mjs = GLB parser, splat.py = rough preview renderer, previews kk_a.png, qm.png, qa.png).
Nothing downloaded was executed. Only tool run: `fbx2gltf` from npm (FBX -> GLB converter), used as a converter on FBX data.

## 1. Reachability

| Source | How | Result |
|---|---|---|
| GitHub search API (/search/repositories) | curl | works |
| git clone / blobless sparse clone from github.com | git | works |
| raw.githubusercontent.com | curl | 200 |
| npm registry | curl, npm i | 200, `fbx2gltf` installs with a Linux binary inside the package |
| quaternius.com pack pages | curl | 200 (page only; its download buttons are itch.io / Drive widgets, not direct links) |
| quaternius.itch.io, kaylousberg.itch.io, kaylousberg.com | curl HEAD | 200 for pages; itch download needs a browser session (not tried) |
| kenney.nl | curl | 403 |
| opengameart.org (Kenney mini characters page guess) | curl | 404 (page does not exist at that URL) |
| drive.google.com | curl | 302 (Quaternius Drive links were reported "quota exceeded"; not retried) |
| Official KayKit org (KayKit-Game-Assets): Restaurant Bits, City Builder Bits | git clone | works, licence file inside |
| Official Quaternius org on GitHub | search | only a showcase website repo, no packs |
| Official Kenney org (KenneyNL) | search/clone | only Godot starter kits; character.glb there is a platformer robot, not people |

Third-party GitHub mirrors that carry the original files with licence text were used (see section 2). Their licence statements were checked against files in the download. For the two Quaternius sets the licence statement is a Quaternius License.txt / CC0 text, not a page on quaternius.com; the author's page (quaternius.com/packs/ultimatemodularcharacters.html, universalbasecharacters.html) states CC0 and links the CC0 deed (seen in HTML: href creativecommons.org/publicdomain/zero/1.0/).

## 2. Packs obtained

### A. Quaternius "Animated Men / Animated Women Characters" (Feb 2019) - BEST FIT
- Folder: varlik/quaternius-animated-people-2019/ (44 MB; includes FBX originals + my GLB conversions in `_glb/`; also older "Man Animated" 2017 and "Woman Animated" 2017 FBX).
- Source: github.com/beep2bleep/FreeAssetsByKenneyNLandQuaternius, folder "FreeModels by Quaternius[Patreon]/Characters and Animals/". (Mirror; repo itself has no licence field.)
- Licence file: quaternius-animated-people-2019/LICENSE_top_level_Quaternius_Patreon_collection.txt (copy of "FreeModels by Quaternius[Patreon]/License.txt"). Quote:
  "LowPoly Models by @Quaternius ... License: CC0 1.0 Universal (CC0 1.0) Public Domain Dedication https://creativecommons.org/publicdomain/zero/1.0/"
  Caveat: the per-pack folders for these characters carry no own License.txt in the mirror; the collection-level file covers the whole collection. Quaternius's site lists all packs as CC0.
- Characters (8 per gender-set, 4 each + "Smooth" variants): Male_Casual, Male_LongSleeve, Male_Shirt, Male_Suit (grey-haired older man in suit); Female_Alternative, Female_Casual, Female_Dress, Female_TankTop. Several skin tones and hair colours (preview qa.png).
- One shared skeleton: yes. Men and women have the same 31 joints (Bone, Body, Hips, Abdomen, Torso, Neck, Head, Shoulder/UpperArm/LowerArm/Palm/fingers L+R, UpperLeg/LowerLeg, Foot, PoleTargets). One animation set works on all 8.
- Animations in every file (HumanArmature|Man_* or Female_*), seconds:
  Clapping 1.67, Death 2.08, Idle 4.17, Jump 1.04, Punch 0.92, Run 0.88, RunningJump 1.25, Sitting 8.33 (sit down and idle), Standing 0.83, SwordSlash 1.04, Walk 1.04.
  (Man Animated 2017: Death, Idle, Jump, Punch, Run, Walk, Working. Woman Animated 2017: Death, Idle, Jump, Jump2, PickUp, Punch, Running, SitIdle, Sitting, Walking.)
- Triangles (non-smooth): 1786 to 2776 per character; "Smooth_" versions about 7.7-7.9k. Flat per-material colours (5-10 materials), NO textures, so recolouring is trivial. 470-590 KB per GLB.
- Fit: very good for everyday people (casual, suit, dress, tank top, varied skin and age). Low poly stays readable at 96x128. Realistic-ish proportions. Missing: dance, wave, cook.

### B. KayKit Character Animations 1.1 + Mystery Monthly character GLBs - BEST ANIMATION SET
- Folder: varlik/kaykit-collection-v6/ (36 MB: Rig_Medium and Rig_Large animation GLBs, Adventurers 2.0 characters, Mystery Monthly series 4/5/6 characters only).
- Source: github.com/GeorgeQLe/assets-kaykit-3d-characters ("The Complete KayKit Collection v6", third-party copy of the author's itch.io bundle).
- Licence file: kaykit-collection-v6/LICENSES/KayKit-CC0-License.txt. Quote: "The Complete KayKit Collection v6 / Created/distributed by Kay Lousberg (www.kaylousberg.com) / License: (Creative Commons Zero, CC0) http://creativecommons.org/publicdomain/zero/1.0/ / This content is free to use in personal, educational and commercial projects. ... crediting is not mandatory."
  Repo itself has no licence field; the licence text is the author's own file.
- Shared skeleton: all Medium-rig characters share one 23-joint rig (root, hips, spine, chest, upperarm/lowerarm/wrist/hand/handslot L+R, head, upperleg/lowerleg/foot/toes L+R). Verified identical joint names in characters and in the animation GLBs.
- Everyday-looking characters on that rig (chibi, big heads, textured 1024x1024 atlas, one material):
  - Protagonist_A (cap, glasses, backpack, pink/white jacket) 8750 tris; Protagonist_B (cap, backpack) 7842 tris - Mystery Monthly 5, "10 - April 2025 - Protagonists"
  - Farmer_A, Farmer_B (straw hat, overalls, shirt; one with moustache, one with long hair) 5758 / 6874 tris - Mystery Monthly 6, "12 - June 2026 - Farmers"
  - Driver (jacket, sunglasses) 3568 tris - MM4 Aug 2023
  - Hiker (beanie/hat, backpack) 10407 tris - MM5 May 2025
  - Survivalist 5106, Helper_A/B 5.2-5.4k (December "Helpers"), Superhero 4538, Clown 5190, Engineer (Adventurers 2.0) 7500, Marksman 7655, Cleric 8217, MagicalGirl 8548, Hoarder 20450. These are costume/fantasy, less suitable.
  Preview of the first six: _arac/kk_a.png.
- Animations (Rig_Medium, seconds; files in kaykit-collection-v6/assets/kaykit/character-animations-1.1/Animations/gltf/Rig_Medium/):
  - General: Idle_A 1.07, Idle_B 2.13, Interact 1.30, PickUp 1.30, Throw 1.37, Use_Item 1.60, Hit_A/B, Death_A/B, Spawn_*
  - MovementBasic: Walking_A 1.07, Walking_B 1.07, Walking_C 1.60, Running_A/B 0.80, Jump_*
  - MovementAdvanced: Crouching, Sneaking 2.13, Walking_Backwards 1.07, Running_Strafe_Left/Right 0.80, Dodge_Left/Right 0.40, Crawling
  - Simulation: Cheering 1.67, Waving 2.13, Sit_Chair_Down 0.80, Sit_Chair_Idle 3.60, Sit_Chair_StandUp 0.80, Sit_Floor_Down/Idle/StandUp, Lie_*, Push_Ups, Sit_Ups
  - Tools: Work_A/B/C 2.5-3.7, Working_A/B/C 1.5-2.5, Holding_A/B/C 1.00, Hammering, Sawing, Digging, Fishing_* etc.
  - CombatMelee/CombatRanged/Special: not relevant (Special has skeleton taunts).
  - No dance clip. Cheering and Waving exist.
- Rig_Large animation set exists for the large characters (not needed).
- Fit: best animation coverage, charming proportions, textured. Characters are stylised/chibi but several are plain everyday people (Protagonists, Farmers, Driver).

### C. Quaternius "Ultimate Modular Men / Women" (GLB, no animations)
- Folder: varlik/quaternius-modular-people/ (19 MB incl. a few props).
- Source: github.com/trebeljahr/quaternius-showcase (public/glb/modular_men, modular_women; MIT repo code, models by Quaternius). LICENSES.md in that repo (copied to quaternius-modular-people/LICENSES.md): "modular_men_pack | Ultimate Modular Men Pack | CC0-1.0 | https://quaternius.com/packs/ultimatemodularcharacters.html" (same for women) and "Every pack on the site is CC0-1.0 upstream."
  Weakest licence evidence: this is a secondhand statement, no original License.txt in the download. The author's own page links CC0.
- Characters: men Adventurer, Beach, Casual, Casual2, Farmer, King, Punk, Spacesuit, Suit, Swat, Worker (5.2k-11.1k tris); women Adventurer, Casual, Formal, Medieval, Punk, SciFi, Soldier, Suit, Witch, Worker (5.9k-7.9k tris). Flat colours, 5-11 materials, no textures. Meshes are Z-up with node scale 100 (fix on import).
- Skeleton: men 49 joints, women 51 joints (different, finger set differs; names Root/Hips/Abdomen/Torso/Chest/Neck/Head/UpperArm.L ... ). Same as the 2019 pack's naming style, so retargeting from pack A by bone name is feasible with fewer bones.
- Animations: none in these GLBs (original pack has a few in FBX only).
- Fit: realistic proportions and everyday outfits (casual, suit, farmer, worker, formal dress). Needs animation retargeting (from pack A, same naming style, or from KayKit/UAL).
- Props from the same repo: survival_pack Pot.glb (326 tris), Pan.glb, house_interior Kitchen_*, Table_*, Chair_*, Plate_*, Spoon, Knife, Stool, Carpet_* (same CC0 claim).

### D. Quaternius Universal Animation Library, standard (free) version, with Mannequin
- Folder: varlik/ual-standard-jponzo/ (6 MB). Source: github.com/J-Ponzo/gltf-universal-animation-library, a repack of the itch.io download (README says so).
- Licence: ual-standard-jponzo/LICENSE = full "CC0 1.0 Universal" legal text; README: "This pack is licensed under CC0 1.0 ... created by @Quaternius".
- Skeleton: 53 joints (root, DEF-hips, spine.001-.003, neck, head, arms with fingers, thigh/shin/foot/toe). One Mannequin mesh 13.7k tris, no textures.
- 45 animations (s): Idle_Loop 2.50, Idle_Talking_Loop 2.92, Walk_Loop 1.33, Walk_Formal_Loop 1.33, Jog_Fwd_Loop 0.92, Sprint_Loop 0.67, Dance_Loop 1.00, Interact 2.00, PickUp_Table 0.83, Push_Loop 2.67, Fixing_Kneeling 5.17, Sitting_Enter 1.29, Sitting_Idle_Loop 1.67, Sitting_Talking_Loop 2.92, Sitting_Exit 1.00, Crouch_*, Driving_Loop, Swim_*, Roll, Punch_*, Sword_*, Pistol_*, Spell_*, Hit_*, Death01, Jump_*.
- Only useful with a character on the matching Universal Base Characters rig. I could NOT obtain Universal Base Characters (Quaternius page is up, but no GitHub mirror found, only the itch/Drive download). The Mannequin is the only mesh. Dance_Loop is the only dance clip found anywhere.

### E. Props
- KayKit Restaurant Bits 1.0 (varlik/kaykit-restaurant-bits/, 24 MB, official org clone). Licence file in folder; quote: "KayKit : Restaurant Bits (1.0) Created/distributed by Kay Lousberg ... License: (Creative Commons Zero, CC0) ... free to use in personal, educational and commercial projects." Contains stove_single/stove_multi, pot_A/B/large, pot_*_stew, pan_A/B, lid_A/B/large, stew_pot, kitchencounter_*, kitchentable_*, chair_B, fridge_*, oven, plates, jars, crates, food ingredients. No pressure cooker as such: pot_large + lid_large is the closest.
- KayKit City Builder Bits 1.0 (varlik/kaykit-city-builder-bits/, 11 MB). CC0 per licence file in folder (same wording, "City Builder Bits (1.0)"). Buildings, cars, bench, streetlight, bush.
- Kenney Furniture Pack 1.0: licence file read in the mirror ("Furniture Pack (1.0) ... CC0"); models not downloaded.

### Rejected
- qrowdx/AnimatedCharacterKit, LowPolyCharacterKit: Unreal projects (.uasset) with Mixamo/UE mannequin animations ("Animations_Mixamo.png"); unusable and licence unclear. Deleted.
- NoLimitNexus/game-models: no licence on repo; only its copy of KayKit CC0 animations (we get the originals from B).
- chibifire-stages/quaternius-stage, Malcolmnixon/QuaterniusModularPeople: not downloaded (huge / empty).

## 3. Recommendation

Bake from two packs and keep them separate (different rigs):

1. People pack A (Quaternius 2019, 31-joint rig): Male_Casual, Male_Shirt, Male_LongSleeve, Male_Suit (older man), Female_Casual, Female_Dress, Female_TankTop, Female_Alternative. 8 characters, one rig, 2-2.8k tris, flat colours, each already has the 11 clips. Use for the crowd and the new social game. Cheap to render, easy to recolour (material colours) for variety.
2. KayKit Rig_Medium set (pack B) when you need richer clips: Protagonist_A/B, Farmer_A/B, Driver. Cheering, Waving, Interact, PickUp, Sit_Chair, Work/Use_Item. Textured, chibi look, good in close-ups.
3. Optional: Quaternius Modular men/women (C) for more realistic everyday outfits, retargeting pack A clips onto them by bone name (49/51 joints vs 31).

Mapping:

| Need | Pack A (Quaternius 2019) | Pack B (KayKit Rig_Medium) |
|---|---|---|
| idle | Idle 4.17 | Idle_A 1.07 / Idle_B 2.13 |
| walk | Walk 1.04 | Walking_A/B 1.07, Walking_C 1.60 |
| halay step (side step) | Walk played sideways, or Run slowed (no dance clip). Real dance: UAL Dance_Loop (1.00) only if a Universal rig character is obtained | Running_Strafe_Left/Right 0.80 (slowed 0.5x) or Walking_C with root offset sideways |
| arms up / cheer | Clapping 1.67 (arms up) | Cheering 1.67 |
| clap | Clapping 1.67 | none (Cheering is closest) |
| handkerchief wave | none (build by editing arm bone keyframes) | Waving 2.13 (hand prop in handslot.r) |
| stir / cook | Man Animated "Working" (2017 FBX, Man model only) | Work_A/B/C, Working_A/B/C, Use_Item 1.60, Interact 1.30 |
| sit | Sitting 8.33 (down + idle) | Sit_Chair_Down 0.80, Sit_Chair_Idle 3.60, Sit_Floor_* |
| carry / hand over | none (Woman Animated 2017 has PickUp) | PickUp 1.30, Holding_A/B/C 1.00, Throw 1.37 |

## 4. Gaps and how to cover them
- Halay / dance: no CC0 dance for these rigs except UAL Dance_Loop (needs Universal Base Characters rig, not obtained). Practical route: author a halay step by keyframing a few bones (hips side-sway, arms linked/raised) in a short script on the KayKit Rig_Medium (only 23 bones, easy) or on pack A; or loop Strafe/Walk clips with a sine on the hips. Halay in a row also works as 8-direction walking sideways in sprite space.
- Handkerchief: tiny plane mesh (or two boxes) parented to the hand bone (handslot.r in KayKit; Palm.R in pack A), animated with Waving.
- Flat cap / headscarf / apron / chef hat: small meshes parented to the head bone (KayKit `head`, pack A `Head`); apron as a flattened box parented to chest/torso bone (`chest` / `Torso`), coloured with a material. Pack B also has hats already (straw hat on farmers, caps on protagonists, beanie on Hiker).
- Pressure cooker: KayKit pot_large + lid_large (or Quaternius survival Pot) plus a small knob/valve box; steam as 2D particles.
- Older people: only the suit man in pack A (grey hair and beard). Grey hair can be done by recolouring the hair material; for women recolour hair of Female_Casual.
- Sprites: pack A has no textures, so recolour per instance cheaply; pack B uses one 1024 atlas per character.
- Preview images (_arac/*.png) are my rough point-splat renders from rest pose, not proper renders; verify look in a real renderer.

## 5. For the streamer to fetch by hand (official pages)
- Quaternius Universal Base Characters (same rig as UAL, enables Dance_Loop): https://quaternius.com/packs/universalbasecharacters.html (free standard version via the itch.io button; the page is reachable but the download needs a browser). Also the full UAL: https://quaternius.itch.io/universal-animation-library
- Quaternius Ultimate Modular Men / Women originals (FBX/glTF with their own License.txt): https://quaternius.com/packs/ultimatemodularcharacters.html and https://quaternius.com/packs/ultimatemodularwomen.html
- Quaternius Animated Men / Women (2019, original zips with their own License.txt): the Quaternius site "Characters" list (quaternius.com, pack pages may be under older URLs) or OpenGameArt user Quaternius.
- KayKit Character Animations and Mystery Monthly characters, originals with own licence: https://kaylousberg.itch.io/kaykit-character-animations and https://kaylousberg.com
- Kenney Mini Characters / Blocky Characters / Animated Characters: https://kenney.nl/assets (403 from this machine; fetch in a browser).
