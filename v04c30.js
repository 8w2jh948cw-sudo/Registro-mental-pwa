/* 0.4.30 — controles de fechar alinhados à esquerda em todas as janelas. */
const RM_V30_RELEASE='0.4.30';

function rmV30EnsureStyles(){
  if(document.getElementById('rm-v30-style'))return;
  const st=document.createElement('style');
  st.id='rm-v30-style';
  st.textContent=`
.sheet-header{
  display:grid!important;
  grid-template-columns:40px minmax(0,1fr) 40px!important;
  align-items:center!important;
  column-gap:8px!important;
}
.sheet-header .sheet-close{
  grid-column:1!important;
  grid-row:1!important;
  justify-self:start!important;
  order:-1!important;
}
.sheet-header h2{
  grid-column:2!important;
  grid-row:1!important;
  min-width:0;
  margin:0!important;
  text-align:center!important;
  line-height:1.2!important;
}
.form-actions>.rm-close-action,
.registry-toolbar>.rm-close-action{
  order:-1!important;
  grid-column:1!important;
}
`;
  document.head.appendChild(st);
}

function rmV30MarkCloseActions(root=document){
  root.querySelectorAll?.('button').forEach(button=>{
    const label=String(button.textContent||'').replace(/\s+/g,' ').trim().toLocaleLowerCase('pt-BR');
    button.classList.toggle('rm-close-action',label==='fechar');
  });
}

function rmV30WatchCloseActions(){
  const form=document.getElementById('form');
  if(!form||form.dataset.rmV30Watch==='1')return;
  form.dataset.rmV30Watch='1';
  rmV30MarkCloseActions(form);
  new MutationObserver(()=>rmV30MarkCloseActions(form)).observe(form,{childList:true,subtree:true});
}

function rmV30Finalize(){
  rmV30EnsureStyles();
  rmV30WatchCloseActions();
  rmV30MarkCloseActions(document);
  const top=document.getElementById('topVersion');
  const about=document.getElementById('versionLabel');
  if(top)top.textContent=`v${RM_V30_RELEASE}`;
  if(about)about.textContent=RM_V30_RELEASE;
}
rmV30Finalize();
[250,900,1800].forEach(ms=>setTimeout(rmV30Finalize,ms));


/* Carrega o novo símbolo de fechamento. */
(function rmV30LoadV31(){
  if(document.querySelector('script[data-engine-key="v31-close-icon"]'))return;
  const s=document.createElement('script');
  s.dataset.engineKey='v31-close-icon';
  s.src='./v04c31.js?v=0.4.31';
  s.onload=()=>{try{rmV31Finalize?.()}catch{}};
  s.onerror=()=>console.error('Falha ao carregar revisão 0.4.31');
  document.head.appendChild(s);
})();
