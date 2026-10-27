// A deliberately modest town economy: fixed wages, optional treats and small services.
export const WORK_SHIFT_SECONDS=90;
export const MIN_WORK_NEED=35;
export const WORK_WAGES=Object.freeze({kent:5,mia:4,lev:6,citera:4,ryzhiy:5,bella:5});

export const MANUAL_FEED_COST=4;
export const MANUAL_FEED_HUNGER=35;
export const MANUAL_FEED_MOOD=3;
export const HOSPITAL_COST=20;
export const CAFE_OPENING_COST=150;
export const CAFE_GUEST_INTERVAL_MS=30000;

export const CAFE_RECIPE_EARNINGS=Object.freeze({
  tea:5,bun:6,espresso:6,cocoa:7,cappuccino:8,
  vanilla_latte:9,matcha:9,iced_caramel:10
});

const clamp100=value=>Math.max(0,Math.min(100,value));
export function canStartWork(resident){
  return !!resident&&Object.hasOwn(WORK_WAGES,resident.id)&&resident.energy>=MIN_WORK_NEED&&resident.hunger>=MIN_WORK_NEED;
}
export function workWage(resident){
  return resident&&Object.hasOwn(WORK_WAGES,resident.id)?WORK_WAGES[resident.id]:0;
}
export function buyManualFeed(city,residentId){
  if(!city||!Number.isSafeInteger(city.coins)||!Array.isArray(city.cats))return {ok:false,reason:'invalid'};
  const resident=city.cats.find(cat=>cat.id===residentId&&Object.hasOwn(WORK_WAGES,cat.id));
  if(!resident)return {ok:false,reason:'invalid'};
  if(city.coins<MANUAL_FEED_COST)return {ok:false,reason:'funds'};
  city.coins-=MANUAL_FEED_COST;
  resident.hunger=clamp100(resident.hunger+MANUAL_FEED_HUNGER);
  resident.mood=clamp100(resident.mood+MANUAL_FEED_MOOD);
  return {ok:true,cost:MANUAL_FEED_COST};
}
