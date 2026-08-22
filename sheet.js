// AlIPS worksheet & exam generator — follows the department's Word templates.
// One model is built per paper and rendered two ways: to the page (screen and
// print) and to a Word (.doc) file, so both always contain the same questions.

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

  // Reward bands printed on worksheets — the teacher ticks one.
  const REWARDS = [
    { star: "★", label: "Gold Star", band: "90% and above" },
    { star: "★", label: "Silver Star", band: "75% – 89%" },
    { star: "★", label: "Bronze Star", band: "60% – 74%" },
    { star: "✎", label: "Keep Practising", band: "below 60%" }
  ];

  const state = { mode: "worksheet", grade: 5, spec: null, model: null };

  // Grades 1–4 print at 14 pt, all other grades at 12 pt.
  const fontFor = (grade) => (grade <= 4 ? 14 : 12);

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

  // ---------- Models (questions only — no presentation) ----------

  function worksheetModel(spec) {
    const rng = mulberry32(spec.seed);
    const questions = [], seen = new Set();
    const wanted = spec.count * spec.topics.length;
    let i = 0, guard = 0;
    while (questions.length < wanted && guard < wanted * 25) {
      guard++;
      const id = spec.topics[i % spec.topics.length];
      i++;
      const d = spec.diff === "mixed" ? (questions.length % 3) + 1 : +spec.diff;
      const item = GENERATORS[id].gen(rng, d);
      if (seen.has(item.q)) continue;
      seen.add(item.q);
      questions.push(item);
    }
    return { questions };
  }

  function examModel(spec) {
    const rng = mulberry32(spec.seed);
    const questions = [];
    for (let qi = 0; qi < spec.questions; qi++) {
      const topic = spec.topics[qi % spec.topics.length];
      const parts = [], seen = new Set();
      for (let pi = 0; pi < spec.parts; pi++) {
        let item = null;
        for (let tries = 0; tries < 20; tries++) {
          const c = GENERATORS[topic].gen(rng, PART_DIFF[pi]);
          if (!seen.has(c.q)) { item = c; break; }
        }
        if (!item) item = GENERATORS[topic].gen(rng, PART_DIFF[pi]);
        seen.add(item.q);
        parts.push({ letter: LETTERS[pi], marks: PART_MARKS[pi], item });
      }
      questions.push({ topic, parts, total: parts.reduce((t, p) => t + p.marks, 0) });
    }
    return { questions, grandTotal: questions.reduce((t, q) => t + q.total, 0) };
  }

  // Flat list of {label, marks, item} for the mark scheme.
  function markSchemeEntries(spec, model) {
    if (spec.mode === "exam") {
      const out = [];
      model.questions.forEach((q, qi) =>
        q.parts.forEach((p) => out.push({ label: `Q${qi + 1} (${p.letter})`, marks: p.marks, item: p.item })));
      return out;
    }
    return model.questions.map((item, i) => ({ label: `Q${i + 1}`, marks: 0, item }));
  }

  // ---------- Page rendering ----------

  function letterheadImg() {
    const img = el("img", "letterhead-img");
    img.src = "letterhead.png";
    img.alt = "Al Injaz International Private School";
    return img;
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

    model.questions.forEach((item, i) => {
      const box = el("div", "ws-q");
      box.appendChild(el("span", "num", `Q${i + 1}. `));
      box.appendChild(document.createTextNode(item.q));
      sheet.appendChild(box);
      if (spec.space > 0) sheet.appendChild(el("div", "space-" + spec.space));
    });

    sheet.appendChild(worksheetFooter(spec, model));
  }

  // Score, reward chart and signature spaces at the foot of a worksheet.
  function worksheetFooter(spec, model) {
    const wrap = el("div", "foot-block");
    const tbl = el("table", "foot-tbl");

    const scoreRow = el("tr");
    scoreRow.appendChild(el("td", "k", "Score"));
    scoreRow.appendChild(el("td", "", `________ / ${model.questions.length}`));
    scoreRow.appendChild(el("td", "k", "Teacher's Remarks"));
    scoreRow.appendChild(el("td", "", ""));
    tbl.appendChild(scoreRow);

    if (spec.reward) {
      const rewardRow = el("tr");
      rewardRow.appendChild(el("td", "k", "Reward"));
      const cell = el("td");
      cell.colSpan = 3;
      const row = el("div", "reward-row");
      REWARDS.forEach((r) => {
        const item = el("span", "reward");
        item.appendChild(el("span", "tickbox"));
        item.appendChild(el("span", "star", r.star));
        item.appendChild(el("span", "", `${r.label} (${r.band})`));
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
      q.parts.forEach((p) => {
        const row = el("div", "part");
        row.appendChild(el("span", "ptext", `(${p.letter})  ${p.item.q}`));
        row.appendChild(el("span", "pmarks", `[${p.marks}]`));
        box.appendChild(row);
        box.appendChild(el("div", "space-" + (p.marks >= 4 ? 3 : p.marks >= 3 ? 2 : 1)));
      });
      sheet.appendChild(box);
    });
  }

  function renderMarkScheme(spec, model, sheet) {
    const box = el("div", "mark-scheme");
    box.appendChild(el("h3", "",
      `Mark Scheme — ${spec.mode === "exam" ? spec.title : "Worksheet"} (Grade ${spec.grade}, Paper ${spec.seed})`));
    markSchemeEntries(spec, model).forEach((e) => {
      const item = el("div", "ms-item");
      item.appendChild(el("div", "ms-q", `${e.label}${e.marks ? "  [" + e.marks + "]" : ""}`));
      item.appendChild(el("div", "ms-ans", "Answer: " + e.item.a));
      (e.item.sol || []).forEach((s) => {
        const line = el("div", "ms-steps", s.t);
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
  // Word ignores flexbox, so every aligned row is built as a borderless table.

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

  // Two-column row: left text, right text (used for marks, dates, headers).
  const layRow = (left, right) =>
    `<table class="lay"><tr><td>${left}</td><td class="right">${right}</td></tr></table>`;

  const spacer = (h) => `<p style="margin:0;line-height:${h}pt">&nbsp;</p>`;

  function wordWorksheet(spec, model) {
    let h = `<p><img src="${LETTERHEAD_DATA_URI}" width="640" alt="Al Injaz International Private School"></p>`;
    h += layRow(`Grade: ${esc(spec.grade + (spec.section || ""))}`, `Subject: ${esc(spec.subject)}`);
    h += layRow(`Topic: ${esc(spec.topicTitle)}`, `Date: ____________`);
    h += `<p>Name: ______________________________________________________________</p>`;

    model.questions.forEach((item, i) => {
      h += `<p><b>Q${i + 1}.</b> ${nl2br(item.q)}</p>`;
      if (spec.space > 0) h += spacer(spec.space === 1 ? 26 : spec.space === 2 ? 56 : 96);
    });

    // Score / reward / signatures
    h += `<table class="tpl" style="margin-top:10pt">`;
    h += `<tr><td class="lbl" style="width:18%">Score</td><td class="val" style="width:32%">________ / ${model.questions.length}</td>`;
    h += `<td class="lbl" style="width:20%">Teacher's Remarks</td><td class="val" style="width:30%">&nbsp;</td></tr>`;
    if (spec.reward) {
      const cells = REWARDS.map((r) => `&#9744; ${r.star} ${esc(r.label)} (${esc(r.band)})`).join("&nbsp;&nbsp; ");
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

    h += `<p style="margin-top:8pt"><b>Instructions:</b></p><ul>`;
    INSTRUCTIONS.forEach((t) => { h += `<li>${esc(t)}</li>`; });
    h += `</ul>`;

    model.questions.forEach((q, qi) => {
      h += layRow(`<span class="qhead">Q${qi + 1})</span>`, `<b>[${q.total} Marks]</b>`);
      q.parts.forEach((p) => {
        h += layRow(`&nbsp;&nbsp;&nbsp;(${p.letter})&nbsp; ${nl2br(p.item.q)}`, `[${p.marks}]`);
        h += spacer(p.marks >= 4 ? 90 : p.marks >= 3 ? 56 : 28);
      });
    });
    return h;
  }

  function wordMarkScheme(spec, model) {
    let h = `<br clear="all" style="mso-special-character:line-break;page-break-before:always">`;
    h += `<p class="title">Mark Scheme — ${esc(spec.mode === "exam" ? spec.title : "Worksheet")} (Grade ${esc(spec.grade)}, Paper ${esc(spec.seed)})</p>`;
    markSchemeEntries(spec, model).forEach((e) => {
      h += `<p style="margin-bottom:0"><b>${esc(e.label)}${e.marks ? "  [" + e.marks + "]" : ""}</b></p>`;
      h += `<p style="margin:0 0 0 14pt">Answer: ${nl2br(e.item.a)}</p>`;
      (e.item.sol || []).forEach((s) => {
        h += `<p style="margin:0 0 0 14pt">${nl2br(s.t)} <span class="ms-code">${esc(s.m)}</span></p>`;
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
    if (!state.spec) { generate(); }
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
    if (!topics.length) { state.spec = null; state.model = null; render(); return; }
    const typed = $("topic-title-input").value.trim();
    const spec = {
      mode: state.mode,
      grade: state.grade,
      section: $("section-input").value.trim(),
      topics,
      seed: +$("seed").value || 1,
      answers: $("show-answers").checked,
      reward: $("show-reward").checked,
      subject: $("exam-subject").value.trim() || "Mathematics",
      topicTitle: typed || autoTopicTitle(topics),
      count: Math.max(1, +$("q-count").value || 5),
      diff: $("difficulty").value,
      space: +$("ws-space").value,
      title: $("exam-title").value.trim(),
      duration: $("exam-duration").value.trim(),
      date: $("exam-date").value.trim(),
      questions: Math.max(1, +$("exam-questions").value || 5),
      parts: +$("exam-parts").value
    };
    state.spec = spec;
    state.model = spec.mode === "exam" ? examModel(spec) : worksheetModel(spec);
    render();
  }

  function setMode(mode) {
    state.mode = mode;
    $("mode-worksheet").classList.toggle("active", mode === "worksheet");
    $("mode-exam").classList.toggle("active", mode === "exam");
    $("worksheet-opts").classList.toggle("hidden", mode !== "worksheet");
    $("exam-opts").classList.toggle("hidden", mode !== "exam");
    $("reward-opt").classList.toggle("hidden", mode !== "worksheet");
  }

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
  $("download-word").addEventListener("click", downloadWord);

  // ---------- Init ----------
  const params = new URLSearchParams(location.search);
  if (params.get("grade")) state.grade = +params.get("grade");
  buildGradeSelect();
  buildTopicList();
  setMode(params.get("mode") === "exam" ? "exam" : "worksheet");
  $("seed").value = params.get("seed") || Math.floor(Math.random() * 899999) + 100000;
  // Optional overrides so a teacher can bookmark a ready-made configuration.
  if (params.get("count")) $("q-count").value = params.get("count");
  if (params.get("space")) $("ws-space").value = params.get("space");
  if (params.get("questions")) $("exam-questions").value = params.get("questions");
  if (params.get("parts")) $("exam-parts").value = params.get("parts");
  if (params.get("reward") === "0") $("show-reward").checked = false;
  if (params.get("answers") === "0") $("show-answers").checked = false;
  if (params.get("auto")) generate(); else render();
})();
