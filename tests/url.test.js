const { publixSearchUrl } = require("../src/url");

describe("publixSearchUrl", () => {
  test("'bananas' → correct base URL with q= param", () => {
    const url = publixSearchUrl("bananas");
    expect(url).toMatch(
      /^https:\/\/www\.instacart\.com\/store\/publix\/search\?q=bananas&page=1&ts=\d+&app_redirect=false$/
    );
  });

  test("'salmon fillets' → spaces encoded as +", () => {
    const url = publixSearchUrl("salmon fillets");
    expect(url).toContain("q=salmon+fillets");
    expect(url).not.toContain("%20");
  });

  test("\"Ben & Jerry's\" → ampersand and apostrophe encoded", () => {
    const url = publixSearchUrl("Ben & Jerry's");
    // The & in "Ben & Jerry's" should be percent-encoded, not a bare &
    // Split on known param boundaries to check the query value
    const qParam = url.split("?")[1].split("&")[0]; // "q=Ben+%26+Jerry%27s"
    expect(qParam).not.toContain("'");
    expect(qParam).toContain("Ben");
    expect(qParam).toContain("Jerry");
    expect(qParam).toContain("%27"); // apostrophe encoded
  });

  test("empty string → valid URL with no crash", () => {
    const url = publixSearchUrl("");
    expect(url).toMatch(/^https:\/\/www\.instacart\.com\/store\/publix\/search\?q=&page=1&ts=\d+&app_redirect=false$/);
  });
});
