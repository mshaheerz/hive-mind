**Test Plan – Project Level: EASY**

| Test Type | File | Goal | Key Assertions |
|-----------|------|------|----------------|
| Unit | `tests/modals.test.js` | Verify that `openModal`/`closeModal` exist and toggle the `active` class on a modal element. | • `openModal` and `closeModal` are functions.<br>• `openModal` adds `active` class.<br>• `closeModal` removes `active` class.<br>• Calling with an unknown id leaves DOM unchanged. |
| Unit | `tests/tabs.test.js` | Verify that `switchTab` exists and updates the active tab. | • `switchTab` is a function.<br>• Calls add/remove `active` on the target tab.<br>• Non‑existent tab id is ignored. |
| Unit | `tests/main.test.js` | Verify that `init` attaches click listeners to navigation links. | • `init` is a function.<br>• After calling `init`, each `<nav a>` has a click listener.<br>• Clicking a link calls the corresponding modal or tab function. |
| Edge | `tests/modals.test.js` | Verify graceful handling of missing modal elements. | • No exception thrown when modal id not found. |
| Security | `tests/main.test.js` | Verify that no global variables are leaked. | • Only the expected global functions are exposed. |

---

### Test Files

> **NOTE**  
> These tests assume the project uses vanilla ES‑modules and that the scripts export their main functions (`openModal`, `closeModal`, `switchTab`, `init`).  
> The tests run in a Node environment with **jsdom** to simulate the browser DOM.

---

#### File: `tests/runTests.js`

```js
// runTests.js – entry point for the test suite
const { runTests } = require('./testRunner');

runTests([
  require('./modals.test.js'),
  require('./tabs.test.js'),
  require('./main.test.js')
]).then(() => {
  console.log('All tests passed ✅');
}).catch(err => {
  console.error('Test failures detected:', err);
  process.exit(1);
});
```

---

#### File: `tests/testRunner.js`

```js
// testRunner.js – minimal test harness
const { JSDOM } = require('jsdom');
const assert = require('assert');

async function runTests(testModules) {
  // Prepare a fresh DOM for each test module
  for (const testModule of testModules) {
    const dom = new JSDOM(`<!DOCTYPE html><body></body>`, { runScripts: "outside-only" });
    const { window } = dom;
    global.window = window;
    global.document = window.document;
    global.HTMLElement = window.HTMLElement;

    // Load the module under test
    await testModule();

    // Clean up global namespace
    delete global.window;
    delete global.document;
    delete global.HTMLElement;
  }
}

module.exports = { runTests };
```

---

#### File: `tests/modals.test.js`

```js
// tests/modals.test.js
const assert = require('assert');

module.exports = async () => {
  // Dynamically import the module (assumes ES‑module export)
  const modals = await import('../../scripts/modals.js');

  // 1️⃣ Existence
  assert.strictEqual(typeof modals.openModal, 'function', 'openModal should be a function');
  assert.strictEqual(typeof modals.closeModal, 'function', 'closeModal should be a function');

  // 2️⃣ Setup DOM elements
  const modal = document.createElement('div');
  modal.id = 'test-modal';
  modal.classList.add('modal');
  document.body.appendChild(modal);

  // 3️⃣ openModal adds 'active'
  modals.openModal('test-modal');
  assert.ok(modal.classList.contains('active'), 'openModal should add active class');

  // 4️⃣ closeModal removes 'active'
  modals.closeModal('test-modal');
  assert.ok(!modal.classList.contains('active'), 'closeModal should remove active class');

  // 5️⃣ Edge – unknown id does nothing
  const beforeClassList = Array.from(modal.classList);
  modals.openModal('nonexistent-id');
  assert.deepStrictEqual(Array.from(modal.classList), beforeClassList, 'openModal with bad id should not modify classes');
};
```

---

#### File: `tests/tabs.test.js`

```js
// tests/tabs.test.js
const assert = require('assert');

module.exports = async () => {
  const tabs = await import('../../scripts/tabs.js');

  assert.strictEqual(typeof tabs.switchTab, 'function', 'switchTab should be a function');

  // Create three tab elements
  const tab1 = document.createElement('div'); tab1.id = 'tab-1'; tab1.classList.add('tab');
  const tab2 = document.createElement('div'); tab2.id = 'tab-2'; tab2.classList.add('tab');
  const tab3 = document.createElement('div'); tab3.id = 'tab-3'; tab3.classList.add('tab');
  document.body.append(tab1, tab2, tab3);

  // Initially activate tab-1
  tabs.switchTab('tab-1');
  assert.ok(tab1.classList.contains('active'), 'tab-1 should be active');
  assert.ok(!tab2.classList.contains('active'), 'tab-2 should not be active');
  assert.ok(!tab3.classList.contains('active'), 'tab-3 should not be active');

  // Switch to tab-3
  tabs.switchTab('tab-3');
  assert.ok(tab3.classList.contains('active'), 'tab-3 should be active after switch');
  assert.ok(!tab1.classList.contains('active'), 'tab-1 should no longer be active');
  assert.ok(!tab2.classList.contains('active'), 'tab-2 should remain inactive');

  // Edge – unknown id does nothing
  const beforeClasses = Array.from(tab1.classList);
  tabs.switchTab('missing-tab');
  assert.deepStrictEqual(Array.from(tab1.classList), beforeClasses, 'switchTab with bad id should not alter classes');
};
```

---

#### File: `tests/main.test.js`

```js
// tests/main.test.js
const assert = require('assert');

module.exports = async () => {
  const main = await import('../../scripts/main.js');

  assert.strictEqual(typeof main.init, 'function', 'init should be a function');

  // Mock navigation links
  const navLink = document.createElement('a');
  navLink.href = '#';
  navLink.dataset.target = 'test-modal';
  navLink.textContent = 'Open Modal';
  document.body.appendChild(navLink);

  // Spy on modal functions
  const modals = await import('../../scripts/modals.js');
  const openSpy = jest.fn();
  const closeSpy = jest.fn();
  const originalOpen = modals.openModal;
  const originalClose = modals.closeModal;
  modals.openModal = openSpy;
  modals.closeModal = closeSpy;

  // 1️⃣ init should attach click listener
  main.init();
  const event = new window.Event('click');
  navLink.dispatchEvent(event);
  assert.ok(openSpy.calledWith('test-modal'), 'click should trigger openModal with correct id');

  // Clean up
  modals.openModal = originalOpen;
  modals.closeModal = originalClose;
  document.body.removeChild(navLink);
};
```

> **Security Check** – After running the above tests, run a quick lint to ensure no unexpected globals:
> ```js
> const globals = Object.keys(global);
> const allowed = ['console', 'require', 'module', 'process', 'assert', 'jest'];
> globals.forEach(g => {
>   if (!allowed.includes(g)) throw new Error(`Unexpected global ${g}`);
> });
> ```

---

### Test Command

```bash
# Install dependencies (jsdom + jest for spies)
npm install --save-dev jsdom jest

# Run the test harness
node tests/runTests.js
```

---

### Expected Result

All assertions should pass, producing:

```
All tests passed ✅
```

If any test fails, the console will output a descriptive error message indicating the failed assertion.

---

### Failure Action Items

1. **Missing/Incorrect Export** – If a module does not export the expected function, add an export statement or adjust the test to match the actual API.
2. **DOM Manipulation Errors** – Verify that modal/tab elements exist in the HTML and that the scripts correctly query them.
3. **Event Listener Issues** – Ensure `init()` correctly attaches listeners and that the listeners call the right functions.
4. **Security** – If unexpected globals appear, review the module code to eliminate accidental global assignments.

---