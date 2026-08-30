const APP_VERSION='0.3.0';
const DB_NAME='registro-mental-v1';
const EVENTS='events';
const AUDIO='audio';
const SETTINGS_KEY='registro-settings-v2';
const LAST_BACKUP_KEY='registro-last-backup';
const LAST_HEALTH_IMPORT_KEY='registro-last-health-import';
const BACKUP_WARN_DAYS=7;

let db;
let currentType=null;
let mediaRecorder=null;
let audioChunks=[];
let pendingAudio=null;
let pendingSleepSource='manual';
let pendingHealthPayload=null;
let historyFilter='all';

const icons={
  home:'<path d="M3 11.5 12 4l9 7.5"></path><path d="M5.5 10.5V20h13v-9.5"></path><path d="M9.5 20v-6h5v6"></path>',
  history:'<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"></path><path d="M3.5 5v5h5"></path><path d="M12 7.5V12l3 2"></path>',
  chart:'<path d="M4 19V10"></path><path d="M10 19V5"></path><path d="M16 19v-7"></path><path d="M22 19V8"></path>',
  settings:'<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 3.8 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2V9.6h.1A1.7 1.7 0 0 0 3.2 9a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.26 3.2l.06.06A1.7 1.7 0 0 0 8.2 3.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2h4v.1a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8c.1.4.3.75.6 1 .3.25.7.4 1.1.4h.1v4h-.1c-.4 0-.8.15-1.1.4-.3.25-.5.6-.6 1.2Z"></path>',
  note:'<path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"></path><path d="m13.5 6.5 4 4"></path>',
  pill:'<path d="M8 18.5 18.5 8a4.24 4.24 0 0 0-6-6L2 12.5a4.24 4.24 0 1 0 6 6Z"></path><path d="m8.5 6.5 9 9"></path>',
  moon:'<path d="M20 15.3A8 8 0 0 1 8.7 4 8.5 8.5 0 1 0 20 15.3Z"></path>',
  bag:'<path d="M5.5 8h13l-1 12h-11l-1-12Z"></path><path d="M9 8V6a3 3 0 0 1 6 0v2"></path>',
  spark:'<path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"></path><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"></path>',
  link:'<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"></path><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"></path>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"></path>',
  export:'<path d="M12 3v12"></path><path d="m7 8 5-5 5 5"></path><path d="M5 13v7h14v-7"></path>',
  import:'<path d="M12 15V3"></path><path d="m7 10 5 5 5-5"></path><path d="M5 13v7h14v-7"></path>'
};

