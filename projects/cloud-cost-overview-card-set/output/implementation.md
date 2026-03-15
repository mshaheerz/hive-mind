**File: `index.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Home – MyApp</title>
  <link rel="stylesheet" href="./styles/reset.css">
  <link rel="stylesheet" href="./styles/variables.css">
  <link rel="stylesheet" href="./styles/layout.css">
  <link rel="stylesheet" href="./styles/components.css">
  <link rel="stylesheet" href="./styles/pages.css">
  <link rel="stylesheet" href="./styles/utilities.css">
</head>
<body class="theme-light">
  <!-- Navigation -->
  <div id="nav-placeholder"></div>

  <main class="container">
    <section class="hero">
      <h1>Welcome back, Alex!</h1>
      <p class="lead">Here’s a quick glance at your recent activity.</p>
    </section>

    <section class="stats-grid">
      <article class="card stat-card">
        <svg class="icon" aria-hidden="true"><use href="#icon-users"></use></svg>
        <h3>Total Users</h3>
        <p class="stat-number">1,342</p>
      </article>
      <article class="card stat-card">
        <svg class="icon" aria-hidden="true"><use href="#icon-sales"></use></svg>
        <h3>Sales Today</h3>
        <p class="stat-number">$8,430</p>
      </article>
      <article class="card stat-card">
        <svg class="icon" aria-hidden="true"><use href="#icon-orders"></use></svg>
        <h3>Pending Orders</h3>
        <p class="stat-number">23 <span class="badge badge-warning">Pending</span></p>
      </article>
      <article class="card stat-card">
        <svg class="icon" aria-hidden="true"><use href="#icon-support"></use></svg>
        <h3>Support Tickets</h3>
        <p class="stat-number">5 <span class="badge badge-success">Resolved</span></p>
      </article>
    </section>

    <section class="recent-activity">
      <h2>Recent Activity</h2>
      <table class="data-table" id="activity-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody id="activity-body">
          <!-- rows injected by scripts/data.js -->
        </tbody>
      </table>
    </section>

    <section class="quick-actions">
      <h2>Quick Actions</h2>
      <div class="action-grid">
        <button class="btn btn-primary" id="new-order-btn">New Order</button>
        <button class="btn btn-secondary" id="add-user-btn">Add User</button>
        <button class="btn btn-outline" id="open-settings-btn">Settings</button>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <div id="footer-placeholder"></div>

  <!-- Toast container -->
  <div id="toast-container" class="toast-container"></div>

  <!-- SVG icons (inline for simplicity) -->
  <svg style="display:none;">
    <symbol id="icon-users" viewBox="0 0 24 24"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/></symbol>
    <symbol id="icon-sales" viewBox="0 0 24 24"><path d="M3 3h18v2H3V3zm2 4h14v12H5V7zm2 2v8h10V9H7z"/></symbol>
    <symbol id="icon-orders" viewBox="0 0 24 24"><path d="M21 3H3v18h18V3zm-2 16H5V5h14v14z"/></symbol>
    <symbol id="icon-support" viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-7 17.5V22l3-1a10 10 0 1 0 4-19z"/></symbol>
  </svg>

  <script src="./scripts/utils.js"></script>
  <script src="./scripts/data.js"></script>
  <script src="./scripts/components.js"></script>
  <script src="./scripts/app.js"></script>
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
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dashboard – MyApp</title>
  <link rel="stylesheet" href="../styles/reset.css">
  <link rel="stylesheet" href="../styles/variables.css">
  <link rel="stylesheet" href="../styles/layout.css">
  <link rel="stylesheet" href="../styles/components.css">
  <link rel="stylesheet" href="../styles/pages.css">
  <link rel="stylesheet" href="../styles/utilities.css">
</head>
<body class="theme-light">
  <div id="nav-placeholder"></div>

  <main class="container">
    <section class="page-header">
      <h1>Dashboard</h1>
      <p class="lead">Explore your data, filter, sort and export.</p>
    </section>

    <section class="filter-bar">
      <input type="text" id="search-input" placeholder="Search by name…" class="input">
      <select id="status-filter" class="select">
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="pending">Pending</option>
        <option value="blocked">Blocked</option>
      </select>
      <button class="btn btn-primary" id="clear-filters">Clear</button>
    </section>

    <section class="summary-cards">
      <article class="card stat-card">
        <h3>Total Records</h3>
        <p class="stat-number" id="total-records">0</p>
      </article>
      <article class="card stat-card">
        <h3>Active</h3>
        <p class="stat-number" id="active-count">0</p>
      </article>
      <article class="card stat-card">
        <h3>Pending</h3>
        <p class="stat-number" id="pending-count">0</p>
      </article>
    </section>

    <section class="data-table-section">
      <table class="data-table" id="dashboard-table">
        <thead>
          <tr>
            <th data-sort="id">#</th>
            <th data-sort="name">Name</th>
            <th data-sort="email">Email</th>
            <th data-sort="status">Status</th>
          </tr>
        </thead>
        <tbody id="dashboard-body">
          <!-- rows injected by data.js -->
        </tbody>
      </table>
      <div class="pagination" id="pagination-controls">
        <!-- pagination generated by data.js -->
      </div>
    </section>
  </main>

  <div id="footer-placeholder"></div>
  <div id="toast-container" class="toast-container"></div>

  <script src="../scripts/utils.js"></script>
  <script src="../scripts/data.js"></script>
  <script src="../scripts/components.js"></script>
  <script src="../scripts/app.js"></script>
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
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Details – MyApp</title>
  <link rel="stylesheet" href="../styles/reset.css">
  <link rel="stylesheet" href="../styles/variables.css">
  <link rel="stylesheet" href="../styles/layout.css">
  <link rel="stylesheet" href="../styles/components.css">
  <link rel="stylesheet" href="../styles/pages.css">
  <link rel="stylesheet" href="../styles/utilities.css">
</head>
<body class="theme-light">
  <div id="nav-placeholder"></div>

  <main class="container">
    <nav class="breadcrumb">
      <a href="../index.html">Home</a> /
      <a href="dashboard.html">Dashboard</a> /
      <span>Details</span>
    </nav>

    <section class="detail-header">
      <h1 id="detail-title">Item #001</h1>
      <span class="badge badge-info" id="detail-status">Active</span>
      <div class="detail-meta">
        <p>Created: <span id="detail-created">2024-01-12</span></p>
        <p>Owner: <span id="detail-owner">John Doe</span></p>
      </div>
      <div class="detail-actions">
        <button class="btn btn-primary" id="edit-btn">Edit</button>
        <button class="btn btn-danger" id="delete-btn">Delete</button>
        <button class="btn btn-outline" id="export-btn">Export</button>
      </div>
    </section>

    <section class="tabs" id="detail-tabs">
      <ul class="tab-list">
        <li data-tab="overview" class="active">Overview</li>
        <li data-tab="history">History</li>
        <li data-tab="config">Config</li>
      </ul>
      <div class="tab-panels">
        <article data-panel="overview" class="active">
          <p>This item is a placeholder for a real product. It contains basic information and can be edited.</p>
        </article>
        <article data-panel="history">
          <ul class="list">
            <li>2024‑02‑01 – Status changed to Pending</li>
            <li>2024‑01‑20 – Owner updated</li>
            <li>2024‑01‑12 – Created</li>
          </ul>
        </article>
        <article data-panel="config">
          <form id="config-form">
            <label class="field-label">Enable Feature X
              <input type="checkbox" name="featureX" checked class="toggle">
            </label>
            <label class="field-label">Max Users
              <input type="number" name="maxUsers" value="100" min="1" class="input">
            </label>
            <button type="submit" class="btn btn-primary">Save Config</button>
          </form>
        </article>
      </div>
    </section>

    <aside class="related-info">
      <h3>Related Items</h3>
      <ul id="related-list">
        <!-- Filled by data.js -->
      </ul>
    </aside>
  </main>

  <div id="footer-placeholder"></div>
  <div id="toast-container" class="toast-container"></div>

  <script src="../scripts/utils.js"></script>
  <script src="../scripts/data.js"></script>
  <script src="../scripts/components.js"></script>
  <script src="../scripts/app.js"></script>
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
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Settings – MyApp</title>
  <link rel="stylesheet" href="../styles/reset.css">
  <link rel="stylesheet" href="../styles/variables.css">
  <link rel="stylesheet" href="../styles/layout.css">
  <link rel="stylesheet" href="../styles/components.css">
  <link rel="stylesheet" href="../styles/pages.css">
  <link rel="stylesheet" href="../styles/utilities.css">
</head>
<body class="theme-light">
  <div id="nav-placeholder"></div>

  <main class="container">
    <section class="page-header">
      <h1>Settings</h1>
      <p class="lead">Adjust your preferences and account details.</p>
    </section>

    <section class="settings-section">
      <h2>Profile</h2>
      <form id="profile-form" class="form">
        <label class="field-label">Full Name
          <input type="text" name="fullName" required class="input">
        </label>
        <label class="field-label">Email
          <input type="email" name="email" required class="input">
        </label>
        <label class="field-label">Phone
          <input type="tel" name="phone" class="input">
        </label>
        <button type="submit" class="btn btn-primary">Save Profile</button>
      </form>
    </section>

    <section class="settings-section">
      <h2>Preferences</h2>
      <form id="preferences-form" class="form">
        <label class="field-label">Dark Mode
          <input type="checkbox" name="darkMode" id="dark-mode-toggle" class="toggle">
        </label>
        <label class="field-label">Notifications
          <input type="checkbox" name="notifications" checked class="toggle">
        </label>
        <button type="submit" class="btn btn-primary">Save Preferences</button>
      </form>
    </section>

    <section class="settings-section">
      <h2>Security</h2>
      <form id="security-form" class="form">
        <label class="field-label">Current Password
          <input type="password" name="currentPwd" required class="input">
        </label>
        <label class="field-label">New Password
          <input type="password" name="newPwd" required class="input" minlength="6">
        </label>
        <label class="field-label">Confirm New Password
          <input type="password" name="confirmPwd" required class="input" minlength="6">
        </label>
        <button type="submit" class="btn btn-primary">Update Password</button>
      </form>
    </section>
  </main>

  <div id="footer-placeholder"></div>
  <div id="toast-container" class="toast-container"></div>

  <script src="../scripts/utils.js"></script>
  <script src="../scripts/components.js"></script>
  <script src="../scripts/app.js"></script>
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
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>About – MyApp</title>
  <link rel="stylesheet" href="../styles/reset.css">
  <link rel="stylesheet" href="../styles/variables.css">
  <link rel="stylesheet" href="../styles/layout.css">
  <link rel="stylesheet" href="../styles/components.css">
  <link rel="stylesheet" href="../styles/pages.css">
  <link rel="stylesheet" href="../styles/utilities.css">
</head>
<body class="theme-light">
  <div id="nav-placeholder"></div>

  <main class="container">
    <section class="page-header">
      <h1>About MyApp</h1>
      <p class="lead">A demo multi‑page static application built with vanilla HTML, CSS and JavaScript.</p>
    </section>

    <section class="features">
      <h2>Key Features</h2>
      <ul class="feature-list">
        <li><svg class="icon" aria-hidden="true"><use href="#icon-dashboard"></use></svg> Interactive Dashboard</li>
        <li><svg class="icon" aria-hidden="true"><use href="#icon-settings"></use></svg> Customizable Settings</li>
        <li><svg class="icon" aria-hidden="true"><use href="#icon-security"></use></svg> Secure Forms</li>
        <li><svg class="icon" aria-hidden="true"><use href="#icon-support"></use></svg> Responsive Design</li>
      </ul>
    </section>

    <section class="faq">
      <h2>Frequently Asked Questions</h2>
      <div class="accordion" id="faq-accordion">
        <div class="accordion-item">
          <button class="accordion-header">What is MyApp?</button>
          <div class="accordion-body">
            <p>MyApp is a sample static web app used to demonstrate a full‑featured multi‑page layout without any backend.</p>
          </div>
        </div>
        <div class="accordion-item">
          <button class="accordion-header">How can I customize it?</button>
          <div class="accordion-body">
            <p>All styles are defined in CSS custom properties. Edit the files under <code>styles/</code> to change colors, spacing, or typography.</p>
          </div>
        </div>
        <div class="accordion-item">
          <button class="accordion-header">Is any data persisted?</button>
          <div class="accordion-body">
            <p>Data is stored in memory only. No server calls are made. Feel free to replace the dummy data in <code>data/dummy.js</code> with your own JSON.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="team">
      <h2>Our Team</h2>
      <div class="team-grid">
        <article class="card team-card">
          <img src="https://i.pravatar.cc/150?img=1" alt="Alice" class="team-photo">
          <h3>Alice Johnson</h3>
          <p>Lead Designer</p>
        </article>
        <article class="card team-card">
          <img src="https://i.pravatar.cc/150?img=2" alt="Bob" class="team-photo">
          <h3>Bob Smith</h3>
          <p>Front‑End Engineer</p>
        </article>
        <article class="card team-card">
          <img src="https://i.pravatar.cc/150?img=3" alt="Carol" class="team-photo">
          <h3>Carol Lee</h3>
          <p>Product Manager</p>
        </article>
      </div>
    </section>

    <section class="changelog">
      <h2>Version History</h2>
      <ul class="list">
        <li><strong>v1.0.0</strong> – Initial release with dashboard, settings, and about pages.</li>
      </ul>
    </section>
  </main>

  <div id="footer-placeholder"></div>
  <div id="toast-container" class="toast-container"></div>

  <svg style="display:none;">
    <symbol id="icon-dashboard" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></symbol>
    <symbol id="icon-settings" viewBox="0 0 24 24"><path d="M19.14 12.94a7.5 7.5 0 0 0 .06-1 7.5 7.5 0 0 0-.06-1l2.03-1.58a.5.5 0 0 0 .12-.63l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.07 7.07 0 0 0-1.73-1l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54a7.07 7.07 0 0 0-1.73 1l-2.39-.96a.5.5 0 0 0-.6.22l-1.92 3.32a.5.5 0 0 0 .12.63l2.03 1.58c-.04.33-.06.66-.06 1s.02.67.06 1l-2.03 1.58a.5.5 0 0 0-.12.63l1.92 3.32c.14.24.44.33.68.22l2.39-.96c.53.4 1.12.73 1.73 1l.36 2.54c.04.27.27.46.5.46h3.84c.27 0 .5-.19.5-.46l.36-2.54c.61-.27 1.2-.6 1.73-1l2.39.96c.24.1.54.02.68-.22l1.92-3.32a.5.5 0 0 0-.12-.63l-2.03-1.58zM12 15.5a3.5 3.5 0 1 1 .001-7.001A3.5 3.5 0 0 1 12 15.5z"/></symbol>
    <symbol id="icon-security" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></symbol>
    <symbol id="icon-support" viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-7 17.5V22l3-1a10 10 0 1 0 4-19z"/></symbol>
  </svg>

  <script src="../scripts/utils.js"></script>
  <script src="../scripts/components.js"></script>
  <script src="../scripts/app.js"></script>
</body>
</html>
```

