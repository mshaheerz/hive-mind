/* utils.js – helper functions used across the app */

/**
 * Load an HTML fragment into a container element.
 * @param {string} url - Path to the HTML fragment.
 * @param {HTMLElement} container - Element where the fragment will be inserted.
 * @returns {Promise<void>}
 */
export async function loadFragment(url, container) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to load ${url}`);
  const html = await resp.text();
  container.innerHTML = html;
}

/**
 * Simple debounce implementation.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Format a date string as YYYY‑MM‑DD.
 * @param {string|Date} d
 * @returns {string}
 */
export function formatDate(d) {
  const date = new Date(d);
  return date.toISOString().split('T')[0];
}
