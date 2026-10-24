import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOME_STORIES,LEV_HOME_STORIES,sanitizeMemoryBook,unlockMemory} from '../docs/home-stories.js';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');

test('Lev has three small replayable stories in distinct areas of his house',()=>{
  assert.deepEqual(LEV_HOME_STORIES.map(story=>[story.id,story.room]),[
    ['lev-curiosity','workshop'],
    ['lev-play','play'],
    ['lev-hammock','loft']
  ]);
  for(const story of LEV_HOME_STORIES){
    assert.equal(story.owner,'lev');
    assert.equal(story.choices.length,3);
    assert.ok(story.choices.every(choice=>choice.id&&choice.label&&choice.reaction));
    assert.match(app,new RegExp(`\\.levHomeHotspot\\[data-home-story="${story.id}"\\]`));
  }
  assert.equal(HOME_STORIES.length,17);
  assert.match(app,/const hotSpots=LEV_HOME_STORIES\.map/);
  assert.match(app,/const scenes=LEV_HOME_STORIES\.map/);
});

test('old memories survive, Lev memories save only once and the player returns to a chosen view',()=>{
  const previous=[{id:'fireplace',choiceId:'sea',at:1729700000000},{id:'bella-shelves',choiceId:'books',at:1729700000001}];
  const book=sanitizeMemoryBook(previous);
  assert.deepEqual(book,previous);
  assert.equal(unlockMemory(book,'lev-curiosity','magnifier',1729700000002),true);
  assert.equal(unlockMemory(book,'lev-curiosity','shelf',1729700000003),false);
  assert.equal(unlockMemory(book,'lev-play','ball',1729700000004),true);
  assert.equal(unlockMemory(book,'lev-hammock','blanket',1729700000005),true);
  assert.deepEqual(book.map(memory=>memory.id),['fireplace','bella-shelves','lev-curiosity','lev-play','lev-hammock']);
  assert.match(app,/else if\(button\.dataset\.homeOwner==='lev'\)showLevHome\(button\.dataset\.homeReturn\)/);
  assert.match(app,/\['🩺 Лев',LEV_HOME_STORIES\]/);
  assert.match(app,/data-home-return="all" data-home-owner="lev"/);
  assert.match(app,/"\.\/home-stories\.js\?v=\d+"/);
  assert.match(app,/const FORMAT=13/);
});
