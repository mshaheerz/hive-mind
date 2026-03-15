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
