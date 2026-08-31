/* Ajustes 0.4.20: organiza Aparência e move opções avançadas para uma página própria. */
const RM_SETTINGS_LAYOUT_RELEASE='0.4.20';

function rmSystemFontOnly(){
  const html=document.documentElement;
  html.dataset.fontFamily='system';
  if(document.body)document.body.style.fontFamily='-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif';
  try{const s=getSettings();if(s.fontFamily!=='system'){s.fontFamily='system';localStorage.setItem(SETTINGS_KEY,JSON.stringify(s))}}catch{}
  const control=document.getElementById('fontFamilyControl');
  const block=control?.closest('.setting-block');
  if(block){const prev=block.previousElementSibling;block.remove();if(prev?.classList.contains('setting-separator'))prev.remove()}
}

function rmEnsureVisualModeControl(){
  if(!document.getElementById('visualModeControl')){
    const theme=document.getElementById('themeControl')?.closest('.setting-block');
    if(theme){
      const sep=document.createElement('div');sep.className='setting-separator';
      const block=document.createElement('div');block.className='setting-block rm-center-setting';
      block.innerHTML='<div class="setting-label"><strong>Efeitos visuais</strong><small id="visualModeHelp">Fancy / Ultra usa o acabamento completo; Otimizado prioriza fluidez.</small></div><div class="segmented animated-segmented" id="visualModeControl"><button type="button" data-visual-mode="ultra">Fancy / Ultra</button><button type="button" data-visual-mode="optimized">Otimizado</button></div>';
      theme.after(sep,block);
    }
  }
  const control=document.getElementById('visualModeControl');
  if(!control)return;
  control.querySelectorAll('[data-visual-mode]').forEach(button=>{
    if(button.dataset.rmVisualWired==='1')return;
    button.dataset.rmVisualWired='1';
    button.addEventListener('click',()=>{
      const mode=button.dataset.visualMode==='optimized'?'optimized':'ultra';
      if(typeof rmSetVisualMode==='function')rmSetVisualMode(mode);
      else{
        const s=getSettings();s.visualMode=mode;localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));
        document.documentElement.dataset.visualMode=mode;
        updateSegmentIndicator(control,'visualMode',mode);
      }
    });
  });
  const mode=getSettings()?.visualMode==='optimized'?'optimized':'ultra';
  document.documentElement.dataset.visualMode=mode;
  updateSegmentIndicator(control,'visualMode',mode);
}

function rmCenterSuitableSettings(){
  ['themeControl','visualModeControl','accentControl','iconSizeControl','iconWeightControl','healthImportModeControl','fontWeightControl'].forEach(id=>{
    document.getElementById(id)?.closest('.setting-block')?.classList.add('rm-center-setting');
  });
  const themeLabel=document.getElementById('themeControl')?.closest('.setting-block')?.querySelector('.setting-label');
  themeLabel?.querySelector('small')?.remove();
}

function rmDetachBlock(id){
  const el=document.getElementById(id),block=el?.closest('.setting-block,.setting-inline,.settings-row');
  if(!block)return null;
  const prev=block.previousElementSibling;
  if(prev?.classList.contains('setting-separator'))prev.remove();
  block.remove();
  return block;
}

function rmCreateAdvancedPage(){
  if(document.querySelector('[data-view="advanced-settings"]'))return document.querySelector('[data-view="advanced-settings"]');
  const main=document.getElementById('content');if(!main)return null;
  const page=document.createElement('section');
  page.className='view rm-advanced-settings-view';page.dataset.view='advanced-settings';
  page.innerHTML=`
    <header class="page-header rm-subpage-header">
      <button type="button" class="round-button rm-back-button" id="advancedSettingsBackBtn" aria-label="Voltar">‹</button>
      <div class="rm-subpage-title"><p class="eyebrow">Ajustes</p><h1>Personalização avançada</h1></div>
    </header>
    <section class="settings-group"><h2>Texto</h2><div class="settings-card" id="rmAdvancedText"></div></section>
    <section class="settings-group"><h2>Interface</h2><div class="settings-card" id="rmAdvancedInterface"></div></section>
    <section class="settings-group"><h2>Ícones e barra inferior</h2><div class="settings-card list-card" id="rmAdvancedNavigation"></div></section>`;
  main.appendChild(page);
  document.getElementById('advancedSettingsBackBtn').addEventListener('click',rmCloseAdvancedSettings);
  return page;
}

