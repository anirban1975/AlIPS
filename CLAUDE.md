# AlIPS — Al Injaz International Private School, Math Department App

Interactive math app for grades 1–12 at Al Injaz International Private School
(Muscat, Oman). The school follows both the Cambridge and the Oman bilingual
curriculum. **The app is English-only** — Arabic was removed at the
department's request (v0.4). Do not re-introduce bilingual strings.

## Current state (v1.8)

- `index.html` / `app.js` — curriculum browser: grades 1–12 → stream → strands →
  topics, built from the department's Annual Syllabus 2026-27. Stream selector
  for Grades 10–12 (IGCSE/GED, GED Advance/Basic) and search. **One view of the
  whole syllabus** — there is no Student/Teacher toggle and no month filter
  (removed at the department's request, v1.6); teaching notes always show
- `worksheets.html` / `sheet.css` / `sheet.js` — teacher tool: worksheet and
  exam-paper generator built to the department's Word templates
- `topics.js` — the syllabus topic list and topic→generator matching, shared by
  the planner and the worksheet generator so both offer the same topics
- `plan.html` / `plan.css` / `plan.js` — teacher tool, three sections:
  **1 Preparing PPT** (a deck per sub-topic, present mode, PowerPoint export,
  and links out to Canva, Figma, Gemini and Brisk), **2 Interactive
  simulation** (the simulator on the main stage, plus video searches), and
  **3 Weekly plan** (the department's template, print and Word export)
- `zip.js` — minimal STORE-method ZIP writer, used to build a real `.pptx`
  in the browser with no library and no build step
- `gen.js` — question engine: seeded RNG (`mulberry32`) + 182 generators in
  `GENERATORS`, mapped to grades via `GRADE_GENS`
- `lessons.js` — topic content library (concept, worked example, key points,
  resource links, and the `sim` attribute naming the topic's simulator) used to
  draft lesson plans and slides
- `sims.js` — the interactive simulators for Grades 5-12: 30 manipulatives
  drawn with the browser's own SVG (no library, no internet, no account),
  driven by sliders and selects, plus the partial fractions board, which is
  laid out in HTML so the algebra is set as real fractions
- `sims-kids.js` — the Grade 1-4 simulators: 12 manipulatives a child moves by
  hand (counters, coins, biscuits, cubes) plus a jungle-themed number-tracing
  board, each with Explore, Play and step-by-step modes, Support/Core/Challenge
  levels, stars, a streak and browser-made sound
- `learners.js` — the differentiation record: class lists (first names, on the
  machine only), the log of answers given in Play mode, the banding into needs
  support / secure / ready for more, the next-lesson suggestions and the export
- `data.js` — curriculum dataset and UI strings (`UI_STRINGS`), transcribed from
  the seventeen annual plan documents. `TRACKS` holds each syllabus once (with
  its course book and the month each topic is taught), `GRADE_TRACKS` says which
  track(s) a grade offers, and `CURRICULUM` (what `app.js` reads) is built from
  the two
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

## Paper plan: Quick setup vs Blueprint (v1.1)

`Paper plan` switches how a paper is specified.

- **Quick setup** — topics × questions-per-topic, difficulty per topic
  (worksheets) or the part rubric (exams). Fast for routine sheets.
- **Blueprint** — an explicit table, **one line per sub-part**:
  `Q | Part | Topic | Level | Type | AO | Marks`. Lines sharing a Q number
  become the parts (a)(b)(c) of that question, so one question can draw its
  parts from **different topics**; a question with one line prints with no part
  letter. The Part column is derived from position, never typed.
  - **Type** — `MCQ` / `SAQ` / `LAQ`. It sets the working space printed after
    the part (none / a line or two / a worked page) and, for MCQ, prints
    options A–D.
  - **AO** — `AO1` (knowledge and understanding) or `AO2` (reasoning,
    interpretation and communication). Marks are tallied per objective and
    printed on the paper as an **Assessment Objectives** table with
    percentages, alongside the split by question type.
  - `+ Question` adds a question with N sub-parts; `+ Sub-part` adds one more
    to the last question. Both worksheets and exams support sub-parts.

`Fill from topics` seeds lines from the quick settings, defaulting the last
part of a question to AO2 and challenging parts to LAQ. `Paste from a
spreadsheet` accepts comma- or tab-separated lines (header row ignored, topic
names matched case-insensitively with a substring fallback, level by name or
1–3). Type and AO are recognised anywhere after the level and may be omitted,
so the older `Q, Topic, Level, Marks` form still loads.

Blueprint rows are part of the saved teacher defaults.

**MCQ options** come from `makeOptions()` in `gen.js`: distractors are drawn
from the *same generator at the same difficulty*, so a wrong option is always
the answer to a question the learner could plausibly have solved instead.
`shapeOf()` prefers distractors of the same form as the answer (a "x = 3"
option under a "write as a single logarithm" question is a giveaway), and
three same-shape options are preferred over four with an odd one out. Numeric
near-misses fill any gap. If a generator cannot supply two distinct
distractors the part silently falls back to SAQ rather than printing a
dishonest choice. The mark scheme prints the option letter and the answer.

## Topics come from the syllabus, everywhere (v1.3)

`topics.js` is the single source: `topicRegistry(grade, trackIndex)` returns the
sub-topics of one syllabus, each with the generator that covers it or `null`,
and `tracksForGrade(grade)` lists the streams a grade offers. The planner and
the worksheet generator both read it, so a topic named one way in one tool is
never named another way in the other.

The **worksheet generator** lists the department's sub-topics grouped by strand,
with a **Stream** selector on Grades 10-12. A sub-topic with no generator cannot
make a worksheet, so it is shown struck through and disabled rather than left
out — a teacher sees the whole syllabus and exactly what is covered. "Only
sub-topics with questions" (**off by default** since v1.6, so the dropdown is
the syllabus) hides them. The printed `Topic:` line uses the syllabus wording,
and blueprint rows pick from the same list.

Topic keys are `<trackKey>|<sub-topic name>`, unique per syllabus. `genOf(key)`
resolves the generator and falls back to treating the key as a generator id, so
teacher defaults saved before this change still load.

## Worksheets that are not questions (v1.4)

Not every syllabus line is a question. Grade 1's "Tracing numbers 1 to 10" is
handwriting practice: the child traces over dotted numerals in a grid.

A generator can return a `trace` field instead of relying on the question line:

```js
trace: { char: "5", guides: 4, blanks: 3, word: "five" }
```

`traceGrid()` in `sheet.js` prints one solid model numeral, `guides` hollow
numerals to trace over, and `blanks` empty squares to write in unaided, with
the number word underneath. The hollow effect is `-webkit-text-stroke` with a
transparent fill, behind an `@supports` guard so browsers without it fall back
to light grey — still traceable, and it prints the same either way. Word has no
text-stroke at all, so `wordTrace()` prints light-grey numerals in a bordered
table. A tracing item brings its own grid, so no ruled working space is added
after it, and it is never turned into an MCQ.

## Sorting diagrams (v1.5)

"Venn diagrams and Carroll diagrams" is a sorting exercise, not a question, so
like tracing it prints a diagram to fill in. A generator returns `venn` or
`carroll` instead of relying on the question line:

```js
venn:    { a: "Even", b: "A multiple of 3", items: [...] }
carroll: { rows: ["Even", "Odd"], cols: ["Less than 15", "15 or more"], items: [...] }
```

`sortingSets()` in `gen.js` picks two properties from `SORT_RULES` and builds
the number set so **every region is non-empty** — a Venn with an empty overlap
teaches nothing. It retries until all four regions fill, with a guaranteed
fallback.

`vennSVG()` draws two overlapping circles inside the universal-set rectangle;
`carrollTable()` draws the criterion against its negation both ways. Word's
HTML importer ignores SVG, so `vennPNG()` redraws the Venn on a canvas and
embeds it as a PNG; the Carroll diagram is a table, which Word handles natively.

`sortingDiagrams` alternates between the two, because the syllabus line names
both; `vennDiagram` alone serves "Venn diagrams" (Grade 7) and "Set notation
and Venn diagrams" (Grade 9).

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

## Lesson Planner — two sections (v1.7)

`plan.html` has **two sections**, both built from one model of the chosen
sub-topic, so the slides a teacher presents and the plan they hand in always
contain the same questions:

1. **Presentation** — a slide deck for one sub-topic: on screen as cards, full
   screen for the projector (← → to move, Space to reveal), and a real `.pptx`.
2. **Weekly plan** — the department's own template, reproduced exactly.

`setView()` swaps the panel controls, the buttons and the print page size; the
grade, stream, sub-topic, objectives and question counts are shared by both.

**The topic list is the curriculum, not the generator list.** All 896 syllabus
sub-topics are selectable, grouped by strand; Grades 10-12 get a **Stream**
selector (IGCSE/GED, AS/GED Advance/Basic). `matchGenerator()` in `topics.js` links a topic to a question
generator by word overlap: every significant word of the shorter name must
match, and a tie counts as no match, because a wrong lesson is worse than none.
`TOPIC_ALIASES` covers wording that will never align on its own ("Finding
totals" -> Addition within 20, "Tracing numbers 1 to 10" -> Reading and writing
numbers). **894 of the 896 sub-topics reach a generator** — the two that do not
are "Past paper booklet solving" and "Mock examinations", which are revision
slots in the annual plan rather than topics. Extend both `GENERATORS` and
`TOPIC_ALIASES` together whenever a gap is reported.

**An alias must name a topic that exists.** A key with a typo is a dead entry
that silently never fires, so check every new key against the live syllabus:

```
node -e 'const fs=require("fs"),vm=require("vm");const c={console};vm.createContext(c);
for(const f of ["data.js","gen.js","topics.js"])vm.runInContext(fs.readFileSync(f,"utf8"),c);
const{CURRICULUM,TOPIC_ALIASES,GENERATORS}=vm.runInContext("({CURRICULUM,TOPIC_ALIASES,GENERATORS})",c);
const norm=s=>s.toLowerCase().replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();
const live=new Set();CURRICULUM.forEach(g=>g.tracks.forEach(t=>t.strands.forEach(
  s=>s.topics.forEach(x=>live.add(norm(x.n))))));
Object.entries(TOPIC_ALIASES).forEach(([k,v])=>{
  if(!GENERATORS[v])console.log("NO GENERATOR:",k,"->",v);
  else if(!live.has(k))console.log("DEAD ALIAS (no such topic):",k);});'
```

**Sub-topic level, not unit level.** The AS, A Level and GED Advance tracks
originally listed each annual-plan *unit* as one topic ("Series", "Algebra"),
which hid the sub-topics under it. Every track now lists the plan's own
sub-topic lines. When adding a track, transcribe the SUB TOPIC NAME column,
never the UNIT NAME column.

Run the coverage audit before claiming a grade is covered:

```
node -e 'const fs=require("fs"),vm=require("vm");const c={console};vm.createContext(c);
for(const f of ["data.js","gen.js","topics.js"])vm.runInContext(fs.readFileSync(f,"utf8"),c);
const{CURRICULUM,topicRegistry}=vm.runInContext("({CURRICULUM,topicRegistry})",c);
for(const g of CURRICULUM)g.tracks.forEach((t,i)=>{const r=topicRegistry(g.id,i);
console.log("G"+g.id,"["+t.label+"]",r.filter(x=>x.gen).length+"/"+r.length,
r.filter(x=>!x.gen).map(x=>x.name).join(" | "))});'
```

What remains uncovered is mostly work a generated worksheet cannot carry:
Venn and Carroll diagrams, "Patterns and pictures", data-collection and
sampling tasks, constructions, and topics needing a printed diagram.
A topic with no generator still produces a full plan — objectives, success
criteria, the syllabus's own description as the key idea, resource links, and
ruled space for the teacher to write the examples and tasks in.

**Objectives and success criteria come in three layers**, highest first:

1. **This teacher's saved wording** — `localStorage`, key `alips-lesson-fields`,
   per topic. Written on Generate, but *only when it actually differs from the
   department wording*, so a teacher who never edits keeps receiving department
   revisions. `Use department wording` deletes the override.
2. **Department wording** — `DEPT_FIELDS` in `lessons.js`, covering all 38
   topics. This is what every teacher sees first, on any machine, with no
   set-up and no network. **To revise: edit `lessons.js` and redeploy.**
3. **Generic draft** — `draftObjectives()` / `DRAFT_CRITERIA` in `plan.js`, a
   fallback for any topic with no department entry.

The status line under the fields says which layer is in use. `Export my wording`
writes a readable file of everything this teacher has reworded, for the HOD to
review and possibly fold into `DEPT_FIELDS`. Teacher name / section / duration
persist under `alips-planner-prefs`.

**Interactive simulators** are the planner's fourth attribute of a sub-topic,
next to objectives, criteria and questions. The card sits in the planning panel
and changes with the chosen sub-topic; `▶ Open the simulator` lifts it into an
overlay big enough for a projector (Escape or a click on the dark edge closes
it). Simulators are screen-only — they never appear in the print, the Word file
or the PowerPoint.

Which simulator a sub-topic gets is decided in two steps, in `lessons.js`:

1. **The topic's own `sim` attribute** — `{ use: "<id from sims.js>", opts: {…} }`
   on the `LESSONS` entry. All 40 generator-backed topics have one. This is the
   department's choice for that topic, and it is what should be edited when a
   teacher says the wrong tool comes up.
2. **`SIM_KEYWORDS`** — the syllabus has 896 sub-topic entries against 40
   generators, so most sub-topics have no `sim` of their own. Their wording is
   matched against a keyword table, first match wins, and the card says
   *“Closest simulator for this sub-topic”* so nobody mistakes a match for a
   departmental choice. 884 of the 896 entries reach a simulator this way; the
   twelve that do not (mock examinations, past-paper booklets, the complex
   plane, polar form) still get the links out.

**Which simulator a sub-topic gets is decided by its question generator, not by
its wording.** `GEN_SIM` in `lessons.js` maps every generator in `gen.js` to a
simulator; the order is: the junior map for Grades 1-4, then the lesson's own
`sim`, then `GEN_SIM`, then — only for sub-topics with no generator at all —
the `SIM_KEYWORDS` wording match. A `null` entry in `GEN_SIM` means nothing
honest fits, and the card says so instead of guessing.

This order exists because wording matching humiliated itself at senior level:
"the factor theorem" contains *factor*, so Grade 12 was shown the times-table
array; "the remainder theorem" was shown biscuits shared onto plates; "partial
fractions" got halves and quarters; "the modulus function" got the Grade 6
function machine. Two guards back it up: at Grades 9-12 a wording guess is only
accepted if the simulator is in `SENIOR_OK`, and `SENIOR_SWAP` re-dresses the
handful of junior manipulatives that are the right idea at the wrong age (the
coin purse becomes percentages for "Money and finance" at IGCSE). After the
change, 752 of the 896 sub-topic entries match on their topic, 141 on wording
(all Grade 8 and below), and 3 have no simulator — mock exams, past-paper
booklets, and transforming trigonometric graphs.

**Partial fractions is a worked-example board, not a manipulative.** Cambridge
sets four shapes of question and a candidate who writes the wrong *form* on
line one has lost the question before any arithmetic. So `defs.partialFractions`
in `sims.js` names the form first and gives a reason for it, then reveals the
working one line at a time: two different linear factors, a repeated linear
factor, an irreducible quadratic factor, and an improper fraction that needs a
whole term in front. Three rules hold it honest:

- every example is built backwards from whole-number constants, and all the
  arithmetic runs on exact fractions, so nothing on the board is ever rounded;
- the constants shown are **re-derived** by the substitution a pupil would do,
  not copied from the construction, so the working checks the answer;
- the last line evaluates both sides at a test value and says they agree — and
  if they ever did not, it says that instead of printing a wrong answer.

A test (`/tmp/test/pf.js`, Playwright) reads the printed answer back off the
page, rebuilds both sides from that text alone and compares them numerically
over 240 random examples. It mounts the simulator inside `.sheet` on purpose:
that is where the worksheet CSS lives, and it is where the tracing board broke
on the live site. Every rule for this board is written under `.pf` for the same
reason.

`simulatorsFor(generatorId, subTopicName, grade)` in `lessons.js` is the single
entry point and returns `{ builtIn, links, videos }`. To add a simulator: write
it in `sims.js` (`name`, a one-line `blurb` a teacher can read aloud, and
`mount(host, opts)` that fills the host), then point topics at it — by `sim` on
the lesson, by a `SIM_KEYWORDS` row, or both.

**Grades 1 to 4 are served different simulators.** A slider is no instrument
for a six-year-old, so `sims-kids.js` holds eleven built from things a child
picks up: ten frames, a number track, tens and ones, arrays, sharing biscuits,
fractions of a shape, Omani coins, clock hands, sorting shapes, measuring with
cubes, and a pictogram. Every one has three modes — Explore, Play (a question,
a star, a streak) and step-by-step for the board — and every one takes both a
drag and a tap-then-tap, because a drag misfires on an interactive whiteboard.
Sound is made by the browser (`AudioContext`, no files) and the mute is
remembered under `alips-sim-muted`.

**Tracing numbers** (`traceNumber`) is the one that is not a manipulative. Each
digit is an SVG path in `DIGIT` — one entry per numeral, two paths where the
numeral takes two strokes, drawn in a 100x140 box starting where a child is
taught to start. Three layers are stacked per stroke: a pale wide *road*, a
dashed centre line, and the child's ink revealed by shrinking a dash offset.
Marking is what makes it tracing rather than scribbling: each stroke is sampled
into points and the pointer must pass near them **in order** (looking at most
six ahead), so going backwards or starting at the wrong end fills nothing in.
Tolerance follows the level (26 / 19 / 15 user units), Challenge is two digits,
and a single tap walks along the stroke for boards where dragging misfires.
The jungle skin is the `kid-jungle` class on the wrapper — it re-colours the
shell, so any other junior simulator can wear it by adding the class.

The grade decides: `simulatorsFor` tries `KID_SIM` (by generator id) then
`KID_KEYWORDS` (by sub-topic wording) whenever the grade is 4 or below, and
falls through to the senior simulators when neither matches — which is why a
Grade 3 lesson on position still gets the senior grid. 202 of the 226 Grade 1-4
sub-topic entries reach a junior simulator; the rest land on a senior one that
suits them. `#sim-pick` in the panel lists every simulator in both files, so a
teacher can override the match in either direction.

Video links are searches (`videoLinks()`), never pinned ids — same rule as the
research links, and the panel says so.

## The differentiation record

A turn at the board is assessment, and it is normally lost. Section 2 keeps it.
The teacher types a class list once (first names), taps whose turn it is, and
every answer given in **Play** mode is logged against that child, the sub-topic
and the level. The report under the simulator fills in as the lesson runs, so
the groups form in front of the teacher rather than being guessed at later.

- **Storage.** `alips-classes` (lists), `alips-diff-log` (attempts, capped at
  4000), `alips-diff-current` (whose turn). First names only, in that browser
  on that machine. Nothing is uploaded and there is no server to upload to.
  `Delete this class` needs two taps and removes the names and their answers;
  every read and write is wrapped, so a locked-down machine simply records
  nothing rather than breaking.
- **Nothing is recorded unless a name is tapped.** No selected child, no log
  entry — which is also how a teacher demonstrates without polluting the record.
- **Bands** (`bandOf`): under 3 answers is "not enough yet"; then 85%+ first-try
  is *ready for more*, 60-85% *secure*, below that *needs support*, over that
  child's last twelve answers on the sub-topic.
- **Suggestions** (`suggest`): each band gets named children and an action, with
  `NEXT` giving the simulator to move on to when a group is ready.
- **Export** (`exportText`): a readable file for the HOD — by child, then by
  sub-topic — with the raw log as JSON underneath.

`KIDS.onAttempt(fn)` is the hook: the junior engine calls it on every marked
answer in Play mode with `{sim, level, correct}`, and `plan.js` turns that into
a log entry. The senior simulators explore rather than test, so they record
nothing — the report says so when one is on screen.

- **Presentation** — 16:9 cards. **Present full screen** gives a classroom
  projector view (← → to move, Space to reveal answers, Esc to exit).
  **Presentation as PowerPoint** writes a real `.pptx`.

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

## The weekly plan is a Ministry form — match it exactly (v1.7)

Source: the department's `example_of_lesson_plan.docx`. It is an Oman Ministry
of Education form, not a design of ours, so **the wording, the column order and
the grid shape are fixed**. Do not "improve" them.

**Page:** A4 **landscape**, margins 1.25cm top / 2.5cm sides / 0.75cm bottom.
An `@page` rule cannot be scoped to a class, so `setPageSize()` in `plan.js`
swaps the rule itself when the section changes — otherwise the presentation
would print on its side too. The form carries **no page border**, unlike the
worksheets, so `.weekly-view` drops the `.sheet` border and hides `.page-frame`.

**Title:** `Lesson Plan for Mathematics`, centred, bold, 18 pt.

**Week grid** — label column, then one block of three periods per class:

```
Class               | 5\1                    | 5\2
Day & Date          | SAT .. | SUN .. | MON ..| SAT .. | SUN .. | MON ..
Period              | 1st    | 3rd    | 6th   | 2nd    | 1st    | 5th
Objectives achieved | 1      | 2      | 2,3   | 1      | 2      | 2,3
(spanning note) ♦ A lesson should be covered in maximum 3 periods (not days)
                ♦ In grade (1-4): One objective can be achieved in 2-4 periods
```

The original is a right-to-left table (`bidiVisual`), which *displays* with the
row label on the left — that display order is what is reproduced, LTR.
Because a single period can reach two objectives ("2,3"), the panel separates
the **Objectives achieved** cells with a **bar**, not a comma; periods still
separate on commas.

**Then:** `Title: ………………..`, `Introduction:` and its six tick options
(Activity / Experiment / Story / Game / Question / Drawing a diagram).

**Planning grid** — seven columns, in this order and at these widths
(the template's own proportions, `WK_COLS` / `WK_W` in `plan.js`):

| Objectives | Strategies & Activities | Time | Educational aids | Assessment | Continuous assessment tools | Remarks |
|---|---|---|---|---|---|---|
| 20.0% | 21.8% | 7.5% | 11.5% | 14.6% | 11.8% | 12.7% |

**One row per objective.** The template's own guidance is to "write each
Example\Activity corresponding to objective wanted to achieved", so
`buildWeekly()` deals the worked examples and the practice questions round the
objectives — every row carries something, none is left empty while another has
three. The Objectives column opens with the template's stem, *"The student
should be able to:"*. **Educational aids** and **Continuous assessment tools**
are chosen once for the lesson, so they are written in the first row and
`rowSpan` the rest, as a teacher filling the paper form by hand would.

The tick lists (`WK_INTRO`, `WK_AIDS`, `WK_TOOLS`) are the template's own, and
the panel checkboxes are built from the same arrays that print, so the two
cannot drift.

**Footer:** the four signature lines — Teacher's / Senior teacher's /
Supervisor's / Principle's. ("Principle" is the template's spelling; keep it.)
Word ignores flexbox, so the Word export lays that row out as a borderless
table, the same trick `layRow()` uses in `sheet.js`.

A sub-topic with no generator still produces the whole form, with the
Strategies and Assessment cells left blank for the teacher to write in — which
is exactly what the paper template expects.

**The form is typeable (v1.8).** A drafted plan is a starting point, not the
plan: every cell of the planning grid, plus the Title line, is
`contenteditable`, so a teacher clicks in and writes their own strategy over
the draft. Cell ids are stable (`r0.act`, `r2.assess`, `aids`, `tools`,
`title`), and what is typed is kept per **sub-topic** in `localStorage` under
`alips-weekly-edits`, so a week's work survives a reload, a re-generate, a new
seed and a trip to the presentation and back. `Clear my typing` drops the
override and the draft comes back.

- An edited cell **wins over the drafted content** everywhere — screen, print
  and Word — through `cell(id, drafted)` in `weeklyWord()`.
- `Strategies & Assessment: Leave blank` drafts nothing at all, for teachers who
  would rather write the whole plan themselves. **Extra blank rows** adds rows
  beyond one per objective, for anything else taught that week.
- Pasted markup is reduced to a plain subset by `cleanHTML()` before it reaches
  the Word exporter: `script`/`style`/`iframe`/`object`/`embed`/`link` are
  removed outright, every other unknown tag is unwrapped so the words survive,
  and all attributes are dropped except the classes this file sets. A teacher
  pasting out of Word must not be able to break the export.
- The dashed edit outline is screen-only. **The printed form and the Word file
  must look exactly like the Ministry template**, so `@media print` clears it.

## Difficulty must change the question, not just the numbers

Easy / Medium / Challenging are three *kinds* of question, not one question
with bigger numbers. A generator whose three branches differ only in the digits
is a bug — the department reported exactly that ("in completing the square
there was no question where x² has a coefficient").

The rule each senior generator follows:

- **d1** the technique in its plainest form
- **d2** the same technique with an extra step or a harder form (a leading
  coefficient, a rearrangement, an inverse)
- **d3** the technique applied — a turning point classified, a stationary point
  found, an angle of elevation, an exact area, grouped data

Check any generator you touch with:

```
node -e 'const fs=require("fs"),vm=require("vm");const c={console};vm.createContext(c);
for(const f of ["data.js","gen.js"])vm.runInContext(fs.readFileSync(f,"utf8"),c);
const{GENERATORS,mulberry32}=vm.runInContext("({GENERATORS,mulberry32})",c);
for(const[id,g]of Object.entries(GENERATORS)){const q=[1,2,3].map(d=>g.gen(mulberry32(77),d).q);
if(q[0]===q[1]||q[1]===q[2])console.log("NOT VARYING:",g.name);}'
```

## Verifying changes

No test suite. Verify visually with headless Chromium:

```
/opt/pw-browsers/chromium --headless --disable-gpu --no-sandbox \
  --window-size=1400,1400 --virtual-time-budget=4000 --screenshot=out.png \
  "file:///home/user/AlIPS/worksheets.html?grade=11&mode=exam&seed=7&auto=1"
```

URL params: `grade` (1–12), `mode` (worksheet/exam), `seed`, `auto=1`,
`count`, `space`, `questions`, `parts`, `reward=0`, `answers=0`,
`view` (`deck` or `weekly` on the planner), `topic`.
Check the printed border by exporting a PDF and looking for one full-page
stroked rectangle per page:
`chromium --headless --print-to-pdf=out.pdf --no-pdf-header-footer "<url>"`.
Comic Sans MS is not installed in this container, so screenshots show the
fallback face — that is expected; check sizes, not the letterforms.

## Important caveats

- Curriculum content in `data.js` is transcribed from the department's own
  Annual Syllabus 2026-27 (seventeen PDFs, one per grade and stream). Lessons
  in `lessons.js` are still AI-drafted and need department review.
- **The pathway comes from the annual plans, not from a guess.** `GRADE_TRACKS`
  in `data.js`: Grades 1–6 Primary Stages 1–6; Grade 7 Lower Secondary Stages
  7 **and** 8; Grade 8 Stages 8 **and** 9; Grade 9 IGCSE 0580 year 1; Grade 10
  IGCSE year 2 **or** GED; Grade 11 AS 9709 **or** GED Advance / Basic; Grade
  12 A Level 9709 (PM3 **and** S2) **or** GED Advance / Basic. Lower Secondary
  is compressed so IGCSE can start in Grade 9 and AS in Grade 11.
  Generator years live in the `grades` array on each generator in `gen.js` and
  must be kept in step with this.
- No hard-coded YouTube video IDs — research links are searches. A teacher can
  pin a vetted video by setting `yt: "<videoId>"` on a lesson; it then embeds.
- The same rule holds for simulators: the links out to GeoGebra and PhET are
  searches built from the topic's `q`, not fixed pages, so they do not rot.
  Desmos and Polypad are linked as tools. Nothing a lesson depends on lives on
  someone else's server — that is what the built-in simulators are for.

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
7. ~~v1.6 Every syllabus sub-topic reaches a generator; Student view and
   monthwise segregation removed~~ — done
8. ~~v1.7 Lesson planner split into Presentation and the department's own
   weekly plan template~~ — done
9. ~~v1.8 The weekly plan is typeable — teachers write their own strategy over
   the draft and it is kept per sub-topic~~ — done
10. Editable starter/plenary text and per-topic keyword lists
11. Diagram-bearing generators (constructions, histograms, transformations
    drawn on a printed grid)
