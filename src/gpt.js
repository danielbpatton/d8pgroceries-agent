const { CONFIG } = require("./config");

const PROMPT_TEMPLATE = `Extract only purchasable grocery or pharmacy items from the following text.
Rules:
- Exclude meal plans, explanations, jokes, commentary.
- Exclude any items under sections labeled 'Skip' or 'What You Are NOT Buying Today'.
- Preserve meaningful modifiers (e.g., low sodium, old-fashioned, extra virgin).
- Return ONLY valid JSON: an array of strings. No markdown, no commentary.

Text:
{input}`;

/**
 * Use OpenAI to extract grocery items from text.
 * @param {string} text
 * @returns {Promise<string[]>}
 */
async function gptExtract(text) {
  if (
    !CONFIG.OPENAI_API_KEY ||
    CONFIG.OPENAI_API_KEY === "OPENAI_API_KEY_HERE"
  ) {
    const err = new Error("OpenAI API key not set");
    err.help = "Go to Scriptable settings and add your OpenAI API key to Keychain under the key 'OPENAI_API_KEY'.";
    throw err;
  }

  const prompt = PROMPT_TEMPLATE.replace("{input}", text);

  const req = new Request(CONFIG.OPENAI_ENDPOINT);
  req.method = "POST";
  req.headers = {
    "Authorization": `Bearer ${CONFIG.OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  };
  req.body = JSON.stringify({ model: CONFIG.OPENAI_MODEL, input: prompt });

  const res = await req.loadJSON();

  // Parse response: check res.output array for output_text content, or res.output_text string
  let rawText = null;
  if (res.output && Array.isArray(res.output)) {
    for (const item of res.output) {
      if (item.content && Array.isArray(item.content)) {
        for (const c of item.content) {
          if (c.type === "output_text" && typeof c.text === "string") {
            rawText = c.text;
            break;
          }
        }
      }
      if (rawText) break;
    }
  }
  if (!rawText && typeof res.output_text === "string") {
    rawText = res.output_text;
  }

  if (!rawText) {
    return [];
  }

  // Try to parse as JSON array
  let parsed = null;
  try {
    parsed = JSON.parse(rawText);
  } catch (_) {
    // Try to find JSON array in text
    const start = rawText.indexOf("[");
    const end = rawText.lastIndexOf("]");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        parsed = JSON.parse(rawText.slice(start, end + 1));
      } catch (_2) {
        return [];
      }
    } else {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  // Filter non-strings, normalize, deduplicate (case-insensitive), cap at MAX_ITEMS
  const seen = new Set();
  const results = [];
  for (const item of parsed) {
    if (typeof item !== "string") continue;
    const normalized = item.trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(normalized);
    if (results.length >= CONFIG.MAX_ITEMS) break;
  }

  return results;
}

module.exports = { gptExtract };
