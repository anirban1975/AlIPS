// AlIPS Math Curriculum (English).
//
// Structure: STAGES (the Cambridge stages, defined once) -> GRADE_STAGES (which
// stage each school grade sits in) -> CURRICULUM (built from the two, and the
// only thing app.js reads).
//
// Each topic: n = name, s = student-facing description, t = teacher note,
// c = curriculum tag: "cambridge" | "oman" | "both".
//
// Strand names follow the official Cambridge frameworks exactly:
//   Primary Mathematics (0096)        Number | Geometry and Measure |
//                                     Statistics and Probability
//   Lower Secondary Mathematics       Number | Algebra | Geometry and Measure |
//   (0862)                            Statistics and Probability
//   IGCSE Mathematics (0580)          the nine syllabus topics, in order
//   AS & A Level Mathematics (9709)   the components the school enters
//
// ---------------------------------------------------------------------------
// THE PATHWAY — read this before assuming a grade is wrong
// ---------------------------------------------------------------------------
// GRADE_STAGES below is the school's assumed route through Cambridge:
//
//   Grades 1-6   Primary Stages 1-6
//   Grades 7-9   Lower Secondary Stages 7-9
//   Grade  10    IGCSE Mathematics 0580
//   Grade  11    AS Level 9709 (Pure Mathematics 1 + Probability & Statistics 1)
//   Grade  12    A Level 9709 (Pure Mathematics 3)
//
// Grades 11 and 12 are confirmed by the department's own Grade 11 paper
// ("Probability & Statistics 1"). Grades 1-10 follow Cambridge's published
// age progression.
//
// Schools that run IGCSE over TWO years (Grades 9 and 10) shift everything
// below it by one year. That is a one-line change — set GRADE_STAGES to:
//
//   { 1:"p2", 2:"p3", 3:"p4", 4:"p5", 5:"p6", 6:"ls7", 7:"ls8", 8:"ls9",
//     9:"igcse1", 10:"igcse2", 11:"as", 12:"a2" }
//
// and split the IGCSE stage across two years. Nothing else in the app needs
// touching — the worksheet generator reads grades from gen.js, not from here.
// ---------------------------------------------------------------------------

