const RICH_DEMO_KEY='registro-rich-demo-v041';
const RICH_DEMO_VERSION='1';

function demoDate(daysAgo,h,m){const d=new Date();d.setDate(d.getDate()-daysAgo);d.setHours(h,m,0,0);return d.toISOString()}
function demoMedicationProfiles(){return[
 {id:'demo-profile-lisdex',activeIngredient:'Lisdexanfetamina',referenceName:'Venvanse',lab:'Laboratório fictício A',aliases:['lisdex','venvanse'],demo:true,createdAt:demoDate(45,10,0),presentations:[
   {id:'demo-pres-lisdex-30',strengthValue:30,strengthUnit:'mg',form:'cápsula',unitsPerPackage:28,unitsPerBlister:7,brand:'Venvanse',lab:'Laboratório fictício A'},
   {id:'demo-pres-lisdex-70',strengthValue:70,strengthUnit:'mg',form:'cápsula',unitsPerPackage:28,unitsPerBlister:7,brand:'Venvanse',lab:'Laboratório fictício A'}
 ],notes:[
   {id:'demo-mednote-lisdex-1',timestamp:demoDate(6,17,10),text:'Em alguns dias percebi boca seca algumas horas depois da administração. Quero comentar isso na próxima consulta.',source:'manual'},
   {id:'demo-mednote-lisdex-2',timestamp:demoDate(3,16,20),text:'Em dias em que uso, tenho percebido mais facilidade para iniciar tarefas; ainda quero observar se o padrão se repete.',source:'manual'}
 ]},
 {id:'demo-profile-parox',activeIngredient:'Paroxetina',referenceName:'',lab:'Laboratório fictício B',aliases:['parox'],demo:true,createdAt:demoDate(50,11,0),presentations:[
   {id:'demo-pres-parox-20',strengthValue:20,strengthUnit:'mg',form:'comprimido',unitsPerPackage:30,unitsPerBlister:10,brand:'Genérico de exemplo',lab:'Laboratório fictício B'}
 ],notes:[{id:'demo-mednote-parox-1',timestamp:demoDate(8,14,0),text:'Observar náusea leve e horário em que aparece para relatar ao médico.',source:'manual'}]},
 {id:'demo-profile-bup',activeIngredient:'Bupropiona',referenceName:'',lab:'Laboratório fictício C',aliases:['bup'],demo:true,createdAt:demoDate(60,9,0),presentations:[
   {id:'demo-pres-bup-150',strengthValue:150,strengthUnit:'mg',form:'comprimido',unitsPerPackage:30,unitsPerBlister:10,brand:'Genérico de exemplo',lab:'Laboratório fictício C'}
 ],notes:[]},
 {id:'demo-profile-lamo',activeIngredient:'Lamotrigina',referenceName:'',lab:'Laboratório fictício D',aliases:['lamo'],demo:true,createdAt:demoDate(60,9,20),presentations:[
   {id:'demo-pres-lamo-100',strengthValue:100,strengthUnit:'mg',form:'comprimido',unitsPerPackage:30,unitsPerBlister:10,brand:'Genérico de exemplo',lab:'Laboratório fictício D'}
 ],notes:[]}
]}

