const { categorizeItem, groupByAisle, SECTIONS, DEFAULT_SECTION } = require("../src/aisles");

describe("categorizeItem", () => {
  test("categorizes produce items", () => {
    expect(categorizeItem("bananas")).toBe("Produce");
    expect(categorizeItem("spinach")).toBe("Produce");
    expect(categorizeItem("avocado")).toBe("Produce");
  });

  test("categorizes dairy items", () => {
    expect(categorizeItem("milk")).toBe("Dairy & Eggs");
    expect(categorizeItem("eggs")).toBe("Dairy & Eggs");
    expect(categorizeItem("cream cheese")).toBe("Dairy & Eggs");
  });

  test("categorizes meat and seafood", () => {
    expect(categorizeItem("chicken breast")).toBe("Meat & Seafood");
    expect(categorizeItem("ground beef")).toBe("Meat & Seafood");
    expect(categorizeItem("salmon")).toBe("Meat & Seafood");
  });

  test("categorizes canned goods", () => {
    expect(categorizeItem("tomato sauce")).toBe("Canned & Jarred Goods");
    expect(categorizeItem("chicken broth")).toBe("Canned & Jarred Goods");
    expect(categorizeItem("peanut butter")).toBe("Canned & Jarred Goods");
  });

  test("longer keyword wins over shorter", () => {
    // "chicken breast" should match "chicken breast" (Meat) not "breast" or shorter
    expect(categorizeItem("chicken breast")).toBe("Meat & Seafood");
    // "cream cheese" should match "cream cheese" (Dairy) not just "cream" or "cheese"
    expect(categorizeItem("cream cheese")).toBe("Dairy & Eggs");
    // "ground beef" specifically
    expect(categorizeItem("ground beef")).toBe("Meat & Seafood");
  });

  test("is case-insensitive", () => {
    expect(categorizeItem("BANANAS")).toBe("Produce");
    expect(categorizeItem("Milk")).toBe("Dairy & Eggs");
    expect(categorizeItem("CHICKEN BREAST")).toBe("Meat & Seafood");
  });

  test("uses word-boundary matching to avoid false positives", () => {
    // "ham" in "shampoo" should NOT match — shampoo is Personal Care
    expect(categorizeItem("shampoo")).toBe("Personal Care");
    // "oat" in "coat" should not match produce/dairy
    expect(categorizeItem("coat rack")).toBe("Other");
  });

  test("returns Other for unknown items", () => {
    expect(categorizeItem("flux capacitor")).toBe("Other");
    expect(categorizeItem("something random")).toBe("Other");
  });

  test("categorizes cleaning supplies", () => {
    expect(categorizeItem("dish soap")).toBe("Cleaning Supplies");
    expect(categorizeItem("trash bags")).toBe("Cleaning Supplies");
  });

  test("categorizes beverages", () => {
    expect(categorizeItem("orange juice")).toBe("Beverages");
    expect(categorizeItem("sparkling water")).toBe("Beverages");
  });

  test("categorizes snacks", () => {
    expect(categorizeItem("potato chips")).toBe("Snacks & Chips");
    expect(categorizeItem("pretzels")).toBe("Snacks & Chips");
  });

  test("categorizes bakery items", () => {
    expect(categorizeItem("sourdough")).toBe("Bakery");
    expect(categorizeItem("bagels")).toBe("Bakery");
  });
});

describe("groupByAisle", () => {
  test("groups items by section in store walk order", () => {
    const items = ["bananas", "milk", "chicken breast", "bread", "trash bags"];
    const result = groupByAisle(items);

    const sectionNames = result.map((g) => g.section);
    expect(sectionNames).toEqual([
      "Produce",     // order 1
      "Bakery",      // order 3
      "Meat & Seafood", // order 4
      "Dairy & Eggs",   // order 5
      "Cleaning Supplies" // order 16
    ]);
  });

  test("sorts items within each section alphabetically", () => {
    const items = ["spinach", "celery", "avocado", "bananas"];
    const result = groupByAisle(items);

    expect(result).toHaveLength(1);
    expect(result[0].section).toBe("Produce");
    expect(result[0].items).toEqual(["avocado", "bananas", "celery", "spinach"]);
  });

  test("places unknown items in Other at the end", () => {
    const items = ["bananas", "flux capacitor"];
    const result = groupByAisle(items);

    expect(result[result.length - 1].section).toBe("Other");
    expect(result[result.length - 1].items).toEqual(["flux capacitor"]);
  });

  test("returns empty array for empty input", () => {
    expect(groupByAisle([])).toEqual([]);
  });

  test("handles single item", () => {
    const result = groupByAisle(["milk"]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ section: "Dairy & Eggs", items: ["milk"] });
  });
});

describe("SECTIONS", () => {
  test("has 20 sections", () => {
    expect(SECTIONS).toHaveLength(20);
  });

  test("sections have unique orders", () => {
    const orders = SECTIONS.map((s) => s.order);
    expect(new Set(orders).size).toBe(SECTIONS.length);
  });

  test("every section has keywords", () => {
    for (const section of SECTIONS) {
      expect(section.keywords.length).toBeGreaterThan(0);
    }
  });
});

describe("DEFAULT_SECTION", () => {
  test("has order 99", () => {
    expect(DEFAULT_SECTION.order).toBe(99);
  });

  test("has name Other", () => {
    expect(DEFAULT_SECTION.name).toBe("Other");
  });
});
