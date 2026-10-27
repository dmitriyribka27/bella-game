import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOME_POINTS,WORK_POINTS,NODES,route} from '../docs/map2d.js';
import {WORK_SHIFT_SECONDS,canStartWork,workWage} from '../docs/game-economy.js';
import {chooseCatRoutine} from '../docs/cat-routines.js';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');

test('Bella walks the established coastal route from home to the mussel restaurant',()=>{
  assert.deepEqual(WORK_POINTS.bella,NODES.musselRestaurant);
  const path=route(HOME_POINTS.bella,WORK_POINTS.bella);
  assert.deepEqual(path[0],NODES.bella);
  assert.ok(path.some(p=>p[0]===NODES.lighthouseStairs[0]&&p[1]===NODES.lighthouseStairs[1]));
  assert.deepEqual(path.at(-1),NODES.musselRestaurant);
});

test('Bella can work for ordinary wages without serving a mussel order',()=>{
  assert.equal(WORK_SHIFT_SECONDS,90);
  assert.equal(workWage({id:'bella'}),5);
  assert.equal(canStartWork({id:'bella',hunger:35,energy:35}),true);
  assert.equal(canStartWork({id:'bella',hunger:34,energy:100}),false);
  assert.match(app,/musselRestaurant:\{[^\n]*worker:'bella'/);
  assert.match(app,/const reward=workWage\(c\)/);
  assert.match(app,/city\.coins\+=reward/);
  assert.match(app,/\['mia','citera','bella'\]\.includes\(c\.id\)/);
});

test('Bella can sleep, recover, eat, play, work and use her previous home scenes',()=>{
  const bella={id:'bella',hunger:75,energy:70,mood:70};
  assert.equal(chooseCatRoutine(bella,23*60,()=>.3),'rest');
  assert.equal(chooseCatRoutine(bella,14*60,()=>.3),'work');
  assert.match(app,/const activityName=bella&&c\.activity==='rest'&&isNight\?'спит'/);
  assert.match(app,/data-action="work"/);
  assert.match(app,/data-action="rest"/);
  assert.match(app,/data-action="eat"/);
  assert.match(app,/data-action="play"/);
  assert.match(app,/data-action="walk"/);
  assert.match(app,/data-action="bella-home"/);
  assert.match(app,/data-action="mussel-restaurant"/);
  assert.match(app,/sendToLocation\(d\.locationHome,owner,'rest'\)/);
  assert.match(app,/const FORMAT=14/,'existing saves stay compatible');
});
