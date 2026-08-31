/* 0.4.27 — revisão acumulada: histórico, formulários, detalhes, análises e legibilidade. */
const RM_V27_RELEASE='0.4.27';

function rmV27TypeIcon(type){return type==='note'?'note':type==='medication'?'pill':type==='sleep'?'moon':'bag'}
function rmV27TypeClass(type){return type==='note'?'note':type==='medication'?'medication':type==='sleep'?'sleep':'purchase'}
function rmV27TypeTone(type){return type==='note'?'var(--record-note,var(--accent))':type==='medication'?'var(--record-med,var(--med))':type==='sleep'?'var(--record-sleep,var(--sleep))':'var(--record-buy,var(--buy))'}
function rmV27DoseLabel(e){if(e?.totalDoseValue!=null&&Number.isFinite(Number(e.totalDoseValue)))return`${Number(e.totalDoseValue).toLocaleString('pt-BR')} ${e.doseUnit||''}`.trim();return String(e?.dose||'').trim()}
function rmV27MoneyValue(v){const n=parseMoney(v);return n==null?'':money(n)}
function rmV27PackageLabel(n){n=Math.max(1,Number(n)||1);return`${n.toLocaleString('pt-BR')} ${n===1?'caixa':'caixas'}`}
function rmV27UnitsLabel(n){n=Number(n);return Number.isFinite(n)&&n>0?`${n.toLocaleString('pt-BR')} ${n===1?'unidade':'unidades'}`:''}
function rmV27HumanDurationMs(ms,{compact=true}={}){let min=Math.max(0,Math.round(Number(ms)/60000));if(!Number.isFinite(min))return'—';if(min<60)return`${min} min`;const h=Math.floor(min/60),m=min%60;if(h<24){if(!m)return`${h}h`;return compact?`${h}h${String(m).padStart(2,'0')}`:`${h}h e ${m}min`}const d=Math.floor(h/24),rh=h%24;if(!rh)return`${d} ${d===1?'dia':'dias'}`;return`${d} ${d===1?'dia':'dias'} e ${rh}h`}
function rmV27HumanizeDurationText(text=''){let out=String(text);out=out.replace(/(\d+(?:[,.]\d+)?)\s*dia\(s\)/gi,(_,n)=>rmV27HumanDurationMs(Number(String(n).replace(',','.'))*86400000,{compact:true}));out=out.replace(/(\d+[,.]\d+)\s*h\b/gi,(_,n)=>rmV27HumanDurationMs(Number(String(n).replace(',','.'))*3600000,{compact:true}));return out}
function rmV27HumanizeRoot(root){if(!root)return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const node of nodes){const p=node.parentElement;if(!p||p.closest('svg,script,style,textarea,input'))continue;const next=rmV27HumanizeDurationText(node.nodeValue||'');if(next!==node.nodeValue)node.nodeValue=next}}

function rmV27MoodBadge(score){if(score===null||score===undefined||score==='')return'';const n=Math.max(0,Math.min(5,Math.round(Number(score))));const c=typeof rmMood==='function'?rmMood(n):{color:['#17171D','#FF3B30','#FF6A00','#FFD60A','#35D98B','#56C8FF'][n],border:'#fff',text:n===3?'#332800':'#fff',glow:'rgba(120,120,255,.28)'};return`<span class="rm-mini-mood" style="--rm-mini-mood:${c.color};--rm-mini-border:${c.border};--rm-mini-text:${c.text};--rm-mini-glow:${c.glow}">${n}</span>`}
function rmV27TagChip(tag){return tag?`<span class="rm-note-tag">${esc(tag)}</span>`:''}
function rmV27AdvancedMeta(e){const items=[];for(const [id,v] of Object.entries(e?.emotionScores||{}).slice(0,2)){const label=e.emotionLabels?.[id]||((typeof emotionDimensions==='function'?emotionDimensions():[]).find(d=>d.id===id)?.label)||id;items.push(`<span class="rm-meta-text">${esc(label)} ${esc(v)}/4</span>`)}return items.join('')}

