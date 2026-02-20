const fs = require("fs");
const path = require("path");

const FILE_ORDER = ["config.js", "parser.js", "narrative.js", "url.js", "gpt.js", "ui.js", "main.js"];
const SRC_DIR = path.join(__dirname, "..", "src");
const DIST_DIR = path.join(__dirname, "..", "dist");
const OUT_FILE = path.join(DIST_DIR, "publix-agent.js");

function stripModuleBoilerplate(code) {
  return code
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      // Remove require(...) lines
      if (/^const\s+.*=\s*require\(/.test(trimmed)) return false;
      if (/^require\(/.test(trimmed)) return false;
      // Remove module.exports lines
      if (/^module\.exports\s*=/.test(trimmed)) return false;
      return true;
    })
    .join("\n");
}

const parts = FILE_ORDER.map((filename) => {
  const fullPath = path.join(SRC_DIR, filename);
  const raw = fs.readFileSync(fullPath, "utf8");
  return `// --- ${filename} ---\n${stripModuleBoilerplate(raw)}`;
});

const combined = parts.join("\n\n");

const header = `// d8pgroceries-agent v1.0.0 — Paste into Scriptable on iPhone\n// Built: ${new Date().toISOString()}\n`;
const wrapped = `${header}(async () => {\n${combined}\n})();\n`;

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

fs.writeFileSync(OUT_FILE, wrapped, "utf8");
console.log(`Bundle written to ${OUT_FILE} (${wrapped.length} bytes)`);
