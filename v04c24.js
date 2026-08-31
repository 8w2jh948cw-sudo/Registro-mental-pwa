/* Correções 0.4.24: união robusta dos ajustes de Saúde + revisão cromática/legibilidade da aba Análises. */
const RM_V24_RELEASE='0.4.24';

/* ---------- AJUSTES: um único cartão Saúde ---------- */
function rmV24Separator(inset=true){const e=document.createElement('div');e.className=`setting-separator${inset?' inset':''}`;return e}
function rmV24RowFor(el){return el?.closest('.settings-row,.setting-block,.setting-inline')||null}
function rmV24RemoveAdjacentSeparators(row){
  if(!row)return;
  const p=row.previousElementSibling,n=row.nextElementSibling;
  if(p?.classList.contains('setting-separator'))p.remove();
  if(n?.classList.contains('setting-separator'))n.remove();
}
function rmV24ConsolidateHealthSettings(){
  const view=document.querySelector('[data-view="settings"]');if(!view)return false;
  try{if(typeof ensureContinuitySettingsUI==='function')ensureContinuitySettingsUI()}catch{}
  const medBtn=document.getElementById('medicationRegistryBtn'),healthBtn=document.getElementById('healthImportInfoBtn'),continuityBtn=document.getElementById('continuitySettingsBtn');
  if(!medBtn||!healthBtn||!continuityBtn)return false;

  const medRow=rmV24RowFor(medBtn),healthRow=rmV24RowFor(healthBtn),continuityRow=rmV24RowFor(continuityBtn);
  if(!medRow||!healthRow||!continuityRow)return false;
  const sourceGroups=[medRow.closest('.settings-group'),healthRow.closest('.settings-group'),continuityRow.closest('.settings-group')].filter(Boolean);

  let group=document.getElementById('healthSettingsGroup');
  if(!group){
    group=document.createElement('section');group.id='healthSettingsGroup';group.className='settings-group';
    group.innerHTML='<h2>Saúde</h2><div class="settings-card list-card rm-health-settings-card"></div>';
    sourceGroups[0]?.before(group);
  }
  group.querySelector(':scope>h2')?.replaceChildren(document.createTextNode('Saúde'));
  let card=group.querySelector(':scope>.settings-card');
  if(!card){card=document.createElement('div');card.className='settings-card list-card rm-health-settings-card';group.appendChild(card)}
  card.classList.add('list-card','rm-health-settings-card');

  [medRow,healthRow,continuityRow].forEach(r=>rmV24RemoveAdjacentSeparators(r));
  card.replaceChildren();
  card.append(medRow,rmV24Separator(true),healthRow,rmV24Separator(true),continuityRow);

  const hIcon=healthRow.querySelector('.settings-row-icon');
  if(hIcon){hIcon.classList.remove('health-icon');hIcon.dataset.icon='moon'}
  const hTitle=healthRow.querySelector('strong');if(hTitle)hTitle.textContent='Importar sono do app Saúde';
  const cTitle=continuityRow.querySelector('strong');if(cTitle)cTitle.textContent='Alertas por ausência';

  /* As opções Auto/Revisar/Perguntar pertencem à página de importação, não à tela principal. */
  const oldMode=document.getElementById('healthImportModeControl')?.closest('.setting-block');
  if(oldMode&&!oldMode.closest('#backdrop')){rmV24RemoveAdjacentSeparators(oldMode);oldMode.remove()}

  sourceGroups.forEach(g=>{if(g!==group&&g.isConnected)g.remove()});
  [...view.querySelectorAll('.settings-group')].forEach(g=>{
    if(g===group)return;
    const t=g.querySelector(':scope>h2')?.textContent.trim();
    if(['Medicamentos','Saúde e sono','Continuidade dos registros'].includes(t))g.remove();
  });
  [...view.querySelectorAll('.group-footnote')].forEach(p=>{if(/cartão só aparece|prazo configurado/i.test(p.textContent||''))p.remove()});

  if(typeof rmHealthImportSheet==='function')healthBtn.onclick=rmHealthImportSheet;
  if(typeof openContinuitySettings==='function')continuityBtn.onclick=openContinuitySettings;
  if(typeof hydrateIcons==='function')hydrateIcons(group);
  return true;
}

