// AlIPS — the Grade 1 to 4 simulators.
//
// The senior simulators in sims.js are driven by sliders, which suits a class
// that can already read a scale. Younger children need to pick a thing up and
// put it somewhere, so everything here is built from objects a child moves:
// counters into ten frames, coins into a purse, biscuits onto plates.
//
// Every simulator has the same three modes:
//   Explore  — nothing to get right; move things and watch the number change.
//   Play     — a question, a star for each one right, and a streak to beat.
//   Guided   — one instruction at a time, for a whole-class routine at the board.
//
// Two ways to move a token, because an interactive whiteboard is not a mouse:
// drag it, or tap the token and then tap where it should go.
//
// Sound is a short tone made by the browser itself — no files, nothing to load,
// and a mute button that is remembered on the machine. Everything obeys
// prefers-reduced-motion.

const KIDS = (function () {
  "use strict";

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const clear = (n) => { while (n && n.firstChild) n.removeChild(n.firstChild); };
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  // ---------- sound ----------
  // A few short tones, made on the spot. The context is only built inside a
  // click, which is what browsers require, so nothing ever plays unasked.
  const MUTE_KEY = "alips-sim-muted";
  let ctx = null;
  const isMuted = () => {
    try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; }
  };
  const setMuted = (on) => {
    try { localStorage.setItem(MUTE_KEY, on ? "1" : "0"); } catch { /* private mode */ }
  };
  function tone(freq, dur, delay, type) {
    if (isMuted()) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      const t0 = ctx.currentTime + (delay || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch { /* no audio on this machine — the simulator still works */ }
  }
  const SOUND = {
    tap: () => tone(520, 0.07),
    place: () => tone(660, 0.08),
    win: () => { tone(659, 0.12, 0); tone(784, 0.12, 0.1); tone(1047, 0.22, 0.2); },
    nope: () => tone(200, 0.18, 0, "triangle"),
    cheer: () => { tone(523, 0.1, 0); tone(659, 0.1, 0.09); tone(784, 0.1, 0.18); tone(1047, 0.3, 0.27); }
  };

  // ---------- the frame every junior simulator sits in ----------
  function kidShell(host, options) {
    const cfg = options || {};
    clear(host);
    const wrap = el("div", "kid");

    const bar = el("div", "kid-bar");
    const modes = el("div", "kid-modes");
    const MODES = cfg.modes || ["explore", "play", "guided"];
    const LABEL = { explore: "Explore", play: "Play", guided: "Step by step" };
    const btns = {};
    MODES.forEach((m) => {
      const b = el("button", "kid-mode", LABEL[m]);
      b.type = "button";
      b.dataset.mode = m;
      modes.appendChild(b);
      btns[m] = b;
    });
    bar.appendChild(modes);

    const score = el("div", "kid-score");
    const stars = el("span", "kid-stars", "");
    const streak = el("span", "kid-streak", "");
    score.appendChild(stars);
    score.appendChild(streak);
    bar.appendChild(score);

    // Support / Core / Challenge. The same simulator, harder or easier numbers,
    // so a teacher can put the right question in front of the right child.
    const LEVEL_KEY = "alips-sim-level";
    const levels = el("div", "kid-levels");
    levels.appendChild(el("span", "kid-lev-label", "Level"));
    const levBtns = {};
    [[1, "Support"], [2, "Core"], [3, "Challenge"]].forEach(([n, label]) => {
      const b = el("button", "kid-lev", label);
      b.type = "button";
      levBtns[n] = b;
      levels.appendChild(b);
    });
    bar.appendChild(levels);

    const mute = el("button", "kid-mute", isMuted() ? "🔇 Sound off" : "🔊 Sound on");
    mute.type = "button";
    mute.addEventListener("click", () => {
      setMuted(!isMuted());
      mute.textContent = isMuted() ? "🔇 Sound off" : "🔊 Sound on";
      if (!isMuted()) SOUND.tap();
    });
    bar.appendChild(mute);
    wrap.appendChild(bar);

    const say = el("p", "kid-say");
    wrap.appendChild(say);

    const board = el("div", "kid-board");
    wrap.appendChild(board);

    const actions = el("div", "kid-actions");
    wrap.appendChild(actions);

    const read = el("p", "kid-read");
    wrap.appendChild(read);
    host.appendChild(wrap);

    const simId = activeId;
    let startLevel = 2;
    try { startLevel = +localStorage.getItem("alips-sim-level") || 2; } catch { /* no storage */ }

    const K = {
      board, actions, wrap,
      simId,
      mode: MODES[0],
      level: Math.min(3, Math.max(1, startLevel)),
      stars: 0,
      streak: 0,
      best: 0,
      say(t) { say.textContent = t; },
      tell(t) { read.textContent = t; },
      showScore() {
        stars.textContent = K.stars ? "★".repeat(Math.min(K.stars, 10)) + (K.stars > 10 ? ` ${K.stars}` : "") : "";
        streak.textContent = K.streak > 1 ? `${K.streak} in a row!` : "";
      },
      // The three numbers a simulator needs for Support, Core and Challenge.
      lvl(a, b, c) { return [a, b, c][K.level - 1]; },
      onLevel(fn) { K._levelFn = fn; },
      right(msg) {
        if (K.mode === "play") notify({ sim: simId, level: K.level, correct: true });
        K.stars += 1;
        K.streak += 1;
        K.best = Math.max(K.best, K.streak);
        K.showScore();
        SOUND.win();
        say.textContent = msg || pickOne(["Well done!", "That's it!", "Perfect!", "You got it!"]);
        say.classList.remove("kid-oops");
        say.classList.add("kid-yay");
        setTimeout(() => say.classList.remove("kid-yay"), 700);
      },
      wrong(msg) {
        if (K.mode === "play") notify({ sim: simId, level: K.level, correct: false });
        K.streak = 0;
        K.showScore();
        SOUND.nope();
        say.textContent = msg || "Not yet — have another go.";
        say.classList.remove("kid-yay");
        say.classList.add("kid-oops");
        setTimeout(() => say.classList.remove("kid-oops"), 700);
      },
      button(label, on, cls) {
        const b = el("button", "kid-btn" + (cls ? " " + cls : ""), label);
        b.type = "button";
        b.addEventListener("click", () => { SOUND.tap(); on(); });
        actions.appendChild(b);
        return b;
      },
      onMode(fn) {
        MODES.forEach((m) => btns[m].addEventListener("click", () => {
          K.mode = m;
          MODES.forEach((x) => btns[x].classList.toggle("on", x === m));
          SOUND.tap();
          fn(m);
        }));
        btns[K.mode].classList.add("on");
      }
    };
    const paintLevels = () => {
      [1, 2, 3].forEach((n) => levBtns[n].classList.toggle("on", K.level === n));
    };
    [1, 2, 3].forEach((n) => levBtns[n].addEventListener("click", () => {
      K.level = n;
      try { localStorage.setItem(LEVEL_KEY, String(n)); } catch { /* no storage */ }
      paintLevels();
      SOUND.tap();
      if (K._levelFn) K._levelFn(n);
    }));
    paintLevels();
    K.showScore();
    return K;
  }

  // ---------- moving things about ----------
  // A token can be dragged, or tapped and then dropped by tapping a zone. The
  // second way matters: on an interactive whiteboard a drag often misfires,
  // and a child at the board can point twice.
  function movable(K) {
    let picked = null;
    const clearPick = () => {
      if (picked && picked.node) picked.node.classList.remove("kid-picked");
      picked = null;
    };

    function token(node, data) {
      node.classList.add("kid-token");
      node.addEventListener("pointerdown", (ev) => {
        ev.preventDefault();
        const startX = ev.clientX, startY = ev.clientY;
        let moved = false, ghost = null;
        const move = (e) => {
          if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) > 6) {
            moved = true;
            ghost = node.cloneNode(true);
            ghost.classList.add("kid-ghost");
            document.body.appendChild(ghost);
            node.classList.add("kid-lifted");
          }
          if (ghost) {
            ghost.style.left = e.clientX + "px";
            ghost.style.top = e.clientY + "px";
          }
        };
        const up = (e) => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          node.classList.remove("kid-lifted");
          if (ghost) ghost.remove();
          if (!moved) {                        // a tap: pick it up, or put it down
            if (picked && picked.node === node) { clearPick(); return; }
            clearPick();
            picked = { node, data };
            node.classList.add("kid-picked");
            SOUND.tap();
            return;
          }
          const under = document.elementFromPoint(e.clientX, e.clientY);
          const zone = under && under.closest && under.closest(".kid-zone");
          if (zone && zone.__accept) {
            if (zone.__accept(data, zone) !== false) SOUND.place();
          }
          clearPick();
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      });
      return node;
    }

    function zone(node, accept) {
      node.classList.add("kid-zone");
      node.__accept = accept;
      // A tap on a zone puts down whatever is held. With nothing held it still
      // tells the zone, so somewhere that only ever takes one kind of thing —
      // a ten frame square, a plate — fills on a single tap, while a zone that
      // needs a particular token simply refuses and nothing happens.
      node.addEventListener("click", () => {
        const data = picked ? picked.data : null;
        clearPick();
        if (accept(data, node) !== false) SOUND.place();
      });
      return node;
    }

    return { token, zone, reset: clearPick };
  }

  // A round of Play: the question, and what counts as the answer. Sims hand
  // these to run(), which does the asking, the checking and the star.
  function play(K, cfg) {
    let round = null;
    let locked = false;
    const next = () => {
      locked = false;
      round = cfg.make();
      K.say(round.ask);
      if (cfg.reset) cfg.reset(round);
      cfg.draw();
    };
    const check = (quiet) => {
      if (!round || locked || K.mode !== "play") return;
      const ok = round.ok();
      if (ok) {
        locked = true;
        K.right(round.praise);
        setTimeout(() => { if (K.mode === "play") next(); }, 1400);
      } else if (!quiet) {
        K.wrong(round.hint);
      }
    };
    return { next, check, current: () => round };
  }

  // Step-by-step: one instruction at a time, moving on by itself once the
  // board shows what was asked for.
  function guide(K, steps, draw) {
    let i = 0;
    const show = () => {
      if (i >= steps.length) {
        K.say("That's the whole routine — well done.");
        SOUND.cheer();
        return;
      }
      K.say(steps[i].say);
      if (steps[i].set) steps[i].set();
      draw();
    };
    const check = () => {
      if (K.mode !== "guided" || i >= steps.length) return;
      if (steps[i].done()) {
        i += 1;
        SOUND.win();
        setTimeout(show, 700);
      }
    };
    return { start: () => { i = 0; show(); }, check };
  }

  const defs = {};

  // Which simulator is on screen, and anything that wants to know how a child
  // did. The planner listens here to build the differentiation record; nothing
  // is recorded unless something has subscribed.
  let activeId = null;
  const listeners = [];
  const notify = (payload) => {
    listeners.forEach((fn) => { try { fn(payload); } catch { /* a listener must never break a lesson */ } });
  };

  // ---------- 1. Ten frames ----------
  defs.tenFrame = {
    name: "Ten frames",
    blurb: "Drag counters into the frames — the fastest way to see how a number sits next to ten.",
    mount(host, opts) {
      const o = opts || {};
      const K = kidShell(host);
      const M = movable(K);
      const st = { n: 4, target: null };
      const board = K.board;

      function draw() {
        clear(board);
        const frames = el("div", "kid-frames");
        for (let f = 0; f < 2; f++) {
          const grid = el("div", "kid-frame");
          for (let i = 0; i < 10; i++) {
            const cell = el("div", "kid-cell");
            const idx = f * 10 + i;
            if (idx < st.n) {
              const c = el("div", "kid-counter");
              M.token(c, { from: "frame", idx });
              cell.appendChild(c);
            }
            M.zone(cell, () => {
              st.n = Math.max(st.n, idx + 1);
              after();
              return true;
            });
            grid.appendChild(cell);
          }
          frames.appendChild(grid);
        }
        board.appendChild(frames);

        const tray = el("div", "kid-tray");
        tray.appendChild(el("span", "kid-tray-label", "Counters"));
        for (let i = 0; i < 3; i++) {
          const c = el("div", "kid-counter");
          M.token(c, { from: "tray" });
          tray.appendChild(c);
        }
        const bin = M.zone(el("div", "kid-bin", "Put back"), () => {
          st.n = Math.max(0, st.n - 1);
          after();
          return true;
        });
        tray.appendChild(bin);
        board.appendChild(tray);

        const tenLeft = st.n <= 10 ? 10 - st.n : 20 - st.n;
        K.tell(`${st.n} counters. `
          + (st.n < 10 ? `${tenLeft} more would make ten.`
             : st.n === 10 ? "A full frame — that is ten."
             : st.n < 20 ? `Ten and ${st.n - 10}, which is ${st.n}. ${20 - st.n} more makes twenty.`
             : "Both frames are full: twenty."));
      }

      const P = play(K, {
        draw,
        make: () => {
          const kind = pickOne(["make", "bond", "add"]);
          if (kind === "make") {
            const t = rnd(K.lvl(2, 3, 6), K.lvl(10, 18, 20));
            st.n = 0;
            return { ask: `Put ${plural(t, "counter", "counters")} in the frames.`,
              ok: () => st.n === t, hint: `Count them again — you need ${t}.` };
          }
          if (kind === "bond") {
            const a = rnd(1, K.lvl(5, 9, 9));
            st.n = a;
            return { ask: `There are ${a}. Add counters until you have ten.`,
              ok: () => st.n === 10, hint: `${a} and how many more make ten?` };
          }
          const a = rnd(1, K.lvl(4, 8, 9)), b = rnd(1, K.lvl(3, 8, 9));
          st.n = a;
          return { ask: `There are ${a}. Add ${b} more. How many now?`,
            ok: () => st.n === a + b, hint: `Count on ${b} from ${a}.` };
        }
      });

      const G = guide(K, [
        { say: "Fill the first frame all the way — that is ten.", set: () => { st.n = 0; },
          done: () => st.n === 10 },
        { say: "Now put three more in the second frame.", done: () => st.n === 13 },
        { say: "Ten and three is thirteen. Take two away.", done: () => st.n === 11 }
      ], draw);

      const after = () => { draw(); P.check(true); G.check(); };

      K.button("Check my answer", () => P.check(false));
      K.button("New question", () => P.next());
      K.button("Clear the frames", () => { st.n = 0; draw(); });

      K.onLevel(() => { if (K.mode === "play") P.next(); });
      K.onMode((m) => {
        if (m === "play") P.next();
        else if (m === "guided") G.start();
        else { K.say("Drag counters in, or tap a counter then tap a square."); draw(); }
      });
      K.say("Drag counters in, or tap a counter then tap a square.");
      draw();
    }
  };

  // ---------- 2. Number track ----------
  defs.numberTrack = {
    name: "Number track",
    blurb: "Hop the frog along the track to count on, count back, add and subtract.",
    mount(host, opts) {
      const o = opts || {};
      const max = (opts && opts.max) || 20;
      const K = kidShell(host);
      const M = movable(K);
      const st = { at: 0, from: 0, hops: 0 };

      function draw() {
        clear(K.board);
        const track = el("div", "kid-track");
        for (let n = 0; n <= max; n++) {
          const sq = el("div", "kid-sq");
          sq.appendChild(el("span", "kid-sq-n", String(n)));
          if (n === st.at) {
            const frog = el("div", "kid-frog", "🐸");
            M.token(frog, { from: "track" });
            sq.appendChild(frog);
            sq.classList.add("kid-sq-on");
          }
          if (n === st.from && st.from !== st.at) sq.classList.add("kid-sq-start");
          M.zone(sq, () => { st.at = n; st.hops = n - st.from; after(); return true; });
          track.appendChild(sq);
        }
        K.board.appendChild(track);

        const row = el("div", "kid-hops");
        [-5, -1, 1, 5].forEach((d) => {
          const b = el("button", "kid-hop", d > 0 ? `+${d}` : String(d).replace("-", "−"));
          b.type = "button";
          b.addEventListener("click", () => {
            st.at = clamp(st.at + d, 0, max);
            st.hops = st.at - st.from;
            SOUND.place();
            after();
          });
          row.appendChild(b);
        });
        K.board.appendChild(row);

        K.tell(st.hops === 0
          ? `The frog is on ${st.at}.`
          : `${st.from} ${st.hops > 0 ? "+" : "−"} ${Math.abs(st.hops)} = ${st.at}`
            + `  — ${Math.abs(st.hops)} ${st.hops > 0 ? "hops forward" : "hops back"}.`);
      }

      const P = play(K, {
        draw,
        make: () => {
          const back = K.level > 1 && Math.random() < 0.45;   // Support counts on only
          const a = rnd(back ? 8 : 0, back ? max : max - 8);
          const b = rnd(1, K.lvl(3, 8, 9));
          st.from = a; st.at = a; st.hops = 0;
          const answer = back ? a - b : a + b;
          return {
            ask: back ? `Start on ${a} and hop back ${b}. Where do you land?`
                      : `Start on ${a} and hop on ${b}. Where do you land?`,
            ok: () => st.at === answer,
            hint: back ? `Count back: ${a}, ${a - 1}, ${a - 2} …` : `Count on from ${a}, one square at a time.`
          };
        }
      });

      const G = guide(K, [
        { say: "Put the frog on 7.", set: () => { st.from = 0; st.at = 0; }, done: () => st.at === 7 },
        { say: "Hop on 3. Say each number out loud: eight, nine, ten.", done: () => st.at === 10 },
        { say: "Now hop back 4 and see where you land.", done: () => st.at === 6 }
      ], draw);

      const after = () => { draw(); P.check(true); G.check(); };

      K.button("Check my answer", () => P.check(false));
      K.button("New question", () => P.next());
      K.button("Back to the start", () => { st.at = 0; st.from = 0; st.hops = 0; draw(); });

      K.onLevel(() => { if (K.mode === "play") P.next(); });
      K.onMode((m) => {
        if (m === "play") P.next();
        else if (m === "guided") G.start();
        else { K.say("Drag the frog, or use the hop buttons."); draw(); }
      });
      K.say("Drag the frog, or use the hop buttons.");
      draw();
    }
  };

  // ---------- 3. Tens and ones ----------
  defs.tensOnes = {
    name: "Tens and ones",
    blurb: "Build a number from ten-sticks and single cubes, then swap ten ones for a stick.",
    mount(host, opts) {
      const K = kidShell(host);
      const M = movable(K);
      const st = { tens: 2, ones: 3 };
      const value = () => st.tens * 10 + st.ones;

      function draw() {
        clear(K.board);
        const mat = el("div", "kid-mat");
        const cols = [
          { key: "tens", label: "Tens", cls: "kid-rod" },
          { key: "ones", label: "Ones", cls: "kid-cube" }
        ];
        cols.forEach((c) => {
          const col = el("div", "kid-col");
          col.appendChild(el("h5", "", c.label));
          const drop = el("div", "kid-drop");
          for (let i = 0; i < st[c.key]; i++) {
            const t = el("div", c.cls);
            M.token(t, { take: c.key });
            drop.appendChild(t);
          }
          M.zone(drop, (d) => {
            if (d.take === c.key) { st[c.key] = Math.max(0, st[c.key] - 1); }
            else if (d.give === c.key) { st[c.key] = Math.min(20, st[c.key] + 1); }
            else return false;
            after();
            return true;
          });
          col.appendChild(drop);
          col.appendChild(el("p", "kid-count", String(st[c.key])));
          mat.appendChild(col);
        });
        K.board.appendChild(mat);

        const tray = el("div", "kid-tray");
        tray.appendChild(el("span", "kid-tray-label", "Take one"));
        const rod = el("div", "kid-rod");
        M.token(rod, { give: "tens" });
        tray.appendChild(rod);
        const cube = el("div", "kid-cube");
        M.token(cube, { give: "ones" });
        tray.appendChild(cube);
        const swap = el("button", "kid-btn", "Swap ten ones for a stick");
        swap.type = "button";
        swap.addEventListener("click", () => {
          if (st.ones >= 10) { st.ones -= 10; st.tens += 1; SOUND.place(); }
          else SOUND.nope();
          after();
        });
        tray.appendChild(swap);
        K.board.appendChild(tray);

        K.tell(`${st.tens} ${st.tens === 1 ? "ten" : "tens"} and ${plural(st.ones, "one", "ones")} `
          + `= ${st.tens * 10} + ${st.ones} = ${value()}.`
          + (st.ones >= 10 ? "  Ten ones can be swapped for one stick." : ""));
      }

      const P = play(K, {
        draw,
        make: () => {
          const t = rnd(11, K.lvl(39, 79, 99));
          st.tens = 0; st.ones = 0;
          return { ask: `Build the number ${t}.`, ok: () => value() === t,
            hint: `${Math.floor(t / 10)} sticks and ${t % 10} cubes.` };
        }
      });

      const G = guide(K, [
        { say: "Put three ten-sticks on the mat.", set: () => { st.tens = 0; st.ones = 0; },
          done: () => st.tens === 3 && st.ones === 0 },
        { say: "Now add four single cubes. What number is that?", done: () => st.tens === 3 && st.ones === 4 },
        { say: "Add six more cubes — then swap ten ones for a stick.",
          done: () => st.tens === 4 && st.ones === 0 }
      ], draw);

      const after = () => { draw(); P.check(true); G.check(); };

      K.button("Check my answer", () => P.check(false));
      K.button("New question", () => P.next());
      K.button("Clear the mat", () => { st.tens = 0; st.ones = 0; draw(); });

      K.onLevel(() => { if (K.mode === "play") P.next(); });
      K.onMode((m) => {
        if (m === "play") P.next();
        else if (m === "guided") G.start();
        else { K.say("Drag sticks and cubes onto the mat."); draw(); }
      });
      K.say("Drag sticks and cubes onto the mat.");
      draw();
    }
  };

  // ---------- 4. Building arrays ----------
  defs.arrayBuild = {
    name: "Build an array",
    blurb: "Tap out rows of dots — the same picture answers a times table and a division.",
    mount(host, opts) {
      const K = kidShell(host);
      const st = { r: 3, c: 4 };

      function draw() {
        clear(K.board);
        const grid = el("div", "kid-array");
        for (let i = 0; i < 6; i++) {
          const row = el("div", "kid-arow");
          for (let j = 0; j < 8; j++) {
            const cell = el("div", "kid-adot");
            const on = i < st.r && j < st.c;
            cell.classList.toggle("on", on);
            cell.addEventListener("click", () => {
              st.r = i + 1; st.c = j + 1;
              SOUND.place();
              after();
            });
            row.appendChild(cell);
          }
          grid.appendChild(row);
        }
        K.board.appendChild(grid);
        K.tell(`${st.r} rows of ${st.c} = ${st.r * st.c}   ·   `
          + `${st.c} rows of ${st.r} is the same ${st.r * st.c}   ·   `
          + `${st.r * st.c} shared into ${st.r} rows gives ${st.c}.`);
      }

      const P = play(K, {
        draw,
        make: () => {
          const r = rnd(2, K.lvl(3, 6, 6)), c = rnd(2, K.lvl(5, 8, 8));
          const kind = K.level === 1 ? "make" : pickOne(["make", "answer"]);
          st.r = 1; st.c = 1;
          if (kind === "make") {
            return { ask: `Show ${r} rows of ${c}.`, ok: () => st.r === r && st.c === c,
              hint: "Tap the dot at the corner of the array you want." };
          }
          return { ask: `Build an array that shows ${r * c}. Any rows will do.`,
            ok: () => st.r * st.c === r * c, hint: `Try ${r} rows of ${c}.` };
        }
      });

      const G = guide(K, [
        { say: "Make 2 rows of 5.", set: () => { st.r = 1; st.c = 1; },
          done: () => st.r === 2 && st.c === 5 },
        { say: "That is 10. Now turn it round: 5 rows of 2.", done: () => st.r === 5 && st.c === 2 },
        { say: "Still 10 — multiplication does not mind which way round. Now make 3 rows of 4.",
          done: () => st.r === 3 && st.c === 4 }
      ], draw);

      const after = () => { draw(); P.check(true); G.check(); };

      K.button("Check my answer", () => P.check(false));
      K.button("New question", () => P.next());

      K.onLevel(() => { if (K.mode === "play") P.next(); });
      K.onMode((m) => {
        if (m === "play") P.next();
        else if (m === "guided") G.start();
        else { K.say("Tap a dot to set the size of the array."); draw(); }
      });
      K.say("Tap a dot to set the size of the array.");
      draw();
    }
  };

  // ---------- 5. Sharing out ----------
  defs.shareOut = {
    name: "Share them out",
    blurb: "Drag biscuits onto the plates — fair shares, and whatever is left over.",
    mount(host, opts) {
      const K = kidShell(host);
      const M = movable(K);
      const st = { total: 12, plates: 3, on: [0, 0, 0] };
      const placed = () => st.on.reduce((a, b) => a + b, 0);

      function setPlates(n) {
        st.plates = n;
        st.on = Array.from({ length: n }, (_, i) => st.on[i] || 0);
      }

      function draw() {
        clear(K.board);
        const row = el("div", "kid-plates");
        for (let p = 0; p < st.plates; p++) {
          const plate = el("div", "kid-plate");
          for (let i = 0; i < st.on[p]; i++) plate.appendChild(el("div", "kid-biscuit", "🍪"));
          M.zone(plate, () => {
            if (placed() >= st.total) return false;
            st.on[p] += 1;
            after();
            return true;
          });
          plate.addEventListener("dblclick", () => { st.on[p] = Math.max(0, st.on[p] - 1); after(); });
          const wrapP = el("div", "kid-plate-wrap");
          wrapP.appendChild(plate);
          wrapP.appendChild(el("span", "kid-count", String(st.on[p])));
          row.appendChild(wrapP);
        }
        K.board.appendChild(row);

        const tray = el("div", "kid-tray");
        tray.appendChild(el("span", "kid-tray-label", `Left over: ${st.total - placed()}`));
        for (let i = 0; i < Math.min(st.total - placed(), 12); i++) {
          const b = el("div", "kid-biscuit", "🍪");
          M.token(b, { from: "tray" });
          tray.appendChild(b);
        }
        K.board.appendChild(tray);

        const each = st.on[0];
        const fair = st.on.every((n) => n === each);
        K.tell(`${st.total} biscuits on ${plural(st.plates, "plate", "plates")}. `
          + (fair && placed() === st.total
             ? `${st.total} ÷ ${st.plates} = ${each}`
               + (st.total % st.plates ? "" : " exactly — every plate is the same.")
             : fair
               ? `Each plate has ${each}, and ${st.total - placed()} are still to share.`
               : "The plates are not equal yet — sharing means the same number on each."));
      }

      const P = play(K, {
        draw,
        make: () => {
          const plates = rnd(2, K.lvl(2, 4, 4));
          const each = rnd(2, K.lvl(3, 5, 6));
          const rem = K.level === 3 ? pickOne([0, 1, 2]) : 0;   // leftovers are the hard part
          const total = plates * each + Math.min(rem, plates - 1);
          st.total = total;
          setPlates(plates);
          st.on = Array(plates).fill(0);
          return {
            ask: `Share ${total} biscuits equally onto ${plates} plates.`,
            ok: () => st.on.every((n) => n === st.on[0]) && st.on[0] === Math.floor(total / plates),
            hint: "One for this plate, one for that one — keep going round."
          };
        }
      });

      const G = guide(K, [
        { say: "Give one biscuit to each plate, going round.",
          set: () => { st.total = 12; setPlates(3); st.on = [0, 0, 0]; },
          done: () => st.on.every((n) => n >= 1) },
        { say: "Keep going round until you run out.", done: () => placed() === st.total },
        { say: "Count one plate: that is 12 ÷ 3.", done: () => st.on[0] === 4 }
      ], draw);

      const after = () => { draw(); P.check(true); G.check(); };

      K.button("Check my answer", () => P.check(false));
      K.button("New question", () => P.next());
      K.button("Take them all back", () => { st.on = Array(st.plates).fill(0); draw(); });
      [2, 3, 4].forEach((n) => K.button(`${n} plates`, () => { setPlates(n); st.on = Array(n).fill(0); draw(); }, "kid-small"));

      K.onLevel(() => { if (K.mode === "play") P.next(); });
      K.onMode((m) => {
        if (m === "play") P.next();
        else if (m === "guided") G.start();
        else { K.say("Drag a biscuit onto a plate. Double-tap a plate to take one back."); draw(); }
      });
      K.say("Drag a biscuit onto a plate. Double-tap a plate to take one back.");
      draw();
    }
  };

  // ---------- 6. Fractions of a shape ----------
  defs.fractionShape = {
    name: "Halves and quarters",
    blurb: "Tap the parts to colour them in, and see the fraction being made.",
    mount(host, opts) {
      const K = kidShell(host);
      const st = { parts: 4, on: [], shape: "bar" };
      const reset = (n) => { st.parts = n; st.on = Array(n).fill(false); };
      reset(4);

      function draw() {
        clear(K.board);
        const box = el("div", "kid-frac " + (st.shape === "circle" ? "kid-frac-circle" : ""));
        for (let i = 0; i < st.parts; i++) {
          const p = el("div", "kid-part");
          if (st.shape === "circle") {
            const a0 = i * 360 / st.parts, a1 = (i + 1) * 360 / st.parts;
            p.style.background = st.on[i]
              ? `conic-gradient(from ${a0}deg, var(--primary) 0deg ${a1 - a0}deg, transparent 0)`
              : "transparent";
            p.classList.add("kid-part-slice");
            p.style.setProperty("--a0", a0 + "deg");
          } else {
            p.classList.toggle("on", !!st.on[i]);
            p.style.width = `calc(${100 / st.parts}% - 6px)`;
          }
          p.addEventListener("click", () => { st.on[i] = !st.on[i]; SOUND.place(); after(); });
          box.appendChild(p);
        }
        K.board.appendChild(box);

        const row = el("div", "kid-hops");
        [2, 3, 4, 6, 8].forEach((n) => {
          const b = el("button", "kid-hop" + (n === st.parts ? " on" : ""), `${n} parts`);
          b.type = "button";
          b.addEventListener("click", () => { reset(n); SOUND.tap(); after(); });
          row.appendChild(b);
        });
        K.board.appendChild(row);

        const shaded = st.on.filter(Boolean).length;
        const NAME = { 2: "half", 3: "third", 4: "quarter", 6: "sixth", 8: "eighth" };
        K.tell(`${shaded} out of ${st.parts} parts coloured — that is ${shaded}/${st.parts}`
          + (shaded === 1 ? `, one ${NAME[st.parts]}.` : shaded === st.parts ? ", the whole shape."
             : shaded * 2 === st.parts ? ", which is one half." : ".")
          + "  Every part has to be the same size for it to be a fraction.");
      }

      const P = play(K, {
        draw,
        make: () => {
          const parts = pickOne(K.lvl([2, 4], [2, 3, 4, 6, 8], [3, 4, 6, 8]));
          const want = K.level === 1 ? 1 : rnd(1, parts - 1);
          reset(parts);
          const NAME = { 2: "half", 3: "third", 4: "quarter", 6: "sixth", 8: "eighth" };
          return {
            ask: want === 1 ? `Colour one ${NAME[parts]} of the shape.`
                            : `Colour ${want}/${parts} of the shape.`,
            ok: () => st.parts === parts && st.on.filter(Boolean).length === want,
            hint: `Colour ${plural(want, "part", "parts")} out of ${parts}.`
          };
        }
      });

      const G = guide(K, [
        { say: "Split the shape into 2 and colour one part. That is one half.",
          set: () => reset(4), done: () => st.parts === 2 && st.on.filter(Boolean).length === 1 },
        { say: "Now split it into 4 and colour one part — one quarter.",
          done: () => st.parts === 4 && st.on.filter(Boolean).length === 1 },
        { say: "Colour one more. Two quarters — what else do we call that?",
          done: () => st.parts === 4 && st.on.filter(Boolean).length === 2 }
      ], draw);

      const after = () => { draw(); P.check(true); G.check(); };

      K.button("Check my answer", () => P.check(false));
      K.button("New question", () => P.next());
      K.button("Bar / circle", () => { st.shape = st.shape === "bar" ? "circle" : "bar"; draw(); });
      K.button("Clear the colour", () => { st.on = Array(st.parts).fill(false); draw(); });

      K.onLevel(() => { if (K.mode === "play") P.next(); });
      K.onMode((m) => {
        if (m === "play") P.next();
        else if (m === "guided") G.start();
        else { K.say("Tap a part to colour it in."); draw(); }
      });
      K.say("Tap a part to colour it in.");
      draw();
    }
  };

  // ---------- 7. Coins ----------
  defs.coinPurse = {
    name: "Coins in the purse",
    blurb: "Drag Omani coins into the purse to make an amount — and find more than one way to do it.",
    mount(host, opts) {
      const K = kidShell(host);
      const M = movable(K);
      const COINS = [5, 10, 25, 50, 100];      // baisa
      const st = { inPurse: [] };
      const total = () => st.inPurse.reduce((a, b) => a + b, 0);
      const money = (b) => b >= 1000 ? `${(b / 1000).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")} rial`
        : `${b} baisa`;

      function draw() {
        clear(K.board);
        const tray = el("div", "kid-coins");
        COINS.forEach((v) => {
          const c = el("div", "kid-coin" + (v >= 50 ? " big" : ""), String(v));
          c.appendChild(el("small", "", "baisa"));
          M.token(c, { value: v });
          tray.appendChild(c);
        });
        K.board.appendChild(tray);

        const purse = el("div", "kid-purse");
        purse.appendChild(el("h5", "", "Purse"));
        const inner = el("div", "kid-purse-in");
        st.inPurse.forEach((v, i) => {
          const c = el("div", "kid-coin small" + (v >= 50 ? " big" : ""), String(v));
          c.addEventListener("click", () => { st.inPurse.splice(i, 1); SOUND.tap(); after(); });
          inner.appendChild(c);
        });
        M.zone(purse, (d) => {
          if (!d || !d.value) return false;
          st.inPurse.push(d.value);
          after();
          return true;
        });
        purse.appendChild(inner);
        K.board.appendChild(purse);

        K.tell(`In the purse: ${st.inPurse.length ? st.inPurse.join(" + ") + " = " : ""}`
          + `${money(total())}.`
          + (total() >= 1000 ? "  One thousand baisa is one rial." : "")
          + "  Tap a coin in the purse to take it back out.");
      }

      const P = play(K, {
        draw,
        make: () => {
          const t = pickOne(K.lvl(
            [10, 15, 20, 25, 30, 35, 50],
            [15, 20, 30, 35, 45, 55, 60, 75, 80, 95, 110, 125, 150, 175, 200],
            [65, 85, 95, 115, 135, 155, 185, 215, 240, 285, 305]));
          st.inPurse = [];
          return { ask: `Make ${t} baisa.`, ok: () => total() === t,
            hint: "Start with the biggest coin that still fits." };
        }
      });

      const G = guide(K, [
        { say: "Put one 50 baisa coin in the purse.", set: () => { st.inPurse = []; },
          done: () => total() === 50 },
        { say: "Add a 25. How much is that now?", done: () => total() === 75 },
        { say: "Add coins to reach 100 baisa exactly.", done: () => total() === 100 }
      ], draw);

      const after = () => { draw(); P.check(true); G.check(); };

      K.button("Check my answer", () => P.check(false));
      K.button("New question", () => P.next());
      K.button("Empty the purse", () => { st.inPurse = []; draw(); });

      K.onLevel(() => { if (K.mode === "play") P.next(); });
      K.onMode((m) => {
        if (m === "play") P.next();
        else if (m === "guided") G.start();
        else { K.say("Drag coins into the purse, or tap a coin then tap the purse."); draw(); }
      });
      K.say("Drag coins into the purse, or tap a coin then tap the purse.");
      draw();
    }
  };

  // ---------- 8. Clock hands ----------
  defs.clockKids = {
    name: "Move the clock hands",
    blurb: "Drag the hands round the clock to show o'clock, half past and quarter past.",
    mount(host, opts) {
      const K = kidShell(host);
      const st = { h: 3, m: 0, hand: "long" };
      const NAMES = ["twelve", "one", "two", "three", "four", "five", "six", "seven",
        "eight", "nine", "ten", "eleven"];
      const words = () => {
        const now = NAMES[st.h % 12], nx = NAMES[(st.h + 1) % 12];
        if (st.m === 0) return `${now} o'clock`;
        if (st.m === 15) return `quarter past ${now}`;
        if (st.m === 30) return `half past ${now}`;
        if (st.m === 45) return `quarter to ${nx}`;
        return st.m < 30 ? `${st.m} minutes past ${now}` : `${60 - st.m} minutes to ${nx}`;
      };
      const two = (n) => String(n).padStart(2, "0");

      function draw() {
        clear(K.board);
        const NS = "http://www.w3.org/2000/svg";
        const s = document.createElementNS(NS, "svg");
        s.setAttribute("viewBox", "0 0 300 300");
        s.setAttribute("class", "kid-clock");
        const mk = (tag, attrs) => {
          const n = document.createElementNS(NS, tag);
          Object.keys(attrs).forEach((k) => n.setAttribute(k, attrs[k]));
          return n;
        };
        s.appendChild(mk("circle", { cx: 150, cy: 150, r: 140, class: "kid-face" }));
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * 2 * Math.PI - Math.PI / 2;
          const t = mk("text", { x: 150 + Math.cos(a) * 115, y: 150 + Math.sin(a) * 115 + 9,
            "text-anchor": "middle", class: "kid-clock-n" });
          t.textContent = String(i === 0 ? 12 : i);
          s.appendChild(t);
        }
        const ha = ((st.h % 12) / 12 + st.m / 720) * 2 * Math.PI - Math.PI / 2;
        const ma = (st.m / 60) * 2 * Math.PI - Math.PI / 2;
        s.appendChild(mk("line", { x1: 150, y1: 150, x2: 150 + Math.cos(ha) * 70,
          y2: 150 + Math.sin(ha) * 70, class: "kid-hand-h" }));
        s.appendChild(mk("line", { x1: 150, y1: 150, x2: 150 + Math.cos(ma) * 108,
          y2: 150 + Math.sin(ma) * 108, class: "kid-hand-m" }));
        s.appendChild(mk("circle", { cx: 150, cy: 150, r: 9, class: "kid-pin" }));

        const setFrom = (ev) => {
          const r = s.getBoundingClientRect();
          const x = (ev.clientX - r.left) / r.width * 300 - 150;
          const y = (ev.clientY - r.top) / r.height * 300 - 150;
          let deg = Math.atan2(y, x) * 180 / Math.PI + 90;
          if (deg < 0) deg += 360;
          if (st.hand === "long") st.m = (Math.round(deg / 30) * 5) % 60;
          else st.h = Math.round(deg / 30) % 12;
          SOUND.tap();
          after();
        };
        s.addEventListener("pointerdown", (ev) => {
          ev.preventDefault();
          setFrom(ev);
          const move = (e) => setFrom(e);
          const up = () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
          };
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", up);
        });
        K.board.appendChild(s);

        const side = el("div", "kid-clock-side");
        const which = el("div", "kid-hops");
        [["long", "Move the long hand"], ["short", "Move the short hand"]].forEach(([k, label]) => {
          const b = el("button", "kid-hop" + (st.hand === k ? " on" : ""), label);
          b.type = "button";
          b.addEventListener("click", () => { st.hand = k; SOUND.tap(); draw(); });
          which.appendChild(b);
        });
        side.appendChild(which);
        side.appendChild(el("p", "kid-digital", `${two(st.h === 0 ? 12 : st.h)}:${two(st.m)}`));
        side.appendChild(el("p", "kid-words", words()));
        K.board.appendChild(side);

        K.tell(`The short hand tells the hour, the long hand the minutes. `
          + `Right now it says ${words()}.`);
      }

      const P = play(K, {
        draw,
        make: () => {
          const h = rnd(1, 12);
          const m = pickOne(K.lvl([0, 0, 30], [0, 0, 15, 30, 30, 45], [0, 15, 30, 45, 45, 15]));
          st.h = (h + 5) % 12; st.m = (m + 20) % 60;
          const say = m === 0 ? `${NAMES[h % 12]} o'clock` : m === 15 ? `quarter past ${NAMES[h % 12]}`
            : m === 30 ? `half past ${NAMES[h % 12]}` : `quarter to ${NAMES[(h + 1) % 12]}`;
          const wantH = m === 45 ? h % 12 : h % 12;
          return { ask: `Show ${say} on the clock.`,
            ok: () => st.m === m && st.h % 12 === wantH,
            hint: m === 30 ? "Half past — the long hand points straight down at 6."
              : m === 15 ? "Quarter past — the long hand points right, at 3."
              : m === 45 ? "Quarter to — the long hand points left, at 9."
              : "O'clock — the long hand points straight up at 12." };
        }
      });

      const G = guide(K, [
        { say: "Put the long hand on 12 and the short hand on 9 — nine o'clock.",
          set: () => { st.h = 3; st.m = 25; }, done: () => st.m === 0 && st.h % 12 === 9 },
        { say: "Move the long hand halfway round, to 6. Now it is half past nine.",
          done: () => st.m === 30 },
        { say: "Move the long hand to 9 — quarter to ten.", done: () => st.m === 45 }
      ], draw);

      const after = () => { draw(); P.check(true); G.check(); };

      K.button("Check my answer", () => P.check(false));
      K.button("New question", () => P.next());

      K.onLevel(() => { if (K.mode === "play") P.next(); });
      K.onMode((m) => {
        if (m === "play") P.next();
        else if (m === "guided") G.start();
        else { K.say("Choose a hand, then drag it round the clock."); draw(); }
      });
      K.say("Choose a hand, then drag it round the clock.");
      draw();
    }
  };

  // ---------- 9. Sorting shapes ----------
  defs.shapeSort = {
    name: "Sort the shapes",
    blurb: "Drop each shape in the right hoop — by its sides, its corners or its curves.",
    mount(host, opts) {
      const K = kidShell(host);
      const M = movable(K);
      const SHAPES = [
        { id: "circle", name: "circle", sides: 0, curved: true, glyph: "●" },
        { id: "triangle", name: "triangle", sides: 3, curved: false, glyph: "▲" },
        { id: "square", name: "square", sides: 4, curved: false, glyph: "■" },
        { id: "rect", name: "rectangle", sides: 4, curved: false, glyph: "▬" },
        { id: "pent", name: "pentagon", sides: 5, curved: false, glyph: "⬟" },
        { id: "hex", name: "hexagon", sides: 6, curved: false, glyph: "⬢" },
        { id: "oval", name: "oval", sides: 0, curved: true, glyph: "⬭" },
        { id: "star", name: "star", sides: 10, curved: false, glyph: "★" }
      ];
      const RULES = [
        { key: "four", label: "4 sides", test: (s) => s.sides === 4 },
        { key: "curved", label: "curved", test: (s) => s.curved },
        { key: "3or5", label: "3 or 5 sides", test: (s) => s.sides === 3 || s.sides === 5 },
        { key: "many", label: "more than 4 sides", test: (s) => s.sides > 4 }
      ];
      const st = { rule: RULES[0], hoops: { yes: [], no: [] } };

      function draw() {
        clear(K.board);
        const tray = el("div", "kid-tray");
        tray.appendChild(el("span", "kid-tray-label", "Shapes"));
        SHAPES.forEach((s) => {
          if (st.hoops.yes.indexOf(s.id) >= 0 || st.hoops.no.indexOf(s.id) >= 0) return;
          const n = el("div", "kid-shape", s.glyph);
          n.appendChild(el("small", "", s.name));
          M.token(n, { id: s.id });
          tray.appendChild(n);
        });
        K.board.appendChild(tray);

        const hoops = el("div", "kid-hoops");
        [["yes", st.rule.label], ["no", "not " + st.rule.label]].forEach(([key, label]) => {
          const hoop = el("div", "kid-hoop");
          hoop.appendChild(el("h5", "", label));
          const inner = el("div", "kid-hoop-in");
          st.hoops[key].forEach((id, i) => {
            const s = SHAPES.find((x) => x.id === id);
            const n = el("div", "kid-shape small", s.glyph);
            n.addEventListener("click", () => { st.hoops[key].splice(i, 1); SOUND.tap(); after(); });
            inner.appendChild(n);
          });
          hoop.appendChild(inner);
          M.zone(hoop, (d) => {
            if (!d || !d.id) return false;
            st.hoops[key].push(d.id);
            after();
            return true;
          });
          hoops.appendChild(hoop);
        });
        K.board.appendChild(hoops);

        const wrongOnes = st.hoops.yes.filter((id) => !st.rule.test(SHAPES.find((s) => s.id === id)))
          .concat(st.hoops.no.filter((id) => st.rule.test(SHAPES.find((s) => s.id === id))));
        K.tell(`Sorting by: ${st.rule.label}.  `
          + `${st.hoops.yes.length + st.hoops.no.length} of ${SHAPES.length} shapes sorted.`
          + (wrongOnes.length ? "  One or more is in the wrong hoop — count its sides again."
             : "  Tap a shape in a hoop to take it back out."));
      }

      const allRight = () => st.hoops.yes.length + st.hoops.no.length === SHAPES.length
        && st.hoops.yes.every((id) => st.rule.test(SHAPES.find((s) => s.id === id)))
        && st.hoops.no.every((id) => !st.rule.test(SHAPES.find((s) => s.id === id)));

      const P = play(K, {
        draw,
        make: () => {
          st.rule = pickOne(K.level === 1 ? RULES.slice(0, 2) : RULES);
          st.hoops = { yes: [], no: [] };
          return { ask: `Sort every shape: ${st.rule.label} on the left, the rest on the right.`,
            ok: allRight, hint: "Count the straight sides of the shape you are holding." };
        }
      });

      const G = guide(K, [
        { say: "Put the square in the '4 sides' hoop.",
          set: () => { st.rule = RULES[0]; st.hoops = { yes: [], no: [] }; },
          done: () => st.hoops.yes.indexOf("square") >= 0 },
        { say: "The rectangle has 4 sides too — same hoop.",
          done: () => st.hoops.yes.indexOf("rect") >= 0 },
        { say: "Now the triangle. Count its sides: does it belong there?",
          done: () => st.hoops.no.indexOf("triangle") >= 0 }
      ], draw);

      const after = () => { draw(); P.check(true); G.check(); };

      K.button("Check my answer", () => P.check(false));
      K.button("New question", () => P.next());
      K.button("Empty the hoops", () => { st.hoops = { yes: [], no: [] }; draw(); });

      K.onLevel(() => { if (K.mode === "play") P.next(); });
      K.onMode((m) => {
        if (m === "play") P.next();
        else if (m === "guided") G.start();
        else { K.say("Drag each shape into a hoop."); draw(); }
      });
      K.say("Drag each shape into a hoop.");
      draw();
    }
  };

  // ---------- 10. Measuring with cubes ----------
  defs.measureUp = {
    name: "How long is it?",
    blurb: "Lay cubes end to end along the ribbon — no gaps — and count how many it takes.",
    mount(host, opts) {
      const K = kidShell(host);
      const M = movable(K);
      const st = { len: 7, laid: 0, other: 4, compare: false };

      function draw() {
        clear(K.board);
        const strip = el("div", "kid-strip");
        const ribbon = el("div", "kid-ribbon");
        ribbon.style.width = (st.len * 46) + "px";
        strip.appendChild(ribbon);
        const lay = el("div", "kid-lay");
        for (let i = 0; i < st.laid; i++) lay.appendChild(el("div", "kid-mcube"));
        M.zone(lay, () => { st.laid = Math.min(st.laid + 1, 12); after(); return true; });
        strip.appendChild(lay);
        K.board.appendChild(strip);

        if (st.compare) {
          const s2 = el("div", "kid-strip");
          const r2 = el("div", "kid-ribbon kid-ribbon-b");
          r2.style.width = (st.other * 46) + "px";
          s2.appendChild(r2);
          K.board.appendChild(s2);
        }

        const tray = el("div", "kid-tray");
        tray.appendChild(el("span", "kid-tray-label", "Cubes"));
        for (let i = 0; i < 3; i++) {
          const c = el("div", "kid-mcube");
          M.token(c, { cube: true });
          tray.appendChild(c);
        }
        const back = M.zone(el("div", "kid-bin", "Take one off"), () => {
          st.laid = Math.max(0, st.laid - 1); after(); return true;
        });
        tray.appendChild(back);
        K.board.appendChild(tray);

        K.tell(st.laid === 0 ? "Lay cubes along the ribbon, starting right at the end."
          : `${plural(st.laid, "cube", "cubes")} laid`
            + (st.laid === st.len ? ` — the ribbon is exactly ${st.len} cubes long.`
               : st.laid < st.len ? " — keep going, there is still ribbon showing."
               : " — that is more than the ribbon; take some off.")
            + (st.compare ? `  The second ribbon is ${st.other} cubes: the first is `
              + `${st.len > st.other ? "longer" : st.len < st.other ? "shorter" : "the same"}.` : ""));
      }

      const P = play(K, {
        draw,
        make: () => {
          st.len = rnd(2, K.lvl(6, 10, 12));
          st.laid = 0;
          st.compare = false;
          return { ask: "How long is the ribbon? Lay cubes along it to find out.",
            ok: () => st.laid === st.len, hint: "No gaps, and start right at the end." };
        }
      });

      const G = guide(K, [
        { say: "Put one cube at the very start of the ribbon.",
          set: () => { st.len = 6; st.laid = 0; st.compare = false; }, done: () => st.laid === 1 },
        { say: "Add cubes, touching, until you reach the end.", done: () => st.laid === st.len },
        { say: "Count them out loud — that is how long the ribbon is.", done: () => st.laid === st.len }
      ], draw);

      const after = () => { draw(); P.check(true); G.check(); };

      K.button("Check my answer", () => P.check(false));
      K.button("New question", () => P.next());
      K.button("Compare two ribbons", () => {
        st.compare = !st.compare;
        st.other = rnd(2, 10);
        draw();
      });

      K.onLevel(() => { if (K.mode === "play") P.next(); });
      K.onMode((m) => {
        if (m === "play") P.next();
        else if (m === "guided") G.start();
        else { K.say("Drag cubes onto the ribbon."); draw(); }
      });
      K.say("Drag cubes onto the ribbon.");
      draw();
    }
  };

  // ---------- 11. Pictogram ----------
  defs.pictoKids = {
    name: "Make a pictogram",
    blurb: "Drag a picture onto each row, then read off which has most and which has least.",
    mount(host, opts) {
      const K = kidShell(host);
      const M = movable(K);
      const ROWS = [
        { key: "cat", label: "Cats", glyph: "🐱" },
        { key: "dog", label: "Dogs", glyph: "🐶" },
        { key: "fish", label: "Fish", glyph: "🐟" },
        { key: "bird", label: "Birds", glyph: "🐦" }
      ];
      const st = { n: { cat: 3, dog: 5, fish: 2, bird: 4 } };

      function draw() {
        clear(K.board);
        const chart = el("div", "kid-picto");
        ROWS.forEach((r) => {
          const row = el("div", "kid-prow");
          row.appendChild(el("span", "kid-plabel", r.label));
          const lane = el("div", "kid-plane");
          for (let i = 0; i < st.n[r.key]; i++) {
            const g = el("div", "kid-pic", r.glyph);
            g.addEventListener("click", () => { st.n[r.key] = Math.max(0, st.n[r.key] - 1); SOUND.tap(); after(); });
            lane.appendChild(g);
          }
          M.zone(lane, (d) => {
            if (!d || d.pic !== r.key) return false;
            st.n[r.key] = Math.min(10, st.n[r.key] + 1);
            after();
            return true;
          });
          row.appendChild(lane);
          row.appendChild(el("span", "kid-count", String(st.n[r.key])));
          chart.appendChild(row);
        });
        K.board.appendChild(chart);

        const tray = el("div", "kid-tray");
        tray.appendChild(el("span", "kid-tray-label", "Pictures"));
        ROWS.forEach((r) => {
          const g = el("div", "kid-pic", r.glyph);
          M.token(g, { pic: r.key });
          tray.appendChild(g);
        });
        K.board.appendChild(tray);

        const vals = ROWS.map((r) => st.n[r.key]);
        const most = ROWS[vals.indexOf(Math.max.apply(null, vals))];
        const least = ROWS[vals.indexOf(Math.min.apply(null, vals))];
        K.tell(`Altogether ${vals.reduce((a, b) => a + b, 0)}. `
          + `Most: ${most.label} with ${Math.max.apply(null, vals)}. `
          + `Fewest: ${least.label} with ${Math.min.apply(null, vals)}. `
          + `${most.label} has ${Math.max.apply(null, vals) - Math.min.apply(null, vals)} more than ${least.label}.`);
      }

      const P = play(K, {
        draw,
        make: () => {
          const r = pickOne(ROWS), n = rnd(2, K.lvl(5, 8, 9));
          const kind = K.level === 1 ? "set" : pickOne(["set", "more"]);
          if (kind === "set") {
            return { ask: `Make the chart show ${n} ${r.label.toLowerCase()}.`,
              ok: () => st.n[r.key] === n, hint: "Drag a picture onto that row, or tap one to take it off." };
          }
          const other = pickOne(ROWS.filter((x) => x.key !== r.key));
          const target = st.n[other.key] + 2;
          return { ask: `Give ${r.label} two more than ${other.label}.`,
            ok: () => st.n[r.key] === st.n[other.key] + 2,
            hint: `${other.label} has ${st.n[other.key]}, so ${r.label} needs ${target}.` };
        }
      });

      const G = guide(K, [
        { say: "Add pictures until Cats shows 5.", set: () => { st.n = { cat: 0, dog: 3, fish: 2, bird: 1 }; },
          done: () => st.n.cat === 5 },
        { say: "Which row has fewest? Give Birds one more than Fish.",
          done: () => st.n.bird === st.n.fish + 1 },
        { say: "Now make Dogs and Cats the same.", done: () => st.n.dog === st.n.cat }
      ], draw);

      const after = () => { draw(); P.check(true); G.check(); };

      K.button("Check my answer", () => P.check(false));
      K.button("New question", () => P.next());
      K.button("Clear the chart", () => { st.n = { cat: 0, dog: 0, fish: 0, bird: 0 }; draw(); });

      K.onLevel(() => { if (K.mode === "play") P.next(); });
      K.onMode((m) => {
        if (m === "play") P.next();
        else if (m === "guided") G.start();
        else { K.say("Drag a picture onto its row. Tap one to take it off."); draw(); }
      });
      K.say("Drag a picture onto its row. Tap one to take it off.");
      draw();
    }
  };

  // ---------- 12. Tracing numbers (jungle) ----------
  //
  // The numeral, dotted, with a green spot to start on and an arrow saying
  // which way to go — the same thing a child meets in a handwriting book, but
  // it can tell them when they have finished it properly.
  //
  // How the marking works: each stroke is sampled into points along the path,
  // and the child's pointer must pass near them IN ORDER. That is what makes
  // it tracing rather than scribbling — going backwards or starting at the
  // wrong end does not fill the numeral in.

  // One entry per digit; two paths where the numeral is written with two
  // strokes. Drawn in a 100 x 140 box, starting where a child is taught to
  // start.
  const DIGIT = {
    "0": ["M 50 14 C 26 14 15 42 15 71 C 15 100 26 127 50 127 C 74 127 85 100 85 71 C 85 42 74 14 50 14"],
    "1": ["M 26 38 L 54 14 L 54 127"],
    "2": ["M 20 42 C 20 22 38 13 55 13 C 76 13 88 31 80 50 C 70 72 42 94 18 127 L 86 127"],
    "3": ["M 22 34 C 32 18 52 11 66 16 C 84 23 85 46 64 58 C 55 63 48 64 48 64 C 66 61 88 74 84 99 C 80 123 50 134 24 117"],
    "4": ["M 64 14 L 15 92 L 88 92", "M 64 14 L 64 127"],
    "5": ["M 76 15 L 33 15 L 27 65 C 45 53 74 57 82 81 C 90 107 66 131 38 126 C 28 124 20 119 15 113"],
    "6": ["M 74 18 C 52 24 26 46 22 83 C 19 111 36 128 54 128 C 72 128 84 112 84 96 C 84 78 68 68 52 70 C 38 72 26 82 22 93"],
    "7": ["M 16 17 L 86 17 L 44 127"],
    "8": ["M 50 68 C 30 60 24 44 30 30 C 36 16 62 10 72 22 C 82 34 76 56 50 68 C 22 80 14 100 22 114 C 30 128 62 132 76 118 C 90 104 78 80 50 68"],
    "9": ["M 78 60 C 70 73 52 78 40 70 C 26 61 24 40 36 26 C 50 10 76 16 80 38 C 84 62 76 100 62 127"]
  };
  const JUNGLE = ["🐒", "🦜", "🐍", "🦋", "🐘", "🐅", "🦧", "🦎"];
  const FRUIT = "🍌";

  defs.traceNumber = {
    name: "Tracing numbers",
    blurb: "Start on the green spot, follow the arrow and trace the number — then count the bananas.",
    mount(host, opts) {
      const o = opts || {};
      const K = kidShell(host);
      K.wrap.classList.add("kid-jungle");
      const st = { value: 1, done: false, animal: JUNGLE[0] };
      const panels = [];

      const tol = () => K.lvl(26, 19, 15);
      const maxNumber = () => K.lvl(5, 10, 20);

      // One numeral: the dotted guide, the child's ink, and the marking.
      function digitPanel(ch) {
        const NS = "http://www.w3.org/2000/svg";
        const mk = (tag, attrs) => {
          const n = document.createElementNS(NS, tag);
          Object.keys(attrs || {}).forEach((k) => n.setAttribute(k, attrs[k]));
          return n;
        };
        const wrap = el("div", "kt-panel");
        const s = mk("svg", { viewBox: "0 0 100 140", class: "kt-svg" });
        wrap.appendChild(s);

        const strokes = (DIGIT[ch] || DIGIT["0"]).map((d, i) => {
          // Three layers: the pale road a child stays inside, a dashed line
          // down the middle of it, and their own ink revealed on top.
          const guide = mk("path", { d, class: "kt-road" });
          s.appendChild(guide);
          s.appendChild(mk("path", { d, class: "kt-dash" }));
          const ink = mk("path", { d, class: "kt-ink" });
          s.appendChild(ink);
          const len = guide.getTotalLength ? guide.getTotalLength() : 0;
          const n = Math.max(20, Math.round(len / 5));
          const pts = [];
          for (let k = 0; k <= n; k++) {
            const pt = guide.getPointAtLength ? guide.getPointAtLength(len * k / n) : { x: 0, y: 0 };
            pts.push({ x: pt.x, y: pt.y });
          }
          // The ink is revealed by shortening the dash gap as the child gets on.
          ink.style.strokeDasharray = len;
          ink.style.strokeDashoffset = len;
          return { guide, ink, pts, len, at: 0, i };
        });

        // Start spot and direction arrow for each stroke.
        strokes.forEach((str, i) => {
          const p0 = str.pts[0], p1 = str.pts[Math.min(3, str.pts.length - 1)];
          const dx = p1.x - p0.x, dy = p1.y - p0.y;
          const L = Math.hypot(dx, dy) || 1;
          const ang = Math.atan2(dy, dx) * 180 / Math.PI;
          // The 4 and the 5 start their second stroke where the first one began,
          // so the markers step sideways rather than sitting on top of each other.
          const off = i * 15;
          const cx = p0.x + (-dy / L) * off, cy = p0.y + (dx / L) * off;
          if (off) s.appendChild(mk("line", { x1: cx, y1: cy, x2: p0.x, y2: p0.y, class: "kt-lead" }));
          s.appendChild(mk("circle", { cx, cy, r: 8, class: "kt-start s" + i }));
          s.appendChild(mk("polygon", { points: "0,-5 13,0 0,5", class: "kt-arrow",
            transform: `translate(${p0.x} ${p0.y}) rotate(${ang}) translate(13 0)` }));
          const badge = mk("text", { x: cx, y: cy + 3.5, class: "kt-badge", "text-anchor": "middle" });
          badge.textContent = String(i + 1);
          s.appendChild(badge);
        });

        const api = {
          node: wrap, ch, strokes, current: 0,
          progress() {
            const total = strokes.reduce((a, b) => a + b.pts.length, 0);
            const got = strokes.reduce((a, b) => a + b.at, 0);
            return total ? got / total : 0;
          },
          finished() { return strokes.every((str) => str.at >= str.pts.length - 2); },
          reset() {
            strokes.forEach((str) => {
              str.at = 0;
              str.ink.style.strokeDashoffset = str.len;
            });
            api.current = 0;
            wrap.classList.remove("kt-done");
          }
        };

        const local = (ev) => {
          const r = s.getBoundingClientRect();
          return { x: (ev.clientX - r.left) / r.width * 100, y: (ev.clientY - r.top) / r.height * 140 };
        };
        const advance = (pos) => {
          const str = strokes[api.current];
          if (!str) return;
          // Look a little way ahead, so a quick hand is not punished, but never
          // backwards — the order is the point.
          for (let k = str.at; k < Math.min(str.at + 6, str.pts.length); k++) {
            const p = str.pts[k];
            if (Math.hypot(p.x - pos.x, p.y - pos.y) <= tol()) {
              str.at = k + 1;
              str.ink.style.strokeDashoffset = str.len * (1 - str.at / str.pts.length);
            }
          }
          if (str.at >= str.pts.length - 2 && api.current < strokes.length - 1) {
            api.current += 1;                       // on to the second stroke
            SOUND.place();
          }
          if (api.onMove) api.onMove();
        };

        s.addEventListener("pointerdown", (ev) => {
          ev.preventDefault();
          s.setPointerCapture(ev.pointerId);
          advance(local(ev));
          const move = (e) => advance(local(e));
          const up = () => {
            s.removeEventListener("pointermove", move);
            s.removeEventListener("pointerup", up);
            if (api.onRelease) api.onRelease();
          };
          s.addEventListener("pointermove", move);
          s.addEventListener("pointerup", up);
        });
        // A keyboard and a whiteboard pen are not the same thing: tapping the
        // numeral once walks it along, so the simulator still works on a board
        // where dragging is unreliable.
        s.addEventListener("click", () => {
          const str = strokes[api.current];
          if (!str) return;
          str.at = Math.min(str.pts.length, str.at + Math.ceil(str.pts.length / 6));
          str.ink.style.strokeDashoffset = str.len * (1 - str.at / str.pts.length);
          if (str.at >= str.pts.length - 2 && api.current < strokes.length - 1) api.current += 1;
          if (api.onMove) api.onMove();
          if (api.onRelease) api.onRelease();
        });
        return api;
      }

      function draw() {
        clear(K.board);
        panels.length = 0;
        const scene = el("div", "kt-scene");
        const vine = el("div", "kt-vine");
        ["🌿", "🍃", "🌴", "🌺", "🍃", "🌴", "🌿"].forEach((g) => vine.appendChild(el("span", "", g)));
        scene.appendChild(vine);

        const row = el("div", "kt-row");
        row.appendChild(el("span", "kt-mate left", st.animal));
        String(st.value).split("").forEach((ch) => {
          const panel = digitPanel(ch);
          panel.onMove = () => { if (K.mode !== "guided") check(); };
          panel.onRelease = () => check();
          panels.push(panel);
          row.appendChild(panel.node);
        });
        row.appendChild(el("span", "kt-mate right", "🦜"));
        scene.appendChild(row);

        // The numeral means something: this many animals came to look.
        const count = el("div", "kt-count");
        for (let i = 0; i < Math.min(st.value, 20); i++) {
          const b = el("span", "kt-fruit", i % 4 === 3 ? st.animal : FRUIT);
          b.style.animationDelay = (i * 0.05) + "s";
          count.appendChild(b);
        }
        scene.appendChild(count);
        K.board.appendChild(scene);
        tell();
      }

      function tell() {
        const pct = Math.round(panels.reduce((a, p) => a + p.progress(), 0) / Math.max(panels.length, 1) * 100);
        K.tell(`Number ${st.value} — ${pct}% traced. `
          + (st.value === 1 ? "One banana for one monkey."
             : `Count them: ${st.value} things altogether.`)
          + "  Start on the green spot and follow the arrow.");
      }

      function allDone() { return panels.length && panels.every((p) => p.finished()); }

      function check() {
        tell();
        if (!allDone() || st.done) return;
        st.done = true;
        panels.forEach((p) => p.node.classList.add("kt-done"));
        if (K.mode === "play") {
          K.right(`Beautiful ${st.value}!`);
          setTimeout(() => { if (K.mode === "play") P.next(); }, 1600);
        } else {
          SOUND.cheer();
          K.say(`That's a lovely ${st.value}. Try another one.`);
        }
        G.check();
      }

      const P = play(K, {
        draw,
        make: () => {
          const max = maxNumber();
          const t = rnd(K.level === 3 ? 10 : 0, max);
          st.value = t;
          st.done = false;
          st.animal = pickOne(JUNGLE);
          return {
            ask: `Trace the number ${t}.`,
            ok: () => allDone(),
            hint: "Put your finger on the green spot first, then follow the arrow all the way."
          };
        }
      });

      const G = guide(K, [
        { say: "Put your finger on the green spot at the top.",
          set: () => { st.value = 1; st.done = false; }, done: () => panels.some((p) => p.progress() > 0.1) },
        { say: "Now follow the arrow all the way down to the bottom.",
          done: () => allDone() },
        { say: "Well done. Now count the bananas — that is what the number means.",
          done: () => allDone() }
      ], draw);

      K.button("Try again", () => { panels.forEach((p) => p.reset()); st.done = false; draw(); });
      K.button("Next number", () => {
        const floor = K.level === 3 ? 10 : 0;
        st.value = st.value >= maxNumber() || st.value < floor ? floor : st.value + 1;
        st.done = false;
        st.animal = pickOne(JUNGLE);
        draw();
      });
      K.button("New question", () => P.next());

      K.onLevel(() => {
        if (K.mode === "play") P.next();
        else {
          st.value = clamp(st.value, K.level === 3 ? 10 : 0, maxNumber());
          st.done = false;
          draw();
        }
      });
      K.onMode((m) => {
        st.done = false;
        if (m === "play") P.next();
        else if (m === "guided") G.start();
        else { K.say("Trace with your finger, or tap the number to walk along it."); draw(); }
      });
      K.say("Trace with your finger, or tap the number to walk along it.");
      draw();
    }
  };

  return {
    list: defs,
    has: (id) => Object.prototype.hasOwnProperty.call(defs, id),
    get: (id) => defs[id] || null,
    onAttempt(fn) { if (typeof fn === "function") listeners.push(fn); },
    mount(host, id, opts) {
      const sim = defs[id];
      if (!host || !sim) return false;
      activeId = id;
      try { sim.mount(host, opts || {}); return true; }
      catch (err) {
        clear(host);
        host.appendChild(el("p", "kid-read", "This simulator could not start on this browser."));
        return false;
      }
    }
  };
})();
