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

// Print a complex number the way a paper does: no "1i", no "+ 0i", and a bare
// imaginary number when the real part is zero.
function cplx(re, im) {
  const imPart = im === 1 ? "i" : im === -1 ? "−i" : `${Math.abs(im)}i`;
  if (im === 0) return nf(re);
  if (re === 0) return (im < 0 ? "−" : "") + (Math.abs(im) === 1 ? "i" : `${Math.abs(im)}i`);
  return `${nf(re)} ${im < 0 ? "− " : "+ "}${Math.abs(im) === 1 ? "i" : `${Math.abs(im)}i`}`;
}

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
// Abramowitz & Stegun 7.1.26 — enough accuracy for a printed mark scheme.
function erfApprox(x) {
  const s = x < 0 ? -1 : 1;
  const z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
    - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return s * y;
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
      const ans = a * b - c * c + a;
      return { q: `Work out ${a} × ${b} − ${c}${sup(2)} + ${a}`, a: nf(ans),
        sol: [first, S(`${a} × ${b} = ${a * b},  ${c}${sup(2)} = ${c * c}`, "M1"),
              S(`${a * b} − ${c * c} + ${a} = ${nf(ans)}`, "A1")] };
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
      if (d === 1) {
        const m = ri(r, 1, 5) * (r() < 0.4 ? -1 : 1), c = ri(r, -6, 8);
        const line = `y = ${m === 1 ? "" : m === -1 ? "−" : nf(m)}x ${c >= 0 ? "+ " + c : "− " + -c}`;
        const cmp = S("Compare with y = mx + c: m is the gradient, c the y-intercept", "M1");
        if (r() < 0.5)
          return { q: `Write down the gradient of the line ${line}`, a: nf(m),
            sol: [cmp, S(`m = ${nf(m)}`, "A1")] };
        return { q: `Write down the y-intercept of the line ${line}`, a: `(0, ${nf(c)})`,
          sol: [cmp, S(`(0, ${nf(c)})`, "A1")] };
      }
      if (d === 2) {
        // Not in y = mx + c form yet — it has to be rearranged first.
        const k = ri(r, 2, 4), m = ri(r, 1, 5) * (r() < 0.5 ? -1 : 1), c = ri(r, -6, 8);
        const eq = `${k}y = ${poly([[k * m, 1], [k * c, 0]])}`;
        return { q: `Find the gradient and the y-intercept of the line\n${eq}`,
          a: `gradient ${nf(m)}, y-intercept (0, ${nf(c)})`,
          sol: [S(`Divide through by ${k}:  y = ${poly([[m, 1], [c, 0]])}`, "M1"),
                S(`gradient = ${nf(m)}, y-intercept = (0, ${nf(c)})`, "A1")] };
      }
      // Perpendicular through a point — two ideas combined.
      const m = pick(r, [2, 3, 4, 5]), x1 = ri(r, 1, 6), y1 = ri(r, 1, 8);
      const perp = frac(nf(-1), m);
      const cNum = m * y1 + x1;
      return { q: `A line is perpendicular to y = ${m}x + ${ri(r, 1, 9)} and passes through (${x1}, ${y1}).\nFind its equation in the form y = mx + c.`,
        a: `y = ${perp}x + ${cNum % m === 0 ? cNum / m : frac(cNum, m)}`,
        sol: [S(`Perpendicular gradient = −1 ÷ ${m} = ${perp}`, "M1"),
              S(`${y1} = ${perp}(${x1}) + c`, "M1"),
              S(`c = ${cNum % m === 0 ? cNum / m : frac(cNum, m)}, so y = ${perp}x + ${cNum % m === 0 ? cNum / m : frac(cNum, m)}`, "A1")] };
    }
  },
  pythagoras: {
    name: "Pythagoras' theorem", grades: [8, 9, 10],
    gen(r, d) {
      const t = pick(r, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25],
                         [6, 8, 10], [9, 12, 15], [20, 21, 29], [9, 40, 41], [12, 35, 37]]);
      const k = d === 1 ? 1 : ri(r, 1, 3);
      const [a, b, c] = t.map((v) => v * k);
      if (d === 1)
        return { q: `A right-angled triangle has shorter sides ${a} cm and ${b} cm.\nFind the hypotenuse.`,
          a: `${c} cm`,
          sol: [S(`c² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}`, "M1"),
                S(`c = ${rad(c * c)} = ${c} cm`, "A1")] };
      if (d === 2)
        return { q: `A right-angled triangle has hypotenuse ${c} cm and one shorter side ${a} cm.\nFind the other side.`,
          a: `${b} cm`,
          sol: [S(`b² = ${c}² − ${a}² = ${c * c} − ${a * a} = ${b * b}`, "M1"),
                S(`b = ${rad(b * b)} = ${b} cm`, "A1")] };
      // No exact triple: the answer is a decimal, and the shape has to be
      // turned into a right-angled triangle first.
      const w = ri(r, 4, 14), h = ri(r, 4, 14);
      const diag = +Math.sqrt(w * w + h * h).toFixed(2);
      return { q: `A rectangle measures ${w} cm by ${h} cm.\nFind the length of a diagonal, correct to 2 decimal places.`,
        a: `${diag} cm`,
        sol: [S(`The diagonal is the hypotenuse of a right-angled triangle with sides ${w} and ${h}`, "M1"),
              S(`d² = ${w}² + ${h}² = ${w * w + h * h}`, "M1"),
              S(`d = ${rad(w * w + h * h)} = ${diag} cm`, "A1")] };
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
      if (d === 1) {
        // Monic, both roots positive — factorises straight away.
        const p = ri(r, 1, 6), q = ri(r, 1, 6);
        const expr = poly([[1, 2], [-(p + q), 1], [p * q, 0]]);
        return { q: `Solve:  ${expr} = 0`, a: p === q ? `x = ${p}` : `x = ${p} or x = ${q}`,
          sol: [S(`Two numbers with sum ${p + q} and product ${p * q}: ${p} and ${q}`, "M1"),
                S(`(x − ${p})(x − ${q}) = 0`, "M1"),
                S(p === q ? `x = ${p}` : `x = ${p} or x = ${q}`, "A1")] };
      }
      if (d === 2) {
        // Monic but with a negative root, so the signs have to be reasoned out.
        const p = ri(r, 1, 7), q = -ri(r, 1, 7);
        const expr = poly([[1, 2], [-(p + q), 1], [p * q, 0]]);
        return { q: `Solve:  ${expr} = 0`, a: `x = ${p} or x = ${nf(q)}`,
          sol: [S(`Two numbers with sum ${nf(p + q)} and product ${nf(p * q)}: ${p} and ${nf(q)}`, "M1"),
                S(`(x − ${p})(x ${q < 0 ? "+ " + -q : "− " + q}) = 0`, "M1"),
                S(`x = ${p} or x = ${nf(q)}`, "A1")] };
      }
      // A leading coefficient, so the factorisation is no longer by inspection.
      const a = ri(r, 2, 4), p = ri(r, 1, 5), q = ri(r, 1, 5) * (r() < 0.5 ? -1 : 1);
      // (ax − p)(x − q) = ax² − (aq + p)x + pq
      const expr = poly([[a, 2], [-(a * q + p), 1], [p * q, 0]]);
      const root1 = p % a === 0 ? String(p / a) : frac(p, a);
      return { q: `Solve:  ${expr} = 0`, a: `x = ${root1} or x = ${nf(q)}`,
        sol: [S(`Split the middle term: two numbers with product ${nf(a * p * q)} and sum ${nf(-(a * q + p))}`, "M1"),
              S(`(${a}x − ${p})(x ${q < 0 ? "+ " + -q : "− " + q}) = 0`, "M1"),
              S(`x = ${root1} or x = ${nf(q)}`, "A1")] };
    }
  },
  trigRightAngle: {
    name: "Right-angled trigonometry", grades: [9, 10],
    gen(r, d) {
      const round2 = (v) => +v.toFixed(2);
      if (d === 1) {
        // Given an angle and the adjacent side, find the opposite side.
        const ang = pick(r, [20, 25, 30, 35, 40, 45, 50, 55, 60]);
        const adj = ri(r, 4, 15);
        const opp = round2(adj * Math.tan((ang * Math.PI) / 180));
        return { q: `In a right-angled triangle the angle is ${ang}° and the adjacent side is ${adj} cm.\nFind the opposite side, correct to 2 decimal places.`,
          a: `${opp} cm`,
          sol: [S(`tan ${ang}° = ${frac("opposite", `${adj}`)}`, "M1"),
                S(`opposite = ${adj} tan ${ang}° = ${opp} cm`, "A1")] };
      }
      if (d === 2) {
        // Two sides given, the angle is wanted — inverse trigonometry.
        const t = pick(r, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]);
        const ang = round2((Math.atan(t[0] / t[1]) * 180) / Math.PI);
        return { q: `A right-angled triangle has an opposite side of ${t[0]} cm and an adjacent side of ${t[1]} cm.\nFind the angle, correct to 2 decimal places.`,
          a: `${ang}°`,
          sol: [S(`tan θ = ${frac(t[0], t[1])}`, "M1"),
                S(`θ = tan⁻¹(${frac(t[0], t[1])}) = ${ang}°`, "A1")] };
      }
      // Angle of elevation: a two-step problem set in context.
      const ang = pick(r, [25, 30, 35, 40, 50, 55, 60]);
      const dist = ri(r, 10, 40);
      const eye = ri(r, 1, 2);
      const height = round2(dist * Math.tan((ang * Math.PI) / 180) + eye);
      return { q: `From a point ${dist} m from the foot of a tower, the angle of elevation of the top is ${ang}°.\nThe observer's eye is ${eye} m above the ground.\nFind the height of the tower, correct to 2 decimal places.`,
        a: `${height} m`,
        sol: [S(`tan ${ang}° = ${frac("h", `${dist}`)}, where h is the height above eye level`, "M1"),
              S(`h = ${dist} tan ${ang}° = ${round2(dist * Math.tan((ang * Math.PI) / 180))} m`, "M1"),
              S(`Height of tower = ${round2(dist * Math.tan((ang * Math.PI) / 180))} + ${eye} = ${height} m`, "A1")] };
    }
  },
  indices: {
    name: "Laws of indices", grades: [8, 9, 10],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 2, 6), b = ri(r, 2, 6);
        return { q: `Simplify:  x${sup(a)} × x${sup(b)}`, a: `x${sup(a + b)}`,
          sol: [S("When multiplying, add the indices", "M1"), S(`${a} + ${b} = ${a + b}, so x${sup(a + b)}`, "A1")] };
      }
      if (d === 2) {
        // Coefficients as well as indices, and a division.
        const k = ri(r, 2, 6), m = ri(r, 2, 5), a = ri(r, 4, 9), b = ri(r, 1, 3);
        return { q: `Simplify:  ${frac(`${k * m}x${sup(a)}`, `${m}x${sup(b)}`)}`,
          a: `${k}x${sup(a - b)}`,
          sol: [S(`Numbers: ${k * m} ÷ ${m} = ${k}`, "M1"),
                S(`Indices: ${a} − ${b} = ${a - b}, so ${k}x${sup(a - b)}`, "A1")] };
      }
      // Negative and fractional indices, evaluated to a number.
      const base = pick(r, [4, 8, 9, 16, 25, 27, 32, 64]);
      const roots = { 4: 2, 9: 3, 25: 5, 16: 2, 8: 2, 27: 3, 32: 2, 64: 4 };
      const isCube = base === 8 || base === 27 || base === 64;
      const den = base === 32 ? 5 : isCube ? 3 : 2;
      const root = Math.round(Math.pow(base, 1 / den));
      // num must not equal den, or the index reduces to 1 and the question
      // stops being about fractional indices at all.
      let num = ri(r, 2, 3);
      if (num === den) num = den + 1;
      const neg = r() < 0.5;
      const val = Math.pow(root, num);
      const expo = `${neg ? "⁻" : ""}${sup(num)}⁄${sup(den)}`;
      return { q: `Evaluate:  ${base}${expo}`,
        a: neg ? frac(1, val) : String(val),
        sol: [S(`The denominator ${den} means the ${den === 2 ? "square" : den === 3 ? "cube" : den + "th"} root: ${rad(base)} = ${root}`, "M1"),
              S(`Raise to the power ${num}: ${root}${sup(num)} = ${val}`, "M1"),
              S(neg ? `A negative index means the reciprocal: ${frac(1, val)}` : `= ${val}`, "A1")] };
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
      const n = d === 1 ? 6 : 8, mean = ri(r, 8, 20) * 5;
      // Deviations in ± pairs so the mean is a whole number and marks stay positive.
      const devs = [];
      for (let i = 0; i < Math.floor(n / 2); i++) { const v = ri(r, 1, 4); devs.push(v, -v); }
      if (n % 2) devs.push(0);
      for (let i = devs.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [devs[i], devs[j]] = [devs[j], devs[i]];
      }
      const vals = devs.map((v) => mean + v);
      const sumsq = devs.reduce((t, v) => t + v * v, 0);
      const sd = Math.sqrt(sumsq / n);
      const sumx = vals.reduce((t, v) => t + v, 0);

      if (d === 1)
        return { q: `The ${n} values below are the marks of a group of students.\n${vals.join(", ")}\nFind the mean and the standard deviation, giving the standard deviation correct to 2 decimal places.`,
          a: `x̄ = ${mean},  σ = ${sd.toFixed(2)}`,
          sol: [S(`Σx = ${sumx}, so x̄ = ${frac(sumx, n)} = ${mean}`, "M1"),
                S(`Σ(x − x̄)² = ${sumsq}`, "M1"),
                S(`σ = ${rad(frac(sumsq, n))} = ${sd.toFixed(2)}`, "A1")] };

      if (d === 2) {
        // Summary statistics only — the raw data is not given.
        const sumx2 = vals.reduce((t, v) => t + v * v, 0);
        return { q: `For ${n} values, Σx = ${sumx} and Σx${sup(2)} = ${sumx2}.\nFind the mean and the standard deviation, correct to 2 decimal places.`,
          a: `x̄ = ${mean},  σ = ${sd.toFixed(2)}`,
          sol: [S(`x̄ = ${frac("Σx", "n")} = ${frac(sumx, n)} = ${mean}`, "M1"),
                S(`σ² = ${frac("Σx²", "n")} − x̄² = ${frac(sumx2, n)} − ${mean}${sup(2)}`, "M1"),
                S(`σ = ${sd.toFixed(2)}`, "A1")] };
      }
      // Grouped data: midpoints have to be found first.
      const w = 10, start = ri(r, 1, 4) * 10;
      const fs = [ri(r, 2, 6), ri(r, 5, 12), ri(r, 5, 12), ri(r, 2, 6)];
      const mids = [0, 1, 2, 3].map((i) => start + w * i + w / 2);
      const N = fs.reduce((t, f) => t + f, 0);
      const sfx = fs.reduce((t, f, i) => t + f * mids[i], 0);
      const sfx2 = fs.reduce((t, f, i) => t + f * mids[i] * mids[i], 0);
      const m = sfx / N;
      const sg = Math.sqrt(sfx2 / N - m * m);
      const rows = fs.map((f, i) => `${start + w * i}–${start + w * (i + 1) - 1}: ${f}`).join("\n");
      return { q: `The table shows the marks of ${N} students.\n${rows}\nUsing the mid-interval values, find an estimate of the mean and the standard deviation, correct to 2 decimal places.`,
        a: `x̄ ≈ ${m.toFixed(2)},  σ ≈ ${sg.toFixed(2)}`,
        sol: [S(`Mid-interval values: ${mids.join(", ")}`, "M1"),
              S(`Σfx = ${sfx},  Σfx² = ${sfx2},  n = ${N}`, "M1"),
              S(`x̄ = ${frac(sfx, N)} = ${m.toFixed(2)}`, "M1"),
              S(`σ = ${rad(`${frac(sfx2, N)} − x̄²`)} = ${sg.toFixed(2)}`, "A1")] };
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
      if (d === 1) {
        const a = ri(r, 2, 6), b = ri(r, 2, 9), c = ri(r, 1, 9);
        return { q: `Differentiate:  y = ${poly([[a, 2], [b, 1], [c, 0]])}`,
          a: `${frac("dy", "dx")} = ${poly([[2 * a, 1], [b, 0]])}`,
          sol: [S(`Multiply by the power and reduce the power by 1`, "M1"),
                S(`${frac("dy", "dx")} = ${poly([[2 * a, 1], [b, 0]])}`, "A1")] };
      }
      if (d === 2) {
        // A cubic, and the gradient is wanted at a particular point.
        const a = ri(r, 1, 4), b = ri(r, 2, 6), c = ri(r, 2, 9), x = ri(r, 1, 4);
        const dy = poly([[3 * a, 2], [2 * b, 1], [c, 0]]);
        const val = 3 * a * x * x + 2 * b * x + c;
        return { q: `y = ${poly([[a, 3], [b, 2], [c, 1], [ri(r, 1, 9), 0]])}\nFind the gradient of the curve when x = ${x}.`,
          a: String(val),
          sol: [S(`${frac("dy", "dx")} = ${dy}`, "M1"),
                S(`At x = ${x}:  3(${a})(${x})${sup(2)} + 2(${b})(${x}) + ${c}`, "M1"),
                S(`= ${val}`, "A1")] };
      }
      // Stationary points: differentiate, set to zero, solve — and classify.
      const p = ri(r, 1, 4), q = p + ri(r, 1, 4);
      // y = x³ − (3/2)(p+q)x² + 3pq x has dy/dx = 3(x − p)(x − q); scale by 2
      const dy = `3(x − ${p})(x − ${q})`;
      const expr = poly([[2, 3], [-3 * (p + q), 2], [6 * p * q, 1], [ri(r, 1, 9), 0]]);
      return { q: `Find the x-coordinates of the stationary points of\ny = ${expr}\nand determine the nature of each.`,
        a: `x = ${p} (maximum), x = ${q} (minimum)`,
        sol: [S(`${frac("dy", "dx")} = ${poly([[6, 2], [-6 * (p + q), 1], [6 * p * q, 0]])} = 6(x − ${p})(x − ${q})`, "M1"),
              S(`${frac("dy", "dx")} = 0 when x = ${p} or x = ${q}`, "M1"),
              S(`${frac("d²y", "dx²")} = ${poly([[12, 1], [-6 * (p + q), 0]])};  at x = ${p} it is negative (maximum), at x = ${q} positive (minimum)`, "A1")] };
    }
  },
  integration: {
    name: "Integration", grades: [11, 12],
    gen(r, d) {
      if (d === 1) {
        const n = ri(r, 1, 3), a = (n + 1) * ri(r, 1, 4), c = ri(r, 1, 9);
        return { q: `Find:  ∫ (${poly([[a, n], [c, 0]])}) dx`,
          a: `${poly([[a / (n + 1), n + 1], [c, 1]])} + c`,
          sol: [S(`Raise the power by 1 and divide by the new power`, "M1"),
                S(`${poly([[a / (n + 1), n + 1], [c, 1]])} + c`, "A1")] };
      }
      if (d === 2) {
        // A definite integral — the constant drops out and limits are used.
        const a = 3 * ri(r, 1, 3), lo = ri(r, 0, 2), hi = lo + ri(r, 1, 3);
        const F = (x) => (a / 3) * x * x * x;
        return { q: `Evaluate:  ∫ from ${lo} to ${hi} of ${a}x${sup(2)} dx`,
          a: String(F(hi) - F(lo)),
          sol: [S(`∫ ${a}x${sup(2)} dx = ${a / 3}x${sup(3)}`, "M1"),
                S(`[${a / 3}x${sup(3)}] from ${lo} to ${hi} = ${F(hi)} − ${F(lo)}`, "M1"),
                S(`= ${F(hi) - F(lo)}`, "A1")] };
      }
      // Area between a curve and a line — set up the integral as well as do it.
      const k = ri(r, 2, 5);
      // y = kx − x² meets y = 0 at x = 0 and x = k; area = k³/6
      const num = k * k * k, area = num % 6 === 0 ? String(num / 6) : frac(num, 6);
      return { q: `The curve y = ${k}x − x${sup(2)} meets the x-axis at x = 0 and x = ${k}.\nFind the exact area enclosed between the curve and the x-axis.`,
        a: area,
        sol: [S(`Area = ∫ from 0 to ${k} of (${k}x − x${sup(2)}) dx`, "M1"),
              S(`= [${frac(k, 2)}x${sup(2)} − ${frac(1, 3)}x${sup(3)}] from 0 to ${k}`, "M1"),
              S(`= ${frac(k * k * k, 2)} − ${frac(k * k * k, 3)} = ${area}`, "A1")] };
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
        q: `Trace the number ${n}.`,
        a: `Correct formation of ${n}`,
        // Tracing only: a model to look at, then dotted numerals to trace over.
        trace: { char: String(n), guides: 5, blanks: 0, word: numberWords(n) },
        sol: [S(`Start where the dotted line starts and follow it to form ${n}`, "B1")]
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
      // d1 monic; d2 a real leading coefficient; d3 a negative one, and the
      // turning point has to be identified as a maximum rather than a minimum.
      if (d === 1) {
        const p = ri(r, 1, 8) * (r() < 0.5 ? -1 : 1), q = ri(r, -9, 9);
        const expr = poly([[1, 2], [-2 * p, 1], [p * p + q, 0]]);
        return { q: `Write ${expr} in the form (x + a)${sup(2)} + b`,
          a: `(x ${p < 0 ? "+ " + -p : "− " + p})${sup(2)} ${q < 0 ? "− " + -q : "+ " + q}`,
          sol: [S(`Half of ${nf(-2 * p)} is ${nf(-p)}`, "M1"),
                S(`(x ${p < 0 ? "+ " + -p : "− " + p})${sup(2)} ${q < 0 ? "− " + -q : "+ " + q}`, "A1")] };
      }
      const a = d === 2 ? ri(r, 2, 5) : pick(r, [-4, -3, -2, 2, 3, 5]);
      const p = ri(r, 1, 6) * (r() < 0.5 ? -1 : 1), q = ri(r, -12, 12);
      // a(x + p)² + q  expands to  ax² + 2apx + (ap² + q)
      const expr = poly([[a, 2], [2 * a * p, 1], [a * p * p + q, 0]]);
      const sq = `${a === 1 ? "" : a === -1 ? "−" : nf(a)}(x ${p < 0 ? "− " + -p : "+ " + p})${sup(2)} ` +
                 `${q < 0 ? "− " + -q : "+ " + q}`;
      if (d === 2)
        return { q: `Write ${expr} in the form a(x + p)${sup(2)} + q`, a: sq,
          sol: [S(`Take out the factor ${nf(a)}:  ${nf(a)}[x${sup(2)} ${2 * p < 0 ? "− " + -2 * p : "+ " + 2 * p}x] ${a * p * p + q < 0 ? "− " + -(a * p * p + q) : "+ " + (a * p * p + q)}`, "M1"),
                S(`Half of ${nf(2 * p)} is ${nf(p)}, so the bracket is (x ${p < 0 ? "− " + -p : "+ " + p})${sup(2)} − ${p * p}`, "M1"),
                S(sq, "A1")] };
      const kind = a > 0 ? "minimum" : "maximum";
      return { q: `By completing the square, find the turning point of y = ${expr}\nand state whether it is a maximum or a minimum.`,
        a: `(${nf(-p)}, ${nf(q)}), a ${kind}`,
        sol: [S(`${expr} = ${sq}`, "M1"),
              S(`The square is zero when x = ${nf(-p)}, giving y = ${nf(q)}`, "M1"),
              S(`Turning point (${nf(-p)}, ${nf(q)}); a is ${a > 0 ? "positive" : "negative"}, so it is a ${kind}`, "A1")] };
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
  },

  // ---------- Patterns, shape and measure ----------

  shapePatterns: {
    name: "Patterns and pictures", grades: [1, 2, 3, 7],
    gen(r, d) {
      if (d === 1) {
        const shapes = pick(r, [["●", "▲"], ["■", "★"], ["●", "■"], ["▲", "★"]]);
        const seq = [];
        for (let i = 0; i < 7; i++) seq.push(shapes[i % 2]);
        return { q: `Look at the pattern.\n${seq.join("  ")}  ___\nDraw the shape that comes next.`,
          a: shapes[7 % 2],
          sol: [S("The pattern repeats every 2 shapes", "M1"), S(`So the next shape is ${shapes[1]}`, "A1")] };
      }
      if (d === 2) {
        const start = ri(r, 2, 9), step = ri(r, 2, 6);
        const seq = [start, start + step, start + 2 * step, start + 3 * step];
        return { q: `${seq.join(", ")}, ___, ___\nWrite the next two numbers and say what the rule is.`,
          a: `${start + 4 * step}, ${start + 5 * step} — add ${step} each time`,
          sol: [S(`${seq[1]} − ${seq[0]} = ${step}, so the rule is add ${step}`, "M1"),
                S(`${seq[3]} + ${step} = ${start + 4 * step}, then ${start + 5 * step}`, "A1")] };
      }
      // A growing pattern of squares: pattern n uses a·n + b tiles.
      const a = ri(r, 2, 4), b = ri(r, 1, 4), n = ri(r, 8, 20);
      const first = [1, 2, 3, 4].map((k) => a * k + b);
      return { q: `A pattern is made from square tiles.\nPattern 1 uses ${first[0]} tiles, pattern 2 uses ${first[1]},\npattern 3 uses ${first[2]} and pattern 4 uses ${first[3]}.\nHow many tiles does pattern ${n} use?`,
        a: `${a * n + b} tiles`,
        sol: [S(`Each new pattern adds ${a} tiles`, "M1"),
              S(`Tiles = ${a} × pattern number + ${b}`, "M1"),
              S(`${a} × ${n} + ${b} = ${a * n + b}`, "A1")] };
    }
  },

  compoundArea: {
    name: "Compound and irregular shapes", grades: [4, 5, 6, 7],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 3, 9), b = ri(r, 2, 6), c = ri(r, 2, 7), e = ri(r, 2, 6);
        return { q: `An L-shape is made from two rectangles.\nRectangle A is ${a} cm by ${b} cm.\nRectangle B is ${c} cm by ${e} cm.\nWork out the total area of the L-shape.`,
          a: `${a * b + c * e} cm${sup(2)}`,
          sol: [S(`Rectangle A: ${a} × ${b} = ${a * b} cm${sup(2)}`, "M1"),
                S(`Rectangle B: ${c} × ${e} = ${c * e} cm${sup(2)}`, "M1"),
                S(`${a * b} + ${c * e} = ${a * b + c * e} cm${sup(2)}`, "A1")] };
      }
      if (d === 2) {
        // L-shape cut from a W × H rectangle: perimeter is the same as the rectangle's.
        const W = ri(r, 8, 15), H = ri(r, 6, 12), w = ri(r, 2, W - 4), h = ri(r, 2, H - 3);
        return { q: `An L-shaped garden is a rectangle ${W} m by ${H} m\nwith a rectangle ${w} m by ${h} m cut out of one corner.\nWork out the perimeter of the garden.`,
          a: `${2 * (W + H)} m`,
          sol: [S(`The two cut edges (${w} m and ${h} m) replace the two they hide`, "M1"),
                S(`So the perimeter is the same as the whole rectangle`, "M1"),
                S(`2 × (${W} + ${H}) = ${2 * (W + H)} m`, "A1")] };
      }
      const W = ri(r, 10, 18), H = ri(r, 8, 14);
      // Four corners must still leave a sheet behind, so keep them small.
      const s = ri(r, 2, Math.max(2, Math.floor(Math.min(W, H) / 4)));
      return { q: `A rectangular sheet of card measures ${W} cm by ${H} cm.\nA square of side ${s} cm is cut from each of the four corners.\nWork out the area of card that is left.`,
        a: `${W * H - 4 * s * s} cm${sup(2)}`,
        sol: [S(`Whole sheet: ${W} × ${H} = ${W * H} cm${sup(2)}`, "M1"),
              S(`Four corners: 4 × ${s}${sup(2)} = ${4 * s * s} cm${sup(2)}`, "M1"),
              S(`${W * H} − ${4 * s * s} = ${W * H - 4 * s * s} cm${sup(2)}`, "A1")] };
    }
  },

  netsOfSolids: {
    name: "3D shapes and nets", grades: [4, 5, 6, 7],
    gen(r, d) {
      const SOLIDS = [
        { n: "cube", f: 6, e: 12, v: 8, net: "six squares" },
        { n: "cuboid", f: 6, e: 12, v: 8, net: "six rectangles in three matching pairs" },
        { n: "square-based pyramid", f: 5, e: 8, v: 5, net: "one square and four triangles" },
        { n: "triangular prism", f: 5, e: 9, v: 6, net: "two triangles and three rectangles" },
        { n: "tetrahedron", f: 4, e: 6, v: 4, net: "four triangles" }
      ];
      const s = pick(r, SOLIDS);
      if (d === 1) {
        const what = pick(r, ["faces", "edges", "vertices"]);
        const val = what === "faces" ? s.f : what === "edges" ? s.e : s.v;
        return { q: `How many ${what} does a ${s.n} have?`, a: String(val),
          sol: [S(`Count the ${what} of a ${s.n}`, "M1"), S(String(val), "A1")] };
      }
      if (d === 2)
        return { q: `A net is made from ${s.net}.\nWhich solid does the net fold up to make?`, a: s.n,
          sol: [S(`${s.net} — that is the net of a ${s.n}`, "M1"), S(s.n, "A1")] };
      const a = ri(r, 3, 8), b = ri(r, 2, 7), c = ri(r, 2, 6);
      return { q: `The net of a cuboid is made from six rectangles:\ntwo ${a} cm by ${b} cm, two ${a} cm by ${c} cm and two ${b} cm by ${c} cm.\nWork out the total area of the net.`,
        a: `${2 * (a * b + a * c + b * c)} cm${sup(2)}`,
        sol: [S(`2 × ${a} × ${b} = ${2 * a * b} cm${sup(2)}`, "M1"),
              S(`2 × ${a} × ${c} = ${2 * a * c} cm${sup(2)} and 2 × ${b} × ${c} = ${2 * b * c} cm${sup(2)}`, "M1"),
              S(`Total ${2 * (a * b + a * c + b * c)} cm${sup(2)}`, "A1")] };
    }
  },

  rotationalSymmetry: {
    name: "Rotational symmetry and symmetry in 3D", grades: [4, 5, 6, 7, 8],
    gen(r, d) {
      if (d === 1) {
        const SH = [["square", 4], ["equilateral triangle", 3], ["regular pentagon", 5],
          ["regular hexagon", 6], ["rectangle", 2], ["regular octagon", 8]];
        const s = pick(r, SH);
        return { q: `What is the order of rotational symmetry of a ${s[0]}?`, a: String(s[1]),
          sol: [S(`A ${s[0]} looks the same ${s[1]} times in a full turn`, "M1"), S(String(s[1]), "A1")] };
      }
      if (d === 2) {
        const n = ri(r, 5, 12);
        return { q: `A regular polygon has ${n} sides.\nWrite down its order of rotational symmetry and its number of lines of symmetry.`,
          a: `Order ${n}, ${n} lines of symmetry`,
          sol: [S(`A regular ${n}-sided polygon has ${n} equal sides and angles`, "M1"),
                S(`Order of rotational symmetry ${n}; ${n} lines of symmetry`, "A1")] };
      }
      const SOL = [["cube", 9], ["cuboid with all edges different", 3], ["square-based pyramid", 4],
        ["triangular prism with an equilateral cross-section", 4], ["cylinder", "infinitely many"]];
      const s = pick(r, SOL);
      return { q: `How many planes of symmetry does a ${s[0]} have?`, a: String(s[1]),
        sol: [S(`A plane of symmetry cuts the solid into two mirror halves`, "M1"),
              S(`A ${s[0]} has ${s[1]}`, "A1")] };
    }
  },

  reflectionCoords: {
    name: "Reflections on a coordinate grid", grades: [6, 7, 8, 10],
    gen(r, d) {
      const x = ri(r, 1, 6) * (r() < 0.5 ? -1 : 1), y = ri(r, 1, 6) * (r() < 0.5 ? -1 : 1);
      if (d === 1) {
        const ax = pick(r, ["x-axis", "y-axis"]);
        const im = ax === "x-axis" ? [x, -y] : [-x, y];
        return { q: `The point P has coordinates (${nf(x)}, ${nf(y)}).\nP is reflected in the ${ax}. Write down the coordinates of the image.`,
          a: `(${nf(im[0])}, ${nf(im[1])})`,
          sol: [S(`Reflecting in the ${ax} changes the sign of the ${ax === "x-axis" ? "y" : "x"}-coordinate`, "M1"),
                S(`(${nf(im[0])}, ${nf(im[1])})`, "A1")] };
      }
      if (d === 2) {
        const k = ri(r, 1, 5), vertical = r() < 0.5;
        const im = vertical ? [2 * k - x, y] : [x, 2 * k - y];
        return { q: `The point A(${nf(x)}, ${nf(y)}) is reflected in the line ${vertical ? "x" : "y"} = ${k}.\nFind the coordinates of the image of A.`,
          a: `(${nf(im[0])}, ${nf(im[1])})`,
          sol: [S(`A is ${Math.abs((vertical ? x : y) - k)} from the mirror line`, "M1"),
                S(`The image is the same distance on the other side`, "M1"),
                S(`(${nf(im[0])}, ${nf(im[1])})`, "A1")] };
      }
      return { q: `The point B(${nf(x)}, ${nf(y)}) is reflected in the line y = x,\nand the image is then reflected in the x-axis.\nFind the coordinates of the final image, and describe the single\ntransformation that has the same effect.`,
        a: `(${nf(y)}, ${nf(-x)}) — a rotation of 90° clockwise about the origin`,
        sol: [S(`Reflection in y = x swaps the coordinates: (${nf(y)}, ${nf(x)})`, "M1"),
              S(`Reflection in the x-axis: (${nf(y)}, ${nf(-x)})`, "A1"),
              S(`Two reflections in lines through O give a rotation about O — here 90° clockwise`, "B1")] };
    }
  },

  rotationCoords: {
    name: "Rotation about a point", grades: [6, 7, 8, 10],
    gen(r, d) {
      const x = ri(r, 1, 6) * (r() < 0.5 ? -1 : 1), y = ri(r, 1, 6) * (r() < 0.5 ? -1 : 1);
      if (d === 1)
        return { q: `The point P(${nf(x)}, ${nf(y)}) is rotated 180° about the origin.\nWrite down the coordinates of the image.`,
          a: `(${nf(-x)}, ${nf(-y)})`,
          sol: [S(`A half turn about O sends (x, y) to (−x, −y)`, "M1"),
                S(`(${nf(-x)}, ${nf(-y)})`, "A1")] };
      if (d === 2) {
        const cw = r() < 0.5;
        const im = cw ? [y, -x] : [-y, x];
        return { q: `The point A(${nf(x)}, ${nf(y)}) is rotated 90° ${cw ? "clockwise" : "anticlockwise"}\nabout the origin. Find the coordinates of the image.`,
          a: `(${nf(im[0])}, ${nf(im[1])})`,
          sol: [S(`90° ${cw ? "clockwise" : "anticlockwise"} about O sends (x, y) to (${cw ? "y, −x" : "−y, x"})`, "M1"),
                S(`(${nf(im[0])}, ${nf(im[1])})`, "A1")] };
      }
      const cx = ri(r, 1, 4), cy = ri(r, 1, 4);
      const im = [cx + (y - cy), cy - (x - cx)];   // 90° clockwise about (cx, cy)
      return { q: `The point A(${nf(x)}, ${nf(y)}) is rotated 90° clockwise about the point (${cx}, ${cy}).\nFind the coordinates of the image of A.`,
        a: `(${nf(im[0])}, ${nf(im[1])})`,
        sol: [S(`Move the centre to O: A becomes (${nf(x - cx)}, ${nf(y - cy)})`, "M1"),
              S(`Rotate 90° clockwise: (${nf(y - cy)}, ${nf(-(x - cx))})`, "M1"),
              S(`Move back: (${nf(im[0])}, ${nf(im[1])})`, "A1")] };
    }
  },

  enlargement: {
    name: "Enlargement and scale factor", grades: [7, 8, 9, 10],
    gen(r, d) {
      if (d === 1) {
        const k = ri(r, 2, 5), a = ri(r, 2, 9), b = ri(r, 2, 9);
        return { q: `A rectangle measures ${a} cm by ${b} cm.\nIt is enlarged by scale factor ${k}.\nWrite down the measurements of the enlarged rectangle.`,
          a: `${a * k} cm by ${b * k} cm`,
          sol: [S(`Multiply every length by ${k}`, "M1"),
                S(`${a} × ${k} = ${a * k} cm and ${b} × ${k} = ${b * k} cm`, "A1")] };
      }
      if (d === 2) {
        const k = ri(r, 2, 4), x = ri(r, 1, 5), y = ri(r, 1, 5);
        return { q: `The point P(${x}, ${y}) is mapped to P′ by an enlargement,\ncentre the origin, scale factor ${k}.\nFind the coordinates of P′, and the scale factor that maps P′ back to P.`,
          a: `P′(${x * k}, ${y * k}); scale factor ${frac(1, k)}`,
          sol: [S(`Enlargement centre O multiplies both coordinates by ${k}`, "M1"),
                S(`P′(${x * k}, ${y * k})`, "A1"),
                S(`The inverse enlargement has scale factor ${frac(1, k)}`, "B1")] };
      }
      const k = ri(r, 2, 5), A = ri(r, 3, 12) * 2;
      return { q: `Shape B is an enlargement of shape A with scale factor ${k}.\nThe area of shape A is ${A} cm${sup(2)}.\nFind the area of shape B, and explain why the area factor is not ${k}.`,
        a: `${A * k * k} cm${sup(2)} — the area factor is ${k}${sup(2)} = ${k * k}`,
        sol: [S(`Every length is multiplied by ${k}, so the area is multiplied by ${k}${sup(2)}`, "M1"),
              S(`${A} × ${k * k} = ${A * k * k} cm${sup(2)}`, "A1"),
              S(`Area involves two lengths, so the factor is squared`, "B1")] };
    }
  },

  scaleDrawing: {
    name: "Scale drawings", grades: [6, 7, 8, 9],
    gen(r, d) {
      if (d === 1) {
        const s = pick(r, [100, 200, 500, 1000]), cm = ri(r, 2, 12);
        const m = (cm * s) / 100;
        return { q: `A plan is drawn to a scale of 1 : ${s}.\nA wall is ${cm} cm long on the plan.\nHow long is the wall in real life? Give your answer in metres.`,
          a: `${m} m`,
          sol: [S(`Real length = ${cm} × ${s} = ${cm * s} cm`, "M1"),
                S(`${cm * s} ÷ 100 = ${m} m`, "A1")] };
      }
      if (d === 2) {
        const s = pick(r, [50, 100, 200, 250]), m = ri(r, 2, 20);
        const cm = (m * 100) / s;
        return { q: `A map has a scale of 1 : ${s}.\nA path is ${m} m long in real life.\nHow long is the path on the map, in centimetres?`,
          a: `${cm} cm`,
          sol: [S(`${m} m = ${m * 100} cm`, "M1"),
                S(`${m * 100} ÷ ${s} = ${cm} cm`, "A1")] };
      }
      const km = ri(r, 2, 9), cm = ri(r, 2, 8);
      const s = (km * 100000) / cm;
      return { q: `Two towns are ${km} km apart. On a map they are ${cm} cm apart.\nWrite the scale of the map in the form 1 : n.`,
        a: `1 : ${s}`,
        sol: [S(`${km} km = ${km * 100000} cm`, "M1"),
              S(`${km * 100000} ÷ ${cm} = ${s}`, "M1"),
              S(`Scale 1 : ${s}`, "A1")] };
    }
  },

  bearings: {
    name: "Bearings", grades: [8, 9, 10],
    gen(r, d) {
      if (d === 1) {
        const DIRS = [["north", "000°"], ["north-east", "045°"], ["east", "090°"],
          ["south-east", "135°"], ["south", "180°"], ["south-west", "225°"],
          ["west", "270°"], ["north-west", "315°"]];
        const c = pick(r, DIRS);
        return { q: `B is due ${c[0]} of A.\nWrite down the bearing of B from A as a three-figure bearing.`,
          a: c[1],
          sol: [S(`Bearings are measured clockwise from north`, "M1"), S(c[1], "A1")] };
      }
      if (d === 2) {
        const b = ri(r, 1, 35) * 10;
        const back = (b + 180) % 360;
        const pad = (n) => String(n).padStart(3, "0");
        return { q: `The bearing of Q from P is ${pad(b)}°.\nWork out the bearing of P from Q.`,
          a: `${pad(back)}°`,
          sol: [S(b < 180 ? `Add 180°: ${b} + 180 = ${b + 180}` : `Subtract 180°: ${b} − 180 = ${b - 180}`, "M1"),
                S(`${pad(back)}°`, "A1")] };
      }
      const start = ri(r, 2, 33) * 10, turn = ri(r, 3, 15) * 10;
      const cw = r() < 0.5;
      const end = ((cw ? start + turn : start - turn) % 360 + 360) % 360;
      const pad = (n) => String(n).padStart(3, "0");
      return { q: `A ship sails on a bearing of ${pad(start)}°.\nIt then turns ${turn}° ${cw ? "clockwise" : "anticlockwise"} and sails on.\nFind the ship's new bearing, and the bearing of its starting point\nfrom its new course direction.`,
        a: `${pad(end)}°; back bearing ${pad((end + 180) % 360)}°`,
        sol: [S(`${cw ? `${start} + ${turn}` : `${start} − ${turn}`} = ${nf(cw ? start + turn : start - turn)}`, "M1"),
              S(`Bearings run from 000° to 359°, so the new bearing is ${pad(end)}°`, "A1"),
              S(`Back bearing = ${pad(end)} ${end < 180 ? "+" : "−"} 180 = ${pad((end + 180) % 360)}°`, "B1")] };
    }
  },

  primeFactorisation: {
    name: "Factor trees, HCF and LCM", grades: [5, 6, 7, 8],
    gen(r, d) {
      const asProduct = (n) => {
        const out = [];
        let m = n;
        for (let p = 2; p * p <= m; p++) while (m % p === 0) { out.push(p); m /= p; }
        if (m > 1) out.push(m);
        return out;
      };
      const show = (list) => {
        const counts = {};
        list.forEach((p) => { counts[p] = (counts[p] || 0) + 1; });
        return Object.keys(counts).map(Number).sort((a, b) => a - b)
          .map((p) => (counts[p] === 1 ? String(p) : p + sup(counts[p]))).join(" × ");
      };
      if (d === 1) {
        const n = pick(r, [12, 18, 20, 24, 28, 30, 36, 40, 45, 48, 50, 60, 72]);
        return { q: `Draw a factor tree for ${n} and write ${n} as a product of its prime factors.`,
          a: show(asProduct(n)),
          sol: [S(`Split ${n} into factors again and again until every branch is prime`, "M1"),
                S(`${n} = ${asProduct(n).join(" × ")} = ${show(asProduct(n))}`, "A1")] };
      }
      const a = pick(r, [12, 16, 18, 24, 30, 36, 40, 42, 48, 54, 60]);
      let b = pick(r, [15, 20, 24, 27, 32, 45, 50, 56, 63, 70, 84]);
      if (b === a) b += 6;
      const h = gcd(a, b), l = (a * b) / h;
      if (d === 2)
        return { q: `Find the highest common factor (HCF) of ${a} and ${b}.`, a: String(h),
          sol: [S(`${a} = ${show(asProduct(a))} and ${b} = ${show(asProduct(b))}`, "M1"),
                S(`Multiply the prime factors they share`, "M1"), S(`HCF = ${h}`, "A1")] };
      return { q: `Write ${a} and ${b} as products of their prime factors,\nthen use them to find the HCF and the LCM of ${a} and ${b}.`,
        a: `${a} = ${show(asProduct(a))}, ${b} = ${show(asProduct(b))}; HCF ${h}, LCM ${l}`,
        sol: [S(`${a} = ${show(asProduct(a))}, ${b} = ${show(asProduct(b))}`, "M1"),
              S(`HCF: the lowest power of each shared prime → ${h}`, "A1"),
              S(`LCM: the highest power of every prime → ${l}`, "A1")] };
    }
  },

  recurringDecimals: {
    name: "Terminating and recurring decimals", grades: [7, 8, 9],
    gen(r, d) {
      if (d === 1) {
        const den = pick(r, [2, 3, 4, 5, 6, 8, 9, 10, 11, 20, 25]);
        const num = ri(r, 1, den - 1);
        let m = den;
        while (m % 2 === 0) m /= 2;
        while (m % 5 === 0) m /= 5;
        const terminates = m === 1;
        return { q: `Does ${frac(num, den)} give a terminating or a recurring decimal?\nExplain how you can tell without dividing.`,
          a: terminates ? "Terminating" : "Recurring",
          sol: [S(`A fraction in its simplest form terminates only if its denominator's prime factors are 2s and 5s`, "M1"),
                S(`${den} ${terminates ? "has only 2s and 5s" : "has a prime factor other than 2 or 5"}, so ${frac(num, den)} is ${terminates ? "terminating" : "recurring"}`, "A1")] };
      }
      if (d === 2) {
        const den = pick(r, [3, 6, 7, 9, 11]);
        const num = ri(r, 1, den - 1);
        const dec = (num / den).toFixed(6);
        return { q: `Write ${frac(num, den)} as a decimal, using dot notation for the recurring part.`,
          a: `${dec.slice(0, 6)}…  (the digits repeat)`,
          sol: [S(`${num} ÷ ${den} = ${dec}…`, "M1"),
                S(`Put a dot over the first and last digit of the repeating block`, "A1")] };
      }
      const digits = pick(r, [1, 2, 4, 5, 7, 8]);
      const num = digits, den = 9;
      const g = gcd(num, den);
      return { q: `Use algebra to write 0.${digits}${digits}${digits}… as a fraction in its simplest form.`,
        a: frac(num / g, den / g),
        sol: [S(`Let x = 0.${digits}${digits}${digits}… , so 10x = ${digits}.${digits}${digits}…`, "M1"),
              S(`10x − x = ${digits}, so 9x = ${digits}`, "M1"),
              S(`x = ${frac(num, den)} = ${frac(num / g, den / g)}`, "A1")] };
    }
  },

  functionMachine: {
    name: "Function machines, inputs and outputs", grades: [6, 7, 8],
    gen(r, d) {
      const a = ri(r, 2, 6), b = ri(r, 1, 12), x = ri(r, 2, 12);
      if (d === 1)
        return { q: `A function machine multiplies by ${a} and then adds ${b}.\nThe input is ${x}. What is the output?`,
          a: String(a * x + b),
          sol: [S(`${x} × ${a} = ${a * x}`, "M1"), S(`${a * x} + ${b} = ${a * x + b}`, "A1")] };
      if (d === 2) {
        const out = a * x + b;
        return { q: `A function machine multiplies by ${a} and then adds ${b}.\nThe output is ${out}. What was the input?`,
          a: String(x),
          sol: [S(`Work backwards: ${out} − ${b} = ${out - b}`, "M1"),
                S(`${out - b} ÷ ${a} = ${x}`, "A1")] };
      }
      return { q: `A function machine subtracts ${b} and then multiplies by ${a}.\nWrite the rule as a function f(x), and write down its inverse f⁻¹(x).`,
        a: `f(x) = ${a}(x − ${b}); f⁻¹(x) = ${frac("x", a)} + ${b}`,
        sol: [S(`Subtract ${b} then multiply by ${a}: f(x) = ${a}(x − ${b})`, "M1"),
              S(`Undo in reverse order: divide by ${a}, then add ${b}`, "M1"),
              S(`f⁻¹(x) = ${frac("x", a)} + ${b}`, "A1")] };
    }
  },

  twoWayTables: {
    name: "Two-way tables", grades: [7, 8, 9],
    gen(r, d) {
      const bg = ri(r, 4, 14), bn = ri(r, 3, 12), gg = ri(r, 5, 15), gn = ri(r, 2, 10);
      const total = bg + bn + gg + gn;
      const table = `\n            Walk   Bus   Total\nBoys          ${bg}     ${bn}     ${bg + bn}\nGirls         ${gg}     ${gn}     ${gg + gn}\nTotal        ${bg + gg}    ${bn + gn}     ${total}`;
      if (d === 1)
        return { q: `The two-way table shows how ${total} learners travel to school.${table}\nHow many girls travel by bus?`,
          a: String(gn),
          sol: [S(`Read the Girls row and the Bus column`, "M1"), S(String(gn), "A1")] };
      if (d === 2)
        return { q: `The two-way table shows how ${total} learners travel to school.${table}\nHow many learners walk to school, and what fraction of the whole\ngroup is that? Give the fraction in its simplest form.`,
          a: `${bg + gg}; ${frac((bg + gg) / gcd(bg + gg, total), total / gcd(bg + gg, total))}`,
          sol: [S(`${bg} + ${gg} = ${bg + gg} walk`, "M1"),
                S(`${frac(bg + gg, total)} = ${frac((bg + gg) / gcd(bg + gg, total), total / gcd(bg + gg, total))}`, "A1")] };
      const g1 = gcd(gn, total);
      return { q: `The two-way table shows how ${total} learners travel to school.${table}\nOne learner is chosen at random.\nFind the probability that the learner is a girl who travels by bus,\nand the probability that a learner chosen from the bus users is a girl.`,
        a: `${frac(gn / g1, total / g1)} and ${frac(gn / gcd(gn, bn + gn), (bn + gn) / gcd(gn, bn + gn))}`,
        sol: [S(`P(girl and bus) = ${frac(gn, total)} = ${frac(gn / g1, total / g1)}`, "A1"),
              S(`Bus users total ${bn + gn}, of whom ${gn} are girls`, "M1"),
              S(`P(girl | bus) = ${frac(gn / gcd(gn, bn + gn), (bn + gn) / gcd(gn, bn + gn))}`, "A1")] };
    }
  },

  pieChart: {
    name: "Pie charts", grades: [6, 7, 8],
    gen(r, d) {
      const total = pick(r, [30, 36, 40, 45, 60, 72, 90, 120]);
      if (d === 1) {
        const n = ri(r, 3, Math.floor(total / 3));
        return { q: `${total} learners were asked to name their favourite sport.\n${n} of them chose football.\nWork out the angle for football on a pie chart.`,
          a: `${(360 * n) / total}°`,
          sol: [S(`Each learner is 360 ÷ ${total} = ${360 / total}°`, "M1"),
                S(`${n} × ${360 / total} = ${(360 * n) / total}°`, "A1")] };
      }
      if (d === 2) {
        const n = ri(r, 3, Math.floor(total / 3));
        const ang = (360 * n) / total;
        return { q: `A pie chart shows the favourite sports of ${total} learners.\nThe sector for cricket has an angle of ${ang}°.\nHow many learners chose cricket?`,
          a: String(n),
          sol: [S(`${ang} ÷ 360 = ${frac(ang, 360)} of the group`, "M1"),
                S(`${frac(ang, 360)} × ${total} = ${n}`, "A1")] };
      }
      const p = pick(r, [10, 15, 20, 25, 30, 40]);
      const ang = (360 * p) / 100;
      const n = ri(r, 4, 30);
      const tot = Math.round((n * 100) / p);
      return { q: `On a pie chart, one sector represents ${p}% of the data.\nWrite down the angle of that sector.\nThe sector stands for ${n} people. How many people are in the whole survey?`,
        a: `${ang}°; ${tot} people`,
        sol: [S(`${p}% of 360° = ${ang}°`, "A1"),
              S(`${n} is ${p}% of the total, so total = ${n} ÷ ${p / 100}`, "M1"),
              S(`${tot} people`, "A1")] };
    }
  },

  frequencyTableStats: {
    name: "Calculations using frequency tables", grades: [7, 8, 9, 10],
    gen(r, d) {
      const vals = [0, 1, 2, 3, 4];
      const fr = vals.map(() => ri(r, 2, 9));
      const n = fr.reduce((a, b) => a + b, 0);
      const sum = vals.reduce((a, v, i) => a + v * fr[i], 0);
      const tbl = `\nScore      ${vals.join("     ")}\nFrequency  ${fr.join("     ")}`;
      if (d === 1) {
        const mode = vals[fr.indexOf(Math.max(...fr))];
        return { q: `The table shows the scores of ${n} learners in a quiz.${tbl}\nWrite down the modal score and the total number of learners.`,
          a: `Mode ${mode}; ${n} learners`,
          sol: [S(`The highest frequency is ${Math.max(...fr)}`, "M1"),
                S(`Mode = ${mode}; total = ${fr.join(" + ")} = ${n}`, "A1")] };
      }
      if (d === 2) {
        const mean = sum / n;
        return { q: `The table shows the scores of ${n} learners in a quiz.${tbl}\nCalculate the mean score, correct to 2 decimal places.`,
          a: mean.toFixed(2),
          sol: [S(`Σfx = ${vals.map((v, i) => `${v}×${fr[i]}`).join(" + ")} = ${sum}`, "M1"),
                S(`Σf = ${n}`, "M1"),
                S(`Mean = ${sum} ÷ ${n} = ${mean.toFixed(2)}`, "A1")] };
      }
      // Grouped data: estimated mean and modal class.
      const width = pick(r, [10, 20]);
      const gf = [0, 1, 2, 3].map(() => ri(r, 3, 12));
      const gn = gf.reduce((a, b) => a + b, 0);
      const mid = [0, 1, 2, 3].map((i) => i * width + width / 2);
      const gsum = mid.reduce((a, m, i) => a + m * gf[i], 0);
      const rows = [0, 1, 2, 3].map((i) => `${i * width} ≤ t < ${(i + 1) * width}   ${gf[i]}`).join("\n");
      const modal = gf.indexOf(Math.max(...gf));
      return { q: `The grouped table shows the times, t minutes, taken by ${gn} learners.\nTime (minutes)     Frequency\n${rows}\nWrite down the modal class and calculate an estimate of the mean time,\ncorrect to 1 decimal place. Explain why it is only an estimate.`,
        a: `${modal * width} ≤ t < ${(modal + 1) * width}; mean ≈ ${(gsum / gn).toFixed(1)} minutes`,
        sol: [S(`Modal class is the one with the highest frequency: ${modal * width} ≤ t < ${(modal + 1) * width}`, "B1"),
              S(`Use midpoints ${mid.join(", ")}: Σfx = ${gsum}`, "M1"),
              S(`${gsum} ÷ ${gn} = ${(gsum / gn).toFixed(1)} minutes`, "A1"),
              S(`It is an estimate because the exact values within each class are not known`, "B1")] };
    }
  },

  combinedProbability: {
    name: "Probability of combined events", grades: [7, 8, 9, 10],
    gen(r, d) {
      if (d === 1) {
        const total = pick(r, [10, 12, 15, 20]);
        const a = ri(r, 2, 4), b = ri(r, 2, 4);
        const g = gcd(a + b, total);
        return { q: `A bag holds ${total} counters. ${a} are red and ${b} are blue.\nOne counter is taken at random.\nFind the probability that it is red or blue.`,
          a: frac((a + b) / g, total / g),
          sol: [S(`Red and blue cannot both happen, so add the probabilities`, "M1"),
                S(`${frac(a, total)} + ${frac(b, total)} = ${frac(a + b, total)} = ${frac((a + b) / g, total / g)}`, "A1")] };
      }
      if (d === 2) {
        const d1 = pick(r, [2, 3, 4, 5]), d2 = pick(r, [2, 3, 4, 5]);
        const n1 = ri(r, 1, d1 - 1), n2 = ri(r, 1, d2 - 1);
        const num = n1 * n2, den = d1 * d2, g = gcd(num, den);
        return { q: `The probability that it rains on Monday is ${frac(n1, d1)}.\nThe probability that it rains on Tuesday is ${frac(n2, d2)}.\nThe two days are independent.\nFind the probability that it rains on both days.`,
          a: frac(num / g, den / g),
          sol: [S(`For independent events, multiply`, "M1"),
                S(`${frac(n1, d1)} × ${frac(n2, d2)} = ${frac(num, den)} = ${frac(num / g, den / g)}`, "A1")] };
      }
      const total = pick(r, [8, 10, 12]);
      const red = ri(r, 3, total - 3);
      const other = total - red;
      // Two taken without replacement — probability of at least one red.
      const nBoth = other * (other - 1), dBoth = total * (total - 1);
      const num = dBoth - nBoth, g = gcd(num, dBoth);
      return { q: `A bag holds ${total} counters, of which ${red} are red.\nTwo counters are taken at random without replacement.\nDraw a tree diagram and find the probability that at least one is red.`,
        a: frac(num / g, dBoth / g),
        sol: [S(`P(no red) = ${frac(other, total)} × ${frac(other - 1, total - 1)} = ${frac(nBoth, dBoth)}`, "M1"),
              S(`P(at least one red) = 1 − ${frac(nBoth, dBoth)}`, "M1"),
              S(frac(num / g, dBoth / g), "A1")] };
    }
  },

  experimentalProbability: {
    name: "Experimental probability and relative frequency", grades: [7, 8, 9, 10],
    gen(r, d) {
      if (d === 1) {
        const trials = pick(r, [20, 25, 40, 50, 100]);
        const hits = ri(r, 3, Math.floor(trials / 2));
        const g = gcd(hits, trials);
        return { q: `A drawing pin is dropped ${trials} times.\nIt lands point up ${hits} times.\nWork out the relative frequency of landing point up.\nGive your answer as a fraction in its simplest form.`,
          a: frac(hits / g, trials / g),
          sol: [S(`Relative frequency = ${frac(hits, trials)}`, "M1"),
                S(frac(hits / g, trials / g), "A1")] };
      }
      if (d === 2) {
        const den = pick(r, [4, 5, 8, 10, 20]);
        const num = ri(r, 1, den - 1);
        const trials = den * ri(r, 5, 20);
        return { q: `The probability that a seed germinates is ${frac(num, den)}.\n${trials} seeds are planted.\nHow many would you expect to germinate?`,
          a: String((num * trials) / den),
          sol: [S(`Expected number = probability × number of trials`, "M1"),
                S(`${frac(num, den)} × ${trials} = ${(num * trials) / den}`, "A1")] };
      }
      const trials = pick(r, [60, 120, 180, 240]);
      const obs = Math.round(trials / 6) + ri(r, -6, 6);
      return { q: `A dice is rolled ${trials} times and a six comes up ${obs} times.\nCompare the experimental probability with the theoretical probability,\nand say whether you think the dice is fair. Justify your answer.`,
        a: `Experimental ${(obs / trials).toFixed(3)}, theoretical ${(1 / 6).toFixed(3)}`,
        sol: [S(`Experimental probability = ${obs} ÷ ${trials} = ${(obs / trials).toFixed(3)}`, "M1"),
              S(`Theoretical probability = ${frac(1, 6)} = ${(1 / 6).toFixed(3)}`, "B1"),
              S(`The two are ${Math.abs(obs / trials - 1 / 6) < 0.03 ? "close, so there is no evidence the dice is biased" : "not close, so the dice may be biased"}; more trials would give a better estimate`, "A1")] };
    }
  },

  midpointSegment: {
    name: "The midpoint and length of a line segment", grades: [8, 9, 10, 11],
    gen(r, d) {
      if (d === 1) {
        const x1 = ri(r, -8, 8), y1 = ri(r, -8, 8);
        const x2 = x1 + 2 * ri(r, 1, 6), y2 = y1 + 2 * ri(r, 1, 6);
        return { q: `A is (${nf(x1)}, ${nf(y1)}) and B is (${nf(x2)}, ${nf(y2)}).\nFind the coordinates of the midpoint of AB.`,
          a: `(${nf((x1 + x2) / 2)}, ${nf((y1 + y2) / 2)})`,
          sol: [S(`Midpoint = (${frac("x₁ + x₂", 2)}, ${frac("y₁ + y₂", 2)})`, "M1"),
                S(`(${nf((x1 + x2) / 2)}, ${nf((y1 + y2) / 2)})`, "A1")] };
      }
      if (d === 2) {
        const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25]];
        const t = pick(r, TRIPLES);
        const x1 = ri(r, -5, 5), y1 = ri(r, -5, 5);
        return { q: `P is (${nf(x1)}, ${nf(y1)}) and Q is (${nf(x1 + t[0])}, ${nf(y1 + t[1])}).\nFind the length of PQ.`,
          a: String(t[2]),
          sol: [S(`Horizontal step ${t[0]}, vertical step ${t[1]}`, "M1"),
                S(`PQ = ${rad(`${t[0]}${sup(2)} + ${t[1]}${sup(2)}`)} = ${rad(t[0] * t[0] + t[1] * t[1])}`, "M1"),
                S(String(t[2]), "A1")] };
      }
      const mx = ri(r, -6, 6), my = ri(r, -6, 6);
      const ax = ri(r, -8, 8), ay = ri(r, -8, 8);
      return { q: `M(${nf(mx)}, ${nf(my)}) is the midpoint of AB, and A is (${nf(ax)}, ${nf(ay)}).\nFind the coordinates of B.`,
        a: `(${nf(2 * mx - ax)}, ${nf(2 * my - ay)})`,
        sol: [S(`M is halfway, so B = 2M − A`, "M1"),
              S(`x: 2(${nf(mx)}) − (${nf(ax)}) = ${nf(2 * mx - ax)}`, "M1"),
              S(`(${nf(2 * mx - ax)}, ${nf(2 * my - ay)})`, "A1")] };
    }
  },

  similarShapes: {
    name: "Similarity and congruence", grades: [9, 10, 11],
    gen(r, d) {
      if (d === 1) {
        const k = ri(r, 2, 4), a = ri(r, 2, 8), b = ri(r, 3, 9);
        return { q: `Triangle ABC is similar to triangle PQR.\nAB = ${a} cm and PQ = ${a * k} cm.\nBC = ${b} cm. Find the length of QR.`,
          a: `${b * k} cm`,
          sol: [S(`Scale factor = ${a * k} ÷ ${a} = ${k}`, "M1"),
                S(`QR = ${b} × ${k} = ${b * k} cm`, "A1")] };
      }
      if (d === 2) {
        const k = ri(r, 2, 4), A = ri(r, 4, 20);
        return { q: `Two similar shapes have areas ${A} cm${sup(2)} and ${A * k * k} cm${sup(2)}.\nFind the linear scale factor between them, and the ratio of\ntheir corresponding sides.`,
          a: `${k}; sides in the ratio 1 : ${k}`,
          sol: [S(`Area factor = ${A * k * k} ÷ ${A} = ${k * k}`, "M1"),
                S(`Linear factor = ${rad(k * k)} = ${k}`, "A1"),
                S(`Sides are in the ratio 1 : ${k}`, "B1")] };
      }
      const k = ri(r, 2, 3), V = ri(r, 3, 15) * 2, A = ri(r, 5, 30);
      return { q: `Two similar cones have heights in the ratio 1 : ${k}.\nThe smaller cone has surface area ${A} cm${sup(2)} and volume ${V} cm${sup(3)}.\nFind the surface area and the volume of the larger cone.`,
        a: `${A * k * k} cm${sup(2)} and ${V * k * k * k} cm${sup(3)}`,
        sol: [S(`Area factor = ${k}${sup(2)} = ${k * k}, so ${A} × ${k * k} = ${A * k * k} cm${sup(2)}`, "M1"),
              S(`Volume factor = ${k}${sup(3)} = ${k * k * k}`, "M1"),
              S(`${V} × ${k * k * k} = ${V * k * k * k} cm${sup(3)}`, "A1")] };
    }
  },

  tallyCharts: {
    name: "Collecting and organising data", grades: [2, 3, 4, 5, 6, 7],
    gen(r, d) {
      const tally = (n) => {
        let s = "";
        for (let i = 0; i < Math.floor(n / 5); i++) s += "卌 ";
        s += "|".repeat(n % 5);
        return s.trim();
      };
      const ITEMS = pick(r, [["Red", "Blue", "Green", "Yellow"],
        ["Cat", "Dog", "Bird", "Fish"], ["Football", "Cricket", "Swimming", "Tennis"]]);
      const f = ITEMS.map(() => ri(r, 2, 14));
      const total = f.reduce((a, b) => a + b, 0);
      const rows = ITEMS.map((it, i) => `${it.padEnd(10)} ${tally(f[i])}`).join("\n");
      if (d === 1) {
        const i = ri(r, 0, 3);
        return { q: `A class made a tally chart.\n${rows}\nHow many chose ${ITEMS[i]}?`,
          a: String(f[i]),
          sol: [S(`Each 卌 stands for 5`, "M1"), S(String(f[i]), "A1")] };
      }
      if (d === 2)
        return { q: `A class made a tally chart.\n${rows}\nComplete a frequency column, and write down how many\nlearners were asked altogether.`,
          a: `${ITEMS.map((it, i) => `${it} ${f[i]}`).join(", ")}; ${total} altogether`,
          sol: [S(`Count each set of tally marks`, "M1"),
                S(`${f.join(" + ")} = ${total}`, "A1")] };
      const hi = f.indexOf(Math.max(...f)), lo = f.indexOf(Math.min(...f));
      return { q: `A class made a tally chart.\n${rows}\nWrite down the mode. How many more chose ${ITEMS[hi]} than ${ITEMS[lo]}?\nWhat fraction of the class chose ${ITEMS[hi]}? Give it in its simplest form.`,
        a: `${ITEMS[hi]}; ${f[hi] - f[lo]} more; ${frac(f[hi] / gcd(f[hi], total), total / gcd(f[hi], total))}`,
        sol: [S(`The largest frequency is ${f[hi]}, so the mode is ${ITEMS[hi]}`, "B1"),
              S(`${f[hi]} − ${f[lo]} = ${f[hi] - f[lo]}`, "M1"),
              S(`${frac(f[hi], total)} = ${frac(f[hi] / gcd(f[hi], total), total / gcd(f[hi], total))}`, "A1")] };
    }
  },

  proportionOfWhole: {
    name: "Proportion of the whole", grades: [5, 6, 7],
    gen(r, d) {
      if (d === 1) {
        const total = pick(r, [12, 16, 20, 24, 30]);
        const part = ri(r, 2, total - 2);
        const g = gcd(part, total);
        return { q: `A box holds ${total} pencils. ${part} of them are red.\nWhat fraction of the pencils are red?\nGive your answer in its simplest form.`,
          a: frac(part / g, total / g),
          sol: [S(`${frac(part, total)} are red`, "M1"),
                S(`Divide top and bottom by ${g}: ${frac(part / g, total / g)}`, "A1")] };
      }
      if (d === 2) {
        const total = pick(r, [20, 25, 40, 50]);
        const part = ri(r, 3, total - 3);
        return { q: `In a class of ${total} learners, ${part} walk to school.\nWhat percentage of the class walk to school?`,
          a: `${(part * 100) / total}%`,
          sol: [S(`${frac(part, total)} × 100`, "M1"),
                S(`= ${(part * 100) / total}%`, "A1")] };
      }
      const den = pick(r, [4, 5, 8, 10]), num = ri(r, 1, den - 1);
      const whole = den * ri(r, 3, 12);
      return { q: `${frac(num, den)} of the books on a shelf are novels.\nThere are ${(num * whole) / den} novels.\nHow many books are on the shelf altogether?`,
        a: String(whole),
        sol: [S(`${frac(num, den)} of the total = ${(num * whole) / den}`, "M1"),
              S(`${frac(1, den)} of the total = ${(num * whole) / den} ÷ ${num} = ${whole / den}`, "M1"),
              S(`Total = ${whole / den} × ${den} = ${whole}`, "A1")] };
    }
  },

  directProportion: {
    name: "Direct and inverse proportion", grades: [6, 7, 8, 9],
    gen(r, d) {
      if (d === 1) {
        const n = pick(r, [3, 4, 5, 6, 8]);
        const unit = ri(r, 2, 9) * 5;
        const m = n + ri(r, 1, 6);
        return { q: `${n} identical notebooks cost ${money((n * unit) / 100)} rials.\nWork out the cost of ${m} of these notebooks.`,
          a: `${money((m * unit) / 100)} rials`,
          sol: [S(`One notebook costs ${money((n * unit) / 100)} ÷ ${n} = ${money(unit / 100)} rials`, "M1"),
                S(`${m} × ${money(unit / 100)} = ${money((m * unit) / 100)} rials`, "A1")] };
      }
      if (d === 2) {
        const k = ri(r, 2, 9), x1 = ri(r, 2, 8), x2 = ri(r, 3, 12);
        return { q: `y is directly proportional to x.\nWhen x = ${x1}, y = ${k * x1}.\nFind the constant of proportionality and the value of y when x = ${x2}.`,
          a: `k = ${k}; y = ${k * x2}`,
          sol: [S(`y = kx, so ${k * x1} = k × ${x1}`, "M1"),
                S(`k = ${k}, so y = ${k}x`, "A1"),
                S(`When x = ${x2}, y = ${k} × ${x2} = ${k * x2}`, "A1")] };
      }
      const k = pick(r, [24, 36, 48, 60, 72, 120]);
      const x1 = pick(r, [2, 3, 4, 6]), x2 = pick(r, [8, 10, 12]);
      return { q: `y is inversely proportional to x.\nWhen x = ${x1}, y = ${k / x1}.\nFind a formula for y in terms of x, and the value of y when x = ${x2}.\nSay what happens to y when x is doubled.`,
        a: `y = ${frac(k, "x")}; y = ${money(k / x2)}; y is halved`,
        sol: [S(`y = ${frac("k", "x")}, so ${k / x1} = ${frac("k", x1)}`, "M1"),
              S(`k = ${k}, giving y = ${frac(k, "x")}`, "A1"),
              S(`When x = ${x2}, y = ${frac(k, x2)} = ${money(k / x2)}`, "A1"),
              S(`Doubling x halves y`, "B1")] };
    }
  },

  timeZones: {
    name: "Time zones", grades: [5, 6, 7],
    gen(r, d) {
      const hhmm = (h, m) => `${String(((h % 24) + 24) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const CITIES = [["London", -4], ["Karachi", 1], ["Delhi", 1.5], ["Singapore", 4],
        ["Cairo", -2], ["Sydney", 6], ["New York", -9]];
      const c = pick(r, CITIES);
      const h = ri(r, 6, 18), m = pick(r, [0, 15, 30, 45]);
      const off = c[1];
      const totalMin = h * 60 + m + off * 60;
      const oh = Math.floor(((totalMin % 1440) + 1440) % 1440 / 60), om = ((totalMin % 60) + 60) % 60;
      const offText = `${off > 0 ? "+" : "−"}${Math.abs(off) === Math.floor(Math.abs(off)) ? Math.abs(off) : Math.abs(off) + ""} hours`;
      if (d === 1)
        return { q: `The time in Muscat is ${hhmm(h, m)}.\n${c[0]} is ${offText.replace("+", "ahead of Muscat by ").replace("−", "behind Muscat by ")}.\nWhat is the time in ${c[0]}?`,
          a: hhmm(oh, om),
          sol: [S(`${hhmm(h, m)} ${off > 0 ? "+" : "−"} ${Math.abs(off)} hours`, "M1"),
                S(hhmm(oh, om), "A1")] };
      if (d === 2) {
        const dep = ri(r, 5, 14), dur = ri(r, 2, 8);
        const arrM = (dep + dur) * 60 + off * 60;
        return { q: `A plane leaves Muscat at ${hhmm(dep, 0)} Muscat time.\nThe flight to ${c[0]} takes ${dur} hours.\n${c[0]} time is ${off >= 0 ? Math.abs(off) + " hours ahead of" : Math.abs(off) + " hours behind"} Muscat.\nAt what local time does the plane land in ${c[0]}?`,
          a: hhmm(Math.floor((((arrM % 1440) + 1440) % 1440) / 60), ((arrM % 60) + 60) % 60),
          sol: [S(`Arrival in Muscat time: ${hhmm(dep, 0)} + ${dur} h = ${hhmm(dep + dur, 0)}`, "M1"),
                S(`Adjust by ${off >= 0 ? "+" : "−"}${Math.abs(off)} hours for the time zone`, "M1"),
                S(hhmm(Math.floor((((arrM % 1440) + 1440) % 1440) / 60), ((arrM % 60) + 60) % 60), "A1")] };
      }
      const dep = ri(r, 4, 12), dur = ri(r, 3, 9);
      const arr = dep + dur + off;
      return { q: `A flight leaves Muscat at ${hhmm(dep, 0)} Muscat time and lands in ${c[0]}\nat ${hhmm(arr, 0)} local time. ${c[0]} time is ${off >= 0 ? Math.abs(off) + " hours ahead of" : Math.abs(off) + " hours behind"} Muscat.\nHow long was the flight?`,
        a: `${dur} hours`,
        sol: [S(`Convert the arrival time to Muscat time: ${hhmm(arr, 0)} ${off >= 0 ? "−" : "+"} ${Math.abs(off)} h = ${hhmm(dep + dur, 0)}`, "M1"),
              S(`${hhmm(dep + dur, 0)} − ${hhmm(dep, 0)} = ${dur} hours`, "A1")] };
    }
  },

  cumulativeFrequency: {
    name: "Cumulative frequency, quartiles and percentiles", grades: [9, 10, 11, 12],
    gen(r, d) {
      // A list of 11 values, so the median and quartiles land on data points.
      const data = [];
      let v = ri(r, 4, 12);
      for (let i = 0; i < 11; i++) { data.push(v); v += ri(r, 1, 6); }
      if (d === 1)
        return { q: `The ordered list shows the marks of 11 learners.\n${data.join(", ")}\nWrite down the median mark.`,
          a: String(data[5]),
          sol: [S(`With 11 values the median is the 6th`, "M1"), S(String(data[5]), "A1")] };
      if (d === 2)
        return { q: `The ordered list shows the marks of 11 learners.\n${data.join(", ")}\nFind the lower quartile, the upper quartile and the interquartile range.`,
          a: `Q₁ = ${data[2]}, Q₃ = ${data[8]}, IQR = ${data[8] - data[2]}`,
          sol: [S(`Q₁ is the 3rd value = ${data[2]}`, "M1"),
                S(`Q₃ is the 9th value = ${data[8]}`, "M1"),
                S(`IQR = ${data[8]} − ${data[2]} = ${data[8] - data[2]}`, "A1")] };
      // Cumulative frequency table.
      const width = 10;
      const f = [0, 1, 2, 3, 4].map(() => ri(r, 4, 16));
      const n = f.reduce((a, b) => a + b, 0);
      let run = 0;
      const cum = f.map((x) => (run += x));
      const rows = f.map((x, i) => `t ≤ ${(i + 1) * width}       ${cum[i]}`).join("\n");
      const halfway = n / 2;
      const idx = cum.findIndex((c) => c >= halfway);
      return { q: `The cumulative frequency table shows the times, t minutes,\ntaken by ${n} learners to finish a task.\nTime            Cumulative frequency\n${rows}\nUse the table to estimate the median, and state the class\nthat contains the median. Explain why the value is an estimate.`,
        a: `Median lies in ${idx * width} < t ≤ ${(idx + 1) * width}`,
        sol: [S(`The median is the ${halfway}th value`, "M1"),
              S(`${cum.slice(0, idx + 1).join(", ")} — ${halfway} is first passed at t ≤ ${(idx + 1) * width}`, "M1"),
              S(`Median lies in ${idx * width} < t ≤ ${(idx + 1) * width}`, "A1"),
              S(`Only the class totals are known, not the individual times`, "B1")] };
    }
  },

  boxPlots: {
    name: "Box plots, outliers and skew", grades: [9, 10, 11, 12],
    gen(r, d) {
      const data = [];
      let v = ri(r, 3, 10);
      for (let i = 0; i < 11; i++) { data.push(v); v += ri(r, 1, 5); }
      const min = data[0], q1 = data[2], med = data[5], q3 = data[8], max = data[10];
      const iqr = q3 - q1;
      if (d === 1)
        return { q: `The ordered data shows 11 measurements.\n${data.join(", ")}\nWrite down the five-number summary needed to draw a box plot.`,
          a: `${min}, ${q1}, ${med}, ${q3}, ${max}`,
          sol: [S(`Minimum ${min}, maximum ${max}`, "B1"),
                S(`Q₁ = ${q1}, median = ${med}, Q₃ = ${q3}`, "M1"),
                S(`${min}, ${q1}, ${med}, ${q3}, ${max}`, "A1")] };
      if (d === 2) {
        const susp = q3 + iqr * 2;
        return { q: `A data set has lower quartile ${q1} and upper quartile ${q3}.\nA value of ${susp} is recorded.\nUse the 1.5 × IQR rule to decide whether ${susp} is an outlier.`,
          a: `Yes — it is above ${q3 + 1.5 * iqr}`,
          sol: [S(`IQR = ${q3} − ${q1} = ${iqr}`, "M1"),
                S(`Upper limit = ${q3} + 1.5 × ${iqr} = ${q3 + 1.5 * iqr}`, "M1"),
                S(`${susp} > ${q3 + 1.5 * iqr}, so it is an outlier`, "A1")] };
      }
      const lower = med - q1, upper = q3 - med;
      const skew = upper > lower ? "positive (right)" : upper < lower ? "negative (left)" : "no";
      return { q: `A box plot has minimum ${min}, Q₁ = ${q1}, median = ${med},\nQ₃ = ${q3} and maximum ${max}.\nDescribe the skew of the distribution and justify your answer\nby comparing the two halves of the box.`,
        a: `${skew} skew`,
        sol: [S(`Median − Q₁ = ${lower}`, "M1"),
              S(`Q₃ − median = ${upper}`, "M1"),
              S(`${upper > lower ? "The upper half is longer" : upper < lower ? "The lower half is longer" : "The halves are equal"}, so the distribution has ${skew} skew`, "A1")] };
    }
  },

  interestProfitLoss: {
    name: "Interest, profit and loss", grades: [8, 9, 10],
    gen(r, d) {
      if (d === 1) {
        const P = pick(r, [200, 400, 500, 800, 1200, 2000]);
        const rate = pick(r, [2, 3, 4, 5, 6, 8]), yrs = ri(r, 2, 5);
        const I = (P * rate * yrs) / 100;
        return { q: `${P} rials is invested at ${rate}% simple interest per year for ${yrs} years.\nWork out the interest earned.`,
          a: `${money(I)} rials`,
          sol: [S(`Interest = ${frac("P × R × T", 100)}`, "M1"),
                S(`${P} × ${rate} × ${yrs} ÷ 100 = ${money(I)} rials`, "A1")] };
      }
      if (d === 2) {
        const P = pick(r, [500, 1000, 1500, 2000, 4000]);
        const rate = pick(r, [2, 4, 5, 10]), yrs = ri(r, 2, 4);
        const A = P * Math.pow(1 + rate / 100, yrs);
        return { q: `${P} rials is invested at ${rate}% compound interest per year.\nFind the value of the investment after ${yrs} years, to the nearest rial,\nand state how much more it is than with simple interest.`,
          a: `${Math.round(A)} rials, ${Math.round(A) - (P + (P * rate * yrs) / 100)} rials more`,
          sol: [S(`Value = ${P} × (1 + ${rate / 100})${sup(yrs)}`, "M1"),
                S(`= ${money(A)} ≈ ${Math.round(A)} rials`, "A1"),
                S(`Simple interest gives ${P + (P * rate * yrs) / 100}, a difference of ${Math.round(A) - (P + (P * rate * yrs) / 100)} rials`, "A1")] };
      }
      const cost = pick(r, [40, 50, 60, 80, 120, 150, 250]);
      const pct = pick(r, [10, 15, 20, 25, 30]);
      const sell = cost * (1 + pct / 100);
      return { q: `A shopkeeper sells an item for ${money(sell)} rials, making a profit of ${pct}%.\nWork out the price the shopkeeper paid for the item.`,
        a: `${money(cost)} rials`,
        sol: [S(`${money(sell)} is ${100 + pct}% of the cost price`, "M1"),
              S(`Cost = ${money(sell)} ÷ ${(100 + pct) / 100}`, "M1"),
              S(`${money(cost)} rials`, "A1")] };
    }
  },

  growthDecay: {
    name: "Exponential growth and decay", grades: [9, 10, 11],
    gen(r, d) {
      if (d === 1) {
        const P = pick(r, [1000, 2000, 5000, 8000, 12000]);
        const rate = pick(r, [3, 5, 10, 20]), yrs = ri(r, 2, 4);
        const A = P * Math.pow(1 + rate / 100, yrs);
        return { q: `The population of a town is ${P} and grows by ${rate}% each year.\nFind the population after ${yrs} years, to the nearest whole number.`,
          a: String(Math.round(A)),
          sol: [S(`Multiplier = 1 + ${frac(rate, 100)} = ${1 + rate / 100}`, "M1"),
                S(`${P} × ${1 + rate / 100}${sup(yrs)} = ${money(A)}`, "M1"),
                S(String(Math.round(A)), "A1")] };
      }
      if (d === 2) {
        const P = pick(r, [12000, 15000, 20000, 25000]);
        const rate = pick(r, [10, 15, 20, 25]), yrs = ri(r, 2, 4);
        const A = P * Math.pow(1 - rate / 100, yrs);
        return { q: `A car costs ${P} rials new and depreciates by ${rate}% each year.\nFind its value after ${yrs} years, to the nearest rial, and write down\nthe decay multiplier you used.`,
          a: `${Math.round(A)} rials; multiplier ${1 - rate / 100}`,
          sol: [S(`Multiplier = 1 − ${frac(rate, 100)} = ${1 - rate / 100}`, "M1"),
                S(`${P} × ${1 - rate / 100}${sup(yrs)} = ${money(A)}`, "M1"),
                S(`${Math.round(A)} rials`, "A1")] };
      }
      const P = pick(r, [400, 800, 1600, 3200]);
      const half = pick(r, [2, 3, 4, 5]);
      const n = ri(r, 2, 4);
      return { q: `A radioactive sample of mass ${P} grams has a half-life of ${half} days.\nFind its mass after ${half * n} days, and find how many days it takes\nfor the mass to fall below ${P / 16} grams.`,
        a: `${P / Math.pow(2, n)} g; ${half * 5} days`,
        sol: [S(`${half * n} days is ${n} half-lives`, "M1"),
              S(`${P} ÷ 2${sup(n)} = ${P / Math.pow(2, n)} g`, "A1"),
              S(`${P / 16} g is 4 half-lives; below it needs a 5th, so ${half * 5} days`, "A1")] };
    }
  },

  conversionGraphs: {
    name: "Conversion graphs and real-life graphs", grades: [7, 8, 9, 10],
    gen(r, d) {
      if (d === 1) {
        const rate = pick(r, [2.5, 4, 5, 8, 10]);
        const x = ri(r, 3, 20);
        return { q: `A conversion graph converts litres to a cost in rials.\nThe graph is a straight line through the origin, and 1 litre costs ${money(rate)} rials.\nUse it to find the cost of ${x} litres.`,
          a: `${money(rate * x)} rials`,
          sol: [S(`Cost = ${money(rate)} × ${x}`, "M1"), S(`${money(rate * x)} rials`, "A1")] };
      }
      if (d === 2) {
        const rate = pick(r, [3, 4, 6, 8]);
        const y = rate * ri(r, 3, 12);
        return { q: `A conversion graph converts kilograms to pounds.\nThe line passes through the origin and (1, ${rate}).\nWrite down the gradient of the line, say what it means,\nand use the graph to convert ${y} pounds into kilograms.`,
          a: `Gradient ${rate} — pounds per kilogram; ${y / rate} kg`,
          sol: [S(`Gradient = ${rate}: each kilogram is ${rate} pounds`, "B1"),
                S(`${y} ÷ ${rate} = ${y / rate}`, "M1"),
                S(`${y / rate} kg`, "A1")] };
      }
      const d1 = ri(r, 20, 60), t1 = ri(r, 1, 2);
      const rest = pick(r, [0.5, 1]);
      const d2 = ri(r, 20, 60), t2 = ri(r, 1, 3);
      return { q: `A distance–time graph shows a journey.\nStage 1: ${d1} km in ${t1} hour${t1 > 1 ? "s" : ""}.\nStage 2: a rest of ${rest} hour${rest > 1 ? "s" : ""}.\nStage 3: a further ${d2} km in ${t2} hour${t2 > 1 ? "s" : ""}.\nFind the speed on each moving stage, and the average speed\nfor the whole journey. Give answers to 1 decimal place.`,
        a: `${(d1 / t1).toFixed(1)} km/h, ${(d2 / t2).toFixed(1)} km/h; average ${((d1 + d2) / (t1 + rest + t2)).toFixed(1)} km/h`,
        sol: [S(`Stage 1: ${d1} ÷ ${t1} = ${(d1 / t1).toFixed(1)} km/h`, "M1"),
              S(`Stage 3: ${d2} ÷ ${t2} = ${(d2 / t2).toFixed(1)} km/h`, "M1"),
              S(`Average = ${d1 + d2} ÷ ${t1 + rest + t2} = ${((d1 + d2) / (t1 + rest + t2)).toFixed(1)} km/h`, "A1")] };
    }
  },

  travelGraphs: {
    name: "Speed–time graphs and acceleration", grades: [9, 10, 11],
    gen(r, d) {
      if (d === 1) {
        const v = ri(r, 3, 20) * 2, t = ri(r, 2, 10);
        return { q: `A car accelerates uniformly from rest to ${v} m/s in ${t} seconds.\nFind its acceleration.`,
          a: `${money(v / t)} m/s${sup(2)}`,
          sol: [S(`Acceleration = ${frac("change in speed", "time")}`, "M1"),
                S(`${v} ÷ ${t} = ${money(v / t)} m/s${sup(2)}`, "A1")] };
      }
      if (d === 2) {
        const v = ri(r, 4, 15) * 2, t = ri(r, 4, 20);
        return { q: `On a speed–time graph, a train travels at a constant ${v} m/s for ${t} seconds.\nFind the distance travelled, and explain how the graph shows it.`,
          a: `${v * t} m`,
          sol: [S(`Distance is the area under a speed–time graph`, "B1"),
                S(`Rectangle: ${v} × ${t}`, "M1"),
                S(`${v * t} m`, "A1")] };
      }
      const v = ri(r, 5, 15) * 2, t1 = ri(r, 2, 8), t2 = ri(r, 5, 15), t3 = ri(r, 2, 8);
      const dist = 0.5 * t1 * v + v * t2 + 0.5 * t3 * v;
      const T = t1 + t2 + t3;
      return { q: `A cyclist accelerates uniformly from rest to ${v} m/s in ${t1} s,\ntravels at ${v} m/s for ${t2} s, then decelerates uniformly to rest in ${t3} s.\nSketch the speed–time graph, find the total distance travelled,\nand find the average speed for the whole journey (2 d.p.).`,
        a: `${money(dist)} m; ${(dist / T).toFixed(2)} m/s`,
        sol: [S(`The graph is a trapezium with parallel sides ${t2} and ${T}, height ${v}`, "M1"),
              S(`Area = ${frac(1, 2)}(${t2} + ${T}) × ${v} = ${money(dist)} m`, "A1"),
              S(`Average speed = ${money(dist)} ÷ ${T} = ${(dist / T).toFixed(2)} m/s`, "A1")] };
    }
  },

  tangentGradient: {
    name: "Gradients of curves by drawing tangents", grades: [9, 10, 11],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 1, 4), b = a + ri(r, 1, 3);
        return { q: `For the curve y = x${sup(2)}, find the gradient of the chord\njoining the points where x = ${a} and x = ${b}.`,
          a: String(a + b),
          sol: [S(`Points (${a}, ${a * a}) and (${b}, ${b * b})`, "M1"),
                S(`Gradient = ${frac(`${b * b} − ${a * a}`, `${b} − ${a}`)} = ${frac(b * b - a * a, b - a)}`, "M1"),
                S(String(a + b), "A1")] };
      }
      if (d === 2) {
        const x1 = ri(r, -6, 0), y1 = ri(r, 1, 8);
        const dx = ri(r, 2, 6), dy = dx * ri(r, 1, 4);
        return { q: `A tangent is drawn to a curve at the point P.\nThe tangent passes through (${nf(x1)}, ${nf(y1)}) and (${nf(x1 + dx)}, ${nf(y1 + dy)}).\nEstimate the gradient of the curve at P.`,
          a: String(dy / dx),
          sol: [S(`Gradient = ${frac("rise", "run")} = ${frac(dy, dx)}`, "M1"),
                S(String(dy / dx), "A1")] };
      }
      const v0 = ri(r, 10, 40), t = ri(r, 2, 8), rise = ri(r, 5, 30);
      return { q: `A distance–time graph curves upwards. A tangent drawn at t = ${t} s\nrises ${rise} m over ${v0 / 10} s.\nEstimate the speed at t = ${t} s, say what the gradient of a\ndistance–time graph represents, and explain why a tangent\ngives only an estimate.`,
        a: `${money(rise / (v0 / 10))} m/s`,
        sol: [S(`Gradient of the tangent = ${rise} ÷ ${v0 / 10} = ${money(rise / (v0 / 10))}`, "M1"),
              S(`On a distance–time graph the gradient is the speed`, "B1"),
              S(`${money(rise / (v0 / 10))} m/s — an estimate, because the tangent is drawn by eye`, "A1")] };
    }
  },

  trig3D: {
    name: "Trigonometry in three dimensions", grades: [10, 11],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 3, 9), b = ri(r, 3, 9), c = ri(r, 3, 9);
        const diag = Math.sqrt(a * a + b * b + c * c);
        return { q: `A cuboid measures ${a} cm by ${b} cm by ${c} cm.\nFind the length of the longest diagonal, correct to 3 significant figures.`,
          a: `${diag.toPrecision(3)} cm`,
          sol: [S(`Base diagonal = ${rad(`${a}${sup(2)} + ${b}${sup(2)}`)} = ${rad(a * a + b * b)}`, "M1"),
                S(`Space diagonal = ${rad(`${a * a + b * b} + ${c}${sup(2)}`)} = ${rad(a * a + b * b + c * c)}`, "M1"),
                S(`${diag.toPrecision(3)} cm`, "A1")] };
      }
      if (d === 2) {
        const a = ri(r, 4, 10), b = ri(r, 4, 10), h = ri(r, 3, 9);
        const base = Math.sqrt(a * a + b * b);
        const ang = Math.atan(h / base) * 180 / Math.PI;
        return { q: `A cuboid has base ${a} cm by ${b} cm and height ${h} cm.\nFind the angle between the longest diagonal and the base,\ncorrect to 1 decimal place.`,
          a: `${ang.toFixed(1)}°`,
          sol: [S(`Base diagonal = ${rad(a * a + b * b)} = ${base.toFixed(3)} cm`, "M1"),
                S(`tan θ = ${frac(h, base.toFixed(3))}`, "M1"),
                S(`θ = ${ang.toFixed(1)}°`, "A1")] };
      }
      const s = ri(r, 4, 12) * 2, h = ri(r, 5, 15);
      const halfDiag = (s * Math.SQRT2) / 2;
      const ang = Math.atan(h / halfDiag) * 180 / Math.PI;
      const slant = Math.sqrt(h * h + (s / 2) * (s / 2));
      return { q: `A pyramid has a square base of side ${s} cm and its apex is ${h} cm\nvertically above the centre of the base.\nFind the angle between an edge from the apex to a corner and the base,\nand the angle between a sloping face and the base. Give both to 1 d.p.`,
        a: `${ang.toFixed(1)}° and ${(Math.atan(h / (s / 2)) * 180 / Math.PI).toFixed(1)}°`,
        sol: [S(`Half the base diagonal = ${frac(`${s}${rad(2)}`, 2)} = ${halfDiag.toFixed(3)} cm`, "M1"),
              S(`tan θ = ${frac(h, halfDiag.toFixed(3))}, so θ = ${ang.toFixed(1)}°`, "A1"),
              S(`For a face, use half the base side: tan φ = ${frac(h, s / 2)}, so φ = ${(Math.atan(h / (s / 2)) * 180 / Math.PI).toFixed(1)}° (slant height ${slant.toFixed(2)} cm)`, "A1")] };
    }
  },

  scatterGraphs: {
    name: "Scatter graphs and correlation", grades: [6, 7, 8, 9],
    gen(r, d) {
      if (d === 1) {
        const CASES = [
          ["the number of hours revised and the test mark", "positive"],
          ["the age of a car and its value", "negative"],
          ["a person's shoe size and their test mark", "no"],
          ["the temperature and the number of cold drinks sold", "positive"],
          ["the outside temperature and the amount of heating used", "negative"]
        ];
        const c = pick(r, CASES);
        return { q: `A scatter graph is drawn of ${c[0]}.\nWhat type of correlation would you expect? Explain your answer.`,
          a: `${c[1]} correlation`,
          sol: [S(`Decide whether one goes up as the other goes up`, "M1"),
                S(`${c[1]} correlation`, "A1")] };
      }
      if (d === 2) {
        const m = ri(r, 2, 6), c = ri(r, 5, 30), x = ri(r, 3, 12);
        return { q: `A line of best fit on a scatter graph has equation y = ${m}x + ${c}.\nUse it to estimate y when x = ${x}, and say whether your\nestimate is interpolation or extrapolation if the data covers 1 ≤ x ≤ 15.`,
          a: `${m * x + c}; interpolation`,
          sol: [S(`y = ${m} × ${x} + ${c}`, "M1"),
                S(String(m * x + c), "A1"),
                S(`${x} is inside the range of the data, so it is interpolation`, "B1")] };
      }
      const x1 = ri(r, 1, 4), y1 = ri(r, 10, 25);
      const m = ri(r, 2, 5);
      const x2 = x1 + ri(r, 4, 8);
      const y2 = y1 + m * (x2 - x1);
      const xf = x2 + ri(r, 8, 15);
      const cInt = y1 - m * x1;
      const line = `y = ${m}x ${cInt < 0 ? "− " + -cInt : "+ " + cInt}`;
      return { q: `A line of best fit passes through (${x1}, ${y1}) and (${x2}, ${y2}).\nFind its equation. Use it to predict y when x = ${xf},\nand explain why this prediction is unreliable.`,
        a: `${line}; y = ${nf(m * xf + cInt)}`,
        sol: [S(`Gradient = ${frac(y2 - y1, x2 - x1)} = ${m}`, "M1"),
              S(line, "A1"),
              S(`When x = ${xf}, y = ${nf(m * xf + cInt)}`, "A1"),
              S(`x = ${xf} is well outside the data, so this is extrapolation`, "B1")] };
    }
  },

  dataTypes: {
    name: "Types of data", grades: [7, 8, 11, 12],
    gen(r, d) {
      if (d === 1) {
        const CASES = [["the number of learners in a class", "discrete"],
          ["the height of a plant", "continuous"], ["the time taken to run 100 m", "continuous"],
          ["the number of goals scored", "discrete"], ["the mass of a parcel", "continuous"],
          ["the shoe sizes sold in a shop", "discrete"]];
        const c = pick(r, CASES);
        return { q: `Is ${c[0]} discrete or continuous data? Explain your answer.`,
          a: c[1],
          sol: [S(`${c[1] === "discrete" ? "It can only take separate, countable values" : "It can take any value in a range and is measured, not counted"}`, "M1"),
                S(c[1], "A1")] };
      }
      if (d === 2) {
        const CASES = [["eye colour", "qualitative (categorical)"],
          ["the mass of a parcel", "quantitative"], ["favourite subject", "qualitative (categorical)"],
          ["the number of cars in a car park", "quantitative"]];
        const c = pick(r, CASES);
        const src = pick(r, [["data you collect yourself by measuring", "primary"],
          ["data taken from a published census report", "secondary"]]);
        return { q: `(i) Is ${c[0]} qualitative or quantitative data?\n(ii) Is ${src[0]} primary or secondary data?`,
          a: `(i) ${c[1]}  (ii) ${src[1]}`,
          sol: [S(`Qualitative data describes a quality; quantitative data is a number`, "M1"),
                S(`(i) ${c[1]}`, "A1"),
                S(`(ii) ${src[1]} — ${src[1] === "primary" ? "collected first hand" : "collected by someone else"}`, "A1")] };
      }
      const n = ri(r, 40, 200);
      return { q: `A survey records the times, in seconds, of ${n} runners.\nSay whether the data is discrete or continuous, and whether it should\nbe grouped or left ungrouped. Name a suitable diagram for displaying it\nand justify your choice.`,
        a: "Continuous; grouped; a histogram or cumulative frequency curve",
        sol: [S(`Times are measured, so the data is continuous`, "B1"),
              S(`With ${n} values there are too many different times to list, so group them`, "B1"),
              S(`A histogram (or cumulative frequency curve) suits grouped continuous data`, "A1")] };
    }
  },

  samplingMethods: {
    name: "Sampling methods and questionnaires", grades: [7, 8, 9, 12],
    gen(r, d) {
      if (d === 1) {
        const CASES = [
          ["every learner's name is put in a hat and 20 names are drawn out", "simple random sampling"],
          ["every 10th person on an alphabetical list is chosen", "systematic sampling"],
          ["the sample has the same proportion of boys and girls as the school", "stratified sampling"],
          ["the first 30 people the researcher meets are asked", "opportunity (convenience) sampling"],
          ["a whole class is chosen at random and every learner in it is asked", "cluster sampling"]
        ];
        const c = pick(r, CASES);
        return { q: `A researcher chooses a sample so that ${c[0]}.\nName this sampling method.`, a: c[1],
          sol: [S(`Match the description to the standard method`, "M1"), S(c[1], "A1")] };
      }
      if (d === 2) {
        const pop = pick(r, [200, 400, 500, 800, 1000]);
        const grp = ri(r, 4, 20) * 10;
        const n = pick(r, [40, 50, 100]);
        return { q: `A school has ${pop} learners, of whom ${grp} are in Grade 10.\nA stratified sample of ${n} learners is taken.\nHow many Grade 10 learners should be in the sample?`,
          a: String(Math.round((grp / pop) * n)),
          sol: [S(`${frac(grp, pop)} of the school is in Grade 10`, "M1"),
                S(`${frac(grp, pop)} × ${n} = ${money((grp / pop) * n)}`, "M1"),
                S(String(Math.round((grp / pop) * n)), "A1")] };
      }
      const BAD = pick(r, [
        `"You do agree that the school day is too long, don't you?"`,
        `"How much sport do you do?    ☐ a lot   ☐ some   ☐ not much"`,
        `"Do you like maths and science?    ☐ Yes   ☐ No"`
      ]);
      return { q: `A questionnaire contains this question:\n${BAD}\nGive one reason why the question is unsuitable, and write an\nimproved version. Also state one advantage and one disadvantage\nof taking a sample rather than surveying the whole population.`,
        a: "The question is biased or ambiguous; a sample is quicker and cheaper but may not represent the population",
        sol: [S(`${BAD.includes("don't you") ? "It is a leading question" : BAD.includes("a lot") ? "The response options are vague and overlap in meaning" : "It asks two things at once, so one answer cannot cover both"}`, "B1"),
              S(`Rewrite with a neutral wording and clear, non-overlapping response boxes`, "B1"),
              S(`A sample is quicker and cheaper to collect; but it may be biased and not represent the whole population`, "A1")] };
    }
  },

  constructionSteps: {
    name: "Constructions and loci", grades: [7, 8, 9],
    gen(r, d) {
      if (d === 1) {
        const CASES = [
          ["set the compasses to more than half of AB, draw arcs from A and from B on both sides, and join where the arcs cross",
            "the perpendicular bisector of AB"],
          ["draw an arc from the vertex cutting both arms, then draw equal arcs from those two points and join the crossing point to the vertex",
            "the bisector of the angle"],
          ["draw an arc from P cutting the line twice, then draw equal arcs from those two points and join P to where they cross",
            "the perpendicular from P to the line"]
        ];
        const c = pick(r, CASES);
        return { q: `A construction is made as follows:\n${c[0]}.\nWhat has been constructed?`, a: c[1],
          sol: [S(`The arcs are all the same radius, so every point found is equidistant`, "M1"), S(c[1], "A1")] };
      }
      if (d === 2) {
        const cm = ri(r, 3, 8);
        const CASES = [
          [`a point that is always ${cm} cm from a fixed point A`, `a circle of radius ${cm} cm, centre A`],
          [`a point that is always the same distance from A as from B`, `the perpendicular bisector of AB`],
          [`a point that is always the same distance from two lines that meet`, `the bisector of the angle between them`],
          [`a point that is always ${cm} cm from a straight line`, `two lines parallel to it, one ${cm} cm each side`]
        ];
        const c = pick(r, CASES);
        return { q: `Describe fully the locus of ${c[0]}.`, a: c[1],
          sol: [S(`A locus is the set of all points obeying the rule`, "M1"), S(c[1], "A1")] };
      }
      const a = ri(r, 3, 7), b = ri(r, 4, 9);
      return { q: `A rectangular garden ABCD measures ${b} m by ${a} m.\nA tree is to be planted less than ${a} m from corner A and\nnearer to side AB than to side AD.\nDescribe the construction you would use and shade the region\nwhere the tree can be planted.`,
        a: `Inside the arc of radius ${a} m centred on A, on the AB side of the bisector of angle A`,
        sol: [S(`Draw an arc of radius ${a} m centred on A — the tree must be inside it`, "M1"),
              S(`Construct the bisector of angle DAB — the tree must be on the AB side`, "M1"),
              S(`Shade the region satisfying both conditions`, "A1")] };
    }
  },

  digitalStorage: {
    name: "Units of digital storage", grades: [7, 8],
    gen(r, d) {
      if (d === 1) {
        const mb = ri(r, 2, 40);
        return { q: `A photo file is ${mb} MB.\nHow many kilobytes is that? (1 MB = 1000 KB)`,
          a: `${mb * 1000} KB`,
          sol: [S(`${mb} × 1000`, "M1"), S(`${mb * 1000} KB`, "A1")] };
      }
      if (d === 2) {
        const gb = ri(r, 2, 16), mb = ri(r, 20, 400);
        return { q: `A memory card holds ${gb} GB. Each photo is ${mb} MB.\nHow many whole photos will fit? (1 GB = 1000 MB)`,
          a: String(Math.floor((gb * 1000) / mb)),
          sol: [S(`${gb} GB = ${gb * 1000} MB`, "M1"),
                S(`${gb * 1000} ÷ ${mb} = ${money((gb * 1000) / mb)}`, "M1"),
                S(`${Math.floor((gb * 1000) / mb)} whole photos`, "A1")] };
      }
      const gb = ri(r, 2, 8), kb = ri(r, 200, 900);
      const files = Math.floor((gb * 1000000) / kb);
      return { q: `A drive holds ${gb} GB. Each document is ${kb} KB.\nWrite the capacity of the drive in kilobytes in standard form,\nand find how many whole documents it will hold.`,
        a: `${gb} × 10${sup(6)} KB; ${files} documents`,
        sol: [S(`${gb} GB = ${gb * 1000} MB = ${gb * 1000000} KB`, "M1"),
              S(`= ${gb} × 10${sup(6)} KB`, "A1"),
              S(`${gb * 1000000} ÷ ${kb} = ${files} whole documents`, "A1")] };
    }
  },

  algebraicFractions: {
    name: "Algebraic fractions", grades: [10, 11, 12],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 1, 6);
        let b = ri(r, 1, 6);
        if (b === a) b = a === 6 ? 1 : a + 1;
        return { q: `Simplify ${frac(`x${sup(2)} + ${a + b}x + ${a * b}`, `x + ${a}`)}`,
          a: `x + ${b}`,
          sol: [S(`Factorise the numerator: (x + ${a})(x + ${b})`, "M1"),
                S(`Cancel the factor (x + ${a})`, "M1"), S(`x + ${b}`, "A1")] };
      }
      if (d === 2) {
        const a = ri(r, 1, 5), b = ri(r, 1, 5), c = ri(r, 2, 6);
        return { q: `Write as a single fraction in its simplest form:\n${frac(a, `x + ${b}`)} + ${frac(c, "x")}`,
          a: frac(`${a + c}x + ${b * c}`, `x(x + ${b})`),
          sol: [S(`Common denominator x(x + ${b})`, "M1"),
                S(`${frac(`${a}x + ${c}(x + ${b})`, `x(x + ${b})`)}`, "M1"),
                S(frac(`${a + c}x + ${b * c}`, `x(x + ${b})`), "A1")] };
      }
      // Three different constants, so nothing cancels by accident.
      const pool = [1, 2, 3, 4, 5, 6, 7];
      const a = pool.splice(Math.floor(r() * pool.length), 1)[0];
      const b = pool.splice(Math.floor(r() * pool.length), 1)[0];
      const c = pool.splice(Math.floor(r() * pool.length), 1)[0];
      return { q: `Simplify fully:\n${frac(`x${sup(2)} − ${a * a}`, `x${sup(2)} + ${a + b}x + ${a * b}`)} ÷ ${frac(`x − ${a}`, `x + ${c}`)}`,
        a: frac(`(x + ${a})(x + ${c})`, `(x + ${b})(x − ${a})`),
        sol: [S(`x${sup(2)} − ${a * a} = (x − ${a})(x + ${a})`, "M1"),
              S(`x${sup(2)} + ${a + b}x + ${a * b} = (x + ${a})(x + ${b})`, "M1"),
              S(`Dividing means multiplying by ${frac(`x + ${c}`, `x − ${a}`)}`, "M1"),
              S(frac(`(x + ${a})(x + ${c})`, `(x + ${b})(x − ${a})`), "A1")] };
    }
  },

  // ---------- AS and A Level pure ----------

  circleEquation: {
    name: "The equation of a circle", grades: [10, 11, 12],
    gen(r, d) {
      const a = ri(r, -6, 6), b = ri(r, -6, 6), rad0 = ri(r, 2, 9);
      if (d === 1)
        return { q: `Write down the centre and the radius of the circle\n(x ${a < 0 ? "+ " + -a : "− " + a})${sup(2)} + (y ${b < 0 ? "+ " + -b : "− " + b})${sup(2)} = ${rad0 * rad0}`,
          a: `Centre (${nf(a)}, ${nf(b)}), radius ${rad0}`,
          sol: [S(`(x − a)${sup(2)} + (y − b)${sup(2)} = r${sup(2)} has centre (a, b)`, "M1"),
                S(`Centre (${nf(a)}, ${nf(b)}), r = ${rad(rad0 * rad0)} = ${rad0}`, "A1")] };
      if (d === 2) {
        const c = a * a + b * b - rad0 * rad0;
        return { q: `A circle has equation x${sup(2)} + y${sup(2)} ${-2 * a < 0 ? "− " + 2 * a : "+ " + -2 * a}x ${-2 * b < 0 ? "− " + 2 * b : "+ " + -2 * b}y ${c < 0 ? "− " + -c : "+ " + c} = 0\nBy completing the square, find its centre and radius.`,
          a: `Centre (${nf(a)}, ${nf(b)}), radius ${rad0}`,
          sol: [S(`x${sup(2)} ${-2 * a < 0 ? "− " + 2 * a : "+ " + -2 * a}x = (x ${a < 0 ? "+ " + -a : "− " + a})${sup(2)} − ${a * a}`, "M1"),
                S(`y${sup(2)} ${-2 * b < 0 ? "− " + 2 * b : "+ " + -2 * b}y = (y ${b < 0 ? "+ " + -b : "− " + b})${sup(2)} − ${b * b}`, "M1"),
                S(`(x ${a < 0 ? "+ " + -a : "− " + a})${sup(2)} + (y ${b < 0 ? "+ " + -b : "− " + b})${sup(2)} = ${rad0 * rad0}`, "M1"),
                S(`Centre (${nf(a)}, ${nf(b)}), radius ${rad0}`, "A1")] };
      }
      // A line through the centre meets the circle at two points a diameter apart.
      const m = pick(r, [1, -1, 2, -2]);
      return { q: `The circle C has centre (${nf(a)}, ${nf(b)}) and radius ${rad0}.\nThe line L has gradient ${nf(m)} and passes through the centre of C.\n(i) Show that L meets C at two points and find the distance between them.\n(ii) Find the equation of the tangent to C at the point (${nf(a)}, ${nf(b + rad0)}).`,
        a: `(i) ${2 * rad0}  (ii) y = ${nf(b + rad0)}`,
        sol: [S(`A line through the centre is a diameter, so it cuts the circle twice`, "M1"),
              S(`Distance = 2r = ${2 * rad0}`, "A1"),
              S(`(${nf(a)}, ${nf(b + rad0)}) is the top of the circle; the radius there is vertical`, "M1"),
              S(`The tangent is perpendicular to it, so y = ${nf(b + rad0)}`, "A1")] };
    }
  },

  polynomialDivision: {
    name: "Division of polynomials", grades: [11, 12],
    gen(r, d) {
      const a = ri(r, 1, 5), b = ri(r, -5, 5), c = ri(r, -6, 6);
      // (x − a)(x² + bx + c) = x³ + (b−a)x² + (c−ab)x − ac
      const p2 = b - a, p1 = c - a * b, p0 = -a * c;
      const cubic = poly([[1, 3], [p2, 2], [p1, 1], [p0, 0]]);
      if (d === 1)
        return { q: `Divide ${cubic} by (x ${a < 0 ? "+ " + -a : "− " + a})`,
          a: poly([[1, 2], [b, 1], [c, 0]]),
          sol: [S(`Long division: x${sup(3)} ÷ x = x${sup(2)}`, "M1"),
                S(`Continue: the next terms are ${nf(b)}x and ${nf(c)}`, "M1"),
                S(`Quotient ${poly([[1, 2], [b, 1], [c, 0]])}, remainder 0`, "A1")] };
      if (d === 2) {
        const rem = ri(r, 1, 9) * (r() < 0.5 ? -1 : 1);
        const cubic2 = poly([[1, 3], [p2, 2], [p1, 1], [p0 + rem, 0]]);
        return { q: `Find the quotient and the remainder when ${cubic2}\nis divided by (x ${a < 0 ? "+ " + -a : "− " + a})`,
          a: `Quotient ${poly([[1, 2], [b, 1], [c, 0]])}, remainder ${nf(rem)}`,
          sol: [S(`Divide as before to get the quotient ${poly([[1, 2], [b, 1], [c, 0]])}`, "M1"),
                S(`What is left over is the remainder`, "M1"),
                S(`Remainder ${nf(rem)} — and f(${a}) = ${nf(rem)} checks it`, "A1")] };
      }
      // Divide a quartic by a quadratic.
      const q1 = ri(r, -4, 4), q0 = ri(r, 1, 6);
      const e1 = ri(r, -3, 3), e0 = ri(r, -5, 5);
      // (x² + q1 x + q0)(x² + e1 x + e0)
      const c3 = q1 + e1, c2 = q0 + q1 * e1 + e0, c1 = q1 * e0 + q0 * e1, c0 = q0 * e0;
      return { q: `Divide ${poly([[1, 4], [c3, 3], [c2, 2], [c1, 1], [c0, 0]])}\nby ${poly([[1, 2], [q1, 1], [q0, 0]])}, and hence write the quartic as a\nproduct of two quadratic factors.`,
        a: `${poly([[1, 2], [e1, 1], [e0, 0]])}`,
        sol: [S(`x${sup(4)} ÷ x${sup(2)} = x${sup(2)}; subtract and bring down`, "M1"),
              S(`The next term of the quotient is ${nf(e1)}x, then ${nf(e0)}`, "M1"),
              S(`Quotient ${poly([[1, 2], [e1, 1], [e0, 0]])}, remainder 0`, "A1"),
              S(`So the quartic is (${poly([[1, 2], [q1, 1], [q0, 0]])})(${poly([[1, 2], [e1, 1], [e0, 0]])})`, "A1")] };
    }
  },

  partialFractions: {
    name: "Partial fractions", grades: [11, 12],
    gen(r, d) {
      if (d === 1) {
        // A/(x+a) + B/(x+b)
        const a = ri(r, 1, 5);
        let b = ri(r, 1, 6);
        if (b === a) b = a === 6 ? 1 : a + 1;
        const A = ri(r, 1, 5), B = ri(r, 1, 5);
        const n1 = A + B, n0 = A * b + B * a;
        return { q: `Express in partial fractions:\n${frac(`${n1 === 1 ? "" : n1}x + ${n0}`, `(x + ${a})(x + ${b})`)}`,
          a: `${frac(A, `x + ${a}`)} + ${frac(B, `x + ${b}`)}`,
          sol: [S(`Let it equal ${frac("A", `x + ${a}`)} + ${frac("B", `x + ${b}`)}`, "M1"),
                S(`${n1 === 1 ? "" : n1}x + ${n0} = A(x + ${b}) + B(x + ${a})`, "M1"),
                S(`x = ${nf(-a)} gives A = ${A}; x = ${nf(-b)} gives B = ${B}`, "A1")] };
      }
      if (d === 2) {
        // A/(x+a) + B/(x+a)²
        const a = ri(r, 1, 5), A = ri(r, 1, 5), B = ri(r, 1, 6);
        return { q: `Express in partial fractions:\n${frac(`${A === 1 ? "" : A}x + ${A * a + B}`, `(x + ${a})${sup(2)}`)}`,
          a: `${frac(A, `x + ${a}`)} + ${frac(B, `(x + ${a})${sup(2)}`)}`,
          sol: [S(`A repeated factor needs ${frac("A", `x + ${a}`)} + ${frac("B", `(x + ${a})${sup(2)}`)}`, "M1"),
                S(`${A === 1 ? "" : A}x + ${A * a + B} = A(x + ${a}) + B`, "M1"),
                S(`Comparing x terms A = ${A}; x = ${nf(-a)} gives B = ${B}`, "A1")] };
      }
      // Improper: divide first, then split.
      const a = ri(r, 1, 4);
      let b = ri(r, 1, 5);
      if (b === a) b = a === 5 ? 1 : a + 1;
      const k = ri(r, 1, 4), A = ri(r, 1, 4), B = ri(r, 1, 4);
      // k + A/(x+a) + B/(x+b) over (x+a)(x+b)
      const n2 = k, n1 = k * (a + b) + A + B, n0 = k * a * b + A * b + B * a;
      return { q: `Express in partial fractions:\n${frac(`${n2 === 1 ? "" : n2}x${sup(2)} + ${n1}x + ${n0}`, `(x + ${a})(x + ${b})`)}\nExplain first why the fraction is improper.`,
        a: `${k} + ${frac(A, `x + ${a}`)} + ${frac(B, `x + ${b}`)}`,
        sol: [S(`The numerator has the same degree as the denominator, so the fraction is improper`, "B1"),
              S(`Divide: the quotient is ${k}, leaving ${frac(`${A + B}x + ${A * b + B * a}`, `(x + ${a})(x + ${b})`)}`, "M1"),
              S(`Split the proper part: x = ${nf(-a)} gives A = ${A}; x = ${nf(-b)} gives B = ${B}`, "M1"),
              S(`${k} + ${frac(A, `x + ${a}`)} + ${frac(B, `x + ${b}`)}`, "A1")] };
    }
  },

  increasingDecreasing: {
    name: "Increasing and decreasing functions, stationary points", grades: [11, 12],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 1, 4), b = ri(r, -6, 6), x = ri(r, 1, 5);
        const grad = 2 * a * x + b;
        return { q: `f(x) = ${poly([[a, 2], [b, 1], [ri(r, -5, 5), 0]])}\nFind f′(x) and show that f is ${grad > 0 ? "increasing" : "decreasing"} at x = ${x}.`,
          a: `f′(x) = ${poly([[2 * a, 1], [b, 0]])}, f′(${x}) = ${nf(grad)}`,
          sol: [S(`f′(x) = ${poly([[2 * a, 1], [b, 0]])}`, "M1"),
                S(`f′(${x}) = ${2 * a} × ${x} ${b < 0 ? "− " + -b : "+ " + b} = ${nf(grad)}`, "M1"),
                S(`${nf(grad)} ${grad > 0 ? "> 0, so f is increasing" : "< 0, so f is decreasing"} at x = ${x}`, "A1")] };
      }
      // f′(x) = 3(x − p)(x − q), so f(x) = x³ − 3(p+q)/2·x² + 3pq·x.
      // Choose p and q with p + q even, keeping every coefficient a whole number.
      const p = ri(r, -4, 3);
      const q = p + 2 * ri(r, 1, 3);
      const b = (-3 * (p + q)) / 2, c = 3 * p * q, k = ri(r, -6, 6);
      const f = poly([[1, 3], [b, 2], [c, 1], [k, 0]]);
      if (d === 2)
        return { q: `f(x) = ${f}\nFind f′(x) and the set of values of x for which f is decreasing.`,
          a: `${nf(p)} < x < ${nf(q)}`,
          sol: [S(`f′(x) = ${poly([[3, 2], [2 * b, 1], [c, 0]])} = 3(x ${p < 0 ? "+ " + -p : "− " + p})(x ${q < 0 ? "+ " + -q : "− " + q})`, "M1"),
                S(`f is decreasing where f′(x) < 0`, "M1"),
                S(`The parabola is below the axis between its roots: ${nf(p)} < x < ${nf(q)}`, "A1")] };
      const fp = (x) => x * x * x + b * x * x + c * x + k;
      return { q: `f(x) = ${f}\n(i) Find the coordinates of the two stationary points.\n(ii) Use the second derivative to determine the nature of each.`,
        a: `(${nf(p)}, ${nf(fp(p))}) maximum; (${nf(q)}, ${nf(fp(q))}) minimum`,
        sol: [S(`f′(x) = ${poly([[3, 2], [2 * b, 1], [c, 0]])} = 0 when x = ${nf(p)} or x = ${nf(q)}`, "M1"),
              S(`f(${nf(p)}) = ${nf(fp(p))} and f(${nf(q)}) = ${nf(fp(q))}`, "A1"),
              S(`f″(x) = ${poly([[6, 1], [2 * b, 0]])}; f″(${nf(p)}) = ${nf(6 * p + 2 * b)} < 0, a maximum`, "M1"),
              S(`f″(${nf(q)}) = ${nf(6 * q + 2 * b)} > 0, a minimum`, "A1")] };
    }
  },

  linearForm: {
    name: "Transforming a relationship to linear form", grades: [11, 12],
    gen(r, d) {
      if (d === 1) {
        const n = ri(r, 2, 5), A = ri(r, 2, 9);
        return { q: `y = ${A}x${sup(n)}\nTake logarithms of both sides and write the result in the form\nlg y = m lg x + c, stating m and c.`,
          a: `lg y = ${n} lg x + lg ${A}`,
          sol: [S(`lg y = lg(${A}x${sup(n)}) = lg ${A} + lg x${sup(n)}`, "M1"),
                S(`lg y = ${n} lg x + lg ${A}`, "A1"),
                S(`m = ${n}, c = lg ${A} ≈ ${Math.log10(A).toFixed(3)}`, "A1")] };
      }
      if (d === 2) {
        const n = ri(r, 2, 4), A = pick(r, [10, 100, 1000]);
        const c = Math.log10(A);
        return { q: `The graph of lg y against lg x is a straight line of gradient ${n}\nand intercept ${c} on the lg y axis.\nGiven that y = Ax${sup("n")}, find the values of A and n.`,
          a: `A = ${A}, n = ${n}`,
          sol: [S(`lg y = n lg x + lg A, so n is the gradient`, "M1"),
                S(`n = ${n}`, "A1"),
                S(`lg A = ${c}, so A = 10${sup(c)} = ${A}`, "A1")] };
      }
      const b = pick(r, [2, 3, 4, 5]), A = pick(r, [2, 5, 10]);
      return { q: `y = A b${sup("x")}, where A and b are constants.\n(i) Show that the graph of lg y against x is a straight line.\n(ii) The line has gradient ${Math.log10(b).toFixed(4)} and passes through (0, ${Math.log10(A).toFixed(4)}).\nFind A and b.`,
        a: `A = ${A}, b = ${b}`,
        sol: [S(`lg y = lg A + x lg b, which is linear in x`, "M1"),
              S(`Gradient = lg b = ${Math.log10(b).toFixed(4)}, so b = ${b}`, "A1"),
              S(`Intercept = lg A = ${Math.log10(A).toFixed(4)}, so A = ${A}`, "A1")] };
    }
  },

  reciprocalTrig: {
    name: "The secant, cosecant and cotangent functions", grades: [11, 12],
    gen(r, d) {
      if (d === 1) {
        const CASES = [["sec 60°", "2", "cos 60° = ⁅1/2⁆"],
          ["cosec 30°", "2", "sin 30° = ⁅1/2⁆"],
          ["cot 45°", "1", "tan 45° = 1"],
          ["sec 0°", "1", "cos 0° = 1"],
          ["cosec 90°", "1", "sin 90° = 1"]];
        const c = pick(r, CASES);
        return { q: `Find the exact value of ${c[0]}.`, a: c[1],
          sol: [S(`${c[2]}`, "M1"),
                S(`${c[0]} is the reciprocal, so it is ${c[1]}`, "A1")] };
      }
      if (d === 2) {
        const fn = pick(r, ["sec", "cosec"]);
        const k = ri(r, 2, 9);
        // sec θ = k means cos θ = 1/k; cosec θ = k means sin θ = 1/k.
        const ang = fn === "sec" ? Math.acos(1 / k) * 180 / Math.PI
                                 : Math.asin(1 / k) * 180 / Math.PI;
        const exact = Math.abs(ang - Math.round(ang)) < 1e-9;
        const shown = exact ? `${Math.round(ang)}°` : `${ang.toFixed(1)}°`;
        const second = fn === "sec" ? 360 - ang : 180 - ang;
        return { q: `Solve ${fn} θ = ${k} for 0° ≤ θ ≤ 360°, giving your answers\ncorrect to 1 decimal place where necessary.`,
          a: `θ = ${shown} and θ = ${second.toFixed(1)}°`,
          sol: [S(`${fn} θ = ${frac(1, fn === "sec" ? "cos θ" : "sin θ")}, so ${fn === "sec" ? "cos" : "sin"} θ = ${frac(1, k)}`, "M1"),
                S(`The first solution is ${fn === "sec" ? "cos" : "sin"}⁻¹(${frac(1, k)}) = ${shown}`, "M1"),
                S(`${fn === "sec" ? "cos is also positive in the fourth quadrant" : "sin is also positive in the second quadrant"}, giving θ = ${second.toFixed(1)}°`, "A1")] };
      }
      const t = ri(r, 2, 6);
      return { q: `Given that tan θ = ${t} and θ is acute,\nuse the identity 1 + tan${sup(2)}θ = sec${sup(2)}θ to find the exact\nvalues of sec θ and cos θ.`,
        a: `sec θ = ${rad(1 + t * t)}, cos θ = ${frac(1, rad(1 + t * t))}`,
        sol: [S(`sec${sup(2)}θ = 1 + ${t}${sup(2)} = ${1 + t * t}`, "M1"),
              S(`θ is acute, so sec θ = ${rad(1 + t * t)} (positive root)`, "A1"),
              S(`cos θ = ${frac(1, rad(1 + t * t))}`, "A1")] };
    }
  },

  compoundAngle: {
    name: "Compound angle formulae", grades: [11, 12],
    gen(r, d) {
      if (d === 1) {
        const CASES = [
          ["sin 75°", "sin(45° + 30°)", `${frac(`${rad(6)} + ${rad(2)}`, 4)}`],
          ["cos 75°", "cos(45° + 30°)", `${frac(`${rad(6)} − ${rad(2)}`, 4)}`],
          ["sin 15°", "sin(45° − 30°)", `${frac(`${rad(6)} − ${rad(2)}`, 4)}`],
          ["cos 15°", "cos(45° − 30°)", `${frac(`${rad(6)} + ${rad(2)}`, 4)}`]
        ];
        const c = pick(r, CASES);
        return { q: `Use a compound angle formula to find the exact value of ${c[0]}.`,
          a: c[2],
          sol: [S(`Write ${c[0]} as ${c[1]}`, "M1"),
                S(`Expand using the addition formula with the exact values for 45° and 30°`, "M1"),
                S(c[2], "A1")] };
      }
      if (d === 2) {
        const T = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
        const A = pick(r, T);
        let B = pick(r, T);
        if (B[2] === A[2]) B = T[(T.indexOf(A) + 1) % T.length];
        const num = A[0] * B[1] + A[1] * B[0], den = A[2] * B[2];
        const g = gcd(num, den);
        return { q: `A and B are acute angles with sin A = ${frac(A[0], A[2])} and cos B = ${frac(B[0], B[2])}.\nFind the exact value of sin(A + B).`,
          a: frac(num / g, den / g),
          sol: [S(`cos A = ${frac(A[1], A[2])} and sin B = ${frac(B[1], B[2])}`, "M1"),
                S(`sin(A + B) = sin A cos B + cos A sin B`, "M1"),
                S(`${frac(A[0], A[2])}×${frac(B[0], B[2])} + ${frac(A[1], A[2])}×${frac(B[1], B[2])} = ${frac(num / g, den / g)}`, "A1")] };
      }
      const k = pick(r, [30, 45, 60]);
      return { q: `Solve sin(θ + ${k}°) = cos θ for 0° ≤ θ ≤ 360°.\nGive your answers correct to 1 decimal place where necessary.`,
        a: `θ = ${(90 - k) / 2 + 0} ° and θ = ${(90 - k) / 2 + 180}°`,
        sol: [S(`sin(θ + ${k}°) = sin θ cos ${k}° + cos θ sin ${k}°`, "M1"),
              S(`Divide through by cos θ: tan θ cos ${k}° + sin ${k}° = 1`, "M1"),
              S(`tan θ = ${frac(`1 − sin ${k}°`, `cos ${k}°`)} = tan ${(90 - k) / 2}°`, "M1"),
              S(`θ = ${(90 - k) / 2}° or ${(90 - k) / 2 + 180}°`, "A1")] };
    }
  },

  doubleAngle: {
    name: "Double angle formulae", grades: [11, 12],
    gen(r, d) {
      const T = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
      if (d === 1) {
        const t = pick(r, T);
        const num = 2 * t[0] * t[1], den = t[2] * t[2];
        const g = gcd(num, den);
        return { q: `θ is acute and sin θ = ${frac(t[0], t[2])}.\nFind the exact value of sin 2θ.`,
          a: frac(num / g, den / g),
          sol: [S(`cos θ = ${frac(t[1], t[2])}`, "M1"),
                S(`sin 2θ = 2 sin θ cos θ = 2 × ${frac(t[0], t[2])} × ${frac(t[1], t[2])}`, "M1"),
                S(frac(num / g, den / g), "A1")] };
      }
      if (d === 2) {
        const t = pick(r, T);
        const num = t[1] * t[1] - t[0] * t[0], den = t[2] * t[2];
        const g = gcd(Math.abs(num), den);
        return { q: `θ is acute and tan θ = ${frac(t[0], t[1])}.\nWithout finding θ, find the exact values of cos 2θ and tan 2θ.`,
          a: `cos 2θ = ${frac(num / g, den / g)}, tan 2θ = ${frac(2 * t[0] * t[1], t[1] * t[1] - t[0] * t[0])}`,
          sol: [S(`sin θ = ${frac(t[0], t[2])}, cos θ = ${frac(t[1], t[2])}`, "M1"),
                S(`cos 2θ = cos${sup(2)}θ − sin${sup(2)}θ = ${frac(num, den)} = ${frac(num / g, den / g)}`, "A1"),
                S(`tan 2θ = ${frac("2 tan θ", `1 − tan${sup(2)}θ`)} = ${frac(2 * t[0] * t[1], t[1] * t[1] - t[0] * t[0])}`, "A1")] };
      }
      const EQNS = [
        { q: `cos 2θ = cos θ`, a: "θ = 0°, 120°, 240°, 360°",
          steps: [`cos 2θ = 2cos${sup(2)}θ − 1, so 2cos${sup(2)}θ − cos θ − 1 = 0`,
                  `(2cos θ + 1)(cos θ − 1) = 0`,
                  `cos θ = −${frac(1, 2)} gives θ = 120°, 240°`,
                  `cos θ = 1 gives θ = 0°, 360°`] },
        { q: `sin 2θ = sin θ`, a: "θ = 0°, 60°, 180°, 300°, 360°",
          steps: [`sin 2θ = 2 sin θ cos θ, so 2 sin θ cos θ − sin θ = 0`,
                  `sin θ(2 cos θ − 1) = 0`,
                  `sin θ = 0 gives θ = 0°, 180°, 360°`,
                  `cos θ = ${frac(1, 2)} gives θ = 60°, 300°`] },
        { q: `cos 2θ + sin θ = 0`, a: "θ = 30°, 150°, 270°",
          steps: [`cos 2θ = 1 − 2sin${sup(2)}θ, so 2sin${sup(2)}θ − sin θ − 1 = 0`,
                  `(2 sin θ + 1)(sin θ − 1) = 0`,
                  `sin θ = −${frac(1, 2)} gives θ = 210°, 330° — but check the range`,
                  `Taking the valid roots: θ = 30°, 150°, 270°`] },
        { q: `sin 2θ = cos θ`, a: "θ = 30°, 90°, 150°, 270°",
          steps: [`2 sin θ cos θ − cos θ = 0`,
                  `cos θ(2 sin θ − 1) = 0`,
                  `cos θ = 0 gives θ = 90°, 270°`,
                  `sin θ = ${frac(1, 2)} gives θ = 30°, 150°`] },
        { q: `cos 2θ = ${frac(1, 2)}`, a: "θ = 30°, 150°, 210°, 330°",
          steps: [`2θ lies in 0° ≤ 2θ ≤ 720°`,
                  `cos 2θ = ${frac(1, 2)} gives 2θ = 60°, 300°, 420°, 660°`,
                  `Halve each: θ = 30°, 150°, 210°, 330°`,
                  `All four lie in the required range`] }
      ];
      const eq = pick(r, EQNS);
      return { q: `Solve ${eq.q} for 0° ≤ θ ≤ 360°.`, a: eq.a,
        sol: eq.steps.map((t, i) => S(t, i === 0 ? "M1" : i < eq.steps.length - 1 ? "M1" : "A1")) };
    }
  },

  trigIdentityProof: {
    name: "Trigonometric identities", grades: [11, 12],
    gen(r, d) {
      if (d === 1) {
        const CASES = [
          [`sin${sup(2)}θ + cos${sup(2)}θ + tan${sup(2)}θ`, `sec${sup(2)}θ`, `sin${sup(2)}θ + cos${sup(2)}θ = 1, and 1 + tan${sup(2)}θ = sec${sup(2)}θ`],
          [`${frac(`sin θ`, `cos θ`)} × cos θ`, `sin θ`, `The cos θ terms cancel`],
          [`1 − cos${sup(2)}θ`, `sin${sup(2)}θ`, `Rearrange sin${sup(2)}θ + cos${sup(2)}θ = 1`],
          [`sec${sup(2)}θ − 1`, `tan${sup(2)}θ`, `Rearrange 1 + tan${sup(2)}θ = sec${sup(2)}θ`],
          [`cosec${sup(2)}θ − cot${sup(2)}θ`, `1`, `1 + cot${sup(2)}θ = cosec${sup(2)}θ`]
        ];
        const c = pick(r, CASES);
        return { q: `Simplify ${c[0]}`, a: c[1],
          sol: [S(c[2], "M1"), S(c[1], "A1")] };
      }
      if (d === 2) {
        const PROOFS = [
          { lhs: `${frac(`1`, `1 − sin θ`)} + ${frac(`1`, `1 + sin θ`)}`, rhs: `2 sec${sup(2)}θ`,
            steps: [`Common denominator: ${frac(`(1 + sin θ) + (1 − sin θ)`, `(1 − sin θ)(1 + sin θ)`)}`,
                    `= ${frac(2, `1 − sin${sup(2)}θ`)}`,
                    `1 − sin${sup(2)}θ = cos${sup(2)}θ`,
                    `= ${frac(2, `cos${sup(2)}θ`)} = 2 sec${sup(2)}θ`] },
          { lhs: `${frac(`sin θ`, `1 + cos θ`)} + ${frac(`1 + cos θ`, `sin θ`)}`, rhs: `2 cosec θ`,
            steps: [`Common denominator: ${frac(`sin${sup(2)}θ + (1 + cos θ)${sup(2)}`, `sin θ(1 + cos θ)`)}`,
                    `Numerator = sin${sup(2)}θ + 1 + 2 cos θ + cos${sup(2)}θ = 2 + 2 cos θ`,
                    `= ${frac(`2(1 + cos θ)`, `sin θ(1 + cos θ)`)}`,
                    `= ${frac(2, `sin θ`)} = 2 cosec θ`] },
          { lhs: `(1 − cos${sup(2)}θ)(1 + cot${sup(2)}θ)`, rhs: `1`,
            steps: [`1 − cos${sup(2)}θ = sin${sup(2)}θ`,
                    `1 + cot${sup(2)}θ = cosec${sup(2)}θ = ${frac(1, `sin${sup(2)}θ`)}`,
                    `sin${sup(2)}θ × ${frac(1, `sin${sup(2)}θ`)}`,
                    `= 1`] },
          { lhs: `${frac(`tan θ`, `sec θ − 1`)}`, rhs: `${frac(`sec θ + 1`, `tan θ`)}`,
            steps: [`Multiply top and bottom by (sec θ + 1)`,
                    `= ${frac(`tan θ(sec θ + 1)`, `sec${sup(2)}θ − 1`)}`,
                    `sec${sup(2)}θ − 1 = tan${sup(2)}θ`,
                    `= ${frac(`sec θ + 1`, `tan θ`)}`] },
          { lhs: `sec${sup(2)}θ + cosec${sup(2)}θ`, rhs: `sec${sup(2)}θ cosec${sup(2)}θ`,
            steps: [`Write both as fractions: ${frac(1, `cos${sup(2)}θ`)} + ${frac(1, `sin${sup(2)}θ`)}`,
                    `= ${frac(`sin${sup(2)}θ + cos${sup(2)}θ`, `sin${sup(2)}θ cos${sup(2)}θ`)}`,
                    `sin${sup(2)}θ + cos${sup(2)}θ = 1`,
                    `= ${frac(1, `sin${sup(2)}θ cos${sup(2)}θ`)} = sec${sup(2)}θ cosec${sup(2)}θ`] }
        ];
        const p = pick(r, PROOFS);
        return { q: `Prove the identity\n${p.lhs} ≡ ${p.rhs}`, a: "Proved",
          sol: p.steps.map((t, i) => S(t, i === p.steps.length - 1 ? "A1" : "M1")) };
      }
      const k = pick(r, [1, 2, 3]);
      return { q: `Use the identity 1 + tan${sup(2)}θ = sec${sup(2)}θ to solve\n${k === 1 ? "" : k + " "}sec${sup(2)}θ = ${k + 2} + tan θ  for 0° ≤ θ ≤ 180°,\ngiving your answers correct to 1 decimal place.`,
        a: `θ = 45° and θ = 180° − tan⁻¹(${frac(2, k)}) where applicable`,
        sol: [S(`Replace sec${sup(2)}θ with 1 + tan${sup(2)}θ`, "M1"),
              S(`${k === 1 ? "" : k}(1 + tan${sup(2)}θ) = ${k + 2} + tan θ`, "M1"),
              S(`${k}tan${sup(2)}θ − tan θ + ${k} − ${k + 2} = 0, a quadratic in tan θ`, "M1"),
              S(`Solve for tan θ, then find θ in the given range`, "A1")] };
    }
  },

  rFormTrig: {
    name: "Expressing a sin θ + b cos θ in the form R sin(θ ± α)", grades: [11, 12],
    gen(r, d) {
      const T = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
      const t = pick(r, T);
      const a = t[0], b = t[1], R = t[2];
      const alpha = (Math.atan2(b, a) * 180 / Math.PI);
      if (d === 1)
        return { q: `Express ${a} sin θ + ${b} cos θ in the form R sin(θ + α),\nwhere R > 0 and 0° < α < 90°. Give α correct to 1 decimal place.`,
          a: `${R} sin(θ + ${alpha.toFixed(1)}°)`,
          sol: [S(`R = ${rad(`${a}${sup(2)} + ${b}${sup(2)}`)} = ${rad(a * a + b * b)} = ${R}`, "M1"),
                S(`tan α = ${frac(b, a)}, so α = ${alpha.toFixed(1)}°`, "M1"),
                S(`${R} sin(θ + ${alpha.toFixed(1)}°)`, "A1")] };
      if (d === 2)
        return { q: `Given that ${a} sin θ + ${b} cos θ = ${R} sin(θ + ${alpha.toFixed(1)}°),\nwrite down the maximum and minimum values of ${a} sin θ + ${b} cos θ\nand the smallest positive value of θ at which the maximum occurs.`,
          a: `Max ${R}, min ${nf(-R)}, at θ = ${(90 - alpha).toFixed(1)}°`,
          sol: [S(`sin(θ + α) has maximum 1 and minimum −1`, "M1"),
                S(`Maximum ${R}, minimum ${nf(-R)}`, "A1"),
                S(`θ + ${alpha.toFixed(1)}° = 90° gives θ = ${(90 - alpha).toFixed(1)}°`, "A1")] };
      const k = ri(r, 1, R - 1);
      const s = Math.asin(k / R) * 180 / Math.PI;
      const [sol1, sol2] = [((s - alpha) + 360) % 360, ((180 - s - alpha) + 360) % 360]
        .sort((x, y) => x - y);
      return { q: `Solve ${a} sin θ + ${b} cos θ = ${k} for 0° ≤ θ ≤ 360°,\ngiving your answers correct to 1 decimal place.`,
        a: `θ = ${sol1.toFixed(1)}° and θ = ${sol2.toFixed(1)}°`,
        sol: [S(`Write the left-hand side as ${R} sin(θ + ${alpha.toFixed(1)}°)`, "M1"),
              S(`sin(θ + ${alpha.toFixed(1)}°) = ${frac(k, R)} = ${(k / R).toFixed(4)}`, "M1"),
              S(`θ + ${alpha.toFixed(1)}° = ${s.toFixed(1)}° or ${(180 - s).toFixed(1)}° (adding 360° as needed)`, "M1"),
              S(`θ = ${sol1.toFixed(1)}° or ${sol2.toFixed(1)}°`, "A1")] };
    }
  },

  trapeziumRule: {
    name: "The trapezium rule", grades: [11, 12],
    gen(r, d) {
      const f = (x) => x * x;
      if (d === 1) {
        const a = ri(r, 0, 3), h = ri(r, 1, 3);
        const b = a + 2 * h;
        const est = (h / 2) * (f(a) + 2 * f(a + h) + f(b));
        const exact = (b * b * b - a * a * a) / 3;
        return { q: `Use the trapezium rule with 2 intervals to estimate\n∫ from ${a} to ${b} of x${sup(2)} dx`,
          a: money(est),
          sol: [S(`h = ${h}; ordinates at x = ${a}, ${a + h}, ${b}`, "M1"),
                S(`y-values ${f(a)}, ${f(a + h)}, ${f(b)}`, "M1"),
                S(`${frac(h, 2)}[${f(a)} + 2(${f(a + h)}) + ${f(b)}] = ${money(est)}  (exact ${money(exact)})`, "A1")] };
      }
      if (d === 2) {
        const CURVES = [
          { name: rad("x"), f: (x) => Math.sqrt(x) },
          { name: `${rad(`1 + x${sup(2)}`)}`, f: (x) => Math.sqrt(1 + x * x) },
          { name: `${frac(1, `1 + x${sup(2)}`)}`, f: (x) => 1 / (1 + x * x) },
          { name: `${frac(1, `1 + x`)}`, f: (x) => 1 / (1 + x) },
          { name: `2${sup("x")}`, f: (x) => Math.pow(2, x) }
        ];
        const cv = pick(r, CURVES);
        const a = ri(r, 0, 2), h = pick(r, [0.25, 0.5, 1]);
        const n = pick(r, [4, 6]), b = a + n * h;
        const xs = [];
        for (let i = 0; i <= n; i++) xs.push(a + i * h);
        const ys = xs.map(cv.f);
        let sum = ys[0] + ys[n];
        for (let i = 1; i < n; i++) sum += 2 * ys[i];
        const est = (h / 2) * sum;
        return { q: `Use the trapezium rule with ${n} intervals to estimate\n∫ from ${a} to ${money(b)} of ${cv.name} dx, giving your answer to 3 decimal places.`,
          a: est.toFixed(3),
          sol: [S(`h = ${h}; ordinates at x = ${xs.map(money).join(", ")}`, "M1"),
                S(`y-values ${ys.map((y) => y.toFixed(4)).join(", ")}`, "M1"),
                S(`${frac(h, 2)}[y₀ + 2(y₁ + … + y${sub(n - 1)}) + y${sub(n)}] = ${est.toFixed(3)}`, "A1")] };
      }
      const a = ri(r, 1, 3), h = 1, n = ri(r, 2, 4);
      const b = a + n * h;
      const ys = [];
      for (let i = 0; i <= n; i++) ys.push(1 / (a + i * h));
      let s = ys[0] + ys[n];
      for (let i = 1; i < n; i++) s += 2 * ys[i];
      const est = (h / 2) * s;
      const exact = Math.log(b / a);
      return { q: `Use the trapezium rule with ${n} intervals to estimate\n∫ from ${a} to ${b} of ${frac(1, "x")} dx, giving your answer to 4 decimal places.\nState, with a reason, whether your estimate is an over-estimate\nor an under-estimate.`,
        a: `${est.toFixed(4)} — an over-estimate`,
        sol: [S(`h = ${h}; y-values ${ys.map((y) => y.toFixed(4)).join(", ")}`, "M1"),
              S(`${frac(h, 2)}[y₀ + 2(…) + y${sub(n)}] = ${est.toFixed(4)}`, "A1"),
              S(`The curve y = ${frac(1, "x")} is convex here, so the trapezia lie above it — an over-estimate (exact value ${exact.toFixed(4)})`, "B1")] };
    }
  },

  iterativeSolution: {
    name: "Numerical solution of equations", grades: [11, 12],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 1, 3), c = ri(r, 1, 6);
        // f(x) = x³ + a x − (a + 1 + c) has a root between 1 and 2 for suitable c
        const k = a + 1 + c;
        const f = (x) => x * x * x + a * x - k;
        let lo = 1;
        while (f(lo) > 0 && lo > -5) lo--;
        while (f(lo + 1) < 0 && lo < 10) lo++;
        return { q: `f(x) = x${sup(3)} + ${a}x − ${k}\nShow that the equation f(x) = 0 has a root between x = ${nf(lo)} and x = ${nf(lo + 1)}.`,
          a: `f(${nf(lo)}) = ${nf(money(f(lo)))}, f(${nf(lo + 1)}) = ${nf(money(f(lo + 1)))} — a sign change`,
          sol: [S(`f(${nf(lo)}) = ${nf(money(f(lo)))}`, "M1"),
                S(`f(${nf(lo + 1)}) = ${nf(money(f(lo + 1)))}`, "M1"),
                S(`f is continuous and changes sign, so there is a root between ${nf(lo)} and ${nf(lo + 1)}`, "A1")] };
      }
      if (d === 2) {
        const a = ri(r, 2, 6);
        const g = (x) => Math.cbrt(a * x + 1);
        let x = 2;
        const steps = [x];
        for (let i = 0; i < 3; i++) { x = g(x); steps.push(x); }
        return { q: `The iterative formula x${sub("n+1")} = ∛(${a}x${sub("n")} + 1) is used with x₁ = 2.\nFind x₂, x₃ and x₄, each correct to 4 decimal places.`,
          a: steps.slice(1).map((v) => v.toFixed(4)).join(", "),
          sol: [S(`x₂ = ∛(${a}×2 + 1) = ${steps[1].toFixed(4)}`, "M1"),
                S(`x₃ = ${steps[2].toFixed(4)}`, "M1"),
                S(`x₄ = ${steps[3].toFixed(4)}`, "A1")] };
      }
      const a = ri(r, 2, 5), b = ri(r, 1, 5);
      const g = (x) => Math.cbrt(a * x + b);
      let x = 2;
      for (let i = 0; i < 40; i++) x = g(x);
      return { q: `(i) Show that the equation x${sup(3)} − ${a}x − ${b} = 0 can be rearranged\nas x = ∛(${a}x + ${b}).\n(ii) Use the iterative formula x${sub("n+1")} = ∛(${a}x${sub("n")} + ${b}) with x₁ = 2 to\nfind the root correct to 3 decimal places, showing your iterations.\n(iii) Explain how you know your answer is correct to 3 decimal places.`,
        a: x.toFixed(3),
        sol: [S(`x${sup(3)} = ${a}x + ${b}, so x = ∛(${a}x + ${b})`, "M1"),
              S(`Iterate from x₁ = 2 until successive values agree to 3 d.p.`, "M1"),
              S(`Root = ${x.toFixed(3)}`, "A1"),
              S(`Check a sign change in f(x) = x${sup(3)} − ${a}x − ${b} between ${(x - 0.0005).toFixed(4)} and ${(x + 0.0005).toFixed(4)}`, "B1")] };
    }
  },

  scalarProduct: {
    name: "The scalar product", grades: [11, 12],
    gen(r, d) {
      const v = () => [ri(r, -5, 5), ri(r, -5, 5), ri(r, -5, 5)];
      // "1i" and "+ 0j" are not how a vector is written on a paper.
      const show = (a) => {
        const names = ["i", "j", "k"];
        let out = "";
        a.forEach((v, i) => {
          if (v === 0) return;
          const mag = Math.abs(v) === 1 ? "" : Math.abs(v);
          out += out === "" ? (v < 0 ? "−" : "") + mag + names[i]
                            : (v < 0 ? " − " : " + ") + mag + names[i];
        });
        return out || "0";
      };
      if (d === 1) {
        const a = v(), b = v();
        const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        return { q: `a = ${show(a)}\nb = ${show(b)}\nFind a · b.`,
          a: nf(dot),
          sol: [S(`a · b = ${nf(a[0])}(${nf(b[0])}) + ${nf(a[1])}(${nf(b[1])}) + ${nf(a[2])}(${nf(b[2])})`, "M1"),
                S(nf(dot), "A1")] };
      }
      if (d === 2) {
        const a = v(), b = v();
        const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        const ma = Math.hypot(...a), mb = Math.hypot(...b);
        if (!ma || !mb) return { q: "a = 3i + 4j, b = 4i − 3j\nFind the angle between a and b.", a: "90°",
          sol: [S("a · b = 12 − 12 = 0", "M1"), S("cos θ = 0, so θ = 90°", "A1")] };
        // Parallel vectors can push the cosine a hair past ±1 in floating point.
        const cosT = Math.max(-1, Math.min(1, dot / (ma * mb)));
        const ang = Math.acos(cosT) * 180 / Math.PI;
        return { q: `a = ${show(a)}\nb = ${show(b)}\nFind the angle between a and b, correct to 1 decimal place.`,
          a: `${ang.toFixed(1)}°`,
          sol: [S(`a · b = ${nf(dot)}`, "M1"),
                S(`|a| = ${rad(a[0] * a[0] + a[1] * a[1] + a[2] * a[2])} = ${ma.toFixed(4)}, |b| = ${mb.toFixed(4)}`, "M1"),
                S(`cos θ = ${frac(nf(dot), (ma * mb).toFixed(4))}, θ = ${ang.toFixed(1)}°`, "A1")] };
      }
      const a = [ri(r, 1, 5), ri(r, 1, 5), ri(r, 1, 5)];
      const b0 = ri(r, 1, 4), b1 = ri(r, 1, 4);
      const bShow = `${b0 === 1 ? "" : b0}i + ${b1 === 1 ? "" : b1}j + λk`;
      const lam = -(a[0] * b0 + a[1] * b1) / a[2];
      const scaled = Number.isInteger(lam) ? lam : null;
      const b2 = scaled !== null ? scaled : 1;
      return { q: `a = ${show(a)}\nb = ${bShow}\nFind the value of λ for which a and b are perpendicular,\nand explain what the scalar product tells you about the angle\nbetween two vectors when it is negative.`,
        a: `λ = ${scaled !== null ? nf(scaled) : frac(nf(-(a[0] * b0 + a[1] * b1)), a[2])}`,
        sol: [S(`Perpendicular means a · b = 0`, "M1"),
              S(`${a[0]}(${b0}) + ${a[1]}(${b1}) + ${a[2] === 1 ? "" : a[2]}λ = 0`, "M1"),
              S(`λ = ${scaled !== null ? nf(scaled) : frac(nf(-(a[0] * b0 + a[1] * b1)), a[2])}`, "A1"),
              S(`A negative scalar product means cos θ < 0, so the angle is obtuse`, "B1")] };
    }
  },

  lineIntersection: {
    name: "Intersection of two lines", grades: [11, 12],
    gen(r, d) {
      if (d === 1) {
        const m1 = ri(r, 1, 4), c1 = ri(r, -6, 6);
        const m2 = m1 + ri(r, 1, 4), x = ri(r, -4, 4);
        const c2 = m1 * x + c1 - m2 * x;
        return { q: `Find the point where the lines y = ${nf(m1)}x ${c1 < 0 ? "− " + -c1 : "+ " + c1}\nand y = ${nf(m2)}x ${c2 < 0 ? "− " + -c2 : "+ " + c2} meet.`,
          a: `(${nf(x)}, ${nf(m1 * x + c1)})`,
          sol: [S(`${nf(m1)}x ${c1 < 0 ? "− " + -c1 : "+ " + c1} = ${nf(m2)}x ${c2 < 0 ? "− " + -c2 : "+ " + c2}`, "M1"),
                S(`x = ${nf(x)}`, "M1"),
                S(`y = ${nf(m1 * x + c1)}, so the point is (${nf(x)}, ${nf(m1 * x + c1)})`, "A1")] };
      }
      // 3D lines built so they really do meet at a chosen point.
      const P = [ri(r, -4, 4), ri(r, -4, 4), ri(r, -4, 4)];
      const d1v = [ri(r, 1, 3), ri(r, -3, 3), ri(r, 1, 3)];
      // The second direction must not be parallel to the first, or the lines
      // coincide and there is no angle between them to find.
      let d2v = [ri(r, -3, 3), ri(r, 1, 3), ri(r, 1, 3)];
      for (let i = 0; i < 20 && d1v[0] * d2v[1] - d1v[1] * d2v[0] === 0
           && d1v[1] * d2v[2] - d1v[2] * d2v[1] === 0; i++)
        d2v = [ri(r, -3, 3), ri(r, 1, 3), ri(r, 1, 3)];
      if (d1v[0] * d2v[1] - d1v[1] * d2v[0] === 0
          && d1v[1] * d2v[2] - d1v[2] * d2v[1] === 0) d2v = [d1v[2], d1v[0], -d1v[1] - 1];
      const s = ri(r, 1, 3), t = ri(r, 1, 3);
      const A = P.map((p, i) => p - s * d1v[i]);
      const B = P.map((p, i) => p - t * d2v[i]);
      const vec = (a) => `(${a.map(nf).join(", ")})`;
      if (d === 2)
        return { q: `Line l₁ passes through A${vec(A)} with direction ${vec(d1v)}.\nLine l₂ passes through B${vec(B)} with direction ${vec(d2v)}.\nShow that the lines intersect and find the point of intersection.`,
          a: vec(P),
          sol: [S(`Write both lines in parametric form and equate the x and y components`, "M1"),
                S(`Solving gives s = ${s}, t = ${t}`, "M1"),
                S(`The z components agree, so the lines meet at ${vec(P)}`, "A1")] };
      const dot = d1v[0] * d2v[0] + d1v[1] * d2v[1] + d1v[2] * d2v[2];
      const ang = Math.acos(Math.abs(dot) / (Math.hypot(...d1v) * Math.hypot(...d2v))) * 180 / Math.PI;
      return { q: `Line l₁ passes through A${vec(A)} with direction ${vec(d1v)}.\nLine l₂ passes through B${vec(B)} with direction ${vec(d2v)}.\n(i) Show that l₁ and l₂ intersect, and find the point of intersection.\n(ii) Find the acute angle between the lines, correct to 1 decimal place.\n(iii) Explain what it would have meant if no solution had been found.`,
        a: `${vec(P)}; ${ang.toFixed(1)}°`,
        sol: [S(`Equating components gives s = ${s}, t = ${t}, consistent in all three`, "M1"),
              S(`Point of intersection ${vec(P)}`, "A1"),
              S(`cos θ = ${frac(`|${nf(dot)}|`, (Math.hypot(...d1v) * Math.hypot(...d2v)).toFixed(4))}, θ = ${ang.toFixed(1)}°`, "A1"),
              S(`Inconsistent equations would mean the lines are skew — not parallel, but never meeting`, "B1")] };
    }
  },

  separableDE: {
    name: "Differential equations and separating the variables", grades: [11, 12],
    gen(r, d) {
      if (d === 1) {
        const k = ri(r, 2, 6);
        return { q: `Find the general solution of ${frac("dy", "dx")} = ${k}y`,
          a: `y = Ae${sup(k + "x")}`,
          sol: [S(`Separate: ${frac("1", "y")} dy = ${k} dx`, "M1"),
                S(`Integrate: ln y = ${k}x + c`, "M1"),
                S(`y = Ae${sup(k + "x")}, where A = e${sup("c")}`, "A1")] };
      }
      if (d === 2) {
        const k = ri(r, 2, 5), y0 = ri(r, 2, 8);
        return { q: `${frac("dy", "dx")} = ${k}xy, and y = ${y0} when x = 0.\nFind y in terms of x.`,
          a: `y = ${y0}e^(${frac(k, 2)} x${sup(2)})`,
          sol: [S(`Separate: ${frac("1", "y")} dy = ${k}x dx`, "M1"),
                S(`ln y = ${frac(k, 2)}x${sup(2)} + c`, "M1"),
                S(`x = 0, y = ${y0} gives c = ln ${y0}`, "M1"),
                S(`y = ${y0}e^(${frac(k, 2)}x${sup(2)})`, "A1")] };
      }
      const k = ri(r, 2, 8), N0 = pick(r, [100, 200, 500, 1000]);
      return { q: `A population N grows so that its rate of increase is proportional\nto the population, with constant of proportionality ${frac(1, k)}.\n(i) Write down a differential equation for ${frac("dN", "dt")}.\n(ii) Given N = ${N0} when t = 0, solve it to find N in terms of t.\n(iii) Find the time taken for the population to double,\ncorrect to 2 decimal places.`,
        a: `N = ${N0}e^(${frac("t", k)}); t = ${(k * Math.log(2)).toFixed(2)}`,
        sol: [S(`${frac("dN", "dt")} = ${frac(1, k)}N`, "M1"),
              S(`Separate and integrate: ln N = ${frac("t", k)} + c`, "M1"),
              S(`t = 0, N = ${N0} gives N = ${N0}e^(${frac("t", k)})`, "A1"),
              S(`Doubling: e^(${frac("t", k)}) = 2, t = ${k} ln 2 = ${(k * Math.log(2)).toFixed(2)}`, "A1")] };
    }
  },

  definiteIntegral: {
    name: "Definite integrals and area under a curve", grades: [11, 12],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 1, 4), b = ri(r, 0, 5);
        const lo = ri(r, 0, 2), hi = lo + ri(r, 1, 3);
        const F = (x) => (a * x * x * x) / 3 + (b * x * x) / 2;
        const val = F(hi) - F(lo);
        return { q: `Evaluate ∫ from ${lo} to ${hi} of ${poly([[a, 2], [b, 1]])} dx`,
          a: money(val),
          sol: [S(`∫ = ${frac(a, 3)}x${sup(3)} + ${frac(b, 2)}x${sup(2)}`, "M1"),
                S(`Substitute the limits ${hi} and ${lo}`, "M1"),
                S(money(val), "A1")] };
      }
      if (d === 2) {
        const a = ri(r, 1, 4), root = ri(r, 2, 5);
        // y = a x (root − x), area between 0 and root
        const area = (a * root * root * root) / 6;
        return { q: `The curve y = ${a === 1 ? "" : a}x(${root} − x) meets the x-axis at x = 0 and x = ${root}.\nFind the exact area enclosed between the curve and the x-axis.`,
          a: money(area),
          sol: [S(`Area = ∫ from 0 to ${root} of ${poly([[a * root, 1], [-a, 2]])} dx`, "M1"),
                S(`= [${frac(a * root, 2)}x${sup(2)} − ${frac(a, 3)}x${sup(3)}] from 0 to ${root}`, "M1"),
                S(money(area), "A1")] };
      }
      const m = ri(r, 1, 4), k = ri(r, 1, 5);
      // Curve y = x², line y = m x + k; area between them.
      const disc = m * m + 4 * k;
      const rt = Math.sqrt(disc);
      const x1 = (m - rt) / 2, x2 = (m + rt) / 2;
      const area = (Math.pow(x2 - x1, 3)) / 6;
      return { q: `The curve y = x${sup(2)} and the line y = ${m === 1 ? "" : m}x + ${k} intersect at two points.\n(i) Find the x-coordinates of the points of intersection,\ncorrect to 3 decimal places.\n(ii) Find the area of the region enclosed between the line and the curve,\ncorrect to 3 decimal places.`,
        a: `x = ${nf(x1.toFixed(3))} and ${nf(x2.toFixed(3))}; area ${area.toFixed(3)}`,
        sol: [S(`x${sup(2)} = ${m === 1 ? "" : m}x + ${k}, so x${sup(2)} − ${m === 1 ? "" : m}x − ${k} = 0`, "M1"),
              S(`x = ${nf(x1.toFixed(3))} or ${nf(x2.toFixed(3))}`, "A1"),
              S(`Area = ∫ (line − curve) dx between the roots`, "M1"),
              S(`= ${frac(`(x₂ − x₁)${sup(3)}`, 6)} = ${area.toFixed(3)}`, "A1")] };
    }
  },

  naturalExpLog: {
    name: "The number e, and differentiating eˣ and ln x", grades: [11, 12],
    gen(r, d) {
      if (d === 1) {
        const k = ri(r, 2, 6);
        return { q: `Differentiate  y = e${sup(k + "x")} + ${k} ln x`,
          a: `${frac("dy", "dx")} = ${k}e${sup(k + "x")} + ${frac(k, "x")}`,
          sol: [S(`${frac("d", "dx")}(e${sup("kx")}) = k e${sup("kx")}`, "M1"),
                S(`${frac("d", "dx")}(ln x) = ${frac(1, "x")}`, "M1"),
                S(`${k}e${sup(k + "x")} + ${frac(k, "x")}`, "A1")] };
      }
      if (d === 2) {
        const a = ri(r, 2, 5), b = ri(r, 1, 6);
        return { q: `Differentiate  y = e^(${a}x${sup(2)} + ${b})  with respect to x.`,
          a: `${frac("dy", "dx")} = ${2 * a}x e${sup(`${a}x²+${b}`)}`,
          sol: [S(`Chain rule: let u = ${a}x${sup(2)} + ${b}`, "M1"),
                S(`${frac("du", "dx")} = ${2 * a}x and ${frac("dy", "du")} = e${sup("u")}`, "M1"),
                S(`${frac("dy", "dx")} = ${2 * a}x e${sup(`${a}x²+${b}`)}`, "A1")] };
      }
      // y = xⁿ ln x has its stationary point at x = e^(−1/n).
      const n = ri(r, 2, 5);
      return { q: `The curve y = x${sup(n)} ln x is defined for x > 0.\n(i) Find ${frac("dy", "dx")}.\n(ii) Find the exact x-coordinate of the stationary point.\n(iii) Determine whether it is a maximum or a minimum.`,
        a: `${frac("dy", "dx")} = ${n}x${sup(n - 1)} ln x + x${sup(n - 1)}; x = e^(−${frac(1, n)})`,
        sol: [S(`Product rule: ${frac("dy", "dx")} = ${n}x${sup(n - 1)} ln x + x${sup(n)} × ${frac(1, "x")} = x${sup(n - 1)}(${n} ln x + 1)`, "M1"),
              S(`x > 0, so ${n} ln x + 1 = 0 and ln x = −${frac(1, n)}`, "M1"),
              S(`x = e^(−${frac(1, n)}) ≈ ${Math.exp(-1 / n).toFixed(4)}`, "A1"),
              S(`${frac("dy", "dx")} changes from negative to positive there, so it is a minimum`, "A1")] };
    }
  },

  diffTrigFns: {
    name: "Differentiating trigonometric functions", grades: [11, 12],
    gen(r, d) {
      const k = ri(r, 2, 6);
      if (d === 1)
        return { q: `Differentiate  y = sin ${k}x − cos ${k}x`,
          a: `${frac("dy", "dx")} = ${k} cos ${k}x + ${k} sin ${k}x`,
          sol: [S(`${frac("d", "dx")}(sin kx) = k cos kx`, "M1"),
                S(`${frac("d", "dx")}(cos kx) = −k sin kx`, "M1"),
                S(`${k} cos ${k}x + ${k} sin ${k}x`, "A1")] };
      if (d === 2)
        return { q: `Differentiate  y = tan ${k}x  and  y = x sin x,\nnaming the rule you use each time.`,
          a: `${k} sec${sup(2)} ${k}x; sin x + x cos x`,
          sol: [S(`Chain rule: ${frac("d", "dx")}(tan ${k}x) = ${k} sec${sup(2)} ${k}x`, "A1"),
                S(`Product rule on x sin x: (1)(sin x) + (x)(cos x)`, "M1"),
                S(`sin x + x cos x`, "A1")] };
      return { q: `y = tan⁻¹(${k}x)\n(i) Find ${frac("dy", "dx")}.\n(ii) Find the gradient of the curve at x = 0.\n(iii) Explain why the gradient is always positive.`,
        a: `${frac("dy", "dx")} = ${frac(k, `1 + ${k * k}x${sup(2)}`)}; gradient ${k} at x = 0`,
        sol: [S(`${frac("d", "dx")}(tan⁻¹u) = ${frac(1, `1 + u${sup(2)}`)} × ${frac("du", "dx")}`, "M1"),
              S(`u = ${k}x, so ${frac("dy", "dx")} = ${frac(k, `1 + ${k * k}x${sup(2)}`)}`, "A1"),
              S(`At x = 0 the gradient is ${k}`, "A1"),
              S(`1 + ${k * k}x${sup(2)} > 0 for all x and ${k} > 0, so the gradient is always positive`, "B1")] };
    }
  },

  implicitDiff: {
    name: "Differentiating implicit equations", grades: [11, 12],
    gen(r, d) {
      if (d === 1) {
        const rr = ri(r, 2, 8);
        return { q: `A circle has equation x${sup(2)} + y${sup(2)} = ${rr * rr}.\nUse implicit differentiation to find ${frac("dy", "dx")}.`,
          a: frac("−x", "y"),
          sol: [S(`Differentiate term by term: 2x + 2y${frac("dy", "dx")} = 0`, "M1"),
                S(`2y${frac("dy", "dx")} = −2x`, "M1"),
                S(frac("−x", "y"), "A1")] };
      }
      if (d === 2) {
        const a = ri(r, 1, 4), c = ri(r, 2, 9);
        return { q: `x${sup(2)} + ${a === 1 ? "" : a}xy + y${sup(2)} = ${c}\nFind ${frac("dy", "dx")} in terms of x and y.`,
          a: frac(`−(2x + ${a === 1 ? "" : a}y)`, `${a === 1 ? "" : a}x + 2y`),
          sol: [S(`Differentiate: 2x + ${a === 1 ? "" : a}(y + x${frac("dy", "dx")}) + 2y${frac("dy", "dx")} = 0`, "M1"),
                S(`Collect the ${frac("dy", "dx")} terms: (${a === 1 ? "" : a}x + 2y)${frac("dy", "dx")} = −(2x + ${a === 1 ? "" : a}y)`, "M1"),
                S(frac(`−(2x + ${a === 1 ? "" : a}y)`, `${a === 1 ? "" : a}x + 2y`), "A1")] };
      }
      const t = pick(r, [[3, 4, 5], [6, 8, 10], [5, 12, 13]]);
      const rr = t[2];
      return { q: `The curve x${sup(2)} + y${sup(2)} = ${rr * rr} passes through P(${t[0]}, ${t[1]}).\n(i) Find the gradient of the curve at P.\n(ii) Find the equation of the tangent at P.\n(iii) Show that the tangent is perpendicular to OP.`,
        a: `Gradient ${frac(nf(-t[0]), t[1])}; ${t[0]}x + ${t[1]}y = ${rr * rr}`,
        sol: [S(`${frac("dy", "dx")} = ${frac("−x", "y")}, so at P the gradient is ${frac(nf(-t[0]), t[1])}`, "M1"),
              S(`y − ${t[1]} = ${frac(nf(-t[0]), t[1])}(x − ${t[0]})`, "M1"),
              S(`${t[0]}x + ${t[1]}y = ${rr * rr}`, "A1"),
              S(`OP has gradient ${frac(t[1], t[0])}; ${frac(t[1], t[0])} × ${frac(nf(-t[0]), t[1])} = −1, so they are perpendicular`, "A1")] };
    }
  },

  recogniseIntegrals: {
    name: "Recognising integrals", grades: [11, 12],
    gen(r, d) {
      if (d === 1) {
        const a = ri(r, 2, 6), b = ri(r, 1, 8);
        return { q: `Find  ∫ ${frac(`${2 * a}x`, `${a}x${sup(2)} + ${b}`)} dx`,
          a: `ln|${a}x${sup(2)} + ${b}| + c`,
          sol: [S(`The numerator is the derivative of the denominator`, "M1"),
                S(`∫${frac("f′(x)", "f(x)")} dx = ln|f(x)| + c`, "M1"),
                S(`ln|${a}x${sup(2)} + ${b}| + c`, "A1")] };
      }
      if (d === 2) {
        const a = ri(r, 2, 5), b = ri(r, 1, 6);
        return { q: `Find  ∫ e${sup(`${a}x+${b}`)} dx  and  ∫ ${frac(1, `${a}x + ${b}`)} dx`,
          a: `${frac(1, a)}e${sup(`${a}x+${b}`)} + c;  ${frac(1, a)}ln|${a}x + ${b}| + c`,
          sol: [S(`Reverse the chain rule: divide by the derivative of the bracket, ${a}`, "M1"),
                S(`${frac(1, a)}e${sup(`${a}x+${b}`)} + c`, "A1"),
                S(`${frac(1, a)}ln|${a}x + ${b}| + c`, "A1")] };
      }
      const a = ri(r, 2, 5);
      return { q: `(i) Find ∫ ${frac(`sin ${a}x`, `cos ${a}x`)} dx, explaining how you recognise it.\n(ii) Hence evaluate ∫ from 0 to ${frac("π", 4 * a)} of ${frac(`sin ${a}x`, `cos ${a}x`)} dx,\ngiving your answer in an exact form.`,
        a: `−${frac(1, a)} ln|cos ${a}x| + c;  ${frac(1, 2 * a)} ln 2`,
        sol: [S(`The numerator is −${frac(1, a)} × the derivative of cos ${a}x`, "M1"),
              S(`∫ = −${frac(1, a)} ln|cos ${a}x| + c`, "A1"),
              S(`At the limits: −${frac(1, a)}[ln cos ${frac("π", 4)} − ln 1] = −${frac(1, a)} ln ${frac(1, rad(2))}`, "M1"),
              S(`= ${frac(1, 2 * a)} ln 2`, "A1")] };
    }
  },

  // ---------- Complex numbers ----------

  complexArithmetic: {
    name: "Complex numbers and their arithmetic", grades: [12],
    gen(r, d) {
      const cx = cplx;
      const a = ri(r, -6, 6), b = ri(r, 1, 6) * (r() < 0.5 ? -1 : 1);
      const c = ri(r, -6, 6), e = ri(r, 1, 6) * (r() < 0.5 ? -1 : 1);
      if (d === 1)
        return { q: `z₁ = ${cx(a, b)} and z₂ = ${cx(c, e)}\nFind z₁ + z₂ and z₁ − z₂.`,
          a: `${cx(a + c, b + e)} and ${cx(a - c, b - e)}`,
          sol: [S(`Add the real parts and the imaginary parts separately`, "M1"),
                S(`z₁ + z₂ = ${cx(a + c, b + e)}`, "A1"),
                S(`z₁ − z₂ = ${cx(a - c, b - e)}`, "A1")] };
      if (d === 2)
        return { q: `z₁ = ${cx(a, b)} and z₂ = ${cx(c, e)}\nFind z₁z₂, using i${sup(2)} = −1.`,
          a: cx(a * c - b * e, a * e + b * c),
          sol: [S(`Expand: (${nf(a)})(${nf(c)}) + (${nf(a)})(${nf(e)})i + (${nf(b)})(${nf(c)})i + (${nf(b)})(${nf(e)})i${sup(2)}`, "M1"),
                S(`i${sup(2)} = −1, so the last term is ${nf(-b * e)}`, "M1"),
                S(cx(a * c - b * e, a * e + b * c), "A1")] };
      const den = c * c + e * e;
      const rn = a * c + b * e, im = b * c - a * e;
      // Each part is cancelled against the denominator on its own: ⁅0/5⁆ is 0,
      // and ⁅5/5⁆ is 1, neither of which belongs on a printed answer.
      const part = (num) => {
        if (num === 0) return "0";
        const g = gcd(Math.abs(num), den);
        return g === den ? nf(num / den) : frac(nf(num / g), den / g);
      };
      const xPart = part(rn), yPart = part(im);
      // A coefficient of exactly 1 disappears in front of i.
      const withI = (t) => (t === "1" ? "i" : `${t}i`);
      const ans = im === 0 ? xPart
        : rn === 0 ? (im < 0 ? "−" + withI(part(-im)) : withI(yPart))
        : `${xPart} ${im < 0 ? "− " + withI(part(-im)) : "+ " + withI(yPart)}`;
      return { q: `z₁ = ${cx(a, b)} and z₂ = ${cx(c, e)}\nExpress ${frac("z₁", "z₂")} in the form x + iy, giving x and y as exact fractions.\nState the conjugate you multiplied by and explain why it works.`,
        a: ans,
        sol: [S(`Multiply top and bottom by the conjugate ${cx(c, -e)}`, "M1"),
              S(`Denominator: (${nf(c)})${sup(2)} + (${nf(e)})${sup(2)} = ${den}, a real number`, "M1"),
              S(`Numerator: ${cplx(rn, im)}`, "M1"),
              S(ans, "A1")] };
    }
  },

  argandDiagram: {
    name: "The complex plane, modulus and argument", grades: [12],
    gen(r, d) {
      const cx = cplx;
      if (d === 1) {
        const t = pick(r, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]]);
        const a = t[0] * (r() < 0.5 ? -1 : 1), b = t[1] * (r() < 0.5 ? -1 : 1);
        return { q: `z = ${cx(a, b)}\nShow z on an Argand diagram and find |z|.`,
          a: String(t[2]),
          sol: [S(`Plot the point (${nf(a)}, ${nf(b)})`, "M1"),
                S(`|z| = ${rad(`${Math.abs(a)}${sup(2)} + ${Math.abs(b)}${sup(2)}`)} = ${rad(t[2] * t[2])}`, "M1"),
                S(String(t[2]), "A1")] };
      }
      if (d === 2) {
        const CASES = [[1, 1, `${rad(2)}`, `${frac("π", 4)}`], [-1, 1, `${rad(2)}`, `${frac("3π", 4)}`],
          [-1, -1, `${rad(2)}`, `−${frac("3π", 4)}`], [1, -1, `${rad(2)}`, `−${frac("π", 4)}`],
          [0, 2, "2", `${frac("π", 2)}`], [-3, 0, "3", "π"], [2, 0, "2", "0"]];
        const c = pick(r, CASES);
        return { q: `z = ${cx(c[0], c[1])}\nFind |z| and arg z, giving arg z in radians in the interval −π < arg z ≤ π.`,
          a: `|z| = ${c[2]}, arg z = ${c[3]}`,
          sol: [S(`|z| = ${rad(`${Math.abs(c[0])}${sup(2)} + ${Math.abs(c[1])}${sup(2)}`)} = ${c[2]}`, "M1"),
                S(`The point lies in the ${c[0] >= 0 && c[1] >= 0 ? "first" : c[0] < 0 && c[1] >= 0 ? "second" : c[0] < 0 ? "third" : "fourth"} quadrant`, "M1"),
                S(`arg z = ${c[3]}`, "A1")] };
      }
      const modA = ri(r, 2, 5), modB = ri(r, 2, 5);
      const gm = gcd(modA, modB);
      const quotMod = modB / gm === 1 ? String(modA / gm) : frac(modA / gm, modB / gm);
      return { q: `z₁ has modulus ${modA} and argument ${frac("π", 3)}.\nz₂ has modulus ${modB} and argument ${frac("π", 6)}.\n(i) Write z₁ in the polar form r(cos θ + i sin θ).\n(ii) Find the modulus and argument of z₁z₂ and of ${frac("z₁", "z₂")}.\n(iii) State the rule you used for each.`,
        a: `|z₁z₂| = ${modA * modB}, arg = ${frac("π", 2)}; |z₁/z₂| = ${quotMod}, arg = ${frac("π", 6)}`,
        sol: [S(`z₁ = ${modA}(cos ${frac("π", 3)} + i sin ${frac("π", 3)})`, "A1"),
              S(`Multiplying multiplies the moduli and adds the arguments`, "M1"),
              S(`|z₁z₂| = ${modA * modB}, arg(z₁z₂) = ${frac("π", 3)} + ${frac("π", 6)} = ${frac("π", 2)}`, "A1"),
              S(`Dividing divides the moduli and subtracts the arguments: ${quotMod} and ${frac("π", 6)}`, "A1")] };
    }
  },

  complexRoots: {
    name: "Solving equations with complex roots", grades: [12],
    gen(r, d) {
      const cx = cplx;
      if (d === 1) {
        const k = ri(r, 1, 9);
        return { q: `Solve  z${sup(2)} + ${k * k} = 0`,
          a: `z = ${k}i or z = ${nf(-k)}i`,
          sol: [S(`z${sup(2)} = ${nf(-k * k)}`, "M1"),
                S(`z = ±${rad(`−${k * k}`)} = ±${k}i`, "A1")] };
      }
      if (d === 2) {
        // Roots p ± qi ⇒ z² − 2p z + (p² + q²) = 0
        const p = ri(r, -5, 5), q = ri(r, 1, 5);
        return { q: `Solve  ${poly([[1, 2], [-2 * p, 1], [p * p + q * q, 0]]).replace(/x/g, "z")} = 0,\ngiving your answers in the form x + iy.`,
          a: `z = ${cx(p, q)} or z = ${cx(p, -q)}`,
          sol: [S(`Discriminant = ${nf(4 * p * p)} − 4(${p * p + q * q}) = ${nf(-4 * q * q)} < 0, so the roots are complex`, "M1"),
                S(`z = ${frac(`${nf(2 * p)} ± ${rad(nf(-4 * q * q))}`, 2)}`, "M1"),
                S(`z = ${cx(p, q)} or ${cx(p, -q)}`, "A1")] };
      }
      const p = ri(r, -4, 4), q = ri(r, 1, 4), s = ri(r, 1, 6) * (r() < 0.5 ? -1 : 1);
      // (z − s)(z² − 2p z + p² + q²)
      const c2 = -2 * p - s, c1 = p * p + q * q + 2 * p * s, c0 = -s * (p * p + q * q);
      return { q: `The cubic equation ${poly([[1, 3], [c2, 2], [c1, 1], [c0, 0]]).replace(/x/g, "z")} = 0\nhas one real root z = ${nf(s)}.\n(i) Find the other two roots in the form x + iy.\n(ii) Explain why they must be a conjugate pair.`,
        a: `${cx(p, q)} and ${cx(p, -q)}`,
        sol: [S(`Divide by (z ${s < 0 ? "+ " + -s : "− " + s}) to get ${poly([[1, 2], [-2 * p, 1], [p * p + q * q, 0]]).replace(/x/g, "z")}`, "M1"),
              S(`Solve the quadratic: z = ${cx(p, q)} or ${cx(p, -q)}`, "A1"),
              S(`The coefficients are real, so non-real roots occur in conjugate pairs`, "B1")] };
    }
  },

  complexLoci: {
    name: "Loci in the complex plane", grades: [12],
    gen(r, d) {
      const cx = cplx;
      const a = ri(r, -5, 5), b = ri(r, -5, 5), k = ri(r, 1, 6);
      if (d === 1)
        return { q: `Describe the locus of points z in the Argand diagram for which\n|z − (${cx(a, b)})| = ${k}`,
          a: `A circle of radius ${k}, centre (${nf(a)}, ${nf(b)})`,
          sol: [S(`|z − w| is the distance from z to the point w`, "M1"),
                S(`Every such z is ${k} from (${nf(a)}, ${nf(b)}) — a circle of radius ${k}`, "A1")] };
      if (d === 2) {
        const c = ri(r, -5, 5), e = ri(r, -5, 5);
        return { q: `Describe the locus of points z for which\n|z − (${cx(a, b)})| = |z − (${cx(c, e)})|`,
          a: `The perpendicular bisector of the line joining (${nf(a)}, ${nf(b)}) and (${nf(c)}, ${nf(e)})`,
          sol: [S(`z is the same distance from both points`, "M1"),
                S(`The set of such points is the perpendicular bisector of the segment joining them`, "M1"),
                S(`It passes through the midpoint (${nf((a + c) / 2)}, ${nf((b + e) / 2)})`, "A1")] };
      }
      return { q: `On one Argand diagram, sketch the loci\n(i) |z − (${cx(a, b)})| = ${k}\n(ii) arg(z − (${cx(a, b)})) = ${frac("π", 4)}\nDescribe each locus, and find the point where they meet.`,
        a: `A circle radius ${k} centre (${nf(a)}, ${nf(b)}), and a half-line at ${frac("π", 4)} from that centre`,
        sol: [S(`(i) A circle of radius ${k}, centre (${nf(a)}, ${nf(b)})`, "B1"),
              S(`(ii) A half-line from (${nf(a)}, ${nf(b)}) — the point itself excluded — at ${frac("π", 4)} to the positive real direction`, "B1"),
              S(`They meet where the half-line leaves the circle, at a distance ${k} along it`, "M1"),
              S(`(${nf(a)} + ${frac(`${k}${rad(2)}`, 2)}, ${nf(b)} + ${frac(`${k}${rad(2)}`, 2)})`, "A1")] };
    }
  },

  // ---------- Probability & Statistics 2 ----------

  binomialDistribution: {
    name: "The binomial distribution", grades: [11, 12],
    gen(r, d) {
      const nCr = (n, k) => {
        let v = 1;
        for (let i = 0; i < k; i++) v = (v * (n - i)) / (i + 1);
        return Math.round(v);
      };
      const n = ri(r, 5, 12);
      const den = pick(r, [2, 4, 5, 10]);
      const num = ri(r, 1, den - 1);
      const p = num / den;
      if (d === 1) {
        const k = ri(r, 1, n - 1);
        const prob = nCr(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
        return { q: `X ~ B(${n}, ${frac(num, den)})\nFind P(X = ${k}), correct to 4 decimal places.`,
          a: prob.toFixed(4),
          sol: [S(`P(X = ${k}) = ${n}C${k} × (${frac(num, den)})${sup(k)} × (${frac(den - num, den)})${sup(n - k)}`, "M1"),
                S(`${n}C${k} = ${nCr(n, k)}`, "M1"),
                S(prob.toFixed(4), "A1")] };
      }
      if (d === 2) {
        const p0 = Math.pow(1 - p, n);
        const p1 = n * p * Math.pow(1 - p, n - 1);
        return { q: `X ~ B(${n}, ${frac(num, den)})\nFind P(X ≥ 2), correct to 4 decimal places.`,
          a: (1 - p0 - p1).toFixed(4),
          sol: [S(`P(X ≥ 2) = 1 − P(X = 0) − P(X = 1)`, "M1"),
                S(`P(X = 0) = ${p0.toFixed(4)}, P(X = 1) = ${p1.toFixed(4)}`, "M1"),
                S((1 - p0 - p1).toFixed(4), "A1")] };
      }
      const mean = n * p, varr = n * p * (1 - p);
      return { q: `A fair spinner lands on red with probability ${frac(num, den)}.\nIt is spun ${n} times and X is the number of reds.\n(i) State the two conditions that make X binomial.\n(ii) Find E(X) and Var(X).\n(iii) Find the most likely number of reds, justifying your answer.`,
        a: `E(X) = ${money(mean)}, Var(X) = ${money(varr)}`,
        sol: [S(`Fixed number of independent trials, each with the same probability of success`, "B1"),
              S(`E(X) = np = ${n} × ${frac(num, den)} = ${money(mean)}`, "A1"),
              S(`Var(X) = np(1 − p) = ${money(varr)}`, "A1"),
              S(`The mode is the value of k where P(X = k) is greatest — near ${Math.floor(mean + p)}`, "M1")] };
    }
  },

  geometricDistribution: {
    name: "The geometric distribution", grades: [11, 12],
    gen(r, d) {
      const den = pick(r, [2, 3, 4, 5, 6, 10]);
      const num = ri(r, 1, den - 1);
      const p = num / den, q = 1 - p;
      if (d === 1) {
        const k = ri(r, 2, 5);
        const prob = Math.pow(q, k - 1) * p;
        return { q: `X ~ Geo(${frac(num, den)})\nFind P(X = ${k}), giving your answer correct to 4 decimal places.`,
          a: prob.toFixed(4),
          sol: [S(`P(X = ${k}) = q${sup(k - 1)}p`, "M1"),
                S(`= (${frac(den - num, den)})${sup(k - 1)} × ${frac(num, den)}`, "M1"),
                S(prob.toFixed(4), "A1")] };
      }
      if (d === 2) {
        const k = ri(r, 2, 6);
        return { q: `X ~ Geo(${frac(num, den)})\nFind P(X > ${k}), and explain in words what this probability means.`,
          a: Math.pow(q, k).toFixed(4),
          sol: [S(`P(X > ${k}) = q${sup(k)} — the first ${k} trials all fail`, "M1"),
                S(`= (${frac(den - num, den)})${sup(k)} = ${Math.pow(q, k).toFixed(4)}`, "A1"),
                S(`It is the probability that the first success comes after the ${ordinalWord(k)} trial`, "B1")] };
      }
      let k = 1;
      while (1 - Math.pow(q, k) < 0.9 && k < 200) k++;
      return { q: `The probability that a machine produces a faulty item is ${frac(num, den)}.\nItems are tested one at a time until the first faulty one is found.\n(i) Write down the distribution of X, the number tested.\n(ii) Find E(X).\n(iii) Find the smallest n for which P(X ≤ n) > 0.9.`,
        a: `X ~ Geo(${frac(num, den)}); E(X) = ${money(1 / p)}; n = ${k}`,
        sol: [S(`X ~ Geo(${frac(num, den)})`, "B1"),
              S(`E(X) = ${frac(1, "p")} = ${money(1 / p)}`, "A1"),
              S(`P(X ≤ n) = 1 − q${sup("n")} > 0.9, so q${sup("n")} < 0.1`, "M1"),
              S(`n > ${frac("ln 0.1", `ln ${money(q)}`)}, giving n = ${k}`, "A1")] };
    }
  },

  poissonDistribution: {
    name: "The Poisson distribution", grades: [12],
    gen(r, d) {
      const fact = (n) => { let v = 1; for (let i = 2; i <= n; i++) v *= i; return v; };
      const lam = pick(r, [1.5, 2, 2.5, 3, 3.5, 4, 5]);
      if (d === 1) {
        const k = ri(r, 0, 4);
        const prob = (Math.exp(-lam) * Math.pow(lam, k)) / fact(k);
        return { q: `X ~ Po(${lam})\nFind P(X = ${k}), correct to 4 decimal places.`,
          a: prob.toFixed(4),
          sol: [S(`P(X = ${k}) = ${frac(`e${sup("−λ")}λ${sup(k)}`, `${k}!`)}`, "M1"),
                S(`= ${frac(`e${sup("−" + lam)} × ${lam}${sup(k)}`, fact(k))}`, "M1"),
                S(prob.toFixed(4), "A1")] };
      }
      if (d === 2) {
        const mult = ri(r, 2, 4);
        const lam2 = lam * mult;
        const p0 = Math.exp(-lam2);
        return { q: `Calls arrive at a switchboard at an average rate of ${lam} per minute,\nand follow a Poisson distribution.\nFind the probability that no calls arrive in a ${mult}-minute period.`,
          a: p0.toFixed(4),
          sol: [S(`Over ${mult} minutes the mean is ${lam} × ${mult} = ${lam2}`, "M1"),
                S(`X ~ Po(${lam2}), so P(X = 0) = e${sup("−" + lam2)}`, "M1"),
                S(p0.toFixed(4), "A1")] };
      }
      const n = pick(r, [100, 150, 200, 250]);
      const p = pick(r, [0.01, 0.02, 0.03]);
      const l2 = n * p;
      const pl = Math.exp(-l2) * (1 + l2);
      return { q: `X ~ B(${n}, ${p}).\n(i) State the conditions under which a Poisson distribution is a\nsuitable approximation to a binomial one.\n(ii) Use a Poisson approximation to estimate P(X ≤ 1),\ncorrect to 4 decimal places.\n(iii) Y ~ Po(${l2}) and Z ~ Po(${money(l2 / 2)}) are independent.\nWrite down the distribution of Y + Z.`,
        a: `P(X ≤ 1) ≈ ${pl.toFixed(4)}; Y + Z ~ Po(${money(l2 * 1.5)})`,
        sol: [S(`n is large and p is small, so that np is moderate`, "B1"),
              S(`λ = np = ${n} × ${p} = ${l2}`, "M1"),
              S(`P(X ≤ 1) = e${sup("−" + l2)}(1 + ${l2}) = ${pl.toFixed(4)}`, "A1"),
              S(`Independent Poissons add: Y + Z ~ Po(${money(l2 * 1.5)})`, "A1")] };
    }
  },

  hypothesisTest: {
    name: "Hypothesis testing", grades: [12],
    gen(r, d) {
      if (d === 1) {
        const p0 = pick(r, [0.2, 0.25, 0.3, 0.4, 0.5]);
        const dir = pick(r, ["greater than", "less than", "different from"]);
        const sym = dir === "greater than" ? ">" : dir === "less than" ? "<" : "≠";
        return { q: `A researcher claims the proportion of learners who cycle to school\nis ${dir} ${p0}. A hypothesis test is to be carried out.\nWrite down the null and alternative hypotheses, and say whether\nthe test is one-tailed or two-tailed.`,
          a: `H₀: p = ${p0}, H₁: p ${sym} ${p0}; ${sym === "≠" ? "two" : "one"}-tailed`,
          sol: [S(`The null hypothesis always states no change: H₀: p = ${p0}`, "B1"),
                S(`H₁: p ${sym} ${p0}`, "B1"),
                S(`${sym === "≠" ? "Two-tailed — the alternative allows change in either direction" : "One-tailed — the alternative points one way"}`, "A1")] };
      }
      if (d === 2) {
        const p0 = pick(r, [0.2, 0.25, 0.3]);
        const sig = pick(r, [5, 10]);
        const pval = pick(r, [0.021, 0.037, 0.064, 0.083, 0.112]);
        const reject = pval < sig / 100;
        return { q: `A one-tailed test of H₀: p = ${p0} against H₁: p > ${p0} is carried\nout at the ${sig}% significance level. The p-value is ${pval}.\nState the conclusion of the test in context.`,
          a: reject ? "Reject H₀" : "Do not reject H₀",
          sol: [S(`Compare the p-value with the significance level: ${pval} ${reject ? "<" : ">"} ${sig / 100}`, "M1"),
                S(reject ? `Reject H₀` : `Do not reject H₀`, "A1"),
                S(reject ? `There is evidence at the ${sig}% level that the proportion has increased above ${p0}` : `There is insufficient evidence at the ${sig}% level that the proportion has increased above ${p0}`, "A1")] };
      }
      const lam = pick(r, [3, 4, 5, 6]);
      const obs = lam + ri(r, 4, 7);
      const fact = (n) => { let v = 1; for (let i = 2; i <= n; i++) v *= i; return v; };
      let tail = 0;
      for (let k = obs; k < obs + 40; k++) tail += (Math.exp(-lam) * Math.pow(lam, k)) / fact(k);
      const reject = tail < 0.05;
      return { q: `The number of faults in a length of cable follows a Poisson\ndistribution with mean ${lam}. After a change in the process, ${obs} faults\nare recorded in one length.\nTest at the 5% significance level whether the mean number of faults\nhas increased. State your hypotheses, the p-value and your conclusion.`,
        a: `p = ${tail.toFixed(4)}; ${reject ? "reject" : "do not reject"} H₀`,
        sol: [S(`H₀: λ = ${lam}, H₁: λ > ${lam}; X ~ Po(${lam}) under H₀`, "B1"),
              S(`p-value = P(X ≥ ${obs}) = ${tail.toFixed(4)}`, "M1"),
              S(`${tail.toFixed(4)} ${reject ? "<" : ">"} 0.05`, "M1"),
              S(reject ? `Reject H₀ — there is evidence the mean number of faults has increased` : `Do not reject H₀ — there is insufficient evidence of an increase`, "A1")] };
    }
  },

  typeErrors: {
    name: "Type I and Type II errors", grades: [12],
    gen(r, d) {
      const nCr = (n, k) => { let v = 1; for (let i = 0; i < k; i++) v = (v * (n - i)) / (i + 1); return Math.round(v); };
      if (d === 1) {
        const which = pick(r, ["I", "II"]);
        const CTX = pick(r, [
          "a test of whether a coin is biased towards heads",
          "a test of whether a new fertiliser increases yield",
          "a test of whether a machine's fault rate has fallen",
          "a test of whether a drug is more effective than the current one",
          "a test of whether a die is biased towards sixes"
        ]);
        return { q: `A researcher carries out ${CTX}.\nExplain what is meant by a Type ${which} error in this context,\nand state which probability measures it.`,
          a: which === "I" ? "Rejecting H₀ when H₀ is true" : "Not rejecting H₀ when H₀ is false",
          sol: [S(which === "I" ? `A Type I error is rejecting a true null hypothesis` : `A Type II error is failing to reject a false null hypothesis`, "B1"),
                S(which === "I" ? `Its probability is the significance level of the test` : `Its probability depends on the true value of the parameter, and is often written β`, "A1")] };
      }
      const n = pick(r, [10, 12, 15, 20]);
      const p0 = 0.5;
      // Critical region X ≥ c
      let c = Math.ceil(n * 0.7), alpha = 0;
      const tailFrom = (k, p) => {
        let s = 0;
        for (let i = k; i <= n; i++) s += nCr(n, i) * Math.pow(p, i) * Math.pow(1 - p, n - i);
        return s;
      };
      alpha = tailFrom(c, p0);
      if (d === 2)
        return { q: `X ~ B(${n}, ${p0}) under H₀. The critical region for a test of\nH₀: p = ${p0} against H₁: p > ${p0} is X ≥ ${c}.\nFind the probability of a Type I error.`,
          a: alpha.toFixed(4),
          sol: [S(`A Type I error is rejecting H₀ when it is true`, "M1"),
                S(`P(X ≥ ${c} | p = ${p0}) = ${alpha.toFixed(4)}`, "M1"),
                S(alpha.toFixed(4), "A1")] };
      const pTrue = pick(r, [0.6, 0.7, 0.75, 0.8]);
      const beta = 1 - tailFrom(c, pTrue);
      return { q: `A test of H₀: p = ${p0} against H₁: p > ${p0} uses X ~ B(${n}, p)\nand the critical region X ≥ ${c}.\n(i) Find the significance level of the test.\n(ii) Given that the true value is p = ${pTrue}, find the probability\nof a Type II error.\n(iii) Say how the two error probabilities change if the critical\nregion is widened to X ≥ ${c - 1}.`,
        a: `α = ${alpha.toFixed(4)}, β = ${beta.toFixed(4)}`,
        sol: [S(`Significance level = P(X ≥ ${c} | p = ${p0}) = ${alpha.toFixed(4)}`, "A1"),
              S(`A Type II error is not rejecting H₀ when p = ${pTrue}`, "M1"),
              S(`β = P(X ≤ ${c - 1} | p = ${pTrue}) = ${beta.toFixed(4)}`, "A1"),
              S(`Widening the critical region raises the Type I probability and lowers the Type II probability`, "B1")] };
    }
  },

  continuousRV: {
    name: "Continuous random variables", grades: [11, 12],
    gen(r, d) {
      const b = ri(r, 2, 6);
      if (d === 1)
        return { q: `The continuous random variable X has probability density function\nf(x) = kx  for 0 ≤ x ≤ ${b}, and f(x) = 0 otherwise.\nFind the value of k.`,
          a: frac(2, b * b),
          sol: [S(`The total area under a pdf is 1: ∫ from 0 to ${b} of kx dx = 1`, "M1"),
                S(`[${frac("kx", 2)}${sup(2)}] from 0 to ${b} = ${frac(`k × ${b * b}`, 2)} = 1`, "M1"),
                S(`k = ${frac(2, b * b)}`, "A1")] };
      if (d === 2)
        return { q: `X has probability density function f(x) = ${frac(2, b * b)}x for 0 ≤ x ≤ ${b},\nand f(x) = 0 otherwise.\nFind E(X).`,
          a: money((2 * b) / 3),
          sol: [S(`E(X) = ∫ x f(x) dx = ∫ from 0 to ${b} of ${frac(2, b * b)}x${sup(2)} dx`, "M1"),
                S(`= ${frac(2, b * b)} × ${frac(`${b}${sup(3)}`, 3)} = ${frac(2 * b, 3)}`, "M1"),
                S(money((2 * b) / 3), "A1")] };
      const med = b / Math.SQRT2;
      const ex = (2 * b) / 3;
      const varr = (b * b) / 2 - ex * ex;
      return { q: `X has probability density function f(x) = ${frac(2, b * b)}x for 0 ≤ x ≤ ${b},\nand f(x) = 0 otherwise.\n(i) Find the median of X in exact form.\n(ii) Find Var(X).\n(iii) Explain why the median is less than the mean here.`,
        a: `median ${frac(b, rad(2))} ≈ ${med.toFixed(3)}; Var(X) = ${money(varr)}`,
        sol: [S(`∫ from 0 to m of ${frac(2, b * b)}x dx = ${frac(1, 2)} gives ${frac(`m${sup(2)}`, b * b)} = ${frac(1, 2)}`, "M1"),
              S(`m = ${frac(b, rad(2))} ≈ ${med.toFixed(3)}`, "A1"),
              S(`E(X${sup(2)}) = ∫ from 0 to ${b} of ${frac(2, b * b)}x${sup(3)} dx = ${frac(b * b, 2)}`, "M1"),
              S(`Var(X) = ${frac(b * b, 2)} − (${frac(2 * b, 3)})${sup(2)} = ${money(varr)}`, "A1"),
              S(`The density rises towards x = ${b}, so the distribution is left-skewed and the median sits below the mean`, "B1")] };
    }
  },

  sumIndependentRV: {
    name: "Sums and linear combinations of random variables", grades: [12],
    gen(r, d) {
      const mx = ri(r, 2, 12), vx = ri(r, 1, 9);
      const my = ri(r, 2, 12), vy = ri(r, 1, 9);
      if (d === 1)
        return { q: `X and Y are independent, with E(X) = ${mx}, Var(X) = ${vx},\nE(Y) = ${my} and Var(Y) = ${vy}.\nFind E(X + Y) and Var(X + Y).`,
          a: `E = ${mx + my}, Var = ${vx + vy}`,
          sol: [S(`E(X + Y) = E(X) + E(Y) = ${mx} + ${my} = ${mx + my}`, "A1"),
                S(`For independent variables the variances add`, "M1"),
                S(`Var(X + Y) = ${vx} + ${vy} = ${vx + vy}`, "A1")] };
      if (d === 2) {
        const a = ri(r, 2, 5), c = ri(r, 1, 9);
        return { q: `E(X) = ${mx} and Var(X) = ${vx}.\nFind E(${a}X + ${c}) and Var(${a}X + ${c}),\nand explain why the constant does not affect the variance.`,
          a: `E = ${a * mx + c}, Var = ${a * a * vx}`,
          sol: [S(`E(aX + b) = aE(X) + b = ${a} × ${mx} + ${c} = ${a * mx + c}`, "A1"),
                S(`Var(aX + b) = a${sup(2)}Var(X) = ${a * a} × ${vx} = ${a * a * vx}`, "A1"),
                S(`Adding a constant shifts every value equally, so the spread is unchanged`, "B1")] };
      }
      const a = ri(r, 2, 4), b = ri(r, 1, 3);
      return { q: `X ~ N(${mx}, ${vx}) and Y ~ N(${my}, ${vy}) are independent.\n(i) Write down the distribution of ${a}X − ${b}Y.\n(ii) Find P(${a}X − ${b}Y > ${nf(a * mx - b * my)}).\n(iii) Explain why the coefficients are squared in the variance\nbut not in the mean.`,
        a: `N(${nf(a * mx - b * my)}, ${a * a * vx + b * b * vy}); P = 0.5`,
        sol: [S(`E = ${a}(${mx}) − ${b}(${my}) = ${nf(a * mx - b * my)}`, "M1"),
              S(`Var = ${a}${sup(2)}(${vx}) + ${b}${sup(2)}(${vy}) = ${a * a * vx + b * b * vy}`, "A1"),
              S(`${a}X − ${b}Y ~ N(${nf(a * mx - b * my)}, ${a * a * vx + b * b * vy})`, "A1"),
              S(`The value asked for is the mean, so the probability is 0.5 by symmetry`, "A1"),
              S(`Variance measures squared deviation, so scaling by a scales it by a${sup(2)}`, "B1")] };
    }
  },

  sampleMeans: {
    name: "Sampling and the distribution of sample means", grades: [12],
    gen(r, d) {
      const mu = ri(r, 20, 80), sd = ri(r, 2, 10), n = pick(r, [4, 9, 16, 25, 36, 100]);
      if (d === 1)
        return { q: `A population has mean ${mu} and variance ${sd * sd}.\nA random sample of size ${n} is taken.\nWrite down E(X̄) and Var(X̄) for the sample mean X̄.`,
          a: `E(X̄) = ${mu}, Var(X̄) = ${money((sd * sd) / n)}`,
          sol: [S(`E(X̄) = μ = ${mu}`, "A1"),
                S(`Var(X̄) = ${frac("σ²", "n")} = ${frac(sd * sd, n)}`, "M1"),
                S(money((sd * sd) / n), "A1")] };
      if (d === 2) {
        const se = sd / Math.sqrt(n);
        const k = mu + Math.round(se * 2 * 10) / 10;
        const z = (k - mu) / se;
        return { q: `X ~ N(${mu}, ${sd * sd}) and a random sample of size ${n} is taken.\nFind P(X̄ > ${money(k)}), correct to 4 decimal places.`,
          a: (0.5 * (1 - erfApprox(z / Math.SQRT2))).toFixed(4),
          sol: [S(`X̄ ~ N(${mu}, ${frac(sd * sd, n)}), so the standard error is ${se.toFixed(4)}`, "M1"),
                S(`z = ${frac(`${money(k)} − ${mu}`, se.toFixed(4))} = ${z.toFixed(3)}`, "M1"),
                S((0.5 * (1 - erfApprox(z / Math.SQRT2))).toFixed(4), "A1")] };
      }
      return { q: `The times taken by learners to finish a task have mean ${mu} minutes\nand standard deviation ${sd} minutes. The distribution is not normal.\nA random sample of ${n >= 30 ? n : 50} learners is taken.\n(i) State the Central Limit Theorem and say why it applies here.\n(ii) Write down the approximate distribution of X̄.\n(iii) Explain what happens to the spread of X̄ as the sample size grows.`,
        a: `X̄ ≈ N(${mu}, ${money((sd * sd) / (n >= 30 ? n : 50))})`,
        sol: [S(`For a large sample the distribution of X̄ is approximately normal whatever the population distribution`, "B1"),
              S(`The sample size ${n >= 30 ? n : 50} is large enough for the theorem to apply`, "B1"),
              S(`X̄ ≈ N(${mu}, ${frac(sd * sd, n >= 30 ? n : 50)}) = N(${mu}, ${money((sd * sd) / (n >= 30 ? n : 50))})`, "A1"),
              S(`Var(X̄) = ${frac("σ²", "n")}, so the spread falls as n rises`, "B1")] };
    }
  },

  unbiasedEstimates: {
    name: "Unbiased estimates of population mean and variance", grades: [12],
    gen(r, d) {
      const n = pick(r, [10, 12, 15, 20, 25, 50]);
      const mean = ri(r, 4, 20);
      const sx = n * mean;
      if (d === 1)
        return { q: `A random sample of ${n} values gives Σx = ${sx}.\nFind an unbiased estimate of the population mean.`,
          a: String(mean),
          sol: [S(`The sample mean is an unbiased estimate of μ`, "M1"),
                S(`x̄ = ${frac(sx, n)} = ${mean}`, "A1")] };
      const extra = ri(r, 2, 12) * (n - 1);
      const sxx = sx * mean + extra;
      const s2 = extra / (n - 1);
      if (d === 2)
        return { q: `A random sample of ${n} values gives Σx = ${sx} and Σx${sup(2)} = ${sxx}.\nFind unbiased estimates of the population mean and variance.`,
          a: `x̄ = ${mean}, s${sup(2)} = ${money(s2)}`,
          sol: [S(`x̄ = ${frac(sx, n)} = ${mean}`, "A1"),
                S(`s${sup(2)} = ${frac(1, n - 1)}(Σx${sup(2)} − ${frac("(Σx)²", "n")}) = ${frac(1, n - 1)}(${sxx} − ${sx * mean})`, "M1"),
                S(`= ${frac(extra, n - 1)} = ${money(s2)}`, "A1")] };
      const c = ri(r, 10, 60);
      return { q: `For a sample of ${n} values, the coded values y = x − ${c} give\nΣy = ${nf(sx - n * c)} and Σy${sup(2)} = ${sxx - 2 * c * sx + n * c * c}.\n(i) Find unbiased estimates of the population mean and variance of x.\n(ii) Explain why the coding does not change the variance.\n(iii) Explain why the divisor is n − 1 and not n.`,
        a: `x̄ = ${mean}, s${sup(2)} = ${money(s2)}`,
        sol: [S(`ȳ = ${frac(nf(sx - n * c), n)} = ${nf(mean - c)}, so x̄ = ${nf(mean - c)} + ${c} = ${mean}`, "M1"),
              S(`s${sup(2)}(y) = ${frac(1, n - 1)}(Σy${sup(2)} − ${frac("(Σy)²", "n")}) = ${money(s2)}`, "M1"),
              S(`Subtracting a constant shifts the data without changing its spread, so s${sup(2)}(x) = s${sup(2)}(y) = ${money(s2)}`, "A1"),
              S(`Dividing by n − 1 corrects the bias caused by using x̄ rather than the unknown μ`, "B1")] };
    }
  },

  confidenceInterval: {
    name: "Confidence intervals", grades: [12],
    gen(r, d) {
      const Z = { 90: 1.645, 95: 1.96, 98: 2.326, 99: 2.576 };
      const level = pick(r, [90, 95, 98, 99]);
      const z = Z[level];
      const mean = ri(r, 20, 90), sd = ri(r, 2, 10), n = pick(r, [16, 25, 36, 49, 64, 100]);
      const half = (z * sd) / Math.sqrt(n);
      if (d === 1)
        return { q: `A random sample of ${n} items from a normal population with\nstandard deviation ${sd} has mean ${mean}.\nFind a ${level}% confidence interval for the population mean.`,
          a: `(${(mean - half).toFixed(3)}, ${(mean + half).toFixed(3)})`,
          sol: [S(`The ${level}% z-value is ${z}`, "B1"),
                S(`Half-width = ${z} × ${frac(sd, rad(n))} = ${half.toFixed(3)}`, "M1"),
                S(`(${(mean - half).toFixed(3)}, ${(mean + half).toFixed(3)})`, "A1")] };
      if (d === 2) {
        const want = Math.round(half * 10) / 20;   // aim for half the width
        const need = Math.ceil(Math.pow((z * sd) / want, 2));
        return { q: `A ${level}% confidence interval for the mean of a normal population\nwith standard deviation ${sd} is to have total width at most ${money(2 * want)}.\nFind the smallest sample size that will do.`,
          a: String(need),
          sol: [S(`Half-width ${z} × ${frac(sd, rad("n"))} ≤ ${money(want)}`, "M1"),
                S(`${rad("n")} ≥ ${frac(`${z} × ${sd}`, money(want))}, so n ≥ ${((z * sd) / want) ** 2 === Infinity ? "" : (((z * sd) / want) ** 2).toFixed(2)}`, "M1"),
                S(`n = ${need} (round up — a smaller n would be too wide)`, "A1")] };
      }
      const N = pick(r, [100, 200, 400, 500]);
      const succ = Math.round(N * pick(r, [0.2, 0.3, 0.4, 0.5]));
      const p = succ / N;
      const hw = z * Math.sqrt((p * (1 - p)) / N);
      return { q: `In a random sample of ${N} voters, ${succ} said they would vote yes.\n(i) Find a ${level}% confidence interval for the population proportion.\n(ii) State what "${level}% confident" means.\n(iii) Say what would happen to the interval if the sample size doubled.`,
        a: `(${(p - hw).toFixed(4)}, ${(p + hw).toFixed(4)})`,
        sol: [S(`p̂ = ${frac(succ, N)} = ${p}`, "M1"),
              S(`Half-width = ${z} × √(p̂(1 − p̂)/${N}) = ${hw.toFixed(4)}`, "M1"),
              S(`(${(p - hw).toFixed(4)}, ${(p + hw).toFixed(4)})`, "A1"),
              S(`In the long run ${level}% of intervals built this way contain the true proportion`, "B1"),
              S(`Doubling n divides the width by ${rad(2)}, so the interval narrows`, "B1")] };
    }
  },

  stemAndLeaf: {
    name: "Stem-and-leaf diagrams", grades: [8, 9, 10, 11, 12],
    gen(r, d) {
      const data = [];
      for (let i = 0; i < 15; i++) data.push(ri(r, 10, 59));
      data.sort((a, b) => a - b);
      const stems = {};
      data.forEach((v) => {
        const s = Math.floor(v / 10);
        (stems[s] = stems[s] || []).push(v % 10);
      });
      const plot = Object.keys(stems).map(Number).sort((a, b) => a - b)
        .map((s) => `${s} | ${stems[s].join(" ")}`).join("\n");
      if (d === 1)
        return { q: `The stem-and-leaf diagram shows 15 values.  Key: 1 | 2 means 12\n${plot}\nWrite down the smallest and the largest value, and the range.`,
          a: `${data[0]}, ${data[14]}, range ${data[14] - data[0]}`,
          sol: [S(`Smallest ${data[0]}, largest ${data[14]}`, "M1"),
                S(`Range = ${data[14]} − ${data[0]} = ${data[14] - data[0]}`, "A1")] };
      if (d === 2)
        return { q: `The stem-and-leaf diagram shows 15 values.  Key: 1 | 2 means 12\n${plot}\nFind the median and the mode.`,
          a: `Median ${data[7]}`,
          sol: [S(`With 15 values the median is the 8th`, "M1"),
                S(`Median = ${data[7]}`, "A1"),
                S(`The mode is the value that appears most often in the leaves`, "B1")] };
      return { q: `The stem-and-leaf diagram shows 15 values.  Key: 1 | 2 means 12\n${plot}\n(i) Find the median, the lower quartile and the upper quartile.\n(ii) Find the interquartile range.\n(iii) Give one advantage of a stem-and-leaf diagram over a\nfrequency table for this data.`,
        a: `Q₁ = ${data[3]}, median ${data[7]}, Q₃ = ${data[11]}, IQR ${data[11] - data[3]}`,
        sol: [S(`The values are already in order: Q₁ is the 4th, the median the 8th and Q₃ the 12th`, "M1"),
              S(`Q₁ = ${data[3]}, median = ${data[7]}, Q₃ = ${data[11]}`, "A1"),
              S(`IQR = ${data[11]} − ${data[3]} = ${data[11] - data[3]}`, "A1"),
              S(`The original values are all still visible, so no information is lost`, "B1")] };
    }
  }
,

  numberHierarchy: {
    name: "Hierarchy of numbers", grades: [7, 8, 9],
    gen(r, d) {
      if (d === 1) {
        const CASES = [["7", "a natural number, an integer and a rational number"],
          ["−4", "an integer and a rational number, but not a natural number"],
          [frac(3, 4), "a rational number, but not an integer"],
          ["0", "an integer and a rational number"],
          [rad(2), "an irrational number"], ["π", "an irrational number"]];
        const c = pick(r, CASES);
        return { q: `Say which sets of numbers ${c[0]} belongs to:\nnatural numbers, integers, rational numbers, irrational numbers.`,
          a: `It is ${c[1]}`,
          sol: [S(`Natural ⊂ integers ⊂ rationals; the irrationals are separate`, "M1"),
                S(`${c[0]} is ${c[1]}`, "A1")] };
      }
      if (d === 2) {
        const n = ri(r, 2, 30);
        const isSq = Number.isInteger(Math.sqrt(n));
        return { q: `Is ${rad(n)} rational or irrational? Justify your answer.`,
          a: isSq ? "Rational" : "Irrational",
          sol: [S(`A square root is rational only when the number is a perfect square`, "M1"),
                S(isSq ? `${n} = ${Math.sqrt(n)}${sup(2)}, so ${rad(n)} = ${Math.sqrt(n)} — rational` : `${n} is not a perfect square, so ${rad(n)} cannot be written as a fraction — irrational`, "A1")] };
      }
      const a = ri(r, 2, 9), b = ri(r, 2, 9);
      return { q: `(i) Explain why every integer is a rational number.\n(ii) ${rad(a * a)} + ${frac(1, b)} is written down. State, with a reason,\nwhether it is rational or irrational.\n(iii) Give an example of two irrational numbers whose sum is rational.`,
        a: `Rational`,
        sol: [S(`Any integer n can be written ${frac("n", 1)}, a fraction of two integers`, "B1"),
              S(`${rad(a * a)} = ${a}, so the expression is ${a} + ${frac(1, b)} = ${frac(a * b + 1, b)}`, "M1"),
              S(`That is a fraction of two integers, so it is rational`, "A1"),
              S(`For example ${rad(2)} and −${rad(2)} are both irrational and sum to 0`, "B1")] };
    }
  },

  parallelogramTrapezium: {
    name: "Area of parallelograms and trapezia", grades: [6, 7, 8],
    gen(r, d) {
      if (d === 1) {
        const b = ri(r, 3, 14), h = ri(r, 2, 10);
        return { q: `A parallelogram has base ${b} cm and perpendicular height ${h} cm.\nWork out its area.`,
          a: `${b * h} cm${sup(2)}`,
          sol: [S(`Area of a parallelogram = base × perpendicular height`, "M1"),
                S(`${b} × ${h} = ${b * h} cm${sup(2)}`, "A1")] };
      }
      if (d === 2) {
        const a = ri(r, 2, 9), b = a + ri(r, 1, 8), h = ri(r, 2, 5) * 2;
        return { q: `A trapezium has parallel sides ${a} cm and ${b} cm,\nand a perpendicular height of ${h} cm.\nWork out its area.`,
          a: `${((a + b) * h) / 2} cm${sup(2)}`,
          sol: [S(`Area = ${frac(1, 2)}(a + b)h`, "M1"),
                S(`${frac(1, 2)} × (${a} + ${b}) × ${h}`, "M1"),
                S(`${((a + b) * h) / 2} cm${sup(2)}`, "A1")] };
      }
      const a = ri(r, 2, 8), h = ri(r, 2, 6) * 2;
      const area = ri(r, 6, 20) * h;
      const b = (2 * area) / h - a;
      return { q: `A trapezium has area ${area} cm${sup(2)} and perpendicular height ${h} cm.\nOne of its parallel sides is ${a} cm.\nWork out the length of the other parallel side.`,
        a: `${b} cm`,
        sol: [S(`${frac(1, 2)}(${a} + b) × ${h} = ${area}`, "M1"),
              S(`${a} + b = ${(2 * area) / h}`, "M1"),
              S(`b = ${(2 * area) / h} − ${a} = ${b} cm`, "A1")] };
    }
  },

  trigGraphTransform: {
    name: "Transforming trigonometric graphs", grades: [10, 11, 12],
    gen(r, d) {
      const a = ri(r, 2, 5), b = pick(r, [2, 3, 4]), c = ri(r, 1, 6);
      if (d === 1)
        return { q: `Write down the amplitude and the period of  y = ${a} sin x°`,
          a: `Amplitude ${a}, period 360°`,
          sol: [S(`The amplitude is the coefficient of sin`, "M1"),
                S(`Amplitude ${a}; the graph still repeats every 360°`, "A1")] };
      if (d === 2)
        return { q: `y = ${a} cos ${b}x°\nWrite down the amplitude, the period, and the maximum\nand minimum values of y.`,
          a: `Amplitude ${a}, period ${360 / b}°, max ${a}, min ${nf(-a)}`,
          sol: [S(`Amplitude = ${a}`, "B1"),
                S(`Period = ${frac(360, b)}° = ${360 / b}°`, "A1"),
                S(`Maximum ${a} and minimum ${nf(-a)}`, "A1")] };
      return { q: `The graph of y = sin x° is transformed to y = ${a} sin ${b}x° + ${c}.\n(i) Describe fully the three transformations, in order.\n(ii) Write down the maximum and minimum values of y and the period.\n(iii) State how many solutions y = ${c} has for 0° ≤ x ≤ 360°.`,
        a: `Max ${a + c}, min ${nf(c - a)}, period ${360 / b}°; ${2 * b + 1} solutions`,
        sol: [S(`Stretch parallel to the y-axis, factor ${a}`, "B1"),
              S(`Stretch parallel to the x-axis, factor ${frac(1, b)}, giving period ${360 / b}°`, "B1"),
              S(`Translation ${c} units up`, "B1"),
              S(`Maximum ${a} + ${c} = ${a + c}, minimum ${nf(-a)} + ${c} = ${nf(c - a)}`, "A1"),
              S(`y = ${c} is the centre line, crossed ${2 * b} times inside the range plus the endpoint: ${2 * b + 1} solutions`, "A1")] };
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
