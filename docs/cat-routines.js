import {MIN_WORK_NEED,canStartWork} from './game-economy.js';

// These are preferences, not obligations: the player can choose any activity
// at any hour. A cat consults the routine only when the *current* action ends.
const BASE_WEIGHTS=Object.freeze({
  morning:Object.freeze({work:10,eat:42,rest:5,play:20,walk:23}),
  day:Object.freeze({work:56,eat:4,rest:4,play:24,walk:12}),
  evening:Object.freeze({work:3,eat:27,rest:10,play:40,walk:20}),
  night:Object.freeze({work:0,eat:12,rest:76,play:4,walk:8})
});

export function catRoutinePeriod(minute){
  const time=((Number.isFinite(minute)?minute:480)%1440+1440)%1440;
  if(time<360||time>=1320)return 'night';
  if(time<600)return 'morning';
  if(time<1080)return 'day';
  return 'evening';
}

export function catRoutineWeights(cat,minute){
  const period=catRoutinePeriod(minute);
  const weights={...BASE_WEIGHTS[period]};
  if(!cat||cat.id==='bella')return {work:0,eat:0,rest:0,play:0,walk:1};
  // Needs outweigh the clock. The budget and existing work requirements stay intact.
  if(!canStartWork(cat))weights.work=0;
  if(cat.hunger>=82)weights.eat=0;
  else if(cat.hunger<55)weights.eat+=38;
  if(period!=='night'&&cat.energy>=90)weights.rest=0;
  else if(cat.energy<55)weights.rest+=38;
  if(cat.mood<45)weights.play+=25;
  return weights;
}

export function chooseCatRoutine(cat,minute,random=Math.random){
  if(!cat||cat.id==='bella')return 'walk';
  if(cat.hunger<MIN_WORK_NEED)return 'eat';
  if(cat.energy<MIN_WORK_NEED)return 'rest';
  if(cat.mood<25)return 'play';
  const weights=catRoutineWeights(cat,minute);
  const total=Object.values(weights).reduce((sum,w)=>sum+w,0);
  const sample=random();
  const roll=Number.isFinite(sample)?Math.max(0,Math.min(.999999,sample)):0;
  // The injected random source is used exactly once to make tests deterministic.
  let remaining=roll*total;
  for(const [activity,weight] of Object.entries(weights)){
    if(weight<=0)continue;
    if(remaining<weight)return activity;
    remaining-=weight;
  }
  return 'walk';
}
