import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const start=app.indexOf('    async function welcomeWasSeen(){');
const end=app.indexOf('    // Only the open interior mounts its image;',start);
const welcomeLogic=app.slice(start,end);

test('first opening shows Bella one welcome, then hides it on future launches',async()=>{
  assert.ok(start>0&&end>start,'welcome functions are present');
  assert.match(app,/const FORMAT=14/,'the game save format stays unchanged');
  const records=new Map(),local=new Map();
  let markup='',closeCount=0,click=null;
  const context={
    WELCOME_KEY:'welcome-seen',
    db:{transaction(){
      const tx={objectStore(){return {put(value,key){
        queueMicrotask(()=>{records.set(key,value);tx.oncomplete?.();});
      }};}};
      return tx;
    }},
    read:async key=>records.get(key),
    localStorage:{getItem:key=>local.get(key)||null,setItem:(key,value)=>local.set(key,value)},
    show:html=>{markup=html;},
    close:()=>{closeCount++;},
    dialog:{classList:{add:()=>{}}},
    document:{getElementById:id=>{assert.equal(id,'welcomeStart');return {addEventListener:(_event,fn)=>{click=fn;}};}},
    queueMicrotask
  };
  const welcome=vm.runInNewContext(`${welcomeLogic}\n({welcomeWasSeen,showWelcome})`,context);
  assert.equal(await welcome.welcomeWasSeen(),false);
  welcome.showWelcome();
  assert.match(markup,/ТИХАЯ БУХТА · ДОБРО ПОЖАЛОВАТЬ/);
  assert.match(markup,/Белла, это твой маленький мир ♡/);
  assert.match(markup,/Начать приключение ✨/);
  await click();
  assert.equal(records.get('welcome-seen'),true);
  assert.equal(local.get('quiet-bay-welcome-seen'),'yes');
  assert.equal(closeCount,1);
  assert.equal(await welcome.welcomeWasSeen(),true);
});
