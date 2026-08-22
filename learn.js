// AlIPS Practice & Learn — student page logic.

(function () {
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  const state = {
    grade: 5,
    topic: null,
    diff: 1,
    tab: "learn",
    current: null,
    answered: false,
    score: { right: 0, total: 0, streak: 0 },
    rng: mulberry32(Date.now() % 2147483647)
  };

  // Grades 1–4 read at 14 pt, all other grades at 12 pt (department standard).
  const fontFor = (grade) => (grade <= 4 ? "14pt" : "12pt");

  function applyFont() {
    document.documentElement.style.setProperty("--q-size", fontFor(state.grade));
  }

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

  function buildTopicMenu() {
    const box = $("topic-menu");
    box.innerHTML = "";
    const ids = GRADE_GENS[state.grade] || [];
    if (!ids.includes(state.topic)) state.topic = ids[0] || null;
    for (const id of ids) {
      const b = el("button", id === state.topic ? "active" : "", GENERATORS[id].name);
      b.addEventListener("click", () => {
        state.topic = id;
        state.current = null;
        renderAll();
      });
      box.appendChild(b);
    }
  }

  function renderLesson() {
    const id = state.topic;
    const L = LESSONS[id] || {};
    $("topic-title").textContent = id ? GENERATORS[id].name : "";
    $("lesson-concept").textContent = L.concept || "";
    $("lesson-example").textContent = (L.example || []).join("\n");

    const tips = $("lesson-tips");
    tips.innerHTML = "";
    (L.tips || []).forEach((tip) => tips.appendChild(el("li", "", tip)));

    const links = $("research-links");
    links.innerHTML = "";
    researchLinks(id).forEach((lnk) => {
      const a = el("a", "", lnk.label);
      a.href = lnk.url;
      a.target = "_blank";
      a.rel = "noopener";
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
    // Accept both the typographic minus used on papers (−) and a typed hyphen.
    const clean = String(s).trim().replace(/[−–—]/g, "-");
    const m = clean.match(/^(?:x\s*[=<>]\s*)?(-?\d+(?:\.\d+)?)$/);
    return m ? parseFloat(m[1]) : null;
  };
  const isNumeric = (s) => numVal(s) !== null;

  function newQuestion() {
    if (!state.topic) return;
    state.current = GENERATORS[state.topic].gen(state.rng, state.diff);
    state.answered = false;
    $("q-text").textContent = state.current.q;
    $("feedback").className = "feedback hidden";
    $("feedback").textContent = "";
    $("self-mark").classList.add("hidden");
    $("solution-box").classList.add("hidden");
    $("solution-box").open = false;
    const numeric = isNumeric(state.current.a);
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
      const li = el("li", "", step.t);
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
    const expected = numVal(state.current.a);
    const givenVal = numVal(given);
    const right = givenVal !== null && Math.abs(givenVal - expected) < 0.001;
    const fb = $("feedback");
    fb.classList.remove("hidden");
    if (right) {
      fb.className = "feedback good";
      fb.textContent = "Correct! Well done.";
    } else {
      fb.className = "feedback bad";
      fb.textContent = `Not quite. The answer is: ${state.current.a}`;
    }
    $("answer-input").disabled = true;
    recordResult(right);
    fillSolution();
  }

  function reveal() {
    if (state.answered || !state.current) return;
    const fb = $("feedback");
    fb.className = "feedback";
    fb.textContent = `Answer: ${state.current.a}`;
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
    applyFont();
    buildGradeSelect();
    buildTopicMenu();
    renderLesson();
    if (state.tab === "practice") newQuestion();
  }

  // ---------- events ----------
  $("grade-select").addEventListener("change", (e) => {
    state.grade = +e.target.value;
    state.topic = null;
    state.current = null;
    renderAll();
  });
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
  if (params.get("grade")) state.grade = +params.get("grade");
  if (params.get("topic") && GENERATORS[params.get("topic")]) state.topic = params.get("topic");
  if (params.get("seed")) state.rng = mulberry32(+params.get("seed"));
  renderAll();
  if (params.get("tab") === "practice") setTab("practice");
})();
