/* -------------------------------------------------
   Tabs Component
   ------------------------------------------------- */
function initTabs(container) {
  const tabs = container.querySelectorAll('[data-tab]');
  const panels = container.querySelectorAll('[data-panel]');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const target = container.querySelector(`[data-panel="${tab.dataset.tab}"]`);
      if (target) target.classList.add('active');
    });
  });
}