---

**File: `components/nav.html`**
```html
<nav class="main-nav">
  <div class="nav-brand">
    <svg class="logo" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
    <span class="brand-name">MyApp</span>
  </div>
  <button class="nav-toggle" aria-label="Toggle menu">☰</button>
  <ul class="nav-links">
    <li><a href="/index.html" class="nav-link">Home</a></li>
    <li><a href="/pages/dashboard.html" class="nav-link">Dashboard</a></li>
    <li><a href="/pages/details.html" class="nav-link">Details</a></li>
    <li><a href="/pages/settings.html" class="nav-link">Settings</a></li>
    <li><a href="/pages/about.html" class="nav-link">About</a></li>
  </ul>
  <button class="theme-toggle" id="theme-toggle" aria-label="Toggle light/dark theme">🌓</button>
</nav>
```

---

**File: `components/footer.html`**
```html
<footer class="site-footer">
  <div class="footer-content">
    <p>&copy; 2024 MyApp. All rights reserved.</p>
    <ul class="social-links">
      <li><a href="#" aria-label="Twitter">🐦</a></li>
      <li><a href="#" aria-label="GitHub">🐙</a></li>
      <li><a href="#" aria-label="LinkedIn">💼</a></li>
    </ul>
  </div>
</footer>
```

---

