import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const art=readFileSync(new URL('../docs/assets/interiors/lighthouse-v2.webp',import.meta.url));

test('lighthouse uses optimized portrait WebP and lazy interior markup',()=>{
  assert.equal(art.toString('ascii',0,4),'RIFF');
  assert.equal(art.toString('ascii',8,12),'WEBP');
  assert.ok(art.byteLength>100_000);
  assert.ok(art.byteLength<500_000);
  assert.match(app,/src="\.\/assets\/interiors\/lighthouse-v2\.webp"/);
  assert.match(app,/function showLighthouse\(\)/);
});

test('map location opens lighthouse and its four visual views, then exits cleanly',()=>{
  assert.match(app,/if\(id==='lighthouse'\)actions\+='/);
  assert.match(app,/data-location-lighthouse-enter/);
  assert.match(app,/if\(button\.hasAttribute\('data-location-lighthouse-enter'\)\)/);
  assert.match(app,/data-lighthouse-level="\$\{id\}"/);
  for(const level of ['keeper','navigation','lantern']){
    assert.ok(app.includes(`.lighthouseScene[data-level="${level}"]`));
  }
  assert.match(app,/option\.setAttribute\('aria-pressed',String\(active\)\)/);
  assert.match(app,/dialog\.classList\.add\('lighthouseDialog'\)/);
  assert.match(app,/dialog\.classList\.remove\([^\n]*'lighthouseDialog'[^\n]*\)/);
});

test('lighthouse is visual-only and does not alter save format or reward mechanics',()=>{
  const start=app.indexOf('function showLighthouse(){');
  const end=app.indexOf('function showBoathouse(',start);
  assert.ok(start>=0&&end>start);
  const lighthouse=app.slice(start,end);
  assert.doesNotMatch(lighthouse,/unlockMemory\(|changed\(|coins\s*[+\-]=|xp\s*[+\-]=|data-home-story/);
  assert.match(app,/const FORMAT=13/);
});
