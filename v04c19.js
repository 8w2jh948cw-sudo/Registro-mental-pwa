/* Runtime de desempenho: renderiza apenas a aba visível, memoriza telas prontas e evita reconstruções desnecessárias. */
const RM_PERFORMANCE_VERSION='1.1.0';
const RM_APP_RELEASE='0.4.18';
let rmRenderQueued=false,rmQueuedView=null,rmRenderSerial=0,rmDataRevision=0,rmHistoryLimit=80,rmHistoryFilterSeen=null,rmLastModuleSignature='';
const rmViewCache=new Map();
const RM_VIEW_TTL={home:30000,history:300000,analysis:300000,learning:300000,settings:60000};

function rmActiveViewName(explicit=null){if(explicit)return explicit;return document.querySelector('.view.active')?.dataset.view||document.querySelector('.tab-item.selected')?.dataset.tab||'home'}
function rmSortedEvents(events){return [...events].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))}
function rmInvalidate(...views){if(!views.length){rmViewCache.clear();return}views.forEach(v=>rmViewCache.delete(v))}
function rmIsFresh(view){const c=rmViewCache.get(view),ttl=RM_VIEW_TTL[view]??60000;return Boolean(c&&c.revision===rmDataRevision&&Date.now()-c.at<ttl)}
function rmMarkFresh(view){rmViewCache.set(view,{revision:rmDataRevision,at:Date.now()})}

async function rmRenderHistoryFast(events){
  if(rmHistoryFilterSeen!==historyFilter){rmHistoryFilterSeen=historyFilter;rmHistoryLimit=80}
  const filtered=events.filter(e=>historyFilter==='all'||e.type===historyFilter);
  const shown=filtered.slice(0,rmHistoryLimit),container=document.getElementById('historyList');
  if(!container)return;
  let current='',html='';
  for(const e of shown){const d=eventDay(e);if(d!==current){current=d;html+=`<div class="history-day">${dayLabel(d)}</div>`}html+=eventCard(e)}
  if(filtered.length>shown.length)html+=`<button type="button" class="secondary-button full-button rm-history-more" data-rm-history-more>Mostrar mais ${Math.min(80,filtered.length-shown.length)} registros</button>`;
  container.innerHTML=html;
  document.getElementById('historyEmpty')?.classList.toggle('hidden',filtered.length>0);
  await hydrateAudio(container);
}

