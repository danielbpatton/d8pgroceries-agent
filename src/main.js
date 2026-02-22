// main.js — orchestration: ties all modules together
// Not testable in Node (uses Scriptable globals via ui.js).

/* global Keychain */

const CONFIG = require("./config");
const { parseList } = require("./parser");
const { isNarrative } = require("./narrative");
const { parseWithGPT } = require("./gpt");
const {
  showModeAlert,
  showTextEditor,
  showPreview,
  showBuildMyList,
  runShoppingLoop
} = require("./ui");

async function run() {
  // 1. Ask user which mode they want
  const mode = await showModeAlert();
  if (!mode) return; // cancelled

  // 2. Get the grocery list text from the user
  let rawText = await showTextEditor();
  if (!rawText || !rawText.trim()) return;

  // 3. Parse the list — use GPT if the text looks like narrative prose
  let items;
  if (isNarrative(rawText)) {
    let apiKey = CONFIG.apiKey;
    if (apiKey === "OPENAI_API_KEY_HERE" && Keychain.contains("OPENAI_API_KEY")) {
      apiKey = Keychain.get("OPENAI_API_KEY");
    }
    try {
      items = await parseWithGPT(rawText, apiKey);
    } catch (e) {
      // Fall back to rule-based parser if GPT fails
      items = parseList(rawText);
    }
  } else {
    items = parseList(rawText);
  }

  if (!items || items.length === 0) return;

  // 4. Show preview and let user confirm
  const confirmed = await showPreview(items);
  if (!confirmed) {
    // Re-run from text editor so user can fix the list
    rawText = await showTextEditor(rawText);
    if (!rawText || !rawText.trim()) return;
    items = parseList(rawText);
    if (!items || items.length === 0) return;
  }

  // 5. Branch on selected mode
  if (mode === "build") {
    await showBuildMyList(items);
  } else {
    await runShoppingLoop(items);
  }
}

run();
