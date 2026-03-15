/* -------------------------------------------------
   Modal handling (open / close)
   ------------------------------------------------- */
document.addEventListener('click', e => {
  // Open modal via data-open attribute
  const openBtn = e.target.closest('[data-open]');
  if (openBtn) {
    const id = openBtn.dataset.open;
    openModal(id);
  }

  // Close modal via data-close attribute
  const closeBtn = e.target.closest('[data-close]');
  if (closeBtn) {
    const id = closeBtn.dataset.close;
    closeModal(id);
  }
});

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}
