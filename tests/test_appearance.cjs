const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "static", "appearance.js"), "utf8");

function createPage(saved = null) {
  const items = {};
  function element(value) {
    return {
      value, checked: false, disabled: false, textContent: "", files: [],
      classList: {toggle() {}},
      listeners: {},
      addEventListener(type, handler) { this.listeners[type] = handler; },
      dispatch(type) { this.listeners[type](); }
    };
  }
  for (const value of ["sage", "ocean", "rose", "midnight"]) items[`theme:${value}`] = element(value);
  for (const value of ["plain", "gradient", "image"]) items[`background:${value}`] = element(value);
  for (const id of ["background-image", "appearance-status", "remove-image"]) items[id] = element("");
  const properties = {};
  const document = {
    documentElement: {dataset: {}, style: {setProperty(key, value) { properties[key] = value; }}},
    getElementById(id) { return items[id]; },
    querySelector(selector) {
      const match = selector.match(/name="(theme|background)"\]\[value="([^"]+)"/);
      return items[`${match[1]}:${match[2]}`];
    },
    querySelectorAll(selector) {
      const name = selector.includes('"theme"') ? "theme" : "background";
      return Object.entries(items).filter(([key]) => key.startsWith(`${name}:`)).map(([, item]) => item);
    }
  };
  const storage = {
    value: saved,
    fail: false,
    getItem() { return this.value; },
    setItem(key, value) {
      if (this.fail) throw new Error("storage full");
      this.value = value;
    }
  };
  vm.runInNewContext(source, {document, localStorage: storage, FileReader: class {}, Image: class {}});
  return {document, items, storage, properties};
}

test("theme and background persist for a new page", () => {
  const page = createPage();
  page.items["theme:ocean"].dispatch("change");
  page.items["background:gradient"].dispatch("change");
  const restored = createPage(page.storage.value);
  assert.equal(restored.document.documentElement.dataset.theme, "ocean");
  assert.equal(restored.document.documentElement.dataset.background, "gradient");
  assert.equal(restored.items["theme:ocean"].checked, true);
});

test("invalid saved image is never applied", () => {
  const page = createPage(JSON.stringify({theme: "rose", background: "image", image: "https://example.com/image.png"}));
  assert.equal(page.document.documentElement.dataset.theme, "rose");
  assert.equal(page.document.documentElement.dataset.background, "plain");
  assert.equal(page.properties["--custom-background"], "none");
  assert.equal(page.items["background:image"].disabled, true);
});

test("storage failure preserves the current theme and reports an error", () => {
  const page = createPage();
  page.storage.fail = true;
  page.items["theme:midnight"].dispatch("change");
  assert.equal(page.document.documentElement.dataset.theme, "sage");
  assert.match(page.items["appearance-status"].textContent, /Could not save/);
});

test("oversized images are rejected without changing the background", () => {
  const page = createPage();
  page.items["background-image"].files = [{type: "image/png", size: 1024 * 1024 + 1}];
  page.items["background-image"].dispatch("change");
  assert.equal(page.document.documentElement.dataset.background, "plain");
  assert.match(page.items["appearance-status"].textContent, /no larger than 1 MB/);
});