async function rmRenderActive(view=null,{force=false}={}){
  if(!db)return;
  view=rmActiveViewName(view);
  if(!force&&rmIsFresh(view))return;
  const serial=++rmRenderSerial;
  const events=rmSortedEvents(await allEvents());
  if(serial!==rmRenderSerial)return;
  let meds=null;
  const needMeds=view==='home'||view==='analysis'||view==='learning';
  if(needMeds)meds=await allMedications();
  if(serial!==rmRenderSerial)return;

  if(view==='home'){
    await renderHome(events);
    if(typeof renderContinuityHome==='function')await renderContinuityHome(events,meds||[]);
  }else if(view==='history'){
    await rmRenderHistoryFast(events);
  }else if(view==='analysis'){
    await renderAnalysis(events);
    if(typeof renderQuantitativeDashboard==='function')await renderQuantitativeDashboard(events);
    if(typeof renderContinuityAnalysis==='function')await renderContinuityAnalysis(events,meds||[]);
    if(typeof renderPersonalInterviewAnalysisContext==='function')renderPersonalInterviewAnalysisContext();
    if(typeof rmFixAnalysisCopy==='function')rmFixAnalysisCopy();
  }else if(view==='learning'){
    if(typeof renderLearning==='function')await renderLearning();
    if(typeof renderContinuityLearning==='function')await renderContinuityLearning(events,meds||[]);
    if(typeof renderPersonalInterview==='function')await renderPersonalInterview(events,meds||[]);
  }else if(view==='settings'){
    if(typeof ensureContinuitySettingsUI==='function')ensureContinuitySettingsUI();
    renderBackupState();renderHealthState();
  }
  if(typeof rmApplyDimensionColors==='function')rmApplyDimensionColors(document.querySelector(`.view[data-view="${view}"]`)||document);
  if(serial===rmRenderSerial)rmMarkFresh(view);
}
function rmScheduleRender(view=null,force=false){
  rmQueuedView=view||rmQueuedView;
  if(force&&rmQueuedView)rmInvalidate(rmQueuedView);
  if(rmRenderQueued)return;
  rmRenderQueued=true;
  requestAnimationFrame(()=>{rmRenderQueued=false;const next=rmQueuedView;rmQueuedView=null;rmRenderActive(next,{force}).catch(err=>console.error('Falha ao renderizar aba',err))});
}
function rmWrapDataMutation(name){
  try{const fn=globalThis[name];if(typeof fn!=='function'||fn.__rmPerformanceWrapped)return;const wrapped=async function(...args){const result=await fn(...args);rmDataRevision++;rmInvalidate();return result};wrapped.__rmPerformanceWrapped=true;globalThis[name]=wrapped}catch{}
}
function rmWrapSettingsMutation(){
  try{if(typeof saveSettings!=='function'||saveSettings.__rmPerformanceWrapped)return;const fn=saveSettings,wrapped=function(...args){const result=fn(...args);rmDataRevision++;rmInvalidate();return result};wrapped.__rmPerformanceWrapped=true;saveSettings=wrapped}catch{}
}
function rmInstallPerformanceRuntime(){
  if(typeof renderAll==='function')renderAll=async function(){return rmRenderActive(null,{force:true})};
  if(typeof switchTab==='function'&&!switchTab.__rmPerformance){
    const previous=switchTab;
    const wrapped=function(name){previous(name);rmScheduleRender(name)};
    wrapped.__rmPerformance=true;wrapped.__rmPrevious=previous;switchTab=wrapped;
  }
  ['putEvent','deleteEvent','putMedication','deleteMedication'].forEach(rmWrapDataMutation);rmWrapSettingsMutation();
  try{if(typeof rmObserver!=='undefined')rmObserver.disconnect()}catch{}
  const signature=[typeof renderQuantitativeDashboard,typeof renderLearning,typeof renderContinuityHome,typeof renderPersonalInterview].join('|');
  if(signature!==rmLastModuleSignature){rmLastModuleSignature=signature;rmInvalidate()}
  const top=document.getElementById('topVersion'),about=document.getElementById('versionLabel');
  if(top)top.textContent=`v${RM_APP_RELEASE}`;if(about)about.textContent=RM_APP_RELEASE;
  document.documentElement.dataset.rmPerformance='1';
}
rmInstallPerformanceRuntime();

document.addEventListener('click',e=>{const more=e.target.closest('[data-rm-history-more]');if(!more)return;e.preventDefault();rmHistoryLimit+=80;rmInvalidate('history');rmScheduleRender('history',true)});

/* Elementos fora da tela deixam de consumir pintura; blur é mantido com custo menor no iPhone. */
(function rmPerformanceStyles(){if(document.getElementById('rm-performance-style'))return;const st=document.createElement('style');st.id='rm-performance-style';st.textContent=`
.view:not(.active){display:none!important}
[data-view="history"] .timeline-item,[data-view="learning"] .learning-question,[data-view="analysis"] .analysis-card{content-visibility:auto;contain-intrinsic-size:110px}
[data-view="analysis"] .dashboard-chart{content-visibility:auto;contain-intrinsic-size:360px}
.rm-history-more{margin:14px 0 28px;width:100%}
@media (max-width:600px){.summary-card,.analysis-card,.settings-card,.notice-card,.action-card{backdrop-filter:blur(10px) saturate(132%);-webkit-backdrop-filter:blur(10px) saturate(132%)}.sheet{backdrop-filter:blur(16px) saturate(138%);-webkit-backdrop-filter:blur(16px) saturate(138%)}}
`;document.head.appendChild(st)})();
