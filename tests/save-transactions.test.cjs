const {test}=require('node:test'),assert=require('node:assert/strict');
const {StoryRuntime,SaveWriteError}=require('../work/core/story/StoryRuntime.js');
const {createInitialState}=require('../work/core/core/GameState.js');
const {LocalSave,normalizeSave}=require('../work/core/save/LocalSave.js');
const {albumPhotos}=require('../work/core/story/PhotoCatalog.js');
const {loadStory,play,baseChoices}=require('../tools/story-analysis-lib.cjs');
const {createNextRound}=require('../work/core/story/EndingResolver.js');
const story=loadStory(),byId=id=>story.records.find(r=>r.node.id===id);
const episode=record=>story.chapters.find(c=>c.chapterId===record.chapter).episodes.find(e=>e.id===record.episode).data;
function fixture(record,initial){
  const values=new Map(),fault={blocked:false,writes:0},local=new LocalSave({getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(fault.blocked)throw Error('quota');fault.writes++;values.set(k,v)},removeItem:k=>values.delete(k)},'test');
  const state=initial?structuredClone(initial):createInitialState();state.progress={chapterId:record.chapter,episodeId:record.episode,nodeId:record.node.id,readingOffset:1};
  for(const f of record.node.requiredFlags||[])state.flags[f]=true;
  const runtime=new StoryRuntime(state,s=>local.save(s));runtime.load(episode(record),record.chapter);runtime.current();
  return{state,values,fault,local,runtime};
}
function failAndRetry(f,action){
  const before=structuredClone(f.state),raw=f.values.get('test'),flags=f.state.flags,writes=f.fault.writes;
  f.fault.blocked=true;assert.throws(action,SaveWriteError);
  assert.deepEqual(f.state,before);assert.strictEqual(f.state.flags,flags);assert.equal(f.values.get('test'),raw);assert.equal(f.fault.writes,writes);
  assert.equal(f.local.load().progress.nodeId,before.progress.nodeId);
  f.fault.blocked=false;action();assert.deepEqual(f.local.load(),f.state);
}
test('ordinary passage and phone failures preserve cursor, context, flags and read history until retry',()=>{
  for(const id of ['CH01_EP01_N001',story.records.find(r=>r.node.type==='phone'&&r.node.setFlags?.length).node.id]){
    const f=fixture(byId(id));failAndRetry(f,()=>f.runtime.advance(id));assert.ok(f.state.readNodeIds.includes(id));
  }
});
test('every real major decision rolls back all effects and retry applies the same option once',()=>{
  for(const record of story.records.filter(r=>r.node.type==='choice'))for(const option of record.node.options){
    const f=fixture(record);failAndRetry(f,()=>f.runtime.choose(option.id,record.node.id));
    const after=structuredClone(f.state);assert.throws(()=>f.runtime.choose(option.id,record.node.id),/Stale/);assert.deepEqual(f.state,after);
  }
});
test('every photo, letter, recording, investigation and transition completion is atomic on quota failure',()=>{
  for(const record of story.records.filter(r=>['photo','letter','audioInteraction','investigation','transition'].includes(r.node.type))){
    const f=fixture(record);failAndRetry(f,()=>f.runtime.complete(record.node.id));assert.ok(f.state.readNodeIds.includes(record.node.id));
  }
});
test('opening an investigation item cannot move the saved cursor when the write fails',()=>{
  const record=byId('CH01_EP02_C001'),f=fixture(record);failAndRetry(f,()=>f.runtime.inspect(record.node.items[0].id,record.node.id));
  assert.equal(f.state.progress.nodeId,record.node.items[0].next);
});
test('all six ending completions preserve the previous round and do not count an ending on failure',()=>{
  const paths=[[baseChoices,'FULL'],[{...baseChoices,CH09_EP04_MEETING_CHOICE:'DECLINE'},'FULL'],[{...baseChoices,CH09_EP01_CONTACT_CHOICE:'NONE'},'FULL'],[{...baseChoices,CH09_EP01_CONTACT_CHOICE:'NONE'},'NONE'],[{...baseChoices,CH07_EP04_CHOICE:'PAUSE',CH09_EP01_CONTACT_CHOICE:'NONE'},'NONE']];
  let prior=createInitialState();for(const [options,evidence]of paths.slice(0,3)){play(story,options,evidence,prior);prior=createNextRound(prior)}
  const seeds=[];
  for(const [options,evidence,initial]of [...paths.map(p=>[...p,createInitialState()]),[baseChoices,'FULL',prior]])play(story,options,evidence,initial,(node,state)=>{if(node.type==='ending')seeds.push({record:byId(node.id),state:structuredClone(state)})});
  assert.equal(new Set(seeds.map(s=>s.record.node.endingId)).size,6);
  for(const {record,state} of seeds){
    const f=fixture(record,state),count=Object.values(f.state.endings).filter(Boolean).length;failAndRetry(f,()=>f.runtime.finish(record.node.id));assert.ok(f.state.endings[record.node.endingId]);assert.ok(f.state.flags.ROUND_COMPLETED);
    f.runtime.finish(record.node.id);assert.equal(Object.values(f.state.endings).filter(Boolean).length,count+1);
  }
});
test('failed chapter load retains both the old cursor and its usable node map',()=>{
  const f=fixture(byId('CH01_EP02_C002')),next=byId('CH02_EP01_N001'),old=f.state.progress.nodeId,before=structuredClone(f.state),raw=f.values.get('test');
  f.fault.blocked=true;assert.throws(()=>f.runtime.load(episode(next),'CH02'),SaveWriteError);
  assert.deepEqual(f.state,before);assert.equal(f.values.get('test'),raw);assert.equal(f.runtime.current().id,old);
  f.fault.blocked=false;f.runtime.load(episode(next),'CH02');f.runtime.current();assert.equal(f.state.progress.chapterId,'CH02');assert.deepEqual(f.local.load(),f.state);
});
test('a choice and its automatic branch/context are a single durable commit',()=>{
  const state=createInitialState(),writes=[],ep={episodeId:'CHECK',startNode:'A',nodes:[{id:'A',type:'choice',options:[{id:'YES',text:'yes',setFlags:['FACT'],effects:{honesty:2},next:'B'}]},{id:'B',type:'condition',branches:[{flag:'FACT',next:'C'}],fallback:'D'},{id:'C',type:'passage',title:'c',paragraphs:[{text:'c'}],lifeContext:{stage:'student'},next:'D'},{id:'D',type:'episodeEnd'}]};
  let blocked=false;const runtime=new StoryRuntime(state,s=>{if(blocked)return false;writes.push(structuredClone(s));return true});runtime.load(ep);const before=structuredClone(state),count=writes.length;
  blocked=true;assert.throws(()=>runtime.choose('YES','A'),SaveWriteError);assert.deepEqual(state,before);assert.equal(writes.length,count);
  blocked=false;runtime.choose('YES','A');assert.equal(writes.length,count+1);assert.equal(writes.at(-1).progress.nodeId,'C');assert.ok(writes.at(-1).flags.FACT);assert.equal(writes.at(-1).stats.honesty,2);assert.equal(writes.at(-1).life.stage,'student');
});
test('a persistence exception leaves caller-held references and state unchanged',()=>{
  const record=byId('CH01_EP02_C002'),state=createInitialState();state.progress={chapterId:record.chapter,episodeId:record.episode,nodeId:record.node.id,readingOffset:0};
  let blocked=false;const runtime=new StoryRuntime(state,()=>{if(blocked)throw Error('storage unavailable');return true});runtime.load(episode(record));const before=structuredClone(state),flags=state.flags;blocked=true;
  assert.throws(()=>runtime.choose('B',record.node.id),/storage unavailable/);assert.deepEqual(state,before);assert.strictEqual(state.flags,flags);
});
test('current on a saved automatic condition survives repeated write failures and process restarts without replaying effects',()=>{
  const record=byId('CH01_EP03_COND001');
  for(const known of [true,false]){
    const state=createInitialState();state.progress={chapterId:record.chapter,episodeId:record.episode,nodeId:record.node.id,readingOffset:0};
    state.flags.TOLD_PARTNER_XIA=known;state.stats.honesty=17;state.readNodeIds=['CH01_EP02_C002'];
    const values=new Map(),fault={blocked:false},local=new LocalSave({getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(fault.blocked)throw Error('quota');values.set(k,v)},removeItem:k=>values.delete(k)},'test');
    let runtime=new StoryRuntime(state,s=>local.save(s));runtime.load(episode(record),record.chapter);
    const before=structuredClone(state),raw=values.get('test');fault.blocked=true;
    for(let i=0;i<3;i++){assert.throws(()=>runtime.current(),SaveWriteError);assert.deepEqual(state,before);assert.equal(values.get('test'),raw)}
    const restored=local.load();fault.blocked=false;runtime=new StoryRuntime(restored,s=>local.save(s));runtime.load(episode(record),record.chapter);fault.blocked=true;
    assert.throws(()=>runtime.current(),SaveWriteError);assert.equal(restored.progress.nodeId,record.node.id);
    fault.blocked=false;assert.equal(runtime.current().id,known?'CH01_EP03_N006A':'CH01_EP03_N006B');
    assert.equal(restored.stats.honesty,17);assert.deepEqual(restored.flags,before.flags);assert.deepEqual(restored.readNodeIds,before.readNodeIds);
    assert.deepEqual(local.load(),restored);const committed=values.get('test');runtime.current();assert.equal(values.get('test'),committed);
  }
});
test('legacy saves without job or care history retry into common passages without inventing old decisions',()=>{
  for(const [id,target] of [['CH09_EP04_JOB_CHECK','CH09_EP04_JOB_COMMON'],['CH10_EP01_OLD_CHECK','CH10_EP01_COMMON'],['CH10_EP03_REVISE_CHECK','CH10_EP03_COMMON']]){
    const record=byId(id),state=createInitialState();state.progress={chapterId:record.chapter,episodeId:record.episode,nodeId:id,readingOffset:0};
    let blocked=false,raw;const runtime=new StoryRuntime(state,s=>{if(blocked)return false;raw=JSON.stringify(s);return true});runtime.load(episode(record),record.chapter);const before=structuredClone(state),original=raw;
    blocked=true;assert.throws(()=>runtime.current(),SaveWriteError);assert.deepEqual(state,before);assert.equal(raw,original);
    blocked=false;assert.equal(runtime.current().id,target);assert.deepEqual(state.flags,{});assert.deepEqual(state.readNodeIds,[]);assert.deepEqual(JSON.parse(raw),state);
  }
});
test('failed direct writes do not update timestamps; read-denied storage cannot be overwritten',()=>{
  const s=createInitialState();s.updatedAt=123;const save=new LocalSave({getItem:()=>{throw Error('read denied')},setItem:()=>{throw Error('should not write')},removeItem:()=>{}},'test');
  const loaded=save.load();assert.equal(save.save(loaded),false);assert.match(save.warning,/无法读取/);
  const failed=new LocalSave({getItem:()=>null,setItem:()=>{throw Error('quota')},removeItem:()=>{}},'test');assert.equal(failed.save(s),false);assert.equal(s.updatedAt,123);
});
test('v2 saves with a truncated cursor preserve primary and backup instead of silently starting over',()=>{
  for(const progress of [undefined,{},null,{chapterId:'CH08',episodeId:'CH08_EP03',nodeId:''}]){
    const state=createInitialState();state.progress=progress;state.flags.READ_FULL_LETTER=true;const raw=JSON.stringify(state),values=new Map([['test',raw]]);
    const save=new LocalSave({getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},'test');
    assert.throws(()=>normalizeSave(state),/存档位置不完整/);assert.throws(()=>save.load(),/存档位置不完整/);assert.equal(values.get('test'),raw);assert.equal(values.get('test.corrupt'),raw);assert.equal(save.save(createInitialState()),false);
  }
});
test('album entries reference registered real photos with the matching completion flag and art resource',()=>{
  assert.equal(albumPhotos.length,4);assert.equal(new Set(albumPhotos.map(p=>p.node)).size,4);
  for(const photo of albumPhotos){const r=byId(photo.node);assert.ok(r);const ep=episode(r),ref=story.chapters.find(c=>c.chapterId===r.chapter).episodes.find(e=>e.id===ep.episodeId);
    assert.equal(ref.resource,photo.resource);assert.equal(r.node.type,'photo');assert.ok(r.node.setFlags.includes(photo.flag));assert.ok(r.node.resource?.endsWith('/spriteFrame')&&r.node.backText);
    assert.ok(require('fs').existsSync('assets/resources/'+r.node.resource.replace('/spriteFrame','.png')));
  }
});
