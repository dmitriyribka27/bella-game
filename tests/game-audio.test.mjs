import test from 'node:test';
import assert from 'node:assert/strict';
import {AUDIO_STORAGE_KEY,audioPreferences,createGameAudio} from '../docs/game-audio.js';

function setup(saved){
  const data=new Map(saved?[[AUDIO_STORAGE_KEY,JSON.stringify(saved)]]:[]);
  const storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
  const documentRef={hidden:false};
  const tracks=[];
  class FakeAudio{
    constructor(src){this.src=src;this.paused=true;this.played=0;this.stopped=0;tracks.push(this);}
    play(){this.paused=false;this.played++;return Promise.resolve();}
    pause(){this.paused=true;this.stopped++;}
  }
  let clicks=0;
  class FakeContext{
    constructor(){this.state='running';this.currentTime=1;this.destination={};}
    createOscillator(){return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(){clicks++;},stop(){}};}
    createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
    suspend(){this.state='suspended';return Promise.resolve();}
    resume(){this.state='running';return Promise.resolve();}
  }
  const audio=createGameAudio({storage,documentRef,AudioCtor:FakeAudio,AudioContextCtor:FakeContext});
  return {audio,track:tracks[0],storage,documentRef,get clicks(){return clicks;}};
}

test('sound defaults are both on; stored preferences are honored',()=>{
  assert.deepEqual(audioPreferences({getItem:()=>'{broken'}),{music:true,effects:true});
  const {audio}=setup({music:false,effects:true});
  assert.deepEqual(audio.preferences,{music:false,effects:true});
});

test('music waits for first gesture and respects pause/background',()=>{
  const {audio,track,documentRef}=setup();
  assert.equal(track.played,0);
  audio.unlock();
  assert.equal(track.played,1);
  assert.equal(track.loop,true);
  assert.equal(track.volume,.22);
  audio.setPaused(true);
  assert.equal(track.paused,true);
  audio.setPaused(false);
  assert.equal(track.played,2);
  documentRef.hidden=true;audio.sync();
  assert.equal(track.paused,true);
  documentRef.hidden=false;audio.sync();
  assert.equal(track.played,3);
});

test('music and effects can be switched independently, with persisted settings',()=>{
  const state=setup();
  state.audio.unlock();
  state.audio.setMusic(false);
  assert.equal(state.track.paused,true);
  state.audio.tap();
  assert.equal(state.clicks,1);
  state.audio.setEffects(false);
  state.audio.tap();
  assert.equal(state.clicks,1);
  assert.deepEqual(JSON.parse(state.storage.getItem(AUDIO_STORAGE_KEY)),{music:false,effects:false});
  state.audio.setMusic(true);
  assert.equal(state.track.played,2);
});

test('sound stays quiet if restored game is paused',()=>{
  const state=setup();
  state.audio.setPaused(true);
  state.audio.unlock();
  assert.equal(state.track.played,0);
  state.audio.setPaused(false);
  assert.equal(state.track.played,1);
});
