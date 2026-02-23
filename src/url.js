const { CONFIG } = require("./config");

/**
 * Build an Instacart/Publix search URL for a grocery item.
 * @param {string} item
 * @returns {string}
 */
function publixSearchUrl(item) {
  const cacheBust = Date.now();
  const encoded = encodeURIComponent(item).replace(/%20/g, "+").replace(/'/g, "%27");
  return `https://www.instacart.com/store/${CONFIG.STORE_SLUG}/search?q=${encoded}&page=1&ts=${cacheBust}&app_redirect=false`;
}

module.exports = { publixSearchUrl };
