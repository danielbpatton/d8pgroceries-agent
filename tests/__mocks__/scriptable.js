class MockAlert {
  constructor() {
    this.title = "";
    this.message = "";
    this.actions = [];
    this.cancelAction = null;
    this.textFields = [];
    this._presentResult = 0;
  }
  addAction(label) { this.actions.push(label); }
  addCancelAction(label) { this.cancelAction = label; }
  addTextField(placeholder, text) { this.textFields.push({ placeholder, text }); }
  textFieldValue(index) { return this.textFields[index]?.text || ""; }
  async present() { return this._presentResult; }
}

class MockWebView {
  constructor() {
    this._html = null;
    this._presentResult = null;
  }
  async loadHTML(html) { this._html = html; }
  async present(fullscreen) { return this._presentResult; }
}

class MockSafari {
  static open(url) { MockSafari._lastUrl = url; }
}
MockSafari._lastUrl = null;

class MockRequest {
  constructor(url) {
    this.url = url;
    this.method = "GET";
    this.headers = {};
    this.body = null;
    this._jsonResult = null;
  }
  async loadJSON() { return this._jsonResult; }
}

class MockKeychain {
  constructor() { this._store = {}; }
  get(key) { return this._store[key] || null; }
  set(key, value) { this._store[key] = value; }
  contains(key) { return Object.prototype.hasOwnProperty.call(this._store, key); }
}

module.exports = { MockAlert, MockWebView, MockSafari, MockRequest, MockKeychain };
