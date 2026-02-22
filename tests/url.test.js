const { instacartUrl, publixUrl } = require("../src/url");

describe("instacartUrl", () => {
  test("builds correct base URL", () => {
    const url = instacartUrl("milk");
    expect(url).toBe(
      "https://www.instacart.com/store/publix/search_v3/milk"
    );
  });

  test("URL-encodes spaces", () => {
    const url = instacartUrl("sourdough bread");
    expect(url).toContain("sourdough%20bread");
  });

  test("URL-encodes special characters", () => {
    const url = instacartUrl("Greek yogurt & granola");
    expect(url).toContain("%26");
  });

  test("trims leading/trailing whitespace from item", () => {
    const url = instacartUrl("  eggs  ");
    expect(url).toBe("https://www.instacart.com/store/publix/search_v3/eggs");
  });
});

describe("publixUrl", () => {
  test("builds correct base URL", () => {
    const url = publixUrl("milk");
    expect(url).toBe("https://www.publix.com/search?query=milk");
  });

  test("URL-encodes spaces", () => {
    const url = publixUrl("chicken breast");
    expect(url).toContain("chicken%20breast");
  });

  test("trims whitespace", () => {
    const url = publixUrl("  bread  ");
    expect(url).toBe("https://www.publix.com/search?query=bread");
  });
});
