const CONFIG = {
  ENABLE_GPT_FALLBACK: true,
  OPENAI_API_KEY: "OPENAI_API_KEY_HERE",
  OPENAI_MODEL: "gpt-4.1-mini",
  OPENAI_ENDPOINT: "https://api.openai.com/v1/responses",
  STORE_SLUG: "publix",
  MAX_ITEMS: 80,
};

function ensureApiKey() {
  if (typeof Keychain !== "undefined") {
    if (Keychain.contains("OPENAI_API_KEY")) {
      CONFIG.OPENAI_API_KEY = Keychain.get("OPENAI_API_KEY");
    }
  }
}

module.exports = { CONFIG, ensureApiKey };
