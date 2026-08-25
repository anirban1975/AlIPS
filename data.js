// AlIPS Math Curriculum — built from the department's Annual Syllabus 2026-27.
//
// Source: the seventeen annual plan documents supplied by the Mathematics
// Department (one per grade, and one per stream for Grades 10-12). Unit names,
// sub-topic names and the month each is taught are taken from those plans.
//
// Structure: TRACKS (one syllabus a class follows) -> GRADE_TRACKS (which
// tracks each grade offers) -> CURRICULUM (what app.js reads).
//
// A track: { label, stage, book, tag, strands: [{ name, topics: [...] }] }
//   label  short name for the stream selector; omitted when a grade has one track
//   stage  full syllabus name, shown under the grade heading
//   book   course book named in the annual plan
//   tag    default curriculum tag for its topics ("both" | "cambridge" | "ged")
// A topic: { n = name, m = month taught, s? = detail, t? = teaching note,
//            c? = curriculum tag overriding the track default }
//
// ---------------------------------------------------------------------------
// THE PATHWAY — as the annual plans state it
// ---------------------------------------------------------------------------
//   Grades 1-6   Cambridge Primary, Stages 1-6 (Learner's Book 1-6)
//   Grade  7     Cambridge Lower Secondary, Stages 7 AND 8 (Books 7 & 8)
//   Grade  8     Cambridge Lower Secondary, Stages 8 AND 9 (Books 8 & 9)
//   Grade  9     Cambridge IGCSE 0580, year 1 of two
//   Grade  10    A: IGCSE 0580, year 2      B: GED
//   Grade  11    A: Cambridge AS 9709       B: GED Advance / GED Basic
//   Grade  12    A: Cambridge A Level 9709  B: GED Advance / GED Basic
//
// Lower Secondary is compressed: Grade 7 covers Stages 7 and 8, Grade 8 covers
// Stages 8 and 9, so IGCSE can begin in Grade 9 and AS in Grade 11.
// ---------------------------------------------------------------------------

