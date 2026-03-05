**File: `.gitignore`**
```gitignore
.DS_Store
*.log
.env
.env.local

node_modules/
dist/
build/
__pycache__/
*.pyc
```

---

**File: `styles/variables.css`**
```css
/* ---------- CSS Custom Properties (Theme) ---------- */
:root {
  /* Color palette */
  --color-primary: #0066ff;
  --color-primary-dark: #004fbf;
  --color-success: #28a745;
  --color-warning: #ffc107;
  --color-danger: #dc3545;
  --color-background: #f8f9fa;
  --color-surface: #ffffff;
  --color-text: #212529;
  --color-muted: #6c757d;
  --color-border: #dee2e6;

  /* Dark theme overrides */
  --color-background-dark: #212529;
  --color-surface-dark: #2c2f33;
  --color-text-dark: #f8f9fa;
  --color-muted-dark: #adb5bd;
  --color-border-dark: #444c56;

  /* Spacing */
  --space-0: 0;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 1rem;
  --space-4: 1.5rem;
  --space-5: 3rem;

  /* Typography */
  --font-sans: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-sm: 0.875rem;
  --line-height-base: 1.5;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Transitions */
  --transition-fast: 0.2s ease;
  --transition-medium: 0.3s ease;
}

/* Dark mode (toggled via .dark class on <html>) */
html.dark {
  --color-background: var(--color-background-dark);
  --color-surface: var(--color-surface-dark);
  --color-text: var(--color-text-dark);
  --color-muted: var(--color-muted-dark);
  --color-border: var(--color-border-dark);
}
```

---

**File: `styles/reset.css`**
```css
/* ---------- Simple CSS Reset ---------- */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html,
body {
  height: 100%;
}
body {
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  background-color: var(--color-background);
  color: var(--color-text);
}
img,
svg,
picture,
video {
  max-width: 100%;
  display: block;
}
a {
  color: inherit;
  text-decoration: none;
}
button,
input,
select,
textarea {
  font: inherit;
}
ul,
ol {
  list-style: none;
}
```

---

**File: `styles/layout.css`**
```css
/* ---------- Layout (Grid / Flex) ---------- */
.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-3) 0;
}

/* Header / Footer */
header,
footer {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-3) 0;
}

/* Main content area */
main {
  min-height: calc(100vh - 160px); /* Approx header+footer */
}

/* Responsive Grid for cards */
.grid {
  display: grid;
  gap: var(--space-4);
}
.grid-2 {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
.grid-3 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* Flex utilities */
.flex {
  display: flex;
}
.flex-center {
  align-items: center;
  justify-content: center;
}
.flex-between {
  align-items: center;
  justify-content: space-between;
}

/* Mobile nav toggle */
@media (max-width: 768px) {
  .nav-links {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--color-surface);
    flex-direction: column;
    display: none;
  }
  .nav-links.open {
    display: flex;
  }
}
```

---

**File: `styles/components.css`**
```css
/* ---------- Reusable Components ---------- */

/* Navigation */
.main-nav {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-2) var(--space-3);
}
.main-nav .nav-brand {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 1.25rem;
}
.main-nav .nav-brand svg {
  width: 24px;
  height: 24px;
  margin-right: var(--space-2);
  fill: var(--color-primary);
}
.main-nav .nav-links {
  display: flex;
  gap: var(--space-3);
}
.main-nav .nav-link {
  color: var(--color-muted);
  position: relative;
  padding: var(--space-1) var(--space-2);
}
.main-nav .nav-link.active,
.main-nav .nav-link:hover {
  color: var(--color-primary);
}
.main-nav .nav-link.active::after {
  content: "";
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
}
.main-nav .nav-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
}
@media (max-width: 768px) {
  .main-nav .nav-toggle {
    display: block;
  }
}

/* Footer */
.main-footer {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: var(--space-4) 0;
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}
.main-footer .footer-links {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

/* Cards */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: transform var(--transition-fast);
}
.card:hover {
  transform: translateY(-2px);
}

/* Stat Cards */
.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.stat-card svg {
  width: 32px;
  height: 32px;
  fill: var(--color-primary);
}
.stat-card .value {
  font-size: 1.5rem;
  font-weight: 600;
}

/* Buttons */
.btn {
  display: inline-block;
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  transition: background var(--transition-fast);
}
.btn-primary {
  background: var(--color-primary);
  color: #fff;
}
.btn-primary:hover {
  background: var(--color-primary-dark);
}
.btn-outline {
  background: transparent;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
}
.btn-outline:hover {
  background: var(--color-primary);
  color: #fff;
}

/* Badges */
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
}
.badge-success { background: var(--color-success); color: #fff; }
.badge-warning { background: var(--color-warning); color: #212529; }
.badge-danger  { background: var(--color-danger);  color: #fff; }

/* Table */
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th,
.table td {
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}
.table th[data-sort] {
  cursor: pointer;
  user-select: none;
}
.table th[data-sort]::after {
  content: "⇅";
  margin-left: var(--space-1);
  font-size: 0.75rem;
  color: var(--color-muted);
}
.table th.asc::after { content: "↑"; }
.table th.desc::after { content: "↓"; }

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal.open {
  display: flex;
}
.modal .modal-content {
  background: var(--color-surface);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  max-width: 500px;
  width: 90%;
  position: relative;
}
.modal .close-btn {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
}

/* Tabs */
.tabs {
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-3);
}
.tabs .tab {
  display: inline-block;
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
}
.tabs .tab.active {
  border-bottom: 2px solid var(--color-primary);
  font-weight: 600;
}

/* Toast */
.toast {
  position: fixed;
  bottom: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-success);
  color: #fff;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  opacity: 0;
  transition: opacity var(--transition-medium);
  z-index: 2000;
}
.toast.show { opacity: 1; }
.toast.toast-danger { background: var(--color-danger); }

/* Accordion */
.accordion-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
}
.accordion-header {
  padding: var(--space-2);
  background: var(--color-surface);
  cursor: pointer;
}
.accordion-body {
  padding: var(--space-2);
  display: none;
}
.accordion-body.open {
  display: block;
}

/* Toggle Switch */
.toggle {
  position: relative;
  width: 44px;
  height: 24px;
}
.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle .slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--color-muted);
  transition: var(--transition-fast);
  border-radius: 34px;
}
.toggle .slider::before {
  content: "";
  position: absolute;
  height: 20px; width: 20px;
  left: 2px;
  bottom: 2px;
  background: #fff;
  transition: var(--transition-fast);
  border-radius: 50%;
}
.toggle input:checked + .slider {
  background: var(--color-primary);
}
.toggle input:checked + .slider::before {
  transform: translateX(20px);
}
```

