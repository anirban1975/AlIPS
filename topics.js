// AlIPS — the syllabus topic list, shared by the lesson planner and the
// worksheet generator so both offer exactly the same topics.
//
// The topic list is the department's Annual Syllabus (data.js), not the list of
// question generators. Where a syllabus sub-topic also has a generator, the
// tools can produce questions for it; where it does not, the planner still
// drafts a lesson and the worksheet generator marks it as unavailable.

// ---------- Curriculum topics → question generators ----------
// The topic list comes from the annual syllabus (data.js), so every topic the
// department teaches can be planned. Where a topic also has a question
// generator, the plan gets starter, practice and homework questions too;
// where it does not, the plan is still drafted, just without them.

const STOPWORDS = new Set(["a", "an", "the", "of", "and", "or", "to", "in", "on",
  "for", "with", "by", "from", "as", "is", "are", "its", "their", "using", "use"]);

// Lowercase, strip punctuation, drop filler words, and take a crude stem so
// "circle" matches "circles" and "equation" matches "equations".
const words = (s) => String(s).toLowerCase()
  .replace(/[^a-z0-9 ]+/g, " ")
  .split(/\s+/)
  .filter((w) => w && !STOPWORDS.has(w))
  .map((w) => w.replace(/(ies)$/, "y").replace(/(es|s)$/, ""));

// Curriculum wording that no amount of word matching will connect to the
// generator that actually covers it. Primary needs most of these: the annual
// plan says "Finding totals" and "Taking away" where the generators say
// "Addition within 20" and "Subtraction within 20". Add to this table as
// more generators are written.
const TOPIC_ALIASES = {
  // Stage 1-2 number
  "adding numbers by counting on": "addWithin20",
  "counting on for addition": "addWithin20",
  "finding totals": "addWithin20",
  "addition facts to 5": "addWithin20",
  "pairs that total 10": "addWithin20",
  "pairs that total 20": "addWithin20",
  "equivalent addition facts": "addWithin20",
  "adding small numbers": "addWithin20",
  "combining sets of objects to add to 20": "addWithin20",
  "adding amounts up to 20": "addWithin20",
  "addition and subtraction facts for 10": "addWithin20",
  "addition and subtraction facts for 20": "addWithin20",
  "addition and subtraction with numbers to 20": "addWithin20",
  "subtracting numbers by counting back": "subWithin20",
  "counting back for subtraction": "subWithin20",
  "taking away": "subWithin20",
  "taking away a small number of objects": "subWithin20",
  "finding the difference": "subWithin20",
  "subtracting amounts up to 20": "subWithin20",
  "subtracting on a number line": "subWithin20",
  "counting up on a number line to find the difference": "subWithin20",
  "tens and ones making numbers": "placeValue",
  "tens and ones breaking up numbers": "placeValue",
  "tens and ones": "placeValue",
  // Stage 2-3 multiplication and division
  "counting in twos fives and tens": "timesTables",
  "multiplication as repeated addition": "timesTables",
  "multiplication tables of 1 and 2": "timesTables",
  "multiplication tables of 5 and 10": "timesTables",
  "multiplication tables of 2 4 and 8": "timesTables",
  "multiplication tables of 3 6 and 9": "timesTables",
  "learning multiplication tables": "timesTables",
  "multiples of 2 5 and 10": "timesTables",
  "division as sharing": "divisionRemainder",
  "division as grouping": "divisionRemainder",
  "division with and without remainders": "divisionRemainder",
  "sharing for division": "divisionRemainder",
  "grouping for division": "divisionRemainder",
  "adding pairs of two digit numbers": "columnAdd",
  "adding pairs of 2 digit numbers": "columnAdd",
  "adding pairs of 3 digit numbers": "columnAdd",
  "adding two digit and one digit numbers": "columnAdd",
  "adding pairs of 2 digit and 3 digit numbers": "columnAdd",
  "subtracting two digit numbers": "columnSub",
  "subtracting 2 digit numbers": "columnSub",
  "subtracting with 3 digit numbers": "columnSub",
  "subtracting 2 digit numbers from 3 digit numbers": "columnSub",
  "subtracting a one digit number from a two digit number": "columnSub",
  "fractions of a group": "fractionOfAmount",
  "divide to find fractions": "fractionOfAmount",
  "fractions of shapes and quantities": "fractionOfAmount",
  "fractions as operators": "fractionOfAmount",
  "percentage of shapes and quantities": "percentOfAmount",
  "percentages": "percentOfAmount",
  "introducing percentages": "percentOfAmount",
  "multiplying larger numbers": "longMultiplication",
  "multiplying 2 digit numbers": "longMultiplication",
  "multiplying a 2 digit number by a 1 digit number": "longMultiplication",
  "multiplying a 3 digit number by a 1 digit number": "longMultiplication",
  "multiplying by a 2 digit number": "longMultiplication",
  "multiplying numbers up to 1000": "longMultiplication",
  "multiplying whole numbers up to 10 000": "longMultiplication",
  "calculating angles in triangles": "anglesTriangle",
  "perimeter and area": "areaPerimeterRect",
  // Senior wording
  "logarithmic and exponential functions": "logarithms",
  "logarithms in other bases": "logarithms",
  "the laws of logarithms": "logarithms",
  "the relationship between exponents and logarithms": "logarithms",
  "using logarithms to solve equations and inequalities": "logarithms",
  "solving equations of the form a b": "expEquations",
  "indices standard form and surds": "standardForm",
  "algebraic indices": "indices",
  "index laws": "indices",
  "negative and fractional indices": "indices",
  "algebraic representation and manipulation": "factorise",
  "expanding the product of two algebraic expressions": "expandBrackets",
  "measures of variation": "standardDeviation",
  "variance and standard deviation": "standardDeviation",
  "mean median mode and range": "meanOfNumbers",
  "mode mean median range": "meanOfNumbers",
  "series": "binomial",
  "using the binomial expansion to expand brackets": "binomial"
};

