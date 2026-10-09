const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),{loadStory,play}=require('./story-analysis-lib.cjs');
const[url,out='work/reading-settings']=process.argv.slice(2);if(!url)throw Error('Usage: URL [output-directory]');
const prefKey='yushengweiji.reading.v1',saveKey='yushengweiji.save.v1';
const viewports=[{width:360,height:640},{width:390,height:780},{width:375,height:812},{width:412,height:915},{width:360,height:840}];
const story=loadStory(),fixtures=new Map();play(story,undefined,'FULL',undefined,(n,s)=>{if(!fixtures.has(n.id))fixtures.set(n.id,structuredClone(s))});
let browser;const reports=[],errors=[];
const sameFacts=(before,after)=>{
 for(const key of ['flags','stats','life','endings','meta','readNodeIds'])assert.deepEqual(after[key],before[key],key);
 for(const key of ['chapterId','episodeId','nodeId'])assert.equal(after.progress[key],before.progress[key]);
};
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});fs.mkdirSync(out,{recursive:true});
 const setup=async(viewport,seed)=>{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({prefKey,saveKey,seed})=>{
   if(sessionStorage.getItem('settings.initialized'))return;sessionStorage.setItem('settings.initialized','1');
   localStorage.removeItem(prefKey);localStorage.removeItem(saveKey);if(seed)localStorage.setItem(saveKey,JSON.stringify(seed));
  },{prefKey,saveKey,seed});
  const snap=()=>page.evaluate(async({prefKey,saveKey})=>{
   const cc=await System.import('cc'),scene=cc.director.getScene(),rect=document.querySelector('canvas').getBoundingClientRect(),scale=Math.min(rect.width/1080,rect.height/1920);
   const buttons=[],labels=[],scrolls=[],audio=[];let state,modal=false,photoBack=false,documents=0;
   function walk(n,inModal=false){if(!n.activeInHierarchy)return;inModal ||= n.name==='ReadingSettings';modal ||= inModal;
    const m=n.getComponent('StoryManager');if(m?.hasState())state=m.state;
    const a=n.getComponent('StoryView')?.audio?.source;if(a)audio.push({volume:a.volume,playing:a.playing,time:a.currentTime,duration:a.clip?.getDuration()});
    if(n.name==='PhotoBack')photoBack=true;if(n.name==='Document')documents++;
    const l=n.getComponent(cc.Label);if(l)labels.push({text:l.string,size:l.fontSize,height:n.getComponent(cc.UITransform)?.height,color:[l.color.r,l.color.g,l.color.b],inModal,node:n.name});
    const s=n.getComponent(cc.ScrollView);if(s)scrolls.push({offset:s.getScrollOffset().y,max:s.getMaxScrollOffset().y,inertia:s.inertia});
    const b=n.getComponent(cc.Button);if(b){const t=n.getComponent(cc.UITransform);buttons.push({title:n.children.find(c=>c.getComponent(cc.Label))?.getComponent(cc.Label)?.string,enabled:b.interactable,inModal,x:rect.x+rect.width/2+n.worldPosition.x*scale,y:rect.y+rect.height/2-n.worldPosition.y*scale,width:t.width*scale,height:t.height*scale});}
    for(const child of n.children)walk(child,inModal);
   }walk(scene);return{scene:scene.name,state,buttons,labels,scrolls,audio,modal,photoBack,documents,prefs:localStorage.getItem(prefKey),raw:localStorage.getItem(saveKey)};
  },{prefKey,saveKey});
  const tap=async title=>{for(let i=0;i<180;i++){const s=await snap(),b=s.buttons.find(b=>b.title===title&&b.enabled&&(!s.modal||b.inModal));if(b){await page.touchscreen.tap(b.x,b.y);await page.waitForTimeout(250);if(s.scene==='Main'&&title==='继续'){for(let j=0;j<300&&!(await snap()).state;j++)await page.waitForTimeout(100);assert.ok((await snap()).state,'Story ready after Main resume');}return}await page.waitForTimeout(100)}throw Error('No ready control '+title)};
  const ready=async()=>{await page.goto(url);await page.waitForFunction(()=>window.cc?.director.getScene()?.name==='Main',{},{timeout:30000});};
  const shot=async name=>{const s=await snap(),visible=s.buttons.filter(b=>!s.modal||b.inModal);for(const b of visible){assert.ok(b.x-b.width/2>=-1&&b.x+b.width/2<=viewport.width+1);assert.ok(b.y-b.height/2>=-1&&b.y+b.height/2<=viewport.height+1);if(b.title==='阅读设置'||b.inModal)assert.ok(b.height>=43.9,'44px setting target');}const file=`${viewport.width}x${viewport.height}-${name}.png`;await page.screenshot({path:path.join(out,file)});reports.push({viewport,state:name,file,buttons:visible,labels:s.labels.filter(l=>!s.modal||l.inModal),prefs:s.prefs&&JSON.parse(s.prefs)});};
  const drag=async()=>{const cdp=await context.newCDPSession(page),x=viewport.width/2,y=viewport.height*.78;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-viewport.height*.24*i/6}]});await page.waitForTimeout(40)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(500);await cdp.detach();};
  return{context,page,snap,tap,ready,shot,drag};
 };
 for(const viewport of viewports){
  const t=await setup(viewport);await t.ready();assert.equal((await t.snap()).raw,null);await t.tap('阅读设置');await t.shot('settings-standard-paper');
  await t.tap('字号：标准');await t.shot('settings-large-paper');await t.tap('字号：较大');await t.shot('settings-extra-paper');
  await t.tap('纸面：日间');await t.shot('settings-extra-night');await t.tap('字号：大字');await t.shot('settings-standard-night');await t.tap('字号：标准');await t.shot('settings-large-night');
  await t.tap('录音音量：正常');await t.tap('减少动态：关');await t.tap('返回');let s=await t.snap();assert.equal(s.raw,null,'Settings must not create a story save');
  assert.deepEqual(JSON.parse(s.prefs),{version:1,font:'large',theme:'night',volume:.5,reducedMotion:true});
  await t.page.reload();await t.page.waitForFunction(()=>window.cc?.director.getScene()?.name==='Main');await t.tap('继续');
  for(let i=0;i<100&&!(await t.snap()).state;i++)await t.page.waitForTimeout(100);
  s=await t.snap();assert.equal(s.state.progress.nodeId,'CH01_EP01_N001');assert.ok(s.labels.some(l=>l.node==='Paragraph'&&l.size===54&&l.color.every(c=>c>200)));assert.equal(s.scrolls[0].inertia,false);
  await t.shot('home-large-night');await t.drag();s=await t.snap();assert.ok(s.state.progress.readingOffset>.01);const offset=s.state.progress.readingOffset;
  await t.tap('阅读设置');await t.tap('字号：较大');await t.tap('返回');let reflow=await t.snap();sameFacts(s.state,reflow.state);assert.ok(Math.abs(reflow.state.progress.readingOffset-offset)<.005);assert.ok(reflow.labels.some(l=>l.node==='Paragraph'&&l.size===60));await t.shot('home-extra-night');
  await t.tap('阅读设置');await t.tap('纸面：夜间');await t.tap('返回');await t.shot('home-extra-paper');
  const beforeReload=await t.snap();await t.page.reload();await t.page.waitForFunction(()=>window.cc?.director.getScene()?.name==='Main');await t.tap('继续');s=await t.snap();sameFacts(beforeReload.state,s.state);assert.ok(Math.abs(s.state.progress.readingOffset-offset)<.005);
  const prefBefore=s.prefs;
  await t.page.evaluate(prefKey=>{window.__prefSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===prefKey)throw Error('intentional preference failure');return window.__prefSetItem.call(this,k,v)}},prefKey);
  await t.tap('阅读设置');await t.tap('字号：大字');s=await t.snap();assert.equal(s.prefs,prefBefore);assert.ok(s.labels.some(l=>l.inModal&&l.text.includes('暂时不能保存')));sameFacts(beforeReload.state,s.state);await t.shot('settings-write-failure');
  await t.page.evaluate(()=>{Storage.prototype.setItem=window.__prefSetItem;delete window.__prefSetItem});await t.tap('字号：标准');assert.ok(!(await t.snap()).labels.some(l=>l.inModal&&l.text.includes('暂时不能保存')));await t.tap('返回');await t.context.close();console.log('Settings '+viewport.width+'x'+viewport.height+' PASS');
 }
 const targets=[{id:'CH08_EP03_LETTER',action:'展开信纸',finish:'放回去',kind:'letter'},{id:'CH08_EP03_AUDIO',action:'查看录音文字',finish:'继续',kind:'transcript'},{id:story.records.find(r=>r.chapter==='CH01'&&r.node.type==='photo'&&r.node.backText&&r.node.resource).node.id,action:'翻面',finish:'放回去',kind:'photo'}];
 for(const target of targets){
  const seed=fixtures.get(target.id);assert.ok(seed);const t=await setup({width:390,height:780},seed);await t.ready();await t.tap('继续');await t.tap(target.action);let s=await t.snap();assert.equal(s.state.progress.nodeId,target.id);
  if(target.kind==='photo')assert.ok(s.photoBack);else{assert.equal(s.documents,1);assert.equal(s.buttons.find(b=>b.title===target.finish).enabled,false);assert.ok(!s.state.flags[target.kind==='letter'?'READ_FULL_LETTER':'FOUND_FULL_RECORDING']);await t.drag();s=await t.snap();}
  const before=s.state;await t.tap('阅读设置');await t.tap('字号：标准');await t.tap('字号：较大');await t.tap('纸面：日间');await t.tap('返回');s=await t.snap();sameFacts(before,s.state);
  if(target.kind==='photo'){assert.ok(s.photoBack);assert.ok(s.buttons.find(b=>b.title===target.finish).enabled);}else{
   assert.equal(s.documents,1);assert.ok(Math.abs(s.state.progress.readingOffset-before.progress.readingOffset)<.005);assert.equal(s.buttons.find(b=>b.title===target.finish).enabled,false);
   const source=story.records.find(r=>r.node.id===target.id).node,parts=s.labels.filter(l=>l.node==='DocumentText');
   assert.equal(parts.map(l=>l.text).join(''),(source.transcript||source.text).replace(/\n/g,''),'No missing document characters');
   assert.ok(parts.length>1&&parts.every(l=>l.height<2048),'Document paragraphs stay below canvas texture height');
   assert.ok(parts.every(l=>l.size===60),'Largest font remains legible');
  }
  await t.shot(target.kind+'-reflow-keeps-view');await t.context.close();
 }
 // Genuine media start, then only presentation volume changes; no seeks or evidence writes.
 {
  const t=await setup({width:390,height:780},fixtures.get('CH08_EP03_AUDIO'));await t.ready();await t.tap('继续');await t.tap('播放');await t.page.waitForTimeout(900);let s=await t.snap();assert.ok(s.audio[0].playing);const before=s.state;
  await t.tap('阅读设置');s=await t.snap();assert.equal(s.audio[0].playing,false);await t.tap('录音音量：正常');assert.equal((await t.snap()).audio[0].volume,.5);await t.tap('录音音量：较轻');assert.equal((await t.snap()).audio[0].volume,0);await t.tap('返回');s=await t.snap();sameFacts(before,s.state);assert.ok(!s.state.flags.FOUND_FULL_RECORDING);assert.equal(s.buttons.find(b=>b.title==='继续').enabled,false);assert.equal(s.audio[0].playing,false);await t.tap('暂停 / 继续播放');assert.ok((await t.snap()).audio[0].playing);await t.context.close();
 }
 assert.deepEqual(errors,[]);const report={result:'PASS',method:'Genuine Main/first-chapter touch and scroll, independent preference failure injection; letter/audio/photo initial fixtures produced by domain actions, then real H5 touch, no running story writes or audio seeks. Five desktop touch viewports, not physical phones.',shots:reports,preferenceNamespaceIndependent:true,restartPersisted:true,reflowPreservedFactsAndOffset:true,interactionViewsPreserved:true,completeSourcesNotAwardedEarly:true,documentTextCompleteAndTextureBounded:true,volumeAppliedToRealSource:true,errors};fs.writeFileSync(path.join(out,'index.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:'PASS',screens:reports.length,errors}));await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
