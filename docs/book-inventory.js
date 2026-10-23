import {BOOK_VISITORS} from './book-visitors.js';

// All titles come from the actual story choices. There is no imaginary item
// that a visitor can purchase without the same book existing in the catalogue.
export const BOOK_SUPPLIERS = [
  {id:'seaside',name:'Морские истории',emoji:'⛵',deliveryMs:35000,description:'Путешествия, приключения и загадки'},
  {id:'press',name:'Старая типография',emoji:'✒️',deliveryMs:55000,description:'Литература, ремесло и память города'},
  {id:'nature',name:'Сад и звёзды',emoji:'🌿',deliveryMs:75000,description:'Растения, астрономия и открытия'}
];
const SUPPLIER_BY_ID = Object.fromEntries(BOOK_SUPPLIERS.map(s=>[s.id,s]));
const VISITOR_SUPPLIERS = {oscar:'seaside',felix:'seaside',matilda:'press',agata:'press',sonya:'nature',teo:'nature'};

const titles = new Map();
for (const visitor of BOOK_VISITORS) {
  for (const [index,chapter] of [...visitor.chapters,visitor.repeat].entries()) {
    const title = chapter.choices[chapter.right];
    if (!titles.has(title)) {
      const supplier = VISITOR_SUPPLIERS[visitor.id];
      const cost = 4 + ((index + (supplier==='press'?1:supplier==='nature'?2:0))%3)*2;
      titles.set(title,{id:`book-${String(titles.size+1).padStart(2,'0')}`,title,supplier,cost,price:cost+10});
    }
  }
}
export const BOOK_CATALOG = [...titles.values()];
export const BOOK_BY_ID = Object.fromEntries(BOOK_CATALOG.map(book=>[book.id,book]));
export const BOOK_BY_TITLE = Object.fromEntries(BOOK_CATALOG.map(book=>[book.title,book]));
export {SUPPLIER_BY_ID};

const MAX_ON_ORDER = 8;
const MAX_SHIPMENTS = 12;
const MAX_HISTORY = 20;
const safeCount = value=>Number.isInteger(value)?Math.max(0,Math.min(value,1000000)):0;

export function chapterBook(chapter){return BOOK_BY_TITLE[chapter.choices[chapter.right]];}

// A free starter copy of each active visitor's next book prevents old saves
// from losing their playable dialogue when this inventory system is installed.
export function newBookInventory(visitorState) {
  const stock = Object.fromEntries(BOOK_CATALOG.map(b=>[b.id,0]));
  for(const v of BOOK_VISITORS) {
    const progress = visitorState?.progress?.[v.id]??0;
    const chapter = v.chapters[progress]??v.repeat;
    const book = chapterBook(chapter);
    stock[book.id] = Math.max(stock[book.id],1);
  }
  return {stock,shipments:[],sold:0,spent:0,earned:0,history:[]};
}

export function sanitizeBookInventory(input,visitorState,now=Date.now()) {
  if(!input || typeof input!=='object')return newBookInventory(visitorState);
  const out = newBookInventory(visitorState);
  for(const book of BOOK_CATALOG)out.stock[book.id]=safeCount(input.stock?.[book.id]);
  out.shipments = Array.isArray(input.shipments)?input.shipments.filter(s=>
    s&&BOOK_BY_ID[s.bookId]&&Number.isInteger(s.qty)&&s.qty>=1&&s.qty<=3&&Number.isFinite(s.dueAt)
  ).slice(0,MAX_SHIPMENTS).map(s=>({bookId:s.bookId,qty:s.qty,dueAt:Math.max(0,Math.min(s.dueAt,now+86400000))})):[];
  out.sold = safeCount(input.sold);
  out.spent = safeCount(input.spent);
  out.earned = safeCount(input.earned);
  out.history = Array.isArray(input.history)?input.history.filter(x=>x&&
    ['purchase','delivery','sale'].includes(x.type)&&BOOK_BY_ID[x.bookId]&&Number.isInteger(x.qty)&&x.qty>=1&&x.qty<=3
  ).slice(-MAX_HISTORY).map(x=>({type:x.type,bookId:x.bookId,qty:x.qty})):[];
  return out;
}

export function pendingCopies(inventory,bookId){return inventory.shipments.reduce((n,s)=>n+(s.bookId===bookId?s.qty:0),0);}
export function totalCopies(inventory){return Object.values(inventory.stock).reduce((a,b)=>a+b,0);}
export function addInventoryEvent(inventory,type,bookId,qty){
  inventory.history.push({type,bookId,qty});
  inventory.history=inventory.history.slice(-MAX_HISTORY);
}

export function orderBook(inventory,bookId,qty,coins,now=Date.now()) {
  const book=BOOK_BY_ID[bookId];
  if(!book||![1,3].includes(qty))return {ok:false,error:'Неизвестная книга или количество.'};
  const cost=book.cost*qty;
  if(!Number.isFinite(coins)||coins<cost)return {ok:false,error:`Не хватает ${Math.max(0,cost-coins)} 🪙 для заказа.`};
  if(inventory.shipments.length>=MAX_SHIPMENTS)return {ok:false,error:'Слишком много посылок в пути. Дождись доставки.'};
  if((inventory.stock[bookId]||0)+pendingCopies(inventory,bookId)+qty>MAX_ON_ORDER)return {ok:false,error:'На полке и в пути может быть не больше 8 экземпляров одной книги.'};
  inventory.shipments.push({bookId,qty,dueAt:now+SUPPLIER_BY_ID[book.supplier].deliveryMs});
  inventory.spent+=cost;
  addInventoryEvent(inventory,'purchase',bookId,qty);
  return {ok:true,cost,dueAt:now+SUPPLIER_BY_ID[book.supplier].deliveryMs};
}

export function receiveBookShipments(inventory,now=Date.now()) {
  const arrived=[];
  inventory.shipments=inventory.shipments.filter(s=>{
    if(s.dueAt>now)return true;
    inventory.stock[s.bookId]=(inventory.stock[s.bookId]||0)+s.qty;
    addInventoryEvent(inventory,'delivery',s.bookId,s.qty);
    arrived.push(s);
    return false;
  });
  return arrived;
}

export function sellBook(inventory,bookId){
  const book=BOOK_BY_ID[bookId];
  if(!book||(inventory.stock[bookId]||0)<1)return {ok:false};
  inventory.stock[bookId]--;
  inventory.sold++;
  inventory.earned+=book.price;
  addInventoryEvent(inventory,'sale',bookId,1);
  return {ok:true,revenue:book.price};
}