function svg(name){return `<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name]||icons.note}</svg>`}
function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=svg(el.dataset.icon)})}
function localDate(date){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}
function atToday(h,m){const d=new Date();d.setHours(h,m,0,0);return d.toISOString()}
function yesterdayAt(h,m){const d=new Date();d.setDate(d.getDate()-1);d.setHours(h,m,0,0);return d.toISOString()}
function toLocalInput(iso=new Date().toISOString()){const d=new Date(iso),off=d.getTimezoneOffset()*60000;return new Date(d.getTime()-off).toISOString().slice(0,16)}
function eventDay(e){return localDate(new Date(e.timestamp))}
function uid(p){return `${p}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function timeLabel(i){return new Date(i).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
function dateTimeLabel(i){return new Date(i).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})+' · '+timeLabel(i)}
function dayLabel(s){const d=new Date(`${s}T12:00:00`),t=localDate(new Date()),y=new Date();y.setDate(y.getDate()-1);if(s===t)return'Hoje';if(s===localDate(y))return'Ontem';return d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'short'})}
function durationHours(a,b){return Math.max(0,(new Date(b)-new Date(a))/3600000)}
function durationLabel(x){if(!Number.isFinite(x))return'—';const h=Math.floor(x),m=Math.round((x-h)*60);return`${h}h${m?` ${m}min`:''}`}
function humanAgo(i){const min=Math.max(0,Math.floor((Date.now()-new Date(i))/60000));if(min<1)return'agora';if(min<60)return`há ${min} min`;const h=Math.floor(min/60);if(h<24)return`há ${h}h`;return`há ${Math.floor(h/24)}d`}
function parseMoney(v=''){const n=Number(String(v).replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.'));return Number.isFinite(n)?n:null}
function money(n){return n==null?'—':n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}

const demoEvents=()=>[
  {id:'demo-note-1',type:'note',timestamp:atToday(21,14),text:'Estou mais tranquilo agora.',tag:'calma',demo:true},
  {id:'demo-med-1',type:'medication',timestamp:atToday(18,32),medication:'Paroxetina',dose:'20 mg',quantity:'1 comprimido',note:'',demo:true},
  {id:'demo-note-2',type:'note',timestamp:atToday(15,10),text:'Estava bastante ansioso durante a tarde.',tag:'ansiedade',demo:true},
  {id:'demo-med-2',type:'medication',timestamp:atToday(9,3),medication:'Bupropiona',dose:'150 mg',quantity:'1 comprimido',note:'',demo:true},
  {id:'demo-sleep-1',type:'sleep',timestamp:atToday(7,20),startTime:yesterdayAt(23,50),endTime:atToday(7,20),quality:4,note:'Acordei uma vez durante a madrugada.',source:'manual',demo:true},
  {id:'demo-buy-1',type:'purchase',timestamp:yesterdayAt(17,20),medication:'Paroxetina 20 mg',quantity:'2 caixas',price:'R$ 41,90',place:'Farmácia de exemplo',demo:true}
];

function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains(EVENTS)){const s=d.createObjectStore(EVENTS,{keyPath:'id'});s.createIndex('timestamp','timestamp');s.createIndex('type','type')}if(!d.objectStoreNames.contains(AUDIO))d.createObjectStore(AUDIO,{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function store(name=EVENTS,mode='readonly'){return db.transaction(name,mode).objectStore(name)}
function req(r){return new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function allEvents(){return req(store().getAll())}
async function putEvent(e){return req(store(EVENTS,'readwrite').put(e))}
async function deleteEvent(id){await req(store(EVENTS,'readwrite').delete(id));await req(store(AUDIO,'readwrite').delete(id))}
async function saveAudio(id,blob){return req(store(AUDIO,'readwrite').put({id,blob}))}
async function getAudio(id){return req(store(AUDIO).get(id))}
async function seedDemo(){const e=await allEvents();if(!e.length&&localStorage.getItem('registro-demo-seeded')!=='yes'){for(const item of demoEvents())await putEvent(item);localStorage.setItem('registro-demo-seeded','yes')}}

const defaultSettings={theme:'system',accent:'violet',iconSize:'medium',iconWeight:'regular',showVersion:true,healthImportMode:'review'};
function getSettings(){try{return{...defaultSettings,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{return{...defaultSettings}}}
function setSetting(k,v){const s=getSettings();s[k]=v;localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));applySettings()}
function applySettings(){
  const s=getSettings();
  document.documentElement.dataset.theme=s.theme;
  document.documentElement.dataset.accent=s.accent;
  document.documentElement.dataset.iconSize=s.iconSize;
  document.documentElement.dataset.iconWeight=s.iconWeight;
  document.querySelectorAll('[data-theme-value]').forEach(b=>b.classList.toggle('selected',b.dataset.themeValue===s.theme));
  document.querySelectorAll('[data-accent]').forEach(b=>b.classList.toggle('selected',b.dataset.accent===s.accent));
  document.querySelectorAll('[data-icon-size]').forEach(b=>b.classList.toggle('selected',b.dataset.iconSize===s.iconSize));
  document.querySelectorAll('[data-icon-weight]').forEach(b=>b.classList.toggle('selected',b.dataset.iconWeight===s.iconWeight));
  document.querySelectorAll('[data-health-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.healthMode===s.healthImportMode));
  const version=document.getElementById('topVersion');
  if(version)version.classList.toggle('hidden',!s.showVersion);
  const toggle=document.getElementById('showVersionToggle');
  if(toggle)toggle.setAttribute('aria-checked',String(Boolean(s.showVersion)));
}

function summaryRow(icon,label,value){return`<div class="summary-row"><span class="summary-row-icon">${svg(icon)}</span><span class="summary-row-label">${label}</span><span class="summary-row-value">${value}</span></div>`}
function kindInfo(e){
  if(e.type==='note')return{kind:e.audioOnly?'ANOTAÇÃO DE VOZ':'ANOTAÇÃO',className:'note',title:e.text||'Gravação de voz',meta:[e.tag].filter(Boolean)};
  if(e.type==='medication')return{kind:'MEDICAMENTO',className:'medication',title:`${e.medication||'Medicamento'}${e.dose?` · ${e.dose}`:''}`,meta:[e.quantity,e.note].filter(Boolean)};
  if(e.type==='sleep')return{kind:'SONO',className:'sleep',title:durationLabel(durationHours(e.startTime,e.endTime)),meta:[e.quality?`Qualidade ${e.quality}/5`:null,e.source==='health-shortcut'?'Importado do Saúde':'Manual',e.note].filter(Boolean)};
  return{kind:'COMPRA',className:'purchase',title:`${e.medication||'Medicamento'}${e.price?` · ${e.price}`:''}`,meta:[e.quantity,e.place].filter(Boolean)};
}
function eventCard(e){const k=kindInfo(e);return`<article class="timeline-item"><div class="timeline-time">${timeLabel(e.timestamp)}</div><div><div class="timeline-kind kind-${k.className}">${k.kind}</div><div class="timeline-title">${esc(k.title)}</div>${k.meta.length?`<div class="timeline-meta">${k.meta.map(esc).join(' · ')}</div>`:''}${e.hasAudio?`<div data-audio="${e.id}"></div>`:''}</div><button class="item-menu" data-menu="${e.id}" aria-label="Opções">•••</button></article>`}
async function hydrateAudio(root){for(const el of root.querySelectorAll('[data-audio]')){const rec=await getAudio(el.dataset.audio);if(rec?.blob){const url=URL.createObjectURL(rec.blob);el.innerHTML=`<audio controls preload="metadata" src="${url}"></audio>`}}}

async function renderHome(events){
  const today=localDate(new Date());
  const day=events.filter(e=>eventDay(e)===today).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  const notes=day.filter(e=>e.type==='note'),meds=day.filter(e=>e.type==='medication'),sleeps=day.filter(e=>e.type==='sleep'),buys=day.filter(e=>e.type==='purchase');
  document.getElementById('dateLabel').textContent=`Hoje · ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}`;
  const sleepText=sleeps[0]?`${durationLabel(durationHours(sleeps[0].startTime,sleeps[0].endTime))}${sleeps[0].quality?` · ${sleeps[0].quality}/5`:''}`:'Nenhum';
  document.getElementById('summaryList').innerHTML=[summaryRow('note','Anotações',String(notes.length)),summaryRow('pill','Medicamentos',String(meds.length)),summaryRow('moon','Sono',sleepText),summaryRow('bag','Compras',String(buys.length))].join('');
  const recent=day.slice(0,5),box=document.getElementById('homeTimeline');
  box.innerHTML=recent.map(eventCard).join('');
  document.getElementById('homeEmpty').classList.toggle('hidden',recent.length>0);
  await hydrateAudio(box);
}

async function renderHistory(events){
  const filtered=events.filter(e=>historyFilter==='all'||e.type===historyFilter).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  const container=document.getElementById('historyList');container.innerHTML='';let current='';
  for(const e of filtered){const d=eventDay(e);if(d!==current){current=d;container.insertAdjacentHTML('beforeend',`<div class="history-day">${dayLabel(d)}</div>`)}container.insertAdjacentHTML('beforeend',eventCard(e))}
  document.getElementById('historyEmpty').classList.toggle('hidden',filtered.length>0);
  await hydrateAudio(container);
}

function moodTerms(text=''){const t=text.toLowerCase(),terms=['calmo','tranquilo','bem','feliz','ansioso','ansiedade','irritado','triste','agitado','cansado','sonolento','insônia','foco','concentrado'];return terms.filter(term=>t.includes(term))}
function analysisRow(title,text){return`<div class="analysis-row"><strong>${esc(title)}</strong><span>${esc(text)}</span></div>`}
function metric(value,label){return`<div class="metric"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`}
function medLines(meds){if(!meds.length)return'<span>Nenhum medicamento registrado nesse período.</span>';return`<div class="med-list">${meds.map(m=>`<div class="med-line"><time>${timeLabel(m.timestamp)}</time><span>${esc(`${m.medication||'Medicamento'}${m.dose?` · ${m.dose}`:''}`)}</span></div>`).join('')}</div>`}
function medicationPeriodBlock(title,subtitle,meds,note=''){return`<div class="analysis-row"><strong>${esc(title)}</strong><span>${esc(subtitle)}</span>${medLines(meds)}${note?`<div class="analysis-note">${esc(note)}</div>`:''}</div>`}

function currentMedicationContext(events){
  const now=Date.now();
  const meds=events.filter(e=>e.type==='medication'&&Number.isFinite(new Date(e.timestamp).getTime())).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  const sleeps=events.filter(e=>e.type==='sleep'&&e.endTime&&new Date(e.endTime).getTime()<=now&&new Date(e.startTime)<new Date(e.endTime)).sort((a,b)=>new Date(b.endTime)-new Date(a.endTime));
  const lastSleep=sleeps[0];
  if(lastSleep){
    const wakeMs=new Date(lastSleep.endTime).getTime();
    const current=meds.filter(m=>{const t=new Date(m.timestamp).getTime();return t>=wakeMs&&t<=now}).reverse();
    const context=meds.filter(m=>{const t=new Date(m.timestamp).getTime();return t>=wakeMs-24*3600000&&t<wakeMs}).reverse();
    return{mode:'wake',lastSleep,wakeMs,current,context};
  }
  const start=now-24*3600000;
  return{mode:'fallback',current:meds.filter(m=>new Date(m.timestamp).getTime()>=start).reverse(),context:[]};
}

async function renderAnalysis(events){
  const sorted=[...events].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  const latestNote=sorted.find(e=>e.type==='note');
  const lastSleep=sorted.find(e=>e.type==='sleep');
  const ctx=currentMedicationContext(sorted);
  const currentParts=[];
  currentParts.push(analysisRow('Último relato',latestNote?`“${latestNote.text||'Anotação de voz'}” · ${humanAgo(latestNote.timestamp)}`:'Ainda não há anotações.'));
  if(ctx.mode==='wake'){
    currentParts.push(`<div class="analysis-period"><strong>Ciclo atual de vigília</strong><span>Começou no último despertar registrado: ${esc(dateTimeLabel(ctx.lastSleep.endTime))}. O app não usa meia-noite como limite do seu “dia”.</span></div>`);
    currentParts.push(medicationPeriodBlock('Medicamentos desde o último despertar',`${ctx.current.length} administração(ões) neste ciclo de vigília.`,ctx.current,'Este grupo representa o período em que você está acordado desde o último sono registrado.'));
    currentParts.push(medicationPeriodBlock('Contexto das 24h anteriores ao despertar',`${ctx.context.length} administração(ões) antes de acordar.`,ctx.context,'Contexto temporal apenas: aparecer aqui não significa que o medicamento causou algo depois.'));
  }else{
    currentParts.push(`<div class="analysis-period"><strong>Período provisório</strong><span>Não há um despertar recente utilizável. Por isso, a análise está usando as últimas 24 horas como contexto.</span></div>`);
    currentParts.push(medicationPeriodBlock('Medicamentos nas últimas 24h',`${ctx.current.length} administração(ões) nesse intervalo.`,ctx.current));
  }
  currentParts.push(analysisRow('Sono mais recente',lastSleep?`${durationLabel(durationHours(lastSleep.startTime,lastSleep.endTime))}${lastSleep.quality?` · qualidade ${lastSleep.quality}/5`:''} · acordou ${humanAgo(lastSleep.endTime)}`:'Ainda não há registros de sono.'));
  document.getElementById('currentAnalysis').innerHTML=currentParts.join('');

  const meds=sorted.filter(e=>e.type==='medication'),notes=sorted.filter(e=>e.type==='note'&&e.text),grouped={};
  for(const m of meds){const key=m.medication||'Medicamento';if(!grouped[key])grouped[key]={count:0,terms:[]};const start=new Date(m.timestamp).getTime(),end=start+8*3600000,nearby=notes.filter(n=>{const t=new Date(n.timestamp).getTime();return t>=start&&t<=end});grouped[key].count+=nearby.length;grouped[key].terms.push(...nearby.flatMap(n=>moodTerms(n.text)))}
  const assoc=Object.entries(grouped).sort((a,b)=>b[1].count-a[1].count).slice(0,3);
  document.getElementById('associationAnalysis').innerHTML=assoc.length?assoc.map(([name,data])=>{const counts={};data.terms.forEach(t=>counts[t]=(counts[t]||0)+1);const common=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t,c])=>`${t} (${c})`).join(', ');return analysisRow(name,`${data.count} anotação(ões) registrada(s) até 8h após administrações${common?`. Termos recorrentes: ${common}`:''}. Associação temporal, não causal.`)}).join(''):analysisRow('Ainda sem padrão','Registre administrações e anotações ao longo do tempo para começar a comparar proximidade temporal.');

  const sleeps=sorted.filter(e=>e.type==='sleep'),avg=sleeps.length?sleeps.reduce((s,e)=>s+durationHours(e.startTime,e.endTime),0)/sleeps.length:null,q=sleeps.filter(e=>Number(e.quality)),avgQ=q.length?q.reduce((s,e)=>s+Number(e.quality),0)/q.length:null;
  document.getElementById('sleepAnalysis').innerHTML=[metric(avg==null?'—':durationLabel(avg),'Média de duração'),metric(avgQ==null?'—':`${avgQ.toFixed(1)}/5`,'Qualidade média'),metric(String(sleeps.length),'Noites registradas'),metric(sleeps[0]?durationLabel(durationHours(sleeps[0].startTime,sleeps[0].endTime)):'—','Último sono')].join('');

  const purchases=sorted.filter(e=>e.type==='purchase'),groups={};
  for(const p of purchases){const n=parseMoney(p.price);if(n==null)continue;const key=p.medication||'Medicamento';(groups[key]??=[]).push(n)}
  const prices=Object.entries(groups).slice(0,5);
  document.getElementById('purchaseAnalysis').innerHTML=prices.length?prices.map(([name,vals])=>analysisRow(name,`${vals.length} compra(s) · média ${money(vals.reduce((a,b)=>a+b,0)/vals.length)} · menor ${money(Math.min(...vals))} · maior ${money(Math.max(...vals))}`)).join(''):analysisRow('Ainda sem histórico de preço','Registre compras com valor para acompanhar média, menor e maior preço por medicamento.');
}

function backupState(){
  const raw=localStorage.getItem(LAST_BACKUP_KEY);
  if(!raw)return{stale:true,text:'Nenhum backup externo criado ainda.',warning:'Você ainda não criou uma cópia externa dos registros.'};
  const date=new Date(raw);if(Number.isNaN(date.getTime()))return{stale:true,text:'Data do último backup indisponível.',warning:'Crie um novo backup para atualizar o controle.'};
  const days=Math.floor((Date.now()-date.getTime())/86400000);
  if(days<=0)return{stale:false,text:`Último backup hoje · ${timeLabel(date)}`,warning:''};
  if(days===1)return{stale:false,text:'Último backup ontem.',warning:''};
  return{stale:days>=BACKUP_WARN_DAYS,text:`Último backup há ${days} dias.`,warning:`O último backup foi criado há ${days} dias.`};
}
function renderSettingsMeta(){
  const backup=backupState();
  const status=document.getElementById('backupStatusText');if(status)status.textContent=backup.text;
  const warning=document.getElementById('backupWarning');if(warning)warning.classList.toggle('hidden',!backup.stale);
  const warningText=document.getElementById('backupWarningText');if(warningText)warningText.textContent=backup.warning||'Crie um novo backup para manter uma cópia externa dos registros.';
  const lastHealth=localStorage.getItem(LAST_HEALTH_IMPORT_KEY),health=document.getElementById('healthStatusText');
  if(health)health.textContent=lastHealth?`Última importação ${humanAgo(lastHealth)}`:'Não configurado neste aparelho';
}

async function renderAll(){const events=(await allEvents()).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));await renderHome(events);await renderHistory(events);await renderAnalysis(events);hydrateIcons();applySettings();renderSettingsMeta()}

function dateField(id,label,value,{tag='agora',trackNow=true}={}){return`<div class="field"><label for="${id}">${label}</label><div class="date-row"><input class="date-input" type="datetime-local" id="${id}" value="${value}"${trackNow?` data-now-base="${value}"`:''}>${tag?`<span class="now-tag" ${trackNow?`data-now-tag-for="${id}"`:''}>${esc(tag)}</span>`:''}</div></div>`}
function activateNowTags(root=document){root.querySelectorAll('.date-input[data-now-base]').forEach(input=>{const tag=root.querySelector(`[data-now-tag-for="${input.id}"]`),update=()=>{if(tag)tag.classList.toggle('hidden',input.value!==input.dataset.nowBase)};input.addEventListener('input',update);input.addEventListener('change',update);update()})}
function formButtons(){return'<div class="form-actions"><button type="button" class="secondary-button" data-cancel>Cancelar</button><button type="submit" class="primary-button">Salvar</button></div>'}
function sleepQualityOptions(selected=''){return`<option value="" ${selected===''?'selected':''}>Não informar</option><option value="5" ${String(selected)==='5'?'selected':''}>5 · Ótima</option><option value="4" ${String(selected)==='4'?'selected':''}>4 · Boa</option><option value="3" ${String(selected)==='3'?'selected':''}>3 · Regular</option><option value="2" ${String(selected)==='2'?'selected':''}>2 · Ruim</option><option value="1" ${String(selected)==='1'?'selected':''}>1 · Péssima</option>`}

function openSheet(type){
  currentType=type;pendingAudio=null;pendingSleepSource='manual';
  const form=document.getElementById('form'),title=document.getElementById('sheetTitle'),now=toLocalInput();
  if(type==='note'){
    title.textContent='Nova anotação';
    form.innerHTML=`<div class="field"><label for="noteText">Anotação</label><textarea id="noteText" placeholder="O que você percebeu, sentiu ou pensou?"></textarea></div><div class="voice-row"><button type="button" class="voice-button" id="voiceBtn">🎙 Gravar voz</button><span class="voice-status" id="voiceStatus">Opcional. O áudio fica neste aparelho.</span></div><div class="field"><label for="noteTag">Tag opcional</label><input id="noteTag" placeholder="Ex.: ansiedade, calma, sono"></div>${dateField('recordTime','Data e horário',now)}<p class="helper">“agora” desaparece se você alterar a data ou o horário.</p>${formButtons()}`;setupVoice();
  }
  if(type==='medication'){
    title.textContent='Registrar medicamento';
    form.innerHTML=`<div class="field"><label for="medName">Medicamento ou substância</label><input id="medName" list="medications" placeholder="Ex.: Bupropiona"><datalist id="medications"><option value="Bupropiona"><option value="Paroxetina"><option value="Lamotrigina"></datalist></div><div class="field-grid"><div class="field"><label for="dose">Dose</label><input id="dose" placeholder="150 mg"></div><div class="field"><label for="quantity">Quantidade</label><input id="quantity" placeholder="1 comprimido"></div></div><div class="field"><label for="medNote">Observação opcional</label><input id="medNote" placeholder="Ex.: após comer"></div>${dateField('recordTime','Data e horário',now)}<p class="helper">Se você tomou há algum tempo, ajuste a data e o horário antes de salvar.</p>${formButtons()}`;
  }
  if(type==='purchase'){
    title.textContent='Registrar compra';
    form.innerHTML=`<div class="field"><label for="purchaseMed">Medicamento</label><input id="purchaseMed" placeholder="Ex.: Paroxetina 20 mg"></div><div class="field-grid"><div class="field"><label for="purchaseQty">Quantidade</label><input id="purchaseQty" placeholder="2 caixas"></div><div class="field"><label for="purchasePrice">Valor pago</label><input id="purchasePrice" inputmode="decimal" placeholder="R$ 42,90"></div></div><div class="field"><label for="purchasePlace">Onde comprou</label><input id="purchasePlace" placeholder="Farmácia ou loja"></div>${dateField('recordTime','Data e horário',now)}<p class="helper">Altere o horário se estiver registrando uma compra anterior.</p>${formButtons()}`;
  }
  if(type==='sleep'){
    const start=new Date(Date.now()-8*3600000).toISOString();title.textContent='Registrar sono';
    form.innerHTML=`${dateField('sleepStart','Dormiu às',toLocalInput(start),{tag:'',trackNow:false})}${dateField('sleepEnd','Acordou às',now)}<div class="field"><label for="sleepQuality">Qualidade percebida</label><select id="sleepQuality">${sleepQualityOptions('4')}</select></div><div class="field"><label for="sleepNote">Observações opcionais</label><textarea id="sleepNote" placeholder="Ex.: acordei duas vezes, tive pesadelos, demorei para dormir…"></textarea></div><p class="helper">O Apple Watch pode ajudar com horários, mas o registro manual continua sempre disponível.</p>${formButtons()}`;
  }
  form.onsubmit=saveForm;form.querySelector('[data-cancel]').onclick=closeSheet;activateNowTags(form);openBackdrop();
}

function openBackdrop(){const b=document.getElementById('backdrop');b.classList.add('open');b.setAttribute('aria-hidden','false')}
function closeSheet(){if(mediaRecorder?.state==='recording')mediaRecorder.stop();const b=document.getElementById('backdrop');b.classList.remove('open');b.setAttribute('aria-hidden','true');pendingAudio=null;pendingSleepSource='manual';pendingHealthPayload=null;currentType=null}
function setupVoice(){const button=document.getElementById('voiceBtn'),status=document.getElementById('voiceStatus');if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){button.disabled=true;status.textContent='Use o ditado do teclado para transformar voz em texto.';return}button.onclick=async()=>{try{if(mediaRecorder?.state==='recording'){mediaRecorder.stop();return}const stream=await navigator.mediaDevices.getUserMedia({audio:true});audioChunks=[];mediaRecorder=new MediaRecorder(stream);mediaRecorder.ondataavailable=e=>{if(e.data.size)audioChunks.push(e.data)};mediaRecorder.onstop=()=>{pendingAudio=new Blob(audioChunks,{type:mediaRecorder.mimeType||'audio/webm'});stream.getTracks().forEach(t=>t.stop());button.classList.remove('recording');button.textContent='✓ Voz gravada';status.textContent='Áudio pronto para salvar.'};mediaRecorder.start();button.classList.add('recording');button.textContent='■ Parar';status.textContent='Gravando…'}catch{status.textContent='Não foi possível acessar o microfone. Use o ditado do teclado.'}}}

async function isDuplicateSleep(start,end){const s=new Date(start).getTime(),e=new Date(end).getTime();return(await allEvents()).some(x=>x.type==='sleep'&&x.startTime&&x.endTime&&Math.abs(new Date(x.startTime).getTime()-s)<60000&&Math.abs(new Date(x.endTime).getTime()-e)<60000)}
async function saveForm(ev){
  ev.preventDefault();const id=uid(currentType);let record;
  if(currentType==='note'){const text=document.getElementById('noteText').value.trim();if(!text&&!pendingAudio)return toast('Escreva ou grave uma anotação.');record={id,type:'note',timestamp:new Date(document.getElementById('recordTime').value).toISOString(),text,tag:document.getElementById('noteTag').value.trim(),hasAudio:Boolean(pendingAudio),audioOnly:Boolean(pendingAudio&&!text),demo:false}}
  if(currentType==='medication'){const medication=document.getElementById('medName').value.trim();if(!medication)return toast('Informe o medicamento.');record={id,type:'medication',timestamp:new Date(document.getElementById('recordTime').value).toISOString(),medication,dose:document.getElementById('dose').value.trim(),quantity:document.getElementById('quantity').value.trim(),note:document.getElementById('medNote').value.trim(),demo:false}}
  if(currentType==='purchase'){const medication=document.getElementById('purchaseMed').value.trim();if(!medication)return toast('Informe o medicamento.');record={id,type:'purchase',timestamp:new Date(document.getElementById('recordTime').value).toISOString(),medication,quantity:document.getElementById('purchaseQty').value.trim(),price:document.getElementById('purchasePrice').value.trim(),place:document.getElementById('purchasePlace').value.trim(),demo:false}}
  if(currentType==='sleep'){
    const start=new Date(document.getElementById('sleepStart').value),end=new Date(document.getElementById('sleepEnd').value);if(!(start<end))return toast('O horário de acordar precisa ser posterior ao horário de dormir.');
    if(pendingSleepSource==='health-shortcut'&&await isDuplicateSleep(start,end))return toast('Este sono já está registrado.');
    const q=document.getElementById('sleepQuality').value;
    record={id,type:'sleep',timestamp:end.toISOString(),startTime:start.toISOString(),endTime:end.toISOString(),quality:q?Number(q):null,note:document.getElementById('sleepNote').value.trim(),source:pendingSleepSource,demo:false};
  }
  await putEvent(record);if(pendingAudio)await saveAudio(id,pendingAudio);if(record.type==='sleep'&&record.source==='health-shortcut')localStorage.setItem(LAST_HEALTH_IMPORT_KEY,new Date().toISOString());closeSheet();await renderAll();toast(record.type==='sleep'&&record.source==='health-shortcut'?'Sono do Saúde salvo.':'Registro salvo.');
}

async function openEventMenu(id){const events=await allEvents(),e=events.find(x=>x.id===id);if(!e)return;document.getElementById('sheetTitle').textContent='Opções do registro';const form=document.getElementById('form');form.innerHTML='<div class="sheet-options"><button type="button" class="sheet-option" id="detailBtn">Ver detalhes</button><button type="button" class="sheet-option danger" id="deleteBtn">Excluir registro</button></div><p class="helper">A edição completa de registros já salvos continua planejada. Importações do Saúde podem ser revisadas antes de salvar.</p>';document.getElementById('detailBtn').onclick=()=>toast(kindInfo(e).title);document.getElementById('deleteBtn').onclick=async()=>{if(confirm('Excluir este registro?')){await deleteEvent(id);closeSheet();await renderAll();toast('Registro excluído.')}};openBackdrop()}

function shortcutTemplate(){return`${location.origin}${location.pathname}?import=sleep&sleepStart=[INICIO_ISO]&sleepEnd=[FIM_ISO]&sleepQuality=[1-5]`}
function healthImportInfo(){
  document.getElementById('sheetTitle').textContent='Apple Saúde via Atalho';
  const form=document.getElementById('form');
  form.innerHTML=`<div class="source-banner"><span>${svg('heart')}</span><div><strong>Ponte pelo Atalhos</strong><br>O PWA não acessa o HealthKit diretamente.</div></div><div class="setup-list"><div class="setup-step"><span>1</span><div><strong>Buscar o sono no app Saúde</strong><small>No Atalho, use “Buscar Amostras de Saúde” e filtre por Sono e pelos dados mais recentes.</small></div></div><div class="setup-step"><span>2</span><div><strong>Obter início e fim</strong><small>Use os horários do sono mais recente e formate as datas em ISO.</small></div></div><div class="setup-step"><span>3</span><div><strong>Abrir este app com os dados</strong><small>Monte uma URL usando o modelo abaixo e execute “Abrir URLs”.</small></div></div><div class="setup-step"><span>4</span><div><strong>Automatizar no iPhone</strong><small>Depois de testar manualmente, use uma Automação do Atalhos ao desativar o Foco Sono ou ao acordar.</small></div></div></div><div class="code-box" id="shortcutTemplate">${esc(shortcutTemplate())}</div><p class="helper">Modo atual: <strong>${getSettings().healthImportMode==='auto'?'Salvar automaticamente':getSettings().healthImportMode==='ask'?'Perguntar sempre':'Revisar antes de salvar'}</strong>. O registro manual de sono continua disponível independentemente do Apple Watch.</p><div class="form-actions"><button type="button" class="secondary-button" data-cancel>Fechar</button><button type="button" class="primary-button" id="copyShortcutTemplate">Copiar modelo</button></div>`;
  form.querySelector('[data-cancel]').onclick=closeSheet;
  document.getElementById('copyShortcutTemplate').onclick=async()=>{try{await navigator.clipboard.writeText(shortcutTemplate());toast('Modelo de URL copiado.')}catch{toast('Não foi possível copiar automaticamente.')}};
  openBackdrop();hydrateIcons(form);
}

function parseHealthPayload(){
  const p=new URLSearchParams(location.search);
  if((p.get('import')!=='sleep'&&!p.has('sleepStart'))||!p.has('sleepStart')||!p.has('sleepEnd'))return null;
  const start=new Date(p.get('sleepStart')),end=new Date(p.get('sleepEnd'));
  if(!(start<end))return null;
  const quality=p.get('sleepQuality');
  return{startTime:start.toISOString(),endTime:end.toISOString(),quality:quality&&Number(quality)>=1&&Number(quality)<=5?Number(quality):null,note:p.get('sleepNote')||''};
}

function openSleepReview(payload){
  pendingHealthPayload=payload;pendingSleepSource='health-shortcut';currentType='sleep';
  document.getElementById('sheetTitle').textContent='Revisar sono importado';
  const form=document.getElementById('form');
  form.innerHTML=`<div class="source-banner"><span>${svg('heart')}</span><div><strong>Dados recebidos do Apple Saúde</strong><br>Confira e corrija antes de salvar.</div></div>${dateField('sleepStart','Dormiu às',toLocalInput(payload.startTime),{tag:'Saúde',trackNow:false})}${dateField('sleepEnd','Acordou às',toLocalInput(payload.endTime),{tag:'Saúde',trackNow:false})}<div class="field"><label for="sleepQuality">Qualidade percebida</label><select id="sleepQuality">${sleepQualityOptions(payload.quality??'')}</select></div><div class="field"><label for="sleepNote">Observações opcionais</label><textarea id="sleepNote" placeholder="Adicione algo que o relógio não captou…">${esc(payload.note)}</textarea></div><p class="helper">Você pode alterar qualquer campo. O Apple Watch funciona como fonte inicial, não como registro imutável.</p>${formButtons()}`;
  form.onsubmit=saveForm;form.querySelector('[data-cancel]').onclick=closeSheet;openBackdrop();hydrateIcons(form);
}

async function saveHealthPayloadDirect(payload){
  if(await isDuplicateSleep(payload.startTime,payload.endTime)){toast('Este sono já está registrado.');return}
  await putEvent({id:uid('sleep-health'),type:'sleep',timestamp:payload.endTime,startTime:payload.startTime,endTime:payload.endTime,quality:payload.quality,note:payload.note||'',source:'health-shortcut',demo:false});
  localStorage.setItem(LAST_HEALTH_IMPORT_KEY,new Date().toISOString());await renderAll();toast('Sono importado automaticamente.');
}

function openHealthImportChoice(payload){
  pendingHealthPayload=payload;document.getElementById('sheetTitle').textContent='Sono recebido do Saúde';const form=document.getElementById('form');
  form.innerHTML=`<div class="source-banner"><span>${svg('heart')}</span><div><strong>${esc(durationLabel(durationHours(payload.startTime,payload.endTime)))}</strong><br>${esc(dateTimeLabel(payload.startTime))} → ${esc(dateTimeLabel(payload.endTime))}</div></div><div class="import-choice"><button type="button" id="reviewImportBtn"><strong>Revisar antes de salvar</strong><small>Permite corrigir horários, qualidade e observações.</small></button><button type="button" id="saveImportNowBtn"><strong>Salvar agora</strong><small>Usa os dados exatamente como chegaram do Atalho.</small></button></div><div class="form-actions"><button type="button" class="secondary-button" data-cancel>Cancelar</button><span></span></div>`;
  form.querySelector('[data-cancel]').onclick=closeSheet;document.getElementById('reviewImportBtn').onclick=()=>openSleepReview(payload);document.getElementById('saveImportNowBtn').onclick=async()=>{closeSheet();await saveHealthPayloadDirect(payload)};openBackdrop();hydrateIcons(form);
}

async function handleShortcutImport(){
  const payload=parseHealthPayload();if(!payload)return;
  history.replaceState({},'',location.pathname);
  const mode=getSettings().healthImportMode;
  if(mode==='auto'){await saveHealthPayloadDirect(payload);return}
  if(mode==='ask'){openHealthImportChoice(payload);return}
  openSleepReview(payload);
}

function switchTab(name){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===name));document.querySelectorAll('.tab-item').forEach(b=>b.classList.toggle('selected',b.dataset.tab===name));window.scrollTo({top:0,behavior:'instant'});if(name==='analysis'||name==='settings')renderAll()}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2400)}

async function exportData(){
  const events=await allEvents(),payload={app:'Registro',version:APP_VERSION,exportedAt:new Date().toISOString(),settings:getSettings(),events},blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');
  const url=URL.createObjectURL(blob);a.href=url;a.download=`registro-backup-${localDate(new Date())}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  localStorage.setItem(LAST_BACKUP_KEY,new Date().toISOString());renderSettingsMeta();toast('Backup JSON criado.');
}
async function importData(file){try{const data=JSON.parse(await file.text()),events=Array.isArray(data)?data:data.events;if(!Array.isArray(events))throw new Error();let count=0;for(const e of events){if(!e?.id||!['note','medication','sleep','purchase'].includes(e.type)||!e.timestamp)continue;await putEvent(e);count++}if(data?.settings&&typeof data.settings==='object'){localStorage.setItem(SETTINGS_KEY,JSON.stringify({...getSettings(),...data.settings}))}closeSheet();await renderAll();toast(`${count} registro(s) importado(s).`)}catch{toast('Arquivo de backup inválido.')}}
async function restoreDemo(){if(!confirm('Substituir todos os registros pelos dados fictícios?'))return;for(const e of await allEvents())await deleteEvent(e.id);for(const e of demoEvents())await putEvent(e);localStorage.setItem('registro-demo-seeded','yes');await renderAll();toast('Dados fictícios restaurados.')}
async function clearData(){if(!confirm('Apagar todos os registros deste aparelho?'))return;await req(store(EVENTS,'readwrite').clear());await req(store(AUDIO,'readwrite').clear());localStorage.setItem('registro-demo-seeded','yes');await renderAll();toast('Dados locais apagados.')}

