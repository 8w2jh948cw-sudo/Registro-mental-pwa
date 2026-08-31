/* Ajustes de Saúde 0.4.22: reúne medicamentos, importação de sono e continuidade em um único cartão. */
const RM_HEALTH_HUB_RELEASE='0.4.22';

function rmHealthModeCopy(mode){
  if(mode==='auto')return 'Salva o sono importado diretamente, sem abrir a ficha de revisão.';
  if(mode==='ask')return 'Pergunta antes de salvar cada período de sono recebido do Atalho.';
  return 'Abre a ficha com horários e detalhes antes de salvar. É o modo mais seguro para corrigir o que o relógio não registrou bem.';
}

function rmRefreshHealthImportMode(){
  const control=document.getElementById('rmHealthImportModeControl');
  if(!control)return;
  const mode=getSettings()?.healthImportMode||'review';
  if(typeof updateSegmentIndicator==='function')updateSegmentIndicator(control,'healthMode',mode);
  const text=document.getElementById('rmHealthModeDescription');if(text)text.textContent=rmHealthModeCopy(mode);
}

function rmHealthImportSheet(){
  const last=localStorage.getItem(LAST_HEALTH_IMPORT_KEY);
  openBackdrop('Importar sono do app Saúde',`
    <div class="rm-health-source-card">
      <span class="rm-health-app-icon" aria-hidden="true"><span>♥</span></span>
      <div><strong>Apple Saúde</strong><small>O Atalho funciona como ponte entre os dados de sono do app Saúde e este registro.</small></div>
    </div>
    <div class="analysis-row rm-health-how"><strong>Como funciona</strong><span>O Atalho lê os períodos de sono registrados no app Saúde e abre este PWA com os horários. Você continua livre para corrigir ou completar informações manualmente.</span></div>
    <div class="setting-block rm-health-mode-block">
      <div class="setting-label"><strong>Ao receber um sono do Atalho</strong></div>
      <div class="segmented animated-segmented three-wide" id="rmHealthImportModeControl">
        <button type="button" data-health-mode="auto">Auto</button>
        <button type="button" data-health-mode="review">Revisar</button>
        <button type="button" data-health-mode="ask">Perguntar</button>
      </div>
      <p class="helper rm-health-mode-description" id="rmHealthModeDescription"></p>
    </div>
    <div class="analysis-row"><strong>Status</strong><span>${last?`Última importação ${humanAgo(last)}`:'Nenhuma importação registrada neste aparelho.'}</span></div>
    <p class="helper">O botão “Sono” da tela inicial continua disponível para incluir ou corrigir registros manualmente.</p>
    ${formButtons('Fechar')}
  `,ev=>{ev.preventDefault();closeSheet()});
  rmRefreshHealthImportMode();
  document.getElementById('rmHealthImportModeControl')?.querySelectorAll('[data-health-mode]').forEach(button=>{
    button.addEventListener('click',()=>requestAnimationFrame(rmRefreshHealthImportMode));
  });
}

function rmRemoveSettingGroup(group){if(group&&group.parentNode)group.remove()}
function rmGroupContaining(el){return el?.closest('.settings-group')||null}
function rmDetachRow(el){
  if(!el)return null;
  const row=el.closest('.settings-row,.setting-block,.setting-inline');if(!row)return null;
  const prev=row.previousElementSibling;if(prev?.classList.contains('setting-separator'))prev.remove();
  const next=row.nextElementSibling;if(next?.classList.contains('setting-separator'))next.remove();
  row.remove();return row;
}
function rmSeparator(inset=true){const x=document.createElement('div');x.className=`setting-separator${inset?' inset':''}`;return x}

