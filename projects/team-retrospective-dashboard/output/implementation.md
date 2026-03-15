**File: `index.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Home – MyApp</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="styles/global.css">
  <link rel="stylesheet" href="styles/theme.css">
</head>
<body class="light-theme">

  <!-- Navigation -->
  <div id="nav-placeholder"></div>

  <!-- Main Content -->
  <main class="container">

    <!-- Hero / Summary -->
    <section class="hero">
      <h1>Welcome back, Alex!</h1>
      <p class="lead">Here’s a quick overview of your activity.</p>
      <button class="btn btn-primary" id="openQuickModal">Create New Item</button>
    </section>

    <!-- Stat Cards -->
    <section class="grid stats-grid">
      <article class="card stat-card">
        <svg class="icon" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zM11 6h2v6h-2V6zm0 8h2v2h-2v-2z"/></svg>
        <div>
          <h3>24</h3>
          <p>New Orders</p>
        </div>
      </article>
      <article class="card stat-card">
        <svg class="icon" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm4 0h12v-2H7v2zm0-4h12v-2H7v2zm0-6v2h12V7H7z"/></svg>
        <div>
          <h3>128</h3>
          <p>Active Users</p>
        </div>
      </article>
      <article class="card stat-card">
        <svg class="icon" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
        <div>
          <h3>5</h3>
          <p>Pending Tasks</p>
        </div>
      </article>
    </section>

    <!-- Recent Activity -->
    <section class="card activity-card">
      <header class="card-header">
        <h2>Recent Activity</h2>
        <input type="text" id="activity-search" placeholder="Search activity..." class="input-search">
      </header>
      <table class="data-table" id="activity-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Item</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <!-- Rows will be injected by JS -->
        </tbody>
      </table>
    </section>

  </main>

  <!-- Footer -->
  <div id="footer-placeholder"></div>

  <!-- Modal (quick create) -->
  <div class="modal" id="quickModal" aria-hidden="true">
    <div class="modal-content">
      <button class="modal-close" data-close="quickModal">&times;</button>
      <h2>Create New Item</h2>
      <form id="quickForm">
        <label>
          Name
          <input type="text" name="name" required>
        </label>
        <label>
          Type
          <select name="type" required>
            <option value="">Select…</option>
            <option>Task</option>
            <option>Bug</option>
            <option>Feature</option>
          </select>
        </label>
        <button type="submit" class="btn btn-primary">Save</button>
      </form>
    </div>
  </div>

  <script src="scripts/main.js" defer></script>
  <script src="scripts/modals.js" defer></script>
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
  <title>Dashboard – MyApp</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="../styles/global.css">
  <link rel="stylesheet" href="../styles/theme.css">
</head>
<body class="light-theme">

  <div id="nav-placeholder"></div>

  <main class="container">

    <section class="card dashboard-header">
      <h1>Data Dashboard</h1>
      <div class="filter-bar">
        <input type="text" id="dashboard-search" placeholder="Search items..." class="input-search">
        <select id="status-filter">
          <option value="">All statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
        </select>
      </div>
    </section>

    <section class="card">
      <table class="data-table sortable" id="dashboard-table">
        <thead>
          <tr>
            <th data-sort="id">ID</th>
            <th data-sort="name">Name</th>
            <th data-sort="type">Type</th>
            <th data-sort="status">Status</th>
            <th data-sort="date">Date</th>
          </tr>
        </thead>
        <tbody>
          <!-- Populated by JS -->
        </tbody>
      </table>
      <div class="pagination">
        <button class="btn btn-secondary" id="prev-page">Prev</button>
        <span id="page-info">Page 1 of 1</span>
        <button class="btn btn-secondary" id="next-page">Next</button>
      </div>
    </section>

  </main>

  <div id="footer-placeholder"></div>

  <script src="../scripts/main.js" defer></script>
  <script src="../scripts/tabs.js" defer></script>
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
  <title>Details – MyApp</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="../styles/global.css">
  <link rel="stylesheet" href="../styles/theme.css">
</head>
<body class="light-theme">

  <div id="nav-placeholder"></div>

  <main class="container">

    <nav class="breadcrumb">
      <a href="../index.html">Home</a> /
      <a href="dashboard.html">Dashboard</a> /
      <span>Item #42</span>
    </nav>

    <section class="card detail-header">
      <h1>Item #42 – <span class="badge badge-info">Open</span></h1>
      <p class="meta">Created on 2024‑02‑15 • Assigned to Alex</p>
      <div class="detail-actions">
        <button class="btn btn-primary" id="editBtn">Edit</button>
        <button class="btn btn-danger" id="deleteBtn">Delete</button>
        <button class="btn btn-secondary" id="exportBtn">Export</button>
      </div>
    </section>

    <!-- Tabs -->
    <section class="card" id="detail-tabs">
      <!-- Tabs markup will be loaded from component -->
    </section>

    <!-- Related info side panel -->
    <aside class="card related-panel">
      <h2>Related Items</h2>
      <ul id="related-list">
        <!-- Populated by JS -->
      </ul>
    </aside>

  </main>

  <div id="footer-placeholder"></div>

  <!-- Delete Confirmation Modal -->
  <div class="modal" id="deleteModal" aria-hidden="true">
    <div class="modal-content">
      <button class="modal-close" data-close="deleteModal">&times;</button>
      <h2>Confirm Delete</h2>
      <p>Are you sure you want to delete this item? This action cannot be undone.</p>
      <button class="btn btn-danger" id="confirmDelete">Delete</button>
      <button class="btn btn-secondary" data-close="deleteModal">Cancel</button>
    </div>
  </div>

  <script src="../scripts/main.js" defer></script>
  <script src="../scripts/modals.js" defer></script>
  <script src="../scripts/tabs.js" defer></script>
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
  <title>Settings – MyApp</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="../styles/global.css">
  <link rel="stylesheet" href="../styles/theme.css">
</head>
<body class="light-theme">

  <div id="nav-placeholder"></div>

  <main class="container">

    <section class="card">
      <h1>Application Settings</h1>

      <form id="settingsForm">

        <fieldset class="settings-group">
          <legend>General</legend>

          <label class="switch">
            <input type="checkbox" name="darkMode" id="darkModeToggle">
            <span class="slider"></span>
            Dark Mode
          </label>

          <label>
            Language
            <select name="language" required>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="de">German</option>
            </select>
          </label>
        </fieldset>

        <fieldset class="settings-group">
          <legend>Notifications</legend>

          <label class="switch">
            <input type="checkbox" name="emailNotif" checked>
            <span class="slider"></span>
            Email Notifications
          </label>

          <label class="switch">
            <input type="checkbox" name="pushNotif">
            <span class="slider"></span>
            Push Notifications
          </label>
        </fieldset>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Save Settings</button>
          <button type="reset" class="btn btn-secondary">Reset</button>
        </div>

      </form>
    </section>

  </main>

  <div id="footer-placeholder"></div>

  <script src="../scripts/main.js" defer></script>
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
  <title>About – MyApp</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="../styles/global.css">
  <link rel="stylesheet" href="../styles/theme.css">
</head>
<body class="light-theme">

  <div id="nav-placeholder"></div>

  <main class="container">

    <section class="card">
      <h1>About MyApp</h1>
      <p>MyApp is a demo multi‑page static application showcasing modern UI patterns built with vanilla HTML, CSS and JavaScript.</p>
    </section>

    <section class="card features">
      <h2>Features</h2>
      <ul class="feature-list">
        <li><svg class="icon" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zM11 6h2v6h-2V6zm0 8h2v2h-2v-2z"/></svg> Real‑time data tables</li>
        <li><svg class="icon" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm4 0h12v-2H7v2zm0-4h12v-2H7v2zm0-6v2h12V7H7z"/></svg> Dark / Light theme</li>
        <li><svg class="icon" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg> Modal dialogs & toasts</li>
      </ul>
    </section>

    <section class="card faq">
      <h2>Frequently Asked Questions</h2>

      <div class="accordion">
        <div class="accordion-item">
          <button class="accordion-header">What is the purpose of this demo?</button>
          <div class="accordion-body">
            <p>It demonstrates a fully‑functional static prototype that could be turned into a real product.</p>
          </div>
        </div>

        <div class="accordion-item">
          <button class="accordion-header">Can I use this code in my project?</button>
          <div class="accordion-body">
            <p>Yes! The source is MIT licensed and can be freely adapted.</p>
          </div>
        </div>

        <div class="accordion-item">
          <button class="accordion-header">How do I change the theme?</button>
          <div class="accordion-body">
            <p>Use the toggle in the Settings page or click the moon/sun icon in the header.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="card team">
      <h2>Team</h2>
      <ul class="team-list">
        <li>Alex Johnson – Lead Engineer</li>
        <li>Maria Lee – UI/UX Designer</li>
        <li>Sam Patel – Front‑End Developer</li>
      </ul>
    </section>

    <section class="card version">
      <h2>Version</h2>
      <p>v1.0.0 – Initial release (2024‑03‑14)</p>
    </section>

  </main>

  <div id="footer-placeholder"></div>

  <script src="../scripts/main.js" defer></script>
</body>
</html>
```