document.addEventListener('click',e=>{
  const action=e.target.closest('[data-type]');if(action)openSheet(action.dataset.type);
  const menu=e.target.closest('[data-menu]');if(menu)openEventMenu(menu.dataset.menu);
  const tab=e.target.closest('[data-tab]');if(tab)switchTab(tab.dataset.tab);
  const go=e.target.closest('[data-go]');if(go)switchTab(go.dataset.go);
  const filter=e.target.closest('[data-filter]');if(filter){historyFilter=filter.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('selected',b===filter));renderAll()}
  const theme=e.target.closest('[data-theme-value]');if(theme)setSetting('theme',theme.dataset.themeValue);
  const accent=e.target.closest('[data-accent]');if(accent)setSetting('accent',accent.dataset.accent);
  const size=e.target.closest('[data-icon-size]');if(size)setSetting('iconSize',size.dataset.iconSize);
  const weight=e.target.closest('[data-icon-weight]');if(weight)setSetting('iconWeight',weight.dataset.iconWeight);
  const mode=e.target.closest('[data-health-mode]');if(mode)setSetting('healthImportMode',mode.dataset.healthMode);
});

document.getElementById('closeBtn').onclick=closeSheet;
document.getElementById('backdrop').onclick=e=>{if(e.target.id==='backdrop')closeSheet()};
document.getElementById('homeOptionsBtn').onclick=()=>switchTab('settings');
document.getElementById('showVersionToggle').onclick=()=>setSetting('showVersion',!getSettings().showVersion);
document.getElementById('exportBtn').onclick=exportData;
document.getElementById('importBtn').onclick=()=>document.getElementById('importFile').click();
document.getElementById('importFile').onchange=e=>{const file=e.target.files?.[0];if(file)importData(file);e.target.value=''};
document.getElementById('healthImportInfoBtn').onclick=healthImportInfo;
document.getElementById('restoreDemoBtn').onclick=restoreDemo;
document.getElementById('clearBtn').onclick=clearData;
document.getElementById('versionLabel').textContent=APP_VERSION;
document.getElementById('topVersion').textContent=`v${APP_VERSION}`;

(async()=>{
  applySettings();hydrateIcons();db=await openDB();await seedDemo();await renderAll();await handleShortcutImport();if('serviceWorker'in navigator)navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`).catch(console.error);
})();