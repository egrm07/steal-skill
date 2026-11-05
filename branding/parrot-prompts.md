# Parrot brand: image prompts and copy

The joke: a pirate parrot sits on your agent's shoulder and repeats what the best reviewers say. Parrots copy what they hear, pirates steal, so the two halves of "steal-skill" are covered in one picture.

## 1. How to use this pack

1. Generate the **mascot sheet (asset A)** first and pick one parrot you like.
2. Feed that image back in as a character reference for every other asset, so it stays the same bird. (Midjourney: attach it as a character or omni reference. GPT image / Gemini: upload it and say "the same parrot character as the attached image".)
3. Never ask the model for text. Every prompt below leaves an empty speech bubble or empty space. Add the headline, the command and the wordmark yourself in Figma or Canva.
4. The models will not draw the Varyz V exactly. Let them draw a "small gold V-shaped earring", then paste the real V over it from `ref/varyz-v-gold.png` (exact shape and colour, transparent background).
5. Logo and avatar: generate big (1024 or larger), then check them at 32 px. If the eyepatch and earring stop reading, ask for "fewer details, bigger shapes".

Which model for what:

| Job | Best fit | Why |
|---|---|---|
| Mascot, scenes, banner | Midjourney or GPT image | Best character illustration |
| Anything that must contain text | Ideogram or GPT image | Most reliable text, but adding it yourself is still better |
| Logo mark | GPT image or Recraft (vector output) | Clean flat shapes; Recraft can export SVG |

## 2. Style guide (paste into every prompt, or keep as a saved style)

**Style line:**
> Bold flat vector illustration, thick even dark outlines, simple geometric shapes, limited palette, no gradients except one soft rim light, cheeky and confident mood, modern tech-brand mascot, clean negative space.

**Palette:**

| Role | Colour | Hex |
|---|---|---|
| Background | Near-black | `#11120f` |
| Varyz accent (earring, flag mark only) | Gold | `#ffc23d` |
| Parrot body | Emerald green | `#2bb673` |
| Parrot shading, wing tips | Deep green | `#1e7f4f` |
| Crest and tail flash | Scarlet | `#e5484d` |
| Beak and eye ring | Bone white | `#f2e6cf` |
| Eyepatch, outlines | Ink | `#0b0c0a` |

Keep gold for the Varyz V only, so the eye goes there. The beak is bone white, not yellow, for the same reason.

**The character, Polly:**
- An Amazon-style pirate parrot: green body, a short scarlet crest, a bone-white curved beak.
- A black eyepatch over its left eye. Its right eye is half-lidded and smug.
- One small gold V-shaped earring on the side of its head, shaped like a bird in flight (two curved, swooping arms meeting at a point).
- It never wears a full pirate costume: no hat, no peg leg. The eyepatch and earring carry the joke, and a simple mark survives being shrunk.

**Negative prompt (paste where the model supports it, otherwise add "avoid: ..."):**
> text, letters, words, watermark, signature, logo text, photorealistic, 3D render, gradients, glossy, busy background, tiny details, thin lines, extra limbs, extra eyes, pirate hat, peg leg, skull and crossbones, cartoon baby proportions, real person, human face, recognisable brand logos, GitHub logo

## 3. Assets

### A. Mascot sheet (do this first)
**Size:** 1:1, 2048 x 2048 (Midjourney `--ar 1:1`)

