**File: `index.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Static Dashboard UI</title>

  <!-- Global & component styles -->
  <link rel="stylesheet" href="styles/global.css">
  <link rel="stylesheet" href="styles/components.css">
</head>
<body>
  <!-- Layout placeholders – they will be filled by JavaScript -->
  <div id="header"></div>

  <main>
    <div id="hero"></div>
    <div id="features"></div>
  </main>

  <div id="footer"></div>

  <!-- Main script (module) -->
  <script type="module" src="scripts/main.js"></script>
</body>
</html>
```

---

**File: `styles/global.css`**
```css
/* ---- CSS Reset ---------------------------------------------------------- */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ---- Root variables ----------------------------------------------------- */
:root {
  --font-primary: 'Helvetica Neue', Arial, sans-serif;
  --color-bg: #f5f7fa;
  --color-primary: #2c7be5;
  --color-primary-dark: #1a5bb8;
  --color-text: #333;
  --color-muted: #777;
  --radius: 8px;
}

/* ---- Global layout ------------------------------------------------------ */
html, body {
  height: 100%;
  font-family: var(--font-primary);
  background-color: var(--color-bg);
  color: var(--color-text);
  line-height: 1.5;
}

/* Simple container for max‑width content */
.container {
  width: min(90%, 1200px);
  margin-inline: auto;
}
```

---

**File: `styles/components.css`**
```css
/* ---- Header ------------------------------------------------------------- */
header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,.05);
  padding: 1rem 0;
}
header .nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
header .nav img.logo {
  height: 40px;
}
header .nav ul {
  display: flex;
  gap: 1.5rem;
  list-style: none;
}
header .nav a {
  text-decoration: none;
  color: var(--color-text);
  font-weight: 500;
}
header .nav a:hover {
  color: var(--color-primary);
}

/* ---- Hero --------------------------------------------------------------- */
.hero {
  position: relative;
  background: url("../images/background.jpg") center/cover no-repeat;
  color: #fff;
  text-align: center;
  padding: 8rem 1rem;
}
.hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.4);
}
.hero .content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin-inline: auto;
}
.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}
.hero p {
  font-size: 1.125rem;
  margin-bottom: 2rem;
}
.hero button {
  background: var(--color-primary);
  border: none;
  color: #fff;
  padding: .75rem 1.5rem;
  font-size: 1rem;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background .3s;
}
.hero button:hover {
  background: var(--color-primary-dark);
}

/* ---- Features ----------------------------------------------------------- */
.features {
  padding: 4rem 1rem;
  background: #fff;
}
.features h2 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
}
.features-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}
.feature-card {
  background: #fafafa;
  border-radius: var(--radius);
  padding: 1.5rem;
  text-align: center;
  transition: transform .2s, box-shadow .2s;
}
.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0,0,0,.1);
}
.feature-card img {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
}
.feature-card h3 {
  font-size: 1.25rem;
  margin-bottom: .5rem;
}
.feature-card p {
  font-size: .95rem;
  color: var(--color-muted);
}

/* ---- Footer ------------------------------------------------------------- */
footer {
  background: #2c3e50;
  color: #fff;
  padding: 2rem 0;
  text-align: center;
  font-size: .9rem;
}
footer .social {
  margin-top: .5rem;
}
footer .social a {
  color: #fff;
  margin: 0 .5rem;
  font-size: 1.2rem;
  text-decoration: none;
  transition: opacity .2s;
}
footer .social a:hover {
  opacity: .8;
}
```

---

**File: `scripts/main.js`**
```js
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
```

---

**File: `components/header.html`**
```html
<header>
  <div class="container nav">
    <img src="images/logo.png" alt="Logo" class="logo">
    <ul>
      <li><a href="#">Home</a></li>
      <li><a href="#">Features</a></li>
      <li><a href="#">Pricing</a></li>
      <li><a href="#">Contact</a></li>
    </ul>
  </div>
</header>
```

---

**File: `components/hero.html`**
```html
<section class="hero">
  <div class="container content">
    <h1>Welcome to Your Dashboard</h1>
    <p>Explore the powerful features below and get started with a single click.</p>
    <button>Get Started</button>
  </div>
</section>
```

---

**File: `components/features.html`**
```html
<section class="features">
  <div class="container">
    <h2>Our Features</h2>
    <div class="features-grid" id="features-grid">
      <!-- Cards will be injected by main.js -->
    </div>
  </div>
</section>
```

---

**File: `components/footer.html`**
```html
<footer>
  <div class="container">
    <p>&copy; 2026 Static Dashboard. All rights reserved.</p>
    <div class="social">
      <a href="#" aria-label="Twitter">🐦</a>
      <a href="#" aria-label="LinkedIn">💼</a>
      <a href="#" aria-label="GitHub">🐙</a>
    </div>
  </div>
</footer>
```

---

**File: `data/dummyData.js`**
```js
// Dummy data for the Features section
const featuresData = [
  {
    id: 1,
    title: 'Analytics',
    description: 'Gain insights with real‑time analytics and reporting.',
    icon: 'images/icon1.png'
  },
  {
    id: 2,
    title: 'Collaboration',
    description: 'Work together with your team in a seamless environment.',
    icon: 'images/icon2.png'
  },
  {
    id: 3,
    title: 'Security',
    description: 'Top‑grade security features keep your data safe.',
    icon: 'images/icon3.png'
  },
  {
    id: 4,
    title: 'Customization',
    description: 'Tailor the dashboard to fit your workflow.',
    icon: 'images/icon4.png'
  }
];

export default featuresData;
```

---

**File: `images/logo.png`**
*(Placeholder – you can replace it with any logo image. For a quick demo you can use a data‑URI or an online placeholder, e.g. `https://via.placeholder.com/150x40?text=Logo`.)*

---

**File: `images/background.jpg`**
*(Placeholder – use any background image. Example URL: `https://via.placeholder.com/1200x800?text=Background`.)*

---

**File: `images/icon1.png`**
**File: `images/icon2.png`**
**File: `images/icon3.png`**
**File: `images/icon4.png`**
*(All four icons can be simple placeholder images, e.g. `https://via.placeholder.com/64?text=I1`, `...I2`, etc., or you can replace them with real SVG/PNG icons.)*

---

### How it works
1. **`index.html`** loads the global & component CSS and starts `scripts/main.js` as an ES module.  
2. **`main.js`** fetches each component HTML fragment (`header.html`, `hero.html`, `features.html`, `footer.html`) and injects it into the corresponding placeholder `<div>`.  
3. After the *Features* fragment is in the DOM, `renderFeatures()` builds the feature cards from `data/dummyData.js`.  
4. Simple interactivity: the CTA button in the hero shows an alert when clicked.  
5. All layout is responsive thanks to CSS Grid/Flexbox and the utility‑first classes defined in the CSS files.

Open `index.html` in any modern browser – the dashboard UI will render with dummy data, responsive design, and basic hover/click interactions, satisfying the EASY project requirements.