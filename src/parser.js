const { CONFIG } = require("./config");

const COMMENTARY_PATTERNS = [
  "covers",
  "instantly",
  "cook",
  "check label",
  "calm, cohesive",
  "fully operational",
];

const NON_GROCERY_PATTERNS = [
  /round toilet/i,
  /elongated/i,
];

const EXCLUDE_TRIGGER_PATTERNS = [
  /not buying/i,
  /\bskip\b/i,
];

const INCLUDE_TRIGGER_PATTERNS = [
  /^(produce|bakery|dairy|meat|seafood|deli|snacks?|beverages?|frozen|pantry|breakfast|lunch|dinner|breakfasts?|lunches?|dinners?)$/i,
];

/**
 * Normalize a single line: collapse whitespace, convert en-dash to hyphen.
 * @param {string} s
 * @returns {string}
 */
function normalizeLine(s) {
  return s
    .replace(/\u2013/g, "-") // en-dash → hyphen
    .replace(/\t/g, " ")     // tabs → spaces
    .replace(/ {2,}/g, " ")  // multi-space → single
    .trim();
}

/**
 * Strip leading prefixes like "- ", "grab:", "optional:", "* ", etc.
 * @param {string} s
 * @returns {string}
 */
function stripPrefixes(s) {
  return s
    .replace(/^[-*•◦·∙]\s*/, "")
    .replace(/^(grab|optional|buy|get|need|also need|oh and|maybe)[:]\s*/i, "")
    .replace(/^(grab|optional|buy|get|need|also need|oh and|maybe)\s+/i, "")
    .trim();
}

/**
 * Determine if a line looks like a section header.
 * @param {string} s
 * @returns {boolean}
 */
function isProbablyHeaderLine(s) {
  if (!s) return false;
  // Ends with colon
  if (s.endsWith(":")) return true;
  // All caps word (like "PRODUCE")
  if (/^[A-Z][A-Z\s]+$/.test(s.trim())) return true;
  return false;
}

/**
 * Split raw text into candidate lines.
 * @param {string} text
 * @returns {string[]}
 */
function splitIntoCandidateLines(text) {
  // Replace bullet glyphs with newline-dash
  let t = text
    .replace(/[•◦·∙]/g, "\n-")
    .replace(/⸻/g, "\n")
    .replace(/;/g, ",");
  return t.split(/\n/).map(normalizeLine).filter(Boolean);
}

/**
 * Extract grocery items from free-form text using rule-based heuristics.
 * @param {string} text
 * @returns {string[]}
 */
function ruleBasedExtract(text) {
  if (!text || !text.trim()) return [];

  const lines = splitIntoCandidateLines(text);
  const results = [];
  const seen = new Set();
  let mode = "include";

  for (const line of lines) {
    // Determine if this is a header/mode-switching line
    if (isProbablyHeaderLine(line)) {
      const lower = line.toLowerCase();
      if (EXCLUDE_TRIGGER_PATTERNS.some((p) => p.test(lower))) {
        mode = "exclude";
      } else if (INCLUDE_TRIGGER_PATTERNS.some((p) => p.test(lower.replace(/:$/, "").trim()))) {
        mode = "include";
      }
      // Always skip header lines themselves
      continue;
    }

    // Skip lines ending with colon (sub-headers without matching pattern)
    if (line.endsWith(":")) continue;

    // Skip inline "Skip ..." directives (e.g., "Skip the paper towels we have those")
    if (/^skip\b/i.test(line)) continue;

    // Skip commentary lines
    const lowerLine = line.toLowerCase();
    if (COMMENTARY_PATTERNS.some((p) => lowerLine.includes(p))) continue;

    // Strip leading prefixes
    let stripped = stripPrefixes(line);

    // Skip empty after stripping
    if (!stripped) continue;

    // Split on commas and " and "
    const parts = stripped.split(/,\s*|\s+and\s+/i);

    for (let part of parts) {
      // Strip parentheticals
      part = part.replace(/\(.*?\)/g, "").trim();

      // Skip if under 3 characters
      if (part.length < 3) continue;

      // Skip in exclude mode
      if (mode === "exclude") continue;

      // Skip non-grocery items
      if (NON_GROCERY_PATTERNS.some((p) => p.test(part))) continue;

      // Deduplicate (case-insensitive, preserve first occurrence)
      const key = part.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      results.push(part);

      // Cap at MAX_ITEMS
      if (results.length >= CONFIG.MAX_ITEMS) return results;
    }
  }

  return results;
}

module.exports = {
  ruleBasedExtract,
  normalizeLine,
  splitIntoCandidateLines,
  stripPrefixes,
  isProbablyHeaderLine,
};
