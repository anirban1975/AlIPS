// AlIPS worksheet & exam generator — follows the department's Word templates.
// One model is built per paper and rendered two ways: to the page (screen and
// print) and to a Word (.doc) file, so both always contain the same questions.
//
// Teachers control two rubrics:
//   • the question rubric — marks and difficulty for each part of an exam
//     question, and the difficulty of each worksheet topic;
//   • the grading rubric — the score bands (grade / reward) printed on the paper.
// Both can be saved as that teacher's default (localStorage).

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
  const nl2br = (s) => esc(s).replace(/\n/g, "<br>");

  // ---------- Mathematical notation ----------
  // Generators emit ⁅n/d⁆ for a fraction and √⟨x⟩ for a radical. On screen and
  // in print these become a proper two-tier fraction and an overlined radical;
  // in Word (no flexbox) a fraction becomes sup⁄sub, which Word renders well.
  const FRAC_RE = /⁅([^\/⁆]*)\/([^⁆]*)⁆/g;
  const RAD_RE = /√⟨([^⟩]*)⟩/g;

  function mathHTML(text) {
    return esc(text)
      .replace(FRAC_RE, (_, n, d) =>
        `<span class="frac"><span class="fnum">${n}</span><span class="fden">${d}</span></span>`)
      .replace(RAD_RE, (_, x) => `<span class="radic">√<span class="vinc">${x}</span></span>`)
      .replace(/\n/g, "<br>");
  }

  function mathWord(text) {
    return esc(text)
      .replace(FRAC_RE, (_, n, d) => `<sup>${n}</sup>&frasl;<sub>${d}</sub>`)
      .replace(RAD_RE, (_, x) => `&radic;<span style="text-decoration:overline">${x}</span>`)
      .replace(/\n/g, "<br>");
  }

  // Put maths-aware text into an element.
  const setMath = (node, text) => { node.innerHTML = mathHTML(text); return node; };

  const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const DIFF_NAMES = { 1: "Easy", 2: "Medium", 3: "Challenging", mixed: "Mixed" };

  // Question types. `space` is the working room printed after the part: an MCQ
  // needs none, a short answer a line or two, a long answer a worked page.
  const TYPES = {
    MCQ: { name: "MCQ", full: "Multiple choice", space: 0 },
    SAQ: { name: "SAQ", full: "Short answer", space: 1 },
    LAQ: { name: "LAQ", full: "Long answer", space: 3 }
  };
  const TYPE_KEYS = ["MCQ", "SAQ", "LAQ"];

  // Assessment objectives, as Cambridge defines them for 0580 and 9709.
  const AOS = {
    AO1: "Knowledge and understanding of mathematical techniques",
    AO2: "Reasoning, interpretation and communication"
  };
  const AO_KEYS = ["AO1", "AO2"];

  // Department defaults — teachers can change every one of these in the panel.
  const DEFAULT_PART_RUBRIC = [
    { marks: 2, diff: 1 },
    { marks: 3, diff: 2 },
    { marks: 4, diff: 3 },
    { marks: 4, diff: 3 }
  ];
  const DEFAULT_BANDS = [
    { min: 90, label: "Gold Star" },
    { min: 75, label: "Silver Star" },
    { min: 60, label: "Bronze Star" },
    { min: 0, label: "Keep Practising" }
  ];

  const INSTRUCTIONS = [
    "Answer all questions",
    "Use only a blue ink pen",
    "Do not use highlighters, glue or correction fluid",
    "All drawings must be done in pencil and using geometrical tools",
    "Numbers in the [] brackets indicate marks"
  ];

  const STORE_KEY = "alips-teacher-defaults";

  const state = { mode: "worksheet", plan: "quick", grade: 5, spec: null, model: null };

  // Grades 1–4 print at 14 pt, all other grades at 12 pt.
  const fontFor = (grade) => (grade <= 4 ? 14 : 12);

  const load = () => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); }
    catch { return null; }
  };
  const save = (obj) => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(obj)); return true; }
    catch { return false; }
  };

  // ---------- Panel builders ----------

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

  // Each topic carries its own difficulty selector.
  function buildTopicList(preset) {
    const box = $("topic-list");
    const prevChecked = new Set([...box.querySelectorAll("input:checked")].map((i) => i.value));
    const prevDiff = {};
    box.querySelectorAll(".tdiff").forEach((s) => { prevDiff[s.dataset.topic] = s.value; });

    box.innerHTML = "";
    (GRADE_GENS[state.grade] || []).forEach((id, idx) => {
      const label = el("label");
      const cb = el("input");
      cb.type = "checkbox";
      cb.value = id;
      cb.checked = prevChecked.size ? prevChecked.has(id) : idx < 4;

      const name = el("span", "tname", GENERATORS[id].name);

      const diff = el("select", "tdiff");
      diff.dataset.topic = id;
      [["1", "Easy"], ["2", "Medium"], ["3", "Challenging"], ["mixed", "Mixed"]]
        .forEach(([v, t]) => {
          const o = el("option", "", t);
          o.value = v;
          diff.appendChild(o);
        });
      diff.value = prevDiff[id] || (preset && preset.defaultDiff) || "2";

      const sync = () => label.classList.toggle("off", !cb.checked);
      cb.addEventListener("change", sync);
      sync();

      label.appendChild(cb);
      label.appendChild(name);
      label.appendChild(diff);
      box.appendChild(label);
    });
  }

  function buildPartRubric(preset) {
    const tbody = $("part-rubric").querySelector("tbody");
    const prev = readPartRubric();
    const n = +$("exam-parts").value || 3;
    tbody.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const base = (preset && preset.partRubric && preset.partRubric[i]) ||
                   prev[i] || DEFAULT_PART_RUBRIC[i] || { marks: 3, diff: 2 };
      const tr = el("tr");
      tr.appendChild(el("td", "", `(${LETTERS[i]})`));

      const mtd = el("td", "narrow");
      const m = el("input");
      m.type = "number";
      m.min = "1";
      m.max = "30";
      m.value = base.marks;
      m.className = "pmark";
      mtd.appendChild(m);
      tr.appendChild(mtd);

      const dtd = el("td");
      const d = el("select", "pdiff");
      [["1", "Easy"], ["2", "Medium"], ["3", "Challenging"]].forEach(([v, t]) => {
        const o = el("option", "", t);
        o.value = v;
        d.appendChild(o);
      });
      d.value = String(base.diff);
      dtd.appendChild(d);
      tr.appendChild(dtd);

      tbody.appendChild(tr);
    }
  }

  const readPartRubric = () =>
    [...$("part-rubric").querySelectorAll("tbody tr")].map((tr) => ({
      marks: Math.max(1, +tr.querySelector(".pmark").value || 1),
      diff: +tr.querySelector(".pdiff").value || 2
    }));

  function bandRow(band) {
    const tr = el("tr");

    const mtd = el("td", "narrow");
    const m = el("input");
    m.type = "number";
    m.min = "0";
    m.max = "100";
    m.value = band.min;
    m.className = "bmin";
    mtd.appendChild(m);
    tr.appendChild(mtd);

    const ltd = el("td");
    const l = el("input");
    l.type = "text";
    l.value = band.label;
    l.className = "blabel";
    ltd.appendChild(l);
    tr.appendChild(ltd);

    const ktd = el("td", "kill");
    const x = el("button", "x", "×");
    x.title = "Remove this band";
    x.addEventListener("click", () => tr.remove());
    ktd.appendChild(x);
    tr.appendChild(ktd);

    return tr;
  }

  function buildBandRubric(bands) {
    const tbody = $("band-rubric").querySelector("tbody");
    tbody.innerHTML = "";
    (bands || DEFAULT_BANDS).forEach((b) => tbody.appendChild(bandRow(b)));
  }

  const readBands = () =>
    [...$("band-rubric").querySelectorAll("tbody tr")]
      .map((tr) => ({
        min: Math.min(100, Math.max(0, +tr.querySelector(".bmin").value || 0)),
        label: tr.querySelector(".blabel").value.trim() || "—"
      }))
      .sort((a, b) => b.min - a.min);

  // ---------- Blueprint ----------
  // One row per question (worksheets) or per part (exams, grouped by Q number).

  function bpTopicSelect(selected) {
    const sel = el("select", "btopic");
    const here = new Set(GRADE_GENS[state.grade] || []);
    const mine = el("optgroup");
    mine.label = "Grade " + state.grade;
    const other = el("optgroup");
    other.label = "Other grades";
    Object.keys(GENERATORS).forEach((id) => {
      const o = el("option", "", GENERATORS[id].name);
      o.value = id;
      (here.has(id) ? mine : other).appendChild(o);
    });
    sel.appendChild(mine);
    if (other.children.length) sel.appendChild(other);
    if (selected && GENERATORS[selected]) sel.value = selected;
    else sel.value = (GRADE_GENS[state.grade] || Object.keys(GENERATORS))[0];
    const tip = () => { sel.title = GENERATORS[sel.value] ? GENERATORS[sel.value].name : ""; };
    sel.addEventListener("change", tip);
    tip();
    return sel;
  }

  // One blueprint row is one sub-part: Q number, its part letter, topic,
  // difficulty, question type (MCQ / SAQ / LAQ), assessment objective, marks.
  function blueprintRow(row) {
    const tr = el("tr");

    const qtd = el("td", "bqc");
    const q = el("input");
    q.type = "number";
    q.min = "1";
    q.max = "40";
    q.value = row.q;
    q.className = "bq";
    qtd.appendChild(q);
    tr.appendChild(qtd);

    // Part letter, derived from position within the question — not editable.
    const ptd = el("td", "prt");
    ptd.appendChild(el("span", "bpart", ""));
    tr.appendChild(ptd);

    const ttd = el("td", "topic");
    ttd.appendChild(bpTopicSelect(row.topic));
    tr.appendChild(ttd);

    const mkSelect = (cls, options, value) => {
      const s = el("select", cls);
      options.forEach(([v, t]) => {
        const o = el("option", "", t);
        o.value = v;
        s.appendChild(o);
      });
      s.value = value;
      return s;
    };

    const ltd = el("td", "lvl");
    ltd.appendChild(mkSelect("bdiff", [["1", "Easy"], ["2", "Medium"], ["3", "Chall."]],
      String(row.diff || 2)));
    tr.appendChild(ltd);

    const tytd = el("td", "typ");
    const ty = mkSelect("btype", TYPE_KEYS.map((k) => [k, k]),
      TYPES[row.type] ? row.type : "SAQ");
    ty.title = TYPES[ty.value].full;
    ty.addEventListener("change", () => { ty.title = TYPES[ty.value].full; });
    tytd.appendChild(ty);
    tr.appendChild(tytd);

    const aotd = el("td", "ao");
    const ao = mkSelect("bao", AO_KEYS.map((k) => [k, k]), AOS[row.ao] ? row.ao : "AO1");
    ao.title = AOS[ao.value];
    ao.addEventListener("change", () => { ao.title = AOS[ao.value]; });
    aotd.appendChild(ao);
    tr.appendChild(aotd);

    const mtd = el("td", "mk");
    const m = el("input");
    m.type = "number";
    m.min = "0";
    m.max = "50";
    m.value = row.marks;
    m.className = "bmarks";
    mtd.appendChild(m);
    tr.appendChild(mtd);

    const ktd = el("td", "kill");
    const x = el("button", "x", "×");
    x.title = "Remove this sub-part";
    x.addEventListener("click", () => { tr.remove(); updateBpTotal(); });
    ktd.appendChild(x);
    tr.appendChild(ktd);

    tr.addEventListener("input", updateBpTotal);
    return tr;
  }

  function buildBlueprint(rows) {
    const tbody = $("blueprint").querySelector("tbody");
    tbody.innerHTML = "";
    (rows || []).forEach((r) => tbody.appendChild(blueprintRow(r)));
    updateBpTotal();
  }

  const readBlueprint = () =>
    [...$("blueprint").querySelectorAll("tbody tr")].map((tr) => ({
      q: Math.max(1, +tr.querySelector(".bq").value || 1),
      topic: tr.querySelector(".btopic").value,
      diff: +tr.querySelector(".bdiff").value || 2,
      type: tr.querySelector(".btype").value,
      ao: tr.querySelector(".bao").value,
      marks: Math.max(0, +tr.querySelector(".bmarks").value || 0)
    }));

  // Add one question made of `parts` sub-parts, after the highest Q number.
  function addQuestion(parts) {
    const rows = readBlueprint();
    const qn = rows.length ? Math.max(...rows.map((r) => r.q)) + 1 : 1;
    const tbody = $("blueprint").querySelector("tbody");
    const last = rows[rows.length - 1] || {};
    for (let i = 0; i < parts; i++) {
      tbody.appendChild(blueprintRow({
        q: qn,
        topic: last.topic || (GRADE_GENS[state.grade] || Object.keys(GENERATORS))[0],
        diff: Math.min(3, i + 1),
        type: last.type || "SAQ",
        ao: i === parts - 1 && parts > 1 ? "AO2" : "AO1",
        marks: last.marks || 2
      }));
    }
    updateBpTotal();
  }

  // Part letters follow position within the question, so they stay correct
  // however rows are added, removed or renumbered.
  function relabelParts() {
    const trs = [...$("blueprint").querySelectorAll("tbody tr")];
    const seen = new Map();
    trs.forEach((tr) => {
      const q = Math.max(1, +tr.querySelector(".bq").value || 1);
      const i = seen.get(q) || 0;
      seen.set(q, i + 1);
      tr.querySelector(".bpart").textContent = LETTERS[i] ? `(${LETTERS[i]})` : `(${i + 1})`;
    });
    // A question with a single part prints without a letter, so show none.
    trs.forEach((tr) => {
      const q = Math.max(1, +tr.querySelector(".bq").value || 1);
      if (seen.get(q) === 1) tr.querySelector(".bpart").textContent = "—";
    });
  }

  function updateBpTotal() {
    relabelParts();
    const rows = readBlueprint();
    const marks = rows.reduce((t, r) => t + r.marks, 0);
    const qs = new Set(rows.map((r) => r.q)).size;
    if (!rows.length) {
      $("bp-total").textContent =
        "No sub-parts yet — add a question, fill from topics, or paste from a spreadsheet.";
      return;
    }
    const by = (key) => {
      const t = {};
      rows.forEach((r) => { t[r[key]] = (t[r[key]] || 0) + r.marks; });
      return t;
    };
    const ao = by("ao"), ty = by("type");
    const pct = (v) => (marks ? Math.round((v / marks) * 100) : 0);
    const aoTxt = AO_KEYS.filter((k) => ao[k]).map((k) => `${k} ${ao[k]} (${pct(ao[k])}%)`).join(" · ");
    const tyTxt = TYPE_KEYS.filter((k) => ty[k]).map((k) => `${k} ${ty[k]}`).join(" · ");
    $("bp-total").textContent =
      `${qs} question(s) · ${rows.length} sub-part(s) · ${marks} marks\n` +
      `Marks by objective: ${aoTxt}\nMarks by type: ${tyTxt}`;
  }

  // Build blueprint rows from the ticked topics and the current quick settings.
  function fillFromTopics() {
    const topics = selectedTopics();
    if (!topics.length) return;
    const diffs = topicDiffs();
    const rows = [];
    // Seeded defaults: the last part of a multi-part question carries the
    // reasoning mark, so it starts as AO2; the rest are AO1.
    if (state.mode === "exam") {
      const parts = readPartRubric();
      topics.forEach((id, qi) => {
        parts.forEach((p, pi) => rows.push({
          q: qi + 1, topic: id, diff: p.diff, marks: p.marks,
          type: p.marks >= 4 ? "LAQ" : "SAQ",
          ao: pi === parts.length - 1 && parts.length > 1 ? "AO2" : "AO1"
        }));
      });
    } else {
      const per = Math.max(1, +$("q-count").value || 5);
      const marks = Math.max(0, +$("ws-marks").value || 0);
      let n = 1;
      topics.forEach((id) => {
        const setting = diffs[id] || "2";
        for (let i = 0; i < per; i++) {
          const diff = setting === "mixed" ? (i % 3) + 1 : +setting;
          rows.push({
            q: n++,
            topic: id,
            diff,
            marks,
            type: diff === 3 ? "LAQ" : "SAQ",
            ao: diff === 3 ? "AO2" : "AO1"
          });
        }
      });
    }
    buildBlueprint(rows);
  }

  // Accept "1, Factorising, Easy, SAQ, AO1, 2" — commas or tabs, level by name
  // or number. Type and AO are optional, so the older four-column form
  // "Q, Topic, Level, Marks" still loads.
  function parseBlueprint(text) {
    const byName = {};
    Object.keys(GENERATORS).forEach((id) => {
      byName[GENERATORS[id].name.toLowerCase()] = id;
      byName[id.toLowerCase()] = id;
    });
    const levelOf = (s) => {
      const t = String(s).trim().toLowerCase();
      if (/^[1-3]$/.test(t)) return +t;
      if (t.startsWith("e")) return 1;
      if (t.startsWith("m")) return 2;
      if (t.startsWith("c") || t.startsWith("h") || t.startsWith("d")) return 3;
      return 2;
    };
    const rows = [], bad = [];
    text.split(/\r?\n/).forEach((line, i) => {
      const raw = line.trim();
      if (!raw) return;
      const cells = raw.split(/\t|,(?![^(]*\))/).map((c) => c.trim());
      if (cells.length < 2) { bad.push(i + 1); return; }
      const [qc, tc, lc] = cells;
      if (/^q/i.test(qc) && isNaN(parseInt(qc, 10))) return;   // header line
      const key = String(tc || "").toLowerCase().replace(/^["']|["']$/g, "");
      const topic = byName[key] ||
        Object.keys(byName).find((n) => n.includes(key) && key.length > 3);
      if (!topic) { bad.push(i + 1); return; }
      // Type, AO and marks are found by what they look like, so a sheet can
      // carry them in any order after the level — or leave them out entirely.
      const rest = cells.slice(3);
      const type = TYPE_KEYS.find((k) => rest.some((c) => c.toUpperCase() === k)) || "SAQ";
      const ao = AO_KEYS.find((k) => rest.some((c) => c.toUpperCase().replace(/\s/g, "") === k)) || "AO1";
      const marksCell = rest.find((c) => /^\d+$/.test(c));
      rows.push({
        q: Math.max(1, parseInt(qc, 10) || rows.length + 1),
        topic: byName[topic] || topic,
        diff: levelOf(lc),
        type,
        ao,
        marks: Math.max(0, parseInt(marksCell, 10) || 0)
      });
    });
    return { rows, bad };
  }

  // ---------- end blueprint ----------

  const selectedTopics = () =>
    [...$("topic-list").querySelectorAll("input:checked")].map((i) => i.value);

  const topicDiffs = () => {
    const out = {};
    $("topic-list").querySelectorAll(".tdiff").forEach((s) => { out[s.dataset.topic] = s.value; });
    return out;
  };

  // Mark range for each band, given a paper total.
  function bandRanges(bands, total) {
    const out = [];
    let upper = total;
    bands.forEach((b) => {
      const lower = Math.ceil((b.min / 100) * total);
      out.push({ ...b, lower: Math.min(lower, upper), upper });
      upper = Math.max(0, Math.min(lower, upper) - 1);
    });
    return out;
  }

  // ---------- Models ----------

  // Draw one question for a topic at a difficulty, avoiding repeats.
  function draw(rng, topic, diff, seen) {
    for (let tries = 0; tries < 25; tries++) {
      const item = GENERATORS[topic].gen(rng, diff);
      if (!seen.has(item.q)) { seen.add(item.q); return item; }
    }
    return GENERATORS[topic].gen(rng, diff);
  }

  function worksheetModel(spec) {
    const rng = mulberry32(spec.seed);
    const questions = [], seen = new Set();
    const perTopic = spec.count;
    // Each topic contributes `count` questions at the difficulty set for it.
    spec.topics.forEach((id) => {
      const setting = spec.topicDiffs[id] || "2";
      for (let i = 0; i < perTopic; i++) {
        const d = setting === "mixed" ? (i % 3) + 1 : +setting;
        questions.push({ ...draw(rng, id, d, seen), topic: id, diff: d, marks: spec.marksEach });
      }
    });
    return { questions, total: paperTotal(questions) };
  }

  const paperTotal = (questions) => {
    const sum = questions.reduce((t, q) => t + (q.marks || 0), 0);
    return sum > 0 ? sum : questions.length;
  };

  // Blueprint → paper. Rows sharing a Q number are the sub-parts of that
  // question; a question with one row prints without a part letter. The same
  // shape serves worksheets and exams, so the two stay in step.
  function blueprintModel(spec) {
    const rng = mulberry32(spec.seed);
    const seen = new Set();
    const groups = new Map();
    spec.blueprint.forEach((r) => {
      if (!groups.has(r.q)) groups.set(r.q, []);
      groups.get(r.q).push(r);
    });
    const questions = [...groups.keys()].sort((a, b) => a - b).map((qn) => {
      const rows = groups.get(qn);
      const parts = rows.map((r, pi) => {
        const item = draw(rng, r.topic, r.diff, seen);
        const type = TYPES[r.type] ? r.type : "SAQ";
        // An MCQ needs three distractors; where the generator cannot supply
        // them the part falls back to a written short answer rather than
        // printing a choice that gives itself away.
        let opts = null;
        if (type === "MCQ") opts = makeOptions(r.topic, r.diff, item, rng);
        return {
          letter: LETTERS[pi] || String(pi + 1),
          single: rows.length === 1,
          marks: r.marks,
          diff: r.diff,
          type: opts ? "MCQ" : (type === "MCQ" ? "SAQ" : type),
          ao: AOS[r.ao] ? r.ao : "AO1",
          topic: r.topic,
          options: opts ? opts.options : null,
          correct: opts ? opts.correct : -1,
          item
        };
      });
      return {
        topic: rows[0].topic,
        parts,
        total: parts.reduce((t, p) => t + p.marks, 0)
      };
    });
    const grandTotal = questions.reduce((t, q) => t + q.total, 0);
    return { questions, grandTotal, total: grandTotal, blueprint: true };
  }

  // Marks split by assessment objective and by question type — the tally that
  // makes a blueprint worth writing.
  function paperBreakdown(model) {
    const ao = {}, type = {};
    let total = 0;
    (model.questions || []).forEach((q) => (q.parts || []).forEach((p) => {
      ao[p.ao] = (ao[p.ao] || 0) + p.marks;
      type[p.type] = (type[p.type] || 0) + p.marks;
      total += p.marks;
    }));
    return { ao, type, total };
  }

  function examModel(spec) {
    const rng = mulberry32(spec.seed);
    const questions = [];
    for (let qi = 0; qi < spec.questions; qi++) {
      const topic = spec.topics[qi % spec.topics.length];
      const parts = [], seen = new Set();
      spec.partRubric.forEach((rule, pi) => {
        let item = null;
        for (let tries = 0; tries < 20; tries++) {
          const c = GENERATORS[topic].gen(rng, rule.diff);
          if (!seen.has(c.q)) { item = c; break; }
        }
        if (!item) item = GENERATORS[topic].gen(rng, rule.diff);
        seen.add(item.q);
        parts.push({ letter: LETTERS[pi], marks: rule.marks, diff: rule.diff, item });
      });
      questions.push({ topic, parts, total: parts.reduce((t, p) => t + p.marks, 0) });
    }
    const grandTotal = questions.reduce((t, q) => t + q.total, 0);
    return { questions, grandTotal, total: grandTotal };
  }

  function markSchemeEntries(spec, model) {
    if (spec.mode === "exam" || model.blueprint) {
      const out = [];
      model.questions.forEach((q, qi) =>
        q.parts.forEach((p) => out.push({
          label: `Q${qi + 1}${p.single ? "" : " (" + p.letter + ")"}`,
          marks: p.marks, item: p.item, part: p
        })));
      return out;
    }
    return model.questions.map((item, i) => ({
      label: `Q${i + 1}`, marks: item.marks || 0, item
    }));
  }

  // For an MCQ the mark scheme leads with the option letter the learner
  // should have chosen, then the working that gets them there.
  const msAnswer = (e) =>
    e.part && e.part.type === "MCQ" && e.part.correct >= 0
      ? `${OPTION_LETTERS[e.part.correct]}  (${e.item.a})`
      : e.item.a;

  // ---------- Page rendering ----------

  function letterheadImg() {
    const img = el("img", "letterhead-img");
    img.src = "letterhead.png";
    img.alt = "Al Injaz International Private School";
    return img;
  }

  // Grade-band table printed on the paper.
  function rubricTable(spec, model) {
    const wrap = el("div", "rubric-print");
    wrap.appendChild(el("div", "cap", "Grading Rubric"));
    const t = el("table", "tpl");
    const head = el("tr");
    ["Grade / Reward", "Percentage", "Marks"].forEach((h) => head.appendChild(el("th", "", h)));
    t.appendChild(head);
    bandRanges(spec.bands, model.total).forEach((b, i, arr) => {
      const tr = el("tr");
      tr.appendChild(el("td", "", b.label));
      const pct = i === 0 ? `${b.min}% and above`
        : b.min === 0 ? `below ${arr[i - 1].min}%`
        : `${b.min}% – ${arr[i - 1].min - 1}%`;
      tr.appendChild(el("td", "", pct));
      tr.appendChild(el("td", "", b.lower === b.upper ? String(b.lower) : `${b.lower} – ${b.upper}`));
      t.appendChild(tr);
    });
    wrap.appendChild(t);
    return wrap;
  }

  // One sub-part of a blueprint question: its text, marks, options if it is an
  // MCQ, and working space sized by its question type.
  function renderPart(p, box, spec) {
    const row = el("div", "part");
    const label = p.single ? "" : `(${p.letter})&nbsp; `;
    const pt = el("span", "ptext");
    pt.innerHTML = label + mathHTML(p.item.q);
    row.appendChild(pt);
    if (p.marks > 0) row.appendChild(el("span", "pmarks", `[${p.marks}]`));
    box.appendChild(row);

    if (p.type === "MCQ" && p.options) {
      const opts = el("div", "mcq-opts");
      p.options.forEach((o, i) => {
        const cell = el("div", "mcq-opt");
        cell.innerHTML = `<span class="mcq-let">${OPTION_LETTERS[i]}.</span> ` + mathHTML(o);
        opts.appendChild(cell);
      });
      box.appendChild(opts);
      return;
    }
    // Long answers get a worked page, short answers a line or two; the
    // teacher's own space setting can still widen a worksheet.
    const base = TYPES[p.type] ? TYPES[p.type].space : 1;
    const room = Math.max(base, p.marks >= 4 ? 3 : p.marks >= 3 ? 2 : base);
    if (room > 0) box.appendChild(el("div", "space-" + Math.min(3, room)));
  }

  // Marks by assessment objective and question type, printed on the paper so
  // the blueprint the teacher planned is visible on the paper they hand out.
  function breakdownTable(model) {
    const b = paperBreakdown(model);
    const wrap = el("div", "foot-block");
    wrap.appendChild(el("p", "tbl-head", "Assessment Objectives"));
    const t = el("table", "tpl");
    const head = el("tr");
    ["Assessment Objective", "Description", "Marks", "%"].forEach((h) => head.appendChild(el("th", "", h)));
    t.appendChild(head);
    AO_KEYS.filter((k) => b.ao[k]).forEach((k) => {
      const tr = el("tr");
      tr.appendChild(el("td", "", k));
      tr.appendChild(el("td", "", AOS[k]));
      tr.appendChild(el("td", "", String(b.ao[k])));
      tr.appendChild(el("td", "", b.total ? Math.round((b.ao[k] / b.total) * 100) + "%" : "—"));
      t.appendChild(tr);
    });
    const types = TYPE_KEYS.filter((k) => b.type[k]);
    if (types.length) {
      const tr = el("tr");
      tr.appendChild(el("td", "", "Question types"));
      tr.appendChild(el("td", "",
        types.map((k) => `${TYPES[k].full} (${k}) ${b.type[k]}`).join(",  ")));
      tr.appendChild(el("td", "", String(b.total)));
      tr.appendChild(el("td", "", "100%"));
      t.appendChild(tr);
    }
    wrap.appendChild(t);
    return wrap;
  }

  function renderWorksheet(spec, model, sheet) {
    sheet.appendChild(letterheadImg());

    const meta = el("div", "ws-meta");
    const r1 = el("div", "row");
    r1.appendChild(el("span", "", `Grade: ${spec.grade}${spec.section || ""}`));
    r1.appendChild(el("span", "", `Subject: ${spec.subject}`));
    meta.appendChild(r1);

    const r2 = el("div", "row");
    r2.appendChild(el("span", "", "Topic: " + spec.topicTitle));
    const dateSpan = el("span", "", "Date: ");
    dateSpan.appendChild(el("span", "fill"));
    r2.appendChild(dateSpan);
    meta.appendChild(r2);

    const r3 = el("div", "row");
    const name = el("span", "grow", "Name: ");
    name.appendChild(el("span", "fill"));
    r3.appendChild(name);
    meta.appendChild(r3);
    sheet.appendChild(meta);

    // A blueprint worksheet has sub-parts per question; a quick-setup one has
    // a flat list, and prints exactly as it always has.
    if (model.blueprint) {
      model.questions.forEach((q, qi) => {
        const box = el("div", "ws-q");
        const qh = el("div", "q-head");
        qh.appendChild(el("span", "", `Q${qi + 1}.`));
        if (q.total > 0) qh.appendChild(el("span", "", `[${q.total} Marks]`));
        box.appendChild(qh);
        q.parts.forEach((p) => renderPart(p, box, spec));
        sheet.appendChild(box);
      });
      sheet.appendChild(breakdownTable(model));
      if (spec.rubric) sheet.appendChild(rubricTable(spec, model));
      sheet.appendChild(worksheetFooter(spec, model));
      return;
    }

    model.questions.forEach((item, i) => {
      const box = el("div", "ws-q");
      if (item.marks > 0) {
        const row = el("div", "part");
        row.style.paddingInlineStart = "0";
        row.style.marginTop = "0";
        const txt = el("span", "ptext");
        txt.innerHTML = `<b>Q${i + 1}.</b> ` + mathHTML(item.q);
        row.appendChild(txt);
        row.appendChild(el("span", "pmarks", `[${item.marks}]`));
        box.appendChild(row);
      } else {
        box.appendChild(el("span", "num", `Q${i + 1}. `));
        const span = el("span");
        setMath(span, item.q);
        box.appendChild(span);
      }
      sheet.appendChild(box);
      if (spec.space > 0) sheet.appendChild(el("div", "space-" + spec.space));
    });

    if (spec.rubric) sheet.appendChild(rubricTable(spec, model));
    sheet.appendChild(worksheetFooter(spec, model));
  }

  function worksheetFooter(spec, model) {
    const wrap = el("div", "foot-block");
    const tbl = el("table", "foot-tbl");

    const scoreRow = el("tr");
    scoreRow.appendChild(el("td", "k", "Score"));
    scoreRow.appendChild(el("td", "", `________ / ${model.total}`));
    scoreRow.appendChild(el("td", "k", "Teacher's Remarks"));
    scoreRow.appendChild(el("td", "", ""));
    tbl.appendChild(scoreRow);

    if (spec.reward) {
      const rewardRow = el("tr");
      rewardRow.appendChild(el("td", "k", "Reward"));
      const cell = el("td");
      cell.colSpan = 3;
      const row = el("div", "reward-row");
      bandRanges(spec.bands, model.total).forEach((b) => {
        const item = el("span", "reward");
        item.appendChild(el("span", "tickbox"));
        item.appendChild(el("span", "", `${b.label} (${b.lower}–${b.upper})`));
        row.appendChild(item);
      });
      cell.appendChild(row);
      rewardRow.appendChild(cell);
      tbl.appendChild(rewardRow);
    }

    const signRow = el("tr");
    signRow.appendChild(el("td", "k", "Teacher's Signature"));
    signRow.appendChild(el("td", "sign", ""));
    signRow.appendChild(el("td", "k", "Parent's Signature"));
    signRow.appendChild(el("td", "sign", ""));
    tbl.appendChild(signRow);

    wrap.appendChild(tbl);
    return wrap;
  }

  function renderExam(spec, model, sheet) {
    sheet.appendChild(letterheadImg());
    sheet.appendChild(el("div", "exam-title", spec.title));

    const info = el("table", "tpl");
    const rowA = el("tr");
    [["Subject", spec.subject], ["Grade", String(spec.grade)], ["Section", spec.section || "—"]]
      .forEach(([k, v]) => { rowA.appendChild(el("td", "lbl", k)); rowA.appendChild(el("td", "val", v)); });
    const rowB = el("tr");
    [["Duration", spec.duration], ["Date", spec.date], ["Marks", String(model.grandTotal)]]
      .forEach(([k, v]) => { rowB.appendChild(el("td", "lbl", k)); rowB.appendChild(el("td", "val", v)); });
    info.appendChild(rowA);
    info.appendChild(rowB);
    sheet.appendChild(info);

    const sig = el("div", "sig-block");
    sig.appendChild(el("div", "", "Learner's Name: ____________________________________________   Roll No.: ________"));
    sig.appendChild(el("div", "", "Section Head: ______________   Academic Head: ______________   Vice Principal: ______________"));
    sig.appendChild(el("div", "", "Invigilator (Name & Sign): ____________________________   Parent's Sign.: ____________________________"));
    sheet.appendChild(sig);

    const marks = el("table", "tpl");
    const head = el("tr");
    ["Question No.", "Maximum Marks", "Marks Obtained", "Check 1", "Check 2", "HOD"]
      .forEach((h) => head.appendChild(el("th", "", h)));
    marks.appendChild(head);
    model.questions.forEach((q, i) => {
      const tr = el("tr");
      tr.appendChild(el("td", "", String(i + 1)));
      tr.appendChild(el("td", "", String(q.total)));
      for (let c = 0; c < 4; c++) tr.appendChild(el("td", "", ""));
      marks.appendChild(tr);
    });
    const totalRow = el("tr");
    totalRow.appendChild(el("td", "", "Total"));
    totalRow.appendChild(el("td", "", String(model.grandTotal)));
    for (let c = 0; c < 4; c++) totalRow.appendChild(el("td", "", ""));
    marks.appendChild(totalRow);
    const signRow = el("tr");
    signRow.appendChild(el("td", "", "Name & Sign"));
    for (let c = 0; c < 5; c++) signRow.appendChild(el("td", "", ""));
    marks.appendChild(signRow);
    sheet.appendChild(marks);

    if (spec.rubric) sheet.appendChild(rubricTable(spec, model));

    const ins = el("div", "instructions");
    ins.appendChild(el("h4", "", "Instructions:"));
    const ul = el("ul");
    INSTRUCTIONS.forEach((t) => ul.appendChild(el("li", "", t)));
    ins.appendChild(ul);
    sheet.appendChild(ins);

    model.questions.forEach((q, qi) => {
      const box = el("div", "q");
      const qh = el("div", "q-head");
      qh.appendChild(el("span", "", `Q${qi + 1})`));
      qh.appendChild(el("span", "", `[${q.total} Marks]`));
      box.appendChild(qh);
      q.parts.forEach((p) => renderPart(
        { ...p, single: p.single !== undefined ? p.single : q.parts.length === 1 }, box, spec));
      sheet.appendChild(box);
    });

    if (model.blueprint) sheet.appendChild(breakdownTable(model));
  }

  function renderMarkScheme(spec, model, sheet) {
    const box = el("div", "mark-scheme");
    box.appendChild(el("h3", "",
      `Mark Scheme — ${spec.mode === "exam" ? spec.title : "Worksheet"} (Grade ${spec.grade}, Paper ${spec.seed})`));
    markSchemeEntries(spec, model).forEach((e) => {
      const item = el("div", "ms-item");
      item.appendChild(el("div", "ms-q", `${e.label}${e.marks ? "  [" + e.marks + "]" : ""}`));
      const ansLine = el("div", "ms-ans");
      ansLine.innerHTML = "Answer: " + mathHTML(msAnswer(e));
      item.appendChild(ansLine);
      (e.item.sol || []).forEach((s) => {
        const line = el("div", "ms-steps");
        line.innerHTML = mathHTML(s.t);
        line.appendChild(el("span", "code", s.m));
        item.appendChild(line);
      });
      box.appendChild(item);
    });
    sheet.appendChild(box);
  }

  function render() {
    const sheet = $("sheet");
    sheet.innerHTML = "";
    const spec = state.spec, model = state.model;
    if (!spec) {
      sheet.style.removeProperty("--sheet-size");
      sheet.appendChild(el("p", "placeholder-hint",
        "Choose a grade and at least one topic, then press Generate."));
      return;
    }
    sheet.style.setProperty("--sheet-size", fontFor(spec.grade) + "pt");
    if (spec.mode === "exam") renderExam(spec, model, sheet);
    else renderWorksheet(spec, model, sheet);
    if (spec.answers) renderMarkScheme(spec, model, sheet);
    sheet.appendChild(el("p", "sheet-foot",
      `Al Injaz International Private School — Mathematics Department — Paper ${spec.seed}`));
  }

  // ---------- Word (.doc) export ----------

  function wordStyles(pt) {
    return `
@page WordSection1 {
  size: 21.0cm 29.7cm;
  margin: 1.2cm 1.4cm 1.2cm 1.4cm;
  mso-page-border-surround-header: no;
  mso-page-border-surround-footer: no;
  border: 1pt solid windowtext;
  padding: 12pt;
}
div.WordSection1 { page: WordSection1; }
body, p, td, th, div, li { font-family: "Comic Sans MS"; font-size: ${pt}.0pt; color: #000; }
p { margin: 0 0 4pt 0; }
table { border-collapse: collapse; }
table.tpl { width: 100%; }
table.tpl td, table.tpl th { border: 1pt solid windowtext; padding: 3pt 5pt; text-align: center; }
table.tpl th { font-weight: bold; }
table.tpl td.lbl { font-weight: bold; text-align: left; }
table.tpl td.val { text-align: left; }
table.lay { width: 100%; }
table.lay td { border: none; padding: 0; vertical-align: top; }
td.right { text-align: right; }
.title { text-align: center; font-weight: bold; font-size: ${pt + 2}.0pt; }
.qhead { font-weight: bold; }
.ms-code { border: 1pt solid windowtext; padding: 0 3pt; font-size: ${pt - 2}.0pt; }
`;
  }

  const layRow = (left, right) =>
    `<table class="lay"><tr><td>${left}</td><td class="right">${right}</td></tr></table>`;

  const spacer = (h) => `<p style="margin:0;line-height:${h}pt">&nbsp;</p>`;

  function wordRubric(spec, model) {
    if (!spec.rubric) return "";
    let h = `<p style="margin-top:8pt"><b>Grading Rubric</b></p><table class="tpl">`;
    h += `<tr><th>Grade / Reward</th><th>Percentage</th><th>Marks</th></tr>`;
    bandRanges(spec.bands, model.total).forEach((b, i, arr) => {
      const pct = i === 0 ? `${b.min}% and above`
        : b.min === 0 ? `below ${arr[i - 1].min}%`
        : `${b.min}% – ${arr[i - 1].min - 1}%`;
      const mk = b.lower === b.upper ? String(b.lower) : `${b.lower} – ${b.upper}`;
      h += `<tr><td>${esc(b.label)}</td><td>${esc(pct)}</td><td>${esc(mk)}</td></tr>`;
    });
    return h + `</table>`;
  }

  function wordWorksheet(spec, model) {
    let h = `<p><img src="${LETTERHEAD_DATA_URI}" width="640" alt="Al Injaz International Private School"></p>`;
    h += layRow(`Grade: ${esc(spec.grade + (spec.section || ""))}`, `Subject: ${esc(spec.subject)}`);
    h += layRow(`Topic: ${esc(spec.topicTitle)}`, `Date: ____________`);
    h += `<p>Name: ______________________________________________________________</p>`;

    if (model.blueprint) {
      model.questions.forEach((q, qi) => {
        h += layRow(`<b>Q${qi + 1}.</b>`, q.total > 0 ? `<b>[${q.total} Marks]</b>` : "");
        q.parts.forEach((p) => { h += wordPart(p, q.parts.length === 1); });
      });
      h += wordBreakdown(model);
    } else {
      model.questions.forEach((item, i) => {
        if (item.marks > 0) {
          h += layRow(`<b>Q${i + 1}.</b> ${mathWord(item.q)}`, `[${item.marks}]`);
        } else {
          h += `<p><b>Q${i + 1}.</b> ${mathWord(item.q)}</p>`;
        }
        if (spec.space > 0) h += spacer(spec.space === 1 ? 26 : spec.space === 2 ? 56 : 96);
      });
    }

    h += wordRubric(spec, model);

    h += `<table class="tpl" style="margin-top:10pt">`;
    h += `<tr><td class="lbl" style="width:18%">Score</td><td class="val" style="width:32%">________ / ${model.total}</td>`;
    h += `<td class="lbl" style="width:20%">Teacher's Remarks</td><td class="val" style="width:30%">&nbsp;</td></tr>`;
    if (spec.reward) {
      const cells = bandRanges(spec.bands, model.total)
        .map((b) => `&#9744; ${esc(b.label)} (${b.lower}–${b.upper})`).join("&nbsp;&nbsp; ");
      h += `<tr><td class="lbl">Reward</td><td class="val" colspan="3">${cells}</td></tr>`;
    }
    h += `<tr><td class="lbl">Teacher's Signature</td><td class="val" style="height:34pt">&nbsp;</td>`;
    h += `<td class="lbl">Parent's Signature</td><td class="val">&nbsp;</td></tr>`;
    h += `</table>`;
    return h;
  }

  function wordExam(spec, model) {
    let h = `<p><img src="${LETTERHEAD_DATA_URI}" width="640" alt="Al Injaz International Private School"></p>`;
    h += `<p class="title">${esc(spec.title)}</p>`;

    h += `<table class="tpl"><tr>`;
    [["Subject", spec.subject], ["Grade", spec.grade], ["Section", spec.section || "—"]]
      .forEach(([k, v]) => { h += `<td class="lbl">${esc(k)}</td><td class="val">${esc(v)}</td>`; });
    h += `</tr><tr>`;
    [["Duration", spec.duration], ["Date", spec.date], ["Marks", model.grandTotal]]
      .forEach(([k, v]) => { h += `<td class="lbl">${esc(k)}</td><td class="val">${esc(v)}</td>`; });
    h += `</tr></table>`;

    h += `<p>Learner's Name: ____________________________________________&nbsp;&nbsp; Roll No.: ________</p>`;
    h += `<p>Section Head: ______________&nbsp;&nbsp; Academic Head: ______________&nbsp;&nbsp; Vice Principal: ______________</p>`;
    h += `<p>Invigilator (Name &amp; Sign): ____________________________&nbsp;&nbsp; Parent's Sign.: ____________________________</p>`;

    h += `<table class="tpl"><tr>`;
    ["Question No.", "Maximum Marks", "Marks Obtained", "Check 1", "Check 2", "HOD"]
      .forEach((t) => { h += `<th>${esc(t)}</th>`; });
    h += `</tr>`;
    model.questions.forEach((q, i) => {
      h += `<tr><td>${i + 1}</td><td>${q.total}</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`;
    });
    h += `<tr><td>Total</td><td>${model.grandTotal}</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`;
    h += `<tr><td>Name &amp; Sign</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`;
    h += `</table>`;

    h += wordRubric(spec, model);

    h += `<p style="margin-top:8pt"><b>Instructions:</b></p><ul>`;
    INSTRUCTIONS.forEach((t) => { h += `<li>${esc(t)}</li>`; });
    h += `</ul>`;

    model.questions.forEach((q, qi) => {
      h += layRow(`<span class="qhead">Q${qi + 1})</span>`, `<b>[${q.total} Marks]</b>`);
      q.parts.forEach((p) => { h += wordPart(p, q.parts.length === 1); });
    });
    if (model.blueprint) h += wordBreakdown(model);
    return h;
  }

  // Word twin of renderPart(). Word has no flexbox, so options go in a
  // borderless table, two to a row.
  function wordPart(p, onlyPart) {
    const single = p.single !== undefined ? p.single : onlyPart;
    const label = single ? "" : `(${p.letter})&nbsp; `;
    let h = layRow(`&nbsp;&nbsp;&nbsp;${label}${mathWord(p.item.q)}`,
      p.marks > 0 ? `[${p.marks}]` : "");
    if (p.type === "MCQ" && p.options) {
      h += `<table class="lay" style="margin-left:22pt"><tr>`;
      p.options.forEach((o, i) => {
        if (i && i % 2 === 0) h += `</tr><tr>`;
        h += `<td style="width:50%"><b>${OPTION_LETTERS[i]}.</b> ${mathWord(o)}</td>`;
      });
      h += `</tr></table>`;
      return h + spacer(6);
    }
    const base = TYPES[p.type] ? TYPES[p.type].space : 1;
    const room = Math.max(base, p.marks >= 4 ? 3 : p.marks >= 3 ? 2 : base);
    return h + (room > 0 ? spacer(room >= 3 ? 90 : room === 2 ? 56 : 28) : "");
  }

  function wordBreakdown(model) {
    const b = paperBreakdown(model);
    let h = `<p style="margin-top:8pt"><b>Assessment Objectives</b></p><table class="tpl">`;
    h += `<tr><th>Assessment Objective</th><th>Description</th><th>Marks</th><th>%</th></tr>`;
    AO_KEYS.filter((k) => b.ao[k]).forEach((k) => {
      const pct = b.total ? Math.round((b.ao[k] / b.total) * 100) + "%" : "—";
      h += `<tr><td>${k}</td><td>${esc(AOS[k])}</td><td>${b.ao[k]}</td><td>${pct}</td></tr>`;
    });
    const types = TYPE_KEYS.filter((k) => b.type[k]);
    if (types.length) {
      const desc = types.map((k) => `${TYPES[k].full} (${k}) ${b.type[k]}`).join(",  ");
      h += `<tr><td>Question types</td><td>${esc(desc)}</td><td>${b.total}</td><td>100%</td></tr>`;
    }
    return h + `</table>`;
  }

  function wordMarkScheme(spec, model) {
    let h = `<br clear="all" style="mso-special-character:line-break;page-break-before:always">`;
    h += `<p class="title">Mark Scheme — ${esc(spec.mode === "exam" ? spec.title : "Worksheet")} (Grade ${esc(spec.grade)}, Paper ${esc(spec.seed)})</p>`;
    markSchemeEntries(spec, model).forEach((e) => {
      h += `<p style="margin-bottom:0"><b>${esc(e.label)}${e.marks ? "  [" + e.marks + "]" : ""}</b></p>`;
      h += `<p style="margin:0 0 0 14pt">Answer: ${mathWord(msAnswer(e))}</p>`;
      (e.item.sol || []).forEach((s) => {
        h += `<p style="margin:0 0 0 14pt">${mathWord(s.t)} <span class="ms-code">${esc(s.m)}</span></p>`;
      });
      h += `<p style="margin:0 0 4pt 0">&nbsp;</p>`;
    });
    return h;
  }

  function buildWordDoc(spec, model) {
    const body = spec.mode === "exam" ? wordExam(spec, model) : wordWorksheet(spec, model);
    const ms = spec.answers ? wordMarkScheme(spec, model) : "";
    const title = spec.mode === "exam"
      ? `${spec.title} — Grade ${spec.grade}`
      : `Mathematics Worksheet — Grade ${spec.grade}`;
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" ` +
      `xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">` +
      `<head><meta charset="utf-8"><title>${esc(title)}</title>` +
      `<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>` +
      `<w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->` +
      `<style>${wordStyles(fontFor(spec.grade))}</style></head>` +
      `<body><div class="WordSection1">${body}${ms}</div></body></html>`;
  }

  function downloadWord() {
    if (!state.spec) generate();
    if (!state.spec) return;
    const spec = state.spec;
    const html = buildWordDoc(spec, state.model);
    const name = spec.mode === "exam"
      ? `AlIPS_Grade${spec.grade}_Exam_Paper${spec.seed}.doc`
      : `AlIPS_Grade${spec.grade}_Worksheet_Paper${spec.seed}.doc`;
    const blob = new Blob(["﻿", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  }

  // ---------- Wiring ----------

  const autoTopicTitle = (topics) => topics.map((id) => GENERATORS[id].name).join(", ");

  function generate() {
    const topics = selectedTopics();
    if (!topics.length && state.plan !== "blueprint") {
      state.spec = null; state.model = null; render(); return;
    }
    const typed = $("topic-title-input").value.trim();
    const spec = {
      mode: state.mode,
      grade: state.grade,
      section: $("section-input").value.trim(),
      topics,
      topicDiffs: topicDiffs(),
      seed: +$("seed").value || 1,
      answers: $("show-answers").checked,
      rubric: $("show-rubric").checked,
      reward: $("show-reward").checked,
      bands: readBands(),
      subject: $("exam-subject").value.trim() || "Mathematics",
      topicTitle: typed || autoTopicTitle(topics),
      count: Math.max(1, +$("q-count").value || 5),
      marksEach: Math.max(0, +$("ws-marks").value || 0),
      space: +$("ws-space").value,
      title: $("exam-title").value.trim(),
      duration: $("exam-duration").value.trim(),
      date: $("exam-date").value.trim(),
      questions: Math.max(1, +$("exam-questions").value || 5),
      partRubric: readPartRubric(),
      plan: state.plan,
      blueprint: readBlueprint()
    };

    if (spec.plan === "blueprint") {
      if (!spec.blueprint.length) {
        state.spec = null; state.model = null;
        $("sheet").innerHTML = "";
        $("sheet").appendChild(el("p", "placeholder-hint",
          "Your blueprint is empty. Add rows, press \u201cFill from topics\u201d, or paste from a spreadsheet."));
        return;
      }
      if (!spec.topicTitle || !typed) {
        const uniq = [...new Set(spec.blueprint.map((r) => r.topic))];
        spec.topicTitle = uniq.map((id) => GENERATORS[id].name).join(", ");
      }
      state.model = blueprintModel(spec);
    } else {
      state.model = spec.mode === "exam" ? examModel(spec) : worksheetModel(spec);
    }
    state.spec = spec;
    render();
  }

  function setPlan(plan) {
    state.plan = plan;
    $("plan-quick").classList.toggle("active", plan === "quick");
    $("plan-blueprint").classList.toggle("active", plan === "blueprint");
    $("blueprint-opts").classList.toggle("hidden", plan !== "blueprint");
    // In blueprint mode the quick controls no longer drive the paper.
    $("worksheet-opts").classList.toggle("hidden",
      plan === "blueprint" || state.mode !== "worksheet");
    $("part-rubric-group").classList.toggle("hidden", plan === "blueprint");
    // The blueprint table has eight columns; give the panel room for them.
    document.querySelector(".gen-layout").classList.toggle("wide-panel", plan === "blueprint");
    updateBpHint();
  }

  function updateBpHint() {
    $("bp-hint").textContent =
      "— one line per sub-part; lines sharing a Q number become (a) (b) (c)";
  }

  function setMode(mode) {
    state.mode = mode;
    $("mode-worksheet").classList.toggle("active", mode === "worksheet");
    $("mode-exam").classList.toggle("active", mode === "exam");
    $("worksheet-opts").classList.toggle("hidden", mode !== "worksheet");
    $("exam-opts").classList.toggle("hidden", mode !== "exam");
    $("reward-opt").classList.toggle("hidden", mode !== "worksheet");
    $("topic-hint").textContent = mode === "exam"
      ? "— difficulty comes from the question rubric below"
      : "— tick a topic, then set its difficulty";
    $("topic-list").classList.toggle("diff-muted", mode === "exam");
    setPlan(state.plan);
  }

  $("plan-quick").addEventListener("click", () => setPlan("quick"));
  $("plan-blueprint").addEventListener("click", () => {
    setPlan("blueprint");
    if (!readBlueprint().length) fillFromTopics();
  });
  // "+ Sub-part" adds one more part to the question the last row belongs to.
  $("bp-add").addEventListener("click", () => {
    const rows = readBlueprint();
    const last = rows[rows.length - 1];
    $("blueprint").querySelector("tbody").appendChild(blueprintRow({
      q: last ? last.q : 1,
      topic: last ? last.topic : (selectedTopics()[0] || (GRADE_GENS[state.grade] || [])[0]),
      diff: last ? last.diff : 2,
      type: last ? last.type : "SAQ",
      ao: last ? last.ao : "AO1",
      marks: last ? last.marks : (state.mode === "exam" ? 3 : 1)
    }));
    updateBpTotal();
  });
  $("bp-addq").addEventListener("click", () => {
    addQuestion(Math.max(1, Math.min(8, +$("bp-parts").value || 1)));
  });
  $("bp-fill").addEventListener("click", fillFromTopics);
  $("bp-clear").addEventListener("click", () => buildBlueprint([]));
  $("bp-import").addEventListener("click", () => {
    const { rows, bad } = parseBlueprint($("bp-text").value);
    if (rows.length) buildBlueprint(rows);
    $("bp-import-msg").textContent = rows.length
      ? `Loaded ${rows.length} row(s)` + (bad.length ? ` · skipped line(s) ${bad.join(", ")}` : "")
      : "Could not read any rows — check the topic names match the list above.";
  });

  $("mode-worksheet").addEventListener("click", () => setMode("worksheet"));
  $("mode-exam").addEventListener("click", () => setMode("exam"));
  $("grade-select").addEventListener("change", (e) => {
    state.grade = +e.target.value;
    buildTopicList();
  });
  $("topic-all").addEventListener("click", () => {
    const boxes = $("topic-list").querySelectorAll("input[type=checkbox]");
    const allOn = [...boxes].every((b) => b.checked);
    boxes.forEach((b) => { b.checked = !allOn; b.dispatchEvent(new Event("change")); });
  });
  $("difficulty").addEventListener("change", (e) => {
    const v = e.target.value;
    if (!v) return;
    $("topic-list").querySelectorAll(".tdiff").forEach((s) => { s.value = v; });
    e.target.value = "";
  });
  $("exam-parts").addEventListener("change", () => buildPartRubric());
  $("band-add").addEventListener("click", () =>
    $("band-rubric").querySelector("tbody").appendChild(bandRow({ min: 50, label: "New band" })));
  $("band-reset").addEventListener("click", () => buildBandRubric(DEFAULT_BANDS));
  $("new-seed").addEventListener("click", () => {
    $("seed").value = Math.floor(Math.random() * 899999) + 100000;
    generate();
  });
  $("generate").addEventListener("click", generate);
  $("print").addEventListener("click", () => window.print());
  $("download-word").addEventListener("click", downloadWord);
  $("save-settings").addEventListener("click", (e) => {
    const okSaved = save({
      partRubric: readPartRubric(),
      bands: readBands(),
      blueprint: readBlueprint(),
      plan: state.plan,
      marksEach: +$("ws-marks").value || 0,
      space: +$("ws-space").value,
      rubric: $("show-rubric").checked,
      reward: $("show-reward").checked,
      answers: $("show-answers").checked,
      subject: $("exam-subject").value.trim(),
      examTitle: $("exam-title").value.trim(),
      duration: $("exam-duration").value.trim()
    });
    e.target.textContent = okSaved ? "✓ Saved as your default" : "Could not save (private browsing?)";
    setTimeout(() => { e.target.textContent = "Save these settings as my default"; }, 2500);
  });

  // ---------- Init ----------
  const params = new URLSearchParams(location.search);
  const saved = load();

  if (params.get("grade")) state.grade = +params.get("grade");
  buildGradeSelect();
  buildTopicList(saved);

  if (saved) {
    if (saved.subject) $("exam-subject").value = saved.subject;
    if (saved.examTitle) $("exam-title").value = saved.examTitle;
    if (saved.duration) $("exam-duration").value = saved.duration;
    if (typeof saved.marksEach === "number") $("ws-marks").value = saved.marksEach;
    if (typeof saved.space === "number") $("ws-space").value = saved.space;
    if (typeof saved.rubric === "boolean") $("show-rubric").checked = saved.rubric;
    if (typeof saved.reward === "boolean") $("show-reward").checked = saved.reward;
    if (typeof saved.answers === "boolean") $("show-answers").checked = saved.answers;
  }
  buildBandRubric(saved && saved.bands);
  buildBlueprint((saved && saved.blueprint) || []);
  if (params.get("parts")) $("exam-parts").value = params.get("parts");
  buildPartRubric(saved);

  if (saved && saved.plan) state.plan = saved.plan;
  if (params.get("plan")) state.plan = params.get("plan");
  setMode(params.get("mode") === "exam" ? "exam" : "worksheet");
  $("seed").value = params.get("seed") || Math.floor(Math.random() * 899999) + 100000;
  if (params.get("count")) $("q-count").value = params.get("count");
  if (params.get("space")) $("ws-space").value = params.get("space");
  if (params.get("marks")) $("ws-marks").value = params.get("marks");
  if (params.get("questions")) $("exam-questions").value = params.get("questions");
  if (params.get("reward") === "0") $("show-reward").checked = false;
  if (params.get("rubric") === "0") $("show-rubric").checked = false;
  if (params.get("answers") === "0") $("show-answers").checked = false;
  if (params.get("diff")) {
    $("topic-list").querySelectorAll(".tdiff").forEach((s) => { s.value = params.get("diff"); });
  }

  if (params.get("auto")) generate(); else render();
})();
