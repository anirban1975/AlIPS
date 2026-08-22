// AlIPS Math Curriculum Browser — app logic.
// State: view (student/teacher), grade, search query.

(function () {
  const params = new URLSearchParams(location.search);

  const state = {
    view: params.get("view") || safeGet("alips-view") || "student",
    grade: parseInt(params.get("grade"), 10) || 1,
    query: ""
  };

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch { /* private mode */ }
  }

  // ---------- Rendering ----------

  function applyStrings() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = UI_STRINGS[el.dataset.i18n];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = UI_STRINGS[el.dataset.i18nPlaceholder];
    });
  }

  function renderGradeNav() {
    const list = document.getElementById("grade-list");
    list.innerHTML = "";
    CURRICULUM.forEach((grade) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.textContent = grade.id;
      btn.className = grade.id === state.grade ? "active" : "";
      btn.addEventListener("click", () => {
        state.grade = grade.id;
        render();
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function badgeFor(tag) {
    const span = document.createElement("span");
    span.className = "badge badge-" + tag;
    span.textContent =
      tag === "cambridge" ? UI_STRINGS.cambridge :
      tag === "oman" ? UI_STRINGS.oman : UI_STRINGS.bothCurricula;
    return span;
  }

  function topicMatches(topic) {
    if (!state.query) return true;
    return topic.n.toLowerCase().includes(state.query.toLowerCase());
  }

  function renderContent() {
    const grade = CURRICULUM.find((g) => g.id === state.grade) || CURRICULUM[0];

    document.getElementById("grade-title").textContent = UI_STRINGS.gradePrefix + " " + grade.id;
    document.getElementById("grade-stage").textContent = grade.stage;

    const container = document.getElementById("strands");
    container.innerHTML = "";
    let shown = 0;

    grade.strands.forEach((strand) => {
      const topics = strand.topics.filter(topicMatches);
      if (topics.length === 0) return;

      const section = document.createElement("section");
      section.className = "strand";

      const h3 = document.createElement("h3");
      h3.textContent = strand.name;
      section.appendChild(h3);

      const grid = document.createElement("div");
      grid.className = "topics";

      topics.forEach((topic) => {
        shown++;
        const card = document.createElement("article");
        card.className = "topic";

        const head = document.createElement("div");
        head.className = "topic-head";
        const h4 = document.createElement("h4");
        h4.textContent = topic.n;
        head.appendChild(h4);
        head.appendChild(badgeFor(topic.c));
        card.appendChild(head);

        if (topic.s) {
          const p = document.createElement("p");
          p.textContent = topic.s;
          card.appendChild(p);
        }
        if (state.view === "teacher" && topic.t) {
          const note = document.createElement("p");
          note.className = "teacher-note";
          note.textContent = UI_STRINGS.teacherNoteLabel + ": " + topic.t;
          card.appendChild(note);
        }

        grid.appendChild(card);
      });

      section.appendChild(grid);
      container.appendChild(section);
    });

    if (shown === 0) {
      const empty = document.createElement("p");
      empty.className = "no-results";
      empty.textContent = UI_STRINGS.noResults;
      container.appendChild(empty);
    }
  }

  function renderViewToggle() {
    document.getElementById("view-student").classList.toggle("active", state.view === "student");
    document.getElementById("view-teacher").classList.toggle("active", state.view === "teacher");
  }

  function render() {
    applyStrings();
    renderGradeNav();
    renderViewToggle();
    renderContent();
  }

  // ---------- Events ----------

  document.getElementById("view-student").addEventListener("click", () => {
    state.view = "student";
    safeSet("alips-view", state.view);
    render();
  });

  document.getElementById("view-teacher").addEventListener("click", () => {
    state.view = "teacher";
    safeSet("alips-view", state.view);
    render();
  });

  document.getElementById("search").addEventListener("input", (e) => {
    state.query = e.target.value.trim();
    renderContent();
  });

  render();
})();
