'use strict';
(() => {
const KEY='opora-diary-v1'; // Сохраняем прежний ключ: записи версии 1 не потеряются.
const CATEGORIES={sleep:'Сон',energy:'Энергия',work:'Работа',money:'Финансы',feelings:'Эмоции',other:'Другое'};
const HINTS={sleep:'Выдели 10–15 минут вечером, чтобы записать беспокоящие мысли. Не заставляй себя засыпать по часам.',energy:'Выбери самое простое дело на 5–10 минут. Если можешь, выйди к дневному свету.',work:'Один измеримый шаг на 15 минут: открыть резюме, найти вакансию или написать отклик.',money:'Запиши один обязательный расход и один следующий шаг. Не пытайся решить всё за вечер.',feelings:'Назови, что чувствуешь. Запиши мысль и один небольшой способ поддержать себя.',other:'Сформулируй самый маленький следующий шаг продолжительностью до 10 минут.'};
const BASE_PLAN=[{id:'wake',tag:'Утро',title:'Подъём около 08:00',note:'Без оценки всего дня по первым минутам'},{id:'light',tag:'Утро',title:'10–15 минут на улице',note:'Дневной свет и спокойная прогулка'},{id:'useful',tag:'День',title:'Одно полезное дело на 10–15 минут',note:'Работа, финансы или быт'},{id:'worries',tag:'19:00',title:'Записать тревоги и маленькие шаги',note:'Не решать всё сегодня'},{id:'calm',tag:'Вечер',title:'Сделать вечер спокойнее',note:'Не заставлять себя уснуть по расписанию'}];
const $=(s,r=document)=>r.querySelector(s),app=$('#app');
const iso=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const addDays=(date,n)=>{const [y,m,d]=date.split('-').map(Number);return iso(new Date(y,m-1,d+n));};
const niceDate=date=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(new Date(date+'T12:00:00'));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>(x===''||x===null||x===undefined||!Number.isFinite(Number(x)))?null:Number(x);
const mean=arr=>{const values=arr.map(num).filter(x=>x!==null);return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;};
const fmt=x=>x===null?'—':x.toFixed(1).replace('.',',');
const createState=()=>({version:1,createdAt:new Date().toISOString(),planTitle:'Бережный старт',plan:BASE_PLAN.map(t=>({...t})),entries:{},problems:[]});
let state,storageOk=true;try{let data=localStorage.getItem(KEY);state=data?JSON.parse(data):createState();if(!state||!Array.isArray(state.plan)||!state.entries||!Array.isArray(state.problems))state=createState();}catch(e){state=createState();storageOk=false;}
let today=iso();let tab='today',selectedDate=today,toastTimeout;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageOk=true;}catch(e){storageOk=false;}}
function entry(date=today){if(!state.entries[date]){state.entries[date]={bed:'',sleep:'',wake:'',quality:'',energyAm:'',energyPm:'',mood:'',stress:'',worries:'',smallStep:'',work:'',gratitude:'',notes:'',taskItems:state.plan.map(t=>({...t})),done:{}};save();}let e=state.entries[date];if(!Array.isArray(e.taskItems))e.taskItems=state.plan.map(t=>({...t}));if(!e.done)e.done={};if(!Array.isArray(e.events))e.events=[];if(!Array.isArray(e.meals))e.meals=[];if(!Array.isArray(e.workouts))e.workouts=[];if(!Array.isArray(e.pulse))e.pulse=[];if(!e.watch||typeof e.watch!=='object')e.watch={};return e;}
function duration(e){if(!/^\d\d:\d\d$/.test(e.sleep||'')||!/^\d\d:\d\d$/.test(e.wake||''))return null;const toMinutes=s=>{let [h,m]=s.split(':').map(Number);return h*60+m;};let delta=toMinutes(e.wake)-toMinutes(e.sleep);if(delta<=0)delta+=1440;return delta>0&&delta<=1080?delta/60:null;}
function sleepText(h){if(h===null)return '—';let minutes=Math.round(h*60);return `${Math.floor(minutes/60)} ч ${String(minutes%60).padStart(2,'0')} м`;}
const done=e=>(e.taskItems||[]).filter(t=>e.done[t.id]).length;
function metric(label,value){return `<div class="stat"><span class="label">${esc(label)}</span><strong>${esc(value)}</strong></div>`;}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('visible'),2200);}
function render(){if(iso()!==today){const was=today;today=iso();if(selectedDate===was)selectedDate=today;}document.querySelectorAll('[data-tab]').forEach(b=>{let on=b.dataset.tab===tab;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'page':'false');});app.innerHTML=(!storageOk?'<div class="notice warn">Браузер блокирует постоянное сохранение. Экспортируй данные через «Обмен».</div>':'')+({today:renderToday,day:renderDay,health:renderHealth,diary:renderDiary,progress:renderProgress,exchange:renderExchange}[tab]||renderToday)();}
function go(to){tab=to;render();scrollTo({top:0,behavior:'instant'});}
function renderToday(){const e=entry(),open=state.problems.filter(p=>!p.resolved).slice(-3).reverse();const percentage=e.taskItems.length?100*done(e)/e.taskItems.length:0;
return `<section class="hero"><div class="eyebrow">${esc(niceDate(today))}</div><h1>Не весь день сразу.<br>Только следующий шаг.</h1><p>Наша цель — не идеальная продуктивность, а устойчивое возвращение энергии и действий.</p><span class="chip">План: ${esc(state.planTitle)}</span></section>
<div class="section-title"><h2>Сегодняшний ритм</h2><small>${done(e)} из ${e.taskItems.length} шагов</small></div><article class="card"><div class="progress-track"><div class="progress-fill" style="width:${percentage}%"></div></div>
${e.taskItems.map(t=>`<label class="task ${e.done[t.id]?'done':''}"><input type="checkbox" data-task="${esc(t.id)}" ${e.done[t.id]?'checked':''}><span><b>${esc(t.title)}</b><em>${esc(t.tag)}${t.note?' · '+esc(t.note):''}</em></span></label>`).join('')}
<div class="btnrow"><button type="button" data-go="day" class="btn secondary">Заполнить дневник →</button></div></article>
<div class="section-title"><h2>Записи дня</h2></div>
<div class="card"><div class="grid2">${metric('Приёмов пищи',e.meals.length)}${metric('Упражнений',e.workouts.length)}${metric('Шагов с часов',showNum(e.watch.steps))}${metric('Событий',e.events.length)}</div>
<div class="btnrow"><button type="button" class="btn secondary" data-go="day">+ Описать день</button><button type="button" class="btn secondary" data-go="health">+ Еда, тренировка, часы</button></div></div>
<div class="section-title"><h2>Самочувствие</h2><small>из дневника</small></div><div class="grid2">${metric('Энергия утром',e.energyAm===''?'—':e.energyAm+'/10')}${metric('Энергия вечером',e.energyPm===''?'—':e.energyPm+'/10')}${metric('Ночной сон',sleepText(duration(e)))}${metric('Настроение',e.mood===''?'—':e.mood+'/10')}</div>
<div class="section-title"><h2>Что беспокоит</h2><small>${state.problems.filter(p=>!p.resolved).length} открыто</small></div><article class="card">${open.length?open.map(p=>`<div class="problem"><strong>${esc(p.title)}</strong><div class="suggestion">Маленький шаг: ${esc(p.nextStep||p.suggestion)}</div></div>`).join(''):'<p>Пока нет записанных проблем. Их можно добавлять без необходимости сразу искать решение.</p>'}<button type="button" data-go="day" data-scroll="problem-section" class="btn ghost">Добавить проблему</button></article>
<div class="notice">Месяцы апатии, усталости и нарушенного сна — повод обсудить состояние с врачом. Самоконтроль не заменяет помощь специалиста.</div>`;}
function fieldText(label,key,value,hint=''){return `<label class="field"><span class="field-label">${esc(label)}</span><textarea data-field="${esc(key)}" rows="3" placeholder="${esc(hint)}">${esc(value||'')}</textarea></label>`;}
function fieldTime(label,key,value){return `<label class="field"><span class="field-label">${esc(label)}</span><input type="time" data-field="${esc(key)}" value="${esc(value||'')}"></label>`;}
function rangeField(label,key,value,description=''){return `<label class="field"><span class="range-row"><span class="field-label">${esc(label)}</span><output id="out-${key}">${value===''?'Не отмечено':value+'/10'}</output></span><input type="range" min="0" max="10" step="1" data-field="${key}" value="${value===''?5:Math.max(0,Math.min(10,Number(value)))}">${description?`<span class="hint">${esc(description)}</span>`:''}</label>`;}
function renderDiary(){const e=entry(selectedDate),problems=state.problems.slice().reverse();return `<div class="eyebrow">Твои записи</div><h1 class="logtitle">Дневник</h1><p class="muted">Сохраняется автоматически на этом устройстве. Ничего не отправляется в интернет.</p>
<label class="field"><span class="field-label">Дата</span><input class="date-input" type="date" id="diary-date" max="${today}" value="${selectedDate}"></label>
<div class="card"><h2>🌙 Сон</h2><p>Сон за ночь, закончившуюся утром выбранной даты.</p><div class="grid2">${fieldTime('Лёг в кровать','bed',e.bed)}${fieldTime('Уснул примерно','sleep',e.sleep)}${fieldTime('Проснулся','wake',e.wake)}<div class="field"><span class="field-label">Сон (приблизительно)</span><div class="big-label" id="sleep-total">${sleepText(duration(e))}</div><div class="hint">Без учёта ночных пробуждений</div></div></div>
<label class="field"><span class="field-label">Качество сна</span><select data-field="quality"><option value="">Не отмечено</option>${[[1,'1 — очень плохое'],[2,'2 — плохое'],[3,'3 — среднее'],[4,'4 — хорошее'],[5,'5 — отличное']].map(([v,t])=>`<option value="${v}" ${String(e.quality)===String(v)?'selected':''}>${t}</option>`).join('')}</select></label></div>
<div class="card"><h2>☀️ Состояние</h2>${rangeField('Энергия утром','energyAm',e.energyAm,'0 — совсем нет сил, 10 — полон энергии')}${rangeField('Энергия вечером','energyPm',e.energyPm)}${rangeField('Настроение','mood',e.mood,'0 — очень плохое, 10 — очень хорошее')}${rangeField('Напряжение / тревога','stress',e.stress,'0 — спокойно, 10 — сильнейшее напряжение')}</div>
<div class="card"><h2>✍️ Мысли и действия</h2>${fieldText('Что беспокоит сегодня?','worries',e.worries,'О чём думаешь, что вызывает напряжение?')}${fieldText('Какой маленький шаг возможен?','smallStep',e.smallStep,'Действие на 5–15 минут')}${fieldText('Что сделал по работе / деньгам?','work',e.work,'Даже один просмотр вакансии считается')}${fieldText('Что получилось сегодня?','gratitude',e.gratitude,'Любое небольшое достижение')}${fieldText('Дополнительные заметки','notes',e.notes,'Всё, что считаешь важным')}</div>
<div class="card" id="problem-section"><h2>🧩 Мои проблемы</h2><p>Выпиши конкретную проблему. Приложение предложит небольшой шаг из готовых подсказок — это не ответ ИИ.</p>
<form id="problem-form"><label class="field"><span class="field-label">Область</span><select name="category">${Object.entries(CATEGORIES).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label><label class="field"><span class="field-label">Что тревожит?</span><input name="title" maxlength="160" required placeholder="Например, боюсь искать работу"></label><label class="field"><span class="field-label">Подробнее (необязательно)</span><textarea name="description" rows="2" maxlength="2000" placeholder="Как это влияет на мой день?"></textarea></label><label class="field"><span class="field-label">Мой первый шаг (необязательно)</span><input name="nextStep" maxlength="240" placeholder="Оставь пустым для подсказки"></label><button type="submit" class="btn">Добавить проблему</button></form>
${problems.length?`<div class="divider"></div>${problems.map(p=>`<div class="problem"><div><span class="tag ${p.resolved?'resolved':''}">${esc(CATEGORIES[p.category]||'Другое')}</span><span class="badge">${p.resolved?'Завершено':'Актуально'}</span></div><strong style="margin-top:7px">${esc(p.title)}</strong>${p.description?`<div class="description">${esc(p.description)}</div>`:''}<div class="suggestion">${esc(p.nextStep||p.suggestion||HINTS.other)}</div><div class="btnrow"><button class="btn ghost" type="button" data-resolve="${esc(p.id)}">${p.resolved?'Вернуть в работу':'Отметить решённой'}</button>${!p.resolved?`<button class="btn secondary" type="button" data-add-step="${esc(p.id)}">В план на сегодня</button>`:''}<button class="btn negative" type="button" data-remove-problem="${esc(p.id)}">Удалить</button></div></div>`).join('')}`:'<div class="empty">Список пока пуст.</div>'}</div><p class="footnote">Дневник не заменяет медицинскую или психологическую помощь.</p>`;}
function renderProgressOriginal(){const days=Array.from({length:7},(_,i)=>addDays(today,i-6)),recent=days.map(k=>state.entries[k]).filter(Boolean),all=Object.keys(state.entries).sort().reverse(),sleepAvg=mean(recent.map(e=>duration(e))),moodAvg=mean(recent.map(e=>e.mood));return `<div class="eyebrow">Без гонки за цифрами</div><h1 class="logtitle">Прогресс</h1><p class="muted">Смотрим на тенденции, а не оцениваем себя по одному дню.</p><div class="grid2">${metric('Сон · среднее',sleepAvg===null?'—':fmt(sleepAvg)+' ч')}${metric('Настроение · среднее',moodAvg===null?'—':fmt(moodAvg)+'/10')}${metric('Выполнено шагов',String(recent.reduce((sum,e)=>sum+done(e),0)))}${metric('Дней с записями',String(recent.length))}</div>
<article class="card"><h2>Энергия за последние 7 дней</h2><p class="small">Утро и вечер по шкале от 0 до 10.</p>${days.map(k=>{const e=state.entries[k],am=e?num(e.energyAm):null,pm=e?num(e.energyPm):null,label=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(new Date(k+'T12:00:00'));return `<div class="subhead">${esc(label)}</div><div class="barrow"><span>Утро</span><div class="barbase"><div class="barinside" style="width:${am===null?0:am*10}%;background:#8baeb0"></div></div><b>${am===null?'—':am+'/10'}</b></div><div class="barrow"><span>Вечер</span><div class="barbase"><div class="barinside" style="width:${pm===null?0:pm*10}%"></div></div><b>${pm===null?'—':pm+'/10'}</b></div>`;}).join('')}</article>
<article class="card"><h2>История записей</h2>${all.length?all.slice(0,30).map(k=>{let e=entry(k);return `<div class="task"><div style="flex:1"><b>${esc(niceDate(k))}</b><em>Сон: ${esc(sleepText(duration(e)))} · шаги: ${done(e)}/${e.taskItems.length} · настроение: ${e.mood===''?'—':esc(e.mood)+'/10'}</em></div><button class="btn ghost" type="button" data-open-date="${esc(k)}">Открыть</button></div>`;}).join(''):'<div class="empty">Записи появятся здесь.</div>'}</article><div class="notice">Длительная бессонница, апатия и усталость заслуживают оценки врача. Этот дневник можно показать специалисту.</div>`;}
function buildReport(){const keys=Object.keys(state.entries).sort().reverse().slice(0,14);let lines=['ДНЕВНИК «ОПОРА» — ОТЧЁТ ДЛЯ CHATGPT',`Составлен: ${niceDate(today)}. Последние ${keys.length} записей.`, 'Контекст: трудно заснуть из-за мыслей о будущем; утром усталость, вечером больше энергии; трудности с мотивацией, работой и деньгами.', 'Прошу найти тенденции и составить реалистичный, бережный план на следующие 7 дней. Не ставить диагноз и не сокращать сон ради дисциплины.','',`ТЕКУЩИЙ ПЛАН: ${state.planTitle}`,...state.plan.map(t=>`• ${t.tag}: ${t.title}`),'',`АКТУАЛЬНЫЕ ПРОБЛЕМЫ (${state.problems.filter(p=>!p.resolved).length}):`,...state.problems.filter(p=>!p.resolved).map(p=>`• ${CATEGORIES[p.category]||'Другое'}: ${p.title}. ${p.description||''} Шаг: ${p.nextStep||p.suggestion||''}`),'','ДНЕВНЫЕ ЗАПИСИ:'];
for(const k of keys){const e=entry(k);lines.push('',niceDate(k),`Сон: лёг ${e.bed||'—'}; уснул ${e.sleep||'—'}; проснулся ${e.wake||'—'}; продолжительность ${sleepText(duration(e))}; качество ${e.quality||'—'}/5.`,`Энергия утром ${e.energyAm===''?'—':e.energyAm}/10; вечером ${e.energyPm===''?'—':e.energyPm}/10; настроение ${e.mood===''?'—':e.mood}/10; тревога ${e.stress===''?'—':e.stress}/10.`,`Выполнено ${done(e)}/${e.taskItems.length}: ${e.taskItems.filter(t=>e.done[t.id]).map(t=>t.title).join('; ')||'нет отмеченных'}.`,`Тревоги: ${e.worries||'—'}`,`Маленький шаг: ${e.smallStep||'—'}`,`Работа / деньги: ${e.work||'—'}`,`Что получилось: ${e.gratitude||'—'}`,`Дополнительно: ${e.notes||'—'}`);}
lines.push(...extraReportLines(keys));lines.push('','ПОЖАЛУЙСТА, ОТВЕТЬ:','1. Какие закономерности видны, а чего пока нельзя определить?','2. Какие 3–5 небольших действий предложишь?','3. Напиши план отдельными строками формата «время | действие», чтобы его можно было вставить в приложение.');return lines.join('\n');}
function renderExchange(){return `<div class="eyebrow">Ты управляешь своими данными</div><h1 class="logtitle">Обмен с ChatGPT</h1><div class="notice">Приложение работает без ChatGPT. Когда появится интернет, ты сам решишь, что передать. Данные никуда автоматически не отправляются.</div>
<article class="card"><h2>1. Передай мне отчёт</h2><p>Ниже последние 14 записей и открытые проблемы. <strong>Прочитай текст перед отправкой</strong>: в нём могут быть личные сведения.</p><textarea id="report" class="report" spellcheck="false">${esc(buildReport())}</textarea><div class="btnrow"><button type="button" class="btn" data-action="copy-report">Скопировать отчёт</button><button type="button" class="btn secondary" data-action="share-report">Поделиться файлом</button><button type="button" class="btn ghost" data-action="save-report">Скачать TXT</button></div></article>
<article class="card"><h2>2. Получи новый план</h2><p>Я проанализирую отчёт в чате и предложу новые задачи. Скопируй строки плана из моего ответа сюда — по одной строке.</p><label class="field"><span class="field-label">Название плана</span><input id="plan-title" value="${esc(state.planTitle)}" maxlength="80"></label><label class="field"><span class="field-label">Задания: «время | действие»</span><textarea id="plan-lines" rows="7" placeholder="08:00 | Умыться и позавтракать&#10;12:00 | 10 минут полезного дела&#10;19:00 | Записать тревоги">${esc(state.plan.map(t=>t.tag+' | '+t.title).join('\n'))}</textarea></label><p class="small muted">От 1 до 12 строк. Новый план действует с сегодняшнего дня. Прошлые записи сохранятся.</p><button type="button" class="btn" data-action="apply-plan">Применить новый план</button></article>
<article class="card"><h2>3. Резервная копия</h2><p>Сохрани копию в приложении «Файлы» или в другом надёжном месте. Записи могут исчезнуть при очистке данных сайта или удалении приложения.</p><div class="btnrow"><button type="button" class="btn secondary" data-action="backup">Экспорт данных JSON</button><button type="button" class="btn ghost" data-action="import-click">Восстановить из JSON</button></div><input id="import-file" type="file" accept=".json,application/json" hidden><div class="hint">Восстановление заменит текущие записи после подтверждения.</div></article><p class="footnote">Без аккаунта, без облака, без внешних библиотек и аналитики. Вся история хранится локально в браузере.</p>`;}

