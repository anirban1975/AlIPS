// AlIPS topic content library — one entry per generator id (English).
// Used by the Lesson Planner to draft lesson plans and slide decks.
// concept: short explanation; example: worked example lines; tips: key points;
// q: search query used to build "deep research" links (YouTube, Khan Academy,
// Corbettmaths). yt: optional YouTube video ID pinned by the department — when
// set, the video embeds directly in the Learn tab.
// Draft content: to be reviewed by the Mathematics Department.

const LESSONS = {
  addWithin20: {
    concept: "Addition means putting amounts together. Up to 20, you can count on from the bigger number, or use number bonds to 10.",
    example: ["8 + 6", "8 + 2 = 10", "10 + 4 = 14"],
    tips: ["Start from the bigger number and count on.", "Make 10 first — it makes the sum easier."],
    q: "addition within 20 for kids"
  },
  subWithin20: {
    concept: "Subtraction means taking away, or finding the difference between two numbers. You can count back, or count up from the smaller number.",
    example: ["15 − 8", "15 − 5 = 10", "10 − 3 = 7"],
    tips: ["Subtraction and addition undo each other: check 7 + 8 = 15."],
    q: "subtraction within 20 strategies"
  },
  missingNumber: {
    concept: "A missing-number problem hides one part of a sum. Work backwards: use the inverse operation to find the hidden number.",
    example: ["4 + ▢ = 11", "▢ = 11 − 4", "▢ = 7"],
    tips: ["Addition hides? Subtract. Subtraction hides? Add."],
    q: "missing number problems addition"
  },
  placeValue: {
    concept: "Each digit's value depends on its position: ones, tens, hundreds, thousands. The digit 7 in 274 is worth 70, not 7.",
    example: ["In 4 6 2 8:", "4 → 4000,  6 → 600,  2 → 20,  8 → 8"],
    tips: ["Write numbers in a place-value table when unsure."],
    q: "place value explained"
  },
  columnAdd: {
    concept: "Column addition lines numbers up by place value so you add ones with ones, tens with tens — carrying a 10 to the next column when a column passes 9.",
    example: ["  347", "+ 285", "  632  (7+5=12: write 2 carry 1)"],
    tips: ["Always start from the ones column."],
    q: "column addition with carrying"
  },
  columnSub: {
    concept: "Column subtraction works place by place, borrowing (regrouping) from the next column when the top digit is too small.",
    example: ["  632", "− 285", "  347  (2<5: borrow to make 12−5)"],
    tips: ["Check by adding your answer to the number you subtracted."],
    q: "column subtraction borrowing"
  },
  timesTables: {
    concept: "Multiplication is repeated addition: 4 × 6 means four sixes. Knowing tables by heart makes all later maths faster.",
    example: ["7 × 8 = 56", "Trick: 7 × 8 = 7 × 4 × 2 = 28 × 2"],
    tips: ["Order doesn't matter: 3 × 8 = 8 × 3."],
    q: "times tables tricks"
  },
  divisionRemainder: {
    concept: "Division splits into equal groups. When it doesn't split exactly, what's left over is the remainder — always smaller than the divisor.",
    example: ["23 ÷ 4", "4 × 5 = 20", "23 − 20 = 3 → answer 5 r 3"],
    tips: ["If the remainder ≥ divisor, your quotient is too small."],
    q: "division with remainders"
  },
  longMultiplication: {
    concept: "To multiply big numbers, split one factor by place value, multiply each part, then add the partial products.",
    example: ["36 × 14", "36 × 10 = 360", "36 × 4 = 144", "360 + 144 = 504"],
    tips: ["Estimate first (36 × 14 ≈ 40 × 15 = 600) to catch big errors."],
    q: "long multiplication method"
  },
  fractionOfAmount: {
    concept: "To find a fraction of an amount: divide by the denominator (bottom) to get one part, then multiply by the numerator (top).",
    example: ["3/5 of 40", "40 ÷ 5 = 8", "8 × 3 = 24"],
    tips: ["\"of\" means multiply."],
    q: "fraction of an amount"
  },
  equivalentFractions: {
    concept: "Equivalent fractions look different but have the same value — made by multiplying (or dividing) top and bottom by the same number.",
    example: ["2/3 = 4/6 = 8/12", "(×2 each time)"],
    tips: ["Whatever you do to the bottom, do to the top."],
    q: "equivalent fractions explained"
  },
  addFractions: {
    concept: "Fractions can only be added when the denominators match. If they don't, rewrite both with a common denominator first.",
    example: ["1/3 + 1/4", "= 4/12 + 3/12", "= 7/12"],
    tips: ["Never add the denominators!", "Always simplify the final answer."],
    q: "adding fractions different denominators"
  },
  percentOfAmount: {
    concept: "Per cent means \"out of 100\". Build any percentage from easy ones: 10% (divide by 10), 5% (half of that), 1% (divide by 100).",
    example: ["35% of 80", "10% = 8 → 30% = 24", "5% = 4", "35% = 28"],
    tips: ["50% = half, 25% = quarter, 10% = tenth."],
    q: "percentage of amount without calculator"
  },
  orderOfOperations: {
    concept: "When operations mix, follow the agreed order: Brackets, Indices (powers), Division/Multiplication, Addition/Subtraction — BIDMAS.",
    example: ["3 + 4 × 5 = 3 + 20 = 23", "(3 + 4) × 5 = 35"],
    tips: ["Multiplication and division rank equally — work left to right."],
    q: "BIDMAS order of operations"
  },
  areaPerimeterRect: {
    concept: "Perimeter is the distance around a shape (add the sides). Area is the space inside, measured in squares: for a rectangle, length × width.",
    example: ["Rectangle 7 cm × 4 cm", "Perimeter = 2 × (7 + 4) = 22 cm", "Area = 7 × 4 = 28 cm²"],
    tips: ["Perimeter in cm, area in cm² — different units!"],
    q: "area and perimeter rectangle"
  },
  meanOfNumbers: {
    concept: "The mean is the \"fair share\" average: add all the values, then divide by how many there are.",
    example: ["Mean of 3, 7, 8, 6", "3+7+8+6 = 24", "24 ÷ 4 = 6"],
    tips: ["The mean can be a value not in the list — that's fine."],
    q: "mean average explained"
  },
  negativeNumbers: {
    concept: "Negative numbers sit below zero. Adding a negative moves you down the number line; subtracting a negative moves you up — two minuses make a plus.",
    example: ["5 − (−3) = 5 + 3 = 8", "−4 × (−2) = 8", "−4 × 2 = −8"],
    tips: ["Sketch a number line when in doubt."],
    q: "negative numbers rules"
  },
  powersRoots: {
    concept: "A power is repeated multiplication: 5³ = 5 × 5 × 5. A root undoes a power: √49 asks \"what squared gives 49?\"",
    example: ["4² = 16, 4³ = 64", "√81 = 9 because 9² = 81"],
    tips: ["Learn the square numbers to 15² = 225 by heart."],
    q: "squares cubes and roots"
  },
  ratioSharing: {
    concept: "A ratio like 2 : 3 splits something into 2 + 3 = 5 equal parts. Find one part (divide the total), then give each person their parts.",
    example: ["Share 30 rials in 2 : 3", "5 parts → 30 ÷ 5 = 6", "Shares: 12 and 18"],
    tips: ["Check: the shares must add back to the total."],
    q: "sharing in a ratio"
  },
  anglesTriangle: {
    concept: "The three interior angles of any triangle always add up to 180° — however the triangle is drawn.",
    example: ["Angles 65° and 48°", "180 − 65 − 48 = 67°"],
    tips: ["Equilateral: all 60°. Isosceles: two equal base angles."],
    q: "angles in a triangle 180"
  },
  circleArea: {
    concept: "For a circle of radius r: circumference C = 2πr (distance around) and area A = πr² (space inside). π ≈ 3.14159…",
    example: ["r = 5 cm", "C = 2π × 5 = 10π cm", "A = π × 25 = 25π cm²"],
    tips: ["Diameter given? Halve it first — the formulas use the radius."],
    q: "circumference and area of circle"
  },
  solveLinear: {
    concept: "An equation stays balanced: whatever you do to one side, do to the other. Undo operations one at a time until x stands alone.",
    example: ["3x + 5 = 17", "3x = 12", "x = 4"],
    tips: ["Always check by substituting back in."],
    q: "solving linear equations"
  },
  sequenceNth: {
    concept: "For a linear sequence, the common difference tells you the multiplier of n; then adjust with a constant so the first term is right.",
    example: ["5, 8, 11, 14, …", "difference 3 → 3n", "3×1 = 3, first term 5 → +2", "nth term = 3n + 2"],
    tips: ["Test your rule on the 3rd term before moving on."],
    q: "nth term of linear sequence"
  },
  expandBrackets: {
    concept: "Expanding means multiplying out: everything inside the bracket gets multiplied by what's outside. With two brackets, every term meets every term.",
    example: ["(x + 3)(x − 2)", "= x² − 2x + 3x − 6", "= x² + x − 6"],
    tips: ["Watch the signs — most marks are lost there."],
    q: "expanding double brackets"
  },
  factorise: {
    concept: "Factorising reverses expanding: pull out the common factor, or for x² + bx + c find two numbers that add to b and multiply to c.",
    example: ["x² + 5x + 6", "2 + 3 = 5, 2 × 3 = 6", "= (x + 2)(x + 3)"],
    tips: ["Check by expanding your answer back."],
    q: "factorising quadratics"
  },
  simultaneous: {
    concept: "Two equations, two unknowns. Make one unknown's coefficients match, subtract to eliminate it, solve what remains, then substitute back.",
    example: ["x + y = 7", "x − y = 3", "add: 2x = 10 → x = 5, y = 2"],
    tips: ["Your answers must satisfy BOTH equations — check both."],
    q: "simultaneous equations elimination"
  },
  straightLine: {
    concept: "Every straight line is y = mx + c: m is the gradient (steepness — rise over run) and c is where the line crosses the y-axis.",
    example: ["y = 2x − 3", "gradient 2, intercept (0, −3)"],
    tips: ["Parallel lines share the same gradient."],
    q: "y=mx+c gradient intercept"
  },
  pythagoras: {
    concept: "In a right-angled triangle, the square on the hypotenuse equals the sum of the squares on the other two sides: a² + b² = c².",
    example: ["Sides 6 and 8", "6² + 8² = 36 + 64 = 100", "hypotenuse = √100 = 10"],
    tips: ["The hypotenuse faces the right angle and is always longest.", "Finding a shorter side? Subtract instead of add."],
    q: "pythagoras theorem"
  },
  standardForm: {
    concept: "Standard form writes numbers as a × 10ⁿ with 1 ≤ a < 10 — ideal for very large or very small values. Big numbers get positive n, small ones negative.",
    example: ["45 000 = 4.5 × 10⁴", "0.0032 = 3.2 × 10⁻³"],
    tips: ["Count how many places the decimal point moves."],
    q: "standard form scientific notation"
  },
  inequality: {
    concept: "Solve inequalities like equations, with one rule: multiplying or dividing by a negative flips the inequality sign.",
    example: ["2x + 1 < 9", "2x < 8", "x < 4"],
    tips: ["The answer is a range, not one number — sketch it on a number line."],
    q: "solving linear inequalities"
  },
  quadraticSolve: {
    concept: "A quadratic equals zero when either factor is zero. Factorise, set each bracket to 0, and you get (usually) two solutions.",
    example: ["x² − x − 6 = 0", "(x − 3)(x + 2) = 0", "x = 3 or x = −2"],
    tips: ["Won't factorise? Use the quadratic formula."],
    q: "solving quadratic equations factorising"
  },
  trigRightAngle: {
    concept: "SOH CAH TOA: sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent. Label the sides from the angle, then pick the ratio linking what you have to what you want.",
    example: ["angle 30°, adjacent 6", "opposite = 6 × tan 30° ≈ 3.5"],
    tips: ["Make sure your calculator is in degrees."],
    q: "trigonometry SOH CAH TOA"
  },
  indices: {
    concept: "Laws of indices: multiply → add powers; divide → subtract; power of a power → multiply. Anything to the power 0 is 1.",
    example: ["x³ × x⁴ = x⁷", "x⁸ ÷ x² = x⁶", "(x²)³ = x⁶"],
    tips: ["The laws only work with the same base."],
    q: "laws of indices"
  },
  permutations: {
    concept: "Permutations count arrangements where order matters (P); combinations count selections where it does not (C). Ask yourself: would swapping two chosen items give a different outcome?",
    example: ["Choose 3 from 7:", "order matters: P(7,3) = 7 × 6 × 5 = 210", "order does not: C(7,3) = 210 ÷ 6 = 35"],
    tips: ["\"Committee\", \"team\", \"selection\" → combinations. \"Line up\", \"prizes\", \"code\" → permutations."],
    q: "permutations and combinations"
  },
  standardDeviation: {
    concept: "Standard deviation measures spread: how far, on average, values sit from the mean. Small sd means the data is tightly clustered.",
    example: ["Data 4, 6, 8 → mean 6", "deviations −2, 0, 2 → squares 4, 0, 4", "sd = √(8 ÷ 3) ≈ 1.63"],
    tips: ["Square the deviations before averaging, then take the square root at the end.", "Using Σx and Σx²? sd = √(Σx²/n − mean²)."],
    q: "mean and standard deviation statistics"
  },
  logarithms: {
    concept: "A logarithm answers “what power?”. log_b x = y means bʸ = x, so a log undoes an exponential. The laws — log a + log b = log ab, log a − log b = log (a/b), n log a = log aⁿ — turn products and powers into sums, which is why logs solve equations where the unknown is an index.",
    example: ["log₂ 32 = 5   because 2⁵ = 32", "2 log x + log y = log x² + log y = log (x²y)", "log₃ x + log₃ 4 = log₃ 20 → 4x = 20 → x = 5"],
    tips: ["Only combine logs that share the same base.", "log a + log b is log (ab), never log (a + b).", "Check the solution: the argument of a log must be positive."],
    q: "logarithms laws A level pure 3"
  },
  expEquations: {
    concept: "An exponential equation has the unknown in the index. If both sides can be written to the same base, equate the indices. If they cannot, take logs of both sides and use n log a = log aⁿ to bring the index down.",
    example: ["2ˣ = 32 → 2ˣ = 2⁵ → x = 5", "3ˣ⁺¹ = 81 → 3ˣ⁺¹ = 3⁴ → x + 1 = 4 → x = 3", "5ˣ = 40 → x = log 40 ÷ log 5 = 2.29 (3 s.f.)"],
    tips: ["Try same-base first — it is exact and quicker.", "log of both sides works for any base; use the calculator's log or ln.", "Round only at the very end, to the accuracy asked for."],
    q: "solving exponential equations using logarithms"
  },
  differentiation: {
    concept: "Differentiation finds the gradient function — how fast y changes. For each term axⁿ: multiply by n, reduce the power by 1. Constants disappear.",
    example: ["y = x³ + 5x + 2", "dy/dx = 3x² + 5"],
    tips: ["dy/dx = 0 at maximum and minimum points."],
    q: "differentiation basics AS maths"
  },
  integration: {
    concept: "Integration reverses differentiation: raise the power by 1, divide by the new power, and always add the constant c (many curves share one gradient).",
    example: ["∫ 6x² dx", "= 6x³/3 + c", "= 2x³ + c"],
    tips: ["Forgetting + c loses a mark every time."],
    q: "integration basics AS maths"
  },
  binomial: {
    concept: "The binomial expansion of (1 + ax)ⁿ has terms C(n,k)·(ax)ᵏ — the coefficients C(n,k) come from Pascal's triangle or the nCr button.",
    example: ["(1 + 2x)⁴, term in x²", "C(4,2) × (2x)² = 6 × 4x² = 24x²"],
    tips: ["The powers of a matter: (ax)ᵏ = aᵏxᵏ."],
    q: "binomial expansion AS level"
  }
};

