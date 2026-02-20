const fs = require("fs");
const path = require("path");
const {
  ruleBasedExtract,
  normalizeLine,
  splitIntoCandidateLines,
  stripPrefixes,
  isProbablyHeaderLine,
} = require("../src/parser");

const FIXTURES = path.join(__dirname, "fixtures");

function loadFixture(name) {
  return fs.readFileSync(path.join(FIXTURES, name), "utf8");
}

describe("ruleBasedExtract", () => {
  test("clean list fixture → extracts exact 7 items", () => {
    const text = loadFixture("clean-list.txt");
    const result = ruleBasedExtract(text);
    expect(result).toEqual([
      "Bananas",
      "Salmon fillets",
      "Old-fashioned oats",
      "Eggs",
      "Whole milk",
      "Spinach",
      "Sourdough bread",
    ]);
  });

  test("messy narrative fixture → extracts 12 grocery items", () => {
    const text = loadFixture("messy-narrative.txt");
    const result = ruleBasedExtract(text);
    expect(result).toHaveLength(12);
    expect(result).toContain("Bananas");
    expect(result).toContain("old-fashioned oats");
    expect(result).toContain("whole milk");
    expect(result).toContain("eggs");
    expect(result).toContain("Sourdough bread");
    expect(result).toContain("deli turkey");
    expect(result).toContain("Swiss cheese");
    expect(result).toContain("romaine lettuce");
    expect(result).toContain("tomatoes");
    expect(result).toContain("Greek yogurt");
    expect(result).toContain("mixed nuts");
    expect(result).toContain("dark chocolate");
  });

  test("messy narrative fixture → excludes excluded items and commentary", () => {
    const text = loadFixture("messy-narrative.txt");
    const result = ruleBasedExtract(text);
    const lower = result.map((i) => i.toLowerCase());
    expect(lower).not.toContain("round toilet seat");
    expect(lower).not.toContain("paper towels");
    expect(lower.some((i) => i.includes("elongated"))).toBe(false);
    expect(lower.some((i) => i.includes("fully operational"))).toBe(false);
    expect(lower.some((i) => i.includes("calm, cohesive"))).toBe(false);
    expect(lower.some((i) => i.includes("no waste"))).toBe(false);
  });

  test("dictation fragments fixture → includes expected items, excludes paper towels", () => {
    const text = loadFixture("dictation-fragments.txt");
    const result = ruleBasedExtract(text);
    const lower = result.map((i) => i.toLowerCase());
    expect(lower.some((i) => i.includes("banana"))).toBe(true);
    expect(lower.some((i) => i.includes("oat"))).toBe(true);
    expect(lower.some((i) => i.includes("milk"))).toBe(true);
    expect(lower.some((i) => i.includes("egg"))).toBe(true);
    expect(lower.some((i) => i.includes("salmon"))).toBe(true);
    expect(lower.some((i) => i.includes("spinach"))).toBe(true);
    expect(lower.some((i) => i.includes("paper towel"))).toBe(false);
  });

  test("empty string → returns []", () => {
    expect(ruleBasedExtract("")).toEqual([]);
  });

  test("whitespace-only → returns []", () => {
    expect(ruleBasedExtract("   \n\t  ")).toEqual([]);
  });

  test("deduplication: 'bananas' appearing twice → output has it once", () => {
    const input = "bananas\nbananas\neggs";
    const result = ruleBasedExtract(input);
    const bananas = result.filter((i) => i.toLowerCase() === "bananas");
    expect(bananas).toHaveLength(1);
  });

  test("MAX_ITEMS cap: 100+ items → output length ≤ 80", () => {
    const items = Array.from({ length: 100 }, (_, i) => `item${i}`).join("\n");
    const result = ruleBasedExtract(items);
    expect(result.length).toBeLessThanOrEqual(80);
  });
});

describe("normalizeLine", () => {
  test("en-dash → hyphen", () => {
    expect(normalizeLine("en\u2013dash")).toBe("en-dash");
  });

  test("tabs → spaces", () => {
    expect(normalizeLine("a\tb")).toBe("a b");
  });

  test("multi-space → single space", () => {
    expect(normalizeLine("a   b")).toBe("a b");
  });
});

describe("isProbablyHeaderLine", () => {
  test("'Breakfasts:' → true", () => {
    expect(isProbablyHeaderLine("Breakfasts:")).toBe(true);
  });

  test("'bananas' → false", () => {
    expect(isProbablyHeaderLine("bananas")).toBe(false);
  });

  test("'PRODUCE' → true", () => {
    expect(isProbablyHeaderLine("PRODUCE")).toBe(true);
  });
});

describe("stripPrefixes", () => {
  test("'- grab: bananas' → 'bananas'", () => {
    expect(stripPrefixes("- grab: bananas")).toBe("bananas");
  });
});
