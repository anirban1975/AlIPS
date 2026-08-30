// AlIPS — interactive simulators for the Lesson Planner.
//
// Each entry is a small, self-contained manipulative a teacher can put on the
// projector: sliders and drag handles on the left, a drawing that responds at
// once, and a line of plain wording underneath saying what the picture shows.
//
// Everything here is built with the browser's own SVG and DOM — no library, no
// internet, no account. A simulator works on a school PC with the network
// down, which is the point: the external sites in the same card are the
// fallback, not the other way round.
//
// To add one: give it a name, a one-line blurb a teacher can read aloud, and a
// mount(host, opts) that fills `host`. Then point a topic at it from the `sim`
// attribute in lessons.js.

const SIMS = (function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const pick = (v, d) => (v === undefined ? d : v);
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const round = (n, dp) => {
    const f = Math.pow(10, dp === undefined ? 2 : dp);
    return Math.round(n * f) / f;
  };
  // Minus sign, not a hyphen — it is read from the back of a classroom.
  const num = (n, dp) => String(round(n, dp)).replace("-", "−");

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const svg = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach((k) => e.setAttribute(k, attrs[k]));
    return e;
  };
  const clear = (n) => { while (n.firstChild) n.removeChild(n.firstChild); };
  const text = (x, y, s, cls, anchor) => {
    const t = svg("text", { x, y, class: cls || "sim-t", "text-anchor": anchor || "middle" });
    t.textContent = s;
    return t;
  };

  // A drawing area that scales to whatever width it is given.
  function frame(box, w, h) {
    clear(box);
    const s = svg("svg", { viewBox: `0 0 ${w} ${h}`, class: "sim-svg",
      preserveAspectRatio: "xMidYMid meet", role: "img" });
    box.appendChild(s);
    return s;
  }

  // ---------- controls ----------

  function slider(host, o) {
    const row = el("div", "sim-ctrl");
    row.appendChild(el("span", "sim-lab", o.label));
    const inp = document.createElement("input");
    inp.type = "range";
    inp.min = o.min; inp.max = o.max; inp.step = pick(o.step, 1); inp.value = o.value;
    inp.className = "sim-range";
    const val = el("span", "sim-val");
    const show = () => { val.textContent = o.fmt ? o.fmt(+inp.value) : num(+inp.value); };
    inp.addEventListener("input", () => { show(); o.on(+inp.value); });
    row.appendChild(inp);
    row.appendChild(val);
    host.appendChild(row);
    show();
    return inp;
  }

  function choice(host, o) {
    const row = el("div", "sim-ctrl");
    row.appendChild(el("span", "sim-lab", o.label));
    const sel = document.createElement("select");
    sel.className = "sim-select";
    o.options.forEach((opt) => {
      const op = document.createElement("option");
      op.value = opt.value; op.textContent = opt.label;
      sel.appendChild(op);
    });
    sel.value = o.value;
    sel.addEventListener("change", () => o.on(sel.value));
    row.appendChild(sel);
    host.appendChild(row);
    return sel;
  }

  function button(host, label, on, cls) {
    const b = el("button", "sim-btn" + (cls ? " " + cls : ""), label);
    b.type = "button";
    b.addEventListener("click", on);
    host.appendChild(b);
    return b;
  }

  // Every simulator is laid out the same way, so a teacher who has used one
  // has used all of them.
  function shell(host) {
    clear(host);
    const wrap = el("div", "sim-body");
    const ctrls = el("div", "sim-ctrls");
    const stage = el("div", "sim-stage");
    const read = el("p", "sim-read");
    wrap.appendChild(ctrls);
    wrap.appendChild(stage);
    wrap.appendChild(read);
    host.appendChild(wrap);
    return { ctrls, stage, read };
  }

  // Drag support: turns a pointer position into a value on the drawing's own
  // coordinates, so dragging works the same on a laptop and a touch screen.
  function draggable(s, node, onMove) {
    const toLocal = (ev) => {
      const r = s.getBoundingClientRect();
      const vb = s.viewBox.baseVal;
      return {
        x: (ev.clientX - r.left) / r.width * vb.width,
        y: (ev.clientY - r.top) / r.height * vb.height
      };
    };
    node.style.cursor = "grab";
    node.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      node.setPointerCapture(ev.pointerId);
      node.style.cursor = "grabbing";
      const move = (e) => onMove(toLocal(e));
      const up = (e) => {
        node.releasePointerCapture(ev.pointerId);
        node.style.cursor = "grab";
        node.removeEventListener("pointermove", move);
        node.removeEventListener("pointerup", up);
      };
      node.addEventListener("pointermove", move);
      node.addEventListener("pointerup", up);
      onMove(toLocal(ev));
    });
  }

  const defs = {};

  // ---------- 1. Number line ----------
  defs.numberLine = {
    name: "Number line",
    blurb: "Count on or back along the line — the arrow shows the jump and where you land.",
    mount(host, o) {
      const opts = o || {};
      const min = pick(opts.min, 0), max = pick(opts.max, 20);
      const inequality = opts.mode === "inequality";
      const st = {
        a: pick(opts.start, min + Math.round((max - min) / 4)),
        b: pick(opts.jump, Math.max(1, Math.round((max - min) / 4))),
        sign: opts.op === "-" ? -1 : 1,
        rel: ">"
      };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 160, pad = 34, base = 104;
      const X = (n) => pad + (n - min) * (W - 2 * pad) / (max - min);

      function draw() {
        const s = frame(stage, W, H);
        s.appendChild(svg("line", { x1: pad, y1: base, x2: W - pad, y2: base, class: "sim-axis" }));
        const step = Math.max(1, Math.round((max - min) / 20));
        for (let n = min; n <= max; n += step) {
          s.appendChild(svg("line", { x1: X(n), y1: base - 6, x2: X(n), y2: base + 6, class: "sim-axis" }));
          s.appendChild(text(X(n), base + 26, num(n)));
        }
        if (inequality) {
          const solid = st.rel === "≥" || st.rel === "≤";
          const rightward = st.rel === ">" || st.rel === "≥";
          const from = X(st.a), to = rightward ? W - pad : pad;
          s.appendChild(svg("line", { x1: from, y1: base, x2: to, y2: base, class: "sim-ray" }));
          s.appendChild(svg("polygon", {
            points: rightward ? `${to},${base} ${to - 14},${base - 7} ${to - 14},${base + 7}`
                              : `${to},${base} ${to + 14},${base - 7} ${to + 14},${base + 7}`,
            class: "sim-fill"
          }));
          s.appendChild(svg("circle", { cx: from, cy: base, r: 8,
            class: solid ? "sim-dot" : "sim-dot-open" }));
          s.appendChild(text(from, base - 22, `x ${st.rel} ${num(st.a)}`, "sim-t big"));
          read.textContent = `Every number under the arrow satisfies x ${st.rel} ${num(st.a)}. `
            + (solid ? `${num(st.a)} itself is included — the circle is filled in.`
                     : `${num(st.a)} itself is not included — the circle is hollow.`);
          return;
        }
        const end = clamp(st.a + st.sign * st.b, min, max);
        const x1 = X(st.a), x2 = X(end), mid = (x1 + x2) / 2;
        s.appendChild(svg("path", {
          d: `M ${x1} ${base - 10} Q ${mid} ${base - 74} ${x2} ${base - 10}`, class: "sim-arc" }));
        const dir = x2 >= x1 ? 1 : -1;
        s.appendChild(svg("polygon", {
          points: `${x2},${base - 4} ${x2 - 9 * dir},${base - 20} ${x2 + 5 * dir},${base - 18}`,
          class: "sim-fill" }));
        s.appendChild(text(mid, base - 76, `${st.sign > 0 ? "+" : "−"} ${st.b}`, "sim-t big"));
        s.appendChild(svg("circle", { cx: x1, cy: base, r: 7, class: "sim-dot-open" }));
        s.appendChild(svg("circle", { cx: x2, cy: base, r: 8, class: "sim-dot" }));
        read.textContent = `${num(st.a)} ${st.sign > 0 ? "+" : "−"} ${num(st.b)} = `
          + `${num(st.a + st.sign * st.b)}`;
      }

      slider(ctrls, { label: inequality ? "Boundary" : "Start at", min, max, value: st.a,
        on: (v) => { st.a = v; draw(); } });
      if (inequality) {
        choice(ctrls, { label: "Sign", value: st.rel,
          options: [{ value: ">", label: "x > a" }, { value: "≥", label: "x ≥ a" },
                    { value: "<", label: "x < a" }, { value: "≤", label: "x ≤ a" }],
          on: (v) => { st.rel = v; draw(); } });
      } else {
        slider(ctrls, { label: "Jump of", min: 0, max: Math.max(1, max - min), value: st.b,
          on: (v) => { st.b = v; draw(); } });
        choice(ctrls, { label: "Direction", value: st.sign > 0 ? "+" : "-",
          options: [{ value: "+", label: "Count on  (+)" }, { value: "-", label: "Count back  (−)" }],
          on: (v) => { st.sign = v === "+" ? 1 : -1; draw(); } });
      }
      draw();
    }
  };

  // ---------- 2. Place-value chart ----------
  defs.placeValue = {
    name: "Place-value chart",
    blurb: "Drop counters into the columns, then regroup ten of them into the next column.",
    mount(host, o) {
      const opts = o || {};
      const cols = pick(opts.cols, ["Thousands", "Hundreds", "Tens", "Ones"]);
      const worth = cols.map((_, i) => Math.pow(10, cols.length - 1 - i));
      const st = { n: cols.map((_, i) => (i === cols.length - 1 ? 12 : 1)) };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 250;

      function value() { return st.n.reduce((a, c, i) => a + c * worth[i], 0); }

      function draw() {
        const s = frame(stage, W, H);
        const cw = W / cols.length;
        cols.forEach((label, i) => {
          const x = i * cw;
          s.appendChild(svg("rect", { x: x + 4, y: 4, width: cw - 8, height: H - 8,
            class: "sim-col" }));
          s.appendChild(text(x + cw / 2, 26, label, "sim-t bold"));
          s.appendChild(text(x + cw / 2, 44, "worth " + worth[i], "sim-t soft"));
          // Counters, ten to a row so a full row is visibly a regroup.
          for (let k = 0; k < Math.min(st.n[i], 40); k++) {
            const r = Math.floor(k / 5), c = k % 5;
            s.appendChild(svg("circle", {
              cx: x + 20 + c * ((cw - 46) / 4), cy: 70 + r * 22, r: 8,
              class: st.n[i] >= 10 ? "sim-dot-warn" : "sim-dot" }));
          }
          s.appendChild(text(x + cw / 2, H - 14, String(st.n[i]), "sim-t big"));
        });
        const parts = cols.map((c, i) => st.n[i] * worth[i]).filter((v) => v > 0);
        read.textContent = `This chart shows ${value()}`
          + (parts.length ? `  =  ${parts.join(" + ")}` : "")
          + (st.n.some((c, i) => c >= 10 && i > 0) ? "  — a column has ten or more: regroup it."
             : st.n[0] >= 10 ? "  — the biggest column has ten or more." : "");
      }

      cols.forEach((label, i) => {
        const row = el("div", "sim-ctrl");
        row.appendChild(el("span", "sim-lab", label));
        button(row, "−", () => { st.n[i] = Math.max(0, st.n[i] - 1); draw(); });
        button(row, "+", () => { st.n[i] = Math.min(40, st.n[i] + 1); draw(); });
        ctrls.appendChild(row);
      });
      const acts = el("div", "sim-ctrl");
      button(acts, "Regroup ten", () => {
        // Ten in a column becomes one in the column to its left — the exact
        // move a child makes when they carry in column addition.
        for (let i = cols.length - 1; i > 0; i--) {
          if (st.n[i] >= 10) { st.n[i] -= 10; st.n[i - 1] += 1; break; }
        }
        draw();
      });
      button(acts, "Break one down", () => {
        for (let i = 0; i < cols.length - 1; i++) {
          if (st.n[i] >= 1) { st.n[i] -= 1; st.n[i + 1] += 10; break; }
        }
        draw();
      });
      button(acts, "Clear", () => { st.n = cols.map(() => 0); draw(); });
      ctrls.appendChild(acts);
      draw();
    }
  };

  // ---------- 3. Array / area grid ----------
  defs.arrayGrid = {
    name: "Array grid",
    blurb: "Change the rows and columns — the same picture is a times table, a division and an area.",
    mount(host, o) {
      const opts = o || {};
      const area = opts.mode === "area";
      const st = { r: pick(opts.rows, 4), c: pick(opts.cols, 6) };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 300;

      function draw() {
        const s = frame(stage, W, H);
        const cell = Math.min(Math.floor((W - 120) / 12), Math.floor((H - 70) / 12));
        const x0 = 70, y0 = 40;
        for (let i = 0; i < st.r; i++) {
          for (let j = 0; j < st.c; j++) {
            s.appendChild(svg("rect", { x: x0 + j * cell, y: y0 + i * cell,
              width: cell, height: cell, class: "sim-cell" }));
          }
        }
        s.appendChild(text(x0 + st.c * cell / 2, y0 - 12, `${st.c} ${area ? "cm" : ""}`, "sim-t bold"));
        const ry = svg("text", { x: 0, y: 0, class: "sim-t bold", "text-anchor": "middle",
          transform: `translate(${x0 - 18} ${y0 + st.r * cell / 2}) rotate(-90)` });
        ry.textContent = `${st.r} ${area ? "cm" : ""}`;
        s.appendChild(ry);
        if (area) {
          read.textContent = `Area = ${st.r} × ${st.c} = ${st.r * st.c} cm²   ·   `
            + `Perimeter = 2 × (${st.r} + ${st.c}) = ${2 * (st.r + st.c)} cm   ·   `
            + `same numbers, different units.`;
        } else {
          read.textContent = `${st.r} × ${st.c} = ${st.r * st.c}   ·   `
            + `${st.c} × ${st.r} = ${st.r * st.c} (turn it round — same array)   ·   `
            + `${st.r * st.c} ÷ ${st.c} = ${st.r}`;
        }
      }

      slider(ctrls, { label: area ? "Height (cm)" : "Rows", min: 1, max: 12, value: st.r,
        on: (v) => { st.r = v; draw(); } });
      slider(ctrls, { label: area ? "Width (cm)" : "Columns", min: 1, max: 12, value: st.c,
        on: (v) => { st.c = v; draw(); } });
      draw();
    }
  };

  // ---------- 4. Sharing into groups ----------
  defs.groupSplit = {
    name: "Sharing into groups",
    blurb: "Split a pile into equal groups and see exactly what is left over.",
    mount(host, o) {
      const opts = o || {};
      const st = { total: pick(opts.total, 23), size: pick(opts.size, 4) };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 260;

      function draw() {
        const s = frame(stage, W, H);
        const groups = Math.floor(st.total / st.size);
        const rem = st.total % st.size;
        const perRow = Math.max(1, Math.floor(W / 120));
        let idx = 0;
        const drawPile = (gx, gy, count, leftover) => {
          s.appendChild(svg("rect", { x: gx, y: gy, width: 104, height: 78,
            class: leftover ? "sim-group-left" : "sim-group" }));
          for (let k = 0; k < count; k++) {
            s.appendChild(svg("circle", { cx: gx + 18 + (k % 4) * 24, cy: gy + 22 + Math.floor(k / 4) * 24,
              r: 8, class: leftover ? "sim-dot-warn" : "sim-dot" }));
          }
        };
        for (let g = 0; g < groups; g++, idx++) {
          drawPile(20 + (idx % perRow) * 118, 20 + Math.floor(idx / perRow) * 92, st.size, false);
        }
        if (rem) drawPile(20 + (idx % perRow) * 118, 20 + Math.floor(idx / perRow) * 92, rem, true);
        read.textContent = `${st.total} ÷ ${st.size} = ${groups}`
          + (rem ? ` remainder ${rem}` : " exactly")
          + `   ·   check: ${st.size} × ${groups}${rem ? ` + ${rem}` : ""} = ${st.total}`
          + (rem ? `   ·   the remainder is always smaller than ${st.size}.` : "");
      }

      slider(ctrls, { label: "Counters", min: 1, max: 40, value: st.total,
        on: (v) => { st.total = v; draw(); } });
      slider(ctrls, { label: "In each group", min: 2, max: 9, value: st.size,
        on: (v) => { st.size = v; draw(); } });
      draw();
    }
  };

  // ---------- 5. Fraction bars ----------
  defs.fractionBar = {
    name: "Fraction bars",
    blurb: "Two bars, side by side — see when fractions are equal and what happens when you add them.",
    mount(host, o) {
      const opts = o || {};
      const add = opts.mode === "add";
      const st = { n1: 1, d1: 3, n2: 1, d2: 4 };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = add ? 280 : 200;
      const gcd = (a, b) => (b ? gcd(b, a % b) : a);

      function bar(s, y, n, d, cls, label) {
        const x0 = 30, w = W - 130;
        for (let i = 0; i < d; i++) {
          s.appendChild(svg("rect", { x: x0 + i * w / d, y, width: w / d, height: 46,
            class: i < n ? cls : "sim-bar-empty" }));
        }
        s.appendChild(svg("rect", { x: x0, y, width: w, height: 46, class: "sim-bar-outline" }));
        s.appendChild(text(W - 48, y + 30, label, "sim-t big", "start"));
      }

      function draw() {
        const s = frame(stage, W, H);
        bar(s, 22, st.n1, st.d1, "sim-bar-a", `${st.n1}/${st.d1}`);
        bar(s, 92, st.n2, st.d2, "sim-bar-b", `${st.n2}/${st.d2}`);
        const v1 = st.n1 / st.d1, v2 = st.n2 / st.d2;
        if (add) {
          const lcm = st.d1 * st.d2 / gcd(st.d1, st.d2);
          const top = st.n1 * (lcm / st.d1) + st.n2 * (lcm / st.d2);
          bar(s, 178, Math.min(top, lcm), lcm, "sim-bar-sum",
            `${top}/${lcm}${top > lcm ? "" : ""}`);
          const g = gcd(top, lcm);
          read.textContent = `${st.n1}/${st.d1} + ${st.n2}/${st.d2} = `
            + `${st.n1 * (lcm / st.d1)}/${lcm} + ${st.n2 * (lcm / st.d2)}/${lcm} = ${top}/${lcm}`
            + (g > 1 ? ` = ${top / g}/${lcm / g}` : "")
            + `   ·   the denominators had to match first — ${lcm} is the common one.`;
        } else {
          read.textContent = Math.abs(v1 - v2) < 1e-9
            ? `${st.n1}/${st.d1} = ${st.n2}/${st.d2} — equivalent. The shading is identical; only the number of pieces changed.`
            : `${st.n1}/${st.d1} ${v1 > v2 ? ">" : "<"} ${st.n2}/${st.d2}`
              + `   (${num(v1, 3)} and ${num(v2, 3)}) — not equivalent yet.`;
        }
      }

      slider(ctrls, { label: "First — top", min: 0, max: 12, value: st.n1,
        on: (v) => { st.n1 = Math.min(v, st.d1); draw(); } });
      slider(ctrls, { label: "First — bottom", min: 1, max: 12, value: st.d1,
        on: (v) => { st.d1 = v; st.n1 = Math.min(st.n1, v); draw(); } });
      slider(ctrls, { label: "Second — top", min: 0, max: 12, value: st.n2,
        on: (v) => { st.n2 = Math.min(v, st.d2); draw(); } });
      slider(ctrls, { label: "Second — bottom", min: 1, max: 12, value: st.d2,
        on: (v) => { st.d2 = v; st.n2 = Math.min(st.n2, v); draw(); } });
      draw();
    }
  };

  // ---------- 6. Part of an amount (fraction / percentage / ratio) ----------
  defs.partOfAmount = {
    name: "Part of an amount",
    blurb: "One bar for the whole amount — take a fraction, a percentage or a ratio share of it.",
    mount(host, o) {
      const opts = o || {};
      const mode = pick(opts.mode, "fraction");     // fraction | percent | ratio
      const st = { amount: 40, n: 3, d: 5, pct: 35, a: 2, b: 3 };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 190;

      function draw() {
        const s = frame(stage, W, H);
        const x0 = 30, w = W - 60, y = 50, h = 60;
        let parts;
        if (mode === "fraction") parts = { count: st.d, taken: st.n };
        else if (mode === "percent") parts = { count: 10, taken: st.pct / 10 };
        else parts = { count: st.a + st.b, taken: st.a };

        for (let i = 0; i < parts.count; i++) {
          s.appendChild(svg("rect", { x: x0 + i * w / parts.count, y, width: w / parts.count,
            height: h, class: i < Math.floor(parts.taken) ? "sim-bar-a" : "sim-bar-empty" }));
        }
        if (parts.taken % 1) {
          const i = Math.floor(parts.taken);
          s.appendChild(svg("rect", { x: x0 + i * w / parts.count, y,
            width: (w / parts.count) * (parts.taken % 1), height: h, class: "sim-bar-a" }));
        }
        s.appendChild(svg("rect", { x: x0, y, width: w, height: h, class: "sim-bar-outline" }));
        s.appendChild(text(x0 + w / 2, y - 14, `whole amount = ${num(st.amount)}`, "sim-t bold"));

        if (mode === "fraction") {
          const one = st.amount / st.d, taken = one * st.n;
          s.appendChild(text(x0 + w / 2, y + h + 30,
            `one part = ${num(st.amount)} ÷ ${st.d} = ${num(one)}`, "sim-t"));
          read.textContent = `${st.n}/${st.d} of ${num(st.amount)}:  divide by ${st.d} to get one part `
            + `(${num(one)}), then multiply by ${st.n}  →  ${num(taken)}.`;
        } else if (mode === "percent") {
          const ten = st.amount / 10, taken = st.amount * st.pct / 100;
          s.appendChild(text(x0 + w / 2, y + h + 30,
            `10% = ${num(ten)}   ·   1% = ${num(st.amount / 100)}`, "sim-t"));
          read.textContent = `${st.pct}% of ${num(st.amount)} = ${num(taken)}.  `
            + `Build it from easy pieces: ${Math.floor(st.pct / 10)} × 10% (${num(ten * Math.floor(st.pct / 10))})`
            + (st.pct % 10 ? ` + ${st.pct % 10} × 1% (${num((st.pct % 10) * st.amount / 100)})` : "") + ".";
        } else {
          const one = st.amount / (st.a + st.b);
          read.textContent = `Share ${num(st.amount)} in the ratio ${st.a} : ${st.b}.  `
            + `That is ${st.a + st.b} equal parts, so one part = ${num(one)}  →  `
            + `${num(one * st.a)} and ${num(one * st.b)}  (they add back to ${num(st.amount)}).`;
        }
      }

      slider(ctrls, { label: "Amount", min: 10, max: 200, step: 5, value: st.amount,
        on: (v) => { st.amount = v; draw(); } });
      if (mode === "fraction") {
        slider(ctrls, { label: "Top (numerator)", min: 0, max: 12, value: st.n,
          on: (v) => { st.n = Math.min(v, st.d); draw(); } });
        slider(ctrls, { label: "Bottom (denominator)", min: 1, max: 12, value: st.d,
          on: (v) => { st.d = v; st.n = Math.min(st.n, v); draw(); } });
      } else if (mode === "percent") {
        slider(ctrls, { label: "Percentage", min: 0, max: 100, step: 5, value: st.pct,
          fmt: (v) => v + "%", on: (v) => { st.pct = v; draw(); } });
      } else {
        slider(ctrls, { label: "First share", min: 1, max: 9, value: st.a,
          on: (v) => { st.a = v; draw(); } });
        slider(ctrls, { label: "Second share", min: 1, max: 9, value: st.b,
          on: (v) => { st.b = v; draw(); } });
      }
      draw();
    }
  };

  // ---------- 7. Area model (long multiplication and brackets) ----------
  defs.areaModel = {
    name: "Area model",
    blurb: "Split each factor by place value — the four rectangles are the partial products.",
    mount(host, o) {
      const opts = o || {};
      const algebra = !!opts.algebra;
      const st = algebra ? { a: 3, b: 2, x: 1 } : { p: 36, q: 14 };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 300;

      function draw() {
        const s = frame(stage, W, H);
        const x0 = 90, y0 = 50, w = W - 160, h = H - 110;
        let cw, ch, labTop, labLeft, cells;
        if (algebra) {
          cw = [w * 0.68, w * 0.32]; ch = [h * 0.68, h * 0.32];
          labTop = ["x", "+" + st.b]; labLeft = ["x", "+" + st.a];
          cells = [["x²", st.b + "x"], [st.a + "x", String(st.a * st.b)]];
        } else {
          const pt = Math.floor(st.p / 10) * 10, po = st.p % 10;
          const qt = Math.floor(st.q / 10) * 10, qo = st.q % 10;
          const tot = pt + po || 1;
          cw = [w * (qt / (qt + qo || 1)), w * (qo / (qt + qo || 1))];
          ch = [h * (pt / tot), h * (po / tot)];
          labTop = [String(qt), "+" + qo]; labLeft = [String(pt), "+" + po];
          cells = [[String(pt * qt), String(pt * qo)], [String(po * qt), String(po * qo)]];
        }
        const xs = [x0, x0 + cw[0]], ys = [y0, y0 + ch[0]];
        const classes = [["sim-q1", "sim-q2"], ["sim-q3", "sim-q4"]];
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            if (cw[j] < 1 || ch[i] < 1) continue;
            s.appendChild(svg("rect", { x: xs[j], y: ys[i], width: cw[j], height: ch[i],
              class: classes[i][j] }));
            s.appendChild(text(xs[j] + cw[j] / 2, ys[i] + ch[i] / 2 + 6, cells[i][j], "sim-t big"));
          }
        }
        labTop.forEach((t, j) => { if (cw[j] > 1) s.appendChild(text(xs[j] + cw[j] / 2, y0 - 14, t, "sim-t bold")); });
        labLeft.forEach((t, i) => { if (ch[i] > 1) s.appendChild(text(x0 - 30, ys[i] + ch[i] / 2 + 5, t, "sim-t bold")); });

        if (algebra) {
          const sum = st.a + st.b, prod = st.a * st.b;
          read.textContent = `(x + ${st.a})(x + ${st.b}) = x² + ${st.b}x + ${st.a}x + ${prod} `
            + `= x² + ${sum}x + ${prod}.   Going backwards: to factorise x² + ${sum}x + ${prod}, `
            + `find two numbers that multiply to ${prod} and add to ${sum} — they are ${st.a} and ${st.b}.`;
        } else {
          const parts = [];
          const pt = Math.floor(st.p / 10) * 10, po = st.p % 10;
          const qt = Math.floor(st.q / 10) * 10, qo = st.q % 10;
          [[pt, qt], [pt, qo], [po, qt], [po, qo]].forEach(([a, b]) => { if (a && b) parts.push(a * b); });
          read.textContent = `${st.p} × ${st.q} = ${parts.join(" + ")} = ${st.p * st.q}`
            + `   ·   estimate first: ${Math.round(st.p / 10) * 10} × ${Math.round(st.q / 10) * 10} = `
            + `${Math.round(st.p / 10) * 10 * Math.round(st.q / 10) * 10}.`;
        }
      }

      if (algebra) {
        slider(ctrls, { label: "First bracket  (x + a)", min: 1, max: 9, value: st.a,
          fmt: (v) => "a = " + v, on: (v) => { st.a = v; draw(); } });
        slider(ctrls, { label: "Second bracket  (x + b)", min: 1, max: 9, value: st.b,
          fmt: (v) => "b = " + v, on: (v) => { st.b = v; draw(); } });
      } else {
        slider(ctrls, { label: "First number", min: 11, max: 99, value: st.p,
          on: (v) => { st.p = v; draw(); } });
        slider(ctrls, { label: "Second number", min: 11, max: 99, value: st.q,
          on: (v) => { st.q = v; draw(); } });
      }
      draw();
    }
  };

  // ---------- 8. Balance scales ----------
  defs.balanceScale = {
    name: "Balance scales",
    blurb: "Do the same thing to both pans — the scales stay level until x is alone.",
    mount(host, o) {
      const opts = o || {};
      const st = { a: 3, b: 4, c: 19, step: 0 };   // a·x + b = c
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 250;
      const xVal = () => (st.c - st.b) / st.a;

      function pan(s, cx, cy, boxes, units, label) {
        s.appendChild(svg("line", { x1: cx, y1: cy - 40, x2: cx, y2: cy, class: "sim-axis" }));
        s.appendChild(svg("path", { d: `M ${cx - 78} ${cy} L ${cx + 78} ${cy} L ${cx + 58} ${cy + 26} L ${cx - 58} ${cy + 26} Z`,
          class: "sim-pan" }));
        let px = cx - 68;
        for (let i = 0; i < boxes; i++) {
          s.appendChild(svg("rect", { x: px, y: cy - 34, width: 26, height: 30, class: "sim-xbox" }));
          s.appendChild(text(px + 13, cy - 12, "x", "sim-t bold"));
          px += 30;
        }
        for (let i = 0; i < Math.min(units, 20); i++) {
          s.appendChild(svg("circle", { cx: cx - 66 + (i % 10) * 14, cy: cy - 46 - Math.floor(i / 10) * 16,
            r: 6, class: "sim-dot" }));
        }
        s.appendChild(text(cx, cy + 46, label, "sim-t bold"));
      }

      function draw() {
        const s = frame(stage, W, H);
        s.appendChild(svg("line", { x1: 60, y1: 60, x2: W - 60, y2: 60, class: "sim-beam" }));
        s.appendChild(svg("polygon", { points: `${W / 2},60 ${W / 2 - 22},${H - 24} ${W / 2 + 22},${H - 24}`,
          class: "sim-fill-soft" }));
        const left = st.step === 0 ? { x: st.a, u: st.b, lab: `${st.a}x + ${st.b}` }
                   : st.step === 1 ? { x: st.a, u: 0, lab: `${st.a}x` }
                   : { x: 1, u: 0, lab: "x" };
        const rightUnits = st.step === 0 ? st.c : st.step === 1 ? st.c - st.b : xVal();
        pan(s, 170, 150, left.x, left.u, left.lab);
        pan(s, W - 170, 150, 0, rightUnits, num(rightUnits));
        const steps = [
          `Start: ${st.a}x + ${st.b} = ${st.c}`,
          `Take ${st.b} off both pans: ${st.a}x = ${st.c - st.b}`,
          `Share both pans into ${st.a}: x = ${num(xVal())}`
        ];
        read.textContent = steps[st.step]
          + (st.step === 2 ? `   ·   check: ${st.a} × ${num(xVal())} + ${st.b} = ${num(st.a * xVal() + st.b)}.` : "");
      }

      slider(ctrls, { label: "x's on the left (a)", min: 1, max: 6, value: st.a,
        on: (v) => { st.a = v; st.step = 0; draw(); } });
      slider(ctrls, { label: "Units added (b)", min: 0, max: 20, value: st.b,
        on: (v) => { st.b = v; st.step = 0; draw(); } });
      slider(ctrls, { label: "Right-hand pan (c)", min: 0, max: 60, value: st.c,
        on: (v) => { st.c = v; st.step = 0; draw(); } });
      const acts = el("div", "sim-ctrl");
      button(acts, "Next step ▸", () => { st.step = Math.min(2, st.step + 1); draw(); });
      button(acts, "Back to the start", () => { st.step = 0; draw(); });
      ctrls.appendChild(acts);
      draw();
    }
  };

  // A pair of axes shared by the graphing simulators, with the two functions
  // that turn maths coordinates into drawing coordinates.
  function axes(s, W, H, xr, yr) {
    const pad = 34;
    const X = (x) => pad + (x - xr[0]) * (W - 2 * pad) / (xr[1] - xr[0]);
    const Y = (y) => H - pad - (y - yr[0]) * (H - 2 * pad) / (yr[1] - yr[0]);
    // Grid lines thin out on a wide window, so the numbers never collide.
    const gx = Math.max(1, Math.round((xr[1] - xr[0]) / 16));
    const gy = Math.max(1, Math.round((yr[1] - yr[0]) / 12));
    for (let x = Math.ceil(xr[0]); x <= xr[1]; x += gx)
      s.appendChild(svg("line", { x1: X(x), y1: Y(yr[0]), x2: X(x), y2: Y(yr[1]), class: "sim-grid" }));
    for (let y = Math.ceil(yr[0]); y <= yr[1]; y += gy)
      s.appendChild(svg("line", { x1: X(xr[0]), y1: Y(y), x2: X(xr[1]), y2: Y(y), class: "sim-grid" }));
    s.appendChild(svg("line", { x1: X(xr[0]), y1: Y(0), x2: X(xr[1]), y2: Y(0), class: "sim-axis" }));
    s.appendChild(svg("line", { x1: X(0), y1: Y(yr[0]), x2: X(0), y2: Y(yr[1]), class: "sim-axis" }));
    s.appendChild(text(X(xr[1]) - 8, Y(0) - 8, "x", "sim-t soft"));
    s.appendChild(text(X(0) + 12, Y(yr[1]) + 12, "y", "sim-t soft"));
    const lx = Math.max(1, Math.round((xr[1] - xr[0]) / 8));
    for (let x = Math.ceil(xr[0] / lx) * lx; x <= xr[1]; x += lx)
      if (x !== 0) s.appendChild(text(X(x), Y(0) + 16, String(round(x, 2)), "sim-t soft"));
    return { X, Y, pad };
  }

  // Plot a function as a path, clipped to the visible window.
  function plot(s, f, xr, yr, X, Y, cls) {
    let d = "", pen = false;
    for (let i = 0; i <= 400; i++) {
      const x = xr[0] + (xr[1] - xr[0]) * i / 400;
      const y = f(x);
      if (!isFinite(y) || y < yr[0] - 1 || y > yr[1] + 1) { pen = false; continue; }
      d += (pen ? " L " : " M ") + X(x) + " " + Y(y);
      pen = true;
    }
    if (d) s.appendChild(svg("path", { d, class: cls || "sim-curve" }));
  }

  // ---------- 9. Straight-line grapher ----------
  defs.linePlot = {
    name: "Straight-line grapher",
    blurb: "Move the gradient and the intercept and watch the line answer.",
    mount(host, o) {
      const opts = o || {};
      const two = !!opts.two;
      const st = { m1: 2, c1: 1, m2: -1, c2: 5 };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 340, xr = [-8, 8], yr = [-8, 8];

      function draw() {
        const s = frame(stage, W, H);
        const { X, Y } = axes(s, W, H, xr, yr);
        plot(s, (x) => st.m1 * x + st.c1, xr, yr, X, Y, "sim-line-a");
        if (two) plot(s, (x) => st.m2 * x + st.c2, xr, yr, X, Y, "sim-line-b");
        // The gradient triangle: one step right, m steps up.
        const x0 = 0, y0 = st.c1;
        if (Math.abs(y0 + st.m1) <= yr[1]) {
          s.appendChild(svg("path", {
            d: `M ${X(x0)} ${Y(y0)} L ${X(x0 + 1)} ${Y(y0)} L ${X(x0 + 1)} ${Y(y0 + st.m1)}`,
            class: "sim-tri" }));
          s.appendChild(text(X(x0 + 0.5), Y(y0) + 16, "1", "sim-t soft"));
          s.appendChild(text(X(x0 + 1) + 14, Y(y0 + st.m1 / 2), num(st.m1), "sim-t soft"));
        }
        s.appendChild(svg("circle", { cx: X(0), cy: Y(st.c1), r: 6, class: "sim-dot" }));
        if (two) {
          if (Math.abs(st.m1 - st.m2) < 1e-9) {
            read.textContent = `y = ${num(st.m1)}x + ${num(st.c1)}  and  y = ${num(st.m2)}x + ${num(st.c2)}: `
              + (Math.abs(st.c1 - st.c2) < 1e-9
                 ? "the same line — every point is a solution."
                 : "same gradient, so the lines are parallel and never meet — no solution.");
          } else {
            const x = (st.c2 - st.c1) / (st.m1 - st.m2), y = st.m1 * x + st.c1;
            s.appendChild(svg("circle", { cx: X(x), cy: Y(y), r: 7, class: "sim-dot-warn" }));
            read.textContent = `The lines cross at (${num(x)}, ${num(y)}) — that point is the `
              + `solution of the pair: x = ${num(x)}, y = ${num(y)}.`;
          }
        } else {
          read.textContent = `y = ${num(st.m1)}x + ${num(st.c1)}   ·   gradient ${num(st.m1)}: `
            + `go 1 right and ${num(Math.abs(st.m1))} ${st.m1 < 0 ? "down" : "up"}`
            + `   ·   it cuts the y-axis at (0, ${num(st.c1)}).`;
        }
      }

      slider(ctrls, { label: two ? "Line 1 — gradient m" : "Gradient m", min: -4, max: 4, step: 0.5,
        value: st.m1, on: (v) => { st.m1 = v; draw(); } });
      slider(ctrls, { label: two ? "Line 1 — intercept c" : "Intercept c", min: -6, max: 6, step: 0.5,
        value: st.c1, on: (v) => { st.c1 = v; draw(); } });
      if (two) {
        slider(ctrls, { label: "Line 2 — gradient m", min: -4, max: 4, step: 0.5, value: st.m2,
          on: (v) => { st.m2 = v; draw(); } });
        slider(ctrls, { label: "Line 2 — intercept c", min: -6, max: 6, step: 0.5, value: st.c2,
          on: (v) => { st.c2 = v; draw(); } });
      }
      draw();
    }
  };

  // ---------- 10. Quadratic curve ----------
  defs.curvePlot = {
    name: "Quadratic curve",
    blurb: "Shape the curve, then read its roots, its gradient at a point, or the area beneath it.",
    mount(host, o) {
      const opts = o || {};
      const mode = pick(opts.mode, "roots");        // roots | tangent | area
      const st = { a: 1, b: -2, c: -3, at: 1 };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 340, xr = [-6, 6], yr = [-8, 10];
      const f = (x) => st.a * x * x + st.b * x + st.c;
      // "y = x² − 2x − 3", not "y = 1x² + −2x + −3".
      const fmtQ = () => `y = ${st.a === 1 ? "" : st.a === -1 ? "−" : num(st.a)}x²`
        + (st.b ? ` ${st.b < 0 ? "−" : "+"} ${Math.abs(st.b) === 1 ? "" : num(Math.abs(st.b))}x` : "")
        + (st.c ? ` ${st.c < 0 ? "−" : "+"} ${num(Math.abs(st.c))}` : "");

      function draw() {
        const s = frame(stage, W, H);
        const { X, Y } = axes(s, W, H, xr, yr);
        if (mode === "area") {
          // The area under the curve between 0 and the chosen x, as strips.
          const lo = Math.min(0, st.at), hi = Math.max(0, st.at), n = 40;
          for (let i = 0; i < n; i++) {
            const x = lo + (hi - lo) * i / n, y = f(x + (hi - lo) / (2 * n));
            const yTop = clamp(y, yr[0], yr[1]);
            s.appendChild(svg("rect", {
              x: X(x), y: Y(Math.max(yTop, 0)),
              width: Math.max(1, X(lo + (hi - lo) * (i + 1) / n) - X(x)),
              height: Math.abs(Y(0) - Y(yTop)), class: "sim-strip" }));
          }
        }
        plot(s, f, xr, yr, X, Y, "sim-curve");
        const disc = st.b * st.b - 4 * st.a * st.c;
        if (mode === "roots") {
          if (disc >= 0 && st.a !== 0) {
            [(-st.b - Math.sqrt(disc)) / (2 * st.a), (-st.b + Math.sqrt(disc)) / (2 * st.a)]
              .forEach((r) => {
                if (r >= xr[0] && r <= xr[1])
                  s.appendChild(svg("circle", { cx: X(r), cy: Y(0), r: 7, class: "sim-dot-warn" }));
              });
            const r1 = (-st.b - Math.sqrt(disc)) / (2 * st.a);
            const r2 = (-st.b + Math.sqrt(disc)) / (2 * st.a);
            read.textContent = `${fmtQ()}   ·   the curve crosses y = 0 at x = ${num(r1)} and `
              + `x = ${num(r2)} — those are the solutions. `
              + (disc === 0 ? "Here the two are the same: one repeated root." : "");
          } else {
            read.textContent = `${fmtQ()}   ·   the curve never reaches the x-axis, so this `
              + `quadratic has no real solutions (b² − 4ac = ${num(disc)}, which is negative).`;
          }
        } else if (mode === "tangent") {
          const g = 2 * st.a * st.at + st.b, y0 = f(st.at);
          plot(s, (x) => y0 + g * (x - st.at), xr, yr, X, Y, "sim-line-b");
          s.appendChild(svg("circle", { cx: X(st.at), cy: Y(y0), r: 7, class: "sim-dot-warn" }));
          read.textContent = `${fmtQ()}   ·   dy/dx = ${num(2 * st.a)}x ${st.b < 0 ? "−" : "+"} `
            + `${num(Math.abs(st.b))}, so at x = ${num(st.at)} the gradient is ${num(g)} — `
            + `that is the slope of the straight line touching the curve there.`;
        } else {
          const F = (x) => st.a * x * x * x / 3 + st.b * x * x / 2 + st.c * x;
          read.textContent = `${fmtQ()}   ·   ∫ from 0 to ${num(st.at)} = ${num(F(st.at) - F(0))}. `
            + `The strips are the area the integral adds up; below the axis it counts as negative.`;
        }
      }

      slider(ctrls, { label: "a  (x² term)", min: -2, max: 2, step: 0.5, value: st.a,
        on: (v) => { st.a = v || 0.5; draw(); } });
      slider(ctrls, { label: "b  (x term)", min: -6, max: 6, step: 0.5, value: st.b,
        on: (v) => { st.b = v; draw(); } });
      slider(ctrls, { label: "c  (constant)", min: -8, max: 8, step: 0.5, value: st.c,
        on: (v) => { st.c = v; draw(); } });
      if (mode !== "roots") {
        slider(ctrls, { label: mode === "tangent" ? "Gradient at x =" : "Area up to x =",
          min: -5, max: 5, step: 0.25, value: st.at, on: (v) => { st.at = v; draw(); } });
      }
      draw();
    }
  };

  // ---------- 11. Right-angled triangle ----------
  defs.rightTriangle = {
    name: "Right-angled triangle",
    blurb: "Stretch the two short sides — the squares on them always add to the square on the longest.",
    mount(host, o) {
      const opts = o || {};
      const trig = opts.mode === "trig";
      const st = { a: 3, b: 4 };                   // a across, b up
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 340;

      function draw() {
        const s = frame(stage, W, H);
        const u = Math.min(38, 250 / Math.max(st.a, st.b));
        const ox = 210, oy = 250;                  // the right angle
        const A = { x: ox, y: oy }, B = { x: ox + st.a * u, y: oy }, C = { x: ox, y: oy - st.b * u };
        const c = Math.sqrt(st.a * st.a + st.b * st.b);
        if (!trig) {
          s.appendChild(svg("rect", { x: A.x, y: A.y, width: st.a * u, height: st.a * u, class: "sim-q2" }));
          s.appendChild(text(A.x + st.a * u / 2, A.y + st.a * u / 2 + 6, `${st.a}² = ${st.a * st.a}`, "sim-t"));
          s.appendChild(svg("rect", { x: A.x - st.b * u, y: C.y, width: st.b * u, height: st.b * u, class: "sim-q3" }));
          s.appendChild(text(A.x - st.b * u / 2, C.y + st.b * u / 2 + 6, `${st.b}² = ${st.b * st.b}`, "sim-t"));
        }
        s.appendChild(svg("polygon", { points: `${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`,
          class: "sim-shape" }));
        s.appendChild(svg("rect", { x: A.x, y: A.y - 14, width: 14, height: 14, class: "sim-right" }));
        s.appendChild(text((A.x + B.x) / 2, A.y + 20, `${trig ? "adjacent " : ""}${st.a}`, "sim-t bold"));
        const lab = svg("text", { class: "sim-t bold", "text-anchor": "middle",
          transform: `translate(${A.x - 18} ${(A.y + C.y) / 2}) rotate(-90)` });
        lab.textContent = `${trig ? "opposite " : ""}${st.b}`;
        s.appendChild(lab);
        s.appendChild(text((B.x + C.x) / 2 + 30, (B.y + C.y) / 2 - 6,
          `${trig ? "hypotenuse " : ""}${num(c)}`, "sim-t bold"));
        const th = Math.atan2(st.b, st.a) * 180 / Math.PI;
        if (trig) s.appendChild(text(B.x - 34, B.y - 10, `θ = ${num(th, 1)}°`, "sim-t"));

        if (trig) {
          read.textContent = `θ = ${num(th, 1)}°   ·   sin θ = opp/hyp = ${st.b}/${num(c)} = ${num(st.b / c, 3)}`
            + `   ·   cos θ = adj/hyp = ${st.a}/${num(c)} = ${num(st.a / c, 3)}`
            + `   ·   tan θ = opp/adj = ${st.b}/${st.a} = ${num(st.b / st.a, 3)}`;
        } else {
          read.textContent = `${st.a}² + ${st.b}² = ${st.a * st.a} + ${st.b * st.b} = ${st.a * st.a + st.b * st.b}`
            + `   ·   so the hypotenuse is √${st.a * st.a + st.b * st.b} = ${num(c, 3)}`
            + `   ·   the two coloured squares always fill the square on the longest side.`;
        }
      }

      slider(ctrls, { label: trig ? "Adjacent" : "Side a", min: 1, max: 12, value: st.a,
        on: (v) => { st.a = v; draw(); } });
      slider(ctrls, { label: trig ? "Opposite" : "Side b", min: 1, max: 12, value: st.b,
        on: (v) => { st.b = v; draw(); } });
      draw();
    }
  };

  // ---------- 12. Angles in a triangle ----------
  defs.triangleAngles = {
    name: "Angles in a triangle",
    blurb: "Drag any corner — the three angles always add to 180°.",
    mount(host, o) {
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 320;
      const pts = [{ x: 140, y: 250 }, { x: 520, y: 250 }, { x: 330, y: 70 }];

      const ang = (P, Q, R) => {
        const a = Math.hypot(Q.x - R.x, Q.y - R.y);
        const b = Math.hypot(P.x - R.x, P.y - R.y);
        const c = Math.hypot(P.x - Q.x, P.y - Q.y);
        return Math.acos(clamp((b * b + c * c - a * a) / (2 * b * c), -1, 1)) * 180 / Math.PI;
      };

      function draw() {
        const s = frame(stage, W, H);
        s.appendChild(svg("polygon", {
          points: pts.map((p) => `${p.x},${p.y}`).join(" "), class: "sim-shape" }));
        const A = [ang(pts[0], pts[1], pts[2]), ang(pts[1], pts[2], pts[0]), ang(pts[2], pts[0], pts[1])];
        const cls = ["sim-q1", "sim-q2", "sim-q3"];
        pts.forEach((p, i) => {
          const cx = (pts[0].x + pts[1].x + pts[2].x) / 3, cy = (pts[0].y + pts[1].y + pts[2].y) / 3;
          const dx = (cx - p.x), dy = (cy - p.y), L = Math.hypot(dx, dy) || 1;
          s.appendChild(text(p.x + dx / L * 46, p.y + dy / L * 46, `${num(A[i], 1)}°`, "sim-t bold"));
          const h = svg("circle", { cx: p.x, cy: p.y, r: 11, class: "sim-handle " + cls[i] });
          draggable(s, h, (pos) => {
            p.x = clamp(pos.x, 24, W - 24);
            p.y = clamp(pos.y, 24, H - 24);
            draw();
          });
          s.appendChild(h);
        });
        read.textContent = `${num(A[0], 1)}° + ${num(A[1], 1)}° + ${num(A[2], 1)}° = `
          + `${num(A[0] + A[1] + A[2], 0)}°  —  drag a corner as far as you like; the total never `
          + `changes. Largest angle sits opposite the longest side.`;
      }

      ctrls.appendChild(el("p", "sim-note", "Drag the three coloured corners."));
      button(ctrls, "Reset the triangle", () => {
        pts[0] = { x: 140, y: 250 }; pts[1] = { x: 520, y: 250 }; pts[2] = { x: 330, y: 70 };
        draw();
      });
      draw();
    }
  };

  // ---------- 13. Circle ----------
  defs.circleTool = {
    name: "Circle measurer",
    blurb: "Change the radius and watch area and circumference change with it.",
    mount(host, o) {
      const st = { r: 5, sector: 360 };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 320;

      function draw() {
        const s = frame(stage, W, H);
        const cx = W / 2, cy = H / 2, u = 20, R = st.r * u;
        s.appendChild(svg("circle", { cx, cy, r: R, class: "sim-shape" }));
        if (st.sector < 360) {
          const a = st.sector * Math.PI / 180;
          const x = cx + R * Math.cos(-Math.PI / 2 + a), y = cy + R * Math.sin(-Math.PI / 2 + a);
          s.appendChild(svg("path", {
            d: `M ${cx} ${cy} L ${cx} ${cy - R} A ${R} ${R} 0 ${st.sector > 180 ? 1 : 0} 1 ${x} ${y} Z`,
            class: "sim-q1" }));
        }
        s.appendChild(svg("line", { x1: cx, y1: cy, x2: cx + R, y2: cy, class: "sim-radius" }));
        s.appendChild(svg("circle", { cx, cy, r: 4, class: "sim-dot" }));
        s.appendChild(text(cx + R / 2, cy - 10, `r = ${st.r} cm`, "sim-t bold"));
        const area = Math.PI * st.r * st.r, circ = 2 * Math.PI * st.r;
        read.textContent = `Area = πr² = π × ${st.r}² = ${num(area, 1)} cm²   ·   `
          + `Circumference = 2πr = ${num(circ, 1)} cm`
          + (st.sector < 360
             ? `   ·   the ${st.sector}° sector is ${st.sector}/360 of that: `
               + `${num(area * st.sector / 360, 1)} cm².`
             : "   ·   area is in cm², length in cm.");
      }

      slider(ctrls, { label: "Radius (cm)", min: 1, max: 7, step: 0.5, value: st.r,
        on: (v) => { st.r = v; draw(); } });
      slider(ctrls, { label: "Sector angle", min: 30, max: 360, step: 15, value: st.sector,
        fmt: (v) => v + "°", on: (v) => { st.sector = v; draw(); } });
      draw();
    }
  };

  // ---------- 14. Sequence builder ----------
  defs.sequenceBuilder = {
    name: "Sequence builder",
    blurb: "Set the step and the start — the pattern, the terms and the nth term rule move together.",
    mount(host, o) {
      const st = { d: 3, first: 2 };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 250;
      const term = (n) => st.first + (n - 1) * st.d;

      function draw() {
        const s = frame(stage, W, H);
        const show = 6;
        for (let n = 1; n <= show; n++) {
          const x = 30 + (n - 1) * (W - 60) / show;
          const v = term(n);
          for (let k = 0; k < Math.min(Math.abs(v), 18); k++) {
            s.appendChild(svg("circle", {
              cx: x + 20 + (k % 3) * 20, cy: H - 70 - Math.floor(k / 3) * 20, r: 7,
              class: v < 0 ? "sim-dot-warn" : "sim-dot" }));
          }
          s.appendChild(text(x + 40, H - 34, `${num(v)}`, "sim-t big"));
          s.appendChild(text(x + 40, H - 14, `term ${n}`, "sim-t soft"));
        }
        const b = st.first - st.d;
        read.textContent = `Terms: ${[1, 2, 3, 4, 5, 6].map(term).map((v) => num(v)).join(", ")}, …   ·   `
          + `each one is ${st.d > 0 ? "+" : "−"}${num(Math.abs(st.d))} on the last, so the rule is `
          + `nth term = ${num(st.d)}n ${b < 0 ? "−" : "+"} ${num(Math.abs(b))}`
          + `   ·   the 10th term is ${num(term(10))}, the 100th is ${num(term(100))}.`;
      }

      slider(ctrls, { label: "First term", min: -10, max: 20, value: st.first,
        on: (v) => { st.first = v; draw(); } });
      slider(ctrls, { label: "Step (common difference)", min: -6, max: 9, value: st.d,
        on: (v) => { st.d = v; draw(); } });
      draw();
    }
  };

  // ---------- 15. Powers, roots and logarithms ----------
  defs.powerTool = {
    name: "Powers and logarithms",
    blurb: "One picture for three ways of saying the same thing: a power, a root and a logarithm.",
    mount(host, o) {
      const opts = o || {};
      const mode = pick(opts.mode, "power");        // power | standard | log | laws
      const st = { b: 2, n: 5, mant: 3.6, ex: 4, p: 3, q: 2 };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 260;
      const sup = (n) => String(n).replace("-", "⁻").replace(/[0-9]/g,
        (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d]);
      const sub = (n) => String(n).replace(/[0-9]/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[+d]);

      function draw() {
        const s = frame(stage, W, H);
        if (mode === "laws") {
          // Powers of the same base, stacked, so adding indices is visible.
          const rowY = [60, 130, 200];
          const labels = [
            { t: `${st.b}${sup(st.p)}`, n: st.p },
            { t: `${st.b}${sup(st.q)}`, n: st.q },
            { t: `${st.b}${sup(st.p)} × ${st.b}${sup(st.q)} = ${st.b}${sup(st.p + st.q)}`, n: st.p + st.q }
          ];
          labels.forEach((L, i) => {
            for (let k = 0; k < L.n; k++) {
              s.appendChild(svg("rect", { x: 150 + k * 46, y: rowY[i] - 22, width: 40, height: 40,
                class: i === 2 ? "sim-q1" : i === 0 ? "sim-q2" : "sim-q3" }));
              s.appendChild(text(170 + k * 46, rowY[i] + 5, String(st.b), "sim-t bold"));
            }
            s.appendChild(text(120, rowY[i] + 5, L.t, "sim-t bold", "end"));
          });
          read.textContent = `${st.b}${sup(st.p)} × ${st.b}${sup(st.q)} = ${st.b}${sup(st.p + st.q)} = `
            + `${Math.pow(st.b, st.p + st.q)}   ·   count the boxes: ${st.p} of them and ${st.q} `
            + `of them make ${st.p + st.q}. Same base — that is why the indices add.`;
          return;
        }
        if (mode === "standard") {
          const v = st.mant * Math.pow(10, st.ex);
          s.appendChild(text(W / 2, 90, `${num(st.mant)} × 10${sup(st.ex)}`, "sim-t huge"));
          s.appendChild(text(W / 2, 150, "=", "sim-t"));
          s.appendChild(text(W / 2, 200, v.toLocaleString("en-GB", { maximumFractionDigits: 10 }),
            "sim-t huge"));
          read.textContent = `The index says how far the decimal point moves: ${st.ex} place`
            + `${Math.abs(st.ex) === 1 ? "" : "s"} to the ${st.ex < 0 ? "left, making the number small"
            : "right, making the number big"}. In standard form the first part is always `
            + `between 1 and 10.`;
          return;
        }
        // power / log: a bar per power of the base, growing left to right.
        const maxN = 8;
        const top = Math.pow(st.b, Math.min(st.n, maxN));
        for (let k = 1; k <= Math.min(st.n, maxN); k++) {
          const v = Math.pow(st.b, k);
          const h = Math.max(6, 170 * v / top);
          s.appendChild(svg("rect", { x: 60 + (k - 1) * 68, y: 210 - h, width: 48, height: h,
            class: k === Math.min(st.n, maxN) ? "sim-q1" : "sim-q3" }));
          s.appendChild(text(84 + (k - 1) * 68, 228, `${st.b}${sup(k)}`, "sim-t soft"));
          if (h > 26) s.appendChild(text(84 + (k - 1) * 68, 206 - h + 20, String(v), "sim-t"));
        }
        const val = Math.pow(st.b, st.n);
        read.textContent = mode === "log"
          ? `${st.b}${sup(st.n)} = ${num(val)}, and the same fact written backwards is `
            + `log${sub(st.b)} ${num(val)} = ${st.n}. A logarithm answers the question `
            + `“what index?” — so an equation like ${st.b}ˣ = ${num(val)} is solved by taking logs.`
          : `${st.b}${sup(st.n)} = ${Array(Math.min(st.n, 6)).fill(st.b).join(" × ")}`
            + (st.n > 6 ? " × …" : "") + ` = ${num(val)}`
            + `   ·   and the root undoes it: the ${st.n === 2 ? "square" : st.n + "th"} root of `
            + `${num(val)} is ${st.b}.`;
      }

      if (mode === "standard") {
        slider(ctrls, { label: "First part (1 to 10)", min: 1, max: 9.9, step: 0.1, value: st.mant,
          on: (v) => { st.mant = v; draw(); } });
        slider(ctrls, { label: "Power of ten", min: -6, max: 9, value: st.ex,
          on: (v) => { st.ex = v; draw(); } });
      } else if (mode === "laws") {
        slider(ctrls, { label: "Base", min: 2, max: 6, value: st.b, on: (v) => { st.b = v; draw(); } });
        slider(ctrls, { label: "First index p", min: 1, max: 5, value: st.p, on: (v) => { st.p = v; draw(); } });
        slider(ctrls, { label: "Second index q", min: 1, max: 4, value: st.q, on: (v) => { st.q = v; draw(); } });
      } else {
        slider(ctrls, { label: "Base", min: 2, max: 10, value: st.b, on: (v) => { st.b = v; draw(); } });
        slider(ctrls, { label: "Index", min: 1, max: 8, value: st.n, on: (v) => { st.n = v; draw(); } });
      }
      draw();
    }
  };

  // ---------- 16. Data dots ----------
  defs.dataDots = {
    name: "Data dots",
    blurb: "Drag the values about — the mean moves with them, and so does the spread.",
    mount(host, o) {
      const opts = o || {};
      const sd = opts.mode === "sd";
      const vals = [4, 6, 7, 9, 14];
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 250, lo = 0, hi = 20, base = 170;
      const X = (v) => 40 + (v - lo) * (W - 80) / (hi - lo);

      function stats() {
        const n = vals.length;
        const mean = vals.reduce((a, b) => a + b, 0) / n;
        const varr = vals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n;
        return { n, mean, sd: Math.sqrt(varr) };
      }

      function draw() {
        const s = frame(stage, W, H);
        const { n, mean, sd: sdv } = stats();
        s.appendChild(svg("line", { x1: 40, y1: base, x2: W - 40, y2: base, class: "sim-axis" }));
        for (let v = lo; v <= hi; v += 2) {
          s.appendChild(svg("line", { x1: X(v), y1: base - 5, x2: X(v), y2: base + 5, class: "sim-axis" }));
          s.appendChild(text(X(v), base + 24, String(v), "sim-t soft"));
        }
        if (sd) {
          s.appendChild(svg("rect", { x: X(mean - sdv), y: 40, width: X(mean + sdv) - X(mean - sdv),
            height: base - 40, class: "sim-band" }));
        }
        s.appendChild(svg("line", { x1: X(mean), y1: 32, x2: X(mean), y2: base, class: "sim-mean" }));
        s.appendChild(text(X(mean), 24, `mean ${num(mean)}`, "sim-t bold"));
        vals.forEach((v, i) => {
          const cy = base - 26 - i * 24;
          if (sd) s.appendChild(svg("line", { x1: X(mean), y1: cy, x2: X(v), y2: cy, class: "sim-dev" }));
          const h = svg("circle", { cx: X(v), cy, r: 10, class: "sim-handle sim-q1" });
          draggable(s, h, (pos) => {
            vals[i] = clamp(Math.round((pos.x - 40) * (hi - lo) / (W - 80) + lo), lo, hi);
            draw();
          });
          s.appendChild(h);
          s.appendChild(text(X(v), cy + 4, String(v), "sim-t small"));
        });
        read.textContent = sd
          ? `Values ${vals.join(", ")}   ·   mean ${num(mean)}   ·   standard deviation ${num(sdv)} — `
            + `the shaded band is one deviation either side of the mean. Drag a value out to the edge `
            + `and watch the band widen.`
          : `${vals.join(" + ")} = ${vals.reduce((a, b) => a + b, 0)}, and ÷ ${n} gives a mean of `
            + `${num(mean)}. The mean need not be one of the values — it is the fair share.`;
      }

      const acts = el("div", "sim-ctrl");
      button(acts, "Add a value", () => { if (vals.length < 6) { vals.push(10); draw(); } });
      button(acts, "Remove one", () => { if (vals.length > 2) { vals.pop(); draw(); } });
      ctrls.appendChild(acts);
      ctrls.appendChild(el("p", "sim-note", "Drag any dot along the line."));
      draw();
    }
  };

  // ---------- 17. Pascal's triangle ----------
  defs.pascal = {
    name: "Pascal's triangle",
    blurb: "Click any number: it is a way of choosing, and it is a coefficient in an expansion.",
    mount(host, o) {
      const opts = o || {};
      const st = { rows: 6, n: 4, k: 2 };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 300;
      const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
      const P = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r *= (n - i); return r; };
      const sup = (n) => String(n).replace(/[0-9]/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d]);

      function draw() {
        const s = frame(stage, W, H);
        const gap = Math.min(56, (W - 80) / (st.rows + 1));
        for (let n = 0; n <= st.rows; n++) {
          for (let k = 0; k <= n; k++) {
            const x = W / 2 + (k - n / 2) * gap, y = 30 + n * (H - 60) / (st.rows + 1);
            const on = (n === st.n && k === st.k);
            const cell = svg("circle", { cx: x, cy: y, r: Math.min(19, gap / 2.6),
              class: on ? "sim-handle sim-q1" : "sim-handle sim-q4" });
            cell.style.cursor = "pointer";
            cell.addEventListener("click", () => { st.n = n; st.k = k; draw(); });
            s.appendChild(cell);
            s.appendChild(text(x, y + 5, String(C(n, k)), "sim-t small"));
          }
        }
        const c = C(st.n, st.k);
        read.textContent = opts.mode === "nPr"
          ? `Row ${st.n}, position ${st.k}:  choosing ${st.k} from ${st.n} without caring about order `
            + `is ${st.n}C${st.k} = ${c}.  If the order matters, each choice can be arranged `
            + `${st.k}! = ${P(st.k, st.k)} ways, so ${st.n}P${st.k} = ${P(st.n, st.k)}.`
          : `Row ${st.n}, position ${st.k}:  ${st.n}C${st.k} = ${c}.  In the expansion of (1 + x)${sup(st.n)} `
            + `the term in x${sup(st.k)} is ${c === 1 ? "" : c}x${sup(st.k)} — each row of the triangle `
            + `is one whole expansion.`;
      }

      slider(ctrls, { label: "Rows shown", min: 3, max: 9, value: st.rows,
        on: (v) => { st.rows = v; st.n = Math.min(st.n, v); st.k = Math.min(st.k, st.n); draw(); } });
      ctrls.appendChild(el("p", "sim-note", "Click a number in the triangle."));
      draw();
    }
  };

  // ---------- 18. Order of operations ----------
  defs.bidmas = {
    name: "Order of operations",
    blurb: "Step through an expression one operation at a time, in the order BIDMAS demands.",
    mount(host, o) {
      const PRESETS = ["3 + 4 × 5", "(3 + 4) × 5", "20 − 6 ÷ 2", "2 + 3^2 × 4",
        "(8 − 3) × (2 + 4)", "40 ÷ 2 + 3 × 5"];
      const st = { src: PRESETS[0], toks: [], done: false, note: "" };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 190;

      // A tiny tokeniser: numbers, the four operations, powers and brackets.
      // Nothing here is evaluated by the browser — the steps are done by hand,
      // which is the whole point of the simulator.
      function tokenise(src) {
        const clean = String(src).replace(/×/g, "*").replace(/÷/g, "/")
          .replace(/−/g, "-").replace(/²/g, "^2").replace(/[^0-9+\-*/^(). ]/g, "");
        const out = [];
        const re = /\d+(?:\.\d+)?|[+\-*/^()]/g;
        let m;
        while ((m = re.exec(clean))) out.push(m[0]);
        return out;
      }
      const pretty = (t) => t.replace("*", "×").replace("/", "÷").replace("-", "−");

      // One BIDMAS step: innermost brackets first, then powers, then × ÷ left
      // to right, then + − left to right.
      function step() {
        const t = st.toks;
        let lo = 0, hi = t.length;
        const open = t.lastIndexOf("(");
        if (open !== -1) {
          const close = t.indexOf(")", open);
          if (close === -1) return null;
          if (close === open + 2) {          // ( 7 ) — the bracket is finished
            t.splice(close, 1); t.splice(open, 1);
            return { from: open, note: "the bracket is done, so it comes away" };
          }
          lo = open + 1; hi = close;
        }
        const find = (ops) => {
          for (let i = lo; i < hi; i++) if (ops.indexOf(t[i]) !== -1 && i > lo) return i;
          return -1;
        };
        let i = -1, why = "";
        if ((i = find(["^"])) !== -1) why = "indices (powers) come before × ÷ + −";
        else if ((i = find(["*", "/"])) !== -1) why = "× and ÷ rank equally — work left to right";
        else if ((i = find(["+", "-"])) !== -1) why = "+ and − come last, left to right";
        if (i === -1) return null;
        const a = parseFloat(t[i - 1]), b = parseFloat(t[i + 1]);
        const v = t[i] === "^" ? Math.pow(a, b) : t[i] === "*" ? a * b
                : t[i] === "/" ? a / b : t[i] === "+" ? a + b : a - b;
        t.splice(i - 1, 3, String(round(v, 4)));
        return { from: i - 1, note: why };
      }

      function draw(hi) {
        const s = frame(stage, W, H);
        const parts = st.toks.map(pretty);
        const gap = Math.min(46, (W - 80) / Math.max(parts.length, 1));
        const x0 = W / 2 - (parts.length - 1) * gap / 2;
        parts.forEach((p, i) => {
          if (hi !== undefined && i === hi) {
            s.appendChild(svg("rect", { x: x0 + i * gap - gap / 2 + 3, y: 58, width: gap - 6,
              height: 46, class: "sim-q1" }));
          }
          s.appendChild(text(x0 + i * gap, 90, p, "sim-t huge"));
        });
        s.appendChild(text(W / 2, 148, st.done ? "done" : st.note || "press Step", "sim-t soft"));
        read.textContent = st.done
          ? `${st.src.replace(/\^/g, "^")} = ${st.toks[0]}   ·   the order is Brackets, Indices, `
            + `Division and Multiplication, then Addition and Subtraction.`
          : st.note || "Press “Do the next operation” and say aloud why that one goes first.";
      }

      function reset(src) {
        st.src = src;
        st.toks = tokenise(src);
        st.done = st.toks.length <= 1;
        st.note = "";
        draw();
      }

      choice(ctrls, { label: "Expression", value: PRESETS[0],
        options: PRESETS.map((p) => ({ value: p, label: pretty(p.replace(/\^2/g, "²")) })),
        on: (v) => reset(v) });
      const acts = el("div", "sim-ctrl");
      button(acts, "Do the next operation ▸", () => {
        if (st.done) return;
        const r = step();
        if (!r) { st.done = true; st.note = ""; draw(); return; }
        st.note = r.note;
        st.done = st.toks.length <= 1;
        draw(r.from);
      });
      button(acts, "Start again", () => reset(st.src));
      ctrls.appendChild(acts);
      reset(PRESETS[0]);
    }
  };


  // ---------- 19. Clock ----------
  defs.clockFace = {
    name: "Clock",
    blurb: "Set the hands, read the time three ways, and count on to find how long something lasts.",
    mount(host, o) {
      const st = { h: 3, m: 15, add: 0 };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 300;
      const two = (n) => String(n).padStart(2, "0");
      const words = (h, m) => {
        const NAMES = ["twelve", "one", "two", "three", "four", "five", "six", "seven",
          "eight", "nine", "ten", "eleven"];
        const nx = NAMES[(h + 1) % 12], now = NAMES[h % 12];
        if (m === 0) return `${now} o'clock`;
        if (m === 15) return `quarter past ${now}`;
        if (m === 30) return `half past ${now}`;
        if (m === 45) return `quarter to ${nx}`;
        return m < 30 ? `${m} minutes past ${now}` : `${60 - m} minutes to ${nx}`;
      };

      function draw() {
        const s = frame(stage, W, H);
        const cx = 160, cy = 150, R = 120;
        s.appendChild(svg("circle", { cx, cy, r: R, class: "sim-shape" }));
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
          s.appendChild(text(cx + Math.cos(a) * (R - 22), cy + Math.sin(a) * (R - 22) + 6,
            String(i === 0 ? 12 : i), "sim-t bold"));
          s.appendChild(svg("line", { x1: cx + Math.cos(a) * (R - 8), y1: cy + Math.sin(a) * (R - 8),
            x2: cx + Math.cos(a) * R, y2: cy + Math.sin(a) * R, class: "sim-axis" }));
        }
        const ma = (st.m / 60) * 2 * Math.PI - Math.PI / 2;
        const ha = ((st.h % 12) / 12 + st.m / 720) * 2 * Math.PI - Math.PI / 2;
        s.appendChild(svg("line", { x1: cx, y1: cy, x2: cx + Math.cos(ha) * (R * 0.55),
          y2: cy + Math.sin(ha) * (R * 0.55), class: "sim-beam" }));
        s.appendChild(svg("line", { x1: cx, y1: cy, x2: cx + Math.cos(ma) * (R * 0.85),
          y2: cy + Math.sin(ma) * (R * 0.85), class: "sim-radius" }));
        s.appendChild(svg("circle", { cx, cy, r: 6, class: "sim-dot" }));
        const total = (st.h * 60 + st.m + st.add) % 1440;
        const eh = Math.floor(total / 60), em = total % 60;
        s.appendChild(text(470, 96, `${two(st.h > 12 ? st.h - 12 : st.h || 12)}:${two(st.m)} `
          + `${st.h < 12 ? "a.m." : "p.m."}`, "sim-t huge"));
        s.appendChild(text(470, 146, `24-hour:  ${two(st.h)}:${two(st.m)}`, "sim-t big"));
        s.appendChild(text(470, 190, words(st.h, st.m), "sim-t"));
        if (st.add) s.appendChild(text(470, 232,
          `${st.add} min later → ${two(eh)}:${two(em)}`, "sim-t big"));
        read.textContent = `The hour hand is the short one — it has moved past ${st.h % 12 || 12}. `
          + `The long hand is minutes: ${st.m} of the 60 around the face.`
          + (st.add ? `  Counting on ${Math.floor(st.add / 60)} h ${st.add % 60} min from `
            + `${two(st.h)}:${two(st.m)} gives ${two(eh)}:${two(em)}.` : "");
      }

      slider(ctrls, { label: "Hour", min: 0, max: 23, value: st.h, on: (v) => { st.h = v; draw(); } });
      slider(ctrls, { label: "Minutes", min: 0, max: 55, step: 5, value: st.m,
        on: (v) => { st.m = v; draw(); } });
      slider(ctrls, { label: "Count on (min)", min: 0, max: 240, step: 5, value: st.add,
        on: (v) => { st.add = v; draw(); } });
      draw();
    }
  };

  // ---------- 20. Shape explorer ----------
  defs.shapeExplorer = {
    name: "Shape explorer",
    blurb: "Pick a shape and count what it is made of — sides, corners, faces and lines of symmetry.",
    mount(host, o) {
      const opts = o || {};
      const FLAT = {
        triangle: { n: 3, sym: 3, name: "Equilateral triangle" },
        square: { n: 4, sym: 4, name: "Square" },
        pentagon: { n: 5, sym: 5, name: "Regular pentagon" },
        hexagon: { n: 6, sym: 6, name: "Regular hexagon" },
        octagon: { n: 8, sym: 8, name: "Regular octagon" },
        rectangle: { n: 4, sym: 2, name: "Rectangle", rect: true },
        circle: { n: 0, sym: Infinity, name: "Circle" }
      };
      const SOLID = {
        cube: { f: 6, e: 12, v: 8, name: "Cube" },
        cuboid: { f: 6, e: 12, v: 8, name: "Cuboid" },
        prism: { f: 5, e: 9, v: 6, name: "Triangular prism" },
        pyramid: { f: 5, e: 8, v: 5, name: "Square-based pyramid" },
        cylinder: { f: 3, e: 2, v: 0, name: "Cylinder" },
        cone: { f: 2, e: 1, v: 1, name: "Cone" },
        sphere: { f: 1, e: 0, v: 0, name: "Sphere" }
      };
      const solidMode = opts.mode === "3d";
      const st = { key: solidMode ? "cube" : "hexagon", sym: true };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 300, cx = W / 2, cy = 150, R = 110;

      function drawFlat(s) {
        const f = FLAT[st.key];
        if (st.key === "circle") {
          s.appendChild(svg("circle", { cx, cy, r: R, class: "sim-shape" }));
        } else if (f.rect) {
          s.appendChild(svg("rect", { x: cx - 150, y: cy - 80, width: 300, height: 160, class: "sim-shape" }));
        } else {
          const pts = [];
          for (let i = 0; i < f.n; i++) {
            const a = (i / f.n) * 2 * Math.PI - Math.PI / 2;
            pts.push(`${cx + Math.cos(a) * R},${cy + Math.sin(a) * R}`);
          }
          s.appendChild(svg("polygon", { points: pts.join(" "), class: "sim-shape" }));
          if (st.sym) {
            for (let i = 0; i < f.n; i++) {
              const a = (i / f.n) * Math.PI - Math.PI / 2;
              s.appendChild(svg("line", { x1: cx - Math.cos(a) * R, y1: cy - Math.sin(a) * R,
                x2: cx + Math.cos(a) * R, y2: cy + Math.sin(a) * R, class: "sim-tri" }));
            }
          }
          pts.forEach((p) => {
            const [x, y] = p.split(",");
            s.appendChild(svg("circle", { cx: x, cy: y, r: 6, class: "sim-dot" }));
          });
        }
        if (f.rect && st.sym) {
          s.appendChild(svg("line", { x1: cx, y1: cy - 90, x2: cx, y2: cy + 90, class: "sim-tri" }));
          s.appendChild(svg("line", { x1: cx - 160, y1: cy, x2: cx + 160, y2: cy, class: "sim-tri" }));
        }
        read.textContent = st.key === "circle"
          ? "A circle has no straight sides and no corners — and every line through its centre "
            + "is a line of symmetry, so it has infinitely many."
          : `${f.name}: ${f.n} sides and ${f.n} corners (vertices), `
            + `${f.sym} line${f.sym === 1 ? "" : "s"} of symmetry, and it looks the same `
            + `${f.n} times in one full turn.`;
      }

      function drawSolid(s) {
        const g = SOLID[st.key], d = 44;
        const box = (w, h) => {
          const x = cx - w / 2, y = cy - h / 2;
          s.appendChild(svg("path", { d: `M ${x} ${y} h ${w} v ${h} h ${-w} Z`, class: "sim-shape" }));
          s.appendChild(svg("path", { d: `M ${x} ${y} l ${d} ${-d} h ${w} l ${-d} ${d}`, class: "sim-shape" }));
          s.appendChild(svg("path", { d: `M ${x + w} ${y} l ${d} ${-d} v ${h} l ${-d} ${d}`, class: "sim-shape" }));
        };
        if (st.key === "cube") box(150, 150);
        else if (st.key === "cuboid") box(220, 120);
        else if (st.key === "prism") {
          s.appendChild(svg("polygon", { points: `${cx - 90},${cy + 70} ${cx + 10},${cy + 70} ${cx - 40},${cy - 50}`,
            class: "sim-shape" }));
          s.appendChild(svg("polygon", { points: `${cx + 30},${cy + 40} ${cx + 130},${cy + 40} ${cx + 80},${cy - 80}`,
            class: "sim-shape" }));
          [[-90, 70, 30, 40], [10, 70, 130, 40], [-40, -50, 80, -80]].forEach(([a, b, c, e]) =>
            s.appendChild(svg("line", { x1: cx + a, y1: cy + b, x2: cx + c, y2: cy + e, class: "sim-axis" })));
        } else if (st.key === "pyramid") {
          s.appendChild(svg("polygon", { points: `${cx - 100},${cy + 70} ${cx + 100},${cy + 70} ${cx},${cy - 90}`,
            class: "sim-shape" }));
          s.appendChild(svg("path", { d: `M ${cx - 100} ${cy + 70} l 60 -34 h 200 l -60 34`, class: "sim-shape" }));
          s.appendChild(svg("line", { x1: cx, y1: cy - 90, x2: cx + 160, y2: cy + 36, class: "sim-axis" }));
        } else if (st.key === "cylinder") {
          s.appendChild(svg("rect", { x: cx - 70, y: cy - 70, width: 140, height: 140, class: "sim-shape" }));
          s.appendChild(svg("ellipse", { cx, cy: cy - 70, rx: 70, ry: 24, class: "sim-shape" }));
          s.appendChild(svg("ellipse", { cx, cy: cy + 70, rx: 70, ry: 24, class: "sim-shape" }));
        } else if (st.key === "cone") {
          s.appendChild(svg("polygon", { points: `${cx - 80},${cy + 60} ${cx + 80},${cy + 60} ${cx},${cy - 90}`,
            class: "sim-shape" }));
          s.appendChild(svg("ellipse", { cx, cy: cy + 60, rx: 80, ry: 26, class: "sim-shape" }));
        } else {
          s.appendChild(svg("circle", { cx, cy, r: 100, class: "sim-shape" }));
          s.appendChild(svg("ellipse", { cx, cy, rx: 100, ry: 30, class: "sim-tri" }));
        }
        read.textContent = `${g.name}: ${g.f} face${g.f === 1 ? "" : "s"}, ${g.e} edge`
          + `${g.e === 1 ? "" : "s"}, ${g.v} vertex${g.v === 1 ? "" : "es"} (corners). `
          + (g.v && g.e ? `Check Euler: faces + vertices − edges = ${g.f} + ${g.v} − ${g.e} = ${g.f + g.v - g.e}.`
             : "Curved surfaces are not flat faces, which is why the count is small.");
      }

      function draw() {
        const s = frame(stage, W, H);
        if (solidMode) drawSolid(s); else drawFlat(s);
      }

      const table = solidMode ? SOLID : FLAT;
      choice(ctrls, { label: "Shape", value: st.key,
        options: Object.keys(table).map((k) => ({ value: k, label: table[k].name })),
        on: (v) => { st.key = v; draw(); } });
      if (!solidMode) {
        const row = el("div", "sim-ctrl");
        button(row, "Show / hide symmetry lines", () => { st.sym = !st.sym; draw(); });
        ctrls.appendChild(row);
      }
      draw();
    }
  };

  // ---------- 21. Transformations ----------
  defs.transformGrid = {
    name: "Transformations",
    blurb: "Move, flip, turn or enlarge a shape and read what happens to its coordinates.",
    mount(host, o) {
      const opts = o || {};
      const st = { kind: pick(opts.kind, "translate"), dx: 3, dy: 2, mirror: "y", turn: 90, k: 2 };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 380, xr = [-8, 8], yr = [-6, 6];
      const SHAPE = [[1, 1], [4, 1], [1, 3]];

      const move = (p) => {
        const [x, y] = p;
        if (st.kind === "translate") return [x + st.dx, y + st.dy];
        if (st.kind === "reflect") return st.mirror === "y" ? [-x, y]
          : st.mirror === "x" ? [x, -y] : [y, x];
        if (st.kind === "rotate") {
          const a = st.turn * Math.PI / 180;
          return [Math.round(x * Math.cos(a) - y * Math.sin(a)),
                  Math.round(x * Math.sin(a) + y * Math.cos(a))];
        }
        return [x * st.k, y * st.k];
      };

      function draw() {
        const s = frame(stage, W, H);
        const { X, Y } = axes(s, W, H, xr, yr);
        if (st.kind === "reflect") {
          const m = st.mirror;
          s.appendChild(svg("line", {
            x1: m === "y" ? X(0) : X(xr[0]), y1: m === "y" ? Y(yr[0]) : m === "x" ? Y(0) : Y(xr[0]),
            x2: m === "y" ? X(0) : X(xr[1]), y2: m === "y" ? Y(yr[1]) : m === "x" ? Y(0) : Y(xr[1]),
            class: "sim-mean" }));
        }
        const poly = (pts, cls) => svg("polygon", {
          points: pts.map((p) => `${X(p[0])},${Y(p[1])}`).join(" "), class: cls });
        s.appendChild(poly(SHAPE, "sim-q4"));
        const img = SHAPE.map(move);
        s.appendChild(poly(img, "sim-q1"));
        img.forEach((p) => s.appendChild(svg("circle", { cx: X(p[0]), cy: Y(p[1]), r: 5, class: "sim-dot" })));
        const fmt = (pts) => pts.map((p) => `(${p[0]}, ${p[1]})`).join("  ");
        const how = st.kind === "translate"
            ? `translated ${st.dx} right and ${st.dy} up — vector (${st.dx}, ${st.dy})`
          : st.kind === "reflect"
            ? `reflected in ${st.mirror === "y" ? "the y-axis (x → −x)"
              : st.mirror === "x" ? "the x-axis (y → −y)" : "the line y = x (x and y swap)"}`
          : st.kind === "rotate" ? `rotated ${st.turn}° anticlockwise about the origin`
          : `enlarged by scale factor ${st.k} from the origin`;
        read.textContent = `Original ${fmt(SHAPE)}  →  image ${fmt(img)}   ·   the shape was ${how}.`
          + (st.kind === "enlarge"
             ? `  Lengths are ${st.k} times bigger, so the area is ${st.k * st.k} times bigger — `
               + `the shape is similar, not congruent.`
             : "  Every length and angle is unchanged, so the image is congruent to the original.");
      }

      choice(ctrls, { label: "Transformation", value: st.kind,
        options: [{ value: "translate", label: "Translate (slide)" },
                  { value: "reflect", label: "Reflect (flip)" },
                  { value: "rotate", label: "Rotate (turn)" },
                  { value: "enlarge", label: "Enlarge" }],
        on: (v) => { st.kind = v; rebuild(); } });
      const extra = el("div", "sim-ctrls");
      ctrls.appendChild(extra);

      function rebuild() {
        clear(extra);
        if (st.kind === "translate") {
          slider(extra, { label: "Right / left", min: -6, max: 6, value: st.dx, on: (v) => { st.dx = v; draw(); } });
          slider(extra, { label: "Up / down", min: -5, max: 5, value: st.dy, on: (v) => { st.dy = v; draw(); } });
        } else if (st.kind === "reflect") {
          choice(extra, { label: "Mirror line", value: st.mirror,
            options: [{ value: "y", label: "the y-axis" }, { value: "x", label: "the x-axis" },
                      { value: "yx", label: "the line y = x" }],
            on: (v) => { st.mirror = v; draw(); } });
        } else if (st.kind === "rotate") {
          choice(extra, { label: "Turn", value: String(st.turn),
            options: [{ value: "90", label: "90° anticlockwise" }, { value: "180", label: "180°" },
                      { value: "270", label: "270° anticlockwise" }],
            on: (v) => { st.turn = +v; draw(); } });
        } else {
          slider(extra, { label: "Scale factor", min: 1, max: 3, value: st.k, on: (v) => { st.k = v; draw(); } });
        }
        draw();
      }
      rebuild();
    }
  };

  // ---------- 22. Measures and units ----------
  defs.measureConvert = {
    name: "Measures and units",
    blurb: "One length, mass or capacity shown in every unit at once — the decimal point does the work.",
    mount(host, o) {
      const opts = o || {};
      const SETS = {
        length: { name: "Length", units: [["mm", 1], ["cm", 10], ["m", 1000], ["km", 1000000]] },
        mass: { name: "Mass", units: [["g", 1], ["kg", 1000], ["tonne", 1000000]] },
        capacity: { name: "Capacity", units: [["ml", 1], ["litre", 1000]] }
      };
      const st = { set: pick(opts.set, "length"), unit: 1, v: 250 };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 230;

      function draw() {
        const S = SETS[st.set];
        const u = S.units[Math.min(st.unit, S.units.length - 1)];
        const base = st.v * u[1];
        const s = frame(stage, W, H);
        S.units.forEach((un, i) => {
          const val = base / un[1];
          const y = 26 + i * 46;
          s.appendChild(text(60, y + 6, un[0], "sim-t bold", "end"));
          const w = clamp(Math.log10(val + 1) / 6 * (W - 200), 4, W - 200);
          s.appendChild(svg("rect", { x: 76, y: y - 14, width: w, height: 26,
            class: un[0] === u[0] ? "sim-q1" : "sim-q4" }));
          s.appendChild(text(86 + w, y + 6,
            val >= 1000000 ? val.toExponential(2) : String(round(val, 4)), "sim-t", "start"));
        });
        const steps = S.units.map((un) => un[0]).join(" → ");
        read.textContent = `${num(st.v)} ${u[0]} written in every unit above.  Each step along `
          + `${steps} multiplies or divides by ${st.set === "length" ? "10, 100 or 1000" : "1000"} — `
          + `the digits never change, only where the decimal point sits.`;
      }

      choice(ctrls, { label: "Measuring", value: st.set,
        options: Object.keys(SETS).map((k) => ({ value: k, label: SETS[k].name })),
        on: (v) => { st.set = v; st.unit = 0; rebuild(); } });
      const extra = el("div", "sim-ctrls");
      ctrls.appendChild(extra);
      function rebuild() {
        clear(extra);
        const S = SETS[st.set];
        choice(extra, { label: "Given in", value: String(st.unit),
          options: S.units.map((u, i) => ({ value: String(i), label: u[0] })),
          on: (v) => { st.unit = +v; draw(); } });
        slider(extra, { label: "Amount", min: 1, max: 1000, value: st.v, on: (v) => { st.v = v; draw(); } });
        draw();
      }
      rebuild();
    }
  };

  // ---------- 23. Tally, table and chart ----------
  defs.tallyChart = {
    name: "Tally, table and chart",
    blurb: "Collect the counts once, then show them as tallies, a bar chart or a pictogram.",
    mount(host, o) {
      const cats = ["Red", "Blue", "Green", "Yellow"];
      const st = { n: [7, 4, 9, 2], view: "bar", per: 2 };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 280;

      function draw() {
        const s = frame(stage, W, H);
        const max = Math.max.apply(null, st.n.concat([1]));
        const cw = (W - 80) / cats.length;
        cats.forEach((c, i) => {
          const x = 60 + i * cw, v = st.n[i];
          if (st.view === "bar") {
            const h = (H - 90) * v / max;
            s.appendChild(svg("rect", { x: x + 14, y: H - 50 - h, width: cw - 34, height: h,
              class: "sim-q1" }));
            s.appendChild(text(x + cw / 2 - 3, H - 56 - h, String(v), "sim-t bold"));
          } else if (st.view === "picto") {
            for (let k = 0; k < Math.floor(v / st.per); k++)
              s.appendChild(svg("circle", { cx: x + cw / 2 - 3, cy: H - 66 - k * 26, r: 10, class: "sim-dot" }));
            if (v % st.per)
              s.appendChild(svg("path", { d: `M ${x + cw / 2 - 3} ${H - 66 - Math.floor(v / st.per) * 26} `
                + `m -10 0 a 10 10 0 0 1 20 0 z`, class: "sim-fill" }));
          } else {
            for (let k = 0; k < v; k++) {
              const grp = Math.floor(k / 5), inGrp = k % 5;
              const bx = x + 14 + grp * 34;
              if (inGrp < 4) s.appendChild(svg("line", { x1: bx + inGrp * 7, y1: H - 110,
                x2: bx + inGrp * 7, y2: H - 70, class: "sim-beam" }));
              else s.appendChild(svg("line", { x1: bx - 4, y1: H - 70, x2: bx + 26, y2: H - 110,
                class: "sim-beam" }));
            }
          }
          s.appendChild(text(x + cw / 2 - 3, H - 24, c, "sim-t bold"));
        });
        const total = st.n.reduce((a, b) => a + b, 0);
        const most = cats[st.n.indexOf(max)];
        read.textContent = `Total counted: ${total}   ·   most common (the mode): ${most} with ${max}`
          + `   ·   ${most} has ${max - Math.min.apply(null, st.n)} more than the least common.`
          + (st.view === "picto" ? `   ·   one circle stands for ${st.per}, so a half circle is 1.` : "");
      }

      cats.forEach((c, i) => {
        const row = el("div", "sim-ctrl");
        row.appendChild(el("span", "sim-lab", c));
        button(row, "−", () => { st.n[i] = Math.max(0, st.n[i] - 1); draw(); });
        button(row, "+", () => { st.n[i] = Math.min(20, st.n[i] + 1); draw(); });
        ctrls.appendChild(row);
      });
      choice(ctrls, { label: "Show as", value: st.view,
        options: [{ value: "bar", label: "Bar chart" }, { value: "picto", label: "Pictogram" },
                  { value: "tally", label: "Tally marks" }],
        on: (v) => { st.view = v; draw(); } });
      draw();
    }
  };

  // ---------- 24. Probability spinner ----------
  defs.spinner = {
    name: "Probability spinner",
    blurb: "Spin it again and again — the results creep towards the probability you predicted.",
    mount(host, o) {
      const st = { n: 4, spins: 0, hits: [], angle: 0, last: null };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 300;
      const WORDS = ["impossible", "unlikely", "an even chance", "likely", "certain"];
      const reset = () => { st.hits = Array(st.n).fill(0); st.spins = 0; st.last = null; };
      reset();

      function draw() {
        const s = frame(stage, W, H);
        const cx = 170, cy = 150, R = 120;
        for (let i = 0; i < st.n; i++) {
          const a0 = (i / st.n) * 2 * Math.PI - Math.PI / 2 + st.angle;
          const a1 = ((i + 1) / st.n) * 2 * Math.PI - Math.PI / 2 + st.angle;
          s.appendChild(svg("path", {
            d: `M ${cx} ${cy} L ${cx + Math.cos(a0) * R} ${cy + Math.sin(a0) * R} `
              + `A ${R} ${R} 0 ${(a1 - a0) > Math.PI ? 1 : 0} 1 ${cx + Math.cos(a1) * R} ${cy + Math.sin(a1) * R} Z`,
            class: ["sim-q1", "sim-q2", "sim-q3", "sim-q4"][i % 4] }));
          const am = (a0 + a1) / 2;
          s.appendChild(text(cx + Math.cos(am) * R * 0.62, cy + Math.sin(am) * R * 0.62 + 5,
            String(i + 1), "sim-t bold"));
        }
        s.appendChild(svg("polygon", { points: `${cx},${cy - R - 16} ${cx - 12},${cy - R + 10} ${cx + 12},${cy - R + 10}`,
          class: "sim-fill" }));
        // Results so far, as a small bar chart.
        for (let i = 0; i < st.n; i++) {
          const h = st.spins ? 150 * st.hits[i] / Math.max.apply(null, st.hits.concat([1])) : 0;
          s.appendChild(svg("rect", { x: 340 + i * 60, y: 220 - h, width: 40, height: h, class: "sim-q1" }));
          s.appendChild(text(360 + i * 60, 240, String(i + 1), "sim-t soft"));
          s.appendChild(text(360 + i * 60, 214 - h, String(st.hits[i]), "sim-t small"));
        }
        const p = 1 / st.n;
        const word = WORDS[clamp(Math.round(p * 4), 0, 4)];
        read.textContent = `Each section is one of ${st.n}, so landing on a chosen number has `
          + `probability 1/${st.n} = ${num(p, 3)} — in words, ${word}.`
          + (st.spins ? `  After ${st.spins} spins the relative frequency of `
            + `${st.last} is ${st.hits[st.last - 1]}/${st.spins} = `
            + `${num(st.hits[st.last - 1] / st.spins, 3)}.` : "  Spin it to test that.");
      }

      slider(ctrls, { label: "Sections", min: 2, max: 8, value: st.n,
        on: (v) => { st.n = v; st.angle = 0; reset(); draw(); } });
      const acts = el("div", "sim-ctrl");
      const spin = (times) => {
        for (let i = 0; i < times; i++) {
          const k = Math.floor(Math.random() * st.n);
          st.hits[k]++; st.spins++; st.last = k + 1;
        }
        st.angle = Math.random() * 2 * Math.PI;
        draw();
      };
      button(acts, "Spin once", () => spin(1));
      button(acts, "Spin 50 times", () => spin(50));
      button(acts, "Start again", () => { reset(); draw(); });
      ctrls.appendChild(acts);
      draw();
    }
  };

  // ---------- 25. Function machine ----------
  defs.functionMachine = {
    name: "Function machine",
    blurb: "Feed a number in, watch each step act on it, and read the rule that came out.",
    mount(host, o) {
      const st = { x: 3, op1: "*", a: 2, op2: "+", b: 5 };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 250;
      const apply = (v, op, k) => op === "*" ? v * k : op === "/" ? v / k
        : op === "+" ? v + k : op === "-" ? v - k : Math.pow(v, k);
      const sign = { "*": "×", "/": "÷", "+": "+", "-": "−", "^": "to the power" };

      function draw() {
        const s = frame(stage, W, H);
        const mid = apply(st.x, st.op1, st.a), out = apply(mid, st.op2, st.b);
        const boxes = [
          { x: 40, label: "in", val: num(st.x) },
          { x: 210, label: `${sign[st.op1]} ${st.a}`, val: num(mid), machine: true },
          { x: 380, label: `${sign[st.op2]} ${st.b}`, val: num(out), machine: true },
          { x: 550, label: "out", val: num(out) }
        ];
        boxes.forEach((b, i) => {
          s.appendChild(svg("rect", { x: b.x, y: 70, width: 90, height: 70,
            class: b.machine ? "sim-q3" : "sim-q1" }));
          s.appendChild(text(b.x + 45, 60, b.label, "sim-t bold"));
          s.appendChild(text(b.x + 45, 112, b.machine ? "" : b.val, "sim-t huge"));
          if (b.machine) s.appendChild(text(b.x + 45, 112, b.label, "sim-t big"));
          if (i < boxes.length - 1) {
            s.appendChild(svg("line", { x1: b.x + 90, y1: 105, x2: boxes[i + 1].x, y2: 105, class: "sim-axis" }));
            s.appendChild(text((b.x + 90 + boxes[i + 1].x) / 2, 96,
              i === 0 ? num(st.x) : num(i === 1 ? mid : out), "sim-t"));
          }
        });
        const rule = st.op1 === "*" && st.op2 === "+" ? `y = ${st.a}x + ${st.b}`
          : `y = (x ${sign[st.op1]} ${st.a}) ${sign[st.op2]} ${st.b}`;
        s.appendChild(text(W / 2, 190, rule, "sim-t huge"));
        const inverse = st.op1 === "*" && st.op2 === "+"
          ? `x = (y − ${st.b}) ÷ ${st.a}` : "undo the last step first, then the one before it";
        read.textContent = `Put in ${num(st.x)} → ${sign[st.op1]} ${st.a} gives ${num(mid)} → `
          + `${sign[st.op2]} ${st.b} gives ${num(out)}.   The rule is ${rule}, and to run the `
          + `machine backwards: ${inverse}.`;
      }

      slider(ctrls, { label: "Input", min: -10, max: 10, value: st.x, on: (v) => { st.x = v; draw(); } });
      choice(ctrls, { label: "First step", value: st.op1,
        options: [{ value: "*", label: "multiply by" }, { value: "/", label: "divide by" },
                  { value: "+", label: "add" }, { value: "-", label: "subtract" }],
        on: (v) => { st.op1 = v; draw(); } });
      slider(ctrls, { label: "by", min: 1, max: 10, value: st.a, on: (v) => { st.a = v; draw(); } });
      choice(ctrls, { label: "Second step", value: st.op2,
        options: [{ value: "+", label: "add" }, { value: "-", label: "subtract" },
                  { value: "*", label: "multiply by" }, { value: "^", label: "raise to power" }],
        on: (v) => { st.op2 = v; draw(); } });
      slider(ctrls, { label: "by", min: 1, max: 10, value: st.b, on: (v) => { st.b = v; draw(); } });
      draw();
    }
  };

  // ---------- 26. Distributions ----------
  defs.distribution = {
    name: "Distribution explorer",
    blurb: "Shape the distribution, then shade the tail you are testing and read the probability.",
    mount(host, o) {
      const opts = o || {};
      const st = { kind: pick(opts.kind, "normal"), mean: 50, sd: 10, cut: 65,
                   n: 10, p: 0.4, lam: 3 };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 320;
      // Abramowitz & Stegun 7.1.26 — plenty accurate for a classroom.
      function erf(x) {
        const sgn = x < 0 ? -1 : 1;
        x = Math.abs(x);
        const t = 1 / (1 + 0.3275911 * x);
        const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t
          + 0.254829592) * t * Math.exp(-x * x);
        return sgn * y;
      }
      const phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
      const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; };

      function draw() {
        const s = frame(stage, W, H);
        if (st.kind === "normal") {
          const xr = [st.mean - 4 * st.sd, st.mean + 4 * st.sd], top = 1 / (st.sd * Math.sqrt(2 * Math.PI));
          const yr = [0, top * 1.15];
          const { X, Y } = axes(s, W, H, xr, yr);
          const f = (x) => Math.exp(-0.5 * Math.pow((x - st.mean) / st.sd, 2)) / (st.sd * Math.sqrt(2 * Math.PI));
          for (let i = 0; i < 90; i++) {
            const x = st.cut + (xr[1] - st.cut) * i / 90;
            const w = Math.max(1, (X(xr[1]) - X(st.cut)) / 90 + 1);
            s.appendChild(svg("rect", { x: X(x), y: Y(f(x)), width: w,
              height: Math.max(0, Y(0) - Y(f(x))), class: "sim-strip" }));
          }
          plot(s, f, xr, yr, X, Y, "sim-curve");
          s.appendChild(svg("line", { x1: X(st.mean), y1: Y(0), x2: X(st.mean), y2: Y(top), class: "sim-mean" }));
          s.appendChild(svg("line", { x1: X(st.cut), y1: Y(0), x2: X(st.cut), y2: Y(top * 0.9), class: "sim-radius" }));
          const z = (st.cut - st.mean) / st.sd, tail = 1 - phi(z);
          read.textContent = `Mean ${st.mean}, standard deviation ${st.sd}.  At x = ${st.cut} the `
            + `z-score is (${st.cut} − ${st.mean}) ÷ ${st.sd} = ${num(z)}, so P(X > ${st.cut}) = `
            + `${num(tail, 4)} and P(X < ${st.cut}) = ${num(1 - tail, 4)}. `
            + `About 95% of the data lies between ${num(st.mean - 2 * st.sd)} and ${num(st.mean + 2 * st.sd)}.`;
        } else {
          const isBin = st.kind === "binomial";
          const kmax = isBin ? st.n : Math.max(8, Math.ceil(st.lam * 3));
          const prob = (k) => isBin
            ? choose(st.n, k) * Math.pow(st.p, k) * Math.pow(1 - st.p, st.n - k)
            : Math.exp(-st.lam) * Math.pow(st.lam, k) / (function f(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; })(k);
          let top = 0;
          for (let k = 0; k <= kmax; k++) top = Math.max(top, prob(k));
          const bw = (W - 90) / (kmax + 1);
          for (let k = 0; k <= kmax; k++) {
            const h = (H - 80) * prob(k) / top;
            s.appendChild(svg("rect", { x: 60 + k * bw + 3, y: H - 46 - h, width: bw - 6, height: h,
              class: k * 1 >= (isBin ? st.n * st.p : st.lam) ? "sim-q1" : "sim-q4" }));
            if (bw > 22) s.appendChild(text(60 + k * bw + bw / 2, H - 26, String(k), "sim-t soft"));
          }
          read.textContent = isBin
            ? `Binomial: ${st.n} trials, each succeeding with probability ${num(st.p, 2)}. `
              + `Mean = np = ${num(st.n * st.p)}, variance = np(1 − p) = ${num(st.n * st.p * (1 - st.p))}. `
              + `P(X = ${Math.round(st.n * st.p)}) = ${num(prob(Math.round(st.n * st.p)), 4)}.`
            : `Poisson with mean λ = ${num(st.lam)}: the mean and the variance are both λ. `
              + `P(X = 0) = ${num(prob(0), 4)}, P(X = 1) = ${num(prob(1), 4)}. `
              + `As λ grows the bars take the familiar bell shape.`;
        }
      }

      choice(ctrls, { label: "Distribution", value: st.kind,
        options: [{ value: "normal", label: "Normal" }, { value: "binomial", label: "Binomial" },
                  { value: "poisson", label: "Poisson" }],
        on: (v) => { st.kind = v; rebuild(); } });
      const extra = el("div", "sim-ctrls");
      ctrls.appendChild(extra);
      function rebuild() {
        clear(extra);
        if (st.kind === "normal") {
          slider(extra, { label: "Mean", min: 20, max: 80, value: st.mean, on: (v) => { st.mean = v; draw(); } });
          slider(extra, { label: "Standard deviation", min: 2, max: 20, value: st.sd,
            on: (v) => { st.sd = v; draw(); } });
          slider(extra, { label: "Shade above", min: 0, max: 100, value: st.cut,
            on: (v) => { st.cut = v; draw(); } });
        } else if (st.kind === "binomial") {
          slider(extra, { label: "Trials n", min: 1, max: 30, value: st.n, on: (v) => { st.n = v; draw(); } });
          slider(extra, { label: "p", min: 0.05, max: 0.95, step: 0.05, value: st.p,
            on: (v) => { st.p = v; draw(); } });
        } else {
          slider(extra, { label: "Mean λ", min: 0.5, max: 12, step: 0.5, value: st.lam,
            on: (v) => { st.lam = v; draw(); } });
        }
        draw();
      }
      rebuild();
    }
  };

  // ---------- 27. Vectors ----------
  defs.vectorTool = {
    name: "Vectors",
    blurb: "Two vectors on a grid: add them nose to tail and measure how long the result is.",
    mount(host, o) {
      const st = { ax: 4, ay: 2, bx: -1, by: 3, show: "both" };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 380, xr = [-8, 8], yr = [-6, 6];

      function arrow(s, X, Y, x0, y0, x1, y1, cls) {
        s.appendChild(svg("line", { x1: X(x0), y1: Y(y0), x2: X(x1), y2: Y(y1), class: cls }));
        const a = Math.atan2(Y(y1) - Y(y0), X(x1) - X(x0));
        s.appendChild(svg("polygon", {
          points: `${X(x1)},${Y(y1)} ${X(x1) - 14 * Math.cos(a - 0.4)},${Y(y1) - 14 * Math.sin(a - 0.4)} `
            + `${X(x1) - 14 * Math.cos(a + 0.4)},${Y(y1) - 14 * Math.sin(a + 0.4)}`, class: "sim-fill" }));
      }

      function draw() {
        const s = frame(stage, W, H);
        const { X, Y } = axes(s, W, H, xr, yr);
        arrow(s, X, Y, 0, 0, st.ax, st.ay, "sim-line-a");
        s.appendChild(text(X(st.ax / 2) + 14, Y(st.ay / 2) - 8, "a", "sim-t bold"));
        if (st.show !== "a") {
          arrow(s, X, Y, st.ax, st.ay, st.ax + st.bx, st.ay + st.by, "sim-line-b");
          s.appendChild(text(X(st.ax + st.bx / 2) + 14, Y(st.ay + st.by / 2), "b", "sim-t bold"));
          arrow(s, X, Y, 0, 0, st.ax + st.bx, st.ay + st.by, "sim-tri");
        }
        const ma = Math.hypot(st.ax, st.ay), mr = Math.hypot(st.ax + st.bx, st.ay + st.by);
        read.textContent = `a = (${st.ax}, ${st.ay}), so |a| = √(${st.ax}² + ${st.ay}²) = ${num(ma, 3)}.`
          + (st.show !== "a"
             ? `  b = (${st.bx}, ${st.by}), and nose to tail a + b = (${st.ax + st.bx}, ${st.ay + st.by}) `
               + `with magnitude ${num(mr, 3)} — add the components, not the lengths.` : "");
      }

      slider(ctrls, { label: "a — across", min: -6, max: 6, value: st.ax, on: (v) => { st.ax = v; draw(); } });
      slider(ctrls, { label: "a — up", min: -5, max: 5, value: st.ay, on: (v) => { st.ay = v; draw(); } });
      slider(ctrls, { label: "b — across", min: -6, max: 6, value: st.bx, on: (v) => { st.bx = v; draw(); } });
      slider(ctrls, { label: "b — up", min: -5, max: 5, value: st.by, on: (v) => { st.by = v; draw(); } });
      choice(ctrls, { label: "Show", value: st.show,
        options: [{ value: "both", label: "a, b and a + b" }, { value: "a", label: "just a" }],
        on: (v) => { st.show = v; draw(); } });
      draw();
    }
  };

  // ---------- 28. Venn and Carroll sorting ----------
  defs.vennSort = {
    name: "Sorting: Venn and Carroll",
    blurb: "Sort the numbers by two rules and see which land in the overlap.",
    mount(host, o) {
      const RULES = {
        even: { label: "even", test: (n) => n % 2 === 0 },
        mult3: { label: "a multiple of 3", test: (n) => n % 3 === 0 },
        mult5: { label: "a multiple of 5", test: (n) => n % 5 === 0 },
        over10: { label: "greater than 10", test: (n) => n > 10 },
        square: { label: "a square number", test: (n) => Number.isInteger(Math.sqrt(n)) }
      };
      const st = { a: "even", b: "mult3", view: "venn" };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 320;
      const NUMS = Array.from({ length: 20 }, (_, i) => i + 1);

      function draw() {
        const s = frame(stage, W, H);
        const A = RULES[st.a], B = RULES[st.b];
        const inA = NUMS.filter((n) => A.test(n) && !B.test(n));
        const inB = NUMS.filter((n) => B.test(n) && !A.test(n));
        const both = NUMS.filter((n) => A.test(n) && B.test(n));
        const none = NUMS.filter((n) => !A.test(n) && !B.test(n));
        const place = (list, x, y, w) => list.forEach((n, i) => {
          s.appendChild(text(x + (i % w) * 30, y + Math.floor(i / w) * 24, String(n), "sim-t"));
        });
        if (st.view === "venn") {
          s.appendChild(svg("circle", { cx: 250, cy: 150, r: 120, class: "sim-q1" }));
          s.appendChild(svg("circle", { cx: 400, cy: 150, r: 120, class: "sim-q2" }));
          s.appendChild(text(180, 30, A.label, "sim-t bold"));
          s.appendChild(text(470, 30, B.label, "sim-t bold"));
          place(inA, 150, 130, 3);
          place(both, 300, 130, 2);
          place(inB, 440, 130, 3);
          place(none, 40, 300, 8);
          s.appendChild(text(40, 278, "neither:", "sim-t soft", "start"));
        } else {
          const cols = [[both, inA], [inB, none]];
          for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) {
              s.appendChild(svg("rect", { x: 150 + c * 230, y: 60 + r * 110, width: 220, height: 105,
                class: c === 0 && r === 0 ? "sim-q1" : "sim-q4" }));
              place(cols[c][r], 170 + c * 230, 95 + r * 110, 6);
            }
          }
          s.appendChild(text(260, 46, B.label, "sim-t bold"));
          s.appendChild(text(490, 46, "not " + B.label, "sim-t bold"));
          s.appendChild(text(140, 115, A.label, "sim-t bold", "end"));
          s.appendChild(text(140, 225, "not " + A.label, "sim-t bold", "end"));
        }
        read.textContent = `${both.length} of the twenty numbers are ${A.label} AND ${B.label} `
          + `(the overlap, written A ∩ B): ${both.join(", ") || "none"}.  `
          + `${inA.length + inB.length + both.length} are in one set or the other (A ∪ B), and `
          + `${none.length} are in neither.`;
      }

      choice(ctrls, { label: "First rule", value: st.a,
        options: Object.keys(RULES).map((k) => ({ value: k, label: RULES[k].label })),
        on: (v) => { st.a = v; draw(); } });
      choice(ctrls, { label: "Second rule", value: st.b,
        options: Object.keys(RULES).map((k) => ({ value: k, label: RULES[k].label })),
        on: (v) => { st.b = v; draw(); } });
      choice(ctrls, { label: "Show as", value: st.view,
        options: [{ value: "venn", label: "Venn diagram" }, { value: "carroll", label: "Carroll diagram" }],
        on: (v) => { st.view = v; draw(); } });
      draw();
    }
  };

  // ---------- 29. Position and direction ----------
  defs.directionGrid = {
    name: "Position and direction",
    blurb: "Steer the marker around the grid and read off where it has got to.",
    mount(host, o) {
      const st = { x: 0, y: 0, trail: [[0, 0]] };
      const { ctrls, stage, read } = shell(host);
      const W = 660, H = 380, xr = [-5, 5], yr = [-4, 4];

      function draw() {
        const s = frame(stage, W, H);
        const { X, Y } = axes(s, W, H, xr, yr);
        for (let i = 1; i < st.trail.length; i++) {
          const p = st.trail[i - 1], q = st.trail[i];
          s.appendChild(svg("line", { x1: X(p[0]), y1: Y(p[1]), x2: X(q[0]), y2: Y(q[1]), class: "sim-tri" }));
        }
        s.appendChild(svg("circle", { cx: X(st.x), cy: Y(st.y), r: 12, class: "sim-handle sim-q1" }));
        s.appendChild(text(X(st.x) + 26, Y(st.y) - 14, `(${st.x}, ${st.y})`, "sim-t bold"));
        // A compass, so north is never in doubt.
        s.appendChild(text(W - 40, 30, "N", "sim-t bold"));
        s.appendChild(text(W - 40, 84, "S", "sim-t bold"));
        s.appendChild(text(W - 66, 58, "W", "sim-t bold"));
        s.appendChild(text(W - 16, 58, "E", "sim-t bold"));
        s.appendChild(svg("line", { x1: W - 40, y1: 38, x2: W - 40, y2: 76, class: "sim-axis" }));
        s.appendChild(svg("line", { x1: W - 58, y1: 57, x2: W - 22, y2: 57, class: "sim-axis" }));
        const q = st.x >= 0 && st.y >= 0 ? "first" : st.x < 0 && st.y >= 0 ? "second"
          : st.x < 0 ? "third" : "fourth";
        read.textContent = `The marker is at (${st.x}, ${st.y}) — ${Math.abs(st.x)} `
          + `${st.x < 0 ? "west" : "east"} and ${Math.abs(st.y)} ${st.y < 0 ? "south" : "north"} `
          + `of the origin, in the ${q} quadrant.  Along the corridor first, then up the stairs: `
          + `x always comes before y.`;
      }

      const step = (dx, dy) => {
        st.x = clamp(st.x + dx, xr[0], xr[1]);
        st.y = clamp(st.y + dy, yr[0], yr[1]);
        st.trail.push([st.x, st.y]);
        draw();
      };
      const acts = el("div", "sim-ctrl");
      button(acts, "▲ North", () => step(0, 1));
      button(acts, "▼ South", () => step(0, -1));
      button(acts, "◀ West", () => step(-1, 0));
      button(acts, "▶ East", () => step(1, 0));
      button(acts, "Back to (0, 0)", () => { st.x = 0; st.y = 0; st.trail = [[0, 0]]; draw(); });
      ctrls.appendChild(acts);
      draw();
    }
  };

  // ---------- 30. Partial fractions ----------
  //
  // Cambridge sets four shapes of question, and a candidate who writes the
  // wrong FORM on line one has lost the question before any arithmetic starts.
  // So this simulator shows the form first, says why that form and no other,
  // and only then substitutes — one line at a time, for the board.
  //
  //   1  two different linear factors      A/(ax+b) + B/(cx+d)
  //   2  a repeated linear factor          A/(x+p) + B/(x+q) + C/(x+q)²
  //   3  an irreducible quadratic factor   A/(x+p) + (Bx+C)/(x²+k)
  //   4  an improper fraction              k + A/(x+p) + B/(x+q)
  //
  // Every example is built backwards from whole-number constants, so the answer
  // on the board is exact — nothing here is rounded. The working shown is not
  // the construction, though: each constant is re-derived by the substitution a
  // pupil would actually do, and the last line checks both sides at a test
  // value. If the two ever disagreed the simulator says so on the board rather
  // than quietly printing a wrong answer.
  defs.partialFractions = {
    name: "Partial fractions",
    blurb: "All four Cambridge cases — two linear factors, a repeated factor, a quadratic factor, and an improper fraction — with the form named before any working starts.",
    mount(host, o) {
      const opts = o || {};

      // ---- exact fractions ----
      const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
      const F = (n, d) => {
        d = d === undefined ? 1 : d;
        if (d < 0) { n = -n; d = -d; }
        const k = gcd(Math.abs(n), d) || 1;
        return { n: n / k, d: d / k };
      };
      const Fadd = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
      const Fsub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
      const Fmul = (a, b) => F(a.n * b.n, a.d * b.d);
      const Fdiv = (a, b) => F(a.n * b.d, a.d * b.n);
      const Feq = (a, b) => a.n * b.d === b.n * a.d;
      const Fpow = (x, k) => { let r = F(1); for (let i = 0; i < k; i++) r = Fmul(r, x); return r; };
      const Ftxt = (a) => (a.d === 1 ? String(a.n) : a.n + "/" + a.d).replace("-", "−");
      // "A", "−A", "3A", "(4/3)A" — a coefficient written in front of an unknown.
      const coefTxt = (a, letter) => {
        if (a.d === 1 && a.n === 1) return letter;
        if (a.d === 1 && a.n === -1) return "−" + letter;
        if (a.d === 1) return Ftxt(a) + letter;
        return "(" + Ftxt(a) + ")" + letter;
      };
      const inBr = (n) => (n < 0 ? "(−" + -n + ")" : String(n));

      // ---- polynomials: ascending coefficients, whole numbers ----
      const pmul = (a, b) => {
        const out = new Array(a.length + b.length - 1).fill(0);
        a.forEach((u, i) => b.forEach((v, j) => { out[i + j] += u * v; }));
        return out;
      };
      const padd = (a, b) => {
        const big = (a.length >= b.length ? a : b).slice();
        const small = a.length >= b.length ? b : a;
        small.forEach((v, i) => { big[i] += v; });
        return big;
      };
      const pscale = (a, k) => a.map((v) => v * k);
      const pev = (p, x) => p.reduce((acc, c, i) => Fadd(acc, Fmul(F(c), Fpow(x, i))), F(0));
      const SUP = ["", "x", "x²", "x³"];
      function ptxt(p) {
        let s = "";
        for (let i = p.length - 1; i >= 0; i--) {
          const c = p[i];
          if (!c) continue;
          const first = s === "";
          const sign = c < 0 ? (first ? "−" : " − ") : (first ? "" : " + ");
          const a = Math.abs(c);
          s += sign + (a === 1 && i > 0 ? "" : String(a)) + SUP[i];
        }
        return s || "0";
      }
      // "3x − 2", "−x", "5" — the numerator that sits over a quadratic factor.
      function linNumTxt(B, C) {
        if (B.n === 0) return Ftxt(C);
        const bx = B.d === 1 && Math.abs(B.n) === 1 ? (B.n < 0 ? "−x" : "x") : Ftxt(B) + "x";
        if (C.n === 0) return bx;
        return bx + (C.n < 0 ? " − " : " + ") + Ftxt(F(Math.abs(C.n), C.d));
      }

      // ---- linear factors, written {a, b} for ax + b ----
      const linTxt = (f) => (f.a === 1 ? "x" : f.a === -1 ? "−x" : f.a + "x")
        + (f.b === 0 ? "" : f.b > 0 ? " + " + f.b : " − " + -f.b);
      const br = (f) => "(" + linTxt(f) + ")";
      const linP = (f) => [f.b, f.a];
      const rootOf = (f) => F(-f.b, f.a);

      const rnd = (a) => a[Math.floor(Math.random() * a.length)];
      const NZ = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];
      const SMALL = [-4, -3, -2, -1, 1, 2, 3, 4];

      // Two lines of working: the substituted equation, then the constant.
      const solved = (lhs, coef, letter, val) => [
        [{ t: Ftxt(lhs) + " = " + coefTxt(coef, letter) }],
        [{ t: "so  " + letter + " = " + Ftxt(val), cls: "pf-then" }]
      ];

      // A test value for the final check that no denominator kills.
      function testX(bad) {
        const tries = [2, 1, 3, 0, -1, 4, 5, -2, 6];
        for (let i = 0; i < tries.length; i++) {
          const x = F(tries[i]);
          if (bad.every((b) => !Feq(x, b))) return x;
        }
        return F(11);
      }

      // ---------- case 1: two different linear factors ----------
      function buildDistinct() {
        const p = rnd(SMALL);
        const a2 = rnd([1, 1, 1, 2, 3]);
        let q;
        // The two roots must differ, and a bracket like (2x − 4) would be
        // marked down for not being written 2(x − 2), so keep them coprime.
        do { q = rnd(SMALL); } while (p * a2 === q || gcd(a2, Math.abs(q)) > 1);
        const f1 = { a: 1, b: p }, f2 = { a: a2, b: q };
        const A = rnd(NZ), B = rnd(NZ);
        const N = padd(pscale(linP(f2), A), pscale(linP(f1), B));
        const den = br(f1) + br(f2);
        const r1 = rootOf(f1), r2 = rootOf(f2);
        // Re-derived by covering up, not taken from the construction.
        const Av = Fdiv(pev(N, r1), pev(linP(f2), r1));
        const Bv = Fdiv(pev(N, r2), pev(linP(f1), r2));

        return {
          title: "two different linear factors",
          question: [[{ n: ptxt(N), d: den }]],
          steps: [
            { why: "Two different linear factors on the bottom, so each one carries a single "
                + "constant on top — a numerator is always one degree lower than its own "
                + "denominator, and one degree below linear is a number.",
              expr: [[{ n: ptxt(N), d: den }, { t: " ≡ " },
                      { n: "A", d: linTxt(f1) }, { t: " + " }, { n: "B", d: linTxt(f2) }]] },
            { why: "Multiply every term by " + den + ". The fractions go, and what is left is "
                + "an identity — true for every x, not just for one value.",
              expr: [[{ t: ptxt(N) + " ≡ A" + br(f2) + " + B" + br(f1) }]] },
            { why: "Choose x = " + Ftxt(r1) + ", the value that makes " + br(f1) + " zero. "
                + "Every term carrying that bracket disappears, so only A is left.",
              expr: solved(pev(N, r1), pev(linP(f2), r1), "A", Av) },
            { why: "Now x = " + Ftxt(r2) + ", which makes " + br(f2) + " zero and leaves B.",
              expr: solved(pev(N, r2), pev(linP(f1), r2), "B", Bv) }
          ],
          answer: [[{ n: ptxt(N), d: den }, { t: " ≡ " },
                    { n: Ftxt(Av), d: linTxt(f1) }, { t: " + " }, { n: Ftxt(Bv), d: linTxt(f2) }]],
          point: "Cover a bracket, put in the x that kills it, and the constant over that "
            + "bracket falls out on its own. No simultaneous equations are needed here.",
          bad: [r1, r2],
          check(x) {
            const l1 = pev(linP(f1), x), l2 = pev(linP(f2), x);
            return { lhs: Fdiv(pev(N, x), Fmul(l1, l2)),
                     rhs: Fadd(Fdiv(Av, l1), Fdiv(Bv, l2)) };
          }
        };
      }

      // ---------- case 2: a repeated linear factor ----------
      function buildRepeated() {
        const p = rnd(SMALL);
        let q;
        do { q = rnd(SMALL); } while (q === p);
        const f1 = { a: 1, b: p }, f2 = { a: 1, b: q };
        const A = rnd(NZ), B = rnd(NZ), C = rnd(NZ);
        const N = padd(padd(pscale(pmul(linP(f2), linP(f2)), A),
                            pscale(pmul(linP(f1), linP(f2)), B)),
                       pscale(linP(f1), C));
        const den = br(f1) + br(f2) + "²";
        const r1 = rootOf(f1), r2 = rootOf(f2);
        const Cv = Fdiv(pev(N, r2), pev(linP(f1), r2));
        const Av = Fdiv(pev(N, r1), Fpow(pev(linP(f2), r1), 2));
        const x2 = F(N[2] || 0);                            // x² coefficient on the left
        const Bv = Fsub(x2, Av);                            // on the right it is A + B

        return {
          title: "a repeated linear factor",
          question: [[{ n: ptxt(N), d: den }]],
          steps: [
            { why: br(f2) + " is repeated, so it appears twice — once on its own and once "
                + "squared. Leave the middle term out and the identity cannot balance, "
                + "whatever constants you choose.",
              expr: [[{ n: ptxt(N), d: den }, { t: " ≡ " },
                      { n: "A", d: linTxt(f1) }, { t: " + " }, { n: "B", d: linTxt(f2) },
                      { t: " + " }, { n: "C", d: br(f2) + "²" }]] },
            { why: "Multiply every term by " + den + ".",
              expr: [[{ t: ptxt(N) + " ≡ A" + br(f2) + "² + B" + br(f1) + br(f2)
                        + " + C" + br(f1) }]] },
            { why: "Choose x = " + Ftxt(r2) + ", the repeated root. It kills the A term and "
                + "the B term at the same time, so C comes out first.",
              expr: solved(pev(N, r2), pev(linP(f1), r2), "C", Cv) },
            { why: "Now x = " + Ftxt(r1) + ", which kills the B and C terms and leaves A.",
              expr: solved(pev(N, r1), Fpow(pev(linP(f2), r1), 2), "A", Av) },
            { why: "There is no third root to substitute, so compare coefficients instead. "
                + "On the right, an x² can only come out of A" + br(f2) + "² and "
                + "B" + br(f1) + br(f2) + " — one from each.",
              expr: [[{ t: "x²:   " + Ftxt(x2) + " = A + B = " + Ftxt(Av) + " + B" }],
                     [{ t: "so  B = " + Ftxt(Bv), cls: "pf-then" }]] }
          ],
          answer: [[{ n: ptxt(N), d: den }, { t: " ≡ " },
                    { n: Ftxt(Av), d: linTxt(f1) }, { t: " + " },
                    { n: Ftxt(Bv), d: linTxt(f2) }, { t: " + " },
                    { n: Ftxt(Cv), d: br(f2) + "²" }]],
          point: "A squared bracket needs two terms, not one. Substitution hands you A and C; "
            + "the middle constant has to be found by comparing coefficients.",
          bad: [r1, r2],
          check(x) {
            const l1 = pev(linP(f1), x), l2 = pev(linP(f2), x);
            return { lhs: Fdiv(pev(N, x), Fmul(l1, Fpow(l2, 2))),
                     rhs: Fadd(Fadd(Fdiv(Av, l1), Fdiv(Bv, l2)), Fdiv(Cv, Fpow(l2, 2))) };
          }
        };
      }

      // ---------- case 3: an irreducible quadratic factor ----------
      function buildQuadratic() {
        const p = rnd(SMALL), k = rnd([1, 2, 3, 4, 5, 9]);
        const f1 = { a: 1, b: p };
        const A = rnd(NZ), B = rnd(NZ), C = rnd(NZ);
        const quad = [k, 0, 1];                             // x² + k, no real roots
        const qTxt = "x² + " + k;
        const N = padd(pscale(quad, A), pmul([C, B], linP(f1)));
        const den = br(f1) + "(" + qTxt + ")";
        const r1 = rootOf(f1);
        const Av = Fdiv(pev(N, r1), pev(quad, r1));
        const x2 = F(N[2] || 0);
        const Bv = Fsub(x2, Av);
        const c0 = F(N[0] || 0);
        const Cv = Fdiv(Fsub(c0, Fmul(Av, F(k))), F(p));

        return {
          title: "an irreducible quadratic factor",
          question: [[{ n: ptxt(N), d: den }]],
          steps: [
            { why: qTxt + " has no real roots, so it will not split any further. Its "
                + "numerator must be one degree lower than it is — a linear expression "
                + "Bx + C, not a single constant. This is the line most marks are lost on.",
              expr: [[{ n: ptxt(N), d: den }, { t: " ≡ " },
                      { n: "A", d: linTxt(f1) }, { t: " + " }, { n: "Bx + C", d: qTxt }]] },
            { why: "Multiply every term by " + den + ".",
              expr: [[{ t: ptxt(N) + " ≡ A(" + qTxt + ") + (Bx + C)" + br(f1) }]] },
            { why: "Choose x = " + Ftxt(r1) + " to kill the second bracket. " + qTxt
                + " has no root to substitute, so this is the only value that helps.",
              expr: solved(pev(N, r1), pev(quad, r1), "A", Av) },
            { why: "The rest must come from comparing coefficients. An x² appears on the "
                + "right in A(" + qTxt + ") and again from Bx multiplied by x.",
              expr: [[{ t: "x²:   " + Ftxt(x2) + " = A + B = " + Ftxt(Av) + " + B" }],
                     [{ t: "so  B = " + Ftxt(Bv), cls: "pf-then" }]] },
            { why: "Then the constant terms — putting x = 0 is the quickest way to see them.",
              expr: [[{ t: "x = 0:   " + Ftxt(c0) + " = " + k + "A + " + inBr(p) + "C" }],
                     [{ t: Ftxt(c0) + " = " + Ftxt(Fmul(Av, F(k))) + " + "
                          + coefTxt(F(p), "C"), cls: "pf-then" }],
                     [{ t: "so  C = " + Ftxt(Cv), cls: "pf-then" }]] }
          ],
          answer: [[{ n: ptxt(N), d: den }, { t: " ≡ " },
                    { n: Ftxt(Av), d: linTxt(f1) }, { t: " + " },
                    { n: linNumTxt(Bv, Cv), d: qTxt }]],
          point: "A quadratic that will not factorise still takes a numerator one degree "
            + "below itself: Bx + C. One substitution gives A; the other two constants come "
            + "from comparing coefficients.",
          bad: [r1],
          check(x) {
            const l1 = pev(linP(f1), x), qv = pev(quad, x);
            return { lhs: Fdiv(pev(N, x), Fmul(l1, qv)),
                     rhs: Fadd(Fdiv(Av, l1), Fdiv(Fadd(Fmul(Bv, x), Cv), qv)) };
          }
        };
      }

      // ---------- case 4: an improper fraction ----------
      function buildImproper() {
        const p = rnd(SMALL);
        let q;
        do { q = rnd(SMALL); } while (q === p);
        const f1 = { a: 1, b: p }, f2 = { a: 1, b: q };
        const D = rnd([1, 2, 3, 4, -1, -2, -3]), A = rnd(NZ), B = rnd(NZ);
        const N = padd(pscale(pmul(linP(f1), linP(f2)), D),
                       padd(pscale(linP(f2), A), pscale(linP(f1), B)));
        const den = br(f1) + br(f2);
        const denOut = ptxt(pmul(linP(f1), linP(f2)));
        const r1 = rootOf(f1), r2 = rootOf(f2);
        const kv = F(N[2] || 0);                            // both sides are degree 2
        const Av = Fdiv(pev(N, r1), pev(linP(f2), r1));
        const Bv = Fdiv(pev(N, r2), pev(linP(f1), r2));

        return {
          title: "an improper fraction — divide before you split",
          question: [[{ n: ptxt(N), d: den }]],
          steps: [
            { why: "Check the degrees first. The top is degree 2, and so is the bottom — "
                + den + " multiplies out to " + denOut + ". The fraction is improper, and A/" + br(f1)
                + " + B/" + br(f2) + " on its own could never equal it: those two terms "
                + "shrink away for large x and this fraction does not. A whole term goes "
                + "in front.",
              expr: [[{ n: ptxt(N), d: den }, { t: " ≡ k + " },
                      { n: "A", d: linTxt(f1) }, { t: " + " }, { n: "B", d: linTxt(f2) }]] },
            { why: "Multiply every term by " + den + ".",
              expr: [[{ t: ptxt(N) + " ≡ k" + br(f1) + br(f2) + " + A" + br(f2)
                        + " + B" + br(f1) }]] },
            { why: "Only the k term carries an x², so comparing x² coefficients gives k "
                + "straight away. That is the long division, done in one line.",
              expr: [[{ t: "x²:   " + Ftxt(kv) + " = k" }],
                     [{ t: "so  k = " + Ftxt(kv), cls: "pf-then" }]] },
            { why: "Now the roots, exactly as in case 1: x = " + Ftxt(r1) + " kills the k "
                + "term and the B term together.",
              expr: solved(pev(N, r1), pev(linP(f2), r1), "A", Av) },
            { why: "And x = " + Ftxt(r2) + " kills the k term and the A term.",
              expr: solved(pev(N, r2), pev(linP(f1), r2), "B", Bv) }
          ],
          answer: [[{ n: ptxt(N), d: den }, { t: " ≡ " + Ftxt(kv) + " + " },
                    { n: Ftxt(Av), d: linTxt(f1) }, { t: " + " },
                    { n: Ftxt(Bv), d: linTxt(f2) }]],
          point: "Compare the degrees before anything else. A top as high as the bottom, or "
            + "higher, means a whole term comes out first — by long division, or by putting "
            + "k into the form and reading it off the x² coefficients.",
          bad: [r1, r2],
          check(x) {
            const l1 = pev(linP(f1), x), l2 = pev(linP(f2), x);
            return { lhs: Fdiv(pev(N, x), Fmul(l1, l2)),
                     rhs: Fadd(kv, Fadd(Fdiv(Av, l1), Fdiv(Bv, l2))) };
          }
        };
      }

      const CASES = [
        { key: "distinct", label: "1 · two different linear factors", build: buildDistinct },
        { key: "repeated", label: "2 · a repeated linear factor", build: buildRepeated },
        { key: "quadratic", label: "3 · an irreducible quadratic factor", build: buildQuadratic },
        { key: "improper", label: "4 · an improper fraction", build: buildImproper }
      ];

      // ---- the board ----
      const { ctrls, stage, read } = shell(host);
      const st = { key: CASES[0].key, model: null, shown: 0 };

      // An expression is a list of lines; a line is a list of pieces, and a
      // piece is either plain text or a fraction drawn as one.
      function exprEl(lines, cls) {
        const box = el("div", "pf-lines" + (cls ? " " + cls : ""));
        lines.forEach((pieces) => {
          const row = el("div", "pf-expr");
          pieces.forEach((p) => {
            if (p.t !== undefined) {
              row.appendChild(el("span", "pf-tx" + (p.cls ? " " + p.cls : ""), p.t));
              return;
            }
            const f = el("span", "pf-frac");
            f.appendChild(el("span", "pf-n", p.n));
            f.appendChild(el("span", "pf-d", p.d));
            row.appendChild(f);
          });
          box.appendChild(row);
        });
        return box;
      }

      function draw() {
        const m = st.model;
        const total = m.steps.length + 1;                   // the steps, then the answer
        clear(stage);
        const wrap = el("div", "pf");
        const idx = CASES.map((c) => c.key).indexOf(st.key);
        wrap.appendChild(el("div", "pf-case", "Case " + (idx + 1) + " · " + m.title));
        wrap.appendChild(el("div", "pf-ask", "Express in partial fractions:"));
        wrap.appendChild(exprEl(m.question, "pf-big"));

        const list = el("div", "pf-list");
        for (let i = 0; i < Math.min(st.shown, m.steps.length); i++) {
          const s = m.steps[i];
          const row = el("div", "pf-step" + (i === st.shown - 1 ? " pf-now" : ""));
          row.appendChild(el("div", "pf-why", s.why));
          row.appendChild(exprEl(s.expr));
          list.appendChild(row);
        }
        if (st.shown >= total) {
          const row = el("div", "pf-step pf-now");
          row.appendChild(el("div", "pf-why", "The answer:"));
          row.appendChild(exprEl(m.answer, "pf-big"));
          const x = testX(m.bad);
          const c = m.check(x);
          row.appendChild(el("div", "pf-check", Feq(c.lhs, c.rhs)
            ? "Check — at x = " + Ftxt(x) + " the fraction on the left comes to "
              + Ftxt(c.lhs) + ", and so does the sum on the right."
            : "This example does not check out at x = " + Ftxt(x) + " ("
              + Ftxt(c.lhs) + " against " + Ftxt(c.rhs) + ") — please press "
              + "“New example” rather than putting it on the board."));
          list.appendChild(row);
        }
        wrap.appendChild(list);
        stage.appendChild(wrap);

        if (st.shown === 0) {
          read.textContent = "Before any working, ask the class what the answer will look "
            + "like. Naming the form is the first mark, and the one most often thrown away. "
            + "Then press “Next line”.";
        } else if (st.shown <= m.steps.length) {
          read.textContent = m.steps[st.shown - 1].why;
        } else {
          read.textContent = m.point;
        }
        next.disabled = st.shown >= total;
        next.textContent = st.shown >= total ? "Finished" : "Next line ▸";
      }

      function reset(key) {
        st.key = key;
        const c = CASES.filter((x) => x.key === key)[0] || CASES[0];
        st.key = c.key;
        st.model = c.build();
        st.shown = 0;
        draw();
      }

      const start = CASES.map((c) => c.key).indexOf(opts.caseKey) !== -1
        ? opts.caseKey : CASES[0].key;
      choice(ctrls, { label: "Case", value: start,
        options: CASES.map((c) => ({ value: c.key, label: c.label })),
        on: (v) => reset(v) });
      const acts = el("div", "sim-ctrl");
      const next = button(acts, "Next line ▸", () => {
        if (st.shown < st.model.steps.length + 1) { st.shown += 1; draw(); }
      });
      button(acts, "Every line", () => { st.shown = st.model.steps.length + 1; draw(); });
      button(acts, "New example", () => reset(st.key));
      ctrls.appendChild(acts);
      reset(start);
    }
  };

  return {
    list: defs,
    has: (id) => Object.prototype.hasOwnProperty.call(defs, id),
    get: (id) => defs[id] || null,
    // Put simulator `id` into `host`. Returns false when the id is unknown,
    // so a missing simulator can never take the planner down with it.
    mount(host, id, opts) {
      const sim = defs[id];
      if (!host || !sim) return false;
      try {
        sim.mount(host, opts || {});
        return true;
      } catch (err) {
        clear(host);
        host.appendChild(el("p", "sim-read", "This simulator could not start on this browser."));
        return false;
      }
    }
  };
})();
