// AlIPS question generator engine (English).
// Each generator: { name, grades: [..], gen(r, d) -> { q, a, sol: [step] } }
// r = seeded RNG function, d = difficulty 1 (easy) | 2 (medium) | 3 (challenging).
// A step is { t: text, m: "M1"|"A1"|"B1" } — Cambridge-style mark scheme codes
// (M = method, A = accuracy, B = independent).

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
const S = (t, m) => ({ t, m });
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
// Print negatives with a true minus sign, matching the rest of the paper.
const nf = (v) => String(v).replace("-", "−");

// Math markup used inside question, answer and solution text.
//   ⁅n/d⁆  a fraction  →  rendered as a proper two-tier fraction
//   √⟨x⟩   a radical   →  rendered with a vinculum (overline)
// mathPlain() strips the markup back to flat text for answer checking.
const frac = (n, d) => `⁅${n}/${d}⁆`;
const rad = (x) => `√⟨${x}⟩`;
const mathPlain = (s) => String(s)
  .replace(/⁅([^\/⁆]*)\/([^⁆]*)⁆/g, "$1/$2")
  .replace(/√⟨([^⟩]*)⟩/g, "√$1");

// Superscript / subscript. Digits and the few symbols that appear in an index
// have real Unicode forms; anything else is passed through unchanged (mapping by
// `+c` alone would turn a space into ⁰, since +" " is 0).
const SUP_MAP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹",
  "+": "⁺", "-": "⁻", "−": "⁻", "(": "⁽", ")": "⁾", x: "ˣ", n: "ⁿ", a: "ᵃ", k: "ᵏ" };
const SUB_MAP = { 0: "₀", 1: "₁", 2: "₂", 3: "₃", 4: "₄", 5: "₅", 6: "₆", 7: "₇", 8: "₈", 9: "₉",
  "+": "₊", "-": "₋", "−": "₋", "(": "₍", ")": "₎", n: "ₙ", a: "ₐ", x: "ₓ" };
const sup = (n) => String(n).split("").map((c) => SUP_MAP[c] || c).join("");
const sub = (n) => String(n).split("").map((c) => SUB_MAP[c] || c).join("");

// Number names, for the reading-and-writing-numbers generator.
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function numberWords(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
  const h = ONES[Math.floor(n / 100)] + " hundred";
  return n % 100 ? h + " and " + numberWords(n % 100) : h;
}
// Two sorting properties and a set of numbers that fills every region — a Venn
// or Carroll diagram with an empty region teaches the child nothing.
const SORT_RULES = [
  { name: "Even", not: "Odd", test: (n) => n % 2 === 0 },
  { name: "Greater than 10", not: "10 or less", test: (n) => n > 10 },
  { name: "A multiple of 3", not: "Not a multiple of 3", test: (n) => n % 3 === 0 },
  { name: "A multiple of 5", not: "Not a multiple of 5", test: (n) => n % 5 === 0 },
  { name: "Less than 15", not: "15 or more", test: (n) => n < 15 },
  { name: "A two-digit number", not: "A one-digit number", test: (n) => n >= 10 },
  { name: "A multiple of 4", not: "Not a multiple of 4", test: (n) => n % 4 === 0 },
  { name: "A square number", not: "Not a square number", test: (n) => Number.isInteger(Math.sqrt(n)) }
];

function sortingSets(r, d) {
  const pool = d === 1 ? SORT_RULES.slice(0, 3) : d === 2 ? SORT_RULES.slice(0, 6) : SORT_RULES;
  const hi = d === 1 ? 20 : d === 2 ? 30 : 50;
  const want = d === 1 ? 8 : d === 2 ? 10 : 12;

  for (let attempt = 0; attempt < 60; attempt++) {
    const a = pick(r, pool);
    let b = pick(r, pool);
    if (b.name === a.name) continue;
    const regions = { both: [], onlyA: [], onlyB: [], neither: [] };
    const items = [];
    const seen = new Set();
    for (let i = 0; i < want * 6 && items.length < want; i++) {
      const n = ri(r, 1, hi);
      if (seen.has(n)) continue;
      seen.add(n);
      items.push(n);
      const inA = a.test(n), inB = b.test(n);
      (inA && inB ? regions.both : inA ? regions.onlyA : inB ? regions.onlyB : regions.neither).push(n);
    }
    // Every region must have something in it, or the diagram is not worth drawing.
    if (Object.values(regions).every((g) => g.length)) {
      const asc = (x, y) => x - y;
      return {
        a, b, items,
        both: regions.both.sort(asc), onlyA: regions.onlyA.sort(asc),
        onlyB: regions.onlyB.sort(asc), neither: regions.neither.sort(asc)
      };
    }
  }
  // Fallback that is guaranteed to fill all four regions.
  const a = SORT_RULES[0], b = SORT_RULES[1];
  return { a, b, items: [4, 7, 12, 15], both: [12], onlyA: [4], onlyB: [15], neither: [7] };
}

// An exact multiple of π: 3 π, ⁅11/3⁆π, π — never a recurring decimal.
function piTerm(n, d) {
  const g = gcd(n, d);
  const a = n / g, b = d / g;
  if (b === 1) return a === 1 ? "π" : `${a}π`;
  return `${frac(a, b)}π`;
}

// Trim binary rounding noise from a money-style value: 948.7499999999999 → 948.75.
const money = (v) => {
  const s = (Math.round(v * 100) / 100).toFixed(2);
  return s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
};

