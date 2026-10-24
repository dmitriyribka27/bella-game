import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const homeArt=readFileSync(new URL('../docs/assets/interiors/ryzhiy-home-v1.webp',import.meta.url));

test('approved Ryzhiy house illustration loads as a lightweight standalone WebP',()=>{
  assert.equal(homeArt.toString('ascii',0,4),'RIFF');
  assert.equal(homeArt.toString('ascii',8,12),'WEBP');
  assert.ok(homeArt.byteLength>100_000,'retain furniture and bedroom details');
  assert.ok(homeArt.byteLength<500_000,'avoid slowing down mobile connections');
  assert.match(app,/src="\.\/assets\/interiors\/ryzhiy-home-v1\.webp"/);
});

test('Ryzhiy house can be opened from its location and resident card',()=>{
  assert.match(app,/function showRyzhiyHome\(room='all'\)/);
  assert.match(app,/data-location-ryzhiy-enter/);
  assert.match(app,/data-action="ryzhiy-home"/);
  assert.match(app,/if\(button\.hasAttribute\('data-location-ryzhiy-enter'\)\)/);
  assert.match(app,/else if\(b\.dataset\.action==='ryzhiy-home'\)showRyzhiyHome\(\)/);
});

test('Ryzhiy house supports all rooms and resets its modal on exit',()=>{
  for(const room of ['all','lounge','kitchen','bedroom']){
    assert.match(app,new RegExp(`\\['${room}','`));
  }
  assert.match(app,/data-ryzhiy-room="\$\{id\}"/);
  for(const room of ['lounge','kitchen','bedroom']){
    assert.ok(app.includes(`.ryzhiyHomeScene[data-room="${room}"]`));
  }
  assert.match(app,/option\.setAttribute\('aria-pressed',String\(active\)\)/);
  assert.match(app,/dialog\.classList\.add\('ryzhiyHomeDialog'\)/);
  assert.match(app,/dialog\.classList\.remove\([^\n]*'ryzhiyHomeDialog'[^\n]*\)/);
  assert.match(app,/const FORMAT=12/,'new memories use a migrated save format');
  assert.match(app,/\[1,2,3,4,5,6,7,8,9,10,11,FORMAT\]/,'old saves remain importable');
});