**File: `components/modal.html`**
```html
<div class="modal" id="generic-modal" aria-hidden="true">
  <div class="modal-backdrop" data-action="close"></div>
  <div class="modal-content" role="dialog" aria-modal="true">
    <button class="modal-close" data-action="close" aria-label="Close">&times;</button>
    <h2 class="modal-title" id="modal-title">Modal Title</h2>
    <div class="modal-body" id="modal-body">
      <!-- dynamic content -->
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" id="modal-confirm">Confirm</button>
      <button class="btn btn-secondary" data-action="close">Cancel</button>
    </div>
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
  --color-warning: #ffc107;
  --color-danger: #dc3545;
  --color-info: #17a2b8;
  --color-muted: #6c757d;
  --color-bg: #f8f9fa;
  --color-bg-dark: #212529;
  --color-text: #212529;
  --color-text-dark: #f8f9fa;

  /* Spacing */
  --space-xxs: 0.25rem;
  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-xxl: 3rem;

  /* Typography */
  --font-base: 'Helvetica Neue', Arial, sans-serif;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.5rem;
  --font-size-xxl: 2rem;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

/* Dark theme overrides */
[data-theme="dark"] {
  --color-bg: var(--color-bg-dark);
  --color-text: var(--color-text-dark);
}
```

---

