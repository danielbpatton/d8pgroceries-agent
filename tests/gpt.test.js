const { MockRequest } = require("./__mocks__/scriptable");

// Set up global mocks before requiring gpt.js
beforeEach(() => {
  // Reset CONFIG to default state
  jest.resetModules();
  global.Request = MockRequest;
});

afterEach(() => {
  delete global.Request;
});

async function getGptExtract(apiKey) {
  const configMod = require("../src/config");
  configMod.CONFIG.OPENAI_API_KEY = apiKey !== undefined ? apiKey : "test-key-123";
  const { gptExtract } = require("../src/gpt");
  return gptExtract;
}

describe("gptExtract", () => {
  test("happy path: nested output array with output_text", async () => {
    const gptExtract = await getGptExtract("test-key-123");
    MockRequest.prototype.loadJSON = async function () {
      return {
        output: [
          {
            content: [
              { type: "output_text", text: '["bananas","eggs","milk"]' },
            ],
          },
        ],
      };
    };
    const result = await gptExtract("buy bananas eggs milk");
    expect(result).toEqual(["bananas", "eggs", "milk"]);
  });

  test("output_text shortcut", async () => {
    const gptExtract = await getGptExtract("test-key-123");
    MockRequest.prototype.loadJSON = async function () {
      return { output_text: '["bananas"]' };
    };
    const result = await gptExtract("buy bananas");
    expect(result).toEqual(["bananas"]);
  });

  test("extra text in response → still parses array", async () => {
    const gptExtract = await getGptExtract("test-key-123");
    MockRequest.prototype.loadJSON = async function () {
      return { output_text: 'Here are items: ["bananas"]' };
    };
    const result = await gptExtract("buy bananas");
    expect(result).toEqual(["bananas"]);
  });

  test("missing API key → throws with helpful message", async () => {
    jest.resetModules();
    global.Request = MockRequest;
    const configMod = require("../src/config");
    configMod.CONFIG.OPENAI_API_KEY = "";
    const { gptExtract } = require("../src/gpt");
    await expect(gptExtract("some text")).rejects.toMatchObject({
      message: "OpenAI API key not set",
      help: expect.any(String),
    });
  });

  test("placeholder API key 'OPENAI_API_KEY_HERE' → throws with helpful message", async () => {
    jest.resetModules();
    global.Request = MockRequest;
    const configMod = require("../src/config");
    configMod.CONFIG.OPENAI_API_KEY = "OPENAI_API_KEY_HERE";
    const { gptExtract } = require("../src/gpt");
    await expect(gptExtract("some text")).rejects.toMatchObject({
      message: "OpenAI API key not set",
      help: expect.any(String),
    });
  });

  test("deduplication: ['bananas', 'Bananas'] → returns one item", async () => {
    const gptExtract = await getGptExtract("test-key-123");
    MockRequest.prototype.loadJSON = async function () {
      return { output_text: '["bananas","Bananas"]' };
    };
    const result = await gptExtract("buy bananas");
    expect(result).toHaveLength(1);
    expect(result[0].toLowerCase()).toBe("bananas");
  });

  test("non-string items filtered: ['bananas', 42, null] → returns ['bananas']", async () => {
    const gptExtract = await getGptExtract("test-key-123");
    MockRequest.prototype.loadJSON = async function () {
      return { output_text: '["bananas", 42, null]' };
    };
    const result = await gptExtract("buy bananas");
    expect(result).toEqual(["bananas"]);
  });
});