/* Cartões de Histórico/Recentes: ícone acima do horário, coluna menor, dose como dado principal. */
eventCard=function(e){
  const type=rmV27TypeClass(e.type),icon=rmV27TypeIcon(e.type),tone=rmV27TypeTone(e.type);let kind='REGISTRO',title='',meta='';
  if(e.type==='note'){
    kind=e.audioOnly?'ANOTAÇÃO DE VOZ':(!e.text&&e.moodScore!=null?'CHECK-IN':'ANOTAÇÃO');title=e.text||'Check-in emocional';const badges=`${rmV27MoodBadge(e.moodScore)}${rmV27TagChip(e.tag)}${rmV27AdvancedMeta(e)}`;if(badges)meta=`<div class="timeline-meta rm-meta-badges">${badges}</div>`;
  }else if(e.type==='medication'){
    kind='MEDICAMENTO';const dose=rmV27DoseLabel(e);title=`${e.medication||'Medicamento'}${dose?` · ${dose}`:''}`;if(e.note)meta=`<div class="timeline-meta">${esc(e.note)}</div>`;
  }else if(e.type==='sleep'){
    kind='SONO';title=durationLabel(durationHours(e.startTime,e.endTime));const bits=[e.quality?`Qualidade ${e.quality}/5`:null,e.source==='health-shortcut'?'Importado do Saúde':'Manual',e.note].filter(Boolean);if(bits.length)meta=`<div class="timeline-meta">${bits.map(esc).join(' · ')}</div>`;
  }else{
    kind='COMPRA';const price=rmV27MoneyValue(e.price);title=`${e.medication||'Medicamento'}${price?` · ${price}`:''}`;const bits=[e.packages?rmV27PackageLabel(e.packages):null,e.place].filter(Boolean);if(bits.length)meta=`<div class="timeline-meta">${bits.map(esc).join(' · ')}</div>`;
  }
  return`<article class="timeline-item rm-v27-timeline rm-type-${type}" style="--rm-record-tone:${tone}"><div class="timeline-side"><span class="timeline-type-icon">${svg(icon)}</span><div class="timeline-time">${timeLabel(e.timestamp)}</div></div><div class="timeline-main"><div class="timeline-kind kind-${type}">${kind}</div><div class="timeline-title">${esc(title)}</div>${meta}${e.hasAudio?`<div data-audio="${e.id}"></div>`:''}</div><button class="item-menu" data-menu="${e.id}" aria-label="Opções">•••</button></article>`
};

function rmV27EnhanceHistoryFilters(){const box=document.getElementById('historyFilters');if(!box)return;const map={note:['note','Anotações'],medication:['pill','Medicamentos'],sleep:['moon','Sono'],purchase:['bag','Compras']};for(const b of box.querySelectorAll('[data-filter]')){const spec=map[b.dataset.filter];if(!spec||b.dataset.rmV27Icon==='1')continue;b.dataset.rmV27Icon='1';b.classList.add('rm-filter-type');b.style.setProperty('--rm-filter-tone',rmV27TypeTone(b.dataset.filter));b.innerHTML=`<span class="rm-filter-icon">${svg(spec[0])}</span><span>${spec[1]}</span>`}}

