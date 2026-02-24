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
 * @returns {Promise<{text: string, wv: WebView, presented: Promise}>}
 *   text — the entered text, or "__CANCEL__" if cancelled.
 *   wv — the WebView instance (still presented unless user tapped native Close).
 *   presented — the present() promise, resolves when WebView is closed.
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

  // Return the WebView and its present() promise so callers can reuse
  // the same modal for the checklist instead of stacking a second one
  // on top (which causes a double-tap-to-exit bug on iOS).
  const text = typeof result === "string" ? result : "__CANCEL__";
  return { text: text, wv: wv, presented: presented };
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
      // Open Instacart search inside a Scriptable WebView to keep
      // the user in-app. Uses a clean URL (no cache-buster or extra
      // params that can confuse Instacart's SPA router).
      // Falls back to Safari if the WebView fails.
      try {
        const searchWv = new WebView();
        const q = encodeURIComponent(items[i]);
        const searchUrl = `https://www.instacart.com/store/publix/search?q=${q}`;
        await searchWv.loadURL(searchUrl);

        // After initial page load, inject a redirect guard.
        // If a login flow stripped the search query from the URL,
        // re-navigate to the search URL once the user is logged in.
        await searchWv.evaluateJavaScript(`
          (function() {
            var target = '${searchUrl.replace(/'/g, "\\'")}';
            var tid = setInterval(function() {
              var p = new URLSearchParams(window.location.search);
              var onSearch = window.location.pathname.indexOf('/search') !== -1;
              if (onSearch && !p.get('q')) {
                clearInterval(tid);
                window.location.replace(target);
              }
            }, 800);
            setTimeout(function() { clearInterval(tid); }, 30000);
          })();
        `, false);

        await searchWv.present(true);
      } catch (_) {
        Safari.open(publixSearchUrl(items[i]));
      }
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
      rows += `<label class="row"><input type="checkbox"><span>${escapeHtml(item)}</span></label>\n`;
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
  body { padding: 16px 16px 120px 16px; }
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
    padding: 12px 24px 46px 24px;
    background: #ffffff; border-top: 1px solid #ddd;
    display: flex; justify-content: center;
    transition: transform 0.4s ease, opacity 0.3s ease;
  }
  .done-bar.slide-out {
    transform: translateY(100%); opacity: 0;
    pointer-events: none;
  }
  .done-bar button {
    width: 80%; max-width: 340px;
    padding: 14px; font-size: 17px; font-weight: 600;
    border: none; border-radius: 12px;
    background: #111; color: #fff; cursor: pointer;
    transition: background 0.2s, transform 0.1s;
  }
  .done-bar button:active { transform: scale(0.97); }
  .done-bar button.flash {
    background: #34c759; color: #fff;
    animation: flash-pulse 0.6s ease;
  }
  .close-hint {
    display: none; text-align: center;
    padding: 24px 16px; margin: 8px 0 16px 0;
    background: #f0f9f0; border-radius: 12px;
  }
  .close-hint.show { display: block; }
  .close-hint .hint-icon { font-size: 36px; margin-bottom: 8px; }
  .close-hint .hint-text { font-size: 16px; color: #333; line-height: 1.4; }
  .close-hint .hint-close { color: #007aff; font-weight: 600; }
  @keyframes flash-pulse {
    0%,100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  @keyframes confetti-0 {
    0% { opacity:1; transform: translateY(0) rotate(0deg); }
    100% { opacity:0; transform: translateY(-75vh) rotate(540deg); }
  }
  @keyframes confetti-1 {
    0% { opacity:1; transform: translateY(0) rotate(0deg); }
    100% { opacity:0; transform: translateY(-60vh) rotate(-480deg); }
  }
  @keyframes confetti-2 {
    0% { opacity:1; transform: translateY(0) rotate(0deg); }
    100% { opacity:0; transform: translateY(-85vh) rotate(720deg); }
  }
</style>
</head>
<body style="background:#ffffff;color:#111111;">
<h2 id="heading">Shopping List</h2>
<div class="counter" id="counter">0 of ${total} items in cart</div>
<div class="close-hint" id="closeHint"><div class="hint-icon">🎉</div><div class="hint-text">All done! Tap <span class="hint-close">Close</span> in the top-left to finish.</div></div>
${rows}
<div class="done-bar">
  <button id="doneBtn">Done Shopping</button>
</div>

</body>
</html>`;
}

/**
 * Show the in-store shopping checklist as a fullscreen WebView.
 * If an existing WebView is provided (from the editor), its content is
 * replaced with the checklist — keeping a single modal in iOS's view
 * controller stack so one Close tap returns to Scriptable home.
 * @param {string[]} items
 * @param {WebView} [existingWv] — editor WebView to reuse
 * @param {Promise} [existingPresented] — editor's present() promise
 * @returns {Promise<void>}
 */
async function showBuildMyList(items, existingWv, existingPresented) {
  const html = buildChecklistHTML(items);
  const wv = existingWv || new WebView();
  await wv.loadHTML(html);

  // Pre-paint guard
  await wv.evaluateJavaScript(
    "document.documentElement.style.backgroundColor='#fff';document.body.style.backgroundColor='#fff';",
    false
  );

  // Wire ALL interactivity with evaluateJavaScript(code, false).
  // No completion() needed — the checklist doesn't return data.
  // The native Close button handles dismissal (present() resolves).
  // The Done button provides visual confirmation and a future hook.
  await wv.evaluateJavaScript(`
    (function() {
      var total = document.querySelectorAll('input[type=checkbox]').length;

      function updateCount() {
        var boxes = document.querySelectorAll('input[type=checkbox]');
        var checked = 0;
        boxes.forEach(function(cb) {
          var row = cb.parentElement;
          if (cb.checked) { row.classList.add('checked'); checked++; }
          else { row.classList.remove('checked'); }
        });
        document.getElementById('counter').textContent = checked + ' of ' + total + ' items in cart';
      }

      document.addEventListener('change', function(e) {
        if (e.target && e.target.type === 'checkbox') updateCount();
      });

      function launchConfetti() {
        var colors = ['#34c759','#ff9500','#007aff','#ff2d55','#af52de','#ffcc00'];
        var wrap = document.createElement('div');
        wrap.style.cssText = 'position:fixed;bottom:60px;left:0;width:100%;height:0;pointer-events:none;z-index:9999;';
        document.body.appendChild(wrap);
        for (var i = 0; i < 35; i++) {
          var sz = 6 + Math.random() * 6;
          var lft = 10 + Math.random() * 80;
          var dur = (0.8 + Math.random() * 0.8).toFixed(2);
          var del = (Math.random() * 0.3).toFixed(2);
          var p = document.createElement('div');
          p.style.cssText = 'position:absolute;bottom:0;left:' + lft + '%;width:' + sz + 'px;height:' + sz + 'px;background:' + colors[i % colors.length] + ';border-radius:' + (i%2===0?'50%':'2px') + ';animation:confetti-' + (i%3) + ' ' + dur + 's ' + del + 's ease-out forwards;';
          wrap.appendChild(p);
        }
        setTimeout(function() { wrap.remove(); }, 2500);
      }

      document.getElementById('doneBtn').addEventListener('click', function() {
        var btn = document.getElementById('doneBtn');
        if (btn.disabled) return;
        btn.disabled = true;
        btn.textContent = 'Complete! 🎉';
        btn.classList.add('flash');
        launchConfetti();
        setTimeout(function() {
          document.querySelector('.done-bar').classList.add('slide-out');
          document.getElementById('heading').textContent = 'Shopping Complete';
          document.getElementById('closeHint').classList.add('show');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1200);
      });
    })();
  `, false);

  // Wait for the user to close the WebView.
  // If reusing the editor's WebView, its original present() promise is
  // still pending and will resolve when Close is tapped. Otherwise
  // present a new fullscreen WebView.
  if (existingPresented) {
    await existingPresented;
  } else {
    await wv.present(true);
  }
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
