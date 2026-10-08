// Regression for an old boundary save whose earlier decisions are unavailable.
// Uses the actual Cocos build; no runtime state is written after the menu loads.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createInitialState}=require('../work/core/core/GameState.js');
const {StoryRuntime}=require('../work/core/story/StoryRuntime.js');
const catalog=JSON.parse(fs.readFileSync('assets/resources/data/story/catalog.json'));
const manifests=catalog.chapters.map(c=>JSON.parse(fs.readFileSync('assets/resources/'+c.resource+'.json')));
const seedChapter=process.env.LEGACY_START_CHAPTER||'CH04',seedIndex=manifests.findIndex(m=>m.chapterId===seedChapter);
if(seedIndex<0||seedIndex>=manifests.length-1)throw Error('Legacy seed must precede implemented content');
const nextManifests=manifests.slice(seedIndex+1),episodes=nextManifests.flatMap(m=>m.episodes.map(e=>({chapterId:m.chapterId,episode:JSON.parse(fs.readFileSync('assets/resources/'+e.resource+'.json'))})));
const nodes=new Map(episodes.flatMap(e=>e.episode.nodes).map(n=>[n.id,n]));
const out=path.resolve(process.argv[3]||'work/ch05-legacy'),url=process.argv[2];if(!url)throw Error('Preview URL required');fs.mkdirSync(out,{recursive:true});
let browser;const errors=[],failedRequests=[],visited=[];
(async()=>{
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:540,height:960},isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failedRequests.push({url:r.url(),status:r.status()})});page.on('requestfailed',r=>failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
 const state=createInitialState(),seedEpisode=manifests[seedIndex].episodes.at(-1);state.progress={chapterId:seedChapter,episodeId:seedEpisode.id,nodeId:seedEpisode.id+'_END',readingOffset:0};
 const expected=[],domain=structuredClone(state);for(const {chapterId,episode}of episodes){const runtime=new StoryRuntime(domain,()=>{});runtime.load(episode,chapterId);let n=runtime.current();while(n.type!=='episodeEnd'){expected.push(n.id);n=n.type==='choice'?runtime.choose(n.id==='CH05_EP05_CHOICE'?'SHARE':'TOGETHER',n.id):['passage','phone'].includes(n.type)?runtime.advance(n.id):runtime.complete(n.id)}}
 await page.addInitScript(raw=>{if(!sessionStorage.getItem('legacy.seeded')){localStorage.setItem('yushengweiji.save.v1',raw);sessionStorage.setItem('legacy.seeded','1')}},JSON.stringify(state));
 const snap=()=>page.evaluate(()=>{const cc=window.cc,scene=cc?.director.getScene(),buttons=[],labels=[];let state;function walk(n){if(!n.activeInHierarchy)return;const m=n.getComponent('StoryManager');if(m?.hasState())state=m.state;const l=n.getComponent(cc.Label);if(l)labels.push(l.string);const b=n.getComponent(cc.Button);if(b?.interactable){const title=n.children.find(c=>c.getComponent(cc.Label))?.getComponent(cc.Label)?.string;buttons.push({title,x:270+n.worldPosition.x/2,y:480-n.worldPosition.y/2})}for(const c of n.children)walk(c)}if(scene)walk(scene);return{scene:scene?.name,state,buttons,labels,save:localStorage.getItem('yushengweiji.save.v1')}});
 const tap=async title=>{await page.waitForFunction(title=>{const cc=window.cc,s=cc?.director.getScene();let ready=false;function walk(n){if(!n.activeInHierarchy)return;if(n.getComponent(cc.Button)?.interactable&&n.children.some(c=>c.getComponent(cc.Label)?.string===title))ready=true;for(const c of n.children)walk(c)}if(s)walk(s);return ready},title,{timeout:30000});const b=(await snap()).buttons.find(b=>b.title===title);await page.touchscreen.tap(b.x,b.y);await page.waitForTimeout(400)};
 await page.goto(url);await tap('继续');await page.waitForFunction(chapter=>{const m=window.cc?.director.getScene()?.children[0]?.getComponent('StoryManager');return m?.hasState()&&m.state.progress.chapterId===chapter},nextManifests[0].chapterId,{timeout:30000});
 for(let guard=0;guard<nodes.size*3;guard++){
  const s=await snap();if(s.labels.includes('当前内容读完了。'))break;const n=nodes.get(s.state?.progress.nodeId);assert.ok(n);visited.push(n.id);
  if(n.type==='passage'||n.type==='phone')await tap('继续');
  else if(n.type==='letter'){await tap(n.actionText??'查看');assert.ok((await snap()).labels.includes(n.text));await tap('放回去')}
  else if(n.type==='choice')await tap(n.options.find(o=>o.id===(n.id==='CH05_EP05_CHOICE'?'SHARE':'TOGETHER')).text);
  else if(n.type==='photo'){await tap('翻面');assert.ok((await snap()).labels.includes(n.backText));await tap('放回去')}
  else if(n.type==='investigation')await tap(n.doneText??'收好纸箱');
  else if(n.type==='transition'){await page.waitForTimeout(600);await tap('继续')}
  else throw Error('Unexpected node '+n.id);
 }
 const end=await snap();assert.ok(end.labels.includes('当前内容读完了。'));assert.equal(end.state.progress.nodeId,domain.progress.nodeId);assert.deepEqual(visited,expected);
 for(const id of ['CH05_EP01_CHECK_FIRST','CH05_EP01_REMEMBER','CH05_EP02_FAMILY_KNOWN','CH05_EP02_FAMILY_LATE','CH05_EP03_ASK_ROOM','CH05_EP03_SUGGEST_ROOM','CH05_EP04_COMPARE','CH05_EP04_RECHECK','CH06_EP02_EARLY','CH06_EP02_LATE','CH06_EP03_ASKED','CH06_EP03_REVISED','CH06_EP03_LISTEN','CH06_EP03_RECONSIDER'])assert.ok(!visited.includes(id));
 for(const flag of ['CH02_TOLD_FAMILY_RELATION','CH02_HID_FAMILY_RELATION','CH03_DISCUSS_PLANS','CH03_ASSUMED_SAME_CITY','CH04_ASKED_SUMMER_PLAN','CH04_PROMISED_FOR_XIA'])assert.ok(!end.state.flags[flag]);
 if(seedChapter==='CH04')assert.ok(visited.includes('CH05_EP05_SHARE')&&visited.includes('CH05_EP06_SEPARATE')&&visited.includes('CH06_EP01_SHARE')&&visited.includes('CH06_EP04_SEPARATE'));
 if(seedChapter==='CH05'){assert.ok(!end.state.flags.CH05_TALKED_JOB_CONDITIONS&&!end.state.flags.CH05_ASSUMED_RETURN_FOR_JOB);for(const id of ['CH06_EP01_SHARE','CH06_EP01_CORRECT','CH06_EP04_SEPARATE','CH06_EP04_CORRECTED'])assert.ok(!visited.includes(id));}
 assert.equal(end.state.flags.CH06_PARTED_2013,domain.flags.CH06_PARTED_2013);assert.deepEqual(end.state.life.memoryRecords.BREAKUP,domain.life.memoryRecords.BREAKUP);if(seedChapter==='CH06'){assert.ok(!end.state.flags.CH06_PARTED_2013);assert.ok(!visited.includes('CH07_EP01_AFTER_STATION'))}assert.ok(!end.state.flags.READ_FULL_LETTER&&!end.state.flags.UNDERSTOOD_BREAKUP_TRUTH&&!end.state.flags.FOUND_FULL_RECORDING);assert.deepEqual(JSON.parse(end.save).readNodeIds,end.state.readNodeIds);
 await page.reload();await tap('继续');await page.waitForFunction(()=>window.cc?.director.getScene()?.children[0]?.getComponent('StoryManager')?.hasState(),{},{timeout:30000});const restored=await snap();assert.deepEqual(restored.state.flags,end.state.flags);assert.deepEqual(restored.state.readNodeIds,end.state.readNodeIds);assert.deepEqual(restored.state.life.memoryRecords,end.state.life.memoryRecords);
 assert.equal(errors.length,0);assert.equal(failedRequests.length,0);const report={result:'PASS',viewport:'540x960 touch',seedChapter,visited,missingHistoryNotInvented:true,restored:true,errors,failedRequests,endState:end.state};fs.writeFileSync(path.join(out,'legacy-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:'PASS',steps:visited.length,seedChapter,missingHistoryNotInvented:true,errors,failedRequests}));await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
