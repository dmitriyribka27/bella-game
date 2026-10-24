import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOME_STORIES,newMemoryBook,sanitizeMemoryBook,unlockMemory} from '../docs/home-stories.js';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');

test('three Ryzhiy home moments offer distinct choices without timers or currency',()=>{
  assert.deepEqual(HOME_STORIES.map(story=>story.id),['fireplace','kitchen','bedroom']);
  for(const story of HOME_STORIES){
    assert.equal(story.choices.length,3);
    assert.ok(story.intro&&story.memoryTitle);
    assert.ok(story.choices.every(choice=>choice.label&&choice.reaction));
  }
  assert.ok(!/timer|cost|price|coins|reward/i.test(readFileSync(new URL('../docs/home-stories.js',import.meta.url),'utf8').replace(/\/\/.*$/gm,'')));
});

test('the first story choice creates one stable memory and a replay does not duplicate it',()=>{
  const book=newMemoryBook();
  assert.equal(unlockMemory(book,'fireplace','yarn',1729700000000),true);
  assert.equal(unlockMemory(book,'fireplace','sea',1729700001000),false);
  assert.equal(unlockMemory(book,'unknown','anything',1729700001000),false);
  assert.deepEqual(book,[{id:'fireplace',choiceId:'yarn',at:1729700000000}]);
});

test('memory migration discards unknown, malformed and repeated stories',()=>{
  assert.deepEqual(sanitizeMemoryBook(undefined),[]);
  assert.deepEqual(sanitizeMemoryBook([
    {id:'kitchen',choiceId:'buns',at:1729700000000},
    {id:'kitchen',choiceId:'tea',at:1729700009000},
    {id:'bedroom',choiceId:'invalid',at:1729700000000},
    {id:'other',choiceId:'sea',at:1729700000000}
  ]),[{id:'kitchen',choiceId:'buns',at:1729700000000}]);
});

test('scene hotspots, album access, save migration and return navigation are wired',()=>{
  assert.match(app,/import \{HOME_STORIES,HOME_STORY_BY_ID,newMemoryBook,sanitizeMemoryBook,unlockMemory\}/);
  assert.match(app,/out\.memories=s\.version>=12\?sanitizeMemoryBook\(s\.memories\):newMemoryBook\(\)/);
  assert.match(app,/before-home-memories-v1/);
  assert.match(app,/data-home-story="\$\{story\.id\}"/);
  assert.match(app,/data-home-choice="\$\{item\.id\}"/);
  assert.match(app,/data-home-return="\$\{story\.room\}"/);
  assert.match(app,/function showFamilyAlbum\(\)/);
  assert.match(app,/unlockMemory\(city\.memories,id,choiceId\)/);
});
