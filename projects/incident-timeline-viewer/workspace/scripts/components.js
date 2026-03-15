/* components.js – reusable UI widgets */

/* ---------- Tabs ---------- */
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

/* ---------- Modal ---------- */
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('click', e => {
  if (e.target.matches('[data-close]')) {
    const modal = e.target.closest('.modal');
    if (modal) closeModal(modal.id);
  }
});

/* ---------- Toast ---------- */
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

/* ---------- Sortable Table ---------- */
function initSortableTable(table) {
  const ths = table.querySelectorAll('th[data-sort]');
  ths.forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      const rows = [...table.querySelectorAll('tbody tr')];
      const asc = th.classList.toggle('asc');
      th.classList.toggle('desc', !asc);
      rows.sort((a, b) => {
        const aText = a.querySelector(`td[data-col="${key}"]`).textContent.trim();
        const bText = b.querySelector(`td[data-col="${key}"]`).textContent.trim();
        // Numeric comparison if possible
        const aNum = parseFloat(aText);
        const bNum = parseFloat(bText);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return asc ? aNum - bNum : bNum - aNum;
        }
        return asc ? aText.localeCompare(bText) : bText.localeCompare(aText);
      });
      const tbody = table.querySelector('tbody');
      rows.forEach(r => tbody.appendChild(r));
    });
  });
}

/* ---------- Accordion ---------- */
function initAccordion(container) {
  container.querySelectorAll('[data-accordion]').forEach(btn => {
    btn.addEventListener('click', () => {
      const body = btn.nextElementSibling;
      const isOpen = body.classList.toggle('open');
      // Close others
      container.querySelectorAll('.accordion-body').forEach(b => {
        if (b !== body) b.classList.remove('open');
      });
    });
  });
}

/* ---------- Simple Email Validator ---------- */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