const ORDINALS = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];
const ordinalWord = (n) => ORDINALS[n] || n + "th";

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
    name: "Addition within 20", grades: [1, 2],
    gen(r, d) {
      const a = ri(r, 1, d * 6), b = ri(r, 1, Math.min(19 - a, d * 6 + 2));
      return { q: `Work out ${a} + ${b}`, a: String(a + b),
        sol: [S(`${a} + ${b} = ${a + b}`, "B1")] };
    }
  },
  subWithin20: {
    name: "Subtraction within 20", grades: [1, 2],
    gen(r, d) {
      const a = ri(r, d * 4, d * 6 + 2), b = ri(r, 1, a - 1);
      return { q: `Work out ${a} − ${b}`, a: String(a - b),
        sol: [S(`${a} − ${b} = ${a - b}`, "B1")] };
    }
  },
  missingNumber: {
    name: "Missing numbers", grades: [1, 2, 3],
    gen(r, d) {
      const a = ri(r, 1, d * 7), b = ri(r, 1, d * 7);
      return { q: `Find the missing number:  ${a} + ▢ = ${a + b}`, a: String(b),
        sol: [S(`Work backwards: subtract ${a} from ${a + b}`, "M1"), S(`${a + b} − ${a} = ${b}`, "A1")] };
    }
  },
  placeValue: {
    name: "Place value", grades: [2, 3, 4],
    gen(r, d) {
      const n = ri(r, d === 1 ? 10 : d === 2 ? 100 : 1000, d === 1 ? 99 : d === 2 ? 999 : 9999);
      const s = String(n), i = ri(r, 0, s.length - 1);
      const placePow = s.length - 1 - i;
      const val = +s[i] * Math.pow(10, placePow);
      const place = ["ones", "tens", "hundreds", "thousands"][placePow];
      return { q: `What is the value of the digit ${s[i]} in ${n}?`, a: String(val),
        sol: [S(`The digit ${s[i]} is in the ${place} place`, "M1"), S(`${s[i]} × ${Math.pow(10, placePow)} = ${val}`, "A1")] };
    }
  },
  columnAdd: {
    name: "Column addition", grades: [2, 3, 4],
    gen(r, d) {
      const m = d === 1 ? 99 : d === 2 ? 999 : 9999;
      const a = ri(r, m / 9, m), b = ri(r, m / 9, m);
      return { q: `Work out ${a} + ${b}`, a: String(a + b),
        sol: [S("Line up the digits by place value and add column by column", "M1"), S(`${a} + ${b} = ${a + b}`, "A1")] };
    }
  },
  columnSub: {
    name: "Column subtraction", grades: [3, 4, 5],
    gen(r, d) {
      const m = d === 1 ? 999 : d === 2 ? 9999 : 99999;
      let a = ri(r, m / 9, m), b = ri(r, m / 9, m);
      if (b > a) [a, b] = [b, a];
      return { q: `Work out ${a} − ${b}`, a: String(a - b),
        sol: [S("Line up the digits and subtract column by column, borrowing where needed", "M1"), S(`${a} − ${b} = ${a - b}`, "A1")] };
    }
  },
  timesTables: {
    name: "Times tables", grades: [2, 3, 4],
    gen(r, d) {
      const tables = d === 1 ? [2, 5, 10] : d === 2 ? [3, 4, 6, 8] : [7, 9, 11, 12];
      const a = pick(r, tables), b = ri(r, 2, 12);
      return { q: `Work out ${a} × ${b}`, a: String(a * b),
        sol: [S(`${a} × ${b} = ${a * b}`, "B1")] };
    }
  },
  divisionRemainder: {
    name: "Division with remainders", grades: [3, 4, 5],
    gen(r, d) {
      const b = ri(r, 2, d + 4 + d), q0 = ri(r, 3, 9 + d * 5), rem = ri(r, 0, b - 1);
      const a = b * q0 + rem;
      return { q: `Work out ${a} ÷ ${b}`, a: rem ? `${q0} r ${rem}` : String(q0),
        sol: [S(`${b} × ${q0} = ${b * q0}`, "M1"),
              rem ? S(`${a} − ${b * q0} = ${rem}, so ${a} ÷ ${b} = ${q0} r ${rem}`, "A1")
                  : S(`${a} ÷ ${b} = ${q0} exactly`, "A1")] };
    }
  },
  longMultiplication: {
    name: "Written multiplication", grades: [4, 5, 6],
    gen(r, d) {
      const a = ri(r, d === 3 ? 100 : 12, d === 1 ? 99 : 999);
      const b = ri(r, d === 1 ? 3 : 12, d === 1 ? 9 : d === 2 ? 19 : 99);
      const tens = Math.floor(b / 10) * 10, ones = b % 10;
      const sol = b >= 10
        ? [S(`${a} × ${tens} = ${a * tens}`, "M1"), S(`${a} × ${ones} = ${a * ones}`, "M1"), S(`${a * tens} + ${a * ones} = ${a * b}`, "A1")]
        : [S("Use column multiplication", "M1"), S(`${a} × ${b} = ${a * b}`, "A1")];
      return { q: `Work out ${a} × ${b}`, a: String(a * b), sol };
    }
  },
  fractionOfAmount: {
    name: "Fraction of an amount", grades: [3, 4, 5],
    gen(r, d) {
      const den = pick(r, d === 1 ? [2, 4] : d === 2 ? [3, 5, 10] : [6, 8, 12]);
      const num = d === 1 ? 1 : ri(r, 1, den - 1);
      const unit = ri(r, 2, 12);
      const total = den * unit;
      return { q: `Find ${frac(num, den)} of ${total}`, a: String(num * unit),
        sol: [S(`${total} ÷ ${den} = ${unit}`, "M1"), S(`${unit} × ${num} = ${num * unit}`, "A1")] };
    }
  },
  equivalentFractions: {
    name: "Equivalent fractions", grades: [4, 5, 6],
    gen(r, d) {
      const den = ri(r, 2, 6 + d), num = ri(r, 1, den - 1), k = ri(r, 2, 3 + d * 2);
      return { q: `Complete:  ${frac(num, den)} = ${frac("▢", den * k)}`, a: String(num * k),
        sol: [S(`${den} × ${k} = ${den * k}`, "M1"), S(`Multiply the numerator by the same number: ${num} × ${k} = ${num * k}`, "A1")] };
    }
  },
  addFractions: {
    name: "Adding fractions", grades: [5, 6, 7],
    gen(r, d) {
      const d1 = ri(r, 2, 6 + d), d2 = d === 1 ? d1 : ri(r, 2, 6 + d);
      const n1 = ri(r, 1, d1 - 1), n2 = ri(r, 1, d2 - 1);
      let num = n1 * d2 + n2 * d1, den = d1 * d2;
      const rawNum = num, rawDen = den;
      const g = gcd(num, den); num /= g; den /= g;
      const ans = den === 1 ? String(num)
        : num > den ? `${frac(num, den)} = ${Math.floor(num / den)} ${frac(num % den, den)}`
        : frac(num, den);
      const sol = d1 === d2
        ? [S(`${frac(n1, d1)} + ${frac(n2, d1)} = ${frac(n1 + n2, d1)}`, "M1"), S(`= ${ans}`, "A1")]
        : [S(`Common denominator: ${d1} × ${d2} = ${rawDen}`, "M1"),
           S(`${frac(n1 * d2, rawDen)} + ${frac(n2 * d1, rawDen)} = ${frac(rawNum, rawDen)}`, "M1"),
           S(`= ${ans}`, "A1")];
      return { q: `Work out ${frac(n1, d1)} + ${frac(n2, d2)}. Give your answer in its simplest form.`, a: ans, sol };
    }
  },
  percentOfAmount: {
    name: "Percentage of an amount", grades: [5, 6, 7],
    gen(r, d) {
      const p = pick(r, d === 1 ? [10, 25, 50] : d === 2 ? [5, 20, 30, 75] : [15, 35, 45, 65, 85]);
      const base = ri(r, 2, 20) * (d === 3 ? 20 : 10);
      return { q: `Find ${p}% of ${base}`, a: String((p * base) / 100),
        sol: [S(`${p}% = ${frac(p, 100)}`, "M1"), S(`${frac(p, 100)} × ${base} = ${(p * base) / 100}`, "A1")] };
    }
  },
  orderOfOperations: {
    name: "Order of operations", grades: [5, 6, 7],
    gen(r, d) {
      const a = ri(r, 2, 9), b = ri(r, 2, 9), c = ri(r, 2, 9);
      const first = S("Multiplication and powers before addition and subtraction", "M1");
      if (d === 1) return { q: `Work out ${a} + ${b} × ${c}`, a: String(a + b * c),
        sol: [first, S(`${b} × ${c} = ${b * c}`, "M1"), S(`${a} + ${b * c} = ${a + b * c}`, "A1")] };
      if (d === 2) return { q: `Work out (${a} + ${b}) × ${c} − ${b}`, a: String((a + b) * c - b),
        sol: [S("Brackets first", "M1"), S(`${a + b} × ${c} = ${(a + b) * c}`, "M1"), S(`${(a + b) * c} − ${b} = ${(a + b) * c - b}`, "A1")] };
      return { q: `Work out ${a} × ${b} − ${c}² + ${a}`, a: String(a * b - c * c + a),
        sol: [first, S(`${a} × ${b} = ${a * b},  ${c}² = ${c * c}`, "M1"), S(`${a * b} − ${c * c} + ${a} = ${a * b - c * c + a}`, "A1")] };
    }
  },
  areaPerimeterRect: {
    name: "Area and perimeter of rectangles", grades: [4, 5, 6],
    gen(r, d) {
      const l = ri(r, 3, 8 + d * 4), w = ri(r, 2, l - 1);
      if (r() < 0.5)
        return { q: `A rectangle is ${l} cm long and ${w} cm wide. Find its area.`, a: `${l * w} cm²`,
          sol: [S("Area = length × width", "M1"), S(`${l} × ${w} = ${l * w} cm²`, "A1")] };
      return { q: `A rectangle is ${l} cm long and ${w} cm wide. Find its perimeter.`, a: `${2 * (l + w)} cm`,
        sol: [S("Perimeter = 2 × (length + width)", "M1"), S(`2 × (${l} + ${w}) = ${2 * (l + w)} cm`, "A1")] };
    }
  },
  meanOfNumbers: {
    name: "The mean", grades: [6, 7, 8],
    gen(r, d) {
      const n = d + 3;
      const mean = ri(r, 3, 12);
      const nums = [];
      let sum = 0;
      for (let i = 0; i < n - 1; i++) { const v = ri(r, 1, mean * 2 - 1); nums.push(v); sum += v; }
      const last = mean * n - sum;
      if (last < 0 || last > mean * 3) return this.gen(r, d);
      nums.push(last);
      return { q: `Find the mean of: ${nums.join(", ")}`, a: String(mean),
        sol: [S(`${nums.join(" + ")} = ${mean * n}`, "M1"), S(`${mean * n} ÷ ${n} = ${mean}`, "A1")] };
    }
  },
  negativeNumbers: {
    name: "Negative numbers", grades: [6, 7],
    gen(r, d) {
      const a = ri(r, -9 - d * 3, 9 + d * 3), b = ri(r, 1, 9 + d * 3);
      const op = pick(r, d === 3 ? ["−", "+", "×"] : ["−", "+"]);
      const ans = op === "+" ? a - b : op === "−" ? a + b : -a * b;
      const rule = op === "−"
        ? S("Subtracting a negative is the same as adding", "M1")
        : op === "+"
        ? S("Adding a negative is the same as subtracting", "M1")
        : S("Positive × negative gives a negative; negative × negative gives a positive", "M1");
      return { q: `Work out ${nf(a)} ${op} (−${b})`, a: nf(ans), sol: [rule, S(`= ${nf(ans)}`, "A1")] };
    }
  },
  powersRoots: {
    name: "Powers and roots", grades: [7, 8],
    gen(r, d) {
      if (d === 1) { const a = ri(r, 2, 12); return { q: `Work out ${a}²`, a: String(a * a), sol: [S(`${a} × ${a} = ${a * a}`, "B1")] }; }
      if (d === 2) {
        const a = ri(r, 2, 15);
        return { q: `Work out ${rad(a * a)}`, a: String(a),
          sol: [S(`${a} × ${a} = ${a * a}, so ${rad(a * a)} = ${a}`, "B1")] };
      }
      const a = ri(r, 2, 6);
      return { q: `Work out ${a}³`, a: String(a * a * a), sol: [S(`${a} × ${a} = ${a * a}`, "M1"), S(`${a * a} × ${a} = ${a * a * a}`, "A1")] };
    }
  },
  ratioSharing: {
    name: "Sharing in a ratio", grades: [7, 8, 9],
    gen(r, d) {
      const a = ri(r, 1, 3 + d), b = ri(r, a + 1, 4 + d * 2);
      const unit = ri(r, 2, 12);
      const total = (a + b) * unit;
      return {
        q: `Share ${total} rials between Salim and Ahmed in the ratio ${a} : ${b}. How much does Ahmed get?`,
        a: `${b * unit} rials`,
        sol: [S(`Total parts: ${a} + ${b} = ${a + b}`, "M1"),
              S(`${total} ÷ ${a + b} = ${unit}`, "M1"),
              S(`Ahmed's share: ${b} × ${unit} = ${b * unit} rials`, "A1")]
      };
    }
  },
  anglesTriangle: {
    name: "Angles in a triangle", grades: [6, 7],
    gen(r, d) {
      const a = ri(r, 20, 80), b = ri(r, 20, Math.min(150 - a, 100));
      return { q: `Two angles of a triangle are ${a}° and ${b}°. Find the third angle.`, a: `${180 - a - b}°`,
        sol: [S("Angles in a triangle add up to 180°", "M1"), S(`180 − ${a} − ${b} = ${180 - a - b}°`, "A1")] };
    }
  },
  circleArea: {
    name: "Circumference and area of circles", grades: [7, 8, 9],
    gen(r, d) {
      const rad = ri(r, 2, 6 + d * 3);
      if (r() < 0.5)
        return { q: `A circle has radius ${rad} cm. Find its circumference. Give your answer in terms of π.`, a: `${2 * rad}π cm`,
          sol: [S("Circumference = 2πr", "M1"), S(`2 × π × ${rad} = ${2 * rad}π cm`, "A1")] };
      return { q: `A circle has radius ${rad} cm. Find its area. Give your answer in terms of π.`, a: `${rad * rad}π cm²`,
        sol: [S("Area = πr²", "M1"), S(`π × ${rad}² = ${rad * rad}π cm²`, "A1")] };
    }
  },
  solveLinear: {
    name: "Solving linear equations", grades: [7, 8, 9],
    gen(r, d) {
      const x = ri(r, d === 3 ? -9 : 1, 9), a = ri(r, 2, 2 + d * 2), b = ri(r, 1, 12);
      if (d < 3) {
        const c = a * x + b;
        return { q: `Solve:  ${a}x + ${b} = ${c}`, a: `x = ${nf(x)}`,
          sol: [S(`${a}x = ${c} − ${b} = ${nf(a * x)}`, "M1"), S(`x = ${nf(a * x)} ÷ ${a} = ${nf(x)}`, "A1")] };
      }
      const c = ri(r, 1, a - 1);
      const k = (a - c) * x + b;
      const rhs = `${c === 1 ? "" : c}x ${k >= 0 ? "+ " + k : "− " + -k}`;
      return { q: `Solve:  ${a}x + ${b} = ${rhs}`, a: `x = ${nf(x)}`,
        sol: [S(`Collect x terms: ${a}x − ${c === 1 ? "" : c}x = ${a - c}x`, "M1"),
              S(`${a - c}x = ${nf(k)} − ${b} = ${nf((a - c) * x)}`, "M1"),
              S(`x = ${nf((a - c) * x)} ÷ ${a - c} = ${nf(x)}`, "A1")] };
    }
  },
  sequenceNth: {
    name: "nth term of a sequence", grades: [7, 8, 9],
    gen(r, d) {
      const m = ri(r, 2, 3 + d * 2), c = ri(r, -5, 9);
      const terms = [1, 2, 3, 4].map((n) => m * n + c);
      const shown = terms.map(nf);
      const rule = c === 0 ? `${m}n` : c > 0 ? `${m}n + ${c}` : `${m}n − ${-c}`;
      return { q: `Find the nth term of the sequence: ${shown.join(", ")}, …`, a: rule,
        sol: [S(`Common difference: ${shown[1]} − ${shown[0]} = ${m}, so the rule starts ${m}n`, "M1"),
              S(`Adjust: ${m} × 1 = ${m}, first term is ${shown[0]}, so ${c >= 0 ? "add " + c : "subtract " + -c}`, "M1"),
              S(`nth term = ${rule}`, "A1")] };
    }
  },
  expandBrackets: {
    name: "Expanding brackets", grades: [7, 8, 9],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 2, 7), b = ri(r, 1, 9);
        return { q: `Expand:  ${a}(x + ${b})`, a: `${a}x + ${a * b}`,
          sol: [S(`Multiply each term inside by ${a}`, "M1"), S(`${a} × x = ${a}x,  ${a} × ${b} = ${a * b}`, "A1")] };
      }
      const p = ri(r, 1, 6) * (d === 3 && r() < 0.5 ? -1 : 1), q0 = ri(r, 1, 6) * (r() < 0.5 ? -1 : 1);
      const fmt = (v) => (v < 0 ? `(x − ${-v})` : `(x + ${v})`);
      const ex = poly([[1, 2], [p + q0, 1], [p * q0, 0]]);
      return { q: `Expand and simplify:  ${fmt(p)}${fmt(q0)}`, a: ex,
        sol: [S("Multiply every term in the first bracket by every term in the second", "M1"),
              S(`x² ${p >= 0 ? "+ " + p : "− " + -p}x ${q0 >= 0 ? "+ " + q0 : "− " + -q0}x ${p * q0 >= 0 ? "+ " + p * q0 : "− " + -(p * q0)}`, "M1"),
              S(`= ${ex}`, "A1")] };
    }
  },
  factorise: {
    name: "Factorising", grades: [8, 9, 10],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 2, 6), b = ri(r, 2, 9);
        return { q: `Factorise:  ${a}x + ${a * b}`, a: `${a}(x + ${b})`,
          sol: [S(`The highest common factor is ${a}`, "M1"), S(`${a}x + ${a * b} = ${a}(x + ${b})`, "A1")] };
      }
      const p = ri(r, 1, 6), q0 = ri(r, 1, 6) * (d === 3 ? -1 : 1);
      const fmt = (v) => (v < 0 ? `(x − ${-v})` : `(x + ${v})`);
      const ex = poly([[1, 2], [p + q0, 1], [p * q0, 0]]);
      return { q: `Factorise:  ${ex}`, a: `${fmt(p)}${fmt(q0)}`,
        sol: [S(`Find two numbers with sum ${nf(p + q0)} and product ${nf(p * q0)}: they are ${nf(p)} and ${nf(q0)}`, "M1"),
              S(`${ex} = ${fmt(p)}${fmt(q0)}`, "A1")] };
    }
  },
  simultaneous: {
    name: "Simultaneous equations", grades: [8, 9, 10],
    gen(r, d) {
      const x = ri(r, 1, 6), y = ri(r, 1, 6);
      const a1 = ri(r, 1, d), b1 = ri(r, 1, 3), a2 = ri(r, 1, 3), b2 = d === 1 ? b1 : ri(r, 1, 3);
      if (a1 * b2 === a2 * b1) return this.gen(r, d);
      const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
      const eq = (a, b, c) => `${a === 1 ? "" : a}x + ${b === 1 ? "" : b}y = ${c}`;
      return {
        q: `Solve the simultaneous equations:\n${eq(a1, b1, c1)}\n${eq(a2, b2, c2)}`,
        a: `x = ${x}, y = ${y}`,
        sol: [S("Multiply the equations so one unknown has equal coefficients, then subtract to eliminate it", "M1"),
              S(`x = ${x}`, "A1"),
              S(`Substitute back: y = ${y}`, "A1")]
      };
    }
  },
  straightLine: {
    name: "Straight-line graphs", grades: [8, 9, 10],
    gen(r, d) {
      const m = ri(r, 1, 2 + d) * (d === 3 && r() < 0.5 ? -1 : 1), c = ri(r, -6, 8);
      const line = `y = ${m === 1 ? "" : m === -1 ? "−" : nf(m)}x ${c >= 0 ? "+ " + c : "− " + -c}`;
      const cmp = S("Compare with y = mx + c: m is the gradient, c the y-intercept", "M1");
      if (r() < 0.5)
        return { q: `Write down the gradient of the line ${line}`, a: nf(m), sol: [cmp, S(`m = ${nf(m)}`, "A1")] };
      return { q: `Write down the y-intercept of the line ${line}`, a: `(0, ${nf(c)})`, sol: [cmp, S(`(0, ${nf(c)})`, "A1")] };
    }
  },
  pythagoras: {
    name: "Pythagoras' theorem", grades: [8, 9, 10],
    gen(r, d) {
      const t = pick(r, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25],
                         [6, 8, 10], [9, 12, 15], [20, 21, 29], [9, 40, 41], [12, 35, 37]]);
      const k = d === 1 ? ri(r, 1, 2) : ri(r, 1, 3);
      const [a, b, c] = t.map((v) => v * k);
      if (d < 3)
        return { q: `A right-angled triangle has shorter sides ${a} cm and ${b} cm. Find the hypotenuse.`, a: `${c} cm`,
          sol: [S(`c² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}`, "M1"), S(`c = ${rad(c * c)} = ${c} cm`, "A1")] };
      return { q: `A right-angled triangle has hypotenuse ${c} cm and one side ${a} cm. Find the other side.`, a: `${b} cm`,
        sol: [S(`b² = ${c}² − ${a}² = ${c * c} − ${a * a} = ${b * b}`, "M1"), S(`b = ${rad(b * b)} = ${b} cm`, "A1")] };
    }
  },
  standardForm: {
    name: "Standard form", grades: [8, 9, 10],
    gen(r, d) {
      const a = ri(r, 11, 99) / 10, p = ri(r, d, d * 3) * (d === 3 && r() < 0.5 ? -1 : 1);
      const val = a * Math.pow(10, p);
      const shown = p >= 0 ? String(Math.round(val * 10) / 10) : val.toFixed(-p + 1).replace(/0+$/, "").replace(/\.$/, "");
      const ans = `${a} × 10${p < 0 ? "⁻" : ""}${sup(Math.abs(p))}`;
      return { q: `Write ${shown} in standard form.`, a: ans,
        sol: [S(`Move the decimal point ${Math.abs(p)} place(s) so one non-zero digit is before the point`, "M1"),
              S(`${shown} = ${ans}`, "A1")] };
    }
  },
  inequality: {
    name: "Inequalities", grades: [7, 8, 9],
    gen(r, d) {
      const a = ri(r, 2, 2 + d), b = ri(r, 1, 9), x = ri(r, 1, 8);
      const c = a * x + b;
      const op = d === 3 && r() < 0.5 ? "≤" : "<";
      return { q: `Solve:  ${a}x + ${b} ${op} ${c}`, a: `x ${op} ${x}`,
        sol: [S(`${a}x ${op} ${c} − ${b} = ${a * x}`, "M1"),
              S(`Divide by ${a} (positive, so the inequality is unchanged): x ${op} ${x}`, "A1")] };
    }
  },
  quadraticSolve: {
    name: "Solving quadratics", grades: [9, 10, 11],
    gen(r, d) {
      const p = ri(r, 1, 5 + d), q0 = ri(r, 1, 5 + d) * (d >= 2 && r() < 0.5 ? -1 : 1);
      if (p === q0) return this.gen(r, d);
      const fmt = (v) => (v < 0 ? `(x − ${-v})` : `(x + ${v})`);
      const ex = poly([[1, 2], [p + q0, 1], [p * q0, 0]]);
      return {
        q: `Solve:  ${ex} = 0`, a: `x = ${nf(-p)}  or  x = ${nf(-q0)}`,
        sol: [S(`Factorise: two numbers with sum ${nf(p + q0)} and product ${nf(p * q0)} are ${nf(p)} and ${nf(q0)}`, "M1"),
              S(`${fmt(p)}${fmt(q0)} = 0`, "M1"),
              S(`x = ${nf(-p)}  or  x = ${nf(-q0)}`, "A1")]
      };
    }
  },
  trigRightAngle: {
    name: "Right-angled trigonometry", grades: [9, 10],
    gen(r, d) {
      const angle = pick(r, [25, 30, 35, 40, 50, 55, 60]);
      const adj = ri(r, 4, 8 + d * 4);
      const opp = adj * Math.tan((angle * Math.PI) / 180);
      return {
        q: `In a right-angled triangle, the angle is ${angle}° and the adjacent side is ${adj} cm. Find the opposite side, correct to 1 decimal place.`,
        a: `${opp.toFixed(1)} cm`,
        sol: [S("Opposite and adjacent → use tan θ", "M1"),
              S(`opposite = ${adj} × tan ${angle}°`, "M1"),
              S(`≈ ${opp.toFixed(1)} cm`, "A1")]
      };
    }
  },
  indices: {
    name: "Laws of indices", grades: [8, 9, 10],
    gen(r, d) {
      const m = ri(r, 2, 5 + d), n = ri(r, 2, 4 + d);
      if (d < 3)
        return { q: `Simplify:  x${sup(m)} × x${sup(n)}`, a: `x${sup(m + n)}`,
          sol: [S("When multiplying, add the indices", "M1"), S(`${m} + ${n} = ${m + n}, so x${sup(m + n)}`, "A1")] };
      return { q: `Simplify:  (x${sup(m)})${sup(n)} ÷ x${sup(n)}`, a: `x${sup(m * n - n)}`,
        sol: [S(`(x${sup(m)})${sup(n)} = x${sup(m * n)}`, "M1"), S(`When dividing, subtract: ${m * n} − ${n} = ${m * n - n}`, "A1")] };
    }
  },
  permutations: {
    name: "Permutations and combinations", grades: [11],
    gen(r, d) {
      const n = ri(r, 5, 6 + d), k = ri(r, 2, 4);
      const P = (n_, k_) => { let v = 1; for (let i = 0; i < k_; i++) v *= n_ - i; return v; };
      const C = (n_, k_) => P(n_, k_) / P(k_, k_);
      if (d === 1)
        return { q: `In how many different orders can ${n} students be arranged in a line?`, a: String(P(n, n)),
          sol: [S(`${n}! = ${Array.from({ length: n }, (_, i) => n - i).join(" × ")}`, "M1"), S(`= ${P(n, n)}`, "A1")] };
      if (d === 2)
        return { q: `A committee of ${k} is chosen from ${n} people. How many different committees are possible?`, a: String(C(n, k)),
          sol: [S(`Order does not matter, so use C(${n},${k})`, "M1"), S(`C(${n},${k}) = ${C(n, k)}`, "A1")] };
      return { q: `${k} prizes (all different) are awarded to ${n} students, with no student receiving more than one prize. In how many ways can this be done?`, a: String(P(n, k)),
        sol: [S(`Order matters, so use P(${n},${k})`, "M1"), S(`P(${n},${k}) = ${Array.from({ length: k }, (_, i) => n - i).join(" × ")} = ${P(n, k)}`, "A1")] };
    }
  },
  standardDeviation: {
    name: "Mean and standard deviation", grades: [11],
    gen(r, d) {
      const n = ri(r, 5, 8), mean = ri(r, 10, 30);
      // Build the deviations in ± pairs so they sum to exactly zero (the mean is
      // then a whole number) and every one stays small, keeping the marks positive.
      const devs = [];
      for (let i = 0; i < Math.floor(n / 2); i++) { const v = ri(r, 1, 4); devs.push(v, -v); }
      if (n % 2) devs.push(0);
      for (let i = devs.length - 1; i > 0; i--) {   // shuffle so the pairs are not obvious
        const j = Math.floor(r() * (i + 1));
        [devs[i], devs[j]] = [devs[j], devs[i]];
      }
      const vals = devs.map((v) => mean + v);
      const sumsq = devs.reduce((t, v) => t + v * v, 0);
      const sd = Math.sqrt(sumsq / n);
      return {
        q: `The ${n} values below are the marks of a group of students.\n${vals.join(", ")}\nFind the mean and the standard deviation, giving the standard deviation correct to 2 decimal places.`,
        a: `x̄ = ${mean},  σ = ${sd.toFixed(2)}`,
        sol: [S(`Σx = ${vals.reduce((t, v) => t + v, 0)}, so x̄ = ${frac(vals.reduce((t, v) => t + v, 0), n)} = ${mean}`, "M1"),
              S(`Σ(x − x̄)² = ${sumsq}`, "M1"),
              S(`σ = ${rad(frac(sumsq, n))} = ${sd.toFixed(2)}`, "A1")]
      };
    }
  },
  logarithms: {
    name: "Logarithms", grades: [12],
    gen(r, d) {
      if (d === 1) {
        const b = pick(r, [2, 3, 5, 10]), n = ri(r, 2, 5);
        return { q: `Evaluate:  log${sub(b)} ${Math.pow(b, n)}`, a: String(n),
          sol: [S(`${b}${sup(n)} = ${Math.pow(b, n)}`, "M1"),
                S(`so log${sub(b)} ${Math.pow(b, n)} = ${n}`, "A1")] };
      }
      if (d === 2) {
        const p = ri(r, 2, 4);
        return { q: `Write as a single logarithm:  ${p} log x + log y`, a: `log (x${sup(p)}y)`,
          sol: [S(`${p} log x = log x${sup(p)}`, "M1"),
                S(`log x${sup(p)} + log y = log (x${sup(p)}y)`, "A1")] };
      }
      const b = pick(r, [2, 3, 5]), x = ri(r, 2, 6), k = ri(r, 2, 4);
      return { q: `Solve:  log${sub(b)} x + log${sub(b)} ${k} = log${sub(b)} ${k * x}`, a: `x = ${x}`,
        sol: [S(`log${sub(b)} (${k}x) = log${sub(b)} ${k * x}`, "M1"),
              S(`${k}x = ${k * x}`, "M1"),
              S(`x = ${x}`, "A1")] };
    }
  },
  expEquations: {
    name: "Exponential equations", grades: [12],
    gen(r, d) {
      const b = pick(r, [2, 3, 5]);
      if (d === 1) {
        const n = ri(r, 2, 5);
        return { q: `Solve:  ${b}${sup("x")} = ${Math.pow(b, n)}`, a: `x = ${n}`,
          sol: [S(`Write both sides to base ${b}: ${b}${sup("x")} = ${b}${sup(n)}`, "M1"),
                S(`x = ${n}`, "A1")] };
      }
      if (d === 2) {
        const n = ri(r, 2, 4), c = ri(r, 1, 3);
        return { q: `Solve:  ${b}${sup("x+" + c)} = ${Math.pow(b, n)}`, a: `x = ${nf(n - c)}`,
          sol: [S(`Equate the indices: x + ${c} = ${n}`, "M1"),
                S(`x = ${nf(n - c)}`, "A1")] };
      }
      // Skip exact powers of b — those solve by inspection, so "3 significant
      // figures" would be the wrong instruction and "≈" the wrong sign.
      let target = ri(r, 2, 40);
      while (Number.isInteger(Math.round(Math.log(target) / Math.log(b) * 1e9) / 1e9)) target++;
      const x = Math.log(target) / Math.log(b);
      const x3 = String(Number(x.toPrecision(3)));
      return { q: `Solve:  ${b}${sup("x")} = ${target}, giving your answer correct to 3 significant figures.`,
        a: `x ≈ ${x3}`,
        sol: [S(`Take logarithms of both sides: x log ${b} = log ${target}`, "M1"),
              S(`x = ${frac("log " + target, "log " + b)}`, "M1"),
              S(`x ≈ ${x3}`, "A1")] };
    }
  },
  differentiation: {
    name: "Differentiation", grades: [11, 12],
    gen(r, d) {
      const a = ri(r, 1, 3 + d), n = ri(r, 2, 2 + d), b = ri(r, 1, 9), c = ri(r, 1, 9);
      const f = poly([[a, n], [b, 1], [c, 0]]);
      const df = poly([[a * n, n - 1], [b, 0]]);
      return { q: `Differentiate:  y = ${f}`, a: `${frac("d" + "y", "dx")} = ${df}`,
        sol: [S("Multiply by the power, then reduce the power by 1; constants vanish", "M1"),
              S(`${a}x${sup(n)} → ${a * n}x${n - 1 === 1 ? "" : sup(n - 1)},  ${b}x → ${b},  ${c} → 0`, "M1"),
              S(`${frac("dy", "dx")} = ${df}`, "A1")] };
    }
  },
  integration: {
    name: "Integration", grades: [11, 12],
    gen(r, d) {
      const n = ri(r, 1, 2 + d);
      const a = (n + 1) * ri(r, 1, 3);
      const b = ri(r, 1, 9);
      const f = poly([[a, n], [b, 0]]);
      const F = poly([[a / (n + 1), n + 1], [b, 1]]);
      return { q: `Find:  ∫ (${f}) dx`, a: `${F} + c`,
        sol: [S("Raise the power by 1, then divide by the new power", "M1"),
              S(`${a}x${sup(n)} → ${frac(a + "x" + sup(n + 1), n + 1)} = ${a / (n + 1)}x${sup(n + 1)},  ${b} → ${b}x`, "M1"),
              S(`Add the constant of integration: ${F} + c`, "A1")] };
    }
  },
  binomial: {
    name: "Binomial expansion", grades: [11, 12],
    gen(r, d) {
      const n = ri(r, 4, 5 + d), k = ri(r, 2, 3), a = ri(r, 2, 2 + d);
      const C = (n_, k_) => { let c = 1; for (let i = 0; i < k_; i++) c = (c * (n_ - i)) / (i + 1); return c; };
      const coef = C(n, k), ans = coef * Math.pow(a, k);
      return {
        q: `Find the coefficient of x${sup(k)} in the expansion of (1 + ${a}x)${sup(n)}`,
        a: String(ans),
        sol: [S(`The x${sup(k)} term is C(${n},${k}) × (${a}x)${sup(k)}`, "M1"),
              S(`C(${n},${k}) = ${coef},  ${a}${sup(k)} = ${Math.pow(a, k)}`, "M1"),
              S(`${coef} × ${Math.pow(a, k)} = ${ans}`, "A1")]
      };
    }
  },

  // ===================== Primary: number and counting =====================

  // Handwriting practice, not a question: the sheet prints large hollow
  // numerals in a grid for the child to trace over, then empty squares to
  // write in. sheet.js renders `trace` instead of a question line.
  // ---- Sorting diagrams -------------------------------------------------
  // A Venn diagram sorts by two properties into overlapping circles; a Carroll
  // diagram sorts by the same two properties into a grid of a property against
  // its negation. Both print an empty diagram plus the numbers to place, so
  // they are worksheets to fill in rather than questions to answer.
  vennDiagram: {
    name: "Venn diagrams", grades: [1, 2, 3, 4],
    gen(r, d) {
      const s = sortingSets(r, d);
      return {
        q: `Sort these numbers into the Venn diagram:\n${s.items.join(",  ")}`,
        a: `${s.a.name} only: ${s.onlyA.join(", ") || "none"}  ·  ` +
           `Both: ${s.both.join(", ") || "none"}  ·  ` +
           `${s.b.name} only: ${s.onlyB.join(", ") || "none"}  ·  ` +
           `Neither: ${s.neither.join(", ") || "none"}`,
        venn: { a: s.a.name, b: s.b.name, items: s.items },
        sol: [S(`Test each number against “${s.a.name}” and “${s.b.name}”`, "M1"),
              S(`A number that is both goes in the overlap; one that is neither goes outside both circles`, "M1"),
              S(`${s.a.name} only: ${s.onlyA.join(", ") || "none"};  both: ${s.both.join(", ") || "none"};  ` +
                `${s.b.name} only: ${s.onlyB.join(", ") || "none"};  neither: ${s.neither.join(", ") || "none"}`, "A1")]
      };
    }
  },
  carrollDiagram: {
    name: "Carroll diagrams", grades: [1, 2, 3, 4],
    gen(r, d) {
      const s = sortingSets(r, d);
      return {
        q: `Sort these numbers into the Carroll diagram:\n${s.items.join(",  ")}`,
        a: `${s.a.name} & ${s.b.name}: ${s.both.join(", ") || "none"}  ·  ` +
           `${s.a.name} & ${s.b.not}: ${s.onlyA.join(", ") || "none"}  ·  ` +
           `${s.a.not} & ${s.b.name}: ${s.onlyB.join(", ") || "none"}  ·  ` +
           `${s.a.not} & ${s.b.not}: ${s.neither.join(", ") || "none"}`,
        carroll: {
          rows: [s.a.name, s.a.not],
          cols: [s.b.name, s.b.not],
          items: s.items
        },
        sol: [S(`Each number belongs in exactly one box`, "M1"),
              S(`Ask two questions: is it ${s.a.name.toLowerCase()}? is it ${s.b.name.toLowerCase()}?`, "M1"),
              S(`${s.a.name} & ${s.b.name}: ${s.both.join(", ") || "none"};  ` +
                `${s.a.name} & ${s.b.not}: ${s.onlyA.join(", ") || "none"};  ` +
                `${s.a.not} & ${s.b.name}: ${s.onlyB.join(", ") || "none"};  ` +
                `${s.a.not} & ${s.b.not}: ${s.neither.join(", ") || "none"}`, "A1")]
      };
    }
  },
  // The syllabus line "Venn diagrams and Carroll diagrams" covers both, so this
  // alternates between them and a worksheet gets a mix of the two.
  sortingDiagrams: {
    name: "Venn and Carroll diagrams", grades: [1, 2, 3, 4],
    gen(r, d) {
      return r() < 0.5 ? GENERATORS.vennDiagram.gen(r, d)
                       : GENERATORS.carrollDiagram.gen(r, d);
    }
  },
  traceNumbers: {
    name: "Tracing numbers", grades: [1, 2],
    gen(r, d) {
      const n = d === 1 ? ri(r, 1, 5) : d === 2 ? ri(r, 1, 10) : ri(r, 10, 20);
      return {
        // The numeral is in the question text so the repeat-check can tell one
        // tracing row from another — otherwise every row reads the same.
        q: `Trace the number ${n}, then write it yourself.`,
        a: `Correct formation of ${n}`,
        trace: { char: String(n), guides: 4, blanks: 3, word: numberWords(n) },
        sol: [S(`Start at the top and follow the arrows to form ${n}`, "B1")]
      };
    }
  },
  readWriteNumbers: {
    name: "Reading and writing numbers", grades: [1, 2, 3],
    gen(r, d) {
      // Easy stays inside 1-10, matching the Stage 1 "numbers 1 to 10" work.
      const n = d === 1 ? ri(r, 1, 10) : d === 2 ? ri(r, 11, 99) : ri(r, 100, 999);
      if (r() < 0.5)
        return { q: `Write this number in words:  ${n}`, a: numberWords(n),
          sol: [S(`${n} is written “${numberWords(n)}”`, "B1")] };
      return { q: `Write this as a numeral:  ${numberWords(n)}`, a: String(n),
        sol: [S(`“${numberWords(n)}” is ${n}`, "B1")] };
    }
  },
  countingSequence: {
    name: "Counting on and back", grades: [1, 2, 3, 4],
    gen(r, d) {
      const step = pick(r, d === 1 ? [1, 2, 5, 10] : d === 2 ? [2, 3, 5, 10] : [4, 6, 25, 50, 100]);
      const back = d === 3 && r() < 0.4;
      const start = ri(r, 1, d === 1 ? 10 : d === 2 ? 40 : 300) * (back ? step : 1);
      const seq = [0, 1, 2, 3, 4].map((i) => start + (back ? -1 : 1) * step * i);
      const hide = ri(r, 2, 4);
      const shown = seq.map((v, i) => (i === hide ? "▢" : nf(v)));
      return { q: `Fill in the missing number:  ${shown.join(", ")}`, a: nf(seq[hide]),
        sol: [S(`The numbers go ${back ? "back" : "on"} in ${step}s`, "M1"),
              S(`${nf(seq[hide - 1])} ${back ? "−" : "+"} ${step} = ${nf(seq[hide])}`, "A1")] };
    }
  },
  compareNumbers: {
    name: "Comparing and ordering numbers", grades: [1, 2, 3, 4],
    gen(r, d) {
      const hi = d === 1 ? 20 : d === 2 ? 100 : 10000;
      let a = ri(r, 1, hi), b = ri(r, 1, hi);
      if (d === 3 && r() < 0.4) b = a;
      const sign = a > b ? ">" : a < b ? "<" : "=";
      const word = sign === ">" ? "greater than" : sign === "<" ? "less than" : "equal to";
      return { q: `Write <, > or = between the numbers:  ${a} ▢ ${b}`, a: sign,
        sol: [S(`${a} is ${word} ${b}`, "M1"), S(`${a} ${sign} ${b}`, "A1")] };
    }
  },
  oneMoreLess: {
    name: "One more and one less", grades: [1, 2],
    gen(r, d) {
      const step = d === 3 ? 10 : 1;
      const n = ri(r, step + 1, d === 1 ? 19 : 99);
      const more = r() < 0.5;
      const ans = more ? n + step : n - step;
      return { q: `What is ${step} ${more ? "more" : "less"} than ${n}?`, a: String(ans),
        sol: [S(`${n} ${more ? "+" : "−"} ${step} = ${ans}`, "B1")] };
    }
  },
  oddEven: {
    name: "Odd and even numbers", grades: [1, 2, 3, 4],
    gen(r, d) {
      const n = ri(r, 1, d === 1 ? 20 : d === 2 ? 100 : 999);
      const even = n % 2 === 0;
      return { q: `Is ${n} odd or even?`, a: even ? "even" : "odd",
        sol: [S(`Look at the ones digit: ${n % 10}`, "M1"),
              S(`${n % 10} is ${even ? "even, so " + n + " is even" : "odd, so " + n + " is odd"}`, "A1")] };
    }
  },
  ordinals: {
    name: "Ordinal numbers", grades: [1, 2],
    gen(r, d) {
      const items = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "brown"];
      const n = ri(r, 4, d === 1 ? 5 : 8);
      const pos = ri(r, 1, n);
      const row = items.slice(0, n);
      return { q: `The counters are in a line:\n${row.join(", ")}\nWhich colour is ${ordinalWord(pos)}?`,
        a: row[pos - 1],
        sol: [S(`Count from the start: ${ordinalWord(pos)} means position ${pos}`, "M1"),
              S(`Position ${pos} is ${row[pos - 1]}`, "A1")] };
    }
  },
  doubleHalve: {
    name: "Doubling and halving", grades: [1, 2, 3],
    gen(r, d) {
      const dbl = r() < 0.5;
      const n = d === 1 ? ri(r, 1, 10) : d === 2 ? ri(r, 5, 25) : ri(r, 20, 50);
      if (dbl)
        return { q: `Double ${n}`, a: String(n * 2),
          sol: [S(`${n} + ${n} = ${n * 2}`, "B1")] };
      return { q: `Halve ${n * 2}`, a: String(n),
        sol: [S(`${n * 2} ÷ 2 = ${n}`, "B1")] };
    }
  },
  rounding: {
    name: "Rounding", grades: [3, 4, 5, 6],
    gen(r, d) {
      const to = d === 1 ? 10 : d === 2 ? 100 : 1000;
      const n = ri(r, to, to * 10);
      const ans = Math.round(n / to) * to;
      const digit = Math.floor((n % to) / (to / 10));
      return { q: `Round ${n} to the nearest ${to}`, a: String(ans),
        sol: [S(`Look at the digit in the ${to === 10 ? "ones" : to === 100 ? "tens" : "hundreds"} place: ${digit}`, "M1"),
              S(`${digit >= 5 ? "5 or more, so round up" : "less than 5, so round down"} → ${ans}`, "A1")] };
    }
  },
  multiplesOf10: {
    name: "Adding multiples of 10 and 100", grades: [2, 3, 4],
    gen(r, d) {
      const unit = d === 1 ? 10 : d === 2 ? 10 : 100;
      const a = ri(r, 2, 9) * unit, b = ri(r, 2, 9) * unit;
      const plus = r() < 0.6 || a <= b;
      const ans = plus ? a + b : a - b;
      return { q: `Work out ${a} ${plus ? "+" : "−"} ${b}`, a: String(ans),
        sol: [S(`${a / unit} ${plus ? "+" : "−"} ${b / unit} = ${ans / unit} lots of ${unit}`, "M1"),
              S(`${ans / unit} × ${unit} = ${ans}`, "A1")] };
    }
  },
  complementsTo100: {
    name: "Number bonds to 100", grades: [2, 3, 4],
    gen(r, d) {
      const total = d === 1 ? 10 : d === 2 ? 100 : 1000;
      const a = d === 1 ? ri(r, 1, 9) : d === 2 ? ri(r, 1, 19) * 5 : ri(r, 1, 19) * 50;
      return { q: `What must be added to ${a} to make ${total}?`, a: String(total - a),
        sol: [S(`${total} − ${a} = ${total - a}`, "M1"), S(`${a} + ${total - a} = ${total}`, "A1")] };
    }
  },
  placeValueParts: {
    name: "Hundreds, tens and ones", grades: [2, 3, 4],
    gen(r, d) {
      const n = d === 1 ? ri(r, 11, 99) : d === 2 ? ri(r, 101, 999) : ri(r, 1001, 9999);
      const names = ["thousands", "hundreds", "tens", "ones"];
      const digits = String(n).split("").map(Number);
      const use = names.slice(names.length - digits.length);
      const parts = digits.map((x, i) => `${x} ${use[i]}`).filter((_, i) => digits[i] !== 0);
      return { q: `Break ${n} into hundreds, tens and ones.`, a: parts.join(" + "),
        sol: [S(`Take each digit in turn`, "M1"), S(`${n} = ${parts.join(" + ")}`, "A1")] };
    }
  },
  multiplyBy10: {
    name: "Multiplying and dividing by 10, 100 and 1000", grades: [3, 4, 5, 6],
    gen(r, d) {
      const by = d === 1 ? 10 : d === 2 ? pick(r, [10, 100]) : pick(r, [10, 100, 1000]);
      const n = ri(r, 2, 99);
      if (r() < 0.5)
        return { q: `Work out ${n} × ${by}`, a: String(n * by),
          sol: [S(`Each digit moves ${String(by).length - 1} place(s) to the left`, "M1"),
                S(`${n} × ${by} = ${n * by}`, "A1")] };
      return { q: `Work out ${n * by} ÷ ${by}`, a: String(n),
        sol: [S(`Each digit moves ${String(by).length - 1} place(s) to the right`, "M1"),
              S(`${n * by} ÷ ${by} = ${n}`, "A1")] };
    }
  },
  factorsMultiples: {
    name: "Factors and multiples", grades: [4, 5, 6, 7],
    gen(r, d) {
      if (d === 1) {
        const n = ri(r, 2, 9), k = ri(r, 2, 9);
        return { q: `Write down the first four multiples of ${n}`,
          a: [1, 2, 3, 4].map((i) => n * i).join(", "),
          sol: [S(`Count up in ${n}s`, "M1"), S([1, 2, 3, 4].map((i) => n * i).join(", "), "A1")] };
      }
      if (d === 2) {
        const n = pick(r, [12, 18, 20, 24, 28, 30, 36, 40]);
        const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i);
        return { q: `List all the factors of ${n}`, a: f.join(", "),
          sol: [S(`Look for pairs that multiply to ${n}`, "M1"), S(f.join(", "), "A1")] };
      }
      const a = pick(r, [12, 16, 18, 20, 24]), b = pick(r, [8, 15, 27, 30, 36]);
      const h = gcd(a, b), l = (a * b) / h;
      return { q: `Find the HCF and the LCM of ${a} and ${b}`, a: `HCF = ${h}, LCM = ${l}`,
        sol: [S(`Highest common factor of ${a} and ${b} is ${h}`, "M1"),
              S(`LCM = ${a} × ${b} ÷ ${h} = ${l}`, "A1")] };
    }
  },
  squareCubeNumbers: {
    name: "Square and cube numbers", grades: [4, 5, 6, 7],
    gen(r, d) {
      if (d === 3) {
        const n = ri(r, 2, 8);
        return { q: `Work out ${n}${sup(3)}`, a: String(n * n * n),
          sol: [S(`${n} × ${n} × ${n}`, "M1"), S(`= ${n * n * n}`, "A1")] };
      }
      const n = ri(r, 2, d === 1 ? 9 : 15);
      return { q: `Work out ${n}${sup(2)}`, a: String(n * n),
        sol: [S(`${n} × ${n} = ${n * n}`, "B1")] };
    }
  },
  primeNumbers: {
    name: "Prime numbers", grades: [5, 6, 7],
    gen(r, d) {
      const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
      const n = ri(r, 2, d === 1 ? 20 : d === 2 ? 50 : 100);
      if (isPrime(n))
        return { q: `Is ${n} a prime number? Give a reason.`, a: `Yes — ${n} has only two factors, 1 and ${n}`,
          sol: [S(`Test for factors up to √${n}`, "M1"), S(`${n} has only 1 and ${n} as factors, so it is prime`, "A1")] };
      let f = 2; while (n % f !== 0) f++;
      return { q: `Is ${n} a prime number? Give a reason.`, a: `No — ${n} is divisible by ${f}`,
        sol: [S(`Test for factors up to √${n}`, "M1"),
              S(`${n} ÷ ${f} = ${n / f}, so ${n} is not prime`, "A1")] };
    }
  },
  divisibility: {
    name: "Tests of divisibility", grades: [4, 5, 6, 7],
    gen(r, d) {
      const by = pick(r, d === 1 ? [2, 5, 10] : d === 2 ? [3, 4, 6] : [8, 9, 11]);
      const n = ri(r, 100, 999);
      const reasons = {
        2: "the last digit is even", 5: "the last digit is 0 or 5", 10: "the last digit is 0",
        3: "the digits add to a multiple of 3", 6: "it is divisible by both 2 and 3",
        4: "the last two digits make a multiple of 4", 9: "the digits add to a multiple of 9",
        8: "the last three digits make a multiple of 8", 11: "the alternating digit sum is a multiple of 11"
      };
      const yes = n % by === 0;
      return { q: `Is ${n} divisible by ${by}? Give a reason.`, a: yes ? "Yes" : "No",
        sol: [S(`A number is divisible by ${by} when ${reasons[by]}`, "M1"),
              S(`${n} ÷ ${by} ${yes ? "= " + n / by + ", so yes" : "leaves a remainder of " + (n % by) + ", so no"}`, "A1")] };
    }
  },
  missingOperation: {
    name: "Fact families and missing numbers", grades: [2, 3, 4],
    gen(r, d) {
      const a = ri(r, 2, d === 1 ? 6 : 12), b = ri(r, 2, d === 1 ? 6 : 12);
      if (d === 1)
        return { q: `Complete the fact family for ${a}, ${b} and ${a + b}:\n${a} + ${b} = ▢`, a: String(a + b),
          sol: [S(`${a} + ${b} = ${a + b}`, "B1")] };
      if (r() < 0.5)
        return { q: `Find the missing number:  ▢ × ${a} = ${a * b}`, a: String(b),
          sol: [S(`Divide to undo the multiplication: ${a * b} ÷ ${a}`, "M1"), S(`= ${b}`, "A1")] };
      return { q: `Find the missing number:  ${a * b} ÷ ▢ = ${a}`, a: String(b),
        sol: [S(`${a * b} ÷ ${a} = ${b}`, "M1"), S(`so the missing number is ${b}`, "A1")] };
    }
  },
  arraysMultiplication: {
    name: "Arrays and repeated addition", grades: [2, 3],
    gen(r, d) {
      const rows = ri(r, 2, d === 1 ? 5 : 9), cols = ri(r, 2, d === 1 ? 5 : 9);
      return { q: `An array has ${rows} rows of ${cols} counters.\nWrite this as a multiplication and find the total.`,
        a: `${rows} × ${cols} = ${rows * cols}`,
        sol: [S(`${cols} added ${rows} times`, "M1"), S(`${rows} × ${cols} = ${rows * cols}`, "A1")] };
    }
  },
  moneyTotals: {
    name: "Money", grades: [1, 2, 3, 4],
    gen(r, d) {
      // Omani money: 1 rial = 1000 baisa; keep the amounts classroom-sized.
      if (d === 1) {
        const a = ri(r, 1, 9) * 50, b = ri(r, 1, 9) * 50;
        return { q: `Find the total:  ${a} baisa + ${b} baisa`, a: `${a + b} baisa`,
          sol: [S(`${a} + ${b} = ${a + b}`, "A1")] };
      }
      const cost = ri(r, 1, 19) * 50, paid = 1000;
      return { q: `A pen costs ${cost} baisa. You pay with 1 rial (1000 baisa).\nHow much change do you get?`,
        a: `${paid - cost} baisa`,
        sol: [S(`1 rial = 1000 baisa`, "M1"), S(`${paid} − ${cost} = ${paid - cost} baisa`, "A1")] };
    }
  },

  // ===================== Primary: fractions and decimals =====================

  fractionOfShape: {
    name: "Fractions of a shape", grades: [1, 2, 3],
    gen(r, d) {
      const den = pick(r, d === 1 ? [2, 4] : d === 2 ? [3, 4, 6] : [5, 8, 10]);
      const num = d === 1 ? 1 : ri(r, 1, den - 1);
      const g = gcd(num, den);
      const simple = g > 1 ? `${frac(num, den)}  = ${frac(num / g, den / g)}` : frac(num, den);
      return { q: `A shape is split into ${den} equal parts and ${num} ${num === 1 ? "part is" : "parts are"} shaded.\nWhat fraction is shaded? Give your answer in its simplest form.`,
        a: g > 1 ? frac(num / g, den / g) : frac(num, den),
        sol: [S(`${den} equal parts, so each part is ${frac(1, den)}`, "M1"),
              S(`${num} shaded, so ${simple}`, "A1")] };
    }
  },
  equalSharing: {
    name: "Equal sharing", grades: [1, 2, 3],
    gen(r, d) {
      const groups = ri(r, 2, d === 1 ? 4 : 8), each = ri(r, 2, d === 1 ? 5 : 12);
      return { q: `${groups * each} counters are shared equally between ${groups} children.\nHow many does each child get?`,
        a: String(each),
        sol: [S(`${groups * each} ÷ ${groups}`, "M1"), S(`= ${each} each`, "A1")] };
    }
  },
  compareFractions: {
    name: "Comparing and ordering fractions", grades: [3, 4, 5, 6],
    gen(r, d) {
      const d1 = pick(r, [2, 3, 4, 5, 6, 8, 10, 12]);
      let d2 = pick(r, [2, 3, 4, 5, 6, 8, 10, 12]);
      if (d === 1) d2 = d1;
      const n1 = ri(r, 1, d1 - 1), n2 = ri(r, 1, d2 - 1);
      const v1 = n1 / d1, v2 = n2 / d2;
      const sign = v1 > v2 ? ">" : v1 < v2 ? "<" : "=";
      const common = (d1 * d2) / gcd(d1, d2);
      return { q: `Write <, > or = between the fractions:  ${frac(n1, d1)} ▢ ${frac(n2, d2)}`, a: sign,
        sol: [S(`Use a common denominator of ${common}`, "M1"),
              S(`${frac(n1 * (common / d1), common)} ${sign} ${frac(n2 * (common / d2), common)}`, "A1")] };
    }
  },
  improperMixed: {
    name: "Improper fractions and mixed numbers", grades: [5, 6, 7],
    gen(r, d) {
      const den = ri(r, 2, 3 + d * 2), whole = ri(r, 1, 4), num = ri(r, 1, den - 1);
      const imp = whole * den + num;
      if (r() < 0.5)
        return { q: `Write ${frac(imp, den)} as a mixed number`, a: `${whole} ${frac(num, den)}`,
          sol: [S(`${imp} ÷ ${den} = ${whole} remainder ${num}`, "M1"),
                S(`= ${whole} ${frac(num, den)}`, "A1")] };
      return { q: `Write ${whole} ${frac(num, den)} as an improper fraction`, a: frac(imp, den),
        sol: [S(`${whole} × ${den} = ${whole * den}`, "M1"),
              S(`${whole * den} + ${num} = ${imp}, so ${frac(imp, den)}`, "A1")] };
    }
  },
  decimalPlaceValue: {
    name: "Decimal place value", grades: [4, 5, 6],
    gen(r, d) {
      const places = d === 1 ? 1 : 2;
      const n = (ri(r, 100, 9999) / Math.pow(10, places)).toFixed(places);
      const s = n.replace(".", "");
      const i = ri(r, n.indexOf(".") + 1, n.length - 1);
      const digit = n[i];
      const pow = i - n.indexOf(".");
      const place = ["tenths", "hundredths", "thousandths"][pow - 1];
      return { q: `What is the value of the digit ${digit} in ${n}?`,
        a: `${digit} ${place}  (${frac(digit, Math.pow(10, pow))})`,
        sol: [S(`The digit ${digit} is in the ${place} place`, "M1"),
              S(`so its value is ${frac(digit, Math.pow(10, pow))}`, "A1")] };
    }
  },
  addDecimals: {
    name: "Adding and subtracting decimals", grades: [5, 6, 7],
    gen(r, d) {
      const p = d === 1 ? 1 : 2;
      const k = Math.pow(10, p);
      let a = ri(r, 10, 99 * k) / k, b = ri(r, 10, 99 * k) / k;
      const plus = r() < 0.5;
      if (!plus && b > a) [a, b] = [b, a];
      const ans = (plus ? a + b : a - b).toFixed(p);
      return { q: `Work out ${a.toFixed(p)} ${plus ? "+" : "−"} ${b.toFixed(p)}`, a: ans,
        sol: [S("Line up the decimal points", "M1"),
              S(`${a.toFixed(p)} ${plus ? "+" : "−"} ${b.toFixed(p)} = ${ans}`, "A1")] };
    }
  },
  multiplyDecimals: {
    name: "Multiplying decimals", grades: [5, 6, 7],
    gen(r, d) {
      const p = d === 1 ? 1 : 2;
      const whole = ri(r, 11, d === 3 ? 999 : 99);
      const a = whole / Math.pow(10, p);
      const b = d === 3 ? ri(r, 11, 29) : ri(r, 2, 9);
      const ans = (whole * b) / Math.pow(10, p);
      return { q: `Work out ${a.toFixed(p)} × ${b}`, a: ans.toFixed(p),
        sol: [S(`Ignore the decimal point: ${whole} × ${b} = ${whole * b}`, "M1"),
              S(`Put back ${p} decimal place${p > 1 ? "s" : ""}: ${ans.toFixed(p)}`, "A1")] };
    }
  },
  fdpEquivalence: {
    name: "Fractions, decimals and percentages", grades: [5, 6, 7, 8],
    gen(r, d) {
      const set = d === 1 ? [[1, 2, "0.5", "50%"], [1, 4, "0.25", "25%"], [3, 4, "0.75", "75%"], [1, 10, "0.1", "10%"]]
        : d === 2 ? [[1, 5, "0.2", "20%"], [2, 5, "0.4", "40%"], [3, 5, "0.6", "60%"], [7, 10, "0.7", "70%"], [1, 20, "0.05", "5%"]]
        : [[1, 8, "0.125", "12.5%"], [3, 8, "0.375", "37.5%"], [1, 3, "0.333…", "33⅓%"], [2, 3, "0.666…", "66⅔%"]];
      const [n, den, dec, pct] = pick(r, set);
      return { q: `Complete the table row for ${frac(n, den)}:\nfraction → decimal → percentage`,
        a: `${frac(n, den)} = ${dec} = ${pct}`,
        sol: [S(`${n} ÷ ${den} = ${dec}`, "M1"), S(`${dec} × 100 = ${pct}`, "A1")] };
    }
  },
  multiplyFraction: {
    name: "Multiplying fractions", grades: [6, 7, 8],
    gen(r, d) {
      const den = ri(r, 2, 8), num = ri(r, 1, den - 1);
      if (d === 1) {
        const w = ri(r, 2, 9);
        const top = num * w, g = gcd(top, den);
        return { q: `Work out ${frac(num, den)} × ${w}`,
          a: g === den ? String(top / den) : frac(top / g, den / g),
          sol: [S(`${num} × ${w} = ${top}`, "M1"),
                S(`${frac(top, den)} = ${g === den ? top / den : frac(top / g, den / g)}`, "A1")] };
      }
      const d2 = ri(r, 2, 8), n2 = ri(r, 1, d2 - 1);
      const tn = num * n2, td = den * d2, g = gcd(tn, td);
      return { q: `Work out ${frac(num, den)} × ${frac(n2, d2)}`, a: frac(tn / g, td / g),
        sol: [S(`Multiply the numerators: ${num} × ${n2} = ${tn}`, "M1"),
              S(`Multiply the denominators: ${den} × ${d2} = ${td}`, "M1"),
              S(`${frac(tn, td)} = ${frac(tn / g, td / g)}`, "A1")] };
    }
  },

  // ================ Primary: geometry, measure and statistics ================

  shapeProperties: {
    name: "Properties of 2D and 3D shapes", grades: [1, 2, 3, 4],
    gen(r, d) {
      const flat = [["triangle", 3, 3], ["square", 4, 4], ["rectangle", 4, 4], ["pentagon", 5, 5],
                    ["hexagon", 6, 6], ["octagon", 8, 8]];
      const solid = [["cube", 6, 12, 8], ["cuboid", 6, 12, 8], ["square-based pyramid", 5, 8, 5],
                     ["triangular prism", 5, 9, 6], ["cylinder", 3, 2, 0], ["cone", 2, 1, 1]];
      if (d < 3 || r() < 0.5) {
        const [name, sides, corners] = pick(r, d === 1 ? flat.slice(0, 4) : flat);
        const askSides = r() < 0.5;
        return { q: `How many ${askSides ? "sides" : "corners"} does a ${name} have?`,
          a: String(askSides ? sides : corners),
          sol: [S(`A ${name} has ${sides} sides and ${corners} corners`, "B1")] };
      }
      const [name, faces, edges, vertices] = pick(r, solid);
      const which = pick(r, ["faces", "edges", "vertices"]);
      const ans = which === "faces" ? faces : which === "edges" ? edges : vertices;
      return { q: `How many ${which} does a ${name} have?`, a: String(ans),
        sol: [S(`A ${name} has ${faces} faces, ${edges} edges and ${vertices} vertices`, "M1"),
              S(`So ${ans} ${which}`, "A1")] };
    }
  },
  symmetryLines: {
    name: "Lines of symmetry", grades: [2, 3, 4, 5],
    gen(r, d) {
      const shapes = [["square", 4], ["rectangle", 2], ["equilateral triangle", 3],
                      ["isosceles triangle", 1], ["regular pentagon", 5], ["regular hexagon", 6],
                      ["circle", "infinitely many"], ["parallelogram", 0], ["kite", 1],
                      ["regular octagon", 8], ["rhombus", 2]];
      const pool = d === 1 ? shapes.slice(0, 4) : d === 2 ? shapes.slice(0, 7) : shapes;
      const [name, n] = pick(r, pool);
      return { q: `How many lines of symmetry does a ${name} have?`, a: String(n),
        sol: [S(`Fold the shape so both halves match exactly`, "M1"),
              S(`A ${name} has ${n} line${n === 1 ? "" : "s"} of symmetry`, "A1")] };
    }
  },
  tellTime: {
    name: "Telling the time", grades: [1, 2, 3, 4],
    gen(r, d) {
      const h = ri(r, 1, 12);
      const mins = d === 1 ? pick(r, [0, 30]) : d === 2 ? pick(r, [0, 15, 30, 45]) : ri(r, 0, 11) * 5;
      const words = { 0: `${h} o'clock`, 15: `quarter past ${h}`, 30: `half past ${h}`,
                      45: `quarter to ${h === 12 ? 1 : h + 1}` };
      const digital = `${h}:${String(mins).padStart(2, "0")}`;
      const ans = words[mins] || (mins < 30 ? `${mins} minutes past ${h}` : `${60 - mins} minutes to ${h === 12 ? 1 : h + 1}`);
      return { q: `Write this time in words:  ${digital}`, a: ans,
        sol: [S(`${mins} minutes ${mins <= 30 ? "past" : "to"} the hour`, "M1"), S(ans, "A1")] };
    }
  },
  timeIntervals: {
    name: "Time intervals", grades: [3, 4, 5, 6],
    gen(r, d) {
      const h1 = ri(r, 7, 11), m1 = ri(r, 0, 11) * 5;
      const dur = d === 1 ? ri(r, 1, 5) * 10 : d === 2 ? ri(r, 4, 15) * 5 : ri(r, 70, 200);
      const t1 = h1 * 60 + m1, t2 = t1 + dur;
      const fmt = (t) => `${Math.floor(t / 60) % 24}:${String(t % 60).padStart(2, "0")}`;
      const hh = Math.floor(dur / 60), mm = dur % 60;
      return { q: `A lesson starts at ${fmt(t1)} and lasts ${hh ? hh + " hour" + (hh > 1 ? "s" : "") + " " : ""}${mm ? mm + " minutes" : ""}.\nWhat time does it finish?`,
        a: fmt(t2),
        sol: [S(`${fmt(t1)} + ${dur} minutes`, "M1"), S(`= ${fmt(t2)}`, "A1")] };
    }
  },
  unitConversion: {
    name: "Converting units of measure", grades: [3, 4, 5, 6, 7],
    gen(r, d) {
      const sets = [["cm", "mm", 10], ["m", "cm", 100], ["km", "m", 1000],
                    ["kg", "g", 1000], ["litres", "ml", 1000]];
      const [big, small, k] = pick(r, sets);
      const n = d === 1 ? ri(r, 2, 9) : d === 2 ? ri(r, 2, 99) : ri(r, 2, 99) + 0.5;
      if (r() < 0.5)
        return { q: `Convert ${n} ${big} into ${small}`, a: `${n * k} ${small}`,
          sol: [S(`1 ${big} = ${k} ${small}`, "M1"), S(`${n} × ${k} = ${n * k} ${small}`, "A1")] };
      return { q: `Convert ${n * k} ${small} into ${big}`, a: `${n} ${big}`,
        sol: [S(`${k} ${small} = 1 ${big}`, "M1"), S(`${n * k} ÷ ${k} = ${n} ${big}`, "A1")] };
    }
  },
  perimeterShapes: {
    name: "Perimeter", grades: [3, 4, 5, 6],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 2, 12);
        return { q: `Find the perimeter of a square with side ${a} cm.`, a: `${4 * a} cm`,
          sol: [S(`4 × ${a}`, "M1"), S(`= ${4 * a} cm`, "A1")] };
      }
      if (d === 2) {
        const a = ri(r, 2, 15), b = ri(r, 2, 15);
        return { q: `Find the perimeter of a rectangle ${a} cm by ${b} cm.`, a: `${2 * (a + b)} cm`,
          sol: [S(`2 × (${a} + ${b})`, "M1"), S(`= ${2 * (a + b)} cm`, "A1")] };
      }
      const a = ri(r, 3, 12), b = ri(r, 3, 12), c = ri(r, 2, a - 1), e = ri(r, 2, b - 1);
      return { q: `An L-shape is made by cutting a ${c} cm by ${e} cm corner from a ${a} cm by ${b} cm rectangle.\nFind its perimeter.`,
        a: `${2 * (a + b)} cm`,
        sol: [S("The cut-out corner moves two sides but does not change the total distance round", "M1"),
              S(`Perimeter = 2 × (${a} + ${b}) = ${2 * (a + b)} cm`, "A1")] };
    }
  },
  volumeCuboid: {
    name: "Volume of a cuboid", grades: [5, 6, 7, 8],
    gen(r, d) {
      const a = ri(r, 2, 6 + d), b = ri(r, 2, 6 + d), c = ri(r, 2, 6 + d);
      if (d === 3) {
        const v = a * b * c;
        return { q: `A cuboid has volume ${v} cm³, length ${a} cm and width ${b} cm.\nFind its height.`,
          a: `${c} cm`,
          sol: [S(`${a} × ${b} = ${a * b}`, "M1"), S(`${v} ÷ ${a * b} = ${c} cm`, "A1")] };
      }
      return { q: `Find the volume of a cuboid ${a} cm by ${b} cm by ${c} cm.`, a: `${a * b * c} cm³`,
        sol: [S(`Volume = length × width × height`, "M1"),
              S(`${a} × ${b} × ${c} = ${a * b * c} cm³`, "A1")] };
    }
  },
  coordinates: {
    name: "Coordinates", grades: [4, 5, 6, 7],
    gen(r, d) {
      const lim = d === 1 ? 6 : 8;
      const neg = d >= 2;
      const x = neg ? ri(r, -lim, lim) : ri(r, 0, lim);
      const y = neg ? ri(r, -lim, lim) : ri(r, 0, lim);
      if (d === 3) {
        const dx = ri(r, 1, 5), dy = ri(r, 1, 5);
        return { q: `The point (${nf(x)}, ${nf(y)}) is translated ${dx} right and ${dy} up.\nWrite the new coordinates.`,
          a: `(${nf(x + dx)}, ${nf(y + dy)})`,
          sol: [S(`Add ${dx} to x and ${dy} to y`, "M1"),
                S(`(${nf(x + dx)}, ${nf(y + dy)})`, "A1")] };
      }
      const q = x >= 0 && y >= 0 ? "first" : x < 0 && y >= 0 ? "second" : x < 0 ? "third" : "fourth";
      return { q: `In which quadrant does the point (${nf(x)}, ${nf(y)}) lie?`, a: `the ${q} quadrant`,
        sol: [S(`x is ${x >= 0 ? "positive" : "negative"} and y is ${y >= 0 ? "positive" : "negative"}`, "M1"),
              S(`so it is in the ${q} quadrant`, "A1")] };
    }
  },
  angleTypes: {
    name: "Types of angle", grades: [3, 4, 5, 6],
    gen(r, d) {
      const a = d === 1 ? pick(r, [45, 90, 120, 180]) : ri(r, 5, 355);
      const kind = a < 90 ? "acute" : a === 90 ? "a right angle" : a < 180 ? "obtuse"
        : a === 180 ? "a straight line" : "reflex";
      if (d === 3) {
        const b = ri(r, 20, 150);
        return { q: `Two angles on a straight line are ${b}° and x°. Find x.`, a: `${180 - b}°`,
          sol: [S("Angles on a straight line add to 180°", "M1"),
                S(`180 − ${b} = ${180 - b}°`, "A1")] };
      }
      return { q: `Is an angle of ${a}° acute, obtuse or reflex?`,
        a: kind.replace(/^a /, ""),
        sol: [S("Acute < 90°, obtuse between 90° and 180°, reflex above 180°", "M1"),
              S(`${a}° is ${kind}`, "A1")] };
    }
  },
  readTable: {
    name: "Reading charts and tables", grades: [2, 3, 4, 5, 6],
    gen(r, d) {
      const items = ["Apples", "Bananas", "Oranges", "Pears", "Mangoes"];
      const n = d === 1 ? 3 : d === 2 ? 4 : 5;
      const rows = items.slice(0, n).map((x) => [x, ri(r, 2, 20)]);
      const table = rows.map(([x, v]) => `${x}: ${v}`).join("\n");
      const total = rows.reduce((t, [, v]) => t + v, 0);
      const most = rows.reduce((a, b) => (b[1] > a[1] ? b : a));
      if (d === 3)
        return { q: `The table shows fruit sold one morning.\n${table}\nHow many more ${most[0].toLowerCase()} were sold than the least popular fruit?`,
          a: String(most[1] - rows.reduce((a, b) => (b[1] < a[1] ? b : a))[1]),
          sol: [S(`Most: ${most[0]} (${most[1]}), least: ${rows.reduce((a, b) => (b[1] < a[1] ? b : a))[0]} (${rows.reduce((a, b) => (b[1] < a[1] ? b : a))[1]})`, "M1"),
                S(`${most[1]} − ${rows.reduce((a, b) => (b[1] < a[1] ? b : a))[1]} = ${most[1] - rows.reduce((a, b) => (b[1] < a[1] ? b : a))[1]}`, "A1")] };
      if (r() < 0.5)
        return { q: `The table shows fruit sold one morning.\n${table}\nHow many pieces of fruit were sold altogether?`,
          a: String(total),
          sol: [S(rows.map(([, v]) => v).join(" + "), "M1"), S(`= ${total}`, "A1")] };
      return { q: `The table shows fruit sold one morning.\n${table}\nWhich fruit sold the most?`, a: most[0],
        sol: [S(`The largest number is ${most[1]}`, "M1"), S(`so ${most[0]}`, "A1")] };
    }
  },
  chanceLanguage: {
    name: "The language of chance", grades: [2, 3, 4, 5],
    gen(r, d) {
      const events = [
        ["the sun will rise tomorrow", "certain"],
        ["a fair coin lands on heads", "an even chance"],
        ["you roll a 7 on an ordinary dice", "impossible"],
        ["it snows in Muscat in July", "impossible"],
        ["you roll an even number on a dice", "an even chance"],
        ["a baby born today is a girl", "an even chance"],
        ["you pick a red ball from a bag of 9 red and 1 blue", "likely"],
        ["you pick the blue ball from a bag of 9 red and 1 blue", "unlikely"]
      ];
      const pool = d === 1 ? events.slice(0, 4) : d === 2 ? events.slice(0, 6) : events;
      const [e, ans] = pick(r, pool);
      return { q: `Choose the best word: impossible, unlikely, an even chance, likely or certain.\n${e[0].toUpperCase() + e.slice(1)}.`,
        a: ans,
        sol: [S("Place the event on the likelihood scale from impossible to certain", "M1"), S(ans, "A1")] };
    }
  },
  simpleProbability: {
    name: "Probability of single events", grades: [5, 6, 7, 8],
    gen(r, d) {
      const red = ri(r, 1, 6), blue = ri(r, 1, 6), green = d === 1 ? 0 : ri(r, 1, 6);
      const total = red + blue + green;
      const want = pick(r, green ? ["red", "blue", "green"] : ["red", "blue"]);
      const n = want === "red" ? red : want === "blue" ? blue : green;
      const g = gcd(n, total);
      return { q: `A bag holds ${red} red, ${blue} blue${green ? " and " + green + " green" : ""} counters.\nOne counter is taken at random. Find the probability that it is ${want}.`,
        a: frac(n / g, total / g),
        sol: [S(`Total counters = ${total}`, "M1"),
              S(`P(${want}) = ${frac(n, total)}${g > 1 ? " = " + frac(n / g, total / g) : ""}`, "A1")] };
    }
  },
  modeMedianRange: {
    name: "Mode, median and range", grades: [5, 6, 7, 8],
    gen(r, d) {
      const n = d === 1 ? 5 : d === 2 ? 7 : 9;
      const vals = [];
      for (let i = 0; i < n - 1; i++) vals.push(ri(r, 1, 20));
      vals.push(vals[ri(r, 0, n - 2)]);            // guarantee a mode
      const sorted = [...vals].sort((a, b) => a - b);
      const counts = {};
      sorted.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
      const mode = Object.keys(counts).reduce((a, b) => (counts[b] > counts[a] ? b : a));
      const median = sorted[(n - 1) / 2];
      const range = sorted[n - 1] - sorted[0];
      const ask = d === 1 ? "mode" : d === 2 ? "median" : "range";
      const ans = ask === "mode" ? mode : ask === "median" ? median : range;
      return { q: `Find the ${ask} of this data:\n${vals.join(", ")}`, a: String(ans),
        sol: [S(`In order: ${sorted.join(", ")}`, "M1"),
              S(ask === "mode" ? `${mode} appears most often`
                : ask === "median" ? `the middle value is ${median}`
                : `${sorted[n - 1]} − ${sorted[0]} = ${range}`, "A1")] };
    }
  },

  // ============ Lower Secondary and IGCSE ============

  substitution: {
    name: "Substitution into formulae", grades: [7, 8, 9],
    gen(r, d) {
      const a = ri(r, 2, 9), b = ri(r, 2, 9), x = ri(r, 2, 9);
      if (d === 1)
        return { q: `Find the value of ${a}x + ${b} when x = ${x}`, a: String(a * x + b),
          sol: [S(`${a} × ${x} = ${a * x}`, "M1"), S(`${a * x} + ${b} = ${a * x + b}`, "A1")] };
      if (d === 2) {
        const y = ri(r, 2, 9);
        return { q: `Find the value of ${a}x − ${b}y when x = ${x} and y = ${y}`, a: nf(a * x - b * y),
          sol: [S(`${a} × ${x} = ${a * x},  ${b} × ${y} = ${b * y}`, "M1"),
                S(`${a * x} − ${b * y} = ${nf(a * x - b * y)}`, "A1")] };
      }
      return { q: `The formula for the area of a trapezium is A = ⁅1/2⁆(a + b)h.\nFind A when a = ${a}, b = ${b} and h = ${x * 2}`,
        a: String(((a + b) * x * 2) / 2),
        sol: [S(`a + b = ${a + b}`, "M1"),
              S(`⁅1/2⁆ × ${a + b} × ${x * 2} = ${((a + b) * x * 2) / 2}`, "A1")] };
    }
  },
  simplifyExpressions: {
    name: "Simplifying expressions", grades: [7, 8, 9],
    gen(r, d) {
      const a = ri(r, 2, 9), b = ri(r, 2, 9), c = ri(r, 2, 9), e = ri(r, 2, 9);
      if (d === 1)
        return { q: `Simplify:  ${a}x + ${b}x`, a: `${a + b}x`,
          sol: [S(`${a} + ${b} = ${a + b}`, "M1"), S(`= ${a + b}x`, "A1")] };
      if (d === 2)
        return { q: `Simplify:  ${a}x + ${b}y + ${c}x − ${Math.min(b, e)}y`,
          a: `${a + c}x + ${b - Math.min(b, e)}y`.replace(" + 0y", ""),
          sol: [S(`x terms: ${a}x + ${c}x = ${a + c}x`, "M1"),
                S(`y terms: ${b}y − ${Math.min(b, e)}y = ${b - Math.min(b, e)}y`, "A1")] };
      return { q: `Simplify:  ${a}x${sup(2)} × ${b}x${sup(3)}`, a: `${a * b}x${sup(5)}`,
        sol: [S(`${a} × ${b} = ${a * b}`, "M1"),
              S(`x${sup(2)} × x${sup(3)} = x${sup(5)}, so ${a * b}x${sup(5)}`, "A1")] };
    }
  },
  angleFacts: {
    name: "Angle facts", grades: [6, 7, 8],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 20, 150);
        return { q: `Two angles on a straight line are ${a}° and x°.\nFind x, giving a reason.`,
          a: `x = ${180 - a}°`,
          sol: [S("Angles on a straight line add to 180°", "M1"), S(`x = 180 − ${a} = ${180 - a}°`, "A1")] };
      }
      if (d === 2) {
        const a = ri(r, 40, 120), b = ri(r, 40, Math.max(41, 340 - a - 40));
        return { q: `Three angles at a point are ${a}°, ${b}° and x°.\nFind x, giving a reason.`,
          a: `x = ${360 - a - b}°`,
          sol: [S("Angles at a point add to 360°", "M1"),
                S(`x = 360 − ${a} − ${b} = ${360 - a - b}°`, "A1")] };
      }
      const a = ri(r, 40, 140);
      const kind = pick(r, ["corresponding", "alternate", "co-interior"]);
      const ans = kind === "co-interior" ? 180 - a : a;
      return { q: `A pair of parallel lines is crossed by a straight line.\nOne angle is ${a}°. Find the ${kind} angle x.`,
        a: `x = ${ans}°`,
        sol: [S(`${kind[0].toUpperCase() + kind.slice(1)} angles are ${kind === "co-interior" ? "supplementary" : "equal"}`, "M1"),
              S(`x = ${ans}°`, "A1")] };
    }
  },
  polygonAngles: {
    name: "Angles in polygons", grades: [7, 8, 9],
    gen(r, d) {
      // Exterior-angle questions only work when n divides 360 exactly.
      const n = pick(r, d === 1 ? [3, 4, 5, 6, 7, 9, 11] : d === 2 ? [5, 6, 8, 9, 10, 12]
        : [15, 18, 20, 24, 30, 36]);
      if (d === 1)
        return { q: `Find the sum of the interior angles of a polygon with ${n} sides.`,
          a: `${(n - 2) * 180}°`,
          sol: [S(`(n − 2) × 180 with n = ${n}`, "M1"), S(`${n - 2} × 180 = ${(n - 2) * 180}°`, "A1")] };
      if (d === 2)
        return { q: `Find the size of each exterior angle of a regular polygon with ${n} sides.`,
          a: `${360 / n}°`,
          sol: [S(`360 ÷ ${n}`, "M1"), S(`= ${360 / n}°`, "A1")] };
      return { q: `Each exterior angle of a regular polygon is ${360 / n}°.\nHow many sides does it have?`,
        a: String(n),
        sol: [S(`360 ÷ ${360 / n}`, "M1"), S(`= ${n} sides`, "A1")] };
    }
  },
  percentChange: {
    name: "Percentage change", grades: [8, 9, 10],
    gen(r, d) {
      const base = ri(r, 2, 40) * 25;
      const pct = pick(r, [5, 10, 12, 15, 20, 25]);
      if (d === 1) {
        const up = r() < 0.5;
        // Work in whole units of 1% so the answer never carries binary rounding.
        const part = (base * pct) / 100;
        const ans = up ? base + part : base - part;
        return { q: `${up ? "Increase" : "Decrease"} ${base} by ${pct}%`, a: money(ans),
          sol: [S(`${pct}% of ${base} = ${money(part)}`, "M1"),
                S(`${base} ${up ? "+" : "−"} ${money(part)} = ${money(ans)}`, "A1")] };
      }
      if (d === 2) {
        const rise = (base * pct) / 100;
        const now = base + rise;
        return { q: `A price rises from ${money(base)} to ${money(now)}.\nFind the percentage increase.`, a: `${pct}%`,
          sol: [S(`Increase = ${money(now)} − ${money(base)} = ${money(rise)}`, "M1"),
                S(`${frac(money(rise), money(base))} × 100 = ${pct}%`, "A1")] };
      }
      const yrs = ri(r, 2, 4);
      const amt = +(base * Math.pow(1 + pct / 100, yrs)).toFixed(2);
      return { q: `${base} rials is invested at ${pct}% compound interest for ${yrs} years.\nFind the value at the end, to 2 decimal places.`,
        a: `${amt} rials`,
        sol: [S(`Multiplier = 1.${String(pct).padStart(2, "0")}`, "M1"),
              S(`${base} × 1.${String(pct).padStart(2, "0")}${sup(yrs)} = ${amt}`, "A1")] };
    }
  },
  speedDistanceTime: {
    name: "Speed, distance and time", grades: [8, 9, 10],
    gen(r, d) {
      const speed = ri(r, 2, 12) * 5, time = ri(r, 2, 6);
      const dist = speed * time;
      if (d === 1)
        return { q: `A car travels at ${speed} km/h for ${time} hours.\nHow far does it go?`,
          a: `${dist} km`,
          sol: [S("distance = speed × time", "M1"), S(`${speed} × ${time} = ${dist} km`, "A1")] };
      if (d === 2)
        return { q: `A car travels ${dist} km in ${time} hours.\nFind its average speed.`,
          a: `${speed} km/h`,
          sol: [S("speed = distance ÷ time", "M1"), S(`${dist} ÷ ${time} = ${speed} km/h`, "A1")] };
      return { q: `A car travels ${dist} km at an average speed of ${speed} km/h.\nHow long does the journey take?`,
        a: `${time} hours`,
        sol: [S("time = distance ÷ speed", "M1"), S(`${dist} ÷ ${speed} = ${time} hours`, "A1")] };
    }
  },
  prismVolume: {
    name: "Volume and surface area of a prism", grades: [8, 9, 10],
    gen(r, d) {
      const b = ri(r, 3, 12), h = ri(r, 3, 12), len = ri(r, 4, 15);
      if (d === 1) {
        const area = (b * h) / 2;
        return { q: `A triangular prism has a cross-section of area ${area} cm² and length ${len} cm.\nFind its volume.`,
          a: `${area * len} cm³`,
          sol: [S("Volume = cross-section area × length", "M1"),
                S(`${area} × ${len} = ${area * len} cm³`, "A1")] };
      }
      if (d === 2)
        return { q: `A prism has a right-angled triangular cross-section with base ${b} cm and height ${h} cm, and is ${len} cm long.\nFind its volume.`,
          a: `${((b * h) / 2) * len} cm³`,
          sol: [S(`Cross-section = ⁅1/2⁆ × ${b} × ${h} = ${(b * h) / 2} cm²`, "M1"),
                S(`${(b * h) / 2} × ${len} = ${((b * h) / 2) * len} cm³`, "A1")] };
      const a = ri(r, 2, 8);
      return { q: `A cube has surface area ${6 * a * a} cm².\nFind the length of one edge.`,
        a: `${a} cm`,
        sol: [S(`One face = ${6 * a * a} ÷ 6 = ${a * a} cm²`, "M1"),
              S(`Edge = ${rad(a * a)} = ${a} cm`, "A1")] };
    }
  },
  bounds: {
    name: "Upper and lower bounds", grades: [9, 10],
    gen(r, d) {
      const unit = d === 1 ? 1 : d === 2 ? 10 : 0.1;
      const n = d === 3 ? +(ri(r, 20, 99) / 10).toFixed(1) : ri(r, 2, 40) * unit;
      const half = unit / 2;
      const lower = +(n - half).toFixed(2), upper = +(n + half).toFixed(2);
      return { q: `A length is ${n} cm, correct to the nearest ${unit} cm.\nWrite down the lower and upper bounds.`,
        a: `${lower} cm ≤ length < ${upper} cm`,
        sol: [S(`Half of ${unit} is ${half}`, "M1"),
              S(`${n} − ${half} = ${lower},  ${n} + ${half} = ${upper}`, "A1")] };
    }
  },
  surds: {
    name: "Surds", grades: [9, 10, 11],
    gen(r, d) {
      if (d === 1) {
        const k = pick(r, [2, 3, 5, 6, 7]), sq = pick(r, [4, 9, 16, 25]);
        return { q: `Simplify:  ${rad(k * sq)}`, a: `${Math.sqrt(sq)}${rad(k)}`,
          sol: [S(`${k * sq} = ${sq} × ${k}`, "M1"),
                S(`${rad(sq)} × ${rad(k)} = ${Math.sqrt(sq)}${rad(k)}`, "A1")] };
      }
      if (d === 2) {
        const k = pick(r, [2, 3, 5]), a = ri(r, 2, 6), b = ri(r, 2, 6);
        return { q: `Simplify:  ${a}${rad(k)} + ${b}${rad(k)}`, a: `${a + b}${rad(k)}`,
          sol: [S(`${a} + ${b} = ${a + b}`, "M1"), S(`= ${a + b}${rad(k)}`, "A1")] };
      }
      const k = pick(r, [2, 3, 5, 7]), a = ri(r, 2, 9);
      return { q: `Rationalise the denominator:  ${frac(a, rad(k))}`, a: frac(`${a}${rad(k)}`, k),
        sol: [S(`Multiply top and bottom by ${rad(k)}`, "M1"),
              S(`${frac(`${a}${rad(k)}`, k)}`, "A1")] };
    }
  },
  arithmeticSeries: {
    name: "Arithmetic progressions", grades: [11, 12],
    gen(r, d) {
      const a = ri(r, 2, 12), diff = ri(r, 2, 9), n = ri(r, 5, 20);
      if (d === 1)
        return { q: `An arithmetic progression has first term ${a} and common difference ${diff}.\nFind the ${n}th term.`,
          a: String(a + (n - 1) * diff),
          sol: [S(`uₙ = a + (n − 1)d`, "M1"),
                S(`${a} + ${n - 1} × ${diff} = ${a + (n - 1) * diff}`, "A1")] };
      const sum = (n / 2) * (2 * a + (n - 1) * diff);
      if (d === 2)
        return { q: `An arithmetic progression has first term ${a} and common difference ${diff}.\nFind the sum of the first ${n} terms.`,
          a: String(sum),
          sol: [S(`Sₙ = ⁅n/2⁆(2a + (n − 1)d)`, "M1"),
                S(`${frac(n, 2)}(2 × ${a} + ${n - 1} × ${diff}) = ${sum}`, "A1")] };
      const last = a + (n - 1) * diff;
      return { q: `An arithmetic progression begins ${a}, ${a + diff}, ${a + 2 * diff}, …\nThe last term is ${last}. How many terms are there?`,
        a: String(n),
        sol: [S(`${last} = ${a} + (n − 1) × ${diff}`, "M1"),
              S(`n − 1 = ${n - 1}, so n = ${n}`, "A1")] };
    }
  },
  geometricSeries: {
    name: "Geometric progressions", grades: [11, 12],
    gen(r, d) {
      const a = ri(r, 2, 9), ratio = pick(r, [2, 3]), n = ri(r, 4, 8);
      if (d === 1)
        return { q: `A geometric progression has first term ${a} and common ratio ${ratio}.\nFind the ${n}th term.`,
          a: String(a * Math.pow(ratio, n - 1)),
          sol: [S(`uₙ = ar${sup("n")}⁻¹`, "M1"),
                S(`${a} × ${ratio}${sup(n - 1)} = ${a * Math.pow(ratio, n - 1)}`, "A1")] };
      if (d === 2) {
        const sum = (a * (Math.pow(ratio, n) - 1)) / (ratio - 1);
        return { q: `A geometric progression has first term ${a} and common ratio ${ratio}.\nFind the sum of the first ${n} terms.`,
          a: String(sum),
          sol: [S(`Sₙ = ${frac(`a(r${sup("n")} − 1)`, "r − 1")}`, "M1"),
                S(`${frac(`${a}(${ratio}${sup(n)} − 1)`, ratio - 1)} = ${sum}`, "A1")] };
      }
      const den = ri(r, 2, 5);
      const sInf = a / (1 - 1 / den);
      const clean = Number.isInteger(sInf) ? String(sInf) : frac(a * den, den - 1);
      return { q: `A geometric progression has first term ${a} and common ratio ${frac(1, den)}.\nFind the sum to infinity.`,
        a: clean,
        sol: [S(`S∞ = ${frac("a", "1 − r")}`, "M1"),
              S(`${frac(a, `1 − ${frac(1, den)}`)} = ${clean}`, "A1")] };
    }
  },
  compositeFunctions: {
    name: "Composite and inverse functions", grades: [10, 11, 12],
    gen(r, d) {
      const a = ri(r, 2, 6), b = ri(r, 1, 9), x = ri(r, 2, 8);
      if (d === 1)
        return { q: `f(x) = ${a}x + ${b}.  Find f(${x}).`, a: String(a * x + b),
          sol: [S(`${a} × ${x} + ${b}`, "M1"), S(`= ${a * x + b}`, "A1")] };
      if (d === 2) {
        const c = ri(r, 2, 5);
        return { q: `f(x) = ${a}x + ${b} and g(x) = x + ${c}.\nFind fg(${x}).`,
          a: String(a * (x + c) + b),
          sol: [S(`g(${x}) = ${x} + ${c} = ${x + c}`, "M1"),
                S(`f(${x + c}) = ${a} × ${x + c} + ${b} = ${a * (x + c) + b}`, "A1")] };
      }
      return { q: `f(x) = ${a}x + ${b}.  Find f⁻¹(x).`, a: `${frac(`x − ${b}`, a)}`,
        sol: [S(`Let y = ${a}x + ${b}`, "M1"),
              S(`x = ${frac(`y − ${b}`, a)}, so f⁻¹(x) = ${frac(`x − ${b}`, a)}`, "A1")] };
    }
  },
  circularMeasure: {
    name: "Radians, arc length and sector area", grades: [11, 12],
    gen(r, d) {
      const rad2 = ri(r, 3, 12);
      const den = pick(r, [2, 3, 4, 6]);
      const theta = frac("π", den);
      const arc = rad2 / den;
      if (d === 1)
        return { q: `Convert ${180 / den}° into radians, in terms of π.`, a: theta,
          sol: [S(`Multiply by ${frac("π", 180)}`, "M1"),
                S(`${180 / den} × ${frac("π", 180)} = ${theta}`, "A1")] };
      if (d === 2)
        return { q: `A sector has radius ${rad2} cm and angle ${theta} radians.\nFind the arc length, in terms of π.`,
          a: `${piTerm(rad2, den)} cm`,
          sol: [S("s = rθ", "M1"),
                S(`${rad2} × ${theta} = ${piTerm(rad2, den)} cm`, "A1")] };
      return { q: `A sector has radius ${rad2} cm and angle ${theta} radians.\nFind its area, in terms of π.`,
        a: `${piTerm(rad2 * rad2, 2 * den)} cm²`,
        sol: [S("A = ⁅1/2⁆r²θ", "M1"),
              S(`⁅1/2⁆ × ${rad2}² × ${theta} = ${piTerm(rad2 * rad2, 2 * den)} cm²`, "A1")] };
    }
  },
  sineCosineRule: {
    name: "The sine and cosine rules", grades: [10, 11],
    gen(r, d) {
      if (d === 1) {
        const A = ri(r, 30, 70), B = ri(r, 30, 70), a = ri(r, 5, 15);
        const b = +((a * Math.sin(B * Math.PI / 180)) / Math.sin(A * Math.PI / 180)).toFixed(2);
        return { q: `In triangle ABC, angle A = ${A}°, angle B = ${B}° and a = ${a} cm.\nFind b, correct to 2 decimal places.`,
          a: `${b} cm`,
          sol: [S(`${frac("a", "sin A")} = ${frac("b", "sin B")}`, "M1"),
                S(`b = ${frac(`${a} sin ${B}°`, `sin ${A}°`)} = ${b} cm`, "A1")] };
      }
      if (d === 2) {
        const b = ri(r, 5, 12), c = ri(r, 5, 12), A = ri(r, 30, 120);
        const a = +Math.sqrt(b * b + c * c - 2 * b * c * Math.cos(A * Math.PI / 180)).toFixed(2);
        return { q: `In triangle ABC, b = ${b} cm, c = ${c} cm and angle A = ${A}°.\nFind a, correct to 2 decimal places.`,
          a: `${a} cm`,
          sol: [S("a² = b² + c² − 2bc cos A", "M1"),
                S(`a² = ${b}² + ${c}² − 2(${b})(${c})cos ${A}° , so a = ${a} cm`, "A1")] };
      }
      const b = ri(r, 4, 12), c = ri(r, 4, 12), A = ri(r, 30, 150);
      const area = +(0.5 * b * c * Math.sin(A * Math.PI / 180)).toFixed(2);
      return { q: `A triangle has sides ${b} cm and ${c} cm with an included angle of ${A}°.\nFind its area, correct to 2 decimal places.`,
        a: `${area} cm²`,
        sol: [S("Area = ⁅1/2⁆bc sin A", "M1"),
              S(`⁅1/2⁆ × ${b} × ${c} × sin ${A}° = ${area} cm²`, "A1")] };
    }
  },
  vectors2D: {
    name: "Vectors", grades: [10, 11, 12],
    gen(r, d) {
      const a = ri(r, -6, 8), b = ri(r, -6, 8), c = ri(r, -6, 8), e = ri(r, -6, 8);
      const col = (x, y) => `(${nf(x)}, ${nf(y)})`;
      if (d === 1)
        return { q: `a = ${col(a, b)} and b = ${col(c, e)}.\nFind a + b.`, a: col(a + c, b + e),
          sol: [S("Add the components", "M1"), S(`${col(a + c, b + e)}`, "A1")] };
      if (d === 2) {
        const k = ri(r, 2, 5);
        return { q: `a = ${col(a, b)}.  Find ${k}a.`, a: col(a * k, b * k),
          sol: [S(`Multiply each component by ${k}`, "M1"), S(col(a * k, b * k), "A1")] };
      }
      const t = pick(r, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]]);
      return { q: `Find the magnitude of the vector (${t[0]}, ${t[1]}).`, a: String(t[2]),
        sol: [S(`|v| = ${rad(`${t[0]}² + ${t[1]}²`)}`, "M1"),
              S(`= ${rad(t[0] * t[0] + t[1] * t[1])} = ${t[2]}`, "A1")] };
    }
  },
  completeSquare: {
    name: "Completing the square", grades: [10, 11],
    gen(r, d) {
      const p = ri(r, 1, 8) * (r() < 0.5 ? -1 : 1), q = ri(r, -9, 9);
      const b = -2 * p, c = p * p + q;
      const expr = poly([[1, 2], [b, 1], [c, 0]]);
      if (d === 1 || d === 2)
        return { q: `Write ${expr} in the form (x + a)² + b`,
          a: `(x ${p < 0 ? "+ " + -p : "− " + p})${sup(2)} ${q < 0 ? "− " + -q : "+ " + q}`,
          sol: [S(`Half of ${nf(b)} is ${nf(-p)}`, "M1"),
                S(`(x ${p < 0 ? "+ " + -p : "− " + p})${sup(2)} ${q < 0 ? "− " + -q : "+ " + q}`, "A1")] };
      return { q: `Find the minimum value of ${expr} and the value of x at which it occurs.`,
        a: `minimum ${nf(q)} at x = ${nf(p)}`,
        sol: [S(`Complete the square: (x ${p < 0 ? "+ " + -p : "− " + p})${sup(2)} ${q < 0 ? "− " + -q : "+ " + q}`, "M1"),
              S(`The square is least when x = ${nf(p)}, giving ${nf(q)}`, "A1")] };
    }
  },
  polynomialTheorems: {
    name: "Factor and remainder theorems", grades: [12],
    gen(r, d) {
      const root = ri(r, 1, 4) * (r() < 0.5 ? -1 : 1);
      const a = ri(r, 2, 6), b = ri(r, -6, 6);
      // f(x) = x³ + ax² + bx + c, built so f(root) is known
      const c = ri(r, -9, 9);
      const f = (x) => x * x * x + a * x * x + b * x + c;
      const expr = poly([[1, 3], [a, 2], [b, 1], [c, 0]]);
      if (d === 1 || d === 2)
        return { q: `f(x) = ${expr}\nFind the remainder when f(x) is divided by (x ${root < 0 ? "+ " + -root : "− " + root}).`,
          a: nf(f(root)),
          sol: [S(`By the remainder theorem the remainder is f(${nf(root)})`, "M1"),
                S(`f(${nf(root)}) = ${nf(f(root))}`, "A1")] };
      return { q: `f(x) = ${expr}\nShow whether (x ${root < 0 ? "+ " + -root : "− " + root}) is a factor of f(x).`,
        a: f(root) === 0 ? "Yes — f(" + nf(root) + ") = 0" : "No — f(" + nf(root) + ") = " + nf(f(root)),
        sol: [S(`By the factor theorem, test f(${nf(root)})`, "M1"),
              S(`f(${nf(root)}) = ${nf(f(root))}, so it is ${f(root) === 0 ? "" : "not "}a factor`, "A1")] };
    }
  },
  modulusFunction: {
    name: "The modulus function", grades: [12],
    gen(r, d) {
      const a = ri(r, 2, 6), b = ri(r, 1, 9);
      if (d === 1) {
        const x = ri(r, -6, 6);
        return { q: `Find the value of |${a}x − ${b}| when x = ${nf(x)}`, a: String(Math.abs(a * x - b)),
          sol: [S(`${a} × ${nf(x)} − ${b} = ${nf(a * x - b)}`, "M1"),
                S(`|${nf(a * x - b)}| = ${Math.abs(a * x - b)}`, "A1")] };
      }
      const k = ri(r, 1, 9) + b;
      const x1 = (k + b) / a, x2 = (b - k) / a;
      const nice = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2));
      return { q: `Solve:  |${a}x − ${b}| = ${k}`, a: `x = ${nice(x1)} or x = ${nf(nice(x2))}`,
        sol: [S(`${a}x − ${b} = ${k}  or  ${a}x − ${b} = ${nf(-k)}`, "M1"),
              S(`x = ${nice(x1)}  or  x = ${nf(nice(x2))}`, "A1")] };
    }
  },
  normalDistribution: {
    name: "The normal distribution", grades: [12],
    gen(r, d) {
      // Keep the mean well clear of three standard deviations so the value
      // asked about is never negative — these model heights, marks and times.
      const sd = ri(r, 2, 8), mean = ri(r, 8, 20) * 5;
      const x = mean + ri(r, -3, 3) * sd;
      const z = (x - mean) / sd;
      if (d === 1 || d === 2)
        return { q: `X ~ N(${mean}, ${sd * sd}).  Find the standardised value z when X = ${nf(x)}.`,
          a: `z = ${nf(z)}`,
          sol: [S(`z = ${frac(`x − μ`, "σ")}`, "M1"),
                S(`z = ${frac(`${nf(x)} − ${mean}`, sd)} = ${nf(z)}`, "A1")] };
      const k = ri(r, 1, 2);
      return { q: `X ~ N(${mean}, ${sd * sd}).  Between which two values do the middle ${k === 1 ? "68" : "95"}% of the data lie?`,
        a: `${mean - k * sd} and ${mean + k * sd}`,
        sol: [S(`${k === 1 ? "68" : "95"}% lies within ${k} standard deviation${k > 1 ? "s" : ""} of the mean`, "M1"),
              S(`${mean} ± ${k} × ${sd} → ${mean - k * sd} to ${mean + k * sd}`, "A1")] };
    }
  },
  discreteRandomVariable: {
    name: "Discrete random variables", grades: [11, 12],
    gen(r, d) {
      const n = 4;
      const vals = [1, 2, 3, 4];
      const den = pick(r, [8, 10, 12, 16, 20]);
      const nums = [];
      let left = den;
      for (let i = 0; i < n - 1; i++) {
        const v = ri(r, 1, Math.max(1, left - (n - 1 - i)));
        nums.push(v); left -= v;
      }
      nums.push(left);
      const table = vals.map((v, i) => `x = ${v}: P = ${frac(nums[i], den)}`).join("\n");
      const ex = nums.reduce((t, p, i) => t + p * vals[i], 0);
      const g = gcd(ex, den);
      if (d === 1)
        return { q: `A discrete random variable X has this distribution:\n${table}\nShow that the probabilities sum to 1.`,
          a: `${nums.join(" + ")} = ${den}, so the total is ${frac(den, den)} = 1`,
          sol: [S(`${nums.map((x) => frac(x, den)).join(" + ")}`, "M1"),
                S(`= ${frac(den, den)} = 1`, "A1")] };
      return { q: `A discrete random variable X has this distribution:\n${table}\nFind E(X).`,
        a: g === den ? String(ex / den) : frac(ex / g, den / g),
        sol: [S(`E(X) = Σ x P(X = x)`, "M1"),
              S(vals.map((v, i) => `${v} × ${frac(nums[i], den)}`).join(" + "), "M1"),
              S(`= ${g === den ? ex / den : frac(ex / g, den / g)}`, "A1")] };
    }
  },
  compassDirections: {
    name: "Position and direction", grades: [1, 2, 3, 4],
    gen(r, d) {
      const dirs = ["north", "east", "south", "west"];
      if (d === 1) {
        const from = ri(r, 0, 3), quarter = pick(r, [1, 2, 3]);
        const turn = quarter === 1 ? "a quarter turn" : quarter === 2 ? "a half turn" : "three quarter turns";
        return { q: `You are facing ${dirs[from]}.\nYou make ${turn} clockwise. Which way are you facing now?`,
          a: dirs[(from + quarter) % 4],
          sol: [S(`Clockwise goes north → east → south → west`, "M1"),
                S(`${quarter} quarter turn(s) from ${dirs[from]} is ${dirs[(from + quarter) % 4]}`, "A1")] };
      }
      const right = ri(r, 1, 5), up = ri(r, 1, 5);
      if (d === 2)
        return { q: `A counter starts at (0, 0) and moves ${right} squares east and ${up} squares north.\nWhere does it finish?`,
          a: `(${right}, ${up})`,
          sol: [S(`East adds to x, north adds to y`, "M1"), S(`(${right}, ${up})`, "A1")] };
      // Keep the finish inside the first quadrant — Stage 1-4 grids have no
      // negative coordinates.
      const x = ri(r, 1, 6), y = up + ri(r, 1, 6);
      return { q: `A counter moves from (${x}, ${y}) to (${x + right}, ${y - up}).\nDescribe the move.`,
        a: `${right} square${right > 1 ? "s" : ""} east and ${up} square${up > 1 ? "s" : ""} south`,
        sol: [S(`x goes up by ${right}, so ${right} east`, "M1"),
              S(`y goes down by ${up}, so ${up} south`, "A1")] };
    }
  },
  productQuotientRule: {
    name: "Product and quotient rules", grades: [12],
    gen(r, d) {
      const a = ri(r, 2, 5), n = ri(r, 2, 4);
      if (d === 1 || d === 2)
        return { q: `Differentiate:  y = x${sup(n)}(${a}x + 1)`,
          a: `${(n + 1) * a}x${sup(n)} + ${n}x${sup(n - 1)}`,
          sol: [S(`Expand first: y = ${a}x${sup(n + 1)} + x${sup(n)}`, "M1"),
                S(`${frac("dy", "dx")} = ${(n + 1) * a}x${sup(n)} + ${n}x${sup(n - 1)}`, "A1")] };
      return { q: `Differentiate using the quotient rule:  y = ${frac(`x${sup(2)}`, `x + ${a}`)}`,
        a: frac(`x${sup(2)} + ${2 * a}x`, `(x + ${a})${sup(2)}`),
        sol: [S(`u = x², v = x + ${a};  u′ = 2x, v′ = 1`, "M1"),
              S(`${frac("vu′ − uv′", "v²")} = ${frac(`2x(x + ${a}) − x${sup(2)}`, `(x + ${a})${sup(2)}`)}`, "M1"),
              S(`= ${frac(`x${sup(2)} + ${2 * a}x`, `(x + ${a})${sup(2)}`)}`, "A1")] };
    }
  }
};

