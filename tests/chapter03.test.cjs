const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {StoryRuntime}=require('../work/core/story/StoryRuntime.js');
const {createInitialState}=require('../work/core/core/GameState.js');
const {LocalSave}=require('../work/core/save/LocalSave.js');
const manifest=JSON.parse(fs.readFileSync('assets/resources/data/story/chapter03/chapter03_manifest.json'));
const episodes=manifest.episodes.map(e=>JSON.parse(fs.readFileSync('assets/resources/'+e.resource+'.json')));
const nodes=episodes.flatMap(e=>e.nodes);
function storage(){const values=new Map();return{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}}
function walk(state,plan){
 const local=new LocalSave(storage(),'test'),visited=[];let runtime;
 for(const ep of episodes){
  runtime=new StoryRuntime(state,s=>local.save(s));runtime.load(ep,'CH03');let node=runtime.current();
  while(node.type!=='episodeEnd'){
   visited.push(node.id);
   // Re-open every displayed node from the actual normalized save.
   const restored=local.load();assert.deepEqual(restored.progress,state.progress);assert.deepEqual(restored.flags,state.flags);assert.deepEqual(restored.life.memoryRecords,state.life.memoryRecords);
   runtime=new StoryRuntime(restored,s=>local.save(s));runtime.load(ep,'CH03');assert.equal(runtime.current().id,node.id);state=restored;
   node=node.type==='choice'?runtime.choose(plan,node.id):['passage','phone'].includes(node.type)?runtime.advance(node.id):runtime.complete(node.id);
  }
 }
 return{state,visited};
}
test('all four family-disclosure and planning combinations read their own cross-chapter consequences after reload',()=>{
 for(const told of [false,true])for(const plan of ['DISCUSS','ASSUME']){
  const s=createInitialState();s.flags[told?'CH02_TOLD_FAMILY_RELATION':'CH02_HID_FAMILY_RELATION']=true;s.flags.TOLD_PARTNER_XIA=true;
  const {state,visited}=walk(s,plan);
  for(const [a,b] of [['CH03_EP02_KNOWN','CH03_EP02_FIRST_NAME'],['CH03_EP04_FAMILY_KNOWN','CH03_EP04_FAMILY_LATE'],['CH03_EP06_FAMILY_KNOWN','CH03_EP06_FAMILY_LATE']]){assert.ok(visited.includes(told?a:b));assert.ok(!visited.includes(told?b:a));}
  assert.ok(visited.includes(plan==='DISCUSS'?'CH03_EP06_DISCUSS':'CH03_EP06_ASSUME'));assert.ok(state.flags[plan==='DISCUSS'?'CH03_DISCUSS_PLANS':'CH03_ASSUMED_SAME_CITY']);assert.ok(state.flags.TOLD_PARTNER_XIA);
  assert.equal(state.life.time.year,2009);assert.equal(state.life.time.month,8);assert.equal(state.life.stage,'graduate');assert.deepEqual(state.endings,{});assert.ok(!state.flags.READ_FULL_LETTER&&!state.flags.UNDERSTOOD_BREAKUP_TRUTH&&!state.flags.FOUND_FULL_RECORDING);
 }
});
test('chapter 03 photograph matches the chapter 01 old object and its envelope is not a full letter unlock',()=>{
 const first=JSON.parse(fs.readFileSync('assets/resources/data/story/chapter01/ep02_box.json'));
 assert.equal(nodes.find(n=>n.id==='CH03_EP05_PHOTO').backText,first.nodes.find(n=>n.id==='CH01_EP02_PHOTO_001').backText);
 const ep=episodes[5],s=createInitialState();s.progress={chapterId:'CH03',episodeId:ep.episodeId,nodeId:'CH03_EP06_ENVELOPE',readingOffset:0};
 const r=new StoryRuntime(s,()=>{});r.load(ep,'CH03');r.complete('CH03_EP06_ENVELOPE');assert.ok(s.flags.CH03_SEEN_FUTURE_ENVELOPE);assert.ok(!s.flags.READ_FULL_LETTER);assert.equal(s.life.memoryRecords.GRADUATION.status,'fragmentary');
 assert.equal(nodes.filter(n=>n.type==='choice').length,1);
});
test('old chapter 02 end saves continue into chapter 03 without resetting prior flags, stats or memories',()=>{
 const ep=JSON.parse(fs.readFileSync('assets/resources/data/story/chapter02/ep06_weekend.json')),s=createInitialState(),local=new LocalSave(storage(),'test');
 s.progress={chapterId:'CH02',episodeId:ep.episodeId,nodeId:'CH02_EP06_END',readingOffset:0};s.stats.honesty=8;s.flags.CH02_HID_FAMILY_RELATION=true;s.life.memoryRecords.FIRST_MEETING={title:'初次相识',status:'fragmentary',evidence:['旧体育馆午休']};local.save(s);
 const restored=local.load(),r=new StoryRuntime(restored,x=>local.save(x));r.load(ep,'CH02');assert.equal(r.current().next,'CH03');r.load(episodes[0],'CH03');assert.equal(r.current().id,'CH03_EP01_N001');assert.equal(restored.stats.honesty,8);assert.ok(restored.flags.CH02_HID_FAMILY_RELATION);assert.ok(restored.life.memoryRecords.FIRST_MEETING.evidence.includes('旧体育馆午休'));assert.equal(local.load().progress.chapterId,'CH03');
});
