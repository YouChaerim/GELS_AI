(function(){
  const params = new URLSearchParams(location.search);
  const subject = document.getElementById('subject');
  const condition = document.getElementById('condition');
  const sort = document.getElementById('sort');
  const applyBtn = document.getElementById('filterApply');

  // Populate subjects from backend (guard if function missing)
  if (subject && window.data && typeof window.data.fetchSubjects === 'function'){
    window.data.fetchSubjects().then(function(json){
      const cur = (params.get('subject')||'').toLowerCase();
      subject.innerHTML = '';
      const optAll = document.createElement('option');
      optAll.value = '';
      optAll.textContent = '전체';
      subject.appendChild(optAll);
      (json.items||[]).forEach(function(s){
        const opt = document.createElement('option');
        opt.value = s.subject; // lowercased
        opt.textContent = s.subject;
        if (cur && cur === s.subject) opt.selected = true;
        subject.appendChild(opt);
      });
    }).catch(function(){ /* ignore */ });
  }

  // Initialize controls from URL
  if (subject && params.get('subject')) subject.value = params.get('subject');
  if (condition && params.get('condition')) condition.value = params.get('condition');
  // Reflect backend sort/order to UI single select
  (function(){
    const s = params.get('sort');
    const o = (params.get('order')||'').toLowerCase();
    if (sort){
      if (s === 'price_won'){
        sort.value = (o === 'asc') ? 'price_asc' : 'price_desc';
      }
    }
  })();

  // Apply button → build correct sort/order
  if (applyBtn){
    applyBtn.addEventListener('click', function(){
      const next = new URLSearchParams(location.search);
      subject && subject.value ? next.set('subject', subject.value.toLowerCase()) : next.delete('subject');
      condition && condition.value ? next.set('condition', condition.value) : next.delete('condition');

      if (sort && sort.value){
        if (sort.value === 'price_asc'){ next.set('sort','price_won'); next.set('order','asc'); }
        else if (sort.value === 'price_desc'){ next.set('sort','price_won'); next.set('order','desc'); }
        else { next.delete('sort'); next.delete('order'); }
      } else { next.delete('sort'); next.delete('order'); }

      next.delete('page');
      location.search = next.toString();
    });
  }

  // Success banner
  (function(){
    if (params.get('created') === '1'){
      const banner = document.createElement('div');
      banner.className = 'bl-success';
      banner.textContent = '게시글이 등록되었습니다.';
      document.body.prepend(banner);
      setTimeout(function(){ banner.remove(); }, 3000);
    }
  })();

  const tbody = document.querySelector('[data-role="tbody"]');
  const empty = document.querySelector('[data-role="emptystate"]');
  const pager = document.querySelector('[data-role="pagination"]');

  function render(items){
    if (!tbody || !empty) return;
    tbody.innerHTML = '';
    if (!items.length){ empty.hidden = false; return; }
    empty.hidden = true;
    items.forEach(function(p){
      const tr = document.createElement('tr');
      const cond = p.cond || p.condition || '';
      tr.innerHTML = '<td><a href="/pages/view.html?id='+p.id+'">'+p.title+'</a></td>'+
                     '<td>'+(p.author||'')+'</td>'+
                     '<td>'+(p.subject||'')+'</td>'+
                     '<td>'+cond+'</td>'+
                     '<td>'+window.data.priceFormat(p.price_won || p.price)+'</td>';
      tbody.appendChild(tr);
    });
  }

  // Build backend params with mapped sort/order
  function buildQuery(){
    const qSort = params.get('sort');
    const qOrder = (params.get('order')||'').toLowerCase();
    let sortKey = 'created_at';
    let orderKey = 'desc';
    if (qSort === 'price_won'){
      sortKey = 'price_won';
      orderKey = (qOrder === 'asc') ? 'asc' : 'desc';
    }
    return {
      q: params.get('q')||'',
      subject: (params.get('subject')||'').toLowerCase(),
      condition: params.get('condition')||'',
      sort: sortKey,
      order: orderKey,
      page: params.get('page')||1,
      size: 20
    };
  }

  if (window.data){
    window.data.fetchPosts(buildQuery()).then(function(json){
      render(json.items || []);
      if (pager && window.pagination){
        window.pagination.render(pager, Number(json.page||1), Math.max(1, Math.ceil((json.total||0)/(json.size||20))));
      }
    }).catch(function(){ if (empty) empty.hidden = false; });
  }
})();


