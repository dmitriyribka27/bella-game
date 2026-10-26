import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../docs/sw.js',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../docs/manifest.webmanifest',import.meta.url),'utf8'));
const listed=source.slice(source.indexOf('const SHELL=['),source.indexOf('function key('));
const roots=[...listed.matchAll(/'\.\/([^']+)'/g)].map(match=>match[1]);

test('offline manifest is installable, scoped, and includes every physical asset',()=>{
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.scope,'./');
  assert.ok(manifest.icons.some(icon=>icon.src==='./icon.svg'));
  assert.ok(manifest.icons.some(icon=>icon.src==='./icon-192.png'&&icon.sizes==='192x192'));
  assert.ok(manifest.icons.some(icon=>icon.src==='./icon-512.png'&&icon.sizes==='512x512'));
  assert.ok(roots.length>65);
  assert.equal(new Set(roots).size,roots.length);
  for(const path of roots)assert.ok(existsSync(new URL(`../docs/${path}`,import.meta.url)),`${path} exists`);
  const page=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
  assert.match(page,/rel="apple-touch-icon" sizes="180x180" href="\.\/apple-touch-icon\.png"/);
  const icon=readFileSync(new URL('../docs/apple-touch-icon.png',import.meta.url));
  assert.equal(icon.readUInt32BE(16),180);
  assert.equal(icon.readUInt32BE(20),180);
});

test('offline preload excludes legacy artwork without omitting live imports',()=>{
  const stale=[
    'environment-art.js','quarter-art.js','bookshop-art.js','site-art.js',
    'beach-art.js','environment.js','promenade-art.js','seaside-art.js',
    'assets/interiors/lighthouse-v1.webp',
    'assets/interiors/lighthouse-v2.webp',
    'assets/island-v1/ryzhiy-east-detail-v1.webp',
    'assets/island-v1/ryzhiy-townhall-detail-v1.webp'
  ];
  for(const path of stale)assert.ok(!roots.includes(path),`${path} is not preloaded`);
  const page=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
  const liveImports=[...page.matchAll(/from ["']\.\/([^"']+\.js)(?:\?[^"']*)?["']/g)].map(match=>match[1]);
  for(const path of liveImports)assert.ok(roots.includes(path),`${path} is available offline`);
  assert.match(source,/const VERSION='v1\.0\.8'/);
});

test('service worker opens app and media offline after it has cached files',async()=>{
  const handlers={};
  const sets=new Map();
  let connected=true;
  const origin='https://island.example/bella-game/docs/';
  const respond=async request=>{
    if(!connected)throw Error('offline');
    return new Response(`online:${new URL(request.url).pathname}`,{status:200});
  };
  const caches={
    async keys(){return [...sets.keys()];},
    async delete(name){return sets.delete(name);},
    async open(name){
      if(!sets.has(name))sets.set(name,new Map());
      const content=sets.get(name);
      return {
        async match(request){return content.get(request.url)?.clone();},
        async put(request,response){content.set(request.url,response.clone());},
        async add(request){content.set(request.url,(await respond(request)).clone());},
        async addAll(requests){for(const request of requests)content.set(request.url,(await respond(request)).clone());}
      };
    }
  };
  const self={
    registration:{scope:origin},
    clients:{claim:async()=>{},matchAll:async()=>[]},
    skipWaiting:async()=>{},
    addEventListener(name,handler){handlers[name]=handler;}
  };
  vm.runInNewContext(source,{self,caches,URL,Request,Response,fetch:respond});
  const dispatch=(name,params={})=>{
    let job=Promise.resolve(),response;
    handlers[name]({
      ...params,
      waitUntil(promise){job=Promise.all([job,promise]);},
      respondWith(promise){response=promise;}
    });
    return {job:()=>job,response:()=>response};
  };
  await dispatch('install').job();
  await dispatch('activate').job();
  await dispatch('message',{data:{type:'CACHE_ALL'}}).job();
  connected=false;
  const nav=dispatch('fetch',{request:{url:`${origin}?v=0932`,method:'GET',mode:'navigate'}});
  assert.match(await (await nav.response()).text(),/index\.html/);
  const script=dispatch('fetch',{request:new Request(`${origin}game-time.js?v=1`)});
  assert.match(await (await script.response()).text(),/game-time\.js/);
  const letter=dispatch('fetch',{request:new Request(`${origin}assets/interiors/bella-letter-v1.webp`)});
  assert.match(await (await letter.response()).text(),/bella-letter-v1\.webp/);
  const sound=dispatch('fetch',{request:new Request(`${origin}assets/audio/quiet-bay-theme.mp3?v=1`)});
  assert.match(await (await sound.response()).text(),/quiet-bay-theme\.mp3/);
});
