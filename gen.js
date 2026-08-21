// AlIPS question generator engine.
// Each generator: { name: T(en,ar), grades: [..], gen(r, d) -> {q: T, a: T, sol: [step]} }
// r = seeded RNG function, d = difficulty 1 (easy) | 2 (medium) | 3 (hard).
// A step is { t: T, m: "M1"|"A1"|"B1" } — Cambridge-style mark scheme codes
// (M = method, A = accuracy, B = independent). Pure-math steps use SN() —
// the same string in both languages.

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
const S = (en, ar, m) => ({ t: { en, ar }, m });
const SN = (s, m) => ({ t: N(s), m });
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n) => String(n).split("").map((c) => SUP[+c]).join("");

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
      return { q: { en: `Work out ${a} + ${b}`, ar: `احسب ${a} + ${b}` }, a: N(a + b),
        sol: [SN(`${a} + ${b} = ${a + b}`, "B1")] };
    }
  },
  subWithin20: {
    name: { en: "Subtraction within 20", ar: "الطرح ضمن 20" }, grades: [1, 2],
    gen(r, d) {
      const a = ri(r, d * 4, d * 6 + 2), b = ri(r, 1, a - 1);
      return { q: { en: `Work out ${a} − ${b}`, ar: `احسب ${a} − ${b}` }, a: N(a - b),
        sol: [SN(`${a} − ${b} = ${a - b}`, "B1")] };
    }
  },
  missingNumber: {
    name: { en: "Missing numbers", ar: "الأعداد المفقودة" }, grades: [1, 2, 3],
    gen(r, d) {
      const a = ri(r, 1, d * 7), b = ri(r, 1, d * 7);
      return { q: { en: `Find the missing number:  ${a} + ▢ = ${a + b}`, ar: `أوجد العدد المفقود:  ${a} + ▢ = ${a + b}` }, a: N(b),
        sol: [S(`Work backwards: subtract ${a} from ${a + b}`, `اعمل بالعكس: اطرح ${a} من ${a + b}`, "M1"), SN(`${a + b} − ${a} = ${b}`, "A1")] };
    }
  },
  placeValue: {
    name: { en: "Place value", ar: "القيمة المكانية" }, grades: [2, 3, 4],
    gen(r, d) {
      const n = ri(r, d === 1 ? 10 : d === 2 ? 100 : 1000, d === 1 ? 99 : d === 2 ? 999 : 9999);
      const s = String(n), i = ri(r, 0, s.length - 1);
      const placePow = s.length - 1 - i;
      const val = +s[i] * Math.pow(10, placePow);
      const placeEn = ["ones", "tens", "hundreds", "thousands"][placePow];
      const placeAr = ["الآحاد", "العشرات", "المئات", "الآلاف"][placePow];
      return { q: { en: `What is the value of the digit ${s[i]} in ${n}?`, ar: `ما قيمة الرقم ${s[i]} في العدد ${n}؟` }, a: N(val),
        sol: [S(`The digit ${s[i]} is in the ${placeEn} place`, `الرقم ${s[i]} في منزلة ${placeAr}`, "M1"), SN(`${s[i]} × ${Math.pow(10, placePow)} = ${val}`, "A1")] };
    }
  },
  columnAdd: {
    name: { en: "Column addition", ar: "الجمع العمودي" }, grades: [2, 3, 4],
    gen(r, d) {
      const m = d === 1 ? 99 : d === 2 ? 999 : 9999;
      const a = ri(r, m / 9, m), b = ri(r, m / 9, m);
      return { q: { en: `Work out ${a} + ${b}`, ar: `احسب ${a} + ${b}` }, a: N(a + b),
        sol: [S("Line up the digits by place value and add column by column", "رتّب الأرقام حسب المنازل واجمع عموداً عموداً", "M1"), SN(`${a} + ${b} = ${a + b}`, "A1")] };
    }
  },
  columnSub: {
    name: { en: "Column subtraction", ar: "الطرح العمودي" }, grades: [3, 4, 5],
    gen(r, d) {
      const m = d === 1 ? 999 : d === 2 ? 9999 : 99999;
      let a = ri(r, m / 9, m), b = ri(r, m / 9, m);
      if (b > a) [a, b] = [b, a];
      return { q: { en: `Work out ${a} − ${b}`, ar: `احسب ${a} − ${b}` }, a: N(a - b),
        sol: [S("Line up the digits and subtract column by column, borrowing where needed", "رتّب الأرقام واطرح عموداً عموداً مع الاستلاف عند الحاجة", "M1"), SN(`${a} − ${b} = ${a - b}`, "A1")] };
    }
  },
  timesTables: {
    name: { en: "Times tables", ar: "جداول الضرب" }, grades: [2, 3, 4],
    gen(r, d) {
      const tables = d === 1 ? [2, 5, 10] : d === 2 ? [3, 4, 6, 8] : [7, 9, 11, 12];
      const a = pick(r, tables), b = ri(r, 2, 12);
      return { q: { en: `Work out ${a} × ${b}`, ar: `احسب ${a} × ${b}` }, a: N(a * b),
        sol: [SN(`${a} × ${b} = ${a * b}`, "B1")] };
    }
  },
  divisionRemainder: {
    name: { en: "Division with remainders", ar: "القسمة مع الباقي" }, grades: [3, 4, 5],
    gen(r, d) {
      const b = ri(r, 2, d + 4 + d), q0 = ri(r, 3, 9 + d * 5), rem = ri(r, 0, b - 1);
      const a = b * q0 + rem;
      const ans = rem ? `${q0} r ${rem}` : `${q0}`;
      return { q: { en: `Work out ${a} ÷ ${b}`, ar: `احسب ${a} ÷ ${b}` }, a: N(ans),
        sol: [SN(`${b} × ${q0} = ${b * q0}`, "M1"), rem ? SN(`${a} − ${b * q0} = ${rem}, so ${a} ÷ ${b} = ${q0} r ${rem}`, "A1") : SN(`${a} ÷ ${b} = ${q0} exactly`, "A1")] };
    }
  },
  longMultiplication: {
    name: { en: "Written multiplication", ar: "الضرب الكتابي" }, grades: [4, 5, 6],
    gen(r, d) {
      const a = ri(r, d === 3 ? 100 : 12, d === 1 ? 99 : d === 2 ? 999 : 999);
      const b = ri(r, d === 1 ? 3 : 12, d === 1 ? 9 : d === 2 ? 19 : 99);
      const tens = Math.floor(b / 10) * 10, ones = b % 10;
      const sol = b >= 10
        ? [SN(`${a} × ${tens} = ${a * tens}`, "M1"), SN(`${a} × ${ones} = ${a * ones}`, "M1"), SN(`${a * tens} + ${a * ones} = ${a * b}`, "A1")]
        : [S("Use column multiplication", "استخدم الضرب العمودي", "M1"), SN(`${a} × ${b} = ${a * b}`, "A1")];
      return { q: { en: `Work out ${a} × ${b}`, ar: `احسب ${a} × ${b}` }, a: N(a * b), sol };
    }
  },
  fractionOfAmount: {
    name: { en: "Fraction of an amount", ar: "كسر من كمية" }, grades: [3, 4, 5],
    gen(r, d) {
      const den = pick(r, d === 1 ? [2, 4] : d === 2 ? [3, 5, 10] : [6, 8, 12]);
      const num = d === 1 ? 1 : ri(r, 1, den - 1);
      const unit = ri(r, 2, 12);
      const total = den * unit;
      return { q: { en: `Find ${num}/${den} of ${total}`, ar: `أوجد ${num}/${den} من ${total}` }, a: N(num * unit),
        sol: [SN(`${total} ÷ ${den} = ${unit}`, "M1"), SN(`${unit} × ${num} = ${num * unit}`, "A1")] };
    }
  },
  equivalentFractions: {
    name: { en: "Equivalent fractions", ar: "الكسور المتكافئة" }, grades: [4, 5, 6],
    gen(r, d) {
      const den = ri(r, 2, 6 + d), num = ri(r, 1, den - 1), k = ri(r, 2, 3 + d * 2);
      return { q: { en: `Complete:  ${num}/${den} = ▢/${den * k}`, ar: `أكمل:  ${num}/${den} = ▢/${den * k}` }, a: N(num * k),
        sol: [SN(`${den} × ${k} = ${den * k}`, "M1"), S(`Multiply the numerator by the same number: ${num} × ${k} = ${num * k}`, `اضرب البسط في العدد نفسه: ${num} × ${k} = ${num * k}`, "A1")] };
    }
  },
  addFractions: {
    name: { en: "Adding fractions", ar: "جمع الكسور" }, grades: [5, 6, 7],
    gen(r, d) {
      let d1 = ri(r, 2, 6 + d), d2 = d === 1 ? d1 : ri(r, 2, 6 + d);
      const n1 = ri(r, 1, d1 - 1), n2 = ri(r, 1, d2 - 1);
      let num = n1 * d2 + n2 * d1, den = d1 * d2;
      const rawNum = num, rawDen = den;
      const g = gcd(num, den); num /= g; den /= g;
      const ans = den === 1 ? `${num}` : num > den ? `${num}/${den} = ${Math.floor(num / den)} ${num % den}/${den}` : `${num}/${den}`;
      const sol = d1 === d2
        ? [SN(`${n1}/${d1} + ${n2}/${d1} = ${n1 + n2}/${d1}`, "M1"), SN(`= ${ans}`, "A1")]
        : [S(`Common denominator: ${d1} × ${d2} = ${rawDen}`, `المقام المشترك: ${d1} × ${d2} = ${rawDen}`, "M1"),
           SN(`${n1 * d2}/${rawDen} + ${n2 * d1}/${rawDen} = ${rawNum}/${rawDen}`, "M1"),
           SN(`= ${ans}`, "A1")];
      return { q: { en: `Work out ${n1}/${d1} + ${n2}/${d2}. Give your answer in its simplest form.`, ar: `احسب ${n1}/${d1} + ${n2}/${d2} وأعطِ الناتج في أبسط صورة.` }, a: N(ans), sol };
    }
  },
  percentOfAmount: {
    name: { en: "Percentage of an amount", ar: "النسبة المئوية من كمية" }, grades: [5, 6, 7],
    gen(r, d) {
      const p = pick(r, d === 1 ? [10, 25, 50] : d === 2 ? [5, 20, 30, 75] : [15, 35, 45, 65, 85]);
      const base = ri(r, 2, 20) * (d === 3 ? 20 : 10);
      return { q: { en: `Find ${p}% of ${base}`, ar: `أوجد ${p}% من ${base}` }, a: N((p * base) / 100),
        sol: [SN(`${p}% = ${p}/100`, "M1"), SN(`${p}/100 × ${base} = ${(p * base) / 100}`, "A1")] };
    }
  },
  orderOfOperations: {
    name: { en: "Order of operations", ar: "أولويات العمليات" }, grades: [5, 6, 7],
    gen(r, d) {
      const a = ri(r, 2, 9), b = ri(r, 2, 9), c = ri(r, 2, 9);
      const first = S("Multiplication and powers before addition and subtraction", "الضرب والقوى قبل الجمع والطرح", "M1");
      if (d === 1) return { q: { en: `Work out ${a} + ${b} × ${c}`, ar: `احسب ${a} + ${b} × ${c}` }, a: N(a + b * c),
        sol: [first, SN(`${b} × ${c} = ${b * c}`, "M1"), SN(`${a} + ${b * c} = ${a + b * c}`, "A1")] };
      if (d === 2) return { q: { en: `Work out (${a} + ${b}) × ${c} − ${b}`, ar: `احسب (${a} + ${b}) × ${c} − ${b}` }, a: N((a + b) * c - b),
        sol: [S("Brackets first", "الأقواس أولاً", "M1"), SN(`${a + b} × ${c} = ${(a + b) * c}`, "M1"), SN(`${(a + b) * c} − ${b} = ${(a + b) * c - b}`, "A1")] };
      return { q: { en: `Work out ${a} × ${b} − ${c}² + ${a}`, ar: `احسب ${a} × ${b} − ${c}² + ${a}` }, a: N(a * b - c * c + a),
        sol: [first, SN(`${a} × ${b} = ${a * b},  ${c}² = ${c * c}`, "M1"), SN(`${a * b} − ${c * c} + ${a} = ${a * b - c * c + a}`, "A1")] };
    }
  },
  areaPerimeterRect: {
    name: { en: "Area and perimeter of rectangles", ar: "مساحة ومحيط المستطيلات" }, grades: [4, 5, 6],
    gen(r, d) {
      const l = ri(r, 3, 8 + d * 4), w = ri(r, 2, l - 1);
      if (r() < 0.5)
        return { q: { en: `A rectangle is ${l} cm long and ${w} cm wide. Find its area.`, ar: `مستطيل طوله ${l} سم وعرضه ${w} سم. أوجد مساحته.` }, a: N(`${l * w} cm²`),
          sol: [S("Area = length × width", "المساحة = الطول × العرض", "M1"), SN(`${l} × ${w} = ${l * w} cm²`, "A1")] };
      return { q: { en: `A rectangle is ${l} cm long and ${w} cm wide. Find its perimeter.`, ar: `مستطيل طوله ${l} سم وعرضه ${w} سم. أوجد محيطه.` }, a: N(`${2 * (l + w)} cm`),
        sol: [S("Perimeter = 2 × (length + width)", "المحيط = 2 × (الطول + العرض)", "M1"), SN(`2 × (${l} + ${w}) = ${2 * (l + w)} cm`, "A1")] };
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
      return { q: { en: `Find the mean of: ${nums.join(", ")}`, ar: `أوجد الوسط الحسابي للأعداد: ${nums.join("، ")}` }, a: N(mean),
        sol: [SN(`${nums.join(" + ")} = ${mean * n}`, "M1"), SN(`${mean * n} ÷ ${n} = ${mean}`, "A1")] };
    }
  },
  negativeNumbers: {
    name: { en: "Negative numbers", ar: "الأعداد السالبة" }, grades: [7, 8],
    gen(r, d) {
      const a = ri(r, -9 - d * 3, 9 + d * 3), b = ri(r, 1, 9 + d * 3);
      const op = pick(r, d === 3 ? ["−", "+", "×"] : ["−", "+"]);
      const bs = `(−${b})`;
      const ans = op === "+" ? a - b : op === "−" ? a + b : -a * b;
      const rule = op === "−"
        ? S("Subtracting a negative is the same as adding", "طرح عدد سالب يعني الجمع", "M1")
        : op === "+"
        ? S("Adding a negative is the same as subtracting", "جمع عدد سالب يعني الطرح", "M1")
        : S("Positive × negative gives a negative; negative × negative gives a positive", "موجب × سالب = سالب؛ سالب × سالب = موجب", "M1");
      return { q: { en: `Work out ${a} ${op} ${bs}`, ar: `احسب ${a} ${op} ${bs}` }, a: N(ans),
        sol: [rule, SN(`= ${ans}`, "A1")] };
    }
  },
  powersRoots: {
    name: { en: "Powers and roots", ar: "القوى والجذور" }, grades: [7, 8, 9],
    gen(r, d) {
      if (d === 1) { const a = ri(r, 2, 12); return { q: { en: `Work out ${a}²`, ar: `احسب ${a}²` }, a: N(a * a),
        sol: [SN(`${a} × ${a} = ${a * a}`, "B1")] }; }
      if (d === 2) { const a = ri(r, 2, 15); return { q: { en: `Work out √${a * a}`, ar: `احسب √${a * a}` }, a: N(a),
        sol: [SN(`${a} × ${a} = ${a * a}, so √${a * a} = ${a}`, "B1")] }; }
      const a = ri(r, 2, 6); return { q: { en: `Work out ${a}³`, ar: `احسب ${a}³` }, a: N(a * a * a),
        sol: [SN(`${a} × ${a} = ${a * a}`, "M1"), SN(`${a * a} × ${a} = ${a * a * a}`, "A1")] };
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
        a: N(`${b * unit} rials / ريال`),
        sol: [S(`Total parts: ${a} + ${b} = ${a + b}`, `مجموع الأجزاء: ${a} + ${b} = ${a + b}`, "M1"),
              SN(`${total} ÷ ${a + b} = ${unit}`, "M1"),
              S(`Ahmed's share: ${b} × ${unit} = ${b * unit} rials`, `نصيب أحمد: ${b} × ${unit} = ${b * unit} ريال`, "A1")]
      };
    }
  },
  anglesTriangle: {
    name: { en: "Angles in a triangle", ar: "زوايا المثلث" }, grades: [6, 7, 8],
    gen(r, d) {
      const a = ri(r, 20, 80), b = ri(r, 20, Math.min(150 - a, 100));
      return { q: { en: `Two angles of a triangle are ${a}° and ${b}°. Find the third angle.`, ar: `زاويتان في مثلث قياسهما ${a}° و ${b}°. أوجد الزاوية الثالثة.` }, a: N(`${180 - a - b}°`),
        sol: [S("Angles in a triangle add up to 180°", "مجموع زوايا المثلث 180°", "M1"), SN(`180 − ${a} − ${b} = ${180 - a - b}°`, "A1")] };
    }
  },
  circleArea: {
    name: { en: "Circumference and area of circles", ar: "محيط الدائرة ومساحتها" }, grades: [8, 9, 10],
    gen(r, d) {
      const rad = ri(r, 2, 6 + d * 3);
      if (r() < 0.5)
        return { q: { en: `A circle has radius ${rad} cm. Find its circumference. Give your answer in terms of π.`, ar: `دائرة نصف قطرها ${rad} سم. أوجد محيطها بدلالة π.` }, a: N(`${2 * rad}π cm`),
          sol: [S("Circumference = 2πr", "المحيط = 2πنق", "M1"), SN(`2 × π × ${rad} = ${2 * rad}π cm`, "A1")] };
      return { q: { en: `A circle has radius ${rad} cm. Find its area. Give your answer in terms of π.`, ar: `دائرة نصف قطرها ${rad} سم. أوجد مساحتها بدلالة π.` }, a: N(`${rad * rad}π cm²`),
        sol: [S("Area = πr²", "المساحة = π × نق²", "M1"), SN(`π × ${rad}² = ${rad * rad}π cm²`, "A1")] };
    }
  },
  solveLinear: {
    name: { en: "Solving linear equations", ar: "حل المعادلات الخطية" }, grades: [7, 8, 9],
    gen(r, d) {
      const x = ri(r, d === 3 ? -9 : 1, 9), a = ri(r, 2, 2 + d * 2), b = ri(r, 1, 12);
      if (d < 3) {
        const c = a * x + b;
        return { q: { en: `Solve:  ${a}x + ${b} = ${c}`, ar: `حل المعادلة:  ${a}x + ${b} = ${c}` }, a: N(`x = ${x}`),
          sol: [SN(`${a}x = ${c} − ${b} = ${a * x}`, "M1"), SN(`x = ${a * x} ÷ ${a} = ${x}`, "A1")] };
      }
      const c = ri(r, 1, a - 1);
      const k = (a - c) * x + b;
      const rhs = `${c === 1 ? "" : c}x ${k >= 0 ? "+ " + k : "− " + -k}`;
      return { q: { en: `Solve:  ${a}x + ${b} = ${rhs}`, ar: `حل المعادلة:  ${a}x + ${b} = ${rhs}` }, a: N(`x = ${x}`),
        sol: [S(`Collect x terms: ${a}x − ${c === 1 ? "" : c}x = ${a - c}x`, `اجمع حدود x: ‏${a}x − ${c === 1 ? "" : c}x = ${a - c}x`, "M1"),
              SN(`${a - c}x = ${k} − ${b} = ${(a - c) * x}`, "M1"),
              SN(`x = ${(a - c) * x} ÷ ${a - c} = ${x}`, "A1")] };
    }
  },
  sequenceNth: {
    name: { en: "nth term of a sequence", ar: "الحد النوني للمتتالية" }, grades: [7, 8, 9],
    gen(r, d) {
      const m = ri(r, 2, 3 + d * 2), c = ri(r, -5, 9);
      const terms = [1, 2, 3, 4].map((n) => m * n + c);
      const rule = c === 0 ? `${m}n` : c > 0 ? `${m}n + ${c}` : `${m}n − ${-c}`;
      return { q: { en: `Find the nth term of the sequence: ${terms.join(", ")}, …`, ar: `أوجد الحد النوني للمتتالية: ${terms.join("، ")}، …` }, a: N(rule),
        sol: [S(`Common difference: ${terms[1]} − ${terms[0]} = ${m}, so the rule starts ${m}n`, `الفرق المشترك: ${terms[1]} − ${terms[0]} = ${m}، فتبدأ القاعدة بـ ${m}n`, "M1"),
              S(`Adjust: ${m} × 1 = ${m}, first term is ${terms[0]}, so ${c >= 0 ? "add " + c : "subtract " + -c}`, `عدّل: ${m} × 1 = ${m} والحد الأول ${terms[0]}، إذن ${c >= 0 ? "أضف " + c : "اطرح " + -c}`, "M1"),
              SN(`nth term = ${rule}`, "A1")] };
    }
  },
  expandBrackets: {
    name: { en: "Expanding brackets", ar: "فك الأقواس" }, grades: [8, 9, 10],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 2, 7), b = ri(r, 1, 9);
        return { q: { en: `Expand:  ${a}(x + ${b})`, ar: `فك الأقواس:  ${a}(x + ${b})` }, a: N(`${a}x + ${a * b}`),
          sol: [S(`Multiply each term inside by ${a}`, `اضرب كل حد داخل القوس في ${a}`, "M1"), SN(`${a} × x = ${a}x,  ${a} × ${b} = ${a * b}`, "A1")] };
      }
      const p = ri(r, 1, 6) * (d === 3 && r() < 0.5 ? -1 : 1), q0 = ri(r, 1, 6) * (r() < 0.5 ? -1 : 1);
      const fmt = (v) => (v < 0 ? `(x − ${-v})` : `(x + ${v})`);
      const ex = poly([[1, 2], [p + q0, 1], [p * q0, 0]]);
      return { q: { en: `Expand and simplify:  ${fmt(p)}${fmt(q0)}`, ar: `فك الأقواس وبسّط:  ${fmt(p)}${fmt(q0)}` }, a: N(ex),
        sol: [S("Multiply every term in the first bracket by every term in the second", "اضرب كل حد في القوس الأول في كل حد في القوس الثاني", "M1"),
              SN(`x² ${p >= 0 ? "+ " + p : "− " + -p}x ${q0 >= 0 ? "+ " + q0 : "− " + -q0}x ${p * q0 >= 0 ? "+ " + p * q0 : "− " + -(p * q0)}`, "M1"),
              SN(`= ${ex}`, "A1")] };
    }
  },
  factorise: {
    name: { en: "Factorising", ar: "التحليل إلى عوامل" }, grades: [9, 10, 11],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 2, 6), b = ri(r, 2, 9);
        return { q: { en: `Factorise:  ${a}x + ${a * b}`, ar: `حلل إلى عوامل:  ${a}x + ${a * b}` }, a: N(`${a}(x + ${b})`),
          sol: [S(`The highest common factor is ${a}`, `العامل المشترك الأكبر هو ${a}`, "M1"), SN(`${a}x + ${a * b} = ${a}(x + ${b})`, "A1")] };
      }
      const p = ri(r, 1, 6), q0 = ri(r, 1, 6) * (d === 3 ? -1 : 1);
      const fmt = (v) => (v < 0 ? `(x − ${-v})` : `(x + ${v})`);
      const ex = poly([[1, 2], [p + q0, 1], [p * q0, 0]]);
      return { q: { en: `Factorise:  ${ex}`, ar: `حلل إلى عوامل:  ${ex}` }, a: N(`${fmt(p)}${fmt(q0)}`),
        sol: [S(`Find two numbers with sum ${p + q0} and product ${p * q0}: they are ${p} and ${q0}`, `أوجد عددين مجموعهما ${p + q0} وحاصل ضربهما ${p * q0}: هما ${p} و ${q0}`, "M1"),
              SN(`${ex} = ${fmt(p)}${fmt(q0)}`, "A1")] };
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
        a: N(`x = ${x}, y = ${y}`),
        sol: [S("Multiply the equations so one unknown has equal coefficients, then subtract to eliminate it", "اضرب المعادلتين حتى يتساوى معامل أحد المجهولين ثم اطرح للحذف", "M1"),
              SN(`x = ${x}`, "A1"),
              S(`Substitute back: y = ${y}`, `بالتعويض: y = ${y}`, "A1")]
      };
    }
  },
  straightLine: {
    name: { en: "Straight-line graphs", ar: "المستقيمات البيانية" }, grades: [9, 10],
    gen(r, d) {
      const m = ri(r, 1, 2 + d) * (d === 3 && r() < 0.5 ? -1 : 1), c = ri(r, -6, 8);
      const line = `y = ${m === 1 ? "" : m === -1 ? "−" : m}x ${c >= 0 ? "+ " + c : "− " + -c}`;
      const cmp = S("Compare with y = mx + c: m is the gradient, c the y-intercept", "قارن بالصورة y = mx + c حيث m الميل و c المقطع الصادي", "M1");
      if (r() < 0.5)
        return { q: { en: `Write down the gradient of the line ${line}`, ar: `اكتب ميل المستقيم ${line}` }, a: N(m),
          sol: [cmp, SN(`m = ${m}`, "A1")] };
      return { q: { en: `Write down the y-intercept of the line ${line}`, ar: `اكتب المقطع الصادي للمستقيم ${line}` }, a: N(`(0, ${c})`),
        sol: [cmp, SN(`(0, ${c})`, "A1")] };
    }
  },
  pythagoras: {
    name: { en: "Pythagoras' theorem", ar: "نظرية فيثاغورس" }, grades: [9, 10, 11],
    gen(r, d) {
      const t = pick(r, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]);
      const k = d === 1 ? 1 : ri(r, 1, 3);
      const [a, b, c] = t.map((v) => v * k);
      if (d < 3)
        return { q: { en: `A right-angled triangle has shorter sides ${a} cm and ${b} cm. Find the hypotenuse.`, ar: `مثلث قائم الزاوية ضلعاه الأقصران ${a} سم و ${b} سم. أوجد الوتر.` }, a: N(`${c} cm`),
          sol: [SN(`c² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}`, "M1"), SN(`c = √${c * c} = ${c} cm`, "A1")] };
      return { q: { en: `A right-angled triangle has hypotenuse ${c} cm and one side ${a} cm. Find the other side.`, ar: `مثلث قائم الزاوية وتره ${c} سم وأحد ضلعيه ${a} سم. أوجد الضلع الآخر.` }, a: N(`${b} cm`),
        sol: [SN(`b² = ${c}² − ${a}² = ${c * c} − ${a * a} = ${b * b}`, "M1"), SN(`b = √${b * b} = ${b} cm`, "A1")] };
    }
  },
  standardForm: {
    name: { en: "Standard form", ar: "الصيغة العلمية" }, grades: [9, 10],
    gen(r, d) {
      const a = ri(r, 11, 99) / 10, p = ri(r, d, d * 3) * (d === 3 && r() < 0.5 ? -1 : 1);
      const val = a * Math.pow(10, p);
      const shown = p >= 0 ? String(Math.round(val * 10) / 10) : val.toFixed(-p + 1).replace(/0+$/, "").replace(/\.$/, "");
      const ansS = `${a} × 10${p < 0 ? "⁻" : ""}${sup(Math.abs(p))}`;
      return { q: { en: `Write ${shown} in standard form.`, ar: `اكتب ${shown} بالصيغة العلمية.` }, a: N(ansS),
        sol: [S(`Move the decimal point ${Math.abs(p)} place(s) so one non-zero digit is before the point`, `حرّك الفاصلة العشرية ${Math.abs(p)} منزلة بحيث يسبقها رقم واحد غير صفري`, "M1"),
              SN(`${shown} = ${ansS}`, "A1")] };
    }
  },
  inequality: {
    name: { en: "Inequalities", ar: "المتباينات" }, grades: [9, 10],
    gen(r, d) {
      const a = ri(r, 2, 2 + d), b = ri(r, 1, 9), x = ri(r, 1, 8);
      const c = a * x + b;
      return { q: { en: `Solve:  ${a}x + ${b} < ${c}`, ar: `حل المتباينة:  ${a}x + ${b} < ${c}` }, a: N(`x < ${x}`),
        sol: [SN(`${a}x < ${c} − ${b} = ${a * x}`, "M1"), S(`Divide by ${a} (positive, so the sign is unchanged): x < ${x}`, `اقسم على ${a} (موجب فلا تتغير الإشارة): x < ${x}`, "A1")] };
    }
  },
  quadraticSolve: {
    name: { en: "Solving quadratics", ar: "حل المعادلات التربيعية" }, grades: [10, 11, 12],
    gen(r, d) {
      const p = ri(r, 1, 5 + d), q0 = ri(r, 1, 5 + d) * (d >= 2 && r() < 0.5 ? -1 : 1);
      if (p === q0) return this.gen(r, d);
      const fmt = (v) => (v < 0 ? `(x − ${-v})` : `(x + ${v})`);
      const ex = poly([[1, 2], [p + q0, 1], [p * q0, 0]]);
      return {
        q: { en: `Solve:  ${ex} = 0`, ar: `حل المعادلة:  ${ex} = 0` },
        a: N(`x = ${-p}  or  x = ${-q0}`),
        sol: [S(`Factorise: two numbers with sum ${p + q0} and product ${p * q0} are ${p} and ${q0}`, `حلل: عددان مجموعهما ${p + q0} وحاصل ضربهما ${p * q0} هما ${p} و ${q0}`, "M1"),
              SN(`${fmt(p)}${fmt(q0)} = 0`, "M1"),
              SN(`x = ${-p}  or  x = ${-q0}`, "A1")]
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
        a: N(`${opp.toFixed(1)} cm`),
        sol: [S("Opposite and adjacent → use tan", "المقابل والمجاور ← استخدم الظل (ظا)", "M1"),
              S(`opposite = ${adj} × tan ${angle}°`, `المقابل = ${adj} × ظا ${angle}°`, "M1"),
              SN(`= ${opp.toFixed(1)} cm`, "A1")]
      };
    }
  },
  indices: {
    name: { en: "Laws of indices", ar: "قوانين الأسس" }, grades: [10, 11],
    gen(r, d) {
      const m = ri(r, 2, 5 + d), n = ri(r, 2, 4 + d);
      if (d < 3)
        return { q: { en: `Simplify:  x${sup(m)} × x${sup(n)}`, ar: `بسّط:  x${sup(m)} × x${sup(n)}` }, a: N(`x${sup(m + n)}`),
          sol: [S("When multiplying, add the indices", "عند الضرب تُجمع الأسس", "M1"), SN(`${m} + ${n} = ${m + n}, so x${sup(m + n)}`, "A1")] };
      return { q: { en: `Simplify:  (x${sup(m)})${sup(n)} ÷ x${sup(n)}`, ar: `بسّط:  (x${sup(m)})${sup(n)} ÷ x${sup(n)}` }, a: N(`x${sup(m * n - n)}`),
        sol: [SN(`(x${sup(m)})${sup(n)} = x${sup(m * n)}`, "M1"), S(`When dividing, subtract: ${m * n} − ${n} = ${m * n - n}`, `عند القسمة تُطرح الأسس: ${m * n} − ${n} = ${m * n - n}`, "A1")] };
    }
  },
  differentiation: {
    name: { en: "Differentiation", ar: "التفاضل" }, grades: [12],
    gen(r, d) {
      const a = ri(r, 1, 3 + d), n = ri(r, 2, 2 + d), b = ri(r, 1, 9), c = ri(r, 1, 9);
      const f = poly([[a, n], [b, 1], [c, 0]]);
      const df = poly([[a * n, n - 1], [b, 0]]);
      return { q: { en: `Differentiate:  y = ${f}`, ar: `أوجد المشتقة:  y = ${f}` }, a: N(`dy/dx = ${df}`),
        sol: [S("Multiply by the power, then reduce the power by 1; constants vanish", "اضرب في الأس ثم أنقص الأس بمقدار 1؛ ومشتقة الثابت صفر", "M1"),
              SN(`${a}x${sup(n)} → ${a * n}x${n - 1 === 1 ? "" : sup(n - 1)},  ${b}x → ${b},  ${c} → 0`, "M1"),
              SN(`dy/dx = ${df}`, "A1")] };
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
      return { q: { en: `Find:  ∫ (${f}) dx`, ar: `أوجد:  ∫ (${f}) dx` }, a: N(`${F} + c`),
        sol: [S("Raise the power by 1, then divide by the new power", "ارفع الأس بمقدار 1 ثم اقسم على الأس الجديد", "M1"),
              SN(`${a}x${sup(n)} → ${a}x${sup(n + 1)}/${n + 1} = ${a / (n + 1)}x${sup(n + 1)},  ${b} → ${b}x`, "M1"),
              S(`Add the constant of integration: ${F} + c`, `أضف ثابت التكامل: ${F} + c`, "A1")] };
    }
  },
  binomial: {
    name: { en: "Binomial expansion", ar: "مفكوك ذي الحدين" }, grades: [12],
    gen(r, d) {
      const n = ri(r, 4, 5 + d), k = ri(r, 2, 3), a = ri(r, 2, 2 + d);
      const C = (n_, k_) => { let c = 1; for (let i = 0; i < k_; i++) c = (c * (n_ - i)) / (i + 1); return c; };
      const coef = C(n, k), ans = coef * Math.pow(a, k);
      return {
        q: { en: `Find the coefficient of x${sup(k)} in the expansion of (1 + ${a}x)${sup(n)}`, ar: `أوجد معامل x${sup(k)} في مفكوك (1 + ${a}x)${sup(n)}` },
        a: N(ans),
        sol: [S(`The x${sup(k)} term is C(${n},${k}) × (${a}x)${sup(k)}`, `حد x${sup(k)} هو C(${n},${k}) × (${a}x)${sup(k)}`, "M1"),
              SN(`C(${n},${k}) = ${coef},  ${a}${sup(k)} = ${Math.pow(a, k)}`, "M1"),
              SN(`${coef} × ${Math.pow(a, k)} = ${ans}`, "A1")]
      };
    }
  }
};

// Which generators are appropriate for each grade
const GRADE_GENS = {};
for (let g = 1; g <= 12; g++) GRADE_GENS[g] = [];
for (const [id, def] of Object.entries(GENERATORS))
  for (const g of def.grades) GRADE_GENS[g].push(id);
