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
