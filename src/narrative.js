const NARRATIVE_COMMENTARY_PATTERNS = [
  "this covers",
  "you can",
  "what you are not",
  "skip:",
  "optional:",
  "check label",
  "we are fully operational",
];

/**
 * Count sentences in text using punctuation heuristic.
 * @param {string} text
 * @returns {number}
 */
function countSentences(text) {
  const matches = text.match(/[.!?]\s/g);
  let count = matches ? matches.length : 0;
  if (text.trim().endsWith(".")) count += 1;
  return count;
}

/**
 * Determine if the input looks like a narrative (prose/messy) vs a clean list.
 * @param {string} text
 * @returns {boolean}
 */
function looksLikeNarrative(text) {
  // Empty or whitespace
  if (!text || !text.trim()) return true;

  const lower = text.toLowerCase();

  // Contains commentary patterns
  if (NARRATIVE_COMMENTARY_PATTERNS.some((p) => lower.includes(p))) return true;

  const len = text.length;
  const sentences = countSentences(text);
  const newlineCount = (text.match(/\n/g) || []).length;

  // Single paragraph (no newlines) with multiple sentences is almost certainly prose
  if (newlineCount === 0 && sentences >= 2) return true;

  // Single paragraph over 80 chars with no structure — likely dictated or pasted prose
  if (newlineCount === 0 && len > 80) return true;

  // Long text with multiple sentences
  if (len > 500 && sentences >= 3) return true;

  // Few newlines but long text
  if (newlineCount < 3 && len > 220) return true;

  return false;
}

module.exports = { looksLikeNarrative };