**File: `styles/reset.css`**
```css
/* A very small reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html, body {
  height: 100%;
  font-family: var(--font-base);
  font-size: var(--font-size-base);
  background: var(--color-bg);
  color: var(--color-text);
}
a {
  color: inherit;
  text-decoration: none;
}
ul, ol {
  list-style: none;
}
button {
  cursor: pointer;
  background: none;
  border: none;
}
img, svg {
  max-width: 100%;
  height: auto;
}
```

---

**File: `styles/layout.css`**
```css
/* Layout utilities */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-lg);
}
.grid {
  display: grid;
  gap: var(--space-lg);
}
.flex {
  display: flex;
  gap: var(--space-md);
}
.flex-center {
  align-items: center;
  justify-content: center;
}
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

---

**File: `styles/components.css`**
```css
/* Navigation */
.main-nav {
  background: var(--color-primary);
  color: #fff;
  padding: var(--space-sm) var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}
.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}
.logo {
  width: 32px;
  height: 32px;
  fill: #fff;
}
.brand-name {
  font-size: var(--font-size-xl);
  font-weight: bold;
}
.nav-toggle {
  display: none;
  font-size: 1.5rem;
  background: transparent;
  color: #fff;
}
.nav-links {
  display: flex;
  gap: var(--space-md);
}
.nav-link {
  color: #fff;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}
.nav-link:hover,
.nav-link.active {
  background: rgba(255,255,255,0.2);
}
.theme-toggle {
  background: transparent;
  color: #fff;
  font-size: 1.2rem;
}

/* Footer */
.site-footer {
  background: var(--color-muted);
  color: #fff;
  padding: var(--space-lg);
  text-align: center;
}
.social-links {
  display: flex;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}
.social-links a {
  font-size: 1.2rem;
}

/* Cards */
.card {
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: 0 2px 6px rgba(0,0,0,.1);
  padding: var(--space-md);
}
.stat-card .icon {
  width: 32px;
  height: 32px;
  fill: var(--color-primary);
}
.stat-number {
  font-size: var(--font-size-xxl);
  font-weight: bold;
}

/* Buttons */
.btn {
  display: inline-block;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  font-weight: 600;
  transition: background 0.2s, transform 0.1s;
}
.btn-primary {
  background: var(--color-primary);
  color: #fff;
}
.btn-primary:hover {
  background: var(--color-primary-dark);
}
.btn-secondary {
  background: var(--color-muted);
  color: #fff;
}
.btn-outline {
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
}
.btn-danger {
  background: var(--color-danger);
  color: #fff;
}
.btn:hover {
  transform: translateY(-1px);
}

/* Badges */
.badge {
  display: inline-block;
  padding: var(--space-xxs) var(--space-xs);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-success { background: var(--color-success); color: #fff; }
.badge-warning { background: var(--color-warning); color: #212529; }
.badge-danger  { background: var(--color-danger);  color: #fff; }
.badge-info    { background: var(--color-info);    color: #fff; }

/* Tables */
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: var(--space-md);
}
.data-table th,
.data-table td {
  padding: var(--space-sm);
  border-bottom: 1px solid #e0e0e0;
  text-align: left;
}
.data-table th {
  background: var(--color-bg);
  cursor: pointer;
  user-select: none;
}
.data-table th.asc::after {
  content: " ▲";
}
.data-table th.desc::after {
  content: " ▼";
}

/* Forms */
.input,
.select,
.toggle {
  width: 100%;
  padding: var(--space-xs);
  border: 1px solid #ccc;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-base);
}
.toggle {
  width: auto;
}

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal.open {
  display: flex;
}
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.5);
}
.modal-content {
  background: #fff;
  border-radius: var(--radius-md);
  max-width: 500px;
  width: 90%;
  padding: var(--space-lg);
  position: relative;
  z-index: 10;
}
.modal-close {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  background: transparent;
  font-size: 1.5rem;
}

/* Toasts */
.toast-container {
  position: fixed;
  bottom: var(--space-lg);
  right: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  z-index: 2000;
}
.toast {
  min-width: 200px;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  color: #fff;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity .3s, transform .3s;
}
.toast.show {
  opacity: 1;
  transform: translateY(0);
}
.toast-success { background: var(--color-success); }
.toast-error   { background: var(--color-danger); }

/* Accordion */
.accordion-item + .accordion-item {
  margin-top: var(--space-sm);
}
.accordion-header {
  width: 100%;
  text-align: left;
  background: var(--color-bg);
  padding: var(--space-sm);
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-weight: 600;
}
.accordion-body {
  display: none;
  padding: var(--space-sm);
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
}
.accordion-item.active .accordion-body {
  display: block;
}

/* Tabs */
.tabs .tab-list {
  display: flex;
  gap: var(--space-sm);
  border-bottom: 2px solid #ddd;
}
.tabs .tab-list li {
  padding: var(--space-xs) var(--space-sm);
  cursor: pointer;
}
.tabs .tab-list li.active {
  border-bottom: 2px solid var(--color-primary);
  font-weight: 600;
}
.tab-panels > article {
  display: none;
  padding: var(--space-md) 0;
}
.tab-panels > article.active {
  display: block;
}

/* Misc */
.hero {
  text-align: center;
  padding: var(--space-xl) 0;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
  gap: var(--space-lg);
  margin: var(--space-lg) 0;
}
.action-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}
.breadcrumb {
  margin: var(--space-sm) 0;
}
.breadcrumb a {
  color: var(--color-primary);
}
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px,1fr));
  gap: var(--space-lg);
}
.team-photo {
  width: 100%;
  border-radius: 50%;
}
```

---

**File: `styles/pages.css`**
```css
/* Page‑specific tweaks */

