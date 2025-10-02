(function(){
  const form = document.querySelector('.bl-quicksearch');
  if (!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    const q = new FormData(form).get('q') || '';
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    location.href = '/pages/list.html' + (params.toString() ? ('?' + params.toString()) : '');
  });
})();


