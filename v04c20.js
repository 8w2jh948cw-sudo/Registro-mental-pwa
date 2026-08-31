/* Modos visuais: Fancy / Ultra preserva o acabamento completo; Otimizado reduz custo gráfico sem mudar a identidade. */
const RM_VISUAL_MODE_VERSION='1.0.0';
const RM_VISUAL_MODE_RELEASE='0.4.19';

function rmVisualMode(){const mode=getSettings()?.visualMode;return mode==='optimized'?'optimized':'ultra'}
function rmApplyVisualMode(explicit=null){
  const mode=explicit==='optimized'?'optimized':explicit==='ultra'?'ultra':rmVisualMode();
  document.documentElement.dataset.visualMode=mode;
  const control=document.getElementById('visualModeControl');
  if(control&&typeof updateSegmentIndicator==='function')updateSegmentIndicator(control,'visualMode',mode);
  const help=document.getElementById('visualModeHelp');
  if(help)help.textContent=mode==='optimized'?'Menos blur, glow e filtros pesados; mantém cores, gradientes, ícones e hierarquia.':'Todos os efeitos visuais, glow, blur, sombras e acabamento luminoso.';
  return mode;
}
function rmSetVisualMode(mode){
  mode=mode==='optimized'?'optimized':'ultra';
  const s=getSettings();s.visualMode=mode;
  /* Salva sem passar pelo renderizador: trocar o modo não precisa reconstruir nenhuma aba. */
  try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(s))}catch{}
  rmApplyVisualMode(mode);
  toast(mode==='optimized'?'Modo Otimizado ativado.':'Modo Fancy / Ultra ativado.');
}
function rmEnsureVisualModeUI(){
  if(document.getElementById('visualModeControl'))return;
  const appearance=[...document.querySelectorAll('.settings-group')].find(g=>g.querySelector(':scope>h2')?.textContent.trim()==='Aparência');
  const card=appearance?.querySelector('.settings-card');
  const theme=card?.querySelector('.setting-block');
  if(!card||!theme)return;
  const sep=document.createElement('div');sep.className='setting-separator';sep.dataset.visualModeSeparator='1';
  const block=document.createElement('div');block.className='setting-block';block.id='visualModeSetting';
  block.innerHTML=`<div class="setting-label"><strong>Efeitos visuais</strong><small id="visualModeHelp">Fancy / Ultra usa o acabamento completo; Otimizado prioriza fluidez.</small></div><div class="segmented animated-segmented" id="visualModeControl"><button type="button" data-visual-mode="ultra">Fancy / Ultra</button><button type="button" data-visual-mode="optimized">Otimizado</button></div>`;
  theme.after(sep,block);
  block.querySelectorAll('[data-visual-mode]').forEach(b=>b.onclick=()=>rmSetVisualMode(b.dataset.visualMode));
  rmApplyVisualMode();
}

/* Toda mudança futura de aparência mantém o modo visual aplicado. */
if(typeof applySettings==='function'&&!applySettings.__rmVisualMode){
  const previous=applySettings;
  const wrapped=function(...args){const result=previous(...args);rmEnsureVisualModeUI();rmApplyVisualMode();return result};
  wrapped.__rmVisualMode=true;wrapped.__rmPrevious=previous;applySettings=wrapped;
}

