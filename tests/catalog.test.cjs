const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {validateStoryTree} = require('../tools/check-story.cjs');
const {StoryRuntime} = require('../work/core/story/StoryRuntime.js');
const {createInitialState} = require('../work/core/core/GameState.js');
const resources = path.resolve(__dirname,'../assets/resources');
function fixture(change, check) {
  const work=path.resolve(__dirname,'../work');fs.mkdirSync(work,{recursive:true});
  const root=fs.mkdtempSync(path.join(work,'story-fixture-'));
  try { fs.cpSync(path.join(resources,'data'),path.join(root,'data'),{recursive:true});change(root);check(root); }
  finally { if (!root.startsWith(work+path.sep)) throw Error('Invalid fixture cleanup path');fs.rmSync(root,{recursive:true,force:true}); }
}
function edit(root,file,change){const name=path.join(root,file);const json=JSON.parse(fs.readFileSync(name));change(json);fs.writeFileSync(name,JSON.stringify(json));}
test('entire playable catalog includes nine implemented chapters',()=>{
  const r=validateStoryTree();assert.ok(r.chapters>=9);assert.ok(r.episodes>=54);assert.ok(r.nodes>=407);
});
test('empty required evidence is valid only on an explicitly optional desk',()=>{
  fixture(root=>edit(root,'data/story/chapter08/ep03_folded_pages.json',e=>delete e.nodes.find(n=>n.type==='investigation').optional),root=>assert.throws(()=>validateStoryTree(root),/Incomplete investigation/));
});
test('a required full recording must retain a readable full transcript',()=>{
  fixture(root=>edit(root,'data/story/chapter08/ep03_folded_pages.json',e=>delete e.nodes.find(n=>n.type==='audioInteraction').transcript),root=>assert.throws(()=>validateStoryTree(root),/readable fallback/));
});
test('validator rejects an episode file omitted from its manifest',()=>{
  fixture(root=>edit(root,'data/story/chapter02/chapter02_manifest.json',m=>m.episodes=m.episodes.filter(e=>e.id!=='CH02_EP02')),root=>assert.throws(()=>validateStoryTree(root),/Unregistered story file: ep02_old_gym/));
});
test('validator rejects the registered old gym being skipped at the episode boundary',()=>{
  fixture(root=>edit(root,'data/story/chapter02/ep01_next_day.json',e=>e.nodes.find(n=>n.id==='CH02_EP01_END').next='CH03'),root=>assert.throws(()=>validateStoryTree(root),/Unreachable episodes: CH02_EP02/));
});
test('validator checks broken chapter 02 node targets, not just chapter 01',()=>{
  fixture(root=>edit(root,'data/story/chapter02/ep02_old_gym.json',e=>e.nodes[0].next='MISSING_TARGET'),root=>assert.throws(()=>validateStoryTree(root),/Missing target/));
});
test('chapter transition persists a consistent cursor and preserves it if the next asset is invalid',()=>{
  const s=createInitialState(),writes=[];const runtime=new StoryRuntime(s,state=>writes.push(structuredClone(state.progress)));
  const first=JSON.parse(fs.readFileSync(path.join(resources,'data/story/chapter02/ep01_next_day.json')));
  const second=JSON.parse(fs.readFileSync(path.join(resources,'data/story/chapter02/ep02_old_gym.json')));
  runtime.load(first,'CH02');assert.deepEqual(writes.at(-1),{chapterId:'CH02',episodeId:'CH02_EP01',nodeId:'CH02_EP01_N001',readingOffset:0});
  const before=structuredClone(s.progress),count=writes.length;
  assert.throws(()=>runtime.load({...second,startNode:'MISSING'},'CH03'),/Missing start/);
  assert.deepEqual(s.progress,before);assert.equal(writes.length,count);
  runtime.load(second,'CH02');assert.equal(s.progress.episodeId,'CH02_EP02');assert.equal(runtime.current().id,'CH02_EP02_N001');
});
test('every route reaches the current boundary and keeps chapter 02 to 09 decision consequences',()=>{
  const catalog=JSON.parse(fs.readFileSync(path.join(resources,'data/story/catalog.json')));
  const chapters=new Map(catalog.chapters.map(ref=>{const m=JSON.parse(fs.readFileSync(path.join(resources,ref.resource+'.json')));return[m.chapterId,m]}));
  const episodes=new Map([...chapters.values()].flatMap(m=>m.episodes.map(ref=>[ref.id,{chapterId:m.chapterId,ep:JSON.parse(fs.readFileSync(path.join(resources,ref.resource+'.json')))}])));
  const queue=[{state:createInitialState(),episodeId:chapters.get(catalog.startChapter).episodes[0].id,steps:0}];let endings=0;
  while(queue.length){
    const item=queue.pop();assert.ok(item.steps<1000);const state=item.state,entry=episodes.get(item.episodeId);
    const runtime=new StoryRuntime(state,()=>{});runtime.load(entry.ep,entry.chapterId);const node=runtime.current();
    // Queue states are owned by one path. Fork only when branching; linear
    // passages retain the same state so adding long chapters stays practical.
    const enqueue=(act,fork=true)=>{const copy=fork?structuredClone(state):state,r=fork?new StoryRuntime(copy,()=>{}):runtime;if(fork)r.load(entry.ep,entry.chapterId);act(r);queue.push({state:copy,episodeId:item.episodeId,steps:item.steps+1})};
    if(node.type==='episodeEnd'){
      if(node.id==='CH08_EP06_END'){
        assert.ok(state.readNodeIds.includes('CH02_EP02_GYM'));assert.ok(state.life.memoryRecords.FIRST_MEETING.evidence.includes('旧体育馆午休'));assert.ok(state.readNodeIds.includes('CH02_EP05_MESSAGES'));assert.equal(state.life.memoryRecords.HOME_SUMMER.status,'fragmentary');
        const told=!!state.flags.CH02_TOLD_FAMILY_RELATION;assert.notEqual(told,!!state.flags.CH02_HID_FAMILY_RELATION);assert.ok(state.readNodeIds.includes(told?'CH02_EP06_HOME_TOLD':'CH02_EP06_HOME_HIDDEN'));assert.ok(!state.readNodeIds.includes(told?'CH02_EP06_HOME_HIDDEN':'CH02_EP06_HOME_TOLD'));
        for(const [a,b] of [['CH03_EP02_KNOWN','CH03_EP02_FIRST_NAME'],['CH03_EP04_FAMILY_KNOWN','CH03_EP04_FAMILY_LATE'],['CH03_EP06_FAMILY_KNOWN','CH03_EP06_FAMILY_LATE']]){assert.ok(state.readNodeIds.includes(told?a:b));assert.ok(!state.readNodeIds.includes(told?b:a));}
        const discuss=!!state.flags.CH03_DISCUSS_PLANS;assert.notEqual(discuss,!!state.flags.CH03_ASSUMED_SAME_CITY);assert.ok(state.readNodeIds.includes(discuss?'CH03_EP06_DISCUSS':'CH03_EP06_ASSUME'));assert.ok(!state.readNodeIds.includes(discuss?'CH03_EP06_ASSUME':'CH03_EP06_DISCUSS'));
        assert.ok(state.flags.CH03_SEEN_GRADUATION_PHOTO&&state.flags.CH03_SEEN_FUTURE_ENVELOPE);assert.equal(state.life.memoryRecords.GRADUATION.status,state.flags.UNDERSTOOD_BREAKUP_TRUTH?'complete':'fragmentary');
        const ask=!!state.flags.CH04_ASKED_SUMMER_PLAN;assert.notEqual(ask,!!state.flags.CH04_PROMISED_FOR_XIA);
        for(const [yes,no,condition] of [['CH04_EP01_ASK','CH04_EP01_SET',discuss],['CH04_EP02_COMPARE','CH04_EP02_REARRANGE',discuss],['CH04_EP03_KNOWN','CH04_EP03_LATE',told],['CH04_EP05_AGREED','CH04_EP05_CORRECTED',ask],['CH04_EP06_LISTEN','CH04_EP06_FIX',discuss],['CH04_EP06_ASK_AGAIN','CH04_EP06_PROMISE_AGAIN',ask]]){assert.ok(state.readNodeIds.includes(condition?yes:no));assert.ok(!state.readNodeIds.includes(condition?no:yes));}
        assert.ok(state.flags.CH04_READ_TIMETABLES&&state.flags.CH04_SEEN_STREET_PHOTO);assert.equal(state.life.time.year,2037);assert.equal(state.life.time.month,9);assert.equal(state.life.stage,'middleAge');assert.equal(state.life.memoryRecords.DISTANCE.status,'fragmentary');assert.equal(state.life.relationships.XIA,'已经分开');const share=!!state.flags.CH05_TALKED_JOB_CONDITIONS;assert.notEqual(share,!!state.flags.CH05_ASSUMED_RETURN_FOR_JOB);
        for(const [yes,no,condition] of [['CH05_EP01_CHECK_FIRST','CH05_EP01_REMEMBER',ask],['CH05_EP02_FAMILY_KNOWN','CH05_EP02_FAMILY_LATE',told],['CH05_EP03_ASK_ROOM','CH05_EP03_SUGGEST_ROOM',discuss],['CH05_EP04_COMPARE','CH05_EP04_RECHECK',ask],['CH05_EP05_SHARE','CH05_EP05_RETURN',share],['CH05_EP06_SEPARATE','CH05_EP06_CORRECT',share]]){assert.ok(state.readNodeIds.includes(condition?yes:no));assert.ok(!state.readNodeIds.includes(condition?no:yes));}
        assert.ok(state.flags.CH05_READ_PRACTICE_COSTS&&state.flags.CH05_READ_JOB_CONDITIONS&&state.flags.CH05_READ_START_DATES);assert.equal(state.life.memoryRecords.WORK_PLANS.status,'fragmentary');for(const [yes,no,condition] of [['CH06_EP01_SHARE','CH06_EP01_CORRECT',share],['CH06_EP02_EARLY','CH06_EP02_LATE',told],['CH06_EP03_ASKED','CH06_EP03_REVISED',ask],['CH06_EP03_LISTEN','CH06_EP03_RECONSIDER',discuss],['CH06_EP04_SEPARATE','CH06_EP04_CORRECTED',share]]){assert.ok(state.readNodeIds.includes(condition?yes:no));assert.ok(!state.readNodeIds.includes(condition?no:yes));}
        assert.ok(state.flags.CH06_READ_WORK_NOTE&&state.flags.CH06_READ_VISIT_DATES&&state.flags.CH06_READ_STATION_NOTE&&state.flags.CH06_PARTED_2013);assert.equal(state.life.memoryRecords.WORK_START.status,'fragmentary');assert.equal(state.life.memoryRecords.BREAKUP.status,state.flags.UNDERSTOOD_BREAKUP_TRUTH?'complete':'fragmentary');assert.deepEqual(state.endings,{});assert.equal(!!state.flags.UNDERSTOOD_BREAKUP_TRUTH,!!(state.flags.READ_FULL_LETTER&&state.flags.FOUND_FULL_RECORDING&&state.flags.CH08_COMPARED_DATES&&state.flags.CH08_HEARD_CHEN_CONTEXT));
        assert.ok(state.readNodeIds.includes('CH07_EP01_AFTER_STATION'));for(const [yes,no,condition]of [['CH07_EP01_EARLY','CH07_EP01_LATE',told],['CH07_EP01_LIST','CH07_EP01_RECHECK',share],['CH07_EP03_ASK','CH07_EP03_STOP',discuss],['CH07_EP04_CONFIRM','CH07_EP04_REVISE',ask],['CH07_EP04_TOGETHER','CH07_EP04_PAUSE',!!state.flags.CH07_PLANNED_CARE_TOGETHER],['CH07_EP06_SHARED','CH07_EP06_CHANGED',!!state.flags.CH07_PLANNED_CARE_TOGETHER],['CH07_EP07_DIVIDE','CH07_EP07_REVISE',!!state.flags.CH07_PLANNED_CARE_TOGETHER]]){assert.ok(state.readNodeIds.includes(condition?yes:no));assert.ok(!state.readNodeIds.includes(condition?no:yes));}assert.ok(state.flags.CH07_MARRIED_2020&&state.flags.CH07_ZHOUMAN_BORN_2021&&state.flags.CH07_SEEN_FAMILY_PHOTO);assert.equal(state.life.time.timeline,'present');assert.equal(state.life.relationships.ANRAN,'一起过日子');assert.equal(state.life.relationships.ZHOUMAN,'高中生活');
      }
      if(node.next===catalog.pendingChapter){endings++;const send=!!state.flags.CH09_INTENDS_CONTACT,met=send&&!!state.flags.CH09_ACCEPTED_MEETING;assert.equal(!!state.flags.CONTACTED_XIA,send);assert.equal(!!state.flags.MET_XIA,met);assert.equal(!!state.flags.PARTNER_AWARE_MEETING,met);assert.equal(!!state.flags.CH09_DECLINED_MEETING,send&&!met);assert.equal(state.life.memoryRecords.FIRST_MEETING.status,met?'complete':'fragmentary');assert.deepEqual(state.endings,{});assert.equal(state.progress.chapterId,'CH09');}
      else {const next=episodes.has(node.next)?node.next:chapters.get(node.next).episodes[0].id;queue.push({state,episodeId:next,steps:item.steps+1});}
    }else if(node.type==='choice')node.options.forEach(o=>enqueue(r=>r.choose(o.id,node.id)));
    else if(node.type==='investigation'){node.items.filter(i=>!state.flags[i.viewedFlag]).forEach(i=>enqueue(r=>r.inspect(i.id,node.id)));if(node.requiredFlags.every(f=>state.flags[f]))enqueue(r=>r.complete(node.id));}
    else if(['dialogue','narration','passage','phone'].includes(node.type))enqueue(r=>r.advance(node.id),false);
    else enqueue(r=>{if(node.requireReadToEnd)r.state.progress.readingOffset=1;r.complete(node.id)},false);
  }
  assert.equal(endings,508800);console.log('Full implemented game routes: '+endings);
});
