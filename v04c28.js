/* 0.4.28 — cartões compactos, detalhes em grade e distribuição de humor legível. */
const RM_V28_RELEASE='0.4.28';

function rmV28TypeIcon(type){return type==='note'?'note':type==='medication'?'pill':type==='sleep'?'moon':'bag'}
function rmV28TypeClass(type){return type==='note'?'note':type==='medication'?'medication':type==='sleep'?'sleep':'purchase'}
function rmV28TypeLabel(e){if(e.type==='note')return e.audioOnly?'Anotação de voz':(!e.text&&e.moodScore!=null?'Check-in':'Anotação');if(e.type==='medication')return'Medicamento';if(e.type==='sleep')return'Sono';return'Compra'}
function rmV28Tone(type){return type==='note'?'var(--record-note,var(--accent))':type==='medication'?'var(--record-med,var(--med))':type==='sleep'?'var(--record-sleep,var(--sleep))':'var(--record-buy,var(--buy))'}
function rmV28Dose(e){if(typeof rmV27DoseLabel==='function')return rmV27DoseLabel(e);if(e?.totalDoseValue!=null)return`${Number(e.totalDoseValue).toLocaleString('pt-BR')} ${e.doseUnit||''}`.trim();return String(e?.dose||'').trim()}
function rmV28Money(v){if(typeof rmV27MoneyValue==='function')return rmV27MoneyValue(v);const n=parseMoney(v);return n==null?'':money(n)}
function rmV28Package(n){if(typeof rmV27PackageLabel==='function')return rmV27PackageLabel(n);n=Math.max(1,Number(n)||1);return`${n} ${n===1?'caixa':'caixas'}`}
function rmV28Units(n){if(typeof rmV27UnitsLabel==='function')return rmV27UnitsLabel(n);n=Number(n);return Number.isFinite(n)&&n>0?`${n} ${n===1?'unidade':'unidades'}`:''}

/* Histórico/Recentes: elimina a coluna lateral e o menu de três pontos. */
eventCard=function(e){
  const type=rmV28TypeClass(e.type),icon=rmV28TypeIcon(e.type),tone=rmV28Tone(e.type),label=rmV28TypeLabel(e);let body='',meta='';
  if(e.type==='note'){
    body=`<div class="timeline-title">${esc(e.text||'Check-in emocional')}</div>`;
    const badges=`${typeof rmV27MoodBadge==='function'?rmV27MoodBadge(e.moodScore):''}${typeof rmV27TagChip==='function'?rmV27TagChip(e.tag):''}${typeof rmV27AdvancedMeta==='function'?rmV27AdvancedMeta(e):''}`;
    if(badges)meta=`<div class="timeline-meta rm-meta-badges">${badges}</div>`;
  }else if(e.type==='medication'){
    const dose=rmV28Dose(e);body=`<div class="timeline-title rm-record-name">${esc(e.medication||'Medicamento')}</div>${dose?`<div class="rm-record-subline">${esc(dose)}</div>`:''}`;
    if(e.note)meta=`<div class="timeline-meta rm-record-note">${esc(e.note)}</div>`;
  }else if(e.type==='sleep'){
    body=`<div class="timeline-title rm-record-name">${esc(durationLabel(durationHours(e.startTime,e.endTime)))}</div>`;
    const bits=[e.quality?`Qualidade ${e.quality}/5`:null,e.source==='health-shortcut'?'Importado do Saúde':'Manual',e.note].filter(Boolean);if(bits.length)meta=`<div class="timeline-meta">${bits.map(esc).join(' · ')}</div>`;
  }else{
    const price=rmV28Money(e.price);body=`<div class="timeline-title rm-record-name">${esc(e.medication||'Medicamento')}</div>${price?`<div class="rm-record-subline rm-purchase-price">${esc(price)}</div>`:''}`;
    const bits=[e.packages?rmV28Package(e.packages):null,e.place].filter(Boolean);if(bits.length)meta=`<div class="timeline-meta">${bits.map(esc).join(' · ')}</div>`;
  }
  return`<article class="timeline-item rm-v28-timeline rm-type-${type}" style="--rm-record-tone:${tone}"><span data-menu="${esc(e.id)}" hidden></span><div class="rm-card-header"><div class="rm-card-header-main"><span class="timeline-type-icon">${svg(icon)}</span><div class="timeline-kind kind-${type}">${esc(label)}</div></div><time class="timeline-time">${esc(timeLabel(e.timestamp))}</time></div><div class="timeline-main">${body}${meta}${e.hasAudio?`<div data-audio="${esc(e.id)}"></div>`:''}</div></article>`
};

