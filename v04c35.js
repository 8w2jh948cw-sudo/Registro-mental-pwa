/* 0.4.35 — consolida a versão somente após toda a revisão visual e funcional carregar. */
const RM_V35_RELEASE='0.4.35';

function rmV35ModulesReady(){
  return [
    typeof rmV29Finalize==='function',
    typeof rmV30Finalize==='function',
    typeof rmV31Finalize==='function',
    typeof rmV32Finalize==='function',
    typeof rmV33UpdateVersion==='function',
    typeof rmV34Finalize==='function'
  ].every(Boolean);
}
function rmV35PublishRelease(){
  if(!rmV35ModulesReady()){
    console.error('A atualização 0.4.35 não terminou de carregar.');
    return false;
  }
  window.REGISTRO_CURRENT_RELEASE=RM_V35_RELEASE;
  window.dispatchEvent(new CustomEvent('registro:release-ready',{detail:{release:RM_V35_RELEASE}}));
  return true;
}
function rmV35RefreshWorker(){
  if(!('serviceWorker' in navigator))return;
  navigator.serviceWorker.register(`./sw.js?v=${RM_V35_RELEASE}`,{updateViaCache:'none'})
    .then(registration=>registration.update())
    .catch(error=>console.error('Falha ao atualizar o aplicativo',error));
}

const rmV35PreviousSaveForm=saveForm;
const rmV35PreviousSaveEditedEvent=saveEditedEvent;
const rmV35PreviousOpenEventEditor=openEventEditor;

openNoteSheet=async function(){
  currentType='note';
  pendingAudio=null;
  const now=toLocalInput();
  openBackdrop('Nova anotação',`
    <div class="field"><label>Como você está se sentindo agora?</label>${emotionMoodSelectorHTML()}</div>
    ${emotionAdvancedHTML()}
    <div class="field"><label for="noteText">Anotação opcional</label><textarea id="noteText" rows="2" data-autogrow placeholder="O que você percebeu, sentiu ou pensou?"></textarea></div>
    <div class="field"><label for="noteTag">Tag opcional</label><input id="noteTag" placeholder="Ex.: ansiedade, calma, sono"></div>
    ${dateField('recordTime','Data e horário',now,{showNow:true,reserveNow:true})}
    ${formButtons()}
  `,saveForm);
  currentType='note';
  const form=document.getElementById('form');
  form?.classList.add('rm-note-form');
  wireEmotionControls();
  if(typeof wireAutoGrowTextareas==='function')wireAutoGrowTextareas(form);
};

saveForm=async function(event){
  if(currentType!=='note')return rmV35PreviousSaveForm(event);
  event.preventDefault();
  const text=document.getElementById('noteText')?.value.trim()||'';
  const moodScore=emotionMoodScore();
  const emotionScores=emotionScoresFromForm();
  const timestamp=new Date(document.getElementById('recordTime')?.value);
  if(!text&&moodScore==null&&!Object.keys(emotionScores).length)return toast('Escreva ou registre pelo menos uma nota emocional.');
  if(Number.isNaN(timestamp.getTime()))return toast('Informe uma data e horário válidos.');
  await putEvent({
    id:uid('note'),type:'note',timestamp:timestamp.toISOString(),text,
    tag:document.getElementById('noteTag')?.value.trim()||'',
    moodScore,emotionScores,emotionLabels:emotionLabelsSnapshot(emotionScores),demo:false
  });
  closeSheet();
  await renderAll();
  toast('Anotação salva.');
};