const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const TRACKS = {

  // ===================== Cambridge Primary, Stages 1-6 =====================

  p1: {
    stage: "Cambridge Primary Mathematics — Stage 1",
    book: "Cambridge Primary Mathematics Learner's Book 1 & Workbook 1",
    tag: "both",
    strands: [
      {
        name: "Numbers to 20",
        topics: [
          { n: "Tracing numbers 1 to 10", m: "Aug", s: "Revision worksheets: forming each numeral, joining dots." },
          { n: "Reading and writing numbers", m: "Aug" },
          { n: "Counting objects", m: "Sep" },
          { n: "Recognising numbers", m: "Sep" },
          { n: "How many", m: "Sep" },
          { n: "Counting on and counting back", m: "Sep" },
          { n: "Larger and smaller numbers", m: "Sep" },
          { n: "Tens and ones — making numbers", m: "Jan" },
          { n: "Tens and ones — breaking up numbers", m: "Feb" },
          { n: "Comparing and ordering numbers", m: "Feb" },
          { n: "Counting on 10, counting back 10", m: "Feb" },
          { n: "Understanding numbers to 20", m: "Feb" },
          { n: "First, second, third …", m: "Feb" },
          { n: "Even numbers and odd numbers", m: "Feb" },
          { n: "Money", m: "Feb" }
        ]
      },
      {
        name: "Addition and subtraction",
        topics: [
          { n: "One more and one less", m: "Sep" },
          { n: "Counting on and back on a number line", m: "Sep" },
          { n: "Adding numbers by counting on", m: "Sep" },
          { n: "Subtracting numbers by counting back", m: "Sep" },
          { n: "Finding totals", m: "Oct" },
          { n: "Taking away", m: "Oct" },
          { n: "Using the + and − symbols", m: "Oct" },
          { n: "Comparing numbers", m: "Oct" },
          { n: "Addition facts to 5", m: "Apr" },
          { n: "Pairs that total 10", m: "Apr", t: "Secure these before any written method — they carry the whole year." },
          { n: "Equivalent addition facts", m: "Apr" },
          { n: "Counting on for addition", m: "Apr" },
          { n: "Counting back for subtraction", m: "Apr" },
          { n: "Combining sets of objects to add to 20", m: "Apr" },
          { n: "Taking away a small number of objects", m: "Apr" },
          { n: "Finding the difference", m: "Apr" },
          { n: "Subtracting on a number line", m: "May" },
          { n: "Counting up on a number line to find the difference", m: "May" },
          { n: "Adding amounts up to 20", m: "May" },
          { n: "Subtracting amounts up to 20", m: "May" },
          { n: "Doubling numbers up to 10", m: "May" }
        ]
      },
      {
        name: "Shapes, direction and movement",
        topics: [
          { n: "2D and 3D shape names", m: "Oct" },
          { n: "Sorting shapes", m: "Oct" },
          { n: "Patterns and pictures", m: "Oct" },
          { n: "Naming and sorting shapes", m: "Feb" },
          { n: "Position and direction", m: "Feb" },
          { n: "Sequences", m: "Feb" },
          { n: "Direction and movement", m: "Feb" }
        ]
      },
      {
        name: "Statistical methods",
        topics: [
          { n: "Tables, lists and pictograms", m: "Nov" },
          { n: "Venn diagrams and Carroll diagrams", m: "Nov" },
          { n: "Block graphs", m: "Nov" },
          { n: "Pictograms and block graphs", m: "Jan" },
          { n: "Pictograms, lists and tables", m: "Jan" }
        ]
      },
      {
        name: "Time and measurement",
        topics: [
          { n: "Time", m: "Nov" },
          { n: "Length", m: "Nov" },
          { n: "Mass", m: "Mar" },
          { n: "Capacity", m: "Mar" },
          { n: "Measuring", m: "Mar" }
        ]
      },
      {
        name: "Fractions",
        topics: [
          { n: "Fractions and equal parts", m: "May" },
          { n: "Finding half of a shape", m: "May" },
          { n: "Equal sharing", m: "May" },
          { n: "Halving numbers", m: "May" },
          { n: "Understanding half and whole", m: "May" }
        ]
      }
    ]
  },

  p2: {
    stage: "Cambridge Primary Mathematics — Stage 2",
    book: "Cambridge Primary Mathematics Learner's Book 2 & Workbook 2",
    tag: "both",
    strands: [
      {
        name: "Numbers to 100",
        topics: [
          { n: "Number worksheets", m: "Aug", s: "Revision of Stage 1 number work." },
          { n: "Reading and writing numbers to 20", m: "Aug" },
          { n: "Reading and writing numbers to 100", m: "Aug" },
          { n: "Estimating and counting to 100", m: "Sep" }
        ]
      },
      {
        name: "Addition and subtraction",
        topics: [
          { n: "The relationship between addition and subtraction", m: "Sep" },
          { n: "Addition and subtraction facts for 10", m: "Sep" },
          { n: "Pairs that total 20", m: "Sep" },
          { n: "Addition and subtraction with numbers to 20", m: "Sep" },
          { n: "Adding small numbers", m: "Sep" },
          { n: "Adding multiples of 10", m: "Sep" },
          { n: "Addition and subtraction facts for 20", m: "Feb" },
          { n: "Adding and subtracting multiples of 10", m: "Feb" },
          { n: "Making estimates", m: "Feb" },
          { n: "Adding two-digit and one-digit numbers", m: "Feb" },
          { n: "Subtracting a one-digit number from a two-digit number", m: "Feb" },
          { n: "Using mental strategies to add and subtract", m: "Feb" },
          { n: "Adding pairs of two-digit numbers", m: "Feb" },
          { n: "Subtracting two-digit numbers", m: "Feb" },
          { n: "Addition and subtraction facts to 100", m: "Feb" }
        ]
      },
      {
        name: "Multiplication and division",
        topics: [
          { n: "Counting in twos, fives and tens", m: "Nov" },
          { n: "Multiplication as repeated addition", m: "Nov" },
          { n: "Using arrays to show multiplication", m: "Nov" },
          { n: "Division as sharing", m: "Nov" },
          { n: "Division as grouping", m: "Nov" },
          { n: "Division as repeated subtraction", m: "Nov" },
          { n: "Multiplication as doubling", m: "May" },
          { n: "Multiplication tables of 1 and 2", m: "May" },
          { n: "Multiplication tables of 5 and 10", m: "May" },
          { n: "Sharing for division", m: "May" },
          { n: "Grouping for division", m: "May" }
        ]
      },
      {
        name: "Number patterns and place value",
        topics: [
          { n: "Tens and ones", m: "Apr" },
          { n: "Counting in tens and ones", m: "Apr" },
          { n: "Counting in fives", m: "Apr" },
          { n: "Counting in twos", m: "Apr" },
          { n: "Pattern and ordinals", m: "Apr" },
          { n: "Comparing and ordering numbers", m: "Apr" },
          { n: "Rounding to the nearest 10", m: "Apr" }
        ]
      },
      {
        name: "Shapes, direction and movement",
        topics: [
          { n: "2D and 3D shapes", m: "Oct" },
          { n: "Patterns and pictures", m: "Oct" },
          { n: "Symmetry", m: "Mar" },
          { n: "Position and movement", m: "Mar" }
        ]
      },
      {
        name: "Statistical methods and chance",
        topics: [
          { n: "Pictograms and block graphs", m: "Oct" },
          { n: "Venn diagrams and Carroll diagrams", m: "Oct" },
          { n: "Chance", m: "Oct" }
        ]
      },
      {
        name: "Time and measurement",
        topics: [
          { n: "Time", m: "Jan" },
          { n: "Length", m: "Jan" },
          { n: "Mass", m: "Jan" },
          { n: "Capacity", m: "Jan" },
          { n: "Measures", m: "Jan" }
        ]
      },
      {
        name: "Money",
        topics: [
          { n: "Understanding coins and notes", m: "Mar", c: "oman" },
          { n: "Working out the total amount", m: "Mar", c: "oman" },
          { n: "Making amounts", m: "Mar", c: "oman" }
        ]
      },
      {
        name: "Fractions",
        topics: [
          { n: "Equal parts", m: "May" },
          { n: "Fractions of a group", m: "May" },
          { n: "Divide to find fractions", m: "May" },
          { n: "One quarter, two quarters, three quarters", m: "May" }
        ]
      }
    ]
  },

  p3: {
    stage: "Cambridge Primary Mathematics — Stage 3",
    book: "Cambridge Primary Mathematics Learner's Book 3",
    tag: "both",
    strands: [
      {
        name: "Numbers to 1000",
        topics: [
          { n: "Counting to 1000", m: "Aug" }
        ]
      },
      {
        name: "Addition and subtraction",
        topics: [
          { n: "Complements to 100", m: "Aug" },
          { n: "Adding in a different order", m: "Aug" },
          { n: "Adding multiples of 100", m: "Aug" },
          { n: "Adding pairs of 2-digit numbers", m: "Aug" },
          { n: "Subtracting 2-digit numbers", m: "Sep" },
          { n: "Calculation with missing numbers", m: "Nov" },
          { n: "Adding multiples of 10", m: "Nov" },
          { n: "Adding pairs of 2-digit and 3-digit numbers", m: "Nov" },
          { n: "Subtracting 2-digit numbers from 3-digit numbers", m: "Nov" },
          { n: "Working with money", m: "Nov", c: "oman" },
          { n: "Finding the value of missing numbers", m: "Mar" },
          { n: "Adding multiples of 10 and 100", m: "Mar" },
          { n: "Adding pairs of 3-digit numbers", m: "Mar" },
          { n: "Subtracting with 3-digit numbers", m: "Mar" },
          { n: "Calculating with money", m: "Mar", c: "oman" }
        ]
      },
      {
        name: "Multiplication and division",
        topics: [
          { n: "The relationship between multiplication and division", m: "Oct" },
          { n: "Multiples of 2, 5 and 10", m: "Oct" },
          { n: "Multiplication tables of 2, 4 and 8", m: "Oct" },
          { n: "Multiplication tables of 3, 6 and 9", m: "Oct" },
          { n: "Multiplying numbers", m: "Oct" },
          { n: "Learning multiplication tables", m: "May" },
          { n: "Using multiplication and division facts", m: "May" },
          { n: "Multiplying 2-digit numbers", m: "May" },
          { n: "Dividing 2-digit numbers", m: "May" },
          { n: "Division with and without remainders", m: "May" }
        ]
      },
      {
        name: "Patterns, place value and rounding",
        topics: [
          { n: "Multiplying by 10", m: "Apr" },
          { n: "Comparing and ordering 3-digit numbers", m: "Apr" },
          { n: "Rounding to the nearest 100", m: "Apr" },
          { n: "Number patterns", m: "Apr" },
          { n: "Hundreds, tens and ones", m: "Apr" },
          { n: "Rounding to the nearest 10 or 100", m: "Apr" }
        ]
      },
      {
        name: "Shapes and angles",
        topics: [
          { n: "Shapes around us", m: "Sep" },
          { n: "3D shapes and their properties", m: "Sep" },
          { n: "2D shapes and their properties", m: "Sep" },
          { n: "Regular and irregular polygons", m: "Sep" },
          { n: "Symmetrical shapes", m: "Feb" },
          { n: "Reflecting shapes", m: "Feb" },
          { n: "Angles", m: "Feb" },
          { n: "Position, direction and movement", m: "Feb" }
        ]
      },
      {
        name: "Statistical methods and chance",
        topics: [
          { n: "Venn diagrams and Carroll diagrams", m: "Sep" },
          { n: "Pictograms and bar charts", m: "Sep" },
          { n: "Tally charts", m: "Sep" },
          { n: "Lists, tables, charts and graphs", m: "Sep" },
          { n: "Chance", m: "Sep" }
        ]
      },
      {
        name: "Time and measurement",
        topics: [
          { n: "Time", m: "Jan" },
          { n: "Length", m: "Jan" },
          { n: "Mass", m: "Jan" },
          { n: "Capacity", m: "Jan" },
          { n: "Perimeter of 2D shapes", m: "Jan" },
          { n: "Area", m: "Jan", t: "Keep area and perimeter side by side — the confusion starts here." }
        ]
      },
      {
        name: "Fractions",
        topics: [
          { n: "Three quarters", m: "Feb" },
          { n: "Equal parts of a whole", m: "Feb" },
          { n: "Adding and subtracting fractions", m: "Feb" },
          { n: "Equivalent fractions", m: "Feb" },
          { n: "Comparing and ordering fractions", m: "Feb" }
        ]
      }
    ]
  },

  p4: {
    stage: "Cambridge Primary Mathematics — Stage 4",
    book: "Cambridge Primary Mathematics Learner's Book 4",
    tag: "both",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Negative numbers", m: "Aug" },
          { n: "Counting on and back", m: "Aug" },
          { n: "Number and place value", m: "Aug" },
          { n: "Comparing and ordering numbers", m: "Sep" },
          { n: "Rounding numbers", m: "Sep" },
          { n: "Larger numbers", m: "Nov" },
          { n: "Working with sequences", m: "Nov" },
          { n: "Even and odd numbers", m: "Nov" },
          { n: "The relationship between factors and multiples", m: "Nov" },
          { n: "Identifying and building sequences", m: "Feb" },
          { n: "Square numbers", m: "Feb" },
          { n: "Factors and multiples", m: "Feb" },
          { n: "Tests of divisibility", m: "Feb" }
        ]
      },
      {
        name: "Calculation",
        topics: [
          { n: "Skills for calculating", m: "Sep" },
          { n: "Using rounding to help with adding and subtracting", m: "Sep" },
          { n: "Working with addition", m: "Sep" },
          { n: "Working with subtraction", m: "Sep" },
          { n: "Multiplication and division facts", m: "Sep" },
          { n: "More missing number problems", m: "Mar" },
          { n: "More addition and subtraction", m: "Mar" },
          { n: "Multiplying and dividing whole numbers by 10 and 100", m: "Mar" },
          { n: "Simplifying multiplications", m: "Apr" },
          { n: "Multiplying larger numbers", m: "Apr" },
          { n: "Dividing 2-digit numbers", m: "Apr" },
          { n: "Multiplication table of 7", m: "Apr" },
          { n: "Multiplying a 2-digit number by a 1-digit number", m: "Apr" },
          { n: "Multiplying a 3-digit number by a 1-digit number", m: "Apr" }
        ]
      },
      {
        name: "2D and 3D shapes",
        topics: [
          { n: "Polygons", m: "Sep" },
          { n: "Compound shapes and tessellation", m: "Sep" },
          { n: "Compound and irregular shapes", m: "Sep" },
          { n: "Squares and rectangles", m: "Sep" },
          { n: "Symmetry", m: "Jan" },
          { n: "3D shapes and nets", m: "Jan" },
          { n: "Angles and turns", m: "Jan" }
        ]
      },
      {
        name: "Angles, position and direction",
        topics: [
          { n: "North, south, east, west", m: "Feb" },
          { n: "Directions and maps", m: "Feb" },
          { n: "Coordinates", m: "Feb" },
          { n: "More coordinates", m: "Feb" },
          { n: "Reflections on a grid", m: "Feb" }
        ]
      },
      {
        name: "Time",
        topics: [
          { n: "12- and 24-hour clock", m: "Oct" },
          { n: "Calendars and timetables", m: "Oct" },
          { n: "Duration", m: "Oct" },
          { n: "Days, weeks, months and years", m: "Oct" }
        ]
      },
      {
        name: "Statistical methods",
        topics: [
          { n: "Collecting and sorting data", m: "Oct" },
          { n: "Collecting and comparing information", m: "Oct" },
          { n: "Interpreting and comparing data", m: "Oct" },
          { n: "Investigating and collecting data", m: "Oct" }
        ]
      },
      {
        name: "Probability",
        topics: [
          { n: "Certain, impossible, likely, unlikely", m: "Nov" },
          { n: "Probability experiments", m: "Nov" }
        ]
      },
      {
        name: "Fractions and percentages",
        topics: [
          { n: "Parts and wholes", m: "Jan" },
          { n: "Equal shares", m: "Jan" },
          { n: "Fractions of shapes and quantities", m: "Jan" },
          { n: "Equivalent fractions", m: "Jan" },
          { n: "Adding and subtracting fractions", m: "Jan" },
          { n: "Comparing and ordering fractions", m: "May" },
          { n: "Introducing percentages", m: "May" }
        ]
      }
    ]
  },

  p5: {
    stage: "Cambridge Primary Mathematics — Stage 5",
    book: "Cambridge Primary Mathematics Learner's Book 5 & Workbook 5",
    tag: "both",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Introducing decimal numbers", m: "Aug" },
          { n: "Composing, decomposing and regrouping", m: "Aug" },
          { n: "Multiplying and dividing whole numbers by 10, 100 and 1000", m: "Aug" },
          { n: "Counting on and back", m: "Aug" },
          { n: "Linear sequences", m: "Aug" },
          { n: "Decimal numbers", m: "Sep" },
          { n: "Place value", m: "Sep" },
          { n: "Rounding to the nearest whole number", m: "Sep" },
          { n: "Square numbers", m: "Jan" },
          { n: "Triangular numbers", m: "Jan" },
          { n: "Tests of divisibility", m: "Jan" },
          { n: "Prime numbers", m: "Jan" }
        ]
      },
      {
        name: "Calculation",
        topics: [
          { n: "Calculating with positive and negative numbers", m: "Oct" },
          { n: "Addition and subtraction", m: "Oct" },
          { n: "Missing number problems", m: "Oct" },
          { n: "Simplifying multiplications", m: "Oct" },
          { n: "Multiplying numbers up to 1000", m: "Oct" },
          { n: "Adding and subtracting decimal numbers", m: "Nov" },
          { n: "Multiplying by a 2-digit number", m: "Nov" },
          { n: "Division", m: "Nov" },
          { n: "Order of operations", m: "Nov", t: "× and ÷ rank equally and are worked left to right." },
          { n: "Multiplication and division", m: "Jan" },
          { n: "Multiplying decimal numbers", m: "Jan" }
        ]
      },
      {
        name: "Angles and shapes",
        topics: [
          { n: "Symmetrical patterns", m: "Oct" },
          { n: "Identifying and reasoning about angles", m: "Oct" },
          { n: "Triangles", m: "Oct" },
          { n: "Perimeter and area", m: "Oct" },
          { n: "3D shapes", m: "Oct" }
        ]
      },
      {
        name: "Location and movement",
        topics: [
          { n: "Translations", m: "Nov" },
          { n: "Shapes on a coordinate grid", m: "Nov" },
          { n: "Reflection and translation", m: "Nov" }
        ]
      },
      {
        name: "Probability",
        topics: [
          { n: "Equally likely, more likely, less likely", m: "Nov" },
          { n: "Probability experiments", m: "Nov" }
        ]
      },
      {
        name: "Time",
        topics: [
          { n: "Measuring time", m: "Feb" },
          { n: "Calculating time intervals", m: "Feb" },
          { n: "Time zones", m: "Feb" },
          { n: "Calculating start and end times", m: "Feb" }
        ]
      },
      {
        name: "Statistical methods",
        topics: [
          { n: "Bar charts and dot plots", m: "Feb" },
          { n: "Frequency charts", m: "Feb" },
          { n: "Line graphs", m: "Feb" },
          { n: "Mode and median", m: "Mar" },
          { n: "Proportion of the whole", m: "Mar" }
        ]
      },
      {
        name: "Fractions, decimals, percentages and proportion",
        topics: [
          { n: "Fractions and division", m: "Mar" },
          { n: "Equivalent fractions", m: "Mar" },
          { n: "Improper fractions and mixed numbers", m: "Apr" },
          { n: "Fractions as operators", m: "Apr" },
          { n: "Adding and subtracting fractions", m: "Apr" },
          { n: "Percentages", m: "Apr" },
          { n: "Equivalent fractions, decimals and percentages", m: "Apr" },
          { n: "Comparing and ordering quantities", m: "Apr" },
          { n: "Ratio and proportion", m: "Apr" },
          { n: "Multiplying and dividing unit fractions by a whole number", m: "May" }
        ]
      }
    ]
  },

  p6: {
    stage: "Cambridge Primary Mathematics — Stage 6",
    book: "Cambridge Primary Mathematics Learner's Book 6 & Workbook 6",
    tag: "both",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Composing, decomposing and regrouping", m: "Aug" },
          { n: "Multiplying and dividing whole numbers by 10, 100 and 1000", m: "Aug" },
          { n: "Patterns and sequences", m: "Aug" },
          { n: "Common multiples and common factors", m: "Aug" },
          { n: "Tests of divisibility", m: "Aug" },
          { n: "More about numbers and place value", m: "Sep" },
          { n: "Rounding decimal numbers", m: "Sep" },
          { n: "More about sequences", m: "Sep" },
          { n: "Cube numbers", m: "Sep" },
          { n: "Numbers and place value", m: "Mar" },
          { n: "Finding common multiples and common factors", m: "Mar" },
          { n: "Using tests of divisibility", m: "Mar" }
        ]
      },
      {
        name: "Calculation",
        topics: [
          { n: "Addition and subtraction with positive and negative numbers", m: "Oct" },
          { n: "Using letters to represent quantities", m: "Oct", t: "The bridge into Lower Secondary algebra — spend time here." },
          { n: "Simplifying calculations", m: "Oct" },
          { n: "Multiplying whole numbers up to 10 000", m: "Oct" },
          { n: "Using addition and subtraction", m: "Jan" },
          { n: "Adding and subtracting decimal numbers", m: "Jan" },
          { n: "Adding and subtracting fractions", m: "Jan" },
          { n: "Multiplying decimal numbers", m: "Jan" },
          { n: "Dividing whole numbers up to 1000", m: "Jan" },
          { n: "Using brackets", m: "Jan" },
          { n: "Multiplying and dividing proper fractions by whole numbers", m: "Jan" },
          { n: "Multiplying and dividing decimal numbers", m: "Jan" }
        ]
      },
      {
        name: "2D and 3D shapes",
        topics: [
          { n: "Measuring and drawing angles", m: "Oct" },
          { n: "Calculating angles in triangles", m: "Oct" },
          { n: "Properties of quadrilaterals", m: "Oct" },
          { n: "Compound shapes", m: "Oct" },
          { n: "Nets", m: "Oct" },
          { n: "Area", m: "Apr" },
          { n: "Circles", m: "Apr" },
          { n: "Rotational symmetry", m: "Apr" }
        ]
      },
      {
        name: "The coordinate grid",
        topics: [
          { n: "Four quadrants", m: "Nov" },
          { n: "Translations on a coordinate grid", m: "Nov" },
          { n: "Rotation about a point", m: "Nov" },
          { n: "Reflections", m: "Nov" },
          { n: "Coordinates", m: "Nov" }
        ]
      },
      {
        name: "Probability",
        topics: [
          { n: "Probability and proportionality", m: "Nov" },
          { n: "Probability experiments", m: "Nov" }
        ]
      },
      {
        name: "Fractions, decimals, percentages and proportion",
        topics: [
          { n: "More about fractions as operators", m: "Nov" },
          { n: "Comparing and ordering decimal numbers", m: "Nov" },
          { n: "Using decimals and mixed units for time", m: "Nov" },
          { n: "Direct proportion", m: "Nov" },
          { n: "Equivalent ratios", m: "Nov" },
          { n: "Simplifying fractions", m: "Feb" },
          { n: "Fractions and division", m: "Feb" },
          { n: "Comparing and ordering fractions", m: "Feb" },
          { n: "Fraction, decimal and percentage equivalences", m: "Feb" },
          { n: "Percentage of shapes and quantities", m: "Feb" },
          { n: "Calculating with percentages", m: "Feb" },
          { n: "Ratio problems", m: "Feb" }
        ]
      },
      {
        name: "Statistical methods",
        topics: [
          { n: "Proportion of the whole", m: "Mar" },
          { n: "Mode, mean, median, range", m: "Mar" },
          { n: "Comparing data and charts", m: "Mar" },
          { n: "Line graphs and scatter plots", m: "Mar" }
        ]
      }
    ]
  },

  // ============== Cambridge Lower Secondary, Grades 7 and 8 ==============

  ls7: {
    stage: "Cambridge Lower Secondary Mathematics — Stages 7 and 8",
    book: "Lower Secondary Mathematics Books 7 and 8 (Learner's Book & Workbook)",
    tag: "both",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Subtracting negative numbers", m: "Aug", t: "The two-signs-together rule is where most errors start." },
          { n: "Multiplication and division", m: "Aug" },
          { n: "Indices", m: "Aug" },
          { n: "The zero index", m: "Aug" },
          { n: "Order of operations and BIDMAS", m: "Aug" },
          { n: "Indices and roots", m: "Aug" },
          { n: "Highest common factors and lowest common multiples", m: "Sep" },
          { n: "Divisibility", m: "Sep" },
          { n: "Factors and multiples", m: "Sep" },
          { n: "Factor trees", m: "Sep" },
          { n: "Hierarchy of numbers", m: "Sep" },
          { n: "Equivalence of fractions, decimals and percentages", m: "Jan" },
          { n: "Addition and subtraction of fractions", m: "Jan" },
          { n: "Mixed numbers", m: "Jan" },
          { n: "Multiplication and division of fractions", m: "Jan" },
          { n: "Terminating and recurring decimals", m: "Jan" },
          { n: "Mixed numbers and improper fractions", m: "Jan" },
          { n: "Calculations involving mixed numbers", m: "Jan" },
          { n: "Squares and square roots", m: "Feb" },
          { n: "Cubes and cube roots", m: "Feb" },
          { n: "Percentages of a quantity", m: "Mar" },
          { n: "Fractions and ratios", m: "Mar" },
          { n: "Direct proportion", m: "Mar" },
          { n: "Decimal places", m: "Apr" },
          { n: "Calculations and estimations with decimals", m: "Apr" },
          { n: "Multiplying and dividing by powers of 10", m: "Apr" }
        ]
      },
      {
        name: "Algebra",
        topics: [
          { n: "Expressions", m: "Nov" },
          { n: "Order of operations when simplifying expressions", m: "Nov" },
          { n: "Substitution into expressions and formulae", m: "Nov" },
          { n: "Simplifying algebraic expressions", m: "Nov" },
          { n: "Multiplying simple expressions", m: "Nov" },
          { n: "Expanding brackets", m: "Nov" },
          { n: "Expansion and factorisation", m: "Nov" },
          { n: "Deriving and using a formula", m: "Nov" },
          { n: "Expressions, equations and formulae", m: "Nov" },
          { n: "Functions and function machines", m: "Feb" },
          { n: "Equations", m: "Feb" },
          { n: "Constructing and solving equations", m: "Feb" },
          { n: "Inequalities", m: "Feb" },
          { n: "Combined inequalities", m: "Feb" },
          { n: "Graphs of linear functions", m: "Mar" },
          { n: "Horizontal and vertical lines", m: "Mar" },
          { n: "Coordinate pairs", m: "Mar" },
          { n: "Sequences and patterns", m: "Mar" },
          { n: "Term-to-term rules", m: "Mar" },
          { n: "The nth term", m: "Mar" }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Polygons", m: "Sep" },
          { n: "The circle", m: "Sep" },
          { n: "Hierarchy of quadrilaterals", m: "Sep" },
          { n: "Area of triangles", m: "Sep" },
          { n: "Compound shapes", m: "Sep" },
          { n: "Parallelograms and trapezia", m: "Sep" },
          { n: "Angle construction", m: "Jan" },
          { n: "Angle properties of quadrilaterals", m: "Jan" },
          { n: "Angles around a point", m: "Jan" },
          { n: "Angles formed within parallel lines", m: "Jan" },
          { n: "The metric system and converting units", m: "Mar" },
          { n: "Units of area", m: "Mar" },
          { n: "Scale drawings", m: "Mar" },
          { n: "Three-dimensional shapes", m: "Apr" },
          { n: "Volume of a cuboid", m: "Apr" },
          { n: "Composite three-dimensional shapes", m: "Apr" },
          { n: "Surface area of a cuboid", m: "Apr" },
          { n: "Drawing 2D views of 3D objects", m: "Apr" },
          { n: "Reflective and rotational symmetry", m: "May" },
          { n: "Reflections on a coordinate axis", m: "May" },
          { n: "Rotation about a point", m: "May" },
          { n: "Enlargement", m: "May" },
          { n: "Coordinates and translation of 2D shapes", m: "May" }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Types of data", m: "Sep" },
          { n: "Collecting data", m: "Sep" },
          { n: "Sampling methods", m: "Sep" },
          { n: "Questionnaires and interviews", m: "Sep" },
          { n: "Organising data", m: "Oct" },
          { n: "Line graphs, scatter graphs and infographics", m: "Oct" },
          { n: "Two-way tables", m: "Oct" },
          { n: "Venn diagrams", m: "Oct" },
          { n: "Frequency tables and diagrams", m: "Oct" },
          { n: "Pie charts", m: "Oct" },
          { n: "Stem-and-leaf diagrams", m: "Oct" },
          { n: "Decisions and interpretations", m: "Oct" },
          { n: "Travel graphs", m: "Oct" },
          { n: "Averages", m: "Nov" },
          { n: "Calculations using frequency tables", m: "Nov" },
          { n: "Averages and the range", m: "Nov" },
          { n: "Interpreting further data", m: "Nov" },
          { n: "Probability and likelihood of events", m: "May" },
          { n: "Complementary events", m: "May" },
          { n: "Mutually exclusive outcomes", m: "May" },
          { n: "Mutually exclusive and independent events", m: "May" },
          { n: "Experimental probability", m: "May" },
          { n: "Experiments and simulations", m: "May" }
        ]
      }
    ]
  },

  ls8: {
    stage: "Cambridge Lower Secondary Mathematics — Stages 8 and 9",
    book: "Lower Secondary Mathematics Books 8 and 9 (Learner's Book & Workbook)",
    tag: "both",
    strands: [
      {
        name: "Number",
        topics: [
          { n: "Indices", m: "Aug" },
          { n: "Standard form", m: "Aug" },
          { n: "Small numbers in standard form", m: "Aug" },
          { n: "Large and small units", m: "Sep" },
          { n: "Units for mass and capacity", m: "Sep" },
          { n: "Digital storage", m: "Sep" },
          { n: "Recurring and terminating decimals", m: "Oct" },
          { n: "Calculations with fractions and decimals", m: "Oct" },
          { n: "Rational and irrational numbers", m: "Oct" },
          { n: "Squares, square roots, cubes and cube roots", m: "Jan" },
          { n: "Percentage change", m: "Jan" },
          { n: "Compound percentages", m: "Jan" },
          { n: "Compound interest", m: "Jan" },
          { n: "Ratio and proportion", m: "Mar" },
          { n: "Simplifying ratios", m: "Mar" },
          { n: "Dividing a quantity in a given ratio", m: "Mar" },
          { n: "Direct proportion and rate", m: "Mar" },
          { n: "Inverse proportion", m: "Mar" }
        ]
      },
      {
        name: "Algebra",
        topics: [
          { n: "Order of operations with algebra", m: "Aug" },
          { n: "Expanding the product of two algebraic expressions", m: "Nov" },
          { n: "Simplifying algebraic expressions", m: "Nov" },
          { n: "Algebraic expressions and formulae", m: "Nov" },
          { n: "Equations", m: "Nov" },
          { n: "Inequalities", m: "Nov" },
          { n: "Function machines", m: "Nov" },
          { n: "Inputs and outputs", m: "Nov" },
          { n: "Term-to-term rules", m: "Jan" },
          { n: "The nth term", m: "Jan" },
          { n: "Linear and quadratic sequences", m: "Jan" },
          { n: "The midpoint of a line segment", m: "Feb" },
          { n: "Coordinate pairs and linear graphs", m: "Feb" },
          { n: "The general equation of a straight line", m: "Feb" },
          { n: "Calculating the gradient", m: "Feb" },
          { n: "Deducing equations from graphs", m: "Feb" },
          { n: "Solving simultaneous equations graphically", m: "Feb" },
          { n: "Solving simultaneous equations algebraically", m: "Feb" },
          { n: "Motion graphs", m: "Apr" },
          { n: "Travel graphs and compound measures", m: "Apr" },
          { n: "Graphs in real-life contexts", m: "Apr" }
        ]
      },
      {
        name: "Geometry and Measure",
        topics: [
          { n: "Pythagoras' theorem", m: "Sep" },
          { n: "Circumference of a circle", m: "Sep" },
          { n: "Area of a circle", m: "Sep" },
          { n: "Volume of a prism", m: "Oct" },
          { n: "Surface area of a prism", m: "Oct" },
          { n: "Symmetry in three dimensions", m: "Oct" },
          { n: "Enlargement", m: "Oct" },
          { n: "Combinations of transformations", m: "Oct" },
          { n: "Constructions", m: "Nov" },
          { n: "Inscribing polygons", m: "Nov" },
          { n: "Angle relationships and polygons", m: "Nov" },
          { n: "Elevations and scale", m: "Jan" },
          { n: "Scale and area factors of enlargement", m: "Jan" },
          { n: "Translation", m: "Feb" },
          { n: "Distances and bearings", m: "Mar" },
          { n: "Measuring bearings", m: "Mar" },
          { n: "Bearings and scale drawing", m: "Mar" }
        ]
      },
      {
        name: "Statistics and Probability",
        topics: [
          { n: "Data collection and sampling", m: "Sep" },
          { n: "Interpreting and discussing results", m: "Sep" },
          { n: "Stem-and-leaf diagrams", m: "Sep" },
          { n: "Frequency polygons", m: "Sep" },
          { n: "Analysing and comparing grouped data", m: "Oct" },
          { n: "Interpreting graphs and 'fake news'", m: "Oct", t: "Good AO2 material — reasoning about misleading axes and scales." },
          { n: "Mutually exclusive events", m: "Apr" },
          { n: "Independent events", m: "Apr" },
          { n: "Expected and relative frequencies", m: "Apr" }
        ]
      }
    ]
  },

  // ================= Cambridge IGCSE 0580, Grades 9 and 10 =================

  igcse9: {
    stage: "Cambridge IGCSE Mathematics (0580) — Year 1 of 2",
    book: "Cambridge Mathematics Core and Extended, 5th edition (Hodder), ISBN 9781398373600",
    tag: "cambridge",
    strands: [
      {
        name: "1. Number",
        topics: [
          { n: "Number and language", m: "Aug" },
          { n: "Accuracy", m: "Aug" },
          { n: "Calculations and orders", m: "Aug" },
          { n: "Integers, fractions, decimals and percentages", m: "Sep" },
          { n: "Further percentages", m: "Sep" },
          { n: "Ratio and proportion", m: "Sep" },
          { n: "Indices, standard form and surds", m: "Sep" },
          { n: "Money and finance", m: "Sep" },
          { n: "Time", m: "Oct" },
          { n: "Set notation and Venn diagrams", m: "Oct" }
        ]
      },
      {
        name: "2. Algebra and graphs",
        topics: [
          { n: "Algebraic indices", m: "Oct" },
          { n: "Graphs in practical situations", m: "Nov" },
          { n: "Graphs of functions", m: "Nov" },
          { n: "Algebraic representation and manipulation", m: "Feb" },
          { n: "Sequences", m: "Feb" },
          { n: "Proportion", m: "Feb" },
          { n: "Functions", m: "Mar" },
          { n: "Equations and inequalities", m: "May" }
        ]
      },
      {
        name: "3. Coordinate geometry",
        topics: [
          { n: "Straight-line graphs", m: "Apr" }
        ]
      },
      {
        name: "4. Geometry",
        topics: [
          { n: "Geometrical vocabulary and construction", m: "Jan" },
          { n: "Similarity and congruence", m: "Jan" },
          { n: "Symmetry", m: "Jan" },
          { n: "Angle properties", m: "Jan" }
        ]
      },
      {
        name: "8. Probability",
        topics: [
          { n: "Probability", m: "Mar" },
          { n: "Further probability", m: "Apr" }
        ]
      }
    ]
  },

  igcse10: {
    label: "IGCSE",
    stage: "Cambridge IGCSE Mathematics (0580) — Year 2 of 2",
    book: "Cambridge Mathematics Core and Extended, 5th edition (Hodder), ISBN 9781398373600",
    tag: "cambridge",
    strands: [
      {
        name: "2. Algebra and graphs",
        topics: [
          { n: "Equations and inequalities", m: "Sep" },
          { n: "Graphing inequalities and regions", m: "Sep" },
          { n: "Differentiation and the gradient function", m: "Jan" }
        ]
      },
      {
        name: "3. Coordinate geometry",
        topics: [
          { n: "Straight-line graphs", m: "Sep" }
        ]
      },
      {
        name: "5. Mensuration",
        topics: [
          { n: "Measures", m: "Sep" },
          { n: "Perimeter, area and volume", m: "Oct" }
        ]
      },
      {
        name: "6. Trigonometry",
        topics: [
          { n: "Bearings", m: "Oct" },
          { n: "Trigonometry", m: "Oct" },
          { n: "Further trigonometry", m: "Oct", s: "The sine and cosine rules, the area of a triangle, 3D problems." }
        ]
      },
      {
        name: "7. Transformations and vectors",
        topics: [
          { n: "Vectors", m: "Nov" },
          { n: "Transformations", m: "Nov" }
        ]
      },
      {
        name: "8. Probability",
        topics: [
          { n: "Probability", m: "Aug" },
          { n: "Further probability", m: "Aug" }
        ]
      },
      {
        name: "9. Statistics",
        topics: [
          { n: "Mean, median, mode and range", m: "Jan" },
          { n: "Collecting and displaying data", m: "Jan" },
          { n: "Cumulative frequency", m: "Jan" }
        ]
      },
      {
        name: "Examination preparation",
        topics: [
          { n: "Past paper booklet solving", m: "Feb" },
          { n: "Mock examinations", m: "Mar" }
        ]
      }
    ]
  },

  ged10: {
    label: "GED",
    stage: "GED Mathematics — Grade 10",
    book: "Cambridge Mathematics Student's Book (Collins)",
    tag: "ged",
    strands: [
      {
        name: "Algebra",
        topics: [
          { n: "Algebraic indices", m: "Aug", s: "Positive, negative, zero and fractional indices; the rules of indices." },
          { n: "Simultaneous linear equations in two variables", m: "Aug" },
          { n: "Solving quadratic equations by factorising", m: "Aug" },
          { n: "The quadratic formula and completing the square", m: "Sep" },
          { n: "Linear programming and graphing inequalities", m: "Sep" },
          { n: "Number sequences", m: "Sep" },
          { n: "Patterns and relationships between sequences", m: "Sep" },
          { n: "The nth term of a sequence", m: "Sep" },
          { n: "Conversion graphs", m: "Jan" },
          { n: "Travel graphs", m: "Jan" },
          { n: "Speed, distance and time", m: "Jan" },
          { n: "Speed–time graphs, acceleration and deceleration", m: "Jan" },
          { n: "Exponential functions and solving equations graphically", m: "Jan" },
          { n: "Exponential growth and decay problems", m: "Feb" },
          { n: "Gradients of curves by drawing tangents", m: "Feb" },
          { n: "Functions, inverse functions and composite functions", m: "Feb" }
        ]
      },
      {
        name: "Number",
        topics: [
          { n: "Accuracy", m: "Sep" },
          { n: "Upper and lower bounds", m: "Sep" },
          { n: "Calculating with upper and lower bounds", m: "Sep" },
          { n: "Money and finance", m: "Sep" },
          { n: "Earnings, simple and compound interest, discount, profit and loss", m: "Oct" },
          { n: "Extracting data from tables and charts; square and cube roots", m: "Oct" },
          { n: "Exponential growth and decay", m: "Oct" }
        ]
      },
      {
        name: "Geometry",
        topics: [
          { n: "Similar shapes", m: "Oct" },
          { n: "Area and volume of similar shapes", m: "Oct" }
        ]
      },
      {
        name: "Vectors",
        topics: [
          { n: "Translation vectors", m: "Oct" },
          { n: "Addition and subtraction of vectors", m: "Nov" },
          { n: "Multiplying a vector by a scalar", m: "Nov" },
          { n: "The magnitude of a vector", m: "Nov" },
          { n: "Position vectors", m: "Nov" }
        ]
      },
      {
        name: "Statistics",
        topics: [
          { n: "Median, percentiles, quartiles and the interquartile range", m: "Nov" },
          { n: "Cumulative frequency", m: "Nov" }
        ]
      },
      {
        name: "Trigonometry",
        topics: [
          { n: "The sine rule", m: "Feb" },
          { n: "The cosine rule", m: "Feb" },
          { n: "The area of a triangle", m: "Mar" },
          { n: "Trigonometry in three dimensions", m: "Mar" },
          { n: "The angle between a line and a plane", m: "Mar" }
        ]
      },
      {
        name: "Transformations",
        topics: [
          { n: "Reflection", m: "Mar" },
          { n: "Rotation", m: "Mar" },
          { n: "Translation", m: "Apr" },
          { n: "Enlargement", m: "Apr" },
          { n: "Describing transformations using coordinates and matrices", m: "Apr" }
        ]
      },
      {
        name: "Probability",
        topics: [
          { n: "Probability", m: "Apr" },
          { n: "Relative frequency", m: "Apr" },
          { n: "Probability of combined events", m: "May" },
          { n: "Tree diagrams", m: "May" }
        ]
      }
    ]
  },

  // ============ Cambridge AS & A Level 9709, Grades 11 and 12 ============

  as11: {
    label: "AS Level",
    stage: "Cambridge International AS Level Mathematics (9709) — Pure Mathematics 1 and Probability & Statistics 1",
    book: "CUP AS & A Level Mathematics: Pure Mathematics 1 (978-1-108-40714-4); Probability & Statistics 1 (978-1-108-40730-4)",
    tag: "cambridge",
    strands: [
      {
        name: "Pure Mathematics 1 — Quadratics",
        topics: [
          { n: "Solving quadratic equations by factorisation", m: "Aug" },
          { n: "Completing the square", m: "Aug" },
          { n: "The quadratic formula", m: "Aug" },
          { n: "Solving simultaneous equations (one linear and one quadratic)", m: "Aug" },
          { n: "Solving more complex quadratic equations", m: "Aug" },
          { n: "Maximum and minimum values of a quadratic function", m: "Aug" },
          { n: "Solving quadratic inequalities", m: "Aug" },
          { n: "The number of roots of a quadratic equation", m: "Aug" },
          { n: "Intersection of a line and a quadratic curve", m: "Aug" }
        ]
      },
      {
        name: "Pure Mathematics 1 — Functions",
        topics: [
          { n: "Composite functions", m: "Sep" },
          { n: "Inverse functions", m: "Sep" },
          { n: "Transformations of functions", m: "Sep" }
        ]
      },
      {
        name: "Pure Mathematics 1 — Coordinate geometry",
        topics: [
          { n: "Length of a line segment and midpoint", m: "Oct" },
          { n: "Parallel and perpendicular lines", m: "Oct" },
          { n: "Equations of straight lines", m: "Oct" },
          { n: "The equation of a circle", m: "Oct" },
          { n: "Problems involving intersections of lines and circles", m: "Oct" }
        ]
      },
      {
        name: "Pure Mathematics 1 — Circular measure",
        topics: [
          { n: "Radians", m: "Oct" },
          { n: "Length of an arc", m: "Oct" },
          { n: "Area of a sector", m: "Oct" }
        ]
      },
      {
        name: "Pure Mathematics 1 — Trigonometry",
        topics: [
          { n: "Angles between 0° and 90°", m: "Nov" },
          { n: "The general definition of an angle", m: "Nov" },
          { n: "Trigonometric ratios of general angles", m: "Nov" },
          { n: "Graphs of trigonometric functions", m: "Nov" },
          { n: "Inverse trigonometric functions", m: "Nov" },
          { n: "Trigonometric equations", m: "Nov" },
          { n: "Trigonometric identities", m: "Nov" },
          { n: "Further trigonometric equations", m: "Nov" }
        ]
      },
      {
        name: "Pure Mathematics 1 — Series",
        topics: [
          { n: "Binomial expansion of (a + b)ⁿ", m: "Jan" },
          { n: "Binomial coefficients", m: "Jan" },
          { n: "Arithmetic progressions", m: "Jan" },
          { n: "Geometric progressions", m: "Jan" },
          { n: "Infinite geometric series", m: "Jan" },
          { n: "Further arithmetic and geometric series", m: "Jan" }
        ]
      },
      {
        name: "Pure Mathematics 1 — Differentiation",
        topics: [
          { n: "Derivatives and gradient functions", m: "Jan" },
          { n: "The chain rule", m: "Jan" },
          { n: "Tangents and normals", m: "Jan" },
          { n: "Second derivatives", m: "Jan" },
          { n: "Increasing and decreasing functions", m: "Feb" },
          { n: "Stationary points", m: "Feb" },
          { n: "Practical maximum and minimum problems", m: "Feb" },
          { n: "Rates of change", m: "Feb" },
          { n: "Practical applications of connected rates of change", m: "Feb" }
        ]
      },
      {
        name: "Pure Mathematics 1 — Integration",
        topics: [
          { n: "Integration as the reverse of differentiation", m: "Feb" },
          { n: "Finding the constant of integration", m: "Feb" },
          { n: "Integration of expressions of the form (ax + b)ⁿ", m: "Feb" },
          { n: "Further indefinite integration", m: "Feb" },
          { n: "Definite integration", m: "Feb" },
          { n: "Area under a curve", m: "Feb" },
          { n: "Area bounded by a curve and a line or by two curves", m: "Feb" },
          { n: "Improper integrals", m: "Feb" },
          { n: "Volumes of revolution", m: "Feb" }
        ]
      },
      {
        name: "Probability & Statistics 1 — Representation of data",
        topics: [
          { n: "Stem-and-leaf diagrams", m: "Sep" },
          { n: "Histograms", m: "Sep" },
          { n: "Cumulative frequency curves", m: "Sep" },
          { n: "Comparing different data representations", m: "Sep" }
        ]
      },
      {
        name: "Probability & Statistics 1 — Measures of central tendency",
        topics: [
          { n: "The mode and the modal class", m: "Oct" },
          { n: "The mean", m: "Oct" },
          { n: "The median", m: "Oct" }
        ]
      },
      {
        name: "Probability & Statistics 1 — Measures of variation",
        topics: [
          { n: "The range", m: "Oct" },
          { n: "The interquartile range and percentiles", m: "Oct" },
          { n: "Variance and standard deviation", m: "Oct" }
        ]
      },
      {
        name: "Probability & Statistics 1 — Permutations and combinations",
        topics: [
          { n: "The factorial function", m: "Nov" },
          { n: "Permutations", m: "Nov" },
          { n: "Combinations", m: "Nov" },
          { n: "Problem solving with permutations and combinations", m: "Nov" }
        ]
      },
      {
        name: "Probability & Statistics 1 — Probability",
        topics: [
          { n: "Experiments, events and outcomes", m: "Jan" },
          { n: "Mutually exclusive events and the addition law", m: "Jan" },
          { n: "Independent events and the multiplication law", m: "Jan" },
          { n: "Conditional probability", m: "Jan" },
          { n: "Dependent events and conditional probability", m: "Jan" }
        ]
      },
      {
        name: "Probability & Statistics 1 — Distributions",
        topics: [
          { n: "Discrete random variables", m: "Feb" },
          { n: "Probability distributions", m: "Feb" },
          { n: "Expectation and variance of a discrete random variable", m: "Feb" },
          { n: "The binomial distribution", m: "Feb" },
          { n: "The geometric distribution", m: "Feb" },
          { n: "Continuous random variables", m: "Feb" },
          { n: "The normal distribution", m: "Feb" },
          { n: "Modelling with the normal distribution", m: "Feb" },
          { n: "The normal approximation to the binomial distribution", m: "Feb" }
        ]
      }
    ]
  },

  ged11adv: {
    label: "GED Advance",
    stage: "GED Advance — Grade 11 (Cambridge Pure Mathematics 1, 2 & 3 with Probability & Statistics 1)",
    book: "Cambridge International AS & A Level Mathematics: Pure Mathematics 1, 2 & 3",
    tag: "ged",
    strands: [
      {
        name: "Algebra",
        topics: [
          { n: "Completing the square for a quadratic polynomial", m: "Aug" },
          { n: "The discriminant of a quadratic polynomial", m: "Aug" },
          { n: "Solving quadratic equations by completing the square", m: "Aug" },
          { n: "Solving quadratic inequalities in one unknown", m: "Aug" },
          { n: "Solving simultaneous equations", m: "Aug" },
          { n: "Equations that are quadratic in some function of x", m: "Aug" },
          { n: "Modulus of a linear function", m: "Oct" },
          { n: "Dividing a polynomial by a linear or quadratic polynomial", m: "Oct" },
          { n: "The factor theorem and the remainder theorem", m: "Oct" },
          { n: "Partial fractions", m: "Oct" }
        ]
      },
      {
        name: "Functions",
        topics: [
          { n: "Function, domain, range, one-one and many-one", m: "Sep" },
          { n: "Identifying the range of a given function", m: "Sep" },
          { n: "Deciding whether a function is one-one or many-one", m: "Sep" },
          { n: "The graphical relation between a one-one function and its inverse", m: "Sep" },
          { n: "Transformations of functions", m: "Sep" }
        ]
      },
      {
        name: "Differentiation",
        topics: [
          { n: "The gradient of a curve as a limit", m: "Nov" },
          { n: "Differentiating a polynomial", m: "Nov" },
          { n: "Differentiating xⁿ", m: "Nov" },
          { n: "Differentiating composite functions using the chain rule", m: "Nov" },
          { n: "Locating stationary points and determining their nature", m: "Nov" },
          { n: "Identifying increasing and decreasing functions", m: "Nov" },
          { n: "Gradients, tangents and normals", m: "Nov" },
          { n: "Second derivatives", m: "Nov" },
          { n: "Applying differentiation to rates of change", m: "Nov" }
        ]
      },
      {
        name: "Coordinate geometry",
        topics: [
          { n: "Finding the equation of a straight line", m: "Jan" },
          { n: "Solving problems involving straight lines", m: "Jan" },
          { n: "Graphs and their equations", m: "Jan" }
        ]
      },
      {
        name: "Circular measure and trigonometry",
        topics: [
          { n: "Radians", m: "Jan" },
          { n: "Arc length and sector area of a circle", m: "Jan" },
          { n: "Sine, cosine and tangent for any angle", m: "Feb" },
          { n: "Graphs of the sine, cosine and tangent functions", m: "Feb" },
          { n: "Exact values of sine, cosine and tangent of 30°, 45° and 60°", m: "Feb" },
          { n: "Identities connecting sin x, cos x and tan x", m: "Feb" },
          { n: "Principal values of inverse trigonometric relations", m: "Feb" },
          { n: "Solving simple trigonometric equations", m: "Feb" }
        ]
      },
      {
        name: "Series",
        topics: [
          { n: "Expanding expressions of the form (a + b)ⁿ", m: "Feb" },
          { n: "Arithmetic progressions", m: "Feb" },
          { n: "Geometric progressions", m: "Feb" },
          { n: "The nth term of an arithmetic or geometric progression", m: "Feb" },
          { n: "The sum of the first n terms of a progression", m: "Feb" },
          { n: "The sum to infinity of a convergent geometric progression", m: "Feb" }
        ]
      },
      {
        name: "Integration",
        topics: [
          { n: "Integration as the reverse process of differentiation", m: "Mar" },
          { n: "Integrating (a + bx)ⁿ for rational n", m: "Mar" },
          { n: "Definite integrals", m: "Mar" },
          { n: "Areas bounded by curves and the coordinate axes", m: "Mar" },
          { n: "Using integration to find a volume of revolution", m: "Mar" }
        ]
      },
      {
        name: "Probability & Statistics 1 — Representation of data",
        topics: [
          { n: "Measures of central tendency", m: "Nov" },
          { n: "Discrete, continuous, grouped and ungrouped data", m: "Nov" },
          { n: "Presenting data", m: "Nov" },
          { n: "Calculating the mean, median and mode", m: "Nov" },
          { n: "Measures of variation: range, interquartile range and standard deviation", m: "Nov" },
          { n: "Mean and standard deviation of grouped and ungrouped data", m: "Nov" }
        ]
      },
      {
        name: "Probability & Statistics 1 — Probability",
        topics: [
          { n: "Problems involving permutations and combinations", m: "Apr" },
          { n: "Evaluating probabilities", m: "Apr" },
          { n: "Venn diagrams and probabilities", m: "Apr" },
          { n: "Mutually exclusive, independent and dependent events", m: "Apr" },
          { n: "Conditional probability", m: "Apr" }
        ]
      }
    ]
  },

  ged11basic: {
    label: "GED Basic",
    stage: "GED Basic — Grade 11 (Pearson Edexcel International A Level Pure Mathematics 1)",
    book: "Pearson Edexcel International A Level Pure Mathematics 1 Student Book, ISBN 9781292244792",
    tag: "ged",
    strands: [
      {
        name: "Algebra",
        topics: [
          { n: "Index laws", m: "Aug" },
          { n: "Expanding brackets", m: "Aug" },
          { n: "Factorising", m: "Aug" },
          { n: "Negative and fractional indices", m: "Sep" },
          { n: "Surds", m: "Sep" },
          { n: "Rationalising denominators", m: "Sep" },
          { n: "Solving quadratic equations", m: "Sep" },
          { n: "Completing the square", m: "Sep" },
          { n: "Quadratic functions and curves", m: "Sep" },
          { n: "The discriminant", m: "Sep" },
          { n: "Linear simultaneous equations", m: "Oct" },
          { n: "Quadratic simultaneous equations", m: "Oct" },
          { n: "Simultaneous equations on graphs", m: "Oct" },
          { n: "Linear and quadratic inequalities", m: "Oct" },
          { n: "Inequalities on graphs and regions", m: "Oct" }
        ]
      },
      {
        name: "Straight line graphs",
        topics: [
          { n: "Calculating the gradient and y-intercept", m: "Nov" },
          { n: "Equations of straight lines", m: "Nov" },
          { n: "Parallel and perpendicular lines", m: "Nov" },
          { n: "Length and area", m: "Nov" }
        ]
      },
      {
        name: "Trigonometry",
        topics: [
          { n: "The cosine rule", m: "Jan" },
          { n: "The sine rule", m: "Jan" },
          { n: "Area of triangles", m: "Jan" },
          { n: "Solving triangle problems", m: "Jan" },
          { n: "Graphs of sine, cosine and tangent", m: "Jan" },
          { n: "Transforming trigonometric graphs", m: "Jan" },
          { n: "Radian measure", m: "Feb" },
          { n: "Arc length", m: "Feb" },
          { n: "Areas of sectors and segments", m: "Feb" }
        ]
      },
      {
        name: "Calculus",
        topics: [
          { n: "Gradients of curves", m: "Feb" },
          { n: "Finding the derivative", m: "Feb" },
          { n: "Differentiating xⁿ", m: "Feb" },
          { n: "Differentiating quadratics", m: "Mar" },
          { n: "Differentiating functions with more than two terms", m: "Mar" },
          { n: "Gradient, tangents and normals", m: "Mar" },
          { n: "Second order derivatives", m: "Mar" },
          { n: "Integrating xⁿ", m: "Mar" },
          { n: "Indefinite integrals", m: "Apr" },
          { n: "Finding functions", m: "Apr" }
        ]
      }
    ]
  },

  a212: {
    label: "A Level",
    stage: "Cambridge International A Level Mathematics (9709) — Pure Mathematics 3 and Probability & Statistics 2",
    book: "CUP AS & A Level Mathematics: Pure Mathematics 3 (978-1-108-40719-9); Probability & Statistics 2 (978-1-108-63305-5)",
    tag: "cambridge",
    strands: [
      {
        name: "Pure Mathematics 3 — Algebra",
        topics: [
          { n: "The modulus function", m: "Aug" },
          { n: "Graphs of y = |f(x)| where f(x) is linear", m: "Aug" },
          { n: "Solving modulus inequalities", m: "Aug" },
          { n: "Division of polynomials", m: "Aug" },
          { n: "The factor theorem", m: "Aug" },
          { n: "The remainder theorem", m: "Aug" }
        ]
      },
      {
        name: "Pure Mathematics 3 — Further algebra",
        topics: [
          { n: "Improper algebraic fractions", m: "Aug" },
          { n: "Partial fractions", m: "Aug" },
          { n: "Binomial expansion of (1 + x)ⁿ", m: "Sep" },
          { n: "Binomial expansion of (a + x)ⁿ", m: "Sep" },
          { n: "Partial fractions and binomial expansions", m: "Sep" }
        ]
      },
      {
        name: "Pure Mathematics 3 — Logarithmic and exponential functions",
        topics: [
          { n: "Logarithms to base 10", m: "Sep" },
          { n: "Logarithms to base a", m: "Sep" },
          { n: "The laws of logarithms", m: "Sep" },
          { n: "Solving logarithmic equations", m: "Sep" },
          { n: "Solving exponential equations", m: "Sep" },
          { n: "Solving exponential inequalities", m: "Sep" },
          { n: "Natural logarithms", m: "Sep" },
          { n: "Transforming a relationship to linear form", m: "Sep" }
        ]
      },
      {
        name: "Pure Mathematics 3 — Trigonometry",
        topics: [
          { n: "The cosecant, secant and cotangent ratios", m: "Oct" },
          { n: "Compound angle formulae", m: "Oct" },
          { n: "Double angle formulae", m: "Oct" },
          { n: "Further trigonometric identities", m: "Oct" },
          { n: "Expressing a sin θ + b cos θ as R sin(θ ± α) or R cos(θ ± α)", m: "Oct" }
        ]
      },
      {
        name: "Pure Mathematics 3 — Differentiation",
        topics: [
          { n: "The product rule", m: "Oct" },
          { n: "The quotient rule", m: "Oct" },
          { n: "Derivatives of exponential functions", m: "Oct" },
          { n: "Derivatives of natural logarithmic functions", m: "Oct" },
          { n: "Derivatives of trigonometric functions", m: "Oct" },
          { n: "Implicit differentiation", m: "Oct" },
          { n: "Parametric differentiation", m: "Oct" },
          { n: "The derivative of tan⁻¹x", m: "Oct" }
        ]
      },
      {
        name: "Pure Mathematics 3 — Integration",
        topics: [
          { n: "Integration of exponential functions", m: "Nov" },
          { n: "Integration of 1/(ax + b)", m: "Nov" },
          { n: "Integration of sin(ax + b), cos(ax + b) and sec²(ax + b)", m: "Nov" },
          { n: "Further integration of trigonometric functions", m: "Nov" },
          { n: "The trapezium rule", m: "Nov" },
          { n: "Integration of 1/(x² + a²)", m: "Jan" },
          { n: "Integration of kf′(x)/f(x)", m: "Jan" },
          { n: "Integration by substitution", m: "Jan" },
          { n: "The use of partial fractions in integration", m: "Jan" },
          { n: "Integration by parts", m: "Jan" }
        ]
      },
      {
        name: "Pure Mathematics 3 — Numerical solution of equations",
        topics: [
          { n: "Finding a starting point", m: "Jan" },
          { n: "Improving your solution", m: "Jan" },
          { n: "Using iterative processes to solve problems", m: "Jan" }
        ]
      },
      {
        name: "Pure Mathematics 3 — Vectors",
        topics: [
          { n: "Displacement or translation vectors", m: "Feb" },
          { n: "Position vectors", m: "Feb" },
          { n: "The scalar product", m: "Feb" },
          { n: "The vector equation of a line", m: "Feb" },
          { n: "Intersection of two lines", m: "Feb" }
        ]
      },
      {
        name: "Pure Mathematics 3 — Differential equations",
        topics: [
          { n: "The technique of separating the variables", m: "Feb" },
          { n: "Forming a differential equation from a problem", m: "Feb" }
        ]
      },
      {
        name: "Pure Mathematics 3 — Complex numbers",
        topics: [
          { n: "Imaginary numbers", m: "Feb" },
          { n: "Complex numbers", m: "Feb" },
          { n: "The complex plane", m: "Feb" },
          { n: "Solving equations with complex roots", m: "Feb" },
          { n: "Loci in the complex plane", m: "Feb" }
        ]
      },
      {
        name: "Probability & Statistics 2 — Hypothesis testing",
        topics: [
          { n: "Introduction to hypothesis testing", m: "Sep" },
          { n: "One-tailed and two-tailed hypothesis tests", m: "Sep" },
          { n: "Type I and Type II errors", m: "Sep" }
        ]
      },
      {
        name: "Probability & Statistics 2 — The Poisson distribution",
        topics: [
          { n: "Introduction to the Poisson distribution", m: "Oct" },
          { n: "Adapting the Poisson distribution for different intervals", m: "Oct" },
          { n: "The Poisson distribution as an approximation to the binomial", m: "Oct" },
          { n: "The normal distribution as an approximation to the Poisson", m: "Oct" },
          { n: "Hypothesis testing with the Poisson distribution", m: "Oct" }
        ]
      },
      {
        name: "Probability & Statistics 2 — Random variables",
        topics: [
          { n: "Expectation and variance", m: "Nov" },
          { n: "Sum and difference of independent random variables", m: "Nov" },
          { n: "Working with normal distributions", m: "Nov" },
          { n: "Linear combinations of Poisson distributions", m: "Nov" },
          { n: "Introduction to continuous random variables", m: "Nov" },
          { n: "The median and other percentiles of a continuous random variable", m: "Nov" },
          { n: "The expectation and variance of a continuous random variable", m: "Nov" }
        ]
      },
      {
        name: "Probability & Statistics 2 — Sampling and estimation",
        topics: [
          { n: "Introduction to sampling", m: "Feb" },
          { n: "The distribution of sample means", m: "Feb" },
          { n: "Unbiased estimates of population mean and variance", m: "Feb" },
          { n: "Hypothesis testing of the population mean", m: "Feb" },
          { n: "Confidence intervals for a population mean", m: "Feb" },
          { n: "Confidence intervals for a population proportion", m: "Feb" }
        ]
      }
    ]
  },

  ged12adv: {
    label: "GED Advance",
    stage: "GED Advance — Grade 12 (Cambridge Pure Mathematics 2 & 3 with Probability & Statistics 1)",
    book: "Cambridge International AS & A Level Mathematics: Pure Mathematics 2 & 3 (978-0-00-825774-3); Probability & Statistics 1 (978-0-00-825776-7)",
    tag: "ged",
    strands: [
      {
        name: "Pure Mathematics 2 & 3",
        topics: [
          { n: "Logarithms", m: "Aug" },
          { n: "Logarithms in other bases", m: "Aug" },
          { n: "The number e", m: "Aug" },
          { n: "Natural logarithms", m: "Aug" },
          { n: "Using logarithms to solve equations and inequalities", m: "Aug" },
          { n: "Addition and subtraction formulae", m: "Sep" },
          { n: "Double angle formulae", m: "Sep" },
          { n: "The expression a sin x + b cos x", m: "Sep" },
          { n: "The secant, cosecant and cotangent functions", m: "Sep" },
          { n: "More trigonometric identities", m: "Sep" },
          { n: "Differentiating eˣ and ln x", m: "Oct" },
          { n: "Differentiating sin x, cos x and tan x", m: "Oct" },
          { n: "The product rule", m: "Oct" },
          { n: "The quotient rule", m: "Oct" },
          { n: "Differentiating tan⁻¹x", m: "Oct" },
          { n: "Differentiating implicit equations", m: "Oct" },
          { n: "Recognising integrals", m: "Jan" },
          { n: "Integration using trigonometric relationships", m: "Jan" },
          { n: "Integration of 1/(x² + a²)", m: "Jan" },
          { n: "Integrating f′(x)/f(x)", m: "Jan" },
          { n: "Integration using partial fractions", m: "Jan" },
          { n: "Integration by substitution", m: "Jan" },
          { n: "Integration by parts", m: "Jan" },
          { n: "Vectors: definition and vector geometry", m: "Feb" },
          { n: "Magnitude of a vector", m: "Feb" },
          { n: "Position vectors", m: "Feb" },
          { n: "Complex numbers: definition and arithmetic", m: "Mar" },
          { n: "Complex roots of polynomial equations", m: "Mar" },
          { n: "Polar form", m: "Mar" }
        ]
      },
      {
        name: "Probability & Statistics 1",
        topics: [
          { n: "Probability distribution of discrete random variables", m: "Nov" },
          { n: "Expectation of X", m: "Nov" },
          { n: "Variance of X", m: "Nov" },
          { n: "The normal distribution", m: "Apr" },
          { n: "Using the normal distribution", m: "Apr" },
          { n: "Non-standardised variables", m: "Apr" }
        ]
      }
    ]
  },

  ged12basic: {
    label: "GED Basic",
    stage: "GED Basic — Grade 12 (Cambridge Pure Mathematics 2 & 3 with Probability & Statistics 1)",
    book: "Cambridge International AS & A Level Mathematics: Pure Mathematics 2 & 3; Probability & Statistics 1",
    tag: "ged",
    strands: [
      {
        name: "Algebraic methods",
        topics: [
          { n: "Cancelling factors in algebraic fractions", m: "Aug" },
          { n: "Dividing a polynomial by a linear expression", m: "Aug" },
          { n: "Using the factor theorem to factorise a cubic expression", m: "Aug" },
          { n: "Using the remainder theorem", m: "Aug" }
        ]
      },
      {
        name: "Exponentials and logarithms",
        topics: [
          { n: "The relationship between exponents and logarithms", m: "Sep" },
          { n: "The laws of logarithms", m: "Sep" },
          { n: "Solving equations of the form aˣ = b", m: "Sep" },
          { n: "Changing the base of a logarithm", m: "Sep", t: "Sketching is not included in this stream." }
        ]
      },
      {
        name: "Calculus",
        topics: [
          { n: "Identifying increasing and decreasing functions", m: "Sep" },
          { n: "Stationary points and their nature", m: "Sep" },
          { n: "Evaluating a definite integral", m: "Mar" },
          { n: "Area bounded by a curve and the x-axis", m: "Mar" }
        ]
      },
      {
        name: "The binomial expansion",
        topics: [
          { n: "Pascal's triangle and binomial coefficients", m: "Jan" },
          { n: "Combinations and factorial notation", m: "Jan" },
          { n: "Using the binomial expansion to expand brackets", m: "Jan" }
        ]
      },
      {
        name: "Sequences and series",
        topics: [
          { n: "The nth term of an arithmetic sequence", m: "Feb" },
          { n: "The sum of the first n terms of an arithmetic series", m: "Feb" },
          { n: "The nth term of a geometric sequence", m: "Feb" },
          { n: "The sum of a finite geometric series", m: "Feb" },
          { n: "The sum to infinity of a convergent geometric series", m: "Feb" }
        ]
      },
      {
        name: "Probability & Statistics 1",
        topics: [
          { n: "Recognising different types of data", m: "Oct" },
          { n: "Measures of central tendency: mean, median and mode", m: "Oct" },
          { n: "Measures of location such as percentiles", m: "Nov" },
          { n: "Measures of spread: range and interquartile range", m: "Nov" },
          { n: "Variance and standard deviation", m: "Nov" },
          { n: "Identifying outliers in data sets", m: "Apr" },
          { n: "Drawing and interpreting box plots", m: "Apr" },
          { n: "Drawing and interpreting stem-and-leaf diagrams", m: "Apr" },
          { n: "Working out whether data is skewed", m: "Apr" }
        ]
      }
    ]
  }
};

