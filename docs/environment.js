import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {ENV_ART} from './environment-art.js?v=1';

export function createEnvironment(world,renderer,onReady){
  const textures=new Map(),spriteMaterials=new Map();let lightCount=0,rects=[],buildings=[];
  function texture(kind){
    if(!textures.has(kind)){
      const tex=new T.TextureLoader().load(ENV_ART[kind].src,onReady);
      tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
      textures.set(kind,tex);
    }
    return textures.get(kind);
  }
  const grassMap=texture('grass');grassMap.wrapS=grassMap.wrapT=T.RepeatWrapping;grassMap.repeat.set(.48,.48);
  const grassMaterial=new T.MeshStandardMaterial({color:'#bdc6ae',map:grassMap,bumpMap:grassMap,bumpScale:.035,roughness:1});
  const stoneMap=texture('stone');
  const stoneMaterial=new T.MeshStandardMaterial({color:'#fff5e6',map:stoneMap,bumpMap:stoneMap,bumpScale:.012,roughness:.93});
  const curbMaterial=stoneMaterial.clone();curbMaterial.color.set('#edddc3');
  const unit=new RoundedBoxGeometry(1,1,1,1,.065);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
  const q=shadowCanvas.getContext('2d'),gradient=q.createRadialGradient(32,32,3,32,32,31);
  gradient.addColorStop(0,'rgba(57,65,38,.28)');gradient.addColorStop(.5,'rgba(57,65,38,.16)');gradient.addColorStop(1,'rgba(57,65,38,0)');
  q.fillStyle=gradient;q.fillRect(0,0,64,64);
  const shadowMaterial=new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false});
  const shadowGeometry=new T.PlaneGeometry(1,1);
  function shadow(x,z,w,d,y){const m=new T.Mesh(shadowGeometry,shadowMaterial);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.scale.set(w,d,1);world.add(m);}
  function figure(kind,x,z,height,y=.46){
    if(!spriteMaterials.has(kind))spriteMaterials.set(kind,new T.SpriteMaterial({map:texture(kind),transparent:true,alphaTest:.035,depthWrite:false,toneMapped:false}));
    const s=new T.Sprite(spriteMaterials.get(kind));s.center.set(.5,0);s.position.set(x,y,z);s.scale.set(height*ENV_ART[kind].aspect/world.scale.x,height,1);world.add(s);return s;
  }
  function tree(x,z,size=1){shadow(x+.15,z+.12,2.1*size,1.15*size,.462);return figure('tree',x,z,2.65*size);}
  function bench(x,z,height=1.02,y=.535){shadow(x,z,.95,.5,y+.012);return figure('bench',x,z,height,y);}
  function lantern(x,z,height=2.15,y=.535,lit=false){
    shadow(x+.08,z+.06,.42,.33,y+.012);const s=figure('lantern',x,z,height,y);
    if(lit&&lightCount<6){const l=new T.PointLight('#ffd19a',.85,4.1,2);l.position.set(x+.15,y+height*.72,z+.1);world.add(l);lightCount++;}
    return s;
  }
  function batch(records,mat,cast=false){
    if(!records.length)return;const mesh=new T.InstancedMesh(unit,mat,records.length),dummy=new T.Object3D(),color=new T.Color();
    for(let i=0;i<records.length;i++){
      const r=records[i];dummy.position.set(r.x,r.y,r.z);dummy.rotation.set(0,r.a||0,0);dummy.scale.set(r.w,r.h,r.d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
      color.setRGB(1,1,.985).multiplyScalar(.94+(i*37%13)*.005);mesh.setColorAt(i,color);
    }
    mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=cast;mesh.receiveShadow=true;mesh.computeBoundingSphere();world.add(mesh);
  }
  function contains(x,z,margin=0){return rects.some(r=>Math.abs(x-r.x)<=r.w/2+margin&&Math.abs(z-r.z)<=r.d/2+margin);}
  function paths(sites,spot){
    buildings=sites.map(d=>({id:d.id,p:spot(...d.home)}));
    rects=[...[-11.3,-4.2,3.9,11.1].map(x=>({x,z:-.45,w:1.05,d:19.85})),
      ...[-5.5,5.75].map(z=>({x:0,z,w:29,d:1.05})),{x:0,z:0,w:29.4,d:1.8}];
    for(const site of sites){
      if(['residence_east','post','citera'].includes(site.id))continue;
      const [x,z]=spot(...site.home),near=site.id==='residence_far'?9.48:[-5.5,0,5.75,9.48].reduce((a,b)=>Math.abs(b-z)<Math.abs(a-z)?b:a,-5.5);
      if(Math.abs(near-z)>.32)rects.push({x,z:(near+z)/2,w:site.id==='marina'?.9:.76,d:Math.abs(near-z)+.2});
    }
    // One straight courtyard joins both streets. Doorways face this path,
    // rather than sending a strip of paving underneath the buildings.
    rects.push({x:7.5,z:2.95,w:6.65,d:.68},
      {x:6.48,z:2.52,w:.72,d:.88},{x:9.72,z:2.52,w:.72,d:.88},
      {x:9.045,z:5.28,w:.82,d:.94},
      {x:5.05,z:4.35,w:1.55,d:1.5});
    const size=.55,cells=new Map(),slabs=[],edges=[];
    for(let ix=0;ix<57;ix++)for(let iz=0;iz<38;iz++){
      const x=-15.4+ix*size,z=-10.45+iz*size;
      if(contains(x,z)&&z<8.94)cells.set(ix+','+iz,{ix,iz,x,z});
    }
    for(const cell of cells.values()){
      const {ix,iz,x,z}=cell;
      slabs.push({x,y:.487+(ix*3+iz)%3*.002,z,w:.532,h:.088,d:.532,a:((ix+iz)%3-1)*.008});
      for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]]){
        if(cells.has((ix+dx)+','+(iz+dz))||z>8.25&&dz===1)continue;
        edges.push({x:x+dx*size*.5,y:.513,z:z+dz*size*.5,w:dx?.105:.55,h:.13,d:dz?.105:.55});
      }
    }
    batch(slabs,stoneMaterial);batch(edges,curbMaterial,true);
    grassDetails();
  }
  function promenade(){
    const base=new T.Mesh(new RoundedBoxGeometry(30.65,.12,1.7,2,.06),curbMaterial);base.position.set(0,.63,9.48);base.receiveShadow=true;world.add(base);
    const slabs=[],edges=[];
    for(let i=0;i<29;i++)for(let row=0;row<2;row++)slabs.push({x:-14.84+i*1.06,y:.675,z:9.1+row*.76,w:1.035,h:.075,d:.737});
    for(let i=0;i<56;i++)for(const z of [8.62,10.34])edges.push({x:-15.1+i*.55,y:.69,z,w:.531,h:.12,d:.11});
    for(const x of [-11.35,-4.15,1.1,10.2]){
      slabs.push({x,y:.65,z:8.29,w:1.9,h:.075,d:.58});bench(x,8.18,1.02,.69);
    }
    batch(slabs,stoneMaterial);batch(edges,curbMaterial,true);
    for(const x of [-13.45,-8.1,-2.3,5.8,12.25])lantern(x,8.55,2.22,.7,x===-8.1||x===12.25);
  }
  function avenueFurniture(){
    for(const x of [-13,-9,-5,-1,3,7,11,14])for(const z of [-1.3,1.32]){
      // The eastern cross street runs through x=11.1: keep this seat on the lawn.
      bench(x===11&&z>0?12.35:x,x===11&&z>0?1.65:z,.93,.535);
    }
    for(const x of [-12,-6,0,6,12])for(const z of [-1.55,1.55])lantern(x,z,2.08,.535,x===0);
  }
  function clear(x,z,margin=1.9){return buildings.every(b=>Math.hypot(x-b.p[0],z-b.p[1])>margin);}
  function trees(){
    const planted=[];
    for(let i=0;i<1000&&planted.length<20;i++){
      const x=-14.5+(i*7.171)%29,z=-8.5+(i*4.313)%16.8;
      if(x>4.25&&x<10.65&&z>.5&&z<5.3||contains(x,z,.45)||!clear(x,z,2)||Math.abs(x)<2&&z>1&&z<4.3||planted.some(p=>Math.hypot(x-p[0],z-p[1])<2.4))continue;
      const size=.79+(i%5)*.05;tree(x,z,size);planted.push([x,z]);
    }
  }
  function quarter(){
    // Small shared garden and service corners. Reuse materials and instance
    // repeated pieces: no new textures or additional point lights.
    const frames=[],soil=[],stones=[],foliage=[],flowers=[];
    for(const [x,z,w,d] of [[5.1,1.0,.62,.78],[7.9,1.0,.64,.78],
      [10.4,1.1,.38,.95],[6.3,3.65,1.2,.43],[6.3,5.02,1.2,.43],
      [10.35,4.35,.42,.95]]){
      frames.push({x,y:.55,z,w:w+.1,h:.19,d:d+.1});
      soil.push({x,y:.653,z,w:w-.06,h:.025,d:d-.06});
      for(let i=0;i<5;i++){
        const px=x+((i*37%11)/10-.5)*w*.8,pz=z+((i*17%7)/6-.5)*d*.75;
        foliage.push([px,.76+(i%2)*.05,pz,.17+(i%3)*.025]);
        for(let j=0;j<3;j++)flowers.push([px+(j-1)*.07,.9+(i%2)*.05,pz,.043]);
      }
    }
    batch(frames,new T.MeshStandardMaterial({color:'#a88b70',roughness:1}));
    batch(soil,new T.MeshStandardMaterial({color:'#6b5842',roughness:1}));
    function clusters(records,color){
      const m=new T.InstancedMesh(new T.SphereGeometry(1,7,5),
        new T.MeshStandardMaterial({color,roughness:1}),records.length),o=new T.Object3D();
      records.forEach(([x,y,z,r],i)=>{o.position.set(x,y,z);o.scale.set(r,r*.85,r);o.updateMatrix();m.setMatrixAt(i,o.matrix);m.setColorAt(i,new T.Color(color).multiplyScalar(.92+(i%4)*.055));});
      m.computeBoundingSphere();m.receiveShadow=true;world.add(m);
    }
    clusters(foliage,'#789156');clusters(flowers,'#e8b8a4');
    // Island bevel raises the grass to y=.52. Keep the entire stone above it
    // so the two surfaces cannot fight for the same depth on mobile GPUs.
    for(let i=0;i<4;i++)stones.push({x:5.9+i*.46,y:.56,z:4.35,w:.36,h:.06,d:.42});
    batch(stones,stoneMaterial);
    bench(4.65,4.15,.86);lantern(4.65,3.55,1.85);
    // Two lidded bins tucked beside the post office, clear of the entrance.
    for(const [x,color] of [[10.12,'#718471'],[10.48,'#a18a70']]){
      batch([{x,y:.72,z:1.66,w:.28,h:.46,d:.33},
        {x,y:.965,z:1.66,w:.32,h:.055,d:.37}],
        new T.MeshStandardMaterial({color,roughness:.9}),true);
    }
    // A low timber parcel shelf beside the postal path.
    batch([{x:10.35,y:.66,z:2.43,w:.47,h:.08,d:.32},
      {x:10.17,y:.58,z:2.43,w:.055,h:.26,d:.27},
      {x:10.53,y:.58,z:2.43,w:.055,h:.26,d:.27}],
      new T.MeshStandardMaterial({color:'#a7815c',roughness:1}));
    batch([{x:10.28,y:.8,z:2.43,w:.23,h:.21,d:.22},
      {x:10.49,y:.77,z:2.43,w:.15,h:.15,d:.18}],
      new T.MeshStandardMaterial({color:'#cfa97b',roughness:1}));
  }
  function grassDetails(){
    const positions=[];
    for(let i=0;i<700;i++){
      const x=-14.6+(i*6.717)%29.2,z=-8.7+(i*3.739)%17.2;
      if(contains(x,z,.08)||!contains(x,z,.45)||!clear(x,z,1.5))continue;
      positions.push([x,z]);
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-.035,0,0,0,.14,0,.035,0,0],3));geo.computeVertexNormals();
    const blades=new T.InstancedMesh(geo,new T.MeshStandardMaterial({color:'#829b57',roughness:1,side:T.DoubleSide}),positions.length*3),dummy=new T.Object3D();
    positions.forEach(([x,z],i)=>{for(let j=0;j<3;j++){
      dummy.position.set(x+(j-1)*.035,.45,z);dummy.rotation.set(0,i+j*1.2,(j-1)*.25);dummy.scale.setScalar(.68+(i%4)*.15);dummy.updateMatrix();blades.setMatrixAt(i*3+j,dummy.matrix);
    }});blades.instanceMatrix.needsUpdate=true;blades.computeBoundingSphere();world.add(blades);
    const flowers=new T.InstancedMesh(new T.SphereGeometry(.025,5,4),new T.MeshStandardMaterial({color:'#f3e7c1',roughness:1}),Math.floor(positions.length/3));
    for(let i=0;i<flowers.count;i++){let [x,z]=positions[i*3];dummy.position.set(x,.55,z);dummy.rotation.set(0,0,0);dummy.scale.set(1,.5,1);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix)}
    flowers.instanceMatrix.needsUpdate=true;flowers.computeBoundingSphere();world.add(flowers);
  }
  return {grassMaterial,tree,bench,lantern,paths,promenade,avenueFurniture,trees,quarter};
}
