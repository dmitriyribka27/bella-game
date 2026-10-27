import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const worker=readFileSync(new URL('../docs/sw.js',import.meta.url),'utf8');
const sprite=readFileSync(new URL('../docs/assets/cats/bella-hello-kitty-v1.webp',import.meta.url));

test('Bella uses her approved Hello Kitty sprite without replacing the other cats',()=>{
  assert.equal(sprite.toString('ascii',0,4),'RIFF');
  assert.equal(sprite.toString('ascii',8,12),'WEBP');
  assert.ok(sprite.length>5000&&sprite.length<150000);
  assert.match(app,/catArt:\{\.\.\.CAT_ART,bella:\{src:'\.\/assets\/cats\/bella-hello-kitty-v1\.webp'\}\}/);
  assert.match(app,/const FORMAT=14/,'old cities must still load unchanged');
  assert.match(worker,/\.\/assets\/cats\/bella-hello-kitty-v1\.webp/,'the Bella skin is available offline');
  assert.match(worker,/const VERSION='v1\.1\.4'/);
});
