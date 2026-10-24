// Little moments at home are stories, not chores: no timers or repeat rewards.
export const HOME_STORIES = [
  {
    id:'fireplace',owner:'ryzhiy',room:'lounge',emoji:'🔥',label:'Камин',
    title:'Вечер у камина',memoryTitle:'Тёплый вечер Рыжего',
    intro:'Кофейня закрылась, за окнами шумит море. Рыжий устроился у тёплого камина и ждёт, что вы придумаете на вечер.',
    choices:[
      {id:'yarn',label:'🧶 Поиграть с клубком',reaction:'Рыжий ловко подцепляет клубок лапой. Через минуту вся гостиная в нитках, а довольный охотник гордо сидит посреди своего шедевра.'},
      {id:'wood',label:'🪵 Подложить дров в камин',reaction:'Огонь становится ярче, Рыжий растягивается на ковре и мурчит так громко, что едва слышно потрескивание поленьев.'},
      {id:'sea',label:'🌊 Посидеть у окна',reaction:'Рыжий забирается рядом на диван. Вы смотрите, как в море гаснет последняя полоска солнца. Иногда лучший вечер — тот, в котором ничего не нужно делать.'}
    ]
  },
  {
    id:'kitchen',owner:'ryzhiy',room:'kitchen',emoji:'🥐',label:'Кухня',
    title:'Завтрак для Беллы',memoryTitle:'Первый завтрак у Рыжего',
    intro:'Утром на кухне пахнет корицей. Рыжий забрался на стул и разглядывает продукты. Чем сегодня порадуем Беллу?',
    choices:[
      {id:'buns',label:'🥐 Испечь булочки с корицей',reaction:'Булочки вышли немного кривыми, зато невероятно ароматными. Рыжий торжественно кладёт самую красивую на тарелку Беллы.'},
      {id:'toast',label:'🍓 Сделать тосты с ягодами',reaction:'На каждом тосте Рыжий выкладывает ягодное сердечко. Одну ягоду, правда, приходится списать: кот-повар решил попробовать начинку.'},
      {id:'tea',label:'🫖 Заварить чай и накрыть стол',reaction:'Рыжий расставляет чашки, печенье и маленький букет. Белла входит на кухню, а тут её уже ждёт самый уютный столик в бухте.'}
    ]
  },
  {
    id:'bedroom',owner:'ryzhiy',room:'bedroom',emoji:'🌙',label:'Кровать',
    title:'Сон под шум моря',memoryTitle:'Спокойной ночи, Рыжий',
    intro:'В бухте стихли голоса. Рыжий свернулся клубочком на клетчатом пледе, но пока не собирается закрывать глаза.',
    choices:[
      {id:'story',label:'📖 Прочитать сказку',reaction:'На третьей странице Рыжий начинает клевать носом. Последнее, что он слышит, — как маленький маяк в сказке показывает дорогу домой.'},
      {id:'light',label:'🕯️ Оставить тёплый ночник',reaction:'Комната наполняется мягким янтарным светом. Рыжий находит самое тёплое место на подушке и сладко потягивается.'},
      {id:'window',label:'🌊 Приоткрыть окно к морю',reaction:'Занавеска чуть колышется от бриза. Рыжий устраивается удобнее и засыпает под размеренный плеск волн.'}
    ]
  },
  {
    id:'citera-lounge',owner:'citera',room:'lounge',emoji:'🧶',label:'Диван',
    title:'Вечер Цитеры',memoryTitle:'Цитера и вечер под пледом',
    intro:'Последний покупатель ушёл, в лавке погас свет. Цитера закрыла двери, устроилась на зелёном диване и решила провести вечер для себя.',
    choices:[
      {id:'yarn',label:'🧶 Поиграть с клубками',reaction:'Цитера ловит клубок, делает два невероятных прыжка и случайно укутывает ножку стола нитками. Кажется, у гостиной теперь новое украшение.'},
      {id:'fort',label:'🛋️ Построить крепость из подушек',reaction:'Подушки превращаются в маленький замок, а Цитера объявляет себя его хозяйкой. Вход разрешён только Белле и самым близким друзьям.'},
      {id:'movie',label:'🎬 Устроить домашний киносеанс',reaction:'На экране начинается фильм, горит маленькая лампа, а Цитера прячется под пледом. Через десять минут она засыпает под самые интересные события.'}
    ]
  },
  {
    id:'citera-letter',owner:'citera',room:'bedroom',emoji:'💌',label:'Книга у кровати',
    title:'Письмо между страниц',memoryTitle:'Секрет Цитеры',
    intro:'Перед сном Цитера замечает между страницами старой книги конверт. Внутри — рисунок книжной лавки и несколько тёплых слов, которые она хотела однажды передать Белле.',
    choices:[
      {id:'read',label:'💌 Прочитать письмо',reaction:'На листочке аккуратно написано: «Белла, где бы ни была наша книжная лавка, рядом с тобой всегда найдётся место для истории». Цитера нежно касается бумаги лапой.'},
      {id:'add',label:'✍️ Дописать пару слов',reaction:'Цитера выводит на обороте маленький отпечаток лапки. Под ним появляется новая строчка: «А ещё здесь всегда найдётся место для тебя».'},
      {id:'keep',label:'🎀 Сохранить до особенного дня',reaction:'Цитера прячет конверт под подушку и подмигивает. Некоторые сюрпризы становятся ещё лучше, когда их открывают в нужный момент.'}
    ]
  }
];

export const HOME_STORY_BY_ID = Object.fromEntries(HOME_STORIES.map(story=>[story.id,story]));
export const RYZHIY_HOME_STORIES = HOME_STORIES.filter(story=>story.owner==='ryzhiy');
export const CITERA_HOME_STORIES = HOME_STORIES.filter(story=>story.owner==='citera');
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
