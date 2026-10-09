const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {StoryRuntime} = require('../work/core/story/StoryRuntime.js');
const {createInitialState} = require('../work/core/core/GameState.js');
const {LocalSave,normalizeSave} = require('../work/core/save/LocalSave.js');
const {clamp,meets,weightedScore} = require('../work/core/core/NarrativeMath.js');
const folder = 'assets/resources/data/story/chapter01/';
const manifest = JSON.parse(fs.readFileSync(folder+'chapter01_manifest.json','utf8'));
const episodes = manifest.episodes.map(e=>JSON.parse(fs.readFileSync('assets/resources/'+e.resource+'.json','utf8')));
function storage() { const values=new Map(); return {values,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)} }
test('all choice combinations and investigation orders reach slice end',()=>{
  const queue=[{state:createInitialState(),index:0,steps:0}]; let endings=0;
  while(queue.length) {
    const item=queue.pop(); assert.ok(item.steps<250);
    const state=structuredClone(item.state); const runtime=new StoryRuntime(state,()=>true);
    runtime.load(episodes[item.index]); const node=runtime.current();
    const enqueue=fn=>{const copy=structuredClone(state);const r=new StoryRuntime(copy,()=>true);r.load(episodes[item.index]);fn(r);queue.push({state:copy,index:item.index,steps:item.steps+1})};
    if(node.type==='episodeEnd'){
      if(node.next==='CH02'){endings++;assert.ok(state.flags.IN_MEMORY_2007);assert.ok(state.flags.OPENED_MP3_RECORDING);assert.ok(state.flags.VIEWED_OLD_PHOTO&&state.flags.VIEWED_LETTER)}
      else {const index=episodes.findIndex(e=>e.episodeId===node.next);assert.ok(index>=0);queue.push({state,index,steps:item.steps+1})}
    } else if(node.type==='choice') node.options.forEach(o=>enqueue(r=>r.choose(o.id,node.id)));
    else if(node.type==='investigation'){
      node.items.filter(i=>!state.flags[i.viewedFlag]).forEach(i=>enqueue(r=>r.inspect(i.id,node.id)));
      if(node.requiredFlags.every(f=>state.flags[f]))enqueue(r=>r.complete(node.id));
    } else if(['dialogue','narration','passage','phone'].includes(node.type))enqueue(r=>r.advance(node.id));
    else enqueue(r=>r.complete(node.id));
  }
  assert.ok(endings>=100); console.log('Completed routes: '+endings);
});
test('revisiting photo cannot farm stats, and stale input cannot repeat choice',()=>{
  const s=createInitialState();s.progress.episodeId='CH01_EP02';s.progress.nodeId='CH01_EP02_C001';
  const r=new StoryRuntime(s,()=>true);r.load(episodes[1]);
  const view=()=>{r.inspect('photo','CH01_EP02_C001');r.complete('CH01_EP02_PHOTO_001')};
  view();const n=s.stats.nostalgia;view();assert.equal(s.stats.nostalgia,n);
  assert.throws(()=>r.complete('CH01_EP02_C001'),/Required/);
  r.inspect('letter','CH01_EP02_C001');r.complete('CH01_EP02_LETTER_001');r.complete('CH01_EP02_C001');
  r.advance('CH01_EP02_NAME_001');r.choose('B','CH01_EP02_C002');
  assert.throws(()=>r.choose('B','CH01_EP02_C002'),/Stale/);assert.equal(s.stats.honesty,2);
});
test('resume every interaction preserves cursor and flags',()=>{
  for(const ep of episodes)for(const node of ep.nodes.filter(n=>['photo','letter','audioInteraction','transition','choice','investigation','episodeEnd','passage','phone'].includes(n.type))){
    const st=storage();const local=new LocalSave(st,'test');const s=createInitialState();
    s.progress.episodeId=ep.episodeId;s.progress.nodeId=node.id;s.flags.TEST=true;
    assert.ok(local.save(s));const restored=local.load();const r=new StoryRuntime(restored,()=>true);r.load(ep);
    assert.equal(r.current().id,node.id);assert.ok(restored.flags.TEST);
  }
});
test('only the consequential disclosure is a decision; daily content advances naturally',()=>{
  const choices=episodes.flatMap(e=>e.nodes.filter(n=>n.type==='choice'));
  assert.deepEqual(choices.map(n=>n.id),['CH01_EP02_C002']);
  assert.ok(choices[0].consequence && choices[0].prompt);
  assert.ok(episodes.flatMap(e=>e.nodes).some(n=>n.type==='phone'));
  const s=createInitialState();const r=new StoryRuntime(s,()=>true);r.load(episodes[3]);
  s.progress.nodeId='CH01_EP04_BUS';r.current();
  assert.equal(s.life.time.year,2007);assert.equal(s.life.stage,'student');
  assert.equal(s.life.memoryRecords.FIRST_MEETING.status,'fragmentary');
  r.advance('CH01_EP04_BUS');assert.equal(r.current().id,'CH01_EP04_CLASSMATES');
});
test('v1 saves are backed up and removed dialogue nodes resume in life passages',()=>{
  const st=storage();const local=new LocalSave(st,'test');const old=createInitialState();
  old.saveVersion=1;delete old.life;delete old.progress.readingOffset;
  old.progress.episodeId='CH01_EP04';old.progress.nodeId='CH01_EP04_C001';old.flags.OLD_DECISION=true;old.stats.honesty=11;
  const raw=JSON.stringify(old);st.values.set('test',raw);const restored=local.load();
  assert.equal(st.values.get('test.v1.backup'),raw);assert.equal(restored.saveVersion,2);
  const r=new StoryRuntime(restored,s=>local.save(s));r.load(episodes[3]);
  assert.equal(r.current().id,'CH01_EP04_BUS');assert.equal(restored.life.time.year,2007);
  assert.equal(restored.stats.honesty,11);assert.ok(restored.flags.OLD_DECISION);
  const blocked=new LocalSave({getItem:key=>key==='test'?raw:null,setItem:()=>{throw Error('quota')},removeItem:()=>{}},'test');
  assert.throws(()=>blocked.load(),/无法备份/);assert.equal(blocked.save(createInitialState()),false);
});
test('reading position and memory evidence survive resume without duplicate or downgrade',()=>{
  const st=storage();const local=new LocalSave(st,'test');const s=createInitialState();
  s.progress.episodeId='CH01_EP04';s.progress.nodeId='CH01_EP04_BUS';s.progress.readingOffset=0.7;
  s.life.memoryRecords.FIRST_MEETING={title:'初次相识',status:'complete',evidence:['另一份证词']};
  local.save(s);const restored=local.load();const r=new StoryRuntime(restored,()=>true);r.load(episodes[3]);
  r.current();r.current();assert.equal(restored.progress.readingOffset,0.7);
  assert.equal(restored.life.memoryRecords.FIRST_MEETING.status,'complete');
  assert.equal(new Set(restored.life.memoryRecords.FIRST_MEETING.evidence).size,3);
  r.advance('CH01_EP04_BUS');assert.equal(restored.progress.readingOffset,0);
});
test('malformed, future and blocked storage saves preserve data',()=>{
  const st=storage();const local=new LocalSave(st,'test');st.values.set('test','broken');
  local.load();assert.equal(st.values.get('test.corrupt'),'broken');
  const future=JSON.stringify({saveVersion:99});st.values.set('test',future);
  assert.throws(()=>local.load(),/较新/);assert.equal(local.save(createInitialState()),false);assert.equal(st.values.get('test'),future);
  const blocked=new LocalSave({getItem:()=>null,setItem:()=>{throw Error('quota')},removeItem:()=>{throw Error('denied')}},'test');
  assert.equal(blocked.save(createInitialState()),false);assert.equal(blocked.clear(),false);assert.ok(blocked.warning);
  assert.throws(()=>normalizeSave(null));const s=normalizeSave({stats:{honesty:1000,avoidance:'bad'},flags:{truth:true,bad:'yes'},readNodeIds:['a',4,'a']});
  assert.equal(s.stats.honesty,100);assert.equal(s.stats.avoidance,0);assert.deepEqual(s.flags,{truth:true});assert.deepEqual(s.readNodeIds,['a']);
});
test('numeric bounds and evidence gates remain independent of scores',()=>{
  assert.equal(clamp(-2),0);assert.equal(clamp(130),100);assert.throws(()=>clamp(NaN));
  const s=createInitialState();s.stats.honesty=100;s.stats.selfReflection=100;
  const gate={all:[{stat:'selfReflection',min:65},{flag:'READ_FULL_LETTER'}]};
  assert.equal(meets(s,gate),false);assert.equal(weightedScore(s,{honesty:0.5}),50);
  s.flags.READ_FULL_LETTER=true;assert.equal(meets(s,gate),true);
  assert.equal(meets(s,{not:{any:[{flag:'HIDDEN_A'},{flag:'HIDDEN_B'}]}}),true);
});