// ===== ОПОРА 2.0: питание, тренировки, лента дня и показатели часов =====
const KINDS={wake:'Пробуждение',walk:'Прогулка',mood:'Самочувствие',work:'Работа и дела',water:'Вода',rest:'Отдых',note:'Заметка'};
const MEAL_TYPES={breakfast:'Завтрак',lunch:'Обед',dinner:'Ужин',snack:'Перекус'};
const timeNow=()=>{const d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
const ident=prefix=>prefix+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
const safeNum=(v,max=1e6)=>{if(v===''||v===null||v===undefined)return null;const raw=String(v).trim().replace(',','.');if(!raw)return null;const n=Number(raw);return Number.isFinite(n)&&n>=0&&n<=max?n:null;};
const showNum=(v,unit='')=>v===''||v===null||v===undefined?'—':String(v).replace('.',',')+(unit?' '+unit:'');
const datefmt=k=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(new Date(k+'T12:00:00'));
const validDate=k=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&iso(new Date(k+'T12:00:00'))===k;
function initializeEnhancements(){
  if(!state.profile || typeof state.profile!=='object')state.profile={age:'',height:'',weight:'',sex:'',goal:'balance'};
  if(!state.weights || typeof state.weights!=='object')state.weights={};
  state.version=2;save();
}
function allItems(e){
  const list=[];
  for(const x of e.events||[])list.push({...x,source:'events',label:KINDS[x.kind]||'Заметка',desc:x.detail||''});
  for(const x of e.meals||[])list.push({...x,source:'meals',label:MEAL_TYPES[x.kind]||'Приём пищи',desc:x.name+(x.grams?' · '+x.grams+' г':'')+(x.kcal!==''&&x.kcal!==null?' · '+x.kcal+' ккал':'')});
  for(const x of e.pulse||[])list.push({...x,source:'pulse',label:'Пульс',desc:x.bpm+' уд/мин'+(x.note?' · '+x.note:'')});
  for(const x of e.workouts||[])list.push({...x,source:'workouts',label:'Тренировка',desc:x.exercise+(x.sets&&x.reps?' · '+x.sets+'×'+x.reps:'')+(x.kg?' × '+x.kg+' кг':'')+(x.minutes?' · '+x.minutes+' мин':'')});
  return list.sort((a,b)=>(a.time||'').localeCompare(b.time||'')||(a.id||'').localeCompare(b.id||''));
}
function renderTimeline(e){
  const items=allItems(e);
  return `<div class="timeline">${items.length?items.map(x=>`<div class="timeline-item"><span class="timeline-time">${esc(x.time||'—')}</span><div class="timeline-body"><strong>${esc(x.label)}</strong><p>${esc(x.desc)}</p>${x.source==='meals'&&(x.protein||x.fat||x.carbs)?`<span class="fine">Б ${showNum(x.protein,'г')} · Ж ${showNum(x.fat,'г')} · У ${showNum(x.carbs,'г')}</span>`:''}${x.source==='workouts'&&x.feeling?`<span class="fine">Самочувствие: ${esc(x.feeling)}</span>`:''}</div><button type="button" class="delete-small" title="Удалить запись" aria-label="Удалить запись" data-delete-source="${x.source}" data-delete-id="${esc(x.id)}">×</button></div>`).join(''):'<div class="empty">Записей пока нет. Начни с пробуждения или завтрака.</div>'}</div>`;
}
function renderDay(){
  const e=entry(selectedDate);
  const todays=selectedDate===today;
  return `<div class="eyebrow">По времени и без спешки</div><h1 class="logtitle">Мой день</h1>
  <p class="muted">Проснулся → записал. Позавтракал → добавил. Вечером вся история соберётся в отчёт.</p>
  <label class="field"><span class="field-label">Дата записи</span><input type="date" id="timeline-date" max="${today}" value="${selectedDate}"></label>
  <article class="card"><h2>Быстрое действие</h2><div class="quick-row"><button type="button" data-quick="wake" class="quick-action">☀️ Проснулся</button><button type="button" data-quick="walk" class="quick-action">🚶 Прогулка</button><button type="button" data-quick="mood" class="quick-action">💭 Самочувствие</button><button type="button" data-quick="work" class="quick-action">✅ Дело</button></div><p class="hint">Кнопка «Проснулся» сохраняет время, остальные откроют форму с выбранной категорией.</p></article>
  <article class="card"><h2>+ Запись по ходу дня</h2><form id="event-form" class="stacked">
  <div class="grid2"><label class="field"><span class="field-label">Время</span><input type="time" name="time" required value="${todays?timeNow():'08:00'}"></label><label class="field"><span class="field-label">Событие</span><select name="kind" id="event-kind">${Object.entries(KINDS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label></div>
  <label class="field"><span class="field-label">Что произошло / как себя чувствовал?</span><textarea name="detail" rows="2" maxlength="1500" placeholder="Например: встал тяжело, но сделал завтрак"></textarea></label>
  <button class="btn full" type="submit">Сохранить событие</button></form></article>
  <article class="card"><h2>Хронология · ${esc(datefmt(selectedDate))}</h2>${renderTimeline(e)}<div class="btnrow"><button type="button" class="btn secondary" data-go="health">+ Питание и зал</button></div></article>
  <div class="section-title"><h2>Сон, настроение и проблемы</h2></div>${renderDiary().replace(/<div class="eyebrow">Твои записи<\/div><h1 class="logtitle">Дневник<\/h1><p class="muted">[\s\S]*?<\/p>/,'')}`;
}
function totalMacros(e){
  const meals=e.meals||[];const total=k=>meals.reduce((a,m)=>a+(safeNum(m[k],100000)||0),0);
  return {count:meals.length,kcal:total('kcal'),protein:total('protein'),fat:total('fat'),carbs:total('carbs'),
    counted:meals.filter(m=>safeNum(m.kcal,100000)!==null).length,
    proteinKnown:meals.filter(m=>safeNum(m.protein,5000)!==null).length};
}
function profileInsights(){
  const z=state.profile||{},weight=safeNum(z.weight,500),height=safeNum(z.height,250),age=safeNum(z.age,115);
  if(!weight||!height||!age)return 'Заполни возраст, рост и вес. Тогда я смогу учитывать их в отчёте о питании и тренировках.';
  const bmi=weight/Math.pow(height/100,2);
  const msg=`Профиль: ${age} лет · ${height} см · ${weight} кг. ИМТ ≈ ${bmi.toFixed(1).replace('.',',')}.`;
  return msg+' ИМТ — грубый ориентир, он не учитывает мышечную массу. Никаких автоматических диет и ограничений приложение не назначает.';
}
function watchText(w){
  if(!w || !Object.values(w).some(v=>v!==''&&v!==null&&v!==undefined))return 'Данных нет';
  return `Шаги ${showNum(w.steps)}; ср. пульс ${showNum(w.avgHr,'уд/мин')}; пульс покоя ${showNum(w.restingHr,'уд/мин')}; сон часов ${showNum(w.sleepHours)}${w.source?' · '+w.source:''}`;
}
function renderHealth(){
  const e=entry(selectedDate),t=totalMacros(e),w=e.watch,z=state.profile;
  const weightDates=Object.keys(state.weights).sort().reverse();
  return `<div class="eyebrow">Питание, движение и Redmi Watch 4</div><h1 class="logtitle">Здоровье и спорт</h1><p class="muted">Это дневник наблюдений, а не медицинский монитор. Вводимые калории и показатели часов — приблизительные.</p>
  <label class="field"><span class="field-label">Дата</span><input type="date" id="health-date" max="${today}" value="${selectedDate}"></label>
  <article class="card"><h2>👤 Мои параметры</h2><form id="profile-form">
    <div class="grid2"><label class="field"><span class="field-label">Возраст, лет</span><input type="number" inputmode="numeric" name="age" min="18" max="115" value="${esc(z.age||'')}" placeholder="Например, 30"></label>
    <label class="field"><span class="field-label">Рост, см</span><input type="number" inputmode="decimal" name="height" min="100" max="250" step="0.1" value="${esc(z.height||'')}" placeholder="Например, 178"></label>
    <label class="field"><span class="field-label">Вес, кг</span><input type="number" inputmode="decimal" name="weight" min="30" max="500" step="0.1" value="${esc(z.weight||'')}" placeholder="Например, 82.5"></label>
    <label class="field"><span class="field-label">Цель</span><select name="goal">${[['balance','Самочувствие и режим'],['strength','Сила и мышцы'],['endurance','Выносливость'],['other','Пока не решил']].map(([x,y])=>`<option value="${x}" ${z.goal===x?'selected':''}>${y}</option>`).join('')}</select></label></div>
    <button type="submit" class="btn full">Сохранить параметры</button><p class="hint">Без этих данных приложение не делает предположений о твоих потребностях.</p></form><div class="callout">${esc(profileInsights())}</div></article>
  <article class="card"><h2>🥗 Питание</h2><div class="grid2">${metric('Приёмов пищи',t.count)}${metric('Калории внесённые',t.counted?t.kcal+' ккал':'—')}${metric('Белок (по записям)',t.proteinKnown?t.protein+' г':'—')}${metric('Заполнено ккал',t.counted+'/'+t.count)}</div><p class="fine">Если калории и БЖУ не указаны, итог неполный. Незаписанные значения не считаются нулём.</p>
  <form id="meal-form"><div class="grid2"><label class="field"><span class="field-label">Время</span><input type="time" name="time" required value="${selectedDate===today?timeNow():'09:00'}"></label><label class="field"><span class="field-label">Приём пищи</span><select name="kind">${Object.entries(MEAL_TYPES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label></div>
  <label class="field"><span class="field-label">Что съел?</span><input name="name" required maxlength="250" placeholder="Овсянка, яйца, чай…"></label>
  <div class="grid2"><label class="field"><span class="field-label">Порция, г (если знаешь)</span><input name="grams" type="number" inputmode="decimal" min="0" max="10000" step="0.1"></label><label class="field"><span class="field-label">Ккал (необязательно)</span><input name="kcal" type="number" inputmode="decimal" min="0" max="20000" step="0.1"></label>
  <label class="field"><span class="field-label">Белки, г</span><input name="protein" type="number" inputmode="decimal" min="0" max="5000" step="0.1"></label><label class="field"><span class="field-label">Жиры, г</span><input name="fat" type="number" inputmode="decimal" min="0" max="5000" step="0.1"></label>
  <label class="field"><span class="field-label">Углеводы, г</span><input name="carbs" type="number" inputmode="decimal" min="0" max="5000" step="0.1"></label></div>
  <button type="submit" class="btn full">Добавить приём пищи</button><p class="hint">Точной базы продуктов офлайн пока нет: можешь записать просто название и порцию, а вечером мы обсудим питание.</p></form></article>
  <article class="card"><h2>🏋️ Тренировки в зале</h2>
  <form id="workout-form"><div class="grid2"><label class="field"><span class="field-label">Время</span><input type="time" name="time" required value="${selectedDate===today?timeNow():'18:00'}"></label><label class="field"><span class="field-label">Продолжительность, мин</span><input name="minutes" type="number" min="0" max="600" step="1"></label></div>
  <label class="field"><span class="field-label">Упражнение / тренировка</span><input name="exercise" required maxlength="160" placeholder="Жим лёжа, беговая дорожка…"></label>
  <div class="grid2"><label class="field"><span class="field-label">Подходы</span><input name="sets" type="number" min="0" max="100" step="1" inputmode="numeric"></label><label class="field"><span class="field-label">Повторения в подходе</span><input name="reps" type="number" min="0" max="1000" step="1" inputmode="numeric"></label>
  <label class="field"><span class="field-label">Рабочий вес, кг</span><input name="kg" type="number" min="0" max="1000" step="0.5" inputmode="decimal"></label><label class="field"><span class="field-label">Трудность (1–10)</span><input name="effort" type="number" min="1" max="10" step="1"></label></div>
  <label class="field"><span class="field-label">Как прошло?</span><textarea name="feeling" rows="2" maxlength="500" placeholder="Техника, самочувствие, новые веса, усталость…"></textarea></label>
  <button type="submit" class="btn full">Записать упражнение</button></form><p class="hint">Каждое упражнение добавляется отдельно. По ним будем сравнивать рабочий вес, объём и регулярность.</p></article>
  <article class="card"><h2>⌚ Redmi Watch 4 · показатели дня</h2><p class="small">Веб-версия не считывает часы автоматически. Данные вводятся вручную или импортируются из подготовленного CSV-файла.</p><form id="watch-form">
  <div class="grid2"><label class="field"><span class="field-label">Шаги</span><input name="steps" type="number" min="0" max="200000" step="1" value="${esc(w.steps??'')}"></label><label class="field"><span class="field-label">Средний пульс, уд/мин</span><input name="avgHr" type="number" min="20" max="250" step="1" value="${esc(w.avgHr??'')}"></label>
  <label class="field"><span class="field-label">Пульс в покое, уд/мин</span><input name="restingHr" type="number" min="20" max="250" step="1" value="${esc(w.restingHr??'')}"></label><label class="field"><span class="field-label">Сон по часам, ч</span><input name="sleepHours" type="number" min="0" max="24" step="0.1" value="${esc(w.sleepHours??'')}"></label></div>
  <button class="btn full" type="submit">Сохранить показатели</button></form>
  <div class="divider"></div><h3>Пульс в течение дня</h3><p class="fine">Отдельные измерения с указанием времени — вручную или из CSV. При импорте из часов можно будет увидеть изменения за день.</p>
  <form id="pulse-form"><div class="grid2"><label class="field"><span class="field-label">Время</span><input name="time" type="time" value="${selectedDate===today?timeNow():'12:00'}" required></label>
  <label class="field"><span class="field-label">Пульс, уд/мин</span><input name="bpm" type="number" min="20" max="250" required></label></div><label class="field"><span class="field-label">Комментарий</span><input name="note" maxlength="120" placeholder="После прогулки, в покое…"></label><button type="submit" class="btn secondary full">Добавить измерение</button></form>
  ${(e.pulse||[]).length?`<h3>Измерения (${e.pulse.length})</h3>${e.pulse.slice().sort((a,b)=>a.time.localeCompare(b.time)).map(s=>`<div class="mini-line"><span>${esc(s.time)} ${esc(s.note||'')}</span><b>${esc(s.bpm)} уд/мин</b></div>`).join('')}`:''}
  <div class="divider"></div><div class="btnrow"><button type="button" class="btn secondary" data-action="csv-template">Шаблон CSV</button><button type="button" class="btn ghost" data-action="watch-import-click">Импорт CSV</button></div>
  <input id="watch-file" type="file" accept=".csv,text/csv" hidden><p class="hint">CSV для итогов дня: date,steps,avg_hr,resting_hr,sleep_hours. Для пульса по времени: date,time,hr. Импорт обновляет только непустые значения соответствующих дней. Это не формат экспорта Mi Fitness «как есть».</p>
  <div class="notice">Для передачи доступных метрик из Redmi Watch 4 в iPhone: Mi Fitness → Профиль → Сторонние данные → Health («Здоровье») → разрешить категории. Потом открой «Здоровье» и проверь источники данных. Показатели, доступные для синхронизации, могут различаться. Для прямого чтения HealthKit понадобится нативное приложение iOS.</div></article>
  <article class="card"><h2>⚖️ Динамика веса</h2><form id="weight-form"><div class="grid2"><label class="field"><span class="field-label">Дата</span><input name="date" type="date" max="${today}" value="${selectedDate}"></label><label class="field"><span class="field-label">Вес, кг</span><input name="weight" type="number" min="30" max="500" step="0.1" required placeholder="Текущий вес"></label></div><button class="btn secondary full" type="submit">Записать вес</button></form>
  ${weightDates.length?weightDates.slice(0,7).map(k=>`<div class="timeline-item"><span class="timeline-time">${esc(datefmt(k))}</span><div class="timeline-body"><strong>${esc(state.weights[k])} кг</strong></div></div>`).join(''):'<p>Пока нет измерений. Это необязательный раздел.</p>'}</article>
  <article class="card"><h2>Записи на ${esc(datefmt(selectedDate))}</h2>${renderTimeline(e)}</article>`;
}
function renderFitnessProgress(){
 const dates=Array.from({length:7},(_,i)=>addDays(today,i-6)),es=dates.map(d=>[d,state.entries[d]]);
 const meals=es.reduce((s,[d,e])=>s+(e?.meals?.length||0),0),sessions=es.reduce((s,[d,e])=>s+(e?.workouts?.length||0),0);
 const steps=es.map(([d,e])=>safeNum(e?.watch?.steps,200000)).filter(v=>v!==null);
 const maxSteps=Math.max(1,...steps);
 const exerciseMap=new Map();
 for(const k of Object.keys(state.entries)){
   const e=state.entries[k];
   for(const w of e.workouts||[]){const id=w.exercise.trim().toLowerCase(),v=safeNum(w.kg,1000);if(id&&v!==null&&(!exerciseMap.has(id)||v>exerciseMap.get(id).kg))exerciseMap.set(id,{exercise:w.exercise,kg:v,date:k});}
 }
 return `<div class="section-title"><h2>Питание, спорт и часы · 7 дней</h2></div>
 <div class="grid2">${metric('Приёмов пищи',String(meals))}${metric('Записано упражнений',String(sessions))}${metric('Средние шаги',steps.length?Math.round(mean(steps)).toLocaleString('ru-RU'):'—')}${metric('Дней с шагами',String(steps.length))}</div>
 <article class="card"><h2>Шаги за 7 дней</h2><p class="fine">Столбики относительно максимального значения этой недели, это не целевая норма.</p>${es.map(([d,e])=>{const s=safeNum(e?.watch?.steps,200000);return `<div class="barrow steps"><span>${esc(datefmt(d))}</span><div class="barbase"><div class="barinside" style="width:${s===null?0:Math.min(100,100*s/maxSteps)}%"></div></div><b>${s===null?'—':s.toLocaleString('ru-RU')}</b></div>`;}).join('')}</article>
 <article class="card"><h2>Лучшие рабочие веса по упражнениям</h2><p class="fine">Сравнивается максимальный записанный вес, не общая сила и не 1ПМ.</p>${exerciseMap.size?[...exerciseMap.values()].sort((a,b)=>b.kg-a.kg).slice(0,8).map(v=>`<div class="mini-line"><span>${esc(v.exercise)}</span><b>${esc(v.kg)} кг</b></div>`).join(''):'<p>Добавь первую тренировку, и здесь появится история достижений.</p>'}</article>
 <div class="notice">Пульс и фазы сна с часов помогают наблюдать изменения, но не позволяют самостоятельно ставить диагнозы. При стойкой дневной усталости обсуди данные с врачом.</div>`;
}
function renderProgress(){return renderProgressOriginal()+renderFitnessProgress();}
function extraReportLines(keys){
 const z=state.profile,lines=['','===== ПИТАНИЕ, СПОРТ, ЧАСЫ =====',
 `ПРОФИЛЬ: возраст ${z.age||'не указан'} лет; рост ${z.height||'не указан'} см; вес ${z.weight||'не указан'} кг; цель: ${{balance:'самочувствие и режим',strength:'сила и мышцы',endurance:'выносливость',other:'пока не определена'}[z.goal]||'не определена'}.`,
 'Не делай выводов о калориях, составе тела и тренировочных нагрузках по неполным данным; учитывай настроение, сон и самочувствие.'];
 const weights=Object.keys(state.weights).sort().reverse().slice(0,14);
 if(weights.length)lines.push('ИЗМЕРЕНИЯ ВЕСА: '+weights.map(k=>k+': '+state.weights[k]+' кг').join(' | '));
 for(const k of keys){
 const e=state.entries[k],t=totalMacros(e);
 lines.push('',datefmt(k)+' — питание: '+t.count+' приёмов; отмечено калорий '+t.counted+'/'+t.count+
  (t.counted?'; сумма внесённых калорий '+t.kcal+' ккал':'')+
  (t.count?'; внесённые Б/Ж/У '+t.protein+'/'+t.fat+'/'+t.carbs+' г':''));
 for(const x of e.meals||[])lines.push('  '+x.time+' '+(MEAL_TYPES[x.kind]||'Питание')+': '+x.name+'; порция '+showNum(x.grams,'г')+'; ккал '+showNum(x.kcal)+'; Б/Ж/У '+[x.protein,x.fat,x.carbs].map(v=>showNum(v)).join('/'));
 for(const x of e.workouts||[])lines.push('  '+x.time+' тренировка: '+x.exercise+'; подходы '+showNum(x.sets)+'; повторения '+showNum(x.reps)+'; вес '+showNum(x.kg,'кг')+'; минуты '+showNum(x.minutes)+'; трудность '+showNum(x.effort)+'/10; заметки '+(x.feeling||'—'));
 lines.push('  Redmi Watch 4 / внесённые показатели: '+watchText(e.watch));
 if(e.pulse?.length)lines.push('  Пульс по времени: '+e.pulse.slice().sort((a,b)=>a.time.localeCompare(b.time)).map(p=>p.time+' — '+p.bpm+' уд/мин').join('; '));
 const events=(e.events||[]).sort((a,b)=>a.time.localeCompare(b.time));for(const x of events)lines.push('  '+x.time+' '+(KINDS[x.kind]||'Событие')+': '+(x.detail||'—'));
 }
 return lines;
}

function addTodayStep(text){const e=entry();if(e.taskItems.length>=20){toast('В одном дне уже 20 задач');return;}e.taskItems.push({id:'extra-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),tag:'Дополнительно',title:text.slice(0,160),note:'Один небольшой шаг'});save();toast('Добавлено в план на сегодня');}
function download(name,data,type){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
async function copyReport(){const txt=$('#report')?.value||buildReport();try{await navigator.clipboard.writeText(txt);toast('Отчёт скопирован');}catch(e){let area=$('#report');area.focus();area.select();toast('Текст выделен — выбери «Скопировать»');}}
async function shareReport(){const txt=$('#report')?.value||buildReport(),file=new File([txt],`opora-report-${today}.txt`,{type:'text/plain;charset=utf-8'});if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'Отчёт Опора'});}catch(e){if(e.name!=='AbortError')toast('Не удалось поделиться');}}else{download(file.name,txt,file.type);toast('Отчёт сохранён');}}
function applyPlan(){const title=$('#plan-title').value.trim()||'Новый план',rows=$('#plan-lines').value.trim().split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(rows.length<1||rows.length>12){toast('Нужно от 1 до 12 строк');return;}const tasks=rows.map((line,i)=>{let pos=line.indexOf('|'),tag=pos<0?'Когда удобно':line.slice(0,pos).trim(),text=pos<0?line:line.slice(pos+1).trim();return {id:`plan-${Date.now()}-${i}`,tag:(tag||'Когда удобно').slice(0,50),title:text.slice(0,160),note:''};});if(tasks.some(t=>!t.title)){toast('У каждой задачи должен быть текст');return;}const e=entry(),old=new Set(e.taskItems.filter(t=>e.done[t.id]).map(t=>t.title));state.planTitle=title.slice(0,80);state.plan=tasks;e.taskItems=tasks.map(t=>({...t}));e.done={};e.taskItems.forEach(t=>{if(old.has(t.title))e.done[t.id]=true;});save();go('today');toast('Новый план применён');}
function validateBackup(obj){if(!obj||![1,2].includes(obj.version)||!obj.entries||Array.isArray(obj.entries)||typeof obj.entries!=='object'||!Array.isArray(obj.plan)||!Array.isArray(obj.problems))throw Error('Неподдерживаемый формат');if(obj.plan.length>30||obj.problems.length>2000||Object.keys(obj.entries).length>3000)throw Error('Слишком большой файл');for(const [key,e] of Object.entries(obj.entries)){if(!validDate(key)||!e||!Array.isArray(e.taskItems)||e.taskItems.length>40||!e.done||typeof e.done!=='object')throw Error('Некорректные записи');}return obj;}

// События новой версии. Всё сохраняется локально.
app.addEventListener('submit',event=>{
 const id=event.target.id,form=event.target;
 if(!['event-form','meal-form','workout-form','watch-form','pulse-form','profile-form','weight-form'].includes(id))return;
 event.preventDefault();const fd=new FormData(form),get=k=>String(fd.get(k)??'').trim(),e=entry(selectedDate);
 if(id==='event-form'){
   e.events.push({id:ident('ev'),time:get('time')||timeNow(),kind:KINDS[get('kind')]?get('kind'):'note',detail:get('detail').slice(0,1500)});
 }else if(id==='meal-form'){
   const name=get('name').slice(0,250);if(!name){toast('Введи название еды');return;}
   const o={id:ident('meal'),time:get('time')||timeNow(),kind:MEAL_TYPES[get('kind')]?get('kind'):'snack',name};
   for(const [k,max] of Object.entries({grams:10000,kcal:20000,protein:5000,fat:5000,carbs:5000})){const raw=get(k),n=safeNum(raw,max);if(raw&&!Number.isFinite(n)){toast('Проверь число в поле '+k);return;}o[k]=n===null?'':n;}e.meals.push(o);
 }else if(id==='workout-form'){
   const exercise=get('exercise').slice(0,160);if(!exercise){toast('Укажи упражнение');return;}
   const o={id:ident('train'),time:get('time')||timeNow(),exercise,feeling:get('feeling').slice(0,500)};
   for(const [k,max] of Object.entries({sets:100,reps:1000,kg:1000,minutes:600,effort:10})){const raw=get(k),n=safeNum(raw,max);if(raw&&n===null){toast('Проверь число в поле '+k);return;}o[k]=n===null?'':n;}e.workouts.push(o);
 }else if(id==='watch-form'){
   const next={source:'вручную'};
   for(const [formK,key,min,max] of [['steps','steps',0,200000],['avgHr','avgHr',20,250],['restingHr','restingHr',20,250],['sleepHours','sleepHours',0,24]]){
     const raw=get(formK),v=safeNum(raw,max);
     if(raw&&(v===null||v<min)){toast('Проверь показатель: '+formK);return;}next[key]=v===null?'':v;
   }e.watch=next;
 }else if(id==='pulse-form'){
   const bpm=safeNum(get('bpm'),250);
   if(bpm===null||bpm<20){toast('Проверь пульс');return;}
   e.pulse.push({id:ident('pulse'),time:get('time')||timeNow(),bpm,note:get('note').slice(0,120)});
 }else if(id==='profile-form'){
   const next={age:get('age'),height:get('height'),weight:get('weight'),goal:get('goal')};
   for(const [k,min,max] of [['age',18,115],['height',100,250],['weight',30,500]]){if(next[k] && (safeNum(next[k],max)===null || Number(next[k])<min)){toast('Проверь поле '+k);return;}}
   state.profile={...state.profile,...next};
 }else if(id==='weight-form'){
   const k=get('date'),weight=safeNum(get('weight'),500);
   if(!validDate(k)||k>today||weight===null||weight<30){toast('Проверь дату и вес');return;}
   state.weights[k]=weight;state.profile.weight=String(weight);
 }
 save();render();toast('Сохранено на устройстве');
});
app.addEventListener('change',ev=>{
 const target=ev.target;
 if(target.id==='timeline-date'||target.id==='health-date'){selectedDate=target.value>today?today:target.value;render();}
});
app.addEventListener('click',ev=>{
 const b=ev.target.closest('button');if(!b)return;
 if(b.dataset.quick){
   const kind=b.dataset.quick;
   if(kind==='wake'){entry(selectedDate).events.push({id:ident('ev'),time:selectedDate===today?timeNow():'08:00',kind:'wake',detail:'Проснулся'});save();render();toast('Пробуждение отмечено');}
   else{const select=$('#event-kind');if(select)select.value=kind;const field=$('#event-form textarea[name="detail"]');field?.focus();field?.scrollIntoView({block:'center',behavior:'smooth'});}
   return;
 }
 if(b.dataset.deleteSource && b.dataset.deleteId){
   const kind=b.dataset.deleteSource;if(!['events','meals','workouts','pulse'].includes(kind))return;
   if(!confirm('Удалить эту запись?'))return;
   const e=entry(selectedDate);e[kind]=e[kind].filter(x=>x.id!==b.dataset.deleteId);save();render();toast('Запись удалена');return;
 }
 if(b.dataset.action==='csv-template'){
   download('opora-watch-template.csv','date,steps,avg_hr,resting_hr,sleep_hours\n'+today+',,,,\n','text/csv;charset=utf-8');return;
 }
 if(b.dataset.action==='watch-import-click'){$('#watch-file')?.click();return;}
});
app.addEventListener('change',async ev=>{
 if(ev.target.id!=='watch-file')return;
 const file=ev.target.files?.[0];if(!file)return;
 if(file.size>500000){toast('CSV слишком большой, максимум 500 КБ');return;}
 try{
   const textData=(await file.text()).replace(/^\uFEFF/,'').trim();
   const lines=textData.split(/\r?\n/).filter(Boolean),delimiter=lines[0].includes(';')?';':lines[0].includes('\t')?'\t':',';
   const head=lines.shift().toLowerCase().split(delimiter).map(x=>x.trim().replace(/^"|"$/g,''));
   const cols=['date','steps','avg_hr','resting_hr','sleep_hours'];
   const heartMode=['date','time','hr'].every(c=>head.includes(c));
   if(!heartMode&&!cols.every(c=>head.includes(c)))throw Error('Нужны столбцы date,time,hr или '+cols.join(', '));
   if(lines.length>2500)throw Error('Не больше 2500 строк за один импорт');
   let count=0;
   for(const ln of lines){
     const v=ln.split(delimiter).map(x=>x.trim().replace(/^"|"$/g,''));
     const obj=Object.fromEntries((heartMode?['date','time','hr']:cols).map(c=>[c,v[head.indexOf(c)]??'']));
     const d=obj.date;if(!validDate(d)||d>today)continue;
     const target=entry(d);let changed=false;
     if(heartMode){
       const bpm=safeNum(obj.hr,250);
       if(bpm!==null&&bpm>=20&&/^\d{2}:\d{2}$/.test(obj.time)){
         target.pulse.push({id:ident('pulse'),time:obj.time,bpm,note:'Импорт CSV'});
         count++;
       }
       continue;
     }
     for(const [source,dest,max,min] of [['steps','steps',200000,0],['avg_hr','avgHr',250,20],['resting_hr','restingHr',250,20],['sleep_hours','sleepHours',24,0]]){
       if(obj[source]==='')continue;const n=safeNum(obj[source],max);if(n===null||n<min)continue;
       target.watch[dest]=n;changed=true;
     }
     if(changed){target.watch.source='CSV импорт';count++;}
   }
   save();render();toast('Дней импортировано: '+count);
 }catch(error){alert('Ошибка импорта: '+error.message);}
});

app.addEventListener('input',event=>{const key=event.target.dataset.field;if(!key)return;const e=entry(selectedDate);e[key]=event.target.value;if(event.target.type==='range')$('#out-'+key).textContent=event.target.value+'/10';if(key==='sleep'||key==='wake')$('#sleep-total').textContent=sleepText(duration(e));save();});
app.addEventListener('change',event=>{const el=event.target;if(el.id==='diary-date'){selectedDate=el.value>today?today:el.value;render();return;}if(el.dataset.task){const e=entry();e.done[el.dataset.task]=el.checked;save();render();return;}if(el.dataset.field){entry(selectedDate)[el.dataset.field]=el.value;save();}});
app.addEventListener('submit',event=>{if(event.target.id!=='problem-form')return;event.preventDefault();const form=new FormData(event.target),title=String(form.get('title')||'').trim().slice(0,160),category=String(form.get('category')||'other');if(!title||!CATEGORIES[category])return;state.problems.push({id:'pr-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),created:today,category,title,description:String(form.get('description')||'').trim().slice(0,2000),nextStep:String(form.get('nextStep')||'').trim().slice(0,240),suggestion:HINTS[category],resolved:false});save();render();toast('Проблема записана');});
app.addEventListener('click',async event=>{const btn=event.target.closest('button');if(!btn)return;
if(btn.dataset.go){go(btn.dataset.go);if(btn.dataset.scroll)requestAnimationFrame(()=>$('#'+btn.dataset.scroll)?.scrollIntoView({behavior:'smooth'}));return;}
if(btn.dataset.resolve){let p=state.problems.find(x=>x.id===btn.dataset.resolve);if(p){p.resolved=!p.resolved;save();render();}return;}
if(btn.dataset.removeProblem){if(confirm('Удалить эту проблему из дневника?')){state.problems=state.problems.filter(x=>x.id!==btn.dataset.removeProblem);save();render();}return;}
if(btn.dataset.addStep){let p=state.problems.find(x=>x.id===btn.dataset.addStep);if(p)addTodayStep(p.nextStep||p.suggestion);return;}
if(btn.dataset.openDate){selectedDate=btn.dataset.openDate;go('day');return;}
switch(btn.dataset.action){case 'copy-report':await copyReport();break;case 'share-report':await shareReport();break;case 'save-report':download(`opora-report-${today}.txt`,$('#report').value,'text/plain;charset=utf-8');toast('Отчёт сохранён');break;case 'apply-plan':applyPlan();break;case 'backup':download(`opora-backup-${today}.json`,JSON.stringify(state,null,2),'application/json');toast('Резервная копия сохранена');break;case 'import-click':$('#import-file').click();break;}
});
app.addEventListener('change',async event=>{if(event.target.id!=='import-file')return;const file=event.target.files?.[0];if(!file)return;if(file.size>3*1024*1024){toast('Файл больше 3 МБ');return;}try{const data=validateBackup(JSON.parse(await file.text()));if(!confirm('Заменить все текущие записи данными из резервной копии?'))return;state=data;initializeEnhancements();save();selectedDate=today;go('today');toast('Данные восстановлены');}catch(err){alert('Не удалось восстановить данные: '+err.message);}});
$('.bottom-nav').addEventListener('click',event=>{const b=event.target.closest('[data-tab]');if(b)go(b.dataset.tab);});
initializeEnhancements();entry();render();document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
