import {BOOK_CATALOG,BOOK_BY_ID} from './book-inventory.js';

// Native vector artwork and HTML titles remain crisp at any iPhone zoom level.
// These are fictional books written for Quiet Bay; no third-party jacket art.
const THEMES = [
  ['#286274','#133b58','#eac58e','sail'],
  ['#283f78','#161e47','#d9b970','stars'],
  ['#965a48','#5c3743','#ffe09b','campfire'],
  ['#8a5e69','#553e5c','#f6d3b3','tea'],
  ['#6a597d','#3f3c62','#e9c8a6','letter'],
  ['#a46c45','#704431','#f7d29d','book'],
  ['#5c7286','#344c69','#f7dac4','book'],
  ['#4c6471','#263947','#dfba75','key'],
  ['#486c80','#263d65','#e0cfab','cipher'],
  ['#8d5550','#553d46','#ead2aa','paper'],
  ['#38434e','#1b273c','#d6b576','lens'],
  ['#718963','#3c654d','#f3d6a3','flower'],
  ['#597962','#2b5648','#dbe7b2','leaf'],
  ['#9a667f','#5d4063','#f3d3bc','flower'],
  ['#6f8969','#476847','#f0d4a7','flower'],
  ['#344c85','#1c2e62','#e9cd9a','meteor'],
  ['#5767a0','#373c72','#efcfad','letter'],
  ['#253b72','#131f42','#ddbc83','moon'],
  ['#9a7860','#654f4c','#f6dfb2','village'],
  ['#57828b','#325c6e','#ebd5b4','paper'],
  ['#80675d','#4e484b','#f2dbb9','tree'],
  ['#557b79','#305462','#f0d4aa','island']
];

const MOTIFS={
  sail:'<path d="M19 78h83l-12 11H30Z"/><path d="M58 75V11L26 69h32M65 19l27 49H65Z"/><path d="M13 97q12-10 24 0t24 0t24 0t24 0"/>',
  stars:'<path d="m24 32 23-17 29 20 21-16M47 15l2 48 27-28 6 44"/><circle cx="24" cy="32" r="4"/><circle cx="47" cy="15" r="3"/><circle cx="76" cy="35" r="5"/><circle cx="97" cy="19" r="3"/><circle cx="82" cy="79" r="4"/><path d="m22 72 3 10 10 3-10 3-3 10-3-10-10-3 10-3Z"/>',
  campfire:'<path d="M25 88 94 99M95 88 26 99"/><path d="M60 92C30 85 37 65 54 48c-1 17 16 15 9-42 28 33 36 69-3 86Z"/><path d="M61 87C49 80 55 67 64 57c12 14 12 24-3 30Z"/>',
  tea:'<path d="M22 46h62v23a27 27 0 0 1-54 0V46M84 50h10a13 13 0 0 1 0 26H84M17 89h75"/><path d="M41 35q-11-12 0-23m18 23q-11-12 0-23m18 23q-11-12 0-23"/>',
  letter:'<rect x="17" y="22" width="87" height="65" rx="5"/><path d="M18 24 61 58l43-34M18 86l32-35m54 35L73 51"/><path d="M48 67q14-10 28 0"/>',
  book:'<path d="M61 28Q39 16 14 29v58q29-11 47 1 18-12 45-1V29Q82 16 61 28v60M25 40q15-5 26 0m-26 13q15-5 26 0m21-13q13-5 25 0m-25 13q13-5 25 0"/>',
  key:'<circle cx="38" cy="37" r="21"/><circle cx="38" cy="37" r="7"/><path d="m53 52 46 46M76 75l11-11m2 25 10-10"/>',
  cipher:'<circle cx="60" cy="54" r="41"/><circle cx="60" cy="54" r="23"/><path d="M60 13v18m0 45v19M19 54h19m44 0h19M34 25l14 13m24 33 13 12"/><circle cx="60" cy="54" r="5"/>',
  paper:'<path d="M24 15h72v83H24Z"/><path d="M35 29h49M35 42h49M35 55h32M35 74h20m7 0h22M35 85h49"/><rect x="68" y="62" width="16" height="12"/>',
  lens:'<circle cx="51" cy="43" r="27"/><path d="m72 64 28 29"/><path d="M36 35q6-10 18-9"/>',
  flower:'<path d="M58 95V46m0 20Q31 42 20 59q6 23 38 23m0-16q27-24 41-7-7 23-41 23"/><circle cx="58" cy="33" r="11"/><ellipse cx="58" cy="15" rx="9" ry="13"/><ellipse cx="58" cy="51" rx="9" ry="13"/><ellipse cx="39" cy="33" rx="13" ry="9"/><ellipse cx="77" cy="33" rx="13" ry="9"/>',
  leaf:'<path d="M60 95V30M60 70q-46-14-35-43 35-7 35 43Zm0-20q45-20 34-43-35 0-34 43Zm0 36q-27-2-34-20 25-9 34 20Z"/>',
  meteor:'<path d="M13 90 63 40M15 63l34-34m6 65 25-25"/><path d="m83 15 9 15 17 3-12 12 3 17-17-8-16 8 3-17-12-12 17-3Z"/>',
  moon:'<path d="M84 13a41 41 0 1 0 25 66A39 39 0 0 1 84 13Z"/><path d="m28 17 3 10 11 3-11 3-3 10-3-10-10-3 10-3Zm73 42 2 6 7 2-7 2-2 7-2-7-7-2 7-2Z"/>',
  village:'<path d="M14 87h94M20 87V46l22-18 22 18v41M32 86V64h16v23M72 87V36l16-13 16 13v51M82 50h13v14H82Z"/><path d="M16 46l26-22 26 22m1-10 19-17 20 17"/>',
  tree:'<path d="M60 100V40m0 40 18-17m-18 7-19-17"/><path d="M60 15c-24-7-38 12-34 26-22 11-11 38 10 38 7 14 39 14 46 0 25 1 32-32 11-40-4-19-17-28-33-24Z"/>',
  island:'<path d="M13 84q15-9 30 0t30 0t34 0M10 98q15-9 30 0t30 0t37 0"/><path d="M22 77 49 36l20 21 15-10 19 30Z"/><circle cx="86" cy="22" r="12"/>'
};

export function bookCoverTheme(bookId){
  const index=BOOK_CATALOG.findIndex(book=>book.id===bookId);
  return index>=0?THEMES[index]:THEMES[0];
}

function escapeText(value){return String(value).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[x]));}

export function bookCoverMarkup(bookId){
  const book=BOOK_BY_ID[bookId];if(!book)return '';
  const [base,dark,ink,motif]=bookCoverTheme(bookId);
  return `<span class="bookCover" style="--book-base:${base};--book-dark:${dark};--book-ink:${ink}"><span class="bookCoverTop">ТИХАЯ БУХТА</span><svg class="bookCoverArt" viewBox="0 0 120 110" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MOTIFS[motif]}</svg><span class="bookCoverTitle">${escapeText(book.title)}</span><span class="bookCoverFoot">CognitioVerum</span></span>`;
}
