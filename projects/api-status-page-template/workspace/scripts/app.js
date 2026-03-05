/* Main application bootstrap – same as previously described */
import { loadComponent } from "./utils.js";
import {
  initTabs,
  initModals,
  initSortableTable,
  initSearch,
  initAccordions,
  initFormValidation,
  initThemeToggle,
  showToast
} from "./components.js";

async function loadShared() {
  const [navHTML, footerHTML] = await Promise.all([
    loadComponent("/components/nav.html"),
    loadComponent("/components/footer.html")
  ]);
  document.getElementById("nav-placeholder").innerHTML = navHTML;
  document.getElementById("footer-placeholder").innerHTML = footerHTML;

  // Activate current nav link
  document.querySelectorAll(".nav-link").forEach(link => {
    const href = link.getAttribute("href");
    if (location.pathname.endsWith(href) || (href === "/index.html" && location.pathname === "/")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Mobile nav toggle
  const toggleBtn = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  toggleBtn?.addEventListener("click", () => navLinks.classList.toggle("open"));
}

function initPage() {
  const page = document.body.dataset.page;

  // Global theme toggle (present on all pages)
  initThemeToggle("#theme-toggle");

  // Initialize shared modals
  initModals();

  switch (page) {
    case "dashboard":
      initSortableTable(document.getElementById("users-table"));
      initSearch("#search-input", "#users-table");
      break;
    case "details":
      const tabs = document.querySelector(".tabs");
      if (tabs) initTabs(tabs);
      break;
    case "settings":
      initFormValidation("#settings-form");
      break;
    case "about":
      initAccordions();
      break;
    default:
      // home page – nothing extra needed
      break;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadShared();
  initPage();
});
