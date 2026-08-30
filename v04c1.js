const APP_VERSION='0.4.1';
const DB_NAME='registro-mental-v1';
const EVENTS='events';
const AUDIO='audio';
const MEDICATIONS='medications';
const SETTINGS_KEY='registro-settings-v2';
const LAST_BACKUP_KEY='registro-last-backup';
const LAST_HEALTH_IMPORT_KEY='registro-last-health-import';
const BACKUP_WARN_DAYS=7;

let db=null,currentType=null,mediaRecorder=null,audioChunks=[],pendingAudio=null,pendingSleepSource='manual',historyFilter='all',selectedMedicationId=null,selectedPresentationId=null,iconEditorTarget=null;

const baseIcons={
 home:'<path d="M3 11.5 12 4l9 7.5"></path><path d="M5.5 10.5V20h13v-9.5"></path><path d="M9.5 20v-6h5v6"></path>',
 history:'<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"></path><path d="M3.5 5v5h5"></path><path d="M12 7.5V12l3 2"></path>',
 chart:'<path d="M4 19V10"></path><path d="M10 19V5"></path><path d="M16 19v-7"></path><path d="M22 19V8"></path>',
 settings:'<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 3.8 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2V9.6h.1A1.7 1.7 0 0 0 3.2 9a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.26 3.2l.06.06A1.7 1.7 0 0 0 8.2 3.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2h4v.1a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8c.1.4.3.75.6 1 .3.25.7.4 1.1.4h.1v4h-.1c-.4 0-.8.15-1.1.4-.3.25-.5.6-.6 1.2Z"></path>',
 note:'<path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"></path><path d="m13.5 6.5 4 4"></path>',
 pill:'<path d="M8 18.5 18.5 8a4.24 4.24 0 0 0-6-6L2 12.5a4.24 4.24 0 1 0 6 6Z"></path><path d="m8.5 6.5 9 9"></path>',
 moon:'<path d="M20 15.3A8 8 0 0 1 8.7 4 8.5 8.5 0 1 0 20 15.3Z"></path>',
 bag:'<path d="M5.5 8h13l-1 12h-11l-1-12Z"></path><path d="M9 8V6a3 3 0 0 1 6 0v2"></path>',
 spark:'<path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"></path><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"></path>',
 link:'<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"></path><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"></path>',
 heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"></path>',
 export:'<path d="M12 3v12"></path><path d="m7 8 5-5 5 5"></path><path d="M5 13v7h14v-7"></path>',
 import:'<path d="M12 15V3"></path><path d="m7 10 5 5 5-5"></path><path d="M5 13v7h14v-7"></path>',
 plus:'<path d="M12 5v14M5 12h14"></path>',
 edit:'<path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"></path>',
 clock:'<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>'
};

const defaultSettings={theme:'system',accent:'violet',iconSize:'medium',iconWeight:'regular',showVersion:true,healthImportMode:'review',fontFamily:'system',fontWeight:'400',hideTabLabels:false,iconOverrides:{}};

function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]))}
function uid(p){return `${p}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}
function localDate(date){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}
function toLocalInput(iso=new Date().toISOString()){const d=new Date(iso),off=d.getTimezoneOffset()*60000;return new Date(d.getTime()-off).toISOString().slice(0,16)}
function timeLabel(i){return new Date(i).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
function dayLabel(s){const d=new Date(`${s}T12:00:00`),t=localDate(new Date()),y=new Date();y.setDate(y.getDate()-1);if(s===t)return'Hoje';if(s===localDate(y))return'Ontem';return d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'short'})}
function eventDay(e){return localDate(new Date(e.timestamp))}
function durationHours(a,b){return Math.max(0,(new Date(b)-new Date(a))/3600000)}
function durationLabel(x){if(!Number.isFinite(x))return'—';const h=Math.floor(x),m=Math.round((x-h)*60);return`${h}h${m?` ${m}min`:''}`}
function humanAgo(i){const min=Math.max(0,Math.floor((Date.now()-new Date(i))/60000));if(min<1)return'agora';if(min<60)return`há ${min} min`;const h=Math.floor(min/60);if(h<24)return`há ${h}h`;return`há ${Math.floor(h/24)}d`}
function parseMoney(v=''){const n=Number(String(v).replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.'));return Number.isFinite(n)?n:null}
function money(n){return n==null||!Number.isFinite(n)?'—':n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function normalizeText(v=''){return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function levenshtein(a,b){a=normalizeText(a);b=normalizeText(b);const m=a.length,n=b.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0));for(let i=0;i<=m;i++)dp[i][0]=i;for(let j=0;j<=n;j++)dp[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return dp[m][n]}
function parseStrength(text=''){const m=String(text).match(/([0-9]+(?:[.,][0-9]+)?)\s*(mg|mcg|µg|g|ml|mL)/i);return m?{value:Number(m[1].replace(',','.')),unit:m[2].replace('µ','m').toLowerCase()==='ml'?'mL':m[2].replace('µ','m')}:null}
function currentMinutes(){const d=new Date();return d.getHours()*60+d.getMinutes()}
function minuteDistance(a,b){const d=Math.abs(a-b)%1440;return Math.min(d,1440-d)}
function qualityColorClass(q){return `q${Math.max(1,Math.min(5,Number(q)||3))}`}

function getSettings(){try{return{...defaultSettings,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{return{...defaultSettings}}}
function saveSettings(s){localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));applySettings()}
function setSetting(k,v){const s=getSettings();s[k]=v;saveSettings(s)}
function sanitizeSvgMarkup(markup=''){let s=String(markup).trim();s=s.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi,'').replace(/\son\w+\s*=\s*(['"]).*?\1/gi,'').replace(/\s(?:href|xlink:href)\s*=\s*(['"])(?:https?:|data:|javascript:).*?\1/gi,'');const svgMatch=s.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);return svgMatch?svgMatch[1]:s}
function svg(name){const s=getSettings(),override=s.iconOverrides?.[name];let body=baseIcons[name]||baseIcons.note;if(override?.type==='svg'&&override.value)body=sanitizeSvgMarkup(override.value);else if(override?.type==='bank'&&baseIcons[override.value])body=baseIcons[override.value];return `<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`}
function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=svg(el.dataset.icon)})}
function updateSegmentIndicator(group,selector,value){if(!group)return;const buttons=[...group.querySelectorAll('button')],idx=Math.max(0,buttons.findIndex(b=>b.dataset[selector]===String(value)));group.style.setProperty('--segment-count',String(buttons.length));group.style.setProperty('--segment-index',String(idx));buttons.forEach((b,i)=>b.classList.toggle('selected',i===idx))}
function updateTabBubble(){const tabs=[...document.querySelectorAll('.tab-item')],idx=Math.max(0,tabs.findIndex(t=>t.classList.contains('selected')));document.querySelector('.tab-bar')?.style.setProperty('--tab-index',String(idx))}