import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const art=readFileSync(new URL('../docs/assets/interiors/lev-home-v1.webp',import.meta.url));

test('Lev house has a lightweight interior matching the approved art',()=>{
  assert.equal(art.toString('ascii',0,4),'RIFF');
  assert.equal(art.toString('ascii',8,12),'WEBP');
  assert.ok(art.byteLength>100_000&&art.byteLength<750_000);
  assert.match(app,/function showLevHome\(\)/);
  assert.match(app,/src="\.\/assets\/interiors\/lev-home-v1\.webp"/);
});

test('Lev can enter from either home location or resident dashboard',()=>{
  assert.match(app,/data-location-lev-enter/);
  assert.match(app,/if\(button\.hasAttribute\('data-location-lev-enter'\)\)/);
  assert.match(app,/data-action="lev-home"/);
  assert.match(app,/else if\(b\.dataset\.action==='lev-home'\)showLevHome\(\)/);
  assert.match(app,/dialog\.classList\.add\('levHomeDialog'\)/);
  assert.match(app,/dialog\.classList\.remove\([^\n]*'levHomeDialog'[^\n]*\)/);
});

test('Lev house has four focus zones without creating new economy or saves',()=>{
  for(const view of ['workshop','play','lounge','loft']){
    assert.ok(app.includes(`.levHomeScene[data-view="${view}"]`));
  }
  assert.match(app,/data-lev-home-view="\$\{id\}"/);
  assert.match(app,/\['all','workshop','play','lounge','loft'\]\.includes\(view\)/);
  const start=app.indexOf('function showLevHome(){');
  const end=app.indexOf('function showHomeStory(',start);
  assert.ok(start>=0&&end>start);
  const lev=app.slice(start,end);
  assert.doesNotMatch(lev,/changed\(|coins\s*[+\-]=|unlockMemory\(|data-home-story/);
  assert.match(app,/const FORMAT=13/);
  assert.match(app,/город Беллы · версия 0\.9\.13 · 2D/);
});
