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
test('entire playable catalog includes both chapter 02 episodes',()=>{
  const r=validateStoryTree();assert.ok(r.chapters>=2);assert.ok(r.episodes>=6);assert.ok(r.nodes>=44);
});
test('validator rejects an episode file omitted from its manifest',()=>{
  fixture(root=>edit(root,'data/story/chapter02/chapter02_manifest.json',m=>m.episodes.pop()),root=>assert.throws(()=>validateStoryTree(root),/Unregistered story file: ep02_old_gym/));
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
test('every chapter 01 route also reaches the registered old gym and the current chapter 02 boundary',()=>{
  const catalog=JSON.parse(fs.readFileSync(path.join(resources,'data/story/catalog.json')));
  const chapters=new Map(catalog.chapters.map(ref=>{const m=JSON.parse(fs.readFileSync(path.join(resources,ref.resource+'.json')));return[m.chapterId,m]}));
  const episodes=new Map([...chapters.values()].flatMap(m=>m.episodes.map(ref=>[ref.id,{chapterId:m.chapterId,ep:JSON.parse(fs.readFileSync(path.join(resources,ref.resource+'.json')))}])));
  const queue=[{state:createInitialState(),episodeId:chapters.get(catalog.startChapter).episodes[0].id,steps:0}];let endings=0;
  while(queue.length){
    const item=queue.pop();assert.ok(item.steps<300);const state=structuredClone(item.state),entry=episodes.get(item.episodeId);
    const runtime=new StoryRuntime(state,()=>{});runtime.load(entry.ep,entry.chapterId);const node=runtime.current();
    const enqueue=act=>{const copy=structuredClone(state),r=new StoryRuntime(copy,()=>{});r.load(entry.ep,entry.chapterId);act(r);queue.push({state:copy,episodeId:item.episodeId,steps:item.steps+1})};
    if(node.type==='episodeEnd'){
      if(node.next===catalog.pendingChapter){endings++;assert.equal(state.progress.chapterId,'CH02');assert.equal(state.progress.episodeId,'CH02_EP02');assert.ok(state.readNodeIds.includes('CH02_EP02_GYM'));assert.ok(state.life.memoryRecords.FIRST_MEETING.evidence.includes('旧体育馆午休'));}
      else {const next=episodes.has(node.next)?node.next:chapters.get(node.next).episodes[0].id;queue.push({state,episodeId:next,steps:item.steps+1});}
    }else if(node.type==='choice')node.options.forEach(o=>enqueue(r=>r.choose(o.id,node.id)));
    else if(node.type==='investigation'){node.items.filter(i=>!state.flags[i.viewedFlag]).forEach(i=>enqueue(r=>r.inspect(i.id,node.id)));if(node.requiredFlags.every(f=>state.flags[f]))enqueue(r=>r.complete(node.id));}
    else if(['dialogue','narration','passage','phone'].includes(node.type))enqueue(r=>r.advance(node.id));
    else enqueue(r=>r.complete(node.id));
  }
  assert.equal(endings,636);console.log('Full implemented game routes: '+endings);
});
