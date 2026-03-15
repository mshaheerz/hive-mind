**Test Plan – Project “EASY”**

| Test Type | Target | Purpose | Key Scenarios |
|-----------|--------|---------|---------------|
| **Unit** | `scripts/utils.js` | Verify pure functions work for normal and edge inputs | `debounce`, `throttle`, `formatDate`, `deepClone` with `null`, `undefined`, circular objects |
| **Unit** | `scripts/data.js` | Confirm data fetching logic returns the expected shape | `fetchData` with mocked `fetch` (200, 404, network error) |
| **Unit** | `scripts/components.js` | Ensure component factories return correct DOM nodes | `createModal`, `createNav` – check attributes, children |
| **Integration** | `index.html` + JS bundle | Validate page loads, components render, navigation works | JSDOM loads `index.html`, clicking a nav link changes `main` content |
| **Security** | `scripts/utils.js` | Ensure no XSS vectors escape sanitization | `sanitize` (if present) or `innerHTML` usage with malicious string |
| **Edge** | All unit tests | Test extreme/invalid inputs | `undefined`, `null`, empty string, circular reference |

---

### 1. `tests/utils.test.js`

```js
// File: tests/utils.test.js
import { describe, it, expect } from 'vitest';
import { debounce, throttle, formatDate, deepClone } from '../scripts/utils.js';

describe('utils.js – debounce', () => {
  it('calls the function only once within the delay', async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);
    debounced(); debounced(); debounced();
    await new Promise(r => setTimeout(r, 60));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes arguments to the original function', async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 20);
    debounced(1, 2);
    await new Promise(r => setTimeout(r, 30));
    expect(fn).toHaveBeenCalledWith(1, 2);
  });
});

describe('utils.js – throttle', () => {
  it('calls the function at most once per delay', async () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 50);
    throttled(); throttled(); throttled();
    await new Promise(r => setTimeout(r, 60));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('utils.js – formatDate', () => {
  it('formats ISO string to DD/MM/YYYY', () => {
    const result = formatDate('2023-07-15T12:00:00Z');
    expect(result).toBe('15/07/2023');
  });

  it('returns empty string for invalid input', () => {
    expect(formatDate('not-a-date')).toBe('');
  });
});

describe('utils.js – deepClone', () => {
  it('clones plain objects', () => {
    const obj = { a: 1, b: { c: 2 } };
    const copy = deepClone(obj);
    expect(copy).toEqual(obj);
    expect(copy).not.toBe(obj);
    expect(copy.b).not.toBe(obj.b);
  });

  it('handles null and undefined', () => {
    expect(deepClone(null)).toBeNull();
    expect(deepClone(undefined)).toBeUndefined();
  });

  it('throws on circular references', () => {
    const a = {};
    a.self = a;
    expect(() => deepClone(a)).toThrow();
  });
});
```

---

### 2. `tests/data.test.js`

```js
// File: tests/data.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchData } from '../scripts/data.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('data.js – fetchData', () => {
  it('returns JSON data on 200 response', async () => {
    const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({ id: 1 }) };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const data = await fetchData('/api/item/1');
    expect(data).toEqual({ id: 1 });
    expect(fetch).toHaveBeenCalledWith('/api/item/1');
  });

  it('throws for non‑OK status', async () => {
    const mockResponse = { ok: false, status: 404, statusText: 'Not Found' };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    await expect(fetchData('/api/item/999')).rejects.toThrow('404 Not Found');
  });

  it('throws on network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(fetchData('/api/item')).rejects.toThrow('Network error');
  });
});
```

---

### 3. `tests/components.test.js`

```js
// File: tests/components.test.js
import { describe, it, expect } from 'vitest';
import { createModal, createNav } from '../scripts/components.js';

describe('components.js – createModal', () => {
  it('creates a modal element with correct structure', () => {
    const modal = createModal('Test Title', '<p>Content</p>');
    expect(modal).toBeInstanceOf(Element);
    expect(modal.classList.contains('modal')).toBe(true);
    expect(modal.querySelector('.modal-title').textContent).toBe('Test Title');
    expect(modal.querySelector('.modal-body').innerHTML).toBe('<p>Content</p>');
  });
});

describe('components.js – createNav', () => {
  it('creates a navigation bar with links', () => {
    const nav = createNav([
      { href: '#', label: 'Home' },
      { href: '#about', label: 'About' }
    ]);
    expect(nav).toBeInstanceOf(Element);
    expect(nav.querySelectorAll('a')).toHaveLength(2);
    expect(nav.querySelector('a[href="#about"]').textContent).toBe('About');
  });
});
```

