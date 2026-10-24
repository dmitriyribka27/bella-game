// Small civic actions reuse the current residents, coin balance and map routes.
// Nothing here introduces a new save field or an ongoing daily obligation.
export const TOWN_HALL_FESTIVAL_COST=50;
export const TOWN_HALL_FESTIVAL_MOOD=12;
const residentCats=city=>Array.isArray(city?.cats)?city.cats.filter(cat=>cat.id!=='bella'):[];
const clamp100=value=>Math.max(0,Math.min(100,Number.isFinite(value)?value:0));

export function getTownHallReport(city){
  const residents=residentCats(city);
  const mean=key=>residents.length?Math.round(residents.reduce((sum,cat)=>sum+clamp100(cat[key]),0)/residents.length):0;
  return {
    coins:Number.isFinite(city?.coins)?city.coins:0,
    averageMood:mean('mood'),averageEnergy:mean('energy'),
    working:residents.filter(cat=>cat.activity==='work').length,
    resting:residents.filter(cat=>cat.activity==='rest').length,
    hungry:residents.filter(cat=>cat.hunger<35).length,
    residents:residents.map(cat=>({id:cat.id,activity:cat.activity,mood:Math.round(clamp100(cat.mood)),energy:Math.round(clamp100(cat.energy)),hunger:Math.round(clamp100(cat.hunger))}))
  };
}

export function issueTownHallOrder(city,order,residentDefinitions,square){
  if(!['work','rest','walk'].includes(order)||!city||!residentDefinitions)return {ok:false,reason:'invalid',ordered:0,skipped:0};
  if(order==='walk'&&(!Array.isArray(square)||square.length!==2||!square.every(Number.isFinite)))return {ok:false,reason:'invalid',ordered:0,skipped:0};
  let ordered=0,skipped=0;
  for(const cat of residentCats(city)){
    const destination=order==='walk'?square:residentDefinitions[cat.id]?.[order==='work'?'work':'home'];
    if(!Array.isArray(destination)||destination.length!==2||!destination.every(Number.isFinite)){skipped++;continue;}
    if(order==='work'&&(cat.energy<35||cat.hunger<35)){skipped++;continue;}
    cat.activity=order;
    cat.target=[...destination];
    cat.phase=0;
    ordered++;
  }
  if(order==='walk'){
    const bella=Array.isArray(city.cats)?city.cats.find(cat=>cat.id==='bella'):null;
    if(bella){bella.activity='walk';bella.target=[...square];bella.phase=0;ordered++;}
  }
  return {ok:true,ordered,skipped};
}

export function holdTownHallFestival(city){
  const residents=residentCats(city);
  if(!city||!Number.isFinite(city.coins)||city.coins<TOWN_HALL_FESTIVAL_COST)return {ok:false,reason:'funds',spent:0};
  if(!residents.some(cat=>clamp100(cat.mood)<100))return {ok:false,reason:'full',spent:0};
  city.coins-=TOWN_HALL_FESTIVAL_COST;
  let moodGained=0;
  for(const cat of residents){
    const before=clamp100(cat.mood);
    cat.mood=clamp100(before+TOWN_HALL_FESTIVAL_MOOD);
    moodGained+=cat.mood-before;
  }
  return {ok:true,spent:TOWN_HALL_FESTIVAL_COST,residents:residents.length,moodGained};
}