// Teaching resource links built from the topic's search query.
function researchLinks(id) {
  const L = LESSONS[id];
  if (!L) return [];
  const enc = encodeURIComponent;
  return [
    { label: "▶ YouTube", url: `https://www.youtube.com/results?search_query=${enc(L.q + " maths")}` },
    { label: "Khan Academy", url: `https://www.khanacademy.org/search?page_search_query=${enc(L.q)}` },
    { label: "Corbettmaths", url: `https://corbettmaths.com/?s=${enc(L.q)}` },
    { label: "Save My Exams", url: `https://www.google.com/search?q=${enc("site:savemyexams.com " + L.q)}` }
  ];
}

// ---------------------------------------------------------------------------
// DEPARTMENT-APPROVED learning objectives and success criteria.
// These are what every teacher sees first, on any computer, with no set-up.
// A teacher may edit them in the Lesson Planner; their version is then kept on
// their own machine and 'Use department wording' brings these back.
//
// TO REVISE: edit the entry below and redeploy. Reviewed by: ______________
// ---------------------------------------------------------------------------

const DEPT_FIELDS = {
  addWithin20: {
    objectives: ["Add two numbers with a total of 20 or less.", "Choose a strategy: counting on, or making 10."],
    criteria: ["I can add by counting on from the larger number.", "I can make 10 first to make the sum easier.", "I can check my answer using objects or a number line."]
  },
  subWithin20: {
    objectives: ["Subtract numbers within 20.", "Understand subtraction as both taking away and finding a difference."],
    criteria: ["I can count back to subtract.", "I can count up from the smaller number to find a difference.", "I can check by adding my answer back on."]
  },
  missingNumber: {
    objectives: ["Find a missing number in an addition or subtraction sentence.", "Use the inverse operation to work backwards."],
    criteria: ["I can say which operation will undo the one in the question.", "I can work backwards to find the missing number.", "I can substitute my answer back to check it fits."]
  },
  placeValue: {
    objectives: ["State the value of any digit in a number.", "Partition numbers into thousands, hundreds, tens and ones."],
    criteria: ["I can say which column a digit is in.", "I can give the value of a digit, not just the digit itself.", "I can partition a number and recombine it correctly."]
  },
  columnAdd: {
    objectives: ["Add numbers using the column method.", "Carry correctly when a column totals more than 9."],
    criteria: ["I can line up digits by place value.", "I can carry into the next column and show it clearly.", "I can estimate first to check my answer is sensible."]
  },
  columnSub: {
    objectives: ["Subtract numbers using the column method.", "Regroup (borrow) when the top digit is too small."],
    criteria: ["I can line up digits by place value.", "I can regroup from the next column and show my working.", "I can check by adding my answer to the number I subtracted."]
  },
  timesTables: {
    objectives: ["Recall multiplication facts up to 12 x 12.", "Use known facts to derive ones I am unsure of."],
    criteria: ["I can recall a fact quickly and accurately.", "I can use doubling or a related fact to work one out.", "I know that the order of the two numbers does not change the answer."]
  },
  divisionRemainder: {
    objectives: ["Divide a number and interpret the remainder.", "Explain what the remainder means in context."],
    criteria: ["I can share into equal groups and say what is left over.", "I know the remainder must be smaller than the divisor.", "I can check my answer by multiplying back."]
  },
  longMultiplication: {
    objectives: ["Multiply two- and three-digit numbers using a written method.", "Partition one factor by place value."],
    criteria: ["I can split a number into tens and ones before multiplying.", "I can set out partial products clearly and add them.", "I can estimate first to spot a serious error."]
  },
  fractionOfAmount: {
    objectives: ["Find a unit and non-unit fraction of a quantity.", "Connect 'of' with dividing and multiplying."],
    criteria: ["I can divide by the denominator to find one part.", "I can multiply by the numerator to find several parts.", "I can check my answer is smaller than the original amount."]
  },
  equivalentFractions: {
    objectives: ["Generate fractions equivalent to a given fraction.", "Explain why the value does not change."],
    criteria: ["I can multiply numerator and denominator by the same number.", "I can explain why the fraction is worth the same.", "I can simplify a fraction back to its lowest terms."]
  },
  addFractions: {
    objectives: ["Add fractions with the same and with different denominators.", "Give the answer in its simplest form."],
    criteria: ["I can find a common denominator.", "I can add the numerators only, never the denominators.", "I can simplify my answer and convert to a mixed number if needed."]
  },
  percentOfAmount: {
    objectives: ["Find a percentage of a quantity.", "Build harder percentages from 10%, 5% and 1%."],
    criteria: ["I understand per cent as 'out of 100'.", "I can find 10% and use it to build other percentages.", "I can check whether my answer is a sensible size."]
  },
  orderOfOperations: {
    objectives: ["Apply the correct order of operations.", "Explain why the order matters."],
    criteria: ["I can identify which operation to do first.", "I know multiplication and division rank equally, worked left to right.", "I can show each stage of my working separately."]
  },
  areaPerimeterRect: {
    objectives: ["Calculate the area and perimeter of a rectangle.", "Choose the correct units for each."],
    criteria: ["I can explain the difference between area and perimeter.", "I can apply the correct formula.", "I can write my answer in cm or cm2 as appropriate."]
  },
  meanOfNumbers: {
    objectives: ["Calculate the mean of a set of values.", "Interpret the mean as a fair share."],
    criteria: ["I can total the values and divide by how many there are.", "I can explain what the mean tells me about the data.", "I know the mean need not be one of the original values."]
  },
  negativeNumbers: {
    objectives: ["Add, subtract and multiply with negative numbers.", "Apply the sign rules confidently."],
    criteria: ["I know that subtracting a negative is the same as adding.", "I can give the sign of a product of two numbers.", "I can use a number line to justify my answer."]
  },
  powersRoots: {
    objectives: ["Evaluate squares, cubes and square roots.", "Recognise a root as the inverse of a power."],
    criteria: ["I can recall square numbers up to 15 squared.", "I can find a square root of a perfect square.", "I can explain how powers and roots undo each other."]
  },
  ratioSharing: {
    objectives: ["Divide a quantity in a given ratio.", "Interpret a ratio as a number of equal parts."],
    criteria: ["I can find the total number of parts.", "I can find the value of one part.", "I can check that the shares add back to the original total."]
  },
  anglesTriangle: {
    objectives: ["Use the angle sum of a triangle to find a missing angle.", "Justify the answer with a reason."],
    criteria: ["I know the angles of a triangle total 180 degrees.", "I can set out my subtraction clearly.", "I can state the angle fact I used as a reason."]
  },
  circleArea: {
    objectives: ["Calculate the circumference and area of a circle.", "Select the correct formula for each."],
    criteria: ["I can identify the radius, halving the diameter if needed.", "I can apply the correct formula for circumference or area.", "I can leave an answer in terms of pi or round it as asked."]
  },
  solveLinear: {
    objectives: ["Solve linear equations, including with unknowns on both sides.", "Keep the equation balanced at every step."],
    criteria: ["I can perform the same operation on both sides.", "I can collect like terms before solving.", "I can check my solution by substituting it back."]
  },
  sequenceNth: {
    objectives: ["Find the nth term of a linear sequence.", "Use the rule to generate further terms."],
    criteria: ["I can find the common difference.", "I can adjust with a constant so the first term is correct.", "I can test my rule on a term I have not used."]
  },
  expandBrackets: {
    objectives: ["Expand single and double brackets.", "Simplify by collecting like terms."],
    criteria: ["I can multiply every term inside by the term outside.", "I can multiply every pair of terms from two brackets.", "I can handle negative signs correctly."]
  },
  factorise: {
    objectives: ["Factorise expressions by taking out a common factor.", "Factorise quadratics of the form x squared plus bx plus c."],
    criteria: ["I can identify the highest common factor.", "I can find two numbers with the required sum and product.", "I can check by expanding my answer back."]
  },
  simultaneous: {
    objectives: ["Solve a pair of simultaneous linear equations.", "Connect the algebraic solution to the point of intersection."],
    criteria: ["I can make the coefficients of one unknown match.", "I can eliminate one unknown and solve for the other.", "I can check my values satisfy both equations."]
  },
  straightLine: {
    objectives: ["Identify the gradient and intercept of a straight line.", "Interpret the equation y = mx + c."],
    criteria: ["I can rearrange an equation into the form y = mx + c.", "I can state the gradient and the y-intercept.", "I know parallel lines share the same gradient."]
  },
  pythagoras: {
    objectives: ["Use Pythagoras' theorem to find a missing side.", "Decide when the theorem applies."],
    criteria: ["I can identify the hypotenuse.", "I can add the squares to find a hypotenuse, or subtract to find a shorter side.", "I can check my answer is a sensible length."]
  },
  standardForm: {
    objectives: ["Write numbers in standard form.", "Interpret positive and negative indices."],
    criteria: ["I can write the number with one non-zero digit before the point.", "I can count the decimal places moved to find the index.", "I know a small number has a negative index."]
  },
  inequality: {
    objectives: ["Solve linear inequalities.", "Represent the solution as a range of values."],
    criteria: ["I can solve an inequality as I would an equation.", "I know the sign flips when I multiply or divide by a negative.", "I can show the solution set on a number line."]
  },
  quadraticSolve: {
    objectives: ["Solve quadratic equations by factorising.", "Recognise that a quadratic usually has two solutions."],
    criteria: ["I can factorise the quadratic correctly.", "I can set each bracket equal to zero.", "I can state both solutions and check one by substitution."]
  },
  trigRightAngle: {
    objectives: ["Use sine, cosine and tangent to find a missing side.", "Choose the correct ratio for the information given."],
    criteria: ["I can label the opposite, adjacent and hypotenuse from the angle.", "I can select the ratio that links what I have to what I want.", "I can round my answer as instructed and check the calculator is in degrees."]
  },
  indices: {
    objectives: ["Apply the laws of indices to simplify expressions.", "Explain each law with a worked example."],
    criteria: ["I can add indices when multiplying powers of the same base.", "I can subtract indices when dividing.", "I can multiply indices for a power of a power."]
  },
  permutations: {
    objectives: ["Distinguish permutations from combinations.", "Calculate the number of arrangements or selections."],
    criteria: ["I can decide whether order matters in the context.", "I can select and use the correct notation.", "I can explain my choice in words."]
  },
  standardDeviation: {
    objectives: ["Calculate the mean and standard deviation of a data set.", "Interpret the standard deviation as a measure of spread."],
    criteria: ["I can find the mean accurately.", "I can square the deviations before averaging them.", "I can explain what a large or small standard deviation tells me."]
  },
  logarithms: {
    objectives: ["Convert between exponential and logarithmic form.", "Apply the laws of logarithms to simplify and solve."],
    criteria: ["I can rewrite bʸ = x as log_b x = y and back again.", "I can combine logs of the same base into a single logarithm.", "I can solve an equation by equating the arguments of two logs.", "I can check that the argument of every logarithm is positive."]
  },
  expEquations: {
    objectives: ["Solve exponential equations by writing both sides to the same base.", "Solve exponential equations by taking logarithms of both sides."],
    criteria: ["I can recognise when both sides share a base.", "I can equate indices once the bases match.", "I can take logs of both sides and bring the index down.", "I can give my answer to the required degree of accuracy."]
  },
  differentiation: {
    objectives: ["Differentiate polynomial functions.", "Interpret the derivative as a gradient function."],
    criteria: ["I can multiply by the power and reduce the power by one.", "I know the derivative of a constant is zero.", "I can explain what dy/dx represents at a point."]
  },
  integration: {
    objectives: ["Integrate polynomial functions.", "Recognise integration as the reverse of differentiation."],
    criteria: ["I can raise the power by one and divide by the new power.", "I always include the constant of integration.", "I can check my answer by differentiating it."]
  },
  binomial: {
    objectives: ["Expand expressions using the binomial theorem.", "Find a specified term or coefficient."],
    criteria: ["I can identify the correct binomial coefficient.", "I can raise the whole term to the power, not just the variable.", "I can state the required coefficient clearly."]
  }
};
