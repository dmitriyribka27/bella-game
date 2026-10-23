// Drawn island v0.3: Canvas 2D with entrance-to-entrance footpaths.
export const WIDTH=3840,HEIGHT=2560;
const xy=p=>[p[0]*20.5,p[1]*15];
const points={
  observatory:[.293,.181],mia:[.352,.211],miaStairs:[.405,.255],
  northBend:[.446,.267],townhouse:[.505,.282],
  townhall:[.562,.286],squareNorth:[.533,.302],square:[.546,.342],
  squareWest:[.495,.343],squareSouth:[.545,.376],squareEast:[.610,.338],
  market:[.713,.275],marketWalk:[.739,.296],greenhouse:[.657,.216],
  gardenSouth:[.616,.292],gardenStairs:[.634,.246],
  kent:[.352,.355],kentCross:[.392,.379],hospital:[.443,.388],officeEast:[.490,.381],
  restaurant:[.363,.525],terrace:[.419,.523],pondNorth:[.469,.518],
  lowerCross:[.486,.479],lev:[.488,.440],midStairs:[.523,.401],
  lowerSquare:[.484,.519],bookApproach:[.513,.566],citera:[.553,.588],
  bella:[.333,.665],bellaGate:[.362,.686],
  promWest:[.418,.677],promMiddle:[.496,.635],promEast:[.616,.614],
  residence:[.695,.510],residenceFront:[.722,.513],
  post:[.672,.580],eastWalk:[.732,.555],east:[.754,.490],
  eastStairs:[.752,.440],cafe:[.713,.394],ryzhiy:[.651,.361],
  marketStairs:[.738,.387],lighthouseUpper:[.354,.719],
  lighthouseStairs:[.336,.780],lighthouse:[.290,.805],
  promStairsEast:[.647,.663],
  marinaSide:[.642,.715],marina:[.682,.748],pier:[.732,.820]
};
// Every adjacent pair in a chain follows a visible paved path or staircase.
const paths=[
  'observatory mia miaStairs northBend townhouse squareNorth squareWest square',
  'squareNorth townhall',
  'squareEast gardenSouth gardenStairs greenhouse',
  'market marketWalk marketStairs cafe ryzhiy squareEast square',
  'marketStairs eastStairs east eastWalk post promEast',
  'squareWest officeEast hospital kentCross kent',
  'square squareSouth midStairs lev lowerCross lowerSquare',
  'lowerCross pondNorth terrace restaurant',
  'lowerSquare bookApproach citera',
  'citera promMiddle',
  'citera post eastWalk',
  'eastWalk residenceFront residence',
  'bella bellaGate promWest promMiddle promEast',
  'promWest lighthouseUpper lighthouseStairs lighthouse',
  'promEast promStairsEast marinaSide marina',
  'marina pier',
  'eastWalk eastStairs'
];
const pairs=paths.flatMap(path=>{const ids=path.split(' ');return ids.slice(1).map((id,i)=>[ids[i],id]);});
export const NODES=Object.fromEntries(Object.entries(points).map(([k,p])=>[k,xy(p)]));
const links=Object.fromEntries(Object.keys(NODES).map(k=>[k,[]]));
for(const [a,b] of pairs){links[a].push(b);links[b].push(a);}
export const HOME_POINTS={kent:NODES.kent,mia:NODES.mia,lev:NODES.lev,citera:NODES.citera,ryzhiy:NODES.ryzhiy,bella:NODES.bella};
// Kent now works as mayor in the clock-tower town hall.
export const WORK_POINTS={kent:NODES.townhall,mia:NODES.observatory,lev:NODES.hospital,citera:NODES.citera,ryzhiy:NODES.cafe,bella:NODES.square};
export const SITE_POINTS={cafe:NODES.cafe,restaurant:NODES.restaurant,hospital:NODES.hospital,post:NODES.post,observatory:NODES.observatory,market:NODES.market,greenhouse:NODES.greenhouse,townhall:NODES.townhall};
export const BUILDING_POINTS={...HOME_POINTS,...SITE_POINTS,townhouse:NODES.townhouse,residence:NODES.residence,lighthouse:NODES.lighthouse,marina:NODES.marina};
// The gameplay layer has one named touch target for every occupied house,
// workplace or destination. Ordinary unoccupied residences deliberately have
// no target. All coordinates are normalized to the full illustrated island.
export const LOCATIONS=[
  {id:'observatory',u:.315,v:.140,rx:.037,ry:.052},
  {id:'mia',u:.391,v:.177,rx:.052,ry:.052},
  {id:'kent',u:.350,v:.293,rx:.048,ry:.049},
  {id:'lev',u:.483,v:.405,rx:.044,ry:.046},
  {id:'hospital',u:.437,v:.335,rx:.044,ry:.052},
  {id:'townhall',u:.569,v:.238,rx:.050,ry:.065},
  {id:'greenhouse',u:.659,v:.163,rx:.043,ry:.049},
  {id:'market',u:.711,v:.233,rx:.060,ry:.043},
  {id:'ryzhiy',u:.659,v:.324,rx:.041,ry:.044},
  {id:'cafe',u:.708,v:.367,rx:.039,ry:.042},
  {id:'restaurant',u:.352,v:.453,rx:.070,ry:.066},
  // The blue-roof post office is below/right of a non-interactive residence.
  {id:'post',u:.724,v:.579,rx:.044,ry:.052},
  {id:'citera',u:.568,v:.528,rx:.054,ry:.052},
  {id:'bella',u:.325,v:.619,rx:.055,ry:.051},
  {id:'lighthouse',u:.293,v:.745,rx:.041,ry:.056},
  {id:'marina',u:.684,v:.680,rx:.051,ry:.051},
  {id:'pier',u:.732,v:.818,rx:.038,ry:.062},
  {id:'pond',u:.454,v:.573,rx:.049,ry:.040}
];
export const LOCATION_POINTS={...HOME_POINTS,...SITE_POINTS,lighthouse:NODES.lighthouse,marina:NODES.marina,pier:NODES.pier,pond:NODES.pondNorth};
export function locationAt(u,v){
  let nearest=null,best=Infinity;
  for(const spot of LOCATIONS){const dx=(u-spot.u)/spot.rx,dy=(v-spot.v)/spot.ry;
    if(Math.abs(dx)>1||Math.abs(dy)>1)continue;
    const score=dx*dx+dy*dy;if(score<best){best=score;nearest=spot.id;}
  }
  return nearest;
}
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function nearest(p){return Object.keys(NODES).reduce((a,b)=>distance(p,NODES[a])<distance(p,NODES[b])?a:b);}
export function route(from,to){
  const start=nearest(from),end=nearest(to),cost={[start]:0},prev={},open=new Set(Object.keys(NODES));
  while(open.size){let u=[...open].reduce((a,b)=>(cost[a]??Infinity)<(cost[b]??Infinity)?a:b);if(!Number.isFinite(cost[u]))break;open.delete(u);if(u===end)break;
    for(const v of links[u]){const d=cost[u]+distance(NODES[u],NODES[v]);if(d<(cost[v]??Infinity)){cost[v]=d;prev[v]=u;}}
  }
  const ids=[end];while(ids[0]!==start){const p=prev[ids[0]];if(!p)throw Error('Disconnected island path');ids.unshift(p);}
  return ids.map(k=>[...NODES[k]]);
}
export function walkTarget(){const list=[...Object.values(BUILDING_POINTS),NODES.square,NODES.promMiddle,NODES.pier];return [...list[Math.floor(Math.random()*list.length)]];}
const routes=new WeakMap();
export function advance(cat,dt){
  const key=cat.target.join(',');let r=routes.get(cat);
  if(!r||r.key!==key){r={key,points:route([cat.x,cat.y],cat.target),index:0};routes.set(cat,r);}
  let remaining=dt*.30;
  while(remaining>0&&r.index<r.points.length){const p=r.points[r.index],d=distance([cat.x,cat.y],p);if(d<=remaining){cat.x=p[0];cat.y=p[1];remaining-=d;r.index++;}else{cat.x+=(p[0]-cat.x)*remaining/d;cat.y+=(p[1]-cat.y)*remaining/d;remaining=0;}}
  if(r.index===r.points.length){cat.x=cat.target[0];cat.y=cat.target[1];}
}