/* ---------- ANÁLISES: remove contagem de noites e usa cor como informação ---------- */
function rmV24RemoveNightCount(){
  const sleep=document.getElementById('sleepAnalysis');if(!sleep)return;
  sleep.querySelectorAll('.metric,.analysis-row,.rm-insight-row').forEach(el=>{
    const txt=(el.textContent||'').trim();
    if(/noites?\s+registrad|n[úu]mero\s+de\s+noites|quantidade\s+de\s+noites/i.test(txt))el.remove();
  });
  const count=sleep.querySelectorAll('.metric').length;
  if(count)sleep.style.gridTemplateColumns=`repeat(${Math.min(3,count)},minmax(0,1fr))`;
}
function rmV24ThemeCard(card,tone){if(!card)return;[...card.classList].filter(c=>c.startsWith('rm-theme-')).forEach(c=>card.classList.remove(c));card.classList.add('rm-analysis-colored',`rm-theme-${tone}`)}
function rmV24AddChartTitleIcon(card,icon){
  const box=card?.querySelector('.chart-card-head>div'),h=box?.querySelector(':scope>h2');if(!box||!h||box.querySelector('.rm-chart-title-row'))return;
  const row=document.createElement('div');row.className='rm-chart-title-row';const i=document.createElement('span');i.className='rm-chart-title-icon';i.dataset.icon=icon;i.setAttribute('aria-hidden','true');h.before(row);row.append(i,h)
}
function rmV24ColorizeAnalysis(){
  const view=document.querySelector('[data-view="analysis"]');if(!view)return;
  rmV24RemoveNightCount();
  rmV24ThemeCard(document.getElementById('currentAnalysis')?.closest('.analysis-card'),'current');
  rmV24ThemeCard(document.getElementById('associationAnalysis')?.closest('.analysis-card'),'med');
  rmV24ThemeCard(document.getElementById('sleepAnalysis')?.closest('.analysis-card'),'sleep');
  rmV24ThemeCard(document.getElementById('medicationAnalysis')?.closest('.analysis-card'),'med');
  rmV24ThemeCard(document.getElementById('purchaseAnalysis')?.closest('.analysis-card'),'buy');

  const continuity=document.getElementById('continuityAnalysis')?.closest('.analysis-card');
  if(continuity){const positive=/tudo (?:certo|ok)|com frequ[êe]ncia|nenhum dos prazos/i.test(continuity.textContent||'');rmV24ThemeCard(continuity,positive?'positive':'current')}

  const specs={
    'chart-mood-line':['spark','mood'],'chart-mood-distribution':['chart','mood'],
    'chart-dimension-line':['spark','dimension'],'chart-sleep-line':['moon','sleep'],
    'chart-sleep-mood':['moon','sleep'],'chart-med-delta':['pill','med'],
    'chart-med-concepts':['pill','med']
  };
  Object.entries(specs).forEach(([key,[icon,tone]])=>{const card=view.querySelector(`[data-analysis-item="${key}"]`);if(!card)return;rmV24ThemeCard(card,tone);rmV24AddChartTitleIcon(card,icon)});
  if(typeof hydrateIcons==='function')hydrateIcons(view)
}

/* Reaplica depois de cada render dinâmico. */
if(typeof renderAnalysis==='function'){
  const prev=renderAnalysis;renderAnalysis=async function(...args){const out=await prev(...args);rmV24ColorizeAnalysis();return out}
}
if(typeof renderQuantitativeDashboard==='function'){
  const prev=renderQuantitativeDashboard;renderQuantitativeDashboard=async function(...args){const out=await prev(...args);rmV24ColorizeAnalysis();return out}
}
if(typeof renderContinuityAnalysis==='function'){
  const prev=renderContinuityAnalysis;renderContinuityAnalysis=async function(...args){const out=await prev(...args);const box=document.getElementById('continuityAnalysis');if(box){box.querySelectorAll('.analysis-row span').forEach(span=>{if(/nenhum dos prazos configurados foi ultrapassado/i.test(span.textContent||''))span.textContent='Tudo certo: você está fazendo seus registros com frequência.';if(/tudo certo|com frequ[êe]ncia/i.test(span.textContent||''))span.classList.add('rm-positive-text')})}rmV24ColorizeAnalysis();return out}
}

