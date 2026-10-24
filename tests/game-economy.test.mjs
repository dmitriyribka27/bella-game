import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WORK_SHIFT_SECONDS,MIN_WORK_NEED,WORK_WAGES,MANUAL_FEED_COST,HOSPITAL_COST,CAFE_OPENING_COST,CAFE_GUEST_INTERVAL_MS,CAFE_RECIPE_EARNINGS,canStartWork,workWage,buyManualFeed} from '../docs/game-economy.js';
import {CAFE_RECIPES} from '../docs/cafe-visitors.js';
import {BOOK_CATALOG} from '../docs/book-inventory.js';
import {MARKET_SNACKS} from '../docs/market-snacks.js';
import {chooseCatRoutine} from '../docs/cat-routines.js';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');

test('each cat earns a modest fixed wage after a ninety-second shift',()=>{
  assert.equal(WORK_SHIFT_SECONDS,90);
  assert.equal(MIN_WORK_NEED,35);
  assert.deepEqual(WORK_WAGES,{kent:5,mia:4,lev:6,citera:4,ryzhiy:5});
  for(const [id,wage] of Object.entries(WORK_WAGES)){
    assert.equal(workWage({id,level:100,mood:100}),wage);
    assert.equal(canStartWork({id,hunger:35,energy:35}),true);
    assert.equal(canStartWork({id,hunger:34,energy:100}),false);
    assert.equal(canStartWork({id,hunger:100,energy:34}),false);
  }
  assert.equal(workWage({id:'bella'}),0);
  assert.equal(canStartWork({id:'bella',hunger:100,energy:100}),false);
});

test('manual feeding spends four coins and automatic basic feeding remains free',()=>{
  assert.equal(MANUAL_FEED_COST,4);
  const city={coins:10,cats:[{id:'mia',hunger:60,mood:96},{id:'bella',hunger:50,mood:50}]};
  assert.deepEqual(buyManualFeed(city,'mia'),{ok:true,cost:4});
  assert.equal(city.coins,6);
  assert.equal(city.cats[0].hunger,95);
  assert.equal(city.cats[0].mood,99);
  assert.deepEqual(buyManualFeed(city,'bella'),{ok:false,reason:'invalid'});
  city.coins=1;
  assert.deepEqual(buyManualFeed(city,'mia'),{ok:false,reason:'funds'});
  assert.equal(city.coins,1);
  assert.equal(chooseCatRoutine({id:'mia',hunger:20,energy:90,mood:100},23*60),'eat','routine auto-feeding is still free');
  assert.match(app,/function auto\(c\)\{[^}]*chooseCatRoutine\(c,minuteOfGameDay\(city\.clock\)\)/);
});

test('commercial prices match the approved categories without stock for the cafe',()=>{
  assert.equal(HOSPITAL_COST,20);
  assert.equal(CAFE_OPENING_COST,150);
  assert.equal(CAFE_GUEST_INTERVAL_MS,30000);
  assert.deepEqual(MARKET_SNACKS.map(item=>item.price),[12,8,10,18,5,16]);
  assert.deepEqual(CAFE_RECIPES.map(item=>CAFE_RECIPE_EARNINGS[item.id]),[6,5,7,6,8,9,10,9]);
  assert.equal(BOOK_CATALOG.length,22);
  for(const book of BOOK_CATALOG){
    assert.ok([[12,16],[18,24],[24,32]].some(([cost,price])=>book.cost===cost&&book.price===price));
  }
  assert.match(app,/city\.coins\+=payment/);
  assert.match(app,/city\.coins-=CAFE_OPENING_COST/);
  assert.match(app,/city\.coins-=HOSPITAL_COST/);
});
