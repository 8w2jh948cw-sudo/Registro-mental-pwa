/* 0.4.33 — restauração verificada e atualização confiável do PWA. */
const RM_V33_RELEASE='0.4.33';

function rmV33ValidEvent(e){
  return Boolean(e&&typeof e.id==='string'&&e.id&&typeof e.timestamp==='string'&&e.timestamp&&['note','medication','sleep','purchase'].includes(e.type));
}
function rmV33ValidMedication(m){
  return Boolean(m&&typeof m.id==='string'&&m.id&&typeof m.activeIngredient==='string'&&m.activeIngredient.trim());
}

importData=async function(file){
  try{
    toast('Importando e verificando backup…');
    const parsed=JSON.parse(await file.text());
    const sourceEvents=Array.isArray(parsed)?parsed:parsed?.events;
    if(!Array.isArray(sourceEvents))throw new Error('O backup não contém uma lista de registros.');
    const events=sourceEvents.filter(rmV33ValidEvent);
    const medications=Array.isArray(parsed?.medications)?parsed.medications.filter(rmV33ValidMedication):[];
    if(!events.length&&!medications.length)throw new Error('Nenhum registro válido foi encontrado no backup.');

    for(const event of events)await putEvent({...event});
    for(const medication of medications)await putMedication({...medication});

    const storedEvents=await allEvents();
    const storedMedications=await allMedications();
    const eventIds=new Set(storedEvents.map(item=>item.id));
    const medicationIds=new Set(storedMedications.map(item=>item.id));
    const verifiedEvents=events.filter(item=>eventIds.has(item.id)).length;
    const verifiedMedications=medications.filter(item=>medicationIds.has(item.id)).length;
    if(verifiedEvents!==events.length||verifiedMedications!==medications.length){
      throw new Error(`A gravação não foi confirmada (${verifiedEvents}/${events.length} registros; ${verifiedMedications}/${medications.length} medicamentos).`);
    }

    if(parsed?.settings&&typeof parsed.settings==='object'&&!Array.isArray(parsed.settings)){
      saveSettings({...getSettings(),...parsed.settings});
    }
    localStorage.setItem('registro-demo-seeded','yes');
    if(typeof rmInvalidate==='function')rmInvalidate();
    if(typeof switchTab==='function')switchTab('history');
    if(typeof rmRenderActive==='function')await rmRenderActive('history',{force:true});
    else await renderAll();
    const ignored=sourceEvents.length-events.length;
    const summary=`${verifiedEvents} registro${verifiedEvents===1?'':'s'} e ${verifiedMedications} medicamento${verifiedMedications===1?'':'s'} restaurado${verifiedEvents+verifiedMedications===1?'':'s'}.`;
    toast(ignored?`${summary} ${ignored} item${ignored===1?'':'s'} ignorado${ignored===1?'':'s'}.`:summary);
  }catch(error){
    console.error('Falha ao restaurar backup',error);
    const message=error instanceof Error?error.message:'Não foi possível ler o arquivo.';
    alert(`O backup não foi restaurado.\n\n${message}\n\nNenhum dado existente foi apagado.`);
    toast('Falha ao restaurar o backup.');
  }
};

function rmV33UpdateVersion(){
  const top=document.getElementById('topVersion');
  const about=document.getElementById('versionLabel');
  if(top)top.textContent=`v${RM_V33_RELEASE}`;
  if(about)about.textContent=RM_V33_RELEASE;
}

function rmV33InstallUpdateRuntime(){
  if(!('serviceWorker' in navigator))return;
  const hadController=Boolean(navigator.serviceWorker.controller);
  let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!hadController||reloading)return;
    reloading=true;
    location.reload();
  });
  const check=async()=>{
    try{
      const registration=await navigator.serviceWorker.register(`./sw.js?v=${RM_V33_RELEASE}`,{updateViaCache:'none'});
      await registration.update();
      if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});
    }catch(error){console.error('Falha ao verificar atualização',error)}
  };
  check();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check()});
  setInterval(check,15*60*1000);
}

rmV33UpdateVersion();
[250,900,1800].forEach(ms=>setTimeout(rmV33UpdateVersion,ms));
rmV33InstallUpdateRuntime();


/* Carrega os modos seguro de substituir ou combinar backups. */
(function rmV33LoadV34(){
  if(document.querySelector('script[data-engine-key="v33-backup-modes"]'))return;
  const s=document.createElement('script');
  s.dataset.engineKey='v33-backup-modes';
  s.src='./v04c34.js?v=0.4.34';
  s.onload=()=>{try{rmV34Finalize?.()}catch{}};
  s.onerror=()=>console.error('Falha ao carregar revisão 0.4.34');
  document.head.appendChild(s);
})();
