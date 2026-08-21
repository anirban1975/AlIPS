// AlIPS question generator engine.
// Each generator: { name: T(en,ar), grades: [..], gen(r, d) -> {q: T, a: T} }
// r = seeded RNG function, d = difficulty 1 (easy) | 2 (medium) | 3 (hard).
// Answers that are pure math (numbers, expressions) use N() — same in both languages.

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const N = (s) => ({ en: String(s), ar: String(s) });
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n) => String(n).split("").map((c) => SUP[+c]).join("");

// x^p term with coefficient, for calculus/polynomials
function term(c, p, first) {
  if (c === 0) return "";
  const sign = c < 0 ? " − " : first ? "" : " + ";
  const ac = Math.abs(c);
  let body;
  if (p === 0) body = String(ac);
  else if (p === 1) body = (ac === 1 ? "" : ac) + "x";
  else body = (ac === 1 ? "" : ac) + "x" + sup(p);
  return (first && c < 0 ? "−" : sign) + body;
}
function poly(terms) {
  let s = "", first = true;
  for (const [c, p] of terms) {
    const t = term(c, p, first);
    if (t) { s += t; first = false; }
  }
  return s || "0";
}

const GENERATORS = {
  addWithin20: {
    name: { en: "Addition within 20", ar: "الجمع ضمن 20" }, grades: [1, 2],
    gen(r, d) {
      const a = ri(r, 1, d * 6), b = ri(r, 1, Math.min(19 - a, d * 6 + 2));
      return { q: { en: `Work out ${a} + ${b}`, ar: `احسب ${a} + ${b}` }, a: N(a + b) };
    }
  },
  subWithin20: {
    name: { en: "Subtraction within 20", ar: "الطرح ضمن 20" }, grades: [1, 2],
    gen(r, d) {
      const a = ri(r, d * 4, d * 6 + 2), b = ri(r, 1, a - 1);
      return { q: { en: `Work out ${a} − ${b}`, ar: `احسب ${a} − ${b}` }, a: N(a - b) };
    }
  },
  missingNumber: {
    name: { en: "Missing numbers", ar: "الأعداد المفقودة" }, grades: [1, 2, 3],
    gen(r, d) {
      const a = ri(r, 1, d * 7), b = ri(r, 1, d * 7);
      return { q: { en: `Find the missing number:  ${a} + ▢ = ${a + b}`, ar: `أوجد العدد المفقود:  ${a} + ▢ = ${a + b}` }, a: N(b) };
    }
  },
  placeValue: {
    name: { en: "Place value", ar: "القيمة المكانية" }, grades: [2, 3, 4],
    gen(r, d) {
      const n = ri(r, d === 1 ? 10 : d === 2 ? 100 : 1000, d === 1 ? 99 : d === 2 ? 999 : 9999);
      const s = String(n), i = ri(r, 0, s.length - 1);
      const val = +s[i] * Math.pow(10, s.length - 1 - i);
      return { q: { en: `What is the value of the digit ${s[i]} in ${n}?`, ar: `ما قيمة الرقم ${s[i]} في العدد ${n}؟` }, a: N(val) };
    }
  },
  columnAdd: {
    name: { en: "Column addition", ar: "الجمع العمودي" }, grades: [2, 3, 4],
    gen(r, d) {
      const m = d === 1 ? 99 : d === 2 ? 999 : 9999;
      const a = ri(r, m / 9, m), b = ri(r, m / 9, m);
      return { q: { en: `Work out ${a} + ${b}`, ar: `احسب ${a} + ${b}` }, a: N(a + b) };
    }
  },
  columnSub: {
    name: { en: "Column subtraction", ar: "الطرح العمودي" }, grades: [3, 4, 5],
    gen(r, d) {
      const m = d === 1 ? 999 : d === 2 ? 9999 : 99999;
      let a = ri(r, m / 9, m), b = ri(r, m / 9, m);
      if (b > a) [a, b] = [b, a];
      return { q: { en: `Work out ${a} − ${b}`, ar: `احسب ${a} − ${b}` }, a: N(a - b) };
    }
  },
  timesTables: {
    name: { en: "Times tables", ar: "جداول الضرب" }, grades: [2, 3, 4],
    gen(r, d) {
      const tables = d === 1 ? [2, 5, 10] : d === 2 ? [3, 4, 6, 8] : [7, 9, 11, 12];
      const a = pick(r, tables), b = ri(r, 2, 12);
      return { q: { en: `Work out ${a} × ${b}`, ar: `احسب ${a} × ${b}` }, a: N(a * b) };
    }
  },
  divisionRemainder: {
    name: { en: "Division with remainders", ar: "القسمة مع الباقي" }, grades: [3, 4, 5],
    gen(r, d) {
      const b = ri(r, 2, d + 4 + d), q0 = ri(r, 3, 9 + d * 5), rem = ri(r, 0, b - 1);
      const a = b * q0 + rem;
      const ans = rem ? `${q0} r ${rem}` : `${q0}`;
      return { q: { en: `Work out ${a} ÷ ${b}`, ar: `احسب ${a} ÷ ${b}` }, a: N(ans) };
    }
  },
  longMultiplication: {
    name: { en: "Written multiplication", ar: "الضرب الكتابي" }, grades: [4, 5, 6],
    gen(r, d) {
      const a = ri(r, d === 3 ? 100 : 12, d === 1 ? 99 : d === 2 ? 999 : 999);
      const b = ri(r, d === 1 ? 3 : 12, d === 1 ? 9 : d === 2 ? 19 : 99);
      return { q: { en: `Work out ${a} × ${b}`, ar: `احسب ${a} × ${b}` }, a: N(a * b) };
    }
  },
  fractionOfAmount: {
    name: { en: "Fraction of an amount", ar: "كسر من كمية" }, grades: [3, 4, 5],
    gen(r, d) {
      const den = pick(r, d === 1 ? [2, 4] : d === 2 ? [3, 5, 10] : [6, 8, 12]);
      const num = d === 1 ? 1 : ri(r, 1, den - 1);
      const unit = ri(r, 2, 12);
      const total = den * unit;
      return { q: { en: `Find ${num}/${den} of ${total}`, ar: `أوجد ${num}/${den} من ${total}` }, a: N(num * unit) };
    }
  },
  equivalentFractions: {
    name: { en: "Equivalent fractions", ar: "الكسور المتكافئة" }, grades: [4, 5, 6],
    gen(r, d) {
      const den = ri(r, 2, 6 + d), num = ri(r, 1, den - 1), k = ri(r, 2, 3 + d * 2);
      return { q: { en: `Complete:  ${num}/${den} = ▢/${den * k}`, ar: `أكمل:  ${num}/${den} = ▢/${den * k}` }, a: N(num * k) };
    }
  },
  addFractions: {
    name: { en: "Adding fractions", ar: "جمع الكسور" }, grades: [5, 6, 7],
    gen(r, d) {
      let d1 = ri(r, 2, 6 + d), d2 = d === 1 ? d1 : ri(r, 2, 6 + d);
      const n1 = ri(r, 1, d1 - 1), n2 = ri(r, 1, d2 - 1);
      let num = n1 * d2 + n2 * d1, den = d1 * d2;
      const g = gcd(num, den); num /= g; den /= g;
      const ans = den === 1 ? `${num}` : num > den ? `${num}/${den} = ${Math.floor(num / den)} ${num % den}/${den}` : `${num}/${den}`;
      return { q: { en: `Work out ${n1}/${d1} + ${n2}/${d2}. Give your answer in its simplest form.`, ar: `احسب ${n1}/${d1} + ${n2}/${d2} وأعطِ الناتج في أبسط صورة.` }, a: N(ans) };
    }
  },
  percentOfAmount: {
    name: { en: "Percentage of an amount", ar: "النسبة المئوية من كمية" }, grades: [5, 6, 7],
    gen(r, d) {
      const p = pick(r, d === 1 ? [10, 25, 50] : d === 2 ? [5, 20, 30, 75] : [15, 35, 45, 65, 85]);
      const base = ri(r, 2, 20) * (d === 3 ? 20 : 10);
      return { q: { en: `Find ${p}% of ${base}`, ar: `أوجد ${p}% من ${base}` }, a: N((p * base) / 100) };
    }
  },
  orderOfOperations: {
    name: { en: "Order of operations", ar: "أولويات العمليات" }, grades: [5, 6, 7],
    gen(r, d) {
      const a = ri(r, 2, 9), b = ri(r, 2, 9), c = ri(r, 2, 9);
      if (d === 1) return { q: { en: `Work out ${a} + ${b} × ${c}`, ar: `احسب ${a} + ${b} × ${c}` }, a: N(a + b * c) };
      if (d === 2) return { q: { en: `Work out (${a} + ${b}) × ${c} − ${b}`, ar: `احسب (${a} + ${b}) × ${c} − ${b}` }, a: N((a + b) * c - b) };
      return { q: { en: `Work out ${a} × ${b} − ${c}² + ${a}`, ar: `احسب ${a} × ${b} − ${c}² + ${a}` }, a: N(a * b - c * c + a) };
    }
  },
  areaPerimeterRect: {
    name: { en: "Area and perimeter of rectangles", ar: "مساحة ومحيط المستطيلات" }, grades: [4, 5, 6],
    gen(r, d) {
      const l = ri(r, 3, 8 + d * 4), w = ri(r, 2, l - 1);
      if (r() < 0.5)
        return { q: { en: `A rectangle is ${l} cm long and ${w} cm wide. Find its area.`, ar: `مستطيل طوله ${l} سم وعرضه ${w} سم. أوجد مساحته.` }, a: N(`${l * w} cm²`) };
      return { q: { en: `A rectangle is ${l} cm long and ${w} cm wide. Find its perimeter.`, ar: `مستطيل طوله ${l} سم وعرضه ${w} سم. أوجد محيطه.` }, a: N(`${2 * (l + w)} cm`) };
    }
  },
  meanOfNumbers: {
    name: { en: "The mean", ar: "الوسط الحسابي" }, grades: [6, 7, 8],
    gen(r, d) {
      const n = d + 3;
      const mean = ri(r, 3, 12);
      const nums = [];
      let sum = 0;
      for (let i = 0; i < n - 1; i++) { const v = ri(r, 1, mean * 2 - 1); nums.push(v); sum += v; }
      const last = mean * n - sum;
      if (last < 0 || last > mean * 3) return this.gen(r, d);
      nums.push(last);
      return { q: { en: `Find the mean of: ${nums.join(", ")}`, ar: `أوجد الوسط الحسابي للأعداد: ${nums.join("، ")}` }, a: N(mean) };
    }
  },
  negativeNumbers: {
    name: { en: "Negative numbers", ar: "الأعداد السالبة" }, grades: [7, 8],
    gen(r, d) {
      const a = ri(r, -9 - d * 3, 9 + d * 3), b = ri(r, 1, 9 + d * 3);
      const op = pick(r, d === 3 ? ["−", "+", "×"] : ["−", "+"]);
      const bs = `(−${b})`;
      return { q: { en: `Work out ${a} ${op} ${bs}`, ar: `احسب ${a} ${op} ${bs}` }, a: N(op === "+" ? a - b : op === "−" ? a + b : -a * b) };
    }
  },
  powersRoots: {
    name: { en: "Powers and roots", ar: "القوى والجذور" }, grades: [7, 8, 9],
    gen(r, d) {
      if (d === 1) { const a = ri(r, 2, 12); return { q: { en: `Work out ${a}²`, ar: `احسب ${a}²` }, a: N(a * a) }; }
      if (d === 2) { const a = ri(r, 2, 15); return { q: { en: `Work out √${a * a}`, ar: `احسب √${a * a}` }, a: N(a) }; }
      const a = ri(r, 2, 6); return { q: { en: `Work out ${a}³`, ar: `احسب ${a}³` }, a: N(a * a * a) };
    }
  },
  ratioSharing: {
    name: { en: "Sharing in a ratio", ar: "القسمة بنسبة" }, grades: [7, 8, 9],
    gen(r, d) {
      const a = ri(r, 1, 3 + d), b = ri(r, a + 1, 4 + d * 2);
      const unit = ri(r, 2, 12);
      const total = (a + b) * unit;
      return {
        q: { en: `Share ${total} rials between Salim and Ahmed in the ratio ${a} : ${b}. How much does Ahmed get?`, ar: `اقسم ${total} ريالاً بين سالم وأحمد بنسبة ${a} : ${b}. كم يحصل أحمد؟` },
        a: N(`${b * unit} rials / ريال`)
      };
    }
  },
  anglesTriangle: {
    name: { en: "Angles in a triangle", ar: "زوايا المثلث" }, grades: [6, 7, 8],
    gen(r, d) {
      const a = ri(r, 20, 80), b = ri(r, 20, Math.min(150 - a, 100));
      return { q: { en: `Two angles of a triangle are ${a}° and ${b}°. Find the third angle.`, ar: `زاويتان في مثلث قياسهما ${a}° و ${b}°. أوجد الزاوية الثالثة.` }, a: N(`${180 - a - b}°`) };
    }
  },
  circleArea: {
    name: { en: "Circumference and area of circles", ar: "محيط الدائرة ومساحتها" }, grades: [8, 9, 10],
    gen(r, d) {
      const rad = ri(r, 2, 6 + d * 3);
      if (r() < 0.5)
        return { q: { en: `A circle has radius ${rad} cm. Find its circumference. Give your answer in terms of π.`, ar: `دائرة نصف قطرها ${rad} سم. أوجد محيطها بدلالة π.` }, a: N(`${2 * rad}π cm`) };
      return { q: { en: `A circle has radius ${rad} cm. Find its area. Give your answer in terms of π.`, ar: `دائرة نصف قطرها ${rad} سم. أوجد مساحتها بدلالة π.` }, a: N(`${rad * rad}π cm²`) };
    }
  },
  solveLinear: {
    name: { en: "Solving linear equations", ar: "حل المعادلات الخطية" }, grades: [7, 8, 9],
    gen(r, d) {
      const x = ri(r, d === 3 ? -9 : 1, 9), a = ri(r, 2, 2 + d * 2), b = ri(r, 1, 12);
      if (d < 3)
        return { q: { en: `Solve:  ${a}x + ${b} = ${a * x + b}`, ar: `حل المعادلة:  ${a}x + ${b} = ${a * x + b}` }, a: N(`x = ${x}`) };
      const c = ri(r, 1, a - 1);
      const k = (a - c) * x + b;
      const rhs = `${c === 1 ? "" : c}x ${k >= 0 ? "+ " + k : "− " + -k}`;
      return { q: { en: `Solve:  ${a}x + ${b} = ${rhs}`, ar: `حل المعادلة:  ${a}x + ${b} = ${rhs}` }, a: N(`x = ${x}`) };
    }
  },
  sequenceNth: {
    name: { en: "nth term of a sequence", ar: "الحد النوني للمتتالية" }, grades: [7, 8, 9],
    gen(r, d) {
      const m = ri(r, 2, 3 + d * 2), c = ri(r, -5, 9);
      const terms = [1, 2, 3, 4].map((n) => m * n + c);
      const rule = c === 0 ? `${m}n` : c > 0 ? `${m}n + ${c}` : `${m}n − ${-c}`;
      return { q: { en: `Find the nth term of the sequence: ${terms.join(", ")}, …`, ar: `أوجد الحد النوني للمتتالية: ${terms.join("، ")}، …` }, a: N(rule) };
    }
  },
  expandBrackets: {
    name: { en: "Expanding brackets", ar: "فك الأقواس" }, grades: [8, 9, 10],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 2, 7), b = ri(r, 1, 9);
        return { q: { en: `Expand:  ${a}(x + ${b})`, ar: `فك الأقواس:  ${a}(x + ${b})` }, a: N(`${a}x + ${a * b}`) };
      }
      const p = ri(r, 1, 6) * (d === 3 && r() < 0.5 ? -1 : 1), q0 = ri(r, 1, 6) * (r() < 0.5 ? -1 : 1);
      const fmt = (v) => (v < 0 ? `(x − ${-v})` : `(x + ${v})`);
      return { q: { en: `Expand and simplify:  ${fmt(p)}${fmt(q0)}`, ar: `فك الأقواس وبسّط:  ${fmt(p)}${fmt(q0)}` }, a: N(poly([[1, 2], [p + q0, 1], [p * q0, 0]])) };
    }
  },
  factorise: {
    name: { en: "Factorising", ar: "التحليل إلى عوامل" }, grades: [9, 10, 11],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 2, 6), b = ri(r, 2, 9);
        return { q: { en: `Factorise:  ${a}x + ${a * b}`, ar: `حلل إلى عوامل:  ${a}x + ${a * b}` }, a: N(`${a}(x + ${b})`) };
      }
      const p = ri(r, 1, 6), q0 = ri(r, 1, 6) * (d === 3 ? -1 : 1);
      const fmt = (v) => (v < 0 ? `(x − ${-v})` : `(x + ${v})`);
      return { q: { en: `Factorise:  ${poly([[1, 2], [p + q0, 1], [p * q0, 0]])}`, ar: `حلل إلى عوامل:  ${poly([[1, 2], [p + q0, 1], [p * q0, 0]])}` }, a: N(`${fmt(p)}${fmt(q0)}`) };
    }
  },
  simultaneous: {
    name: { en: "Simultaneous equations", ar: "المعادلات الآنية" }, grades: [9, 10, 11],
    gen(r, d) {
      const x = ri(r, 1, 6), y = ri(r, 1, 6);
      const a1 = ri(r, 1, d), b1 = ri(r, 1, 3), a2 = ri(r, 1, 3), b2 = d === 1 ? b1 : ri(r, 1, 3);
      if (a1 * b2 === a2 * b1) return this.gen(r, d);
      const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
      const eq = (a, b, c) => `${a === 1 ? "" : a}x + ${b === 1 ? "" : b}y = ${c}`;
      return {
        q: { en: `Solve the simultaneous equations:\n${eq(a1, b1, c1)}\n${eq(a2, b2, c2)}`, ar: `حل المعادلتين الآنيتين:\n${eq(a1, b1, c1)}\n${eq(a2, b2, c2)}` },
        a: N(`x = ${x}, y = ${y}`)
      };
    }
  },
  straightLine: {
    name: { en: "Straight-line graphs", ar: "المستقيمات البيانية" }, grades: [9, 10],
    gen(r, d) {
      const m = ri(r, 1, 2 + d) * (d === 3 && r() < 0.5 ? -1 : 1), c = ri(r, -6, 8);
      const line = `y = ${m === 1 ? "" : m === -1 ? "−" : m}x ${c >= 0 ? "+ " + c : "− " + -c}`;
      if (r() < 0.5)
        return { q: { en: `Write down the gradient of the line ${line}`, ar: `اكتب ميل المستقيم ${line}` }, a: N(m) };
      return { q: { en: `Write down the y-intercept of the line ${line}`, ar: `اكتب المقطع الصادي للمستقيم ${line}` }, a: N(`(0, ${c})`) };
    }
  },
  pythagoras: {
    name: { en: "Pythagoras' theorem", ar: "نظرية فيثاغورس" }, grades: [9, 10, 11],
    gen(r, d) {
      const t = pick(r, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]);
      const k = d === 1 ? 1 : ri(r, 1, 3);
      const [a, b, c] = t.map((v) => v * k);
      if (d < 3)
        return { q: { en: `A right-angled triangle has shorter sides ${a} cm and ${b} cm. Find the hypotenuse.`, ar: `مثلث قائم الزاوية ضلعاه الأقصران ${a} سم و ${b} سم. أوجد الوتر.` }, a: N(`${c} cm`) };
      return { q: { en: `A right-angled triangle has hypotenuse ${c} cm and one side ${a} cm. Find the other side.`, ar: `مثلث قائم الزاوية وتره ${c} سم وأحد ضلعيه ${a} سم. أوجد الضلع الآخر.` }, a: N(`${b} cm`) };
    }
  },
  standardForm: {
    name: { en: "Standard form", ar: "الصيغة العلمية" }, grades: [9, 10],
    gen(r, d) {
      const a = ri(r, 11, 99) / 10, p = ri(r, d, d * 3) * (d === 3 && r() < 0.5 ? -1 : 1);
      const val = a * Math.pow(10, p);
      const shown = p >= 0 ? String(Math.round(val * 10) / 10) : val.toFixed(-p + 1).replace(/0+$/, "").replace(/\.$/, "");
      return { q: { en: `Write ${shown} in standard form.`, ar: `اكتب ${shown} بالصيغة العلمية.` }, a: N(`${a} × 10${p < 0 ? "⁻" : ""}${sup(Math.abs(p))}`) };
    }
  },
  inequality: {
    name: { en: "Inequalities", ar: "المتباينات" }, grades: [9, 10],
    gen(r, d) {
      const a = ri(r, 2, 2 + d), b = ri(r, 1, 9), x = ri(r, 1, 8);
      return { q: { en: `Solve:  ${a}x + ${b} < ${a * x + b}`, ar: `حل المتباينة:  ${a}x + ${b} < ${a * x + b}` }, a: N(`x < ${x}`) };
    }
  },
  quadraticSolve: {
    name: { en: "Solving quadratics", ar: "حل المعادلات التربيعية" }, grades: [10, 11, 12],
    gen(r, d) {
      const p = ri(r, 1, 5 + d), q0 = ri(r, 1, 5 + d) * (d >= 2 && r() < 0.5 ? -1 : 1);
      if (p === q0) return this.gen(r, d);
      return {
        q: { en: `Solve:  ${poly([[1, 2], [p + q0, 1], [p * q0, 0]])} = 0`, ar: `حل المعادلة:  ${poly([[1, 2], [p + q0, 1], [p * q0, 0]])} = 0` },
        a: N(`x = ${-p}  or  x = ${-q0}`)
      };
    }
  },
  trigRightAngle: {
    name: { en: "Right-angled trigonometry", ar: "حساب المثلثات في المثلث القائم" }, grades: [10, 11],
    gen(r, d) {
      const angle = pick(r, [25, 30, 35, 40, 50, 55, 60]);
      const adj = ri(r, 4, 8 + d * 4);
      const opp = adj * Math.tan((angle * Math.PI) / 180);
      return {
        q: { en: `In a right-angled triangle, the angle is ${angle}° and the adjacent side is ${adj} cm. Find the opposite side to 1 decimal place.`, ar: `في مثلث قائم الزاوية، قياس الزاوية ${angle}° والضلع المجاور ${adj} سم. أوجد الضلع المقابل لأقرب منزلة عشرية.` },
        a: N(`${opp.toFixed(1)} cm  (${adj} × tan ${angle}°)`)
      };
    }
  },
  indices: {
    name: { en: "Laws of indices", ar: "قوانين الأسس" }, grades: [10, 11],
    gen(r, d) {
      const m = ri(r, 2, 5 + d), n = ri(r, 2, 4 + d);
      if (d < 3)
        return { q: { en: `Simplify:  x${sup(m)} × x${sup(n)}`, ar: `بسّط:  x${sup(m)} × x${sup(n)}` }, a: N(`x${sup(m + n)}`) };
      return { q: { en: `Simplify:  (x${sup(m)})${sup(n)} ÷ x${sup(n)}`, ar: `بسّط:  (x${sup(m)})${sup(n)} ÷ x${sup(n)}` }, a: N(`x${sup(m * n - n)}`) };
    }
  },
  differentiation: {
    name: { en: "Differentiation", ar: "التفاضل" }, grades: [12],
    gen(r, d) {
      const a = ri(r, 1, 3 + d), n = ri(r, 2, 2 + d), b = ri(r, 1, 9), c = ri(r, 1, 9);
      const f = poly([[a, n], [b, 1], [c, 0]]);
      const df = poly([[a * n, n - 1], [b, 0]]);
      return { q: { en: `Differentiate:  y = ${f}`, ar: `أوجد المشتقة:  y = ${f}` }, a: N(`dy/dx = ${df}`) };
    }
  },
  integration: {
    name: { en: "Integration", ar: "التكامل" }, grades: [12],
    gen(r, d) {
      const n = ri(r, 1, 2 + d);
      const a = (n + 1) * ri(r, 1, 3);
      const b = ri(r, 1, 9);
      const f = poly([[a, n], [b, 0]]);
      const F = poly([[a / (n + 1), n + 1], [b, 1]]);
      return { q: { en: `Find:  ∫ (${f}) dx`, ar: `أوجد:  ∫ (${f}) dx` }, a: N(`${F} + c`) };
    }
  },
  binomial: {
    name: { en: "Binomial expansion", ar: "مفكوك ذي الحدين" }, grades: [12],
    gen(r, d) {
      const n = ri(r, 4, 5 + d), k = ri(r, 2, 3), a = ri(r, 2, 2 + d);
      const C = (n_, k_) => { let c = 1; for (let i = 0; i < k_; i++) c = (c * (n_ - i)) / (i + 1); return c; };
      return {
        q: { en: `Find the coefficient of x${sup(k)} in the expansion of (1 + ${a}x)${sup(n)}`, ar: `أوجد معامل x${sup(k)} في مفكوك (1 + ${a}x)${sup(n)}` },
        a: N(`${C(n, k) * Math.pow(a, k)}  (C(${n},${k}) × ${a}${sup(k)})`)
      };
    }
  }
};

// Which generators are appropriate for each grade
const GRADE_GENS = {};
for (let g = 1; g <= 12; g++) GRADE_GENS[g] = [];
for (const [id, def] of Object.entries(GENERATORS))
  for (const g of def.grades) GRADE_GENS[g].push(id);
