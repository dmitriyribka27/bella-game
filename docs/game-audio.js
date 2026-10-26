// A tiny sound manager. Preferences are local to this browser and never touch city saves.
export const AUDIO_STORAGE_KEY='quiet-bay-audio-v1';

export function audioPreferences(storage){
  try{
    const saved=JSON.parse(storage?.getItem(AUDIO_STORAGE_KEY)||'null');
    return {music:saved?.music!==false,effects:saved?.effects!==false};
  }catch{return {music:true,effects:true};}
}

export function createGameAudio({
  musicUrl='./assets/audio/quiet-bay-theme.mp3?v=1',
  storage=globalThis.localStorage,
  documentRef=globalThis.document,
  AudioCtor=globalThis.Audio,
  AudioContextCtor=globalThis.AudioContext||globalThis.webkitAudioContext
}={}){
  const preferences=audioPreferences(storage);
  const soundtrack=AudioCtor?new AudioCtor(musicUrl):null;
  if(soundtrack){soundtrack.loop=true;soundtrack.preload='none';soundtrack.volume=.09;}
  let unlocked=false,paused=false,context=null,lastTap=-Infinity,lastSizzle=-Infinity;
  const lastJingle={gain:-Infinity,spend:-Infinity};

  function savePreferences(){
    try{storage?.setItem(AUDIO_STORAGE_KEY,JSON.stringify(preferences));}catch{}
  }
  function canPlay(){return unlocked&&!paused&&!documentRef?.hidden;}
  function sync(){
    if(soundtrack){
      if(canPlay()&&preferences.music){
        if(soundtrack.paused){const promise=soundtrack.play();promise?.catch?.(()=>{});}
      }else if(!soundtrack.paused)soundtrack.pause();
    }
    if(context&&context.state==='running'&&(!canPlay()||!preferences.effects))context.suspend?.();
    else if(context&&context.state==='suspended'&&canPlay()&&preferences.effects)context.resume?.().catch?.(()=>{});
  }
  function unlock(){
    unlocked=true;
    sync();
  }
  function setPaused(value){paused=!!value;sync();}
  function setMusic(value){preferences.music=!!value;savePreferences();sync();return preferences.music;}
  function setEffects(value){preferences.effects=!!value;savePreferences();sync();return preferences.effects;}
  function readyContext(){
    if(!canPlay()||!preferences.effects||!AudioContextCtor)return null;
    if(!context)context=new AudioContextCtor();
    if(context.state==='suspended')context.resume?.().catch?.(()=>{});
    return context;
  }
  function tap(){
    try{
      const ctx=readyContext();if(!ctx)return;
      const at=ctx.currentTime;
      if(at-lastTap<.045)return;
      lastTap=at;
      // A brighter, louder double plink is audible over the quiet soundtrack.
      for(const [from,to,peak] of [[880,600,.22],[1760,1200,.055]]){
        const oscillator=ctx.createOscillator(),volume=ctx.createGain();
        oscillator.type='sine';
        oscillator.frequency.setValueAtTime(from,at);
        oscillator.frequency.exponentialRampToValueAtTime(to,at+.10);
        volume.gain.setValueAtTime(.0001,at);
        volume.gain.exponentialRampToValueAtTime(peak,at+.006);
        volume.gain.exponentialRampToValueAtTime(.0001,at+.14);
        oscillator.connect(volume);volume.connect(ctx.destination);
        oscillator.start(at);oscillator.stop(at+.15);
      }
    }catch{/* Some browser settings prohibit audio; gameplay still works. */}
  }
  function coinJingle(kind){
    try{
      const ctx=readyContext();if(!ctx)return;
      const now=ctx.currentTime;
      if(now-lastJingle[kind]<.45)return; // Don't stack multiple simultaneous payments.
      lastJingle[kind]=now;
      // Earning coins rings upwards; spending them clinks downwards.
      const notes=kind==='gain'?[988,1318,1568,1760]:[1760,1480,1175,880];
      for(const [index,frequency] of notes.entries()){
        const start=now+[0,.14,.28,.45][index],life=index===3?.45:.35;
        for(const [pitch,peak] of [[frequency,.15],[frequency*2.57,.04]]){
          const oscillator=ctx.createOscillator(),volume=ctx.createGain();
          oscillator.type='sine';
          oscillator.frequency.setValueAtTime(pitch,start);
          volume.gain.setValueAtTime(.0001,start);
          volume.gain.exponentialRampToValueAtTime(peak,start+.006);
          volume.gain.exponentialRampToValueAtTime(.0001,start+life);
          oscillator.connect(volume);volume.connect(ctx.destination);
          oscillator.start(start);oscillator.stop(start+life+.012);
        }
      }
    }catch{/* Audio is optional, including when the browser blocks playback. */}
  }
  function coinGain(){coinJingle('gain');}
  function coinSpend(){coinJingle('spend');}
  function cookSizzle(){
    try{
      const ctx=readyContext();if(!ctx||!ctx.createBuffer||!ctx.createBufferSource)return;
      const now=ctx.currentTime;
      if(now-lastSizzle<1.8)return;
      lastSizzle=now;
      // Short frying hiss and gentle crackles, generated locally; no audio file or network.
      const duration=2.1,buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*duration),ctx.sampleRate);
      const samples=buffer.getChannelData(0);
      let warm=0;
      for(let i=0;i<samples.length;i++){
        const noise=Math.random()*2-1;
        warm=.94*warm+.06*noise;
        const pop=Math.random()<.0012?(Math.random()*.8+.2):0;
        samples[i]=noise*.42+warm*.75+pop;
      }
      const source=ctx.createBufferSource(),gain=ctx.createGain();
      source.buffer=buffer;
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(.09,now+.16);
      gain.gain.setValueAtTime(.09,now+1.52);
      gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
      if(ctx.createBiquadFilter){
        const filter=ctx.createBiquadFilter();filter.type='highpass';filter.frequency.value=540;
        source.connect(filter);filter.connect(gain);
      }else source.connect(gain);
      gain.connect(ctx.destination);
      source.start(now);source.stop(now+duration);
    }catch{/* Effects are optional on devices without Web Audio support. */}
  }
  return {preferences,unlock,tap,coinGain,coinSpend,cookSizzle,sync,setPaused,setMusic,setEffects};
}