const STAGES = {

  // ======================= Cambridge Primary (0096) =======================

  p1: {
    stage: "Cambridge Primary Mathematics (0096) — Stage 1",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Counting and sequences to 100", c: "both",
            s: "Count forwards and backwards, and count on and back in ones and tens.",
            t: "One-to-one correspondence and conservation of number before symbols." },
          { n: "Place value: tens and ones", c: "both",
            s: "Split two-digit numbers into tens and ones, and compare them.",
            t: "Base-ten blocks and tens frames; link to counting in tens." },
          { n: "Addition and subtraction within 20", c: "both",
            s: "Add and take away small numbers using objects and a number line.",
            t: "Secure number bonds to 10, then to 20." },
          { n: "Doubling and halving", c: "both",
            s: "Double and halve numbers to 20.",
            t: "Introduce as the first step towards multiplication and division." },
          { n: "Fractions: halves", c: "both",
            s: "Find half of a shape and half of a small set of objects." },
          { n: "Money: coins and notes", c: "oman",
            s: "Recognise Omani coins and notes and their values.",
            t: "Use real or replica baisa coins; keep totals within 100 baisa." }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "2D shapes", c: "both",
            s: "Name and sort circles, squares, rectangles and triangles.",
            t: "Sort by properties (sides, corners), not by appearance alone." },
          { n: "3D shapes", c: "both",
            s: "Name cubes, cuboids, spheres, cylinders and cones." },
          { n: "Position, direction and turns", c: "both",
            s: "Describe where things are and make whole and half turns." },
          { n: "Comparing length, mass and capacity", c: "both",
            s: "Say which is longer, shorter, heavier, lighter, holds more or less.",
            t: "Non-standard units first (hand spans, cubes, cups)." },
          { n: "Time: days, months and o'clock", c: "both",
            s: "Order the days and months, and read times on the hour." }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Sorting and collecting data", c: "both",
            s: "Sort objects into groups and say how many are in each." },
          { n: "Pictograms and block graphs", c: "both",
            s: "Show information with pictures and blocks, and read it back.",
            t: "Data drawn from the children's own classroom surveys." }
        ]
      }
    ]
  },

  p2: {
    stage: "Cambridge Primary Mathematics (0096) — Stage 2",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Counting in 2s, 5s and 10s", c: "both",
            s: "Count on and back in steps, and spot the pattern in the numbers." },
          { n: "Place value and ordering to 100", c: "both",
            s: "Read, write, compare and order two-digit numbers." },
          { n: "Two-digit addition and subtraction", c: "both",
            s: "Add and subtract two-digit numbers, with and without regrouping.",
            t: "Partitioning and number lines before any column method." },
          { n: "Multiplication tables: 2, 5 and 10", c: "both",
            s: "Multiply as repeated addition and learn the 2, 5 and 10 tables." },
          { n: "Division as sharing and grouping", c: "both",
            s: "Share equally and group into equal sets.",
            t: "Both structures matter — 12 shared by 3, and 12 grouped in 3s." },
          { n: "Fractions: halves, quarters and thirds", c: "both",
            s: "Find fractions of shapes and of small sets." },
          { n: "Money: rials and baisa", c: "oman",
            s: "Add small amounts of money and work out simple change." }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Properties of 2D and 3D shapes", c: "both",
            s: "Count sides, corners, faces, edges and vertices." },
          { n: "Lines of symmetry", c: "both",
            s: "Find a line of symmetry by folding and by drawing." },
          { n: "Position, direction and movement", c: "both",
            s: "Give and follow directions on a grid, including quarter turns." },
          { n: "Length in centimetres and metres", c: "both",
            s: "Measure and draw lines using standard units.",
            t: "Estimate first, then measure — it builds a sense of size." },
          { n: "Mass and capacity in standard units", c: "both",
            s: "Measure in grams, kilograms, millilitres and litres." },
          { n: "Time: half past, quarter past and quarter to", c: "both",
            s: "Read and write these times on an analogue clock." }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Tally charts and frequency tables", c: "both",
            s: "Record data with tallies and total each row." },
          { n: "Block graphs and pictograms", c: "both",
            s: "Draw and read graphs where one picture stands for one item." }
        ]
      }
    ]
  },

  p3: {
    stage: "Cambridge Primary Mathematics (0096) — Stage 3",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Place value and ordering to 1000", c: "both",
            s: "Read, write, compare and order three-digit numbers." },
          { n: "Rounding to the nearest 10 and 100", c: "both",
            s: "Round numbers and use rounding to estimate an answer." },
          { n: "Three-digit addition and subtraction", c: "both",
            s: "Add and subtract three-digit numbers, including regrouping.",
            t: "Column method now, but keep partitioning available as a check." },
          { n: "Multiplication tables: 3, 4 and 8", c: "both",
            s: "Learn and use these tables and the facts that go with them." },
          { n: "Division with remainders", c: "both",
            s: "Divide and say what is left over.",
            t: "Interpret the remainder in context — round up for buses, down for boxes." },
          { n: "Comparing and equivalent fractions", c: "both",
            s: "See that ½ = 2/4, and put simple fractions in order." },
          { n: "Money: giving change", c: "oman",
            s: "Work out the change from a rial." }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Right angles and turns", c: "both",
            s: "Recognise right angles and describe turns using them." },
          { n: "Properties of 2D shapes", c: "both",
            s: "Classify triangles and quadrilaterals by their sides and angles." },
          { n: "Perimeter", c: "both",
            s: "Find the distance all the way round a shape." },
          { n: "Measuring length, mass and capacity", c: "both",
            s: "Choose the right unit and read a scale accurately." },
          { n: "Time to the nearest minute", c: "both",
            s: "Read the clock to the minute and find how long something takes." },
          { n: "Position and direction on a grid", c: "both",
            s: "Describe and plot positions using rows and columns." }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Venn and Carroll diagrams", c: "both",
            s: "Sort data by two properties at once." },
          { n: "Tally charts, tables and bar charts", c: "both",
            s: "Collect data, organise it and draw a bar chart." },
          { n: "The language of chance", c: "both",
            s: "Use words like certain, likely, unlikely and impossible." }
        ]
      }
    ]
  },

  p4: {
    stage: "Cambridge Primary Mathematics (0096) — Stage 4",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Place value and ordering to 10 000", c: "both",
            s: "Read, write, compare, order and round four-digit numbers." },
          { n: "Negative numbers in context", c: "both",
            s: "Use negative numbers for temperature and on a number line." },
          { n: "Multiples, factors and multiplication tables to 10", c: "both",
            s: "Find multiples and factors and know all tables to 10 × 10." },
          { n: "Written multiplication and division", c: "both",
            s: "Multiply and divide by a one-digit number using a written method.",
            t: "Grid method alongside short multiplication until both are secure." },
          { n: "Decimals: tenths and hundredths", c: "both",
            s: "Read, write, compare and order decimals to two places." },
          { n: "Fraction and decimal equivalence", c: "both",
            s: "Match fractions to their decimal form, and add fractions with the same denominator." }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Angles: acute, obtuse and right", c: "both",
            s: "Compare and classify angles, and order them by size." },
          { n: "2D shapes, 3D shapes and nets", c: "both",
            s: "Identify shapes from their properties and match a solid to its net." },
          { n: "Area and perimeter of rectangles", c: "both",
            s: "Count squares and use a rule to find area, and add sides for perimeter.",
            t: "Keep area and perimeter side by side — the confusion starts here." },
          { n: "Coordinates in the first quadrant", c: "both",
            s: "Read and plot points as (x, y)." },
          { n: "Translation and reflection", c: "both",
            s: "Slide and flip a shape and describe what changed." },
          { n: "Time: 12-hour and 24-hour clock", c: "both",
            s: "Convert between the two and work with timetables." }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Bar charts, dot plots and waffle diagrams", c: "both",
            s: "Choose a chart, draw it and read values from it." },
          { n: "The mode", c: "both",
            s: "Find the value that appears most often." },
          { n: "Likelihood and simple probability", c: "both",
            s: "Place events on a likelihood scale and list possible outcomes." }
        ]
      }
    ]
  },

  p5: {
    stage: "Cambridge Primary Mathematics (0096) — Stage 5",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Place value to 1 000 000 and decimals", c: "both",
            s: "Read, write, compare, order and round large numbers and decimals." },
          { n: "Multiples, factors, primes and square numbers", c: "both",
            s: "Find common multiples and factors, and recognise primes and squares." },
          { n: "Multiplying and dividing by 2-digit numbers", c: "both",
            s: "Use a written method for longer multiplication and division." },
          { n: "Equivalent fractions and adding fractions", c: "both",
            s: "Simplify fractions and add or subtract with different denominators.",
            t: "Common denominator through equivalence, not a memorised rule." },
          { n: "Percentages of a quantity", c: "both",
            s: "Find simple percentages and link them to fractions and decimals." },
          { n: "Ratio and proportion", c: "both",
            s: "Compare quantities and share an amount in a given ratio." },
          { n: "Sequences: finding the rule", c: "both",
            s: "Continue a sequence and describe the rule in words." }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Measuring and drawing angles", c: "both",
            s: "Use a protractor accurately to the nearest degree." },
          { n: "Triangles and quadrilaterals", c: "both",
            s: "Classify them and use the fact that angles in a triangle total 180°." },
          { n: "Perimeter and area of compound shapes", c: "both",
            s: "Split a shape into rectangles and combine the results." },
          { n: "Volume and capacity", c: "both",
            s: "Find the volume of a cuboid by counting and by calculating." },
          { n: "Coordinates, translation and reflection", c: "both",
            s: "Plot points and describe a translation or reflection." },
          { n: "Time intervals and timetables", c: "both",
            s: "Calculate durations and read a bus or class timetable." }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Bar charts, line graphs and dot plots", c: "both",
            s: "Choose and draw the right graph for the data." },
          { n: "Mode, median and range", c: "both",
            s: "Find each one and say what it tells you about the data." },
          { n: "Probability of single events", c: "both",
            s: "List outcomes and describe how likely each one is." }
        ]
      }
    ]
  },

  p6: {
    stage: "Cambridge Primary Mathematics (0096) — Stage 6",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Place value, decimals and negative numbers", c: "both",
            s: "Work with large numbers, decimals and integers below zero." },
          { n: "Order of operations", c: "both",
            s: "Use brackets and the correct order to evaluate an expression.",
            t: "Stress that × and ÷ rank equally, and are worked left to right." },
          { n: "Multiplying and dividing fractions", c: "both",
            s: "Multiply a fraction by a whole number and by another fraction." },
          { n: "Fractions, decimals and percentages", c: "both",
            s: "Convert freely between the three forms and compare them." },
          { n: "Ratio and direct proportion", c: "both",
            s: "Solve problems by scaling quantities up and down." },
          { n: "Rounding and estimation", c: "both",
            s: "Round to a given accuracy and estimate to check an answer." },
          { n: "Sequences, expressions and simple formulae", c: "both",
            s: "Use a letter for an unknown, substitute values and find a term.",
            t: "The bridge into Lower Secondary algebra — spend time here." }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Angles on a line, at a point and in a triangle", c: "both",
            s: "Calculate missing angles and give a reason each time." },
          { n: "Classifying and constructing 2D shapes", c: "both",
            s: "Use properties to name shapes and construct them accurately." },
          { n: "Area and perimeter of compound shapes", c: "both",
            s: "Break a shape down and find its area and perimeter." },
          { n: "Volume and surface area of cuboids", c: "both",
            s: "Calculate both, and know the units each one uses." },
          { n: "Coordinates in four quadrants", c: "both",
            s: "Plot and read points with negative coordinates." },
          { n: "Translation, reflection and rotation", c: "both",
            s: "Perform each transformation and describe it fully." }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Pie charts, line graphs and frequency diagrams", c: "both",
            s: "Read and interpret each, and say which suits the data." },
          { n: "Mean, median, mode and range", c: "both",
            s: "Calculate all four and compare two sets of data." },
          { n: "Probability of single and combined events", c: "both",
            s: "Express probability as a fraction and list combined outcomes." }
        ]
      }
    ]
  },

  // =================== Cambridge Lower Secondary (0862) ===================

  ls7: {
    stage: "Cambridge Lower Secondary Mathematics (0862) — Stage 7",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Integers and negative numbers", c: "both",
            s: "Add, subtract, multiply and divide positive and negative numbers.",
            t: "The two-signs-together rule is where most errors start." },
          { n: "Multiples, factors, primes, squares and cubes", c: "both",
            s: "Find HCF and LCM, and use square and cube numbers." },
          { n: "Fractions, decimals and percentages", c: "both",
            s: "Convert between the three and calculate with each." },
          { n: "Rounding and estimation", c: "both",
            s: "Round to decimal places and estimate to check a calculation." },
          { n: "Ratio and proportion", c: "both",
            s: "Simplify a ratio, share in a ratio and solve proportion problems." }
        ]
      },
      {
        name: "Algebra",
        topics: [
          { n: "Expressions and formulae", c: "both",
            s: "Write expressions, simplify them and substitute values." },
          { n: "Solving linear equations", c: "both",
            s: "Solve one- and two-step equations and check the solution.",
            t: "Balance method throughout — avoid 'change the side, change the sign'." },
          { n: "Sequences and the term-to-term rule", c: "both",
            s: "Continue a sequence and describe how it grows." },
          { n: "Functions and simple graphs", c: "both",
            s: "Complete a table of values and plot the resulting graph." }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Angles on a line, at a point and in a triangle", c: "both",
            s: "Calculate missing angles, giving a reason at each step." },
          { n: "Parallel lines and angle facts", c: "both",
            s: "Use corresponding, alternate and co-interior angles." },
          { n: "Area and perimeter of triangles and compound shapes", c: "both",
            s: "Apply the area formulae and combine shapes." },
          { n: "Volume and surface area of cuboids", c: "both",
            s: "Calculate both for cuboids and simple prisms." },
          { n: "Coordinates and straight-line graphs", c: "both",
            s: "Plot points in four quadrants and draw lines from a rule." },
          { n: "Transformations: reflection, translation and rotation", c: "both",
            s: "Perform and describe each transformation on a grid." }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Planning and collecting data", c: "both",
            s: "Design a data collection sheet and decide what to record." },
          { n: "Averages and range", c: "both",
            s: "Find the mean, median, mode and range and compare data sets." },
          { n: "Bar charts, pie charts and frequency diagrams", c: "both",
            s: "Draw and interpret each type of display." },
          { n: "The probability scale", c: "both",
            s: "Use the 0 to 1 scale and calculate simple probabilities." }
        ]
      }
    ]
  },

  ls8: {
    stage: "Cambridge Lower Secondary Mathematics (0862) — Stage 8",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Powers, roots and index notation", c: "both",
            s: "Use indices, square and cube roots, and the laws of indices." },
          { n: "Percentage increase and decrease", c: "both",
            s: "Increase and decrease by a percentage and find a percentage change." },
          { n: "Fractions and decimals in calculation", c: "both",
            s: "Add, subtract, multiply and divide fractions and decimals." },
          { n: "Ratio, rates and direct proportion", c: "both",
            s: "Work with rates such as speed and unit price." },
          { n: "Rounding and estimation", c: "both",
            s: "Round to significant figures and estimate answers." }
        ]
      },
      {
        name: "Algebra",
        topics: [
          { n: "Expanding brackets and factorising", c: "both",
            s: "Multiply out single brackets and take out a common factor." },
          { n: "Equations with brackets and unknowns on both sides", c: "both",
            s: "Solve harder linear equations." },
          { n: "Inequalities", c: "both",
            s: "Solve a linear inequality and show the solution on a number line." },
          { n: "Linear functions and graphs", c: "both",
            s: "Recognise y = mx + c and read the gradient and intercept." },
          { n: "Sequences and the position-to-term rule", c: "both",
            s: "Find and use the nth term of a linear sequence." }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Circumference and area of circles", c: "both",
            s: "Use π to find the circumference and area, and work backwards." },
          { n: "Angles in polygons", c: "both",
            s: "Find interior and exterior angles of regular and irregular polygons." },
          { n: "Volume and surface area of prisms", c: "both",
            s: "Use the cross-section to find volume, and nets for surface area." },
          { n: "Transformations and enlargement", c: "both",
            s: "Enlarge a shape by a scale factor about a centre." },
          { n: "Constructions and scale drawings", c: "both",
            s: "Construct triangles accurately and work with a scale." }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Collecting, organising and displaying data", c: "both",
            s: "Group data and choose a suitable display." },
          { n: "Averages from a frequency table", c: "both",
            s: "Find the mean, median and mode from grouped and ungrouped tables." },
          { n: "Scatter graphs", c: "both",
            s: "Plot two variables and describe the relationship." },
          { n: "Relative frequency and combined events", c: "both",
            s: "Estimate probability from data and list outcomes for two events." }
        ]
      }
    ]
  },

  ls9: {
    stage: "Cambridge Lower Secondary Mathematics (0862) — Stage 9",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Standard form", c: "both",
            s: "Write large and small numbers in standard form and calculate with them." },
          { n: "Rounding, estimation and limits of accuracy", c: "both",
            s: "Round to significant figures and give upper and lower bounds." },
          { n: "Percentage change and reverse percentages", c: "both",
            s: "Find the original amount after a percentage change." },
          { n: "Direct and inverse proportion", c: "both",
            s: "Recognise each and solve problems with both." },
          { n: "Irrational numbers and surds", c: "both",
            s: "Recognise irrational numbers and simplify simple surds." }
        ]
      },
      {
        name: "Algebra",
        topics: [
          { n: "Expanding and factorising quadratic expressions", c: "both",
            s: "Expand two brackets and factorise into two brackets." },
          { n: "Linear equations and inequalities", c: "both",
            s: "Solve equations and inequalities, including with fractions." },
          { n: "Simultaneous linear equations", c: "both",
            s: "Solve by elimination, substitution and graphically." },
          { n: "Straight-line graphs: y = mx + c", c: "both",
            s: "Find the gradient and intercept and write the equation of a line." },
          { n: "Quadratic and other non-linear graphs", c: "both",
            s: "Plot and recognise quadratic, cubic and reciprocal graphs." },
          { n: "Sequences and the nth term", c: "both",
            s: "Find the nth term of linear and simple quadratic sequences." }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Pythagoras' theorem", c: "both",
            s: "Find a missing side of a right-angled triangle." },
          { n: "Constructions, loci and bearings", c: "both",
            s: "Construct bisectors and loci, and work with three-figure bearings." },
          { n: "Enlargement and scale factors", c: "both",
            s: "Enlarge with positive and fractional scale factors." },
          { n: "Volume and surface area of prisms and cylinders", c: "both",
            s: "Calculate both, and convert between units of volume." },
          { n: "Angle properties of polygons and circles", c: "both",
            s: "Use angle facts in polygons and the first circle properties." }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Scatter graphs and correlation", c: "both",
            s: "Describe correlation and draw a line of best fit." },
          { n: "Interpreting and comparing data sets", c: "both",
            s: "Compare distributions using an average and a measure of spread." },
          { n: "Probability of combined events", c: "both",
            s: "Use sample space diagrams and tree diagrams for two events." }
        ]
      }
    ]
  },

  // ==================== Cambridge IGCSE Mathematics (0580) ====================
  // Strand names and their order follow the nine syllabus topics.

  igcse: {
    stage: "Cambridge IGCSE Mathematics (0580)",
    strands: [
      {
        name: "1. Number",
        topics: [
          { n: "Types of number, HCF and LCM", c: "cambridge",
            s: "Classify numbers and use prime factorisation to find HCF and LCM." },
          { n: "Indices and standard form", c: "cambridge",
            s: "Apply the laws of indices, including negative and fractional powers." },
          { n: "Surds", c: "cambridge",
            s: "Simplify surds and rationalise a denominator." },
          { n: "Percentages: compound interest and reverse", c: "cambridge",
            s: "Use a multiplier for repeated change and work backwards to the original." },
          { n: "Ratio, proportion and rates of change", c: "cambridge",
            s: "Solve problems involving direct and inverse proportion." },
          { n: "Limits of accuracy", c: "cambridge",
            s: "Give upper and lower bounds and use them in calculations." }
        ]
      },
      {
        name: "2. Algebra and graphs",
        topics: [
          { n: "Algebraic manipulation and factorising", c: "cambridge",
            s: "Expand, factorise and simplify algebraic fractions." },
          { n: "Quadratic equations", c: "cambridge",
            s: "Solve by factorising, by completing the square and by the formula." },
          { n: "Simultaneous equations and inequalities", c: "cambridge",
            s: "Solve linear and linear-with-quadratic pairs, and linear inequalities." },
          { n: "Sequences", c: "cambridge",
            s: "Find the nth term of linear, quadratic, cubic and exponential sequences." },
          { n: "Functions and function notation", c: "cambridge",
            s: "Use f(x), find composite and inverse functions." },
          { n: "Graphs of functions and gradients", c: "cambridge",
            s: "Sketch and interpret graphs, and estimate a gradient from a curve." }
        ]
      },
      {
        name: "3. Coordinate geometry",
        topics: [
          { n: "Gradient, midpoint and length of a line segment", c: "cambridge",
            s: "Calculate each from the coordinates of the endpoints." },
          { n: "Equation of a straight line", c: "cambridge",
            s: "Find the equation from a gradient and a point, or from two points." },
          { n: "Parallel and perpendicular lines", c: "cambridge",
            s: "Use the gradient relationships between them." }
        ]
      },
      {
        name: "4. Geometry",
        topics: [
          { n: "Geometrical terms and constructions", c: "cambridge",
            s: "Use correct vocabulary and construct with ruler and compasses." },
          { n: "Angle properties of polygons", c: "cambridge",
            s: "Calculate interior and exterior angles and justify each step." },
          { n: "Circle theorems", c: "cambridge",
            s: "Apply the circle theorems and give reasons in a proof." },
          { n: "Similarity and congruence", c: "cambridge",
            s: "Prove congruence, and use area and volume scale factors." }
        ]
      },
      {
        name: "5. Mensuration",
        topics: [
          { n: "Perimeter and area of 2D shapes", c: "cambridge",
            s: "Apply the standard formulae to shapes and compound shapes." },
          { n: "Circles, arcs and sectors", c: "cambridge",
            s: "Find arc length, sector area and the perimeter of a sector." },
          { n: "Surface area and volume of solids", c: "cambridge",
            s: "Work with prisms, cylinders, cones, spheres and pyramids." }
        ]
      },
      {
        name: "6. Trigonometry",
        topics: [
          { n: "Pythagoras' theorem and right-angled trigonometry", c: "cambridge",
            s: "Find sides and angles using sin, cos and tan." },
          { n: "Bearings and problems in 2D and 3D", c: "cambridge",
            s: "Apply trigonometry to bearings and to solids." },
          { n: "The sine and cosine rules", c: "cambridge",
            s: "Solve non-right-angled triangles and find the area of a triangle." },
          { n: "Trigonometric graphs", c: "cambridge",
            s: "Recognise the graphs of sin, cos and tan and solve equations from them." }
        ]
      },
      {
        name: "7. Transformations and vectors",
        topics: [
          { n: "Reflection, rotation, translation and enlargement", c: "cambridge",
            s: "Carry out and fully describe each transformation." },
          { n: "Vectors in two dimensions", c: "cambridge",
            s: "Use column vectors, find magnitude and add vectors geometrically." }
        ]
      },
      {
        name: "8. Probability",
        topics: [
          { n: "Probability of single events", c: "cambridge",
            s: "Calculate probability and use relative frequency." },
          { n: "Combined events, tree and Venn diagrams", c: "cambridge",
            s: "Find probabilities for two or more events." },
          { n: "Conditional probability", c: "cambridge",
            s: "Work with events where one outcome affects the next." }
        ]
      },
      {
        name: "9. Statistics",
        topics: [
          { n: "Collecting and displaying data", c: "cambridge",
            s: "Choose and draw an appropriate statistical display." },
          { n: "Averages and measures of spread", c: "cambridge",
            s: "Find averages from lists and frequency tables, and the range." },
          { n: "Cumulative frequency and quartiles", c: "cambridge",
            s: "Draw a cumulative frequency curve and read the median and quartiles." },
          { n: "Histograms and scatter diagrams", c: "cambridge",
            s: "Use frequency density, and describe correlation with a line of best fit." }
        ]
      }
    ]
  },

  // ============== Cambridge International AS & A Level (9709) ==============

  as: {
    stage: "Cambridge International AS Level (9709) — Pure Mathematics 1 & Probability and Statistics 1",
    strands: [
      {
        name: "Pure Mathematics 1",
        topics: [
          { n: "Quadratics", c: "cambridge",
            s: "Complete the square, use the discriminant, solve quadratic equations and inequalities." },
          { n: "Functions", c: "cambridge",
            s: "Domain and range, composite and inverse functions, transformations of graphs." },
          { n: "Coordinate geometry", c: "cambridge",
            s: "Equation of a straight line, mid-point, and the equation of a circle." },
          { n: "Circular measure", c: "cambridge",
            s: "Radians, arc length and area of a sector." },
          { n: "Trigonometry", c: "cambridge",
            s: "Graphs of sine, cosine and tangent; identities and equations." },
          { n: "Series", c: "cambridge",
            s: "Binomial expansion; arithmetic and geometric progressions." },
          { n: "Differentiation", c: "cambridge",
            s: "Gradients, tangents and normals, stationary points, rates of change." },
          { n: "Integration", c: "cambridge",
            s: "Indefinite and definite integrals, area under a curve, volume of revolution." }
        ]
      },
      {
        name: "Probability and Statistics 1",
        topics: [
          { n: "Representation of data", c: "cambridge",
            s: "Stem-and-leaf, box-and-whisker, histograms and cumulative frequency." },
          { n: "Mean and standard deviation", c: "cambridge",
            s: "Calculate and interpret measures of central tendency and spread." },
          { n: "Permutations and combinations", c: "cambridge",
            s: "Count arrangements and selections." },
          { n: "Probability", c: "cambridge",
            s: "Conditional probability, independent and mutually exclusive events." },
          { n: "Discrete random variables", c: "cambridge",
            s: "Probability distributions, expectation and variance." },
          { n: "The normal distribution", c: "cambridge",
            s: "Standardise, use tables, and apply as an approximation to the binomial." }
        ]
      }
    ]
  },

  a2: {
    stage: "Cambridge International A Level (9709) — Pure Mathematics 3",
    strands: [
      {
        name: "Pure Mathematics 3 — Algebra",
        topics: [
          { n: "Logarithmic and exponential functions", c: "cambridge",
            s: "Laws of logarithms, solving equations with logs and exponentials, ln and e." },
          { n: "The modulus function", c: "cambridge",
            s: "Sketch y = |f(x)|, solve modulus equations and inequalities." },
          { n: "Polynomials", c: "cambridge",
            s: "Factor theorem, remainder theorem, division of polynomials." },
          { n: "Partial fractions", c: "cambridge",
            s: "Decompose rational expressions, including for use in integration." }
        ]
      },
      {
        name: "Pure Mathematics 3 — Calculus",
        topics: [
          { n: "Further differentiation", c: "cambridge",
            s: "Product, quotient and chain rules; implicit and parametric differentiation." },
          { n: "Further integration", c: "cambridge",
            s: "Integration by substitution and by parts, and of trigonometric and exponential forms." },
          { n: "Differential equations", c: "cambridge",
            s: "Form and solve first-order differential equations by separating variables." },
          { n: "Numerical solution of equations", c: "cambridge",
            s: "Locate roots and use iterative methods." }
        ]
      },
      {
        name: "Pure Mathematics 3 — Trigonometry, Vectors and Complex Numbers",
        topics: [
          { n: "Further trigonometry", c: "cambridge",
            s: "Compound and double angle formulae, R cos(θ ± α) form." },
          { n: "Vectors", c: "cambridge",
            s: "Vector equations of lines, scalar product, angles and intersections." },
          { n: "Complex numbers", c: "cambridge",
            s: "Arithmetic, Argand diagram, modulus-argument form and loci." }
        ]
      }
    ]
  }
};

// Which Cambridge stage each school grade sits in. See the note at the top of
// this file — this table is the whole pathway, and the only thing to change if
// the department's scheme of work runs a year earlier or later.
const GRADE_STAGES = {
  1: "p1", 2: "p2", 3: "p3", 4: "p4", 5: "p5", 6: "p6",
  7: "ls7", 8: "ls8", 9: "ls9",
  10: "igcse", 11: "as", 12: "a2"
};

// CURRICULUM is what the browser renders: grade -> stage -> strands -> topics.
const CURRICULUM = Object.keys(GRADE_STAGES)
  .map(Number)
  .sort((a, b) => a - b)
  .map((id) => ({ id, stage: STAGES[GRADE_STAGES[id]].stage, strands: STAGES[GRADE_STAGES[id]].strands }));

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
  plannerLink: "Lesson Planner & Slides",
  draftNote: "Draft content — to be verified by the Mathematics Department against the official Cambridge and Oman bilingual frameworks."
};
