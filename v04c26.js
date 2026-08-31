/* 0.4.26 — laboratório da barra inferior reconstruído como editor leve e independente. */
const RM_V26_RELEASE='0.4.26';

function rmV26OpenTabbarLab(){
  location.href='./tabbar-lab.html';
}

/* Intercepta o botão mesmo depois de ele ser movido para Personalização avançada. */
document.addEventListener('click',e=>{
  const button=e.target.closest('#tabbarLabBtn');
  if(!button)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  rmV26OpenTabbarLab();
},true);

/* Ao retornar do laboratório, reaplica imediatamente a configuração salva. */
window.addEventListener('pageshow',()=>{
  try{if(typeof applyRegistroTabBar==='function')applyRegistroTabBar()}catch{}
});

function rmV26Finalize(){
  try{if(typeof RM_V28_RELEASE!=='undefined'||typeof RM_V27_RELEASE!=='undefined')return}catch{}
  const top=document.getElementById('topVersion'),about=document.getElementById('versionLabel');
  if(top)top.textContent=`v${RM_V26_RELEASE}`;
  if(about)about.textContent=RM_V26_RELEASE;
}
rmV26Finalize();
setTimeout(rmV26Finalize,1200);

/* A revisão seguinte precisa entrar depois da 0.4.27, pois redefine cartões e visualizadores. */
(function rmV26LoadV28(){
  let tries=0;
  const wait=()=>{
    tries++;
    let ready=false;try{ready=typeof RM_V27_RELEASE!=='undefined'}catch{}
    if(!ready&&tries<80)return setTimeout(wait,50);
    if(document.querySelector('script[data-engine-key="v28-refinement"]'))return;
    const s=document.createElement('script');s.dataset.engineKey='v28-refinement';s.src='./v04c28.js?v=0.4.28';s.onload=()=>{try{rmV28Finalize?.()}catch{};try{rmInstallPerformanceRuntime?.()}catch{}};s.onerror=()=>console.error('Falha ao carregar revisão 0.4.28');document.head.appendChild(s);
  };
  wait();
})();
