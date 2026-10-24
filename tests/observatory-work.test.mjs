import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OBSERVATORY_DISCOVERIES,OBSERVATORY_DIRECTIONS,OBSERVATORY_FOCUS,newObservatoryState,sanitizeObservatoryState,nextObservatoryDiscovery,telescopeIsAligned,skyPatternsFor,recordObservatoryDiscovery} from '../docs/observatory-work.js';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');

test('six unique findings each have three distinct, valid sky choices',()=>{
  assert.equal(OBSERVATORY_DISCOVERIES.length,6);
  const ids=OBSERVATORY_DISCOVERIES.map(item=>item.id);
  assert.equal(new Set(ids).size,6);
  for(const item of OBSERVATORY_DISCOVERIES){
    const patterns=skyPatternsFor(item.id);
    assert.equal(patterns.length,3);
    assert.equal(new Set(patterns.map(pattern=>pattern.id)).size,3);
    assert.ok(patterns.some(pattern=>pattern.id===item.pattern));
    assert.ok(OBSERVATORY_DIRECTIONS.some(option=>option.id===item.direction));
    assert.ok(OBSERVATORY_FOCUS.some(option=>option.id===item.focus));
    assert.ok(item.hint&&item.story);
  }
});

test('old saves get an empty journal; corrupt ids and duplicates are safely discarded',()=>{
  assert.deepEqual(sanitizeObservatoryState(undefined),{found:[]});
  assert.deepEqual(sanitizeObservatoryState({found:'not array'}),{found:[]});
  assert.deepEqual(sanitizeObservatoryState({found:['sail',null,'sail','malicious','paws']}),{found:['sail','paws']});
  assert.deepEqual(newObservatoryState(),{found:[]});
});

test('telescope requires both correct direction and focus; wrong answers do not change journal',()=>{
  for(const item of OBSERVATORY_DISCOVERIES){
    assert.equal(telescopeIsAligned(item.id,item.direction,item.focus),true);
    assert.equal(telescopeIsAligned(item.id,'invalid',item.focus),false);
    assert.equal(telescopeIsAligned(item.id,item.direction,'invalid'),false);
  }
  const state=newObservatoryState(),before=structuredClone(state);
  assert.deepEqual(recordObservatoryDiscovery(state,'sail','wrong'),{ok:false,newlyFound:false});
  assert.deepEqual(recordObservatoryDiscovery(state,'invalid','triangle'),{ok:false,newlyFound:false});
  assert.deepEqual(state,before);
});

test('every correct discovery is saved only once; already unlocked scenes can be replayed',()=>{
  const state=newObservatoryState();
  for(const item of OBSERVATORY_DISCOVERIES){
    assert.equal(nextObservatoryDiscovery(state).id,item.id);
    assert.equal(recordObservatoryDiscovery(state,item.id,item.pattern).newlyFound,true);
    assert.equal(recordObservatoryDiscovery(state,item.id,item.pattern).newlyFound,false);
  }
  assert.equal(state.found.length,6);
  assert.equal(nextObservatoryDiscovery(state,0).id,'sail');
  assert.equal(nextObservatoryDiscovery(state,1).id,'paws');
  assert.equal(sanitizeObservatoryState(structuredClone(state)).found.length,6);
});

test('observatory integrates three entry buttons with existing save and no interior image',()=>{
  assert.match(app,/from "\.\/observatory-work\.js\?v=1"/);
  for(const mode of ['align','sky','journal'])assert.ok(app.includes(`data-obs-open="${mode}"`));
  for(const marker of ['data-obs-direction','data-obs-focus','data-obs-check','data-obs-pattern','data-obs-back'])assert.ok(app.includes(marker));
  assert.match(app,/observatory:newObservatoryState\(\)/);
  assert.match(app,/out\.observatory=sanitizeObservatoryState\(s\.observatory\)/);
  assert.match(app,/if\(result\.newlyFound\)changed\(\)/);
  assert.match(app,/const FORMAT=13/);
  assert.match(app,/город Беллы · версия 0\.9\.22 · 2D/);
  assert.doesNotMatch(app,/observatory-v1\.webp|observatoryInterior/);
});
