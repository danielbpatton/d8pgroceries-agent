const { publixSearchUrl } = require("./url");
const { groupByAisle } = require("./aisles");

/**
 * Show a mode selector: Build My List (in-store) or Order Delivery.
 * @returns {Promise<string|null>} "build" | "delivery" | null (cancelled)
 */
async function showModeAlert() {
  const alert = new Alert();
  alert.title = "How are you shopping?";
  alert.message = "Build My List creates an in-store checklist sorted by aisle.\nOrder Delivery searches Instacart for each item.";
  alert.addAction("Build My List");
  alert.addAction("Order Delivery");
  alert.addCancelAction("Cancel");
  const choice = await alert.present();
  if (choice === -1) return null;
  return choice === 0 ? "build" : "delivery";
}

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
    alert.addAction("Search on Instacart");
    alert.addAction("Skip");
    alert.addCancelAction("Done Shopping");
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

/**
 * Escape HTML entities for safe rendering.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Build an Apple-styled checklist HTML page grouped by aisle.
 * @param {string[]} items
 * @returns {string} HTML string
 */
function buildChecklistHTML(items) {
  const grouped = groupByAisle(items);
  const total = items.length;

  let rows = "";
  for (const group of grouped) {
    rows += `<div class="section-header">${escapeHtml(group.section)}</div>\n`;
    for (const item of group.items) {
      rows += `<label class="row"><input type="checkbox" onchange="updateCount()"><span>${escapeHtml(item)}</span></label>\n`;
    }
  }

  return `<!DOCTYPE html>
<html style="background:#ffffff;min-height:100vh;">
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: #ffffff !important;
    color: #111111 !important;
    font-family: -apple-system, sans-serif;
    min-height: 100vh;
  }
  body { padding: 16px 16px 100px 16px; }
  h2 { margin-bottom: 4px; }
  .counter {
    color: #34c759; font-weight: 600; font-size: 15px;
    margin-bottom: 16px;
  }
  .section-header {
    font-weight: 700; font-size: 13px;
    text-transform: uppercase; letter-spacing: 0.5px;
    color: #888; margin: 20px 0 6px 0;
    border-bottom: 1px solid #eee; padding-bottom: 4px;
  }
  .row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 0; border-bottom: 1px solid #f2f2f2;
    font-size: 17px; cursor: pointer;
  }
  .row input[type="checkbox"] {
    width: 22px; height: 22px;
    accent-color: #34c759; flex-shrink: 0;
  }
  .row.checked span {
    text-decoration: line-through; color: #aaa;
  }
  .done-bar {
    position: fixed; bottom: 0; left: 0; right: 0;
    padding: 12px 16px;
    background: #ffffff; border-top: 1px solid #ddd;
    display: flex; justify-content: center;
  }
  .done-bar button {
    width: 100%; max-width: 400px;
    padding: 14px; font-size: 17px; font-weight: 600;
    border: none; border-radius: 12px;
    background: #111; color: #fff; cursor: pointer;
  }
</style>
</head>
<body style="background:#ffffff;color:#111111;">
<h2>Shopping List</h2>
<div class="counter" id="counter">0 of ${total} items in cart</div>
${rows}
<div class="done-bar">
  <button onclick="completion('done')">Done Shopping</button>
</div>
<script>
function updateCount() {
  var boxes = document.querySelectorAll('input[type=checkbox]');
  var checked = 0;
  boxes.forEach(function(cb) {
    var row = cb.parentElement;
    if (cb.checked) { row.classList.add('checked'); checked++; }
    else { row.classList.remove('checked'); }
  });
  document.getElementById('counter').textContent = checked + ' of ' + ${total} + ' items in cart';
}
</script>
</body>
</html>`;
}

/**
 * Show the in-store shopping checklist as a fullscreen WebView.
 * @param {string[]} items
 * @returns {Promise<void>}
 */
async function showBuildMyList(items) {
  const html = buildChecklistHTML(items);
  const wv = new WebView();
  await wv.loadHTML(html);

  // Pre-paint guard
  await wv.evaluateJavaScript(
    "document.documentElement.style.backgroundColor='#fff';document.body.style.backgroundColor='#fff';",
    false
  );

  const pending = wv.evaluateJavaScript(`
    // completion is already wired via the Done Shopping button onclick
    window.addEventListener('pagehide', function() { completion('done'); });
    window.addEventListener('unload', function() { completion('done'); });
  `, true);

  const presented = wv.present(true);
  await Promise.race([pending, presented.then(() => "done")]);
  try { await wv.dismiss(); } catch (_) { }
}

module.exports = {
  showModeAlert,
  getUserTextViaEditor,
  previewAndConfirm,
  shoppingLoop,
  finalizeScreen,
  escapeHtml,
  buildChecklistHTML,
  showBuildMyList
};
