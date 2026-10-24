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
  if(soundtrack){soundtrack.loop=true;soundtrack.preload='none';soundtrack.volume=.22;}
  let unlocked=false,paused=false,context=null,lastTap=-Infinity;

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
  function tap(){
    if(!canPlay()||!preferences.effects||!AudioContextCtor)return;
    try{
      if(!context)context=new AudioContextCtor();
      if(context.state==='suspended')context.resume?.().catch?.(()=>{});
      const at=context.currentTime;
      if(at-lastTap<.045)return;
      lastTap=at;
      const oscillator=context.createOscillator(),volume=context.createGain();
      oscillator.type='sine';
      oscillator.frequency.setValueAtTime(720,at);
      oscillator.frequency.exponentialRampToValueAtTime(480,at+.065);
      volume.gain.setValueAtTime(.0001,at);
      volume.gain.exponentialRampToValueAtTime(.032,at+.009);
      volume.gain.exponentialRampToValueAtTime(.0001,at+.085);
      oscillator.connect(volume);volume.connect(context.destination);
      oscillator.start(at);oscillator.stop(at+.095);
    }catch{/* Some browser settings prohibit audio; gameplay still works. */}
  }
  return {preferences,unlock,tap,sync,setPaused,setMusic,setEffects};
}
