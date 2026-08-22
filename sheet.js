// AlIPS worksheet & exam generator — follows the department's Word templates.

(function () {
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  // Marks awarded to each part of an exam question, by position.
  const PART_MARKS = [2, 3, 4, 4];
  const PART_DIFF = [1, 2, 3, 3];
  const LETTERS = ["a", "b", "c", "d"];

  const INSTRUCTIONS = [
    "Answer all questions",
    "Use only a blue ink pen",
    "Do not use highlighters, glue or correction fluid",
    "All drawings must be done in pencil and using geometrical tools",
    "Numbers in the [] brackets indicate marks"
  ];

  const state = { mode: "worksheet", grade: 5, spec: null };

  // Grades 1–4 print at 14 pt, all other grades at 12 pt.
  const fontFor = (grade) => (grade <= 4 ? "14pt" : "12pt");

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

  function buildTopicList() {
    const box = $("topic-list");
    const prev = new Set([...box.querySelectorAll("input:checked")].map((i) => i.value));
    box.innerHTML = "";
    (GRADE_GENS[state.grade] || []).forEach((id, idx) => {
      const label = el("label");
      const cb = el("input");
      cb.type = "checkbox";
      cb.value = id;
      cb.checked = prev.size ? prev.has(id) : idx < 4;
      label.appendChild(cb);
      label.appendChild(el("span", "", GENERATORS[id].name));
      box.appendChild(label);
    });
  }

  const selectedTopics = () =>
    [...$("topic-list").querySelectorAll("input:checked")].map((i) => i.value);

  // Draw `n` distinct questions from the given topics, round-robin.
  function drawQuestions(rng, topics, n, diff) {
    const out = [], seen = new Set();
    let i = 0, guard = 0;
    while (out.length < n && guard < n * 25) {
      guard++;
      const id = topics[i % topics.length];
      i++;
      const d = diff === "mixed" ? (out.length % 3) + 1 : +diff;
      const item = GENERATORS[id].gen(rng, d);
      if (seen.has(item.q)) continue;
      seen.add(item.q);
      out.push({ topic: id, ...item });
    }
    return out;
  }

  function letterhead() {
    const img = el("img", "letterhead-img");
    img.src = "letterhead.png";
    img.alt = "Al Injaz International Private School";
    return img;
  }

  // ---------- Worksheet (matches Gr. 11 wkst format) ----------

  function renderWorksheet(spec, sheet) {
    const rng = mulberry32(spec.seed);
    sheet.appendChild(letterhead());

    const meta = el("div", "ws-meta");
    const r1 = el("div", "row");
    r1.appendChild(el("span", "", `Grade: ${spec.grade}${spec.section ? spec.section : ""}`));
    r1.appendChild(el("span", "", "Subject: Mathematics"));
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

    const all = [];
    const qs = drawQuestions(rng, spec.topics, spec.count * spec.topics.length, spec.diff);
    qs.forEach((item, i) => {
      all.push({ label: `Q${i + 1}`, item });
      const box = el("div", "ws-q");
      box.appendChild(el("span", "num", `Q${i + 1}. `));
      box.appendChild(document.createTextNode(item.q));
      sheet.appendChild(box);
      if (spec.space > 0) sheet.appendChild(el("div", "space-" + spec.space));
    });

    return all;
  }

  // ---------- Exam paper (matches Gr. 11A Sem-1 QP) ----------

  function renderExam(spec, sheet) {
    const rng = mulberry32(spec.seed);

    // Build the questions first so the marks table can be filled in.
    const questions = [];
    for (let qi = 0; qi < spec.questions; qi++) {
      const topic = spec.topics[qi % spec.topics.length];
      const parts = [];
      const seen = new Set();
      for (let pi = 0; pi < spec.parts; pi++) {
        let item = null;
        for (let tries = 0; tries < 20; tries++) {
          const candidate = GENERATORS[topic].gen(rng, PART_DIFF[pi]);
          if (!seen.has(candidate.q)) { item = candidate; break; }
        }
        if (!item) item = GENERATORS[topic].gen(rng, PART_DIFF[pi]);
        seen.add(item.q);
        parts.push({ letter: LETTERS[pi], marks: PART_MARKS[pi], item });
      }
      questions.push({ topic, parts, total: parts.reduce((t, p) => t + p.marks, 0) });
    }
    const grandTotal = questions.reduce((t, q) => t + q.total, 0);

    sheet.appendChild(letterhead());
    sheet.appendChild(el("div", "exam-title", spec.title));

    // Info table
    const info = el("table", "tpl");
    const rowA = el("tr");
    [["Subject", spec.subject], ["Grade", String(spec.grade)], ["Section", spec.section || "—"]]
      .forEach(([k, v]) => {
        rowA.appendChild(el("td", "lbl", k));
        rowA.appendChild(el("td", "val", v));
      });
    const rowB = el("tr");
    [["Duration", spec.duration], ["Date", spec.date], ["Marks", String(grandTotal)]]
      .forEach(([k, v]) => {
        rowB.appendChild(el("td", "lbl", k));
        rowB.appendChild(el("td", "val", v));
      });
    info.appendChild(rowA);
    info.appendChild(rowB);
    sheet.appendChild(info);

    // Signature block
    const sig = el("div", "sig-block");
    sig.appendChild(el("div", "", "Learner's Name: ____________________________________________   Roll No.: ________"));
    sig.appendChild(el("div", "", "Section Head: ______________   Academic Head: ______________   Vice Principal: ______________"));
    sig.appendChild(el("div", "", "Invigilator (Name & Sign): ____________________________   Parent's Sign.: ____________________________"));
    sheet.appendChild(sig);

    // Marks tally table
    const marks = el("table", "tpl");
    const head = el("tr");
    ["Question No.", "Maximum Marks", "Marks Obtained", "Check 1", "Check 2", "HOD"]
      .forEach((h) => head.appendChild(el("th", "", h)));
    marks.appendChild(head);
    questions.forEach((q, i) => {
      const tr = el("tr");
      tr.appendChild(el("td", "", String(i + 1)));
      tr.appendChild(el("td", "", String(q.total)));
      for (let c = 0; c < 4; c++) tr.appendChild(el("td", "", ""));
      marks.appendChild(tr);
    });
    const totalRow = el("tr");
    totalRow.appendChild(el("td", "", "Total"));
    totalRow.appendChild(el("td", "", String(grandTotal)));
    for (let c = 0; c < 4; c++) totalRow.appendChild(el("td", "", ""));
    marks.appendChild(totalRow);
    const signRow = el("tr");
    signRow.appendChild(el("td", "", "Name & Sign"));
    for (let c = 0; c < 5; c++) signRow.appendChild(el("td", "", ""));
    marks.appendChild(signRow);
    sheet.appendChild(marks);

    // Instructions
    const ins = el("div", "instructions");
    ins.appendChild(el("h4", "", "Instructions:"));
    const ul = el("ul");
    INSTRUCTIONS.forEach((t) => ul.appendChild(el("li", "", t)));
    ins.appendChild(ul);
    sheet.appendChild(ins);

    // Questions
    const all = [];
    questions.forEach((q, qi) => {
      const box = el("div", "q");
      const head2 = el("div", "q-head");
      head2.appendChild(el("span", "", `Q${qi + 1})`));
      head2.appendChild(el("span", "", `[${q.total} Marks]`));
      box.appendChild(head2);

      q.parts.forEach((p) => {
        all.push({ label: `Q${qi + 1} (${p.letter})`, item: p.item, marks: p.marks });
        const row = el("div", "part");
        row.appendChild(el("span", "ptext", `(${p.letter})  ${p.item.q}`));
        row.appendChild(el("span", "pmarks", `[${p.marks}]`));
        box.appendChild(row);
        box.appendChild(el("div", "space-" + (p.marks >= 4 ? 3 : p.marks >= 3 ? 2 : 1)));
      });

      sheet.appendChild(box);
    });

    return all;
  }

  // ---------- Mark scheme ----------

  function renderMarkScheme(all, sheet, spec) {
    const box = el("div", "mark-scheme");
    box.appendChild(el("h3", "", `Mark Scheme — ${spec.mode === "exam" ? spec.title : "Worksheet"} (Grade ${spec.grade}, Paper ${spec.seed})`));
    all.forEach((entry) => {
      const item = el("div", "ms-item");
      item.appendChild(el("div", "ms-q", `${entry.label}${entry.marks ? "  [" + entry.marks + "]" : ""}`));
      item.appendChild(el("div", "ms-ans", "Answer: " + entry.item.a));
      (entry.item.sol || []).forEach((s) => {
        const line = el("div", "ms-steps", s.t);
        line.appendChild(el("span", "code", s.m));
        item.appendChild(line);
      });
      box.appendChild(item);
    });
    sheet.appendChild(box);
  }

  // ---------- Render ----------

  function render() {
    const sheet = $("sheet");
    sheet.innerHTML = "";
    const spec = state.spec;
    if (!spec) {
      sheet.style.removeProperty("--sheet-size");
      sheet.appendChild(el("p", "placeholder-hint",
        "Choose a grade and at least one topic, then press Generate."));
      return;
    }
    sheet.style.setProperty("--sheet-size", fontFor(spec.grade));

    const all = spec.mode === "exam" ? renderExam(spec, sheet) : renderWorksheet(spec, sheet);
    if (spec.answers) renderMarkScheme(all, sheet, spec);
    sheet.appendChild(el("p", "sheet-foot",
      `Al Injaz International Private School — Mathematics Department — Paper ${spec.seed}`));
  }

  function autoTopicTitle(topics) {
    return topics.map((id) => GENERATORS[id].name).join(", ");
  }

  function generate() {
    const topics = selectedTopics();
    if (!topics.length) { state.spec = null; render(); return; }
    const typed = $("topic-title-input").value.trim();
    state.spec = {
      mode: state.mode,
      grade: state.grade,
      section: $("section-input").value.trim(),
      topics,
      seed: +$("seed").value || 1,
      answers: $("show-answers").checked,
      // worksheet
      topicTitle: typed || autoTopicTitle(topics),
      count: Math.max(1, +$("q-count").value || 5),
      diff: $("difficulty").value,
      space: +$("ws-space").value,
      // exam
      title: $("exam-title").value.trim(),
      subject: $("exam-subject").value.trim() || "Mathematics",
      duration: $("exam-duration").value.trim(),
      date: $("exam-date").value.trim(),
      questions: Math.max(1, +$("exam-questions").value || 5),
      parts: +$("exam-parts").value
    };
    render();
  }

  function setMode(mode) {
    state.mode = mode;
    $("mode-worksheet").classList.toggle("active", mode === "worksheet");
    $("mode-exam").classList.toggle("active", mode === "exam");
    $("worksheet-opts").classList.toggle("hidden", mode !== "worksheet");
    $("exam-opts").classList.toggle("hidden", mode !== "exam");
  }

  // ---------- Events ----------
  $("mode-worksheet").addEventListener("click", () => setMode("worksheet"));
  $("mode-exam").addEventListener("click", () => setMode("exam"));
  $("grade-select").addEventListener("change", (e) => {
    state.grade = +e.target.value;
    buildTopicList();
  });
  $("topic-all").addEventListener("click", () => {
    const boxes = $("topic-list").querySelectorAll("input");
    const allOn = [...boxes].every((b) => b.checked);
    boxes.forEach((b) => { b.checked = !allOn; });
  });
  $("new-seed").addEventListener("click", () => {
    $("seed").value = Math.floor(Math.random() * 899999) + 100000;
    generate();
  });
  $("generate").addEventListener("click", generate);
  $("print").addEventListener("click", () => window.print());

  // ---------- Init ----------
  const params = new URLSearchParams(location.search);
  if (params.get("grade")) state.grade = +params.get("grade");
  buildGradeSelect();
  buildTopicList();
  if (params.get("mode") === "exam") setMode("exam");
  $("seed").value = params.get("seed") || Math.floor(Math.random() * 899999) + 100000;
  if (params.get("auto")) generate(); else render();
})();
