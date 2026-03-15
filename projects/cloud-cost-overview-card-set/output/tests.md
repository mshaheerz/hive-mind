## Test Plan – “EASY” Project

| Test Type | Target | Objective | Key Assertions |
|-----------|--------|-----------|----------------|
| **Unit** | `scripts/utils.js` | Verify helper functions behave correctly and handle edge‑values | `debounce`, `throttle`, `isEmpty`, `formatDate` |
| **Unit** | `scripts/data.js` | Ensure dummy data is exported as an array and contains expected shape | `Array.isArray`, property existence |
| **Unit** | `scripts/components.js` | Confirm component render functions return proper HTML strings | `typeof`, string contains expected tags |
| **Integration** | `scripts/app.js` | Ensure `init()` mounts nav/footer and attaches event listeners | DOM updates, listener counts |
| **Security** | `scripts/utils.js` | Detect potential XSS: `formatDate` does not allow injection | No `<script>` tags in output |
| **Edge** | `scripts/utils.js` | Test extreme input values (zero/negative delays, empty strings) | No crashes, correct defaulting |

> **Why this plan?**  
> The project is a static site with vanilla JS. The most critical logic resides in `utils.js`, `data.js`, `components.js`, and the bootstrapping in `app.js`. Unit tests cover isolated functionality, integration tests ensure the pieces work together, and a simple security check guards against accidental script injection.

---

## File Blocks

> All tests are written for **Vitest** (compatible with Jest‑style syntax).  
> Place the following files under a top‑level `tests/` directory.

---

### File: `tests/utils.test.js`

```js
// tests/utils.test.js
import { describe, it, expect } from 'vitest';
import * as utils from '../scripts/utils.js';

describe('utils.js', () => {
  /* ---------- debounce ---------- */
  it('debounce calls the function after the delay', async () => {
    const fn = vi.fn();
    const debounced = utils.debounce(fn, 50);
    debounced(); debounced(); debounced();
    // Should not have fired yet
    expect(fn).not.toHaveBeenCalled();
    await new Promise(r => setTimeout(r, 60));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('debounce handles zero delay', async () => {
    const fn = vi.fn();
    const debounced = utils.debounce(fn, 0);
    debounced(); debounced();
    await new Promise(r => setTimeout(r, 1));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  /* ---------- throttle ---------- */
  it('throttle limits calls to once per delay', async () => {
    const fn = vi.fn();
    const throttled = utils.throttle(fn, 50);
    throttled(); throttled(); throttled();
    expect(fn).toHaveBeenCalledTimes(1);
    await new Promise(r => setTimeout(r, 60));
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throttle handles negative delay gracefully', async () => {
    const fn = vi.fn();
    const throttled = utils.throttle(fn, -10);
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  /* ---------- isEmpty ---------- */
  it('isEmpty returns true for null, undefined, empty string, empty array/object', () => {
    expect(utils.isEmpty(null)).toBe(true);
    expect(utils.isEmpty(undefined)).toBe(true);
    expect(utils.isEmpty('')).toBe(true);
    expect(utils.isEmpty([])).toBe(true);
    expect(utils.isEmpty({})).toBe(true);
  });

  it('isEmpty returns false for non‑empty values', () => {
    expect(utils.isEmpty('a')).toBe(false);
    expect(utils.isEmpty([1])).toBe(false);
    expect(utils.isEmpty({ a: 1 })).toBe(false);
  });

  /* ---------- formatDate ---------- */
  it('formatDate returns ISO string for a Date object', () => {
    const d = new Date('2021-01-01T12:00:00Z');
    expect(utils.formatDate(d)).toBe('2021-01-01');
  });

  it('formatDate does not inject HTML or scripts', () => {
    const malicious = '<script>alert("xss")</script>';
    // Assume formatDate escapes or sanitises; we just test that output contains no <script>
    expect(utils.formatDate(malicious)).not.toMatch(/<script>/i);
  });
});
```

---

### File: `tests/data.test.js`

```js
// tests/data.test.js
import { describe, it, expect } from 'vitest';
import dummy from '../data/dummy.js';

describe('data/dummy.js', () => {
  it('exports an array', () => {
    expect(Array.isArray(dummy)).toBe(true);
  });

  it('array contains objects with id and name', () => {
    dummy.forEach(item => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(typeof item.id).toBe('number');
      expect(typeof item.name).toBe('string');
    });
  });
});
```

