# AlIPS — Al Injaz International Private School, Math Department App

Interactive math app for grades 1–12 at Al Injaz International Private School
(Muscat, Oman). The school follows **both** the Cambridge and the Oman
bilingual curriculum, so every user-facing feature must work in **English and
Arabic (RTL)**.

## Current state (v0.1)

Bilingual curriculum browser: grades 1–12 → strands → topics, with
Cambridge / Oman Bilingual / Both tags, a Student/Teacher view toggle, and
search. Static site — no build step, no server.

- `index.html` — curriculum browser; UI text filled in by `app.js` from `UI_STRINGS`
- `styles.css` — uses logical properties (`inline-start` etc.) so RTL works free
- `data.js` — the curriculum dataset (`CURRICULUM`) and UI strings (`UI_STRINGS`)
- `app.js` — curriculum browser rendering + state (language, view, grade, search)
- `worksheets.html` / `sheet.css` / `sheet.js` — teacher tool: infinite worksheet
  and term-exam generator (print → PDF via the browser)
- `gen.js` — the question generator engine: seeded RNG (`mulberry32`) +
  ~30 bilingual generators in `GENERATORS`, mapped to grades via `GRADE_GENS`

### Question generator conventions

- A generator is `{ name: T(en,ar), grades: [..], gen(r, d) -> {q: T, a: T} }`
  where `r` is the RNG and `d` is difficulty 1–3. Answers that are pure math
  use `N(value)` (same string in both languages).
- Generators MUST produce clean answers (integers, exact fractions, or values
  that round nicely) — construct the answer first, derive the question from it.
- Same seed ⇒ identical paper ("Paper no." printed on exams), so teachers can
  reprint or share a paper by its number.
- Exam structure: Section A = 1 mark/easy, B = 2 marks/medium, C = 4 marks/hard.
- Numerals are Western (0-9) in both languages — confirm with the department.

## Conventions

- **Every string is bilingual**: use `T(en, ar)` in `data.js`. Never hardcode
  user-facing English text in HTML or JS — add it to `UI_STRINGS`.
- Topic fields: `n` = name, `s` = student description, `t` = teacher note,
  `c` = `"cambridge" | "oman" | "both"`. `s`/`t` are optional.
- Plain HTML/CSS/JS only — no frameworks, no npm, no build step. The site must
  work by opening `index.html` directly (and on GitHub Pages).
- CSS: prefer logical properties (`padding-inline-start`, not `padding-left`)
  so Arabic RTL layout works without overrides.

## Verifying changes

No test suite yet. Verify visually with headless Chromium:

```
/opt/pw-browsers/chromium --headless --disable-gpu --no-sandbox \
  --window-size=1280,900 --screenshot=out.png \
  "file:///home/user/AlIPS/index.html?lang=ar&grade=9&view=teacher"
```

URL params for testing: `lang` (en/ar), `grade` (1–12), `view` (student/teacher).
Always check **both** languages — RTL regressions are the most common bug here.

## Important caveats

- The curriculum content in `data.js` is a **draft** seeded by AI. The math
  department must verify topics against the official Cambridge frameworks
  (Primary, Lower Secondary, IGCSE, AS) and the Oman bilingual syllabus before
  presenting it as authoritative.

## Roadmap (agreed with the department head)

1. ~~v0.1 Curriculum browser (bilingual, both views)~~ — done
2. ~~v0.2 Worksheet + term-exam generator for teachers~~ — done
3. ~~v0.3 Practice & Learn (`learn.html`/`learn.js`/`lessons.js`): guided
   lessons, deep-research links, infinite practice with mark-scheme
   solutions~~ — done
4. More generators (statistics tables, geometry with diagrams, word problems)
5. Progress tracking

## v0.3 notes

- Every generator's `gen()` also returns `sol`: worked steps with Cambridge
  mark codes (M1/A1/B1) — shown in practice and in worksheet answer keys.
- `lessons.js` holds one bilingual mini-lesson per generator id, plus
  search-based "deep research" links (YouTube EN/AR, Khan Academy,
  Corbettmaths). NO hard-coded video IDs — the department can pin a vetted
  video by setting `yt: "<videoId>"` on a lesson; it then embeds automatically.
- Practice answers matching `x = n` / plain numbers are typed and checked;
  other formats use reveal + self-marking.
