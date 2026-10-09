const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {StoryRuntime}=require('../work/core/story/StoryRuntime.js');
const {createInitialState}=require('../work/core/core/GameState.js');
const {LocalSave}=require('../work/core/save/LocalSave.js');
const manifest=JSON.parse(fs.readFileSync('assets/resources/data/story/chapter05/chapter05_manifest.json'));
const episodes=manifest.episodes.map(e=>JSON.parse(fs.readFileSync('assets/resources/'+e.resource+'.json')));
function storage(){const data=new Map();return{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}}
function walk(s,choice){const local=new LocalSave(storage(),'test'),visited=[];for(const ep of episodes){let r=new StoryRuntime(s,x=>local.save(x));r.load(ep,'CH05');let n=r.current();while(n.type!=='episodeEnd'){visited.push(n.id);const loaded=local.load();assert.deepEqual(loaded.progress,s.progress);assert.deepEqual(loaded.flags,s.flags);assert.deepEqual(loaded.stats,s.stats);assert.deepEqual(loaded.life,s.life);assert.deepEqual(loaded.readNodeIds,s.readNodeIds);r=new StoryRuntime(loaded,x=>local.save(x));r.load(ep,'CH05');assert.equal(r.current().id,n.id);s=loaded;n=n.type==='choice'?r.choose(choice,n.id):['passage','phone'].includes(n.type)?r.advance(n.id):r.complete(n.id)}}return{s,visited}}
test('sixteen chapter 05 histories read earlier decisions and job consequences across every-node reload',()=>{
 for(const family of [false,true])for(const discuss of [false,true])for(const ask of [false,true])for(const share of [false,true]){
  const state=createInitialState();state.flags[family?'CH02_TOLD_FAMILY_RELATION':'CH02_HID_FAMILY_RELATION']=true;state.flags[discuss?'CH03_DISCUSS_PLANS':'CH03_ASSUMED_SAME_CITY']=true;state.flags[ask?'CH04_ASKED_SUMMER_PLAN':'CH04_PROMISED_FOR_XIA']=true;state.flags.TOLD_PARTNER_XIA=true;state.life.memoryRecords.DISTANCE={title:'两座城市',status:'fragmentary',evidence:['2010.8街景']};
  const {s,visited}=walk(state,share?'SHARE':'RETURN');
  for(const [yes,no,condition] of [['CH05_EP01_CHECK_FIRST','CH05_EP01_REMEMBER',ask],['CH05_EP02_FAMILY_KNOWN','CH05_EP02_FAMILY_LATE',family],['CH05_EP03_ASK_ROOM','CH05_EP03_SUGGEST_ROOM',discuss],['CH05_EP04_COMPARE','CH05_EP04_RECHECK',ask],['CH05_EP05_SHARE','CH05_EP05_RETURN',share],['CH05_EP06_SEPARATE','CH05_EP06_CORRECT',share]]){assert.ok(visited.includes(condition?yes:no));assert.ok(!visited.includes(condition?no:yes));}
  assert.ok(s.flags[share?'CH05_TALKED_JOB_CONDITIONS':'CH05_ASSUMED_RETURN_FOR_JOB']);assert.ok(!s.flags[share?'CH05_ASSUMED_RETURN_FOR_JOB':'CH05_TALKED_JOB_CONDITIONS']);assert.ok(s.flags.CH05_READ_PRACTICE_COSTS&&s.flags.CH05_READ_JOB_CONDITIONS&&s.flags.CH05_READ_START_DATES);assert.ok(s.flags.TOLD_PARTNER_XIA);assert.equal(s.life.time.year,2013);assert.equal(s.life.time.month,6);assert.equal(s.life.stage,'graduate');assert.equal(s.life.memoryRecords.WORK_PLANS.status,'fragmentary');assert.deepEqual(s.life.memoryRecords.DISTANCE.evidence,['2010.8街景']);assert.deepEqual(s.endings,{});assert.ok(!s.flags.READ_FULL_LETTER&&!s.flags.UNDERSTOOD_BREAKUP_TRUTH&&!s.flags.FOUND_FULL_RECORDING);
 }
});
test('chapter 05 keeps internships separate from graduation, has one small decision and idempotent paper reading',()=>{
 const nodes=episodes.flatMap(e=>e.nodes),choices=nodes.filter(n=>n.type==='choice');assert.equal(choices.length,1);assert.equal(choices[0].id,'CH05_EP05_CHOICE');for(const o of choices[0].options)for(const delta of Object.values(o.effects))assert.ok(Math.abs(delta)<=2);
 for(const [index,ep] of episodes.entries())for(const n of ep.nodes){if(n.lifeContext){assert.ok(n.lifeContext.time.year>=2011&&n.lifeContext.time.year<=2013);if(index<5)assert.equal(n.lifeContext.stage,'student');}assert.ok(!n.setFlags?.some(f=>['READ_FULL_LETTER','FOUND_FULL_RECORDING','UNDERSTOOD_BREAKUP_TRUTH'].includes(f)));}
 const s=createInitialState(),r=new StoryRuntime(s,()=>true);s.progress={chapterId:'CH05',episodeId:'CH05_EP04',nodeId:'CH05_EP04_JOB_NOTE',readingOffset:0};r.load(episodes[3],'CH05');r.complete('CH05_EP04_JOB_NOTE');const first=structuredClone(s);s.progress.nodeId='CH05_EP04_JOB_NOTE';r.complete('CH05_EP04_JOB_NOTE');assert.deepEqual(s.stats,first.stats);assert.deepEqual(s.life.memoryRecords,first.life.memoryRecords);assert.deepEqual(s.readNodeIds,first.readNodeIds);
});
test('old chapter 04 boundary save advances into chapter 05 only after valid resource load',()=>{
 const s=createInitialState(),local=new LocalSave(storage(),'test');s.progress={chapterId:'CH04',episodeId:'CH04_EP06',nodeId:'CH04_EP06_END',readingOffset:0};s.flags.CH04_PROMISED_FOR_XIA=true;s.flags.CH03_ASSUMED_SAME_CITY=true;s.flags.CH02_HID_FAMILY_RELATION=true;s.stats.honesty=9;s.life.memoryRecords.DISTANCE={title:'两座城市',status:'fragmentary',evidence:['旧课表']};local.save(s);
 const restored=local.load(),r=new StoryRuntime(restored,x=>local.save(x)),before=structuredClone(restored);assert.throws(()=>r.load({...episodes[0],startNode:'MISSING'},'CH05'),/Missing start/);assert.deepEqual(restored,before);assert.deepEqual(local.load().progress,before.progress);r.load(episodes[0],'CH05');assert.equal(r.current().id,'CH05_EP01_N001');assert.equal(restored.stats.honesty,9);assert.ok(restored.flags.CH04_PROMISED_FOR_XIA);assert.deepEqual(restored.life.memoryRecords.DISTANCE.evidence,['旧课表']);assert.equal(local.load().progress.chapterId,'CH05');
});

