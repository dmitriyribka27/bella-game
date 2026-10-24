import test from 'node:test';
import assert from 'node:assert/strict';
import {MARKET_SNACKS,buyMarketSnack} from '../docs/market-snacks.js';

test('Bella has exactly six favorites at the market',()=>{
  assert.deepEqual(MARKET_SNACKS.map(item=>item.name),[
    'Red Bull','Чипсы с сыром','Coca-Cola · 1 л','Бутерброды с сёмгой','Чай','Шаурма'
  ]);
  assert.ok(MARKET_SNACKS.every(item=>Number.isSafeInteger(item.price)&&item.price>0&&item.reaction.length>10));
});

test('purchase spends only existing coins and returns the chosen snack',()=>{
  const purchase=buyMarketSnack(50,'salmon-sandwich');
  assert.equal(purchase.ok,true);
  assert.equal(purchase.snack.name,'Бутерброды с сёмгой');
  assert.equal(purchase.balance,40);
  assert.equal(buyMarketSnack(3,'tea').balance,0);
});

test('insufficient coins and unknown items cannot produce a purchase',()=>{
  assert.deepEqual(buyMarketSnack(2,'tea').ok,false);
  assert.equal(buyMarketSnack(2,'tea').balance,2);
  assert.equal(buyMarketSnack(50,'nonexistent').reason,'unknown');
  assert.equal(buyMarketSnack(-1,'tea').ok,false);
});
