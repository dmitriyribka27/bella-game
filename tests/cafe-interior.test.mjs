import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const cafeArt=readFileSync(new URL('../docs/assets/interiors/ryzhiy-cafe-v1.webp',import.meta.url));

test('approved cafe illustration is served as an efficient standalone WebP',()=>{
  assert.equal(cafeArt.toString('ascii',0,4),'RIFF');
  assert.equal(cafeArt.toString('ascii',8,12),'WEBP');
  assert.ok(cafeArt.byteLength<750_000,'the cafe should not slow initial download');
  assert.ok(cafeArt.byteLength>100_000,'preserve illustration detail');
  assert.ok(statSync(new URL('../docs/assets/interiors/ryzhiy-cafe-v1.webp',import.meta.url)).isFile());
});

test('cafe has an accessible interior entry and three focused views',()=>{
  assert.match(app,/function showCafeInterior\(\)/);
  assert.match(app,/data-location-cafe-enter/);
  assert.match(app,/data-cafe="interior"/);
  assert.match(app,/data-cafe-view="all" aria-pressed="true"/);
  assert.match(app,/data-cafe-view="bar" aria-pressed="false"/);
  assert.match(app,/data-cafe-view="tables" aria-pressed="false"/);
  assert.match(app,/\.cafeScene\[data-view="bar"\]/);
  assert.match(app,/\.cafeScene\[data-view="tables"\]/);
});

test('cafe gameplay remains reachable from the interior',()=>{
  assert.match(app,/data-cafe-interior-order/);
  assert.match(app,/coffeeAction\('order'\)/);
  assert.match(app,/data-cafe-interior-manage/);
  assert.match(app,/data-location-cafe>☕ Открыть дела кофейни/);
  assert.match(app,/const FORMAT=13/);
  assert.match(app,/\[1,2,3,4,5,6,7,8,9,10,11,12,FORMAT\]/);
});
