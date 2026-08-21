// AlIPS guided learning content — one mini-lesson per generator id.
// concept: short explanation; example: worked example lines (language-neutral
// math where possible); tips: key points; qEn/qAr: search queries used to build
// "deep research" links (YouTube EN/AR, Khan Academy, Corbettmaths).
// yt: optional YouTube video ID pinned by the department — when set, the video
// embeds directly in the Learn tab. Draft content: to be reviewed by the
// Mathematics Department.

const LESSONS = {
  addWithin20: {
    concept: { en: "Addition means putting amounts together. Up to 20, you can count on from the bigger number, or use number bonds to 10.", ar: "الجمع يعني ضم الكميات معاً. حتى العدد 20 يمكنك العد تصاعدياً من العدد الأكبر أو استخدام مكونات العدد 10." },
    example: ["8 + 6", "8 + 2 = 10", "10 + 4 = 14"],
    tips: [{ en: "Start from the bigger number and count on.", ar: "ابدأ من العدد الأكبر ثم عد تصاعدياً." }, { en: "Make 10 first — it makes the sum easier.", ar: "كوّن العدد 10 أولاً فذلك يسهّل الجمع." }],
    qEn: "addition within 20 for kids", qAr: "الجمع ضمن 20 للأطفال"
  },
  subWithin20: {
    concept: { en: "Subtraction means taking away, or finding the difference between two numbers. You can count back, or count up from the smaller number.", ar: "الطرح يعني الإزالة أو إيجاد الفرق بين عددين. يمكنك العد تنازلياً أو العد تصاعدياً من العدد الأصغر." },
    example: ["15 − 8", "15 − 5 = 10", "10 − 3 = 7"],
    tips: [{ en: "Subtraction and addition undo each other: check 7 + 8 = 15.", ar: "الطرح والجمع عمليتان متعاكستان: تحقق بأن 7 + 8 = 15." }],
    qEn: "subtraction within 20 strategies", qAr: "الطرح ضمن 20 للأطفال"
  },
  missingNumber: {
    concept: { en: "A missing-number problem hides one part of a sum. Work backwards: use the inverse operation to find the hidden number.", ar: "مسألة العدد المفقود تخفي جزءاً من العملية. اعمل بالعكس مستخدماً العملية المعاكسة لإيجاد العدد المخفي." },
    example: ["4 + ▢ = 11", "▢ = 11 − 4", "▢ = 7"],
    tips: [{ en: "Addition hides? Subtract. Subtraction hides? Add.", ar: "إذا كان المفقود في جمع فاطرح، وإذا كان في طرح فاجمع." }],
    qEn: "missing number problems addition", qAr: "العدد المفقود في الجمع والطرح"
  },
  placeValue: {
    concept: { en: "Each digit's value depends on its position: ones, tens, hundreds, thousands. The digit 7 in 274 is worth 70, not 7.", ar: "قيمة كل رقم تعتمد على منزلته: الآحاد والعشرات والمئات والآلاف. فالرقم 7 في 274 قيمته 70 وليس 7." },
    example: ["In 4 6 2 8:", "4 → 4000,  6 → 600,  2 → 20,  8 → 8"],
    tips: [{ en: "Write numbers in a place-value table when unsure.", ar: "اكتب الأعداد في جدول المنازل عند الشك." }],
    qEn: "place value explained", qAr: "القيمة المكانية للأعداد"
  },
  columnAdd: {
    concept: { en: "Column addition lines numbers up by place value so you add ones with ones, tens with tens — carrying a 10 to the next column when a column passes 9.", ar: "الجمع العمودي يرتّب الأعداد حسب المنازل فتجمع الآحاد مع الآحاد والعشرات مع العشرات، مع حمل 10 إلى العمود التالي عندما يتجاوز مجموع العمود 9." },
    example: ["  347", "+ 285", "  632  (7+5=12: write 2 carry 1)"],
    tips: [{ en: "Always start from the ones column.", ar: "ابدأ دائماً من عمود الآحاد." }],
    qEn: "column addition with carrying", qAr: "الجمع العمودي مع الحمل"
  },
  columnSub: {
    concept: { en: "Column subtraction works place by place, borrowing (regrouping) from the next column when the top digit is too small.", ar: "الطرح العمودي يتم منزلة منزلة، مع الاستلاف من العمود التالي عندما يكون الرقم العلوي أصغر." },
    example: ["  632", "− 285", "  347  (2<5: borrow to make 12−5)"],
    tips: [{ en: "Check by adding your answer to the number you subtracted.", ar: "تحقق بجمع ناتجك مع العدد المطروح." }],
    qEn: "column subtraction borrowing", qAr: "الطرح العمودي مع الاستلاف"
  },
  timesTables: {
    concept: { en: "Multiplication is repeated addition: 4 × 6 means four sixes. Knowing tables by heart makes all later maths faster.", ar: "الضرب هو جمع متكرر: 4 × 6 تعني أربع ستات. حفظ الجداول يجعل الرياضيات اللاحقة كلها أسرع." },
    example: ["7 × 8 = 56", "Trick: 7 × 8 = 7 × 4 × 2 = 28 × 2"],
    tips: [{ en: "Order doesn't matter: 3 × 8 = 8 × 3.", ar: "الترتيب لا يؤثر: 3 × 8 = 8 × 3." }],
    qEn: "times tables tricks", qAr: "حفظ جداول الضرب"
  },
  divisionRemainder: {
    concept: { en: "Division splits into equal groups. When it doesn't split exactly, what's left over is the remainder — always smaller than the divisor.", ar: "القسمة توزيع إلى مجموعات متساوية. وعندما لا تنقسم تماماً يبقى الباقي، وهو دائماً أصغر من المقسوم عليه." },
    example: ["23 ÷ 4", "4 × 5 = 20", "23 − 20 = 3 → answer 5 r 3"],
    tips: [{ en: "If the remainder ≥ divisor, your quotient is too small.", ar: "إذا كان الباقي ≥ المقسوم عليه فإن ناتج قسمتك صغير جداً." }],
    qEn: "division with remainders", qAr: "القسمة مع الباقي"
  },
  longMultiplication: {
    concept: { en: "To multiply big numbers, split one factor by place value, multiply each part, then add the partial products.", ar: "لضرب الأعداد الكبيرة، جزّئ أحد العددين حسب المنازل واضرب كل جزء ثم اجمع النواتج الجزئية." },
    example: ["36 × 14", "36 × 10 = 360", "36 × 4 = 144", "360 + 144 = 504"],
    tips: [{ en: "Estimate first (36 × 14 ≈ 40 × 15 = 600) to catch big errors.", ar: "قدّر أولاً (36 × 14 ≈ 40 × 15 = 600) لاكتشاف الأخطاء الكبيرة." }],
    qEn: "long multiplication method", qAr: "طريقة الضرب المطول"
  },
  fractionOfAmount: {
    concept: { en: "To find a fraction of an amount: divide by the denominator (bottom) to get one part, then multiply by the numerator (top).", ar: "لإيجاد كسر من كمية: اقسم على المقام لإيجاد الجزء الواحد ثم اضرب في البسط." },
    example: ["3/5 of 40", "40 ÷ 5 = 8", "8 × 3 = 24"],
    tips: [{ en: "\"of\" means multiply.", ar: "كلمة «من» تعني الضرب." }],
    qEn: "fraction of an amount", qAr: "إيجاد كسر من عدد"
  },
  equivalentFractions: {
    concept: { en: "Equivalent fractions look different but have the same value — made by multiplying (or dividing) top and bottom by the same number.", ar: "الكسور المتكافئة تبدو مختلفة لكن قيمتها واحدة، ونحصل عليها بضرب (أو قسمة) البسط والمقام في العدد نفسه." },
    example: ["2/3 = 4/6 = 8/12", "(×2 each time)"],
    tips: [{ en: "Whatever you do to the bottom, do to the top.", ar: "ما تفعله بالمقام افعله بالبسط." }],
    qEn: "equivalent fractions explained", qAr: "الكسور المتكافئة"
  },
  addFractions: {
    concept: { en: "Fractions can only be added when the denominators match. If they don't, rewrite both with a common denominator first.", ar: "لا تُجمع الكسور إلا إذا تساوت المقامات. وإن اختلفت فأعد كتابتها بمقام مشترك أولاً." },
    example: ["1/3 + 1/4", "= 4/12 + 3/12", "= 7/12"],
    tips: [{ en: "Never add the denominators!", ar: "لا تجمع المقامات أبداً!" }, { en: "Always simplify the final answer.", ar: "بسّط الناتج النهائي دائماً." }],
    qEn: "adding fractions different denominators", qAr: "جمع الكسور بمقامات مختلفة"
  },
  percentOfAmount: {
    concept: { en: "Per cent means \"out of 100\". Build any percentage from easy ones: 10% (divide by 10), 5% (half of that), 1% (divide by 100).", ar: "النسبة المئوية تعني «من كل 100». يمكن بناء أي نسبة من نسب سهلة: 10% (اقسم على 10)، 5% (نصفها)، 1% (اقسم على 100)." },
    example: ["35% of 80", "10% = 8 → 30% = 24", "5% = 4", "35% = 28"],
    tips: [{ en: "50% = half, 25% = quarter, 10% = tenth.", ar: "50% = النصف، 25% = الربع، 10% = العُشر." }],
    qEn: "percentage of amount without calculator", qAr: "حساب النسبة المئوية من عدد"
  },
  orderOfOperations: {
    concept: { en: "When operations mix, follow the agreed order: Brackets, Indices (powers), Division/Multiplication, Addition/Subtraction — BIDMAS.", ar: "عند اجتماع العمليات نتبع الترتيب المتفق عليه: الأقواس، ثم الأسس، ثم الضرب والقسمة، ثم الجمع والطرح." },
    example: ["3 + 4 × 5 = 3 + 20 = 23", "(3 + 4) × 5 = 35"],
    tips: [{ en: "Multiplication and division rank equally — work left to right.", ar: "الضرب والقسمة في مرتبة واحدة، فنفّذهما من اليسار إلى اليمين." }],
    qEn: "BIDMAS order of operations", qAr: "أولويات العمليات الحسابية"
  },
  areaPerimeterRect: {
    concept: { en: "Perimeter is the distance around a shape (add the sides). Area is the space inside, measured in squares: for a rectangle, length × width.", ar: "المحيط هو المسافة حول الشكل (مجموع الأضلاع)، والمساحة هي ما بداخله وتقاس بالمربعات: لمستطيل، الطول × العرض." },
    example: ["Rectangle 7 cm × 4 cm", "Perimeter = 2 × (7 + 4) = 22 cm", "Area = 7 × 4 = 28 cm²"],
    tips: [{ en: "Perimeter in cm, area in cm² — different units!", ar: "المحيط بالسنتيمتر والمساحة بالسنتيمتر المربع — وحدتان مختلفتان!" }],
    qEn: "area and perimeter rectangle", qAr: "مساحة ومحيط المستطيل"
  },
  meanOfNumbers: {
    concept: { en: "The mean is the \"fair share\" average: add all the values, then divide by how many there are.", ar: "الوسط الحسابي هو «الحصة العادلة»: اجمع كل القيم ثم اقسم على عددها." },
    example: ["Mean of 3, 7, 8, 6", "3+7+8+6 = 24", "24 ÷ 4 = 6"],
    tips: [{ en: "The mean can be a value not in the list — that's fine.", ar: "قد لا يكون الوسط أحد القيم نفسها، وهذا طبيعي." }],
    qEn: "mean average explained", qAr: "الوسط الحسابي"
  },
  negativeNumbers: {
    concept: { en: "Negative numbers sit below zero. Adding a negative moves you down the number line; subtracting a negative moves you up — two minuses make a plus.", ar: "الأعداد السالبة تقع تحت الصفر. جمع سالب ينزل بك على خط الأعداد، وطرح سالب يصعد بك — إشارتا سالب تعطيان موجباً." },
    example: ["5 − (−3) = 5 + 3 = 8", "−4 × (−2) = 8", "−4 × 2 = −8"],
    tips: [{ en: "Sketch a number line when in doubt.", ar: "ارسم خط الأعداد عند الشك." }],
    qEn: "negative numbers rules", qAr: "قواعد الأعداد السالبة"
  },
  powersRoots: {
    concept: { en: "A power is repeated multiplication: 5³ = 5 × 5 × 5. A root undoes a power: √49 asks \"what squared gives 49?\"", ar: "القوة هي ضرب متكرر: 5³ = 5 × 5 × 5. والجذر يعكس القوة: √49 تسأل «ما العدد الذي مربعه 49؟»" },
    example: ["4² = 16, 4³ = 64", "√81 = 9 because 9² = 81"],
    tips: [{ en: "Learn the square numbers to 15² = 225 by heart.", ar: "احفظ مربعات الأعداد حتى 15² = 225." }],
    qEn: "squares cubes and roots", qAr: "القوى والجذور التربيعية"
  },
  ratioSharing: {
    concept: { en: "A ratio like 2 : 3 splits something into 2 + 3 = 5 equal parts. Find one part (divide the total), then give each person their parts.", ar: "النسبة مثل 2 : 3 تقسم الشيء إلى 2 + 3 = 5 أجزاء متساوية. أوجد الجزء الواحد (اقسم المجموع) ثم أعطِ كل شخص أجزاءه." },
    example: ["Share 30 rials in 2 : 3", "5 parts → 30 ÷ 5 = 6", "Shares: 12 and 18"],
    tips: [{ en: "Check: the shares must add back to the total.", ar: "تحقق: يجب أن يعود مجموع الأنصبة إلى المجموع الكلي." }],
    qEn: "sharing in a ratio", qAr: "القسمة بنسبة معلومة"
  },
  anglesTriangle: {
    concept: { en: "The three interior angles of any triangle always add up to 180° — however the triangle is drawn.", ar: "مجموع الزوايا الداخلية الثلاث لأي مثلث يساوي 180° دائماً مهما كان شكل المثلث." },
    example: ["Angles 65° and 48°", "180 − 65 − 48 = 67°"],
    tips: [{ en: "Equilateral: all 60°. Isosceles: two equal base angles.", ar: "متساوي الأضلاع: كل زاوية 60°. متساوي الساقين: زاويتا قاعدة متساويتان." }],
    qEn: "angles in a triangle 180", qAr: "مجموع زوايا المثلث"
  },
  circleArea: {
    concept: { en: "For a circle of radius r: circumference C = 2πr (distance around) and area A = πr² (space inside). π ≈ 3.14159…", ar: "لدائرة نصف قطرها نق: المحيط = 2π×نق (المسافة حولها) والمساحة = π×نق² (ما بداخلها). π ≈ 3.14159…" },
    example: ["r = 5 cm", "C = 2π × 5 = 10π cm", "A = π × 25 = 25π cm²"],
    tips: [{ en: "Diameter given? Halve it first — the formulas use the radius.", ar: "إذا أُعطي القطر فانصفه أولاً — القوانين تستخدم نصف القطر." }],
    qEn: "circumference and area of circle", qAr: "محيط الدائرة ومساحتها"
  },
  solveLinear: {
    concept: { en: "An equation stays balanced: whatever you do to one side, do to the other. Undo operations one at a time until x stands alone.", ar: "المعادلة كالميزان: ما تفعله بطرف افعله بالطرف الآخر. اعكس العمليات واحدة تلو الأخرى حتى يبقى x وحده." },
    example: ["3x + 5 = 17", "3x = 12", "x = 4"],
    tips: [{ en: "Always check by substituting back in.", ar: "تحقق دائماً بالتعويض في المعادلة الأصلية." }],
    qEn: "solving linear equations", qAr: "حل المعادلات من الدرجة الأولى"
  },
  sequenceNth: {
    concept: { en: "For a linear sequence, the common difference tells you the multiplier of n; then adjust with a constant so the first term is right.", ar: "في المتتالية الخطية، الفرق المشترك يعطيك معامل n، ثم عدّل بثابت ليصح الحد الأول." },
    example: ["5, 8, 11, 14, …", "difference 3 → 3n", "3×1 = 3, first term 5 → +2", "nth term = 3n + 2"],
    tips: [{ en: "Test your rule on the 3rd term before moving on.", ar: "اختبر قاعدتك على الحد الثالث قبل المتابعة." }],
    qEn: "nth term of linear sequence", qAr: "الحد النوني للمتتالية الحسابية"
  },
  expandBrackets: {
    concept: { en: "Expanding means multiplying out: everything inside the bracket gets multiplied by what's outside. With two brackets, every term meets every term.", ar: "فك الأقواس يعني الضرب: كل ما داخل القوس يُضرب بما خارجه. ومع قوسين، كل حد يُضرب في كل حد." },
    example: ["(x + 3)(x − 2)", "= x² − 2x + 3x − 6", "= x² + x − 6"],
    tips: [{ en: "Watch the signs — most marks are lost there.", ar: "انتبه للإشارات — فيها تُفقد أكثر الدرجات." }],
    qEn: "expanding double brackets", qAr: "فك الأقواس في الجبر"
  },
  factorise: {
    concept: { en: "Factorising reverses expanding: pull out the common factor, or for x² + bx + c find two numbers that add to b and multiply to c.", ar: "التحليل عكس الفك: أخرج العامل المشترك، أو للمقدار x² + bx + c أوجد عددين مجموعهما b وحاصل ضربهما c." },
    example: ["x² + 5x + 6", "2 + 3 = 5, 2 × 3 = 6", "= (x + 2)(x + 3)"],
    tips: [{ en: "Check by expanding your answer back.", ar: "تحقق بفك ناتجك مرة أخرى." }],
    qEn: "factorising quadratics", qAr: "تحليل العبارات التربيعية"
  },
  simultaneous: {
    concept: { en: "Two equations, two unknowns. Make one unknown's coefficients match, subtract to eliminate it, solve what remains, then substitute back.", ar: "معادلتان ومجهولان. سَاوِ معاملي أحد المجهولين ثم اطرح لحذفه، وحل ما تبقى، ثم عوّض لإيجاد الآخر." },
    example: ["x + y = 7", "x − y = 3", "add: 2x = 10 → x = 5, y = 2"],
    tips: [{ en: "Your answers must satisfy BOTH equations — check both.", ar: "يجب أن يحقق الحل المعادلتين معاً — تحقق منهما." }],
    qEn: "simultaneous equations elimination", qAr: "حل المعادلات الآنية"
  },
  straightLine: {
    concept: { en: "Every straight line is y = mx + c: m is the gradient (steepness — rise over run) and c is where the line crosses the y-axis.", ar: "كل مستقيم يكتب بالصورة y = mx + c حيث m الميل (الارتفاع على الإزاحة) و c نقطة تقاطعه مع محور الصادات." },
    example: ["y = 2x − 3", "gradient 2, intercept (0, −3)"],
    tips: [{ en: "Parallel lines share the same gradient.", ar: "المستقيمات المتوازية لها الميل نفسه." }],
    qEn: "y=mx+c gradient intercept", qAr: "معادلة المستقيم والميل"
  },
  pythagoras: {
    concept: { en: "In a right-angled triangle, the square on the hypotenuse equals the sum of the squares on the other two sides: a² + b² = c².", ar: "في المثلث القائم، مربع الوتر يساوي مجموع مربعي الضلعين الآخرين: أ² + ب² = جـ²." },
    example: ["Sides 6 and 8", "6² + 8² = 36 + 64 = 100", "hypotenuse = √100 = 10"],
    tips: [{ en: "The hypotenuse faces the right angle and is always longest.", ar: "الوتر يقابل الزاوية القائمة وهو الأطول دائماً." }, { en: "Finding a shorter side? Subtract instead of add.", ar: "لإيجاد ضلع أقصر اطرح بدلاً من أن تجمع." }],
    qEn: "pythagoras theorem", qAr: "نظرية فيثاغورس"
  },
  standardForm: {
    concept: { en: "Standard form writes numbers as a × 10ⁿ with 1 ≤ a < 10 — ideal for very large or very small values. Big numbers get positive n, small ones negative.", ar: "الصيغة العلمية تكتب الأعداد بالشكل أ × 10^ن حيث 1 ≤ أ < 10 — مثالية للأعداد الكبيرة أو الصغيرة جداً. الكبيرة أسها موجب والصغيرة أسها سالب." },
    example: ["45 000 = 4.5 × 10⁴", "0.0032 = 3.2 × 10⁻³"],
    tips: [{ en: "Count how many places the decimal point moves.", ar: "عد كم منزلة تحركت الفاصلة العشرية." }],
    qEn: "standard form scientific notation", qAr: "الصيغة العلمية للأعداد"
  },
  inequality: {
    concept: { en: "Solve inequalities like equations, with one rule: multiplying or dividing by a negative flips the inequality sign.", ar: "تُحل المتباينات كالمعادلات مع قاعدة واحدة: الضرب أو القسمة على عدد سالب يعكس اتجاه المتباينة." },
    example: ["2x + 1 < 9", "2x < 8", "x < 4"],
    tips: [{ en: "The answer is a range, not one number — sketch it on a number line.", ar: "الحل مدى وليس عدداً واحداً — مثّله على خط الأعداد." }],
    qEn: "solving linear inequalities", qAr: "حل المتباينات الخطية"
  },
  quadraticSolve: {
    concept: { en: "A quadratic equals zero when either factor is zero. Factorise, set each bracket to 0, and you get (usually) two solutions.", ar: "تساوي المعادلة التربيعية صفراً عندما يساوي أحد عامليها صفراً. حلل، وساوِ كل قوس بالصفر، فتحصل عادةً على حلين." },
    example: ["x² − x − 6 = 0", "(x − 3)(x + 2) = 0", "x = 3 or x = −2"],
    tips: [{ en: "Won't factorise? Use the quadratic formula.", ar: "إن تعذّر التحليل فاستخدم القانون العام." }],
    qEn: "solving quadratic equations factorising", qAr: "حل المعادلة التربيعية بالتحليل"
  },
  trigRightAngle: {
    concept: { en: "SOH CAH TOA: sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent. Label the sides from the angle, pick the ratio linking what you have and want.", ar: "جا = المقابل/الوتر، جتا = المجاور/الوتر، ظا = المقابل/المجاور. سمِّ الأضلاع بالنسبة للزاوية ثم اختر النسبة التي تربط المعلوم بالمطلوب." },
    example: ["angle 30°, adjacent 6", "opposite = 6 × tan 30° ≈ 3.5"],
    tips: [{ en: "Make sure your calculator is in degrees.", ar: "تأكد أن الآلة الحاسبة على وضع الدرجات." }],
    qEn: "trigonometry SOH CAH TOA", qAr: "النسب المثلثية في المثلث القائم"
  },
  indices: {
    concept: { en: "Laws of indices: multiply → add powers; divide → subtract; power of a power → multiply. Anything to the power 0 is 1.", ar: "قوانين الأسس: عند الضرب تُجمع، وعند القسمة تُطرح، وقوة القوة تُضرب. وأي عدد أسه صفر يساوي 1." },
    example: ["x³ × x⁴ = x⁷", "x⁸ ÷ x² = x⁶", "(x²)³ = x⁶"],
    tips: [{ en: "The laws only work with the same base.", ar: "القوانين تصح فقط عندما يتحد الأساس." }],
    qEn: "laws of indices", qAr: "قوانين الأسس"
  },
  differentiation: {
    concept: { en: "Differentiation finds the gradient function — how fast y changes. For each term axⁿ: multiply by n, reduce the power by 1. Constants disappear.", ar: "التفاضل يوجد دالة الميل — أي مدى تغيّر y. لكل حد أxⁿ: اضرب في n ثم أنقص الأس بمقدار 1. ومشتقة الثابت صفر." },
    example: ["y = x³ + 5x + 2", "dy/dx = 3x² + 5"],
    tips: [{ en: "dy/dx = 0 at maximum and minimum points.", ar: "عند القيم العظمى والصغرى يكون dy/dx = 0." }],
    qEn: "differentiation basics AS maths", qAr: "أساسيات التفاضل"
  },
  integration: {
    concept: { en: "Integration reverses differentiation: raise the power by 1, divide by the new power, and always add the constant c (many curves share one gradient).", ar: "التكامل عكس التفاضل: ارفع الأس بمقدار 1 واقسم على الأس الجديد، وأضف دائماً الثابت c (منحنيات كثيرة تشترك في الميل نفسه)." },
    example: ["∫ 6x² dx", "= 6x³/3 + c", "= 2x³ + c"],
    tips: [{ en: "Forgetting + c loses a mark every time.", ar: "نسيان + c يفقدك درجة في كل مرة." }],
    qEn: "integration basics AS maths", qAr: "أساسيات التكامل"
  },
  binomial: {
    concept: { en: "The binomial expansion of (1 + ax)ⁿ has terms C(n,k)·(ax)ᵏ — the coefficients C(n,k) come from Pascal's triangle or the nCr button.", ar: "مفكوك ذي الحدين لـ (1 + ax)ⁿ حدوده C(n,k)·(ax)ᵏ — والمعاملات C(n,k) من مثلث باسكال أو زر nCr في الآلة." },
    example: ["(1 + 2x)⁴, term in x²", "C(4,2) × (2x)² = 6 × 4x² = 24x²"],
    tips: [{ en: "The powers of a matter: (ax)ᵏ = aᵏxᵏ.", ar: "قوى a مهمة: (ax)ᵏ = aᵏxᵏ." }],
    qEn: "binomial expansion AS level", qAr: "مفكوك ذي الحدين"
  }
};

// Deep-research links built from the lesson's search queries.
function researchLinks(id, lang) {
  const L = LESSONS[id];
  if (!L) return [];
  const enc = encodeURIComponent;
  return [
    { label: { en: "▶ YouTube (English)", ar: "▶ يوتيوب (إنجليزي)" }, url: `https://www.youtube.com/results?search_query=${enc(L.qEn + " math")}` },
    { label: { en: "▶ YouTube (Arabic)", ar: "▶ يوتيوب (عربي)" }, url: `https://www.youtube.com/results?search_query=${enc(L.qAr)}` },
    { label: { en: "Khan Academy", ar: "أكاديمية خان" }, url: `https://www.khanacademy.org/search?page_search_query=${enc(L.qEn)}` },
    { label: { en: "Corbettmaths", ar: "Corbettmaths" }, url: `https://corbettmaths.com/?s=${enc(L.qEn)}` }
  ];
}
