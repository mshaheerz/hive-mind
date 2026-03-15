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