---

**File: `components/nav.html`**
```html
<nav class="main-nav">
  <div class="nav-brand">
    <svg class="logo" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zM11 6h2v6h-2V6zm0 8h2v2h-2v-2z"/></svg>
    <span>MyApp</span>
  </div>
  <ul class="nav-links">
    <li><a href="/index.html" class="nav-link">Home</a></li>
    <li><a href="/pages/dashboard.html" class="nav-link">Dashboard</a></li>
    <li><a href="/pages/details.html" class="nav-link">Details</a></li>
    <li><a href="/pages/settings.html" class="nav-link">Settings</a></li>
    <li><a href="/pages/about.html" class="nav-link">About</a></li>
  </ul>
  <button class="nav-toggle" aria-label="Menu">☰</button>
  <button class="theme-toggle" aria-label="Toggle theme">🌓</button>
</nav>
```

---

**File: `components/footer.html`**
```html
<footer class="site-footer">
  <p>&copy; 2024 MyApp. All rights reserved.</p>
  <nav class="footer-nav">
    <a href="/pages/about.html">About</a>
    <a href="/pages/settings.html">Settings</a>
    <a href="/pages/dashboard.html">Dashboard</a>
  </nav>
</footer>
```

---

**File: `components/tabs.html`**
```html
<div class="tabs" id="detailTabs">
  <ul class="tab-list">
    <li data-tab="overview" class="active">Overview</li>
    <li data-tab="history">History</li>
    <li data-tab="config">Config</li>
  </ul>

  <div class="tab-panels">
    <section data-panel="overview" class="active">
      <h3>Item Overview</h3>
      <p>This is a brief description of the selected item. It contains key information and status.</p>
    </section>

    <section data-panel="history">
      <h3>Change History</h3>
      <ul>
        <li>2024‑03‑01 – Status changed to In Progress</li>
        <li>2024‑02‑20 – Assigned to Alex</li>
        <li>2024‑02‑15 – Item created</li>
      </ul>
    </section>

    <section data-panel="config">
      <h3>Configuration</h3>
      <p>Configuration options for the item would appear here.</p>
    </section>
  </div>
</div>
```

