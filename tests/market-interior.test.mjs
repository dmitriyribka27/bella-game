import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const art=readFileSync(new URL('../docs/assets/interiors/market-v1.webp',import.meta.url));

test('market environment is a compact WebP asset loaded only when the market is entered',()=>{
  assert.equal(art.toString('ascii',0,4),'RIFF');
  assert.equal(art.toString('ascii',8,12),'WEBP');
  assert.ok(art.byteLength>100_000&&art.byteLength<650_000);
  assert.match(app,/function showMarket\(view='all'\)/);
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

test('market scenery remains viewable without any quest actions',()=>{
  const start=app.indexOf("function showMarket(view='all'){");
  const end=app.indexOf('function showMarketShop(',start);
  assert.ok(start>=0&&end>start);
  const market=app.slice(start,end);
  assert.doesNotMatch(market,/unlockMemory\(|changed\(|coins\s*[+\-]=|xp\s*[+\-]=|data-home-story/);
  assert.match(app,/const FORMAT=13/);
  assert.match(app,/город Беллы · версия \d+\.\d+\.\d+ · 2D/);
});

test('central market stall has touch-friendly buying and return actions',()=>{
  assert.match(app,/class="marketSnackHotspot" data-market-shop-open/);
  assert.match(app,/class="marketShopLaunch" data-market-shop-open/);
  assert.match(app,/function showMarketShop\(message=''\)/);
  assert.match(app,/data-market-buy="\$\{item\.id\}"/);
  assert.match(app,/if\(button\.dataset\.marketBuy!==undefined\)/);
  assert.match(app,/city\.coins=purchase\.balance;\s*changed\(\)/);
  assert.match(app,/data-market-shop-back/);
  assert.match(app,/dialog\.classList\.remove\([^\n]*'marketShopDialog'[^\n]*\)/);
});
