// A hands-on, optional restaurant mini-game. No timers, stock or recurring debts.
export const MUSSEL_MENU=Object.freeze([
  {id:'classic',name:'Мидии с лимоном',emoji:'🍋',price:8,ingredients:['mussels','lemon','herbs'],guest:'Соня',request:'Лимон и свежая зелень, пожалуйста!'},
  {id:'creamy',name:'Сливочно-чесночные',emoji:'🧄',price:10,ingredients:['mussels','cream','garlic'],guest:'Оскар',request:'Хочу нежный сливочный соус.'},
  {id:'tomato',name:'С томатами и базиликом',emoji:'🍅',price:11,ingredients:['mussels','tomato','herbs'],guest:'Агата',request:'Томаты и зелень — мой любимый вкус.'},
  {id:'cheese',name:'Мидии в сырном соусе',emoji:'🧀',price:13,ingredients:['mussels','cheese','cream'],guest:'Матильда',request:'Побольше сыра!'},
  {id:'special',name:'Фирменные мидии Беллы',emoji:'✨',price:16,ingredients:['mussels','garlic','tomato','cheese','lemon'],guest:'Тео',request:'Удиви меня своим фирменным блюдом!'},
  {id:'butter',name:'Мидии в чесночном масле',emoji:'🧈',price:12,ingredients:['mussels','butter','garlic','herbs'],guest:'Жюль',request:'С чесночным маслом и зеленью, пожалуйста.'},
  {id:'mushroom',name:'Мидии с грибами',emoji:'🍄',price:14,ingredients:['mussels','mushroom','cream','garlic'],guest:'Мира',request:'Люблю грибы в сливочном соусе!'},
  {id:'spicy',name:'Острые мидии',emoji:'🌶️',price:15,ingredients:['mussels','chili','tomato','garlic'],guest:'Лука',request:'Хочу немного остроты и много томатов.'},
  {id:'wine',name:'Мидии по-средиземноморски',emoji:'🌊',price:17,ingredients:['mussels','wine','butter','lemon','herbs'],guest:'Эмма',request:'Приготовь, пожалуйста, как у моря!'}
]);
export const MUSSEL_INGREDIENTS=Object.freeze({
  mussels:{name:'Мидии',emoji:'🦪'},lemon:{name:'Лимон',emoji:'🍋'},
  garlic:{name:'Чеснок',emoji:'🧄'},cream:{name:'Сливки',emoji:'🥛'},
  cheese:{name:'Сыр',emoji:'🧀'},tomato:{name:'Томаты',emoji:'🍅'},
  herbs:{name:'Зелень',emoji:'🌿'},butter:{name:'Сливочное масло',emoji:'🧈'},
  mushroom:{name:'Грибы',emoji:'🍄'},chili:{name:'Острый перец',emoji:'🌶️'},
  wine:{name:'Белое вино',emoji:'🍾'}
});
const bound=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max?v:0;
export function newMusselRestaurantState(){return {served:0,earned:0,bestStars:0,last:null};}
export function sanitizeMusselRestaurantState(input){
  const state=newMusselRestaurantState();
  if(!input||typeof input!=='object')return state;
  state.served=bound(input.served,1000000);
  state.earned=bound(input.earned,10000000);
  state.bestStars=bound(input.bestStars,3);
  if(input.last&&MUSSEL_MENU.some(v=>v.id===input.last.id)&&bound(input.last.stars,3)>0){
    state.last={id:input.last.id,stars:input.last.stars,coins:bound(input.last.coins,24)};
  }
  return state;
}
export function nextMusselOrder(state){
  const served=bound(state?.served,1000000);
  return {...MUSSEL_MENU[(served*2)%MUSSEL_MENU.length],number:served};
}
export function newMusselKitchen(order){
  if(!MUSSEL_MENU.some(v=>v.id===order?.id))return null;
  return {recipeId:order.id,orderNo:order.number,phase:'ingredients',added:[],heatAttempts:0,plated:0,garnished:false,paid:false};
}
export function addMusselIngredient(session,id){
  const recipe=MUSSEL_MENU.find(v=>v.id===session?.recipeId);
  if(!recipe||session.phase!=='ingredients'||!recipe.ingredients.includes(id)||session.added.includes(id))return false;
  session.added.push(id);
  if(recipe.ingredients.every(ingredient=>session.added.includes(ingredient)))session.phase='heat';
  return true;
}
export function setMusselHeat(session,value){
  if(session?.phase!=='heat'||!Number.isFinite(value)||value<0||value>1)return {ok:false,reason:'invalid'};
  session.heatAttempts++;
  const good=value>=.42&&value<=.71;
  if(good)session.phase='plating';
  return {ok:good,reason:good?'ready':'retry',attempts:session.heatAttempts};
}
export function plateMussels(session){
  if(session?.phase!=='plating'||session.plated>=3)return false;
  session.plated++;
  if(session.plated===3)session.phase='garnish';
  return true;
}
export function garnishMussels(session){
  if(session?.phase!=='garnish')return false;
  session.garnished=true;
  session.phase='ready';
  return true;
}
export function serveMusselOrder(city,session){
  const state=city?.musselRestaurant,recipe=MUSSEL_MENU.find(v=>v.id===session?.recipeId);
  if(!state||!recipe||session.phase!=='ready'||session.paid||session.orderNo!==state.served||!Number.isSafeInteger(city.coins)||city.coins<0||city.coins>10000000)return {ok:false,reason:'state'};
  if(!recipe.ingredients.every(id=>session.added?.includes(id))||session.plated!==3||!session.garnished||!Number.isInteger(session.heatAttempts)||session.heatAttempts<1)return {ok:false,reason:'incomplete'};
  const stars=session.heatAttempts===1?3:session.heatAttempts<=3?2:1;
  const tip=stars===3?4:stars===2?2:0;
  const coins=Math.min(recipe.price+tip,10000000-city.coins);
  city.coins+=coins;
  state.served++;
  state.earned=Math.min(10000000,state.earned+coins);
  state.bestStars=Math.max(state.bestStars,stars);
  state.last={id:recipe.id,stars,coins};
  session.paid=true;
  session.phase='served';
  return {ok:true,coins,tip:Math.min(tip,coins),stars,balance:city.coins};
}
