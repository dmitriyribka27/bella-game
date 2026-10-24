import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const art=readFileSync(new URL('../docs/assets/interiors/post-office-v1.webp',import.meta.url));

test('post office illustration is a compact WebP asset loaded only in its scene',()=>{
  assert.equal(art.toString('ascii',0,4),'RIFF');
  assert.equal(art.toString('ascii',8,12),'WEBP');
  assert.ok(art.byteLength>100_000&&art.byteLength<600_000);
  assert.match(app,/function showPostOffice\(view='all'\)/);
  assert.match(app,/src="\.\/assets\/interiors\/post-office-v1\.webp"/);
});

test('the post location opens four views and can return to the world',()=>{
  assert.match(app,/if\(id==='post'\)actions\+='/);
  assert.match(app,/if\(button\.hasAttribute\('data-location-post-office-enter'\)\)/);
  assert.match(app,/data-post-office-view="\$\{id\}"/);
  for(const view of ['counter','sorting','entrance']){
    assert.ok(app.includes(`.postOfficeScene[data-view="${view}"]`));
  }
  assert.match(app,/dialog\.classList\.add\('postOfficeDialog'\)/);
  assert.match(app,/dialog\.classList\.remove\([^\n]*'postOfficeDialog'[^\n]*\)/);
});

test('post office has no gameplay state changes or reward actions',()=>{
  const start=app.indexOf("function showPostOffice(view='all'){");
  const end=app.indexOf("function showMarket(view='all'){");
  assert.ok(start>=0&&end>start);
  const postOffice=app.slice(start,end);
  assert.doesNotMatch(postOffice,/unlockMemory\(|changed\(|coins\s*[+\-]=|xp\s*[+\-]=|data-home-story/);
  assert.match(app,/const FORMAT=14/);
  assert.match(app,/<strong>Тихая бухта<\/strong>/);
});

test('Bella finds a discreet letter icon at the counter, opens a real paper letter and returns',()=>{
  const letter=readFileSync(new URL('../docs/assets/interiors/bella-letter-v1.webp',import.meta.url));
  assert.equal(letter.toString('ascii',0,4),'RIFF');
  assert.equal(letter.toString('ascii',8,12),'WEBP');
  assert.ok(letter.length>50_000&&letter.length<400_000,'lightweight textured stationery');
  assert.match(app,/<button class="postLetterHotspot" data-post-letter-open/);
  assert.match(app,/function showPostLetter\(returnView='all'\)/);
  assert.match(app,/src="\.\/assets\/interiors\/bella-letter-v1\.webp"/);
  const message='Этот остров появился потому, что однажды ты собрала вокруг себя тех, кому нужен был дом. Теперь у каждого из них здесь есть своё место. И у тебя тоже';
  assert.equal(app.split(message).length,2,'exact letter text is presented once without extra prose');
  assert.match(app,/<p class="postLetterText">Этот остров/,'letter is actual selectable HTML text');
  assert.match(app,/data-post-letter-back="\$\{returnView\}"/);
  assert.match(app,/showPostLetter\(document\.getElementById\('postOfficeScene'\)\?\.dataset\.view\|\|'all'\)/);
  assert.match(app,/showPostOffice\(button\.dataset\.postLetterBack\)/);
  assert.match(app,/\.postLetterScene\s*\{[^}]*aspect-ratio:2\/3;/);
  assert.match(app,/\.postLetterHotspot:focus-visible/);
  assert.match(app,/postLetterDialog'.*?'marketDialog'/);
});