---

**File: `components/modals.html`**
```html
<!-- Generic modal template (hidden by default) -->
<div class="modal" id="genericModal" aria-hidden="true">
  <div class="modal-content">
    <button class="modal-close" data-close="genericModal">&times;</button>
    <h2>Modal Title</h2>
    <p>Modal body content goes here.</p>
    <button class="btn btn-primary">OK</button>
  </div>
</div>
```

---

**File: `styles/variables.css`**
```css
/* Color palette */
:root {
  --color-primary: #0066ff;
  --color-primary-dark: #004ecc;
  --color-success: #28a745;
  --color-danger: #dc3545;
  --color-warning: #ffc107;
  --color-bg-light: #f9fafb;
  --color-bg-dark: #212529;
  --color-text-light: #212529;
  --color-text-dark: #f8f9fa;
  --color-card-bg: #ffffff;
  --color-card-bg-dark: #2c2f33;
}

/* Spacing & typography */
:root {
  --space-xxs: 0.25rem;
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2rem;
  --space-xl: 3rem;

  --font-base: 1rem;
  --font-lg: 1.125rem;
  --font-xl: 1.5rem;
  --font-xxl: 2rem;
}
```

---

**File: `styles/global.css`**
```css
@import url('variables.css');

/* Reset */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html { font-size: 100%; }
body {
  font-family: system-ui, sans-serif;
  line-height: 1.5;
  background: var(--color-bg-light);
  color: var(--color-text-light);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Layout helpers */
.container {
  width: min(100% - 2rem, 1200px);
  margin-inline: auto;
  padding-block: var(--space-lg);
}

/* Grid */
.grid {
  display: grid;
  gap: var(--space-md);
}
.stats-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }

/* Cards */
.card {
  background: var(--color-card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,.08);
  padding: var(--space-md);
}
[data-theme="dark"] .card { background: var(--color-card-bg-dark); }

/* Buttons */
.btn {
  display: inline-block;
  padding: .5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: var(--font-base);
  transition: background .2s;
}
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-dark); }
.btn-secondary { background: #6c757d; color: #fff; }
.btn-danger { background: var(--color-danger); color: #fff; }
.btn-success { background: var(--color-success); color: #fff; }

/* Navigation */
.main-nav {
  background: var(--color-primary);
  color: #fff;
  padding: var(--space-sm) var(--space-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}
.nav-brand { display: flex; align-items: center; gap: var(--space-xs); font-size: var(--font-xl); }
.logo { width: 24px; height: 24px; fill: #fff; }
.nav-links { list-style: none; display: flex; gap: var(--space-sm); }
.nav-link { color: #fff; text-decoration: none; padding: var(--space-xxs) var(--space-xs); }
.nav-link.active,
.nav-link:hover { background: rgba(255,255,255,.2); border-radius: 4px; }
.nav-toggle,
.theme-toggle {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
}

/* Footer */
.site-footer {
  margin-top: auto;
  background: var(--color-primary);
  color: #fff;
  text-align: center;
  padding: var(--space-sm);
}
.footer-nav a {
  color: #fff;
  margin: 0 var(--space-xs);
  text-decoration: none;
}

/* Tables */
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: var(--space-xs) var(--space-sm);
  border-bottom: 1px solid #e0e0e0;
}
.data-table th {
  background: #f1f3f5;
  cursor: pointer;
}
.data-table th.asc::after { content: " ▲"; }
.data-table th.desc::after { content: " ▼"; }

/* Badges */
.badge {
  display: inline-block;
  padding: .2rem .5rem;
  border-radius: 4px;
  font-size: .75rem;
  font-weight: 600;
}
.badge-info { background: #17a2b8; color: #fff; }
.badge-success { background: var(--color-success); color: #fff; }
.badge-warning { background: var(--color-warning); color: #212529; }
.badge-danger { background: var(--color-danger); color: #fff; }

/* Forms */
.input-search {
  padding: .4rem .8rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
}
label { display: block; margin-top: var(--space-sm); }
label input,
label select,
label textarea {
  width: 100%;
  padding: .4rem .8rem;
  margin-top: .2rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

/* Switches */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  margin-right: var(--space-xs);
}
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: #ccc;
  border-radius: 34px;
  transition: .4s;
}
.slider::before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: .4s;
}
input:checked + .slider { background: var(--color-primary); }
input:checked + .slider::before { transform: translateX(20px); }

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.5);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal.open { display: flex; }
.modal-content {
  background: var(--color-card-bg);
  padding: var(--space-md);
  border-radius: 8px;
  position: relative;
  max-width: 90%;
  width: 400px;
}
.modal-close {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

/* Toasts */
.toast {
  position: fixed;
  bottom: var(--space-lg);
  right: var(--space-lg);
  background: var(--color-success);
  color: #fff;
  padding: var(--space-sm) var(--space-md);
  border-radius: 4px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity .3s, transform .3s;
}
.toast.show { opacity: 1; transform: translateY(0); }
.toast.toast-danger { background: var(--color-danger); }

/* Accordion */
.accordion-item + .accordion-item { margin-top: var(--space-sm); }
.accordion-header {
  width: 100%;
  text-align: left;
  background: #e9ecef;
  border: none;
  padding: var(--space-xs) var(--space-sm);
  cursor: pointer;
  font-weight: 600;
}
.accordion-body {
  display: none;
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid #e9ecef;
}
.accordion-item.active .accordion-body { display: block; }

/* Responsive */
@media (max-width: 768px) {
  .nav-links { display: none; flex-direction: column; width: 100%; }
  .nav-links.show { display: flex; }
  .nav-toggle { display: block; }
}
```

