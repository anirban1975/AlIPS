// AlIPS Math Curriculum — DRAFT starter dataset.
// Structure: grade -> strands -> topics.
// Each topic: n = name, s = student-facing description, t = teacher note,
// c = curriculum tag: "cambridge" | "oman" | "both".
// Content is a draft to be verified and expanded by the math department
// against the official Cambridge frameworks and the Oman bilingual syllabus.

const T = (en, ar) => ({ en, ar });

const CURRICULUM = [
  {
    id: 1,
    stage: T("Cambridge Primary — Stage 1", "كامبريدج الابتدائية — المرحلة 1"),
    strands: [
      {
        name: T("Number", "الأعداد"),
        topics: [
          { n: T("Counting to 100", "العد حتى 100"), c: "both",
            s: T("Count objects, read and write numbers up to 100.", "عدّ الأشياء وقراءة وكتابة الأعداد حتى 100."),
            t: T("Emphasise one-to-one correspondence and conservation of number.", "التركيز على التناظر الأحادي وثبات العدد.") },
          { n: T("Addition and subtraction within 20", "الجمع والطرح ضمن 20"), c: "both",
            s: T("Add and take away small numbers using objects and number lines.", "الجمع والطرح باستخدام الأشياء وخط الأعداد."),
            t: T("Build number bonds to 10 before formal symbols.", "بناء مكونات العدد 10 قبل الرموز الرسمية.") },
          { n: T("Place value: tens and ones", "القيمة المكانية: العشرات والآحاد"), c: "both",
            s: T("Split two-digit numbers into tens and ones.", "تحليل الأعداد المكونة من رقمين إلى عشرات وآحاد."),
            t: T("Use base-ten blocks; link to counting in tens.", "استخدام مكعبات الأساس عشرة وربطها بالعد بالعشرات.") }
        ]
      },
      {
        name: T("Geometry and Measure", "الهندسة والقياس"),
        topics: [
          { n: T("2D and 3D shapes", "الأشكال المستوية والمجسمات"), c: "both",
            s: T("Name circles, squares, triangles, cubes and spheres.", "تسمية الدوائر والمربعات والمثلثات والمكعبات والكرات."),
            t: T("Sort shapes by properties, not appearance only.", "تصنيف الأشكال حسب الخصائص لا الشكل الظاهري فقط.") },
          { n: T("Comparing length and mass", "مقارنة الطول والكتلة"), c: "both",
            s: T("Say which object is longer, shorter, heavier or lighter.", "تحديد الأطول والأقصر والأثقل والأخف."),
            t: T("Non-standard units first (hand spans, cubes).", "وحدات غير قياسية أولاً (شبر اليد، المكعبات).") },
          { n: T("Time: days of the week, o'clock", "الزمن: أيام الأسبوع والساعات الكاملة"), c: "both",
            s: T("Order the days and read times like 3 o'clock.", "ترتيب أيام الأسبوع وقراءة الساعات الكاملة.") }
        ]
      },
      {
        name: T("Statistics", "الإحصاء"),
        topics: [
          { n: T("Pictograms and simple lists", "التمثيل بالصور والقوائم البسيطة"), c: "both",
            s: T("Collect information and show it with pictures.", "جمع المعلومات وعرضها بالصور."),
            t: T("Data drawn from the children's own classroom surveys.", "بيانات مأخوذة من استطلاعات الصف نفسه.") }
        ]
      }
    ]
  },
  {
    id: 2,
    stage: T("Cambridge Primary — Stage 2", "كامبريدج الابتدائية — المرحلة 2"),
    strands: [
      {
        name: T("Number", "الأعداد"),
        topics: [
          { n: T("Numbers to 100 and beyond", "الأعداد حتى 100 وما بعدها"), c: "both" },
          { n: T("Two-digit addition and subtraction", "جمع وطرح الأعداد من رقمين"), c: "both" },
          { n: T("Multiplication tables: 2, 5, 10", "جداول الضرب: 2 و5 و10"), c: "both" }
        ]
      },
      {
        name: T("Geometry and Measure", "الهندسة والقياس"),
        topics: [
          { n: T("Symmetry in shapes", "التماثل في الأشكال"), c: "both" },
          { n: T("Money: rials and baisa", "النقود: الريال والبيسة"), c: "oman",
            s: T("Count Omani money and make simple totals.", "عدّ النقود العُمانية وحساب مجاميع بسيطة.") },
          { n: T("Time: half past", "الزمن: الساعة والنصف"), c: "both" }
        ]
      },
      {
        name: T("Statistics", "الإحصاء"),
        topics: [
          { n: T("Block graphs", "الرسوم البيانية بالمكعبات"), c: "both" }
        ]
      }
    ]
  },
  {
    id: 3,
    stage: T("Cambridge Primary — Stage 3", "كامبريدج الابتدائية — المرحلة 3"),
    strands: [
      {
        name: T("Number", "الأعداد"),
        topics: [
          { n: T("Numbers to 1000", "الأعداد حتى 1000"), c: "both" },
          { n: T("Three-digit addition and subtraction", "جمع وطرح الأعداد من ثلاثة أرقام"), c: "both" },
          { n: T("Multiplication tables: 3, 4, 8", "جداول الضرب: 3 و4 و8"), c: "both" },
          { n: T("Fractions: halves, thirds, quarters", "الكسور: الأنصاف والأثلاث والأرباع"), c: "both" }
        ]
      },
      {
        name: T("Geometry and Measure", "الهندسة والقياس"),
        topics: [
          { n: T("Right angles and turns", "الزوايا القائمة والدورات"), c: "both" },
          { n: T("Perimeter of simple shapes", "محيط الأشكال البسيطة"), c: "both" },
          { n: T("Time to the nearest minute", "قراءة الزمن لأقرب دقيقة"), c: "both" }
        ]
      },
      {
        name: T("Statistics", "الإحصاء"),
        topics: [
          { n: T("Venn and Carroll diagrams", "مخططات فن وكارول"), c: "cambridge" },
          { n: T("Tally charts and frequency tables", "جداول التكرار وعلامات العد"), c: "both" }
        ]
      }
    ]
  },
  {
    id: 4,
    stage: T("Cambridge Primary — Stage 4", "كامبريدج الابتدائية — المرحلة 4"),
    strands: [
      {
        name: T("Number", "الأعداد"),
        topics: [
          { n: T("Numbers to 10 000", "الأعداد حتى 10000"), c: "both" },
          { n: T("Decimals: tenths and hundredths", "الأعشار وأجزاء المئة العشرية"), c: "both" },
          { n: T("Written multiplication methods", "طرق الضرب الكتابية"), c: "both" },
          { n: T("Fraction and decimal equivalence", "التكافؤ بين الكسور والأعداد العشرية"), c: "both" }
        ]
      },
      {
        name: T("Geometry and Measure", "الهندسة والقياس"),
        topics: [
          { n: T("Area and perimeter of rectangles", "مساحة ومحيط المستطيلات"), c: "both" },
          { n: T("Lines of symmetry", "محاور التماثل"), c: "both" },
          { n: T("Coordinates: first quadrant", "الإحداثيات: الربع الأول"), c: "both" }
        ]
      },
      {
        name: T("Statistics", "الإحصاء"),
        topics: [
          { n: T("Bar charts", "الأعمدة البيانية"), c: "both" }
        ]
      }
    ]
  },
  {
    id: 5,
    stage: T("Cambridge Primary — Stage 5", "كامبريدج الابتدائية — المرحلة 5"),
    strands: [
      {
        name: T("Number", "الأعداد"),
        topics: [
          { n: T("Place value to 1 000 000 and decimals", "القيمة المكانية حتى المليون والأعداد العشرية"), c: "both",
            s: T("Read, write and compare large numbers and decimals.", "قراءة وكتابة ومقارنة الأعداد الكبيرة والعشرية."),
            t: T("Link decimal place value to measures (m, cm; rial, baisa).", "ربط القيمة المكانية العشرية بالقياسات (المتر والسنتيمتر؛ الريال والبيسة).") },
          { n: T("Multiplying and dividing by 2-digit numbers", "الضرب والقسمة على أعداد من رقمين"), c: "both",
            s: T("Use written methods for harder multiplications and divisions.", "استخدام الطرق الكتابية لعمليات الضرب والقسمة الأصعب."),
            t: T("Secure times-table fluency before long methods.", "إتقان جداول الضرب قبل الطرق المطوّلة.") },
          { n: T("Equivalent fractions and adding fractions", "الكسور المتكافئة وجمع الكسور"), c: "both",
            s: T("Find fractions that mean the same and add simple fractions.", "إيجاد الكسور المتكافئة وجمع الكسور البسيطة."),
            t: T("Use fraction walls and number lines, not rules alone.", "استخدام جدار الكسور وخط الأعداد لا القواعد المجردة فقط.") },
          { n: T("Percentages: meaning and simple cases", "النسبة المئوية: المعنى وحالات بسيطة"), c: "both",
            s: T("Understand % as 'out of 100' and find 50%, 25%, 10%.", "فهم النسبة المئوية على أنها من 100 وإيجاد 50% و25% و10%.") }
        ]
      },
      {
        name: T("Algebra foundations", "أسس الجبر"),
        topics: [
          { n: T("Number sequences and patterns", "المتتاليات والأنماط العددية"), c: "both",
            s: T("Continue patterns and describe the rule.", "إكمال الأنماط ووصف القاعدة."),
            t: T("Ask for the rule in words first; term-to-term thinking.", "التعبير عن القاعدة لفظياً أولاً؛ التفكير من حد إلى حد.") }
        ]
      },
      {
        name: T("Geometry and Measure", "الهندسة والقياس"),
        topics: [
          { n: T("Measuring and drawing angles", "قياس الزوايا ورسمها"), c: "both",
            s: T("Use a protractor to measure and draw angles.", "استخدام المنقلة لقياس الزوايا ورسمها.") },
          { n: T("Triangles and their properties", "المثلثات وخصائصها"), c: "both",
            s: T("Sort triangles: equilateral, isosceles, scalene.", "تصنيف المثلثات: متساوي الأضلاع، متساوي الساقين، مختلف الأضلاع.") },
          { n: T("Perimeter and area of compound shapes", "محيط ومساحة الأشكال المركبة"), c: "both",
            t: T("Decompose shapes into rectangles; estimate before calculating.", "تجزئة الأشكال إلى مستطيلات؛ التقدير قبل الحساب.") },
          { n: T("Coordinates and translation", "الإحداثيات والانسحاب"), c: "both" }
        ]
      },
      {
        name: T("Statistics and Probability", "الإحصاء والاحتمالات"),
        topics: [
          { n: T("Bar and line graphs", "الأعمدة البيانية والتمثيل بالخطوط"), c: "both",
            s: T("Draw graphs and answer questions from them.", "رسم التمثيلات البيانية والإجابة عن أسئلة منها.") },
          { n: T("Mode and median", "المنوال والوسيط"), c: "both" },
          { n: T("The language of chance", "لغة الاحتمال"), c: "both",
            s: T("Use words like certain, likely, impossible.", "استخدام كلمات مثل مؤكد، محتمل، مستحيل.") }
        ]
      }
    ]
  },
  {
    id: 6,
    stage: T("Cambridge Primary — Stage 6", "كامبريدج الابتدائية — المرحلة 6"),
    strands: [
      {
        name: T("Number", "الأعداد"),
        topics: [
          { n: T("Order of operations", "أولويات العمليات"), c: "both" },
          { n: T("Multiplying and dividing fractions", "ضرب الكسور وقسمتها"), c: "both" },
          { n: T("Ratio: introduction", "مقدمة في النسبة"), c: "both" }
        ]
      },
      {
        name: T("Algebra foundations", "أسس الجبر"),
        topics: [
          { n: T("Expressions and simple formulae", "التعابير والصيغ البسيطة"), c: "both" }
        ]
      },
      {
        name: T("Geometry and Measure", "الهندسة والقياس"),
        topics: [
          { n: T("Angles in triangles and on a line", "الزوايا في المثلث وعلى المستقيم"), c: "both" },
          { n: T("Volume of cuboids", "حجم متوازيات المستطيلات"), c: "both" }
        ]
      },
      {
        name: T("Statistics and Probability", "الإحصاء والاحتمالات"),
        topics: [
          { n: T("Pie charts: reading and interpreting", "قراءة وتفسير القطاعات الدائرية"), c: "both" },
          { n: T("The mean", "الوسط الحسابي"), c: "both" }
        ]
      }
    ]
  },
  {
    id: 7,
    stage: T("Cambridge Lower Secondary — Stage 7", "كامبريدج للمرحلة الإعدادية — المرحلة 7"),
    strands: [
      {
        name: T("Number", "الأعداد"),
        topics: [
          { n: T("Negative numbers and integers", "الأعداد السالبة والأعداد الصحيحة"), c: "both" },
          { n: T("Fractions, decimals and percentages", "الكسور والأعداد العشرية والنسب المئوية"), c: "both" }
        ]
      },
      {
        name: T("Algebra", "الجبر"),
        topics: [
          { n: T("Expressions and formulae", "التعابير والصيغ"), c: "both" },
          { n: T("Solving simple equations", "حل المعادلات البسيطة"), c: "both" }
        ]
      },
      {
        name: T("Geometry and Measure", "الهندسة والقياس"),
        topics: [
          { n: T("Angles and parallel lines", "الزوايا والمستقيمات المتوازية"), c: "both" },
          { n: T("Area of triangles and compound shapes", "مساحة المثلثات والأشكال المركبة"), c: "both" }
        ]
      },
      {
        name: T("Statistics and Probability", "الإحصاء والاحتمالات"),
        topics: [
          { n: T("Averages and range", "المتوسطات والمدى"), c: "both" },
          { n: T("The probability scale 0 to 1", "مقياس الاحتمال من 0 إلى 1"), c: "both" }
        ]
      }
    ]
  },
  {
    id: 8,
    stage: T("Cambridge Lower Secondary — Stage 8", "كامبريدج للمرحلة الإعدادية — المرحلة 8"),
    strands: [
      {
        name: T("Number", "الأعداد"),
        topics: [
          { n: T("Powers and roots", "القوى والجذور"), c: "both" },
          { n: T("Ratio and rates", "النسبة والمعدلات"), c: "both" }
        ]
      },
      {
        name: T("Algebra", "الجبر"),
        topics: [
          { n: T("Linear functions and graphs", "الدوال الخطية وتمثيلها البياني"), c: "both" },
          { n: T("Equations with brackets", "المعادلات ذات الأقواس"), c: "both" }
        ]
      },
      {
        name: T("Geometry and Measure", "الهندسة والقياس"),
        topics: [
          { n: T("Circumference and area of circles", "محيط الدائرة ومساحتها"), c: "both" },
          { n: T("Transformations: reflection, rotation, translation", "التحويلات الهندسية: الانعكاس والدوران والانسحاب"), c: "both" }
        ]
      },
      {
        name: T("Statistics and Probability", "الإحصاء والاحتمالات"),
        topics: [
          { n: T("Collecting and organising data", "جمع البيانات وتنظيمها"), c: "both" },
          { n: T("Relative frequency", "التكرار النسبي"), c: "both" }
        ]
      }
    ]
  },
  {
    id: 9,
    stage: T("Cambridge Lower Secondary — Stage 9", "كامبريدج للمرحلة الإعدادية — المرحلة 9"),
    strands: [
      {
        name: T("Number", "الأعداد"),
        topics: [
          { n: T("Standard form", "الصيغة العلمية"), c: "both",
            s: T("Write very large and very small numbers as a × 10ⁿ.", "كتابة الأعداد الكبيرة جداً والصغيرة جداً بصورة أ × 10^ن."),
            t: T("Link to science contexts (distances, cell sizes).", "الربط بسياقات علمية (المسافات، أحجام الخلايا).") },
          { n: T("Rounding, estimation and bounds", "التقريب والتقدير وحدود الدقة"), c: "both",
            s: T("Round sensibly and estimate answers before calculating.", "التقريب المنطقي وتقدير النواتج قبل الحساب.") },
          { n: T("Direct and inverse proportion", "التناسب الطردي والعكسي"), c: "both",
            t: T("Contrast multiplicative with additive reasoning explicitly.", "التمييز الصريح بين التفكير الضربي والتفكير الجمعي.") }
        ]
      },
      {
        name: T("Algebra", "الجبر"),
        topics: [
          { n: T("Expanding and factorising", "فك الأقواس والتحليل إلى عوامل"), c: "both",
            s: T("Multiply out brackets and reverse the process.", "فك الأقواس وعكس العملية بالتحليل."),
            t: T("Use area models to make expansion visible.", "استخدام نماذج المساحة لتوضيح فك الأقواس.") },
          { n: T("Linear equations and inequalities", "المعادلات والمتباينات الخطية"), c: "both",
            s: T("Solve equations with unknowns on both sides.", "حل معادلات فيها المجهول في الطرفين.") },
          { n: T("Simultaneous linear equations", "المعادلات الخطية الآنية"), c: "both",
            t: T("Connect the algebraic solution to the graphical intersection.", "ربط الحل الجبري بنقطة التقاطع بيانياً.") },
          { n: T("Straight-line graphs: y = mx + c", "المستقيمات: ص = م س + ج"), c: "both",
            s: T("Understand gradient and intercept.", "فهم الميل والمقطع الصادي.") }
        ]
      },
      {
        name: T("Geometry and Measure", "الهندسة والقياس"),
        topics: [
          { n: T("Pythagoras' theorem", "نظرية فيثاغورس"), c: "both",
            s: T("Find missing sides in right-angled triangles.", "إيجاد الأضلاع المجهولة في المثلثات القائمة."),
            t: T("Derive it with area proofs before applying the formula.", "استنتاجها ببراهين المساحة قبل تطبيق القاعدة.") },
          { n: T("Constructions and bearings", "الإنشاءات الهندسية والاتجاهات"), c: "both" },
          { n: T("Enlargement and scale factors", "التكبير ومعامل القياس"), c: "both" }
        ]
      },
      {
        name: T("Statistics and Probability", "الإحصاء والاحتمالات"),
        topics: [
          { n: T("Scatter graphs and correlation", "الانتشار والارتباط"), c: "both",
            s: T("Plot two variables and describe the relationship.", "تمثيل متغيرين ووصف العلاقة بينهما.") },
          { n: T("Probability of combined events", "احتمال الحوادث المركبة"), c: "both",
            t: T("Sample-space diagrams before tree diagrams.", "مخططات فضاء العينة قبل مخططات الشجرة.") }
        ]
      }
    ]
  },
  {
    id: 10,
    stage: T("Cambridge IGCSE — Year 1", "كامبريدج IGCSE — السنة الأولى"),
    strands: [
      {
        name: T("Number", "الأعداد"),
        topics: [
          { n: T("Indices and surds", "الأسس والجذور الصماء"), c: "cambridge" },
          { n: T("Percentages: compound interest and reverse", "النسب المئوية: الفائدة المركبة والعكسية"), c: "both" }
        ]
      },
      {
        name: T("Algebra", "الجبر"),
        topics: [
          { n: T("Quadratic equations: factorising and formula", "المعادلات التربيعية: التحليل والقانون العام"), c: "cambridge" },
          { n: T("Functions and function notation", "الدوال ورموزها"), c: "cambridge" }
        ]
      },
      {
        name: T("Geometry and Trigonometry", "الهندسة وحساب المثلثات"),
        topics: [
          { n: T("Right-angled trigonometry (sin, cos, tan)", "حساب المثلثات في المثلث القائم (جا، جتا، ظا)"), c: "both" },
          { n: T("Circle theorems", "نظريات الدائرة"), c: "cambridge" },
          { n: T("Similarity and congruence", "التشابه والتطابق"), c: "both" }
        ]
      },
      {
        name: T("Statistics and Probability", "الإحصاء والاحتمالات"),
        topics: [
          { n: T("Cumulative frequency and quartiles", "التكرار التراكمي والربيعيات"), c: "cambridge" },
          { n: T("Tree diagrams", "مخططات الشجرة"), c: "both" }
        ]
      }
    ]
  },
  {
    id: 11,
    stage: T("Cambridge IGCSE — Year 2", "كامبريدج IGCSE — السنة الثانية"),
    strands: [
      {
        name: T("Algebra", "الجبر"),
        topics: [
          { n: T("Composite and inverse functions", "الدوال المركبة والعكسية"), c: "cambridge" },
          { n: T("Graphs of functions and their transformations", "منحنيات الدوال وتحويلاتها"), c: "cambridge" }
        ]
      },
      {
        name: T("Geometry and Trigonometry", "الهندسة وحساب المثلثات"),
        topics: [
          { n: T("Sine and cosine rules", "قانونا الجيب وجيب التمام"), c: "cambridge" },
          { n: T("Vectors", "المتجهات"), c: "cambridge" },
          { n: T("Mensuration: spheres, cones, pyramids", "القياس: الكرات والمخاريط والأهرامات"), c: "both" }
        ]
      },
      {
        name: T("Statistics and Probability", "الإحصاء والاحتمالات"),
        topics: [
          { n: T("Histograms with unequal intervals", "المدرجات التكرارية بفئات غير متساوية"), c: "cambridge" },
          { n: T("Conditional probability", "الاحتمال المشروط"), c: "cambridge" }
        ]
      }
    ]
  },
  {
    id: 12,
    stage: T("Cambridge International AS Level", "كامبريدج الدولية — المستوى AS"),
    strands: [
      {
        name: T("Pure Mathematics", "الرياضيات البحتة"),
        topics: [
          { n: T("Quadratics and polynomials", "الدوال التربيعية وكثيرات الحدود"), c: "cambridge" },
          { n: T("Coordinate geometry of the line and circle", "الهندسة الإحداثية للمستقيم والدائرة"), c: "cambridge" },
          { n: T("Differentiation and its applications", "التفاضل وتطبيقاته"), c: "cambridge" },
          { n: T("Integration", "التكامل"), c: "cambridge" },
          { n: T("Trigonometry: identities and equations", "حساب المثلثات: المتطابقات والمعادلات"), c: "cambridge" },
          { n: T("Binomial expansion and series", "مفكوك ذي الحدين والمتسلسلات"), c: "cambridge" }
        ]
      },
      {
        name: T("Probability and Statistics", "الاحتمالات والإحصاء"),
        topics: [
          { n: T("Representation of data", "تمثيل البيانات"), c: "cambridge" },
          { n: T("Permutations and combinations", "التباديل والتوافيق"), c: "cambridge" },
          { n: T("Discrete random variables", "المتغيرات العشوائية المنفصلة"), c: "cambridge" }
        ]
      }
    ]
  }
];

