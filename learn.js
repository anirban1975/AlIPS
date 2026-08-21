// AlIPS Practice & Learn — student page logic.

(function () {
  Object.assign(UI_STRINGS, {
    learnSubtitle: { en: "Mathematics Department — Practice & Learn", ar: "قسم الرياضيات — تدرّب وتعلّم" },
    backToCurriculum: { en: "← Curriculum", ar: "→ المنهج" },
    gradeLabel: { en: "Grade", ar: "الصف" },
    topicsLabel: { en: "Topics", ar: "المواضيع" },
    scoreTitle: { en: "Session score", ar: "نتيجة الجلسة" },
    scoreCorrect: { en: "Correct", ar: "إجابات صحيحة" },
    scoreTried: { en: "Attempted", ar: "محاولات" },
    scoreStreak: { en: "Streak", ar: "سلسلة متتالية" },
    tabLearn: { en: "📖 Guided learning", ar: "📖 التعلم الموجّه" },
    tabPractice: { en: "✏️ Practice", ar: "✏️ تدرّب" },
    conceptTitle: { en: "The idea", ar: "الفكرة" },
    exampleTitle: { en: "Worked example", ar: "مثال محلول" },
    tipsTitle: { en: "Key points", ar: "نقاط أساسية" },
    researchTitle: { en: "Videos & deeper study", ar: "فيديوهات ودراسة أعمق" },
    researchNote: { en: "These open curated searches on trusted maths sites — pick a video that suits you. Your teacher may pin a specific video here later.",
                    ar: "تفتح هذه الروابط عمليات بحث مختارة في مواقع رياضيات موثوقة — اختر الفيديو المناسب لك. وقد يثبّت معلمك فيديو محدداً هنا لاحقاً." },
    lessonDraftNote: { en: "Draft lesson content — to be reviewed by the Mathematics Department.", ar: "محتوى تعليمي أولي — يُراجع من قِبل قسم الرياضيات." },
    difficultyLabel: { en: "Difficulty:", ar: "مستوى الصعوبة:" },
    diffEasy: { en: "Easy", ar: "سهل" },
    diffMedium: { en: "Medium", ar: "متوسط" },
    diffChallenging: { en: "Challenging", ar: "تحدٍّ" },
    checkBtn: { en: "Check", ar: "تحقق" },
    revealBtn: { en: "Show answer", ar: "أظهر الإجابة" },
    selfMarkPrompt: { en: "Did you get it right?", ar: "هل كانت إجابتك صحيحة؟" },
    selfRight: { en: "✓ Yes", ar: "✓ نعم" },
    selfWrong: { en: "✗ No", ar: "✗ لا" },
    solutionTitle: { en: "Detailed solution (mark scheme)", ar: "الحل التفصيلي (سلّم الدرجات)" },
    nextBtn: { en: "Next question →", ar: "السؤال التالي ←" },
    correctMsg: { en: "Correct! Well done.", ar: "إجابة صحيحة! أحسنت." },
    wrongMsg: { en: "Not quite. The answer is:", ar: "ليست صحيحة تماماً. الإجابة هي:" },
    answerIs: { en: "Answer:", ar: "الإجابة:" }
  });

  const state = {
    lang: (function () { try { return localStorage.getItem("alips-lang") || "en"; } catch { return "en"; } })(),
    grade: 5,
    topic: null,
    diff: 1,
    tab: "learn",
    current: null,
    answered: false,
    score: { right: 0, total: 0, streak: 0 },
    rng: mulberry32(Date.now() % 2147483647)
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

  function buildTopicMenu() {
    const box = $("topic-menu");
    box.innerHTML = "";
    const ids = GRADE_GENS[state.grade] || [];
    if (!ids.includes(state.topic)) state.topic = ids[0] || null;
    for (const id of ids) {
      const b = el("button", id === state.topic ? "active" : "", t(GENERATORS[id].name));
      b.addEventListener("click", () => { state.topic = id; state.current = null; renderAll(); });
      box.appendChild(b);
    }
  }

  function renderLesson() {
    const id = state.topic;
    const L = LESSONS[id] || {};
    $("topic-title").textContent = id ? t(GENERATORS[id].name) : "";
    $("lesson-concept").textContent = t(L.concept);
    $("lesson-example").textContent = (L.example || []).join("\n");
    const tips = $("lesson-tips");
    tips.innerHTML = "";
    (L.tips || []).forEach((tip) => tips.appendChild(el("li", "", t(tip))));
    const links = $("research-links");
    links.innerHTML = "";
    researchLinks(id, state.lang).forEach((lnk) => {
      const a = el("a", "", t(lnk.label));
      a.href = lnk.url; a.target = "_blank"; a.rel = "noopener";
      links.appendChild(a);
    });
    const emb = $("video-embed");
    emb.innerHTML = "";
    if (L.yt) {
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${L.yt}`;
      f.allowFullscreen = true;
      emb.appendChild(f);
    }
  }

  // ---------- practice ----------

  // Answers like "14", "x = 6" or "x < 4" can be typed and checked numerically;
  // anything else (fractions with units, expressions) uses reveal + self-mark.
  const numVal = (s) => {
    const m = String(s).trim().match(/^(?:x\s*[=<>]\s*)?(-?\d+(?:\.\d+)?)$/);
    return m ? parseFloat(m[1]) : null;
  };
  const isNumeric = (s) => numVal(s) !== null;

  function newQuestion() {
    if (!state.topic) return;
    state.current = GENERATORS[state.topic].gen(state.rng, state.diff);
    state.answered = false;
    $("q-text").textContent = t(state.current.q);
    $("feedback").className = "feedback hidden";
    $("feedback").textContent = "";
    $("self-mark").classList.add("hidden");
    $("solution-box").classList.add("hidden");
    $("solution-box").open = false;
    const numeric = isNumeric(state.current.a.en);
    $("answer-numeric").classList.toggle("hidden", !numeric);
    $("answer-reveal").classList.toggle("hidden", numeric);
    $("answer-input").value = "";
    $("answer-input").disabled = false;
    if (numeric) $("answer-input").focus();
  }

  function fillSolution() {
    const ol = $("solution-steps");
    ol.innerHTML = "";
    for (const step of state.current.sol || []) {
      const li = el("li", "", t(step.t));
      li.appendChild(el("span", "mark-code", step.m));
      ol.appendChild(li);
    }
    $("solution-box").classList.remove("hidden");
  }

  function recordResult(right) {
    if (state.answered) return;
    state.answered = true;
    state.score.total++;
    if (right) { state.score.right++; state.score.streak++; }
    else state.score.streak = 0;
    $("score-right").textContent = state.score.right;
    $("score-total").textContent = state.score.total;
    $("score-streak").textContent = state.score.streak;
  }

  function check() {
    if (state.answered || !state.current) return;
    const given = $("answer-input").value.trim();
    if (!given) return;
    const expected = numVal(state.current.a.en);
    const givenVal = numVal(given);
    const right = givenVal !== null && Math.abs(givenVal - expected) < 0.001;
    const fb = $("feedback");
    fb.classList.remove("hidden");
    if (right) {
      fb.className = "feedback good";
      fb.textContent = t(UI_STRINGS.correctMsg);
    } else {
      fb.className = "feedback bad";
      fb.textContent = `${t(UI_STRINGS.wrongMsg)} ${t(state.current.a)}`;
    }
    $("answer-input").disabled = true;
    recordResult(right);
    fillSolution();
  }

  function reveal() {
    if (state.answered || !state.current) return;
    const fb = $("feedback");
    fb.className = "feedback";
    fb.textContent = `${t(UI_STRINGS.answerIs)} ${t(state.current.a)}`;
    $("answer-reveal").classList.add("hidden");
    $("self-mark").classList.remove("hidden");
    fillSolution();
  }

  function setTab(tab) {
    state.tab = tab;
    $("tab-learn").classList.toggle("active", tab === "learn");
    $("tab-practice").classList.toggle("active", tab === "practice");
    $("pane-learn").classList.toggle("hidden", tab !== "learn");
    $("pane-practice").classList.toggle("hidden", tab !== "practice");
    if (tab === "practice" && !state.current) newQuestion();
  }

  function renderAll() {
    applyLanguage();
    buildGradeSelect();
    buildTopicMenu();
    renderLesson();
    if (state.tab === "practice") newQuestion();
  }

  // ---------- events ----------
  $("lang-toggle").addEventListener("click", () => {
    state.lang = state.lang === "en" ? "ar" : "en";
    try { localStorage.setItem("alips-lang", state.lang); } catch {}
    // Re-translate; regenerate the same question is not possible (RNG moved on),
    // so refresh the current question text/solution in the new language directly.
    applyLanguage(); buildGradeSelect(); buildTopicMenu(); renderLesson();
    if (state.current) {
      $("q-text").textContent = t(state.current.q);
      if (!$("solution-box").classList.contains("hidden")) fillSolution();
    }
  });
  $("grade-select").addEventListener("change", (e) => { state.grade = +e.target.value; state.topic = null; state.current = null; renderAll(); });
  $("tab-learn").addEventListener("click", () => setTab("learn"));
  $("tab-practice").addEventListener("click", () => setTab("practice"));
  document.querySelectorAll(".diff-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".diff-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      state.diff = +chip.dataset.diff;
      newQuestion();
    });
  });
  $("check-btn").addEventListener("click", check);
  $("answer-input").addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
  $("reveal-btn").addEventListener("click", reveal);
  $("self-right").addEventListener("click", () => { recordResult(true); $("self-mark").classList.add("hidden"); });
  $("self-wrong").addEventListener("click", () => { recordResult(false); $("self-mark").classList.add("hidden"); });
  $("next-btn").addEventListener("click", newQuestion);

  // ---------- init ----------
  const params = new URLSearchParams(location.search);
  if (params.get("lang")) state.lang = params.get("lang");
  if (params.get("grade")) state.grade = +params.get("grade");
  if (params.get("topic") && GENERATORS[params.get("topic")]) state.topic = params.get("topic");
  if (params.get("seed")) state.rng = mulberry32(+params.get("seed"));
  renderAll();
  if (params.get("tab") === "practice") setTab("practice");
})();