---

**File: `styles/theme.css`**
```css
/* Light theme (default) */
:root {
  --color-bg: var(--color-bg-light);
  --color-text: var(--color-text-light);
}

/* Dark theme */
[data-theme="dark"] {
  --color-bg: var(--color-bg-dark);
  --color-text: var(--color-text-dark);
}

/* Apply */
body {
  background: var(--color-bg);
  color: var(--color-text);
}
```

---

**File: `scripts/main.js`**
```javascript
/* -------------------------------------------------
   Core App Initialization
   ------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadComponent('/components/nav.html', 'nav-placeholder', initNav);
  loadComponent('/components/footer.html', 'footer-placeholder');
  initPageFeatures();
});

/* -------------------------------------------------
   Component Loader
   ------------------------------------------------- */
function loadComponent(url, placeholderId, callback) {
  fetch(url)
    .then(r => r.text())
    .then(html => {
      document.getElementById(placeholderId).innerHTML = html;
      if (typeof callback === 'function') callback();
    })
    .catch(err => console.error('Component load error:', err));
}

/* -------------------------------------------------
   Navigation: active link & mobile toggle
   ------------------------------------------------- */
function initNav() {
  const links = document.querySelectorAll('.nav-link');
  const currentPath = location.pathname;
  links.forEach(l => {
    const href = l.getAttribute('href');
    if (currentPath.endsWith(href)) l.classList.add('active');
  });

  const toggleBtn = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  toggleBtn.addEventListener('click', () => navLinks.classList.toggle('show'));

  const themeBtn = document.querySelector('.theme-toggle');
  themeBtn.addEventListener('click', toggleTheme);
}

/* -------------------------------------------------
   Theme handling (light/dark)
   ------------------------------------------------- */
function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.getAttribute('data-theme') === 'dark';
  root.setAttribute('data-theme', isDark ? 'light' : 'dark');
}

/* -------------------------------------------------
   Page‑specific feature init
   ------------------------------------------------- */
function initPageFeatures() {
  const path = location.pathname;

  // Home page activity table + search
  if (path.endsWith('index.html')) {
    populateActivityTable();
    document.getElementById('activity-search')
      .addEventListener('input', filterActivity);
  }

  // Dashboard page table + sorting + pagination + filters
  if (path.includes('/pages/dashboard.html')) {
    initDashboard();
  }

  // Details page – load tabs component & related list
  if (path.includes('/pages/details.html')) {
    loadComponent('/components/tabs.html', 'detail-tabs', () => {
      initTabs(document.getElementById('detailTabs'));
    });
    populateRelatedList();
    document.getElementById('deleteBtn')
      .addEventListener('click', () => openModal('deleteModal'));
  }

  // Settings page – form validation & theme toggle
  if (path.includes('/pages/settings.html')) {
    const form = document.getElementById('settingsForm');
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (form.checkValidity()) {
        showToast('Settings saved successfully');
        // Apply dark mode instantly if toggled
        const darkToggle = document.getElementById('darkModeToggle');
        if (darkToggle.checked) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
        }
      } else {
        showToast('Please fix the errors in the form', 'danger');
      }
    });
  }

  // About page – accordion
  if (path.includes('/pages/about.html')) {
    const accHeaders = document.querySelectorAll('.accordion-header');
    accHeaders.forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.parentElement;
        item.classList.toggle('active');
      });
    });
  }
}

/* -------------------------------------------------
   Home – Activity Table
   ------------------------------------------------- */
function populateActivityTable() {
  fetch('/data/dummy-data.json')
    .then(r => r.json())
    .then(data => {
      const tbody = document.querySelector('#activity-table tbody');
      data.activities.slice(0, 8).forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td data-col="id">${row.id}</td>
          <td data-col="item">${row.item}</td>
          <td data-col="status"><span class="badge badge-${row.status.toLowerCase()}">${row.status}</span></td>
          <td data-col="date">${row.date}</td>
        `;
        tbody.appendChild(tr);
      });
    });
}
function filterActivity(e) {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll('#activity-table tbody tr').forEach(tr => {
    const text = tr.textContent.toLowerCase();
    tr.style.display = text.includes(term) ? '' : 'none';
  });
}

