(function(){
'use strict';
function add(src,onload){
  var s=document.createElement('script');
  s.src=src;
  s.async=false;
  if(onload)s.onload=onload;
  document.head.appendChild(s);
}
add('assets/scorm-core.js?v=20261005',function(){
  add('assets/contract-validator.js?v=20261005');
});
})();
