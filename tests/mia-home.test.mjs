import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const art=readFileSync(new URL('../docs/assets/interiors/mia-home-v1.webp',import.meta.url));

test('Mia home uses a compact high-detail illustration loaded on demand',()=>{
  assert.equal(art.toString('ascii',0,4),'RIFF');
  assert.equal(art.toString('ascii',8,12),'WEBP');
  assert.ok(art.byteLength>100_000&&art.byteLength<650_000);
  assert.match(app,/function showMiaHome\(\)/);
  assert.match(app,/src="\.\/assets\/interiors\/mia-home-v1\.webp"/);
});

test('Mia home opens from the map and the resident dashboard',()=>{
  assert.match(app,/data-location-mia-enter/);
  assert.match(app,/if\(button\.hasAttribute\('data-location-mia-enter'\)\)/);
  assert.match(app,/data-action="mia-home"/);
  assert.match(app,/else if\(b\.dataset\.action==='mia-home'\)showMiaHome\(\)/);
  assert.match(app,/dialog\.classList\.add\('miaHomeDialog'\)/);
  assert.match(app,/dialog\.classList\.remove\([^\n]*'miaHomeDialog'[^\n]*\)/);
});

test('Mia home has four focus zones without changing saves or currency',()=>{
  const start=app.indexOf('function showMiaHome(){');
  const end=app.indexOf('function showHomeStory(',start);
  assert.ok(start>=0&&end>start);
  const mia=app.slice(start,end);
  for(const view of ['window','bedroom','treasures','terrace']){
    assert.ok(app.includes(`.miaHomeScene[data-view="${view}"]`));
  }
  assert.match(app,/data-mia-home-view="\$\{id\}"/);
  assert.match(app,/\['all','window','bedroom','treasures','terrace'\]\.includes\(view\)/);
  assert.doesNotMatch(mia,/changed\(|unlockMemory\(|coins\s*[+\-]=|data-home-story/);
  assert.match(app,/const FORMAT=13/);
  assert.match(app,/город Беллы · версия \d+\.\d+\.\d+ · 2D/);
});
