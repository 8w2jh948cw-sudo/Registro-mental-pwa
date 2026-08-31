/* 0.4.25 — Otimizado passa a ser o visual padrão. Ultra continua opcional. */
const RM_V25_RELEASE='0.4.25';
const RM_V25_SETTINGS_KEY='registro-settings-v2';

function rmV25StoredMode(){
  try{
    const raw=JSON.parse(localStorage.getItem(RM_V25_SETTINGS_KEY)||'{}');
    if(raw.visualMode==='ultra'||raw.visualMode==='optimized')return raw.visualMode;
    raw.visualMode='optimized';
    localStorage.setItem(RM_V25_SETTINGS_KEY,JSON.stringify(raw));
    return 'optimized';
  }catch{return 'optimized'}
}

/* Executa antes do motor visual pesado: instalações sem escolha explícita já começam leves. */
document.documentElement.dataset.visualMode=rmV25StoredMode();

function rmV25EnsureStyles(){
  let st=document.getElementById('rm-v25-optimized-style');
  if(!st){st=document.createElement('style');st.id='rm-v25-optimized-style'}
  st.textContent=`
/* OTIMIZADO: identidade, cor e hierarquia permanecem; efeitos caros deixam de ser padrão. */
html[data-visual-mode="optimized"] body{background:var(--bg,#f7f8fc)!important;background-image:none!important}
html[data-theme="dark"][data-visual-mode="optimized"] body{background:#08090d!important;background-image:none!important}
@media(prefers-color-scheme:dark){html[data-theme="system"][data-visual-mode="optimized"] body{background:#08090d!important;background-image:none!important}}

html[data-visual-mode="optimized"] .summary-card,
html[data-visual-mode="optimized"] .analysis-card,
html[data-visual-mode="optimized"] .settings-card,
html[data-visual-mode="optimized"] .notice-card,
html[data-visual-mode="optimized"] .timeline-item,
html[data-visual-mode="optimized"] .empty-state,
html[data-visual-mode="optimized"] .registry-card,
html[data-visual-mode="optimized"] .learning-question,
html[data-visual-mode="optimized"] .presentation-row,
html[data-visual-mode="optimized"] .med-note-row,
html[data-visual-mode="optimized"] .package-row,
html[data-visual-mode="optimized"] .autocomplete-results{
  background:var(--surface,#fff)!important;background-image:none!important;
  backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
  box-shadow:0 2px 9px rgba(38,43,70,.055)!important;
}
html[data-theme="dark"][data-visual-mode="optimized"] .summary-card,
html[data-theme="dark"][data-visual-mode="optimized"] .analysis-card,
html[data-theme="dark"][data-visual-mode="optimized"] .settings-card,
html[data-theme="dark"][data-visual-mode="optimized"] .notice-card,
html[data-theme="dark"][data-visual-mode="optimized"] .timeline-item{
  box-shadow:0 2px 9px rgba(0,0,0,.20)!important;
}

/* Ações continuam identificáveis por cor, sem halo contínuo nem degradê. */
html[data-visual-mode="optimized"] .action-card{
  background:color-mix(in srgb,var(--rm-card-accent,var(--accent)) 5%,var(--surface,#fff))!important;
  background-image:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
  box-shadow:0 2px 8px rgba(38,43,70,.055)!important;
}
html[data-visual-mode="optimized"] .action-icon,
html[data-visual-mode="optimized"] .analysis-title>span,
html[data-visual-mode="optimized"] .notice-icon,
html[data-visual-mode="optimized"] .settings-row-icon,
html[data-visual-mode="optimized"] .rm-insight-icon,
html[data-visual-mode="optimized"] .rm-chart-title-icon{filter:none!important;text-shadow:none!important}

html[data-visual-mode="optimized"] .sheet,
html[data-visual-mode="optimized"] .sheet-header,
html[data-visual-mode="optimized"] .tab-bar,
html[data-visual-mode="optimized"] .capsule-tabbar{
  backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
}
html[data-visual-mode="optimized"] .sheet{background:var(--surface,#fff)!important;background-image:none!important;box-shadow:0 -8px 24px rgba(0,0,0,.13)!important}
html[data-visual-mode="optimized"] .tab-bar,
html[data-visual-mode="optimized"] .capsule-tabbar{box-shadow:0 4px 14px rgba(0,0,0,.09)!important}
html[data-visual-mode="optimized"] .tab-bubble{box-shadow:0 2px 7px rgba(0,0,0,.08)!important}

/* Controles comuns quase planos. */
html[data-visual-mode="optimized"] .round-button,
html[data-visual-mode="optimized"] .sheet-close,
html[data-visual-mode="optimized"] .filter-chip,
html[data-visual-mode="optimized"] .secondary-button,
html[data-visual-mode="optimized"] .tiny-clear,
html[data-visual-mode="optimized"] .chart-review-btn,
html[data-visual-mode="optimized"] .segmented{box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
html[data-visual-mode="optimized"] .primary-button,
html[data-visual-mode="optimized"] .full-button,
html[data-visual-mode="optimized"] .filter-chip.selected{box-shadow:0 2px 8px color-mix(in srgb,var(--accent) 10%,transparent)!important}
html[data-visual-mode="optimized"] .field input,
html[data-visual-mode="optimized"] .field textarea,
html[data-visual-mode="optimized"] .field select{box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
html[data-visual-mode="optimized"] .field input:focus,
html[data-visual-mode="optimized"] .field textarea:focus,
html[data-visual-mode="optimized"] .field select:focus{box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 14%,transparent)!important}

/* Análises: cor continua informativa, mas por borda, ícone e tipografia — não por camadas luminosas. */
html[data-visual-mode="optimized"] [data-view="analysis"] .rm-analysis-colored{
  background:var(--surface,#fff)!important;background-image:none!important;
  border-color:color-mix(in srgb,var(--rm-analysis-tone,var(--accent)) 22%,var(--separator))!important;
  box-shadow:0 2px 9px rgba(38,43,70,.05)!important;
}
html[data-visual-mode="optimized"] [data-view="analysis"] .rm-insight-row{
  background:color-mix(in srgb,var(--rm-row-tone,var(--accent)) 5%,var(--surface-2,var(--surface,#fff)))!important;
  background-image:none!important;border-color:color-mix(in srgb,var(--rm-row-tone,var(--accent)) 17%,var(--separator))!important;
  box-shadow:none!important;
}
html[data-visual-mode="optimized"] [data-view="analysis"] .rm-insight-icon,
html[data-visual-mode="optimized"] [data-view="analysis"] .rm-chart-title-icon{box-shadow:none!important}
html[data-visual-mode="optimized"] #sleepAnalysis .metric{
  background:color-mix(in srgb,var(--record-sleep,var(--sleep)) 7%,var(--surface,#fff))!important;
  background-image:none!important;box-shadow:none!important;
}
html[data-visual-mode="optimized"] #sleepAnalysis .metric strong{text-shadow:none!important}

/* Gráficos mantêm as cores dos dados. Apenas filtros/halos caros saem. */
html[data-visual-mode="optimized"] .rm-emotion-chart [filter],
html[data-visual-mode="optimized"] .rm-mood-bars [filter],
html[data-visual-mode="optimized"] .rm-mood-scatter [filter]{filter:none!important}
html[data-visual-mode="optimized"] .rm-emotion-chart path[mask]{opacity:.10!important}
html[data-visual-mode="optimized"] .dashboard-chart{will-change:auto!important}

/* Glow fica apenas onde comunica seleção/estado importante. */
html[data-visual-mode="optimized"] .mood-score{box-shadow:none!important}
html[data-visual-mode="optimized"] .mood-score.selected{
  box-shadow:0 0 0 2px color-mix(in srgb,var(--mood-border) 62%,white 38%),0 0 8px var(--mood-glow)!important;
  transform:scale(1.09) translateY(-1px)!important
}
html[data-visual-mode="optimized"] .emotion-scale button{box-shadow:none!important}
html[data-visual-mode="optimized"] .emotion-scale button.selected{box-shadow:0 0 6px color-mix(in srgb,var(--dimension-color) 18%,transparent)!important}
html[data-visual-mode="optimized"] .rm-positive-text{text-shadow:none!important}

html[data-visual-mode="optimized"] button,
html[data-visual-mode="optimized"] .action-icon,
html[data-visual-mode="optimized"] .mood-score,
html[data-visual-mode="optimized"] .tab-bubble{transition-duration:.14s!important}
html[data-visual-mode="optimized"] .view.active .summary-card,
html[data-visual-mode="optimized"] .view.active .analysis-card,
html[data-visual-mode="optimized"] .view.active .settings-card,
html[data-visual-mode="optimized"] .view.active .action-card{animation-duration:.14s!important}
`;
  document.head.appendChild(st); /* recoloca no fim para vencer estilos Ultra carregados depois */
}