> A character sheet of one pirate parrot mascot named Polly, shown in three poses on a plain near-black background (#11120f): standing and smug with one wing on its hip; mid-squawk with its beak wide open; perched and looking sideways with a raised eyebrow. Emerald green body (#2bb673), deep green wing tips (#1e7f4f), a short scarlet crest (#e5484d), a bone-white curved beak (#f2e6cf), a black eyepatch over the left eye, a half-lidded smug right eye, and one small gold earring (#ffc23d) shaped like a swooping V, like a bird in flight. Bold flat vector illustration, thick even dark outlines, simple geometric shapes, cheeky and confident, modern tech-brand mascot. The same character in all three poses. No text.

Midjourney suffix: `--ar 1:1 --style raw --no text, letters, hat, 3D, gradients`

### B. Logo mark
**Size:** 1:1, 1024 x 1024. Used for favicon, npm, GitHub org, app icon.

> A bold, minimal logo mark: the head of a pirate parrot in side profile, facing right, inside a rounded square of near-black (#11120f). Emerald green head (#2bb673), a short scarlet crest of three feathers (#e5484d), a big bone-white hooked beak (#f2e6cf), a solid black eyepatch with a thick strap, and one small gold V-shaped earring (#ffc23d) hanging below the eye. Flat vector, four colours plus black, very thick shapes, no fine lines, no texture, centred with generous padding. It must still read clearly at 32 pixels. No text.

Midjourney suffix: `--ar 1:1 --style raw --no text, letters, gradient, detail, background scene`

Tip: ask for 4 to 6 variations, then test each at 32 px next to the Varyz favicon. Pick the one where the eyepatch, beak and earring are still obvious.

### C. Launch post (X, LinkedIn, Bluesky, Reddit)
**Size:** 16:9, export at 1200 x 675 (generate at 1792 x 1024 or `--ar 16:9`)

> A wide illustration on a near-black background (#11120f). On the right side, a friendly, simple robot coding assistant sits at a laptop, its screen glowing with a terminal window of abstract code lines. Polly the pirate parrot (emerald green, scarlet crest, bone-white beak, black eyepatch, small gold V-shaped earring) is perched on the robot's shoulder, leaning in and squawking into its ear. A large empty white speech bubble comes from the parrot's beak. A few paper slips of review comments (blank, no writing) flutter around the parrot like loot. The left 45 percent of the image is empty dark space for a headline. Bold flat vector illustration, thick even outlines, cheeky mood, soft gold rim light on the parrot. No text anywhere.

Midjourney suffix: `--ar 16:9 --style raw --no text, letters, words, human`

Text to add yourself, left side:
- Headline: **Your agent gets a parrot.**
- Under it: **It repeats what the best reviewers say.**
- Bottom left, in mono: `npx steal-skill <github-user>`
- In the speech bubble: **"Arr, add a test!"**

### D. README banner
**Size:** 3:1, 1500 x 500 (also fine at 1280 x 427)

> A wide, short banner on a near-black background (#11120f). Polly the pirate parrot (emerald green, scarlet crest, bone-white beak, black eyepatch, small gold V-shaped earring) stands on the right third, on a tiny wooden plank, holding a long unrolled scroll that trails off to the left like a receipt, covered in blank comment boxes and check marks with no writing. The left two thirds are mostly empty dark space. Bold flat vector, thick even outlines, simple shapes, cheeky mood. No text.

Midjourney suffix: `--ar 3:1 --style raw --no text, letters, words`

Text to add: wordmark **steal-skill** large on the left, the command `npx steal-skill <github-user>` under it in mono.

### E. Social avatar
**Size:** 1:1, 800 x 800, must survive a circle crop

> A close-up of a pirate parrot's head, facing the viewer three quarters, centred, filling about 70 percent of the frame, on a flat near-black background (#11120f). Emerald green feathers, short scarlet crest, bone-white hooked beak, black eyepatch over the left eye, smug half-lidded right eye, one small gold V-shaped earring (#ffc23d) clearly visible. Bold flat vector, thick outlines, big simple shapes, high contrast. Nothing important near the corners. No text.

Midjourney suffix: `--ar 1:1 --style raw --no text, letters`

### F. GitHub social preview (the card shown when the repo link is shared)
**Size:** 2:1, 1280 x 640

> Same scene as the launch post, but tighter: Polly the pirate parrot perched on top of an open laptop's screen edge, squawking into an empty speech bubble, with the laptop screen showing abstract terminal lines. Near-black background (#11120f). Parrot on the right half, left half empty for text. Bold flat vector, thick outlines, cheeky mood, gold rim light. No text.

Midjourney suffix: `--ar 2:1 --style raw --no text, letters, words`

Text to add: **steal-skill**, then **Steal any developer's code review taste.**

### G. Optional stickers and extra poses
Square, 1024 x 1024, flat near-black or transparent background. Use the mascot sheet as reference.

1. **The listener:** Polly with a giant brass ear trumpet pressed to a pile of blank pull request cards, eyes wide.
2. **The copier:** Polly holding a quill, copying from one blank page onto another, tongue out in concentration.
3. **The loot:** Polly sitting on a small treasure chest overflowing with blank comment bubbles instead of gold coins. The only gold in the picture is its V earring.
4. **The flag:** Polly holding a tiny black pirate flag whose only mark is a gold swooping V (#ffc23d). Paste the real V from `ref/varyz-v-gold.png` over it afterwards.

## 4. Names (npm checked on 2026-11-05)

| Name | npm | Notes |
|---|---|---|
| `steal-skill` (keep), mascot "Polly" | yours | **Chosen 2026-11-05.** No rename, links and repo stay. The pirate already explains "steal". |
| `polly-skill` | free | Cute and memorable, but loses the "steal" hook. |
| `squawk-skill` | free | Fun to say, less clear what it does. |
| `parrot-review` | free | The clearest, the least fun. |
| `parrot`, `parrot-skill`, `polly`, `squawk`, `parrot-cli` | taken | |

The repo and package stay `steal-skill`. The parrot is the mascot, Polly, not the name.

## 5. Copy

**Taglines (pick one):**
- Your agent gets a parrot. It repeats what the best reviewers say.
- Polly learned from your tech lead. Now it reviews like them.
- Steal any developer's code review taste. (current line, still works)

**Terminal voice (what the CLI prints), using the example user `your-tech-lead`:**
```text
Squawk! Polly is listening to your-tech-lead...
Polly heard 214 comments across 18 pull requests.
Polly learned: tests first, then error handling, then naming.
Polly says it like them: short, direct, "nit:" for small stuff.
Polly is on your agent's shoulder: ~/.claude/skills/review-like-your-tech-lead
Now ask: review this diff like your-tech-lead
```

**Launch post text:**
```text
I gave my coding agent a parrot.

npx steal-skill <github-user> reads a developer's public PR review comments and teaches your agent to review like them. Works with Claude Code and Codex. No API key, no AI calls, nothing posted anywhere.

Then ask: "review this diff like <github-user>".

Polly repeats. The people it learns from never endorsed it.
```

**Not-endorsed line for the README footer:**
> Polly repeats what it hears. Skills built with this tool imitate public writing and are not endorsed by the people they are built from.

## 6. Round two: fixes for the first batch

The first batch (mascot sheet, logo, shoulder scene) got the character right. Polly looks the same in all three, so keep the mascot sheet as the reference for everything else. Upload the image you are fixing and use these prompts as edits, not fresh generations.

**Everywhere:** every model drew the earring as a plain check mark, not the swooping Varyz V. Don't spend more prompts on it. Paste `ref/varyz-v-gold.png` over the earring in each final image.

**Logo (B), edit prompt:**
> Keep this logo exactly as it is, with three changes. 1. Move the gold earring so it hangs from the side of the head just below and behind the eye, touching the green feathers; right now it floats outside the head. 2. Give the black eyepatch and its strap a thin bone-white (#f2e6cf) outline, so the patch does not merge into the dark background at the back of the head. 3. Make everything outside the rounded square transparent, not white. No text.

Then check it at 32 px next to the Varyz favicon. If the crest and beak read but the eyepatch does not, make the patch bigger.

**Launch post (C), edit prompt.** This one came out about 5:4, so it needs widening to 16:9:
> Extend this scene to a 16:9 frame by adding empty near-black (#11120f) space on the left, so the robot and parrot sit in the right 55 percent. Also fix two things: remove the extra hand resting on the robot's shoulder (the parrot grips the shoulder with its own talons instead), and remove the second monitor behind the laptop so there is only one screen. Keep the empty speech bubble, the blank paper slips and everything else the same. No text.

In Midjourney, use Pan left or Zoom out on the image instead. In ChatGPT, upload it and ask to "expand the canvas to 16:9 on the left".

**Exports:** this batch arrived as one 2000 x 667 image, so each panel is only about 660 px tall. Download each asset on its own at full size (1024 px or more) before it goes into the README or npm.

## 7. Round three: paste-ready prompts

**Logo fix.** Attach: the latest logo.
```text
Edit the attached logo. Keep the parrot, colours, pose and layout exactly the same. Make only these three changes. 1. Fill the whole rounded square with one solid, fully opaque colour, #11120f, with no smudges, noise or see-through areas, and keep everything outside the rounded square transparent. 2. Give the black eyepatch and its strap a thin bone-white (#f2e6cf) outline so the patch stands out clearly from the dark background at the back of the head. 3. Move the gold V-shaped earring slightly to the right so it sits fully on the green cheek feathers instead of hanging over the black background; keep its shape and its gold colour (#ffc23d). No text. Output a 1024 x 1024 PNG with a transparent background outside the rounded square.
```

**Launch post.** Attach: the robot and parrot scene.
```text
Edit the attached illustration and make it 16:9 (1792 x 1024). Keep the robot, the parrot, the laptop, the speech bubble, the paper slips, the colours and the flat style exactly the same. Make only these changes. 1. Widen the canvas by adding plain, empty near-black (#11120f) space on the left, so the robot and parrot sit in the right 55 percent of the frame and the left 45 percent is empty. 2. Remove the extra hand resting on the robot's shoulder; the parrot grips the robot's shoulder with its own talons. 3. Remove the second monitor behind the laptop so the laptop is the only screen. 4. Keep the speech bubble completely empty and the paper slips blank. No text, letters or logos anywhere.
```

**README banner.** Attach: the mascot sheet.
```text
Using the parrot in the attached image as the exact same character, make a wide 3:1 banner, 1500 x 500. Flat, solid near-black background (#11120f). The parrot (emerald green body, scarlet crest, bone-white hooked beak, black eyepatch with a thin bone-white outline, small gold V-shaped earring) stands in the right third of the frame on a short wooden plank, looking smug, holding one end of a long unrolled paper scroll that trails off to the left like a receipt. The scroll shows only blank comment boxes and small check marks, with no writing. The left two thirds of the banner are mostly empty dark space. Bold flat vector illustration, thick even dark outlines, simple shapes, same style as the attached image. No text, letters or logos anywhere.
```

**GitHub social preview.** Attach: the mascot sheet.
```text
Using the parrot in the attached image as the exact same character, make a 2:1 image, 1280 x 640. Flat, solid near-black background (#11120f). The parrot (emerald green body, scarlet crest, bone-white hooked beak, black eyepatch with a thin bone-white outline, small gold V-shaped earring) perches on the top edge of an open laptop screen, mid-squawk with its beak wide open and wings slightly raised. A large, empty white speech bubble comes from its beak. The laptop screen shows a dark terminal window with a few short green lines of abstract code. The parrot and laptop sit in the right half of the frame; the left half is empty dark space. Bold flat vector illustration, thick even dark outlines, simple shapes, same style as the attached image. No text, letters or logos anywhere.
```

## 8. One sheet with every asset (cropped afterwards)

Set the size to portrait 2:3 at the highest resolution the model offers (Midjourney: add `--ar 2:3`, then Upscale 2x). Attach the latest logo as the character reference.

```text
A single tall portrait sheet of brand artwork, aspect ratio 2:3, divided into five separate rectangular panels by straight, solid pure-white gutters, each gutter about 1.5 percent of the sheet width thick, with a white border of the same thickness around the whole sheet. Every panel has its own flat, solid, fully opaque near-black background (#11120f) with no texture, noise, smudges or vignette. Nothing crosses a gutter, and nothing touches the edge of its panel except where stated.

THE CHARACTER, identical in every panel, matching the attached image: Polly, a pirate parrot. Emerald green body (#2bb673) with deep green wing tips (#1e7f4f), a short spiky scarlet crest (#e5484d), a big bone-white hooked beak (#f2e6cf), one smug half-lidded eye, a solid black eyepatch over the other eye with a black strap, the patch and strap outlined in a thin bone-white line so they stand out from the dark background. One small gold earring (#ffc23d) shaped like a swooping V with curved wing-like arms, sitting fully on the green cheek feathers. No hat, no clothes, no peg leg.

STYLE for every panel: bold flat vector illustration, thick even dark outlines, simple geometric shapes, flat colour fills, one soft gold rim light at most, cheeky and confident mood, modern tech-brand mascot, lots of clean empty space.

LAYOUT, top to bottom:

PANEL 1, top, spanning the full width, exactly three times as wide as it is tall (README banner): Polly stands in the right third on a short wooden plank, looking smug, holding one end of a long unrolled paper scroll that trails off to the left like a receipt. The scroll shows only blank comment boxes and small check marks. The left two thirds are mostly empty dark space.

PANEL 2, below panel 1, spanning the full width, exactly twice as wide as it is tall (launch post and repo preview): a friendly, simple white robot coding assistant sits at a single open laptop with a dark screen showing a few short green lines of abstract code; there is only one screen. Polly perches on the robot's shoulder, gripping it with its own talons, leaning in and squawking into the robot's ear with its beak wide open. A large, completely empty white speech bubble rises from Polly's beak. Four blank cream paper slips flutter around Polly. The robot, laptop and parrot all sit in the right 55 percent of the panel; the left 45 percent is completely empty dark space.

BOTTOM ROW, filling the remaining height below panel 2:
PANEL 3, on the left, a perfect square as tall as the bottom row (logo): Polly's head only, in side profile facing right, centred with generous even padding on all sides, big simple shapes, readable at very small sizes. The square panel background is the flat near-black, with no rounded inner frame.
PANEL 4, on the right, top of a narrow column, a perfect square (sticker): Polly full body, mid-squawk with wings spread wide and beak open, centred.
PANEL 5, on the right, below panel 4, a perfect square (sticker): Polly sitting smugly on a small open treasure chest overflowing with empty white speech bubbles instead of coins, centred.

No text, letters, numbers, words, logos or watermarks anywhere on the sheet. No real people. No skull and crossbones.
```

Send back the full sheet at full size. It is cropped into: `logo.png` (1:1, rounded corners and transparency added in the crop), `avatar.png` (the same head, square), `banner.png` (3:1), `social-preview.png` (2:1), `launch-post.png` (16:9, cut from panel 2), and two stickers.

## 9. Rules for every asset

- No real people, faces or avatars. The example reviewer is always `your-tech-lead`.
- The Varyz V appears once per image, small, in gold: the earring, or the flag mark.
- No GitHub, Claude or OpenAI logos in the art.
- Keep the README section that links back to https://github.com/egrm07/varyz.
