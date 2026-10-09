const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const [url,roundsFile,outDir]=process.argv.slice(2);if(!outDir)throw Error('Usage: URL genuine-rounds-report output-directory');
const seed=JSON.parse(fs.readFileSync(roundsFile)).rounds[0].endState;
assert.ok(seed.flags.ROUND_COMPLETED);let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:540,height:960},hasTouch:true,isMobile:true});const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));fs.mkdirSync(outDir,{recursive:true});
 await page.addInitScript(({raw,deniedCount})=>{
   if(!sessionStorage.getItem('recovery.fixture')){localStorage.setItem('yushengweiji.save.v1',raw);sessionStorage.setItem('recovery.fixture','1');}
   const original=Storage.prototype.setItem;window.__denyNextRound=true;
   Storage.prototype.setItem=function(key,value){
     if(this===localStorage&&key==='yushengweiji.save.v1'&&window.__denyNextRound&&JSON.parse(value).playCount===deniedCount)throw new DOMException('Injected storage write failure','QuotaExceededError');
     return original.call(this,key,value);
   };
 },{raw:JSON.stringify(seed),deniedCount:seed.playCount+1});
 const snap=()=>page.evaluate(async()=>{const cc=await System.import('cc'),s=cc.director.getScene(),buttons=[];let state;
   function walk(n){if(!n.activeInHierarchy)return;const m=n.getComponent('StoryManager');if(m?.hasState())state=m.state;const b=n.getComponent(cc.Button);if(b)buttons.push({text:n.children.find(c=>c.getComponent(cc.Label))?.getComponent(cc.Label)?.string,enabled:b.interactable,x:270+n.worldPosition.x/2,y:480-n.worldPosition.y/2});for(const c of n.children)walk(c)}if(s)walk(s);return {state,buttons,raw:localStorage.getItem('yushengweiji.save.v1')};});
 const tap=async title=>{for(let i=0;i<150;i++){const b=(await snap()).buttons.find(b=>b.text===title&&b.enabled);if(b){await page.touchscreen.tap(b.x,b.y);await page.waitForTimeout(350);return}await page.waitForTimeout(100)}throw Error('No button '+title)};
 await page.goto(url);await tap('继续');const before=await snap();await tap('再读一遍');const failed=await snap();assert.deepEqual(failed.state,before.state);assert.equal(failed.raw,before.raw);assert.ok(failed.buttons.some(b=>b.text==='重试保存'));await page.screenshot({path:path.join(outDir,'failed-write.png')});
 await page.reload();await tap('继续');const restored=await snap();assert.ok(restored.state.flags.ROUND_COMPLETED);assert.deepEqual(restored.state.endings,seed.endings);assert.equal(restored.state.playCount,seed.playCount);
 await page.evaluate(()=>{window.__denyNextRound=false});await tap('再读一遍');let next;
 for(let i=0;i<100;i++){next=await snap();if(next.state?.progress.chapterId==='CH01')break;await page.waitForTimeout(100)}
 assert.equal(next.state.playCount,seed.playCount+1);assert.deepEqual(next.state.endings,seed.endings);assert.deepEqual(next.state.flags,{});assert.equal(next.state.progress.nodeId,'CH01_EP01_N001');assert.equal(errors.length,0);
 const report={result:'PASS',method:'Genuine completed H5 round used as initial fixture. Storage-boundary failure injected only for new-round writes; touchscreen restart, reload recovery, then write recovery. No story-state mutation.',completedRoundPreserved:true,rawSavePreserved:true,newRoundRecovered:true,endings:next.state.endings,errors};
 fs.writeFileSync(path.join(outDir,'save-recovery.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
