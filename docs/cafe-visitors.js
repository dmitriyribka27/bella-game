// Cafe guests and recipes are data, not part of the animated island loop.
export const CAFE_GUESTS = [
  {id:'plush',name:'Плюша',coat:'#d6ab91',accent:'#f5d6b5',greeting:'Сегодня хочется посидеть у окна и никуда не спешить.',farewell:'Как же уютно здесь у Рыжего!'},
  {id:'ars',name:'Арс',coat:'#8798a0',accent:'#c5dad4',greeting:'Только что вернулся с пристани. Ветер сегодня бодрый!',farewell:'Вот теперь можно снова в море.'},
  {id:'marta',name:'Марта',coat:'#bd8861',accent:'#efd0a1',greeting:'Я принесла с собой новую книгу из лавки Цитеры.',farewell:'Пойду дочитаю ещё одну главу.'},
  {id:'luna',name:'Луна',coat:'#e9d5bd',accent:'#b9ada3',greeting:'С самого утра искала местечко потише.',farewell:'Обязательно загляну ещё.'},
  {id:'tuman',name:'Туман',coat:'#777c8d',accent:'#b8c3d0',greeting:'В обсерватории сегодня обещали ясное небо.',farewell:'Пора смотреть на звёзды!'},
  {id:'funtik',name:'Фунтик',coat:'#e7a356',accent:'#ffe1a3',greeting:'Чувствую запах свежей выпечки через всю площадь!',farewell:'Надо привести сюда друзей.'}
];

export const CAFE_RECIPES = [
  {id:'bun',name:'Булочка с корицей',emoji:'🥐',request:'Мне бы тёплую булочку с корицей.',steps:[
    {question:'С чего начнём булочку?',options:[['dough','🥣 Мягкое тесто'],['bread','🍞 Готовый тост'],['oats','🌾 Овсяные хлопья']],answer:'dough',hint:'Рыжий печёт булочки из теста, а не из готового хлеба.'},
    {question:'Какая пряность нужна для начинки?',options:[['pepper','🌶️ Перец'],['cinnamon','🟤 Корица'],['mint','🌿 Мята']],answer:'cinnamon',hint:'Гость просил именно ароматную корицу.'},
    {question:'Как доведём булочку до готовности?',options:[['fridge','🧊 Охладим'],['steam','♨️ Подержим над паром'],['oven','🔥 Испечём в духовке']],answer:'oven',hint:'Булочка должна подрумяниться в духовке.'}
  ]},
  {id:'tea',name:'Ягодный чай',emoji:'🫖',request:'Согрейте меня ягодным чаем, пожалуйста.',steps:[
    {question:'Выбери вкус для чайника.',options:[['berries','🫐 Лесные ягоды'],['coffee','☕ Кофейные зёрна'],['cocoa','🍫 Какао']],answer:'berries',hint:'Для ягодного чая нужны именно ягоды.'},
    {question:'Чем заварим ягоды?',options:[['milk','🥛 Холодное молоко'],['water','💧 Горячая вода'],['soda','🫧 Газировка']],answer:'water',hint:'Ягоды раскроют аромат в горячей воде.'},
    {question:'Что добавим для мягкого сладкого вкуса?',options:[['salt','🧂 Щепотка соли'],['honey','🍯 Ложка мёда'],['pepper','🌶️ Острый перец']],answer:'honey',hint:'Рыжий подслащивает чай мёдом.'}
  ]},
  {id:'cocoa',name:'Домашнее какао',emoji:'🍫',request:'Можно мне ваше домашнее какао?',steps:[
    {question:'Выбери основу для напитка.',options:[['juice','🧃 Яблочный сок'],['milk','🥛 Тёплое молоко'],['water','🫧 Газированная вода']],answer:'milk',hint:'Домашнее какао в кофейне готовят на молоке.'},
    {question:'Что добавим в молоко?',options:[['cocoa','🍫 Какао-порошок'],['tea','🍃 Чайные листья'],['coffee','☕ Кофейные зёрна']],answer:'cocoa',hint:'Ищи какао-порошок.'},
    {question:'Чем украсим чашку?',options:[['marshmallow','☁️ Маршмеллоу'],['olives','🫒 Оливки'],['lemon','🍋 Лимон']],answer:'marshmallow',hint:'К горячему какао подходит воздушный маршмеллоу.'}
  ]}
];

export const CAFE_RECIPE_BY_ID = Object.fromEntries(CAFE_RECIPES.map(recipe=>[recipe.id,recipe]));

export function newCafeServiceState(orders=0){return {next:Number.isFinite(orders)?Math.min(1_000_000,Math.max(0,Math.floor(orders))):0,queue:[]};}

export function sanitizeCafeServiceState(value,orders=0){
  const fallback=newCafeServiceState(orders);
  if(!value||typeof value!=='object')return fallback;
  const raw=Array.isArray(value.queue)?value.queue:[];
  const used=new Set(),slots=new Set();
  const queue=[];
  for(const entry of raw){
    if(!entry||!Number.isSafeInteger(entry.seq)||entry.seq<0||entry.seq>1_000_000||used.has(entry.seq)||!CAFE_RECIPE_BY_ID[entry.recipeId])continue;
    used.add(entry.seq);
    const slot=(entry.slot===0||entry.slot===1)&&!slots.has(entry.slot)?entry.slot:[0,1].find(candidate=>!slots.has(candidate));
    slots.add(slot);
    queue.push({seq:entry.seq,recipeId:entry.recipeId,step:Number.isInteger(entry.step)?Math.min(3,Math.max(0,entry.step)):0,slot});
    if(queue.length>=2)break;
  }
  const next=Number.isSafeInteger(value.next)?value.next:0;
  return {next:Math.min(1_000_000,Math.max(fallback.next,next,...queue.map(guest=>guest.seq+1))),queue};
}

export function cafeGuestProfile(visit){return CAFE_GUESTS[visit.seq%CAFE_GUESTS.length];}

export function inviteCafeGuests(service){
  let added=0;
  while(service.queue.length<2&&service.next<1_000_000){
    const seq=service.next++;
    const slot=[0,1].find(candidate=>!service.queue.some(guest=>guest.slot===candidate));
    service.queue.push({seq,recipeId:CAFE_RECIPES[(seq*2+Math.floor(seq/3))%CAFE_RECIPES.length].id,step:0,slot});
    added++;
  }
  return added;
}

export function answerCafeIngredient(service,seq,answer){
  const guest=service.queue.find(guest=>guest.seq===seq);
  if(!guest)return {ok:false,hint:'Гость уже ушёл.'};
  const recipe=CAFE_RECIPE_BY_ID[guest.recipeId];
  const step=recipe.steps[guest.step];
  if(!step)return {ok:false,hint:'Заказ уже готов, его осталось подать.'};
  if(answer!==step.answer)return {ok:false,hint:step.hint};
  const picked=step.options.find(option=>option[0]===answer)[1];
  guest.step++;
  return {ok:true,complete:guest.step===recipe.steps.length,picked};
}

export function serveCafeGuest(service,seq){
  const index=service.queue.findIndex(guest=>guest.seq===seq);
  if(index<0)return null;
  const guest=service.queue[index];
  if(guest.step!==CAFE_RECIPE_BY_ID[guest.recipeId].steps.length)return null;
  service.queue.splice(index,1);
  return guest;
}