export function createMap({canvas,catArt,getCity,getSelected,onSelect,onLocation,onNotice}){
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas 2D недоступен');
  const camera={x:WIDTH/2,y:HEIGHT/2,scale:1,min:.1,max:1.15};
  const images=new Map(),tiles=new Map(),details=new Map(),pointers=new Map();let width=0,height=0,dpr=1,overview=null,dirty=true,last=0,gesture=null,hitCats=[];
  const detailPatches=[
    // Kent's residence, Lev's cottage, and the former pink residential building
    // repurposed as the hospital. Later patches protect the restaurant facade.
    {name:'kent-hospital-lev',x:1090,y:570,w:1120,h:780},
    // Mia's wisteria-covered house and the nearby dome observatory. The full
    // illustrated artwork is retained at 3x Retina resolution in six strips;
    // straight whole-pixel boundaries avoid gaps on pinch zoom.
    {name:'mia-observatory-hd-1',file:'mia-observatory-hd-1.webp',x:925,y:145,w:880,h:98},
    {name:'mia-observatory-hd-2',file:'mia-observatory-hd-2.webp',x:925,y:243,w:880,h:99},
    {name:'mia-observatory-hd-3',file:'mia-observatory-hd-3.webp',x:925,y:342,w:880,h:98},
    {name:'mia-observatory-hd-4',file:'mia-observatory-hd-4.webp',x:925,y:440,w:880,h:98},
    {name:'mia-observatory-hd-5',file:'mia-observatory-hd-5.webp',x:925,y:538,w:880,h:99},
    {name:'mia-observatory-hd-6',file:'mia-observatory-hd-6.webp',x:925,y:637,w:880,h:98},
    {name:'restaurant',x:1080,y:960,w:580,h:460},
    {name:'bella',x:1030,y:1430,w:590,h:360},
    {name:'pond',x:1470,y:1315,w:450,h:350},
    // Citera's bookshop, post office and neighboring residence. Keep this
    // behind the coastal patches so the boathouse shoreline stays intact.
    {name:'citera-quarter',x:1750,y:900,w:1296,h:853},
    // Two overlapping Retina-resolution neighborhood illustrations, shipped
    // as seven strips so no individual WebP needs to be downscaled on upload.
    // Whole-world-pixel seams and original alpha edges preserve alignment.
    {name:'ryzhiy-townhall-hd-1',file:'ryzhiy-townhall-hd-1.webp',x:1810,y:350,w:690,h:193},
    {name:'ryzhiy-townhall-hd-2',file:'ryzhiy-townhall-hd-2.webp',x:1810,y:543,w:690,h:194},
    {name:'ryzhiy-townhall-hd-3',file:'ryzhiy-townhall-hd-3.webp',x:1810,y:737,w:690,h:193},
    {name:'ryzhiy-east-hd-1',file:'ryzhiy-east-hd-1.webp',x:2350,y:230,w:620,h:230},
    {name:'ryzhiy-east-hd-2',file:'ryzhiy-east-hd-2.webp',x:2350,y:460,w:620,h:230},
    {name:'ryzhiy-east-hd-3',file:'ryzhiy-east-hd-3.webp',x:2350,y:690,w:620,h:230},
    {name:'ryzhiy-east-hd-4',file:'ryzhiy-east-hd-4.webp',x:2350,y:920,w:620,h:230},
    // The coastal art is aligned against recognizable landmarks in the island map.
    // Each transparent WebP softly fades into the existing 2D artwork at its edges.
    {name:'lighthouse',x:880,y:1710,w:530,h:482.5},
    {name:'beach-west',x:1340,y:1790,w:560,h:467.5},
    {name:'beach-east',x:1860,y:1770,w:550,h:500},
    {name:'boathouse',x:2340,y:1640,w:570,h:490},
    {name:'pier',x:2510,y:1930,w:530,h:482.5}
  ];
  const sheet=document.getElementById('sheet'),tags=document.getElementById('catLabels');
  const resident=document.getElementById('residents');
  const names={kent:'Кент',mia:'Мия',lev:'Лев',citera:'Цитера',ryzhiy:'Рыжий',bella:'Белла'};
  const labels=new Map();
  for(const [id,art] of Object.entries(catArt)){
    const img=new Image();img.onload=()=>{images.set(id,img);dirty=true;};img.src=art.src;
    const tag=document.createElement('div');tag.className='catLabel';tag.textContent=names[id]||id;tags.append(tag);labels.set(id,tag);
    const button=document.createElement('button');button.textContent=names[id]||id;button.dataset.resident=id;button.onclick=()=>{onSelect(id);const c=getCity().cats.find(c=>c.id===id);focus(c.x,c.y);};resident.append(button);
  }
  function region(){return {top:112,bottom:Math.max(200,sheet.getBoundingClientRect().top-10)};}
  function center(){const r=region();return [width/2,(r.top+r.bottom)/2];}
  function worldAt(x,y){const c=center();return [camera.x+(x-c[0])/camera.scale,camera.y+(y-c[1])/camera.scale];}
  function screenAt(x,y){const c=center();return [(x-camera.x)*camera.scale+c[0],(y-camera.y)*camera.scale+c[1]];}
  function clampCamera(){const r=region(),hw=width/(camera.scale*2),hh=(r.bottom-r.top)/(camera.scale*2);camera.x=Math.max(-hw*.1,Math.min(WIDTH+hw*.1,camera.x));camera.y=Math.max(-hh*.1,Math.min(HEIGHT+hh*.1,camera.y));}
  function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,3);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';const r=region();camera.min=Math.min(width/WIDTH,(r.bottom-r.top)/HEIGHT)*.94;camera.scale=Math.max(camera.min,Math.min(camera.max,camera.scale));dirty=true;}
  function fit(){resize();camera.x=WIDTH/2;camera.y=HEIGHT/2;camera.scale=camera.min;dirty=true;}
  function zoom(factor,x=width/2,y=center()[1]){const anchor=worldAt(x,y);camera.scale=Math.max(camera.min,Math.min(camera.max,camera.scale*factor));const after=worldAt(x,y);camera.x+=anchor[0]-after[0];camera.y+=anchor[1]-after[1];clampCamera();dirty=true;}
  function focus(x,y){camera.x=x/20.5*WIDTH;camera.y=y/15*HEIGHT;camera.scale=Math.max(camera.scale,Math.min(.55,camera.min*4.5));clampCamera();dirty=true;}
  function tile(row,col){const key=row+'-'+col;let t=tiles.get(key);if(!t){t={image:null,loading:true,used:performance.now(),retryAt:0};tiles.set(key,t);const img=new Image();img.onload=()=>{t.image=img;t.loading=false;dirty=true;};img.onerror=()=>{t.loading=false;t.retryAt=performance.now()+15000;};img.src='./assets/island-v1/map-'+key+'.webp';}t.used=performance.now();return t;}
  function drawMap(){
    const sea=ctx.createRadialGradient(width/2,height*.43,0,width/2,height*.43,Math.max(width,height)*.82);
    sea.addColorStop(0,'#0989aa');sea.addColorStop(1,'#07546f');ctx.fillStyle=sea;ctx.fillRect(0,0,width,height);
    ctx.save();const c=center();ctx.translate(c[0],c[1]);ctx.scale(camera.scale,camera.scale);ctx.translate(-camera.x,-camera.y);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';if(overview)ctx.drawImage(overview,0,0,WIDTH,HEIGHT);
    const used=new Set();if(camera.scale*dpr>.41){const a=worldAt(0,0),b=worldAt(width,height);for(let row=0;row<3;row++)for(let col=0;col<3;col++){
      const x=col*1280,y=Math.floor(row*HEIGHT/3),h=Math.floor((row+1)*HEIGHT/3)-y;
      if(x+1280<a[0]||x>b[0]||y+h<a[1]||y>b[1])continue;
      const key=row+'-'+col;used.add(key);let t=tiles.get(key);if(t&&!t.image&&!t.loading&&performance.now()>t.retryAt){tiles.delete(key);t=null;}t=t||tile(row,col);t.used=performance.now();if(t.image)ctx.drawImage(t.image,x,y,1280,h);
    }}
    for(const [key,t] of [...tiles].sort((a,b)=>a[1].used-b[1].used)){if(tiles.size<=6)break;if(!used.has(key)&&!t.loading){if(t.image)t.image.src='';tiles.delete(key);}}
    // Detail art has its own resolution and is loaded only when its quarter is in view.
    const density=camera.scale*dpr;
    if(density>.7){const a=worldAt(0,0),b=worldAt(width,height);ctx.globalAlpha=Math.min(1,Math.max(0,(density-.7)/.45));
      for(const p of detailPatches){if(p.x+p.w<a[0]||p.x>b[0]||p.y+p.h<a[1]||p.y>b[1])continue;
        let state=details.get(p.name);
        if(!state){state={image:null};details.set(p.name,state);const img=new Image();img.onload=()=>{state.image=img;dirty=true;};img.src='./assets/island-v1/'+(p.file||p.name+'-detail-v1.webp');}
        if(state.image)ctx.drawImage(state.image,p.x,p.y,p.w,p.h);
      }
      ctx.globalAlpha=1;
    }
    ctx.restore();
  }
  function drawCats(now){
    hitCats=[];const city=getCity(),selected=getSelected(),r=region();for(const tag of labels.values())tag.style.display='none';
    const occupied=[];
    for(const cat of [...city.cats].sort((a,b)=>a.y-b.y)){
      const img=images.get(cat.id);if(!img)continue;
      const p=screenAt(cat.x/20.5*WIDTH,cat.y/15*HEIGHT),h=Math.min(70,Math.max(19,65*camera.scale)),w=h*img.width/img.height;
      if(p[0]<-w||p[0]>width+w||p[1]<r.top-20||p[1]>r.bottom+20)continue;
      const moving=!city.paused&&Math.hypot(cat.x-cat.target[0],cat.y-cat.target[1])>.03,bob=moving?Math.sin(now*.012+cat.x)*Math.min(1.5,h*.025):0;
      ctx.fillStyle='#253d3440';ctx.beginPath();ctx.ellipse(p[0],p[1]+1,w*.30,h*.07,0,0,Math.PI*2);ctx.fill();
      if(cat.id===selected){ctx.strokeStyle='#fff0bc';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p[0],p[1],w*.39,h*.1,0,0,Math.PI*2);ctx.stroke();}
      ctx.drawImage(img,p[0]-w/2,p[1]-h+bob,w,h);hitCats.push({id:cat.id,x:p[0],y:p[1]-h/2,w:Math.max(30,w),h:Math.max(32,h)});
      if(camera.scale>camera.min*1.65||cat.id===selected){const tag=labels.get(cat.id),box={x:p[0]-30,y:p[1]-h-24};if(!occupied.some(o=>Math.abs(o.x-box.x)<65&&Math.abs(o.y-box.y)<25)){tag.style.left=p[0]+'px';tag.style.top=(p[1]-h-3)+'px';tag.style.display='block';tag.classList.toggle('selected',cat.id===selected);occupied.push(box);}}
    }
    for(const button of resident.children)button.classList.toggle('active',button.dataset.resident===selected);
  }
  function pick(x,y){const hit=[...hitCats].reverse().find(h=>Math.abs(x-h.x)<h.w/2&&Math.abs(y-h.y)<h.h/2);if(hit){onSelect(hit.id);dirty=true;return;}
    const p=worldAt(x,y),id=locationAt(p[0]/WIDTH,p[1]/HEIGHT);
    if(id){onLocation(id,[...LOCATION_POINTS[id]]);dirty=true;}
  }
  canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)gesture={x:e.clientX,y:e.clientY,moved:false,multi:false};else if(gesture)gesture.multi=true;});
  canvas.addEventListener('pointermove',e=>{const previous=pointers.get(e.pointerId);if(!previous)return;const before=[...pointers.values()];pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const after=[...pointers.values()];if(gesture&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>7)gesture.moved=true;
    if(after.length===1){camera.x-=(e.clientX-previous.x)/camera.scale;camera.y-=(e.clientY-previous.y)/camera.scale;}else if(after.length===2){const a=[(before[0].x+before[1].x)/2,(before[0].y+before[1].y)/2],b=[(after[0].x+after[1].x)/2,(after[0].y+after[1].y)/2];const d0=Math.hypot(before[0].x-before[1].x,before[0].y-before[1].y),d1=Math.hypot(after[0].x-after[1].x,after[0].y-after[1].y);if(d0>5)zoom(d1/d0,a[0],a[1]);camera.x-=(b[0]-a[0])/camera.scale;camera.y-=(b[1]-a[1])/camera.scale;}
    clampCamera();dirty=true;
  });
  const release=e=>{if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);if(e.type==='pointerup'&&!pointers.size&&gesture&&!gesture.moved&&!gesture.multi)pick(e.clientX,e.clientY);if(!pointers.size)gesture=null;};
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,release);
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.002),e.clientX,e.clientY);},{passive:false});
  document.getElementById('zoomIn').onclick=()=>zoom(1.4);document.getElementById('zoomOut').onclick=()=>zoom(1/1.4);document.getElementById('fitMap').onclick=fit;
  const overviewImage=new Image();overviewImage.onload=()=>{
    const soft=document.createElement('canvas');soft.width=overviewImage.width;soft.height=overviewImage.height;
    const s=soft.getContext('2d');s.drawImage(overviewImage,0,0);s.globalCompositeOperation='destination-out';
    const fade=60,w=soft.width,h=soft.height;
    for(const [axis,edge,length] of [['x',0,w],['x',w,w],['y',0,h],['y',h,h]]){
      const from=edge===0?0:edge-fade,to=edge===0?fade:edge;
      const g=axis==='x'?s.createLinearGradient(from,0,to,0):s.createLinearGradient(0,from,0,to);
      g.addColorStop(0,edge===0?'#000':'#0000');g.addColorStop(1,edge===0?'#0000':'#000');
      s.fillStyle=g;if(axis==='x')s.fillRect(from,0,fade,h);else s.fillRect(0,from,w,fade);
    }
    overview=soft;dirty=true;document.getElementById('mapLoading').hidden=true;
  };overviewImage.onerror=()=>{document.getElementById('mapLoading').textContent='Карта не загрузилась. Обнови страницу при подключении к интернету.';onNotice('Не удалось загрузить карту. Прогресс сохранён.');};overviewImage.src='./assets/island-v1/overview.webp';
  window.addEventListener('resize',resize);if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{dirty=true;}).observe(sheet);fit();
  return {focus,fit,render(now){if(document.hidden||getCity().paused&&!dirty)return;if(now-last<40&&!dirty)return;last=now;ctx.setTransform(dpr,0,0,dpr,0,0);drawMap();drawCats(now);dirty=false;},invalidate(){dirty=true;}};
}