/* Detalhes compactos e em duas colunas quando faz sentido. */
function rmV28DetailCard(label,value,{wide=false,tone=false,html=false}={}){if(value===null||value===undefined||String(value).trim()==='')return'';return`<div class="rm-v28-detail-card${wide?' wide':''}${tone?' tone':''}">${label?`<small>${esc(label)}</small>`:''}${html?value:`<strong>${esc(String(value))}</strong>`}</div>`}
function rmV28DetailDate(value){return`<div class="rm-v28-detail-date">${esc(registroDetailDate(value))}</div>`}
function rmV28ViewerActions(id){
  const del=document.getElementById('viewerDeleteBtn'),edit=document.getElementById('viewerEditBtn');
  if(edit)edit.onclick=()=>openEventEditor(id);
  if(del)del.onclick=async()=>{if(!confirm('Excluir este registro?'))return;await deleteEvent(id);closeSheet();await renderAll();toast('Registro excluído.')};
}
function rmV28DetailButtons(){return`<div class="form-actions rm-v28-viewer-actions"><button type="button" class="secondary-button danger-row" id="viewerDeleteBtn">Excluir</button><button type="button" class="primary-button" id="viewerEditBtn">Editar</button></div>`}

openEventViewer=async function(id){
  const e=(await allEvents()).find(x=>x.id===id);if(!e)return;
  const meds=await allMedications(),m=meds.find(x=>x.id===e.medicationId)||findProfileByEvent(e,meds),p=findPresentation(m,e.presentationId),presentation=p?presentationDisplay(p):'',tone=rmV28Tone(e.type);let title='Registro',cards='';
  if(e.type==='purchase'){
    title='Compra';const price=rmV28Money(e.price)||e.price||'—';cards=[
      rmV28DetailCard('Medicamento',e.medication||'Medicamento',{tone:true}),rmV28DetailCard('Apresentação',presentation||'Não informada'),
      rmV28DetailCard('',rmV28Package(e.packages)),rmV28DetailCard('',rmV28Units(e.totalUnits)||'Unidades não informadas'),
      rmV28DetailCard('Valor pago',price,{tone:true}),rmV28DetailCard('Comprado em',e.place||'Não informado'),rmV28DetailDate(e.timestamp)
    ].join('');
  }else if(e.type==='medication'){
    title='Medicamento';const dose=rmV28Dose(e),qty=e.unitsTaken!=null?`${Number(e.unitsTaken).toLocaleString('pt-BR')} ${Number(e.unitsTaken)===1?'unidade':'unidades'}`:(e.quantity||'');cards=[
      rmV28DetailCard('Medicamento',e.medication||'Medicamento',{tone:true}),rmV28DetailCard('Apresentação',presentation||'Não informada'),
      rmV28DetailCard('Dose',dose||'Não informada',{tone:true}),rmV28DetailCard('Quantidade',qty||'Não informada'),
      rmV28DetailCard('Observação',e.note,{wide:true}),rmV28DetailDate(e.timestamp)
    ].join('');
  }else if(e.type==='sleep'){
    title='Sono';cards=[
      rmV28DetailCard('Dormiu às',registroDetailDate(e.startTime),{tone:true}),rmV28DetailCard('Acordou às',registroDetailDate(e.endTime),{tone:true}),
      rmV28DetailCard('Duração',durationLabel(durationHours(e.startTime,e.endTime))),rmV28DetailCard('Qualidade percebida',e.quality?`${e.quality} de 5`:''),
      rmV28DetailCard('Observações',e.note,{wide:true}),rmV28DetailCard('Origem',e.source==='health-shortcut'?'Importado do app Saúde':'Manual',{wide:true})
    ].join('');
  }else if(e.type==='note'){
    title=e.text?'Anotação':'Check-in emocional';const mood=e.moodScore!=null&&typeof rmV27MoodBadge==='function'?rmV27MoodBadge(e.moodScore):'',tag=e.tag&&typeof rmV27TagChip==='function'?rmV27TagChip(e.tag):'';
    if(mood)cards+=rmV28DetailCard('Humor',mood,{html:true,tone:true});if(tag)cards+=rmV28DetailCard('Tag',tag,{html:true});
    cards+=rmV28DetailCard('Anotação',e.text||'Anotação de voz',{wide:true});
    for(const [key,value] of Object.entries(e.emotionScores||{})){const label=e.emotionLabels?.[key]||((typeof emotionDimensions==='function'?emotionDimensions():[]).find(d=>d.id===key)?.label)||key;cards+=rmV28DetailCard(label,`${value} de 4`)}
    if(e.hasAudio)cards+=rmV28DetailCard('Áudio',`<span data-audio="${esc(e.id)}"></span>`,{wide:true,html:true});cards+=rmV28DetailDate(e.timestamp);
  }else return;
  openBackdrop(title,`<div class="rm-v28-detail-grid rm-detail-${rmV28TypeClass(e.type)}" style="--rm-detail-tone:${tone}">${cards}</div>${rmV28DetailButtons()}`,ev=>ev.preventDefault());rmV28ViewerActions(id);if(e.hasAudio)await hydrateAudio(document.getElementById('form'));
};

