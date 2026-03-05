"use strict";
const Agent = require("../core/agent");
const { loadApplicableSkills } = require("./utils");

class ForgeAgent extends Agent {
  constructor() {
    super(
      "forge",
      "FORGE",
      `You are FORGE, the Lead Developer. You build based on the PROJECT LEVEL:
- **EASY (Template)**:
  - Tech: Vanilla HTML, CSS, JavaScript ONLY. No build tools, no frameworks.
  - RULE: You MUST build a MULTI-PAGE, PRODUCTION-QUALITY static site. NOT a single-page placeholder.
  - MINIMUM REQUIREMENTS for EASY level:
    • At least 4-6 separate HTML pages (e.g. index.html, about.html, dashboard.html, settings.html, contact.html, etc.)
    • Shared navigation that links ALL pages together with active-state highlighting
    • A shared header/nav and footer included on EVERY page (via JS component loader or copy)
    • Rich, realistic dummy data — tables, charts (CSS-only or inline SVG), stats cards, lists, forms
    • Proper page-specific content: each page must have UNIQUE, SUBSTANTIAL content (not just a heading)
    • Interactive elements: working forms (with JS validation), modals, tabs, toggles, accordions, search/filter
    • CSS Grid AND Flexbox layouts, responsive design with mobile nav
    • CSS custom properties for theming, smooth transitions/animations
    • Realistic typography hierarchy, proper spacing, polished color scheme
    • Loading states, empty states, error states where appropriate
    • Organized file structure: pages/, components/, styles/, scripts/, data/, assets/
  - DO NOT generate a generic landing page. Build the ACTUAL application the project describes.
- **MEDIUM (Template)**:
  - Tech: React + Tailwind CSS.
  - RULE: Build polished, production-ready React components with dummy data. Multiple routes/views. DO NOT output an empty boilerplate.
- **ADVANCED (Full-Stack)**:
  - Tech: Next.js (App Router), Tailwind CSS, Lucide Icons.
  - RULE: Implement real API routes, server actions, and full application logic.

Handoff format: Use **File: \`path/to/file.ext\`** + \`\`\`language for every file. Deliver COMPLETE, FULL code for every file — not snippets, not placeholders. Constraint: Use .jsx for React; .js for Vanilla.
`,
    );
  }

  async implement(
    task,
    architecture = "",
    researchNotes = "",
    level = "medium",
  ) {
    let skillKeys = ["nextjs", "react", "tailwind", "clean-code"];
    if (level === "easy")
      skillKeys = ["html", "css", "javascript", "web-design"];
    if (level === "medium") skillKeys = ["react", "tailwind", "components"];

    const skills = loadApplicableSkills(skillKeys, 3);

    let levelGuidance = "";
    if (level === "easy") {
      levelGuidance = `
CRITICAL — EASY LEVEL STRUCTURE REQUIREMENTS:
You are building a COMPLETE multi-page static site. Follow this structure:

1. FILE STRUCTURE:
   pages/          — All HTML pages (index.html at root, others in pages/)
   components/     — Reusable HTML fragments (nav.html, footer.html, sidebar.html)
   styles/         — CSS files (global.css, components.css, pages.css, utilities.css)
   scripts/        — JS files (app.js, router.js, components.js, data.js)
   data/           — Dummy data files (*.js exports)
   assets/         — SVG icons, images (use inline SVG or CDN placeholders)

2. PAGES (generate ALL of these, each with REAL content):
   - index.html — Main dashboard/home with summary stats, recent activity, quick actions
   - pages/dashboard.html — Detailed view with data tables, charts, filters
   - pages/settings.html — Settings/config page with forms, toggles, sections
   - pages/details.html — Detail/item view page with rich content layout
   - pages/about.html — About/info page with team, features, FAQ accordion

3. EVERY PAGE MUST HAVE:
   - Full navigation bar with links to ALL pages, active state for current page
   - Footer with links and info
   - Page-specific substantial content (NOT just a title)
   - Responsive layout that works on mobile
   - Realistic dummy data that matches the project theme

4. INTERACTIVE FEATURES (implement at least 4):
   - Search/filter functionality on data
   - Tab switching between views
   - Modal dialogs (open/close)
   - Form validation with error messages
   - Sortable tables
   - Toggle switches / accordion panels
   - Theme toggle (light/dark)
   - Toast notifications

5. VISUAL QUALITY:
   - Professional color palette with CSS custom properties
   - Proper typography scale (headings, body, captions)
   - Card-based layouts with shadows, borders, hover effects
   - Status badges, progress bars, metric cards
   - Smooth CSS transitions and subtle animations
   - Mobile hamburger menu

Generate EVERY file with COMPLETE code. No TODOs, no placeholders, no "add more here" comments.`;
    }

    const prompt = `Implement this task:\nProject Level: ${level.toUpperCase()}\nTask: ${task}\nArch: ${architecture}\nNotes: ${researchNotes}\n${levelGuidance}\n${skills}\n\nDeliver full files matching the ${level.toUpperCase()} tech stack requirements. Use **File: \`path\`** header format.`;
    this.print(`Implementing (${level}): ${task.slice(0, 50)}...`);
    return await this.think(prompt, [], {
      tier: level === "advanced" ? "advanced" : "standard",
      maxTokens: level === "easy" ? 16384 : undefined,
    });
  }
}

module.exports = ForgeAgent;