---

**File: `styles/pages.css`**
```css
/* ---------- Page‑specific tweaks ---------- */

/* Home (index.html) */
.home-stats {
  margin-bottom: var(--space-5);
}

/* Dashboard */
.dashboard-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.dashboard-filters input,
.dashboard-filters select {
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

/* Settings */
.settings-section {
  margin-bottom: var(--space-5);
}
.settings-section h2 {
  margin-bottom: var(--space-2);
}

/* About */
.faq .accordion-header {
  font-weight: 500;
}
```

---

**File: `styles/utilities.css`**
```css
/* ---------- Utility Classes ---------- */
.mt-1 { margin-top: var(--space-1); }
.mt-2 { margin-top: var(--space-2); }
.mt-3 { margin-top: var(--space-3); }
.mb-1 { margin-bottom: var(--space-1); }
.mb-2 { margin-bottom: var(--space-2); }
.mb-3 { margin-bottom: var(--space-3); }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-muted { color: var(--color-muted); }
.d-none { display: none; }
.d-block { display: block; }
```

---

**File: `components/nav.html`**
```html
<nav class="main-nav">
  <div class="container flex flex-between">
    <div class="nav-brand">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 12l2-2v7h14v-7l2 2V5H3v7z"/>
      </svg>
      <span>Acme Dashboard</span>
    </div>
    <button class="nav-toggle" aria-label="Toggle menu">☰</button>
    <ul class="nav-links flex">
      <li><a href="/index.html" class="nav-link">Home</a></li>
      <li><a href="/pages/dashboard.html" class="nav-link">Dashboard</a></li>
      <li><a href="/pages/details.html" class="nav-link">Details</a></li>
      <li><a href="/pages/settings.html" class="nav-link">Settings</a></li>
      <li><a href="/pages/about.html" class="nav-link">About</a></li>
    </ul>
  </div>
</nav>
```

---

**File: `components/footer.html`**
```html
<footer class="main-footer">
  <div class="container flex flex-between">
    <div>&copy; 2026 Acme Corp.</div>
    <div class="footer-links">
      <a href="/pages/about.html">About</a>
      <a href="/pages/settings.html">Settings</a>
      <a href="https://github.com">GitHub</a>
    </div>
  </div>
</footer>
```

---

**File: `components/modal.html`**
```html
<div id="generic-modal" class="modal" role="dialog" aria-modal="true">
  <div class="modal-content">
    <button class="close-btn" aria-label="Close modal" onclick="closeModal('generic-modal')">&times;</button>
    <h2 class="modal-title">Modal Title</h2>
    <div class="modal-body">
      <!-- Dynamic content injected by JS -->
    </div>
    <div class="modal-footer mt-3">
      <button class="btn btn-outline" onclick="closeModal('generic-modal')">Cancel</button>
      <button class="btn btn-primary" id="modal-confirm-btn">Confirm</button>
    </div>
  </div>
</div>
```

---

**File: `components/tabs.html`**
```html
<div class="tabs" role="tablist">
  <div class="tab active" data-tab="overview">Overview</div>
  <div class="tab" data-tab="history">History</div>
  <div class="tab" data-tab="config">Config</div>
</div>
<div class="tab-panels">
  <div class="tab-panel active" data-panel="overview">
    <!-- Overview content -->
  </div>
  <div class="tab-panel" data-panel="history">
    <!-- History content -->
  </div>
  <div class="tab-panel" data-panel="config">
    <!-- Config content -->
  </div>
</div>
```

