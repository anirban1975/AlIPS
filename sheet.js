// AlIPS worksheet & exam generator — page logic.

(function () {
  // Strings specific to this page (UI_STRINGS comes from data.js)
  Object.assign(UI_STRINGS, {
    genSubtitle: { en: "Mathematics Department — Worksheet & Exam Generator", ar: "قسم الرياضيات — مولّد أوراق العمل والاختبارات" },
    backToCurriculum: { en: "← Curriculum", ar: "→ المنهج" },
    mode: { en: "Mode", ar: "الوضع" },
    modeWorksheet: { en: "Worksheet", ar: "ورقة عمل" },
    modeExam: { en: "Term exam", ar: "اختبار فصلي" },
    gradeLabel: { en: "Grade", ar: "الصف" },
    topicsLabel: { en: "Topics", ar: "المواضيع" },
    questionsPerTopic: { en: "Questions per topic", ar: "عدد الأسئلة لكل موضوع" },
    difficultyLabel: { en: "Difficulty", ar: "مستوى الصعوبة" },
    diffEasy: { en: "Easy", ar: "سهل" },
    diffMedium: { en: "Medium", ar: "متوسط" },
    diffHard: { en: "Hard", ar: "صعب" },
    examStructure: { en: "Questions per section", ar: "عدد الأسئلة في كل قسم" },
    sectionA: { en: "Section A (1 mark)", ar: "القسم أ (درجة واحدة)" },
    sectionB: { en: "Section B (2 marks)", ar: "القسم ب (درجتان)" },
    sectionC: { en: "Section C (4 marks)", ar: "القسم ج (4 درجات)" },
    termLabel: { en: "Term", ar: "الفصل الدراسي" },
    term1: { en: "Term 1", ar: "الفصل الدراسي الأول" },
    term2: { en: "Term 2", ar: "الفصل الدراسي الثاني" },
    term3: { en: "Term 3", ar: "الفصل الدراسي الثالث" },
    timeAllowed: { en: "Time allowed (minutes)", ar: "الزمن المسموح (دقائق)" },
    seedLabel: { en: "Paper number (seed)", ar: "رقم الورقة (البذرة)" },
    includeAnswers: { en: "Include answer key", ar: "إرفاق نموذج الإجابة" },
    generateBtn: { en: "Generate", ar: "توليد" },
    printBtn: { en: "Print / Save as PDF", ar: "طباعة / حفظ PDF" },
    worksheetWord: { en: "Mathematics Worksheet", ar: "ورقة عمل في الرياضيات" },
    examWord: { en: "Mathematics — Term Examination", ar: "الرياضيات — اختبار الفصل الدراسي" },
    nameWord: { en: "Name", ar: "الاسم" },
    classWord: { en: "Class", ar: "الشعبة" },
    dateWord: { en: "Date", ar: "التاريخ" },
    totalMarksWord: { en: "Total marks", ar: "مجموع الدرجات" },
    minutesWord: { en: "minutes", ar: "دقيقة" },
    timeWord: { en: "Time allowed", ar: "الزمن المسموح" },
    markWord: { en: "mark", ar: "درجة" },
    marksWord: { en: "marks", ar: "درجات" },
    answerKeyWord: { en: "Answer key (teacher copy)", ar: "نموذج الإجابة (نسخة المعلم)" },
    sectionWordA: { en: "Section A", ar: "القسم أ" },
    sectionWordB: { en: "Section B", ar: "القسم ب" },
    sectionWordC: { en: "Section C", ar: "القسم ج" },
    answerAllNote: { en: "Answer ALL questions. Show your working.", ar: "أجب عن جميع الأسئلة موضحاً خطوات الحل." },
    paperNote: { en: "Paper no.", ar: "رقم الورقة" },
    pickTopicsHint: { en: "Choose a grade and at least one topic, then press Generate.", ar: "اختر الصف وموضوعاً واحداً على الأقل، ثم اضغط توليد." }
  });

  const state = {
    lang: (function () { try { return localStorage.getItem("alips-lang") || "en"; } catch { return "en"; } })(),
    mode: "worksheet",
    grade: 5,
    lastSpec: null
  };

  const t = (o) => (o && o[state.lang]) || (o && o.en) || "";
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  function applyLanguage() {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = t(UI_STRINGS[n.dataset.i18n]); });
    $("lang-toggle").textContent = t(UI_STRINGS.langButton);
  }

  function buildGradeSelect() {
    const sel = $("grade-select");
    sel.innerHTML = "";
    for (let g = 1; g <= 12; g++) {
      const o = el("option", "", `${t(UI_STRINGS.gradePrefix)} ${g}`);
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
      cb.type = "checkbox"; cb.value = id;
      cb.checked = prev.size ? prev.has(id) : idx < 4;
      label.appendChild(cb);
      label.appendChild(el("span", "", t(GENERATORS[id].name)));
      box.appendChild(label);
    });
  }

  function selectedTopics() {
    return [...$("topic-list").querySelectorAll("input:checked")].map((i) => i.value);
  }

  // Generate n questions from topics (round-robin), avoiding duplicates
  function makeQuestions(rng, topics, n, diff) {
    const out = [], seen = new Set();
    let i = 0, guard = 0;
    while (out.length < n && guard < n * 20) {
      guard++;
      const id = topics[i % topics.length]; i++;
      const g = GENERATORS[id];
      const item = g.gen(rng, diff);
      if (seen.has(item.q.en)) continue;
      seen.add(item.q.en);
      out.push({ topic: id, diff, ...item });
    }
    return out;
  }

  function metaRow(extra) {
    const row = el("div", "sheet-meta");
    row.appendChild(el("span", "", t(UI_STRINGS.nameWord) + ": ")).appendChild(el("span", "fill"));
    row.appendChild(el("span", "", t(UI_STRINGS.classWord) + ": ")).appendChild(el("span", "fill"));
    row.appendChild(el("span", "", t(UI_STRINGS.dateWord) + ": ")).appendChild(el("span", "fill"));
    if (extra) row.appendChild(el("span", "", extra));
    return row;
  }

  function questionList(questions, start, marksEach) {
    const ol = el("ol", "questions");
    ol.start = start;
    for (const item of questions) {
      const li = el("li", "work-space-" + item.diff);
      li.textContent = t(item.q);
      if (marksEach) {
        li.appendChild(document.createTextNode("  "));
        li.appendChild(el("span", "marks", `[${marksEach} ${t(marksEach === 1 ? UI_STRINGS.markWord : UI_STRINGS.marksWord)}]`));
      }
      ol.appendChild(li);
    }
    return ol;
  }

  function answerKey(all) {
    const box = el("div", "answer-key");
    box.appendChild(el("h4", "", t(UI_STRINGS.answerKeyWord)));
    const ol = el("ol");
    for (const item of all) {
      const li = el("li", "", t(item.a));
      if (item.sol && item.sol.length > 1) {
        const steps = item.sol.map((s) => `${t(s.t)} [${s.m}]`).join("  →  ");
        li.appendChild(el("div", "ms-steps", steps));
      }
      ol.appendChild(li);
    }
    box.appendChild(ol);
    return box;
  }

  function render() {
    const spec = state.lastSpec;
    const sheet = $("sheet");
    sheet.innerHTML = "";
    if (!spec) { sheet.appendChild(el("p", "placeholder-hint", t(UI_STRINGS.pickTopicsHint))); return; }

    const rng = mulberry32(spec.seed);
    const header = el("div", "sheet-header");
    header.appendChild(el("h2", "", t(UI_STRINGS.schoolName)));
    const all = [];

    if (spec.mode === "worksheet") {
      const topicNames = spec.topics.map((id) => t(GENERATORS[id].name)).join(" • ");
      header.appendChild(el("h3", "", `${t(UI_STRINGS.worksheetWord)} — ${t(UI_STRINGS.gradePrefix)} ${spec.grade}`));
      header.appendChild(el("p", "", topicNames));
      sheet.appendChild(header);
      sheet.appendChild(metaRow());
      const qs = makeQuestions(rng, spec.topics, spec.count * spec.topics.length, spec.diff);
      all.push(...qs);
      sheet.appendChild(questionList(qs, 1, 0));
    } else {
      header.appendChild(el("h3", "", `${t(UI_STRINGS.examWord)} — ${t(UI_STRINGS["term" + spec.term])}`));
      header.appendChild(el("p", "", `${t(UI_STRINGS.gradePrefix)} ${spec.grade}   |   ${t(UI_STRINGS.timeWord)}: ${spec.minutes} ${t(UI_STRINGS.minutesWord)}   |   ${t(UI_STRINGS.totalMarksWord)}: ${spec.counts[0] * 1 + spec.counts[1] * 2 + spec.counts[2] * 4}`));
      sheet.appendChild(header);
      sheet.appendChild(metaRow(`${t(UI_STRINGS.paperNote)}: ${spec.seed}`));
      sheet.appendChild(el("p", "section-note", t(UI_STRINGS.answerAllNote)));

      const sections = [
        [t(UI_STRINGS.sectionWordA), spec.counts[0], 1, 1],
        [t(UI_STRINGS.sectionWordB), spec.counts[1], 2, 2],
        [t(UI_STRINGS.sectionWordC), spec.counts[2], 3, 4]
      ];
      let num = 1;
      for (const [title, count, diff, marks] of sections) {
        if (!count) continue;
        sheet.appendChild(el("h4", "section-title", `${title} — ${count} × ${marks} ${t(marks === 1 ? UI_STRINGS.markWord : UI_STRINGS.marksWord)}`));
        const qs = makeQuestions(rng, spec.topics, count, diff);
        all.push(...qs);
        sheet.appendChild(questionList(qs, num, marks));
        num += qs.length;
      }
    }

    if (spec.answers) sheet.appendChild(answerKey(all));
    sheet.appendChild(el("p", "sheet-footnote", `${t(UI_STRINGS.schoolName)} — ${t(UI_STRINGS.paperNote)} ${spec.seed}`));
  }

  function generate() {
    const topics = selectedTopics();
    if (!topics.length) { state.lastSpec = null; render(); return; }
    state.lastSpec = {
      mode: state.mode,
      grade: state.grade,
      topics,
      seed: +$("seed").value || 1,
      count: Math.max(1, +$("q-count").value || 6),
      diff: +$("difficulty").value,
      counts: [+$("count-a").value || 0, +$("count-b").value || 0, +$("count-c").value || 0],
      term: $("exam-term").value,
      minutes: +$("exam-minutes").value || 60,
      answers: $("show-answers").checked
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

  // ---------- events ----------
  $("lang-toggle").addEventListener("click", () => {
    state.lang = state.lang === "en" ? "ar" : "en";
    try { localStorage.setItem("alips-lang", state.lang); } catch {}
    applyLanguage(); buildGradeSelect(); buildTopicList(); render();
  });
  $("mode-worksheet").addEventListener("click", () => setMode("worksheet"));
  $("mode-exam").addEventListener("click", () => setMode("exam"));
  $("grade-select").addEventListener("change", (e) => { state.grade = +e.target.value; buildTopicList(); });
  $("new-seed").addEventListener("click", () => { $("seed").value = Math.floor(Math.random() * 899999) + 100000; generate(); });
  $("generate").addEventListener("click", generate);
  $("print").addEventListener("click", () => window.print());

  // ---------- init ----------
  const params = new URLSearchParams(location.search);
  if (params.get("lang")) state.lang = params.get("lang");
  if (params.get("grade")) state.grade = +params.get("grade");
  if (params.get("mode") === "exam") setMode("exam");
  $("seed").value = params.get("seed") || Math.floor(Math.random() * 899999) + 100000;
  applyLanguage();
  buildGradeSelect();
  buildTopicList();
  if (params.get("auto")) generate(); else render();
})();
