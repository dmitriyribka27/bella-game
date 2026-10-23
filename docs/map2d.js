// Drawn island v0.3: Canvas 2D only, with visible detail tiles and path-based cats.
export const WIDTH=3840,HEIGHT=2560;
const xy=p=>[p[0]*20.5,p[1]*15];
const points={
  mia:[.347,.257],observatory:[.313,.242],upper:[.405,.305],kent:[.362,.353],
  office:[.443,.396],northSquare:[.513,.332],townhall:[.566,.329],square:[.558,.400],
  lev:[.485,.462],cross:[.514,.496],restaurant:[.388,.558],west:[.325,.589],
  pond:[.478,.603],bella:[.355,.681],bellaGate:[.385,.706],promWest:[.309,.727],
  promMiddle:[.472,.704],promEast:[.613,.657],citera:[.605,.602],post:[.704,.600],
  east:[.747,.520],eastStairs:[.746,.454],cafe:[.707,.416],ryzhiy:[.658,.387],
  marketStairs:[.771,.360],market:[.758,.289],greenhouse:[.700,.229],
  beachWest:[.341,.808],beach:[.458,.800],beachEast:[.569,.772],
  marina:[.692,.750],pier:[.738,.862],residence:[.679,.546]
};
const pairs=[['mia','observatory'],['mia','upper'],['upper','kent'],['upper','northSquare'],
  ['kent','office'],['office','northSquare'],['northSquare','townhall'],['townhall','square'],
  ['office','lev'],['lev','square'],['lev','cross'],['cross','square'],['cross','restaurant'],
  ['restaurant','west'],['restaurant','pond'],['west','bella'],['pond','bellaGate'],
  ['bella','bellaGate'],['bellaGate','promWest'],['bellaGate','promMiddle'],
  ['promWest','promMiddle'],['promMiddle','promEast'],['pond','citera'],
  ['citera','promEast'],['citera','post'],['post','east'],['east','residence'],
  ['east','eastStairs'],['eastStairs','cafe'],['cafe','ryzhiy'],['ryzhiy','square'],
  ['cafe','marketStairs'],['marketStairs','market'],['market','greenhouse'],
  ['greenhouse','townhall'],['promWest','beachWest'],['beachWest','beach'],
  ['beach','beachEast'],['beachEast','marina'],['promEast','marina'],['marina','pier']];
export const NODES=Object.fromEntries(Object.entries(points).map(([k,p])=>[k,xy(p)]));
const links=Object.fromEntries(Object.keys(NODES).map(k=>[k,[]]));
for(const [a,b] of pairs){links[a].push(b);links[b].push(a);}
export const HOME_POINTS={kent:NODES.kent,mia:NODES.mia,lev:NODES.lev,citera:NODES.citera,ryzhiy:NODES.ryzhiy,bella:NODES.bella};
export const WORK_POINTS={kent:NODES.ryzhiy,mia:NODES.observatory,lev:NODES.townhall,citera:NODES.citera,ryzhiy:NODES.cafe,bella:NODES.square};
export const SITE_POINTS={cafe:NODES.cafe,restaurant:NODES.restaurant,post:NODES.post,observatory:NODES.observatory,market:NODES.market,greenhouse:NODES.greenhouse,townhall:NODES.townhall};
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
export function walkTarget(){const list=['square','pond','promMiddle','market','beach','pier','west','cafe','kent','bellaGate'];return [...NODES[list[Math.floor(Math.random()*list.length)]]];}
const routes=new WeakMap();
export function advance(cat,dt){
  const key=cat.target.join(',');let r=routes.get(cat);
  if(!r||r.key!==key){r={key,points:route([cat.x,cat.y],cat.target),index:0};routes.set(cat,r);}
  let remaining=dt*.30;
  while(remaining>0&&r.index<r.points.length){const p=r.points[r.index],d=distance([cat.x,cat.y],p);if(d<=remaining){cat.x=p[0];cat.y=p[1];remaining-=d;r.index++;}else{cat.x+=(p[0]-cat.x)*remaining/d;cat.y+=(p[1]-cat.y)*remaining/d;remaining=0;}}
  if(r.index===r.points.length){cat.x=cat.target[0];cat.y=cat.target[1];}
}

export function createMap({canvas,catArt,getCity,getSelected,onSelect,onHome,onCafe,onNotice}){
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas 2D недоступен');
  const camera={x:WIDTH/2,y:HEIGHT/2,scale:1,min:.1,max:1.15};
  const images=new Map(),tiles=new Map(),pointers=new Map();let width=0,height=0,dpr=1,overview=null,dirty=true,last=0,gesture=null,hitCats=[];
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
  function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';const r=region();camera.min=Math.min(width/WIDTH,(r.bottom-r.top)/HEIGHT)*.94;camera.scale=Math.max(camera.min,Math.min(camera.max,camera.scale));dirty=true;}
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
    const p=worldAt(x,y),u=p[0]/WIDTH,v=p[1]/HEIGHT;
    // Retain existing home selection and the already implemented bookshop.
    const homes=[['bella',.321,.625,.075,.075],['citera',.577,.540,.072,.090],['kent',.347,.301,.050,.065],['mia',.360,.202,.062,.065],['lev',.469,.422,.045,.055],['ryzhiy',.649,.344,.055,.065]];
    for(const [id,hx,hy,rx,ry] of homes)if(Math.abs(u-hx)<rx&&Math.abs(v-hy)<ry){onHome(id);dirty=true;return;}
    if(Math.abs(u-.709)<.040&&Math.abs(v-.379)<.045){onCafe();dirty=true;}
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
