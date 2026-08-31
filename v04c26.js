/* 0.4.26 — laboratório da barra inferior reconstruído como editor leve e independente. */
const RM_V26_RELEASE='0.4.26';

function rmV26OpenTabbarLab(){
  location.href='./tabbar-lab.html?v=0.4.26';
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
  const top=document.getElementById('topVersion'),about=document.getElementById('versionLabel');
  if(top)top.textContent=`v${RM_V26_RELEASE}`;
  if(about)about.textContent=RM_V26_RELEASE;
}
rmV26Finalize();
setTimeout(rmV26Finalize,1200);
