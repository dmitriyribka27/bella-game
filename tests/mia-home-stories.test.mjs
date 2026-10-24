import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOME_STORIES,MIA_HOME_STORIES,sanitizeMemoryBook,unlockMemory} from '../docs/home-stories.js';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');

test('Mia has exactly three cozy stories tied to existing rooms',()=>{
  assert.equal(HOME_STORIES.length,17);
  assert.deepEqual(MIA_HOME_STORIES.map(story=>[story.id,story.room]),[
    ['mia-rain','window'],['mia-nook','bedroom'],['mia-treasures','treasures']
  ]);
  for(const story of MIA_HOME_STORIES){
    assert.equal(story.owner,'mia');
    assert.equal(story.choices.length,3);
    assert.ok(story.intro&&story.memoryTitle);
    assert.ok(story.choices.every(choice=>choice.id&&choice.label&&choice.reaction));
  }
});

test('Mia memories append safely to old saves and never duplicate',()=>{
  const before=[
    {id:'kent-winter',choiceId:'bella',at:1792800000000},
    {id:'lev-play',choiceId:'climb',at:1792800000001}
  ];
  const existing=sanitizeMemoryBook(before);
  assert.deepEqual(existing,before);
  for(const [index,story] of MIA_HOME_STORIES.entries()){
    assert.equal(unlockMemory(existing,story.id,story.choices[0].id,1792800000100+index),true);
    assert.equal(unlockMemory(existing,story.id,story.choices[1].id,1792800000200+index),false);
  }
  assert.equal(existing.length,5);
  assert.deepEqual(existing.slice(0,2),before);
  assert.deepEqual(sanitizeMemoryBook(existing),existing);
});

test('Mia story buttons work inside the interior, album and return navigation',()=>{
  assert.match(app,/MIA_HOME_STORIES\.map\(story=>`<button class="miaHomeHotspot" data-home-story="\$\{story\.id\}"/);
  assert.match(app,/MIA_HOME_STORIES\.map\(story=>`<button data-home-story="\$\{story\.id\}"/);
  assert.match(app,/\.miaHomeHotspot\[data-home-story="mia-rain"\]/);
  assert.match(app,/\.miaHomeHotspot\[data-home-story="mia-nook"\]/);
  assert.match(app,/\.miaHomeHotspot\[data-home-story="mia-treasures"\]/);
  assert.match(app,/else if\(button\.dataset\.homeOwner==='mia'\)showMiaHome\(button\.dataset\.homeReturn\)/);
  assert.match(app,/\['🌙 Мия',MIA_HOME_STORIES\]/);
  assert.match(app,/data-home-return="all" data-home-owner="mia"/);
  assert.match(app,/import \{[^\n]*MIA_HOME_STORIES[^\n]*\} from "\.\/home-stories\.js\?v=6"/);
  assert.match(app,/const FORMAT=13/);
  assert.match(app,/город Беллы · версия 0\.9\.21 · 2D/);
});
