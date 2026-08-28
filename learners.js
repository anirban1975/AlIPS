// AlIPS — the differentiation record.
//
// A ten-minute turn at the board is assessment, and it is normally lost. This
// keeps it: when a child answers in a simulator's Play mode, the attempt is
// written against their name, the sub-topic and the level, and the planner can
// then say who is secure, who needs support and who is ready for more.
//
// WHAT IS STORED, AND WHERE
// First names only, in this browser's own storage, on this computer. Nothing
// is uploaded, nothing leaves the machine, and the teacher can wipe a class or
// the whole record with one button. A child's marks are not a public record:
// the export is a file the teacher chooses to send, not a feed.
//
// If a browser refuses storage (a locked-down machine, private mode), every
// function here degrades quietly — the simulators keep working and nothing is
// remembered.

const LEARNERS = (function () {
  "use strict";

  const CLASS_KEY = "alips-classes";     // { key: { label, kids: [{id, name}] } }
  const LOG_KEY = "alips-diff-log";      // [ {t, cls, kid, topic, name, sim, lvl, ok} ]
  const CUR_KEY = "alips-diff-current";  // { [classKey]: kidId }
  const LOG_CAP = 4000;                  // a term of board work, then the oldest go

  const read = (k, d) => {
    try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch { return d; }
  };
  const write = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; }
  };
  const uid = () => "k" + Math.random().toString(36).slice(2, 9);

  // One class per grade and section, which is how a teacher thinks of them.
  const classKey = (grade, section) =>
    "g" + grade + "-" + String(section || "A").trim().toUpperCase();
  const classLabel = (grade, section) =>
    "Grade " + grade + " " + String(section || "A").trim().toUpperCase();

  function getClass(key, label) {
    const all = read(CLASS_KEY, {});
    if (!all[key]) all[key] = { label: label || key, kids: [] };
    return all[key];
  }
  function saveClass(key, cls) {
    const all = read(CLASS_KEY, {});
    all[key] = cls;
    return write(CLASS_KEY, all);
  }
  function addKid(key, label, name) {
    const clean = String(name || "").trim().slice(0, 24);
    if (!clean) return null;
    const cls = getClass(key, label);
    if (cls.kids.some((k) => k.name.toLowerCase() === clean.toLowerCase())) return null;
    const kid = { id: uid(), name: clean };
    cls.kids.push(kid);
    saveClass(key, cls);
    return kid;
  }
  function removeKid(key, id) {
    const cls = getClass(key);
    cls.kids = cls.kids.filter((k) => k.id !== id);
    saveClass(key, cls);
    // and the child's attempts go with them
    write(LOG_KEY, read(LOG_KEY, []).filter((a) => !(a.cls === key && a.kid === id)));
  }
  function clearClass(key) {
    const all = read(CLASS_KEY, {});
    delete all[key];
    write(CLASS_KEY, all);
    write(LOG_KEY, read(LOG_KEY, []).filter((a) => a.cls !== key));
    const cur = read(CUR_KEY, {});
    delete cur[key];
    write(CUR_KEY, cur);
  }
  function wipeAll() {
    write(CLASS_KEY, {});
    write(LOG_KEY, []);
    write(CUR_KEY, {});
  }

  const current = (key) => read(CUR_KEY, {})[key] || null;
  function setCurrent(key, kidId) {
    const cur = read(CUR_KEY, {});
    if (kidId) cur[key] = kidId; else delete cur[key];
    write(CUR_KEY, cur);
  }

  // One answer, first try, right or wrong.
  function log(entry) {
    if (!entry || !entry.cls || !entry.kid) return false;
    const all = read(LOG_KEY, []);
    all.push({
      t: Date.now(),
      cls: entry.cls,
      kid: entry.kid,
      topic: entry.topic || "",
      name: (entry.name || "").slice(0, 80),
      sim: entry.sim || "",
      lvl: entry.lvl || 2,
      ok: !!entry.ok
    });
    if (all.length > LOG_CAP) all.splice(0, all.length - LOG_CAP);
    return write(LOG_KEY, all);
  }

  // Three bands, and the wording a teacher would actually use. A band is only
  // claimed once there is enough to go on — three answers is the minimum, and
  // the report says so rather than pretending.
  const BANDS = {
    support: { key: "support", label: "Needs support", cls: "band-support" },
    secure: { key: "secure", label: "Secure", cls: "band-secure" },
    ready: { key: "ready", label: "Ready for more", cls: "band-ready" },
    thin: { key: "thin", label: "Not enough yet", cls: "band-thin" }
  };
  function bandOf(n, c) {
    if (n < 3) return BANDS.thin;
    const rate = c / n;
    if (rate >= 0.85) return BANDS.ready;
    if (rate >= 0.6) return BANDS.secure;
    return BANDS.support;
  }

  // The picture for one class. Pass a topic to narrow it to this lesson;
  // leave it out for everything the class has done.
  function report(key, topic, label) {
    const cls = getClass(key, label);
    const all = read(LOG_KEY, []).filter((a) => a.cls === key && (!topic || a.topic === topic));
    const rows = cls.kids.map((kid) => {
      const mine = all.filter((a) => a.kid === kid.id).slice(-12);   // the last dozen
      const n = mine.length;
      const c = mine.filter((a) => a.ok).length;
      const lastLvl = n ? mine[n - 1].lvl : 2;
      return { id: kid.id, name: kid.name, n, c, rate: n ? c / n : 0,
               band: bandOf(n, c), level: lastLvl };
    });
    const n = all.length, c = all.filter((a) => a.ok).length;
    return {
      label: cls.label, topic: topic || "", kids: rows,
      total: { n, c, rate: n ? c / n : 0 },
      sims: Array.from(new Set(all.map((a) => a.sim))).filter(Boolean)
    };
  }

  // Where a group goes next. Junior simulators sit in rough progressions, so
  // "ready for more" can be pointed at the next thing rather than just told to
  // do the same again harder.
  const NEXT = {
    traceNumber: "tenFrame",
    tenFrame: "numberTrack",
    numberTrack: "tensOnes",
    tensOnes: "arrayBuild",
    arrayBuild: "shareOut",
    shareOut: "fractionShape",
    fractionShape: "coinPurse",
    measureUp: "clockKids",
    shapeSort: "measureUp",
    pictoKids: "tallyChart"
  };
  const LEVEL_NAME = { 1: "Support", 2: "Core", 3: "Challenge" };

  function suggest(rep, simId, simName, nameOf) {
    const groups = [];
    const pick = (b) => rep.kids.filter((k) => k.band.key === b);
    const list = (ks) => ks.map((k) => k.name).join(", ");
    const support = pick("support"), secure = pick("secure"), ready = pick("ready"),
      thin = pick("thin");
    if (support.length) {
      groups.push({ band: BANDS.support, who: list(support),
        action: `Run ${simName} again at ${LEVEL_NAME[1]} level, in a small group. `
          + `Use step-by-step mode first so they hear the routine before they are asked for an answer.` });
    }
    if (secure.length) {
      groups.push({ band: BANDS.secure, who: list(secure),
        action: `Keep them on ${simName} at ${LEVEL_NAME[2]} level, and set the matching `
          + `practice questions from section 1.` });
    }
    if (ready.length) {
      const nextId = NEXT[simId];
      const nextName = nextId && typeof nameOf === "function" ? nameOf(nextId) : null;
      groups.push({ band: BANDS.ready, who: list(ready),
        action: nextName
          ? `Move them on: ${simName} at ${LEVEL_NAME[3]} level, then ${nextName}.`
          : `Move them to ${LEVEL_NAME[3]} level, and ask them to explain their method to the class.` });
    }
    if (thin.length) {
      groups.push({ band: BANDS.thin, who: list(thin),
        action: "Not enough turns at the board yet — give these children the next few questions." });
    }
    return groups;
  }

  // A file for the Head of Department: readable first, with the raw numbers
  // underneath for anyone who wants to check them.
  function exportText(key, teacher, label) {
    const rep = report(key, "", label);
    const all = read(LOG_KEY, []).filter((a) => a.cls === key);
    const byTopic = {};
    all.forEach((a) => {
      const t = a.name || a.topic || "(sub-topic not recorded)";
      byTopic[t] = byTopic[t] || { n: 0, c: 0 };
      byTopic[t].n += 1;
      if (a.ok) byTopic[t].c += 1;
    });
    let txt = "AlIPS Mathematics — differentiation record\n";
    txt += "Class: " + rep.label + "\n";
    txt += "Teacher: " + (teacher || "(name not entered)") + "\n";
    txt += "Exported: " + new Date().toISOString().slice(0, 10) + "\n";
    txt += "Answers recorded: " + rep.total.n
      + (rep.total.n ? "  (" + Math.round(rep.total.rate * 100) + "% right first time)" : "") + "\n";
    txt += "\nThis is evidence from the interactive simulators used at the board.\n";
    txt += "First names only. It has never left this computer.\n";
    txt += "\n" + "=".repeat(58) + "\nBY CHILD\n" + "=".repeat(58) + "\n";
    rep.kids.forEach((k) => {
      txt += "\n" + k.name + "\n";
      txt += "  answers: " + k.n + "   right first time: " + k.c
        + (k.n ? "   (" + Math.round(k.rate * 100) + "%)" : "") + "\n";
      txt += "  where they are: " + k.band.label + "\n";
    });
    txt += "\n" + "=".repeat(58) + "\nBY SUB-TOPIC\n" + "=".repeat(58) + "\n";
    Object.keys(byTopic).forEach((t) => {
      const r = byTopic[t];
      txt += "\n" + t + "\n  " + r.c + " right out of " + r.n
        + "  (" + Math.round(r.c / r.n * 100) + "%)\n";
    });
    txt += "\n\n--- machine-readable copy ---\n" + JSON.stringify({ class: rep.label, rows: rep.kids, log: all }, null, 1) + "\n";
    return txt;
  }

  const has = () => {
    try { localStorage.setItem("alips-probe", "1"); localStorage.removeItem("alips-probe"); return true; }
    catch { return false; }
  };

  return { classKey, classLabel, getClass, addKid, removeKid, clearClass, wipeAll,
           current, setCurrent, log, report, suggest, exportText, bandOf, BANDS,
           LEVEL_NAME, storageWorks: has };
})();
