// AlIPS Lesson Planner — builds a lesson plan and a matching slide deck from
// one model, so the plan a teacher prints and the slides they present always
// contain the same questions.
//
// Outputs: printable lesson plan, Word (.doc), full-screen present mode,
// and a real PowerPoint (.pptx) built in the browser via zip.js.

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

  const state = { view: "plan", grade: 5, topic: null, model: null, spec: null, slide: 0, revealed: false };

  // ---------- Teacher's own wording, remembered per topic ----------
  const FIELD_KEY = "alips-lesson-fields";     // { [topicId]: {objectives, criteria} }
  const PREF_KEY = "alips-planner-prefs";      // teacher, section, duration

  const draftObjectives = (title) => [
    `Understand ${title}.`,
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

  // Department-approved wording for a topic, falling back to a generic draft.
  function deptFields(topic, title) {
    const d = (typeof DEPT_FIELDS !== "undefined" && DEPT_FIELDS[topic]) || null;
    return {
      objectives: d && d.objectives && d.objectives.length ? d.objectives : draftObjectives(title),
      criteria: d && d.criteria && d.criteria.length ? d.criteria : DRAFT_CRITERIA,
      isDept: !!d
    };
  }

  // Three layers: this teacher's saved wording → department wording → generic draft.
  function loadFields(topic, title) {
    const saved = readStore(FIELD_KEY)[topic];
    const dept = deptFields(topic, title);
    const useSaved = saved && saved.objectives && saved.objectives.length;
    $("objectives").value = (useSaved ? saved.objectives : dept.objectives).join("\n");
    $("criteria").value = (useSaved ? saved.criteria : dept.criteria).join("\n");
    $("fields-msg").textContent = useSaved ? "your saved wording"
      : dept.isDept ? "department wording" : "draft wording";
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

  function buildTopicSelect() {
    const sel = $("topic-select");
    sel.innerHTML = "";
    const ids = GRADE_GENS[state.grade] || [];
    ids.forEach((id) => {
      const o = el("option", "", GENERATORS[id].name);
      o.value = id;
      sel.appendChild(o);
    });
    if (!ids.includes(state.topic)) state.topic = ids[0] || null;
    if (state.topic) sel.value = state.topic;
  }

  // ---------- Model ----------

  function buildModel(spec) {
    const rng = mulberry32(spec.seed);
    const seen = new Set();
    const draw = (diff) => {
      for (let i = 0; i < 25; i++) {
        const item = GENERATORS[spec.topic].gen(rng, diff);
        if (!seen.has(item.q)) { seen.add(item.q); return item; }
      }
      return GENERATORS[spec.topic].gen(rng, diff);
    };
    const many = (n, diff) => Array.from({ length: n }, () => draw(diff));

    const L = LESSONS[spec.topic] || {};
    return {
      concept: L.concept || "",
      example: L.example || [],
      tips: L.tips || [],
      links: typeof researchLinks === "function" ? researchLinks(spec.topic) : [],
      starter: many(spec.nStarter, 1),
      examples: many(spec.nExamples, 2),
      support: many(spec.nPractice, 1),
      core: many(spec.nPractice, 2),
      challenge: many(spec.nPractice, 3),
      plenary: many(1, 2)[0],
      homework: many(spec.nHome, 2)
    };
  }

  // ---------- Lesson plan (screen / print) ----------

  const qList = (items, showAns) => {
    const ol = el("ol", "q-list");
    items.forEach((it) => {
      const li = el("li");
      li.innerHTML = mathHTML(it.q) + (showAns ? ` <span class="ans">(${mathHTML(it.a)})</span>` : "");
      ol.appendChild(li);
    });
    return ol;
  };

  function section(title, minutes) {
    const h = el("div", "plan-sec");
    const head = el("div", "plan-sec-head");
    head.appendChild(el("span", "", title));
    if (minutes) head.appendChild(el("span", "mins", minutes));
    h.appendChild(head);
    return h;
  }

  function renderPlan(spec, model, sheet) {
    const img = el("img", "letterhead-img");
    img.src = "letterhead.png";
    img.alt = "Al Injaz International Private School";
    sheet.appendChild(img);

    sheet.appendChild(el("div", "exam-title", "LESSON PLAN"));

    const info = el("table", "tpl");
    const r1 = el("tr");
    [["Subject", "Mathematics"], ["Grade", `${spec.grade}${spec.section || ""}`], ["Duration", spec.duration]]
      .forEach(([k, v]) => { r1.appendChild(el("td", "lbl", k)); r1.appendChild(el("td", "val", v)); });
    const r2 = el("tr");
    [["Topic", spec.title], ["Teacher", spec.teacher || "____________"], ["Date", spec.date]]
      .forEach(([k, v]) => { r2.appendChild(el("td", "lbl", k)); r2.appendChild(el("td", "val", v)); });
    info.appendChild(r1);
    info.appendChild(r2);
    sheet.appendChild(info);

    // Objectives
    let s = section("Learning objectives");
    const ul = el("ul", "plan-list");
    (spec.objectives.length ? spec.objectives : draftObjectives(spec.title))
      .forEach((t) => ul.appendChild(el("li", "", t)));
    s.appendChild(ul);
    sheet.appendChild(s);

    // Success criteria
    s = section("Success criteria");
    const sc = el("ul", "plan-list");
    (spec.criteria.length ? spec.criteria : DRAFT_CRITERIA)
      .forEach((t) => sc.appendChild(el("li", "", t)));
    s.appendChild(sc);
    sheet.appendChild(s);

    // Key idea
    if (model.concept) {
      s = section("Key idea");
      s.appendChild(el("p", "", model.concept));
      if (model.tips.length) {
        const t = el("ul", "plan-list");
        model.tips.forEach((x) => t.appendChild(el("li", "", x)));
        s.appendChild(t);
      }
      sheet.appendChild(s);
    }

    // Starter
    if (model.starter.length) {
      s = section("Starter / retrieval", "5 min");
      s.appendChild(qList(model.starter, spec.answers));
      sheet.appendChild(s);
    }

    // Teaching sequence with worked examples
    s = section("Teaching sequence — I do", "10 min");
    if (model.example.length) {
      const pre = el("pre", "example-block");
      pre.textContent = model.example.join("\n");
      s.appendChild(pre);
    }
    model.examples.forEach((ex, i) => {
      const box = el("div", "worked");
      box.innerHTML = `<b>Example ${i + 1}.</b> ` + mathHTML(ex.q);
      const ol = el("ol", "steps");
      (ex.sol || []).forEach((st) => {
        const li = el("li");
        li.innerHTML = mathHTML(st.t);
        ol.appendChild(li);
      });
      box.appendChild(ol);
      if (spec.answers) {
        const a = el("div", "ans");
        a.innerHTML = "Answer: " + mathHTML(ex.a);
        box.appendChild(a);
      }
      s.appendChild(box);
    });
    sheet.appendChild(s);

    // Differentiated practice
    s = section("Guided &amp; independent practice — We do / You do", "20 min");
    s.querySelector(".plan-sec-head span").textContent = "Guided & independent practice — We do / You do";
    [["Support", model.support], ["Core", model.core], ["Challenge", model.challenge]]
      .forEach(([label, items]) => {
        if (!items.length) return;
        const g = el("div", "diff-group");
        g.appendChild(el("div", "diff-label", label));
        g.appendChild(qList(items, spec.answers));
        s.appendChild(g);
      });
    sheet.appendChild(s);

    // Plenary
    s = section("Plenary / exit ticket", "5 min");
    const p = el("div", "worked");
    p.innerHTML = mathHTML(model.plenary.q) + (spec.answers ? ` <span class="ans">(${mathHTML(model.plenary.a)})</span>` : "");
    s.appendChild(p);
    sheet.appendChild(s);

    // Homework
    if (model.homework.length) {
      s = section("Homework");
      s.appendChild(qList(model.homework, spec.answers));
      sheet.appendChild(s);
    }

    // Resources
    if (model.links.length) {
      s = section("Resources");
      const r = el("ul", "plan-list");
      model.links.forEach((lk) => {
        const li = el("li");
        const a = el("a", "", lk.label);
        a.href = lk.url;
        a.target = "_blank";
        a.rel = "noopener";
        li.appendChild(a);
        r.appendChild(li);
      });
      s.appendChild(r);
      sheet.appendChild(s);
    }

    sheet.appendChild(el("div", "sig-block-plan",
      "Teacher's Signature: ____________________     Head of Department: ____________________"));
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

  // ---------- Word export ----------

  function wordDoc(spec, model) {
    const pt = fontFor(spec.grade);
    const li = (items, showAns) => "<ol>" + items.map((it) =>
      `<li>${mathWord(it.q)}${showAns ? ` <i>(${mathWord(it.a)})</i>` : ""}</li>`).join("") + "</ol>";

    let b = `<p><img src="${LETTERHEAD_DATA_URI}" width="640"></p>`;
    b += `<p class="title">LESSON PLAN</p>`;
    b += `<table class="tpl"><tr>` +
      [["Subject", "Mathematics"], ["Grade", spec.grade + (spec.section || "")], ["Duration", spec.duration]]
        .map(([k, v]) => `<td class="lbl">${esc(k)}</td><td class="val">${esc(v)}</td>`).join("") +
      `</tr><tr>` +
      [["Topic", spec.title], ["Teacher", spec.teacher || "____________"], ["Date", spec.date]]
        .map(([k, v]) => `<td class="lbl">${esc(k)}</td><td class="val">${esc(v)}</td>`).join("") +
      `</tr></table>`;

    const bul = (items) => "<ul>" + items.map((t) => `<li>${esc(t)}</li>`).join("") + "</ul>";
    b += `<p><b>Learning objectives</b></p>` +
      bul(spec.objectives.length ? spec.objectives : draftObjectives(spec.title));
    b += `<p><b>Success criteria</b></p>` + bul(spec.criteria.length ? spec.criteria : DRAFT_CRITERIA);

    if (model.concept) {
      b += `<p><b>Key idea</b></p><p>${esc(model.concept)}</p>`;
      if (model.tips.length) b += "<ul>" + model.tips.map((t) => `<li>${esc(t)}</li>`).join("") + "</ul>";
    }
    if (model.starter.length) b += `<p><b>Starter / retrieval (5 min)</b></p>` + li(model.starter, spec.answers);

    b += `<p><b>Teaching sequence — I do (10 min)</b></p>`;
    if (model.example.length) b += `<p>${model.example.map(esc).join("<br>")}</p>`;
    model.examples.forEach((ex, i) => {
      b += `<p><b>Example ${i + 1}.</b> ${mathWord(ex.q)}</p><ol>` +
        (ex.sol || []).map((st) => `<li>${mathWord(st.t)} [${esc(st.m)}]</li>`).join("") + `</ol>`;
      if (spec.answers) b += `<p><i>Answer: ${mathWord(ex.a)}</i></p>`;
    });

    b += `<p><b>Guided &amp; independent practice — We do / You do (20 min)</b></p>`;
    [["Support", model.support], ["Core", model.core], ["Challenge", model.challenge]].forEach(([k, items]) => {
      if (items.length) b += `<p><b>${k}</b></p>` + li(items, spec.answers);
    });

    b += `<p><b>Plenary / exit ticket (5 min)</b></p><p>${mathWord(model.plenary.q)}` +
      (spec.answers ? ` <i>(${mathWord(model.plenary.a)})</i>` : "") + `</p>`;
    if (model.homework.length) b += `<p><b>Homework</b></p>` + li(model.homework, spec.answers);
    b += `<p>&nbsp;</p><p>Teacher's Signature: ____________________&nbsp;&nbsp;&nbsp; Head of Department: ____________________</p>`;

    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" ` +
      `xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">` +
      `<head><meta charset="utf-8"><title>${esc(spec.title)} — Lesson Plan</title>` +
      `<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->` +
      `<style>@page WordSection1 { size: 21.0cm 29.7cm; margin: 1.2cm 1.4cm;
        mso-page-border-surround-header:no; mso-page-border-surround-footer:no;
        border: 1pt solid windowtext; padding: 12pt; }
        div.WordSection1 { page: WordSection1; }
        body,p,td,th,div,li { font-family:"Comic Sans MS"; font-size:${pt}.0pt; color:#000; }
        p { margin: 0 0 4pt 0; }
        table { border-collapse: collapse; } table.tpl { width:100%; }
        table.tpl td { border:1pt solid windowtext; padding:3pt 5pt; }
        table.tpl td.lbl { font-weight:bold; }
        .title { text-align:center; font-weight:bold; font-size:${pt + 2}.0pt; }
      </style></head><body><div class="WordSection1">${b}</div></body></html>`;
  }

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
    const t = $("topic-select").value;
    return typed || (GENERATORS[t] ? GENERATORS[t].name : "Lesson");
  };

  function readSpec() {
    const topic = $("topic-select").value;
    const typed = $("lesson-title").value.trim();
    return {
      grade: state.grade,
      topic,
      title: typed || (GENERATORS[topic] ? GENERATORS[topic].name : "Lesson"),
      section: $("section-input").value.trim(),
      teacher: $("teacher-input").value.trim(),
      date: $("date-input").value.trim(),
      duration: $("duration-input").value.trim(),
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
    if (state.view === "deck") renderDeck(state.spec, state.model, sheet);
    else renderPlan(state.spec, state.model, sheet);
  }

  function generate() {
    state.topic = $("topic-select").value;
    if (!state.topic) return;
    saveFields(state.topic);                    // keep the teacher's wording for next time
    writeStore(PREF_KEY, {
      teacher: $("teacher-input").value.trim(),
      section: $("section-input").value.trim(),
      duration: $("duration-input").value.trim()
    });
    state.spec = readSpec();
    state.model = buildModel(state.spec);
    render();
  }

  function setView(v) {
    state.view = v;
    $("view-plan").classList.toggle("active", v === "plan");
    $("view-deck").classList.toggle("active", v === "deck");
    if (state.spec) render();
  }

  $("view-plan").addEventListener("click", () => setView("plan"));
  $("view-deck").addEventListener("click", () => setView("deck"));
  $("grade-select").addEventListener("change", (e) => {
    state.grade = +e.target.value;
    buildTopicSelect();
    loadFields($("topic-select").value, currentTitle());
  });
  $("topic-select").addEventListener("change", (e) => {
    state.topic = e.target.value;
    loadFields(state.topic, currentTitle());
  });
  $("fields-dept").addEventListener("click", () => {
    const topic = $("topic-select").value;
    const dept = deptFields(topic, currentTitle());
    $("objectives").value = dept.objectives.join("\n");
    $("criteria").value = dept.criteria.join("\n");
    // Forget this teacher's override so the department wording stays next time.
    const all = readStore(FIELD_KEY);
    delete all[topic];
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
      const name = GENERATORS[t] ? GENERATORS[t].name : t;
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
    saveBlob(new Blob(["﻿", wordDoc(state.spec, state.model)], { type: "application/msword" }),
      `AlIPS_Grade${state.spec.grade}_LessonPlan_${state.spec.seed}.doc`);
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
  buildGradeSelect();
  if (params.get("topic") && GENERATORS[params.get("topic")]) state.topic = params.get("topic");
  buildTopicSelect();
  const prefs = readStore(PREF_KEY);
  if (prefs.teacher) $("teacher-input").value = prefs.teacher;
  if (prefs.section) $("section-input").value = prefs.section;
  if (prefs.duration) $("duration-input").value = prefs.duration;
  loadFields($("topic-select").value, currentTitle());
  $("seed").value = params.get("seed") || Math.floor(Math.random() * 899999) + 100000;
  if (params.get("view") === "deck") setView("deck");
  if (params.get("auto")) generate(); else render();
})();
