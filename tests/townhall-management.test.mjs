import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TOWN_HALL_FESTIVAL_COST,TOWN_HALL_FESTIVAL_MOOD,getTownHallReport,issueTownHallOrder,holdTownHallFestival} from '../docs/townhall-management.js';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const residentIds=['kent','mia','lev','citera','ryzhiy'];
const createCity=()=>({
  coins:50,
  cats:[...residentIds.map((id,index)=>({id,hunger:60+index,energy:55+index,mood:50+index*10,activity:index<2?'work':'rest',target:[index,2],phase:3})),
    {id:'bella',hunger:100,energy:100,mood:100,activity:'walk',target:[2,3],phase:1}]
});
const definitions=Object.fromEntries(residentIds.map((id,index)=>[id,{home:[index,0],work:[index,8]}]));

test('city report reflects the existing five residents and never includes Bella in the average',()=>{
  const city=createCity(),before=structuredClone(city),report=getTownHallReport(city);
  assert.equal(report.coins,50);
  assert.equal(report.averageMood,70);
  assert.equal(report.averageEnergy,57);
  assert.equal(report.working,2);
  assert.equal(report.resting,3);
  assert.equal(report.hungry,0);
  assert.deepEqual(report.residents.map(c=>c.id),residentIds);
  assert.deepEqual(city,before);
});

test('work order sends only healthy cats to existing jobs without granting free coins',()=>{
  const city=createCity();city.cats[0].energy=20;city.cats[1].hunger=20;
  const oldKentTarget=[...city.cats[0].target];
  const result=issueTownHallOrder(city,'work',definitions,[5,5]);
  assert.deepEqual(result,{ok:true,ordered:3,skipped:2});
  assert.deepEqual(city.cats[0].target,oldKentTarget);
  assert.equal(city.cats[1].activity,'work'); // Already working; not reassigned while hungry.
  for(let index=2;index<5;index++){
    assert.equal(city.cats[index].activity,'work');
    assert.deepEqual(city.cats[index].target,definitions[residentIds[index]].work);
    assert.equal(city.cats[index].phase,0);
  }
  assert.equal(city.coins,50);
  assert.deepEqual(city.cats[5].target,[2,3]);
});

test('rest and walk orders change existing targets and return to the normal city simulation',()=>{
  const city=createCity();
  assert.deepEqual(issueTownHallOrder(city,'rest',definitions,[5,5]),{ok:true,ordered:5,skipped:0});
  residentIds.forEach((id,index)=>{
    assert.equal(city.cats[index].activity,'rest');
    assert.deepEqual(city.cats[index].target,definitions[id].home);
  });
  assert.deepEqual(city.cats[5].target,[2,3]);
  assert.deepEqual(issueTownHallOrder(city,'walk',definitions,[6,7]),{ok:true,ordered:6,skipped:0});
  assert.ok(city.cats.every(cat=>cat.activity==='walk'&&cat.target[0]===6&&cat.target[1]===7));
  assert.deepEqual(issueTownHallOrder(city,'invalid',definitions,[6,7]),{ok:false,reason:'invalid',ordered:0,skipped:0});
  assert.equal(city.coins,50);
});

test('festival uses existing coins and caps each cat mood at 100',()=>{
  const city=createCity();
  assert.equal(TOWN_HALL_FESTIVAL_COST,15);
  assert.equal(TOWN_HALL_FESTIVAL_MOOD,12);
  const result=holdTownHallFestival(city);
  assert.deepEqual(result,{ok:true,spent:15,residents:5,moodGained:58});
  assert.equal(city.coins,35);
  assert.deepEqual(city.cats.slice(0,5).map(cat=>cat.mood),[62,72,82,92,100]);
  assert.equal(city.cats[5].mood,100);
});

test('festival refuses insufficient funds or full mood without changing any state',()=>{
  const city=createCity();city.coins=14;
  const oldCity=structuredClone(city);
  assert.deepEqual(holdTownHallFestival(city),{ok:false,reason:'funds',spent:0});
  assert.deepEqual(city,oldCity);
  city.coins=30;city.cats.slice(0,5).forEach(cat=>{cat.mood=100;});
  const allHappy=structuredClone(city);
  assert.deepEqual(holdTownHallFestival(city),{ok:false,reason:'full',spent:0});
  assert.deepEqual(city,allHappy);
});

test('town hall UI wires all three actions without adding a save format',()=>{
  assert.match(app,/from "\.\/townhall-management\.js\?v=1"/);
  for(const panel of ['report','orders','festival'])assert.ok(app.includes(`data-town-hall-open="${panel}"`));
  for(const order of ['work','rest','walk'])assert.ok(app.includes(`data-town-hall-order="${order}"`));
  assert.match(app,/data-town-hall-celebrate/);
  assert.match(app,/data-town-hall-back="\$\{returnView\}"/);
  assert.match(app,/issueTownHallOrder\(city,order,byId,NODES\.square\)/);
  assert.match(app,/holdTownHallFestival\(city\)/);
  assert.match(app,/getTownHallReport\(city\)/);
  assert.match(app,/const FORMAT=13/);
  assert.match(app,/город Беллы · версия 0\.9\.21 · 2D/);
});
