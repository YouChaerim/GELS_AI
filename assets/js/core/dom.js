console.log('[DOM.JS] === dom.js 파일 로드 시작 ===');

(function(){
  console.log('[DOM.JS] DOM 유틸리티 함수 정의 중...');
  
  window.$ = function(selector, scope){ return (scope||document).querySelector(selector); };
  window.$$ = function(selector, scope){ return Array.from((scope||document).querySelectorAll(selector)); };
  window.on = function(target, type, selector, handler){
    target.addEventListener(type, function(e){
      if (!selector) return handler(e);
      const matched = e.target.closest(selector);
      if (matched && target.contains(matched)) handler(Object.assign(e, { delegateTarget: matched }));
    });
  };
  
  console.log('[DOM.JS] ✅ DOM 유틸리티 함수 정의 완료');
})();

console.log('[DOM.JS] ✅ dom.js 로드 완료');


