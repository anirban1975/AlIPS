# AlIPS — Al Injaz International Private School, Math Department App

Interactive math app for grades 1–12 at Al Injaz International Private School
(Muscat, Oman). The school follows **both** the Cambridge and the Oman
bilingual curriculum, so every user-facing feature must work in **English and
Arabic (RTL)**.

## Current state (v0.1)

Bilingual curriculum browser: grades 1–12 → strands → topics, with
Cambridge / Oman Bilingual / Both tags, a Student/Teacher view toggle, and
search. Static site — no build step, no server.

- `index.html` — page structure; UI text filled in by `app.js` from `UI_STRINGS`
- `styles.css` — uses logical properties (`inline-start` etc.) so RTL works free
- `data.js` — the curriculum dataset (`CURRICULUM`) and UI strings (`UI_STRINGS`)
- `app.js` — rendering + state (language, view, grade, search)

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
2. Interactive practice: one grade, a few topics, instant feedback
3. Quiz/assessment builder for teachers
4. Progress tracking