function rmOrganizeHealthSettings(){
  const view=document.querySelector('[data-view="settings"]');if(!view)return false;
  const medBtn=document.getElementById('medicationRegistryBtn');
  const healthBtn=document.getElementById('healthImportInfoBtn');
  const continuityBtn=document.getElementById('continuitySettingsBtn');
  if(!medBtn||!healthBtn||!continuityBtn)return false;

  const medGroup=rmGroupContaining(medBtn),oldHealthGroup=rmGroupContaining(healthBtn),continuityGroup=rmGroupContaining(continuityBtn);
  if(!medGroup)return false;
  medGroup.id='healthSettingsGroup';
  const heading=medGroup.querySelector(':scope>h2');if(heading)heading.textContent='Saúde';
  const card=medGroup.querySelector('.settings-card');if(!card)return false;
  card.classList.add('list-card','rm-health-settings-card');

  /* Importação deixa de ocupar espaço na tela principal e passa a abrir a própria configuração. */
  const healthModeMain=document.getElementById('healthImportModeControl')?.closest('.setting-block');
  if(healthModeMain){const sep=healthModeMain.previousElementSibling;healthModeMain.remove();if(sep?.classList.contains('setting-separator'))sep.remove()}

  const healthRow=rmDetachRow(healthBtn);
  const continuityRow=rmDetachRow(continuityBtn);
  if(healthRow){
    const icon=healthRow.querySelector('.settings-row-icon');if(icon){icon.classList.remove('health-icon');icon.dataset.icon='moon'}
    const title=healthRow.querySelector('strong');if(title)title.textContent='Importar sono do app Saúde';
    card.append(rmSeparator(true),healthRow);
  }
  if(continuityRow)card.append(rmSeparator(true),continuityRow);

  if(oldHealthGroup&&oldHealthGroup!==medGroup)rmRemoveSettingGroup(oldHealthGroup);
  if(continuityGroup&&continuityGroup!==medGroup)rmRemoveSettingGroup(continuityGroup);

  const oldFoot=[...view.querySelectorAll('.group-footnote')].find(p=>p.textContent.includes('cartão só aparece'));
  oldFoot?.remove();

  healthBtn.onclick=rmHealthImportSheet;
  if(typeof hydrateIcons==='function')hydrateIcons(medGroup);
  if(typeof renderHealthState==='function')renderHealthState();
  return true;
}

(function rmHealthHubStyles(){
  if(document.getElementById('rm-health-hub-style'))return;
  const st=document.createElement('style');st.id='rm-health-hub-style';st.textContent=`
  #healthSettingsGroup>.settings-card{overflow:hidden}
  #healthSettingsGroup .settings-row-icon[data-icon="moon"]{color:var(--record-sleep,var(--sleep))!important}
  .rm-health-source-card{display:grid;grid-template-columns:46px minmax(0,1fr);gap:12px;align-items:center;padding:13px 14px;margin:6px 0 12px;border-radius:16px;background:color-mix(in srgb,var(--surface-2) 84%,transparent);border:1px solid color-mix(in srgb,var(--separator) 70%,transparent)}
  .rm-health-source-card strong{display:block;font-size:14px}.rm-health-source-card small{display:block;margin-top:2px;color:var(--secondary);font-size:11px;line-height:1.4}
  .rm-health-app-icon{width:42px;height:42px;border-radius:11px;background:#fff;display:grid;place-items:center;box-shadow:0 5px 14px rgba(0,0,0,.09),inset 0 0 0 1px rgba(0,0,0,.04)}
  .rm-health-app-icon span{font-size:25px;line-height:1;color:#ff375f;text-shadow:0 0 9px rgba(255,55,95,.18);transform:translateY(-1px)}
  .rm-health-how{margin-bottom:12px}.rm-health-mode-block{padding:14px 0 6px}.rm-health-mode-block .setting-label{text-align:center;align-items:center;margin-bottom:10px}.rm-health-mode-description{text-align:center;margin:9px 5px 0!important;min-height:31px}
  #rmHealthImportModeControl{grid-template-columns:repeat(3,minmax(0,1fr))}
  `;document.head.appendChild(st)
})();

function rmBootHealthHub(){
  if(rmOrganizeHealthSettings())return;
  let attempts=0;const timer=setInterval(()=>{attempts++;if(rmOrganizeHealthSettings()||attempts>20)clearInterval(timer)},120);
}
rmBootHealthHub();

const top=document.getElementById('topVersion'),about=document.getElementById('versionLabel');
if(top)top.textContent=`v${RM_HEALTH_HUB_RELEASE}`;if(about)about.textContent=RM_HEALTH_HUB_RELEASE;
