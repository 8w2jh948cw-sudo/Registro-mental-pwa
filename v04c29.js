/* 0.4.29 — botões mais arredondados na aba Aprendizado. */
const RM_V29_RELEASE='0.4.29';

function rmV29EnsureStyles(){
  if(document.getElementById('rm-v29-style'))return;
  const st=document.createElement('style');
  st.id='rm-v29-style';
  st.textContent=`
[data-view="learning"] .learning-actions button{
  border-radius:18px!important;
  min-height:44px;
  padding-left:15px!important;
  padding-right:15px!important;
}
[data-view="learning"] .learning-chip{
  border-radius:999px!important;
}
[data-view="learning"] .learning-remove{
  border-radius:16px!important;
  min-height:36px;
  padding-left:12px!important;
  padding-right:12px!important;
}
[data-view="learning"] .learning-actions button:active,
[data-view="learning"] .learning-chip:active,
[data-view="learning"] .learning-remove:active{
  transform:scale(.97);
}
`;
  document.head.appendChild(st);
}

function rmV29Finalize(){
  rmV29EnsureStyles();
  const top=document.getElementById('topVersion');
  const about=document.getElementById('versionLabel');
  if(top)top.textContent=`v${RM_V29_RELEASE}`;
  if(about)about.textContent=RM_V29_RELEASE;
}
rmV29Finalize();
[250,900,1800].forEach(ms=>setTimeout(rmV29Finalize,ms));


/* Carrega o alinhamento global dos controles de fechar. */
(function rmV29LoadV30(){
  if(document.querySelector('script[data-engine-key="v30-left-close"]'))return;
  const s=document.createElement('script');
  s.dataset.engineKey='v30-left-close';
  s.src='./v04c30.js?v=0.4.30';
  s.onload=()=>{try{rmV30Finalize?.()}catch{}};
  s.onerror=()=>console.error('Falha ao carregar revisão 0.4.30');
  document.head.appendChild(s);
})();