// Which generators are appropriate for each grade
const GRADE_GENS = {};
for (let g = 1; g <= 12; g++) GRADE_GENS[g] = [];
for (const [id, def] of Object.entries(GENERATORS))
  for (const g of def.grades) GRADE_GENS[g].push(id);

// ---------- Multiple-choice options ----------
// Distractors come from the same generator at the same difficulty, so a wrong
// option always has the same shape as the right one — the answer to a question
// the learner could plausibly have solved instead. Where a generator's answer
// space is too small to yield three distinct others, numeric near-misses
// (off by one, doubled, halved, sign flipped) fill the gaps.

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

// Shift the first number in an answer, keeping any words or units around it.
function nearMiss(answer, r) {
  const plain = String(answer);
  const m = plain.match(/(?:−|-)?\d+(?:\.\d+)?/);
  if (!m) return null;
  const v = parseFloat(m[0].replace("−", "-"));
  if (!isFinite(v)) return null;
  const dp = (m[0].split(".")[1] || "").length;
  const cands = [v + 1, v - 1, v + 2, v - 2, v * 2, -v];
  if (v !== 0 && Math.abs(v) % 2 === 0) cands.push(v / 2);
  if (Math.abs(v) >= 10) cands.push(v + 10, v - 10);
  const c = cands[Math.floor(r() * cands.length)];
  if (!isFinite(c) || c === v) return null;
  const shown = nf(dp ? c.toFixed(dp) : String(c));
  return plain.slice(0, m.index) + shown + plain.slice(m.index + m[0].length);
}