/* Sono usa a mesma linguagem visual da escala de humor, mantendo 1–5. */
qualitySelector=function(value=4){return`<div class="sleep-quality rm-sleep-quality" id="sleepQuality">${[1,2,3,4,5].map(q=>{const c=typeof rmMood==='function'?rmMood(q):{color:['','#FF3B30','#FF6A00','#FFD60A','#35D98B','#56C8FF'][q],border:'#fff',text:q===3?'#332800':'#fff',glow:'rgba(100,160,255,.3)'};return`<button type="button" data-quality="${q}" class="mood-score rm-sleep-quality-score ${Number(value)===q?'selected':''}" aria-pressed="${Number(value)===q}" style="--mood-color:${c.color};--mood-border:${c.border};--mood-text:${c.text};--mood-glow:${c.glow}">${q}</button>`}).join('')}</div><input type="hidden" id="sleepQualityValue" value="${Math.max(1,Math.min(5,Number(value)||4))}">`};
wireQualitySelector=function(){const buttons=[...document.querySelectorAll('#sleepQuality [data-quality]')],hidden=document.getElementById('sleepQualityValue');buttons.forEach(b=>b.onclick=()=>{buttons.forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b))});if(hidden)hidden.value=b.dataset.quality})};

/* Dinheiro em compras: apresenta sempre R$ e centavos quando o campo perde foco/salva. */
function rmV27FormatMoneyInput(el){if(!el||!String(el.value||'').trim())return;const n=parseMoney(el.value);if(n!=null)el.value=money(n)}
document.addEventListener('focusout',e=>{if(e.target?.id==='purchasePrice')rmV27FormatMoneyInput(e.target)},true);
document.addEventListener('submit',()=>{rmV27FormatMoneyInput(document.getElementById('purchasePrice'))},true);
if(typeof openPurchaseSheet==='function'){
  const rmV27PrevOpenPurchaseSheet=openPurchaseSheet;
  openPurchaseSheet=async function(...args){const out=await rmV27PrevOpenPurchaseSheet(...args);const input=document.getElementById('purchasePrice');if(input){input.placeholder='R$ 0,00';setTimeout(()=>rmV27FormatMoneyInput(input),0)}return out}
}

/* Visualização de Compra com rótulo discreto e dado principal em destaque. */
function rmV27PurchaseDetail(label,value,{tone=false}={}){if(value===null||value===undefined||String(value).trim()==='')return'';return`<div class="rm-purchase-detail${tone?' tone':''}"><small>${esc(label)}</small><strong>${esc(String(value))}</strong></div>`}
if(typeof openEventViewer==='function'){
  const rmV27PrevViewer=openEventViewer;
  openEventViewer=async function(id){const e=(await allEvents()).find(x=>x.id===id);if(e?.type!=='purchase')return rmV27PrevViewer(id);const meds=await allMedications(),m=meds.find(x=>x.id===e.medicationId)||findProfileByEvent(e,meds),p=findPresentation(m,e.presentationId),presentation=p?presentationDisplay(p):'';const price=rmV27MoneyValue(e.price)||e.price||'—';const body=[rmV27PurchaseDetail('Medicamento',e.medication||'Medicamento',{tone:true}),rmV27PurchaseDetail('Apresentação',presentation),rmV27PurchaseDetail('',rmV27PackageLabel(e.packages)),rmV27PurchaseDetail('',rmV27UnitsLabel(e.totalUnits)),rmV27PurchaseDetail('Valor pago',price,{tone:true}),rmV27PurchaseDetail('Comprado em',e.place||'Não informado'),`<div class="rm-purchase-date">${esc(registroDetailDate(e.timestamp))}</div>`].join('');openBackdrop('Compra',`<div class="rm-purchase-details">${body}</div><div class="form-actions"><button type="button" class="secondary-button" id="viewerCloseBtn">Fechar</button><button type="button" class="primary-button" id="viewerEditBtn">Editar</button></div>`,ev=>ev.preventDefault());document.getElementById('viewerCloseBtn').onclick=closeSheet;document.getElementById('viewerEditBtn').onclick=()=>openEventEditor(id)}
}

