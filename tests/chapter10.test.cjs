const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const{StoryRuntime}=require('../work/core/story/StoryRuntime.js'),{createInitialState}=require('../work/core/core/GameState.js'),{LocalSave}=require('../work/core/save/LocalSave.js');
const{ENDING_IDS,resolveEnding,recordEnding,createNextRound,endingCount}=require('../work/core/story/EndingResolver.js');
const catalog=JSON.parse(fs.readFileSync('assets/resources/data/story/catalog.json'));
const chapters=catalog.chapters.map(c=>JSON.parse(fs.readFileSync('assets/resources/'+c.resource+'.json')));
function play(s,options={},evidence='FULL') {
 const visited=[];let ending;
 for(const m of chapters)for(const ref of m.episodes){const ep=JSON.parse(fs.readFileSync('assets/resources/'+ref.resource+'.json')),r=new StoryRuntime(s,()=>{});r.load(ep,m.chapterId);
  for(let guard=0;guard<70;guard++){
   const n=r.current();visited.push(n.id);if(n.type==='episodeEnd')break;
   if(n.type==='ending'){ending=n.endingId;assert.ok(!s.flags.ROUND_COMPLETED);r.finish(n.id);r.finish(n.id);break;}
   if(n.type==='choice')r.choose(options[n.id]??n.options[0].id,n.id);
   else if(n.type==='investigation'){const chosen=n.items.find(i=>!s.flags[i.viewedFlag]&&(!n.optional||evidence==='FULL'||i.id===evidence));if(chosen)r.inspect(chosen.id,n.id);else r.complete(n.id);}
   else if(['passage','phone','dialogue','narration'].includes(n.type))r.advance(n.id);
   else {if(n.requireReadToEnd)s.progress.readingOffset=1;r.complete(n.id)}
  }
 }
 assert.ok(ending);return {s,visited,ending};
}
const honest={'CH01_EP02_C002':'B','CH02_EP06_CHOICE':'TELL','CH03_EP04_CHOICE':'DISCUSS','CH04_EP04_CHOICE':'ASK','CH05_EP05_CHOICE':'SHARE','CH07_EP04_CHOICE':'TOGETHER','CH09_EP01_CONTACT_CHOICE':'SEND','CH09_EP02_DISCLOSE_CHOICE':'TELL','CH09_EP04_MEETING_CHOICE':'MEET'};
test('all five initial endings are reached through actual story actions; no score can replace source evidence',()=>{
 const paths=[['REUNION',honest,'FULL'],['GOODBYE',{...honest,CH09_EP04_MEETING_CHOICE:'DECLINE'},'FULL'],['UNDERSTAND',{...honest,CH09_EP01_CONTACT_CHOICE:'NONE'},'FULL'],['TOGETHER',{...honest,CH09_EP01_CONTACT_CHOICE:'NONE'},'NONE'],['IF_THEN',{...honest,CH07_EP04_CHOICE:'PAUSE',CH09_EP01_CONTACT_CHOICE:'NONE'},'NONE']];
 for(const[id,options,evidence]of paths){const out=play(createInitialState(),options,evidence);assert.equal(out.ending,id);assert.equal(endingCount(out.s),1);assert.ok(out.s.flags.CH10_READ_OWN_LETTER);const high=structuredClone(out.s);for(const key of Object.keys(high.stats))high.stats[key]=100;if(evidence==='NONE'){assert.ok(!high.flags.UNDERSTOOD_BREAKUP_TRUTH);assert.notEqual(resolveEnding(high),'UNDERSTAND');assert.notEqual(resolveEnding(high),'UNSENT');}}
});
test('three distinct completed rounds and current reconstructed sources unlock the hidden ending; new round resets only current facts',()=>{
 let s=createInitialState();
 for(const[options,evidence]of [[honest,'FULL'],[{...honest,CH09_EP04_MEETING_CHOICE:'DECLINE'},'FULL'],[{...honest,CH09_EP01_CONTACT_CHOICE:'NONE'},'FULL']]){
  const out=play(s,options,evidence),count=endingCount(s),next=createNextRound(s);assert.deepEqual(next.endings,s.endings);assert.equal(next.playCount,s.playCount+1);assert.deepEqual(next.flags,{});assert.deepEqual(next.readNodeIds,[]);assert.deepEqual(next.life.memoryRecords,{});assert.ok(Object.values(next.stats).every(n=>n===0));assert.equal(endingCount(next),count);s=next;
 }
 assert.equal(endingCount(s),3);assert.equal(s.playCount,4);const out=play(s,honest,'FULL');assert.equal(out.ending,'UNSENT');assert.equal(endingCount(s),4);
 for(const missing of ['READ_FULL_LETTER','FOUND_FULL_RECORDING','CH08_COMPARED_DATES','CH08_HEARD_CHEN_CONTEXT','UNDERSTOOD_BREAKUP_TRUTH','CH09_CHECKED_FIRST_PAGE','MET_XIA','CH10_READ_OWN_LETTER']){const copy=structuredClone(s);copy.flags[missing]=false;assert.notEqual(resolveEnding(copy),'UNSENT');}
 for(const id of ['FIRST_MEETING','GRADUATION','BREAKUP']){const copy=structuredClone(s);copy.life.memoryRecords[id].status='fragmentary';assert.notEqual(resolveEnding(copy),'UNSENT');}
});
test('ending is earned at completion, repeated completion is idempotent, unfinished restarts retain meta without counting a round',()=>{
 const s=createInitialState();assert.throws(()=>createNextRound(s),/not finished/);const id=resolveEnding(s);assert.deepEqual(s.endings,{});recordEnding(s,id);recordEnding(s,id);assert.equal(endingCount(s),1);assert.throws(()=>recordEnding(s,'REUNION'),/already completed/);const n=createNextRound(s);const restarted=createNextRound(n,false);assert.equal(restarted.playCount,n.playCount);assert.deepEqual(restarted.endings,n.endings);
});
test('completed round and meta survive v2 normalization; failed writes preserve the stored round',()=>{
 const records=new Map();let fail=false;const save=new LocalSave({getItem:k=>records.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('full');records.set(k,v)},removeItem:k=>records.delete(k)},'s');
 const s=play(createInitialState(),honest).s;assert.ok(save.save(s));const raw=records.get('s'),loaded=save.load();assert.deepEqual(loaded.endings,s.endings);assert.ok(loaded.flags.ROUND_COMPLETED);fail=true;assert.equal(save.save(createNextRound(loaded)),false);assert.equal(records.get('s'),raw);fail=false;assert.ok(save.save(createNextRound(loaded)));assert.equal(save.load().playCount,2);assert.ok(save.load().endings.REUNION);assert.deepEqual(save.load().flags,{});
});
test('ending ties use stable configured order and incomplete old history stays unknown',()=>{
 const s=createInitialState(),m=chapters.at(-1);for(const ref of m.episodes){const ep=JSON.parse(fs.readFileSync('assets/resources/'+ref.resource+'.json')),r=new StoryRuntime(s,()=>{});r.load(ep,'CH10');for(let i=0;i<60;i++){const n=r.current();if(n.type==='episodeEnd')break;if(n.type==='ending'){assert.equal(n.endingId,'IF_THEN');break;}if(n.type==='letter'){s.progress.readingOffset=1;r.complete(n.id)}else r.advance(n.id)}}
 for(const flag of ['READ_FULL_LETTER','FOUND_FULL_RECORDING','CH07_PLANNED_CARE_TOGETHER','CH05_TALKED_JOB_CONDITIONS','MET_XIA','TOLD_PARTNER_BEFORE_CONTACT'])assert.ok(!s.flags[flag]);
 const tied=createInitialState();for(const f of ['READ_FULL_LETTER','FOUND_FULL_RECORDING','CH08_COMPARED_DATES','CH08_HEARD_CHEN_CONTEXT','UNDERSTOOD_BREAKUP_TRUTH','CH10_SORTED_OWN_PAPERS','CH07_PLANNED_CARE_TOGETHER','CH10_SHARED_WEEK','CH10_READY_CURRENT_LIFE'])tied.flags[f]=true;tied.stats.selfReflection=10;tied.stats.understandingPartner=20/3;
 for(let i=0;i<20;i++)assert.equal(resolveEnding(tied),'UNDERSTAND');
 assert.equal(ENDING_IDS.length,6);
});
