import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MUSSEL_MENU,newMusselRestaurantState,sanitizeMusselRestaurantState,
  nextMusselOrder,newMusselKitchen,addMusselIngredient,setMusselHeat,
  plateMussels,garnishMussels,serveMusselOrder
} from '../docs/mussel-restaurant.js';

test('menu has five distinct dishes, priced relative to the cafe',()=>{
  assert.deepEqual(MUSSEL_MENU.map(v=>v.price),[8,10,11,13,16]);
  assert.equal(new Set(MUSSEL_MENU.map(v=>v.id)).size,5);
  for(const v of MUSSEL_MENU)assert.ok(v.ingredients.includes('mussels'));
});

test('the full touch-driven order awards virtual coins once, on serving only',()=>{
  const city={coins:100,musselRestaurant:newMusselRestaurantState()};
  const order=nextMusselOrder(city.musselRestaurant);
  const session=newMusselKitchen(order);
  assert.equal(addMusselIngredient(session,'cheese'),false);
  assert.equal(addMusselIngredient(session,'mussels'),true);
  assert.equal(addMusselIngredient(session,'mussels'),false);
  for(const id of order.ingredients.slice(1))assert.equal(addMusselIngredient(session,id),true);
  assert.equal(session.phase,'heat');
  assert.equal(city.coins,100);
  assert.equal(setMusselHeat(session,.55).ok,true);
  assert.equal(session.phase,'plating');
  for(let i=0;i<3;i++)assert.equal(plateMussels(session),true);
  assert.equal(plateMussels(session),false);
  assert.equal(garnishMussels(session),true);
  assert.equal(session.phase,'ready');
  const win=serveMusselOrder(city,session);
  assert.deepEqual({ok:win.ok,coins:win.coins,tip:win.tip,stars:win.stars},{ok:true,coins:12,tip:4,stars:3});
  assert.equal(city.coins,112);
  assert.equal(city.musselRestaurant.served,1);
  assert.equal(serveMusselOrder(city,session).ok,false);
  assert.equal(city.coins,112);
});

test('temperature needs adjustment and retry gives smaller tip',()=>{
  const state=newMusselRestaurantState();
  const session=newMusselKitchen(nextMusselOrder(state));
  for(const id of MUSSEL_MENU[0].ingredients)addMusselIngredient(session,id);
  assert.equal(setMusselHeat(session,.95).ok,false);
  assert.equal(session.phase,'heat');
  assert.equal(setMusselHeat(session,.6).ok,true);
  for(let i=0;i<3;i++)plateMussels(session);
  garnishMussels(session);
  const city={coins:0,musselRestaurant:state};
  assert.equal(serveMusselOrder(city,session).coins,10);
  assert.equal(state.last.stars,2);
});

test('a stale order can never pay again after a newer order',()=>{
  const city={coins:0,musselRestaurant:newMusselRestaurantState()};
  const order=nextMusselOrder(city.musselRestaurant);
  const first=newMusselKitchen(order);
  for(const id of order.ingredients)addMusselIngredient(first,id);
  setMusselHeat(first,.5);
  for(let i=0;i<3;i++)plateMussels(first);
  garnishMussels(first);
  serveMusselOrder(city,first);
  const stale={...first,phase:'ready',paid:false};
  assert.equal(serveMusselOrder(city,stale).ok,false);
  assert.equal(city.coins,12);
});

test('a visually ready but incomplete or fabricated order cannot mint coins',()=>{
  const city={coins:50,musselRestaurant:newMusselRestaurantState()};
  const forged={...newMusselKitchen(nextMusselOrder(city.musselRestaurant)),phase:'ready',garnished:true,plated:3,heatAttempts:1};
  assert.equal(serveMusselOrder(city,forged).reason,'incomplete');
  assert.equal(city.coins,50);
  assert.equal(city.musselRestaurant.served,0);
});

test('restored restaurant data stays bounded and works with older city saves',()=>{
  assert.deepEqual(sanitizeMusselRestaurantState(undefined),newMusselRestaurantState());
  assert.deepEqual(sanitizeMusselRestaurantState({served:-20,earned:Infinity,bestStars:9,last:{id:'fake'}}),newMusselRestaurantState());
  const state={served:20,earned:180,bestStars:3,last:{id:'classic',stars:3,coins:12}};
  assert.deepEqual(sanitizeMusselRestaurantState(JSON.parse(JSON.stringify(state))),state);
  assert.equal(nextMusselOrder({served:1}).id,'tomato');
});
