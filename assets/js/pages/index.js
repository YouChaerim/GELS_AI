document.addEventListener('DOMContentLoaded', function(){
  console.log('[INDEX.JS] === DOM 로드 완료, 스크립트 시작 ===');
  
  const params = new URLSearchParams(location.search);
  const subject = document.getElementById('subject');
  const condition = document.getElementById('condition');
  const sort = document.getElementById('sort');
  const applyBtn = document.getElementById('filterApply');
  
  console.log('[INDEX.JS] DOM 요소 확인:', {
    subject: !!subject,
    condition: !!condition,
    sort: !!sort,
    applyBtn: !!applyBtn
  });

  // Populate subjects from backend (lowercased)
  console.log('[INDEX.JS] 과목 목록 로딩 시작');
  console.log('[INDEX.JS] subject element:', subject);
  console.log('[INDEX.JS] window.data:', window.data);
  console.log('[INDEX.JS] fetchSubjects function:', typeof window.data?.fetchSubjects);
  
  if (subject && window.data && typeof window.data.fetchSubjects === 'function'){
    console.log('[INDEX.JS] fetchSubjects 호출 중...');
    window.data.fetchSubjects().then(function(json){
      console.log('[INDEX.JS] fetchSubjects 성공:', json);
      const cur = (params.get('subject')||'').toLowerCase();
      console.log('[INDEX.JS] 현재 선택된 과목:', cur);
      
      subject.innerHTML = '';
      const optAll = document.createElement('option');
      optAll.value = '';
      optAll.textContent = '전체';
      subject.appendChild(optAll);
      
      (json.items||[]).forEach(function(s){
        console.log('[INDEX.JS] 과목 옵션 추가:', s);
        const opt = document.createElement('option');
        opt.value = s.subject; // lowercased
        opt.textContent = s.subject;
        if (cur && cur === s.subject) opt.selected = true;
        subject.appendChild(opt);
      });
      
      console.log('[INDEX.JS] 과목 목록 로딩 완료, renderGrid 호출');
      // After population, render grid once
      renderGrid();
    }).catch(function(error){ 
      console.error('[INDEX.JS] fetchSubjects 실패:', error);
      renderGrid(); 
    });
  } else {
    console.log('[INDEX.JS] 조건 불만족으로 과목 목록 로딩 건너뜀');
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

  // Build backend params with mapped sort/order
  function buildQuery(){
    let sortKey = 'created_at';
    let orderKey = 'desc';
    if (sort && sort.value){
      if (sort.value === 'price_asc'){ sortKey = 'price_won'; orderKey = 'asc'; }
      else if (sort.value === 'price_desc'){ sortKey = 'price_won'; orderKey = 'desc'; }
    }
    return {
      subject: (subject && subject.value ? subject.value.toLowerCase() : ''),
      condition: (condition && condition.value) || '',
      sort: sortKey,
      order: orderKey,
      page: 1,
      size: 6
    };
  }

  const grid = document.querySelector('[data-role="cardgrid"]');
  const empty = document.querySelector('[data-role="emptystate"]');

  function renderGrid(){
    console.log('[INDEX.JS] === renderGrid 호출 ===');
    console.log('[INDEX.JS] grid element:', grid);
    console.log('[INDEX.JS] window.data:', window.data);
    
    if (!(grid && window.data)) {
      console.log('[INDEX.JS] renderGrid 조건 불만족으로 종료');
      return;
    }
    
    const query = buildQuery();
    console.log('[INDEX.JS] buildQuery 결과:', query);
    
    window.data.fetchPosts(query).then(function(json){
      console.log('[INDEX.JS] fetchPosts 성공:', json);
      const posts = json.items || [];
      console.log('[INDEX.JS] posts 개수:', posts.length);
      
      grid.innerHTML = '';
      if (!posts.length){ 
        console.log('[INDEX.JS] 게시글이 없음, empty state 표시');
        if (empty) empty.hidden = false; 
        return; 
      }
      
      if (empty) empty.hidden = true;
      posts.forEach(function(p, index){
        console.log(`[INDEX.JS] 게시글 ${index + 1} 렌더링:`, p);
        const art = document.createElement('article');
        art.className = 'bl-card';
        const cond = p.cond || p.condition || '';
        art.innerHTML = '<a class="bl-card__title" href="/pages/view.html?id='+p.id+'">'+p.title+'</a>'+
                        '<div class="bl-card__meta">'+(p.author||'')+' | '+(p.subject||'')+'</div>'+
                        '<div><span class="badge">'+cond+'</span> <span class="bl-card__price">'+window.data.priceFormat(p.price_won || p.price)+'</span></div>';
        grid.appendChild(art);
      });
      console.log('[INDEX.JS] 모든 게시글 렌더링 완료');
    }).catch(function(error){ 
      console.error('[INDEX.JS] fetchPosts 실패:', error);
      if (empty) empty.hidden = false; 
    });
  }

  // Initial render if subjects not populated dynamically
  if (!(subject && typeof window.data?.fetchSubjects === 'function')){
    renderGrid();
  }

  // Filter → list page navigation
  if (applyBtn){
    applyBtn.addEventListener('click', function(){
      const next = new URLSearchParams();
      subject && subject.value ? next.set('subject', subject.value.toLowerCase()) : null;
      condition && condition.value ? next.set('condition', condition.value) : null;
      if (sort && sort.value){
        if (sort.value === 'price_asc'){ next.set('sort','price_won'); next.set('order','asc'); }
        else if (sort.value === 'price_desc'){ next.set('sort','price_won'); next.set('order','desc'); }
      }
      location.href = '/pages/list.html' + (next.toString() ? ('?' + next.toString()) : '');
    });
  }

  // Live update grid on select change (better UX)
  [subject, condition, sort].forEach(function(el){
    if (!el) return;
    el.addEventListener('change', renderGrid);
  });
  
  console.log('[INDEX.JS] ✅ 모든 이벤트 리스너 등록 완료');
});


