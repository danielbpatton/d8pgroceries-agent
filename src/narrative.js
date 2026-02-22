// narrative.js — heuristic: is this text messy enough to need GPT?
// Pure functions, no side effects.

const NARRATIVE_CONNECTORS = [
  "i need", "we need", "can you get", "pick up", "don't forget",
  "also get", "and also", "need to get", "grab", "please get",
  "make sure", "while you're there", "while you are there"
];

/**
 * Return true if the text appears to be a narrative / prose grocery request
 * rather than a clean line-by-line or bulleted list.
 * @param {string} text
 * @returns {boolean}
 */
function isNarrative(text) {
  if (!text || text.trim().length === 0) return false;

  const trimmed = text.trim();
  const lines = trimmed.split(/\n/).filter(l => l.trim().length > 0);

  // Single very long line with no bullets and multiple food-list connectors
  if (lines.length === 1 && trimmed.length > 60) return true;

  // Contains narrative connectors
  const lower = trimmed.toLowerCase();
  for (const phrase of NARRATIVE_CONNECTORS) {
    if (lower.includes(phrase)) return true;
  }

  // Majority of lines are very long (paragraph-like)
  const longLines = lines.filter(l => l.trim().length > 80);
  if (longLines.length > 0 && longLines.length >= lines.length / 2) return true;

  // No bullets, no numbers, and multiple comma-separated items on same line
  const hasBullets = /^[\s\-*•◦▪▸►\d]/m.test(trimmed);
  const commaLines = lines.filter(l => (l.match(/,/g) || []).length >= 2);
  if (!hasBullets && commaLines.length > 0) return true;

  return false;
}

module.exports = { isNarrative };
