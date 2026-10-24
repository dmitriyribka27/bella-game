import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const menuLine=app.split('\n').find(line=>line.includes("document.getElementById('settings').onclick"));
const residentLine=app.split('\n').find(line=>line.includes('function renderUI(){'));

test('settings menu has exactly the four useful controls and no legacy backup buttons',()=>{
  assert.ok(menuLine);
  const labels=Array.from(menuLine.matchAll(/<button\b[^>]*>(.*?)<\/button>/g),m=>m[1]);
  assert.equal(labels.length,4);
  assert.match(labels[0],/Семейный альбом/);
  assert.match(labels[1],/Экспортировать сохранение/);
  assert.match(labels[2],/Импортировать файл/);
  assert.equal(labels[3],'Закрыть');
  assert.doesNotMatch(menuLine,/restore|Как играть|Копия до|Вернуть предыдущую/);
});

test('old guide is removed from current game, and resident actions use short labels',()=>{
  assert.doesNotMatch(app,/showGuide|data-action="guide"|id="help"|Как играть/);
  for(const label of ['Работать 🪙','Отдыхать 💤','Кормить 🥣','Играть 🎭']){
    assert.ok(residentLine.includes(label),label);
  }
  for(const oldText of ['Работать · +монеты','Отдыхать · +бодрость','Кормить · +сытость','Играть · +настроение'])assert.ok(!residentLine.includes(oldText));
  assert.ok(residentLine.includes('data-action="home-upgrades"'));
});

test('export/import and automatic backups stay functional after simplifying visible menu',()=>{
  assert.match(app,/if\(id==='import'\)document\.getElementById\('file'\)\.click\(\)/);
  assert.match(app,/if\(id==='export'\)/);
  assert.match(app,/function write\(\)/);
  assert.match(app,/s\.put\(e\.target\.result,'previous'\)/);
  assert.match(app,/if\(!valid\(data\)\)throw Error/);
  assert.match(app,/const FORMAT=14/);
  assert.match(app,/<strong>Тихая бухта<\/strong>/);
});
