document.addEventListener('DOMContentLoaded', function(){
  console.log('[WRITE.JS] === DOM 로드 완료, 글쓰기/수정 페이지 스크립트 시작 ===');
  const form = document.getElementById('writeForm');
  if (!form) {
    console.log('[WRITE.JS] writeForm 요소를 찾을 수 없음');
    return;
  }
  console.log('[WRITE.JS] writeForm 요소 발견:', form);

  // Check if this is edit mode
  const params = new URLSearchParams(location.search);
  const editId = params.get('edit');
  const authToken = params.get('auth');
  console.log('[WRITE.JS] URL 파라미터 확인:', {
    editId: editId,
    hasAuthToken: !!authToken,
    authTokenLength: authToken ? authToken.length : 0
  });
  
  let isEditMode = false;
  let originalPost = null;
  let hasValidAuth = false;

  function setError(input, message){
    let hint = input.nextElementSibling && input.nextElementSibling.classList?.contains('bl-error') ? input.nextElementSibling : null;
    if (!hint){
      hint = document.createElement('div');
      hint.className = 'bl-error';
      input.parentElement.appendChild(hint);
    }
    hint.textContent = message || '';
  }
  function clearError(input){
    const hint = input.parentElement.querySelector('.bl-error');
    if (hint) hint.textContent = '';
  }
  function required(input, msg){
    if (!input || !input.value || !input.value.trim()){ setError(input, msg); return false; }
    clearError(input); return true;
  }
  function minLen(input, n, msg){
    if (!input || !input.value || input.value.trim().length < n){ setError(input, msg); return false; }
    clearError(input); return true;
  }
  function positiveInt(input, msg){
    if (!input){ setError(form.querySelector('[name="price_won"]') || input, msg); return false; }
    const v = parseInt(input.value, 10);
    if (isNaN(v) || v < 0){ setError(input, msg); return false; }
    clearError(input); return true;
  }

  function setIfExists(name, value){
    const el = form.elements[name];
    if (el) el.value = value || '';
  }

  // Validate auth token if provided
  if (editId && authToken) {
    console.log('[WRITE.JS] === 인증 토큰 검증 시작 ===');
    try {
      const decoded = atob(authToken);
      console.log('[WRITE.JS] 토큰 디코딩 성공, 길이:', decoded.length);
      
      const parts = decoded.split(':');
      console.log('[WRITE.JS] 토큰 파트 개수:', parts.length);
      console.log('[WRITE.JS] 토큰 파트[0] (ID):', parts[0], '/ 예상 ID:', editId);
      
      if (parts.length === 3 && parts[0] === editId) {
        const timestamp = parseInt(parts[2]);
        const now = Date.now();
        const timeDiff = now - timestamp;
        console.log('[WRITE.JS] 시간 검증:', {
          timestamp: timestamp,
          now: now,
          diff: timeDiff,
          diffMinutes: Math.round(timeDiff / 60000),
          maxAllowed: 1800000
        });
        
        // Token valid for 30 minutes (1800000 ms)
        if (timeDiff < 1800000) {
          hasValidAuth = true;
          console.log('[WRITE.JS] ✅ 유효한 인증 토큰 확인됨');
        } else {
          console.log('[WRITE.JS] ❌ 인증 토큰 만료됨');
        }
      } else {
        console.log('[WRITE.JS] ❌ 토큰 형식 불일치');
      }
    } catch (e) {
      console.error('[WRITE.JS] ❌ 토큰 디코딩 실패:', e.message);
    }
  } else {
    console.log('[WRITE.JS] 인증 토큰 없음 (일반 글쓰기 모드)');
  }

  // Load post data for editing
  if (editId && window.data){
    console.log('[WRITE.JS] === 수정 모드 데이터 로딩 시작 ===');
    console.log('[WRITE.JS] editId:', editId, '/ hasValidAuth:', hasValidAuth);
    
    // If no valid auth token, redirect back to view page for password verification
    if (!hasValidAuth) {
      console.log('[WRITE.JS] ❌ 유효한 인증 없음, 상세 페이지로 리다이렉트');
      alert('수정 권한이 없습니다. 다시 비밀번호를 확인해주세요.');
      location.href = '/pages/view.html?id=' + editId;
      return;
    }

    console.log('[WRITE.JS] ✅ 인증 확인됨, 게시글 데이터 로딩 중...');
    window.data.fetchPostDetail(editId).then(function(json){
      console.log('[WRITE.JS] fetchPostDetail 응답:', json);
      const post = json.item;
      if (post){
        console.log('[WRITE.JS] ✅ 게시글 데이터 로드 성공:', {
          id: post.id,
          title: post.title,
          author: post.author,
          subject: post.subject
        });
        
        isEditMode = true;
        originalPost = post;

        setIfExists('title', post.title);
        setIfExists('author', post.author);
        setIfExists('subject', post.subject);
        setIfExists('condition', post.cond || post.condition);
        setIfExists('price_won', post.price_won);
        setIfExists('nickname', post.nickname);
        setIfExists('contact', post.contact);
        setIfExists('content', post.content);

        console.log('[WRITE.JS] ✅ 모든 폼 필드에 데이터 설정 완료');
        
        document.title = 'BookLoop - 글 수정';
        const h1 = document.querySelector('h1');
        if (h1) h1.textContent = '글 수정';
        
        console.log('[WRITE.JS] ✅ 페이지 제목 및 헤더 업데이트 완료');
      } else {
        console.error('[WRITE.JS] ❌ 게시글 데이터가 없음');
      }
    }).catch(function(err){
      console.error('[WRITE.JS] ❌ 게시글 로딩 실패:', err);
      alert('게시글을 불러올 수 없습니다.');
      location.href = '/pages/list.html';
    });
  } else if (editId && !window.data) {
    console.error('[WRITE.JS] ❌ window.data가 없음, API 호출 불가');
  } else {
    console.log('[WRITE.JS] 일반 글쓰기 모드 (editId 없음)');
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    const title = form.elements['title'];
    const author = form.elements['author'];
    const subject = form.elements['subject'];
    const condition = form.elements['condition'];
    const price = form.elements['price_won'];
    const contact = form.elements['contact'];
    const nickname = form.elements['nickname'];
    const password = form.elements['password'];
    const content = form.elements['content'];

    let ok = true;
    ok = required(title, '제목을 입력하세요.') && ok;
    ok = required(subject, '과목을 입력하세요.') && ok;
    ok = required(condition, '상태를 선택하세요.') && ok;
    ok = positiveInt(price, '희망가는 0 이상의 정수여야 합니다.') && ok;
    ok = required(contact, '연락 수단을 입력하세요.') && ok;
    ok = required(nickname, '닉네임을 입력하세요.') && ok;
    ok = required(password, '글 비밀번호를 입력하세요.') && ok;
    ok = required(content, '상세 설명을 입력하세요.') && ok;
    ok = minLen(content, 5, '내용은 5자 이상 입력해주세요.') && ok;

    if (!ok) return;

    if (isEditMode){
      // Submit update via API with auth token
      const formData = new FormData(form);
      formData.append('id', editId);
      formData.append('auth_token', authToken); // Include auth token instead of password
      
      // Debug: Log form data
      console.log('Submitting update with data:');
      for (let [key, value] of formData.entries()) {
        if (key !== 'auth_token') { // Don't log the token
          console.log(key + ':', value);
        }
      }
      console.log('Using auth token for authentication');
      
      fetch('/api/posts/update.php', {
        method: 'POST',
        body: formData
      })
      .then(function(response){ 
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        return response.text(); // Get raw response first
      })
      .then(function(text){
        console.log('Raw response:', text);
        try {
          const json = JSON.parse(text);
          console.log('Parsed JSON:', json);
          
          if (json.ok){
            alert('게시글이 수정되었습니다.');
            location.href = '/pages/view.html?id=' + editId;
          } else {
            const error = json.error;
            console.error('Update failed:', json);
            if (error.code === 'VALIDATION_ERROR' && error.fields){
              Object.keys(error.fields).forEach(function(field){
                const input = form.elements[field];
                if (input) setError(input, error.fields[field]);
              });
            } else if (error.code === 'UNAUTHORIZED' || error.code === 'INVALID_TOKEN') {
              alert('수정 권한이 만료되었습니다. 다시 비밀번호를 확인해주세요.');
              location.href = '/pages/view.html?id=' + editId;
            } else {
              alert(error.message || '수정 중 오류가 발생했습니다.');
              if (error._debug) {
                console.log('Debug info:', error._debug);
              }
            }
          }
        } catch (e) {
          console.error('JSON parse error:', e);
          console.error('Response was not valid JSON:', text);
          alert('서버 응답 오류: ' + text.substring(0, 100));
        }
      })
      .catch(function(err){
        console.error('Network error:', err);
        alert('네트워크 오류가 발생했습니다.');
      });
    } else {
      form.submit();
    }
  });
  
  console.log('[WRITE.JS] ✅ 모든 초기화 완료');
});


