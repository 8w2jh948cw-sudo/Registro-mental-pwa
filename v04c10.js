/* Visualização segura dos registros: tocar abre detalhes; editar exige uma segunda ação explícita. */
function registroDetailDate(value){if(!value)return '—';const d=new Date(value);if(Number.isNaN(d.getTime()))return '—';return d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function registroDetailRow(label,value){if(value===null||value===undefined||String(value).trim()==='')return'';return`<div class="analysis-row"><strong>${esc(label)}</strong><span>${esc(String(value))}</span></div>`}
async function openEventViewer(id){const e=(await allEvents()).find(x=>x.id===id);if(!e)return;let title='Detalhes do registro',rows=[];const meds=await allMedications(),m=meds.find(x=>x.id===e.medicationId)||findProfileByEvent(e,meds),p=findPresentation(m,e.presentationId),presentation=p?presentationDisplay(p):'';
if(e.type==='note'){title='Anotação';rows=[registroDetailRow('Anotação',e.text||'Anotação de voz'),registroDetailRow('Tag',e.tag),registroDetailRow('Data e horário',registroDetailDate(e.timestamp))]}
else if(e.type==='medication'){title='Medicamento';rows=[registroDetailRow('Medicamento',e.medication||'Medicamento'),registroDetailRow('Apresentação',presentation),registroDetailRow('Dose',e.dose||(e.totalDoseValue!=null?`${e.totalDoseValue} ${e.doseUnit||''}`.trim():'')),registroDetailRow('Quantidade',e.unitsTaken?`${e.unitsTaken} unidade(s)`:e.quantity),registroDetailRow('Observação',e.note),registroDetailRow('Data e horário',registroDetailDate(e.timestamp))]}
else if(e.type==='sleep'){title='Sono';rows=[registroDetailRow('Dormiu às',registroDetailDate(e.startTime)),registroDetailRow('Acordou às',registroDetailDate(e.endTime)),registroDetailRow('Duração',durationLabel(durationHours(e.startTime,e.endTime))),registroDetailRow('Qualidade percebida',e.quality?`${e.quality} de 5`:''),registroDetailRow('Observações',e.note),registroDetailRow('Origem',e.source==='health-shortcut'?'Importado do app Saúde':'Manual')]}
else if(e.type==='purchase'){title='Compra';rows=[registroDetailRow('Medicamento',e.medication||'Medicamento'),registroDetailRow('Apresentação',presentation),registroDetailRow('Caixas',e.packages),registroDetailRow('Total de unidades',e.totalUnits),registroDetailRow('Valor pago',e.price),registroDetailRow('Onde comprou',e.place),registroDetailRow('Data e horário',registroDetailDate(e.timestamp))]}
else return;
const audio=e.hasAudio?`<div class="analysis-row"><strong>Áudio</strong><span data-audio="${e.id}"></span></div>`:'';
openBackdrop(title,`<div class="analysis-stack">${rows.join('')}${audio}</div><div class="form-actions"><button type="button" class="secondary-button" id="viewerCloseBtn">Fechar</button><button type="button" class="primary-button" id="viewerEditBtn">Editar</button></div>`,ev=>ev.preventDefault());
document.getElementById('viewerCloseBtn').onclick=closeSheet;document.getElementById('viewerEditBtn').onclick=()=>openEventEditor(id);if(e.hasAudio)await hydrateAudio(document.getElementById('form'))}

document.addEventListener('click',e=>{if(e.target.closest('[data-menu],button,audio,input,textarea,select,a'))return;const card=e.target.closest('.timeline-item');if(!card)return;const id=card.querySelector('[data-menu]')?.dataset.menu;if(!id)return;e.preventDefault();e.stopImmediatePropagation();openEventViewer(id)},true);

/* Cores semânticas: o mesmo tipo de registro mantém a mesma identidade em todas as telas. */
(function ensureSemanticIconColors(){if(document.getElementById('semantic-icon-colors'))return;const st=document.createElement('style');st.id='semantic-icon-colors';st.textContent=`
[data-icon="note"]{color:var(--accent)!important}
[data-icon="pill"]{color:var(--med)!important}
[data-icon="moon"]{color:var(--sleep)!important}
[data-icon="bag"]{color:var(--buy)!important}
`;document.head.appendChild(st)})();

/* Proteção de inicialização: antes mesmo dos motores extras chegarem, só a aba visível é renderizada. */
(function installEarlyPerformanceGuard(){
  if(typeof renderAll==='function')renderAll=async function(){
    if(!db)return;const events=(await allEvents()).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));const view=document.querySelector('.view.active')?.dataset.view||'home';
    if(view==='history')await renderHistory(events);else if(view==='analysis')await renderAnalysis(events);else if(view==='home')await renderHome(events);
    renderBackupState();renderHealthState();
  };
  if(typeof switchTab==='function'&&!switchTab.__rmEarlyPerformance&&!switchTab.__rmPerformance){const previous=switchTab;const wrapped=function(name){previous(name);requestAnimationFrame(()=>{if(typeof renderAll==='function')renderAll().catch?.(console.error)})};wrapped.__rmEarlyPerformance=true;wrapped.__rmPrevious=previous;switchTab=wrapped}

  /* Dados fictícios só são baixados quando o banco realmente está vazio. */
  if(typeof loadRichDemoScript==='function'&&!loadRichDemoScript.__rmOptimized){const previousDemoLoader=loadRichDemoScript;const optimized=async function(){try{if(db&&(await allEvents()).length){globalThis.ensureRichDemoData=globalThis.ensureRichDemoData||(async()=>{});return}}catch{}return previousDemoLoader()};optimized.__rmOptimized=true;loadRichDemoScript=optimized}
})();

