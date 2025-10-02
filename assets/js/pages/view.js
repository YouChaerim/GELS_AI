document.addEventListener('DOMContentLoaded', function(){
  console.log('[VIEW.JS] === DOM 로드 완료, 상세 페이지 스크립트 시작 ===');
  const params = new URLSearchParams(location.search);
  const id = Number(params.get('id') || 1);
  console.log('[VIEW.JS] 게시글 ID:', id);
  let currentPost = null;

  function setText(selector, text){ const el = document.querySelector(selector); if (el) el.textContent = text; }

  if (window.data){
    console.log('[VIEW.JS] window.data 확인됨, 게시글 상세 정보 로딩 시작');
    window.data.fetchPostDetail(id, { inc: 1 }).then(function(json){
      console.log('[VIEW.JS] fetchPostDetail 응답:', json);
      const post = json.item;
      if (!post) {
        console.error('[VIEW.JS] ❌ 게시글 데이터가 없음');
        return;
      }
      
      console.log('[VIEW.JS] ✅ 게시글 데이터 로드 성공:', {
        id: post.id,
        title: post.title,
        author: post.author,
        subject: post.subject,
        views: post.views
      });
      
      currentPost = post;

      setText('#postTitle', post.title);
      const meta = document.querySelector('.bl-view__meta');
      const cond = post.cond || post.condition || '';
      if (meta){ 
        meta.innerHTML = '<span class="badge">'+cond+'</span> <span class="bl-view__views">조회수 '+post.views+'</span>';
        console.log('[VIEW.JS] 메타 정보 업데이트 완료 (상태:', cond, ', 조회수:', post.views, ')');
      }

      const facts = document.querySelector('.bl-view__facts');
      if (facts){
        facts.innerHTML = '<div><dt>저자</dt><dd>'+(post.author||'')+'</dd></div>'+
                          '<div><dt>과목</dt><dd>'+post.subject+'</dd></div>'+
                          '<div><dt>희망가</dt><dd><strong>'+window.data.priceFormat(post.price_won)+'</strong></dd></div>'+
                          '<div><dt>등록일</dt><dd>'+post.created_at+'</dd></div>'+
                          '<div><dt>닉네임</dt><dd>'+post.nickname+'</dd></div>';
        console.log('[VIEW.JS] 게시글 정보 테이블 업데이트 완료');
      }

      setText('.bl-view__text', post.content);
      console.log('[VIEW.JS] 게시글 내용 업데이트 완료');

      const contact = document.querySelector('.bl-view__contact ul');
      if (contact){
        contact.innerHTML = '<li>'+post.contact+'</li>';
        console.log('[VIEW.JS] 연락처 정보 업데이트 완료:', post.contact);
      }

      const comments = document.querySelector('[data-role="comments"]');
      const empty = document.querySelector('[data-role="comments-empty"]');
      if (comments && empty){
        comments.innerHTML = '';
        empty.hidden = false;
        console.log('[VIEW.JS] 댓글 영역 초기화 완료 (빈 상태 표시)');
      }
      
      console.log('[VIEW.JS] ✅ 모든 페이지 요소 업데이트 완료');
    }).catch(function(error){
      console.error('[VIEW.JS] ❌ 게시글 상세 정보 로딩 실패:', error);
    });
  } else {
    console.error('[VIEW.JS] ❌ window.data가 없음, API 호출 불가');
  }

  const form = document.querySelector('.bl-commentform');
  if (form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const fd = new FormData(form);
      const nickname = (fd.get('nickname')||'').toString().trim();
      const password = (fd.get('password')||'').toString();
      const content = (fd.get('content')||'').toString().trim();
      if (!nickname || !password || !content){
        alert('닉네임, 비밀번호, 내용을 입력해주세요.');
        return;
      }
      alert('댓글 저장은 추후 백엔드 연동 시 적용됩니다.');
    });
  }

  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-reply]');
    if (!btn) return;
    const host = btn.closest('li');
    if (!host) return;
    if (host.querySelector('.bl-replyform')){
      host.querySelector('.bl-replyform textarea')?.focus();
      return;
    }
    const rf = document.createElement('form');
    rf.className = 'bl-replyform';
    rf.innerHTML = '<div class="bl-commentform__row">'+
                   '<input type="text" name="nickname" placeholder="닉네임">'+
                   '<input type="password" name="password" placeholder="댓글 비밀번호">'+
                   '</div>'+
                   '<textarea name="content" rows="3" placeholder="답글 내용"></textarea>'+
                   '<div class="bl-commentform__actions"><button class="btn btn--primary" type="submit">답글 등록</button></div>';
    rf.addEventListener('submit', function(ev){
      ev.preventDefault();
      const fd = new FormData(rf);
      const nickname = (fd.get('nickname')||'').toString().trim();
      const password = (fd.get('password')||'').toString();
      const content = (fd.get('content')||'').toString().trim();
      if (!nickname || !password || !content){ alert('닉네임, 비밀번호, 내용을 입력해주세요.'); return; }
      alert('답글 저장은 추후 백엔드 연동 시 적용됩니다.');
    });
    host.appendChild(rf);
    rf.querySelector('textarea')?.focus();
  });

  const editBtn = document.getElementById('editBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const passwordForm = document.getElementById('passwordForm');
  let pendingAction = null;

  console.log('[VIEW.JS] 버튼 요소 확인:', {
    editBtn: !!editBtn,
    deleteBtn: !!deleteBtn,
    passwordForm: !!passwordForm
  });

  function showPasswordModal(action){ 
    console.log('[VIEW.JS] === 비밀번호 모달 표시 ===');
    console.log('[VIEW.JS] 액션:', action);
    pendingAction = action; 
    if (window.modal) {
      window.modal.open('passwordModal');
      console.log('[VIEW.JS] 비밀번호 모달 열기 완료');
    } else {
      console.error('[VIEW.JS] ❌ window.modal이 없음');
    }
  }
  
  function verifyPasswordAndPerform(password){
    if (!currentPost || !pendingAction) return;
    
    if (pendingAction === 'edit'){
      console.log('[VIEW.JS] === 비밀번호 검증 시작 ===');
      console.log('[VIEW.JS] 게시글 ID:', currentPost.id);
      console.log('[VIEW.JS] 액션:', pendingAction);
      
      // Show loading feedback
      const submitBtn = document.querySelector('#passwordForm button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.textContent = '확인 중...';
        submitBtn.disabled = true;
      }
      
      // Use a simple approach: try to "delete" but don't actually delete
      // This will verify the password using existing delete API
      const formData = new FormData();
      formData.append('id', currentPost.id);
      formData.append('password', password);
      formData.append('verify_only', '1'); // Special flag to only verify, not delete
      
      console.log('[VIEW.JS] 서버로 비밀번호 검증 요청 전송 중...');
      
      fetch('/api/posts/delete.php', {
        method: 'POST',
        body: formData
      })
      .then(function(response){ return response.text(); })
      .then(function(text){
        console.log('[VIEW.JS] 서버 응답 받음:', text);
        
        // Restore button state
        if (submitBtn) {
          submitBtn.textContent = originalText || '확인';
          submitBtn.disabled = false;
        }
        
        try {
          const json = JSON.parse(text);
          console.log('[VIEW.JS] 비밀번호 검증 결과:', json);
          
          if (json.ok || json.verified){
            console.log('[VIEW.JS] ✅ 비밀번호 검증 성공, 수정 페이지로 이동');
            // Password is correct, redirect to edit page with auth token
            // Generate a simple timestamp-based token for this session
            const authToken = btoa(currentPost.id + ':' + password + ':' + Date.now());
            console.log('[VIEW.JS] 인증 토큰 생성 완료, 리다이렉트 중...');
            location.href = '/pages/write.html?edit=' + currentPost.id + '&auth=' + authToken;
          } else {
            console.error('[VIEW.JS] ❌ 비밀번호 검증 실패:', json);
            alert(json.error.message || '비밀번호가 일치하지 않습니다.');
            if (json.error._debug) {
              console.log('[VIEW.JS] 디버그 정보:', json.error._debug);
            }
          }
        } catch (e) {
          console.error('[VIEW.JS] ❌ JSON 파싱 오류:', e);
          console.error('[VIEW.JS] 원본 응답:', text);
          alert('서버 응답 오류: ' + text.substring(0, 200));
        }
      })
      .catch(function(err){
        console.error('[VIEW.JS] ❌ 네트워크 오류:', err);
        
        // Restore button state on error
        if (submitBtn) {
          submitBtn.textContent = originalText || '확인';
          submitBtn.disabled = false;
        }
        
        alert('네트워크 오류가 발생했습니다.');
      });
      return;
    }
    
    if (pendingAction === 'delete'){
      if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
      
      const formData = new FormData();
      formData.append('id', currentPost.id);
      formData.append('password', password);
      
      fetch('/api/posts/delete.php', {
        method: 'POST',
        body: formData
      })
      .then(function(response){ return response.json(); })
      .then(function(json){
        if (json.ok){
          alert('게시글이 삭제되었습니다.');
          location.href = '/pages/list.html';
        } else {
          console.error('Delete failed:', json);
          alert(json.error.message || '삭제 중 오류가 발생했습니다.');
          if (json.error._debug) {
            console.log('Debug info:', json.error._debug);
          }
        }
      })
      .catch(function(){
        alert('네트워크 오류가 발생했습니다.');
      });
    }
  }

  if (editBtn){ 
    editBtn.addEventListener('click', function(){ 
      console.log('[VIEW.JS] 🔧 수정 버튼 클릭됨');
      showPasswordModal('edit'); 
    }); 
    console.log('[VIEW.JS] ✅ 수정 버튼 이벤트 리스너 등록 완료');
  } else {
    console.log('[VIEW.JS] ❌ 수정 버튼을 찾을 수 없음');
  }
  
  if (deleteBtn){ 
    deleteBtn.addEventListener('click', function(){ 
      console.log('[VIEW.JS] 🗑️ 삭제 버튼 클릭됨');
      showPasswordModal('delete'); 
    }); 
    console.log('[VIEW.JS] ✅ 삭제 버튼 이벤트 리스너 등록 완료');
  } else {
    console.log('[VIEW.JS] ❌ 삭제 버튼을 찾을 수 없음');
  }
  
  if (passwordForm){ 
    passwordForm.addEventListener('submit', function(e){ 
      e.preventDefault(); 
      console.log('[VIEW.JS] === 비밀번호 폼 제출 ===');
      const pw = new FormData(passwordForm).get('password'); 
      console.log('[VIEW.JS] 입력된 비밀번호 길이:', pw ? pw.length : 0);
      console.log('[VIEW.JS] 대기 중인 액션:', pendingAction);
      
      if (window.modal) {
        window.modal.close('passwordModal');
        console.log('[VIEW.JS] 비밀번호 모달 닫기 완료');
      }
      verifyPasswordAndPerform(pw); 
    }); 
    console.log('[VIEW.JS] ✅ 비밀번호 폼 이벤트 리스너 등록 완료');
  } else {
    console.log('[VIEW.JS] ❌ 비밀번호 폼을 찾을 수 없음');
  }
  
  console.log('[VIEW.JS] ✅ 모든 이벤트 리스너 등록 완료');
});


