/* Runtime de desempenho: renderiza apenas a aba visível e evita reconstruções desnecessárias. */
const RM_PERFORMANCE_VERSION='1.0.0';
const RM_APP_RELEASE='0.4.18';
let rmRenderQueued=false,rmQueuedView=null,rmRenderSerial=0;

function rmActiveViewName(explicit=null){if(explicit)return explicit;return document.querySelector('.view.active')?.dataset.view||document.querySelector('.tab-item.selected')?.dataset.tab||'home'}
function rmSortedEvents(events){return [...events].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))}
async function rmRenderActive(view=null){
  if(!db)return;
  view=rmActiveViewName(view);
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
    await renderHistory(events);
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
}
function rmScheduleRender(view=null){
  rmQueuedView=view||rmQueuedView;
  if(rmRenderQueued)return;
  rmRenderQueued=true;
  requestAnimationFrame(()=>{rmRenderQueued=false;const next=rmQueuedView;rmQueuedView=null;rmRenderActive(next).catch(err=>console.error('Falha ao renderizar aba',err))});
}
function rmInstallPerformanceRuntime(){
  if(typeof renderAll==='function')renderAll=async function(){return rmRenderActive()};
  if(typeof switchTab==='function'&&!switchTab.__rmPerformance){
    const previous=switchTab;
    const wrapped=function(name){previous(name);rmScheduleRender(name)};
    wrapped.__rmPerformance=true;wrapped.__rmPrevious=previous;switchTab=wrapped;
  }
  const top=document.getElementById('topVersion'),about=document.getElementById('versionLabel');
  if(top)top.textContent=`v${RM_APP_RELEASE}`;if(about)about.textContent=RM_APP_RELEASE;
  document.documentElement.dataset.rmPerformance='1';
}
rmInstallPerformanceRuntime();

/* Histórico muito longo deixa de custar pintura fora da área visível. */
(function rmPerformanceStyles(){if(document.getElementById('rm-performance-style'))return;const st=document.createElement('style');st.id='rm-performance-style';st.textContent=`
.view:not(.active){display:none!important}
[data-view="history"] .timeline-item,[data-view="learning"] .learning-question,[data-view="analysis"] .analysis-card{content-visibility:auto;contain-intrinsic-size:110px}
[data-view="analysis"] .dashboard-chart{content-visibility:auto;contain-intrinsic-size:360px}
@media (max-width:600px){.summary-card,.analysis-card,.settings-card,.notice-card,.action-card{backdrop-filter:blur(10px) saturate(132%);-webkit-backdrop-filter:blur(10px) saturate(132%)}.sheet{backdrop-filter:blur(16px) saturate(138%);-webkit-backdrop-filter:blur(16px) saturate(138%)}}
`;document.head.appendChild(st)})();