(function rmV24Styles(){if(document.getElementById('rm-v24-style'))return;const st=document.createElement('style');st.id='rm-v24-style';st.textContent=`
/* Saúde unificada */
#healthSettingsGroup>.settings-card{overflow:hidden}
#healthSettingsGroup .settings-row-icon[data-icon="pill"]{color:var(--record-med,var(--med))!important}
#healthSettingsGroup .settings-row-icon[data-icon="moon"]{color:var(--record-sleep,var(--sleep))!important}
#healthSettingsGroup #continuitySettingsBtn .settings-row-icon{color:var(--accent)!important}

/* Cada família usa uma cor semântica própria, inclusive no modo escuro. */
[data-view="analysis"] .rm-analysis-colored{--rm-analysis-tone:var(--accent);border-color:color-mix(in srgb,var(--rm-analysis-tone) 18%,var(--separator))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.32),0 10px 28px color-mix(in srgb,var(--rm-analysis-tone) 7%,transparent)!important}
[data-view="analysis"] .rm-theme-sleep{--rm-analysis-tone:var(--record-sleep,var(--sleep))}
[data-view="analysis"] .rm-theme-med{--rm-analysis-tone:var(--record-med,var(--med))}
[data-view="analysis"] .rm-theme-buy{--rm-analysis-tone:var(--record-buy,var(--buy))}
[data-view="analysis"] .rm-theme-positive{--rm-analysis-tone:#30C878}
[data-view="analysis"] .rm-theme-mood{--rm-analysis-tone:#56C8FF}
[data-view="analysis"] .rm-theme-dimension{--rm-analysis-tone:var(--accent)}
[data-view="analysis"] .rm-theme-current{--rm-analysis-tone:var(--accent)}
[data-view="analysis"] .rm-analysis-colored>.analysis-title span,[data-view="analysis"] .rm-analysis-colored>.analysis-title h2{color:var(--rm-analysis-tone)!important}
[data-view="analysis"] .rm-analysis-colored>.section-kicker{color:var(--rm-analysis-tone)!important;opacity:.92}

/* Blocos internos deixam o cinza genérico e passam a carregar a categoria. */
[data-view="analysis"] .rm-tone-note{--rm-row-tone:var(--record-note,var(--accent))}
[data-view="analysis"] .rm-tone-med{--rm-row-tone:var(--record-med,var(--med))}
[data-view="analysis"] .rm-tone-sleep{--rm-row-tone:var(--record-sleep,var(--sleep))}
[data-view="analysis"] .rm-tone-buy{--rm-row-tone:var(--record-buy,var(--buy))}
[data-view="analysis"] .rm-tone-accent{--rm-row-tone:var(--accent)}
[data-view="analysis"] .rm-insight-row{background:linear-gradient(145deg,color-mix(in srgb,var(--rm-row-tone,var(--accent)) 9%,var(--surface-2)),color-mix(in srgb,var(--rm-row-tone,var(--accent)) 3%,var(--surface)))!important;border-color:color-mix(in srgb,var(--rm-row-tone,var(--accent)) 18%,var(--separator))!important}
[data-view="analysis"] .rm-insight-label{color:var(--rm-row-tone,var(--text))!important;font-weight:760!important}
[data-view="analysis"] .rm-insight-icon{box-shadow:0 0 14px color-mix(in srgb,var(--rm-row-tone,var(--accent)) 18%,transparent)}
[data-view="analysis"] .rm-tone-med .rm-detail-line b{color:var(--record-med,var(--med))}
[data-view="analysis"] .rm-tone-buy .rm-detail-line b{color:var(--record-buy,var(--buy))}
[data-view="analysis"] .rm-tone-sleep .rm-detail-line b{color:var(--record-sleep,var(--sleep))}

/* Sono: só métricas úteis; cor do sono nos números E nas descrições. */
#sleepAnalysis .metric{background:linear-gradient(145deg,color-mix(in srgb,var(--record-sleep,var(--sleep)) 13%,var(--surface-2)),color-mix(in srgb,var(--record-sleep,var(--sleep)) 5%,var(--surface)))!important;border-color:color-mix(in srgb,var(--record-sleep,var(--sleep)) 24%,var(--separator))!important}
#sleepAnalysis .metric strong{color:var(--record-sleep,var(--sleep))!important;text-shadow:0 0 14px color-mix(in srgb,var(--record-sleep,var(--sleep)) 20%,transparent)}
#sleepAnalysis .metric span{color:var(--record-sleep,var(--sleep))!important;font-weight:760!important;opacity:.92!important}

/* Cabeçalhos de gráficos também têm referência visual. */
.rm-chart-title-row{display:flex;align-items:center;gap:9px;margin-bottom:3px}
.rm-chart-title-row h2{margin:0!important;color:var(--rm-analysis-tone,var(--text))!important}
.rm-chart-title-icon{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;color:var(--rm-analysis-tone,var(--accent));background:color-mix(in srgb,var(--rm-analysis-tone,var(--accent)) 11%,transparent);box-shadow:0 0 13px color-mix(in srgb,var(--rm-analysis-tone,var(--accent)) 16%,transparent)}
.rm-chart-title-icon .svg-icon,.rm-chart-title-icon>svg{width:17px!important;height:17px!important}
[data-view="analysis"] .rm-theme-sleep .chart-grid text,[data-view="analysis"] .rm-theme-sleep .chart-axis-label{fill:var(--record-sleep,var(--sleep))!important;opacity:.88!important}
[data-view="analysis"] .rm-theme-med .chart-grid text,[data-view="analysis"] .rm-theme-med .chart-axis-label{fill:var(--record-med,var(--med))!important;opacity:.88!important}
[data-view="analysis"] .rm-theme-sleep .chart-line{stroke:var(--record-sleep,var(--sleep))!important}
[data-view="analysis"] .rm-theme-med .chart-line{stroke:var(--record-med,var(--med))!important}
[data-view="analysis"] .rm-positive-text{color:#30C878!important;font-weight:780!important}

html[data-theme="dark"] [data-view="analysis"] .rm-insight-row{background:linear-gradient(145deg,color-mix(in srgb,var(--rm-row-tone,var(--accent)) 14%,#19191f),color-mix(in srgb,var(--rm-row-tone,var(--accent)) 6%,#111116))!important;border-color:color-mix(in srgb,var(--rm-row-tone,var(--accent)) 25%,rgba(255,255,255,.10))!important}
@media(prefers-color-scheme:dark){html[data-theme="system"] [data-view="analysis"] .rm-insight-row{background:linear-gradient(145deg,color-mix(in srgb,var(--rm-row-tone,var(--accent)) 14%,#19191f),color-mix(in srgb,var(--rm-row-tone,var(--accent)) 6%,#111116))!important;border-color:color-mix(in srgb,var(--rm-row-tone,var(--accent)) 25%,rgba(255,255,255,.10))!important}}
`;document.head.appendChild(st)})();

function rmV24Boot(){
  rmV24ConsolidateHealthSettings();rmV24ColorizeAnalysis();
  const top=document.getElementById('topVersion'),about=document.getElementById('versionLabel');if(top)top.textContent=`v${RM_V24_RELEASE}`;if(about)about.textContent=RM_V24_RELEASE;
}
rmV24Boot();
[80,250,700,1500].forEach(ms=>setTimeout(rmV24Boot,ms));
document.addEventListener('click',e=>{if(e.target.closest('[data-tab="settings"]'))setTimeout(rmV24ConsolidateHealthSettings,30);if(e.target.closest('[data-tab="analysis"]'))setTimeout(rmV24ColorizeAnalysis,60)},true);
if(typeof rmInvalidate==='function')rmInvalidate('analysis','settings');
