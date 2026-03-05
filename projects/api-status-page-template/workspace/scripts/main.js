// ---------------------------------------------------------------
// Main entry point (module)
// ---------------------------------------------------------------
import featuresData from '../data/dummyData.js';

/**
 * Load an HTML fragment from the ./components folder and inject it
 * into the element with the given id.
 */
async function loadComponent(id, filename) {
  const resp = await fetch(`components/${filename}`);
  const html = await resp.text();
  document.getElementById(id).innerHTML = html;
}

/**
 * Render the feature cards using the dummy data.
 */
function renderFeatures() {
  const grid = document.getElementById('features-grid');
  if (!grid) return;

  const cardsHTML = featuresData.map(f => `
    <div class="feature-card">
      <img src="${f.icon}" alt="${f.title} icon">
      <h3>${f.title}</h3>
      <p>${f.description}</p>
    </div>
  `).join('');
  grid.innerHTML = cardsHTML;
}

/**
 * Initialise interactive behaviours (e.g. hero button).
 */
function initInteractions() {
  const ctaBtn = document.querySelector('.hero button');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      alert('CTA button clicked! 🎉');
    });
  }
}

/**
 * Bootstrap the page – load components, then populate data.
 */
async function bootstrap() {
  await Promise.all([
    loadComponent('header', 'header.html'),
    loadComponent('hero',   'hero.html'),
    loadComponent('features','features.html'),
    loadComponent('footer', 'footer.html')
  ]);

  renderFeatures();
  initInteractions();
}

// Run the bootstrap once the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