---

**File: `data/dummy.js`**
```javascript
/* Dummy data used across the site */
window.DUMMY_DATA = {
  users: [
    { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin", status: "active" },
    { id: 2, name: "Bob Smith", email: "bob@example.com", role: "Editor", status: "inactive" },
    { id: 3, name: "Carol White", email: "carol@example.com", role: "Viewer", status: "active" },
    { id: 4, name: "David Brown", email: "david@example.com", role: "Editor", status: "pending" },
    { id: 5, name: "Eve Davis", email: "eve@example.com", role: "Admin", status: "active" },
    { id: 6, name: "Frank Miller", email: "frank@example.com", role: "Viewer", status: "inactive" },
    { id: 7, name: "Grace Lee", email: "grace@example.com", role: "Editor", status: "active" },
    { id: 8, name: "Henry Wilson", email: "henry@example.com", role: "Viewer", status: "pending" },
    { id: 9, name: "Ivy Clark", email: "ivy@example.com", role: "Admin", status: "active" },
    { id: 10, name: "Jack Turner", email: "jack@example.com", role: "Editor", status: "active" }
  ],
  activities: [
    { time: "2026-03-01 09:12", action: "Logged in", user: "Alice Johnson" },
    { time: "2026-03-01 10:05", action: "Created a new project", user: "Bob Smith" },
    { time: "2026-03-01 11:30", action: "Updated settings", user: "Carol White" },
    { time: "2026-03-01 13:45", action: "Deleted a file", user: "David Brown" },
    { time: "2026-03-01 15:20", action: "Commented on ticket #42", user: "Eve Davis" }
  ],
  stats: {
    users: 124,
    activeSessions: 27,
    projects: 58,
    ticketsOpen: 13
  }
};
```

---

**File: `scripts/utils.js`**
```javascript
/* Utility helpers */

export function loadComponent(url) {
  return fetch(url).then(r => r.text());
}

/* Simple debounce for search inputs */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* Simple formatter */
export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}
```

---

**File: `scripts/components.js`**
```javascript
/* Interactive component logic */

import { debounce } from "./utils.js";

/* ----- Tabs ----- */
export function initTabs(container) {
  const tabs = container.querySelectorAll("[data-tab]");
  const panels = container.querySelectorAll("[data-panel]");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      const target = container.querySelector(`[data-panel="${tab.dataset.tab}"]`);
      if (target) target.classList.add("active");
    });
  });
}

/* ----- Modal ----- */
export function initModals() {
  document.querySelectorAll("[data-modal-open]").forEach(btn => {
    const targetId = btn.dataset.modalOpen;
    btn.addEventListener("click", () => openModal(targetId));
  });
  document.querySelectorAll(".modal .close-btn").forEach(btn => {
    const modal = btn.closest(".modal");
    btn.addEventListener("click", () => closeModal(modal.id));
  });
}
export function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
}
export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
}

/* ----- Toast ----- */
export function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ----- Sortable Table ----- */
export function initSortableTable(table) {
  const headers = table.querySelectorAll("th[data-sort]");
  headers.forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      const rows = Array.from(table.querySelectorAll("tbody tr"));
      const asc = !th.classList.toggle("asc");
      rows.sort((a, b) => {
        const aText = a.querySelector(`td[data-col="${key}"]`).textContent.trim();
        const bText = b.querySelector(`td[data-col="${key}"]`).textContent.trim();
        return asc
          ? aText.localeCompare(bText, undefined, { numeric: true })
          : bText.localeCompare(aText, undefined, { numeric: true });
      });
      // Reset other header states
      headers.forEach(h => {
        if (h !== th) h.classList.remove("asc", "desc");
      });
      th.classList.toggle("desc", !asc);
      const tbody = table.querySelector("tbody");
      rows.forEach(r => tbody.appendChild(r));
    });
  });
}

/* ----- Search / Filter ----- */
export function initSearch(inputSelector, tableSelector) {
  const input = document.querySelector(inputSelector);
  const table = document.querySelector(tableSelector);
  if (!input || !table) return;

  const rows = Array.from(table.querySelectorAll("tbody tr"));
  const filter = debounce(() => {
    const term = input.value.toLowerCase();
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(term) ? "" : "none";
    });
  }, 200);

  input.addEventListener("input", filter);
}

/* ----- Accordion ----- */
export function initAccordions() {
  document.querySelectorAll(".accordion-header").forEach(header => {
    header.addEventListener("click", () => {
      const body = header.nextElementSibling;
      body.classList.toggle("open");
    });
  });
}

/* ----- Form Validation ----- */
export function initFormValidation(formSelector) {
  const form = document.querySelector(formSelector);
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    const required = form.querySelectorAll("[required]");
    let valid = true;
    required.forEach(inp => {
      if (!inp.value.trim()) {
        valid = false;
        inp.classList.add("invalid");
        const err = document.createElement("div");
        err.className = "text-danger mt-1";
        err.textContent = "This field is required.";
        if (!inp.nextElementSibling?.classList.contains("text-danger")) {
          inp.parentNode.insertBefore(err, inp.nextSibling);
        }
      } else {
        inp.classList.remove("invalid");
        if (inp.nextElementSibling?.classList.contains("text-danger")) {
          inp.nextElementSibling.remove();
        }
      }
    });
    if (valid) {
      showToast("Settings saved successfully!", "success");
      form.reset();
    } else {
      showToast("Please fix the errors.", "danger");
    }
  });
}

/* ----- Theme Toggle ----- */
export function initThemeToggle(toggleSelector) {
  const toggle = document.querySelector(toggleSelector);
  if (!toggle) return;
  toggle.addEventListener("change", () => {
    document.documentElement.classList.toggle("dark", toggle.checked);
    localStorage.setItem("theme", toggle.checked ? "dark" : "light");
  });
  // Load saved preference
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    toggle.checked = true;
    document.documentElement.classList.add("dark");
  }
}
```

