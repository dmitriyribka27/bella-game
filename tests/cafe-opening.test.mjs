import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CAFE_OPENING_STAGES,cafeStageDone,nextCafeStage,startCafeTask,answerCafeTask} from '../docs/cafe-opening.js';

const blank=()=>({built:false,plan:false,delivery:false,recipe:false,style:null,orders:0});
const app=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');

test('four sequential quests have useful choices and no duplicate answers',()=>{
  assert.deepEqual(CAFE_OPENING_STAGES.map(stage=>stage.id),['plan','delivery','recipe','style']);
  assert.deepEqual(CAFE_OPENING_STAGES.map(stage=>stage.owner),['Лев','Цитера','Рыжий','Белла']);
  for(const stage of CAFE_OPENING_STAGES){
    assert.ok(stage.steps.length>=2);
    for(const step of stage.steps){
      assert.ok(step.question.length>20);
      assert.ok(step.options.length>=3);
      assert.equal(new Set(step.options.map(option=>option.id)).size,step.options.length);
      if(!step.styleChoice){
        assert.ok(step.options.some(option=>option.id===step.right));
        assert.ok(step.hint.length>20);
      }
    }
  }
});

test('wrong answer cannot advance or finish a quest',()=>{
  const stage=CAFE_OPENING_STAGES[0],session=startCafeTask(stage);
  const wrong=answerCafeTask(stage,session,'kitchen');
  assert.equal(wrong.ok,false);
  assert.match(wrong.hint,/Стойка|стойке/);
  assert.equal(session.step,0);
  assert.equal(session.history.length,0);
  const missing=answerCafeTask(stage,session,'forged');
  assert.equal(missing.ok,false);
});

test('each quest advances only after all steps and cannot be replayed with same session',()=>{
  for(const stage of CAFE_OPENING_STAGES){
    let session=startCafeTask(stage);
    for(const [i,step] of stage.steps.entries()){
      const answer=step.styleChoice?'mint':step.right;
      const result=answerCafeTask(stage,session,answer);
      assert.equal(result.ok,true,stage.id);
      assert.equal(result.complete,i===stage.steps.length-1);
      assert.equal(result.session.step,i+1);
      session=result.session;
    }
    assert.equal(answerCafeTask(stage,session,'mint').ok,false);
    if(stage.id==='style')assert.equal(session.style,'mint');
  }
});

test('legacy completed flags unlock the next unfinished stage without replay',()=>{
  const coffee=blank();
  assert.equal(nextCafeStage(coffee).id,'plan');
  coffee.plan=true;
  assert.equal(nextCafeStage(coffee).id,'delivery');
  coffee.delivery=true;
  assert.equal(nextCafeStage(coffee).id,'recipe');
  coffee.recipe=true;
  assert.equal(nextCafeStage(coffee).id,'style');
  coffee.style='coral';
  assert.equal(nextCafeStage(coffee),null);
  assert.ok(CAFE_OPENING_STAGES.every(stage=>cafeStageDone(coffee,stage)));
  coffee.style='invalid';
  assert.equal(nextCafeStage(coffee).id,'style');
});

test('opening is a dedicated screen; cost and saved schema remain protected',()=>{
  assert.match(app,/function showCafeOpening\(/);
  assert.match(app,/data-cafe="opening"/);
  assert.match(app,/data-cafe-interior-manage/);
  assert.match(app,/data-cafe-open-confirm/);
  assert.match(app,/city\.coffee\.built\|\|!cafeReady\(\)\|\|city\.coins<CAFE_OPENING_COST/);
  assert.match(app,/const FORMAT=14/);
  assert.match(app,/\[1,2,3,4,5,6,7,8,9,10,11,12,13,FORMAT\]/);
  assert.doesNotMatch(app,/data-cafe="plan"/);
  assert.doesNotMatch(app,/data-cafe="delivery"/);
  assert.doesNotMatch(app,/data-cafe="recipe"/);
});
