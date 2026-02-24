const { CONFIG, ensureApiKey } = require("./config");
const { ruleBasedExtract } = require("./parser");
const { looksLikeNarrative } = require("./narrative");
const { gptExtract } = require("./gpt");
const { showModeAlert, getUserTextViaEditor, previewAndConfirm, shoppingLoop, finalizeScreen, showBuildMyList } = require("./ui");

async function main() {
  ensureApiKey();

  // 1. Mode selector — how are you shopping today?
  const mode = await showModeAlert();
  if (!mode) return; // cancelled

  while (true) {
    // 2. Get text from user (returns { text, wv, presented } so we can
    //    reuse the WebView for the checklist instead of stacking modals)
    const editorResult = await getUserTextViaEditor();
    const userText = editorResult.text;

    // 3. Cancelled or empty
    if (!userText || userText === "__CANCEL__" || !userText.trim()) return;

    // 4. Rule-based extraction
    let items = ruleBasedExtract(userText);

    // 5. GPT fallback if narrative
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

    // 6. No items found
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

    // 7. Preview and confirm
    const choice = await previewAndConfirm(items);
    if (choice === -1) return;        // Cancel Session
    if (choice === 1) continue;       // Back to Edit

    // 8. Branch by mode
    if (mode === "build") {
      // In-store checklist — reuse the editor WebView to avoid stacking
      await showBuildMyList(items, editorResult.wv, editorResult.presented);
    } else {
      // Delivery: walk through items on Instacart
      const result = await shoppingLoop(items);
      await finalizeScreen(result);
    }

    // 9. Done
    return;
  }
}

main();
