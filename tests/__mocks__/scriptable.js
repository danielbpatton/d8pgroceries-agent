// tests/__mocks__/scriptable.js
// Stub implementations of Scriptable global classes for use in Jest tests.

class Alert {
  constructor() {
    this.title = "";
    this.message = "";
    this._actions = [];
    this._cancelAction = null;
    this._textFields = [];
    this._presentResult = 0;
  }
  addAction(label) { this._actions.push(label); }
  addCancelAction(label) { this._cancelAction = label; }
  addTextField(placeholder, text) {
    this._textFields.push({ placeholder, text: text || "" });
  }
  textFieldValue(index) {
    return this._textFields[index] ? this._textFields[index].text : "";
  }
  // Override in tests: alertInstance._presentResult = <index>
  async present() { return this._presentResult; }
}

class WebView {
  constructor() {
    this._html = "";
  }
  async loadHTML(html) { this._html = html; }
  async present() {}
}

class Safari {
  static open(url) { Safari._lastUrl = url; }
}
Safari._lastUrl = null;

class Request {
  constructor(url) {
    this.url = url;
    this.method = "GET";
    this.headers = {};
    this.body = null;
    this._mockResponse = null;
  }
  async loadJSON() {
    if (this._mockResponse !== null) return this._mockResponse;
    throw new Error("No mock response configured for Request");
  }
}

class Keychain {
  static get(key) { return Keychain._store[key] || null; }
  static set(key, value) { Keychain._store[key] = value; }
  static contains(key) { return key in Keychain._store; }
  static _reset() { Keychain._store = {}; }
}
Keychain._store = {};

// Expose as globals so modules that reference them without require() work in tests
global.Alert = Alert;
global.WebView = WebView;
global.Safari = Safari;
global.Request = Request;
global.Keychain = Keychain;

module.exports = { Alert, WebView, Safari, Request, Keychain };
