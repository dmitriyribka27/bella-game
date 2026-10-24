import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  CAFE_GUESTS,CAFE_RECIPES,CAFE_RECIPE_BY_ID,newCafeServiceState,sanitizeCafeServiceState,
  cafeGuestProfile,inviteCafeGuests,answerCafeIngredient,serveCafeGuest
} from '../docs/cafe-visitors.js';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');

test('cafe keeps at most two waiting guests with stable repeat visitors',()=>{
  const service=newCafeServiceState();
  assert.equal(inviteCafeGuests(service),2);
  assert.equal(inviteCafeGuests(service),0);
  assert.equal(service.queue.length,2);
  assert.equal(cafeGuestProfile(service.queue[0]).name,CAFE_GUESTS[0].name);
  assert.equal(cafeGuestProfile({seq:CAFE_GUESTS.length}).name,CAFE_GUESTS[0].name);
  assert.equal(new Set(service.queue.map(guest=>guest.seq)).size,2);
  assert.deepEqual(service.queue.map(guest=>guest.slot),[0,1]);
});

test('eight distinct recipes appear across the first eight served guests',()=>{
  assert.deepEqual(CAFE_RECIPES.map(recipe=>recipe.id),[
    'bun','tea','cocoa','espresso','cappuccino','vanilla_latte','iced_caramel','matcha'
  ]);
  const servedRecipes=new Set(),service=newCafeServiceState();
  for(let seq=0;seq<8;seq++){
    inviteCafeGuests(service);
    const guest=service.queue.find(visit=>visit.seq===seq);
    assert.ok(guest,`guest ${seq} should have arrived`);
    const recipe=CAFE_RECIPE_BY_ID[guest.recipeId];
    assert.equal(recipe.steps.length,3);
    for(const step of recipe.steps){
      assert.equal(step.options.length,3);
      assert.equal(step.options.filter(option=>option[0]===step.answer).length,1);
      assert.equal(new Set(step.options.map(option=>option[0])).size,3);
      assert.equal(answerCafeIngredient(service,seq,step.answer).ok,true);
    }
    assert.ok(serveCafeGuest(service,seq));
    servedRecipes.add(recipe.id);
  }
  assert.equal(servedRecipes.size,8,'no drink should repeat before trying the full menu');
});

test('each guest has a real three-step recipe, wrong ingredients do not advance',()=>{
  const service=newCafeServiceState();inviteCafeGuests(service);
  const guest=service.queue[0];
  const recipe=CAFE_RECIPE_BY_ID[guest.recipeId];
  assert.ok(CAFE_RECIPES.length>=3);
  assert.equal(serveCafeGuest(service,guest.seq),null,'cannot skip preparation');
  for(const step of recipe.steps){
    const wrong=step.options.find(option=>option[0]!==step.answer)[0];
    const old=guest.step;
    assert.equal(answerCafeIngredient(service,guest.seq,wrong).ok,false);
    assert.equal(guest.step,old);
    const right=answerCafeIngredient(service,guest.seq,step.answer);
    assert.equal(right.ok,true);
  }
  assert.equal(guest.step,3);
  assert.equal(serveCafeGuest(service,guest.seq)?.seq,guest.seq);
  assert.equal(serveCafeGuest(service,guest.seq),null,'cannot receive coins twice');
  assert.equal(service.queue.length,1);
  assert.equal(service.queue[0].slot,1,'waiting guest must not jump to another position');
  assert.equal(inviteCafeGuests(service),1,'new visitor replaces a served guest');
  assert.equal(service.queue.length,2);
  assert.deepEqual(service.queue.map(guest=>guest.slot),[1,0]);
});

test('save sanitization preserves active orders and rejects corrupted extras',()=>{
  const oldSave=sanitizeCafeServiceState(undefined,17);
  assert.equal(oldSave.next,17,'legacy orders remain intact');
  inviteCafeGuests(oldSave);
  const order=oldSave.queue[0];
  const step=CAFE_RECIPE_BY_ID[order.recipeId].steps[0];
  answerCafeIngredient(oldSave,order.seq,step.answer);
  const restored=sanitizeCafeServiceState(JSON.parse(JSON.stringify(oldSave)),17);
  assert.equal(restored.queue[0].step,1);
  assert.equal(restored.queue[0].seq,order.seq);
  assert.equal(restored.queue[0].slot,0);
  assert.equal(restored.next,19);
  const existing=sanitizeCafeServiceState({next:20,queue:[{seq:19,recipeId:'tea',step:2,slot:1}]},19);
  assert.equal(existing.queue[0].recipeId,'tea','an old pending tea order must remain tea');
  assert.equal(existing.queue[0].step,2);
  assert.equal(answerCafeIngredient(existing,19,'honey').complete,true);
  const corrupt=sanitizeCafeServiceState({next:-20,queue:[{seq:0,recipeId:'fake',step:999},{seq:7,recipeId:'tea',step:100},{seq:7,recipeId:'tea',step:2},{seq:8,recipeId:'bun',step:-4},{seq:9,recipeId:'bun',step:0}]});
  assert.equal(corrupt.queue.length,2);
  assert.deepEqual(corrupt.queue.map(guest=>guest.step),[3,0]);
  assert.equal(corrupt.next,9);
});

test('cafe has animated guests, ingredient picking and save-aware progression outside map loop',()=>{
  assert.match(app,/cafe-visitors\.js\?v=2/);
  assert.match(app,/Меню Рыжего/);
  assert.match(app,/data-cafe-ingredient=/);
  assert.match(app,/data-cafe-serve=/);
  assert.match(app,/data-cafe-guest=/);
  assert.match(app,/@keyframes cafeGuestEnter/);
  assert.match(app,/@keyframes cafeGuestEnjoy/);
  assert.match(app,/service:sanitizeCafeServiceState\(v\.service,v\.orders\)/);
  assert.match(app,/cafeDepartTimer=setTimeout/);
  assert.doesNotMatch(app,/data-order=/,'the old single-choice order button must be gone');
  assert.match(app,/const FORMAT=14/,'memory migration keeps existing saved cities');
  assert.match(app,/\[1,2,3,4,5,6,7,8,9,10,11,12,13,FORMAT\]/,'previous cities remain readable');
});
