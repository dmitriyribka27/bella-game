import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chooseStoredSave,secondsSince,saveMarker,requestPersistentStorage} from '../docs/save-health.js';

const good=s=>s&&s.version===14&&Number.isInteger(s.coins)&&s.coins>=0;
const original={version:14,coins:31,savedAt:1_000};
const backup={version:14,coins:30,savedAt:900};

test('prefers valid primary, but restores a newer or only intact backup',()=>{
  assert.deepEqual(chooseStoredSave(original,backup,good),{source:original,recovered:false,primaryOk:true,backupOk:true});
  const ahead={...backup,savedAt:1_100};
  assert.equal(chooseStoredSave(original,ahead,good).source,ahead);
  assert.equal(chooseStoredSave({...original,coins:-100},backup,good).source,backup);
  assert.equal(chooseStoredSave(null,backup,good).recovered,true);
  assert.equal(chooseStoredSave(null,{...backup,coins:-1},good).source,null);
  assert.equal(chooseStoredSave({...original,version:13},{...backup,version:14},s=>s&&[13,14].includes(s.version)).recovered,true);
});

test('time checks ignore clock rollback and invalid timestamps',()=>{
  assert.equal(secondsSince(1_000,3_500),2.5);
  assert.equal(secondsSince(9_000,3_500),0);
  assert.equal(secondsSince(Infinity,3_500),0);
  assert.equal(saveMarker(original),'14:1000');
  assert.equal(saveMarker({version:14,savedAt:Infinity}),null);
});

test('city checks both records, serializes commits, and guards other tabs',()=>{
  const page=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
  assert.match(page,/chooseStoredSave\(saved,previous,valid\)/);
  assert.match(page,/const operation=saveQueue\.then/);
  assert.match(page,/saveMarker\(existing\)!==lastStoredMarker/);
  assert.match(page,/store\.put\(backup,'previous'\)/);
  assert.match(page,/window\.addEventListener\('pagehide',suspendForBackground\)/);
  assert.match(page,/window\.addEventListener\('pageshow'/);
  assert.match(page,/id="checkSave"/);
  assert.match(page,/id="offlineCacheStatus"/);
  assert.match(page,/requestPersistentStorage\(navigator\.storage\)/);
  assert.match(page,/Хранение прогресса:/);
});

test('persistent storage is requested on user action and reports all outcomes',async()=>{
  let called=false;
  const request=requestPersistentStorage({persist(){called=true;return Promise.resolve(true);}});
  assert.equal(called,true,'request begins synchronously in the button click');
  assert.equal(await request,'granted');
  assert.equal(await requestPersistentStorage({persist:async()=>false}),'denied');
  assert.equal(await requestPersistentStorage(undefined),'unsupported');
  assert.equal(await requestPersistentStorage({persist:async()=>{throw Error('blocked');}}),'error');
});
