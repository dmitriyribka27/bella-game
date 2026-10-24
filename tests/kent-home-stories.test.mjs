import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOME_STORIES,KENT_HOME_STORIES,sanitizeMemoryBook,unlockMemory} from '../docs/home-stories.js';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');

test('Kent has exactly three short repeatable stories at three objects in his home',()=>{
  assert.deepEqual(KENT_HOME_STORIES.map(story=>[story.id,story.room]),[
    ['kent-desk','desk'],
    ['kent-winter','secret'],
    ['kent-chess','terrace']
  ]);
  for(const story of KENT_HOME_STORIES){
    assert.equal(story.owner,'kent');
    assert.equal(story.choices.length,3);
    assert.ok(story.choices.every(choice=>choice.id&&choice.label&&choice.reaction));
    assert.match(app,new RegExp(`\\.kentHomeHotspot\\[data-home-story="${story.id}"\\]`));
  }
  assert.equal(HOME_STORIES.length,17);
  assert.match(app,/const hotSpots=KENT_HOME_STORIES\.map/);
  assert.match(app,/const scenes=KENT_HOME_STORIES\.map/);
  assert.match(app,/\.homeStoryHero\[data-story="kent-winter"\]/);
});

test('winter story preserves the supplied Adygea and Bella rescue facts',()=>{
  const winter=KENT_HOME_STORIES.find(story=>story.id==='kent-winter');
  assert.match(winter.intro,/ауле Адыгеи/);
  assert.match(winter.intro,/жил на улице/);
  assert.match(winter.intro,/холодной зиме/);
  assert.match(winter.intro,/Белла спасла его/);
  assert.equal(winter.memoryTitle,'Как Белла спасла Кента');
});

test('new Kent memories coexist with old ones and are never duplicated',()=>{
  const previous=[{id:'fireplace',choiceId:'sea',at:1729700000000},{id:'lev-hammock',choiceId:'blanket',at:1729700000001}];
  const book=sanitizeMemoryBook(previous);
  assert.deepEqual(book,previous);
  assert.equal(unlockMemory(book,'kent-winter','bella',1729700000002),true);
  assert.equal(unlockMemory(book,'kent-winter','blanket',1729700000003),false);
  assert.equal(unlockMemory(book,'kent-desk','nap',1729700000004),true);
  assert.equal(unlockMemory(book,'kent-chess','sunset',1729700000005),true);
  assert.deepEqual(book.map(entry=>entry.id),['fireplace','lev-hammock','kent-winter','kent-desk','kent-chess']);
  assert.match(app,/else if\(button\.dataset\.homeOwner==='kent'\)showKentHome\(button\.dataset\.homeReturn\)/);
  assert.match(app,/\['🐈‍⬛ Кент',KENT_HOME_STORIES\]/);
  assert.match(app,/data-home-return="all" data-home-owner="kent"/);
  assert.match(app,/"\.\/home-stories\.js\?v=\d+"/);
  assert.match(app,/const FORMAT=14/);
});
