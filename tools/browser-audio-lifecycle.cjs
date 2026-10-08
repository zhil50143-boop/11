const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const [url,seedFile,outDir]=process.argv.slice(2);
if(!outDir)throw Error('Usage: URL genuine-ch08-none-report output-directory');
const seed=JSON.parse(fs.readFileSync(seedFile)).endState;
assert.equal(seed.progress.chapterId,'CH08');assert.ok(!seed.flags.FOUND_FULL_RECORDING);
seed.progress={chapterId:'CH08',episodeId:'CH08_EP03',nodeId:'CH08_EP03_AUDIO',readingOffset:0};
let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:540,height:960},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];fs.mkdirSync(outDir,{recursive:true});
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(raw=>{if(!sessionStorage.getItem('lifecycle.seed')){localStorage.setItem('yushengweiji.save.v1',raw);sessionStorage.setItem('lifecycle.seed','1')}},JSON.stringify(seed));
 const snap=()=>page.evaluate(async()=>{const cc=await System.import('cc'),scene=cc.director.getScene(),buttons=[];let state,audioCount=0,ended=false,view;function walk(n){if(!n.activeInHierarchy)return;const m=n.getComponent('StoryManager');if(m?.hasState())state=m.state;view=n.getComponent('StoryView')||view;audioCount+=n.getComponents(cc.AudioSource).length;if(n.name==='Story')ended=n.hasEventListener(cc.AudioSource.EventType.ENDED);const b=n.getComponent(cc.Button);if(b)buttons.push({title:n.children.find(c=>c.getComponent(cc.Label))?.getComponent(cc.Label)?.string,enabled:b.interactable,x:270+n.worldPosition.x/2,y:480-n.worldPosition.y/2});for(const c of n.children)walk(c)}if(scene)walk(scene);return{state,audioCount,ended,buttons,playing:view?.audio?.source?.playing}});
 const tap=async title=>{for(let i=0;i<100;i++){const b=(await snap()).buttons.find(b=>b.title===title&&b.enabled);if(b){await page.touchscreen.tap(b.x,b.y);await page.waitForTimeout(250);return}await page.waitForTimeout(100)}throw Error('No button '+title)};
 await page.goto(url);await tap('继续');await tap('播放');let state=await snap();assert.equal(state.audioCount,1);assert.equal(state.ended,true);assert.ok(state.playing);const observations=[{stage:'playing',...state}];
 // Engine lifecycle events simulate backgrounding; this is explicitly not a physical lock-screen test.
 for(let cycle=0;cycle<5;cycle++){
  await page.evaluate(async()=>{const cc=await System.import('cc');cc.game.emit(cc.Game.EVENT_HIDE)});await page.waitForTimeout(150);
  state=await snap();assert.equal(state.audioCount,0);assert.equal(state.ended,false);assert.ok(!state.state.flags.FOUND_FULL_RECORDING);assert.equal(state.state.progress.readingOffset,0);observations.push({stage:'hidden-'+cycle,...state});
  await page.evaluate(async()=>{const cc=await System.import('cc');cc.game.emit(cc.Game.EVENT_SHOW)});await page.waitForTimeout(250);await tap('播放');state=await snap();assert.equal(state.audioCount,1);assert.equal(state.ended,true);
 }
 await tap('查看录音文字');const cdp=await context.newCDPSession(page);
 for(let i=0;i<35;i++){state=await snap();if(state.buttons.find(b=>b.title==='继续'&&b.enabled))break;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:260,y:700}]});for(let y=650;y>=280;y-=45){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:260,y}]});await page.waitForTimeout(35)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200)}
 assert.ok((await snap()).state.progress.readingOffset>=.99);await tap('继续');state=await snap();assert.equal(state.audioCount,0);assert.equal(state.ended,false);assert.equal(state.state.progress.nodeId,'CH08_EP03_DESK');assert.ok(state.state.flags.FOUND_FULL_RECORDING);assert.ok(!state.state.flags.UNDERSTOOD_BREAKUP_TRUTH);observations.push({stage:'transcript-completed',...state});
 assert.equal(errors.length,0);fs.writeFileSync(path.join(outDir,'audio-lifecycle.json'),JSON.stringify({result:'PASS',method:'Genuine H5 no-recording save with initial cursor fixture. Actual touch playback, five simulated engine hide/show events, touch-scrolled full transcript and exit. No running-state writes, media seeking, or evidence fabrication. Not physical-phone background validation.',observations,errors},null,2));
 console.log('Audio lifecycle PASS: five background cycles, disposed sources/listeners, transcript completion');await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
