// A small, finite star journal for Mia. Discovery progress lives in the existing
// city save; temporary telescope adjustments deliberately are not persisted.
export const OBSERVATORY_DISCOVERIES=Object.freeze([
  {id:'sail',name:'Парус над бухтой',icon:'⛵',direction:'sea',focus:'far',pattern:'triangle',hint:'Далеко над морем три огонька складываются в острый парус.',story:'Мия задерживает взгляд на звёздном парусе. Даже в самую тихую ночь кто-то готов отправиться в путешествие.'},
  {id:'paws',name:'Следы на небе',icon:'🐾',direction:'north',focus:'near',pattern:'trail',hint:'Невысоко на севере четыре огонька тянутся друг за другом, будто чьи-то следы.',story:'Похоже, в небе тоже гуляют коты. Мия осторожно касается лапкой карты звёзд, а Белла улыбается.'},
  {id:'beacon',name:'Небесный маяк',icon:'⚓',direction:'cliff',focus:'far',pattern:'beacon',hint:'Далеко над скалами один яркий свет стоит выше двух маленьких.',story:'На карте появляется маяк, который никому не нужно зажигать: он уже светит над Тихой бухтой.'},
  {id:'family',name:'Пять огоньков',icon:'✨',direction:'north',focus:'far',pattern:'ring',hint:'Далеко на севере пять светлых точек образуют маленький круг.',story:'Мия находит пять звёзд рядом. Белла знает, кого они напоминают: Кента, Цитеру, Льва, Рыжего и саму Мию.'},
  {id:'wave',name:'Серебряная волна',icon:'🌊',direction:'sea',focus:'near',pattern:'wave',hint:'Над ближним морским горизонтом огоньки изгибаются плавной волной.',story:'Мия смотрит на созвездие, а потом на море. Обе волны тихие, и обе хочется запомнить.'},
  {id:'crescent',name:'Лунная тропинка',icon:'🌙',direction:'cliff',focus:'near',pattern:'crescent',hint:'Рядом со скалами звёздочки повторяют изгиб тонкого месяца.',story:'В мягком свете Мия чувствует себя спокойно. Белла оставляет в журнале маленькую звёздную тропинку.'}
]);

export const OBSERVATORY_DIRECTIONS=Object.freeze([
  {id:'sea',label:'🌊 Море'},
  {id:'north',label:'🧭 Север'},
  {id:'cliff',label:'⛰️ Скалы'}
]);
export const OBSERVATORY_FOCUS=Object.freeze([
  {id:'near',label:'Ближе'},
  {id:'far',label:'Вдаль'}
]);
export const OBSERVATORY_PATTERNS=Object.freeze([
  {id:'triangle',label:'Три огонька треугольником',glyph:'✦  ·  ✦'},
  {id:'trail',label:'Четыре точки следом',glyph:'✧ · ✧ ·'},
  {id:'beacon',label:'Один огонёк над парой',glyph:'✦  ⸱  ⸱'},
  {id:'ring',label:'Пять звёзд кольцом',glyph:'✧ ✦ ✧ ✦ ✧'},
  {id:'wave',label:'Зигзаг как волна',glyph:'✧﹏✦﹏✧'},
  {id:'crescent',label:'Дуга как месяц',glyph:'☾ ✧ ✧'}
]);

const byId=Object.fromEntries(OBSERVATORY_DISCOVERIES.map(item=>[item.id,item]));

export function newObservatoryState(){return {found:[]};}

export function sanitizeObservatoryState(value){
  if(!value||!Array.isArray(value.found))return newObservatoryState();
  return {found:[...new Set(value.found.filter(id=>typeof id==='string'&&Object.hasOwn(byId,id)))].slice(0,OBSERVATORY_DISCOVERIES.length)};
}

export function nextObservatoryDiscovery(state,replayIndex=0){
  const saved=new Set(sanitizeObservatoryState(state).found);
  return OBSERVATORY_DISCOVERIES.find(item=>!saved.has(item.id))||OBSERVATORY_DISCOVERIES[Math.abs(Math.trunc(Number(replayIndex)||0))%OBSERVATORY_DISCOVERIES.length];
}

export function telescopeIsAligned(id,direction,focus){
  const target=byId[id];
  return !!target&&target.direction===direction&&target.focus===focus;
}

export function skyPatternsFor(id){
  const index=OBSERVATORY_DISCOVERIES.findIndex(item=>item.id===id);
  if(index<0)return [];
  const target=byId[id];
  const ids=[target.pattern,OBSERVATORY_DISCOVERIES[(index+2)%OBSERVATORY_DISCOVERIES.length].pattern,OBSERVATORY_DISCOVERIES[(index+4)%OBSERVATORY_DISCOVERIES.length].pattern];
  const order=[ids[1],ids[0],ids[2]];
  if(index%2)order.reverse();
  return order.map(pattern=>OBSERVATORY_PATTERNS.find(item=>item.id===pattern));
}

export function recordObservatoryDiscovery(state,id,pattern){
  const target=byId[id];
  if(!target||pattern!==target.pattern||!state||!Array.isArray(state.found))return {ok:false,newlyFound:false};
  if(state.found.includes(id))return {ok:true,newlyFound:false,discovery:target};
  state.found.push(id);
  return {ok:true,newlyFound:true,discovery:target};
}