(function rmEnsureVisualModeStyles(){if(document.getElementById('rm-visual-mode-style'))return;const st=document.createElement('style');st.id='rm-visual-mode-style';st.textContent=`
/* O modo Ultra é o visual atual; apenas explicitamos a preferência. */
html[data-visual-mode="ultra"]{--rm-visual-detail:1}

/* Otimizado: mesma linguagem visual, com efeitos mais baratos para Safari/iPhone. */
html[data-visual-mode="optimized"]{--rm-visual-detail:.45}
html[data-visual-mode="optimized"] body{
 background:radial-gradient(circle at 86% 10%,rgba(70,160,255,.09),transparent 32%),linear-gradient(180deg,#fbfcff 0%,#f4f7fd 100%)!important
}
html[data-theme="dark"][data-visual-mode="optimized"] body{
 background:radial-gradient(circle at 88% 8%,rgba(86,200,255,.07),transparent 34%),linear-gradient(180deg,#09090d,#020205)!important
}
html[data-visual-mode="optimized"] .summary-card,
html[data-visual-mode="optimized"] .analysis-card,
html[data-visual-mode="optimized"] .settings-card,
html[data-visual-mode="optimized"] .notice-card,
html[data-visual-mode="optimized"] .action-card,
html[data-visual-mode="optimized"] .timeline-item,
html[data-visual-mode="optimized"] .empty-state,
html[data-visual-mode="optimized"] .registry-card,
html[data-visual-mode="optimized"] .learning-question,
html[data-visual-mode="optimized"] .presentation-row,
html[data-visual-mode="optimized"] .med-note-row,
html[data-visual-mode="optimized"] .package-row,
html[data-visual-mode="optimized"] .autocomplete-results{
 backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
 box-shadow:inset 0 1px 0 rgba(255,255,255,.32),0 7px 18px rgba(48,54,93,.07)!important
}
html[data-theme="dark"][data-visual-mode="optimized"] .summary-card,
html[data-theme="dark"][data-visual-mode="optimized"] .analysis-card,
html[data-theme="dark"][data-visual-mode="optimized"] .settings-card,
html[data-theme="dark"][data-visual-mode="optimized"] .notice-card,
html[data-theme="dark"][data-visual-mode="optimized"] .action-card,
html[data-theme="dark"][data-visual-mode="optimized"] .timeline-item{
 box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 7px 16px rgba(0,0,0,.18)!important
}
html[data-visual-mode="optimized"] .primary-action,
html[data-visual-mode="optimized"] .action-card:not(.primary-action){
 box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 7px 18px rgba(48,54,93,.07),0 0 10px color-mix(in srgb,var(--rm-card-accent,var(--accent)) 7%,transparent)!important
}
html[data-visual-mode="optimized"] .analysis-card,
html[data-visual-mode="optimized"] .notice-card{box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 7px 18px rgba(48,54,93,.07)!important}
html[data-visual-mode="optimized"] .action-icon,
html[data-visual-mode="optimized"] .analysis-title>span,
html[data-visual-mode="optimized"] .notice-icon,
html[data-visual-mode="optimized"] .settings-row-icon,
html[data-visual-mode="optimized"] .tab-item.selected>span{filter:none!important}
html[data-visual-mode="optimized"] .round-button,
html[data-visual-mode="optimized"] .sheet-close,
html[data-visual-mode="optimized"] .filter-chip,
html[data-visual-mode="optimized"] .secondary-button,
html[data-visual-mode="optimized"] .tiny-clear,
html[data-visual-mode="optimized"] .chart-review-btn{
 box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 4px 10px rgba(48,54,93,.06)!important
}
html[data-visual-mode="optimized"] .primary-button,
html[data-visual-mode="optimized"] .full-button,
html[data-visual-mode="optimized"] .filter-chip.selected{
 box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 6px 14px color-mix(in srgb,var(--accent) 10%,transparent),0 0 8px color-mix(in srgb,var(--accent) 12%,transparent)!important
}
html[data-visual-mode="optimized"] .metric,
html[data-visual-mode="optimized"] .analysis-row,
html[data-visual-mode="optimized"] .continuity-alert-row,
html[data-visual-mode="optimized"] .learning-context,
html[data-visual-mode="optimized"] .dose-result,
html[data-visual-mode="optimized"] .segmented,
html[data-visual-mode="optimized"] .emotion-advanced{box-shadow:inset 0 1px 0 rgba(255,255,255,.16)!important}
html[data-visual-mode="optimized"] .sheet{
 backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
 box-shadow:inset 0 1px 0 rgba(255,255,255,.24),0 -12px 28px rgba(0,0,0,.14)!important
}
html[data-visual-mode="optimized"] .sheet-header{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
html[data-visual-mode="optimized"] .field input,
html[data-visual-mode="optimized"] .field textarea,
html[data-visual-mode="optimized"] .field select{box-shadow:inset 0 1px 2px rgba(0,0,0,.025)!important}
html[data-visual-mode="optimized"] .field input:focus,
html[data-visual-mode="optimized"] .field textarea:focus,
html[data-visual-mode="optimized"] .field select:focus{box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 12%,transparent)!important}
html[data-visual-mode="optimized"] .timeline-item:has(.kind-note),
html[data-visual-mode="optimized"] .timeline-item:has(.kind-medication),
html[data-visual-mode="optimized"] .timeline-item:has(.kind-sleep),
html[data-visual-mode="optimized"] .timeline-item:has(.kind-purchase){box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 6px 15px rgba(48,54,93,.06)!important}
html[data-visual-mode="optimized"] .tab-bar,
html[data-visual-mode="optimized"] .capsule-tabbar{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
html[data-visual-mode="optimized"] .tab-bubble{box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 3px 9px rgba(0,0,0,.08)!important}
html[data-visual-mode="optimized"] .mood-score{box-shadow:inset 0 1px 1px rgba(255,255,255,.24),0 3px 9px rgba(0,0,0,.05)!important}
html[data-visual-mode="optimized"] .mood-score.selected{box-shadow:inset 0 1px 1px rgba(255,255,255,.32),0 0 0 2px color-mix(in srgb,var(--mood-border) 58%,white 42%),0 0 10px var(--mood-glow)!important;transform:scale(1.10) translateY(-1px)!important}
html[data-visual-mode="optimized"] .emotion-scale button{box-shadow:none!important}
html[data-visual-mode="optimized"] .emotion-scale button.selected{box-shadow:0 0 8px color-mix(in srgb,var(--dimension-color) 22%,transparent)!important}
html[data-visual-mode="optimized"] .rm-emotion-chart [filter],
html[data-visual-mode="optimized"] .rm-mood-bars [filter],
html[data-visual-mode="optimized"] .rm-mood-scatter [filter]{filter:none!important}
html[data-visual-mode="optimized"] .rm-emotion-chart path[mask]{opacity:.12!important}
html[data-visual-mode="optimized"] .dashboard-chart,
html[data-visual-mode="optimized"] .analysis-card{will-change:auto!important}
html[data-visual-mode="optimized"] button,
html[data-visual-mode="optimized"] .action-icon,
html[data-visual-mode="optimized"] .mood-score,
html[data-visual-mode="optimized"] .tab-bubble{transition-duration:.16s!important}
html[data-visual-mode="optimized"] .view.active .summary-card,
html[data-visual-mode="optimized"] .view.active .analysis-card,
html[data-visual-mode="optimized"] .view.active .settings-card,
html[data-visual-mode="optimized"] .view.active .action-card{animation-duration:.18s!important}

#visualModeControl{grid-template-columns:repeat(2,minmax(0,1fr))}
#visualModeControl button{font-size:12px;white-space:nowrap}
`;document.head.appendChild(st)})();

rmEnsureVisualModeUI();rmApplyVisualMode();
const top=document.getElementById('topVersion'),about=document.getElementById('versionLabel');if(top)top.textContent=`v${RM_VISUAL_MODE_RELEASE}`;if(about)about.textContent=RM_VISUAL_MODE_RELEASE;