function rmMoveAdvancedSettings(){
  const page=rmCreateAdvancedPage();if(!page)return;
  const textCard=document.getElementById('rmAdvancedText');
  const interfaceCard=document.getElementById('rmAdvancedInterface');
  const navCard=document.getElementById('rmAdvancedNavigation');

  const weight=rmDetachBlock('fontWeightControl');
  if(weight){weight.classList.add('rm-center-setting');textCard.appendChild(weight)}

  const showVersion=rmDetachBlock('showVersionToggle');
  const hideLabels=rmDetachBlock('hideTabLabelsToggle');
  [showVersion,hideLabels].filter(Boolean).forEach((node,i)=>{if(i)interfaceCard.appendChild(Object.assign(document.createElement('div'),{className:'setting-separator'}));interfaceCard.appendChild(node)});

  const customIcons=rmDetachBlock('customIconsBtn');
  const tabbarLab=rmDetachBlock('tabbarLabBtn');
  [customIcons,tabbarLab].filter(Boolean).forEach((node,i)=>{if(i)navCard.appendChild(Object.assign(document.createElement('div'),{className:'setting-separator inset'}));navCard.appendChild(node)});

  const oldGroup=[...document.querySelectorAll('[data-view="settings"] .settings-group')].find(g=>g.querySelector('h2')?.textContent.trim()==='Personalização avançada');
  if(oldGroup){
    oldGroup.querySelector('h2').textContent='Personalização';
    const card=oldGroup.querySelector('.settings-card');
    if(card)card.innerHTML='<button class="settings-row" id="advancedSettingsBtn"><span class="settings-row-icon" data-icon="settings"></span><span><strong>Personalização avançada</strong><small>Peso da fonte, versão, ícones e barra inferior</small></span><span class="chevron">›</span></button>';
  }else if(!document.getElementById('advancedSettingsBtn')){
    const dataGroup=[...document.querySelectorAll('[data-view="settings"] .settings-group')].find(g=>g.querySelector('h2')?.textContent.trim()==='Dados');
    const group=document.createElement('section');group.className='settings-group';
    group.innerHTML='<h2>Personalização</h2><div class="settings-card list-card"><button class="settings-row" id="advancedSettingsBtn"><span class="settings-row-icon" data-icon="settings"></span><span><strong>Personalização avançada</strong><small>Peso da fonte, versão, ícones e barra inferior</small></span><span class="chevron">›</span></button></div>';
    dataGroup?.before(group);
  }
  document.getElementById('advancedSettingsBtn')?.addEventListener('click',rmOpenAdvancedSettings);
  if(typeof hydrateIcons==='function')hydrateIcons(page.parentElement||document);
}

function rmOpenAdvancedSettings(){
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.dataset.view==='advanced-settings'));
  document.documentElement.dataset.settingsSubpage='advanced';
  window.scrollTo({top:0,behavior:'instant'});
}
function rmCloseAdvancedSettings(){
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.dataset.view==='settings'));
  document.documentElement.dataset.settingsSubpage='';
  document.querySelectorAll('.tab-item').forEach(b=>b.classList.toggle('selected',b.dataset.tab==='settings'));
  if(typeof updateTabBubble==='function')updateTabBubble();
  window.scrollTo({top:0,behavior:'instant'});
}

(function rmSettingsLayoutStyles(){
  if(document.getElementById('rm-settings-layout-style'))return;
  const st=document.createElement('style');st.id='rm-settings-layout-style';st.textContent=`
  .rm-center-setting .setting-label{align-items:center;text-align:center}
  .rm-center-setting .setting-label strong,.rm-center-setting .setting-label small{width:100%}
  .rm-center-setting .accent-options{justify-content:center}
  .rm-subpage-header{position:relative;align-items:center;min-height:48px;margin-bottom:24px}
  .rm-subpage-header .rm-back-button{position:absolute;left:0;top:0;font-size:30px;font-weight:350;line-height:1}
  .rm-subpage-title{width:100%;text-align:center;padding:0 48px}
  .rm-subpage-title .eyebrow{margin-bottom:3px}
  .rm-subpage-title h1{font-size:27px;line-height:1.08}
  html[data-settings-subpage="advanced"] .tab-bar{opacity:0!important;pointer-events:none!important;transform:translateX(-50%) translateY(24px)!important}
  #rmAdvancedText:empty,#rmAdvancedInterface:empty,#rmAdvancedNavigation:empty{display:none}
  #visualModeControl{grid-template-columns:repeat(2,minmax(0,1fr))}
  #visualModeControl button{font-size:12px;white-space:nowrap}
  `;document.head.appendChild(st)
})();

function rmApplySettingsLayout(){
  rmSystemFontOnly();
  rmEnsureVisualModeControl();
  rmMoveAdvancedSettings();
  rmCenterSuitableSettings();
  const top=document.getElementById('topVersion'),about=document.getElementById('versionLabel');
  if(top)top.textContent=`v${RM_SETTINGS_LAYOUT_RELEASE}`;
  if(about)about.textContent=RM_SETTINGS_LAYOUT_RELEASE;
}

rmApplySettingsLayout();
setTimeout(rmApplySettingsLayout,0);
