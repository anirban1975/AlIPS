// AlIPS Math Curriculum — DRAFT starter dataset (English).
// Structure: grade -> strands -> topics.
// Each topic: n = name, s = student-facing description, t = teacher note,
// c = curriculum tag: "cambridge" | "oman" | "both".
// Content is a draft to be verified and expanded by the math department
// against the official Cambridge frameworks and the Oman bilingual syllabus.

const CURRICULUM = [
  {
    id: 1,
    stage: "Cambridge Primary — Stage 1",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Counting to 100", c: "both",
            s: "Count objects, read and write numbers up to 100.",
            t: "Emphasise one-to-one correspondence and conservation of number." },
          { n: "Addition and subtraction within 20", c: "both",
            s: "Add and take away small numbers using objects and number lines.",
            t: "Build number bonds to 10 before formal symbols." },
          { n: "Place value: tens and ones", c: "both",
            s: "Split two-digit numbers into tens and ones.",
            t: "Use base-ten blocks; link to counting in tens." }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "2D and 3D shapes", c: "both",
            s: "Name circles, squares, triangles, cubes and spheres.",
            t: "Sort shapes by properties, not appearance only." },
          { n: "Comparing length and mass", c: "both",
            s: "Say which object is longer, shorter, heavier or lighter.",
            t: "Non-standard units first (hand spans, cubes)." },
          { n: "Time: days of the week, o'clock", c: "both",
            s: "Order the days and read times like 3 o'clock." }
        ]
      },
      {
        name: "Statistics",
        topics: [
          { n: "Pictograms and simple lists", c: "both",
            s: "Collect information and show it with pictures.",
            t: "Data drawn from the children's own classroom surveys." }
        ]
      }
    ]
  },
  {
    id: 2,
    stage: "Cambridge Primary — Stage 2",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Numbers to 100 and beyond", c: "both" },
          { n: "Two-digit addition and subtraction", c: "both" },
          { n: "Multiplication tables: 2, 5, 10", c: "both" }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Symmetry in shapes", c: "both" },
          { n: "Money: rials and baisa", c: "oman",
            s: "Count Omani money and make simple totals." },
          { n: "Time: half past", c: "both" }
        ]
      },
      {
        name: "Statistics",
        topics: [
          { n: "Block graphs", c: "both" }
        ]
      }
    ]
  },
  {
    id: 3,
    stage: "Cambridge Primary — Stage 3",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Numbers to 1000", c: "both" },
          { n: "Three-digit addition and subtraction", c: "both" },
          { n: "Multiplication tables: 3, 4, 8", c: "both" },
          { n: "Fractions: halves, thirds, quarters", c: "both" }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Right angles and turns", c: "both" },
          { n: "Perimeter of simple shapes", c: "both" },
          { n: "Time to the nearest minute", c: "both" }
        ]
      },
      {
        name: "Statistics",
        topics: [
          { n: "Venn and Carroll diagrams", c: "cambridge" },
          { n: "Tally charts and frequency tables", c: "both" }
        ]
      }
    ]
  },
  {
    id: 4,
    stage: "Cambridge Primary — Stage 4",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Numbers to 10 000", c: "both" },
          { n: "Decimals: tenths and hundredths", c: "both" },
          { n: "Written multiplication methods", c: "both" },
          { n: "Fraction and decimal equivalence", c: "both" }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Area and perimeter of rectangles", c: "both" },
          { n: "Lines of symmetry", c: "both" },
          { n: "Coordinates: first quadrant", c: "both" }
        ]
      },
      {
        name: "Statistics",
        topics: [
          { n: "Bar charts", c: "both" }
        ]
      }
    ]
  },
  {
    id: 5,
    stage: "Cambridge Primary — Stage 5",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Place value to 1 000 000 and decimals", c: "both",
            s: "Read, write and compare large numbers and decimals.",
            t: "Link decimal place value to measures (m, cm; rial, baisa)." },
          { n: "Multiplying and dividing by 2-digit numbers", c: "both",
            s: "Use written methods for harder multiplications and divisions.",
            t: "Secure times-table fluency before long methods." },
          { n: "Equivalent fractions and adding fractions", c: "both",
            s: "Find fractions that mean the same and add simple fractions.",
            t: "Use fraction walls and number lines, not rules alone." },
          { n: "Percentages: meaning and simple cases", c: "both",
            s: "Understand % as 'out of 100' and find 50%, 25%, 10%." }
        ]
      },
      {
        name: "Algebra foundations",
        topics: [
          { n: "Number sequences and patterns", c: "both",
            s: "Continue patterns and describe the rule.",
            t: "Ask for the rule in words first; term-to-term thinking." }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Measuring and drawing angles", c: "both",
            s: "Use a protractor to measure and draw angles." },
          { n: "Triangles and their properties", c: "both",
            s: "Sort triangles: equilateral, isosceles, scalene." },
          { n: "Perimeter and area of compound shapes", c: "both",
            t: "Decompose shapes into rectangles; estimate before calculating." },
          { n: "Coordinates and translation", c: "both" }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Bar and line graphs", c: "both",
            s: "Draw graphs and answer questions from them." },
          { n: "Mode and median", c: "both" },
          { n: "The language of chance", c: "both",
            s: "Use words like certain, likely, impossible." }
        ]
      }
    ]
  },
  {
    id: 6,
    stage: "Cambridge Primary — Stage 6",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Order of operations", c: "both" },
          { n: "Multiplying and dividing fractions", c: "both" },
          { n: "Ratio: introduction", c: "both" }
        ]
      },
      {
        name: "Algebra foundations",
        topics: [
          { n: "Expressions and simple formulae", c: "both" }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Angles in triangles and on a line", c: "both" },
          { n: "Volume of cuboids", c: "both" }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Pie charts: reading and interpreting", c: "both" },
          { n: "The mean", c: "both" }
        ]
      }
    ]
  },
  {
    id: 7,
    stage: "Cambridge Lower Secondary — Stage 7",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Negative numbers and integers", c: "both" },
          { n: "Fractions, decimals and percentages", c: "both" }
        ]
      },
      {
        name: "Algebra",
        topics: [
          { n: "Expressions and formulae", c: "both" },
          { n: "Solving simple equations", c: "both" }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Angles and parallel lines", c: "both" },
          { n: "Area of triangles and compound shapes", c: "both" }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Averages and range", c: "both" },
          { n: "The probability scale 0 to 1", c: "both" }
        ]
      }
    ]
  },
  {
    id: 8,
    stage: "Cambridge Lower Secondary — Stage 8",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Powers and roots", c: "both" },
          { n: "Ratio and rates", c: "both" }
        ]
      },
      {
        name: "Algebra",
        topics: [
          { n: "Linear functions and graphs", c: "both" },
          { n: "Equations with brackets", c: "both" }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Circumference and area of circles", c: "both" },
          { n: "Transformations: reflection, rotation, translation", c: "both" }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Collecting and organising data", c: "both" },
          { n: "Relative frequency", c: "both" }
        ]
      }
    ]
  },
  {
    id: 9,
    stage: "Cambridge Lower Secondary — Stage 9",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Standard form", c: "both",
            s: "Write very large and very small numbers as a × 10ⁿ.",
            t: "Link to science contexts (distances, cell sizes)." },
          { n: "Rounding, estimation and bounds", c: "both",
            s: "Round sensibly and estimate answers before calculating." },
          { n: "Direct and inverse proportion", c: "both",
            t: "Contrast multiplicative with additive reasoning explicitly." }
        ]
      },
      {
        name: "Algebra",
        topics: [
          { n: "Expanding and factorising", c: "both",
            s: "Multiply out brackets and reverse the process.",
            t: "Use area models to make expansion visible." },
          { n: "Linear equations and inequalities", c: "both",
            s: "Solve equations with unknowns on both sides." },
          { n: "Simultaneous linear equations", c: "both",
            t: "Connect the algebraic solution to the graphical intersection." },
          { n: "Straight-line graphs: y = mx + c", c: "both",
            s: "Understand gradient and intercept." }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Pythagoras' theorem", c: "both",
            s: "Find missing sides in right-angled triangles.",
            t: "Derive it with area proofs before applying the formula." },
          { n: "Constructions and bearings", c: "both" },
          { n: "Enlargement and scale factors", c: "both" }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Scatter graphs and correlation", c: "both",
            s: "Plot two variables and describe the relationship." },
          { n: "Probability of combined events", c: "both",
            t: "Sample-space diagrams before tree diagrams." }
        ]
      }
    ]
  },
  {
    id: 10,
    stage: "Cambridge IGCSE — Year 1",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Indices and surds", c: "cambridge" },
          { n: "Percentages: compound interest and reverse", c: "both" }
        ]
      },
      {
        name: "Algebra",
        topics: [
          { n: "Quadratic equations: factorising and formula", c: "cambridge" },
          { n: "Functions and function notation", c: "cambridge" }
        ]
      },
      {
        name: "Geometry and Trigonometry",
        topics: [
          { n: "Right-angled trigonometry (sin, cos, tan)", c: "both" },
          { n: "Circle theorems", c: "cambridge" },
          { n: "Similarity and congruence", c: "both" }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Cumulative frequency and quartiles", c: "cambridge" },
          { n: "Tree diagrams", c: "both" }
        ]
      }
    ]
  },
  {
    id: 11,
    stage: "Cambridge IGCSE / AS — Year 2",
    strands: [
      {
        name: "Algebra",
        topics: [
          { n: "Composite and inverse functions", c: "cambridge" },
          { n: "Graphs of functions and their transformations", c: "cambridge" }
        ]
      },
      {
        name: "Geometry and Trigonometry",
        topics: [
          { n: "Sine and cosine rules", c: "cambridge" },
          { n: "Vectors", c: "cambridge" },
          { n: "Mensuration: spheres, cones, pyramids", c: "both" }
        ]
      },
      {
        name: "Probability and Statistics",
        topics: [
          { n: "Histograms with unequal intervals", c: "cambridge" },
          { n: "Conditional probability", c: "cambridge" },
          { n: "Permutations and combinations", c: "cambridge" },
          { n: "Mean and standard deviation", c: "cambridge" }
        ]
      }
    ]
  },
  {
    id: 12,
    stage: "Cambridge International AS Level",
    strands: [
      {
        name: "Pure Mathematics",
        topics: [
          { n: "Quadratics and polynomials", c: "cambridge" },
          { n: "Coordinate geometry of the line and circle", c: "cambridge" },
          { n: "Differentiation and its applications", c: "cambridge" },
          { n: "Integration", c: "cambridge" },
          { n: "Trigonometry: identities and equations", c: "cambridge" },
          { n: "Binomial expansion and series", c: "cambridge" }
        ]
      },
      {
        name: "Probability and Statistics",
        topics: [
          { n: "Representation of data", c: "cambridge" },
          { n: "Permutations and combinations", c: "cambridge" },
          { n: "Discrete random variables", c: "cambridge" }
        ]
      }
    ]
  }
];

const UI_STRINGS = {
  schoolName: "Al Injaz International Private School",
  schoolSub: "Under the Supervision of Ministry of Education",
  appSubtitle: "Mathematics Department — Curriculum Browser (Draft)",
  grades: "Grades",
  gradePrefix: "Grade",
  studentView: "Student",
  teacherView: "Teacher",
  cambridge: "Cambridge",
  oman: "Oman Bilingual",
  bothCurricula: "Both curricula",
  searchPlaceholder: "Search topics…",
  teacherNoteLabel: "Teaching note",
  noResults: "No topics match your search in this grade.",
  worksheetLink: "Worksheets & Exams",
  practiceLink: "Practice & Learn",
  draftNote: "Draft content — to be verified by the Mathematics Department against the official Cambridge and Oman bilingual frameworks."
};
