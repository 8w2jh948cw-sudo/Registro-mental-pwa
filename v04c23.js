/* Revisão da aba Análises 0.4.23: hierarquia, legibilidade, semântica visual e dados fictícios suficientes para gráficos. */
const RM_ANALYSIS_REVIEW_RELEASE='0.4.23';

function rmAnalysisIcon(name){return `<span class="rm-insight-icon" data-icon="${name}" aria-hidden="true"></span>`}
function rmInsightRow(icon,label,body,tone='neutral'){
  return `<div class="rm-insight-row rm-tone-${tone}">${rmAnalysisIcon(icon)}<div class="rm-insight-copy"><strong class="rm-insight-label">${esc(label)}</strong><div class="rm-insight-value">${body}</div></div></div>`
}
function rmTextLines(items){return items.filter(Boolean).map(x=>`<span class="rm-detail-line">${esc(String(x))}</span>`).join('')}
function rmDetailLine(label,value,{accent=false}={}){if(value===null||value===undefined||value==='')return'';return `<span class="rm-detail-line"><b${accent?' class="rm-accent-text"':''}>${esc(label)}</b> ${esc(String(value))}</span>`}
function rmPurchasePackPrice(p){const total=parseMoney(p?.price),packs=Math.max(1,Number(p?.packages)||1);return total==null?null:total/packs}

function rmDemoAnalyticsSpecs(){
  return [
    [0,2,25,2,'Acordei cansado e um pouco ansioso.','sono',{anxiety:3,happiness:1,energy:1,concentration:1,sleepiness:3}],
    [1,13,0,2,'Antes das medicações, eu estava com pouca energia e alguma ansiedade.','check-in',{anxiety:2,happiness:1,energy:1,concentration:1,sleepiness:2}],
    [1,15,30,3,'Depois, consegui começar uma tarefa e fiquei mais concentrado.','foco',{anxiety:1,happiness:2,energy:3,concentration:3,sleepiness:1}],
    [2,13,15,2,'Acordei ainda um pouco sonolento e sem muito foco.','sono',{anxiety:1,happiness:1,energy:1,concentration:1,sleepiness:3}],
    [2,16,0,4,'Mais tarde me senti disposto e com boa concentração.','foco',{anxiety:1,happiness:3,energy:3,concentration:4,sleepiness:0}],
    [3,9,0,4,'Acordei descansado, calmo e de bom humor.','sono',{anxiety:0,happiness:4,energy:3,concentration:3,sleepiness:0}],
    [4,9,50,2,'Comecei o dia mais lento e com dificuldade para iniciar tarefas.','check-in',{anxiety:2,happiness:1,energy:1,concentration:1,sleepiness:2}],
    [4,14,0,4,'Durante a tarde fiquei produtivo e com mais energia.','foco',{anxiety:1,happiness:3,energy:4,concentration:4,sleepiness:0}],
    [5,10,0,3,'Acordei razoavelmente descansado e estável.','sono',{anxiety:1,happiness:2,energy:2,concentration:2,sleepiness:1}],
    [6,12,0,3,'Antes das medicações eu estava neutro e um pouco disperso.','check-in',{anxiety:1,happiness:2,energy:2,concentration:1,sleepiness:1}],
    [6,17,0,4,'No fim da tarde me senti mais tranquilo e concentrado.','calma',{anxiety:0,happiness:3,energy:3,concentration:3,sleepiness:0}],
    [7,12,0,1,'Dormi pouco e acordei muito sonolento, com pouca energia.','sono',{anxiety:2,happiness:0,energy:0,concentration:0,sleepiness:4}],
    [8,12,30,3,'Eu estava razoável, mas ainda um pouco distraído.','check-in',{anxiety:1,happiness:2,energy:2,concentration:1,sleepiness:1}],
    [8,16,0,4,'Depois consegui manter o foco e fiquei mais disposto.','foco',{anxiety:1,happiness:3,energy:3,concentration:4,sleepiness:0}],
    [9,12,0,4,'Depois de dormir melhor, acordei bem e com energia.','sono',{anxiety:0,happiness:4,energy:4,concentration:3,sleepiness:0}],
    [10,13,45,2,'Antes das medicações eu estava cansado e com pouca concentração.','check-in',{anxiety:2,happiness:1,energy:1,concentration:1,sleepiness:2}],
    [10,17,0,3,'Mais tarde fiquei um pouco melhor e consegui me organizar.','check-in',{anxiety:1,happiness:2,energy:2,concentration:3,sleepiness:1}],
    [11,14,30,3,'Comecei a tarde razoável e sem muita ansiedade.','check-in',{anxiety:1,happiness:2,energy:2,concentration:2,sleepiness:1}],
    [11,18,0,4,'Consegui trabalhar por bastante tempo e me senti satisfeito.','foco',{anxiety:0,happiness:3,energy:3,concentration:4,sleepiness:0}]
  ];
}
function rmDemoIso(days,h,m){const d=new Date();d.setDate(d.getDate()-days);d.setHours(h,m,0,0);return d.toISOString()}
async function rmEnsureDemoAnalyticsData(){
  if(!db)return false;
  const all=await allEvents();if(!all.some(e=>e?.demo))return false;
  const ids=new Set(all.map(e=>e.id));let changed=false;
  for(const [days,h,m,mood,text,tag,scores] of rmDemoAnalyticsSpecs()){
    const id=`demo-analysis-check-${days}-${h}-${m}`;if(ids.has(id))continue;
    const labels={anxiety:'Ansiedade',happiness:'Felicidade',energy:'Energia',concentration:'Concentração',sleepiness:'Sonolência'};
    await putEvent({id,type:'note',timestamp:rmDemoIso(days,h,m),text,tag,moodScore:mood,moodScaleModel:'0-5',emotionScores:{...scores},emotionLabels:labels,emotionIntensityModel:'0-4',demo:true});changed=true;
  }
  return changed;
}
async function rmLoadRichDemoScript(){
  if(typeof installRichDemo==='function')return;
  await new Promise((resolve,reject)=>{const old=document.querySelector('script[data-rm-rich-demo]');if(old){old.addEventListener('load',resolve,{once:true});setTimeout(resolve,200);return}const s=document.createElement('script');s.dataset.rmRichDemo='1';s.src='./v04demo.js?v=0.4.23';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})
}
restoreDemo=async function(){
  if(!confirm('Substituir todos os registros e cadastros pelos dados fictícios ampliados?'))return;
  try{await rmLoadRichDemoScript();if(typeof installRichDemo==='function')await installRichDemo({replace:true});else return toast('Não foi possível carregar os dados fictícios.');await rmEnsureDemoAnalyticsData();if(typeof rmInvalidate==='function')rmInvalidate();await renderAll();toast('Dados fictícios ampliados restaurados.')}catch(err){console.error(err);toast('Não foi possível restaurar os dados fictícios.')}
};

