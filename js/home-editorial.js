/* Homepage-only art-direction comparison; does not modify the journal or stored data. */
(() => {
  const controls = document.querySelectorAll('[data-photo]');
  controls.forEach(button => button.addEventListener('click', () => {
    document.body.dataset.photoMode = button.dataset.photo;
    controls.forEach(control => control.setAttribute('aria-pressed',String(control === button)));
  }));
})();
