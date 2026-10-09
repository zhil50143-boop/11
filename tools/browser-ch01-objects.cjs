const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),{loadStory,play}=require('./story-analysis-lib.cjs');
const[url,out='work/ch01-objects']=process.argv.slice(2);if(!url)throw Error('Usage: URL [output-directory]');
const story=loadStory(),fixtures=new Map(),nodes=new Map(story.records.map(r=>[r.node.id,r.node]));
play(story,undefined,'FULL',undefined,(n,s)=>{if(!fixtures.has(n.id))fixtures.set(n.id,structuredClone(s))});
const reports=[],errors=[];let browser;
const facts=s=>({flags:s.flags,stats:s.stats,life:s.life,readNodeIds:s.readNodeIds,endings:s.endings,meta:s.meta});
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});fs.mkdirSync(out,{recursive:true});
 const open=async(id,{theme='paper',font='standard',failImages=false,failAudio=false}={})=>{
  const viewport={width:390,height:780},context=await browser.newContext({viewport,hasTouch:true,isMobile:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));const blocked=[];
  if(failImages)await page.route(/\/assets\/resources\/native\/.*\.(png|jpg)(?:\?|$)/,r=>{blocked.push(r.request().url());return r.abort('failed')});
  if(failAudio)await page.route(/\/assets\/resources\/native\/.*\.mp3(?:\?|$)/,r=>{blocked.push(r.request().url());return r.abort('failed')});
  await page.addInitScript(({state,theme,font})=>{if(sessionStorage.getItem('objects.seed'))return;sessionStorage.setItem('objects.seed','1');localStorage.setItem('yushengweiji.save.v1',JSON.stringify(state));localStorage.setItem('yushengweiji.reading.v1',JSON.stringify({version:1,font,theme,volume:1,reducedMotion:false}))},{state:fixtures.get(id),theme,font});
  const snap=()=>page.evaluate(async()=>{
   const cc=await System.import('cc'),scene=cc.director.getScene(),rect=document.querySelector('canvas').getBoundingClientRect(),scale=Math.min(rect.width/1080,rect.height/1920),buttons=[],labels=[],images=[],scrolls=[];let state,audio;
   function walk(n){if(!n.activeInHierarchy)return;const m=n.getComponent('StoryManager');if(m?.hasState())state=m.state;const v=n.getComponent('StoryView')?.audio?.source;if(v)audio={playing:v.playing,time:v.currentTime,duration:v.clip.getDuration()};
    const l=n.getComponent(cc.Label);if(l)labels.push({text:l.string,name:n.name,size:l.fontSize});
    const b=n.getComponent(cc.Button);if(b)buttons.push({title:n.children.find(c=>c.getComponent(cc.Label))?.getComponent(cc.Label)?.string,enabled:b.interactable,x:rect.x+rect.width/2+n.worldPosition.x*scale,y:rect.y+rect.height/2-n.worldPosition.y*scale});
    const sp=n.getComponent(cc.Sprite);if(sp?.spriteFrame)images.push(n.name);
    const sc=n.getComponent(cc.ScrollView);if(sc)scrolls.push({offset:sc.getScrollOffset().y,max:sc.getMaxScrollOffset().y});
    for(const c of n.children)walk(c);
   }if(scene)walk(scene);return{state,audio,buttons,labels,images,scrolls,raw:localStorage.getItem('yushengweiji.save.v1')};
  });
  const tap=async title=>{for(let i=0;i<180;i++){const s=await snap(),b=s.buttons.find(b=>b.title===title&&b.enabled);if(b){await page.touchscreen.tap(b.x,b.y);await page.waitForTimeout(250);return;}await page.waitForTimeout(100)}throw Error('Missing '+title+' at '+id)};
  const shot=async name=>{await page.screenshot({path:path.join(out,name+'.png')});};
  const drag=async()=>{const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:540}]});for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y:540-310*i/8}]});await page.waitForTimeout(30)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);await cdp.detach();};
  await page.goto(url);await tap('继续');for(let i=0;i<180;i++){if((await snap()).state?.progress.nodeId===id)break;await page.waitForTimeout(100)}assert.equal((await snap()).state.progress.nodeId,id);await page.waitForTimeout(1000);
  return{context,page,snap,tap,shot,drag,blocked};
 };
 {
  const t=await open('CH01_EP02_C001'),before=await t.snap();assert.equal(before.buttons.find(b=>b.title==='收好纸箱').enabled,false);
  assert.equal(before.buttons.filter(b=>/旧照片|^信封|17路公交票|褪色的手绳/.test(b.title)).length,4);
  const done=before.buttons.find(b=>b.title==='收好纸箱');await t.page.touchscreen.tap(done.x,done.y);assert.deepEqual(facts((await t.snap()).state),facts(before.state));
  await t.tap('其余旧物');let s=await t.snap();assert.deepEqual(facts(s.state),facts(before.state));assert.ok(!s.buttons.some(b=>b.title==='旧照片'));await t.shot('objects-page2');
  await t.tap('旧 MP3');assert.equal((await t.snap()).state.progress.nodeId,'CH01_EP02_MP3_001');await t.tap('放回去');s=await t.snap();assert.ok(s.buttons.some(b=>b.title==='旧 MP3（看过）'),'Same page retained on return');assert.ok(s.state.flags.FOUND_MP3);
  await t.tap('前面几件');
  for(const [title,id]of [['17路公交票','CH01_EP02_TICKET'],['褪色的手绳','CH01_EP02_ROPE']]){
   await t.tap(title);s=await t.snap();assert.equal(s.state.progress.nodeId,id);assert.equal(s.labels.filter(l=>l.name==='DocumentText').map(l=>l.text).join(''),nodes.get(id).text.replace(/\n/g,''));await t.shot(id);await t.tap('放回去');
  }
  await t.tap('旧照片');assert.equal((await t.snap()).buttons.find(b=>b.title==='放回去').enabled,false);await t.tap('翻面');s=await t.snap();assert.ok(s.labels.some(l=>l.text===nodes.get('CH01_EP02_PHOTO_001').backText));await t.tap('放回去');
  await t.tap('信封');assert.equal((await t.snap()).buttons.find(b=>b.title==='放回去').enabled,false);await t.shot('envelope-unopened');await t.tap('查看信封');s=await t.snap();assert.equal(s.labels.filter(l=>l.name==='DocumentText').map(l=>l.text).join(''),nodes.get('CH01_EP02_LETTER_001').text.replace(/\n/g,''));assert.ok(!s.state.flags.READ_FULL_LETTER);await t.tap('放回去');
  assert.equal((await t.snap()).buttons.find(b=>b.title==='收好纸箱').enabled,true);await t.shot('objects-all-viewed');await t.tap('收好纸箱');assert.equal((await t.snap()).state.progress.nodeId,'CH01_EP02_NAME_001');
  reports.push({case:'five original objects, reverse optional order, two pages and required gate',result:'PASS'});await t.context.close();
 }
 for(const option of ['A','B','C']){
  const t=await open('CH01_EP02_C002'),choice=nodes.get('CH01_EP02_C002').options.find(o=>o.id===option);await t.tap(choice.text);assert.equal((await t.snap()).state.progress.nodeId,choice.next);
  const visited=[];
  for(let i=0;i<100;i++){
   const s=await t.snap();if(s.state.progress.chapterId!=='CH01')break;const n=nodes.get(s.state.progress.nodeId);visited.push(n.id);
   if(['passage','phone','narration','dialogue'].includes(n.type))await t.tap('继续');
   else if(n.type==='letter'){await t.tap(n.actionText||'查看');await t.tap('放回去');}
   else if(n.type==='audioInteraction'){await t.tap('查看录音文字');for(let i=0;i<30&&!(await t.snap()).buttons.find(b=>b.title==='继续').enabled;i++)await t.drag();await t.tap('继续');}
   else if(n.type==='transition'){await t.page.waitForTimeout(550);await t.tap('继续');}
   else throw Error('Unexpected first chapter node '+n.id);
  }
  const after=await t.snap();assert.equal(after.state.progress.chapterId,'CH02');assert.ok(visited.includes(option==='B'?'CH01_EP03_N006A':'CH01_EP03_N006B'));assert.ok(after.state.flags[choice.setFlags[0]]);assert.ok(!after.state.flags.READ_FULL_LETTER&&!after.state.flags.FOUND_FULL_RECORDING&&!after.state.flags.UNDERSTOOD_BREAKUP_TRUTH);
  reports.push({case:'first decision '+option+' and late-night consequence',nodes:visited,result:'PASS'});await t.context.close();
 }
 for(const id of ['CH01_EP02_C001','CH01_EP02_PHOTO_001','CH01_EP02_TICKET','CH01_EP02_LETTER_001']){
  const t=await open(id,{failImages:true}),before=await t.snap();
  if(id==='CH01_EP02_PHOTO_001'||id==='CH01_EP02_TICKET'){
   const message=id==='CH01_EP02_PHOTO_001'?'照片暂时没能打开':'旧物图片暂时没能打开';
   for(let i=0;i<300&&!(await t.snap()).labels.some(l=>l.text.includes(message));i++)await t.page.waitForTimeout(100);
  }
  await t.shot(id+'-images-failed-before-touch');
  fs.writeFileSync(path.join(out,id+'-failure-diagnostic.json'),JSON.stringify({snapshot:await t.snap(),blocked:t.blocked},null,2));
  if(id==='CH01_EP02_C001'){await t.tap('其余旧物');await t.tap('旧 MP3');await t.tap('放回去');assert.ok((await t.snap()).state.flags.FOUND_MP3);}
  else if(id==='CH01_EP02_PHOTO_001'){assert.ok((await t.snap()).labels.some(l=>l.text.includes('照片暂时没能打开')));await t.tap('翻面');await t.tap('放回去');}
  else if(id==='CH01_EP02_TICKET'){assert.ok((await t.snap()).labels.some(l=>l.text.includes('旧物图片暂时没能打开')));await t.tap('放回去');}
  else{await t.tap('查看信封');assert.equal((await t.snap()).labels.filter(l=>l.name==='DocumentText').map(l=>l.text).join(''),nodes.get(id).text.replace(/\n/g,''));await t.tap('放回去');}
  assert.ok(t.blocked.length>0);await t.shot(id+'-images-failed');reports.push({case:id+' all generated images failed',blocked:t.blocked.length,result:'PASS'});await t.context.close();
 }
 {
  const t=await open('CH08_EP03_AUDIO',{failAudio:true,font:'extra',theme:'night'});await t.tap('播放');let s=await t.snap();assert.equal(s.buttons.find(b=>b.title==='继续').enabled,false);assert.ok(!s.state.flags.FOUND_FULL_RECORDING);await t.tap('查看录音文字');
  s=await t.snap();assert.equal(s.labels.filter(l=>l.name==='DocumentText').map(l=>l.text).join(''),nodes.get('CH08_EP03_AUDIO').transcript.replace(/\n/g,''));
  for(let i=0;i<40&&!(await t.snap()).buttons.find(b=>b.title==='继续').enabled;i++)await t.drag();
  s=await t.snap();assert.ok(s.state.progress.readingOffset>=.99);assert.ok(!s.state.flags.FOUND_FULL_RECORDING);await t.shot('full-audio-failed-transcript-end');await t.tap('继续');assert.ok((await t.snap()).state.flags.FOUND_FULL_RECORDING);
  reports.push({case:'full audio failure uses exact complete transcript; no early source',blocked:t.blocked.length,result:'PASS'});await t.context.close();
 }
 {
  const t=await open('CH08_EP03_AUDIO');await t.tap('播放');await t.page.waitForTimeout(1100);let s=await t.snap();assert.ok(s.audio.playing&&s.audio.time>0);assert.equal(s.buttons.find(b=>b.title==='继续').enabled,false);assert.ok(!s.state.flags.FOUND_FULL_RECORDING);
  await t.tap('暂停 / 继续播放');s=await t.snap();assert.equal(s.audio.playing,false);const paused=s.audio.time;await t.page.waitForTimeout(750);assert.ok(Math.abs((await t.snap()).audio.time-paused)<.15);await t.tap('暂停 / 继续播放');
  const started=Date.now();for(let i=0;i<170;i++){s=await t.snap();if(!s.audio.playing&&s.buttons.find(b=>b.title==='继续').enabled)break;await t.page.waitForTimeout(500);}
  assert.equal(s.audio.playing,false);assert.equal(s.buttons.find(b=>b.title==='继续').enabled,true);assert.ok(s.state.progress.readingOffset>=.99);assert.ok(!s.state.flags.FOUND_FULL_RECORDING);
  await t.shot('full-audio-natural-end');await t.tap('继续');assert.ok((await t.snap()).state.flags.FOUND_FULL_RECORDING);
  reports.push({case:'approved voice natural playback, pause/resume and completion',duration:s.audio.duration,waitMs:Date.now()-started,result:'PASS'});await t.context.close();
 }
 assert.deepEqual(errors,[]);const report={result:'PASS',method:'Reachable domain fixtures for setup, then genuine H5 touch, scroll and media natural end. No running state edits, no audio seek. Desktop Chrome touch emulation is not a physical TapTap phone.',reports,pageErrors:errors};
 fs.writeFileSync(path.join(out,'objects.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});

