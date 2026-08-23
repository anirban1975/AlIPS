# AlIPS — Al Injaz International Private School, Math Department App

Interactive math app for grades 1–12 at Al Injaz International Private School
(Muscat, Oman). The school follows both the Cambridge and the Oman bilingual
curriculum. **The app is English-only** — Arabic was removed at the
department's request (v0.4). Do not re-introduce bilingual strings.

## Current state (v0.4)

- `index.html` / `app.js` — curriculum browser: grades 1–12 → strands → topics,
  Cambridge / Oman / Both tags, Student & Teacher views, search
- `worksheets.html` / `sheet.css` / `sheet.js` — teacher tool: worksheet and
  exam-paper generator built to the department's Word templates
- `plan.html` / `plan.css` / `plan.js` — teacher tool: lesson planner and
  slide deck (present mode, Word and PowerPoint export)
- `zip.js` — minimal STORE-method ZIP writer, used to build a real `.pptx`
  in the browser with no library and no build step
- `gen.js` — question engine: seeded RNG (`mulberry32`) + ~35 generators in
  `GENERATORS`, mapped to grades via `GRADE_GENS`
- `lessons.js` — topic content library (concept, worked example, key points,
  resource links) used to draft lesson plans and slides
- `data.js` — curriculum dataset (`CURRICULUM`) and UI strings (`UI_STRINGS`)
- `letterhead.png` — the official school letterhead, extracted from the
  department's Word templates and printed at the top of every sheet
- `letterhead-data.js` — the same image as a base64 data URI, so exported
  Word files are self-contained (regenerate with `base64 letterhead.png`)

## Print format — follow the department templates

Source templates (supplied by the department, decoded into this design):
`Gr._11A_Sem1_S1_QP.docx` (exam) and `Gr._11_wkst_format_1.docx` (worksheet).

**Font rule (non-negotiable):** Comic Sans MS —
**14 pt for Grades 1–4, 12 pt for Grades 5–12.** Implemented as `fontFor(grade)`
in `sheet.js` / `learn.js`, applied through the `--sheet-size` / `--q-size` CSS
variables. `Comic Neue` (Google Fonts) is the fallback for devices without
Comic Sans MS; the page still works offline, just with the fallback face.

**Page border:** every printed page carries a single-line border. On screen it
is the `.sheet` border; in print a fixed-position `.page-frame` element repeats
it on each page (fixed elements repeat per page in Chrome). In Word it comes
from `border: 1pt solid windowtext` on `@page WordSection1`.

**Worksheet layout:** letterhead → `Grade: <n><section>` + `Subject: …`
→ `Topic: …` + `Date: ____` → `Name: ____` → `Q1.` `Q2.` … with working space →
footer table: `Score ___ / n` + `Teacher's Remarks`, the reward chart
(Gold ≥90% / Silver 75–89% / Bronze 60–74% / Keep Practising <60%, teacher ticks
one; toggleable), and `Teacher's Signature` + `Parent's Signature` boxes.

**Exam layout:** letterhead → centred examination title → info table
(Subject / Grade / Section, Duration / Date / Marks) → signature block
(Learner, Roll No., Section Head, Academic Head, Vice Principal, Invigilator,
Parent) → marks-tally table (Question No. | Maximum Marks | Marks Obtained |
Check 1 | Check 2 | HOD, plus Total and Name & Sign rows) → Instructions →
questions as `Qn)` with `[N Marks]` and parts `(a) (b) (c)` each marked `[n]`.
Each question draws all its parts from one topic so the question reads
coherently.

## Paper plan: Quick setup vs Blueprint (v0.7)

`Paper plan` switches how a paper is specified.

- **Quick setup** — topics × questions-per-topic, difficulty per topic
  (worksheets) or the part rubric (exams). Fast for routine sheets.
- **Blueprint** — an explicit table, one row per question (worksheets) or per
  part (exams): `Q | Topic | Level | Marks`. Rows sharing a Q number become
  the parts (a)(b)(c) of that question, so a single exam question can even
  draw its parts from **different topics**. Marks are per row, so question
  totals, the marks-tally table and the grading rubric all follow the plan.
  `Fill from topics` seeds rows from the quick settings; `Paste from a
  spreadsheet` accepts comma- or tab-separated lines (header row ignored,
  topic names matched case-insensitively with a substring fallback, level
  by name or 1–3) and reports which lines it skipped.

Blueprint rows are part of the saved teacher defaults.

## Teacher-configurable rubrics (v0.6)

Nothing about marks or difficulty is hardcoded any more — `DEFAULT_PART_RUBRIC`
and `DEFAULT_BANDS` in `sheet.js` are only starting values.

- **Question rubric (exams):** a table in the panel sets marks *and* difficulty
  for each part (a)(b)(c)(d). Question totals, the info table and the
  marks-tally table are all derived from it.
- **Per-topic difficulty (worksheets):** every topic row carries its own
  Easy / Medium / Challenging / Mixed selector; "Set all to…" bulk-sets them.
  In exam mode these are muted, since difficulty comes from the part rubric.
- **Marks per question (worksheets):** 0 prints no marks; any other value
  prints `[n]` per question and sets the paper total.
