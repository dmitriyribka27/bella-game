import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOME_UPGRADE_MAX_BONUS,HOME_UPGRADE_SECTORS,homeUpgradeBonus,homeUpgradeCost,homeRecoveryRate,purchaseHomeUpgrade} from '../docs/home-upgrades.js';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const ids=['kent','mia','lev','citera','ryzhiy'];
const city=()=>({coins:1000,cats:[...ids.map(id=>({id,upgrades:{bed:0,bowl:0,toy:0}})),{id:'bella',upgrades:{bed:0,bowl:0,toy:0}}]});

test('same three sectors and nine named improvements exist for all cat houses',()=>{
  assert.deepEqual(Object.keys(HOME_UPGRADE_SECTORS),['bed','bowl','toy']);
  assert.equal(HOME_UPGRADE_MAX_BONUS,10);
  for(const [id,sector] of Object.entries(HOME_UPGRADE_SECTORS)){
    assert.equal(sector.steps.length,3,id);
    assert.deepEqual(sector.steps.map(item=>item.bonus),[3,2,5]);
    assert.ok(sector.steps.every(item=>item.name&&item.icon));
    assert.ok(sector.title&&sector.icon&&sector.description);
  }
});

test('existing 0..3 upgrades map to 0, 3, 5 and 10 percent without migration',()=>{
  for(const key of Object.keys(HOME_UPGRADE_SECTORS)){
    for(const [level,expected] of [[0,0],[1,3],[2,5],[3,10]]){
      assert.equal(homeUpgradeBonus({bed:level,bowl:level,toy:level},key),expected);
    }
  }
  assert.equal(homeUpgradeBonus({bed:99},'bed'),0);
});

test('old coin prices are unchanged and prices increase by level',()=>{
  for(const [key,base] of [['bed',20],['bowl',15],['toy',18]]){
    assert.equal(homeUpgradeCost({[key]:0},key),base);
    assert.equal(homeUpgradeCost({[key]:1},key),base*2);
    assert.equal(homeUpgradeCost({[key]:2},key),base*3);
    assert.equal(homeUpgradeCost({[key]:3},key),null);
  }
});

test('successful purchases only change selected resident, sector, and existing coins',()=>{
  const current=city();
  const snapshot=structuredClone(current.cats[1]);
  const first=purchaseHomeUpgrade(current,'kent','bed');
  assert.deepEqual(first,{ok:true,cost:20,level:1,bonus:3,item:HOME_UPGRADE_SECTORS.bed.steps[0]});
  assert.equal(current.coins,980);
  assert.equal(current.cats[0].upgrades.bed,1);
  assert.equal(current.cats[0].upgrades.bowl,0);
  assert.deepEqual(current.cats[1],snapshot);
  assert.equal(purchaseHomeUpgrade(current,'kent','bed').bonus,5);
  assert.equal(purchaseHomeUpgrade(current,'kent','bed').bonus,10);
  const completed=structuredClone(current);
  assert.deepEqual(purchaseHomeUpgrade(current,'kent','bed'),{ok:false,reason:'complete'});
  assert.deepEqual(current,completed);
});

test('insufficient funds and invalid owners cannot spend coins or raise levels',()=>{
  const current=city();current.coins=14;
  const original=structuredClone(current);
  assert.deepEqual(purchaseHomeUpgrade(current,'lev','bowl'),{ok:false,reason:'funds',shortfall:1});
  assert.deepEqual(purchaseHomeUpgrade(current,'bella','bowl'),{ok:false,reason:'invalid'});
  assert.deepEqual(purchaseHomeUpgrade(current,'unknown','toy'),{ok:false,reason:'invalid'});
  assert.deepEqual(purchaseHomeUpgrade(current,'kent','unknown'),{ok:false,reason:'invalid'});
  assert.deepEqual(current,original);
});

test('boosts apply exclusively to existing sleep, eating and playing recovery rates',()=>{
  const state={bed:3,bowl:2,toy:1};
  assert.equal(homeRecoveryRate('rest',state),1.5*1.1);
  assert.equal(homeRecoveryRate('eat',state),1.7*1.05);
  assert.equal(homeRecoveryRate('play',state),1.5*1.03);
  assert.equal(homeRecoveryRate('work',state),0);
  assert.equal(homeRecoveryRate('rest',{bed:0,bowl:0,toy:0}),1.5);
});

test('home-management UI uses a separate panel with all three sectors and old saves',()=>{
  assert.match(app,/from "\.\/home-upgrades\.js\?v=1"/);
  for(const key of ['bed','bowl','toy'])assert.match(app,new RegExp(`homeRecoveryRate\\('${{bed:'rest',bowl:'eat',toy:'play'}[key]}'`));
  assert.match(app,/data-location-manage="\$\{id\}"/);
  assert.match(app,/showHomeUpgrades\(owner,'location'\)/);
  assert.match(app,/data-house-upgrades="citera"/);
  assert.match(app,/data-action="home-upgrades"/);
  assert.match(app,/data-home-buy="\$\{key\}"/);
  assert.match(app,/if\(result\.ok\)changed\(\)/);
  assert.doesNotMatch(app,/data-upgrade="(?:bed|bowl|toy)"/);
  assert.match(app,/upgrades:\{bed:0,bowl:0,toy:0\}/);
  assert.match(app,/const FORMAT=13/);
  assert.match(app,/город Беллы · версия 0\.9\.23 · 2D/);
});