/* Carregamento otimizado: define primeiro o perfil visual leve e só depois monta os motores gráficos. */
(function loadOptimizedEngines(){
  const load=(src,key)=>new Promise((resolve,reject)=>{if(document.querySelector(`script[data-engine-key="${key}"]`))return resolve();const s=document.createElement('script');s.dataset.engineKey=key;s.src=src;s.onload=()=>{try{if(typeof rmInstallPerformanceRuntime==='function')rmInstallPerformanceRuntime()}catch{}resolve()};s.onerror=()=>{console.error(`Falha ao carregar ${key}`);reject(new Error(key))};document.head.appendChild(s)});
  const idle=()=>new Promise(resolve=>{if('requestIdleCallback'in window)requestIdleCallback(()=>resolve(),{timeout:1200});else setTimeout(resolve,350)});
  const start=async()=>{
    /* O padrão visual é decidido antes de blur, glow e gráficos entrarem no DOM. */
    try{await load('./v04c25.js?v=0.4.25','optimized-default')}catch{}
    try{await load('./v04c19.js?v=0.4.25','performance')}catch{}
    const emotion=load('./v04c12.js?v=0.4.25','emotion');
    const palette=load('./v04c15.js?v=0.4.25','semantic-palette');
    const icons=load('./v04c16.js?v=0.4.25','record-icons');
    await Promise.allSettled([emotion,palette,icons]);
    try{if(typeof rmInstallPerformanceRuntime==='function')rmInstallPerformanceRuntime()}catch{}
    await Promise.resolve(emotion).then(()=>load('./v04c18.js?v=0.4.25','visual')).catch(()=>{});
    try{if(typeof rmInstallPerformanceRuntime==='function')rmInstallPerformanceRuntime()}catch{}
    try{await load('./v04c20.js?v=0.4.25','visual-mode')}catch{}
    try{await load('./v04c21.js?v=0.4.25','settings-layout')}catch{}
    try{if(typeof rmV25FinalizeVisualMode==='function')rmV25FinalizeVisualMode()}catch{}
    try{if(typeof rmInstallPerformanceRuntime==='function')rmInstallPerformanceRuntime()}catch{}

    await idle();
    const learning=load('./v04c11.js?v=0.4.25','learning');
    await Promise.allSettled([learning]);
    try{if(typeof rmInstallPerformanceRuntime==='function')rmInstallPerformanceRuntime()}catch{}
    const continuity=Promise.resolve(learning).then(()=>load('./v04c13.js?v=0.4.25','continuity'));
    await Promise.allSettled([continuity]);
    try{await load('./v04c22.js?v=0.4.25','health-hub')}catch{}
    try{if(typeof rmInstallPerformanceRuntime==='function')rmInstallPerformanceRuntime()}catch{}
    await Promise.resolve(continuity).then(()=>load('./v04c14.js?v=0.4.25','interview')).catch(()=>{});
    try{await load('./v04c23.js?v=0.4.25','analysis-review')}catch{}
    try{await load('./v04c24.js?v=0.4.25','v24-fixes')}catch{}
    try{await load('./v04c26.js?v=0.4.26','tabbar-lab-fix')}catch{}
    try{if(typeof rmV25FinalizeVisualMode==='function')rmV25FinalizeVisualMode()}catch{}
    try{if(typeof rmInstallPerformanceRuntime==='function')rmInstallPerformanceRuntime()}catch{}
    try{await load('./v04c27.js?v=0.4.27','batch-revision')}catch{}
    try{if(typeof rmV27Finalize==='function')rmV27Finalize()}catch{}
  };
  start();
})();