function rmV25FinalizeVisualMode(){
  const mode=rmV25StoredMode();document.documentElement.dataset.visualMode=mode;
  const control=document.getElementById('visualModeControl');
  if(control){
    const optimized=control.querySelector('[data-visual-mode="optimized"]'),ultra=control.querySelector('[data-visual-mode="ultra"]');
    if(optimized&&ultra){optimized.textContent='Otimizado';ultra.textContent='Ultra';control.insertBefore(optimized,ultra)}
    if(typeof updateSegmentIndicator==='function')updateSegmentIndicator(control,'visualMode',mode);
  }
  const help=document.getElementById('visualModeHelp');
  if(help)help.textContent=mode==='optimized'?'Padrão. Mantém cores e identidade com poucos efeitos para máxima fluidez.':'Efeitos completos: degradês, glow, blur e maior profundidade visual.';
  rmV25EnsureStyles();
  const top=document.getElementById('topVersion'),about=document.getElementById('versionLabel');
  if(top)top.textContent=`v${RM_V25_RELEASE}`;if(about)about.textContent=RM_V25_RELEASE;
}

/* Se o usuário trocar a opção, mantém a preferência explícita e reaplica a versão leve/Ultra sem reconstruir a tela. */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-visual-mode]');if(!b)return;
  setTimeout(()=>{rmV25FinalizeVisualMode()},0)
},true);

rmV25EnsureStyles();
setTimeout(rmV25FinalizeVisualMode,0);
