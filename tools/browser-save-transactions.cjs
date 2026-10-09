const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createInitialState}=require('../work/core/core/GameState.js');
const {loadStory,play,baseChoices}=require('./story-analysis-lib.cjs');
const [url,output]=process.argv.slice(2);if(!output)throw Error('Usage: URL output-directory');
const story=loadStory(),byId=id=>story.records.find(r=>r.node.id===id),key='yushengweiji.save.v1',reports=[],errors=[];
fs.mkdirSync(output,{recursive:true});let browser;
function seed(id){const r=byId(id),s=createInitialState();s.progress={chapterId:r.chapter,episodeId:r.episode,nodeId:id,readingOffset:0};return s}
(async()=>{
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  async function open(initial,width=540,height=960){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(({raw,key})=>{
      if(!sessionStorage.getItem('save.transaction.fixture')){localStorage.setItem(key,raw);sessionStorage.setItem('save.transaction.fixture','1')}
      const set=Storage.prototype.setItem;window.__saveFault='';
      Storage.prototype.setItem=function(k,v){
        if(this===localStorage&&k===key){const s=JSON.parse(v),f=window.__saveFault;
          if(f==='all'||f==='chapter:'+s.progress.chapterId||f==='episode:'+s.progress.episodeId)throw new DOMException('Injected quota failure','QuotaExceededError');
        }return set.call(this,k,v);
      };
    },{raw:JSON.stringify(initial),key});
    const snap=()=>page.evaluate(async key=>{
      const cc=await System.import('cc'),scene=cc.director.getScene(),rect=document.querySelector('canvas').getBoundingClientRect(),scale=Math.min(rect.width/1080,rect.height/1920),labels=[],buttons=[],scrolls=[];let manager,audio;
      function walk(n){if(!n.activeInHierarchy)return;const m=n.getComponent('StoryManager');if(m?.hasState())manager=m;const source=n.getComponent(cc.AudioSource);if(source)audio={uuid:source.uuid,clip:source.clip?.uuid,playing:source.playing};const l=n.getComponent(cc.Label);if(l)labels.push(l.string);const b=n.getComponent(cc.Button);if(b)buttons.push({title:n.children.find(c=>c.getComponent(cc.Label))?.getComponent(cc.Label)?.string,enabled:b.interactable,x:rect.x+rect.width/2+n.worldPosition.x*scale,y:rect.y+rect.height/2-n.worldPosition.y*scale});const s=n.getComponent(cc.ScrollView);if(s)scrolls.push({offset:s.getScrollOffset().y,max:s.getMaxScrollOffset().y});for(const c of n.children)walk(c)}if(scene)walk(scene);
      return{scene:scene?.name,state:manager?.state,raw:localStorage.getItem(key),labels,buttons,scrolls,audio,pendingRequests:manager?.pending?.size,failedAction:!!manager?.failedSaveAction};
    },key);
    async function tap(title){for(let i=0;i<150;i++){const b=(await snap()).buttons.find(b=>b.title===title&&b.enabled);if(b){await page.touchscreen.tap(b.x,b.y);await page.waitForTimeout(400);return}await page.waitForTimeout(100)}throw Error('Missing touch button '+title)}
    async function swipe(){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width*.48,y:height*.73}]});for(let y=height*.69;y>=height*.36;y-=height*.045){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width*.48,y}]});await page.waitForTimeout(15)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach()}
    async function readEnd(title){for(let i=0;i<24;i++){const s=await snap();if(s.buttons.some(b=>b.title===title&&b.enabled))return;await swipe();await page.waitForTimeout(250)}throw Error('Reading end not reached')}
    await page.goto(url);await tap('继续');await page.waitForTimeout(900);return{context,page,snap,tap,swipe,readEnd};
  }
  async function operation(name,initial,prepare,action,expected,{fault='all',width=540,height=960,retainAudio=false}={}){
    const t=await open(initial,width,height);if(prepare)await prepare(t);await t.page.waitForTimeout(700);const before=await t.snap();
    await t.page.evaluate(f=>{window.__saveFault=f},fault);await action(t);const failed=await t.snap();
    if(fault==='all'){assert.equal(failed.raw,before.raw,name+' keeps exact primary');assert.deepEqual(failed.state,before.state,name+' keeps committed runtime')}
    else{assert.equal(failed.state.progress.nodeId,JSON.parse(failed.raw).progress.nodeId);assert.deepEqual(failed.state.flags,JSON.parse(failed.raw).flags)}
    assert.ok(failed.failedAction,name+' retains failed action');assert.ok(failed.labels.some(s=>s.includes('未能保存')));assert.ok(failed.buttons.some(b=>b.title==='重试保存'&&b.enabled));
    if(retainAudio){assert.ok(before.audio?.playing);assert.equal(failed.audio?.uuid,before.audio.uuid);assert.equal(failed.audio?.clip,before.audio.clip);assert.ok(failed.audio.playing);await t.tap('暂停 / 继续播放');assert.equal((await t.snap()).audio.playing,false);await t.tap('暂停 / 继续播放');assert.equal((await t.snap()).audio.playing,true)}
    await t.page.screenshot({path:path.join(output,name+'-failed.png')});
    // More input is gated until the pending commit is retried; it cannot select
    // another branch or apply the preceding effects twice.
    await action(t);const repeated=await t.snap();assert.deepEqual(repeated.state,failed.state);assert.equal(repeated.raw,failed.raw);
    await t.page.evaluate(()=>{window.__saveFault=''});await t.tap('重试保存');await t.page.waitForTimeout(900);const recovered=await t.snap();
    assert.equal(recovered.state.progress.nodeId,expected);assert.deepEqual(JSON.parse(recovered.raw),recovered.state);assert.ok(!recovered.failedAction);assert.ok(!recovered.labels.some(s=>s.includes('未能保存')));assert.equal(recovered.pendingRequests,0);
    if(retainAudio)assert.equal(recovered.audio,undefined,'Successful commit disposes preceding audio');
    await t.page.screenshot({path:path.join(output,name+'-recovered.png')});
    await t.page.reload();await t.tap('继续');await t.page.waitForTimeout(800);const restored=await t.snap();assert.equal(restored.state.progress.nodeId,expected);assert.deepEqual(restored.state.flags,recovered.state.flags);assert.deepEqual(restored.state.readNodeIds,recovered.state.readNodeIds);
    reports.push({name,rawPreserved:fault==='all',durableBoundaryPreserved:fault!=='all',pendingActionGated:true,retriedAndReloaded:true,from:before.state.progress.nodeId,failedAt:failed.state.progress.nodeId,to:expected,pendingRequestsAfterSettlement:0,...(retainAudio?{originalClipRetainedAndPauseResumed:true,disposedAfterRetry:true}:{}),viewport:{width,height}});await t.context.close();
  }
  const first=byId('CH01_EP01_N001');await operation('ordinary-passage',seed(first.node.id),null,t=>t.tap('继续'),first.node.next);
  const choice=byId('CH01_EP02_C002'),option=choice.node.options.find(o=>o.id==='B');await operation('major-decision',seed(choice.node.id),null,t=>t.tap(option.text),option.next);
  const photo=byId('CH01_EP02_PHOTO_001');await operation('photo-evidence',seed(photo.node.id),t=>t.tap('翻面'),t=>t.tap('放回去'),photo.node.next);
  const letter=byId('CH08_EP03_LETTER');await operation('full-letter-evidence',seed(letter.node.id),async t=>{await t.tap(letter.node.actionText||'查看');await t.readEnd('放回去')},t=>t.tap('放回去'),letter.node.next);
  const recording=byId('CH08_EP03_AUDIO');await operation('full-recording-evidence',seed(recording.node.id),async t=>{await t.tap('查看录音文字');await t.readEnd('继续')},t=>t.tap('继续'),recording.node.next);
  const opening=byId('CH01_EP04_N002');await operation('playing-recording-save-failure',seed(opening.node.id),t=>t.tap('播放'),t=>t.tap('继续'),opening.node.next,{retainAudio:true});
  const investigation=byId('CH01_EP02_C001'),ready=seed(investigation.node.id);for(const f of investigation.node.requiredFlags)ready.flags[f]=true;
  await operation('investigation-completion',ready,null,t=>t.tap(investigation.node.doneText||'收好纸箱'),investigation.node.next);
  const boundary=story.records.find(r=>r.episode==='CH01_EP04'&&r.node.next==='CH01_EP04_END'&&['passage','phone'].includes(r.node.type));
  await operation('chapter-write-failure',seed(boundary.node.id),null,t=>t.tap('继续'),'CH02_EP01_N001',{fault:'chapter:CH02'});
  const epBoundary=story.records.find(r=>r.episode==='CH01_EP01'&&r.node.next==='CH01_EP01_END'&&['passage','phone'].includes(r.node.type));
  await operation('episode-write-failure',seed(epBoundary.node.id),null,t=>t.tap('继续'),story.chapters[0].episodes[1].data.startNode,{fault:'episode:CH01_EP02'});
  let endSeed;play(story,baseChoices,'FULL',createInitialState(),(n,s)=>{if(n.type==='ending')endSeed=structuredClone(s)});
  await operation('ending-write-failure',endSeed,null,t=>t.tap('继续'),endSeed.progress.nodeId);
  const complete=play(story,baseChoices,'FULL').state;await operation('next-round-write-failure',complete,null,t=>t.tap('再读一遍'),'CH01_EP01_N001');
  for(const kind of ['background','pagehide']){
    const t=await open(seed(first.node.id));await t.page.evaluate(()=>{window.__saveFault='all'});await t.swipe();
    await t.page.evaluate(async kind=>{if(kind==='pagehide')window.dispatchEvent(new PageTransitionEvent('pagehide'));else{const cc=await System.import('cc');cc.game.emit(cc.Game.EVENT_HIDE)}},kind);
    const failed=await t.snap();assert.ok(failed.state.progress.readingOffset>0);assert.ok(failed.labels.some(s=>s.includes('未能保存')));
    if(kind==='background'){await t.page.evaluate(async()=>{const cc=await System.import('cc');cc.game.emit(cc.Game.EVENT_SHOW)});await t.page.waitForTimeout(500);assert.ok((await t.snap()).labels.some(s=>s.includes('未能保存')))}
    await t.page.screenshot({path:path.join(output,kind+'-failed.png')});await t.page.evaluate(()=>{window.__saveFault=''});await t.tap('重试保存');const recovered=await t.snap();assert.equal(JSON.parse(recovered.raw).progress.readingOffset,recovered.state.progress.readingOffset);assert.deepEqual(recovered.state.flags,failed.state.flags);
    await t.page.reload();await t.tap('继续');await t.page.waitForTimeout(900);const restored=await t.snap();assert.ok(Math.abs(restored.state.progress.readingOffset-recovered.state.progress.readingOffset)<.01);
    reports.push({name:kind+'-scroll-save',warningSurvivesShow:true,offset:recovered.state.progress.readingOffset,reloadedOffset:restored.state.progress.readingOffset,viewport:{width:540,height:960}});await t.context.close();
  }
  await operation('narrow-screen-decision',seed(choice.node.id),null,t=>t.tap(option.text),option.next,{width:320,height:694});
  assert.equal(errors.length,0);const report={result:'PASS',method:'Isolated source-derived save fixtures, actual Cocos H5 touchscreen actions and Storage.setItem fault injection. No mutation of live story state. Background/pagehide events simulate app hooks, not physical TapTap acceptance.',scenarios:reports,errors};
  fs.writeFileSync(path.join(output,'index.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,scenarios:reports.length,errors}));await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
