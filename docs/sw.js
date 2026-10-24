/* Quiet Bay offline app shell and artwork. Saves live in IndexedDB, not here. */
const VERSION='v1.0.1';
const PREFIX='quiet-bay-pwa-';
const SHELL_CACHE=`${PREFIX}${VERSION}-shell`;
const MEDIA_CACHE=`${PREFIX}${VERSION}-media`;

const SHELL=[
  './index.html','./manifest.webmanifest','./icon.svg',
  './apple-touch-icon.png','./icon-192.png','./icon-512.png',
  './cats-art.js','./map2d.js','./book-visitors.js','./book-inventory.js',
  './book-covers.js','./book-scenes.js','./cafe-opening.js',
  './cafe-visitors.js','./home-stories.js','./market-snacks.js',
  './townhall-management.js','./observatory-work.js','./home-upgrades.js',
  './game-economy.js','./game-time.js','./save-health.js','./cat-routines.js',
  './game-audio.js','./daylight.js','./book-visitor-motion.js',
  './assets/island-v1/overview.webp'
];
const MEDIA=[
  './assets/audio/quiet-bay-theme.mp3',
  './assets/cats/bella-hello-kitty-v1.webp',
  './assets/interiors/bella-home-v1.webp',
  './assets/interiors/bella-letter-v1.webp',
  './assets/interiors/boathouse-v1.webp',
  './assets/interiors/citera-home-v1.webp',
  './assets/interiors/greenhouse-v1.webp',
  './assets/interiors/kent-home-v1.webp',
  './assets/interiors/lev-home-v1.webp',
  './assets/interiors/lighthouse-v2.webp',
  './assets/interiors/market-v1.webp',
  './assets/interiors/mia-home-v1.webp',
  './assets/interiors/post-office-v1.webp',
  './assets/interiors/ryzhiy-cafe-v1.webp',
  './assets/interiors/ryzhiy-home-v1.webp',
  './assets/interiors/townhall-v1.webp',
  './assets/island-v1/map-0-0.webp',
  './assets/island-v1/map-0-1.webp',
  './assets/island-v1/map-0-2.webp',
  './assets/island-v1/map-1-0.webp',
  './assets/island-v1/map-1-1.webp',
  './assets/island-v1/map-1-2.webp',
  './assets/island-v1/map-2-0.webp',
  './assets/island-v1/map-2-1.webp',
  './assets/island-v1/map-2-2.webp',
  './assets/island-v1/mia-observatory-hd-1.webp',
  './assets/island-v1/mia-observatory-hd-2.webp',
  './assets/island-v1/mia-observatory-hd-3.webp',
  './assets/island-v1/mia-observatory-hd-4.webp',
  './assets/island-v1/mia-observatory-hd-5.webp',
  './assets/island-v1/mia-observatory-hd-6.webp',
  './assets/island-v1/ryzhiy-townhall-hd-1.webp',
  './assets/island-v1/ryzhiy-townhall-hd-2.webp',
  './assets/island-v1/ryzhiy-townhall-hd-3.webp',
  './assets/island-v1/ryzhiy-east-hd-1.webp',
  './assets/island-v1/ryzhiy-east-hd-2.webp',
  './assets/island-v1/ryzhiy-east-hd-3.webp',
  './assets/island-v1/ryzhiy-east-hd-4.webp',
  './assets/island-v1/bella-detail-v1.webp',
  './assets/island-v1/beach-east-detail-v1.webp',
  './assets/island-v1/beach-west-detail-v1.webp',
  './assets/island-v1/boathouse-detail-v1.webp',
  './assets/island-v1/citera-quarter-detail-v1.webp',
  './assets/island-v1/kent-hospital-lev-detail-v1.webp',
  './assets/island-v1/lighthouse-detail-v1.webp',
  './assets/island-v1/pier-detail-v1.webp',
  './assets/island-v1/pond-detail-v1.webp',
  './assets/island-v1/restaurant-detail-v1.webp'
];

function key(path){
  const url=new URL(path,self.registration.scope);
  return new Request(url.origin+url.pathname);
}
function matchKey(request){
  const url=new URL(request.url);
  return new Request(url.origin+url.pathname);
}
function isMedia(path){return /\.(?:webp|mp3|png|jpg|jpeg)$/i.test(path);}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(SHELL_CACHE);
    await cache.addAll(SHELL.map(key));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name.startsWith(PREFIX)&&name!==SHELL_CACHE&&name!==MEDIA_CACHE).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url),scope=new URL(self.registration.scope);
  if(req.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  const normalized=matchKey(req),media=isMedia(url.pathname),navigation=req.mode==='navigate';
  event.respondWith((async()=>{
    const cache=await caches.open(media?MEDIA_CACHE:SHELL_CACHE);
    if(media){
      const cached=await cache.match(normalized);
      if(cached)return cached;
    }
    try{
      const response=await fetch(req);
      if(response.ok)await cache.put(normalized,response.clone()).catch(()=>{});
      return response;
    }catch{
      const cached=await cache.match(normalized);
      if(cached)return cached;
      if(navigation){
        const home=await caches.open(SHELL_CACHE);
        return await home.match(key('./index.html'))||Response.error();
      }
      return Response.error();
    }
  })());
});

async function status(){
  const shell=await caches.open(SHELL_CACHE),media=await caches.open(MEDIA_CACHE);
  let done=0;
  for(const path of SHELL)if(await shell.match(key(path)))done++;
  for(const path of MEDIA)if(await media.match(key(path)))done++;
  return {type:'CACHE_STATUS',done,total:SHELL.length+MEDIA.length,complete:done===SHELL.length+MEDIA.length};
}
async function report(){
  const result=await status();
  for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true}))client.postMessage(result);
}
let warming=null;
async function warmAll(){
  const cache=await caches.open(MEDIA_CACHE);
  for(let i=0;i<MEDIA.length;i++){
    const resource=key(MEDIA[i]);
    if(!(await cache.match(resource))){
      try{await cache.add(resource);}catch{/* Retry remaining files on next online opening. */}
    }
    if(i%5===4||i===MEDIA.length-1)await report();
  }
}
self.addEventListener('message',event=>{
  if(event.data?.type==='CACHE_STATUS'){event.waitUntil(report());return;}
  if(event.data?.type==='CACHE_ALL'){
    if(!warming)warming=warmAll().finally(()=>{warming=null;});
    event.waitUntil(warming);
  }
});
