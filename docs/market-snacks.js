// A tiny optional souvenir from the market, using the city's existing coins.
// No stock, timers, quests, buffs or extra save fields.
export const MARKET_SNACKS=[
  {id:'red-bull',name:'Red Bull',emoji:'⚡',price:8,detail:'Холодный энергетик',reaction:'Белла открывает холодный Red Bull. Теперь можно ещё немного погулять по бухте!'},
  {id:'cheese-chips',name:'Чипсы с сыром',emoji:'🧀',price:5,detail:'Тот самый сырный хруст',reaction:'Сырные чипсы приятно хрустят. Кажется, пакет закончится слишком быстро.'},
  {id:'cola',name:'Coca-Cola · 1 л',emoji:'🥤',price:6,detail:'Большая бутылка',reaction:'Литровая Coca-Cola отправляется в корзинку. Идеально к вечернему кино.'},
  {id:'salmon-sandwich',name:'Бутерброды с сёмгой',emoji:'🥪',price:10,detail:'Свежие и аппетитные',reaction:'Бутерброды с сёмгой выглядят так вкусно, что Белла решает не ждать до дома.'},
  {id:'tea',name:'Чай',emoji:'🍵',price:3,detail:'Тёплая чашка',reaction:'Белла берёт горячий чай и на минуту замирает у моря.'},
  {id:'shawarma',name:'Шаурма',emoji:'🌯',price:9,detail:'Горячая и сытная',reaction:'Белла забирает тёплую шаурму. Вот теперь прогулка точно удалась.'}
];

export function buyMarketSnack(coins,id){
  const snack=MARKET_SNACKS.find(item=>item.id===id);
  if(!snack)return {ok:false,reason:'unknown',balance:coins};
  if(!Number.isSafeInteger(coins)||coins<snack.price)return {ok:false,reason:'funds',snack,balance:coins};
  return {ok:true,snack,balance:coins-snack.price};
}
