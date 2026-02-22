const { categorizeItem, groupByAisle, SECTIONS } = require("../src/aisles");

describe("categorizeItem — known categories", () => {
  test("milk → Dairy & Eggs", () => {
    expect(categorizeItem("milk")).toBe("Dairy & Eggs");
  });

  test("eggs → Dairy & Eggs", () => {
    expect(categorizeItem("eggs")).toBe("Dairy & Eggs");
  });

  test("cheddar cheese → Dairy & Eggs", () => {
    expect(categorizeItem("cheddar cheese")).toBe("Dairy & Eggs");
  });

  test("chicken breast → Meat & Seafood", () => {
    expect(categorizeItem("chicken breast")).toBe("Meat & Seafood");
  });

  test("salmon → Meat & Seafood", () => {
    expect(categorizeItem("salmon")).toBe("Meat & Seafood");
  });

  test("apples → Produce", () => {
    expect(categorizeItem("apples")).toBe("Produce");
  });

  test("baby spinach → Produce", () => {
    expect(categorizeItem("baby spinach")).toBe("Produce");
  });

  test("grape tomatoes → Produce", () => {
    expect(categorizeItem("grape tomatoes")).toBe("Produce");
  });

  test("sourdough bread → Bakery", () => {
    expect(categorizeItem("sourdough bread")).toBe("Bakery");
  });

  test("orange juice → Beverages", () => {
    expect(categorizeItem("orange juice")).toBe("Beverages");
  });

  test("spaghetti → Pasta, Rice & Grains", () => {
    expect(categorizeItem("spaghetti")).toBe("Pasta, Rice & Grains");
  });

  test("brown rice → Pasta, Rice & Grains", () => {
    expect(categorizeItem("brown rice")).toBe("Pasta, Rice & Grains");
  });

  test("frozen pizza → Frozen Foods", () => {
    expect(categorizeItem("frozen pizza")).toBe("Frozen Foods");
  });

  test("ice cream → Frozen Foods", () => {
    expect(categorizeItem("ice cream")).toBe("Frozen Foods");
  });

  test("tomato sauce → Canned & Jarred Goods", () => {
    expect(categorizeItem("tomato sauce")).toBe("Canned & Jarred Goods");
  });

  test("peanut butter → Canned & Jarred Goods", () => {
    expect(categorizeItem("peanut butter")).toBe("Canned & Jarred Goods");
  });

  test("granola → Breakfast & Cereal", () => {
    expect(categorizeItem("granola")).toBe("Breakfast & Cereal");
  });

  test("tortilla chips → Snacks & Chips", () => {
    expect(categorizeItem("tortilla chips")).toBe("Snacks & Chips");
  });

  test("red wine → Wine, Beer & Spirits", () => {
    expect(categorizeItem("red wine")).toBe("Wine, Beer & Spirits");
  });

  test("dish soap → Cleaning Supplies", () => {
    expect(categorizeItem("dish soap")).toBe("Cleaning Supplies");
  });

  test("paper towels → Paper & Household", () => {
    expect(categorizeItem("paper towels")).toBe("Paper & Household");
  });

  test("shampoo → Personal Care", () => {
    expect(categorizeItem("shampoo")).toBe("Personal Care");
  });

  test("dog food → Baby & Pet", () => {
    expect(categorizeItem("dog food")).toBe("Baby & Pet");
  });

  test("ibuprofen → Pharmacy & Health", () => {
    expect(categorizeItem("ibuprofen")).toBe("Pharmacy & Health");
  });

  test("ketchup → Condiments & Sauces", () => {
    expect(categorizeItem("ketchup")).toBe("Condiments & Sauces");
  });

  test("olive oil → Condiments & Sauces", () => {
    expect(categorizeItem("olive oil")).toBe("Condiments & Sauces");
  });

  test("baking powder → Baking & Spices", () => {
    expect(categorizeItem("baking powder")).toBe("Baking & Spices");
  });

  test("ground coffee → Coffee & Tea", () => {
    expect(categorizeItem("ground coffee")).toBe("Coffee & Tea");
  });

  test("unknown item → Other", () => {
    expect(categorizeItem("zznzznzzn_unknown_item")).toBe("Other");
  });
});

describe("categorizeItem — case insensitivity", () => {
  test("MILK → Dairy & Eggs", () => {
    expect(categorizeItem("MILK")).toBe("Dairy & Eggs");
  });

  test("Greek Yogurt → Dairy & Eggs", () => {
    expect(categorizeItem("Greek Yogurt")).toBe("Dairy & Eggs");
  });
});

describe("groupByAisle", () => {
  const items = [
    "milk",
    "eggs",
    "chicken breast",
    "apples",
    "sourdough bread",
    "spaghetti",
    "canned tuna",
    "orange juice"
  ];

  let groups;
  beforeAll(() => { groups = groupByAisle(items); });

  test("returns an array", () => {
    expect(Array.isArray(groups)).toBe(true);
  });

  test("each group has section and items keys", () => {
    for (const g of groups) {
      expect(g).toHaveProperty("section");
      expect(g).toHaveProperty("items");
      expect(Array.isArray(g.items)).toBe(true);
    }
  });

  test("sections are in store walk order (Produce before Bakery)", () => {
    const produceIdx = groups.findIndex(g => g.section === "Produce");
    const bakeryIdx = groups.findIndex(g => g.section === "Bakery");
    expect(produceIdx).toBeGreaterThanOrEqual(0);
    expect(bakeryIdx).toBeGreaterThanOrEqual(0);
    expect(produceIdx).toBeLessThan(bakeryIdx);
  });

  test("Dairy & Eggs section comes before Frozen Foods", () => {
    const dairyIdx = groups.findIndex(g => g.section === "Dairy & Eggs");
    const frozenIdx = groups.findIndex(g => g.section === "Frozen Foods");
    if (frozenIdx >= 0) expect(dairyIdx).toBeLessThan(frozenIdx);
  });

  test("items within a section are sorted alphabetically", () => {
    const dairy = groups.find(g => g.section === "Dairy & Eggs");
    if (dairy && dairy.items.length > 1) {
      const sorted = dairy.items.slice().sort();
      expect(dairy.items).toEqual(sorted);
    }
  });

  test("all input items are present in output", () => {
    const allItems = groups.flatMap(g => g.items);
    for (const item of items) {
      expect(allItems).toContain(item);
    }
  });

  test("handles empty array", () => {
    expect(groupByAisle([])).toEqual([]);
  });

  test("handles single item", () => {
    const result = groupByAisle(["milk"]);
    expect(result).toHaveLength(1);
    expect(result[0].section).toBe("Dairy & Eggs");
    expect(result[0].items).toEqual(["milk"]);
  });
});

describe("SECTIONS — integrity", () => {
  test("all sections have name, order, and keywords", () => {
    for (const s of SECTIONS) {
      expect(typeof s.name).toBe("string");
      expect(typeof s.order).toBe("number");
      expect(Array.isArray(s.keywords)).toBe(true);
      expect(s.keywords.length).toBeGreaterThan(0);
    }
  });

  test("section orders are unique", () => {
    const orders = SECTIONS.map(s => s.order);
    const unique = new Set(orders);
    expect(unique.size).toBe(orders.length);
  });
});
