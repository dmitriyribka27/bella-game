import test from 'node:test';
import assert from 'node:assert/strict';
import {createBookVisitorMotion,syncBookVisitorMotion,focusBookVisitor,leaveBookVisitor,bookVisitorRoute,activeBookDeparture,BOOK_WALK_IN_MS,BOOK_TO_COUNTER_MS,BOOK_WALK_OUT_MS} from '../docs/book-visitor-motion.js';

test('visitors enter once, settle at shelves, and do not restart after re-render',()=>{
  const motion=createBookVisitorMotion(),t=10000;
  syncBookVisitorMotion(motion,['oscar','matilda'],t);
  assert.deepEqual([...motion.slots.values()],[0,1]);
  assert.equal(bookVisitorRoute(motion,'oscar',null,t).name,'enter');
  syncBookVisitorMotion(motion,['oscar','matilda'],t+500);
  assert.equal(bookVisitorRoute(motion,'oscar',null,t+500).delay,-500);
  assert.equal(bookVisitorRoute(motion,'oscar',null,t+BOOK_WALK_IN_MS).name,'shelf');
  assert.equal(bookVisitorRoute(motion,'matilda',null,t+BOOK_WALK_IN_MS+100).name,'shelf');
});

test('talking moves just one customer to the counter and can be resumed',()=>{
  const motion=createBookVisitorMotion(),t=2000;
  syncBookVisitorMotion(motion,['oscar','matilda'],t);
  assert.equal(focusBookVisitor(motion,'unknown',t),false);
  assert.equal(focusBookVisitor(motion,'oscar',t+4000),true);
  assert.equal(bookVisitorRoute(motion,'oscar','oscar',t+4600).name,'counter');
  assert.equal(bookVisitorRoute(motion,'oscar','oscar',t+4600).delay,-600);
  assert.equal(bookVisitorRoute(motion,'oscar','oscar',t+4000+BOOK_TO_COUNTER_MS).name,'waiting');
  assert.equal(bookVisitorRoute(motion,'matilda','oscar',t+4600).name,'shelf');
  assert.equal(bookVisitorRoute(motion,'oscar',null,t+5000).name,'shelf');
});

test('sale starts one exit and remaining guest retains their original place',()=>{
  const motion=createBookVisitorMotion(),t=9000;
  syncBookVisitorMotion(motion,['oscar','matilda'],t);
  focusBookVisitor(motion,'oscar',t+4000);
  assert.equal(leaveBookVisitor(motion,'oscar',t+4500),true);
  syncBookVisitorMotion(motion,['matilda'],t+4500);
  assert.equal(motion.slots.get('matilda'),1);
  assert.equal(activeBookDeparture(motion,t+4600).id,'oscar');
  assert.equal(activeBookDeparture(motion,t+4500+BOOK_WALK_OUT_MS),null);
  syncBookVisitorMotion(motion,['matilda','felix'],t+4600);
  assert.equal(motion.slots.get('felix'),0);
  assert.equal(bookVisitorRoute(motion,'felix',null,t+4600).name,'enter');
});