/* Gráfico de distribuição 0–5: rótulos grandes, base colorida e contagem dentro/fora da coluna. */
rmMoodBarChart=function(rows){rows=rows.slice(0,6);if(!rows.length)return chartEmpty('Ainda não há dados suficientes.');const W=720,H=310,pad={l:22,r:18,t:30,b:66},iw=W-pad.l-pad.r,baseY=H-48,baseH=34,barBase=baseY-10,plotH=barBase-pad.t,max=Math.max(1,...rows.map(r=>Number(r.value)||0)),bw=Math.max(42,iw/rows.length*.56);return`<svg class="local-chart-svg rm-mood-bars rm-v27-mood-bars" viewBox="0 0 ${W} ${H}" role="img" aria-label="Distribuição do humor"><line class="chart-zero" x1="${pad.l}" y1="${barBase}" x2="${W-pad.r}" y2="${barBase}"/>${rows.map((r,i)=>{const c=rmMood(i),value=Number(r.value)||0,cx=pad.l+(i+.5)*iw/rows.length,h=value?Math.max(12,value/max*plotH):3,top=barBase-h,inside=value>0&&h>=46,countY=inside?top+27:Math.max(19,top-10),countFill=inside?c.text:'currentColor',barFill=i===0?'#17171D':c.color;return`<rect class="rm-v27-mood-bar" x="${cx-bw/2}" y="${top}" width="${bw}" height="${h}" rx="11" fill="${barFill}" stroke="${i===0?'#7657FF':c.border}" stroke-width="2"><title>Nota ${i}: ${value} registro(s)</title></rect><text class="chart-bar-value ${inside?'inside':'outside'}" x="${cx}" y="${countY}" text-anchor="middle" fill="${countFill}">${value}</text><rect class="rm-v27-mood-base" x="${cx-bw/2}" y="${baseY}" width="${bw}" height="${baseH}" rx="10" fill="${barFill}" stroke="${i===0?'#7657FF':c.border}" stroke-width="1.8"/><text class="rm-v27-mood-base-label" x="${cx}" y="${baseY+23}" text-anchor="middle" fill="${c.text}">${i}</text>`}).join('')}</svg>`};

function rmV27PolishContinuity(){const box=document.getElementById('continuityAnalysis');if(!box)return;for(const row of [...box.querySelectorAll('.analysis-row')]){const strong=row.querySelector('strong'),label=strong?.textContent.trim()||'',span=row.querySelector('span');if(/^Maior intervalo entre textos/i.test(label)){row.remove();continue}if(/^Intervalos atuais/i.test(label)){strong?.remove();row.classList.add('rm-continuity-status');const positive=/tudo certo|com frequ[êe]ncia|nenhum dos prazos/i.test(span?.textContent||'');row.classList.toggle('positive',positive);if(positive&&span)span.textContent='Tudo certo, você está fazendo seus registros com frequência.'}}rmV27HumanizeRoot(box)}
function rmV27PolishAnalysis(){const view=document.querySelector('[data-view="analysis"]');if(!view)return;const dist=view.querySelector('[data-analysis-item="chart-mood-distribution"] h2');if(dist)dist.textContent='Distribuição do humor';const purchase=view.querySelector('#purchaseAnalysis');purchase?.querySelectorAll('.rm-detail-line b').forEach(b=>{if(/^Onde:/i.test(b.textContent||''))b.textContent='Comprado em:'});rmV27PolishContinuity();rmV27HumanizeRoot(view)}

if(typeof renderAnalysis==='function'){
  const rmV27PrevRenderAnalysis=renderAnalysis;renderAnalysis=async function(...args){const out=await rmV27PrevRenderAnalysis(...args);rmV27PolishAnalysis();return out}
}
if(typeof renderQuantitativeDashboard==='function'){
  const rmV27PrevRenderDashboard=renderQuantitativeDashboard;renderQuantitativeDashboard=async function(...args){const out=await rmV27PrevRenderDashboard(...args);rmV27PolishAnalysis();return out}
}
if(typeof renderContinuityAnalysis==='function'){
  const rmV27PrevContinuity=renderContinuityAnalysis;renderContinuityAnalysis=async function(...args){const out=await rmV27PrevContinuity(...args);rmV27PolishContinuity();return out}
}
if(typeof applyAnalysisReviewPlacement==='function'){
  const rmV27PrevReviewPlacement=applyAnalysisReviewPlacement;applyAnalysisReviewPlacement=function(...args){const out=rmV27PrevReviewPlacement(...args);setTimeout(rmV27PolishAnalysis,0);return out}
}

