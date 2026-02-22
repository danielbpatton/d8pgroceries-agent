const { isNarrative } = require("../src/narrative");
const fs = require("fs");
const path = require("path");

describe("isNarrative — fixture files", () => {
  test("messy.txt is detected as narrative", () => {
    const text = fs.readFileSync(path.join(__dirname, "fixtures/messy.txt"), "utf8");
    expect(isNarrative(text)).toBe(true);
  });

  test("clean.txt is NOT detected as narrative", () => {
    const text = fs.readFileSync(path.join(__dirname, "fixtures/clean.txt"), "utf8");
    expect(isNarrative(text)).toBe(false);
  });
});

describe("isNarrative — inline cases", () => {
  test("returns false for empty string", () => {
    expect(isNarrative("")).toBe(false);
  });

  test("returns false for whitespace-only string", () => {
    expect(isNarrative("   ")).toBe(false);
  });

  test("detects 'i need' connector", () => {
    expect(isNarrative("I need milk and eggs and some bread please")).toBe(true);
  });

  test("detects 'don't forget' connector", () => {
    expect(isNarrative("don't forget to get cheese")).toBe(true);
  });

  test("detects 'grab' connector", () => {
    expect(isNarrative("can you grab some apples and oranges")).toBe(true);
  });

  test("single long line without bullet treated as narrative", () => {
    const longLine = "milk eggs bread butter cheese chicken salmon apples bananas oranges yogurt";
    expect(isNarrative(longLine)).toBe(true);
  });

  test("clean bulleted list is NOT narrative", () => {
    const text = "- milk\n- eggs\n- bread\n- butter";
    expect(isNarrative(text)).toBe(false);
  });

  test("clean numbered list is NOT narrative", () => {
    const text = "1. milk\n2. eggs\n3. bread";
    expect(isNarrative(text)).toBe(false);
  });
});
