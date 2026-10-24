import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const art=readFileSync(new URL('../docs/assets/interiors/townhall-v1.webp',import.meta.url));

test('town hall shows an optimized illustration loaded only on entry',()=>{
  assert.equal(art.toString('ascii',0,4),'RIFF');
  assert.equal(art.toString('ascii',8,12),'WEBP');
  assert.ok(art.byteLength>100_000&&art.byteLength<650_000);
  assert.match(app,/function showTownHall\(\)/);
  assert.match(app,/src="\.\/assets\/interiors\/townhall-v1\.webp"/);
});

test('town hall opens from existing location and displays five focus zones',()=>{
  assert.match(app,/if\(id==='townhall'\)actions\+='/);
  assert.match(app,/if\(button\.hasAttribute\('data-location-townhall-enter'\)\)/);
  assert.match(app,/data-town-hall-view="\$\{id\}"/);
  for(const view of ['hall','mayor','council','archive','clock']){
    assert.ok(app.includes(`.townHallScene[data-view="${view}"]`));
  }
  assert.match(app,/\['all','hall','mayor','council','archive','clock'\]\.includes\(view\)/);
  assert.match(app,/dialog\.classList\.add\('townHallDialog'\)/);
  assert.match(app,/dialog\.classList\.remove\([^\n]*'townHallDialog'[^\n]*\)/);
});

test('town hall view controls do not introduce a currency or save mechanic',()=>{
  const start=app.indexOf('function showTownHall(){');
  const end=app.indexOf('function showLevHome(',start);
  assert.ok(start>=0&&end>start);
  const townHall=app.slice(start,end);
  assert.doesNotMatch(townHall,/changed\(|coins\s*[+\-]=|unlockMemory\(|data-home-story/);
  assert.match(app,/const FORMAT=13/);
  assert.match(app,/город Беллы · версия 0\.9\.19 · 2D/);
});
