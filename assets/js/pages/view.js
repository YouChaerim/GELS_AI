(function(){
  const params = new URLSearchParams(location.search);
  const id = Number(params.get('id') || 1);
  let currentPost = null;

  function setText(selector, text){ const el = document.querySelector(selector); if (el) el.textContent = text; }

  if (window.data){
    window.data.fetchPostDetail(id, { inc: 1 }).then(function(json){
      const post = json.item;
      if (!post) return;
      currentPost = post;

      setText('#postTitle', post.title);
      const meta = document.querySelector('.bl-view__meta');
      const cond = post.cond || post.condition || '';
      if (meta){ meta.innerHTML = '<span class="badge">'+cond+'</span> <span class="bl-view__views">조회수 '+post.views+'</span>'; }

      const facts = document.querySelector('.bl-view__facts');
      if (facts){
        facts.innerHTML = '<div><dt>저자</dt><dd>'+(post.author||'')+'</dd></div>'+
                          '<div><dt>과목</dt><dd>'+post.subject+'</dd></div>'+
                          '<div><dt>희망가</dt><dd><strong>'+window.data.priceFormat(post.price_won)+'</strong></dd></div>'+
                          '<div><dt>등록일</dt><dd>'+post.created_at+'</dd></div>'+
                          '<div><dt>닉네임</dt><dd>'+post.nickname+'</dd></div>';
      }

      setText('.bl-view__text', post.content);

      const contact = document.querySelector('.bl-view__contact ul');
      if (contact){
        contact.innerHTML = '<li>'+post.contact+'</li>';
      }

      const comments = document.querySelector('[data-role="comments"]');
      const empty = document.querySelector('[data-role="comments-empty"]');
      if (comments && empty){
        comments.innerHTML = '';
        empty.hidden = false;
      }
    }).catch(function(){
      // failed to load detail
    });
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

  function showPasswordModal(action){ pendingAction = action; if (window.modal) window.modal.open('passwordModal'); }
  
  function verifyPasswordAndPerform(password){
    if (!currentPost || !pendingAction) return;
    
    if (pendingAction === 'edit'){
      // Use a simple approach: try to "delete" but don't actually delete
      // This will verify the password using existing delete API
      const formData = new FormData();
      formData.append('id', currentPost.id);
      formData.append('password', password);
      formData.append('verify_only', '1'); // Special flag to only verify, not delete
      
      console.log('Verifying password for edit using delete API:', {
        id: currentPost.id,
        password: password
      });
      
      fetch('/api/posts/delete.php', {
        method: 'POST',
        body: formData
      })
      .then(function(response){ return response.text(); })
      .then(function(text){
        console.log('Raw response:', text);
        try {
          const json = JSON.parse(text);
          console.log('Password verification result:', json);
          if (json.ok || json.verified){
            // Password is correct, redirect to edit page
            location.href = '/pages/write.html?edit=' + currentPost.id;
          } else {
            console.error('Password verification failed:', json);
            alert(json.error.message || '비밀번호가 일치하지 않습니다.');
            if (json.error._debug) {
              console.log('Debug info:', json.error._debug);
            }
          }
        } catch (e) {
          console.error('JSON parse error:', e);
          console.error('Response was:', text);
          alert('서버 응답 오류: ' + text.substring(0, 200));
        }
      })
      .catch(function(err){
        console.error('Network error during password verification:', err);
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

  if (editBtn){ editBtn.addEventListener('click', function(){ showPasswordModal('edit'); }); }
  if (deleteBtn){ deleteBtn.addEventListener('click', function(){ showPasswordModal('delete'); }); }
  if (passwordForm){ 
    passwordForm.addEventListener('submit', function(e){ 
      e.preventDefault(); 
      const pw = new FormData(passwordForm).get('password'); 
      if (window.modal) window.modal.close('passwordModal'); 
      verifyPasswordAndPerform(pw); 
    }); 
  }
})();


