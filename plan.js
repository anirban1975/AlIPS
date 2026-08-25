// AlIPS Lesson Planner — two sections, both built from one model of the
// chosen sub-topic, so the slides a teacher presents and the plan they hand in
// always contain the same questions.
//
//   1. Presentation — a slide deck for one sub-topic: on screen, full screen
//      for the projector, and a real PowerPoint (.pptx) built by zip.js.
//   2. Weekly plan  — the department's own template (A4 landscape, the week
//      grid of two classes x three periods, the seven-column planning grid and
//      the four signature lines), on screen, in print and as Word.

(function () {
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const esc = (s) => String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  // Math markup (see gen.js): ⁅n/d⁆ fraction, √⟨x⟩ radical.
  const FRAC_RE = /⁅([^\/⁆]*)\/([^⁆]*)⁆/g;
  const RAD_RE = /√⟨([^⟩]*)⟩/g;
  const mathHTML = (t) => esc(t)
    .replace(FRAC_RE, (_, n, d) =>
      `<span class="frac"><span class="fnum">${n}</span><span class="fden">${d}</span></span>`)
    .replace(RAD_RE, (_, x) => `<span class="radic">√<span class="vinc">${x}</span></span>`)
    .replace(/\n/g, "<br>");
  const mathWord = (t) => esc(t)
    .replace(FRAC_RE, (_, n, d) => `<sup>${n}</sup>&frasl;<sub>${d}</sub>`)
    .replace(RAD_RE, (_, x) => `&radic;<span style="text-decoration:overline">${x}</span>`)
    .replace(/\n/g, "<br>");
  // PowerPoint text is plain — flatten fractions to a/b.
  const mathPlainText = (t) => String(t)
    .replace(FRAC_RE, "$1/$2").replace(RAD_RE, "√$1");

  const state = { view: "deck", grade: 5, track: 0, topic: null, topics: [],
                  model: null, spec: null, slide: 0, revealed: false,
                  wkEdits: {} };   // what the teacher has typed on the weekly form

  // Topic list and generator matching live in topics.js, shared with the
  // worksheet generator so both tools offer exactly the same topics.
  const trackList = () => tracksForGrade(state.grade);
  const currentTrack = () => {
    const ts = trackList();
    return ts[Math.min(state.track, ts.length - 1)];
  };
  function buildTopicRegistry() {
    state.topics = topicRegistry(state.grade, state.track);
    return state.topics;
  }
  const topicByKey = (key) => state.topics.find((t) => t.key === key) || null;

  // ---------- Teacher's own wording, remembered per topic ----------
  const FIELD_KEY = "alips-lesson-fields";     // { [topicId]: {objectives, criteria} }
  const PREF_KEY = "alips-planner-prefs";      // teacher, section, duration

  // Some syllabus topics are written "Algebra: the modulus function"; the
  // strand prefix belongs on the heading, not inside the objective.
  const bareTitle = (t) => String(t).replace(/^[^:]{1,28}:\s*/, "");

  const draftObjectives = (title) => [
    `Understand ${bareTitle(title)}.`,
    "Apply the method accurately to routine questions.",
    "Explain each step of the reasoning."
  ];
  const DRAFT_CRITERIA = [
    "I can state the rule in my own words.",
    "I can work through an example without help.",
    "I can spot and correct a mistake in someone else's work."
  ];

  const readStore = (k) => {
    try { return JSON.parse(localStorage.getItem(k) || "null") || {}; }
    catch { return {}; }
  };
  const writeStore = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; }
  };

  const linesOf = (id) => $(id).value.split("\n").map((t) => t.trim()).filter(Boolean);

  // Department-approved wording, which lives against the question generator, so
  // it is found by the generator a topic maps to rather than by the topic key.
  function deptFields(topic, title) {
    const t = topicByKey(topic);
    const gid = t ? t.gen : topic;
    const d = (typeof DEPT_FIELDS !== "undefined" && gid && DEPT_FIELDS[gid]) || null;
    return {
      objectives: d && d.objectives && d.objectives.length ? d.objectives : draftObjectives(title),
      criteria: d && d.criteria && d.criteria.length ? d.criteria : DRAFT_CRITERIA,
      isDept: !!d
    };
  }

  // Three layers: this teacher's saved wording → department wording → generic
  // draft. Wording saved before topics were keyed per syllabus lives under the
  // generator id, so that is checked too and nothing a teacher wrote is lost.
  function loadFields(topic, title) {
    const store = readStore(FIELD_KEY);
    const t = topicByKey(topic);
    const saved = store[topic] || (t && t.gen ? store[t.gen] : null);
    const dept = deptFields(topic, title);
    const useSaved = saved && saved.objectives && saved.objectives.length;
    $("objectives").value = (useSaved ? saved.objectives : dept.objectives).join("\n");
    $("criteria").value = (useSaved ? saved.criteria : dept.criteria).join("\n");
    $("fields-msg").textContent = useSaved ? "your saved wording"
      : dept.isDept ? "department wording" : "draft wording";
    // Setting .value in code fires no input event, so the weekly grid's
    // "Objectives achieved" column has to be told the count changed.
    syncAchieved();
    // Each sub-topic keeps its own copy of whatever the teacher has typed on
    // the weekly form.
    state.wkEdits = wkEditsFor(topic);
    const msg = $("wk-edit-msg");
    if (msg) msg.textContent = Object.keys(state.wkEdits).length
      ? "your wording is saved on this device" : "";
  }

  // Only store an override when the teacher has actually changed the wording.
  // Saving an untouched copy would silently freeze this teacher on today's
  // department baseline and hide any later revision from them.
  function saveFields(topic) {
    const objectives = linesOf("objectives");
    const criteria = linesOf("criteria");
    const dept = deptFields(topic, currentTitle());
    const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
    const all = readStore(FIELD_KEY);

    if (same(objectives, dept.objectives) && same(criteria, dept.criteria)) {
      if (all[topic]) { delete all[topic]; writeStore(FIELD_KEY, all); }
      $("fields-msg").textContent = dept.isDept ? "department wording" : "draft wording";
      return;
    }
    all[topic] = { objectives, criteria };
    if (writeStore(FIELD_KEY, all)) $("fields-msg").textContent = "saved for this topic";
  }

  const fontFor = (grade) => (grade <= 4 ? 14 : 12);

  // ---------- Weekly-plan panel controls ----------

  // Tick lists (introduction method, educational aids, assessment tools) are
  // built from the same arrays the template prints, so the two cannot drift.
  function buildChecks(id, items, preset) {
    const box = $(id);
    box.innerHTML = "";
    items.forEach((name) => {
      const lab = el("label", "check-inline");
      const cb = el("input");
      cb.type = "checkbox";
      cb.value = name;
      cb.checked = preset.includes(name);
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(" " + name));
      box.appendChild(lab);
    });
  }
  const checkedIn = (id) =>
    Array.from($(id).querySelectorAll("input:checked")).map((c) => c.value);

  // Two classes, three periods each — the shape of the template's week grid.
  function buildClassRows() {
    const body = $("wk-classes").querySelector("tbody");
    body.innerHTML = "";
    [["A", "1st, 3rd, 6th"], ["B", "2nd, 1st, 5th"]].forEach(([suffix, periods], i) => {
      const tr = el("tr");
      const mk = (cls, value, title) => {
        const td = el("td");
        const inp = el("input");
        inp.type = "text";
        inp.className = cls;
        inp.value = value;
        if (title) inp.title = title;
        td.appendChild(inp);
        tr.appendChild(td);
        return inp;
      };
      mk("wk-cname", `${state.grade}\\${i + 1}`, "Class name, as it appears on the plan");
      mk("wk-cper", periods, "Three periods, comma separated");
      mk("wk-cach", "", "Objective numbers reached in each period");
      body.appendChild(tr);
    });
    syncAchieved();
  }

  // "Objectives achieved" follows the number of objectives unless the teacher
  // has typed over it.
  function syncAchieved() {
    const n = Math.max(1, linesOf("objectives").length);
    const want = defaultAchieved(n).join(" | ");
    $("wk-classes").querySelectorAll(".wk-cach").forEach((inp) => {
      if (!inp.value.trim() || inp.dataset.auto === "1") {
        inp.value = want;
        inp.dataset.auto = "1";
      }
    });
  }

  function readClasses() {
    return Array.from($("wk-classes").querySelectorAll("tbody tr")).map((tr) => {
      const cell = (cls) => tr.querySelector("." + cls).value;
      // Periods separate on commas; objective numbers separate on a bar, since
      // a single period can reach more than one objective ("2,3").
      const three = (t, sep) => {
        const parts = String(t).split(sep).map((x) => x.trim());
        return [parts[0] || "", parts[1] || "", parts[2] || ""];
      };
      return { name: cell("wk-cname"),
               periods: three(cell("wk-cper"), ","),
               achieved: three(cell("wk-cach"), "|") };
    });
  }

  // ---------- Panel ----------

  function buildGradeSelect() {
    const sel = $("grade-select");
    sel.innerHTML = "";
    for (let g = 1; g <= 12; g++) {
      const o = el("option", "", "Grade " + g);
      o.value = g;
      if (g === state.grade) o.selected = true;
      sel.appendChild(o);
    }
  }

  // Stream selector — only Grades 10-12 run more than one syllabus.
  function buildTrackSelect() {
    const sel = $("track-select");
    const tracks = trackList();
    sel.innerHTML = "";
    tracks.forEach((t, i) => {
      const o = el("option", "", t.label);
      o.value = i;
      o.title = t.stage;
      sel.appendChild(o);
    });
    if (state.track >= tracks.length) state.track = 0;
    sel.value = state.track;
    $("track-group").classList.toggle("hidden", tracks.length < 2);
  }

  // Every topic in the grade and stream, grouped by strand as the plan groups
  // them. A topic with no question generator is marked, so a teacher knows
  // before they generate that the plan will come without questions.
  function buildTopicSelect() {
    const sel = $("topic-select");
    const topics = buildTopicRegistry();
    sel.innerHTML = "";
    let group = null, lastStrand = null;
    topics.forEach((t) => {
      if (t.strand !== lastStrand) {
        group = el("optgroup");
        group.label = t.strand;
        sel.appendChild(group);
        lastStrand = t.strand;
      }
      const o = el("option", "", t.name + (t.gen ? "" : "  ·"));
      o.value = t.key;
      group.appendChild(o);
    });
    if (!topics.some((t) => t.key === state.topic)) state.topic = topics.length ? topics[0].key : null;
    if (state.topic) sel.value = state.topic;

    const withGen = topics.filter((t) => t.gen).length;
    $("topic-count").textContent = `— ${topics.length} in this stream`;
    updateTopicNote();
    return topics;
  }

  function updateTopicNote() {
    const t = topicByKey($("topic-select").value);
    const note = $("topic-note");
    if (!t) { note.textContent = ""; return; }
    note.textContent = t.gen
      ? `Questions from: ${GENERATORS[t.gen].name}`
      : "No question generator for this topic yet — the plan is drafted without questions.";
    note.classList.toggle("warn", !t.gen);
  }

  // ---------- Model ----------

  // Search links for a topic with no lesson entry of its own.
  const searchLinks = (name) => {
    const q = encodeURIComponent(name + " maths");
    return [
      { label: "▶ YouTube", url: `https://www.youtube.com/results?search_query=${q}` },
      { label: "Khan Academy", url: `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(name)}` },
      { label: "Corbettmaths", url: `https://corbettmaths.com/?s=${encodeURIComponent(name)}` },
      { label: "Save My Exams", url: `https://www.google.com/search?q=${encodeURIComponent("site:savemyexams.com " + name)}` }
    ];
  };

  function buildModel(spec) {
    const rng = mulberry32(spec.seed);
    const seen = new Set();
    const gid = spec.gen;                       // null when no generator covers this topic
    const draw = (diff) => {
      for (let i = 0; i < 25; i++) {
        const item = GENERATORS[gid].gen(rng, diff);
        if (!seen.has(item.q)) { seen.add(item.q); return item; }
      }
      return GENERATORS[gid].gen(rng, diff);
    };
    const many = (n, diff) => (gid ? Array.from({ length: n }, () => draw(diff)) : []);

    const L = (gid && LESSONS[gid]) || {};
    return {
      hasQuestions: !!gid,
      // With no lesson entry, the syllabus's own description of the topic is
      // the key idea — it is the department's wording, not a guess.
      concept: L.concept || spec.detail || "",
      example: L.example || [],
      tips: L.tips || (spec.note ? [spec.note] : []),
      links: gid && typeof researchLinks === "function"
        ? researchLinks(gid) : searchLinks(spec.title),
      starter: many(spec.nStarter, 1),
      examples: many(spec.nExamples, 2),
      support: many(spec.nPractice, 1),
      core: many(spec.nPractice, 2),
      challenge: many(spec.nPractice, 3),
      plenary: gid ? many(1, 2)[0] : null,
      homework: many(spec.nHome, 2)
    };
  }

  // ---------- Shared question rendering ----------

  const qList = (items, showAns) => {
    const ol = el("ol", "q-list");
    items.forEach((it) => {
      const li = el("li");
      li.innerHTML = mathHTML(it.q) + (showAns ? ` <span class="ans">(${mathHTML(it.a)})</span>` : "");
      ol.appendChild(li);
    });
    return ol;
  };

  // ---------- Weekly plan (the department's own template) ----------
  //
  // Transcribed from the department's `example_of_lesson_plan.docx`: A4
  // landscape, a week grid of two classes × three periods, then the seven-column
  // planning grid, then the four signature lines. The week grid in the original
  // is a right-to-left table, which displays with the row label on the left —
  // that is what is reproduced here.

  const WK_INTRO = ["Activity", "Experiment", "Story", "Game", "Question", "Drawing a diagram"];
  const WK_AIDS = ["Books", "Board", "Posters & stickers", "2D, 3D Shapes", "Movies",
    "Show Instruments", "PC", "Samples"];
  const WK_TOOLS = ["Oral work", "Written work", "Project", "Practical activities", "Short tests"];
  const WK_NOTES = [
    "A lesson should be covered in maximum 3 periods (not days)",
    "In grade (1-4): One objective can be achieved in 2-4 periods"
  ];
  const WK_COLS = ["Objectives", "Strategies & Activities", "Time", "Educational aids",
    "Assessment", "Continuous assessment tools", "Remarks"];
  // Column widths, in the same proportions as the template's own grid.
  const WK_W = [20.0, 21.8, 7.5, 11.5, 14.6, 11.8, 12.7];

  const tick = (on) => (on ? "☑" : "☐");

  // ---------- The teacher's own writing on the form ----------
  // Every cell of the planning grid is typeable, and what a teacher types is
  // kept per sub-topic so a week's work survives a reload, a regenerate and a
  // switch to the presentation and back. Cell ids are stable: "r0.act".
  const WK_EDIT_KEY = "alips-weekly-edits";

  const wkEditsFor = (topic) => (readStore(WK_EDIT_KEY)[topic] || {});
  function saveWkEdit(topic, id, html) {
    const all = readStore(WK_EDIT_KEY);
    const mine = all[topic] || (all[topic] = {});
    if (html.trim()) mine[id] = html; else delete mine[id];
    if (!Object.keys(mine).length) delete all[topic];
    writeStore(WK_EDIT_KEY, all);
  }
  function clearWkEdits(topic) {
    const all = readStore(WK_EDIT_KEY);
    delete all[topic];
    writeStore(WK_EDIT_KEY, all);
  }

  // What a teacher types is their own, but it still has to survive a trip
  // through the Word exporter, so paste is reduced to a plain subset.
  const WK_OK_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "BR", "P", "DIV",
    "OL", "UL", "LI", "SPAN", "SUP", "SUB"]);
  function cleanHTML(html) {
    const box = document.createElement("div");
    box.innerHTML = String(html);
    // Anything that carries code goes entirely; anything else unknown is
    // unwrapped, keeping the words the teacher meant to paste.
    box.querySelectorAll("script, style, iframe, object, embed, link").forEach((n) => n.remove());
    box.querySelectorAll("*").forEach((n) => {
      if (!WK_OK_TAGS.has(n.tagName)) {
        n.replaceWith(...n.childNodes);
        return;
      }
      Array.from(n.attributes).forEach((a) => {
        if (a.name !== "class" || !/^(wk-|ans$)/.test(a.value)) n.removeAttribute(a.name);
      });
    });
    return box.innerHTML;
  }

  // The three teaching dates of the week, from the date the teacher picked.
  function weekDates(startISO, dayNames) {
    const out = [];
    const base = startISO ? new Date(startISO + "T00:00:00") : null;
    for (let i = 0; i < 3; i++) {
      const name = (dayNames[i] || "").trim();
      if (!base) { out.push(name ? `${name} ___ / ___ / 20___` : "___ / ___ / 20___"); continue; }
      const dt = new Date(base.getTime());
      dt.setDate(dt.getDate() + i);
      const dd = String(dt.getDate()).padStart(2, "0");
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      out.push(`${name} ${dd}\\${mm}\\${dt.getFullYear()}`);
    }
    return out;
  }

  // One planning row per objective: the template's own guidance is to write
  // each activity and each exercise against the objective it serves.
  function buildWeekly(spec, model) {
    const objectives = spec.objectives.length ? spec.objectives : draftObjectives(spec.title);
    const rows = objectives.map((text, i) => ({
      n: i + 1, objective: text, activities: [], assessment: [], minutes: spec.wkTime
    }));
    // Rows beyond one per objective, for anything else taught that week.
    for (let i = 0; i < spec.wkExtra; i++)
      rows.push({ n: rows.length + 1, objective: "", activities: [], assessment: [], minutes: spec.wkTime });

    // Deal the worked examples and the practice questions round the objectives,
    // so every row carries something and none is left empty while another has
    // three. On "blank" nothing is drafted at all: the teacher writes the
    // strategy and the assessment themselves, which is what the paper template
    // expects anyway.
    if (!spec.wkBlank) {
      model.examples.forEach((ex, k) => rows[k % rows.length].activities.push(ex));
      model.core.forEach((it, k) => rows[k % rows.length].assessment.push(it));
    }
    return { objectives, rows };
  }

  // "1", "2", "2,3" — which objectives each period is expected to reach.
  function defaultAchieved(nObj) {
    if (nObj <= 1) return ["1", "1", "1"];
    if (nObj === 2) return ["1", "2", "2"];
    return ["1", "2", `2,${nObj}`];
  }

  function renderWeekly(spec, model, sheet) {
    const wk = buildWeekly(spec, model);
    sheet.classList.add("weekly-view");

    sheet.appendChild(el("h1", "wk-title", "Lesson Plan for Mathematics"));

    // ---- the week grid: label column, then one block of three periods per class
    const grid = el("table", "wk-grid");
    const dates = weekDates(spec.wkStart, spec.wkDays);

    const rClass = el("tr");
    rClass.appendChild(el("th", "wk-lbl", "Class"));
    spec.wkClasses.forEach((c) => {
      const td = el("th", "wk-class", c.name || "____");
      td.colSpan = 3;
      rClass.appendChild(td);
    });
    grid.appendChild(rClass);

    const gridRow = (label, cellFor) => {
      const tr = el("tr");
      tr.appendChild(el("th", "wk-lbl", label));
      spec.wkClasses.forEach((c) => {
        for (let i = 0; i < 3; i++) tr.appendChild(el("td", "", cellFor(c, i)));
      });
      grid.appendChild(tr);
    };
    gridRow("Day & Date", (c, i) => dates[i]);
    gridRow("Period", (c, i) => c.periods[i] || "");
    gridRow("Objectives achieved", (c, i) => c.achieved[i] || "");

    const noteRow = el("tr");
    const noteCell = el("td", "wk-notes");
    noteCell.colSpan = 1 + spec.wkClasses.length * 3;
    WK_NOTES.forEach((t) => noteCell.appendChild(el("div", "", "♦ " + t)));
    noteRow.appendChild(noteCell);
    grid.appendChild(noteRow);
    sheet.appendChild(grid);

    // ---- title and introduction, as the template lays them out
    const t = el("p", "wk-line");
    t.appendChild(el("b", "", "Title: "));
    const tv = el("span", "wk-editable wk-inline", spec.title || "……………….."); 
    tv.contentEditable = "true";
    tv.dataset.edit = "title";
    if (state.wkEdits.title !== undefined) tv.innerHTML = state.wkEdits.title;
    t.appendChild(tv);
    sheet.appendChild(t);

    const intro = el("p", "wk-line");
    intro.appendChild(el("b", "", "Introduction: "));
    sheet.appendChild(intro);
    const introGrid = el("div", "wk-intro-grid");
    WK_INTRO.forEach((k) => introGrid.appendChild(el("span", "", `${tick(spec.wkIntro.includes(k))} ${k}`)));
    sheet.appendChild(introGrid);

    // ---- the seven-column planning grid
    const plan = el("table", "wk-plan");
    const head = el("tr");
    WK_COLS.forEach((c, i) => {
      const th = el("th", "", c);
      th.style.width = WK_W[i] + "%";
      head.appendChild(th);
    });
    plan.appendChild(head);

    const aidsCell = () => {
      const d = el("div", "wk-stack");
      WK_AIDS.forEach((a) => d.appendChild(el("div", "", `${tick(spec.wkAids.includes(a))} ${a}`)));
      d.appendChild(el("div", "", `${tick(!!spec.wkAidsOther)} Others`));
      if (spec.wkAidsOther) d.appendChild(el("div", "wk-other", spec.wkAidsOther));
      return d;
    };
    const toolsCell = () => {
      const d = el("div", "wk-stack");
      WK_TOOLS.forEach((a) => d.appendChild(el("div", "", `${tick(spec.wkTools.includes(a))} ${a}`)));
      const hw = el("div", "wk-hw");
      hw.appendChild(el("b", "", "Homework: "));
      hw.appendChild(document.createTextNode(spec.wkHome || "____________"));
      d.appendChild(hw);
      return d;
    };

    // A cell the teacher can type into. Anything they have already written
    // replaces the drafted content; an empty edit falls back to the draft.
    const edits = state.wkEdits;
    const typeable = (td, id) => {
      td.contentEditable = "true";
      td.dataset.edit = id;
      td.classList.add("wk-editable");
      if (edits[id] !== undefined) td.innerHTML = edits[id];
      return td;
    };

    wk.rows.forEach((row, ri) => {
      const tr = el("tr");

      const objTd = el("td", "wk-obj");
      if (ri === 0) objTd.appendChild(el("div", "wk-stem", "The student should be able to:"));
      objTd.appendChild(el("div", "wk-objline", `${row.n}. ${row.objective}`));
      tr.appendChild(typeable(objTd, `r${ri}.obj`));

      const actTd = el("td", "wk-act");
      if (row.activities.length) {
        row.activities.forEach((ex, i) => {
          const b = el("div", "wk-item");
          b.innerHTML = `<b>Example ${row.n}.${i + 1}</b> — ${mathHTML(ex.q)}`;
          actTd.appendChild(b);
          if (spec.answers && ex.sol && ex.sol.length) {
            const ol = el("ol", "wk-steps");
            ex.sol.forEach((st) => {
              const li = el("li");
              li.innerHTML = mathHTML(st.t);
              ol.appendChild(li);
            });
            actTd.appendChild(ol);
            const ans = el("div", "wk-ans");
            ans.innerHTML = "Answer: " + mathHTML(ex.a);
            actTd.appendChild(ans);
          }
        });
      } else {
        actTd.appendChild(el("div", "wk-blank", ""));
      }
      tr.appendChild(typeable(actTd, `r${ri}.act`));

      tr.appendChild(typeable(el("td", "wk-time", row.minutes ? row.minutes + " min" : ""),
        `r${ri}.time`));
      // The aids and the assessment tools are chosen once for the lesson, so
      // they are written in the first row and span the rest, as a teacher
      // filling the paper form by hand would do.
      if (ri === 0) {
        const td = el("td", "wk-aids");
        td.rowSpan = wk.rows.length;
        td.appendChild(aidsCell());
        tr.appendChild(typeable(td, "aids"));
      }

      const asTd = el("td", "wk-assess");
      if (row.assessment.length) {
        const ol = el("ol", "wk-qs");
        row.assessment.forEach((it) => {
          const li = el("li");
          li.innerHTML = mathHTML(it.q) + (spec.answers ? ` <span class="ans">(${mathHTML(it.a)})</span>` : "");
          ol.appendChild(li);
        });
        asTd.appendChild(ol);
      } else {
        asTd.appendChild(el("div", "wk-blank", ""));
      }
      tr.appendChild(typeable(asTd, `r${ri}.assess`));

      if (ri === 0) {
        const td = el("td", "wk-tools");
        td.rowSpan = wk.rows.length;
        td.appendChild(toolsCell());
        tr.appendChild(typeable(td, "tools"));
      }
      tr.appendChild(typeable(el("td", "wk-remarks", ""), `r${ri}.remarks`));
      plan.appendChild(tr);
    });
    sheet.appendChild(plan);

    // ---- the template's four signature lines
    const sig = el("div", "wk-sign");
    ["Teacher's signature:", "Senior teacher's signature:",
     "Supervisor's signature:", "Principle's signature:"]
      .forEach((t) => sig.appendChild(el("span", "", t)));
    sheet.appendChild(sig);
  }

  // ---------- Weekly plan as Word ----------

  function weeklyWord(spec, model) {
    const wk = buildWeekly(spec, model);
    const dates = weekDates(spec.wkStart, spec.wkDays);
    const cols = 1 + spec.wkClasses.length * 3;
    // A cell the teacher has typed into wins over the drafted content.
    const E = state.wkEdits;
    const cell = (id, drafted) => (E[id] !== undefined ? cleanHTML(E[id]) : drafted);

    let b = `<p class="wtitle">Lesson Plan for Mathematics</p>`;

    // Week grid
    b += `<table class="wgrid"><tr><td class="wlbl">Class</td>` +
      spec.wkClasses.map((c) => `<td class="wclass" colspan="3">${esc(c.name || "____")}</td>`).join("") +
      `</tr>`;
    const gRow = (label, cellFor) => {
      b += `<tr><td class="wlbl">${esc(label)}</td>` +
        spec.wkClasses.map((c) => [0, 1, 2].map((i) =>
          `<td class="wcell">${esc(cellFor(c, i))}</td>`).join("")).join("") + `</tr>`;
    };
    gRow("Day & Date", (c, i) => dates[i]);
    gRow("Period", (c, i) => c.periods[i] || "");
    gRow("Objectives achieved", (c, i) => c.achieved[i] || "");
    b += `<tr><td class="wnotes" colspan="${cols}">` +
      WK_NOTES.map((t) => `&#9670; ${esc(t)}`).join("<br>") + `</td></tr></table>`;

    b += `<p><b>Title:</b> ${cell("title", esc(spec.title || "………………..") )}</p>`;
    b += `<p><b>Introduction:</b></p>`;
    b += `<p>` + WK_INTRO.map((k) =>
      `${tick(spec.wkIntro.includes(k))} ${esc(k)}`).join("&nbsp;&nbsp;&nbsp;&nbsp;") + `</p>`;

    // Planning grid
    b += `<table class="wplan"><tr>` +
      WK_COLS.map((c, i) => `<th style="width:${WK_W[i]}%">${esc(c)}</th>`).join("") + `</tr>`;

    const aidsHTML = () =>
      WK_AIDS.map((a) => `${tick(spec.wkAids.includes(a))} ${esc(a)}`).join("<br>") +
      `<br>${tick(!!spec.wkAidsOther)} Others` +
      (spec.wkAidsOther ? `<br>${esc(spec.wkAidsOther)}` : "");
    const toolsHTML = () =>
      WK_TOOLS.map((a) => `${tick(spec.wkTools.includes(a))} ${esc(a)}`).join("<br>") +
      `<br><b>Homework:</b> ${esc(spec.wkHome || "____________")}`;

    wk.rows.forEach((row) => {
      const ri = row.n - 1;
      let act = "";
      if (row.activities.length) {
        row.activities.forEach((ex, i) => {
          act += `<p><b>Example ${row.n}.${i + 1}</b> — ${mathWord(ex.q)}</p>`;
          if (spec.answers && ex.sol && ex.sol.length) {
            act += "<ol>" + ex.sol.map((st) => `<li>${mathWord(st.t)} [${esc(st.m)}]</li>`).join("") + "</ol>";
            act += `<p><i>Answer: ${mathWord(ex.a)}</i></p>`;
          }
        });
      } else act = "&nbsp;";

      let ass = row.assessment.length
        ? "<ol>" + row.assessment.map((it) =>
            `<li>${mathWord(it.q)}${spec.answers ? ` <i>(${mathWord(it.a)})</i>` : ""}</li>`).join("") + "</ol>"
        : "&nbsp;";

      const span = wk.rows.length;
      const objDraft = (row.n === 1
        ? `<p><b>The student should be able to:</b></p><p>${row.n}. ${esc(row.objective)}</p>`
        : `<p>${row.n}. ${esc(row.objective)}</p>`);
      b += `<tr>` +
        `<td>${cell(`r${ri}.obj`, objDraft)}</td>` +
        `<td>${cell(`r${ri}.act`, act)}</td>` +
        `<td class="wc">${cell(`r${ri}.time`, row.minutes ? row.minutes + " min" : "&nbsp;")}</td>` +
        (row.n === 1 ? `<td rowspan="${span}">${cell("aids", aidsHTML())}</td>` : "") +
        `<td>${cell(`r${ri}.assess`, ass)}</td>` +
        (row.n === 1 ? `<td rowspan="${span}">${cell("tools", toolsHTML())}</td>` : "") +
        `<td>${cell(`r${ri}.remarks`, "&nbsp;")}</td></tr>`;
    });
    b += `</table>`;

    // Word ignores flexbox, so the signature line is laid out as a borderless row.
    b += `<p>&nbsp;</p><table class="wsign"><tr>` +
      ["Teacher's signature:", "Senior teacher's signature:",
       "Supervisor's signature:", "Principle's signature:"]
        .map((t) => `<td>${esc(t)}</td>`).join("") + `</tr></table>`;

    // A4 landscape with the template's own margins.
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" ` +
      `xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">` +
      `<head><meta charset="utf-8"><title>${esc(spec.title)} — Weekly Plan</title>` +
      `<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->` +
      `<style>@page WordSection1 { size: 29.7cm 21.0cm; mso-page-orientation: landscape;
        margin: 1.25cm 2.5cm 0.75cm 2.5cm; }
        div.WordSection1 { page: WordSection1; }
        body,p,td,th,div,li { font-family:"Times New Roman",serif; font-size:10.0pt; color:#000; }
        p { margin: 0 0 3pt 0; }
        table { border-collapse: collapse; width:100%; }
        td, th { border:1pt solid windowtext; padding:3pt 4pt; vertical-align:top; }
        th { font-weight:bold; text-align:center; background:#EDEDED; }
        .wtitle { text-align:center; font-weight:bold; font-size:18.0pt;
                  font-family:"Nyala","Times New Roman",serif; margin-bottom:8pt; }
        table.wgrid { width:60%; margin-bottom:8pt; }
        table.wgrid td { text-align:center; }
        td.wlbl { font-weight:bold; text-align:left; background:#EDEDED; }
        td.wclass { font-weight:bold; background:#F6F6F6; }
        td.wnotes { text-align:left; font-size:8.5pt; font-style:italic; }
        table.wplan td { font-size:9.0pt; }
        td.wc { text-align:center; }
        ol { margin: 0 0 0 14pt; padding: 0; }
        table.wsign { width:100%; }
        table.wsign td { border:none; padding:0; font-weight:bold; font-size:11.0pt;
                 font-family:"Tw Cen MT Condensed Extra Bold","Arial Narrow",sans-serif; }
      </style></head><body><div class="WordSection1">${b}</div></body></html>`;
  }

  // ---------- Slides ----------

  function buildSlides(spec, model) {
    const s = [];
    s.push({ kind: "title", title: spec.title, sub: `Grade ${spec.grade}${spec.section || ""} · Mathematics` });
    s.push({ kind: "bullets", title: "Learning objectives",
             items: spec.objectives.length ? spec.objectives : draftObjectives(spec.title) });
    if (spec.criteria.length)
      s.push({ kind: "bullets", title: "Success criteria", items: spec.criteria });
    if (model.starter.length)
      s.push({ kind: "questions", title: "Starter", items: model.starter });
    if (model.concept)
      s.push({ kind: "bullets", title: "Key idea", items: [model.concept, ...model.tips] });
    model.examples.forEach((ex, i) => {
      s.push({ kind: "worked", title: `Worked example ${i + 1}`, q: ex.q,
               steps: (ex.sol || []).map((x) => x.t), a: ex.a });
    });
    if (model.core.length)
      s.push({ kind: "questions", title: "Your turn", items: model.core });
    if (model.challenge.length)
      s.push({ kind: "questions", title: "Challenge", items: model.challenge });
    if (model.plenary)
      s.push({ kind: "worked", title: "Plenary — exit ticket", q: model.plenary.q, steps: [], a: model.plenary.a });
    if (model.homework.length)
      s.push({ kind: "questions", title: "Homework", items: model.homework });
    return s;
  }

  function slideHTML(sl, revealed) {
    if (sl.kind === "title") {
      return `<div class="sl-title-slide"><h1>${esc(sl.title)}</h1><p>${esc(sl.sub)}</p></div>`;
    }
    let h = `<h2>${esc(sl.title)}</h2>`;
    if (sl.kind === "bullets") {
      h += "<ul>" + sl.items.map((t) => `<li>${esc(t)}</li>`).join("") + "</ul>";
    } else if (sl.kind === "questions") {
      h += "<ol class='sl-q'>" + sl.items.map((it) =>
        `<li>${mathHTML(it.q)}${revealed ? `<span class="sl-ans">${mathHTML(it.a)}</span>` : ""}</li>`).join("") + "</ol>";
    } else if (sl.kind === "worked") {
      h += `<p class="sl-big">${mathHTML(sl.q)}</p>`;
      if (revealed) {
        h += "<ol class='sl-steps'>" + sl.steps.map((t) => `<li>${mathHTML(t)}</li>`).join("") + "</ol>";
        h += `<p class="sl-ans-line">Answer: ${mathHTML(sl.a)}</p>`;
      }
    }
    return h;
  }

  function renderDeck(spec, model, sheet) {
    const slides = buildSlides(spec, model);
    sheet.appendChild(el("div", "deck-note",
      `${slides.length} slides · press “Present full screen”, then use ← → and Space to reveal answers`));
    slides.forEach((sl, i) => {
      const card = el("div", "slide-card");
      card.innerHTML = slideHTML(sl, true);
      const n = el("div", "slide-no", String(i + 1));
      card.appendChild(n);
      sheet.appendChild(card);
    });
  }

  // ---------- Present mode ----------

  function showStage() {
    if (!state.model) generate();
    if (!state.model) return;
    state.slides = buildSlides(state.spec, state.model);
    state.slide = 0;
    state.revealed = false;
    $("stage").classList.remove("hidden");
    $("stage").setAttribute("aria-hidden", "false");
    paintStage();
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function paintStage() {
    const sl = state.slides[state.slide];
    $("stage-slide").innerHTML = slideHTML(sl, state.revealed);
    $("stage-count").textContent = `${state.slide + 1} / ${state.slides.length}`;
    const revealable = sl.kind === "questions" || sl.kind === "worked";
    $("stage-reveal").style.visibility = revealable ? "visible" : "hidden";
    $("stage-reveal").textContent = state.revealed ? "Hide answers" : "Reveal answers";
  }

  function moveStage(d) {
    const n = state.slide + d;
    if (n < 0 || n >= state.slides.length) return;
    state.slide = n;
    state.revealed = false;
    paintStage();
  }

  function closeStage() {
    $("stage").classList.add("hidden");
    $("stage").setAttribute("aria-hidden", "true");
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }

  document.addEventListener("keydown", (e) => {
    if ($("stage").classList.contains("hidden")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") moveStage(1);
    else if (e.key === "ArrowLeft" || e.key === "PageUp") moveStage(-1);
    else if (e.key === " ") { e.preventDefault(); state.revealed = !state.revealed; paintStage(); }
    else if (e.key === "Escape") closeStage();
  });

  // ---------- PowerPoint (.pptx) export ----------

  const EMU_W = 12192000, EMU_H = 6858000;          // 16:9 slide
  const xmlEsc = (s) => String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // One text box: x, y, w, h in EMU; lines = [{ t, sz, b, bullet }]
  function shape(id, name, x, y, w, h, lines) {
    const paras = lines.map((ln) => {
      const props = `<a:pPr${ln.bullet ? "" : ' marL="0" indent="0"'}${ln.align ? ` algn="${ln.align}"` : ""}>` +
        (ln.bullet ? "" : "<a:buNone/>") + "</a:pPr>";
      return `<a:p>${props}<a:r><a:rPr lang="en-GB" sz="${ln.sz || 2000}"` +
        `${ln.b ? ' b="1"' : ""} dirty="0"/><a:t>${xmlEsc(ln.t)}</a:t></a:r></a:p>`;
    }).join("");
    return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${xmlEsc(name)}"/>` +
      `<p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>` +
      `<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm>` +
      `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>` +
      `<p:txBody><a:bodyPr wrap="square"><a:normAutofit/></a:bodyPr><a:lstStyle/>${paras}</p:txBody></p:sp>`;
  }

  function slideXML(sl) {
    let body = "";
    if (sl.kind === "title") {
      body = shape(2, "Title", 838200, 2200000, 10515600, 1500000,
                   [{ t: mathPlainText(sl.title), sz: 4400, b: true, align: "ctr" }]) +
             shape(3, "Subtitle", 838200, 3800000, 10515600, 800000,
                   [{ t: sl.sub, sz: 2400, align: "ctr" }]);
    } else {
      const lines = [];
      if (sl.kind === "bullets") {
        sl.items.forEach((t) => lines.push({ t, sz: 2000, bullet: true }));
      } else if (sl.kind === "questions") {
        sl.items.forEach((it, i) => {
          lines.push({ t: `${i + 1}.  ${mathPlainText(it.q)}`, sz: 2000 });
          lines.push({ t: `      Answer: ${mathPlainText(it.a)}`, sz: 1400 });
        });
      } else if (sl.kind === "worked") {
        lines.push({ t: mathPlainText(sl.q), sz: 2400, b: true });
        sl.steps.forEach((t) => lines.push({ t: "•  " + mathPlainText(t), sz: 1800 }));
        lines.push({ t: "Answer: " + mathPlainText(sl.a), sz: 2000, b: true });
      }
      body = shape(2, "Title", 838200, 400000, 10515600, 1000000,
                   [{ t: sl.title, sz: 3200, b: true }]) +
             shape(3, "Body", 838200, 1500000, 10515600, 4700000, lines);
    }
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
      `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
      `xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">` +
      `<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>` +
      `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>` +
      `<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>` +
      body +
      `</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
  }

  function pptxFiles(slides) {
    const A = "http://schemas.openxmlformats.org/drawingml/2006/main";
    const P = "http://schemas.openxmlformats.org/presentationml/2006/main";
    const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    const RT = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    const head = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`;
    const n = slides.length;

    const contentTypes = head +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>` +
      `<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>` +
      `<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>` +
      `<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>` +
      slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("") +
      `</Types>`;

    const rootRels = head +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="${RT}/officeDocument" Target="ppt/presentation.xml"/>` +
      `</Relationships>`;

    const sldIdList = slides.map((_, i) =>
      `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join("");
    const presentation = head +
      `<p:presentation xmlns:a="${A}" xmlns:r="${R}" xmlns:p="${P}" saveSubsetFonts="1">` +
      `<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>` +
      `<p:sldIdLst>${sldIdList}</p:sldIdLst>` +
      `<p:sldSz cx="${EMU_W}" cy="${EMU_H}"/><p:notesSz cx="${EMU_H}" cy="${EMU_W}"/>` +
      `</p:presentation>`;

    const presRels = head +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="${RT}/slideMaster" Target="slideMasters/slideMaster1.xml"/>` +
      slides.map((_, i) =>
        `<Relationship Id="rId${i + 2}" Type="${RT}/slide" Target="slides/slide${i + 1}.xml"/>`).join("") +
      `<Relationship Id="rId${n + 2}" Type="${RT}/theme" Target="theme/theme1.xml"/>` +
      `</Relationships>`;

    const txStyles = `<p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr sz="4400"/></a:lvl1pPr></p:titleStyle>` +
      `<p:bodyStyle><a:lvl1pPr><a:defRPr sz="2000"/></a:lvl1pPr></p:bodyStyle>` +
      `<p:otherStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:otherStyle></p:txStyles>`;

    const emptyTree = `<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>` +
      `<a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/>` +
      `<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/>` +
      `<a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>` +
      `</p:spTree></p:cSld>`;

    const clrMap = `<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" ` +
      `accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" ` +
      `accent6="accent6" hlink="hlink" folHlink="folHlink"/>`;

    const slideMaster = head +
      `<p:sldMaster xmlns:a="${A}" xmlns:r="${R}" xmlns:p="${P}">` +
      emptyTree + clrMap +
      `<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>` +
      txStyles + `</p:sldMaster>`;

    const masterRels = head +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="${RT}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>` +
      `<Relationship Id="rId2" Type="${RT}/theme" Target="../theme/theme1.xml"/>` +
      `</Relationships>`;

    const slideLayout = head +
      `<p:sldLayout xmlns:a="${A}" xmlns:r="${R}" xmlns:p="${P}" type="blank" preserve="1">` +
      emptyTree + `<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;

    const layoutRels = head +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="${RT}/slideMaster" Target="../slideMasters/slideMaster1.xml"/>` +
      `</Relationships>`;

    const dk = (tag, v) => `<a:${tag}><a:srgbClr val="${v}"/></a:${tag}>`;
    const font = (tag) => `<a:${tag} typeface="Comic Sans MS"/>`;
    const fillStyle = `<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>`;
    const theme = head +
      `<a:theme xmlns:a="${A}" name="AlIPS"><a:themeElements>` +
      `<a:clrScheme name="AlIPS">${dk("dk1", "000000")}${dk("lt1", "FFFFFF")}` +
      `${dk("dk2", "1C2536")}${dk("lt2", "F6F7FA")}${dk("accent1", "1E5FA8")}` +
      `${dk("accent2", "B07D2B")}${dk("accent3", "2E7D4F")}${dk("accent4", "6B4FA1")}` +
      `${dk("accent5", "1E5FA8")}${dk("accent6", "B07D2B")}${dk("hlink", "1E5FA8")}` +
      `${dk("folHlink", "6B4FA1")}</a:clrScheme>` +
      `<a:fontScheme name="AlIPS"><a:majorFont>${font("latin")}<a:ea typeface=""/><a:cs typeface=""/></a:majorFont>` +
      `<a:minorFont>${font("latin")}<a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>` +
      `<a:fmtScheme name="AlIPS">` +
      `<a:fillStyleLst>${fillStyle}${fillStyle}${fillStyle}</a:fillStyleLst>` +
      `<a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>` +
      `<a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>` +
      `<a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>` +
      `<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle>` +
      `<a:effectStyle><a:effectLst/></a:effectStyle>` +
      `<a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>` +
      `<a:bgFillStyleLst>${fillStyle}${fillStyle}${fillStyle}</a:bgFillStyleLst>` +
      `</a:fmtScheme></a:themeElements></a:theme>`;

    const files = [
      { name: "[Content_Types].xml", text: contentTypes },
      { name: "_rels/.rels", text: rootRels },
      { name: "ppt/presentation.xml", text: presentation },
      { name: "ppt/_rels/presentation.xml.rels", text: presRels },
      { name: "ppt/slideMasters/slideMaster1.xml", text: slideMaster },
      { name: "ppt/slideMasters/_rels/slideMaster1.xml.rels", text: masterRels },
      { name: "ppt/slideLayouts/slideLayout1.xml", text: slideLayout },
      { name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels", text: layoutRels },
      { name: "ppt/theme/theme1.xml", text: theme }
    ];
    slides.forEach((sl, i) => {
      files.push({ name: `ppt/slides/slide${i + 1}.xml`, text: slideXML(sl) });
      files.push({
        name: `ppt/slides/_rels/slide${i + 1}.xml.rels`,
        text: head + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
          `<Relationship Id="rId1" Type="${RT}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>` +
          `</Relationships>`
      });
    });
    return files;
  }

  function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  }

  // ---------- Wiring ----------

  const currentTitle = () => {
    const typed = $("lesson-title").value.trim();
    const t = topicByKey($("topic-select").value);
    return typed || (t ? t.name : "Lesson");
  };

  function readSpec() {
    const key = $("topic-select").value;
    const t = topicByKey(key) || {};
    const typed = $("lesson-title").value.trim();
    return {
      grade: state.grade,
      topic: key,
      gen: t.gen || null,
      detail: t.detail || "",
      note: t.note || "",
      month: t.month || "",
      strand: t.strand || "",
      stage: currentTrack().stage,
      title: typed || t.name || "Lesson",
      section: $("section-input").value.trim(),
      teacher: $("teacher-input").value.trim(),
      wkStart: $("week-start").value,
      wkDays: $("wk-days").value.split(",").map((x) => x.trim()),
      wkClasses: readClasses(),
      wkTime: Math.max(0, +$("wk-time").value || 0),
      wkIntro: checkedIn("wk-intro"),
      wkAids: checkedIn("wk-aids"),
      wkAidsOther: $("wk-aids-other").value.trim(),
      wkTools: checkedIn("wk-tools"),
      wkHome: $("wk-home").value.trim(),
      wkBlank: $("wk-content").value === "blank",
      wkExtra: Math.max(0, +$("wk-extra").value || 0),
      objectives: linesOf("objectives"),
      criteria: linesOf("criteria"),
      nExamples: Math.max(0, +$("n-examples").value || 0),
      nStarter: Math.max(0, +$("n-starter").value || 0),
      nPractice: Math.max(0, +$("n-practice").value || 0),
      nHome: Math.max(0, +$("n-home").value || 0),
      answers: $("show-answers").checked,
      seed: +$("seed").value || 1
    };
  }

  function render() {
    const sheet = $("sheet");
    sheet.innerHTML = "";
    if (!state.spec) {
      sheet.style.removeProperty("--sheet-size");
      sheet.appendChild(el("p", "placeholder-hint", "Choose a grade and topic, then press Generate."));
      return;
    }
    sheet.style.setProperty("--sheet-size", fontFor(state.spec.grade) + "pt");
    sheet.classList.toggle("deck-view", state.view === "deck");
    sheet.classList.toggle("weekly-view", state.view === "weekly");
    if (state.view === "deck") renderDeck(state.spec, state.model, sheet);
    else renderWeekly(state.spec, state.model, sheet);
  }

  function generate() {
    state.topic = $("topic-select").value;
    if (!state.topic) return;
    saveFields(state.topic);                    // keep the teacher's wording for next time
    writeStore(PREF_KEY, {
      teacher: $("teacher-input").value.trim(),
      section: $("section-input").value.trim(),
      wkDays: $("wk-days").value.trim(),
      wkHome: $("wk-home").value.trim(),
      wkIntro: checkedIn("wk-intro"),
      wkAids: checkedIn("wk-aids"),
      wkAidsOther: $("wk-aids-other").value.trim(),
      wkTools: checkedIn("wk-tools"),
      wkContent: $("wk-content").value,
      wkExtra: $("wk-extra").value
    });
    state.spec = readSpec();
    state.model = buildModel(state.spec);
    render();
  }

  // The weekly plan prints on A4 landscape and the deck on portrait. An @page
  // rule cannot be scoped to a class, so the rule itself is swapped instead.
  function setPageSize(orientation) {
    let tag = document.getElementById("page-size");
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "page-size";
      document.head.appendChild(tag);
    }
    tag.textContent = orientation === "landscape"
      ? "@page { size: A4 landscape; margin: 1.25cm 2.5cm 0.75cm 2.5cm; }"
      : "@page { size: A4 portrait; margin: 1.2cm 1.4cm; }";
  }

  // Each section shows only the controls and the buttons it actually uses.
  function setView(v) {
    state.view = v;
    const deck = v === "deck";
    $("view-deck").classList.toggle("active", deck);
    $("view-weekly").classList.toggle("active", !deck);
    $("deck-opts").classList.toggle("hidden", !deck);
    $("weekly-opts").classList.toggle("hidden", deck);
    $("present").classList.toggle("hidden", !deck);
    $("download-pptx").classList.toggle("hidden", !deck);
    $("download-word").classList.toggle("hidden", deck);
    $("mode-note").textContent = deck
      ? "A slide deck for one sub-topic — present it, or export it as PowerPoint."
      : "The department's weekly plan template, filled in from the sub-topic.";
    setPageSize(deck ? "portrait" : "landscape");
    document.body.classList.toggle("weekly-print", !deck);
    if (state.spec) render();
  }

  $("view-deck").addEventListener("click", () => setView("deck"));
  $("view-weekly").addEventListener("click", () => setView("weekly"));

  // Typing anywhere on the weekly form is kept against this sub-topic.
  $("sheet").addEventListener("input", (e) => {
    const cellEl = e.target.closest("[data-edit]");
    if (!cellEl) return;
    const html = cellEl.innerHTML;
    state.wkEdits[cellEl.dataset.edit] = html;
    saveWkEdit(state.topic || $("topic-select").value, cellEl.dataset.edit, html);
    $("wk-edit-msg").textContent = "your wording is saved on this device";
  });
  $("grade-select").addEventListener("change", (e) => {
    state.grade = +e.target.value;
    state.track = 0;
    buildTrackSelect();
    buildTopicSelect();
    buildClassRows();
    loadFields($("topic-select").value, currentTitle());
  });
  $("track-select").addEventListener("change", (e) => {
    state.track = +e.target.value;
    buildTopicSelect();
    loadFields($("topic-select").value, currentTitle());
  });
  $("topic-select").addEventListener("change", (e) => {
    state.topic = e.target.value;
    updateTopicNote();
    loadFields(state.topic, currentTitle());
  });
  $("fields-dept").addEventListener("click", () => {
    const topic = $("topic-select").value;
    const dept = deptFields(topic, currentTitle());
    $("objectives").value = dept.objectives.join("\n");
    $("criteria").value = dept.criteria.join("\n");
    syncAchieved();
    // Forget this teacher's override so the department wording stays next time,
    // including any saved under the older generator-keyed form.
    const all = readStore(FIELD_KEY);
    const t = topicByKey(topic);
    delete all[topic];
    if (t && t.gen) delete all[t.gen];
    writeStore(FIELD_KEY, all);
    $("fields-msg").textContent = dept.isDept ? "department wording" : "draft wording";
  });

  // Export every topic this teacher has reworded, for the HOD to review.
  $("fields-export").addEventListener("click", (e) => {
    const all = readStore(FIELD_KEY);
    const topics = Object.keys(all);
    if (!topics.length) {
      e.target.textContent = "Nothing edited yet";
      setTimeout(() => { e.target.textContent = "Export my wording"; }, 2500);
      return;
    }
    const who = $("teacher-input").value.trim() || "(teacher name not entered)";
    let txt = "AlIPS Mathematics — lesson wording\n";
    txt += "Teacher: " + who + "\n";
    txt += "Exported: " + new Date().toISOString().slice(0, 10) + "\n";
    txt += "Topics reworded: " + topics.length + "\n";
    txt += "\nSend this file to the Head of Department to have any of it adopted\n";
    txt += "as the department wording for everyone.\n";
    topics.forEach((t) => {
      const name = GENERATORS[t] ? GENERATORS[t].name : t.replace(/^[^|]*\|/, "");
      txt += "\n" + "=".repeat(60) + "\n" + name + "\n" + "=".repeat(60) + "\n";
      txt += "\nLearning objectives\n";
      (all[t].objectives || []).forEach((o) => { txt += "  - " + o + "\n"; });
      txt += "\nSuccess criteria\n";
      (all[t].criteria || []).forEach((c) => { txt += "  - " + c + "\n"; });
    });
    txt += "\n\n--- machine-readable copy ---\n" + JSON.stringify(all, null, 1) + "\n";
    saveBlob(new Blob([txt], { type: "text/plain" }),
      `AlIPS_lesson_wording_${who.replace(/[^\w]+/g, "_")}.txt`);
  });
  $("wk-clear").addEventListener("click", (e) => {
    const topic = state.topic || $("topic-select").value;
    if (!Object.keys(state.wkEdits).length) {
      e.target.textContent = "Nothing typed yet";
      setTimeout(() => { e.target.textContent = "Clear my typing"; }, 2000);
      return;
    }
    clearWkEdits(topic);
    state.wkEdits = {};
    $("wk-edit-msg").textContent = "back to the draft";
    if (state.spec) render();
  });
  const reflowWeekly = () => { if (state.spec && state.view === "weekly") generate(); };
  ["wk-content", "wk-extra"].forEach((id) => {
    $(id).addEventListener("change", reflowWeekly);
    $(id).addEventListener("input", reflowWeekly);
  });

  $("new-seed").addEventListener("click", () => {
    $("seed").value = Math.floor(Math.random() * 899999) + 100000;
    generate();
  });
  $("generate").addEventListener("click", generate);
  $("print").addEventListener("click", () => window.print());
  $("present").addEventListener("click", showStage);
  $("stage-prev").addEventListener("click", () => moveStage(-1));
  $("stage-next").addEventListener("click", () => moveStage(1));
  $("stage-close").addEventListener("click", closeStage);
  $("stage-reveal").addEventListener("click", () => { state.revealed = !state.revealed; paintStage(); });

  $("download-word").addEventListener("click", () => {
    if (!state.spec) generate();
    if (!state.spec) return;
    saveBlob(new Blob(["﻿", weeklyWord(state.spec, state.model)], { type: "application/msword" }),
      `AlIPS_Grade${state.spec.grade}_WeeklyPlan_${state.spec.seed}.doc`);
  });

  $("download-pptx").addEventListener("click", (e) => {
    if (!state.spec) generate();
    if (!state.spec) return;
    try {
      const slides = buildSlides(state.spec, state.model);
      saveBlob(ZIP.zipBlob(pptxFiles(slides)),
        `AlIPS_Grade${state.spec.grade}_${state.spec.title.replace(/[^\w]+/g, "_")}.pptx`);
    } catch (err) {
      e.target.textContent = "Could not build the file";
      setTimeout(() => { e.target.textContent = "⬇ Slides as PowerPoint"; }, 2500);
    }
  });

  // ---------- Init ----------
  const params = new URLSearchParams(location.search);
  if (params.get("grade")) state.grade = +params.get("grade");
  if (params.get("track")) state.track = +params.get("track") || 0;
  buildGradeSelect();
  buildTrackSelect();
  if (params.get("topic")) state.topic = params.get("topic");
  buildTopicSelect();
  const prefs = readStore(PREF_KEY);
  if (prefs.teacher) $("teacher-input").value = prefs.teacher;
  if (prefs.section) $("section-input").value = prefs.section;
  loadFields($("topic-select").value, currentTitle());

  // Weekly-plan controls. The default week starts on the coming Sunday, which
  // is the first teaching day of the Omani school week.
  const today = new Date();
  today.setDate(today.getDate() + ((7 - today.getDay()) % 7));
  $("week-start").value = today.toISOString().slice(0, 10);
  if (prefs.wkDays) $("wk-days").value = prefs.wkDays;
  if (prefs.wkHome) $("wk-home").value = prefs.wkHome;
  buildChecks("wk-intro", WK_INTRO, prefs.wkIntro || ["Question"]);
  buildChecks("wk-aids", WK_AIDS, prefs.wkAids || ["Books", "Board"]);
  buildChecks("wk-tools", WK_TOOLS, prefs.wkTools || ["Oral work", "Written work"]);
  if (prefs.wkAidsOther) $("wk-aids-other").value = prefs.wkAidsOther;
  if (prefs.wkContent) $("wk-content").value = prefs.wkContent;
  if (prefs.wkExtra) $("wk-extra").value = prefs.wkExtra;
  buildClassRows();
  $("objectives").addEventListener("input", syncAchieved);
  $("wk-classes").addEventListener("input", (e) => {
    // Typing over an auto-filled cell hands it to the teacher for good.
    if (e.target.classList.contains("wk-cach")) e.target.dataset.auto = "";
  });

  $("seed").value = params.get("seed") || Math.floor(Math.random() * 899999) + 100000;
  setView(params.get("view") === "weekly" ? "weekly" : "deck");
  if (params.get("auto")) generate(); else render();
})();