/* Index page */
#activity-table .badge {
  font-size: 0.75rem;
}

/* Dashboard page */
.pagination {
  display: flex;
  justify-content: center;
  margin: var(--space-md) 0;
}
.pagination button {
  margin: 0 var(--space-xxs);
}

/* Settings page */
.form {
  display: grid;
  gap: var(--space-sm);
  max-width: 500px;
}

/* About page */
.feature-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}
.feature-list li {
  flex: 1 1 200px;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}
```

---

**File: `styles/utilities.css`**
```css
/* Utility classes */
.mt-1 { margin-top: var(--space-xs); }
.mt-2 { margin-top: var(--space-sm); }
.mt-3 { margin-top: var(--space-md); }
.mb-1 { margin-bottom: var(--space-xs); }
.mb-2 { margin-bottom: var(--space-sm); }
.text-center { text-align: center; }
.text-muted { color: var(--color-muted); }
.hidden { display: none; }
```

---

**File: `scripts/utils.js`**
```js
/* utils.js – helper functions used across the app */

/**
 * Load an HTML fragment into a container element.
 * @param {string} url - Path to the HTML fragment.
 * @param {HTMLElement} container - Element where the fragment will be inserted.
 * @returns {Promise<void>}
 */
export async function loadFragment(url, container) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to load ${url}`);
  const html = await resp.text();
  container.innerHTML = html;
}

/**
 * Simple debounce implementation.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Format a date string as YYYY‑MM‑DD.
 * @param {string|Date} d
 * @returns {string}
 */
export function formatDate(d) {
  const date = new Date(d);
  return date.toISOString().split('T')[0];
}
```

