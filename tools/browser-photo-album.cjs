const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),{loadStory,play}=require('./story-analysis-lib.cjs');
const [url,out='work/photo-album']=process.argv.slice(2);if(!url)throw Error('Usage: URL [output]');
const imagesOnly=process.argv.includes('--images-only');
const story=loadStory(),fixtures=new Map(),completed=play(story,undefined,'FULL',undefined,(node,state)=>{if(!fixtures.has(node.id))fixtures.set(node.id,structuredClone(state))}).state;
const entries=[['旧毕业照','VIEWED_OLD_PHOTO','CH01_EP02_PHOTO_001'],['刚洗好的毕业照','CH03_SEEN_GRADUATION_PHOTO','CH03_EP05_PHOTO'],['旧街','CH04_SEEN_STREET_PHOTO','CH04_EP05_PHOTO'],['楼下合照','CH07_SEEN_FAMILY_PHOTO','CH07_EP08_PHOTO']];
const reports=[],screens=[],errors=[];let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});fs.mkdirSync(out,{recursive:true});
 const open=async(seed=completed,viewport={width:390,height:780},theme='paper',options={})=>{
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  if(options.failImages)await page.route(/\/assets\/resources\/native\/.*\.(png|jpg)(?:\?|$)/,r=>r.abort('failed'));
  await page.addInitScript(({seed,theme,readonly})=>{if(sessionStorage.getItem('album.seeded'))return;sessionStorage.setItem('album.seeded','1');localStorage.setItem('yushengweiji.save.v1',typeof seed==='string'?seed:JSON.stringify(seed));localStorage.setItem('yushengweiji.reading.v1',JSON.stringify({version:1,font:'extra',theme,volume:1,reducedMotion:false}));window.__albumWrites=[];if(readonly){const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('yushengweiji.save.v1')){window.__albumWrites.push(k);throw Error('Read-only save writes prohibited')}return original.call(this,k,v)};}},{seed,theme,readonly:!options.allowSave});
  const snap=()=>page.evaluate(async()=>{const cc=await System.import('cc'),scene=cc.director.getScene(),rect=document.querySelector('canvas').getBoundingClientRect(),scale=Math.min(rect.width/1080,rect.height/1920),buttons=[],labels=[],scrolls=[],images=[];let state;
   function walk(n){if(!n.activeInHierarchy)return;const m=n.getComponent('StoryManager');if(m?.hasState())state=m.state;const l=n.getComponent(cc.Label);if(l)labels.push({node:n.name,text:l.string});const b=n.getComponent(cc.Button);if(b){const t=n.getComponent(cc.UITransform);buttons.push({title:n.children.find(c=>c.getComponent(cc.Label))?.getComponent(cc.Label)?.string,enabled:b.interactable,x:rect.x+rect.width/2+n.worldPosition.x*scale,y:rect.y+rect.height/2-n.worldPosition.y*scale,width:t.width*scale,height:t.height*scale});}const sv=n.getComponent(cc.ScrollView);if(sv){const t=n.getComponent(cc.UITransform);scrolls.push({x:rect.x+rect.width/2+n.worldPosition.x*scale,y:rect.y+rect.height/2-n.worldPosition.y*scale,height:t.height*scale,max:sv.getMaxScrollOffset().y,offset:sv.getScrollOffset().y});}if(n.name.startsWith('Art-')||n.name==='Photograph')images.push({name:n.name,loaded:!!n.getComponent(cc.Sprite)?.spriteFrame||!!n.children.find(c=>c.getComponent(cc.Sprite)?.spriteFrame)});for(const c of n.children)walk(c)}if(scene)walk(scene);return{scene:scene?.name,state,buttons,labels,scrolls,images,raw:localStorage.getItem('yushengweiji.save.v1'),writes:window.__albumWrites||[]};});
  const wait=async predicate=>{for(let i=0;i<250;i++){const s=await snap();if(predicate(s))return s;await page.waitForTimeout(100)}throw Error('State not ready')};
  const tap=async title=>{const s=await wait(s=>s.buttons.some(b=>b.title===title&&b.enabled));const b=s.buttons.find(b=>b.title===title&&b.enabled);await page.touchscreen.tap(b.x,b.y);await page.waitForTimeout(180)};
  const shot=async suffix=>{const file=`${viewport.width}x${viewport.height}-${theme}-${suffix}.png`;await page.screenshot({path:path.join(out,file)});screens.push(file)};
  await page.goto(url);await wait(s=>s.scene==='Main'&&s.buttons.some(b=>b.title==='相册'));
  return{context,page,snap,wait,tap,shot};
 };
 for(const viewport of (imagesOnly?[{width:360,height:640}]:[{width:360,height:640},{width:390,height:780},{width:375,height:812},{width:412,height:915},{width:360,height:840}]))for(const theme of (imagesOnly?['paper']:['paper','night'])){
  const t=await open(completed,viewport,theme),raw=(await t.snap()).raw;await t.tap('相册');let s=await t.wait(s=>s.buttons.some(b=>b.title==='旧毕业照'));
  assert.deepEqual(s.buttons.filter(b=>entries.some(e=>e[0]===b.title)).map(b=>b.title),entries.map(e=>e[0]));await t.wait(s=>s.images.some(a=>a.name==='Art-album_v1'&&a.loaded));await t.shot('album');
  for(const [title,flag,id] of entries){assert.equal(completed.flags[flag],true);await t.tap(title);s=await t.wait(s=>s.labels.some(l=>l.node==='DocumentText'));
   const node=story.nodes.get(id).node;assert.equal(s.labels.filter(l=>l.node==='DocumentText').map(l=>l.text).join(''),node.text.replace(/\n/g,''));assert.ok(s.buttons.some(b=>b.title==='返回相册'&&b.enabled));
   await t.wait(s=>s.images.some(a=>a.name==='Photograph'&&a.loaded));if(imagesOnly)await t.shot(id+'-front');
   await t.tap('翻面');s=await t.wait(s=>s.labels.some(l=>l.text===node.backText));assert.equal(s.raw,raw);assert.deepEqual(s.writes,[]);
   for(const b of s.buttons){assert.ok(b.x-b.width/2>=-1&&b.x+b.width/2<=viewport.width+1);assert.ok(b.y-b.height/2>=-1&&b.y+b.height/2<=viewport.height+1);}
   if(id===entries[0][2])await t.shot('old-photo-back');await t.tap('返回相册');await t.wait(s=>s.buttons.some(b=>b.title==='旧毕业照'));
  }
  await t.tap('返回书桌');s=await t.wait(s=>s.buttons.some(b=>b.title==='继续'));assert.equal(s.raw,raw);assert.deepEqual(s.writes,[]);reports.push({viewport,theme,result:'PASS',fourOriginalFrontsAndBacks:true,fourPhotographSpriteFramesLoaded:true,gameStorageByteIdentical:true,saveWrites:0});await t.context.close();
 }
 if(!imagesOnly){
 {
  const seed=fixtures.get(entries[0][2]),t=await open(seed);assert.ok(!seed.flags.VIEWED_OLD_PHOTO);const raw=(await t.snap()).raw;await t.tap('相册');const s=await t.wait(s=>s.labels.some(l=>l.text==='还没有放进来的照片。'));assert.ok(!s.buttons.some(b=>entries.some(e=>e[0]===b.title)));assert.equal(s.raw,raw);assert.deepEqual(s.writes,[]);await t.shot('entered-but-uncompleted');reports.push({result:'PASS',entryWithoutCompletionDoesNotRevealPhotos:true});await t.context.close();
 }
 for(const raw of ['{broken',JSON.stringify({...completed,saveVersion:3})]){
  const t=await open(raw);await t.tap('相册');const s=await t.wait(s=>s.labels.some(l=>l.text==='暂时读不了相册。原存档仍保留。'));assert.equal(s.raw,raw);assert.deepEqual(s.writes,[]);assert.ok(s.buttons.some(b=>b.title==='相册'&&b.enabled));reports.push({result:'PASS',unreadableOrFutureSavePreserved:true,retryAvailable:true});await t.context.close();
 }
 {
  const seed=structuredClone(completed);for(const [title,flag]of entries)seed.flags[flag]=title==='旧街';const t=await open(seed);await t.tap('相册');const s=await t.wait(s=>s.buttons.some(b=>b.title==='旧街'));assert.deepEqual(s.buttons.filter(b=>entries.some(e=>e[0]===b.title)).map(b=>b.title),['旧街']);reports.push({result:'PASS',onlyCompletedFlagPhotosShown:true});await t.context.close();
 }
 {
  const t=await open(completed,undefined,'paper',{failImages:true}),raw=(await t.snap()).raw;await t.tap('相册');await t.tap('旧毕业照');await t.wait(s=>s.labels.some(l=>l.text==='照片暂时没能打开。下面仍可读文字。'));await t.tap('翻面');assert.ok((await t.snap()).labels.some(l=>l.text===story.nodes.get(entries[0][2]).node.backText));assert.equal((await t.snap()).raw,raw);reports.push({result:'PASS',imageFailureRetainsOriginalTextAndBack:true});await t.shot('image-failure');await t.context.close();
 }
 {
  const t=await open();await t.page.evaluate(async()=>{const cc=await System.import('cc'),original=cc.resources.load;cc.resources.load=function(p,type,callback){if(p==='data/story/chapter01/ep02_box'){callback(Error('intentional photo source failure'),null);return}return original.call(this,p,type,callback)}});const raw=(await t.snap()).raw;await t.tap('相册');await t.tap('旧毕业照');await t.wait(s=>s.labels.some(l=>l.text==='这张照片暂时没能打开，请稍后再看。'));await t.tap('返回相册');assert.equal((await t.snap()).raw,raw);reports.push({result:'PASS',sourceFailureReturnsWithoutStateMutation:true});await t.context.close();
 }
 {
  const t=await open();await t.page.evaluate(async()=>{const cc=await System.import('cc'),original=cc.resources.load;cc.resources.load=function(p,type,callback){if(p==='data/story/chapter01/ep02_box')return original.call(this,p,type,(e,a)=>{window.__lateAlbum=()=>callback(e,a)});return original.call(this,p,type,callback)}});await t.tap('相册');await t.tap('旧毕业照');await t.page.waitForFunction(()=>!!window.__lateAlbum);await t.tap('返回相册');await t.tap('返回书桌');const before=(await t.snap()).raw;await t.page.evaluate(()=>window.__lateAlbum());await t.page.waitForTimeout(500);const s=await t.snap();assert.ok(s.buttons.some(b=>b.title==='继续'));assert.ok(!s.labels.some(l=>l.node==='DocumentText'));assert.equal(s.raw,before);reports.push({result:'PASS',lateSourceCallbackCannotReplaceHome:true});await t.context.close();
 }
 {
  const t=await open(fixtures.get(entries[0][2]),{width:360,height:640},'night',{allowSave:true});await t.tap('继续');await t.wait(s=>s.state?.progress.nodeId===entries[0][2]&&s.scrolls.some(x=>x.max>0));let s=await t.snap(),scroll=s.scrolls[0];
  const cdp=await t.context.newCDPSession(t.page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:scroll.x,y:scroll.y+scroll.height*.32}]});for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:scroll.x,y:scroll.y+scroll.height*.32-scroll.height*.60*i/6}]});await t.page.waitForTimeout(45)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await t.wait(s=>s.state.progress.readingOffset>.01);await t.tap('返回书桌');const saved=JSON.parse((await t.wait(s=>s.buttons.some(b=>b.title==='相册'))).raw);assert.ok(saved.progress.readingOffset>.01);assert.ok(!saved.flags.VIEWED_OLD_PHOTO);
  await t.tap('继续');s=await t.wait(s=>s.state?.progress.nodeId===entries[0][2]&&s.scrolls.length);assert.ok(Math.abs(s.state.progress.readingOffset-saved.progress.readingOffset)<.005);await t.page.reload();s=await t.wait(s=>s.buttons.some(b=>b.title==='继续'));await t.tap('继续');s=await t.wait(s=>s.state?.progress.nodeId===entries[0][2]&&s.scrolls.length);assert.ok(Math.abs(s.state.progress.readingOffset-saved.progress.readingOffset)<.005);assert.ok(!s.state.flags.VIEWED_OLD_PHOTO);await t.shot('photo-offset-restored');reports.push({result:'PASS',actualPhotoScrollSavedOffset:saved.progress.readingOffset,returnAndRefreshRestoreDescription:true,noPrematureCompletion:true});await t.context.close();
 }
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'index.json'),JSON.stringify({result:'PASS',method:imagesOnly?'Focused actual album opening, four original photograph SpriteFrames loaded, four original fronts/backs and byte-identical save in one day largest-font viewport. No repeated fault/scroll suite.':'Actual final H5 touch with reachable domain-action fixtures in isolated browser contexts; original four photo fronts/backs, completion gates and byte-identical save. Real story photo drag/save-first return/refresh. Injected image/source failures, corrupt/future save and late callback. Desktop viewports, not physical phone or human long reading.',reports,screens,errors},null,2)+'\n');console.log(JSON.stringify({result:'PASS',scenarios:reports.length,screens:screens.length,errors}));await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