test('missing old decision flags follow neutral passages rather than inventing past promises or family disclosures',()=>{
 const {s,visited}=walk(createInitialState(),'SHARE');
 for(const id of ['CH05_EP01_CHECK_FIRST','CH05_EP01_REMEMBER','CH05_EP02_FAMILY_KNOWN','CH05_EP02_FAMILY_LATE','CH05_EP03_ASK_ROOM','CH05_EP03_SUGGEST_ROOM','CH05_EP04_COMPARE','CH05_EP04_RECHECK'])assert.ok(!visited.includes(id));
 for(const flag of ['CH02_TOLD_FAMILY_RELATION','CH02_HID_FAMILY_RELATION','CH03_DISCUSS_PLANS','CH03_ASSUMED_SAME_CITY','CH04_ASKED_SUMMER_PLAN','CH04_PROMISED_FOR_XIA'])assert.ok(!s.flags[flag]);
 assert.ok(visited.includes('CH05_EP05_SHARE')&&visited.includes('CH05_EP06_SEPARATE'));assert.equal(s.life.time.year,2013);
 const noJob=createInitialState();noJob.progress={chapterId:'CH05',episodeId:'CH05_EP06',nodeId:'CH05_EP06_JOB_CHECK',readingOffset:0};const r=new StoryRuntime(noJob,()=>true);r.load(episodes[5],'CH05');assert.equal(r.current().id,'CH05_EP06_PACK');assert.ok(!noJob.flags.CH05_TALKED_JOB_CONDITIONS&&!noJob.flags.CH05_ASSUMED_RETURN_FOR_JOB);
});
