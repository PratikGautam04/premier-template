(function(){
  // ---- Config: connect the enquiry form here (Formspree, Google Apps Script, your own API). Leave empty until ready.
  var FORM_ENDPOINT = '';

  // Mega menu
  var dd=document.querySelector('.nav-dd');
  if(dd){
    var btn=dd.querySelector('button'),t;
    function set(o){dd.classList.toggle('open',o);btn.setAttribute('aria-expanded',o)}
    btn.addEventListener('click',function(e){e.stopPropagation();set(!dd.classList.contains('open'))});
    if(window.matchMedia('(hover:hover)').matches){
      dd.addEventListener('mouseenter',function(){clearTimeout(t);set(true)});
      dd.addEventListener('mouseleave',function(){t=setTimeout(function(){set(false)},160)});
    }
    document.addEventListener('click',function(e){if(!dd.contains(e.target))set(false)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')set(false)});
  }
  // Drawer
  var dr=document.getElementById('drawer');
  if(dr){
    document.getElementById('menuBtn').addEventListener('click',function(){dr.classList.add('open');document.body.style.overflow='hidden'});
    function closeD(){dr.classList.remove('open');document.body.style.overflow=''}
    dr.querySelector('.x').addEventListener('click',closeD);
    dr.querySelectorAll('a').forEach(function(a){a.addEventListener('click',closeD)});
  }
  // Form
  var f=document.getElementById('enq');
  if(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();var ok=true;
      f.querySelectorAll('[data-req]').forEach(function(i){
        var v=i.value.trim(),bad=!v;
        if(i.type==='email'&&v&&!/^\S+@\S+\.\S+$/.test(v))bad=true;
        if(i.name==='phone'&&v&&v.replace(/\D/g,'').length<10)bad=true;
        i.closest('.field').classList.toggle('bad',bad);if(bad)ok=false;
      });
      var note=document.getElementById('formNote');note.className='form-note full';
      if(!ok){note.textContent='Please check the highlighted fields.';note.classList.add('show','warn');return}
      if(!FORM_ENDPOINT){note.textContent='The enquiry form is not connected yet. Please call or email us using the details on this page.';note.classList.add('show','warn');return}
      var fd=new FormData(f);
      fetch(FORM_ENDPOINT,{method:'POST',body:fd,headers:{Accept:'application/json'}}).then(function(r){
        if(!r.ok)throw 0;note.textContent='Thank you. We have received your enquiry and will call you back soon.';note.classList.add('show','ok');f.reset();
      }).catch(function(){note.textContent='Could not send the enquiry. Please try again or call us.';note.classList.add('show','warn')});
    });
  }
})();
