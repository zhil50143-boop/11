const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {StoryRuntime}=require('../work/core/story/StoryRuntime.js');
const {createInitialState}=require('../work/core/core/GameState.js');
const {LocalSave}=require('../work/core/save/LocalSave.js');
const folder='assets/resources/data/story/chapter02/';
const manifest=JSON.parse(fs.readFileSync(folder+'chapter02_manifest.json'));
const episodes=manifest.episodes.map(e=>JSON.parse(fs.readFileSync('assets/resources/'+e.resource+'.json')));
function storage(){const values=new Map();return{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}}
test('chapter 02 has one lasting decision and both responses survive reload and recur after the weekend',()=>{
 const choices=episodes.flatMap(e=>e.nodes.filter(n=>n.type==='choice'));assert.equal(choices.length,1);
 const ep=episodes.at(-1);
 for(const [option,flag,reply,callback,stat,delta] of [
  ['TELL','CH02_TOLD_FAMILY_RELATION','CH02_EP06_TOLD','CH02_EP06_HOME_TOLD','honesty',2],
  ['WAIT','CH02_HID_FAMILY_RELATION','CH02_EP06_HIDDEN','CH02_EP06_HOME_HIDDEN','avoidance',1]
 ]){
  const state=createInitialState(),before=structuredClone(state.stats),local=new LocalSave(storage(),'test');
  state.progress={chapterId:'CH02',episodeId:ep.episodeId,nodeId:choices[0].id,readingOffset:0};
  const r=new StoryRuntime(state,s=>local.save(s));r.load(ep,'CH02');assert.equal(r.choose(option,choices[0].id).id,reply);
  const saved=local.load();assert.ok(saved.flags[flag]);assert.equal(saved.stats[stat]-before[stat],delta);
  const resumed=new StoryRuntime(saved,s=>local.save(s));resumed.load(ep,'CH02');assert.equal(resumed.current().id,reply);
  assert.equal(resumed.advance(reply).id,'CH02_EP06_SATURDAY');assert.equal(resumed.advance('CH02_EP06_SATURDAY').id,callback);
  assert.equal(saved.life.time.location,'回家路上');assert.equal(resumed.advance(callback).id,'CH02_EP06_CLOSE');
  assert.equal(saved.life.time.location,'周叙家');assert.equal(resumed.advance('CH02_EP06_CLOSE').next,'CH03');
  assert.deepEqual(saved.endings,{});assert.equal(saved.life.memoryRecords.FIRST_MEETING.status,'fragmentary');
 }
});
test('all new chapter 02 reading positions, phone messages and hidden life context survive local save',()=>{
 for(const ep of episodes)for(const node of ep.nodes.filter(n=>['passage','phone','choice'].includes(n.type))){
  const local=new LocalSave(storage(),'test'),s=createInitialState();s.flags.KEPT_PREVIOUS_CHAPTER=true;
  s.progress={chapterId:'CH02',episodeId:ep.episodeId,nodeId:node.id,readingOffset:0.42};
  const r=new StoryRuntime(s,state=>local.save(state));r.load(ep,'CH02');r.current();
  const saved=local.load(),copy=structuredClone(saved.life),resumed=new StoryRuntime(saved,()=>true);resumed.load(ep,'CH02');
  assert.equal(resumed.current().id,node.id);assert.equal(saved.progress.readingOffset,0.42);assert.ok(saved.flags.KEPT_PREVIOUS_CHAPTER);assert.deepEqual(saved.life,copy);
 }
});
test('summer is a bounded flashback before meeting Xia, and only fragments are recorded',()=>{
 const s=createInitialState(),r=new StoryRuntime(s,()=>true),ep=episodes[2];r.load(ep,'CH02');let n=r.current();
 assert.equal(s.life.time.month,7);assert.equal(n.lifeContext.memory.id,'HOME_SUMMER');
 while(n.type!=='episodeEnd')n=r.advance(n.id);
 assert.equal(s.life.time.month,9);assert.equal(s.life.time.timeline,'memory');assert.equal(s.life.memoryRecords.HOME_SUMMER.status,'fragmentary');
 assert.ok(s.life.memoryRecords.HOME_SUMMER.evidence.includes('工厂送钥匙'));assert.equal(s.life.stage,'student');
});
test('existing saves at the old chapter 02 boundary resume into the new summer episode',()=>{
 const local=new LocalSave(storage(),'test'),s=createInitialState();s.progress={chapterId:'CH02',episodeId:'CH02_EP02',nodeId:'CH02_EP02_END',readingOffset:0};s.flags.TOLD_PARTNER_XIA=true;
 local.save(s);const saved=local.load(),r=new StoryRuntime(saved,state=>local.save(state));r.load(episodes[1],'CH02');assert.equal(r.current().next,'CH02_EP03');
 r.load(episodes[2],'CH02');assert.equal(r.current().id,'CH02_EP03_N001');assert.ok(saved.flags.TOLD_PARTNER_XIA);assert.equal(local.load().progress.episodeId,'CH02_EP03');
});
test('old H5 collection corruption is backed up without inventing lost evidence or overwriting when backup fails',()=>{
 const s=createInitialState();s.progress={chapterId:'CH02',episodeId:'CH02_EP02',nodeId:'CH02_EP02_END',readingOffset:0};s.flags.TOLD_PARTNER_XIA=true;
 s.readNodeIds=[{},'CH02_EP02_GYM'];s.life.memoryRecords.FIRST_MEETING={title:'初次相识',status:'fragmentary',evidence:[{}]};const raw=JSON.stringify(s),values=new Map([['test',raw]]);
 const local=new LocalSave({getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},'test'),restored=local.load();
 assert.equal(values.get('test.v2.collections.backup'),raw);assert.equal(values.get('test'),raw);assert.deepEqual(restored.readNodeIds,['CH02_EP02_GYM']);assert.deepEqual(restored.life.memoryRecords.FIRST_MEETING.evidence,[]);assert.ok(restored.flags.TOLD_PARTNER_XIA);
 local.save(restored);assert.equal(values.get('test.v2.collections.backup'),raw);
 const blocked=new LocalSave({getItem:k=>k==='test'?raw:null,setItem:()=>{throw Error('quota')},removeItem:()=>{}},'test');assert.throws(()=>blocked.load(),/无法备份/);assert.equal(blocked.save(createInitialState()),false);
});
