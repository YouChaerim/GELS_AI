(function(){
  function openModal(id){ const el = document.getElementById(id); if (el) el.classList.add('is-open'); }
  function closeModal(id){ const el = document.getElementById(id); if (el) el.classList.remove('is-open'); }
  window.modal = { open: openModal, close: closeModal };
  document.addEventListener('click', function(e){
    const openBtn = e.target.closest('[data-modal-open]');
    if (openBtn){ openModal(openBtn.getAttribute('data-modal-open')); }
    const closeBtn = e.target.closest('[data-modal-close]');
    if (closeBtn){ closeModal(closeBtn.getAttribute('data-modal-close')); }
  });
})();


