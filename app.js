// AlIPS Math Curriculum Browser — app logic.
// State: grade, stream (track index), search query.
//
// The browser is a teaching reference: it always shows the department's own
// teaching notes, and it lists every sub-topic of the chosen syllabus in
// syllabus order. There is no student cut of the content and no month filter —
// the department asked for one view of the whole syllabus (v1.6).

(function () {
  const params = new URLSearchParams(location.search);

  const state = {
    grade: parseInt(params.get("grade"), 10) || 1,
    track: 0,
    query: ""
  };

  const gradeData = () => CURRICULUM.find((g) => g.id === state.grade) || CURRICULUM[0];
  const trackData = () => {
    const g = gradeData();
    return g.tracks[Math.min(state.track, g.tracks.length - 1)];
  };

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
        state.track = 0;
        render();
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  // Stream selector — only for grades that run more than one syllabus.
  function renderTrackNav() {
    const bar = document.getElementById("track-bar");
    const tracks = gradeData().tracks;
    bar.innerHTML = "";
    bar.classList.toggle("hidden", tracks.length < 2);
    if (tracks.length < 2) return;
    tracks.forEach((t, i) => {
      const btn = document.createElement("button");
      btn.className = "track-btn" + (i === state.track ? " active" : "");
      btn.textContent = t.label;
      btn.title = t.stage;
      btn.addEventListener("click", () => { state.track = i; render(); });
      bar.appendChild(btn);
    });
  }

  function badgeFor(tag) {
    const span = document.createElement("span");
    span.className = "badge badge-" + tag;
    span.textContent =
      tag === "cambridge" ? UI_STRINGS.cambridge :
      tag === "oman" ? UI_STRINGS.oman :
      tag === "ged" ? UI_STRINGS.ged : UI_STRINGS.bothCurricula;
    return span;
  }

  function topicMatches(topic) {
    if (!state.query) return true;
    const q = state.query.toLowerCase();
    return topic.n.toLowerCase().includes(q) ||
      (topic.s || "").toLowerCase().includes(q);
  }

  function renderContent() {
    const grade = gradeData();
    const track = trackData();

    document.getElementById("grade-title").textContent = UI_STRINGS.gradePrefix + " " + grade.id;
    document.getElementById("grade-stage").textContent = track.stage;
    const bookLine = document.getElementById("grade-book");
    bookLine.textContent = track.book ? "Course book: " + track.book : "";
    bookLine.classList.toggle("hidden", !track.book);

    const container = document.getElementById("strands");
    container.innerHTML = "";
    let shown = 0;

    track.strands.forEach((strand) => {
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
        if (topic.t) {
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

  function render() {
    applyStrings();
    renderGradeNav();
    renderTrackNav();
    renderContent();
  }

  // ---------- Events ----------

  document.getElementById("search").addEventListener("input", (e) => {
    state.query = e.target.value.trim();
    renderContent();
  });

  render();
})();
