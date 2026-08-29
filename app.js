const DB_NAME='registro-mental-v1';
const EVENTS='events';
const AUDIO='audio';
let db;
let currentType=null;
let mediaRecorder=null;
let audioChunks=[];
let pendingAudio=null;
let selectedDate=localDate(new Date());

function localDate(date){
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,'0');
  const d=String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function atToday(hour,minute){
  const d=new Date();
  d.setHours(hour,minute,0,0);
  return d.toISOString();
}

function toLocalInput(iso=new Date().toISOString()){
  const d=new Date(iso);
  const offset=d.getTimezoneOffset()*60000;
  return new Date(d.getTime()-offset).toISOString().slice(0,16);
}

function eventDay(event){ return localDate(new Date(event.timestamp)); }
function timeLabel(iso){ return new Date(iso).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }
function uid(prefix){ return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }
function escapeHTML(value=''){
  return String(value).replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
}

const demoEvents=()=>[
  {id:'demo-note-1',type:'note',timestamp:atToday(21,14),text:'Estou mais tranquilo agora.',tag:'',demo:true},
  {id:'demo-med-1',type:'medication',timestamp:atToday(18,32),medication:'Paroxetina',dose:'20 mg',quantity:'1 comprimido',note:'',demo:true},
  {id:'demo-note-2',type:'note',timestamp:atToday(15,10),text:'Estava bastante ansioso durante a tarde.',tag:'',demo:true},
  {id:'demo-med-2',type:'medication',timestamp:atToday(9,3),medication:'Bupropiona',dose:'150 mg',quantity:'1 comprimido',note:'',demo:true}
];

