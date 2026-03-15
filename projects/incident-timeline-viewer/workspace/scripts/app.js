/* app.js – loads shared components and sets active nav link */
document.addEventListener('DOMContentLoaded', () => {
  // Load navigation
  fetch('components/nav.html')
    .then(r => r.text())
    .then(html => {
      document.getElementById('nav').innerHTML = html;
      setActiveNav();
      initMobileNav();
    })
    .catch(console.error);

  // Load footer
  fetch('components/footer.html')
    .then(r => r.text())
    .then(html => {
      document.getElementById('footer').innerHTML = html;
    })
    .catch(console.error);
});

/* Highlight active navigation link */
function setActiveNav() {
  const path = location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (path.endsWith(href) || (href === '/index.html' && path === '/')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/* Mobile hamburger toggle */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });
}
