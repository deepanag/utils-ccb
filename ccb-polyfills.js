(function () {
  if (typeof CustomEvent === 'function') { return; }
  function customEvent(event, params) {
	  params = params || {bubbles: false, cancelable: false, detail: undefined};
	  var evt = document.createEvent('CustomEvent');
	  evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
	  return evt;
  }
  customEvent.prototype = window.Event.prototype;
  window.CustomEvent = customEvent;
})();
