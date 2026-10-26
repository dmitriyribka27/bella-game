// A friendly, virtual-coin fruit machine in the lighthouse. No real-money wagers.
// Outcomes are weighted by prize class, not independent reels, so their odds stay explicit.
export const SLOT_STAKES=Object.freeze([5,10,15,20,30,40,50]);
export const SLOT_FREE_BET=5;
export const SLOT_OUTCOMES=Object.freeze([
  {id:'pair',label:'Две одинаковые',chance:10,multiplier:1},
  {id:'cherry',label:'Три вишенки',chance:15,multiplier:1.1,emoji:'🍒'},
  {id:'lemon',label:'Три лимона',chance:30,multiplier:1.2,emoji:'🍋'},
  {id:'orange',label:'Три апельсина',chance:30,multiplier:1.4,emoji:'🍊'},
  {id:'grape',label:'Три виноградины',chance:10,multiplier:5,emoji:'🍇'},
  {id:'different',label:'Все разные',chance:5,multiplier:0}
]);
const FRUITS=['🍒','🍋','🍊','🍇'];
const PAIR_WEIGHTS=[60,22,13,5];
const INT_LIMIT=10000000;

function unit(random){
  const value=random();
  return Number.isFinite(value)?Math.max(0,Math.min(0.9999999999999999,value)):0;
}
function pickWeighted(weights,random){
  let value=unit(random)*weights.reduce((sum,weight)=>sum+weight,0);
  for(let i=0;i<weights.length;i++){
    if(value<weights[i])return i;
    value-=weights[i];
  }
  return weights.length-1;
}
function shuffle(symbols,random){
  for(let i=symbols.length-1;i>0;i--){
    const j=Math.floor(unit(random)*(i+1));
    [symbols[i],symbols[j]]=[symbols[j],symbols[i]];
  }
  return symbols;
}
function symbolsFor(outcome,random){
  if(outcome.emoji)return [outcome.emoji,outcome.emoji,outcome.emoji];
  if(outcome.id==='pair'){
    const matching=pickWeighted(PAIR_WEIGHTS,random);
    const other=FRUITS.filter((_,index)=>index!==matching);
    return shuffle([FRUITS[matching],FRUITS[matching],other[Math.floor(unit(random)*other.length)]],random);
  }
  throw Error('Unexpected slot outcome');
}
export function drawSlotResult(random=Math.random){
  const outcome=SLOT_OUTCOMES[pickWeighted(SLOT_OUTCOMES.map(item=>item.chance),random)];
  // Three distinct symbols are always a losing combination. Rotate which fruit is omitted.
  let symbols;
  if(outcome.id==='different'){
    const omitted=Math.floor(unit(random)*FRUITS.length);
    symbols=shuffle(FRUITS.filter((_,index)=>index!==omitted),random);
  }else symbols=symbolsFor(outcome,random);
  return {category:outcome.id,symbols,multiplier:outcome.multiplier};
}
export function newLighthouseSlotState(){
  return {freeDay:0,spins:0,spent:0,won:0,last:null};
}
export function sanitizeLighthouseSlotState(input){
  const out=newLighthouseSlotState();
  if(!input||typeof input!=='object')return out;
  for(const key of ['freeDay','spins','spent','won']){
    if(Number.isSafeInteger(input[key])&&input[key]>=0)out[key]=Math.min(INT_LIMIT,input[key]);
  }
  const last=input.last;
  if(last&&typeof last==='object'&&SLOT_OUTCOMES.some(item=>item.id===last.category)
    &&Array.isArray(last.symbols)&&last.symbols.length===3&&last.symbols.every(value=>FRUITS.includes(value))
    &&Number.isSafeInteger(last.bet)&&SLOT_STAKES.includes(last.bet)
    &&Number.isSafeInteger(last.prize)&&last.prize>=0&&last.prize<=250){
    out.last={category:last.category,symbols:[...last.symbols],bet:last.bet,prize:last.prize,free:!!last.free};
  }
  return out;
}
export function spinLighthouseSlots(city,{bet=5,free=false,day},random=Math.random){
  if(!city||!Number.isSafeInteger(city.coins)||city.coins<0||city.coins>INT_LIMIT)return {ok:false,reason:'state'};
  if(!Number.isSafeInteger(day)||day<1)return {ok:false,reason:'day'};
  if(!SLOT_STAKES.includes(bet)||free&&bet!==SLOT_FREE_BET)return {ok:false,reason:'bet'};
  const state=sanitizeLighthouseSlotState(city.lighthouseSlots);
  if(free&&state.freeDay===day)return {ok:false,reason:'free-used'};
  const debit=free?0:bet;
  if(city.coins<debit)return {ok:false,reason:'funds',shortfall:debit-city.coins};

  const result=drawSlotResult(random);
  const prize=Math.round(bet*result.multiplier);
  const nextBalance=city.coins-debit+prize;
  if(!Number.isSafeInteger(nextBalance)||nextBalance>INT_LIMIT)return {ok:false,reason:'limit'};
  state.spins=Math.min(INT_LIMIT,state.spins+1);
  state.spent=Math.min(INT_LIMIT,state.spent+debit);
  state.won=Math.min(INT_LIMIT,state.won+prize);
  if(free)state.freeDay=day;
  state.last={category:result.category,symbols:result.symbols,bet,prize,free};
  city.coins=nextBalance;
  city.lighthouseSlots=state;
  return {ok:true,...state.last,spent:debit,delta:prize-debit,balance:nextBalance};
}
