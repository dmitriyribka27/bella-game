import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const art=readFileSync(new URL('../docs/assets/interiors/boathouse-v1.webp',import.meta.url));

test('boathouse illustration is an optimized lazy-loaded WebP asset',()=>{
  assert.equal(art.toString('ascii',0,4),'RIFF');
  assert.equal(art.toString('ascii',8,12),'WEBP');
  assert.ok(art.byteLength>100_000);
  assert.ok(art.byteLength<600_000);
  assert.match(app,/function showBoathouse\(\)/);
  assert.match(app,/src="\.\/assets\/interiors\/boathouse-v1\.webp"/);
});

test('marina location enters the boathouse with four selectable views and close support',()=>{
  assert.match(app,/if\(id==='marina'\)actions\+='/);
  assert.match(app,/if\(button\.hasAttribute\('data-location-boathouse-enter'\)\)/);
  assert.match(app,/data-boathouse-view="\$\{id\}"/);
  for(const view of ['workshop','boat','pier']){
    assert.ok(app.includes(`.boathouseScene[data-view="${view}"]`));
  }
  assert.match(app,/dialog\.classList\.add\('boathouseDialog'\)/);
  assert.match(app,/dialog\.classList\.remove\([^\n]*'boathouseDialog'[^\n]*\)/);
});

test('boathouse is visual-only and preserves existing save compatibility',()=>{
  const start=app.indexOf('function showBoathouse(){');
  const end=app.indexOf('function showHomeStory(',start);
  assert.ok(start>=0&&end>start);
  const boathouse=app.slice(start,end);
  assert.doesNotMatch(boathouse,/unlockMemory\(|changed\(|coins\s*[+\-]=|xp\s*[+\-]=|data-home-story/);
  assert.match(app,/const FORMAT=13/);
  assert.match(app,/версия 0\.9\.8/);
});
