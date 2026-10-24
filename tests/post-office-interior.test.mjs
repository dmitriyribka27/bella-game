import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const art=readFileSync(new URL('../docs/assets/interiors/post-office-v1.webp',import.meta.url));

test('post office illustration is a compact WebP asset loaded only in its scene',()=>{
  assert.equal(art.toString('ascii',0,4),'RIFF');
  assert.equal(art.toString('ascii',8,12),'WEBP');
  assert.ok(art.byteLength>100_000&&art.byteLength<600_000);
  assert.match(app,/function showPostOffice\(\)/);
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
  const start=app.indexOf('function showPostOffice(){');
  const end=app.indexOf("function showMarket(view='all'){");
  assert.ok(start>=0&&end>start);
  const postOffice=app.slice(start,end);
  assert.doesNotMatch(postOffice,/unlockMemory\(|changed\(|coins\s*[+\-]=|xp\s*[+\-]=|data-home-story/);
  assert.match(app,/const FORMAT=14/);
  assert.match(app,/<strong>Тихая бухта<\/strong>/);
});
