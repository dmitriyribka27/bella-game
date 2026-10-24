import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOME_STORIES,BELLA_HOME_STORIES,sanitizeMemoryBook,unlockMemory} from '../docs/home-stories.js';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const image=readFileSync(new URL('../docs/assets/interiors/bella-home-v1.webp',import.meta.url));

test('approved Bella home interior uses compact high-detail WebP art',()=>{
  assert.equal(image.toString('ascii',0,4),'RIFF');
  assert.equal(image.toString('ascii',8,12),'WEBP');
  assert.ok(image.byteLength>100_000);
  assert.ok(image.byteLength<500_000,'keep it quick to load in mobile Safari');
  assert.match(app,/src="\.\/assets\/interiors\/bella-home-v1\.webp"/);
});

test('Bella has three replayable private stories and only the first choice enters the album',()=>{
  assert.deepEqual(BELLA_HOME_STORIES.map(story=>story.id),['bella-balloons','bella-shelves','bella-night']);
  for(const story of BELLA_HOME_STORIES){
    assert.equal(story.owner,'bella');
    assert.equal(story.choices.length,3);
    assert.ok(story.choices.every(choice=>choice.id&&choice.label&&choice.reaction));
  }
  const oldMemories=[{id:'fireplace',choiceId:'sea',at:1729700000000},{id:'citera-letter',choiceId:'keep',at:1729700000001}];
  const album=sanitizeMemoryBook(oldMemories);
  assert.deepEqual(album,oldMemories,'prior album entries survive unchanged');
  assert.equal(unlockMemory(album,'bella-balloons','photo',1729700000002),true);
  assert.equal(unlockMemory(album,'bella-balloons','hearts',1729700000003),false);
  assert.equal(album.length,3);
  assert.equal(HOME_STORIES.length,11);
});

test('Bella house opens through map and resident card, with zoom and memory navigation',()=>{
  assert.match(app,/data-location-bella-enter/);
  assert.match(app,/data-action="bella-home"/);
  assert.match(app,/function showBellaHome\(room='all'\)/);
  assert.match(app,/dialog\.classList\.add\('bellaHomeDialog'\)/);
  assert.match(app,/\.bellaHomeHotspot\[data-home-story="bella-balloons"\]/);
  assert.match(app,/\.bellaHomeHotspot\[data-home-story="bella-shelves"\]/);
  assert.match(app,/\.bellaHomeHotspot\[data-home-story="bella-night"\]/);
  for(const room of ['lounge','studio','bedroom','bathroom']){
    assert.ok(app.includes(`.bellaHomeScene[data-room="${room}"]`));
  }
  assert.match(app,/data-bella-room="\$\{id\}"/);
  assert.match(app,/if\(button\.dataset\.homeOwner==='bella'\)showBellaHome\(button\.dataset\.homeReturn\)/);
  assert.match(app,/\['💛 Белла',BELLA_HOME_STORIES\]/);
  assert.match(app,/format|FORMAT/i);
});