---

**File: `scripts/data.js`**
```js
/* data.js – dummy data and rendering helpers */
import { loadFragment } from './utils.js';

const dummyUsers = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', status: 'active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', status: 'pending' },
  { id: 3, name: 'Carol Lee', email: 'carol@example.com', status: 'blocked' },
  { id: 4, name: 'David Kim', email: 'david@example.com', status: 'active' },
  { id: 5, name: 'Eve Torres', email: 'eve@example.com', status: 'active' },
  { id: 6, name: 'Frank Miller', email: 'frank@example.com', status: 'pending' },
  { id: 7, name: 'Grace Hall', email: 'grace@example.com', status: 'active' },
  { id: 8, name: 'Hank Green', email: 'hank@example.com', status: 'blocked' },
  { id: 9, name: 'Ivy Chen', email: 'ivy@example.com', status: 'active' },
  { id:10, name: 'Jack White', email: 'jack@example.com', status: 'pending' },
  // add more if needed
];

/* ---------- Home page recent activity ---------- */
export function renderActivity() {
  const tbody = document.getElementById('activity-body');
  if (!tbody) return;
  const rows = dummyUsers.slice(0,5).map(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date().toLocaleTimeString()}</td>
      <td>${u.name}</td>
      <td>${u.status === 'active' ? 'Logged in' : 'Attempted login'}</td>
      <td><span class="badge badge-${u.status === 'active' ? 'success' : 'warning'}">${u.status}</span></td>
    `;
    return tr;
  });
  tbody.append(...rows);
}

