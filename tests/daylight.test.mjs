import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GAME_DAY_SECONDS} from '../docs/game-time.js';
import {LIGHTING_STORAGE_KEY,minuteOfGameDay,lightingForMinute,lightingForClock,readLightingEnabled,saveLightingEnabled} from '../docs/daylight.js';

const clockAt=(hour,minute=0)=>({activeSeconds:(((hour*60+minute-480+1440)%1440)/1440)*GAME_DAY_SECONDS});

test('lighting follows the existing 30-minute game clock, including midnight',()=>{
  assert.equal(minuteOfGameDay({activeSeconds:0}),8*60);
  assert.equal(lightingForClock(clockAt(15)).phase,'day');
  assert.equal(lightingForClock(clockAt(19)).phase,'evening');
  assert.equal(lightingForClock(clockAt(23)).phase,'night');
  assert.equal(lightingForClock(clockAt(6,30)).phase,'dawn');
  assert.ok(Math.abs(minuteOfGameDay(clockAt(0)))<.00001);
});

test('day stays unfiltered; sunset, night, and sunrise blend smoothly',()=>{
  assert.equal(lightingForMinute(12*60).opacity,0);
  assert.equal(lightingForMinute(8*60).opacity,0);
  assert.ok(lightingForMinute(19*60).opacity>.15);
  assert.ok(lightingForMinute(23*60).opacity>.28);
  assert.ok(lightingForMinute(6*60+30).opacity>.05);
  assert.ok(lightingForMinute(6*60+30).opacity<.2);
  assert.ok(Math.abs(lightingForMinute(1439.99).opacity-lightingForMinute(0).opacity)<.001);
  const before=lightingForMinute(18*60-0.1).opacity;
  const after=lightingForMinute(18*60+0.1).opacity;
  assert.ok(Math.abs(before-after)<.01,'no sudden color jump at sunset');
});

test('lighting preference stays independent from game saves',()=>{
  const memory=new Map();
  const storage={getItem:key=>memory.get(key),setItem:(key,value)=>memory.set(key,value)};
  assert.equal(readLightingEnabled(storage),true);
  assert.equal(saveLightingEnabled(storage,false),false);
  assert.equal(memory.get(LIGHTING_STORAGE_KEY),'off');
  assert.equal(readLightingEnabled(storage),false);
  assert.equal(saveLightingEnabled(storage,true),true);
  assert.equal(readLightingEnabled(storage),true);
  assert.equal(readLightingEnabled({getItem:()=>{throw Error('denied');}}),true);
});

test('lightweight tint sits above image layers and below game UI',()=>{
  const html=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
  const tint=html.indexOf('<div id="timeTint"'),map=html.indexOf('<canvas id="world"'),tags=html.indexOf('<div id="catLabels"');
  assert.ok(map<tint&&tint<tags);
  assert.match(html,/#timeTint\s*\{[^}]*pointer-events:none;/);
  assert.match(html,/function updateGameClock\(\)\s*\{[\s\S]*?updateLighting\(\);/);
  assert.match(html,/data-lighting-toggle/);
  assert.match(html,/lightPreview/);
  assert.match(html,/previewMinute===null\?lightingForClock\(city\.clock\):lightingForMinute\(previewMinute\)/);
  const mapSource=readFileSync(new URL('../docs/map2d.js',import.meta.url),'utf8');
  assert.doesNotMatch(mapSource,/timeTint/,'the expensive tile drawing pipeline is untouched');
});
