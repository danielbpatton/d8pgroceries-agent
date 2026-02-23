const fs = require("fs");
const path = require("path");
const { looksLikeNarrative } = require("../src/narrative");

const FIXTURES = path.join(__dirname, "fixtures");

function loadFixture(name) {
  return fs.readFileSync(path.join(FIXTURES, name), "utf8");
}

describe("looksLikeNarrative", () => {
  test("clean list fixture → false", () => {
    expect(looksLikeNarrative(loadFixture("clean-list.txt"))).toBe(false);
  });

  test("messy narrative fixture → true", () => {
    expect(looksLikeNarrative(loadFixture("messy-narrative.txt"))).toBe(true);
  });

  test("short comma list 'bananas, eggs, milk' → false", () => {
    expect(looksLikeNarrative("bananas, eggs, milk")).toBe(false);
  });

  test("empty string → true", () => {
    expect(looksLikeNarrative("")).toBe(true);
  });

  test("single word 'bananas' → false", () => {
    expect(looksLikeNarrative("bananas")).toBe(false);
  });

  test("long prose (>500 chars, 3+ sentences) → true", () => {
    const text =
      "This is a very long sentence about groceries. " +
      "I need to buy bananas, oats, and whole milk. " +
      "Also salmon fillets for dinner tonight. " +
      "Let me think about what else I might need. " +
      "There are so many options at the store these days. " +
      "Maybe I should make a proper list instead of winging it. " +
      "Anyway I think that covers most of what I need for the week. " +
      "I also want to pick up some Greek yogurt and mixed nuts. " +
      "Dark chocolate would be a nice treat too. " +
      "And definitely sourdough bread for lunches. ".repeat(3);
    expect(text.length).toBeGreaterThan(500);
    expect(looksLikeNarrative(text)).toBe(true);
  });

  test("short text with commentary pattern 'this covers breakfasts' → true", () => {
    expect(looksLikeNarrative("this covers breakfasts and lunches")).toBe(true);
  });

  test("single-paragraph prose with 2 sentences → true", () => {
    const text = "Need to buy some bananas and some eggs and some whole milk maybe. One of those small boxes of Reese's Pieces and a family pack of AAA batteries.";
    expect(looksLikeNarrative(text)).toBe(true);
  });

  test("single-line over 80 chars with no newlines → true", () => {
    const text = "I need bananas and eggs and whole milk and bread and peanut butter and jelly and cheese and crackers";
    expect(looksLikeNarrative(text)).toBe(true);
  });

  test("short single-line list under 80 chars → false", () => {
    expect(looksLikeNarrative("bananas, eggs, milk, bread")).toBe(false);
  });
});