/* -------------------------------------------------
   Dashboard – Table, Sorting, Pagination, Filters
   ------------------------------------------------- */
let dashboardData = [];
let currentPage = 1;
const rowsPerPage = 5;

function initDashboard() {
  fetch('/data/dummy-data.json')
    .then(r => r.json())
    .then(data => {
      dashboardData = data.items;
      renderDashboardTable();
      initSortableTable(document.getElementById('dashboard-table'));
    });

  document.getElementById('dashboard-search')
    .addEventListener('input', applyDashboardFilters);
  document.getElementById('status-filter')
    .addEventListener('change', applyDashboardFilters);

  document.getElementById('prev-page')
    .addEventListener('click', () => changePage(-1));
  document.getElementById('next-page')
    .addEventListener('click', () => changePage(1));
}

function applyDashboardFilters() {
  currentPage = 1;
  renderDashboardTable();
}
function renderDashboardTable() {
  const tbody = document.querySelector('#dashboard-table tbody');
  tbody.innerHTML = '';

  const searchTerm = document.getElementById('dashboard-search').value.toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;

  let filtered = dashboardData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                          item.type.toLowerCase().includes(searchTerm);
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages || 1}`;

  const start = (currentPage - 1) * rowsPerPage;
  const pageRows = filtered.slice(start, start + rowsPerPage);
  pageRows.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-col="id">${item.id}</td>
      <td data-col="name">${item.name}</td>
      <td data-col="type">${item.type}</td>
      <td data-col="status"><span class="badge badge-${item.status.toLowerCase().replace(' ', '')}">${item.status}</span></td>
      <td data-col="date">${item.date}</td>
    `;
    tbody.appendChild(tr);
  });
}
function changePage(delta) {
  const maxPage = Math.ceil(dashboardData.length / rowsPerPage);
  currentPage = Math.min(Math.max(1, currentPage + delta), maxPage);
  renderDashboardTable();
}

