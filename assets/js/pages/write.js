(function(){
  const form = document.getElementById('writeForm');
  if (!form) return;

  // Check if this is edit mode
  const params = new URLSearchParams(location.search);
  const editId = params.get('edit');
  let isEditMode = false;
  let originalPost = null;

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

  // Load post data for editing
  if (editId && window.data){
    window.data.fetchPostDetail(editId).then(function(json){
      const post = json.item;
      if (post){
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

        document.title = 'BookLoop - 글 수정';
        const h1 = document.querySelector('h1');
        if (h1) h1.textContent = '글 수정';
      }
    }).catch(function(err){
      alert('게시글을 불러올 수 없습니다.');
      location.href = '/pages/list.html';
    });
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
      // Submit update via API
      const formData = new FormData(form);
      formData.append('id', editId);
      
      // Debug: Log form data
      console.log('Submitting update with data:');
      for (let [key, value] of formData.entries()) {
        console.log(key + ':', value);
      }
      
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
})();