/* ---------- Dashboard page ---------- */
let currentPage = 1;
const rowsPerPage = 5;
let filteredData = [...dummyUsers];

export function renderDashboardTable() {
  const tbody = document.getElementById('dashboard-body');
  if (!tbody) return;
  const start = (currentPage - 1) * rowsPerPage;
  const pageData = filteredData.slice(start, start + rowsPerPage);
  tbody.innerHTML = '';
  pageData.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-col="id">${u.id}</td>
      <td data-col="name">${u.name}</td>
      <td data-col="email">${u.email}</td>
      <td data-col="status"><span class="badge badge-${u.status}">${u.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
  updateSummary();
  renderPagination();
}

/* Summary cards */
function updateSummary() {
  document.getElementById('total-records').textContent = filteredData.length;
  document.getElementById('active-count').textContent = filteredData.filter(u=>u.status==='active').length;
  document.getElementById('pending-count').textContent = filteredData.filter(u=>u.status==='pending').length;
}

/* Pagination */
function renderPagination() {
  const container = document.getElementById('pagination-controls');
  if (!container) return;
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  container.innerHTML = '';
  for (let i=1;i<=totalPages;i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = i===currentPage ? 'btn btn-primary' : 'btn btn-secondary';
    btn.addEventListener('click', () => {
      currentPage = i;
      renderDashboardTable();
    });
    container.appendChild(btn);
  }
}

/* Filter & Search */
export function initDashboardFilters() {
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  const clearBtn = document.getElementById('clear-filters');

  if (!searchInput) return;

  const applyFilters = () => {
    const term = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;
    filteredData = dummyUsers.filter(u => {
      const matchesTerm = u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
      const matchesStatus = status ? u.status === status : true;
      return matchesTerm && matchesStatus;
    });
    currentPage = 1;
    renderDashboardTable();
  };

  searchInput.addEventListener('input', debounce(applyFilters, 300));
  statusFilter.addEventListener('change', applyFilters);
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    statusFilter.value = '';
    filteredData = [...dummyUsers];
    currentPage = 1;
    renderDashboardTable();
  });
}

/* ---------- Details page related items ---------- */
export function renderRelatedItems() {
  const list = document.getElementById('related-list');
  if (!list) return;
  const related = dummyUsers.slice(0,5);
  list.innerHTML = related.map(u => `<li>${u.name} – <span class="badge badge-${u.status}">${u.status}</span></li>`).join('');
}