saveEditedEvent=async function(event,existing){
  if(existing?.type!=='note')return rmV35PreviousSaveEditedEvent(event,existing);
  event.preventDefault();
  const text=document.getElementById('noteText')?.value.trim()||'';
  const moodScore=emotionMoodScore();
  const emotionScores=emotionScoresFromForm();
  const timestamp=new Date(document.getElementById('recordTime')?.value);
  if(!text&&moodScore==null&&!Object.keys(emotionScores).length)return toast('Escreva ou registre pelo menos uma nota emocional.');
  if(Number.isNaN(timestamp.getTime()))return toast('Informe uma data e horário válidos.');
  const record={...existing,timestamp:timestamp.toISOString(),text,tag:document.getElementById('noteTag')?.value.trim()||'',moodScore,emotionScores,emotionLabels:emotionLabelsSnapshot(emotionScores)};
  delete record.hasAudio;
  delete record.audioOnly;
  await putEvent(record);
  try{await req(store(AUDIO,'readwrite').delete(existing.id))}catch{}
  closeSheet();
  await renderAll();
  toast('Alterações salvas.');
};

openEventEditor=async function(id){
  await rmV35PreviousOpenEventEditor(id);
  document.querySelector('#form .voice-row')?.remove();
  document.getElementById('form')?.classList.toggle('rm-note-form',currentType==='note');
};

function rmV35CompactNoteStyles(){
  if(document.getElementById('rm-v35-note-style'))return;
  const style=document.createElement('style');
  style.id='rm-v35-note-style';
  style.textContent=`
    .rm-note-form{display:grid;gap:9px}
    .rm-note-form>.field,.rm-note-form>.emotion-advanced,.rm-note-form>.form-actions{margin-top:0!important;margin-bottom:0!important}
    .rm-note-form textarea#noteText{min-height:64px!important;height:64px;padding-top:10px;padding-bottom:10px}
    .rm-note-form .mood-block{margin-top:5px}
    .rm-note-form .mood-scale{gap:3px}
    .rm-note-form .mood-score{min-height:34px!important}
    .rm-note-form .emotion-advanced{padding-top:7px!important;padding-bottom:7px!important}
    .rm-note-form .form-actions{padding-top:2px!important}
    .sheet:has(.rm-note-form){padding-top:10px!important;padding-bottom:max(10px,env(safe-area-inset-bottom))!important}
    .sheet:has(.rm-note-form) .sheet-header{margin-bottom:6px!important}
  `;
  document.head.appendChild(style);
}

function rmV35InstallUpdateButton(){
  const card=document.querySelector('.about-group .info-card');
  if(!card||document.getElementById('rmForceUpdateBtn'))return;
  card.insertAdjacentHTML('beforeend',`<div class="rm-update-row"><span>Atualizações</span><button type="button" class="secondary-button rm-update-button" id="rmForceUpdateBtn">Buscar agora</button></div>`);
  document.getElementById('rmForceUpdateBtn').onclick=async event=>{
    const button=event.currentTarget;
    if(!navigator.onLine)return toast('Conecte-se à internet para atualizar.');
    button.disabled=true;
    button.textContent='Buscando…';
    try{
      const probe=await fetch(`./release-guard.js?verificar=${Date.now()}`,{cache:'no-store'});
      if(!probe.ok)throw new Error('A publicação não respondeu.');
      if('serviceWorker' in navigator){
        const registration=await navigator.serviceWorker.register(`./sw.js?forcar=${Date.now()}`,{updateViaCache:'none'});
        await registration.update();
        if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});
      }
      if('caches' in window){
        const keys=await caches.keys();
        await Promise.all(keys.filter(key=>key.startsWith('registro-')).map(key=>caches.delete(key)));
      }
      button.textContent='Atualizando…';
      location.replace(`${location.pathname}?atualizar=${Date.now()}`);
    }catch(error){
      console.error('Falha ao forçar atualização',error);
      button.disabled=false;
      button.textContent='Tentar novamente';
      toast('Não foi possível buscar a atualização.');
    }
  };
}

rmV35CompactNoteStyles();
rmV35InstallUpdateButton();
rmV35PublishRelease();
requestAnimationFrame(rmV35PublishRelease);
[250,900,1800].forEach(ms=>setTimeout(rmV35PublishRelease,ms));
rmV35RefreshWorker();
