const { splitLines, cleanItem, isItemLine, parseList } = require("../src/parser");

describe("splitLines", () => {
  test("splits on newlines", () => {
    expect(splitLines("milk\neggs\nbread")).toEqual(["milk", "eggs", "bread"]);
  });

  test("splits on semicolons", () => {
    expect(splitLines("milk;eggs;bread")).toEqual(["milk", "eggs", "bread"]);
  });

  test("splits comma-separated items", () => {
    expect(splitLines("milk, eggs, bread")).toEqual(["milk", "eggs", "bread"]);
  });

  test("ignores blank lines", () => {
    expect(splitLines("milk\n\nbread")).toEqual(["milk", "bread"]);
  });

  test("handles mixed separators", () => {
    const result = splitLines("milk\neggs; bread");
    expect(result).toContain("milk");
    expect(result).toContain("eggs");
    expect(result).toContain("bread");
  });
});

describe("cleanItem", () => {
  test("removes leading dash bullet", () => {
    expect(cleanItem("- milk")).toBe("milk");
  });

  test("removes leading asterisk bullet", () => {
    expect(cleanItem("* eggs")).toBe("eggs");
  });

  test("removes numbered list prefix '1. '", () => {
    expect(cleanItem("1. bread")).toBe("bread");
  });

  test("removes numbered list prefix '2) '", () => {
    expect(cleanItem("2) butter")).toBe("butter");
  });

  test("removes leading quantity '2 '", () => {
    expect(cleanItem("2 avocados")).toBe("avocados");
  });

  test("removes trailing parenthetical note", () => {
    expect(cleanItem("milk (whole, 1 gallon)")).toBe("milk");
  });

  test("removes trailing dash note", () => {
    expect(cleanItem("milk – 2% fat")).toBe("milk");
  });

  test("preserves plain item names", () => {
    expect(cleanItem("sourdough bread")).toBe("sourdough bread");
  });

  test("trims whitespace", () => {
    expect(cleanItem("  eggs  ")).toBe("eggs");
  });
});

describe("isItemLine", () => {
  test("accepts normal item names", () => {
    expect(isItemLine("milk")).toBe(true);
    expect(isItemLine("sourdough bread")).toBe(true);
    expect(isItemLine("Greek yogurt")).toBe(true);
  });

  test("rejects empty strings", () => {
    expect(isItemLine("")).toBe(false);
    expect(isItemLine(" ")).toBe(false);
  });

  test("rejects single character", () => {
    expect(isItemLine("a")).toBe(false);
  });

  test("rejects ALL CAPS section headers", () => {
    expect(isItemLine("PRODUCE")).toBe(false);
    expect(isItemLine("DAIRY ITEMS")).toBe(false);
  });

  test("rejects lines ending with colon", () => {
    expect(isItemLine("Produce:")).toBe(false);
  });

  test("rejects purely numeric lines", () => {
    expect(isItemLine("42")).toBe(false);
  });
});

describe("parseList — clean fixture", () => {
  const fs = require("fs");
  const path = require("path");
  const text = fs.readFileSync(path.join(__dirname, "fixtures/clean.txt"), "utf8");

  test("parses 10 items from clean fixture", () => {
    const items = parseList(text);
    expect(items).toHaveLength(10);
  });

  test("includes milk", () => {
    expect(parseList(text)).toContain("milk");
  });

  test("includes eggs", () => {
    expect(parseList(text)).toContain("eggs");
  });

  test("includes sourdough bread", () => {
    expect(parseList(text)).toContain("sourdough bread");
  });
});

describe("parseList — bulleted list", () => {
  const text = "- Bananas\n- 2 dozen eggs\n* Whole milk\n• Sourdough bread";

  test("extracts all four items", () => {
    expect(parseList(text)).toHaveLength(4);
  });

  test("cleans 'Bananas'", () => {
    expect(parseList(text)).toContain("Bananas");
  });

  test("cleans eggs (strips quantity)", () => {
    expect(parseList(text)).toContain("dozen eggs");
  });
});

describe("parseList — numbered list", () => {
  const text = "1. Chicken breast\n2. Greek yogurt\n3. Cheddar cheese";

  test("extracts three items", () => {
    expect(parseList(text)).toHaveLength(3);
  });

  test("contains 'Chicken breast'", () => {
    expect(parseList(text)).toContain("Chicken breast");
  });
});
