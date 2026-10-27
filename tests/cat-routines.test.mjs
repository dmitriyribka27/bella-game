import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {catRoutinePeriod,catRoutineWeights,chooseCatRoutine} from '../docs/cat-routines.js';

const healthy={id:'kent',hunger:65,energy:72,mood:70};

test('four soft routine periods follow game time including midnight',()=>{
  for(const [minute,period] of [[0,'night'],[359,'night'],[360,'morning'],[599,'morning'],[600,'day'],[1079,'day'],[1080,'evening'],[1319,'evening'],[1320,'night'],[1440,'night'],[-60,'night']]){
    assert.equal(catRoutinePeriod(minute),period);
  }
});

test('cats prefer sleep at night, meals in morning, work in day and play at evening',()=>{
  const night=catRoutineWeights(healthy,23*60);
  assert.equal(night.work,0);
  assert.ok(night.rest>night.eat+night.play+night.walk);
  assert.equal(catRoutineWeights(healthy,8*60).eat,42);
  assert.equal(catRoutineWeights(healthy,14*60).work,56);
  assert.equal(catRoutineWeights(healthy,20*60).play,40);
  assert.equal(chooseCatRoutine(healthy,23*60,()=>.3),'rest');
  assert.equal(chooseCatRoutine(healthy,14*60,()=>.3),'work');
  assert.equal(chooseCatRoutine(healthy,20*60,()=>.6),'play');
});

test('real needs override routines and work is never assigned when needs are low',()=>{
  assert.equal(chooseCatRoutine({...healthy,hunger:34},14*60,()=>.2),'eat');
  assert.equal(chooseCatRoutine({...healthy,energy:34},14*60,()=>.2),'rest');
  assert.equal(chooseCatRoutine({...healthy,mood:24},23*60,()=>.2),'play');
  assert.equal(catRoutineWeights({...healthy,hunger:37,energy:34},14*60).work,0);
  assert.equal(catRoutineWeights({...healthy,hunger:95},8*60).eat,0);
  assert.equal(catRoutineWeights({...healthy,energy:95},14*60).rest,0);
});

test('random choice is made exactly once and Bella follows the same gentle routine',()=>{
  let calls=0;
  assert.ok(['work','eat','rest','play','walk'].includes(chooseCatRoutine(healthy,12*60,()=>{calls++;return .99;})));
  assert.equal(calls,1);
  const bella={...healthy,id:'bella'};
  assert.equal(chooseCatRoutine(bella,23*60,()=>.3),'rest');
  assert.equal(chooseCatRoutine(bella,14*60,()=>.3),'work');
  assert.equal(chooseCatRoutine({...bella,hunger:20},14*60,()=>.3),'eat');
});

test('game consults routine only when an action finishes, leaving manual controls intact',()=>{
  const html=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
  assert.match(html,/assign\(c,chooseCatRoutine\(c,minuteOfGameDay\(city\.clock\)\),false\)/);
  assert.match(html,/if\(c\.phase>9\)auto\(c\)/);
  assert.match(html,/if\(c\.phase>10\)auto\(c\)/);
  assert.match(html,/if\(c\.phase>WORK_SHIFT_SECONDS\)/);
  assert.match(html,/const isNight=catRoutinePeriod\(minuteOfGameDay\(city\.clock\)\)==='night'/);
  assert.match(html,/else if\(b\.dataset\.action\)assign\(cat\(selected\),b\.dataset\.action\)/);
  assert.match(html,/const FORMAT=14/,'no save migration or new save fields');
});
