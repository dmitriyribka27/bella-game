import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOOK_VISITORS,BOOK_VISITOR_BY_ID,
  newBookVisitorState,sanitizeBookVisitorState,chapterForVisitor,
  bringNextBookVisitor,finishBookVisit
} from '../docs/book-visitors.js';

test('six unique visitors have three non-trivial story chapters and repeat dialogue',()=>{
  assert.equal(BOOK_VISITORS.length,6);
  assert.equal(new Set(BOOK_VISITORS.map(v=>v.id)).size,6);
  for(const visitor of BOOK_VISITORS){
    assert.equal(visitor.chapters.length,3);
    for(const chapter of [...visitor.chapters,visitor.repeat]){
      assert.equal(chapter.choices.length,3);
      assert.ok(chapter.right>=0&&chapter.right<3);
      assert.ok(chapter.prompt.length>25);
      assert.ok(chapter.reply.length>20);
      assert.ok(chapter.hint.length>12);
    }
  }
});

test('first visitors can be served once and their history continues',()=>{
  const now=100000;
  const state=newBookVisitorState(now);
  assert.deepEqual(state.queue,['oscar','matilda']);
  const first=chapterForVisitor(BOOK_VISITOR_BY_ID.oscar,state.progress.oscar||0);
  assert.equal(first.title,'Ветер перемен');
  assert.equal(finishBookVisit(state,'oscar',now+10),first);
  assert.deepEqual(state.queue,['matilda']);
  assert.equal(state.progress.oscar,1);
  assert.equal(state.journal[0].title,'Ветер перемен');
  assert.equal(chapterForVisitor(BOOK_VISITOR_BY_ID.oscar,state.progress.oscar).title,'Карта в кармане');
  assert.equal(finishBookVisit(state,'oscar',now+15),null);
  assert.equal(state.progress.oscar,1);
  assert.equal(bringNextBookVisitor(state,now+35009),false);
  assert.equal(bringNextBookVisitor(state,now+35010),true);
  assert.deepEqual(state.queue,['matilda','felix']);
  assert.equal(bringNextBookVisitor(state,now+999999),false);
});

test('story completes in three visits and repeat transactions do not lose the finale',()=>{
  const state=newBookVisitorState(0);
  for(let i=0;i<4;i++){
    if(!state.queue.includes('oscar'))state.queue.push('oscar');
    const active=chapterForVisitor(BOOK_VISITOR_BY_ID.oscar,state.progress.oscar||0);
    const result=finishBookVisit(state,'oscar',i*40000);
    assert.equal(result,active);
  }
  assert.equal(state.progress.oscar,3);
  assert.equal(state.journal.length,3);
  assert.equal(chapterForVisitor(BOOK_VISITOR_BY_ID.oscar,3).title,'Морские байки');
});

test('save normalization rejects unknown guests, duplicates, negative and corrupt progress',()=>{
  const saved=sanitizeBookVisitorState({
    queue:['oscar','oscar','stranger','felix','agata'],nextAt:Infinity,cursor:-8,
    progress:{oscar:99,felix:-10,agata:'3'},
    journal:[{id:'bogus',title:'X',reply:'Y'},{id:'oscar',title:'Ветер перемен',reply:'Спасибо!'}]
  },70000);
  assert.deepEqual(saved.queue,['oscar','felix']);
  assert.equal(saved.progress.oscar,3);
  assert.equal(saved.progress.felix,0);
  assert.equal(saved.progress.agata,0);
  assert.equal(saved.cursor,0);
  assert.equal(saved.journal.length,1);
  assert.ok(Number.isFinite(saved.nextAt));
  assert.equal(sanitizeBookVisitorState(null,70000).queue.length,2);
});