renderAnalysis=async function(events){
  if(await rmEnsureDemoAnalyticsData())events=(await allEvents()).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  const sorted=[...events].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)),cycle=currentCycle(sorted),latestNote=sorted.find(e=>e.type==='note'),cycleMeds=sorted.filter(e=>e.type==='medication'&&new Date(e.timestamp).getTime()>=cycle.start),contextStart=cycle.start-24*3600000,contextMeds=cycle.lastSleep?sorted.filter(e=>e.type==='medication'&&new Date(e.timestamp).getTime()<cycle.start&&new Date(e.timestamp).getTime()>=contextStart):[],lastSleep=cycle.lastSleep||sorted.find(e=>e.type==='sleep');
  const latestText=latestNote?(latestNote.text?`“${esc(latestNote.text)}”<small>${esc(humanAgo(latestNote.timestamp))}</small>`:`Check-in emocional <b>${esc(String(latestNote.moodScore))}/5</b><small>${esc(humanAgo(latestNote.timestamp))}</small>`):'Ainda não há anotações.';
  const medNow=cycleMeds.length?rmTextLines(cycleMeds.map(medicationEventLabel)):'Nenhum registro nesse período.';
  const current=document.getElementById('currentAnalysis');if(current)current.innerHTML=`<div class="rm-analysis-list">${rmInsightRow('clock','Período analisado',`<b>${esc(cycle.label)}</b>`,'accent')}${rmInsightRow('note','Último relato',latestText,'note')}${rmInsightRow('pill',cycle.lastSleep?'Medicamentos desde que acordou':'Medicamentos recentes',medNow,'med')}${contextMeds.length?rmInsightRow('pill','Antes do último sono',rmTextLines(contextMeds.map(medicationEventLabel)),'med'):''}${rmInsightRow('moon','Sono mais recente',lastSleep?`<b>${esc(durationLabel(durationHours(lastSleep.startTime,lastSleep.endTime)))}</b>${lastSleep.quality?`<small>Qualidade percebida: ${esc(String(lastSleep.quality))}/5</small>`:''}`:'Ainda não há registros de sono.','sleep')}</div>`;

  const admins=sorted.filter(e=>e.type==='medication'),notes=sorted.filter(e=>e.type==='note'&&e.text),grouped={};
  for(const a of admins){const key=a.medication||'Medicamento';if(!grouped[key])grouped[key]={count:0,terms:[]};const st=new Date(a.timestamp).getTime(),en=st+8*3600000,nearby=notes.filter(n=>{const t=new Date(n.timestamp).getTime();return t>=st&&t<=en});grouped[key].count+=nearby.length;grouped[key].terms.push(...nearby.flatMap(n=>moodTerms(n.text)))}
  const assoc=Object.entries(grouped).filter(([,d])=>d.count>0).sort((a,b)=>b[1].count-a[1].count).slice(0,4),association=document.getElementById('associationAnalysis');
  if(association)association.innerHTML=assoc.length?`<div class="rm-analysis-list">${assoc.map(([name,data])=>{const c={};data.terms.forEach(t=>c[t]=(c[t]||0)+1);const common=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t,n])=>`${t} (${n})`).join(', ');return rmInsightRow('pill',name,`${rmDetailLine('Relatos próximos:',`${data.count} até 8h após administrações`,{accent:true})}${common?rmDetailLine('Termos recorrentes:',common):'<span class="rm-detail-line">Ainda sem termos recorrentes suficientes.</span>'}`,'med')}).join('')}</div>`:rmInsightRow('link','Ainda sem padrão','Registre administrações e relatos ao longo do tempo. O app mostra apenas proximidade temporal, não causalidade.','accent');

  const sleeps=sorted.filter(e=>e.type==='sleep'),avg=sleeps.length?sleeps.reduce((s,e)=>s+durationHours(e.startTime,e.endTime),0)/sleeps.length:null,qs=sleeps.filter(e=>Number(e.quality)),avgQ=qs.length?qs.reduce((s,e)=>s+Number(e.quality),0)/qs.length:null,sleep=document.getElementById('sleepAnalysis');
  if(sleep)sleep.innerHTML=[metric(avg==null?'—':durationLabel(avg),'Média de duração'),metric(avgQ==null?'—':avgQ.toFixed(1),'Qualidade média'),metric(sleeps[0]?durationLabel(durationHours(sleeps[0].startTime,sleeps[0].endTime)):'—','Último sono')].join('');

  const meds=await allMedications(),medRows=[];
  for(const m of meds){const c=medicationCostSummary(m,sorted);if(!c)continue;const lines=[rmDetailLine('Custo por unidade:',c.unit!=null?money(c.unit):'sem unidades definidas',{accent:true}),c.monthly!=null?rmDetailLine('Gasto registrado nos últimos 30 dias:',`≈ ${money(c.monthly)}`):''];medRows.push(rmInsightRow('pill',m.activeIngredient,lines.join(''),'med'))}
  const medication=document.getElementById('medicationAnalysis');if(medication)medication.innerHTML=medRows.length?`<div class="rm-analysis-list">${medRows.slice(0,6).join('')}</div>`:rmInsightRow('pill','Cadastre apresentações','Com unidades por caixa, compras e administrações o app calcula custos de forma mais útil.','med');

  const buys=sorted.filter(e=>e.type==='purchase'&&parseMoney(e.price)!=null),groups=new Map();
  for(const p of buys){const key=`${p.medicationId||p.medication||'med'}|${p.presentationId||''}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p)}
  const purchaseRows=[...groups.values()].map(list=>{list.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));const last=list[0],prices=list.map(rmPurchasePackPrice).filter(v=>v!=null),lastPack=rmPurchasePackPrice(last),min=prices.length?Math.min(...prices):null;return{last,html:rmInsightRow('bag',last.medication||'Medicamento',`${rmDetailLine('Última compra:',humanAgo(last.timestamp),{accent:true})}${rmDetailLine('Valor por embalagem:',lastPack==null?'—':money(lastPack),{accent:true})}${rmDetailLine('Onde:',last.place||'não informado')}${rmDetailLine('Menor valor registrado:',min==null?'—':money(min),{accent:true})}`,'buy')}}).sort((a,b)=>new Date(b.last.timestamp)-new Date(a.last.timestamp));
  const purchase=document.getElementById('purchaseAnalysis');if(purchase)purchase.innerHTML=purchaseRows.length?`<div class="rm-analysis-list">${purchaseRows.slice(0,6).map(x=>x.html).join('')}</div>`:rmInsightRow('bag','Ainda sem histórico de preço','Registre compras com valor e local para comparar embalagens ao longo do tempo.','buy');
  rmDecorateAnalysisHeaders();if(typeof hydrateIcons==='function')hydrateIcons(document.querySelector('[data-view="analysis"]'));
};

function rmDecorateAnalysisHeaders(){
  const current=document.getElementById('currentAnalysis')?.closest('.analysis-card'),h=current?.querySelector(':scope>h2');
  if(h&&!h.closest('.analysis-title')){const row=document.createElement('div');row.className='analysis-title rm-analysis-title';row.innerHTML='<span data-icon="spark"></span>';h.before(row);row.appendChild(h)}
}

if(typeof renderContinuityAnalysis==='function'){
  const rmPrevContinuityAnalysis=renderContinuityAnalysis;
  renderContinuityAnalysis=async function(...args){await rmPrevContinuityAnalysis(...args);const box=document.getElementById('continuityAnalysis');if(!box)return;[...box.querySelectorAll('.analysis-row')].forEach(row=>{const span=row.querySelector('span');if(span?.textContent.trim()==='Nenhum dos prazos configurados foi ultrapassado.'){span.textContent='Tudo certo: você está fazendo seus registros com frequência.';span.classList.add('rm-positive-text')}})};
}

if(typeof renderQuantitativeDashboard==='function'){
  const rmPrevQuantitativeDashboardV23=renderQuantitativeDashboard;
  renderQuantitativeDashboard=async function(events){if(await rmEnsureDemoAnalyticsData())events=(await allEvents()).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));await rmPrevQuantitativeDashboardV23(events);rmImproveAnalysisCharts()};
}
function rmImproveAnalysisCharts(){
  const view=document.querySelector('[data-view="analysis"]');if(!view)return;
  view.querySelectorAll('.dashboard-chart').forEach(card=>card.classList.add('rm-readable-chart'));
  const concepts=view.querySelector('[data-analysis-item="chart-med-concepts"]');concepts?.classList.add('rm-concepts-chart');
  const sleep=view.querySelector('[data-analysis-item="chart-sleep-line"]');sleep?.classList.add('rm-sleep-chart');
  if(typeof hydrateIcons==='function')hydrateIcons(view)
}

(function rmAnalysisReviewStyles(){
  if(document.getElementById('rm-analysis-review-style'))return;
  const st=document.createElement('style');st.id='rm-analysis-review-style';st.textContent=`
  [data-view="analysis"] .analysis-card{overflow:hidden}
  .rm-analysis-list{display:grid;gap:9px;margin-top:10px}
  .rm-insight-row{display:grid;grid-template-columns:34px minmax(0,1fr);gap:11px;align-items:flex-start;padding:12px;border-radius:15px;background:rgba(120,120,128,.055);border:1px solid rgba(120,120,128,.10)}
  .rm-insight-icon{width:32px;height:32px;border-radius:11px;display:grid;place-items:center;background:rgba(120,120,128,.07)}
  .rm-insight-icon .svg-icon,.rm-insight-icon>svg{width:19px!important;height:19px!important}
  .rm-insight-copy{min-width:0}.rm-insight-label{display:block;font-size:13px;line-height:1.25;margin:1px 0 5px}.rm-insight-value{font-size:13px;line-height:1.48;color:var(--secondary)}
  .rm-insight-value>b{color:var(--text);font-weight:750}.rm-insight-value small{display:block;margin-top:3px;font-size:11px;line-height:1.35;opacity:.75}
  .rm-detail-line{display:block;margin-top:3px}.rm-detail-line:first-child{margin-top:0}.rm-detail-line b{color:var(--text);font-weight:700}.rm-accent-text{font-weight:760!important}
  .rm-tone-note .rm-insight-icon{color:var(--record-note,var(--accent));background:color-mix(in srgb,var(--record-note,var(--accent)) 10%,transparent)}
  .rm-tone-med .rm-insight-icon,.rm-tone-med .rm-accent-text{color:var(--record-med,var(--med))}.rm-tone-med .rm-insight-icon{background:color-mix(in srgb,var(--record-med,var(--med)) 10%,transparent)}
  .rm-tone-sleep .rm-insight-icon{color:var(--record-sleep,var(--sleep));background:color-mix(in srgb,var(--record-sleep,var(--sleep)) 10%,transparent)}
  .rm-tone-buy .rm-insight-icon,.rm-tone-buy .rm-accent-text{color:var(--record-buy,var(--buy))}.rm-tone-buy .rm-insight-icon{background:color-mix(in srgb,var(--record-buy,var(--buy)) 10%,transparent)}
  .rm-tone-accent .rm-insight-icon{color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent)}
  #sleepAnalysis{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px}
  #sleepAnalysis .metric{min-width:0;text-align:center;padding:12px 6px;border-radius:14px;background:color-mix(in srgb,var(--record-sleep,var(--sleep)) 7%,transparent);border:1px solid color-mix(in srgb,var(--record-sleep,var(--sleep)) 13%,transparent)}
  #sleepAnalysis .metric strong{font-size:22px!important;line-height:1.05;color:var(--record-sleep,var(--sleep));font-weight:780}#sleepAnalysis .metric span{font-size:11px!important;line-height:1.25;font-weight:700;margin-top:5px}
  .rm-positive-text{color:#30C878!important;font-weight:760!important}
  [data-view="analysis"] .chart-card-head>div>p:last-child{font-size:13px!important;line-height:1.45!important;opacity:.72}
  [data-view="analysis"] .rm-readable-chart .local-chart-svg text{font-size:20px!important;font-weight:620}
  [data-view="analysis"] .rm-readable-chart .local-chart-svg .chart-axis-label{font-size:21px!important;font-weight:700}
  [data-view="analysis"] .rm-readable-chart .local-chart-svg .chart-grid text{font-size:20px!important;font-weight:650}
  [data-view="analysis"] .rm-readable-chart .local-chart-svg .chart-line{stroke-width:4.4px}
  [data-view="analysis"] .rm-concepts-chart .local-chart-svg text{font-size:22px!important;font-weight:700}
  [data-view="analysis"] .rm-sleep-chart .local-chart-svg text{font-size:22px!important;font-weight:700}
  html[data-theme="dark"] .rm-insight-row{background:rgba(255,255,255,.045);border-color:rgba(255,255,255,.075)}
  @media (prefers-color-scheme:dark){html[data-theme="system"] .rm-insight-row{background:rgba(255,255,255,.045);border-color:rgba(255,255,255,.075)}}
  @media(max-width:390px){#sleepAnalysis .metric strong{font-size:19px!important}#sleepAnalysis .metric span{font-size:10px!important}.rm-insight-row{grid-template-columns:31px minmax(0,1fr);padding:11px;gap:9px}.rm-insight-icon{width:30px;height:30px}}
  `;document.head.appendChild(st)
})();

const top=document.getElementById('topVersion'),about=document.getElementById('versionLabel');if(top)top.textContent=`v${RM_ANALYSIS_REVIEW_RELEASE}`;if(about)about.textContent=RM_ANALYSIS_REVIEW_RELEASE;
if(typeof rmInvalidate==='function')rmInvalidate('analysis');