/* Distribuição do humor: números maiores e contraste adaptativo ao fundo. */
function rmV28Contrast(hex,fallback='#fff'){const m=String(hex||'').match(/^#([0-9a-f]{6})$/i);if(!m)return fallback;const n=parseInt(m[1],16),r=(n>>16)&255,g=(n>>8)&255,b=n&255,yiq=(r*299+g*587+b*114)/1000;return yiq>=155?'#111318':'#FFFFFF'}
rmMoodBarChart=function(rows){rows=rows.slice(0,6);if(!rows.length)return chartEmpty('Ainda não há dados suficientes.');const W=720,H=320,pad={l:22,r:18,t:34,b:70},iw=W-pad.l-pad.r,baseY=H-50,baseH=38,barBase=baseY-12,plotH=barBase-pad.t,max=Math.max(1,...rows.map(r=>Number(r.value)||0)),bw=Math.max(44,iw/rows.length*.58);return`<svg class="local-chart-svg rm-mood-bars rm-v28-mood-bars" viewBox="0 0 ${W} ${H}" role="img" aria-label="Distribuição do humor"><line class="chart-zero" x1="${pad.l}" y1="${barBase}" x2="${W-pad.r}" y2="${barBase}"/>${rows.map((r,i)=>{const c=rmMood(i),value=Number(r.value)||0,cx=pad.l+(i+.5)*iw/rows.length,h=value?Math.max(14,value/max*plotH):3,top=barBase-h,inside=value>0&&h>=52,countY=inside?top+31:Math.max(22,top-11),barFill=i===0?'#17171D':c.color,countFill=inside?rmV28Contrast(barFill,c.text):'var(--text)',baseText=rmV28Contrast(barFill,c.text);return`<rect class="rm-v28-mood-bar" x="${cx-bw/2}" y="${top}" width="${bw}" height="${h}" rx="12" fill="${barFill}" stroke="${i===0?'#7657FF':c.border}" stroke-width="2"><title>Nota ${i}: ${value} registro(s)</title></rect><text class="rm-v28-bar-value ${inside?'inside':'outside'}" x="${cx}" y="${countY}" text-anchor="middle" fill="${countFill}">${value}</text><rect class="rm-v28-mood-base" x="${cx-bw/2}" y="${baseY}" width="${bw}" height="${baseH}" rx="11" fill="${barFill}" stroke="${i===0?'#7657FF':c.border}" stroke-width="1.8"/><text class="rm-v28-base-label" x="${cx}" y="${baseY+26}" text-anchor="middle" fill="${baseText}">${i}</text>`}).join('')}</svg>`};

function rmV28Styles(){if(document.getElementById('rm-v28-style'))return;const st=document.createElement('style');st.id='rm-v28-style';st.textContent=`
/* Histórico e recentes */
.timeline-item.rm-v28-timeline{display:block!important;position:relative;padding:11px 12px 12px!important;border-radius:24px!important;min-width:0}
.rm-v28-timeline .rm-card-header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}
.rm-v28-timeline .rm-card-header-main{display:flex;align-items:center;gap:8px;min-width:0}
.rm-v28-timeline .timeline-type-icon{width:24px;height:24px;display:grid;place-items:center;flex:0 0 24px;color:var(--rm-record-tone)}
.rm-v28-timeline .timeline-type-icon svg{width:21px!important;height:21px!important}
.rm-v28-timeline .timeline-kind{margin:0!important;font-size:15.5px!important;line-height:1.1!important;font-weight:800!important;letter-spacing:0!important;text-transform:none!important;color:var(--rm-record-tone)!important}
.rm-v28-timeline .timeline-time{padding:0!important;font-size:14.5px!important;line-height:1.1!important;font-weight:760!important;color:var(--secondary)!important;white-space:nowrap}
.rm-v28-timeline .timeline-main{padding-left:32px;min-width:0}
.rm-v28-timeline .timeline-title{font-size:14.75px!important;line-height:1.35!important;font-weight:560!important;letter-spacing:-.008em}
.rm-v28-timeline .rm-record-name{font-size:15.25px!important;font-weight:720!important}
.rm-v28-timeline .rm-record-subline{margin-top:2px;font-size:13.5px;line-height:1.25;font-weight:700;color:var(--secondary)}
.rm-v28-timeline .rm-purchase-price{color:var(--record-buy,var(--buy))}
.rm-v28-timeline .timeline-meta{margin-top:5px!important;font-size:11.75px!important;line-height:1.35!important}
.rm-v28-timeline .item-menu{display:none!important}
.rm-v28-timeline .rm-meta-badges{display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin-top:8px!important}
.rm-v28-timeline .rm-mini-mood{width:31px!important;height:32px!important;min-width:31px!important;border-radius:10px!important;font-size:18px!important;font-weight:850!important;display:inline-grid!important;place-items:center!important;background:var(--rm-mini-mood)!important;color:var(--rm-mini-text)!important;border:1.6px solid var(--rm-mini-border)!important;box-shadow:0 0 10px var(--rm-mini-glow)!important}
.rm-v28-timeline .rm-note-tag{position:relative;display:inline-flex!important;align-items:center;height:24px!important;min-height:24px!important;padding:0 9px!important;margin-left:5px;border:1px solid color-mix(in srgb,var(--secondary) 72%,transparent)!important;border-radius:9px!important;background:transparent!important;color:var(--secondary)!important;font-size:11.5px!important;font-weight:700!important;clip-path:none!important}
.rm-v28-timeline .rm-note-tag:before{content:'';position:absolute;left:-5px;top:6px;width:9px;height:9px;background:var(--surface);border-left:1px solid color-mix(in srgb,var(--secondary) 72%,transparent);border-bottom:1px solid color-mix(in srgb,var(--secondary) 72%,transparent);transform:rotate(45deg);border-bottom-left-radius:2px}
html[data-theme="dark"] .rm-v28-timeline .rm-note-tag:before{background:color-mix(in srgb,var(--surface) 95%,black 5%)}
@media(prefers-color-scheme:dark){html[data-theme="system"] .rm-v28-timeline .rm-note-tag:before{background:color-mix(in srgb,var(--surface) 95%,black 5%)}}

/* Arredondamento consistente nos cartões compactos desta família. */
.timeline-item,.analysis-row,.metric,.rm-insight-row,.registry-card,.med-suggestion-card,.continuity-alert-row{border-radius:22px!important}

/* Detalhes */
.rm-v28-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px}
.rm-v28-detail-card{min-width:0;padding:11px 12px;border-radius:22px;background:color-mix(in srgb,var(--surface-2) 92%,var(--rm-detail-tone) 8%);border:1px solid color-mix(in srgb,var(--separator) 82%,var(--rm-detail-tone) 18%)}
.rm-v28-detail-card.wide,.rm-v28-detail-date{grid-column:1/-1}
.rm-v28-detail-card small{display:block;margin:0 0 2px;color:var(--secondary);font-size:10.75px;line-height:1.15;font-weight:720}
.rm-v28-detail-card strong{display:block;color:var(--text);font-size:14.5px;line-height:1.25;font-weight:760;overflow-wrap:anywhere}
.rm-v28-detail-card.tone strong{color:var(--rm-detail-tone)}
.rm-v28-detail-card .rm-mini-mood{width:32px;height:33px;display:inline-grid;place-items:center;border-radius:10px;background:var(--rm-mini-mood);color:var(--rm-mini-text);border:1.5px solid var(--rm-mini-border);font-size:18px;font-weight:850}
.rm-v28-detail-card .rm-note-tag{display:inline-flex;align-items:center;height:24px;padding:0 9px;border:1px solid var(--separator);border-radius:9px;background:transparent;color:var(--secondary);font-size:11.5px;font-weight:700}
.rm-v28-detail-date{text-align:center;color:var(--secondary);font-size:12.5px;font-weight:650;padding:5px 2px 2px}
.rm-v28-viewer-actions{grid-template-columns:1fr 1.35fr!important;gap:9px!important;margin-top:13px!important}
.rm-v28-viewer-actions #viewerDeleteBtn{color:var(--danger)!important;border-color:color-mix(in srgb,var(--danger) 32%,var(--separator))!important;background:color-mix(in srgb,var(--danger) 6%,var(--surface))!important}
.sheet:has(.rm-v28-detail-grid) .sheet-header{margin-bottom:2px!important}
.sheet:has(.rm-v28-detail-grid){padding-left:14px!important;padding-right:14px!important}

/* Gráfico */
.rm-v28-mood-bars .rm-v28-bar-value{font-size:18px!important;font-weight:850!important;opacity:1!important}
.rm-v28-mood-bars .rm-v28-base-label{font-size:17px!important;font-weight:850!important;opacity:1!important}
.rm-v28-mood-bars text.outside{paint-order:stroke;stroke:color-mix(in srgb,var(--surface) 82%,transparent);stroke-width:2px;stroke-linejoin:round}

@media(max-width:390px){
  .rm-v28-timeline .timeline-main{padding-left:29px}
  .rm-v28-timeline .timeline-kind{font-size:15px!important}
  .rm-v28-timeline .timeline-time{font-size:14px!important}
  .rm-v28-detail-card{padding:10px 10px}
  .rm-v28-detail-card strong{font-size:13.75px}
}
`;document.head.appendChild(st)}

function rmV28Finalize(){rmV28Styles();const top=document.getElementById('topVersion'),about=document.getElementById('versionLabel');if(top)top.textContent=`v${RM_V28_RELEASE}`;if(about)about.textContent=RM_V28_RELEASE;if(typeof rmInvalidate==='function')rmInvalidate('home','history','analysis');try{rmV27EnhanceHistoryFilters?.()}catch{}}
rmV28Finalize();


/* Carrega o refinamento visual seguinte após esta revisão. */
(function rmV28LoadV29(){
  if(document.querySelector('script[data-engine-key="v29-learning-buttons"]'))return;
  const s=document.createElement('script');
  s.dataset.engineKey='v29-learning-buttons';
  s.src='./v04c29.js?v=0.4.29';
  s.onload=()=>{try{rmV29Finalize?.()}catch{}};
  s.onerror=()=>console.error('Falha ao carregar revisão 0.4.29');
  document.head.appendChild(s);
})();