/* ---------- Exported init function ---------- */
export function initData() {
  // Home
  renderActivity();

  // Dashboard
  renderDashboardTable();
  initDashboardFilters();

  // Details
  renderRelatedItems();
}
```

---

**File: `scripts/components.js`**
```js
/* components.js – UI widgets (tabs, modals, accordion, toasts, sortable tables) */
import { formatDate } from './utils.js';

/* ----- Tabs ----- */
export function initTabs() {
  document.querySelectorAll('.tabs').forEach(container => {
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
  });
}

/* ----- Accordion ----- */
export function initAccordion() {
  document.querySelectorAll('.accordion .accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      item.classList.toggle('active');
    });
  });
}

/* ----- Modal ----- */
export function initModals() {
  const openButtons = document.querySelectorAll('[data-action="open-modal"]');
  const closeButtons = document.querySelectorAll('[data-action="close"]');

  openButtons.forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.target));
  });
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal').id));
  });
}

export function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}
export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/* ----- Toasts ----- */
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ----- Sortable Table ----- */
export function initSortableTables() {
  document.querySelectorAll('.data-table').forEach(table => {
    const ths = table.querySelectorAll('th[data-sort]');
    ths.forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const asc = th.classList.toggle('asc');
        th.classList.toggle('desc', !asc);
        rows.sort((a, b) => {
          const av = a.querySelector(`td[data-col="${key}"]`).textContent.trim();
          const bv = b.querySelector(`td[data-col="${key}"]`).textContent.trim();
          return asc
            ? av.localeCompare(bv, undefined, { numeric: true })
            : bv.localeCompare(av, undefined, { numeric: true });
        });
        rows.forEach(r => tbody.appendChild(r));
      });
    });
  });
}

/* ----- Form Validation (Settings page) ----- */
export function initFormValidation() {
  // Profile form
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = profileForm.fullName.value.trim();
      const email = profileForm.email.value.trim();
      if (!name || !email) {
        showToast('Please fill out all required fields.', 'error');
        return;
      }
      showToast('Profile saved successfully.');
    });
  }

  // Security form
  const secForm = document.getElementById('security-form');
  if (secForm) {
    secForm.addEventListener('submit', e => {
      e.preventDefault();
      const pwd = secForm.newPwd.value;
      const cpwd = secForm.confirmPwd.value;
      if (pwd.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
      }
      if (pwd !== cpwd) {
        showToast('Passwords do not match.', 'error');
        return;
      }
      showToast('Password updated.');
    });
  }
}

/* ----- Theme toggle ----- */
export function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  const current = localStorage.getItem('theme') || 'light';
  document.body.dataset.theme = current;
  document.body.className = `theme-${current}`;

  toggle.addEventListener('click', () => {
    const newTheme = document.body.dataset.theme === 'light' ? 'dark' : 'light';
    document.body.dataset.theme = newTheme;
    document.body.className = `theme-${newTheme}`;
    localStorage.setItem('theme', newTheme);
  });
}

/* ----- Mobile navigation toggle ----- */
export function initMobileNav() {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (!navToggle) return;
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}
```

---

**File: `scripts/app.js`**
```js
/* app.js – entry point, component loading, init sequence */
import { loadFragment } from './utils.js';
import { initData } from './data.js';
import {
  initTabs,
  initAccordion,
  initModals,
  initSortableTables,
  initFormValidation,
  initThemeToggle,
  initMobileNav
} from './components.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Load shared navigation and footer
  await loadFragment('../components/nav.html', document.getElementById('nav-placeholder'));
  await loadFragment('../components/footer.html', document.getElementById('footer-placeholder'));

  // After nav/footer are in the DOM, set active link
  const currentPath = location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === currentPath || currentPath.endsWith(href))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Initialize UI widgets
  initTabs();
  initAccordion();
  initModals();
  initSortableTables();
  initFormValidation();
  initThemeToggle();
  initMobileNav();

  // Load dummy data and render page‑specific sections
  initData();
});
```

---

**File: `data/dummy.js`**
```js
// dummy.js – export for potential future use (currently data lives in data.js)
export const users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', status: 'active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', status: 'pending' },
  { id: 3, name: 'Carol Lee', email: 'carol@example.com', status: 'blocked' },
  // … more entries can be added
];
```

---

**File: `assets/.keep`**
```
# This folder is kept to hold future SVGs, images, etc.
```