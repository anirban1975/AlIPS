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
    name: "Negative numbers", grades: [7, 8],
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
    name: "Powers and roots", grades: [7, 8, 9],
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
    name: "Angles in a triangle", grades: [6, 7, 8],
    gen(r, d) {
      const a = ri(r, 20, 80), b = ri(r, 20, Math.min(150 - a, 100));
      return { q: `Two angles of a triangle are ${a}° and ${b}°. Find the third angle.`, a: `${180 - a - b}°`,
        sol: [S("Angles in a triangle add up to 180°", "M1"), S(`180 − ${a} − ${b} = ${180 - a - b}°`, "A1")] };
    }
  },
  circleArea: {
    name: "Circumference and area of circles", grades: [8, 9, 10],
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
    name: "Expanding brackets", grades: [8, 9, 10],
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
    name: "Factorising", grades: [9, 10, 11],
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
    name: "Simultaneous equations", grades: [9, 10, 11],
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
    name: "Straight-line graphs", grades: [9, 10, 11],
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
    name: "Pythagoras' theorem", grades: [9, 10],
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
    name: "Standard form", grades: [9, 10],
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
    name: "Inequalities", grades: [9, 10],
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
    name: "Solving quadratics", grades: [10, 11],
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
    name: "Right-angled trigonometry", grades: [10, 11],
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
    name: "Laws of indices", grades: [10, 11],
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
  }
};

// Which generators are appropriate for each grade
const GRADE_GENS = {};
for (let g = 1; g <= 12; g++) GRADE_GENS[g] = [];
for (const [id, def] of Object.entries(GENERATORS))
  for (const g of def.grades) GRADE_GENS[g].push(id);
