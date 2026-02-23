const { CONFIG, ensureApiKey } = require("./config");
const { ruleBasedExtract } = require("./parser");
const { looksLikeNarrative } = require("./narrative");
const { gptExtract } = require("./gpt");
const { getUserTextViaEditor, previewAndConfirm, shoppingLoop, finalizeScreen } = require("./ui");

async function main() {
  ensureApiKey();

  while (true) {
    // a. Get text from user
    const userText = await getUserTextViaEditor();

    // b. Cancelled or empty
    if (!userText || userText === "__CANCEL__" || !userText.trim()) return;

    // c. Rule-based extraction
    let items = ruleBasedExtract(userText);

    // d. GPT fallback if narrative
    if (CONFIG.ENABLE_GPT_FALLBACK && looksLikeNarrative(userText)) {
      try {
        const gptItems = await gptExtract(userText);
        if (gptItems && gptItems.length > 0) {
          items = gptItems;
        }
      } catch (err) {
        const errAlert = new Alert();
        errAlert.title = "GPT fallback failed (using rules)";
        errAlert.message = err.help || err.message || "Unknown error";
        errAlert.addAction("OK");
        await errAlert.present();
      }
    }

    // e. No items found
    if (!items || items.length === 0) {
      const noItemsAlert = new Alert();
      noItemsAlert.title = "No items found";
      noItemsAlert.message = "Try editing your list or using a different format.";
      noItemsAlert.addAction("Back to Edit");
      noItemsAlert.addCancelAction("Cancel");
      const choice = await noItemsAlert.present();
      if (choice === -1) return;
      continue;
    }

    // f. Preview and confirm
    const choice = await previewAndConfirm(items);
    if (choice === -1) return;        // Cancel Session
    if (choice === 1) continue;       // Back to Edit

    // g. Shopping loop
    const result = await shoppingLoop(items);

    // h. Finalize
    await finalizeScreen(result);

    // i. Return after one complete session
    return;
  }
}

main();
