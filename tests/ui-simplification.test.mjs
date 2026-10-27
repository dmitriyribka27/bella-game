import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const menuLine=app.split('\n').find(line=>line.includes('show(`<h2>Меню бухты'));
const residentLine=app.slice(app.indexOf('function renderUI(){'),app.indexOf("details.addEventListener('click'"));

test('settings menu keeps four useful controls, two audio toggles, and optional lighting',()=>{
  assert.ok(menuLine);
  const labels=Array.from(menuLine.matchAll(/<button\b[^>]*>(.*?)<\/button>/g),m=>m[1]);
  assert.equal(labels.length,8);
  assert.match(labels[0],/Музыка/);
  assert.match(labels[1],/Кнопки и монеты/);
  assert.match(labels[2],/Смена дня и ночи/);
  assert.match(labels[3],/Семейный альбом/);
  assert.match(labels[4],/Проверить сохранение и офлайн/);
  assert.match(labels[5],/Экспортировать сохранение/);
  assert.match(labels[6],/Импортировать файл/);
  assert.equal(labels[7],'Закрыть');
  assert.doesNotMatch(menuLine,/restore|Как играть|Копия до|Вернуть предыдущую/);
});

test('old guide is removed from current game, and resident actions use short labels',()=>{
  assert.doesNotMatch(app,/showGuide|data-action="guide"|id="help"|Как играть/);
  for(const label of ['Работать 🪙','Отдыхать 💤','Играть 🎭']){
    assert.ok(residentLine.includes(label),label);
  }
  assert.ok(residentLine.includes("bella?'Поесть':'Кормить'"),'Bella eats, and cats retain the feeding label');
  for(const oldText of ['Работать · +монеты','Отдыхать · +бодрость','Кормить · +сытость','Играть · +настроение'])assert.ok(!residentLine.includes(oldText));
  assert.ok(residentLine.includes('data-action="home-upgrades"'));
});

test('export/import and automatic backups stay functional after simplifying visible menu',()=>{
  assert.match(app,/if\(id==='import'\)document\.getElementById\('file'\)\.click\(\)/);
  assert.match(app,/if\(id==='export'\)/);
  assert.match(app,/function write\(\)/);
  assert.match(app,/store\.put\(backup,'previous'\)/);
  assert.match(app,/if\(!valid\(data\)\)throw Error/);
  assert.match(app,/const FORMAT=14/);
  assert.match(app,/<strong>Тихая бухта<\/strong>/);
});