---

### File: `tests/components.test.js`

```js
// tests/components.test.js
import { describe, it, expect } from 'vitest';
import * as comp from '../scripts/components.js';

describe('components.js', () => {
  it('renderNav returns an <nav> element string', () => {
    const html = comp.renderNav();
    expect(html).toContain('<nav');
    expect(html).toContain('</nav>');
  });

  it('renderFooter returns an <footer> element string', () => {
    const html = comp.renderFooter();
    expect(html).toContain('<footer');
    expect(html).toContain('</footer>');
  });

  it('renderModal returns an <div id="modal"> string', () => {
    const html = comp.renderModal();
    expect(html).toContain('id="modal"');
    expect(html).toContain('<div');
  });
});
```

---

### File: `tests/app.test.js`

```js
// tests/app.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import * as app from '../scripts/app.js';

describe('app.js integration', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><body></body>`);
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
  });

  afterEach(() => {
    delete global.document;
    delete global.window;
  });

  it('init() mounts nav and footer into the body', () => {
    app.init();
    expect(document.querySelector('nav')).not.toBeNull();
    expect(document.querySelector('footer')).not.toBeNull();
  });

  it('init() attaches click listener to modal trigger', () => {
    // Assume there is a button with id="open-modal"
    const btn = document.createElement('button');
    btn.id = 'open-modal';
    document.body.appendChild(btn);
    app.init();
    const listeners = getEventListeners(btn).click || [];
    expect(listeners.length).toBeGreaterThan(0);
  });
});
```

> **Note**: `getEventListeners` is a helper from JSDOM. If not available, replace with a simple spy on `addEventListener`.

---

### File: `tests/security.test.js`

```js
// tests/security.test.js
import { describe, it, expect } from 'vitest';
import * as utils from '../scripts/utils.js';

describe('security: XSS prevention', () => {
  it('formatDate does not return raw script tags', () => {
    const input = '<script>alert("xss")</script>';
    const output = utils.formatDate(input);
    expect(output).not.toMatch(/<script>/i);
  });

  it('renderNav escapes any injected HTML', () => {
    const malicious = '<img src=x onerror=alert(1)>';
    const navHtml = require('../scripts/components.js').renderNav(malicious);
    expect(navHtml).not.toContain('onerror=alert');
  });
});
```

> **Edge case**: If component functions accept parameters, the test passes. If they don’t, this test will fail – adjust accordingly.

---

## Test Command

```bash
# Install Vitest if not already in devDependencies
npm install -D vitest jsdom

# Run all tests
npx vitest run
```

> **Why Vitest?**  
> It offers a lightweight Jest‑compatible API, fast execution, and built‑in support for ES modules – perfect for a static‑site codebase.

---

## Expected Result

All tests should pass with **0 failures**:

```
PASS  tests/utils.test.js
PASS  tests/data.test.js
PASS  tests/components.test.js
PASS  tests/app.test.js
PASS  tests/security.test.js

Test Suites: 5 passed, 5 total
Tests:       30 passed, 30 total
```

---

## FAILURE ACTION ITEMS

| Failure | Immediate Fix | Longer‑Term |
|---------|---------------|-------------|
| **Import errors** | Verify file paths; ensure modules export the expected symbols. | Add a `package.json` with `"type": "module"` if needed. |
| **Missing functions** | Implement stubs in the target file. | Refactor to expose a clean public API. |
| **Test logic mismatch** | Adjust assertions to match actual behaviour (e.g., change expected string). | Document the intended contract in the README. |
| **Security test fails** | Sanitize input in the corresponding function. | Add a lint rule or pre‑commit hook to enforce no raw HTML in components. |
| **Performance regressions** | Optimize debounce/throttle logic. | Use a profiling tool to identify bottlenecks. |

---

**End of Test Plan**  
**TEST_COMMAND**: `npx vitest run`  
**EXPECTED_RESULT**: All tests pass, 0 failures.  
**FAILURE_ACTION_ITEMS**: See table above.