---

### 4. `tests/app.test.js`

```js
// File: tests/app.test.js
import { describe, it, expect, vi } from 'vitest';
import { initApp } from '../scripts/app.js';

describe('app.js – initApp', () => {
  it('attaches click listeners to nav links', () => {
    const fakeEvent = { preventDefault: vi.fn() };
    const navLink = document.createElement('a');
    navLink.href = '#';
    navLink.addEventListener = vi.fn();
    document.body.appendChild(navLink);

    initApp(); // should register listeners

    expect(navLink.addEventListener).toHaveBeenCalledWith(
      'click',
      expect.any(Function)
    );
  });
});
```

---

### 5. `tests/integration.test.js`

```js
// File: tests/integration.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Integration – index.html', () => {
  let dom, window, document;

  beforeAll(() => {
    const html = require('fs').readFileSync(
      `${__dirname}/../index.html`,
      'utf8'
    );
    dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
    window = dom.window;
    document = window.document;
  });

  afterAll(() => {
    dom.window.close();
  });

  it('renders the navigation component', () => {
    const nav = document.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav.querySelectorAll('a')).toHaveLength(3); // e.g., Home, About, Settings
  });

  it('changes main content when a nav link is clicked', async () => {
    const aboutLink = document.querySelector('a[href="#about"]');
    const main = document.querySelector('main');
    const clickEvent = new window.Event('click', { bubbles: true, cancelable: true });
    aboutLink.dispatchEvent(clickEvent);

    // wait for any async content loading
    await new Promise(r => setTimeout(r, 50));

    expect(main.textContent).toContain('About'); // simple check
  });
});
```

---

### 6. `tests/security.test.js`

```js
// File: tests/security.test.js
import { describe, it, expect } from 'vitest';
import { sanitize } from '../scripts/utils.js';

describe('utils.js – sanitize', () => {
  it('removes script tags from user input', () => {
    const malicious = '<img src=x onerror=alert(1) /><script>alert(2)</script>';
    const clean = sanitize(malicious);
    expect(clean).not.toMatch(/<script>/);
    expect(clean).toMatch(/<img/);
    expect(clean).not.toMatch(/onerror=/);
  });

  it('returns empty string for null/undefined', () => {
    expect(sanitize(null)).toBe('');
    expect(sanitize(undefined)).toBe('');
  });
});
```

> *If `sanitize` does not exist, the test will fail and highlight the need for a sanitization helper.*

---

## Test Command

```bash
# Install Vitest if not already present
npm install -D vitest jsdom

# Run all tests
npx vitest run
```

> **Expected Result**  
> All test suites should finish with **PASS** status.  
> Console output similar to:

```
 PASS  tests/utils.test.js
 PASS  tests/data.test.js
 PASS  tests/components.test.js
 PASS  tests/app.test.js
 PASS  tests/integration.test.js
 PASS  tests/security.test.js

 Test Suites: 6 passed, 6 total
 Tests:       34 passed, 34 total
```

---

## Failure Action Items

| Failure Type | Immediate Action | Long‑Term Fix |
|--------------|------------------|---------------|
| **Unit test fails** | Inspect the specific assertion, check function implementation and inputs. | Refactor the function to handle edge cases, add missing error handling. |
| **Integration test fails** | Verify that the DOM is loaded correctly; check that script loading order is correct. | Adjust bundler config or add `defer`/`async` attributes. |
| **Security test fails** | Confirm that user‑supplied strings are sanitized before `innerHTML` usage. | Implement or update a proper sanitization library (e.g., DOMPurify). |
| **Mock fetch errors** | Ensure `global.fetch` is mocked correctly; check for async/await misuse. | Use `msw` or similar for robust request mocking. |
| **Test environment errors** | Ensure JSDOM is configured with `runScripts: 'dangerously'` and `resources: 'usable'`. | Update test setup or use a real browser environment with Playwright. |

---