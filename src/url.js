const { CONFIG } = require("./config");

/**
 * Build an Instacart/Publix search URL for a grocery item.
 * @param {string} item
 * @returns {string}
 */
function publixSearchUrl(item) {
  return `https://www.instacart.com/store/${CONFIG.STORE_SLUG}/search?query=${encodeURIComponent(item).replace(/'/g, "%27")}`;
}

module.exports = { publixSearchUrl };
