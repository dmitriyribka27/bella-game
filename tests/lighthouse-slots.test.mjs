import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SLOT_STAKES,SLOT_OUTCOMES,newLighthouseSlotState,sanitizeLighthouseSlotState,
  drawSlotResult,spinLighthouseSlots
} from '../docs/lighthouse-slots.js';

test('six outcomes have the exact approved odds and rewards',()=>{
  assert.deepEqual(SLOT_OUTCOMES.map(v=>v.chance),[10,15,30,30,10,5]);
  assert.deepEqual(SLOT_OUTCOMES.map(v=>v.multiplier),[1,1.1,1.2,1.4,5,0]);
  assert.equal(SLOT_OUTCOMES.reduce((total,v)=>total+v.chance,0),100);
  assert.deepEqual(SLOT_STAKES,[5,10,15,20,30,40,50]);
  const expectations=[
    [.05,'pair'],[.12,'cherry'],[.4,'lemon'],[.69,'orange'],[.91,'grape'],[.99,'different']
  ];
  for(const [value,outcome] of expectations){
    const result=drawSlotResult(()=>value);
    assert.equal(result.category,outcome);
    assert.equal(result.symbols.length,3);
    const distinct=new Set(result.symbols).size;
    assert.equal(distinct,outcome==='pair'?2:outcome==='different'?3:1);
  }
});

test('spins use only virtual existing coins and persist a bounded last result',()=>{
  const city={coins:100,lighthouseSlots:newLighthouseSlotState()};
  const win=spinLighthouseSlots(city,{bet:50,day:1},()=>.91);
  assert.equal(win.category,'grape');
  assert.equal(win.prize,250);
  assert.equal(city.coins,300);
  assert.equal(city.lighthouseSlots.spent,50);
  assert.equal(city.lighthouseSlots.won,250);
  assert.equal(city.lighthouseSlots.spins,1);
  assert.equal(city.lighthouseSlots.last.symbols.join(''),'🍇🍇🍇');
  const failed=spinLighthouseSlots(city,{bet:50,day:1},()=>.99);
  assert.equal(failed.prize,0);
  assert.equal(city.coins,250);
  assert.deepEqual(sanitizeLighthouseSlotState(JSON.parse(JSON.stringify(city.lighthouseSlots))),city.lighthouseSlots);
});

test('one no-cost five-coin spin per in-game day cannot be claimed twice',()=>{
  const city={coins:0,lighthouseSlots:newLighthouseSlotState()};
  const first=spinLighthouseSlots(city,{bet:5,free:true,day:1},()=>.12);
  assert.equal(first.ok,true);
  assert.equal(first.spent,0);
  assert.equal(first.prize,6);
  assert.equal(city.coins,6);
  const again=spinLighthouseSlots(city,{bet:5,free:true,day:1},()=>.91);
  assert.equal(again.reason,'free-used');
  assert.equal(city.coins,6);
  const next=spinLighthouseSlots(city,{bet:5,free:true,day:2},()=>.99);
  assert.equal(next.ok,true);
  assert.equal(next.prize,0);
  assert.equal(city.coins,6);
  assert.equal(city.lighthouseSlots.freeDay,2);
  assert.equal(spinLighthouseSlots(city,{bet:50,free:true,day:3}).reason,'bet');
});

test('invalid bets and insufficient balance never mutate wallet',()=>{
  const city={coins:7};
  assert.equal(spinLighthouseSlots(city,{bet:50,day:1}).reason,'funds');
  assert.equal(spinLighthouseSlots(city,{bet:11,day:1}).reason,'bet');
  assert.equal(spinLighthouseSlots(city,{bet:5,day:0}).reason,'day');
  assert.equal(city.coins,7);
  assert.equal(city.lighthouseSlots,undefined);
  assert.deepEqual(sanitizeLighthouseSlotState({freeDay:-5,spins:Infinity,last:{symbols:['x']}}),newLighthouseSlotState());
});
