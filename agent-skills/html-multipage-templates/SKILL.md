# Skill: HTML Multi-Page Template Architecture

## Purpose
Guide FORGE to produce comprehensive, multi-page vanilla HTML/CSS/JS templates that look and feel like real applications — not thin landing pages.

## Core Principle
Every "easy" template should be a **complete static prototype** of the described application. A user opening it should immediately think "this looks like a real product" — with multiple navigable pages, interactive widgets, realistic data, and polished styling.

---

## File Organization Pattern

```
index.html                    ← Landing / main dashboard
pages/
  dashboard.html              ← Primary data view
  details.html                ← Single-item detail view
  settings.html               ← Configuration / preferences
  about.html                  ← Info, FAQ, team
components/
  nav.html                    ← Shared top navigation
  footer.html                 ← Shared footer
  sidebar.html                ← Optional sidebar navigation
  modal.html                  ← Reusable modal template
styles/
  variables.css               ← CSS custom properties (colors, spacing, typography)
  reset.css                   ← Minimal CSS reset
  layout.css                  ← Grid/flexbox page layouts, responsive breakpoints
  components.css              ← Cards, buttons, badges, tables, forms
  pages.css                   ← Page-specific overrides
  utilities.css               ← Utility classes (flex, text-center, mt-4, etc.)
scripts/
  app.js                      ← Main init, component loader, router
  components.js               ← Interactive widgets (tabs, modals, accordions, toasts)
  data.js                     ← Dummy data rendering and filtering
  utils.js                    ← DOM helpers, formatters, validators
data/
  dummy.js                    ← All dummy data exports (20+ realistic entries)
```

---

## Navigation Pattern

Every page includes:
```html
<nav class="main-nav">
  <div class="nav-brand">
    <svg><!-- inline logo SVG --></svg>
    <span>App Name</span>
  </div>
  <ul class="nav-links">
    <li><a href="/index.html" class="nav-link active">Home</a></li>
    <li><a href="/pages/dashboard.html" class="nav-link">Dashboard</a></li>
    <li><a href="/pages/details.html" class="nav-link">Details</a></li>
    <li><a href="/pages/settings.html" class="nav-link">Settings</a></li>
    <li><a href="/pages/about.html" class="nav-link">About</a></li>
  </ul>
  <button class="nav-toggle" aria-label="Menu">☰</button>
</nav>
```

Active state logic in app.js:
```javascript
document.querySelectorAll('.nav-link').forEach(link => {
  if (link.getAttribute('href') === location.pathname ||
      location.pathname.endsWith(link.getAttribute('href')))
    link.classList.add('active');
  else link.classList.remove('active');
});
```

---

## Page Content Minimums

### index.html (Home/Overview)
- Hero section or summary banner
- 3-4 stat/metric cards with numbers and icons (inline SVG)
- Recent activity list or table (5+ rows of dummy data)
- Quick action buttons
- Status overview (badges: green/yellow/red)

### dashboard.html (Data View)
- Filter bar (search input, dropdown filters, date range)
- Data table with 10+ rows, sortable columns, status badges
- Pagination controls
- Bulk action toolbar
- Summary stats above the table

### details.html (Item Detail)
- Breadcrumb navigation
- Item header with title, status badge, metadata
- Tabbed content sections (Overview, History, Config)
- Side panel with related info
- Action buttons (Edit, Delete, Export)

### settings.html (Configuration)
- Grouped settings sections with headings
- Toggle switches with labels
- Text inputs, selects, textareas
- Save/Reset buttons per section
- Form validation on submit (JS)
- Success toast notification on save

### about.html (Info)
- App description section
- Feature list with icons
- FAQ accordion (3-5 questions, JS toggle)
- Team/credits section
- Version/changelog section

---

## Interactive Component Patterns

### Tabs
```javascript
function initTabs(container) {
  const tabs = container.querySelectorAll('[data-tab]');
  const panels = container.querySelectorAll('[data-panel]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      container.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add('active');
    });
  });
}
```

### Modal
```javascript
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
```

### Toast Notification
```javascript
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}
```

### Sortable Table
```javascript
function initSortableTable(table) {
  table.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      const rows = [...table.querySelectorAll('tbody tr')];
      const asc = th.classList.toggle('asc');
      rows.sort((a, b) => {
        const av = a.querySelector(`td[data-col="${key}"]`).textContent;
        const bv = b.querySelector(`td[data-col="${key}"]`).textContent;
        return asc ? av.localeCompare(bv, undefined, {numeric: true})
                   : bv.localeCompare(av, undefined, {numeric: true});
      });
      const tbody = table.querySelector('tbody');
      rows.forEach(r => tbody.appendChild(r));
    });
  });
}
```

### Search/Filter
```javascript
function initSearch(inputSelector, itemsSelector) {
  const input = document.querySelector(inputSelector);
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    document.querySelectorAll(itemsSelector).forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}
```

---

## CSS Quality Checklist

- [ ] CSS custom properties for ALL colors, spacing, radii, shadows
- [ ] Dark mode toggle via `[data-theme="dark"]` on `<html>`
- [ ] Responsive breakpoints: 480px, 768px, 1024px, 1200px
- [ ] Card component: padding, border-radius, box-shadow, hover transform
- [ ] Button variants: primary, secondary, danger, ghost, disabled
- [ ] Form inputs: focus ring, error state, disabled state
- [ ] Table: striped rows, hover highlight, sticky header
- [ ] Badge/pill: success, warning, error, info colors
- [ ] Progress bar with animated fill
- [ ] Smooth transitions on all interactive elements (0.2s ease)
- [ ] Scroll-to-top button on long pages
- [ ] Skeleton loading placeholder styles

---

## Dummy Data Guidelines

Generate at least 15-20 entries in dummy data arrays. Each entry should have:
- Unique, realistic names/titles (not "Item 1", "Item 2")
- Varied statuses (active, pending, error, completed)
- Realistic dates, numbers, descriptions
- Consistent schema matching the project domain

Example:
```javascript
export const apiEndpoints = [
  { id: 1, name: "/users", method: "GET", status: "operational", latency: 45, uptime: 99.98, lastChecked: "2024-01-15T10:30:00Z" },
  { id: 2, name: "/auth/login", method: "POST", status: "degraded", latency: 230, uptime: 98.5, lastChecked: "2024-01-15T10:29:00Z" },
  // ... 18+ more entries
];
```
