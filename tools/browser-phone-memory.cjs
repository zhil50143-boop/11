const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),{loadStory,play,baseChoices}=require('./story-analysis-lib.cjs');
const [url,out='work/phone-memory']=process.argv.slice(2);if(!url)throw Error('Usage: URL [output-directory]');
const story=loadStory(),fixtures=new Map();play(story,undefined,'FULL',undefined,(n,s)=>{if(!fixtures.has(n.id))fixtures.set(n.id,structuredClone(s))});
play(story,{...baseChoices,CH09_EP04_MEETING_CHOICE:'DECLINE'},'FULL',undefined,(n,s)=>{if(!fixtures.has(n.id))fixtures.set(n.id,structuredClone(s))});
const nodes=new Map(story.records.map(r=>[r.node.id,r.node]));
const speakers=JSON.parse(fs.readFileSync('assets/resources/data/presentation.json')).speakers;
const phoneIds=story.records.filter(r=>r.node.type==='phone').map(r=>r.node.id),memoryId='CH08_EP05_RECONSTRUCT';
const recall=nodes.get('CH08_EP05_N001').paragraphs[2].text.split('。')[0]+'。';
const errors=[],reports=[],shots=[];let browser;
const facts=s=>({flags:s.flags,stats:s.stats,life:s.life,readNodeIds:s.readNodeIds,meta:s.meta,endings:s.endings});
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});fs.mkdirSync(out,{recursive:true});
 const open=async(id,viewport={width:390,height:780},{night=false,extra=false,failImages=false,legacy=false}={})=>{
  assert.ok(fixtures.has(id),'Missing reachable fixture '+id);
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:true}),page=await context.newPage(),seed=structuredClone(fixtures.get(id)),blocked=[];
  if(legacy)seed.readNodeIds=seed.readNodeIds.filter(n=>n!=='CH08_EP05_N001');
  page.on('pageerror',e=>errors.push(e.message));
  if(failImages)await page.route(/\/assets\/resources\/native\/.*\.(png|jpg)(?:\?|$)/,r=>{blocked.push(r.request().url());return r.abort('failed')});
  await page.addInitScript(({seed,night,extra})=>{if(sessionStorage.getItem('phone.seeded'))return;sessionStorage.setItem('phone.seeded','1');localStorage.setItem('yushengweiji.save.v1',JSON.stringify(seed));localStorage.setItem('yushengweiji.reading.v1',JSON.stringify({version:1,font:extra?'extra':'standard',theme:night?'night':'paper',volume:1,reducedMotion:false}));},{seed,night,extra});
  const snap=()=>page.evaluate(async()=>{
   const cc=await System.import('cc'),scene=cc.director.getScene(),r=document.querySelector('canvas').getBoundingClientRect(),scale=Math.min(r.width/1080,r.height/1920),buttons=[],labels=[],scrolls=[],images=[];let state;
   function walk(n){if(!n.activeInHierarchy)return;const m=n.getComponent('StoryManager');if(m?.hasState())state=m.state;const l=n.getComponent(cc.Label);if(l)labels.push({text:l.string,node:n.name,size:l.fontSize,height:n.getComponent(cc.UITransform)?.height,color:[l.color.r,l.color.g,l.color.b]});
    const a=n.getComponent(cc.Sprite);if(a)images.push({node:n.parent.name,loaded:!!a.spriteFrame});
    const s=n.getComponent(cc.ScrollView);if(s){const t=n.getComponent(cc.UITransform);scrolls.push({node:n.name,offset:s.getScrollOffset().y,max:s.getMaxScrollOffset().y,x:r.x+r.width/2+n.worldPosition.x*scale,y:r.y+r.height/2-n.worldPosition.y*scale,height:t.height*scale});}
    const b=n.getComponent(cc.Button);if(b){const t=n.getComponent(cc.UITransform);buttons.push({title:n.children.find(c=>c.getComponent(cc.Label))?.getComponent(cc.Label)?.string,enabled:b.interactable,x:r.x+r.width/2+n.worldPosition.x*scale,y:r.y+r.height/2-n.worldPosition.y*scale,width:t.width*scale,height:t.height*scale});}for(const c of n.children)walk(c);
   }if(scene)walk(scene);return{state,buttons,labels,scrolls,images,raw:localStorage.getItem('yushengweiji.save.v1')};
  });
  const tap=async title=>{for(let i=0;i<300;i++){const b=(await snap()).buttons.find(b=>b.title===title&&b.enabled);if(b){await page.touchscreen.tap(b.x,b.y);await page.waitForTimeout(200);return}await page.waitForTimeout(100)}throw Error('No control '+title+' / '+id)};
  const wait=async test=>{for(let i=0;i<300;i++){const s=await snap();if(test(s))return s;await page.waitForTimeout(100)}throw Error('State timeout '+id)};
  await page.goto(url);await page.waitForFunction(()=>window.cc?.director.getScene()?.name==='Main',{}, {timeout:30000});await tap('继续');await wait(s=>s.state?.progress.nodeId===id&&s.buttons.some(b=>b.title==='返回书桌'));
  const drag=async()=>{const s=(await snap()).scrolls[0];assert.ok(s);const cdp=await context.newCDPSession(page),x=s.x,y=s.y+s.height*.38;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=7;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-s.height*.65*i/7}]});await page.waitForTimeout(35)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(400);await cdp.detach();};
  const shot=async suffix=>{const s=await snap(),file=`${viewport.width}x${viewport.height}-${id}-${suffix}.png`;for(const b of s.buttons){assert.ok(b.x-b.width/2>=-1&&b.x+b.width/2<=viewport.width+1);assert.ok(b.y-b.height/2>=-1&&b.y+b.height/2<=viewport.height+1);}await page.screenshot({path:path.join(out,file)});shots.push({id,viewport,file,labels:s.labels,buttons:s.buttons});};
  return{context,page,snap,tap,wait,drag,shot,blocked};
 };
 if(process.env.PHONE_CHECK_PHASE!=='surfaces') for(const id of phoneIds){const t=await open(id),source=nodes.get(id),expected=source.paragraphs.flatMap(p=>p.speaker?[speakers[p.speaker]??p.speaker,p.text]:[p.text]);
  const s=await t.wait(s=>s.labels.filter(l=>l.node==='Paragraph').length===expected.length);assert.deepEqual(s.labels.filter(l=>l.node==='Paragraph').map(l=>l.text),expected);await t.wait(s=>s.images.some(a=>a.node===(source.lifeContext.time.year<2014?'Art-phone_early_v2':'Art-phone_current_v1')&&a.loaded));const before=facts(s.state);await t.drag();assert.deepEqual(facts((await t.snap()).state),before);await t.shot('original-order');
  await t.tap('继续');const after=await t.wait(s=>s.state?.progress.nodeId!==id);assert.ok(after.state.readNodeIds.includes(id));reports.push({id,result:'PASS',paragraphs:source.paragraphs.length,originalCopyAndOrderPreserved:true});await t.context.close();console.log('Phone '+id+' PASS');
 }
 if(reports.length) fs.writeFileSync(path.join(out,'phone-nodes.json'),JSON.stringify({result:'PASS',reports},null,2)+'\n');
 const targets=['CH02_EP05_MESSAGES','CH01_EP03_PHONE','CH08_EP04_CALL',memoryId],viewports=[{width:360,height:640},{width:390,height:780},{width:375,height:812},{width:412,height:915},{width:360,height:840}];
 for(const viewport of viewports)for(const id of targets){const t=await open(id,viewport,{night:true,extra:true});
  if(id===memoryId){await t.tap('对照这几段记录');const s=await t.wait(s=>s.labels.some(l=>l.node==='DocumentText'));assert.equal(s.labels.filter(l=>l.node==='DocumentText').map(l=>l.text).join(''),nodes.get(id).text.replace(/\n/g,''));assert.equal(s.labels.find(l=>l.node==='MemoryRecallText')?.text,recall);assert.ok(!s.state.flags.UNDERSTOOD_BREAKUP_TRUTH);}
  await t.shot('night-extra');const before=await t.snap();assert.ok(before.scrolls[0].max>0);await t.drag();const moved=await t.snap();assert.ok(moved.state.progress.readingOffset>0);assert.deepEqual(facts(moved.state),facts(before.state));
  await t.tap('返回书桌');const home=await t.wait(s=>s.buttons.some(b=>b.title==='从头开始')),saved=JSON.parse(home.raw);assert.equal(saved.progress.nodeId,id);assert.deepEqual(facts(saved),facts(before.state));await t.tap('继续');await t.wait(s=>s.state?.progress.nodeId===id);
  if(id===memoryId)await t.tap('对照这几段记录');await t.wait(s=>s.scrolls.length>0);assert.ok(Math.abs((await t.snap()).state.progress.readingOffset-saved.progress.readingOffset)<.005,'Restore the offset actually saved when return stopped inertia');
  reports.push({id,viewport,result:'PASS',nightExtra:true,scrollAndSaveFirstReturnRestored:true});await t.context.close();
 }
 for(const id of ['CH02_EP05_MESSAGES',memoryId]){const t=await open(id,undefined,{failImages:true});if(id===memoryId)await t.tap('对照这几段记录');await t.wait(s=>s.scrolls.length>0);await t.shot('all-images-unavailable');if(id===memoryId)assert.ok(!(await t.snap()).state.flags.UNDERSTOOD_BREAKUP_TRUTH);await t.tap(id===memoryId?'放回去':'继续');await t.wait(s=>s.state?.progress.nodeId!==id);reports.push({id,result:'PASS',imageFailureReadable:true,blocked:t.blocked.length});await t.context.close();}
 {
  const t=await open(memoryId);await t.page.evaluate(async()=>{const cc=await System.import('cc');window.__originalMemoryLoad=cc.resources.load;cc.resources.load=function(p,type,callback){if(p==='data/story/chapter08/ep05_put_back'){callback(Error('intentional presentation-source failure'),null);return}return window.__originalMemoryLoad.call(this,p,type,callback)};});await t.tap('对照这几段记录');const s=await t.wait(s=>s.labels.some(l=>l.node==='DocumentText'));assert.ok(!s.labels.some(l=>l.node==='MemoryRecallText'));assert.equal(s.labels.filter(l=>l.node==='DocumentText').map(l=>l.text).join(''),nodes.get(memoryId).text.replace(/\n/g,''));assert.ok(!s.state.flags.UNDERSTOOD_BREAKUP_TRUTH);await t.tap('放回去');const end=await t.wait(s=>s.state?.progress.nodeId!==memoryId);assert.ok(end.state.flags.UNDERSTOOD_BREAKUP_TRUTH);reports.push({id:memoryId,result:'PASS',presentationSourceFailureFallsBackToOriginalText:true});await t.context.close();
 }
 {
  const t=await open(memoryId,undefined,{legacy:true});await t.tap('对照这几段记录');const s=await t.wait(s=>s.labels.some(l=>l.node==='DocumentText'));assert.ok(!s.labels.some(l=>l.node==='MemoryRecallText'));assert.ok(!s.state.readNodeIds.includes('CH08_EP05_N001'));reports.push({id:memoryId,result:'PASS',missingPriorReadDoesNotInventRecollection:true});await t.context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'index.json'),JSON.stringify({result:'PASS',method:'Reachable domain-action initial fixtures; genuine H5 touch, scroll, save-first return and injected image/presentation-source failures. Return restores its actual saved offset, not a mid-inertia sample. No running story writes. Desktop phone-size checks, not physical phone or human reading.',phoneNodesInventory:phoneIds.length,phoneNodesCheckedThisRun:reports.filter(r=>r.originalCopyAndOrderPreserved).length,shots,reports,errors},null,2)+'\n');console.log(JSON.stringify({result:'PASS',phoneNodesCheckedThisRun:reports.filter(r=>r.originalCopyAndOrderPreserved).length,scenarios:reports.length,screens:shots.length,errors}));await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
