/* 0.4.34 — escolha entre substituir ou combinar ao restaurar um backup. */
const RM_V34_RELEASE='0.4.34';
let rmV34PendingImport=null;

function rmV34UniqueById(items){
  return [...new Map(items.map(item=>[item.id,{...item}])).values()];
}
function rmV34Transaction(mode,events,medications){
  const stores=[EVENTS,MEDICATIONS];
  return new Promise((resolve,reject)=>{
    const transaction=db.transaction(stores,'readwrite');
    transaction.oncomplete=()=>resolve();
    transaction.onerror=()=>reject(transaction.error||new Error('Falha ao gravar o backup.'));
    transaction.onabort=()=>reject(transaction.error||new Error('A restauração foi cancelada pelo banco local.'));
    if(mode==='replace'){
      transaction.objectStore(EVENTS).clear();
      transaction.objectStore(MEDICATIONS).clear();
    }
    const eventStore=transaction.objectStore(EVENTS);
    const medicationStore=transaction.objectStore(MEDICATIONS);
    events.forEach(item=>eventStore.put(item));
    medications.forEach(item=>medicationStore.put(item));
  });
}

async function rmV34Restore(parsed,mode){
  const sourceEvents=Array.isArray(parsed)?parsed:parsed?.events;
  const events=rmV34UniqueById(sourceEvents.filter(rmV33ValidEvent));
  const medications=rmV34UniqueById(Array.isArray(parsed?.medications)?parsed.medications.filter(rmV33ValidMedication):[]);
  try{
    closeSheet();
    toast(mode==='replace'?'Substituindo e verificando dados…':'Combinando e verificando dados…');
    await rmV34Transaction(mode,events,medications);

    const storedEvents=await allEvents();
    const storedMedications=await allMedications();
    const eventIds=new Set(storedEvents.map(item=>item.id));
    const medicationIds=new Set(storedMedications.map(item=>item.id));
    const verifiedEvents=events.filter(item=>eventIds.has(item.id)).length;
    const verifiedMedications=medications.filter(item=>medicationIds.has(item.id)).length;
    const exactReplacement=mode!=='replace'||(storedEvents.length===events.length&&storedMedications.length===medications.length);
    if(verifiedEvents!==events.length||verifiedMedications!==medications.length||!exactReplacement){
      throw new Error(`A verificação encontrou ${verifiedEvents}/${events.length} registros e ${verifiedMedications}/${medications.length} medicamentos.`);
    }

    if(mode==='replace'){
      const restoredSettings=parsed?.settings&&typeof parsed.settings==='object'&&!Array.isArray(parsed.settings)?parsed.settings:{};
      saveSettings({...defaultSettings,...restoredSettings});
    }
    localStorage.setItem('registro-demo-seeded','yes');
    if(typeof rmInvalidate==='function')rmInvalidate();
    switchTab('history');
    if(typeof rmRenderActive==='function')await rmRenderActive('history',{force:true});
    else await renderAll();
    const action=mode==='replace'?'Backup restaurado':'Backup somado aos dados atuais';
    toast(`${action}: ${verifiedEvents} registro${verifiedEvents===1?'':'s'} e ${verifiedMedications} medicamento${verifiedMedications===1?'':'s'}.`);
  }catch(error){
    console.error('Falha na restauração escolhida',error);
    const message=error instanceof Error?error.message:'Não foi possível concluir a restauração.';
    alert(`Não foi possível restaurar o backup.\n\n${message}`);
    toast('Falha ao restaurar o backup.');
  }finally{
    rmV34PendingImport=null;
  }
}

function rmV34OpenChoice(parsed,events,medications,ignored){
  rmV34PendingImport=parsed;
  const countText=`${events.length} registro${events.length===1?'':'s'} e ${medications.length} medicamento${medications.length===1?'':'s'}`;
  openBackdrop('Como importar o backup?',`
    <div class="analysis-row rm-v34-import-summary"><strong>Este backup contém ${esc(countText)}</strong><span>Escolha o que deve acontecer com os dados que já estão neste aparelho.${ignored?` ${ignored} item${ignored===1?'':'s'} inválido${ignored===1?'':'s'} não será${ignored===1?'':'ão'} importado${ignored===1?'':'s'}.`:''}</span></div>
    <div class="rm-v34-import-choice">
      <button type="button" class="primary-button full-button" id="rmImportReplace">Substituir tudo pelo backup</button>
      <small>Apaga os registros e medicamentos atuais e restaura o conteúdo e as configurações deste backup. Gravações de áudio locais são preservadas, pois ainda não fazem parte do arquivo de backup.</small>
    </div>
    <div class="rm-v34-import-choice">
      <button type="button" class="secondary-button full-button" id="rmImportMerge">Somar aos dados atuais</button>
      <small>Mantém o que já existe e adiciona o backup. Quando um item tiver o mesmo identificador, prevalece a versão do backup. As configurações atuais são mantidas.</small>
    </div>
    <button type="button" class="secondary-button full-button" data-cancel>Cancelar</button>
  `);
  document.getElementById('rmImportReplace').onclick=()=>rmV34Restore(rmV34PendingImport,'replace');
  document.getElementById('rmImportMerge').onclick=()=>rmV34Restore(rmV34PendingImport,'merge');
}

importData=async function(file){
  try{
    const parsed=JSON.parse(await file.text());
    const sourceEvents=Array.isArray(parsed)?parsed:parsed?.events;
    if(!Array.isArray(sourceEvents))throw new Error('O arquivo não contém uma lista de registros.');
    const events=rmV34UniqueById(sourceEvents.filter(rmV33ValidEvent));
    const medications=rmV34UniqueById(Array.isArray(parsed?.medications)?parsed.medications.filter(rmV33ValidMedication):[]);
    if(!events.length&&!medications.length)throw new Error('Nenhum registro válido foi encontrado no backup.');
    rmV34OpenChoice(parsed,events,medications,sourceEvents.length-events.length);
  }catch(error){
    console.error('Backup inválido',error);
    const message=error instanceof Error?error.message:'Não foi possível ler o arquivo.';
    alert(`Este arquivo não pode ser importado.\n\n${message}\n\nNenhum dado atual foi alterado.`);
    toast('Arquivo de backup inválido.');
  }
};

function rmV34Styles(){
  if(document.getElementById('rm-v34-style'))return;
  const style=document.createElement('style');
  style.id='rm-v34-style';
  style.textContent=`
    .rm-v34-import-summary{margin-bottom:12px}
    .rm-v34-import-choice{display:grid;gap:6px;margin-bottom:13px}
    .rm-v34-import-choice small{padding:0 4px;color:var(--secondary);font-size:12px;line-height:1.35}
  `;
  document.head.appendChild(style);
}
function rmV34Finalize(){
  rmV34Styles();
  const top=document.getElementById('topVersion');
  const about=document.getElementById('versionLabel');
  if(top)top.textContent=`v${RM_V34_RELEASE}`;
  if(about)about.textContent=RM_V34_RELEASE;
}
rmV34Finalize();
[250,900,1800].forEach(ms=>setTimeout(rmV34Finalize,ms));