function rmV27EnsureStyles(){let st=document.getElementById('rm-v27-style');if(!st){st=document.createElement('style');st.id='rm-v27-style';document.head.appendChild(st)}st.textContent=`
/* Cabeçalhos: título principal primeiro, descrição depois. */
.page-header>div{display:flex;flex-direction:column}.page-header>div>h1{order:0}.page-header>div>.eyebrow{order:1;margin:6px 0 0!important}

/* Remove a faixa/caixa escura atrás dos títulos dos sheets. */
.sheet-header,.sheet-header h2{background:transparent!important;background-image:none!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}.sheet-header{border:0!important}.sheet-header:before,.sheet-header:after{display:none!important}

/* Histórico / recentes */
.timeline-item.rm-v27-timeline{grid-template-columns:40px minmax(0,1fr) 24px!important;column-gap:8px!important;padding-left:11px!important}.timeline-side{display:flex;flex-direction:column;align-items:center;gap:7px;min-width:0}.timeline-type-icon{width:23px;height:23px;display:grid;place-items:center;color:var(--rm-record-tone)}.timeline-type-icon .svg-icon,.timeline-type-icon svg{width:21px!important;height:21px!important}.timeline-side .timeline-time{padding-top:0!important;text-align:center;white-space:nowrap;font-variant-numeric:tabular-nums}.timeline-main{min-width:0}.rm-meta-badges{display:flex!important;align-items:center;gap:7px;flex-wrap:wrap}.rm-mini-mood{width:27px;height:27px;border-radius:9px;display:inline-grid;place-items:center;background:var(--rm-mini-mood);border:1.5px solid var(--rm-mini-border);color:var(--rm-mini-text);font-size:13px;font-weight:850;line-height:1;box-shadow:0 0 9px var(--rm-mini-glow)}.rm-note-tag{position:relative;display:inline-flex;align-items:center;min-height:25px;padding:4px 9px 4px 12px;clip-path:polygon(6px 0,100% 0,100% 100%,6px 100%,0 50%);background:color-mix(in srgb,var(--secondary) 11%,var(--surface-2));color:var(--secondary);font-size:11px;font-weight:700}.rm-meta-text{font-size:11px;color:var(--secondary)}

/* Filtros com ícones semânticos. */
#historyFilters .filter-chip.rm-filter-type{display:inline-flex;align-items:center;gap:6px;border:1px solid color-mix(in srgb,var(--rm-filter-tone) 18%,var(--separator))!important}#historyFilters .rm-filter-icon{width:17px;height:17px;display:grid;place-items:center;color:var(--rm-filter-tone)}#historyFilters .rm-filter-icon svg{width:16px!important;height:16px!important}#historyFilters .filter-chip.rm-filter-type.selected{background:color-mix(in srgb,var(--rm-filter-tone) 15%,var(--surface))!important;background-image:none!important;color:var(--text)!important;border-color:color-mix(in srgb,var(--rm-filter-tone) 42%,var(--separator))!important;box-shadow:0 2px 8px color-mix(in srgb,var(--rm-filter-tone) 9%,transparent)!important}

/* Qualidade do sono no padrão visual do humor. */
.rm-sleep-quality{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:9px!important;padding:6px 2px 5px;overflow:visible}.rm-sleep-quality-score{height:58px!important;border-radius:17px!important;background:var(--mood-color)!important;color:var(--mood-text)!important;border:1.8px solid var(--mood-border)!important;font-size:19px!important;font-weight:850!important;box-shadow:0 3px 9px rgba(0,0,0,.07)!important;transition:transform .18s cubic-bezier(.2,.8,.2,1),box-shadow .18s ease!important}.rm-sleep-quality-score.selected{transform:scale(1.09) translateY(-1px)!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--mood-border) 58%,white 42%),0 0 11px var(--mood-glow)!important;z-index:2}

/* Detalhes de compra */
.rm-purchase-details{display:grid;gap:10px}.rm-purchase-detail{padding:13px 14px;border:1px solid var(--separator);border-radius:16px;background:color-mix(in srgb,var(--record-buy,var(--buy)) 4%,var(--surface-2))}.rm-purchase-detail small{display:block;color:var(--secondary);font-size:10.5px;font-weight:720;margin-bottom:4px}.rm-purchase-detail strong{display:block;color:var(--text);font-size:17px;line-height:1.3;overflow-wrap:anywhere}.rm-purchase-detail.tone strong{color:var(--record-buy,var(--buy))}.rm-purchase-date{text-align:center;color:var(--secondary);font-size:12.5px;padding:4px 0 2px;font-variant-numeric:tabular-nums}

/* Aviso introdutório de Análises mais compacto e legível. */
[data-view="analysis"]>.notice-card{padding:10px 12px!important;grid-template-columns:34px minmax(0,1fr)!important;align-items:center!important}[data-view="analysis"]>.notice-card .notice-icon{justify-self:center!important;align-self:center!important;padding:0!important}[data-view="analysis"]>.notice-card p{text-align:justify;text-justify:inter-word;hyphens:auto}

/* Cartões internos: fundo tonal e harmônico, nunca cinza chapado. */
[data-view="analysis"] .rm-insight-row,[data-view="analysis"] .rm-analysis-colored .analysis-row{background:color-mix(in srgb,var(--rm-row-tone,var(--rm-analysis-tone,var(--accent))) 8%,var(--surface-2))!important;background-image:none!important;border:1px solid color-mix(in srgb,var(--rm-row-tone,var(--rm-analysis-tone,var(--accent))) 20%,var(--separator))!important;box-shadow:none!important}html[data-theme="dark"] [data-view="analysis"] .rm-insight-row,html[data-theme="dark"] [data-view="analysis"] .rm-analysis-colored .analysis-row{background:color-mix(in srgb,var(--rm-row-tone,var(--rm-analysis-tone,var(--accent))) 11%,#14151a)!important;border-color:color-mix(in srgb,var(--rm-row-tone,var(--rm-analysis-tone,var(--accent))) 27%,rgba(255,255,255,.10))!important}@media(prefers-color-scheme:dark){html[data-theme="system"] [data-view="analysis"] .rm-insight-row,html[data-theme="system"] [data-view="analysis"] .rm-analysis-colored .analysis-row{background:color-mix(in srgb,var(--rm-row-tone,var(--rm-analysis-tone,var(--accent))) 11%,#14151a)!important;border-color:color-mix(in srgb,var(--rm-row-tone,var(--rm-analysis-tone,var(--accent))) 27%,rgba(255,255,255,.10))!important}}

/* Avaliar fica visualmente fora do cartão, à direita e claramente associado ao item abaixo. */
[data-view="analysis"] .analysis-review-item:not(.analysis-item-rejected){margin-top:48px!important;overflow:visible!important}[data-view="analysis"] .analysis-review-item:not(.analysis-item-rejected)>.floating-review,[data-view="analysis"] .dashboard-chart:not(.analysis-item-rejected) .chart-card-head>.chart-review-btn{position:absolute!important;top:-35px!important;right:2px!important;z-index:4;margin:0!important}.dashboard-chart .chart-card-head{position:static!important}.analysis-rejected-section .chart-review-btn{position:static!important}

/* Cabeçalho dos gráficos: sem caixinha estranha atrás do ícone. Glow só no Ultra. */
.rm-chart-title-icon{background:transparent!important;border-radius:0!important;box-shadow:none!important;width:27px!important;height:27px!important}.rm-chart-title-icon .svg-icon,.rm-chart-title-icon>svg{width:22px!important;height:22px!important}html[data-visual-mode="optimized"] .rm-chart-title-icon{filter:none!important}html[data-visual-mode="ultra"] .rm-chart-title-icon{filter:drop-shadow(0 0 7px color-mix(in srgb,var(--rm-analysis-tone,var(--accent)) 58%,transparent))!important}

/* Gráficos mais legíveis. */
[data-view="analysis"] .local-chart-svg .chart-grid text,[data-view="analysis"] .local-chart-svg .chart-axis-label,[data-view="analysis"] .local-chart-svg .chart-bar-label{font-size:15px!important;opacity:.84!important}[data-view="analysis"] .local-chart-svg .chart-bar-value{font-size:18px!important;font-weight:850!important;opacity:1!important}[data-analysis-item="chart-mood-distribution"] .chart-card-head h2{font-size:19px!important;white-space:nowrap!important;letter-spacing:-.02em!important}.rm-v27-mood-bars .rm-v27-mood-base-label{font-size:18px;font-weight:900}.rm-v27-mood-bars .chart-bar-value{font-size:19px!important;font-weight:900!important}.rm-v27-mood-bars .chart-bar-value.outside{fill:currentColor!important}.rm-v27-mood-bars .chart-zero{opacity:.45}

/* Continuidade: status positivo sem título técnico, com flat green translúcido. */
#continuityAnalysis .rm-continuity-status{padding:14px 16px!important;text-align:center!important;background:color-mix(in srgb,#30C878 15%,var(--surface-2))!important;border:1px solid color-mix(in srgb,#30C878 34%,var(--separator))!important;border-radius:16px!important}#continuityAnalysis .rm-continuity-status span{margin:0!important;color:color-mix(in srgb,#30C878 84%,var(--text) 16%)!important;font-size:14px!important;font-weight:780!important;line-height:1.4!important}#continuityAnalysis .rm-continuity-status:not(.positive){background:color-mix(in srgb,var(--accent) 8%,var(--surface-2))!important;border-color:color-mix(in srgb,var(--accent) 20%,var(--separator))!important}#continuityAnalysis .rm-continuity-status:not(.positive) span{color:var(--text)!important;font-weight:650!important}

@media(max-width:390px){.timeline-item.rm-v27-timeline{grid-template-columns:37px minmax(0,1fr) 22px!important;column-gap:7px!important}.timeline-type-icon{width:21px;height:21px}.timeline-type-icon .svg-icon,.timeline-type-icon svg{width:19px!important;height:19px!important}[data-analysis-item="chart-mood-distribution"] .chart-card-head h2{font-size:17px!important}}
`}

function rmV27Finalize(){rmV27EnsureStyles();rmV27EnhanceHistoryFilters();rmV27PolishAnalysis();rmV27HumanizeRoot(document.querySelector('[data-view="learning"]'));const top=document.getElementById('topVersion'),about=document.getElementById('versionLabel');if(top)top.textContent=`v${RM_V27_RELEASE}`;if(about)about.textContent=RM_V27_RELEASE}

rmV27Finalize();[120,650,1700,3200].forEach(ms=>setTimeout(rmV27Finalize,ms));
document.addEventListener('click',e=>{if(e.target.closest('[data-tab="history"]'))setTimeout(rmV27EnhanceHistoryFilters,30);if(e.target.closest('[data-tab="analysis"]'))setTimeout(rmV27PolishAnalysis,80)},true);
try{if(typeof rmInvalidate==='function')rmInvalidate()}catch{}
try{if(db&&typeof rmRenderActive==='function')rmRenderActive(null,{force:true}).catch(console.error)}catch{}
