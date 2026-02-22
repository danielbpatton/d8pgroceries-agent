// parser.js — pure rule-based grocery list extraction
// No side effects, no globals. Safe to require in Node tests.

/**
 * Split raw input text into individual candidate lines.
 * Handles newlines, comma-separated values, and common list separators.
 * @param {string} text
 * @returns {string[]}
 */
function splitLines(text) {
  return text
    .split(/[\n;]+/)
    .flatMap(line => line.split(/,(?!\s*\d)/)) // split on commas unless followed by a digit (e.g. "1,000")
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Remove leading list markers, quantity prefixes, and trailing notes.
 * Returns a clean item name.
 * @param {string} line
 * @returns {string}
 */
function cleanItem(line) {
  return line
    .replace(/^[\s\-*•◦▪▸►]+/, "")  // leading bullet/dash
    .replace(/^\d+[\.\)]\s*/, "")    // numbered list: "1. " or "1) "
    .replace(/^\d+\s+(x\s+)?/i, "")  // leading quantities: "2 " or "2 x "
    .replace(/\s*\(.*?\)\s*$/, "")   // trailing parenthetical notes
    .replace(/\s*[-–—].*$/, "")      // trailing dash-note: "milk – 2%"
    .trim();
}

/**
 * Decide whether a line looks like a real grocery item (vs. a section header,
 * blank, or meta-annotation).
 * @param {string} line
 * @returns {boolean}
 */
function isItemLine(line) {
  if (!line || line.length < 2) return false;
  // Section headers are typically ALL CAPS or end with a colon
  if (/^[A-Z\s]{4,}:?\s*$/.test(line)) return false;
  if (/:\s*$/.test(line)) return false;
  // Ignore lines that are purely numeric
  if (/^\d+$/.test(line)) return false;
  return true;
}

/**
 * Parse a raw grocery list string into an array of clean item names.
 * @param {string} text
 * @returns {string[]}
 */
function parseList(text) {
  return splitLines(text)
    .map(cleanItem)
    .filter(isItemLine);
}

module.exports = { splitLines, cleanItem, isItemLine, parseList };
