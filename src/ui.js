// ui.js — Scriptable UI layer
// Uses Scriptable globals: Alert, WebView, Safari.
// Not testable in Node — lint only.

/* global Alert, WebView, Safari */

const { groupByAisle } = require("./aisles");
const { instacartUrl } = require("./url");

/**
 * Show an alert asking the user which mode they want.
 * Returns "build" or "delivery".
 * @returns {Promise<"build"|"delivery">}
 */
async function showModeAlert() {
  const alert = new Alert();
  alert.title = "Grocery List";
  alert.message = "What would you like to do?";
  alert.addAction("Build My List");
  alert.addAction("Order Delivery");
  alert.addCancelAction("Cancel");
  const idx = await alert.present();
  if (idx === 0) return "build";
  if (idx === 1) return "delivery";
  return null; // cancelled
}

/**
 * Show a multi-line text editor pre-filled with defaultText.
 * Returns the edited text, or null if cancelled.
 * @param {string} [defaultText]
 * @returns {Promise<string|null>}
 */
async function showTextEditor(defaultText) {
  const alert = new Alert();
  alert.title = "Enter Grocery List";
  alert.message = "Paste or type your list. One item per line, or just type naturally.";
  alert.addTextField("e.g. milk, eggs, bread...", defaultText || "");
  alert.addAction("Done");
  alert.addCancelAction("Cancel");
  const idx = await alert.present();
  if (idx === -1) return null;
  return alert.textFieldValue(0);
}

/**
 * Show a preview of the parsed items. Returns true if user confirms, false to re-edit.
 * @param {string[]} items
 * @returns {Promise<boolean>}
 */
async function showPreview(items) {
  const alert = new Alert();
  alert.title = "Your Items (" + items.length + ")";
  alert.message = items.map((item, i) => (i + 1) + ". " + item).join("\n");
  alert.addAction("Continue");
  alert.addCancelAction("Edit Again");
  const idx = await alert.present();
  return idx === 0;
}

/**
 * Build the HTML checklist page for "Build My List" mode.
 * Groups items by Publix aisle/section and renders checkboxes.
 * @param {string[]} items
 * @returns {string} HTML string
 */
function buildChecklistHTML(items) {
  const groups = groupByAisle(items);

  const sectionHTML = groups.map(({ section, items: sectionItems }) => {
    const itemRows = sectionItems.map(item => {
      const id = "item-" + item.replace(/[^a-zA-Z0-9]/g, "-");
      return (
        '<label class="item" for="' + id + '">' +
        '<input type="checkbox" id="' + id + '" />' +
        '<span>' + escapeHtml(item) + "</span>" +
        "</label>"
      );
    }).join("\n");

    return (
      '<section>' +
      '<h2>' + escapeHtml(section) + "</h2>" +
      '<div class="items">' + itemRows + "</div>" +
      "</section>"
    );
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>My Grocery List</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, sans-serif;
    background: #f5f5f7;
    color: #1c1c1e;
    padding: 16px;
  }
  h1 {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 16px;
    color: #007aff;
  }
  section {
    background: #fff;
    border-radius: 12px;
    margin-bottom: 16px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  h2 {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #6e6e73;
    padding: 10px 16px 6px;
    background: #f5f5f7;
    border-bottom: 1px solid #e5e5ea;
  }
  .items { padding: 4px 0; }
  .item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f2f2f7;
    cursor: pointer;
    gap: 12px;
  }
  .item:last-child { border-bottom: none; }
  .item input[type="checkbox"] {
    width: 22px;
    height: 22px;
    accent-color: #34c759;
    cursor: pointer;
    flex-shrink: 0;
  }
  .item span {
    font-size: 17px;
    line-height: 1.3;
    transition: color 0.15s, text-decoration 0.15s;
  }
  .item input:checked + span {
    color: #8e8e93;
    text-decoration: line-through;
  }
  .summary {
    text-align: center;
    padding: 12px;
    font-size: 14px;
    color: #6e6e73;
    margin-bottom: 8px;
  }
</style>
</head>
<body>
<h1>🛒 My Grocery List</h1>
<p class="summary" id="summary"></p>
${sectionHTML}
<script>
  function updateSummary() {
    var total = document.querySelectorAll('input[type="checkbox"]').length;
    var checked = document.querySelectorAll('input[type="checkbox"]:checked').length;
    document.getElementById('summary').textContent = checked + ' of ' + total + ' items in cart';
  }
  document.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
    cb.addEventListener('change', updateSummary);
  });
  updateSummary();
</script>
</body>
</html>`;
}

/**
 * Escape HTML special characters to prevent XSS in generated HTML.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Show the "Build My List" grouped checklist in a full-screen WebView.
 * The user checks off items as they add them to their physical cart.
 * @param {string[]} items
 * @returns {Promise<void>}
 */
async function showBuildMyList(items) {
  const html = buildChecklistHTML(items);
  const wv = new WebView();
  await wv.loadHTML(html);
  await wv.present(true); // full screen
}

/**
 * Walk the user through searching each item on Instacart one at a time.
 * After each item, prompt Continue / Skip / Done.
 * @param {string[]} items
 * @returns {Promise<void>}
 */
async function runShoppingLoop(items) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const alert = new Alert();
    alert.title = "Item " + (i + 1) + " of " + items.length;
    alert.message = item;
    alert.addAction("Search on Instacart");
    alert.addAction("Skip");
    alert.addCancelAction("Done Shopping");
    const idx = await alert.present();
    if (idx === -1) break; // Done Shopping
    if (idx === 0) {
      Safari.open(instacartUrl(item));
    }
    // idx === 1 means Skip — continue to next item
  }
}

module.exports = {
  showModeAlert,
  showTextEditor,
  showPreview,
  buildChecklistHTML,
  escapeHtml,
  showBuildMyList,
  runShoppingLoop
};