function openDB(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{
      const database=request.result;
      if(!database.objectStoreNames.contains(EVENTS)){
        const store=database.createObjectStore(EVENTS,{keyPath:'id'});
        store.createIndex('timestamp','timestamp');
        store.createIndex('type','type');
      }
      if(!database.objectStoreNames.contains(AUDIO)) database.createObjectStore(AUDIO,{keyPath:'id'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

function requestPromise(request){
  return new Promise((resolve,reject)=>{
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

function objectStore(name=EVENTS,mode='readonly'){
  return db.transaction(name,mode).objectStore(name);
}

async function getAllEvents(){ return requestPromise(objectStore().getAll()); }
async function putEvent(event){ return requestPromise(objectStore(EVENTS,'readwrite').put(event)); }
async function deleteEvent(id){
  await requestPromise(objectStore(EVENTS,'readwrite').delete(id));
  await requestPromise(objectStore(AUDIO,'readwrite').delete(id));
}
async function saveAudio(id,blob){ return requestPromise(objectStore(AUDIO,'readwrite').put({id,blob})); }
async function getAudio(id){ return requestPromise(objectStore(AUDIO).get(id)); }

async function seedDemo(){
  const existing=await getAllEvents();
  if(existing.length===0 && localStorage.getItem('registro-demo-seeded')!=='yes'){
    for(const event of demoEvents()) await putEvent(event);
    localStorage.setItem('registro-demo-seeded','yes');
  }
}

function humanAgo(iso){
  const diff=Math.max(0,Date.now()-new Date(iso).getTime());
  const min=Math.floor(diff/60000);
  if(min<1) return 'agora';
  if(min<60) return `há ${min} min`;
  const h=Math.floor(min/60);
  if(h<24) return `há ${h}h`;
  return `há ${Math.floor(h/24)}d`;
}

async function render(){
  const events=(await getAllEvents()).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  const dayEvents=events.filter(e=>eventDay(e)===selectedDate);
  const notes=dayEvents.filter(e=>e.type==='note');
  const meds=dayEvents.filter(e=>e.type==='medication');
  const purchases=dayEvents.filter(e=>e.type==='purchase');

  document.getElementById('dateLabel').textContent=selectedDate===localDate(new Date())
    ? `Hoje · ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}`
    : new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});

  document.getElementById('summaryMain').textContent=`${notes.length} ${notes.length===1?'anotação':'anotações'} · ${meds.length} ${meds.length===1?'administração':'administrações'} · ${purchases.length} ${purchases.length===1?'compra':'compras'}`;
  const summary=[];
  if(notes[0]) summary.push(`Última anotação ${humanAgo(notes[0].timestamp)}`);
  if(meds[0]) summary.push(`Último medicamento ${humanAgo(meds[0].timestamp)}`);
  document.getElementById('summarySub').textContent=summary.length?summary.join(' · '):'Nenhum registro neste dia.';

  const timeline=document.getElementById('timeline');
  timeline.innerHTML='';
  document.getElementById('empty').classList.toggle('hidden',dayEvents.length>0);

  for(const event of dayEvents){
    let kind='',kindClass='',title='',meta=[];
    if(event.type==='note'){
      kind=event.audioOnly?'ANOTAÇÃO DE VOZ':'ANOTAÇÃO';
      kindClass='note';
      title=event.text || 'Gravação de voz';
      if(event.tag) meta.push(event.tag);
    }
    if(event.type==='medication'){
      kind='MEDICAMENTO';
      kindClass='med';
      title=`${event.medication||'Medicamento'}${event.dose?` · ${event.dose}`:''}`;
      if(event.quantity) meta.push(event.quantity);
      if(event.note) meta.push(event.note);
    }
    if(event.type==='purchase'){
      kind='COMPRA';
      kindClass='buy';
      title=`${event.medication||'Medicamento'}${event.price?` · ${event.price}`:''}`;
      if(event.quantity) meta.push(event.quantity);
      if(event.place) meta.push(event.place);
    }

    const card=document.createElement('article');
    card.className='item';
    card.innerHTML=`
      <div class="time">${timeLabel(event.timestamp)}</div>
      <div>
        <div class="kind ${kindClass}">${kind}</div>
        <div class="body">${escapeHTML(title)}</div>
        ${meta.length?`<div class="meta">${meta.map(escapeHTML).join(' · ')}</div>`:''}
        ${event.hasAudio?`<div data-audio="${event.id}"></div>`:''}
      </div>
      <button class="menu" data-menu="${event.id}" aria-label="Opções do registro">•••</button>`;
    timeline.appendChild(card);
  }

  for(const slot of timeline.querySelectorAll('[data-audio]')){
    const record=await getAudio(slot.dataset.audio);
    if(record?.blob){
      const url=URL.createObjectURL(record.blob);
      slot.innerHTML=`<audio controls preload="metadata" src="${url}"></audio>`;
    }
  }
}

function showToast(message){
  const toast=document.getElementById('toast');
  toast.textContent=message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer=setTimeout(()=>toast.classList.remove('show'),2200);
}

function formButtons(){
  return `<div class="form-actions"><button type="button" class="secondary" data-cancel>Cancelar</button><button type="submit" class="primary">Salvar</button></div>`;
}

function openSheet(type){
  currentType=type;
  pendingAudio=null;
  const form=document.getElementById('form');
  const title=document.getElementById('sheetTitle');
  const dt=toLocalInput();

  if(type==='note'){
    title.textContent='Nova anotação';
    form.innerHTML=`
      <div class="field"><label>Anotação</label><textarea id="noteText" placeholder="O que você percebeu, sentiu ou pensou?"></textarea></div>
      <div class="voice"><button type="button" id="voiceBtn">🎙 Gravar voz</button><span id="voiceStatus">Opcional. O áudio fica neste aparelho.</span></div>
      <div class="field"><label>Tag opcional</label><input id="noteTag" placeholder="Ex.: ansiedade, calma, sono"></div>
      <div class="field"><label>Data e horário</label><input type="datetime-local" id="recordTime" value="${dt}"></div>
      <p class="helper">Você pode escrever, gravar voz ou usar os dois. Nesta V1 a gravação ainda não é transcrita automaticamente.</p>${formButtons()}`;
    setupVoice();
  }

  if(type==='medication'){
    title.textContent='Registrar medicamento';
    form.innerHTML=`
      <div class="field"><label>Medicamento ou substância</label><input id="medName" list="medications" placeholder="Ex.: Bupropiona"><datalist id="medications"><option value="Bupropiona"><option value="Paroxetina"><option value="Lamotrigina"></datalist></div>
      <div class="grid"><div class="field"><label>Dose</label><input id="dose" placeholder="150 mg"></div><div class="field"><label>Quantidade</label><input id="quantity" placeholder="1 comprimido"></div></div>
      <div class="field"><label>Observação opcional</label><input id="medNote" placeholder="Ex.: após comer"></div>
      <div class="field"><label>Data e horário</label><input type="datetime-local" id="recordTime" value="${dt}"></div>${formButtons()}`;
  }

  if(type==='purchase'){
    title.textContent='Registrar compra';
    form.innerHTML=`
      <div class="field"><label>Medicamento</label><input id="purchaseMed" placeholder="Ex.: Paroxetina 20 mg"></div>
      <div class="grid"><div class="field"><label>Quantidade</label><input id="purchaseQty" placeholder="2 caixas"></div><div class="field"><label>Valor pago</label><input id="purchasePrice" placeholder="R$ 42,90" inputmode="decimal"></div></div>
      <div class="field"><label>Onde comprou</label><input id="purchasePlace" placeholder="Farmácia ou loja"></div>
      <div class="field"><label>Data e horário</label><input type="datetime-local" id="recordTime" value="${dt}"></div>${formButtons()}`;
  }

  form.onsubmit=saveForm;
  form.querySelector('[data-cancel]').onclick=closeSheet;
  const backdrop=document.getElementById('backdrop');
  backdrop.classList.add('open');
  backdrop.setAttribute('aria-hidden','false');
}

function closeSheet(){
  if(mediaRecorder?.state==='recording') mediaRecorder.stop();
  document.getElementById('backdrop').classList.remove('open');
  document.getElementById('backdrop').setAttribute('aria-hidden','true');
  pendingAudio=null;
  currentType=null;
}

function setupVoice(){
  const button=document.getElementById('voiceBtn');
  const status=document.getElementById('voiceStatus');
  if(!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder==='undefined'){
    button.disabled=true;
    status.textContent='Gravação não disponível aqui. Você pode usar o ditado do teclado no campo de texto.';
    return;
  }
  button.onclick=async()=>{
    try{
      if(mediaRecorder?.state==='recording'){ mediaRecorder.stop(); return; }
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      audioChunks=[];
      mediaRecorder=new MediaRecorder(stream);
      mediaRecorder.ondataavailable=e=>{ if(e.data.size) audioChunks.push(e.data); };
      mediaRecorder.onstop=()=>{
        pendingAudio=new Blob(audioChunks,{type:mediaRecorder.mimeType||'audio/webm'});
        stream.getTracks().forEach(t=>t.stop());
        button.classList.remove('recording');
        button.textContent='✓ Voz gravada';
        status.textContent='Áudio pronto para ser salvo.';
      };
      mediaRecorder.start();
      button.classList.add('recording');
      button.textContent='■ Parar gravação';
      status.textContent='Gravando…';
    }catch(error){
      console.error(error);
      status.textContent='Não foi possível acessar o microfone. Use o ditado do teclado.';
    }
  };
}

async function saveForm(event){
  event.preventDefault();
  const time=document.getElementById('recordTime')?.value;
  if(!time) return showToast('Informe data e horário.');
  const timestamp=new Date(time).toISOString();
  const id=uid(currentType);
  let record;

  if(currentType==='note'){
    const text=document.getElementById('noteText').value.trim();
    if(!text && !pendingAudio) return showToast('Escreva ou grave uma anotação.');
    record={id,type:'note',timestamp,text,tag:document.getElementById('noteTag').value.trim(),hasAudio:Boolean(pendingAudio),audioOnly:Boolean(pendingAudio&&!text),demo:false};
  }
  if(currentType==='medication'){
    const medication=document.getElementById('medName').value.trim();
    if(!medication) return showToast('Informe o medicamento.');
    record={id,type:'medication',timestamp,medication,dose:document.getElementById('dose').value.trim(),quantity:document.getElementById('quantity').value.trim(),note:document.getElementById('medNote').value.trim(),demo:false};
  }
  if(currentType==='purchase'){
    const medication=document.getElementById('purchaseMed').value.trim();
    if(!medication) return showToast('Informe o medicamento.');
    record={id,type:'purchase',timestamp,medication,quantity:document.getElementById('purchaseQty').value.trim(),price:document.getElementById('purchasePrice').value.trim(),place:document.getElementById('purchasePlace').value.trim(),demo:false};
  }

  await putEvent(record);
  if(pendingAudio) await saveAudio(id,pendingAudio);
  selectedDate=eventDay(record);
  closeSheet();
  await render();
  showToast('Registro salvo.');
}

async function openEventMenu(id){
  const events=await getAllEvents();
  const event=events.find(e=>e.id===id);
  if(!event) return;
  document.getElementById('sheetTitle').textContent='Opções do registro';
  const form=document.getElementById('form');
  form.innerHTML=`<div class="options"><button type="button" id="goDay">Ir para ${new Date(event.timestamp).toLocaleDateString('pt-BR')}</button><button type="button" class="danger" id="deleteBtn">Excluir registro</button></div><p class="helper">A edição completa de registros será adicionada em uma próxima etapa.</p>`;
  document.getElementById('goDay').onclick=async()=>{ selectedDate=eventDay(event); closeSheet(); await render(); };
  document.getElementById('deleteBtn').onclick=async()=>{ if(confirm('Excluir este registro?')){ await deleteEvent(id); closeSheet(); await render(); showToast('Registro excluído.'); } };
  document.getElementById('backdrop').classList.add('open');
}

function openOptions(){
  document.getElementById('sheetTitle').textContent='Desenvolvimento';
  const form=document.getElementById('form');
  form.innerHTML=`<div class="options"><button type="button" id="restoreDemo">Restaurar dados fictícios</button><button type="button" class="danger" id="clearData">Apagar todos os registros locais</button></div><p class="helper">Nesta V1 os registros ficam somente neste navegador/aparelho.</p>`;
  document.getElementById('restoreDemo').onclick=async()=>{
    if(!confirm('Substituir os registros pelos exemplos fictícios?')) return;
    const events=await getAllEvents(); for(const e of events) await deleteEvent(e.id); for(const e of demoEvents()) await putEvent(e);
    selectedDate=localDate(new Date()); closeSheet(); await render(); showToast('Exemplos restaurados.');
  };
  document.getElementById('clearData').onclick=async()=>{
    if(!confirm('Apagar todos os registros deste aparelho?')) return;
    await requestPromise(objectStore(EVENTS,'readwrite').clear());
    await requestPromise(objectStore(AUDIO,'readwrite').clear());
    localStorage.setItem('registro-demo-seeded','yes');
    closeSheet(); await render(); showToast('Registros apagados.');
  };
  document.getElementById('backdrop').classList.add('open');
}

document.addEventListener('click',e=>{
  const action=e.target.closest('[data-type]'); if(action) openSheet(action.dataset.type);
  const menu=e.target.closest('[data-menu]'); if(menu) openEventMenu(menu.dataset.menu);
});
document.getElementById('closeBtn').onclick=closeSheet;
document.getElementById('optionsBtn').onclick=openOptions;
document.getElementById('todayBtn').onclick=async()=>{ selectedDate=localDate(new Date()); await render(); };
document.getElementById('backdrop').onclick=e=>{ if(e.target.id==='backdrop') closeSheet(); };

(async()=>{
  db=await openDB();
  await seedDemo();
  await render();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.error);
})();
