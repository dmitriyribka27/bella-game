// One compact set of home improvements for the five working cats.
// Levels 0..3 are intentionally identical to the original save structure.
export const HOME_UPGRADE_MAX_BONUS=10;

export const HOME_UPGRADE_SECTORS=Object.freeze({
  bed:{title:'Спальня',icon:'🛏️',need:'Бодрость',description:'Быстрее восстанавливает силы во время отдыха.',basePrice:20,activity:'rest',steps:[
    {name:'Новая кровать',icon:'🛏️',bonus:3},
    {name:'Торшер',icon:'💡',bonus:2},
    {name:'Мягкий плед',icon:'🧸',bonus:5}
  ]},
  bowl:{title:'Кухня',icon:'🥣',need:'Сытость',description:'Быстрее восполняет сытость во время еды.',basePrice:15,activity:'eat',steps:[
    {name:'Керамическая миска',icon:'🥣',bonus:3},
    {name:'Коврик для еды',icon:'🧺',bonus:2},
    {name:'Автопоилка',icon:'💧',bonus:5}
  ]},
  toy:{title:'Игровая',icon:'🧶',need:'Настроение',description:'Быстрее поднимает настроение во время игры.',basePrice:18,activity:'play',steps:[
    {name:'Клубок с лентой',icon:'🧶',bonus:3},
    {name:'Когтеточка',icon:'🐾',bonus:2},
    {name:'Игровой комплекс',icon:'🎠',bonus:5}
  ]}
});

const validLevel=(upgrades,sector)=>{
  if(!Object.hasOwn(HOME_UPGRADE_SECTORS,sector))return null;
  const value=upgrades?.[sector];
  return Number.isInteger(value)&&value>=0&&value<=3?value:null;
};

export function homeUpgradeBonus(upgrades,sector){
  const level=validLevel(upgrades,sector);
  if(level===null)return 0;
  return Math.min(HOME_UPGRADE_MAX_BONUS,HOME_UPGRADE_SECTORS[sector].steps.slice(0,level).reduce((sum,item)=>sum+item.bonus,0));
}

export function homeUpgradeCost(upgrades,sector){
  const level=validLevel(upgrades,sector);
  if(level===null||level===3)return null;
  return HOME_UPGRADE_SECTORS[sector].basePrice*(level+1);
}

export function homeRecoveryRate(activity,upgrades){
  const item=Object.entries(HOME_UPGRADE_SECTORS).find(([,sector])=>sector.activity===activity);
  const base={rest:1.5,eat:1.7,play:1.5}[activity];
  if(!item||!Number.isFinite(base))return 0;
  return base*(1+homeUpgradeBonus(upgrades,item[0])/100);
}

export function purchaseHomeUpgrade(city,residentId,sector){
  if(!city||!Array.isArray(city.cats)||!Number.isSafeInteger(city.coins)||city.coins<0||!Object.hasOwn(HOME_UPGRADE_SECTORS,sector))return {ok:false,reason:'invalid'};
  const resident=city.cats.find(cat=>cat.id===residentId&&cat.id!=='bella');
  const level=validLevel(resident?.upgrades,sector);
  if(level===null)return {ok:false,reason:'invalid'};
  if(level>=3)return {ok:false,reason:'complete'};
  const cost=homeUpgradeCost(resident.upgrades,sector);
  if(city.coins<cost)return {ok:false,reason:'funds',shortfall:cost-city.coins};
  city.coins-=cost;
  resident.upgrades[sector]=level+1;
  return {ok:true,cost,level:level+1,bonus:homeUpgradeBonus(resident.upgrades,sector),item:HOME_UPGRADE_SECTORS[sector].steps[level]};
}
