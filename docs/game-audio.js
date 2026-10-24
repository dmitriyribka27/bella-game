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
  let unlocked=false,paused=false,context=null,lastTap=-Infinity;
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
  return {preferences,unlock,tap,coinGain,coinSpend,sync,setPaused,setMusic,setEffects};
}
