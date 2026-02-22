// gpt.js — OpenAI Responses API integration
// Uses Scriptable's Request global for HTTP (no fetch/node http).
// NOTE: This uses the OpenAI *Responses* API (POST /v1/responses),
// NOT the Chat Completions API (/v1/chat/completions).
// Responses API request body uses "input" (not "messages").
// Responses API response shape: { output: [{ content: [{ text: "..." }] }] }

const CONFIG = require("./config");

/**
 * Send raw grocery text to GPT and return a clean string[] of item names.
 * @param {string} rawText
 * @param {string} [apiKey] — overrides CONFIG.apiKey (for testing)
 * @param {string} [model]  — overrides CONFIG.openaiModel (for testing)
 * @returns {Promise<string[]>}
 */
async function parseWithGPT(rawText, apiKey, model) {
  const key = apiKey || CONFIG.apiKey;
  const mod = model || CONFIG.openaiModel;

  const prompt =
    "You are a grocery list parser. Extract every grocery item from the text below. " +
    "Return ONLY a JSON array of strings — one item per element, clean names only, no quantities. " +
    'Example: ["milk", "eggs", "sourdough bread"]\n\n' +
    rawText;

  const req = new Request("https://api.openai.com/v1/responses"); // eslint-disable-line no-undef
  req.method = "POST";
  req.headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`
  };
  req.body = JSON.stringify({
    model: mod,
    input: prompt
  });

  let data;
  try {
    data = await req.loadJSON();
  } catch (e) {
    const err = new Error("GPT request failed: " + e.message);
    err.help = "Check your OpenAI API key in Keychain and your internet connection.";
    throw err;
  }

  // Extract text from Responses API shape
  const text =
    data &&
    data.output &&
    data.output[0] &&
    data.output[0].content &&
    data.output[0].content[0] &&
    data.output[0].content[0].text;

  if (!text) {
    const err = new Error("Unexpected GPT response shape");
    err.help = "The OpenAI API returned an unexpected response. Try again.";
    throw err;
  }

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch (_) {
    // Fallback: split on newlines if not valid JSON
    return text
      .split("\n")
      .map(l => l.replace(/^[-*•\d.\s]+/, "").trim())
      .filter(l => l.length > 0);
  }

  return [];
}

module.exports = { parseWithGPT };
