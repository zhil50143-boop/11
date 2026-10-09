// Executes production StoryRuntime + LocalSave. This is not a browser or a
// weighted route count: each reported round actually walks the registered graph.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {StoryRuntime,SaveWriteError}=require('../work/core/story/StoryRuntime.js');
const {LocalSave}=require('../work/core/save/LocalSave.js');
const {createInitialState}=require('../work/core/core/GameState.js');
const {createNextRound,ENDING_IDS,hasCoreEvidence}=require('../work/core/story/EndingResolver.js');
const {loadStory,baseChoices}=require('./story-analysis-lib.cjs');
const [out,countArg='10000']=process.argv.slice(2),count=Number(countArg);
if(!out||!Number.isInteger(count)||count<4||count%4)throw Error('Usage: output-directory rounds-multiple-of-four');
fs.mkdirSync(out,{recursive:true});const started=new Date(),story=loadStory();
const episodes=new Map(story.chapters.flatMap(c=>c.episodes.map(e=>[e.id,{...e,chapter:c.chapterId}]))),chapters=new Map(story.chapters.map(c=>[c.chapterId,c]));
const decisions=story.records.filter(r=>r.node.type==='choice').map(r=>r.node),evidenceModes=['FULL','NONE','LETTER','RECORDING'];
const coverage={nodes:{},episodes:{},choices:{},endings:{},faults:{},evidenceModes:{},roundsByNumber:{}},counts={rounds:0,actions:0,writes:0,restarts:0,rejectedWrites:0,readGates:0,newRounds:0};
const hash=s=>crypto.createHash('sha256').update(s).digest('hex'),routeDigest=crypto.createHash('sha256');
const rows=fs.openSync(path.join(out,'rounds.jsonl'),'w');let currentCase;
function plan(i){
 let n=i%3072;const choices={};for(const d of decisions){choices[d.id]=d.options[n%d.options.length].id;n=Math.floor(n/d.options.length)}let evidence=evidenceModes[n%4];
 // Every sixteenth campaign deliberately obtains three distinct endings and
 // then reads the hidden route. Other campaigns enumerate ordinary histories.
 if(Math.floor(i/4)%16===0){Object.assign(choices,baseChoices);const round=i%4;if(round===1)choices.CH09_EP04_MEETING_CHOICE='DECLINE';if(round===2)choices.CH09_EP01_CONTACT_CHOICE='NONE';evidence='FULL'}
 if(Math.floor(i/4)%16===1){Object.assign(choices,baseChoices);choices.CH09_EP01_CONTACT_CHOICE='NONE';choices.CH07_EP04_CHOICE=i%2?'PAUSE':'TOGETHER';evidence='NONE'}
 return{choices,evidence};
}
function increment(map,key){map[key]=(map[key]||0)+1}
try{
 for(let campaign=0;campaign<count/4;campaign++){
  let state=createInitialState();const values=new Map(),fault={blocked:false},local=new LocalSave({getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(fault.blocked){counts.rejectedWrites++;throw Error('Injected quota failure')}values.set(k,v);counts.writes++},removeItem:k=>values.delete(k)},'stress');
  for(let round=0;round<4;round++){
   const index=campaign*4+round,p=plan(index),faultKind=['passage','choice','investigation','photo','letter','audioInteraction','load','finish'][index%8];
   let runtime=new StoryRuntime(state,s=>local.save(s)),faultDone=false,seenTarget=0,actionCount=0,restarts=0,ending='',readGate=false,active,visited=[];
   const targetOccurrence=faultKind==='load'?index%60:faultKind==='passage'?index%80:faultKind==='choice'?index%5:0;
   currentCase={index:index+1,campaign:campaign+1,round:round+1,...p,faultKind,targetOccurrence};
   function execute(kind,id,action){
    const arm=!faultDone&&((kind===faultKind&&seenTarget++===targetOccurrence)||kind==='finish');
    if(arm){
     const before=JSON.stringify(state),raw=values.get('stress');fault.blocked=true;
     for(let repeat=0;repeat<2;repeat++){
      assert.throws(action,SaveWriteError,kind+'/'+id);assert.equal(JSON.stringify(state),before,'Failed write must retain committed state');assert.equal(values.get('stress'),raw,'Failed write must retain exact durable bytes');
     }
     fault.blocked=false;faultDone=true;increment(coverage.faults,kind);
    }
    const result=action();counts.actions++;actionCount++;return result;
   }
   function load(id){active=episodes.get(id);assert.ok(active,'Registered episode '+id);execute('load',id,()=>runtime.load(active.data,active.chapter));increment(coverage.episodes,id)}
   load(story.chapters[0].episodes[0].id);
   for(let guard=0;guard<700;guard++){
    const node=execute('current',state.progress.nodeId,()=>runtime.current());visited.push(node.id);increment(coverage.nodes,node.id);
    if(node.type==='episodeEnd'){
     const next=episodes.has(node.next)?node.next:chapters.get(node.next)?.episodes[0].id;assert.ok(next,'Reachable next episode/chapter '+node.next);load(next);continue;
    }
    if(node.type==='ending'){
     execute('finish',node.id,()=>runtime.finish(node.id));ending=node.endingId;
     const raw=values.get('stress');assert.ok(state.flags.ROUND_COMPLETED&&state.endings[ending]);assert.deepEqual(local.load(),state,'Complete ending must reload exactly');
     execute('finish',node.id,()=>runtime.finish(node.id));assert.deepEqual(local.load(),state,'Finishing twice may not change ending history');
     assert.equal(state.playCount,round+1);assert.equal(new Set(state.readNodeIds).size,state.readNodeIds.length);
     for(const value of Object.values(state.stats))assert.ok(Number.isFinite(value)&&value>=0&&value<=100);
     if(ending==='UNSENT'){assert.ok(Object.values(state.endings).filter(Boolean).length>=4);assert.ok(hasCoreEvidence(state));assert.ok(state.flags.MET_XIA)}
     increment(coverage.endings,ending);increment(coverage.roundsByNumber,round+1);assert.ok(raw);break;
    }
    if(node.type==='choice'){
     const option=p.choices[node.id];increment(coverage.choices,node.id+'/'+option);execute('choice',node.id,()=>runtime.choose(option,node.id));
    }else if(node.type==='investigation'){
     const items=node.items.filter(item=>!state.flags[item.viewedFlag]&&(!node.optional||p.evidence==='FULL'||item.id===p.evidence));
     const item=items[(index+guard)%items.length];
     if(item)execute('investigation',node.id,()=>runtime.inspect(item.id,node.id));else execute('investigation',node.id,()=>runtime.complete(node.id));
    }else if(['passage','phone','dialogue','narration'].includes(node.type)){
     execute(node.type==='phone'?'phone':'passage',node.id,()=>runtime.advance(node.id));
    }else{
     if(node.requireReadToEnd){
      if(!readGate){const before=JSON.stringify(state),raw=values.get('stress');assert.throws(()=>runtime.complete(node.id),/末尾/);assert.equal(JSON.stringify(state),before);assert.equal(values.get('stress'),raw);readGate=true;counts.readGates++}
      // Model a completed scroll; actual touch/read gates are covered by H5 tests.
      state.progress.readingOffset=1;assert.equal(local.save(state),true);
     }
     execute(node.type,node.id,()=>runtime.complete(node.id));
    }
    if(guard%77===index%77){
     const saved=local.load();assert.deepEqual(saved,state,'Mid-round durable snapshot');state=saved;runtime=new StoryRuntime(state,s=>local.save(s));runtime.load(active.data,active.chapter);runtime.current();restarts++;counts.restarts++;
    }
   }
   assert.ok(ending,'Round must reach an ending');assert.ok(faultDone,'Each round executes a real rejected write');assert.ok(readGate);
   assert.equal(new Set(visited.map(id=>story.records.find(r=>r.node.id===id).chapter)).size,10);
   increment(coverage.evidenceModes,p.evidence);counts.rounds++;
   const routeHash=hash(visited.join('\n')),row={...currentCase,actions:actionCount,visited:visited.length,restarts,ending,routeHash,saveHash:hash(values.get('stress')),faultRecovered:true};
   const line=JSON.stringify(row)+'\n';fs.writeSync(rows,line);routeDigest.update(line);
   if(round<3){
    const previous=state,next=createNextRound(previous);assert.deepEqual(next.endings,previous.endings);assert.deepEqual(next.metaFlags,previous.metaFlags);assert.equal(next.playCount,previous.playCount+1);assert.deepEqual(next.flags,{});assert.deepEqual(next.readNodeIds,[]);assert.deepEqual(next.life.memoryRecords,{});
    assert.equal(local.save(next),true);state=local.load();assert.deepEqual(state,next);counts.newRounds++;
   }
   if(counts.rounds%250===0)console.log(JSON.stringify({rounds:counts.rounds,total:count,elapsedSeconds:Math.round((Date.now()-started.getTime())/1000),faults:counts.rejectedWrites,endings:coverage.endings}));
  }
 }
 assert.equal(counts.rounds,count);assert.equal(counts.rejectedWrites,count*2);assert.equal(counts.readGates,count);
 if(count>=64)for(const id of ENDING_IDS)assert.ok(coverage.endings[id]>0,'All six endings '+id);
 if(count>=3072)for(const d of decisions)for(const option of d.options)assert.ok(coverage.choices[d.id+'/'+option.id]>0,'Every major option '+d.id+'/'+option.id);
 assert.equal(Object.keys(coverage.episodes).length,60);
 fs.closeSync(rows);
 const result={result:'PASS',started:started.toISOString(),finished:new Date().toISOString(),seconds:(Date.now()-started.getTime())/1000,storyInputHash:story.inputHash,roundLogSha256:hash(fs.readFileSync(path.join(out,'rounds.jsonl'))),roundDigest:routeDigest.digest('hex'),counts,coverage,method:count+' executed production-domain full-game rounds in '+count/4+' four-round campaigns. Registered episodeEnd graph, JSON serialization, LocalSave migration/reload, two quota failures per round, recovery, mid-round runtime replacement, read gates, real ending completion and new-round reset. Not '+count+' browser playthroughs, human readings or physical TapTap tests.'};
 fs.writeFileSync(path.join(out,'index.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({result:result.result,counts,seconds:result.seconds,endings:coverage.endings}));
}catch(error){fs.closeSync(rows);fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({result:'FAIL',case:currentCase,counts,message:error.message,stack:error.stack},null,2));console.error(error);process.exitCode=1}
