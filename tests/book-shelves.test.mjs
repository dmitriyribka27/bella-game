import test from 'node:test';
import assert from 'node:assert/strict';
import {BOOK_CATALOG} from '../docs/book-inventory.js';
import {bookCoverMarkup,bookCoverTheme} from '../docs/book-covers.js';
import {BOOK_SCENES,sanitizeBookScenes,availableBookScene,finishBookScene} from '../docs/book-scenes.js';

test('all fictional books have unique, crisp vector covers and readable titles',()=>{
  const motifs=new Set();
  for(const book of BOOK_CATALOG){
    const art=bookCoverMarkup(book.id);
    assert.match(art,/<svg class="bookCoverArt"/);
    assert.ok(art.includes(book.title));
    assert.ok(art.includes('CognitioVerum'));
    assert.match(art, /--book-base:#[0-9a-f]{6}/);
    motifs.add(bookCoverTheme(book.id)[3]);
  }
  assert.ok(motifs.size>=12);
  assert.equal(bookCoverMarkup('not-a-book'),'');
});

test('joint conversations require both visitors and are possible only once',()=>{
  assert.equal(BOOK_SCENES.length,6);
  for(const scene of BOOK_SCENES){
    assert.equal(scene.guests.length,2);
    assert.equal(scene.choices.length,2);
    assert.ok(scene.prompt.length>60);
    for(const option of scene.choices){assert.ok(option.reply.length>40);assert.ok(option.mood>=0);}
  }
  const history=[];
  const guests=['oscar','matilda'];
  const first=availableBookScene(guests,history);
  assert.equal(first.id,'oscar-matilda');
  assert.equal(availableBookScene(['oscar'],history),null);
  assert.equal(availableBookScene(['matilda'],history),null);
  const outcome=finishBookScene(history,first.id,0);
  assert.ok(outcome.reply.length>40);
  assert.equal(history.length,1);
  assert.equal(finishBookScene(history,first.id,0),null);
  assert.equal(availableBookScene(guests,history),null);
});

test('scene history migration strips duplicates and unknown or invalid choices',()=>{
  const history=sanitizeBookScenes([
    {id:'oscar-matilda',choice:1},
    {id:'oscar-matilda',choice:0},
    {id:'felix-sonya',choice:99},
    {id:'bogus',choice:0},
    {id:'felix-sonya',choice:0}
  ]);
  assert.deepEqual(history,[{id:'oscar-matilda',choice:1},{id:'felix-sonya',choice:0}]);
  assert.deepEqual(sanitizeBookScenes(null),[]);
});
