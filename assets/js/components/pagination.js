(function(){
  function renderPagination(container, page, totalPages){
    container.innerHTML = '';
    for (let p=1; p<=totalPages; p++){
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'bl-page';
      btn.textContent = String(p);
      if (p === page) btn.setAttribute('aria-current', 'page');
      btn.addEventListener('click', function(){
        const params = new URLSearchParams(location.search);
        params.set('page', String(p));
        location.search = params.toString();
      });
      li.appendChild(btn);
      container.appendChild(li);
    }
  }
  window.pagination = { render: renderPagination };
})();


