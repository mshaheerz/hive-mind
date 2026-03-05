/* Utility helpers */
export function loadComponent(url) {
  return fetch(url).then(r => r.text());
}

/* Debounce helper */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* Simple date formatter (optional) */
export function formatDate(str) {
  const d = new Date(str);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}
