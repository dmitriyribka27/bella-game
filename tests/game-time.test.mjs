import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GAME_DAY_SECONDS,OFFLINE_COIN_CAP,newGameClock,sanitizeGameClock,advanceGameClock,gameClockDisplay,creditOfflineCoins} from '../docs/game-time.js';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');

test('game days last thirty minutes of active time and begin in the morning',()=>{
  assert.equal(GAME_DAY_SECONDS,1800);
  const clock=newGameClock();
  assert.deepEqual(gameClockDisplay(clock),{time:'08:00',day:1});
  assert.equal(advanceGameClock(clock,600),true);
  assert.deepEqual(gameClockDisplay(clock),{time:'16:00',day:1});
  advanceGameClock(clock,600);
  assert.deepEqual(gameClockDisplay(clock),{time:'00:00',day:2});
  advanceGameClock(clock,600);
  assert.deepEqual(gameClockDisplay(clock),{time:'08:00',day:2});
  assert.equal(advanceGameClock(clock,-5),false);
});

test('offline coins are at most one per real hour with rollover and twelve-coin cap',()=>{
  const city={clock:newGameClock(),coins:30,paused:false};
  assert.equal(creditOfflineCoins(city,1800),0);
  assert.equal(city.clock.offlineRemainderSeconds,1800);
  assert.equal(creditOfflineCoins(city,1800),1);
  assert.equal(city.coins,31);
  assert.equal(creditOfflineCoins(city,4*3600),4);
  assert.equal(city.coins,35);
  assert.equal(creditOfflineCoins(city,24*3600),OFFLINE_COIN_CAP);
  assert.equal(city.coins,47);
  assert.equal(creditOfflineCoins(city,0),0);
});

test('paused cities gain no offline coins and saved clock state safely survives migration',()=>{
  const city={clock:newGameClock(),coins:20,paused:true};
  assert.equal(creditOfflineCoins(city,24*3600),0);
  assert.equal(city.coins,20);
  assert.deepEqual(sanitizeGameClock(undefined),newGameClock());
  assert.deepEqual(sanitizeGameClock({activeSeconds:90,offlineRemainderSeconds:1200}),{activeSeconds:90,offlineRemainderSeconds:1200});
  assert.deepEqual(sanitizeGameClock({activeSeconds:-40,offlineRemainderSeconds:400000}),{activeSeconds:0,offlineRemainderSeconds:3599});
});

test('game clock pauses when hidden, resumes without catching up, and persists in saved city',()=>{
  assert.match(app,/clock:newGameClock\(\)/);
  assert.match(app,/out\.clock=sanitizeGameClock\(s\.clock\)/);
  assert.match(app,/if\(city\.paused\|\|document\.hidden\)return/);
  assert.match(app,/advanceGameClock\(city\.clock,dt\)/);
  assert.match(app,/offline\(elapsed\)/);
  assert.match(app,/id="gameClock"/);
  assert.match(app,/const FORMAT=14/);
  assert.match(app,/\[1,2,3,4,5,6,7,8,9,10,11,12,13,FORMAT\]/);
});