// Best-matching generator for a curriculum topic name, or null.
//
// Every significant word of the shorter of the two names must be matched.
// A partial overlap is not good enough: "The binomial and geometric
// distributions" shares "binomial" with the binomial *expansion* generator
// but is a different topic entirely, and a wrong lesson is worse than none.
// A tie between two generators is also treated as no match.
function matchGenerator(name) {
  const alias = TOPIC_ALIASES[String(name).toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim()];
  if (alias && GENERATORS[alias]) return alias;

  const want = new Set(words(name));
  if (!want.size) return null;
  const hits = [];
  Object.keys(GENERATORS).forEach((id) => {
    const have = new Set(words(GENERATORS[id].name));
    const shared = [...want].filter((w) => have.has(w));
    if (shared.length < Math.min(want.size, have.size)) return;
    if (!shared.some((w) => w.length >= 5)) return;   // "time" or "area" alone is not enough
    hits.push(id);
  });
  return hits.length === 1 ? hits[0] : null;
}

// Every track a grade offers, in the order data.js lists them.
function tracksForGrade(grade) {
  const g = CURRICULUM.find((x) => x.id === grade) || CURRICULUM[0];
  return g.tracks;
}

// Flat list of every sub-topic in one grade and stream, each with the generator
// that covers it (or null). The key is unique per topic: two sub-topics can
// legitimately map to the same generator, and keying by generator merges them.
function topicRegistry(grade, trackIndex) {
  const tracks = tracksForGrade(grade);
  const track = tracks[Math.min(trackIndex || 0, tracks.length - 1)];
  const out = [];
  track.strands.forEach((strand) => {
    strand.topics.forEach((t) => {
      out.push({
        key: `${track.key}|${t.n}`,
        name: t.n,
        strand: strand.name,
        month: t.m || "",
        detail: t.s || "",
        note: t.t || "",
        gen: matchGenerator(t.n)
      });
    });
  });
  return out;
}