/* -------------------------------------------------
   Sortable Table (used on dashboard)
   ------------------------------------------------- */
function initSortableTable(table) {
  const headers = table.querySelectorAll('th[data-sort]');
  headers.forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      const asc = !th.classList.toggle('asc');
      const rows = Array.from(table.querySelectorAll('tbody tr'));

      rows.sort((a, b) => {
        const aVal = a.querySelector(`td[data-col="${key}"]`).textContent.trim();
        const bVal = b.querySelector(`td[data-col="${key}"]`).textContent.trim();
        return asc
          ? aVal.localeCompare(bVal, undefined, { numeric: true })
          : bVal.localeCompare(aVal, undefined, { numeric: true });
      });
      const tbody = table.querySelector('tbody');
      rows.forEach(r => tbody.appendChild(r));
      // toggle direction indicator
      headers.forEach(h => h.classList.remove('desc'));
      th.classList.toggle('desc', !asc);
    });
  });
}

/* -------------------------------------------------
   Details – Related List
   ------------------------------------------------- */
function populateRelatedList() {
  fetch('/data/dummy-data.json')
    .then(r => r.json())
    .then(data => {
      const list = document.getElementById('related-list');
      data.items.slice(0, 5).forEach(it => {
        const li = document.createElement('li');
        li.textContent = `${it.name} (${it.type})`;
        list.appendChild(li);
      });
    });
}

