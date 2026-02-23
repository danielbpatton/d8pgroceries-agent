const { publixSearchUrl } = require("./url");

/**
 * Show a fullscreen HTML editor for the user to type/paste/dictate their list.
 * @returns {Promise<string>} The entered text, or "__CANCEL__" if cancelled.
 */
async function getUserTextViaEditor() {
  const html = `<!DOCTYPE html>
<html style="background:#ffffff;color:#111111;min-height:100vh;">
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<style>
  /* Force light mode and explicit backgrounds to avoid black screen in Scriptable */
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: #ffffff !important;
    color: #111111 !important;
  }
  body {
    font-family: -apple-system, sans-serif;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  h2 { margin: 0 0 4px 0; }
  p { color: #555; font-size: 14px; margin: 0; }
  textarea {
    width: 100%;
    height: 45vh;
    font-size: 16px;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 8px;
    resize: vertical;
    background: #ffffff !important;
    color: #111111 !important;
  }
  .buttons { margin-top: 12px; display: flex; gap: 8px; }
  button {
    flex: 1;
    padding: 12px;
    font-size: 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    background: #dddddd;
    color: #333333;
  }
  .primary { background: #111111; color: #ffffff; }
  .secondary { background: #dddddd; color: #333333; }
</style>
</head>
<body style="background:#ffffff;color:#111111;min-height:100vh;">
<h2>Publix Agent</h2>
<p>Paste, type, or dictate your list. Edit as much as you want. Nothing happens until you tap Parse &amp; Preview.</p>
<textarea id="list" placeholder="e.g. bananas, eggs, whole milk..."></textarea>
<div class="buttons">
  <button class="secondary" id="cancelBtn">Cancel</button>
  <button class="primary" id="parseBtn">Parse &amp; Preview</button>
</div>
</body>
</html>`;

  const wv = new WebView();
  await wv.loadHTML(html);

  // Pre-paint guard in case styles are delayed
  await wv.evaluateJavaScript(
    "document.documentElement.style.backgroundColor='#fff';document.documentElement.style.color='#111';document.body.style.backgroundColor='#fff';document.body.style.color='#111';",
    false
  );

  // Wire handlers and guard against swipe-to-dismiss
  const pending = wv.evaluateJavaScript(`
    function wire() {
      document.getElementById('parseBtn').addEventListener('click', function() {
        completion(document.getElementById('list').value);
      });
      document.getElementById('cancelBtn').addEventListener('click', function() {
        completion('__CANCEL__');
      });
      window.addEventListener('pagehide', function() { completion('__CANCEL__'); });
      window.addEventListener('unload', function() { completion('__CANCEL__'); });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', wire);
    } else {
      wire();
    }
  `, true);

  const presented = wv.present(true);
  const result = await Promise.race([pending, presented.then(() => "__CANCEL__")]);

  // Ensure the WebView closes so alerts can surface
  try { await wv.dismiss(); } catch (_) { }

  if (typeof result === "string") return result;
  return "__CANCEL__";
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
