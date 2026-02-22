// url.js — build Instacart and Publix search URLs
// Pure functions, no side effects.

const CONFIG = require("./config");

/**
 * Build an Instacart Publix search URL for the given item.
 * @param {string} item
 * @returns {string}
 */
function instacartUrl(item) {
  return CONFIG.instacartBase + encodeURIComponent(item.trim());
}

/**
 * Build a Publix website search URL for the given item.
 * @param {string} item
 * @returns {string}
 */
function publixUrl(item) {
  return CONFIG.publixBase + encodeURIComponent(item.trim());
}

module.exports = { instacartUrl, publixUrl };