---

**File: `scripts/app.js`**
```javascript
/* Main application bootstrap */
import { loadComponent } from "./utils.js";
import {
  initTabs,
  initModals,
  initSortableTable,
  initSearch,
  initAccordions,
  initFormValidation,
  initThemeToggle,
  showToast
} from "./components.js";

/* Load shared components (nav & footer) */
async function loadShared() {
  const [navHTML, footerHTML] = await Promise.all([
    loadComponent("/components/nav.html"),
    loadComponent("/components/footer.html")
  ]);
  document.getElementById("nav-placeholder").innerHTML = navHTML;
  document.getElementById("footer-placeholder").innerHTML = footerHTML;

  // Nav active link logic
  document.querySelectorAll(".nav-link").forEach(link => {
    const href = link.getAttribute("href");
    if (location.pathname.endsWith(href) || (href === "/index.html" && location.pathname === "/")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Mobile nav toggle
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  navToggle?.addEventListener("click", () => navLinks.classList.toggle("open"));
}

/* Page‑specific initializations */
function initPage() {
  const pageId = document.body.dataset.page;

  // Theme toggle (present on every page)
  initThemeToggle("#theme-toggle");

  // Global modals
  initModals();

  // Page specific
  switch (pageId) {
    case "dashboard":
      initSortableTable(document.getElementById("users-table"));
      initSearch("#search-input", "#users-table");
      break;
    case "details":
      const tabsContainer = document.querySelector(".tabs");
      if (tabsContainer) initTabs(tabsContainer);
      break;
    case "settings":
      initFormValidation("#settings-form");
      break;
    case "about":
      initAccordions();
      break;
    default:
      // home page may have quick actions
      break;
  }
}

/* Entry point */
window.addEventListener("DOMContentLoaded", async () => {
  await loadShared();
  initPage();
});
```

---

**File: `index.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Acme Dashboard – Home</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/styles/reset.css">
  <link rel="stylesheet" href="/styles/variables.css">
  <link rel="stylesheet" href="/styles/layout.css">
  <link rel="stylesheet" href="/styles/components.css">
  <link rel="stylesheet" href="/styles/pages.css">
  <link rel="stylesheet" href="/styles/utilities.css">
</head>
<body data-page="home">
  <div id="nav-placeholder"></div>

  <main class="container">
    <section class="home-stats grid grid-3">
      <div class="card stat-card">
        <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        <div>
          <div class="value" id="stat-users">0</div>
          <div class="label">Total Users</div>
        </div>
      </div>
      <div class="card stat-card">
        <svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 8h14v-2H7v2zm0-4h14v-2H7v2zm0-6v2h14V7H7z"/></svg>
        <div>
          <div class="value" id="stat-sessions">0</div>
          <div class="label">Active Sessions</div>
        </div>
      </div>
      <div class="card stat-card">
        <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
        <div>
          <div class="value" id="stat-projects">0</div>
          <div class="label">Projects</div>
        </div>
      </div>
    </section>

    <section class="mt-4">
      <h2>Recent Activity</h2>
      <table class="table mt-2">
        <thead>
          <tr><th>Time</th><th>Action</th><th>User</th></tr>
        </thead>
        <tbody id="activity-body">
          <!-- Filled by JS -->
        </tbody>
      </table>
    </section>

    <section class="mt-4">
      <h2>Quick Actions</h2>
      <div class="flex gap-2 mt-2">
        <button class="btn btn-primary" data-modal-open="generic-modal">Create User</button>
        <button class="btn btn-outline">View Reports</button>
      </div>
    </section>

    <div class="mt-4 flex items-center">
      <label class="mr-2">Dark Mode</label>
      <label class="toggle">
        <input type="checkbox" id="theme-toggle">
        <span class="slider"></span>
      </label>
    </div>
  </main>

  <div id="footer-placeholder"></div>

  <!-- Shared modal -->
  <div id="generic-modal" class="modal" role="dialog" aria-modal="true">
    <div class="modal-content">
      <button class="close-btn" aria-label="Close modal" onclick="closeModal('generic-modal')">&times;</button>
      <h2 class="modal-title">Create New User</h2>
      <div class="modal-body">
        <form id="create-user-form">
          <div class="mb-2">
            <label>Name</label>
            <input type="text" required class="w-full p-2 border rounded">
          </div>
          <div class="mb-2">
            <label>Email</label>
            <input type="email" required class="w-full p-2 border rounded">
          </div>
        </form>
      </div>
      <div class="modal-footer mt-3">
        <button class="btn btn-outline" onclick="closeModal('generic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="showToast('User created (demo)', 'success')">Create</button>
      </div>
    </div>
  </div>

  <script type="module" src="/scripts/data.js"></script>
  <script type="module" src="/scripts/app.js"></script>
  <script type="module">
    // Populate home stats & activity list
    document.addEventListener('DOMContentLoaded', () => {
      const { stats, activities } = window.DUMMY_DATA;
      document.getElementById('stat-users').textContent = stats.users;
      document.getElementById('stat-sessions').textContent = stats.activeSessions;
      document.getElementById('stat-projects').textContent = stats.projects;

      const tbody = document.getElementById('activity-body');
      activities.forEach(act => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${act.time}</td><td>${act.action}</td><td>${act.user}</td>`;
        tbody.appendChild(tr);
      });
    });
  </script>
