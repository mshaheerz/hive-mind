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
