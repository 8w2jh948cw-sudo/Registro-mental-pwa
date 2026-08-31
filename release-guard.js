/* Indicador único de versão: bloqueia sobrescritas dos módulos antigos. */
(function(){
  const RELEASE='0.4.35';
  let ready=false,painting=false;
  const paint=()=>{
    if(painting)return;
    painting=true;
    const top=document.getElementById('topVersion');
    const about=document.getElementById('versionLabel');
    const topText=ready?`v${RELEASE}`:'Atualizando…';
    const aboutText=ready?RELEASE:'Atualizando…';
    if(top&&top.textContent!==topText)top.textContent=topText;
    if(about&&about.textContent!==aboutText)about.textContent=aboutText;
    painting=false;
  };
  const observer=new MutationObserver(paint);
  const start=()=>{
    paint();
    const top=document.getElementById('topVersion');
    const about=document.getElementById('versionLabel');
    if(top)observer.observe(top,{childList:true,subtree:true,characterData:true});
    if(about)observer.observe(about,{childList:true,subtree:true,characterData:true});
  };
  window.addEventListener('registro:release-ready',event=>{
    if(event.detail?.release!==RELEASE)return;
    ready=true;
    document.documentElement.dataset.releaseReady=RELEASE;
    paint();
  });
  window.REGISTRO_EXPECTED_RELEASE=RELEASE;
  start();
})();