const UI_STRINGS = {
  schoolName: T("Al Injaz International Private School", "مدرسة الإنجاز الدولية الخاصة"),
  appSubtitle: T("Mathematics Department — Curriculum Browser (Draft)", "قسم الرياضيات — متصفح المنهج (مسودة)"),
  grades: T("Grades", "الصفوف"),
  gradePrefix: T("Grade", "الصف"),
  studentView: T("Student", "طالب"),
  teacherView: T("Teacher", "معلم"),
  cambridge: T("Cambridge", "كامبريدج"),
  oman: T("Oman Bilingual", "المنهج العُماني ثنائي اللغة"),
  bothCurricula: T("Both curricula", "المنهجان معاً"),
  searchPlaceholder: T("Search topics…", "ابحث عن المواضيع…"),
  teacherNoteLabel: T("Teaching note", "ملاحظة تدريسية"),
  noResults: T("No topics match your search in this grade.", "لا توجد مواضيع مطابقة لبحثك في هذا الصف."),
  langButton: T("العربية", "English"),
  draftNote: T("Draft content — to be verified by the Mathematics Department against the official Cambridge and Oman bilingual frameworks.",
               "محتوى أولي — يُراجع من قِبل قسم الرياضيات وفق أطر كامبريدج والمنهج العُماني ثنائي اللغة الرسمية.")
};
