// Little moments at home are stories, not chores: no timers or repeat rewards.
export const HOME_STORIES = [
  {
    id:'fireplace',room:'lounge',emoji:'🔥',label:'Камин',
    title:'Вечер у камина',memoryTitle:'Тёплый вечер Рыжего',
    intro:'Кофейня закрылась, за окнами шумит море. Рыжий устроился у тёплого камина и ждёт, что вы придумаете на вечер.',
    choices:[
      {id:'yarn',label:'🧶 Поиграть с клубком',reaction:'Рыжий ловко подцепляет клубок лапой. Через минуту вся гостиная в нитках, а довольный охотник гордо сидит посреди своего шедевра.'},
      {id:'wood',label:'🪵 Подложить дров в камин',reaction:'Огонь становится ярче, Рыжий растягивается на ковре и мурчит так громко, что едва слышно потрескивание поленьев.'},
      {id:'sea',label:'🌊 Посидеть у окна',reaction:'Рыжий забирается рядом на диван. Вы смотрите, как в море гаснет последняя полоска солнца. Иногда лучший вечер — тот, в котором ничего не нужно делать.'}
    ]
  },
  {
    id:'kitchen',room:'kitchen',emoji:'🥐',label:'Кухня',
    title:'Завтрак для Беллы',memoryTitle:'Первый завтрак у Рыжего',
    intro:'Утром на кухне пахнет корицей. Рыжий забрался на стул и разглядывает продукты. Чем сегодня порадуем Беллу?',
    choices:[
      {id:'buns',label:'🥐 Испечь булочки с корицей',reaction:'Булочки вышли немного кривыми, зато невероятно ароматными. Рыжий торжественно кладёт самую красивую на тарелку Беллы.'},
      {id:'toast',label:'🍓 Сделать тосты с ягодами',reaction:'На каждом тосте Рыжий выкладывает ягодное сердечко. Одну ягоду, правда, приходится списать: кот-повар решил попробовать начинку.'},
      {id:'tea',label:'🫖 Заварить чай и накрыть стол',reaction:'Рыжий расставляет чашки, печенье и маленький букет. Белла входит на кухню, а тут её уже ждёт самый уютный столик в бухте.'}
    ]
  },
  {
    id:'bedroom',room:'bedroom',emoji:'🌙',label:'Кровать',
    title:'Сон под шум моря',memoryTitle:'Спокойной ночи, Рыжий',
    intro:'В бухте стихли голоса. Рыжий свернулся клубочком на клетчатом пледе, но пока не собирается закрывать глаза.',
    choices:[
      {id:'story',label:'📖 Прочитать сказку',reaction:'На третьей странице Рыжий начинает клевать носом. Последнее, что он слышит, — как маленький маяк в сказке показывает дорогу домой.'},
      {id:'light',label:'🕯️ Оставить тёплый ночник',reaction:'Комната наполняется мягким янтарным светом. Рыжий находит самое тёплое место на подушке и сладко потягивается.'},
      {id:'window',label:'🌊 Приоткрыть окно к морю',reaction:'Занавеска чуть колышется от бриза. Рыжий устраивается удобнее и засыпает под размеренный плеск волн.'}
    ]
  }
];

export const HOME_STORY_BY_ID = Object.fromEntries(HOME_STORIES.map(story=>[story.id,story]));
export function newMemoryBook(){return [];}

export function sanitizeMemoryBook(value){
  if(!Array.isArray(value))return newMemoryBook();
  const result=[], seen=new Set();
  for(const entry of value){
    if(!entry||typeof entry!=='object')continue;
    const story=HOME_STORY_BY_ID[entry.id];
    if(!story||seen.has(entry.id)||!story.choices.some(choice=>choice.id===entry.choiceId))continue;
    if(!Number.isFinite(entry.at)||entry.at<0||entry.at>8.64e15)continue;
    result.push({id:entry.id,choiceId:entry.choiceId,at:Math.floor(entry.at)});
    seen.add(entry.id);
  }
  return result;
}

export function unlockMemory(book,storyId,choiceId,at=Date.now()){
  const story=HOME_STORY_BY_ID[storyId];
  if(!Array.isArray(book)||!story||!story.choices.some(choice=>choice.id===choiceId)||book.some(entry=>entry.id===storyId))return false;
  book.push({id:storyId,choiceId,at});
  return true;
}
