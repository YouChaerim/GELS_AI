window.data = (function(){
  // 디버깅을 위한 로그 함수
  function debugLog(message, data) {
    console.log(`[DATA.JS] ${message}`, data || '');
  }

  async function fetchPosts(params){
    debugLog('=== fetchPosts 호출 ===');
    debugLog('Parameters:', params);
    
    const qs = new URLSearchParams(params||{}).toString();
    const url = '/api/posts/list.php' + (qs ? ('?'+qs) : '');
    debugLog('Request URL:', url);
    
    try {
      const res = await fetch(url, { headers:{'Accept':'application/json'} });
      debugLog('Response status:', res.status);
      debugLog('Response ok:', res.ok);
      
      if (!res.ok) {
        debugLog('Response not ok, throwing error');
        throw new Error('목록을 불러올 수 없습니다');
      }
      
      const json = await res.json();
      debugLog('Response JSON:', json);
      return json;
    } catch (error) {
      debugLog('fetchPosts ERROR:', error.message);
      throw error;
    }
  }
  
  async function fetchPostDetail(id, options){
    debugLog('=== fetchPostDetail 호출 ===');
    debugLog('ID:', id);
    debugLog('Options:', options);
    
    const qs = new URLSearchParams({ id: id, ...(options||{}) }).toString();
    const url = '/api/posts/detail.php?' + qs;
    debugLog('Request URL:', url);
    
    try {
      const res = await fetch(url, { headers:{'Accept':'application/json'} });
      debugLog('Response status:', res.status);
      
      if (!res.ok) {
        debugLog('Response not ok, throwing error');
        throw new Error('상세를 불러올 수 없습니다');
      }
      
      const json = await res.json();
      debugLog('Response JSON:', json);
      return json;
    } catch (error) {
      debugLog('fetchPostDetail ERROR:', error.message);
      throw error;
    }
  }
  
  async function fetchSubjects(){
    debugLog('=== fetchSubjects 호출 ===');
    const url = '/api/posts/subjects.php';
    debugLog('Request URL:', url);
    
    try {
      const res = await fetch(url, { headers:{'Accept':'application/json'} });
      debugLog('Response status:', res.status);
      debugLog('Response ok:', res.ok);
      
      if (!res.ok) {
        debugLog('Response not ok, throwing error');
        throw new Error('과목 목록을 불러올 수 없습니다');
      }
      
      const json = await res.json();
      debugLog('Response JSON:', json);
      return json;
    } catch (error) {
      debugLog('fetchSubjects ERROR:', error.message);
      throw error;
    }
  }
  function priceFormat(n){
    try{ return '₩' + Number(n).toLocaleString('ko-KR'); }catch{ return '₩' + n; }
  }
  return { fetchPosts, fetchPostDetail, fetchSubjects, priceFormat };
})();


