import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const art=readFileSync(new URL('../docs/assets/interiors/greenhouse-v1.webp',import.meta.url));

test('greenhouse image uses a compact lazily mounted WebP illustration',()=>{
  assert.equal(art.toString('ascii',0,4),'RIFF');
  assert.equal(art.toString('ascii',8,12),'WEBP');
  assert.ok(art.byteLength>100_000&&art.byteLength<650_000);
  assert.match(app,/function showGreenhouse\(\)/);
  assert.match(app,/src="\.\/assets\/interiors\/greenhouse-v1\.webp"/);
});

test('greenhouse location supports four zoom views and closing',()=>{
  assert.match(app,/if\(id==='greenhouse'\)actions\+='/);
  assert.match(app,/if\(button\.hasAttribute\('data-location-greenhouse-enter'\)\)/);
  assert.match(app,/data-greenhouse-view="\$\{id\}"/);
  for(const view of ['tropical','flowers','rest']){
    assert.ok(app.includes(`.greenhouseScene[data-view="${view}"]`));
  }
  assert.match(app,/dialog\.classList\.add\('greenhouseDialog'\)/);
  assert.match(app,/dialog\.classList\.remove\([^\n]*'greenhouseDialog'[^\n]*\)/);
});

test('greenhouse remains a visual-only location without save schema change',()=>{
  const start=app.indexOf('function showGreenhouse(){');
  const end=app.indexOf('function showLevHome(',start);
  assert.ok(start>=0&&end>start);
  const greenhouse=app.slice(start,end);
  assert.doesNotMatch(greenhouse,/unlockMemory\(|changed\(|coins\s*[+\-]=|xp\s*[+\-]=|data-home-story/);
  assert.match(app,/const FORMAT=13/);
  assert.match(app,/город Беллы · версия \d+\.\d+\.\d+ · 2D/);
});
