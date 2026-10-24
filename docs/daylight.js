import {GAME_DAY_SECONDS,GAME_START_MINUTE} from './game-time.js';

export const LIGHTING_STORAGE_KEY='quiet-bay-lighting-v1';

// The map itself remains unchanged. These are translucent colors rendered above
// the finished background, high-resolution patches and moving cat sprites.
const LIGHT_STOPS=[
  {minute:0,rgba:[19,40,81,.32]},       // deep night
  {minute:330,rgba:[19,40,81,.32]},     // 05:30: night starts giving way
  {minute:360,rgba:[101,91,127,.25]},
  {minute:390,rgba:[239,165,113,.12]},  // 06:30: warm sunrise
  {minute:420,rgba:[255,255,255,0]},   // 07:00: full daylight
  {minute:1050,rgba:[255,255,255,0]},  // 17:30: sun starts setting
  {minute:1080,rgba:[255,170,104,.08]},
  {minute:1140,rgba:[220,115,95,.19]},
  {minute:1260,rgba:[119,86,130,.24]}, // 21:00: late dusk
  {minute:1320,rgba:[19,40,81,.32]},   // 22:00: full night
  {minute:1440,rgba:[19,40,81,.32]}
];

export function minuteOfGameDay(clock){
  const seconds=Number.isFinite(clock?.activeSeconds)?Math.max(0,clock.activeSeconds):0;
  return (GAME_START_MINUTE+seconds*1440/GAME_DAY_SECONDS)%1440;
}

export function lightingForMinute(minute){
  const normalized=((Number.isFinite(minute)?minute:GAME_START_MINUTE)%1440+1440)%1440;
  const phase=normalized>=420&&normalized<1080?'day':normalized>=1080&&normalized<1320?'evening':normalized>=360&&normalized<420?'dawn':'night';
  const nextIndex=LIGHT_STOPS.findIndex(stop=>stop.minute>=normalized);
  const end=LIGHT_STOPS[nextIndex],start=LIGHT_STOPS[Math.max(0,nextIndex-1)];
  const progress=end.minute===start.minute?0:(normalized-start.minute)/(end.minute-start.minute);
  const eased=progress*progress*(3-2*progress);
  const rgba=start.rgba.map((value,index)=>value+(end.rgba[index]-value)*eased);
  const [r,g,b,a]=rgba;
  return {phase,minute:normalized,opacity:a,color:`rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a.toFixed(3)})`};
}

export function lightingForClock(clock){return lightingForMinute(minuteOfGameDay(clock));}

// Street lamps and lit windows appear *only* during the night (22:00–06:00).
// A short fade at either edge avoids sudden flashes when the game clock ticks.
export function nightGlowStrengthForMinute(minute){
  const time=((Number.isFinite(minute)?minute:GAME_START_MINUTE)%1440+1440)%1440;
  if(time>=1320){const t=Math.min(1,(time-1320)/15);return t*t*(3-2*t);}
  if(time<360){const t=Math.min(1,(360-time)/15);return t*t*(3-2*t);}
  return 0;
}

export function readLightingEnabled(storage){
  try{return storage?.getItem(LIGHTING_STORAGE_KEY)!=='off';}catch{return true;}
}

export function saveLightingEnabled(storage,enabled){
  try{storage?.setItem(LIGHTING_STORAGE_KEY,enabled?'on':'off');}catch{}
  return !!enabled;
}