function richDemoEvents(){const e=[];
 const med=(id,days,h,m,profile,pres,name,doseValue,unit='mg',units=1,note='')=>e.push({id,type:'medication',timestamp:demoDate(days,h,m),medication:name,medicationId:profile,presentationId:pres,doseMode:'perUnit',unitDoseValue:doseValue,totalDoseValue:doseValue*units,doseUnit:unit,unitsTaken:units,dose:`${doseValue*units} ${unit}`,quantity:units===1?'1 unidade':`${units} unidades`,note,demo:true});
 const note=(id,days,h,m,text,tag='')=>e.push({id,type:'note',timestamp:demoDate(days,h,m),text,tag,demo:true});
 const buy=(id,days,h,m,profile,pres,name,packages,totalUnits,price,place)=>e.push({id,type:'purchase',timestamp:demoDate(days,h,m),medication:name,medicationId:profile,presentationId:pres,packages,totalUnits,unitsPerPackage:totalUnits/packages,price,place,demo:true});
 const sleep=(id,startDays,sh,sm,endDays,eh,em,quality,text)=>e.push({id,type:'sleep',timestamp:demoDate(endDays,eh,em),startTime:demoDate(startDays,sh,sm),endTime:demoDate(endDays,eh,em),quality,note:text,source:'manual',demo:true});

 // Sono irregular em vários dias, incluindo um registro no dia atual.
 sleep('demo-rich-sleep-0',1,18,40,0,1,35,2,'Sono fragmentado. Acordei duas vezes e levantei ainda cansado.');
 sleep('demo-rich-sleep-1',2,6,10,2,13,5,3,'Demorei para dormir, mas depois o sono ficou mais contínuo.');
 sleep('demo-rich-sleep-2',4,23,50,3,7,25,5,'Dormi melhor e acordei com sensação de descanso.');
 sleep('demo-rich-sleep-3',5,1,20,5,9,10,4,'Acordei uma vez, voltei a dormir rápido.');
 sleep('demo-rich-sleep-4',7,4,45,7,11,0,2,'Poucas horas de sono e bastante sonolência ao acordar.');
 sleep('demo-rich-sleep-5',9,2,30,9,10,40,4,'Sono relativamente contínuo.');

 // Compras com apresentações e preços diferentes.
 buy('demo-rich-buy-lisdex70-a',12,17,20,'demo-profile-lisdex','demo-pres-lisdex-70','Lisdexanfetamina 70 mg',1,28,'R$ 365,90','Farmácia de exemplo Centro');
 buy('demo-rich-buy-lisdex30-a',38,15,10,'demo-profile-lisdex','demo-pres-lisdex-30','Lisdexanfetamina 30 mg',1,28,'R$ 298,00','Farmácia de exemplo Norte');
 buy('demo-rich-buy-parox-a',20,16,50,'demo-profile-parox','demo-pres-parox-20','Paroxetina 20 mg',1,30,'R$ 42,90','Farmácia de exemplo Centro');
 buy('demo-rich-buy-parox-b',52,12,20,'demo-profile-parox','demo-pres-parox-20','Paroxetina 20 mg',1,30,'R$ 49,50','Farmácia de exemplo Bairro');
 buy('demo-rich-buy-bup-a',31,11,40,'demo-profile-bup','demo-pres-bup-150','Bupropiona 150 mg',1,30,'R$ 76,80','Farmácia de exemplo Online');
 buy('demo-rich-buy-lamo-a',27,18,5,'demo-profile-lamo','demo-pres-lamo-100','Lamotrigina 100 mg',1,30,'R$ 35,40','Farmácia de exemplo Centro');

 // Administrações recentes e eventuais.
 med('demo-rich-med-parox-0',0,1,50,'demo-profile-parox','demo-pres-parox-20','Paroxetina',20);
 med('demo-rich-med-lamo-0',0,0,45,'demo-profile-lamo','demo-pres-lamo-100','Lamotrigina',100);
 med('demo-rich-med-lisdex-0',0,2,5,'demo-profile-lisdex','demo-pres-lisdex-70','Lisdexanfetamina',70);
 note('demo-rich-note-0',0,2,20,'Senti leve dor de cabeça e um pouco de náusea.','dor de cabeça');
 note('demo-rich-note-1',0,2,45,'Estou mais desperto agora, mas percebi boca seca.','atenção');

 med('demo-rich-med-bup-1',1,13,40,'demo-profile-bup','demo-pres-bup-150','Bupropiona',150);
 med('demo-rich-med-parox-1',1,14,5,'demo-profile-parox','demo-pres-parox-20','Paroxetina',20);
 note('demo-rich-note-2',1,15,5,'Consegui começar uma tarefa que estava adiando. Estou um pouco mais concentrado.','foco');
 note('demo-rich-note-3',1,18,10,'No fim da tarde fiquei mais ansioso e inquieto.','ansiedade');

 med('demo-rich-med-lisdex-2',2,13,30,'demo-profile-lisdex','demo-pres-lisdex-70','Lisdexanfetamina',70);
 med('demo-rich-med-parox-2',2,13,50,'demo-profile-parox','demo-pres-parox-20','Paroxetina',20);
 note('demo-rich-note-4',2,14,0,'Comecei a sentir dor de cabeça leve.','dor de cabeça');
 note('demo-rich-note-5',2,16,0,'Estou conseguindo manter o foco melhor do que ontem.','foco');

 med('demo-rich-med-lamo-3',3,8,0,'demo-profile-lamo','demo-pres-lamo-100','Lamotrigina',100);
 med('demo-rich-med-parox-3',3,8,10,'demo-profile-parox','demo-pres-parox-20','Paroxetina',20);
 note('demo-rich-note-6',3,11,30,'Hoje acordei mais calmo e com menos irritação.','calma');

 med('demo-rich-med-lisdex-4',4,10,20,'demo-profile-lisdex','demo-pres-lisdex-70','Lisdexanfetamina',70);
 med('demo-rich-med-bup-4',4,10,45,'demo-profile-bup','demo-pres-bup-150','Bupropiona',150);
 med('demo-rich-med-parox-4',4,11,5,'demo-profile-parox','demo-pres-parox-20','Paroxetina',20);
 note('demo-rich-note-7',4,12,15,'Percebi boca seca e pouca fome.','observação');
 note('demo-rich-note-8',4,16,40,'Fiquei bastante produtivo durante algumas horas.','foco');

 med('demo-rich-med-parox-5',5,9,30,'demo-profile-parox','demo-pres-parox-20','Paroxetina',20);
 med('demo-rich-med-lamo-5',5,9,35,'demo-profile-lamo','demo-pres-lamo-100','Lamotrigina',100);
 note('demo-rich-note-9',5,13,10,'Humor estável hoje, sem nenhuma mudança muito marcante.','estável');

 med('demo-rich-med-lisdex-6',6,12,40,'demo-profile-lisdex','demo-pres-lisdex-70','Lisdexanfetamina',70);
 med('demo-rich-med-parox-6',6,13,0,'demo-profile-parox','demo-pres-parox-20','Paroxetina',20);
 note('demo-rich-note-10',6,13,25,'Senti o coração um pouco acelerado e fiquei observando.','observação');
 note('demo-rich-note-11',6,17,0,'A sensação passou. Estou mais tranquilo.','calma');

 med('demo-rich-med-bup-7',7,11,25,'demo-profile-bup','demo-pres-bup-150','Bupropiona',150);
 med('demo-rich-med-parox-7',7,11,35,'demo-profile-parox','demo-pres-parox-20','Paroxetina',20);
 note('demo-rich-note-12',7,14,10,'Muito sonolento hoje, provavelmente porque dormi pouco.','sonolência');

 med('demo-rich-med-lisdex-8',8,13,10,'demo-profile-lisdex','demo-pres-lisdex-70','Lisdexanfetamina',70);
 med('demo-rich-med-parox-8',8,13,30,'demo-profile-parox','demo-pres-parox-20','Paroxetina',20);
 note('demo-rich-note-13',8,15,20,'Boa concentração, mas pouca vontade de comer.','foco');

 med('demo-rich-med-parox-9',9,11,0,'demo-profile-parox','demo-pres-parox-20','Paroxetina',20);
 med('demo-rich-med-lamo-9',9,11,5,'demo-profile-lamo','demo-pres-lamo-100','Lamotrigina',100);
 note('demo-rich-note-14',9,14,45,'Hoje me senti bem e mais disposto depois de dormir melhor.','bem');

 med('demo-rich-med-lisdex-10',10,14,20,'demo-profile-lisdex','demo-pres-lisdex-70','Lisdexanfetamina',70);
 med('demo-rich-med-parox-10',10,14,35,'demo-profile-parox','demo-pres-parox-20','Paroxetina',20);
 note('demo-rich-note-15',10,15,10,'Leve tensão na cabeça, quero observar se isso se repete.','dor de cabeça');

 med('demo-rich-med-lisdex-11',11,15,0,'demo-profile-lisdex','demo-pres-lisdex-70','Lisdexanfetamina',70);
 med('demo-rich-med-parox-11',11,15,20,'demo-profile-parox','demo-pres-parox-20','Paroxetina',20);
 note('demo-rich-note-16',11,18,0,'Consegui trabalhar por bastante tempo sem me distrair tanto.','foco');

 // Administração antiga da apresentação de 30 mg para comparar apresentação/preço.
 [30,32,34,36].forEach((days,i)=>med(`demo-rich-med-lisdex30-${i}`,days,14+i*20%60,10,'demo-profile-lisdex','demo-pres-lisdex-30','Lisdexanfetamina',30));
 note('demo-rich-note-old-1',30,15,5,'Dia relativamente produtivo, sem dor de cabeça.','foco');
 return e.sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp))
}

async function installRichDemo({replace=false}={}){if(replace){await req(store(EVENTS,'readwrite').clear());await req(store(AUDIO,'readwrite').clear());await req(store(MEDICATIONS,'readwrite').clear())}
 const profiles=demoMedicationProfiles(),existingProfiles=new Set((await allMedications()).map(m=>m.id));for(const m of profiles)if(!existingProfiles.has(m.id))await putMedication(m);
 const events=richDemoEvents(),existingEvents=new Set((await allEvents()).map(x=>x.id));for(const item of events)if(!existingEvents.has(item.id))await putEvent(item);
 localStorage.setItem('registro-demo-seeded','yes');localStorage.setItem(RICH_DEMO_KEY,RICH_DEMO_VERSION);return{events:events.length,medications:profiles.length}}

async function ensureRichDemoData(){if(localStorage.getItem(RICH_DEMO_KEY)===RICH_DEMO_VERSION)return;await installRichDemo({replace:false})}

restoreDemo=async function(){if(!confirm('Substituir todos os registros e cadastros pelos dados fictícios ampliados?'))return;await installRichDemo({replace:true});await renderAll();toast('Dados fictícios ampliados restaurados.')};