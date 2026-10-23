// Tiny, deterministic opening quests: no timers, animation loop, or save format changes.
export const CAFE_OPENING_STAGES = [
  {
    id:'plan',icon:'🗺️',owner:'Лев',title:'План движения',
    description:'Помоги гостям пройти по кофейне без толкотни.',
    steps:[
      {question:'Гость вошёл впервые. Куда направим его сначала?',options:[
        {id:'counter',label:'☕ К стойке, чтобы заказать'},
        {id:'tables',label:'🪑 Сразу к занятому столику'},
        {id:'kitchen',label:'🍳 На кухню к повару'}
      ],right:'counter',hint:'Сначала гость должен сделать заказ. Стойка находится напротив входа.',success:'Гость спокойно заказал кофе.'},
      {question:'Рыжий приготовил напиток. Как завершить маршрут?',options:[
        {id:'window',label:'🪟 К свободному столику у окна'},
        {id:'exit',label:'🚪 Сразу обратно на улицу'},
        {id:'bar',label:'☕ За стойку к кофемашине'}
      ],right:'window',hint:'Теперь нужен уютный столик, а рабочую зону лучше оставить Рыжему.',success:'Получилось: вход → стойка → столик!'}
    ]
  },
  {
    id:'delivery',icon:'📚',owner:'Цитера',title:'Книжный уголок',
    description:'Организуй место для чтения, пока готовится заказ.',
    steps:[
      {question:'Куда поставить небольшую книжную полку, чтобы книги не намокли?',options:[
        {id:'window',label:'🌿 Рядом с мягким диванчиком у окна'},
        {id:'sink',label:'🚰 Прямо рядом с раковиной'},
        {id:'door',label:'🚪 Поперёк входной двери'}
      ],right:'window',hint:'Нужны сухое место и удобное сиденье: присмотрись к диванчику.',success:'Полка встала рядом с уютным местом для чтения.'},
      {question:'У гостя пять минут до встречи. Что положим на верхнюю полку?',options:[
        {id:'short',label:'📖 Короткие рассказы о море'},
        {id:'volumes',label:'📚 Трёхтомную энциклопедию'},
        {id:'manual',label:'🔧 Инструкцию для кофемашины'}
      ],right:'short',hint:'Для короткого ожидания лучше истории, которые можно прочитать за чашкой кофе.',success:'Цитера выбрала истории, к которым захочется вернуться.'}
    ]
  },
  {
    id:'recipe',icon:'🥐',owner:'Рыжий',title:'Фирменная булочка',
    description:'Собери уютный рецепт из трёх ингредиентов.',
    steps:[
      {question:'Начинаем выпечку. Что возьмём для мягкой основы?',options:[
        {id:'dough',label:'🍞 Сдобное тесто'},
        {id:'lettuce',label:'🥬 Листья салата'},
        {id:'salt',label:'🧂 Горсть морской соли'}
      ],right:'dough',hint:'Нам нужна именно булочка — начнём с теста.',success:'Основа готова, аромат уже чувствуется.'},
      {question:'Какую начинку добавим для сочности?',options:[
        {id:'apple',label:'🍎 Сладкие яблоки'},
        {id:'pepper',label:'🌶 Острый перец'},
        {id:'onion',label:'🧅 Сырой лук'}
      ],right:'apple',hint:'Рыжий готовит сладкую выпечку к утреннему кофе.',success:'Яблоки сделают булочку сочной.'},
      {question:'Последний штрих — чем сделаем булочку душистой?',options:[
        {id:'cinnamon',label:'✨ Щепотка корицы'},
        {id:'garlic',label:'🧄 Тёртый чеснок'},
        {id:'mustard',label:'🥫 Горчица'}
      ],right:'cinnamon',hint:'Вспомни аромат тёплой яблочной выпечки.',success:'Рецепт Рыжего готов: яблоко и корица!'}
    ]
  },
  {
    id:'style',icon:'🎨',owner:'Белла',title:'Последние штрихи',
    description:'Выбери настроение зала и расставь свет.',
    steps:[
      {question:'Какую палитру выберем для вечеров в кофейне?',options:[
        {id:'coral',label:'🧡 Коралловая — тёплый уют'},
        {id:'mint',label:'🌿 Мятная — свежесть сада'},
        {id:'blue',label:'🌊 Морская — спокойствие бухты'}
      ],styleChoice:true,success:'Белла приготовила выбранную палитру.'},
      {question:'Осталось сделать уютно вечером. Как разместим свет?',options:[
        {id:'warm',label:'💡 Тёплые лампы над столиками'},
        {id:'spot',label:'🔦 Холодные прожекторы в лица'},
        {id:'dark',label:'🌑 Оставим зал без освещения'}
      ],right:'warm',hint:'За столиками должно быть достаточно мягкого света для чтения и бесед.',success:'Лампы зажглись. Кофейня почти готова к гостям!'}
    ]
  }
];

export function cafeStageDone(coffee,stage){
  return stage.id==='style'?['coral','mint','blue'].includes(coffee.style):!!coffee[stage.id];
}

export function nextCafeStage(coffee){
  return CAFE_OPENING_STAGES.find(stage=>!cafeStageDone(coffee,stage))||null;
}

export function startCafeTask(stage){
  return {stageId:stage.id,step:0,history:[],style:null};
}

export function answerCafeTask(stage,session,answer){
  if(!stage||!session||session.stageId!==stage.id)return {ok:false,hint:'Открой текущий этап.'};
  const current=stage.steps[session.step];
  if(!current)return {ok:false,hint:'Этап уже завершён.'};
  const choice=current.options.find(option=>option.id===answer);
  if(!choice)return {ok:false,hint:'Выбери один из предложенных вариантов.'};
  if(!current.styleChoice&&answer!==current.right)return {ok:false,hint:current.hint};
  const next={...session,step:session.step+1,history:[...session.history,choice.label],style:current.styleChoice?answer:session.style};
  return {ok:true,complete:next.step===stage.steps.length,session:next,message:current.success};
}