- **Grading rubric:** editable score bands (min % + label), add/remove rows.
  Printed as a Grading Rubric table with the mark range computed from the
  paper total, and reused for the worksheet reward tick-boxes so the two can
  never disagree.
- **"Save these settings as my default"** persists rubrics and options to
  `localStorage` under `alips-teacher-defaults`, per teacher, per browser.

## Lesson Planner (v0.8)

`plan.html` drafts a lesson from one topic and renders it two ways from a single
model, so the printed plan and the presented slides always match:

- **Lesson plan** — objectives, success criteria, key idea, starter, I-do worked
  examples with mark-scheme steps, differentiated practice (Support / Core /
  Challenge), plenary, homework, resources, signature line. Prints, or exports
  to Word.
- **Slides** — the same content as 16:9 cards. **Present full screen** gives a
  classroom projector view (← → to move, Space to reveal answers, Esc to exit).
  **Slides as PowerPoint** writes a real `.pptx`.

The `.pptx` is assembled part by part (content types, rels, presentation,
slide master, layout, theme, slides) and zipped by `zip.js`. Verified with
`python-pptx`, which opens the output and reports 16:9 slides with the expected
text. Text in PowerPoint is plain, so `mathPlainText()` flattens ⁅n/d⁆ to `n/d`.

## Word export

`Download as Word` builds a `.doc` (Word-flavoured HTML) client-side and saves
it with a Blob — no server. Word ignores flexbox, so the Word renderer lays out
every aligned row (question + marks, grade + subject) as a **borderless table**
via the `layRow()` helper. Screen and Word output are generated from the *same*
model object, so a given paper number produces identical questions in both.

## Conventions

- Plain HTML/CSS/JS only — no frameworks, no npm, no build step. The site must
  work by opening `index.html` directly and on GitHub Pages.
- Generators MUST produce clean answers (integers, exact fractions, or values
  that round nicely) — construct the answer first, derive the question from it.
- A generator is `{ name, grades: [..], gen(r, d) -> { q, a, sol } }` where
  `sol` is worked steps with Cambridge mark codes (M1 method / A1 accuracy / B1).
- Use the typographic minus `−` in question and answer text (helper `nf()` in
  `gen.js`).
- **Mathematical notation:** generators emit `⁅n/d⁆` for a fraction (helper
  `frac()`) and `√⟨x⟩` for a radical (helper `rad()`). `mathHTML()` renders a
  proper two-tier fraction and an overlined radical on screen and in print;
  `mathWord()` emits `sup⁄sub` and an overline span, which Word renders
  reliably; `mathPlainText()` flattens both for PowerPoint. Never print a bare
  `1/2` — use `frac()`.
- Same seed ⇒ identical paper ("Paper no." printed on every sheet), so teachers
  can reprint or share a paper by its number.

## Verifying changes

No test suite. Verify visually with headless Chromium:

```
/opt/pw-browsers/chromium --headless --disable-gpu --no-sandbox \
  --window-size=1400,1400 --virtual-time-budget=4000 --screenshot=out.png \
  "file:///home/user/AlIPS/worksheets.html?grade=11&mode=exam&seed=7&auto=1"
```

URL params: `grade` (1–12), `mode` (worksheet/exam), `seed`, `auto=1`,
`count`, `space`, `questions`, `parts`, `reward=0`, `answers=0`,
`view` (student/teacher on the browser; plan/deck on the planner), `topic`.
Check the printed border by exporting a PDF and looking for one full-page
stroked rectangle per page:
`chromium --headless --print-to-pdf=out.pdf --no-pdf-header-footer "<url>"`.
Comic Sans MS is not installed in this container, so screenshots show the
fallback face — that is expected; check sizes, not the letterforms.

## Important caveats

- Curriculum content in `data.js` and lessons in `lessons.js` are AI-drafted.
  The math department must verify them against the official Cambridge
  frameworks (Primary, Lower Secondary, IGCSE, AS) and the Oman syllabus.
- No hard-coded YouTube video IDs — research links are searches. A teacher can
  pin a vetted video by setting `yt: "<videoId>"` on a lesson; it then embeds.

## Deployment

`gh-pages` branch is the live site: https://anirban1975.github.io/AlIPS/
Deploy by fast-forwarding `gh-pages` to the feature branch and force-pushing.

Google Cloud (Firebase Hosting) is the school's second target:
`firebase.json` holds the hosting config, `deploy/gcp-deploy.sh` does the whole
deploy in one command, and `docs/CLOUDSHELL.md` is the Cloud Shell tutorial the
one-click link opens. See `docs/DEPLOY-GCP.md`. `.firebaserc` is generated per
user and git-ignored.

## Roadmap

1. ~~v0.1 Curriculum browser~~ — done
2. ~~v0.2 Worksheet + exam generator~~ — done
3. ~~v0.3 Practice & Learn with mark schemes~~ — done
4. ~~v0.4 English-only + department print templates + Comic Sans sizing~~ — done
5. ~~v0.5 Page borders, Word export, worksheet score/reward/signature block~~ — done
6. ~~v0.8 Lesson planner + slides (present mode, .pptx), proper maths notation,
   guided-learning/practice page removed~~ — done
7. More generators (statistics tables, geometry with diagrams, word problems)
8. Editable lesson-plan fields saved per teacher
