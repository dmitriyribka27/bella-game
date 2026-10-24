import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const art=readFileSync(new URL('../docs/assets/interiors/market-v1.webp',import.meta.url));

test('market environment is a compact WebP asset loaded only when the market is entered',()=>{
  assert.equal(art.toString('ascii',0,4),'RIFF');
  assert.equal(art.toString('ascii',8,12),'WEBP');
  assert.ok(art.byteLength>100_000&&art.byteLength<650_000);
  assert.match(app,/function showMarket\(\)/);
  assert.match(app,/src="\.\/assets\/interiors\/market-v1\.webp"/);
});

test('market location opens four visual-only views and closes cleanly',()=>{
  assert.match(app,/if\(id==='market'\)actions\+='/);
  assert.match(app,/if\(button\.hasAttribute\('data-location-market-enter'\)\)/);
  assert.match(app,/data-market-view="\$\{id\}"/);
  for(const view of ['fruits','bakery','flowers']){
    assert.ok(app.includes(`.marketScene[data-view="${view}"]`));
  }
  assert.match(app,/dialog\.classList\.add\('marketDialog'\)/);
  assert.match(app,/dialog\.classList\.remove\([^\n]*'marketDialog'[^\n]*\)/);
});

test('market has no gameplay rewards and preserves save format',()=>{
  const start=app.indexOf('function showMarket(){');
  const end=app.indexOf('function showHomeStory(',start);
  assert.ok(start>=0&&end>start);
  const market=app.slice(start,end);
  assert.doesNotMatch(market,/unlockMemory\(|changed\(|coins\s*[+\-]=|xp\s*[+\-]=|data-home-story/);
  assert.match(app,/const FORMAT=13/);
  assert.match(app,/версия 0\.9\.10/);
});
