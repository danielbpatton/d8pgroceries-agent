const { publixSearchUrl } = require("../src/url");

describe("publixSearchUrl", () => {
  test("'bananas' → correct URL", () => {
    expect(publixSearchUrl("bananas")).toBe(
      "https://www.instacart.com/store/publix/search?query=bananas"
    );
  });

  test("'salmon fillets' → query contains salmon%20fillets", () => {
    const url = publixSearchUrl("salmon fillets");
    expect(url).toContain("salmon%20fillets");
  });

  test("\"Ben & Jerry's\" → ampersand and apostrophe encoded", () => {
    const url = publixSearchUrl("Ben & Jerry's");
    expect(url).not.toContain("&");
    expect(url).not.toContain("'");
    expect(url).toContain("Ben");
    expect(url).toContain("Jerry");
  });

  test("empty string → valid URL with no crash", () => {
    const url = publixSearchUrl("");
    expect(url).toMatch(/^https:\/\/www\.instacart\.com\/store\/publix\/search\?query=/);
  });
});
