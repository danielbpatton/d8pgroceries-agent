const { publixSearchUrl } = require("./url");

/**
 * Show a fullscreen HTML editor for the user to type/paste/dictate their list.
 * @returns {Promise<string>} The entered text, or "__CANCEL__" if cancelled.
 */
async function getUserTextViaEditor() {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: -apple-system, sans-serif; padding: 16px; background: #f5f5f5; }
  h2 { margin-bottom: 4px; }
  p { color: #555; font-size: 14px; margin-top: 0; }
  textarea { width: 100%; height: 45vh; font-size: 16px; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 8px; resize: vertical; }
  .buttons { margin-top: 12px; display: flex; gap: 8px; }
  button { flex: 1; padding: 12px; font-size: 16px; border: none; border-radius: 8px; cursor: pointer; }
  .primary { background: #111; color: #fff; }
  .secondary { background: #ddd; color: #333; }
</style>
</head>
<body>
<h2>Publix Agent</h2>
<p>Paste, type, or dictate your list. Edit as much as you want. Nothing happens until you tap Parse &amp; Preview.</p>
<textarea id="list" placeholder="e.g. bananas, eggs, whole milk..."></textarea>
<div class="buttons">
  <button class="secondary" onclick="completion('__CANCEL__')">Cancel</button>
  <button class="primary" onclick="completion(document.getElementById('list').value)">Parse &amp; Preview</button>
</div>
</body>
</html>`;

  const wv = new WebView();
  await wv.loadHTML(html);
  const result = await wv.present(true);

  if (typeof result === "string") return result;

  // Fallback: Alert with text field
  const alert = new Alert();
  alert.title = "Enter Your List";
  alert.message = "Paste or type your grocery list below.";
  alert.addTextField("e.g. bananas, eggs, milk", "");
  alert.addAction("Parse & Preview");
  alert.addCancelAction("Cancel");
  const choice = await alert.present();
  if (choice === -1) return "__CANCEL__";
  return alert.textFieldValue(0);
}

/**
 * Show parsed items for user confirmation.
 * @param {string[]} items
 * @returns {Promise<number>} 0 = Start Shopping, 1 = Back to Edit, -1 = Cancel
 */
async function previewAndConfirm(items) {
  const alert = new Alert();
  alert.title = "Parsed Items";
  alert.message = items.map((i) => `• ${i}`).join("\n");
  alert.addAction("Start Shopping");
  alert.addAction("Back to Edit");
  alert.addCancelAction("Cancel Session");
  return await alert.present();
}

/**
 * Walk the user through each item one at a time.
 * @param {string[]} items
 * @returns {Promise<{status: string, processed: number}>}
 */
async function shoppingLoop(items) {
  let processed = 0;
  for (let i = 0; i < items.length; i++) {
    const alert = new Alert();
    alert.title = `Next Item (${i + 1}/${items.length})`;
    alert.message = items[i];
    alert.addAction("Open in Publix");
    alert.addAction("Skip");
    alert.addCancelAction("Cancel Session");
    const choice = await alert.present();

    if (choice === -1) {
      return { status: "cancelled", processed: i };
    }
    if (choice === 0) {
      Safari.open(publixSearchUrl(items[i]));
    }
    processed = i + 1;
  }
  return { status: "done", processed };
}

/**
 * Show completion summary.
 * @param {{status: string, processed: number}} result
 * @returns {Promise<void>}
 */
async function finalizeScreen(result) {
  const alert = new Alert();
  if (result.status === "done") {
    alert.title = "All Items Processed";
    alert.message = `Finished all ${result.processed} item${result.processed !== 1 ? "s" : ""}.`;
  } else {
    alert.title = "Session Cancelled";
    alert.message = `Processed ${result.processed} item${result.processed !== 1 ? "s" : ""} before cancelling.`;
  }
  alert.addAction("OK");
  await alert.present();
}

module.exports = { getUserTextViaEditor, previewAndConfirm, shoppingLoop, finalizeScreen };
