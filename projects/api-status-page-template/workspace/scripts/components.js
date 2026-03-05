/* Component logic – identical to the one described earlier */
import { debounce } from "./utils.js";

export function initTabs(container) {
  const tabs = container.querySelectorAll("[data-tab]");
  const panels = container.querySelectorAll("[data-panel]");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      const panel = container.querySelector(`[data-panel="${tab.dataset.tab}"]`);
      if (panel) panel.classList.add("active");
    });
  });
}

export function initModals() {
  document.querySelectorAll("[data-modal-open]").forEach(btn => {
    const target = btn.dataset.modalOpen;
    btn.addEventListener("click", () => openModal(target));
  });
  document.querySelectorAll(".modal .close-btn").forEach(btn => {
    const modal = btn.closest(".modal");
    btn.addEventListener("click", () => closeModal(modal.id));
  });
}
export function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
}
export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
}

export function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function initSortableTable(table) {
  const ths = table.querySelectorAll("th[data-sort]");
  ths.forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      const rows = Array.from(table.querySelectorAll("tbody tr"));
      const asc = !th.classList.toggle("asc");
      rows.sort((a, b) => {
        const aText = a.querySelector(`td[data-col="${key}"]`).textContent.trim();
        const bText = b.querySelector(`td[data-col="${key}"]`).textContent.trim();
        return asc
          ? aText.localeCompare(bText, undefined, { numeric: true })
          : bText.localeCompare(aText, undefined, { numeric: true });
      });
      // Reset other headers
      ths.forEach(h => {
        if (h !== th) h.classList.remove("asc", "desc");
      });
      th.classList.toggle("desc", !asc);
      const tbody = table.querySelector("tbody");
      rows.forEach(r => tbody.appendChild(r));
    });
  });
}

export function initSearch(inputSel, tableSel) {
  const input = document.querySelector(inputSel);
  const table = document.querySelector(tableSel);
  if (!input || !table) return;
  const rows = Array.from(table.querySelectorAll("tbody tr"));
  const filter = debounce(() => {
    const term = input.value.toLowerCase();
    rows.forEach(row => {
      const txt = row.textContent.toLowerCase();
      row.style.display = txt.includes(term) ? "" : "none";
    });
  }, 200);
  input.addEventListener("input", filter);
}

export function initAccordions() {
  document.querySelectorAll(".accordion-header").forEach(header => {
    header.addEventListener("click", () => {
      const body = header.nextElementSibling;
      body.classList.toggle("open");
    });
  });
}

export function initFormValidation(formSel) {
  const form = document.querySelector(formSel);
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const required = form.querySelectorAll("[required]");
    let ok = true;
    required.forEach(inp => {
      if (!inp.value.trim()) {
        ok = false;
        inp.classList.add("invalid");
        const err = document.createElement("div");
        err.className = "text-danger mt-1";
        err.textContent = "This field is required.";
        if (!inp.nextElementSibling?.classList.contains("text-danger")) {
          inp.parentNode.insertBefore(err, inp.nextSibling);
        }
      } else {
        inp.classList.remove("invalid");
        if (inp.nextElementSibling?.classList.contains("text-danger")) {
          inp.nextElementSibling.remove();
        }
      }
    });
    if (ok) {
      showToast("Settings saved!", "success");
      form.reset();
    } else {
      showToast("Please fix errors.", "danger");
    }
  });
}

export function initThemeToggle(toggleSel) {
  const toggle = document.querySelector(toggleSel);
  if (!toggle) return;
  toggle.addEventListener("change", () => {
    document.documentElement.classList.toggle("dark", toggle.checked);
    localStorage.setItem("theme", toggle.checked ? "dark" : "light");
  });
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    toggle.checked = true;
    document.documentElement.classList.add("dark");
  }
}
