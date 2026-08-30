/* Paletas semânticas dos tipos de registro: alternância em Ajustes + aplicação global consistente. */
const REGISTRO_SEMANTIC_PALETTES={
  suggested:{label:'Paleta sugerida',note:'#7259D6',medication:'#00C7BE',sleep:'#4A63B7',purchase:'#FF9500'},
  user:{label:'Sua paleta',note:'#0188FE',medication:'#00C0E7',sleep:'#6155F4',purchase:'#3B9BB2'}
};

function semanticPaletteKey(){return getSettings().semanticPalette==='user'?'user':'suggested'}
function semanticPalette(){return REGISTRO_SEMANTIC_PALETTES[semanticPaletteKey()]}
function semanticPaletteSwatches(p){return`<div class="semantic-palette-swatches"><span><i style="--swatch:${p.note}"></i>Anotação</span><span><i style="--swatch:${p.medication}"></i>Medicamentos</span><span><i style="--swatch:${p.sleep}"></i>Sono</span><span><i style="--swatch:${p.purchase}"></i>Compra</span></div>`}

function ensureSemanticPaletteStyles(){if(document.getElementById('semantic-palette-styles'))return;const st=document.createElement('style');st.id='semantic-palette-styles';st.textContent=`
:root{--record-note:#7259D6;--record-med:#00C7BE;--record-sleep:#4A63B7;--record-buy:#FF9500}
[data-icon="note"]{color:var(--record-note)!important}
[data-icon="pill"]{color:var(--record-med)!important}
[data-icon="moon"]{color:var(--record-sleep)!important}
[data-icon="bag"]{color:var(--record-buy)!important}
.compact-summary-list .summary-row:nth-child(1) .summary-row-icon{color:var(--record-note)!important}
.compact-summary-list .summary-row:nth-child(2) .summary-row-icon{color:var(--record-med)!important}
.compact-summary-list .summary-row:nth-child(3) .summary-row-icon{color:var(--record-sleep)!important}
.compact-summary-list .summary-row:nth-child(4) .summary-row-icon{color:var(--record-buy)!important}
.kind-note{color:var(--record-note)!important}.kind-medication{color:var(--record-med)!important}.kind-sleep{color:var(--record-sleep)!important}.kind-purchase{color:var(--record-buy)!important}
.primary-action{background:color-mix(in srgb,var(--record-note) 10%,var(--surface));border-color:color-mix(in srgb,var(--record-note) 28%,transparent)}.primary-action strong{color:var(--record-note)}
.semantic-palette-swatches{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;margin-top:11px}.semantic-palette-swatches span{display:flex;align-items:center;gap:7px;color:var(--secondary);font-size:11px}.semantic-palette-swatches i{width:14px;height:14px;border-radius:50%;background:var(--swatch);box-shadow:0 0 0 1px color-mix(in srgb,var(--swatch) 52%,transparent),0 0 12px color-mix(in srgb,var(--swatch) 38%,transparent);flex:0 0 auto}.semantic-palette-note{margin:9px 1px 0;color:var(--secondary);font-size:10.5px;line-height:1.4}
`;document.head.appendChild(st)}

function ensureSemanticPaletteSettingsUI(){const accent=document.getElementById('accentControl')?.closest('.setting-block');if(!accent||document.getElementById('semanticPaletteControl'))return;const sep=document.createElement('div');sep.className='setting-separator';const block=document.createElement('div');block.className='setting-block';block.innerHTML=`<div class="setting-label"><strong>Cores dos registros</strong><small>Identidade de Anotação, Medicamentos, Sono e Compra</small></div><div class="segmented animated-segmented" id="semanticPaletteControl"><button type="button" data-semantic-palette="suggested">Paleta sugerida</button><button type="button" data-semantic-palette="user">Sua paleta</button></div><div id="semanticPalettePreview"></div><p class="semantic-palette-note">Essa escolha é independente da Cor principal, que continua controlando seleções e destaques gerais.</p>`;accent.after(sep,block)}

function applySemanticPalette(){ensureSemanticPaletteStyles();ensureSemanticPaletteSettingsUI();const key=semanticPaletteKey(),p=REGISTRO_SEMANTIC_PALETTES[key],html=document.documentElement;html.dataset.semanticPalette=key;html.style.setProperty('--record-note',p.note);html.style.setProperty('--record-med',p.medication);html.style.setProperty('--record-sleep',p.sleep);html.style.setProperty('--record-buy',p.purchase);/* compatibilidade com componentes antigos */html.style.setProperty('--med',p.medication);html.style.setProperty('--sleep',p.sleep);html.style.setProperty('--buy',p.purchase);updateSegmentIndicator(document.getElementById('semanticPaletteControl'),'semanticPalette',key);const preview=document.getElementById('semanticPalettePreview');if(preview)preview.innerHTML=semanticPaletteSwatches(p)}

const semanticPreviousApplySettings=applySettings;
applySettings=function(){semanticPreviousApplySettings();applySemanticPalette()};

document.addEventListener('click',e=>{const b=e.target.closest('[data-semantic-palette]');if(!b)return;setSetting('semanticPalette',b.dataset.semanticPalette)});

applySemanticPalette();
