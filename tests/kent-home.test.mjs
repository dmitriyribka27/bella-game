import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const art=readFileSync(new URL('../docs/assets/interiors/kent-home-v1.webp',import.meta.url));

test('Kent house uses a compact high-detail WebP illustration',()=>{
  assert.equal(art.toString('ascii',0,4),'RIFF');
  assert.equal(art.toString('ascii',8,12),'WEBP');
  assert.ok(art.byteLength>100_000&&art.byteLength<750_000);
  assert.match(app,/function showKentHome\(view='all'\)/);
  assert.match(app,/src="\.\/assets\/interiors\/kent-home-v1\.webp"/);
});

test('Kent house is accessible from both map building and resident dashboard',()=>{
  assert.match(app,/data-location-kent-enter/);
  assert.match(app,/if\(button\.hasAttribute\('data-location-kent-enter'\)\)/);
  assert.match(app,/data-action="kent-home"/);
  assert.match(app,/else if\(b\.dataset\.action==='kent-home'\)showKentHome\(\)/);
  assert.match(app,/dialog\.classList\.add\('kentHomeDialog'\)/);
  assert.match(app,/dialog\.classList\.remove\([^\n]*'kentHomeDialog'[^\n]*\)/);
});

test('Kent house has four focused views without changing save data or economics',()=>{
  const start=app.indexOf("function showKentHome(view='all'){");
  const end=app.indexOf('function showHomeStory(',start);
  assert.ok(start>=0&&end>start);
  const kent=app.slice(start,end);
  for(const view of ['desk','secret','chair','terrace']){
    assert.ok(app.includes(`.kentHomeScene[data-view="${view}"]`));
  }
  assert.match(app,/data-kent-home-view="\$\{id\}"/);
  assert.match(app,/\['all','desk','secret','chair','terrace'\]\.includes\(view\)/);
  assert.doesNotMatch(kent,/changed\(|unlockMemory\(|coins\s*[+\-]=/);
  assert.match(app,/const FORMAT=13/);
  assert.match(app,/город Беллы · версия \d+\.\d+\.\d+ · 2D/);
});
