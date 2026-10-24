import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../docs/map2d.js',import.meta.url),'utf8');
const {createMap}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('static island redraws only when camera or images change, while cats animate',()=>{
  const originals=Object.fromEntries(['document','window','innerWidth','innerHeight','devicePixelRatio','Image','ResizeObserver'].map(key=>[key,globalThis[key]]));
  const paint={island:0,cats:0,glows:0};
  const makeContext=layer=>new Proxy({}, {get(target,key){
    if(key==='fillRect'&&layer==='island')return ()=>paint.island++;
    if(key==='clearRect'&&layer==='cats')return ()=>paint.cats++;
    if(key==='fill'&&layer==='glows')return ()=>paint.glows++;
    if(key==='createRadialGradient'||key==='createLinearGradient')return ()=>({addColorStop(){}});
    if(typeof target[key]==='function')return target[key];
    return ()=>{};
  },set(target,key,value){target[key]=value;return true;}});
  const listeners=new Map();
  const background={style:{},getContext:()=>makeContext('island')};
  const foreground={style:{},getContext:()=>makeContext('cats'),addEventListener:(event,handler)=>listeners.set(event,handler)};
  const nightLights={style:{},getContext:()=>makeContext('glows')};
  const sheet={getBoundingClientRect:()=>({top:710})};
  const labelElements=[];
  const labels={append(tag){labelElements.push(tag);}};
  const residents={children:[],append(button){this.children.push(button);}};
  const elements={mapBackground:background,nightLights,sheet,catLabels:labels,residents,zoomIn:{},zoomOut:{},fitMap:{},mapLoading:{hidden:false}};
  const loaded=[];
  try{
    globalThis.innerWidth=420;
    globalThis.innerHeight=900;
    globalThis.devicePixelRatio=3;
    globalThis.document={hidden:false,getElementById:id=>elements[id],createElement:kind=>kind==='canvas'?{width:0,height:0,getContext:()=>makeContext('scratch')}:{style:new Proxy({displayChanges:0},{set(target,key,value){if(key==='display'&&target[key]!==value)target.displayChanges++;target[key]=value;return true;}}),dataset:{},classList:{toggle(){}}}};
    globalThis.window={addEventListener(){}};
    globalThis.ResizeObserver=undefined;
    globalThis.Image=class {constructor(){loaded.push(this);this.width=100;this.height=100;}set src(value){this.source=value;}};
    const city={paused:false,cats:[{id:'kent',x:10.25,y:8.53,target:[10.25,8.53]}]};
    const map=createMap({canvas:foreground,catArt:{kent:{src:'test-cat.png'}},getCity:()=>city,getSelected:()=> 'kent',onSelect(){},onLocation(){},onNotice(){}});
    assert.equal(background.width,1260,'island stays Retina 3x');
    assert.equal(foreground.width,840,'sprite layer uses lightweight 2x');
    assert.equal(nightLights.width,630,'night glows render at only 1.5x resolution');
    loaded.find(image=>image.source==='test-cat.png').onload();
    map.render(50);
    assert.equal(labelElements[0].style.display,'block','resident label becomes visible');
    map.render(100);
    assert.equal(paint.island,1,'island is not repainted for each animation frame');
    const firstGlows=paint.glows;
    assert.ok(firstGlows>0,'warm lights are drawn over visible buildings');
    assert.equal(paint.cats,2,'sprite layer is cleared each animation frame');
    assert.equal(paint.glows,firstGlows,'glows are not repainted for each animation frame');
    assert.equal(labelElements[0].style.displayChanges,2,'labels do not get hidden and shown every frame');
    map.invalidate();
    map.render(150);
    assert.equal(paint.island,1,'ordinary game changes do not repaint the scenery');
    assert.equal(paint.glows,firstGlows,'ordinary game updates do not repaint lights');
    elements.zoomIn.onclick();
    map.render(200);
    assert.equal(paint.island,2,'zooming invalidates the island scene');
    assert.ok(paint.glows>firstGlows,'zoom and pan keep the glows attached to the island');
    const overview=loaded.find(image=>image.source?.endsWith('overview.webp'));
    assert.ok(overview,'overview image is requested');
    overview.onload();
    map.render(250);
    assert.equal(paint.island,3,'late-arriving map art repaints scenery');
    assert.equal(elements.mapLoading.hidden,true);
  }finally{
    for(const [key,value] of Object.entries(originals)){
      if(value===undefined)delete globalThis[key];else globalThis[key]=value;
    }
  }
});
