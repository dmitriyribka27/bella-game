// Original, procedurally composed instrumental loop for Quiet Bay.
// Generate the WAV locally, then encode it as MP3 for broad mobile support:
// node scripts/compose-quiet-bay.mjs
// ffmpeg -y -i docs/assets/audio/quiet-bay-theme.wav -codec:a libmp3lame -q:a 5 docs/assets/audio/quiet-bay-theme.mp3
import {mkdirSync,writeFileSync} from 'node:fs';

const SAMPLE_RATE=24000;
const SECONDS=48;
const FRAMES=SAMPLE_RATE*SECONDS;
const left=new Float32Array(FRAMES),right=new Float32Array(FRAMES);
const TWO_PI=Math.PI*2;
const chords=[
  {bass:48,pad:[55,59,62,64],arp:[64,67,71,74],melody:[76,74,71,67]}, // Cmaj9
  {bass:47,pad:[55,59,62,64],arp:[62,67,71,76],melody:[74,76,71,69]}, // G6/B
  {bass:45,pad:[52,55,59,60],arp:[60,64,67,71],melody:[72,71,69,67]}, // Am9
  {bass:41,pad:[48,52,55,57],arp:[57,60,64,67],melody:[69,67,64,60]}, // Fmaj9
  {bass:50,pad:[57,60,64,69],arp:[60,65,69,72],melody:[74,72,69,65]}, // Dm9
  {bass:43,pad:[50,59,64,67],arp:[59,62,64,69],melody:[71,74,76,74]}, // G13
  {bass:52,pad:[55,59,62,64],arp:[64,67,71,74],melody:[76,79,76,74]}, // Cmaj9/E
  {bass:43,pad:[50,57,60,62],arp:[62,67,69,72],melody:[74,72,69,67]}  // Gsus(add9)
];

function frequency(note){return 440*2**((note-69)/12);}
function addNote(at,note,length,volume,instrument='piano',pan=0){
  const freq=frequency(note), count=Math.round(length*SAMPLE_RATE);
  const index=Math.round(at*SAMPLE_RATE);
  const leftGain=Math.sqrt((1-pan)*.5),rightGain=Math.sqrt((1+pan)*.5);
  for(let i=0;i<count;i++){
    const t=i/SAMPLE_RATE,phase=TWO_PI*freq*t;
    let tone,envelope;
    if(instrument==='pad'){
      const attack=Math.min(1,t/1.2),release=Math.min(1,(length-t)/1.7);
      envelope=attack*release*(.91+.09*Math.sin(TWO_PI*.16*t));
      tone=Math.sin(phase)+.18*Math.sin(2*phase+.3)+.16*Math.sin(phase*1.003);
    }else if(instrument==='bass'){
      envelope=(1-Math.exp(-t*17))*Math.exp(-t*.78)*Math.min(1,(length-t)*8);
      tone=Math.sin(phase)+.2*Math.sin(2*phase);
    }else if(instrument==='bell'){
      envelope=(1-Math.exp(-t*28))*Math.exp(-t*1.2)*Math.min(1,(length-t)*10);
      tone=Math.sin(phase)+.25*Math.sin(2*phase)+.09*Math.sin(3*phase);
    }else{
      envelope=(1-Math.exp(-t*40))*Math.exp(-t*1.85)*Math.min(1,(length-t)*10);
      tone=Math.sin(phase)+.17*Math.sin(2*phase)+.035*Math.sin(3*phase);
    }
    const sample=tone*envelope*volume,j=(index+i)%FRAMES;
    left[j]+=sample*leftGain;
    right[j]+=sample*rightGain;
  }
}

for(let bar=0;bar<chords.length;bar++){
  const chord=chords[bar],base=bar*6;
  chord.pad.forEach((note,i)=>addNote(base-.22,note,6.6,.031,'pad',[-.35,-.12,.12,.35][i]));
  addNote(base,chord.bass-12,3.1,.070,'bass',-.12);
  addNote(base+3,chord.bass-12,3.1,.047,'bass',.12);
  const offsets=[.12,1.62,3.12,4.62];
  offsets.forEach((offset,i)=>addNote(base+offset,chord.arp[[0,2,1,3][i]],2.2,.049,'piano',i%2?-.23:.23));
  const melodyOffsets=[.9,2.25,3.9,5.15];
  melodyOffsets.forEach((offset,i)=>addNote(base+offset,chord.melody[i],1.55,.023,'bell',i%2?.3:-.3));
}

// Small, wraparound stereo echoes create a room sound and keep the loop seamless.
const dryLeft=left.slice(),dryRight=right.slice();
for(const [seconds,amount] of [[.24,.14],[.49,.08],[.83,.04]]){
  const shift=Math.round(seconds*SAMPLE_RATE);
  for(let i=0;i<FRAMES;i++){
    const source=(i-shift+FRAMES)%FRAMES;
    left[i]+=dryRight[source]*amount;
    right[i]+=dryLeft[source]*amount;
  }
}

let peak=0;
for(let i=0;i<FRAMES;i++)peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));
const multiplier=.58/peak;
const pcm=Buffer.allocUnsafe(44+FRAMES*4);
pcm.write('RIFF',0);pcm.writeUInt32LE(pcm.length-8,4);pcm.write('WAVEfmt ',8);
pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(2,22);
pcm.writeUInt32LE(SAMPLE_RATE,24);pcm.writeUInt32LE(SAMPLE_RATE*4,28);
pcm.writeUInt16LE(4,32);pcm.writeUInt16LE(16,34);
pcm.write('data',36);pcm.writeUInt32LE(FRAMES*4,40);
for(let i=0;i<FRAMES;i++){
  pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,left[i]*multiplier))*32767),44+i*4);
  pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,right[i]*multiplier))*32767),46+i*4);
}
mkdirSync('docs/assets/audio',{recursive:true});
writeFileSync('docs/assets/audio/quiet-bay-theme.wav',pcm);
console.log(`Composed ${SECONDS}s stereo original loop, peak=${peak.toFixed(3)}.`);
