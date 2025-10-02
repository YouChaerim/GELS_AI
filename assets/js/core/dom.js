(function(){
  window.$ = function(selector, scope){ return (scope||document).querySelector(selector); };
  window.$$ = function(selector, scope){ return Array.from((scope||document).querySelectorAll(selector)); };
  window.on = function(target, type, selector, handler){
    target.addEventListener(type, function(e){
      if (!selector) return handler(e);
      const matched = e.target.closest(selector);
      if (matched && target.contains(matched)) handler(Object.assign(e, { delegateTarget: matched }));
    });
  };
})();