// Which track(s) each grade offers. Grades 10-12 run two streams; the second
// stream splits further into Advance and Basic at Grades 11 and 12.
const GRADE_TRACKS = {
  1: ["p1"], 2: ["p2"], 3: ["p3"], 4: ["p4"], 5: ["p5"], 6: ["p6"],
  7: ["ls7"], 8: ["ls8"], 9: ["igcse9"],
  10: ["igcse10", "ged10"],
  11: ["as11", "ged11adv", "ged11basic"],
  12: ["a212", "ged12adv", "ged12basic"]
};

// CURRICULUM is what the browser renders. Each grade carries its tracks; a
// single-track grade renders exactly as before, with no stream selector.
const CURRICULUM = Object.keys(GRADE_TRACKS)
  .map(Number)
  .sort((a, b) => a - b)
  .map((id) => ({
    id,
    tracks: GRADE_TRACKS[id].map((key) => {
      const t = TRACKS[key];
      return {
        key,
        label: t.label || t.stage,
        stage: t.stage,
        book: t.book,
        strands: t.strands.map((s) => ({
          name: s.name,
          topics: s.topics.map((x) => ({ c: t.tag, ...x }))
        }))
      };
    })
  }));

const UI_STRINGS = {
  schoolName: "Al Injaz International Private School",
  schoolSub: "Under the Supervision of Ministry of Education",
  appSubtitle: "Mathematics Department — Curriculum Browser (Annual Syllabus 2026-27)",
  grades: "Grades",
  gradePrefix: "Grade",
  cambridge: "Cambridge",
  oman: "Oman Bilingual",
  ged: "GED",
  bothCurricula: "Both curricula",
  searchPlaceholder: "Search topics…",
  teacherNoteLabel: "Teaching note",
  noResults: "No topics match your search in this grade.",
  worksheetLink: "Worksheets & Exams",
  plannerLink: "Lesson Planner & Slides",
  draftNote: "Built from the department's Annual Syllabus 2026-27."
};
