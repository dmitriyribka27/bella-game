// Decorative bookshop routes. Purely UI state: no timers, physics loop or save migration.
export const BOOK_WALK_IN_MS=3600;
export const BOOK_TO_COUNTER_MS=1500;
export const BOOK_WALK_OUT_MS=2500;

export function createBookVisitorMotion(){
  return {arrivals:new Map(),slots:new Map(),counter:null,departure:null};
}

export function syncBookVisitorMotion(motion,queue,now=Date.now()){
  const active=new Set(queue);
  for(const id of motion.arrivals.keys())if(!active.has(id))motion.arrivals.delete(id);
  for(const id of motion.slots.keys())if(!active.has(id))motion.slots.delete(id);
  if(motion.counter&&!active.has(motion.counter.id))motion.counter=null;
  for(const id of queue){
    if(!motion.arrivals.has(id))motion.arrivals.set(id,now);
    if(!motion.slots.has(id))motion.slots.set(id,[0,1].find(slot=>![...motion.slots.values()].includes(slot))??0);
  }
}

export function focusBookVisitor(motion,id,now=Date.now()){
  if(!motion.arrivals.has(id))return false;
  if(motion.counter?.id!==id)motion.counter={id,at:now};
  return true;
}

export function leaveBookVisitor(motion,id,now=Date.now()){
  if(!motion.arrivals.has(id))return false;
  motion.departure={id,at:now};
  motion.counter=null;
  motion.arrivals.delete(id);
  motion.slots.delete(id);
  return true;
}

export function bookVisitorRoute(motion,id,selectedId,now=Date.now()){
  if(motion.counter?.id===id&&selectedId===id){
    const elapsed=now-motion.counter.at;
    return elapsed<BOOK_TO_COUNTER_MS?{name:'counter',delay:-Math.max(0,elapsed)}:{name:'waiting',delay:0};
  }
  const arrived=motion.arrivals.get(id);
  if(arrived===undefined)return {name:'shelf',delay:0};
  const elapsed=now-arrived;
  return elapsed<BOOK_WALK_IN_MS?{name:'enter',delay:-Math.max(0,elapsed)}:{name:'shelf',delay:0};
}

export function activeBookDeparture(motion,now=Date.now()){
  return motion.departure&&now-motion.departure.at<BOOK_WALK_OUT_MS?motion.departure:null;
}