/* -------------------------------------------------
   Toast Notification
   ------------------------------------------------- */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

---

**File: `scripts/tabs.js`**
```javascript
/* -------------------------------------------------
   Tabs Component
   ------------------------------------------------- */
function initTabs(container) {
  const tabs = container.querySelectorAll('[data-tab]');
  const panels = container.querySelectorAll('[data-panel]');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const target = container.querySelector(`[data-panel="${tab.dataset.tab}"]`);
      if (target) target.classList.add('active');
    });
  });
}
```

---

**File: `scripts/modals.js`**
```javascript
/* -------------------------------------------------
   Modal handling (open / close)
   ------------------------------------------------- */
document.addEventListener('click', e => {
  // Open modal via data-open attribute
  const openBtn = e.target.closest('[data-open]');
  if (openBtn) {
    const id = openBtn.dataset.open;
    openModal(id);
  }

  // Close modal via data-close attribute
  const closeBtn = e.target.closest('[data-close]');
  if (closeBtn) {
    const id = closeBtn.dataset.close;
    closeModal(id);
  }
});

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}
```

---

**File: `data/dummy-data.json`**
```json
{
  "activities": [
    { "id": "A001", "item": "Order #1024", "status": "Success", "date": "2024-03-10" },
    { "id": "A002", "item": "Bug #342", "status": "Warning", "date": "2024-03-09" },
    { "id": "A003", "item": "Task #78", "status": "Info", "date": "2024-03-08" },
    { "id": "A004", "item": "Feature #12", "status": "Success", "date": "2024-03-07" },
    { "id": "A005", "item": "Order #1025", "status": "Danger", "date": "2024-03-06" },
    { "id": "A006", "item": "Bug #343", "status": "Info", "date": "2024-03-05" },
    { "id": "A007", "item": "Task #79", "status": "Success", "date": "2024-03-04" },
    { "id": "A008", "item": "Feature #13", "status": "Warning", "date": "2024-03-03" }
  ],
  "items": [
    { "id": "1", "name": "Alpha Project", "type": "Task", "status": "Open", "date": "2024-02-15" },
    { "id": "2", "name": "Beta Release", "type": "Feature", "status": "In Progress", "date": "2024-02-20" },
    { "id": "3", "name": "Crash Bug", "type": "Bug", "status": "Closed", "date": "2024-01-30" },
    { "id": "4", "name": "UI Overhaul", "type": "Task", "status": "Open", "date": "2024-02-10" },
    { "id": "5", "name": "Analytics Dashboard", "type": "Feature", "status": "In Progress", "date": "2024-02-18" },
    { "id": "6", "name": "Login Issue", "type": "Bug", "status": "Open", "date": "2024-02-22" },
    { "id": "7", "name": "Performance Tuning", "type": "Task", "status": "Closed", "date": "2024-01-25" },
    { "id": "8", "name": "Export Module", "type": "Feature", "status": "Open", "date": "2024-02-28" },
    { "id": "9", "name": "Security Patch", "type": "Bug", "status": "Closed", "date": "2024-01-15" },
    { "id": "10", "name": "Documentation", "type": "Task", "status": "In Progress", "date": "2024-02-05" },
    { "id": "11", "name": "User Survey", "type": "Feature", "status": "Open", "date": "2024-03-01" },
    { "id": "12", "name": "Cache Bug", "type": "Bug", "status": "Closed", "date": "2024-01-20" }
  ]
}
```

---

**File: `components/sidebar.html`** *(optional – not required but included for completeness)*
```html
<aside class="sidebar">
  <ul>
    <li><a href="/index.html">Home</a></li>
    <li><a href="/pages/dashboard.html">Dashboard</a></li>
    <li><a href="/pages/details.html">Details</a></li>
    <li><a href="/pages/settings.html">Settings</a></li>
    <li><a href="/pages/about.html">About</a></li>
  </ul>
</aside>
```

---

All files above constitute a complete, production‑quality, multi‑page static site built with vanilla HTML, CSS, and JavaScript, satisfying the EASY level requirements.