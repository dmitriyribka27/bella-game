// Thirty minutes of visible, unpaused play correspond to one game day.
// Background time never advances the clock; it only provides a capped coin gift.
export const GAME_DAY_SECONDS=30*60;
export const FAST_FORWARD_MULTIPLIER=5;
export const OFFLINE_COIN_INTERVAL_SECONDS=60*60;
export const OFFLINE_COIN_CAP=12;
export const GAME_START_MINUTE=8*60;

export function toggleTimeSpeed(speed){return speed===FAST_FORWARD_MULTIPLIER?1:FAST_FORWARD_MULTIPLIER;}

export function newGameClock(){return {activeSeconds:0,offlineRemainderSeconds:0};}
export function sanitizeGameClock(input){
  const state=newGameClock();
  if(Number.isFinite(input?.activeSeconds))state.activeSeconds=Math.max(0,Math.min(365*24*60*60,input.activeSeconds));
  if(Number.isFinite(input?.offlineRemainderSeconds))state.offlineRemainderSeconds=Math.max(0,Math.min(OFFLINE_COIN_INTERVAL_SECONDS-1,input.offlineRemainderSeconds));
  return state;
}
export function advanceGameClock(clock,realSeconds){
  if(!clock||!Number.isFinite(realSeconds)||realSeconds<=0)return false;
  clock.activeSeconds+=realSeconds;
  return true;
}
export function gameClockDisplay(clock){
  const elapsed=Number.isFinite(clock?.activeSeconds)?Math.max(0,clock.activeSeconds):0;
  const minutes=Math.floor(elapsed*1440/GAME_DAY_SECONDS)+GAME_START_MINUTE;
  const minuteOfDay=minutes%1440;
  const pad=n=>String(n).padStart(2,'0');
  return {time:`${pad(Math.floor(minuteOfDay/60))}:${pad(minuteOfDay%60)}`,day:Math.floor(minutes/1440)+1};
}
export function creditOfflineCoins(city,elapsedSeconds){
  if(!city||!city.clock||!Number.isFinite(elapsedSeconds)||elapsedSeconds<=0||city.paused)return 0;
  const seconds=Math.max(0,elapsedSeconds)+city.clock.offlineRemainderSeconds;
  const earned=Math.min(OFFLINE_COIN_CAP,Math.floor(seconds/OFFLINE_COIN_INTERVAL_SECONDS));
  city.clock.offlineRemainderSeconds=seconds%OFFLINE_COIN_INTERVAL_SECONDS;
  city.coins+=earned;
  return earned;
}
