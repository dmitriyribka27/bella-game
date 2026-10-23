// Short, one-time conversations that occur only while both visitors are in
// the shop. Their outcomes are independent from each visitor's main story.
export const BOOK_SCENES=[
  {
    id:'oscar-matilda',guests:['oscar','matilda'],title:'История для маяка',
    prompt:'Оскар рассказывает Матильде о старом маяке. Она достаёт записную книжку: «А если герой вернётся туда спустя двадцать лет?» Оба поворачиваются к Цитере.',
    choices:[
      {label:'Предложить записать воспоминания Оскара',reply:'Матильда записывает первую фразу, а Оскар обещает принести морские карты. В лавке родилась новая история.',coins:5,mood:2},
      {label:'Устроить вечер чтения у окна',reply:'Оскар выбирает кресло у окна, Матильда читает вслух. Даже прохожие останавливаются послушать.',coins:2,mood:6}
    ]
  },
  {
    id:'felix-sonya',guests:['felix','sonya'],title:'Загадочный росток',
    prompt:'Феликс обнаружил неизвестный листок между страницами детектива. Соня уверяет, что это редкий цветок, а Феликс подозревает тайное послание.',
    choices:[
      {label:'Найти растение в справочнике',reply:'Вместе они выясняют, что листок принадлежит жасмину. Феликс всё равно записывает находку как «улику номер семь».',coins:4,mood:3},
      {label:'Предложить им расследовать находку вместе',reply:'Соня смеётся и приглашает Феликса в оранжерею. Кажется, у сыщика появилась новая напарница.',coins:2,mood:7}
    ]
  },
  {
    id:'oscar-teo',guests:['oscar','teo'],title:'Навигация по звёздам',
    prompt:'Тео рассматривает атлас созвездий. Оскар вспоминает, как моряки раньше держали курс без приборов. Они спорят о том, какая звезда главнее.',
    choices:[
      {label:'Показать им старый морской атлас',reply:'Оскар объясняет рисунки, а Тео отмечает несколько созвездий. Они договариваются встретиться в обсерватории.',coins:5,mood:2},
      {label:'Предложить ночную прогулку к маяку',reply:'Тео обещает принести телескоп, а Оскар — тёплый чай. Вечер обещает быть незабываемым.',coins:2,mood:6}
    ]
  },
  {
    id:'matilda-agata',guests:['matilda','agata'],title:'Письмо из прошлого',
    prompt:'Агата показывает Матильде письмо, найденное в старом альбоме. Подпись почти стёрлась, но история будто просится на страницы книги.',
    choices:[
      {label:'Начать с поиска автора письма',reply:'Агата замечает старый почтовый штемпель. Матильда предлагает заглянуть в городской архив.',coins:5,mood:3},
      {label:'Превратить письмо в маленький рассказ',reply:'Матильда придумывает героя, а Агата дополняет его воспоминаниями. Они решают работать вместе.',coins:2,mood:7}
    ]
  },
  {
    id:'felix-teo',guests:['felix','teo'],title:'Шифр на небесной карте',
    prompt:'Феликс показывает Тео загадочные значки из блокнота. Тео узнаёт в них фрагмент старой звёздной карты. Никто не хочет уходить первым.',
    choices:[
      {label:'Дать им бумагу для общей карты',reply:'Они соединяют точки и находят очертания созвездия. Феликс торжественно называет это «делом космического ключа».',coins:4,mood:4},
      {label:'Предложить исследовать записи в обсерватории',reply:'Друзья собирают блокноты и бегут на холм. Впереди их ждёт долгая ночь открытий.',coins:2,mood:7}
    ]
  },
  {
    id:'sonya-agata',guests:['sonya','agata'],title:'Сад памяти',
    prompt:'Соня хочет посадить у почты цветы. Агата помнит, что когда-то там уже был сад, и даже знает, кто за ним ухаживал.',
    choices:[
      {label:'Найти старый план клумб',reply:'Агата приносит старую фотографию, а Соня узнаёт на ней редкие сорта. Сад можно будет восстановить.',coins:5,mood:3},
      {label:'Посадить цветы в честь прежних жителей',reply:'На каждой клумбе появится небольшая табличка с именем. Соня и Агата растроганы новой традицией.',coins:2,mood:7}
    ]
  }
];

export const BOOK_SCENE_BY_ID=Object.fromEntries(BOOK_SCENES.map(scene=>[scene.id,scene]));

export function sanitizeBookScenes(value){
  if(!Array.isArray(value))return [];
  const recorded=new Set();
  return value.filter(x=>x&&BOOK_SCENE_BY_ID[x.id]&&[0,1].includes(x.choice)&&!recorded.has(x.id)&&recorded.add(x.id))
    .slice(0,BOOK_SCENES.length).map(x=>({id:x.id,choice:x.choice}));
}

export function availableBookScene(queue,history){
  const seen=new Set(history.map(s=>s.id));
  return BOOK_SCENES.find(s=>!seen.has(s.id)&&s.guests.every(id=>queue.includes(id)))||null;
}

export function finishBookScene(history,sceneId,choice){
  const scene=BOOK_SCENE_BY_ID[sceneId];
  if(!scene||![0,1].includes(choice)||history.some(x=>x.id===sceneId))return null;
  history.push({id:sceneId,choice});
  return scene.choices[choice];
}
