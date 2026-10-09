const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createInitialState}=require('../work/core/core/GameState.js');
const {loadStory}=require('./story-analysis-lib.cjs');
const [url,out,mode='verify']=process.argv.slice(2);
if(!url||!out)throw Error('Usage: URL output-directory [probe|verify]');
const story=loadStory(),key='yushengweiji.save.v1',reports=[],errors=[];let browser;
fs.mkdirSync(out,{recursive:true});
function seed(id){const r=story.records.find(r=>r.node.id===id),s=createInitialState();s.progress={chapterId:r.chapter,episodeId:r.episode,nodeId:id,readingOffset:0};return s}
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 async function open(initial,fault=''){
  const context=await browser.newContext({viewport:{width:540,height:960},hasTouch:true,isMobile:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({raw,key,fault,node})=>{
   if(!sessionStorage.getItem('edge.fixture')){localStorage.setItem(key,raw);sessionStorage.setItem('edge.fixture','1')}
   window.__edgeFault=fault;window.__edgeCondition=node;window.__edgeRejected=0;
   const set=Storage.prototype.setItem;
   Storage.prototype.setItem=function(k,v){if(this===localStorage&&k===key){const s=JSON.parse(v);if(window.__edgeFault==='all'||window.__edgeFault==='condition'&&s.progress.nodeId!==window.__edgeCondition){window.__edgeRejected++;throw new DOMException('Injected quota failure','QuotaExceededError')}}return set.call(this,k,v)};
  },{raw:JSON.stringify(initial),key,fault,node:initial.progress.nodeId});
  const snap=()=>page.evaluate(async key=>{
   const cc=await System.import('cc'),scene=cc.director.getScene(),rect=document.querySelector('canvas').getBoundingClientRect(),scale=Math.min(rect.width/1080,rect.height/1920),labels=[],buttons=[];let m;
   function walk(n){if(!n.activeInHierarchy)return;const manager=n.getComponent('StoryManager');if(manager?.hasState())m=manager;const l=n.getComponent(cc.Label);if(l)labels.push(l.string);const b=n.getComponent(cc.Button);if(b)buttons.push({title:n.children.find(c=>c.getComponent(cc.Label))?.getComponent(cc.Label)?.string,enabled:b.interactable,x:rect.x+rect.width/2+n.worldPosition.x*scale,y:rect.y+rect.height/2-n.worldPosition.y*scale});for(const c of n.children)walk(c)}if(scene)walk(scene);
   return{scene:scene?.name,state:m?.state,raw:localStorage.getItem(key),labels,buttons,failedAction:!!m?.failedSaveAction,busy:m?.busy,rejected:window.__edgeRejected,exitCalls:window.__edgeExitCalls||0};
  },key);
  async function tap(title){for(let i=0;i<150;i++){const b=(await snap()).buttons.find(b=>b.title===title&&b.enabled);if(b){await page.touchscreen.tap(b.x,b.y);await page.waitForTimeout(150);return}await page.waitForTimeout(100)}throw Error('Missing '+title)}
  async function lifecycle(event){await page.evaluate(async event=>{const cc=await System.import('cc');if(event==='pagehide')window.dispatchEvent(new PageTransitionEvent('pagehide'));else cc.game.emit(event==='hide'?cc.Game.EVENT_HIDE:cc.Game.EVENT_SHOW)},event);await page.waitForTimeout(100)}
  await page.goto(url);await tap('继续');await page.waitForTimeout(700);return{context,page,snap,tap,lifecycle};
 }
 for(const [id,expected,known,name] of [
  ['CH01_EP03_COND001','CH01_EP03_N006A',true,'known'],['CH01_EP03_COND001','CH01_EP03_N006B',false,'fallback'],
  ['CH09_EP04_JOB_CHECK','CH09_EP04_JOB_COMMON',false,'legacy-job'],['CH10_EP01_OLD_CHECK','CH10_EP01_COMMON',false,'legacy-work'],['CH10_EP03_REVISE_CHECK','CH10_EP03_COMMON',false,'legacy-care'],
 ]){
  const initial=seed(id);if(known)initial.flags.TOLD_PARTNER_XIA=true;
  const t=await open(initial,'condition'),failed=await t.snap();
  assert.equal(failed.state.progress.nodeId,initial.progress.nodeId);assert.ok(failed.failedAction);assert.equal(JSON.parse(failed.raw).progress.nodeId,initial.progress.nodeId);
  const stable=s=>({flags:s.state.flags,stats:s.state.stats,read:s.state.readNodeIds,memories:s.state.life.memoryRecords});
  for(let i=0;i<3;i++){await t.lifecycle('hide');await t.lifecycle('show');assert.deepEqual(stable(await t.snap()),stable(failed))}
  await t.page.reload();await t.tap('继续');await t.page.waitForTimeout(700);const restarted=await t.snap();assert.equal(restarted.state.progress.nodeId,initial.progress.nodeId);assert.deepEqual(stable(restarted),stable(failed));
  await t.page.evaluate(()=>{window.__edgeFault=''});await t.lifecycle('show');const beforeRetry=await t.snap();
  await t.tap(beforeRetry.buttons.some(b=>b.title==='重试保存')?'重试保存':'重试');await t.page.waitForTimeout(500);const recovered=await t.snap();
  const report={name:'condition-current-'+name,failedAt:failed.state.progress.nodeId,rejected:failed.rejected,restartedAt:restarted.state.progress.nodeId,beforeRetry:beforeRetry.state.progress.nodeId,pendingBeforeRetry:beforeRetry.failedAction,recoveredAt:recovered.state.progress.nodeId,pendingAfterRetry:recovered.failedAction,flagsPreserved:JSON.stringify(stable(recovered))===JSON.stringify(stable(failed))};
  assert.equal(recovered.state.progress.nodeId,expected);assert.ok(!recovered.failedAction);assert.deepEqual(stable(recovered),stable(failed));assert.deepEqual(JSON.parse(recovered.raw),recovered.state);
  if(mode==='verify')assert.equal(beforeRetry.state.progress.nodeId,initial.progress.nodeId,'Background refresh cannot execute a pending failed action');
  await t.page.screenshot({path:path.join(out,report.name+'.png')});reports.push(report);await t.context.close();
 }
 // Introduce a deterministic scene-loading latency; repeated input reaches the
 // real Cocos callback, rather than assuming a fast desktop hides the race.
 for(const failScene of [false,true]){
  const t=await open(seed('CH01_EP01_N001'));
  await t.page.evaluate(async failScene=>{const cc=await System.import('cc'),original=cc.director.loadScene.bind(cc.director);window.__edgeExitCalls=0;cc.director.loadScene=function(name,callback){if(name!=='Main')return original(name,callback);window.__edgeExitCalls++;setTimeout(()=>{if(failScene)callback?.(new Error('Injected scene-load failure'));else original(name,callback)},650);return true}},failScene);
  await t.page.evaluate(()=>{window.__edgeFault='all'});const before=await t.snap();
  for(let i=0;i<3;i++){await t.tap('返回书桌');await t.lifecycle('hide');await t.lifecycle('pagehide');await t.tap('重试保存');await t.lifecycle('show')}
  const blocked=await t.snap();assert.equal(blocked.raw,before.raw);assert.deepEqual(blocked.state,before.state);assert.equal(blocked.exitCalls,0);
  await t.page.evaluate(()=>{window.__edgeFault=''});
  const back=blocked.buttons.find(b=>b.title==='返回书桌');
  for(let i=0;i<8;i++){await t.page.touchscreen.tap(back.x,back.y);if(i===1)await t.lifecycle('show');if(i===3)await t.lifecycle('pagehide')}
  await t.page.waitForTimeout(1200);const after=await t.snap();
  const report={name:'rapid-exit-'+(failScene?'load-failure':'success'),failedSavesKeptRaw:true,blockedExitCalls:blocked.exitCalls,rapidInputs:8,exitCalls:after.exitCalls,scene:after.scene,saveCursor:JSON.parse(after.raw).progress.nodeId};
  if(mode==='verify')assert.equal(after.exitCalls,1,'Only one scene transition may be in flight');
  if(failScene){assert.equal(after.scene,'Story');assert.ok(after.labels.includes('暂时无法返回。请重试。'));await t.tap('重试');await t.page.waitForTimeout(500);assert.equal((await t.snap()).state.progress.nodeId,before.state.progress.nodeId)}else assert.equal(after.scene,'Main');
  assert.equal(JSON.parse(after.raw).progress.nodeId,before.state.progress.nodeId);await t.page.screenshot({path:path.join(out,report.name+'.png')});reports.push(report);await t.context.close();
 }
 assert.equal(errors.length,0);
 const report={result:mode==='verify'?'PASS':'REPRODUCTION',method:'Actual Cocos H5, isolated cursor fixtures, touchscreen input, deterministic storage/scene-load latency faults and synthetic lifecycle events. Not physical TapTap acceptance.',scenarios:reports,errors};fs.writeFileSync(path.join(out,'index.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));await browser.close();
})().catch(async e=>{console.error(e);fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:e.message,scenarios:reports,errors},null,2));await browser?.close();process.exitCode=1});
