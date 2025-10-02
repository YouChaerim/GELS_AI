(function(){
  const storageKey = 'bookloop_checklist';
  const list = document.querySelector('[data-role="checklist"]');
  const clearBtn = document.getElementById('checklistClear');

  function loadState(){
    try{ return JSON.parse(localStorage.getItem(storageKey) || '{}'); }catch{ return {}; }
  }
  function saveState(state){
    try{ localStorage.setItem(storageKey, JSON.stringify(state)); }catch{}
  }

  const state = loadState();
  if (list){
    list.querySelectorAll('input[type="checkbox"]').forEach(function(cb){
      const key = cb.getAttribute('data-key');
      if (key && state[key]) cb.checked = true;
      cb.addEventListener('change', function(){
        if (!key) return;
        state[key] = !!cb.checked;
        saveState(state);
      });
    });
  }

  if (clearBtn){
    clearBtn.addEventListener('click', function(){
      list.querySelectorAll('input[type="checkbox"]').forEach(function(cb){ cb.checked = false; });
      saveState({});
    });
  }
})();


