import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../docs/map2d.js',import.meta.url),'utf8');
const {createMap}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('static island redraws only when camera or images change, while cats animate',()=>{
  const originals=Object.fromEntries(['document','window','innerWidth','innerHeight','devicePixelRatio','Image','ResizeObserver'].map(key=>[key,globalThis[key]]));
  const paint={island:0,cats:0};
  const makeContext=layer=>new Proxy({}, {get(target,key){
    if(key==='fillRect'&&layer==='island')return ()=>paint.island++;
    if(key==='clearRect'&&layer==='cats')return ()=>paint.cats++;
    if(key==='createRadialGradient'||key==='createLinearGradient')return ()=>({addColorStop(){}});
    if(typeof target[key]==='function')return target[key];
    return ()=>{};
  },set(target,key,value){target[key]=value;return true;}});
  const listeners=new Map();
  const background={style:{},getContext:()=>makeContext('island')};
  const foreground={style:{},getContext:()=>makeContext('cats'),addEventListener:(event,handler)=>listeners.set(event,handler)};
  const sheet={getBoundingClientRect:()=>({top:710})};
  const labels={append(){}};
  const residents={children:[],append(button){this.children.push(button);}};
  const elements={mapBackground:background,sheet,catLabels:labels,residents,zoomIn:{},zoomOut:{},fitMap:{},mapLoading:{hidden:false}};
  const loaded=[];
  try{
    globalThis.innerWidth=420;
    globalThis.innerHeight=900;
    globalThis.devicePixelRatio=3;
    globalThis.document={hidden:false,getElementById:id=>elements[id],createElement:kind=>kind==='canvas'?{width:0,height:0,getContext:()=>makeContext('scratch')}:{style:{},dataset:{},classList:{toggle(){}}}};
    globalThis.window={addEventListener(){}};
    globalThis.ResizeObserver=undefined;
    globalThis.Image=class {constructor(){loaded.push(this);this.width=100;this.height=100;}set src(value){this.source=value;}};
    const map=createMap({canvas:foreground,catArt:{},getCity:()=>({paused:false,cats:[]}),getSelected:()=>null,onSelect(){},onLocation(){},onNotice(){}});
    assert.equal(background.width,1260,'island stays Retina 3x');
    assert.equal(foreground.width,840,'sprite layer uses lightweight 2x');
    map.render(50);
    map.render(100);
    assert.equal(paint.island,1,'island is not repainted for each animation frame');
    assert.equal(paint.cats,2,'sprite layer is cleared each animation frame');
    map.invalidate();
    map.render(150);
    assert.equal(paint.island,1,'ordinary game changes do not repaint the scenery');
    elements.zoomIn.onclick();
    map.render(200);
    assert.equal(paint.island,2,'zooming invalidates the island scene');
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