// A coarse signature of an answer's form. One generator can answer in several
// forms ("x = 3" at one difficulty, "log (x²y)" at another); an option of the
// wrong form gives the answer away, so matching forms are preferred.
const shapeOf = (s) => {
  const t = mathPlain(String(s));
  return (/=/.test(t) ? "e" : "") +
         (/[A-Za-z]/.test(t) ? "a" : "") +
         (/\d/.test(t) ? "n" : "");
};

// Returns { options, correct } or null when three distinct distractors are not
// available — the caller should then fall back to a written-answer question.
function makeOptions(topicId, diff, item, r, want) {
  const g = GENERATORS[topicId];
  if (!g) return null;
  const n = Math.min(want || 4, OPTION_LETTERS.length);
  const shape = shapeOf(item.a);
  const seen = new Set([item.a]);
  const same = [], other = [];

  // Same generator, same difficulty first; widen the difficulty if it runs dry.
  for (let i = 0; i < 40 && same.length < n - 1; i++) {
    const c = g.gen(r, i < 25 ? diff : (i % 3) + 1);
    if (!c || c.a === undefined || seen.has(c.a)) continue;
    seen.add(c.a);
    (shapeOf(c.a) === shape ? same : other).push(c.a);
  }
  for (let i = 0; i < 25 && same.length < n - 1; i++) {
    const p = nearMiss(item.a, r);
    if (p && !seen.has(p)) { seen.add(p); same.push(p); }
  }
  // Three same-shape options beat four where the odd one out is a giveaway.
  const wrong = (same.length >= 2 ? same : same.concat(other)).slice(0, n - 1);
  if (wrong.length < 2) return null;   // too few to make an honest question

  const options = [item.a, ...wrong];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { options, correct: options.indexOf(item.a) };
}