</body>
</html>
```

---

**File: `pages/dashboard.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Acme Dashboard – Users</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/styles/reset.css">
  <link rel="stylesheet" href="/styles/variables.css">
  <link rel="stylesheet" href="/styles/layout.css">
  <link rel="stylesheet" href="/styles/components.css">
  <link rel="stylesheet" href="/styles/pages.css">
  <link rel="stylesheet" href="/styles/utilities.css">
</head>
<body data-page="dashboard">
  <div id="nav-placeholder"></div>

  <main class="container">
    <h1 class="mt-3">User Management</h1>

    <section class="dashboard-filters mt-3">
      <input type="text" id="search-input" placeholder="Search users..." class="flex-1">
      <select id="role-filter">
        <option value="">All Roles</option>
        <option value="Admin">Admin</option>
        <option value="Editor">Editor</option>
        <option value="Viewer">Viewer</option>
      </select>
    </section>

    <section class="mt-3">
      <table class="table" id="users-table">
        <thead>
          <tr>
            <th data-sort="id">ID</th>
            <th data-sort="name">Name</th>
            <th data-sort="email">Email</th>
            <th data-sort="role">Role</th>
            <th data-sort="status">Status</th>
          </tr>
        </thead>
        <tbody id="users-body">
          <!-- Filled by JS -->
        </tbody>
      </table>
    </section>
  </main>

  <div id="footer-placeholder"></div>

  <script type="module" src="/scripts/data.js"></script>
  <script type="module" src="/scripts/app.js"></script>
  <script type="module">
    // Render user rows and add filter logic
    document.addEventListener('DOMContentLoaded', () => {
      const { users } = window.DUMMY_DATA;
      const tbody = document.getElementById('users-body');

      function renderRows(filterText = "", role = "") {
        tbody.innerHTML = "";
        const filtered = users.filter(u => {
          const matchesText = `${u.id} ${u.name} ${u.email}`.toLowerCase().includes(filterText.toLowerCase());
          const matchesRole = role ? u.role === role : true;
          return matchesText && matchesRole;
        });
        filtered.forEach(u => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td data-col="id">${u.id}</td>
            <td data-col="name">${u.name}</td>
            <td data-col="email">${u.email}</td>
            <td data-col="role">${u.role}</td>
            <td data-col="status"><span class="badge badge-${u.status === 'active' ? 'success' : u.status === 'pending' ? 'warning' : 'danger'}">${u.status}</span></td>
          `;
          tbody.appendChild(tr);
        });
      }

      // Initial render
      renderRows();

      // Search filter
      const searchInput = document.getElementById('search-input');
      const roleFilter = document.getElementById('role-filter');
      searchInput.addEventListener('input', () => renderRows(searchInput.value, roleFilter.value));
      roleFilter.addEventListener('change', () => renderRows(searchInput.value, roleFilter.value));
    });
  </script>
</body>
</html>
```

---

**File: `pages/details.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Acme Dashboard – User Details</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/styles/reset.css">
  <link rel="stylesheet" href="/styles/variables.css">
  <link rel="stylesheet" href="/styles/layout.css">
  <link rel="stylesheet" href="/styles/components.css">
  <link rel="stylesheet" href="/styles/pages.css">
  <link rel="stylesheet" href="/styles/utilities.css">
</head>
<body data-page="details">
  <div id="nav-placeholder"></div>

  <main class="container">
    <nav aria-label="breadcrumb" class="mt-3">
      <a href="/index.html">Home</a> / <a href="/pages/dashboard.html">Users</a> / <span>John Doe</span>
    </nav>

    <section class="mt-3 flex flex-between align-center">
      <h1>John Doe <span class="badge badge-success ml-2">Active</span></h1>
      <div>
        <button class="btn btn-outline mr-2" data-modal-open="generic-modal">Edit</button>
        <button class="btn btn-danger" onclick="showToast('User deleted (demo)', 'danger')">Delete</button>
      </div>
    </section>

    <section class="mt-4">
      <!-- Tabs component -->
      <div class="tabs" role="tablist">
        <div class="tab active" data-tab="overview">Overview</div>
        <div class="tab" data-tab="history">History</div>
        <div class="tab" data-tab="config">Config</div>
      </div>
      <div class="tab-panels">
        <div class="tab-panel active" data-panel="overview">
          <p><strong>Email:</strong> john.doe@example.com</p>
          <p><strong>Role:</strong> Editor</p>
          <p><strong>Joined:</strong> Jan 15, 2022</p>
        </div>
        <div class="tab-panel" data-panel="history">
          <ul class="mt-2">
            <li>2026-02-28 – Updated profile</li>
            <li>2026-01-12 – Changed password</li>
            <li>2025-11-05 – Created a project</li>
          </ul>
        </div>
        <div class="tab-panel" data-panel="config">
          <p>Configuration settings are not available in the demo.</p>
        </div>
      </div>
    </section>
  </main>

  <div id="footer-placeholder"></div>

  <!-- Edit modal (reusing generic) -->
  <div id="generic-modal" class="modal" role="dialog" aria-modal="true">
    <div class="modal-content">
      <button class="close-btn" aria-label="Close modal" onclick="closeModal('generic-modal')">&times;</button>
      <h2 class="modal-title">Edit User (Demo)</h2>
      <div class="modal-body">
        <form id="edit-user-form">
          <div class="mb-2">
            <label>Name</label>
            <input type="text" required class="w-full p-2 border rounded" value="John Doe">
          </div>
          <div class="mb-2">
            <label>Email</label>
            <input type="email" required class="w-full p-2 border rounded" value="john.doe@example.com">
          </div>
        </form>
      </div>
      <div class="modal-footer mt-3">
        <button class="btn btn-outline" onclick="closeModal('generic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="showToast('User updated (demo)', 'success')">Save</button>
      </div>
    </div>
  </div>

  <script type="module" src="/scripts/data.js"></script>
  <script type="module" src="/scripts/app.js"></script>
</body>
</html>
```

---

**File: `pages/settings.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Acme Dashboard – Settings</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/styles/reset.css">
  <link rel="stylesheet" href="/styles/variables.css">
  <link rel="stylesheet" href="/styles/layout.css">
  <link rel="stylesheet" href="/styles/components.css">
  <link rel="stylesheet" href="/styles/pages.css">
  <link rel="stylesheet" href="/styles/utilities.css">
</head>
<body data-page="settings">
  <div id="nav-placeholder"></div>

  <main class="container">
    <h1 class="mt-3">Settings</h1>

    <section class="settings-section mt-4">
      <h2>Profile</h2>
      <form id="settings-form">
        <div class="mb-2">
          <label>Full Name</label>
          <input type="text" name="fullName" required class="w-full p-2 border rounded" placeholder="Enter your name">
        </div>
        <div class="mb-2">
          <label>Email Address</label>
          <input type="email" name="email" required class="w-full p-2 border rounded" placeholder="you@example.com">
        </div>
        <div class="mb-2 flex items-center">
          <label class="mr-2">Enable notifications</label>
          <label class="toggle">
            <input type="checkbox" name="notifications" checked>
            <span class="slider"></span>
          </label>
        </div>
        <div class="mt-3">
          <button type="submit" class="btn btn-primary mr-2">Save Changes</button>
          <button type="reset" class="btn btn-outline">Reset</button>
        </div>
      </form>
    </section>

    <section class="settings-section mt-4">
      <h2>Preferences</h2>
      <div class="flex items-center mb-2">
        <label class="mr-2">Dark Mode</label>
        <label class="toggle">
          <input type="checkbox" id="theme-toggle">
          <span class="slider"></span>
        </label>
      </div>
    </section>
  </main>

  <div id="footer-placeholder"></div>

  <script type="module" src="/scripts/data.js"></script>
  <script type="module" src="/scripts/app.js"></script>
</body>
</html>
```

---

**File: `pages/about.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Acme Dashboard – About</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/styles/reset.css">
  <link rel="stylesheet" href="/styles/variables.css">
  <link rel="stylesheet" href="/styles/layout.css">
  <link rel="stylesheet" href="/styles/components.css">
  <link rel="stylesheet" href="/styles/pages.css">
  <link rel="stylesheet" href="/styles/utilities.css">
</head>
<body data-page="about">
  <div id="nav-placeholder"></div>

  <main class="container">
    <h1 class="mt-3">About Acme Dashboard</h1>

    <section class="mt-4">
      <p>Acme Dashboard is a demo multi‑page static application showcasing modern UI patterns built with vanilla HTML, CSS, and JavaScript.</p>
    </section>

    <section class="mt-4">
      <h2>Features</h2>
      <ul class="grid grid-2 mt-2">
        <li class="card flex items-center">
          <svg viewBox="0 0 24 24" class="mr-2" width="24" height="24"><path d="M3 12l2-2v7h14v-7l2 2V5H3v7z"/></svg>
          Responsive design
        </li>
        <li class="card flex items-center">
          <svg viewBox="0 0 24 24" class="mr-2" width="24" height="24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          Interactive tables
        </li>
        <li class="card flex items-center">
          <svg viewBox="0 0 24 24" class="mr-2" width="24" height="24"><path d="M19 13H5v-2h14v2zm0 4H5v-2h14v2zm0-8H5V7h14v2z"/></svg>
          Dark / Light theme
        </li>
        <li class="card flex items-center">
          <svg viewBox="0 0 24 24" class="mr-2" width="24" height="24"><path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/></svg>
          Accessible components
        </li>
      </ul>
    </section>

    <section class="faq mt-5">
      <h2>Frequently Asked Questions</h2>

      <div class="accordion-item mt-2">
        <div class="accordion-header">What is the purpose of this demo?</div>
        <div class="accordion-body">It demonstrates how to build a production‑quality static multi‑page site using only HTML, CSS, and JavaScript.</div>
      </div>

      <div class="accordion-item mt-2">
        <div class="accordion-header">Can I use this code in my project?</div>
        <div class="accordion-body">Yes! The code is released under the MIT license and can be adapted freely.</div>
      </div>

      <div class="accordion-item mt-2">
        <div class="accordion-header">How do I change the theme colors?</div>
        <div class="accordion-body">Edit the CSS custom properties in <code>styles/variables.css</code>.</div>
      </div>
    </section>

    <section class="mt-5">
      <h2>Team</h2>
      <p>Developed by the Acme Front‑End Team.</p>
    </section>

    <section class="mt-5">
      <h2>Version</h2>
      <p>v1.0.0 (2026‑03‑05)</p>
    </section>
  </main>

  <div id="footer-placeholder"></div>

  <script type="module" src="/scripts/data.js"></script>
  <script type="module" src="/scripts/app.js"></script>
</body>
</html>
```

---

**File: `scripts/data.js`**
```javascript
/* Load dummy data into the global scope */
import "/data/dummy.js";
```

---

**File: `scripts/app.js`**
```javascript
/* Main application bootstrap – same as previously described */
import { loadComponent } from "./utils.js";
import {
  initTabs,
  initModals,
  initSortableTable,
  initSearch,
  initAccordions,
  initFormValidation,
  initThemeToggle,
  showToast
} from "./components.js";

async function loadShared() {
  const [navHTML, footerHTML] = await Promise.all([
    loadComponent("/components/nav.html"),
    loadComponent("/components/footer.html")
  ]);
  document.getElementById("nav-placeholder").innerHTML = navHTML;
  document.getElementById("footer-placeholder").innerHTML = footerHTML;

  // Activate current nav link
  document.querySelectorAll(".nav-link").forEach(link => {
    const href = link.getAttribute("href");
    if (location.pathname.endsWith(href) || (href === "/index.html" && location.pathname === "/")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Mobile nav toggle
  const toggleBtn = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  toggleBtn?.addEventListener("click", () => navLinks.classList.toggle("open"));
}

function initPage() {
  const page = document.body.dataset.page;

  // Global theme toggle (present on all pages)
  initThemeToggle("#theme-toggle");

  // Initialize shared modals
  initModals();

  switch (page) {
    case "dashboard":
      initSortableTable(document.getElementById("users-table"));
      initSearch("#search-input", "#users-table");
      break;
    case "details":
      const tabs = document.querySelector(".tabs");
      if (tabs) initTabs(tabs);
      break;
    case "settings":
      initFormValidation("#settings-form");
      break;
    case "about":
      initAccordions();
      break;
    default:
      // home page – nothing extra needed
      break;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadShared();
  initPage();
});
```

---

**File: `scripts/components.js`**
```javascript
/* Component logic – identical to the one described earlier */
import { debounce } from "./utils.js";

export function initTabs(container) {
  const tabs = container.querySelectorAll("[data-tab]");
  const panels = container.querySelectorAll("[data-panel]");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      const panel = container.querySelector(`[data-panel="${tab.dataset.tab}"]`);
      if (panel) panel.classList.add("active");
    });
  });
}

export function initModals() {
  document.querySelectorAll("[data-modal-open]").forEach(btn => {
    const target = btn.dataset.modalOpen;
    btn.addEventListener("click", () => openModal(target));
  });
  document.querySelectorAll(".modal .close-btn").forEach(btn => {
    const modal = btn.closest(".modal");
    btn.addEventListener("click", () => closeModal(modal.id));
  });
}
export function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
}
export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
}

export function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function initSortableTable(table) {
  const ths = table.querySelectorAll("th[data-sort]");
  ths.forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      const rows = Array.from(table.querySelectorAll("tbody tr"));
      const asc = !th.classList.toggle("asc");
      rows.sort((a, b) => {
        const aText = a.querySelector(`td[data-col="${key}"]`).textContent.trim();
        const bText = b.querySelector(`td[data-col="${key}"]`).textContent.trim();
        return asc
          ? aText.localeCompare(bText, undefined, { numeric: true })
          : bText.localeCompare(aText, undefined, { numeric: true });
      });
      // Reset other headers
      ths.forEach(h => {
        if (h !== th) h.classList.remove("asc", "desc");
      });
      th.classList.toggle("desc", !asc);
      const tbody = table.querySelector("tbody");
      rows.forEach(r => tbody.appendChild(r));
    });
  });
}

export function initSearch(inputSel, tableSel) {
  const input = document.querySelector(inputSel);
  const table = document.querySelector(tableSel);
  if (!input || !table) return;
  const rows = Array.from(table.querySelectorAll("tbody tr"));
  const filter = debounce(() => {
    const term = input.value.toLowerCase();
    rows.forEach(row => {
      const txt = row.textContent.toLowerCase();
      row.style.display = txt.includes(term) ? "" : "none";
    });
  }, 200);
  input.addEventListener("input", filter);
}

export function initAccordions() {
  document.querySelectorAll(".accordion-header").forEach(header => {
    header.addEventListener("click", () => {
      const body = header.nextElementSibling;
      body.classList.toggle("open");
    });
  });
}

export function initFormValidation(formSel) {
  const form = document.querySelector(formSel);
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const required = form.querySelectorAll("[required]");
    let ok = true;
    required.forEach(inp => {
      if (!inp.value.trim()) {
        ok = false;
        inp.classList.add("invalid");
        const err = document.createElement("div");
        err.className = "text-danger mt-1";
        err.textContent = "This field is required.";
        if (!inp.nextElementSibling?.classList.contains("text-danger")) {
          inp.parentNode.insertBefore(err, inp.nextSibling);
        }
      } else {
        inp.classList.remove("invalid");
        if (inp.nextElementSibling?.classList.contains("text-danger")) {
          inp.nextElementSibling.remove();
        }
      }
    });
    if (ok) {
      showToast("Settings saved!", "success");
      form.reset();
    } else {
      showToast("Please fix errors.", "danger");
    }
  });
}

export function initThemeToggle(toggleSel) {
  const toggle = document.querySelector(toggleSel);
  if (!toggle) return;
  toggle.addEventListener("change", () => {
    document.documentElement.classList.toggle("dark", toggle.checked);
    localStorage.setItem("theme", toggle.checked ? "dark" : "light");
  });
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    toggle.checked = true;
    document.documentElement.classList.add("dark");
  }
}
```

---

**File: `scripts/utils.js`**
```javascript
/* Utility helpers */
export function loadComponent(url) {
  return fetch(url).then(r => r.text());
}

/* Debounce helper */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* Simple date formatter (optional) */
export function formatDate(str) {
  const d = new Date(str);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}
```

---

**File: `assets/placeholder.svg`** *(optional – not referenced directly, but kept for completeness)*
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <rect width="24" height="24" fill="var(--color-primary)"/>
</svg>
```

---

**File: `components/sidebar.html`** *(optional – not used but part of the suggested structure)*
```html
<aside class="sidebar">
  <ul>
    <li><a href="/index.html">Dashboard</a></li>
    <li><a href="/pages/dashboard.html">Users</a></li>
    <li><a href="/pages/settings.html">Settings</a></li>
    <li><a href="/pages/about.html">About</a></li>
  </ul>
</aside>
```

---

**File: `styles/utilities.css`** *(already provided earlier – duplicated here for completeness)*
```css
/* Utility classes – same as previously defined */
.mt-1 { margin-top: var(--space-1); }
.mt-2 { margin-top: var(--space-2); }
.mt-3 { margin-top: var(--space-3); }
.mb-1 { margin-bottom: var(--space-1); }
.mb-2 { margin-bottom: var(--space-2); }
.mb-3 { margin-bottom: var(--space-3); }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-muted { color: var(--color-muted); }
.d-none { display: none; }
.d-block { display: block; }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: var(--space-2); }
.mr-2 { margin-right: var(--space-2); }
.ml-2 { margin-left: var(--space-2); }
.w-full { width: 100%; }
```

---

All files above constitute a **complete, production‑quality, multi‑page static site** that fulfills the EASY level requirements:

* 5 separate HTML pages (`index.html` + 4 under `pages/`).
* Shared navigation and footer loaded via JavaScript.
* Rich dummy data displayed in tables, cards, activity list, etc.
* Interactive features: search/filter, sortable table, tabs, modal dialogs, form validation, theme toggle, toast notifications, accordion FAQ.
* Responsive layout using CSS Grid & Flexbox, mobile hamburger menu.
* CSS custom properties for theming, smooth transitions, polished typography and spacing.
* Organized folder structure (`components/`, `styles/`, `scripts/`, `data/`, `assets/`).