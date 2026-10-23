import test from 'node:test';
import assert from 'node:assert/strict';
import {BOOK_VISITORS,newBookVisitorState,chapterForVisitor,finishBookVisit} from '../docs/book-visitors.js';
import {
  BOOK_CATALOG,BOOK_BY_ID,BOOK_SUPPLIERS,chapterBook,newBookInventory,
  sanitizeBookInventory,orderBook,receiveBookShipments,sellBook,
  pendingCopies,totalCopies
} from '../docs/book-inventory.js';

test('catalog covers each correct story recommendation, including repeat visits',()=>{
  assert.equal(BOOK_SUPPLIERS.length,3);
  assert.equal(new Set(BOOK_CATALOG.map(b=>b.title)).size,BOOK_CATALOG.length);
  assert.ok(BOOK_CATALOG.length>=20);
  for(const visitor of BOOK_VISITORS){
    for(const chapter of [...visitor.chapters,visitor.repeat]){
      const book=chapterBook(chapter);
      assert.equal(book.title,chapter.choices[chapter.right]);
      assert.ok(book.price>book.cost);
    }
  }
});

test('legacy visitors get exactly one playable copy of their active story book',()=>{
  const visitors=newBookVisitorState(100);
  visitors.progress.oscar=2;
  const inventory=newBookInventory(visitors);
  const book=chapterBook(chapterForVisitor(BOOK_VISITORS[0],2));
  assert.equal(inventory.stock[book.id],1);
  assert.equal(inventory.shipments.length,0);
  assert.ok(totalCopies(inventory)>=5);
  assert.equal(sanitizeBookInventory(undefined,visitors).stock[book.id],1);
});

test('orders spend only affordable coins, arrive after delay and cannot duplicate copies',()=>{
  const inventory=newBookInventory(newBookVisitorState(0));
  const book=BOOK_CATALOG.find(b=>inventory.stock[b.id]===0);
  assert.ok(book);
  assert.equal(orderBook(inventory,book.id,3,0,1000).ok,false);
  assert.equal(orderBook(inventory,'unknown',1,100,1000).ok,false);
  assert.equal(inventory.shipments.length,0);
  const purchased=orderBook(inventory,book.id,3,100,1000);
  assert.equal(purchased.ok,true);
  assert.equal(purchased.cost,book.cost*3);
  assert.equal(pendingCopies(inventory,book.id),3);
  assert.deepEqual(receiveBookShipments(inventory,purchased.dueAt-1),[]);
  assert.equal(inventory.stock[book.id],0);
  assert.equal(receiveBookShipments(inventory,purchased.dueAt).length,1);
  assert.equal(inventory.stock[book.id],3);
  assert.equal(receiveBookShipments(inventory,purchased.dueAt+999).length,0);
  assert.equal(inventory.stock[book.id],3);
  assert.equal(orderBook(inventory,book.id,3,100,purchased.dueAt+1).ok,true);
  assert.equal(orderBook(inventory,book.id,3,100,purchased.dueAt+1).ok,false);
});

test('sale removes one copy, blocks empty stock and does not touch story until game advances it',()=>{
  const visitors=newBookVisitorState(0),inventory=newBookInventory(visitors);
  const oscar=BOOK_VISITORS[0],book=chapterBook(chapterForVisitor(oscar,0));
  assert.equal(inventory.stock[book.id],1);
  const sale=sellBook(inventory,book.id);
  assert.deepEqual(sale,{ok:true,revenue:book.price});
  assert.equal(inventory.stock[book.id],0);
  assert.deepEqual(sellBook(inventory,book.id),{ok:false});
  assert.equal(inventory.sold,1);
  assert.equal(inventory.earned,book.price);
  assert.equal(visitors.progress.oscar,undefined);
  assert.ok(finishBookVisit(visitors,'oscar'));
  assert.equal(visitors.progress.oscar,1);
});

test('untrusted save cannot insert unknown books, invalid shipments or negative stock',()=>{
  const visitors=newBookVisitorState(0);
  const book=BOOK_CATALOG[0];
  const output=sanitizeBookInventory({
    stock:{[book.id]:-999,'other':1000},
    shipments:[{bookId:'unknown',qty:1,dueAt:100},{bookId:book.id,qty:3,dueAt:200},{bookId:book.id,qty:999,dueAt:200}],
    sold:Infinity,spent:-500,earned:12,
    history:[{type:'unknown',bookId:book.id,qty:1},{type:'purchase',bookId:book.id,qty:1}]
  },visitors,1000);
  assert.equal(output.stock[book.id],0);
  assert.equal(output.stock.other,undefined);
  assert.equal(output.shipments.length,1);
  assert.equal(output.sold,0);
  assert.equal(output.spent,0);
  assert.equal(output.earned,12);
  assert.equal(output.history.length,1);
  assert.ok(BOOK_BY_ID[output.shipments[0].bookId]);
});
