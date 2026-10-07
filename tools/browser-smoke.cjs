const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const data=path.resolve(__dirname,'../assets/resources/data/story/chapter01');
const nodes=new Map(fs.readdirSync(data).filter(f=>f.endsWith('.json')&&!f.includes('manifest')).flatMap(f=>JSON.parse(fs.readFileSync(path.join(data,f))).nodes).map(n=>[n.id,n]));
const out=path.resolve(process.argv[3] || path.join(__dirname,'../work/browser-report')),errors=[],requests=[],visited=[];fs.mkdirSync(out,{recursive:true});
const url=process.argv[2];if(!url)throw new Error('Usage: node tools/browser-smoke.cjs http://127.0.0.1:PORT [report-directory]');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:540,height:960},hasTouch:true,isMobile:true});const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)requests.push({url:r.url(),status:r.status()})});
 const snapshot=()=>page.evaluate(()=>{const cc=window.cc,scene=cc?.director.getScene();let manager;const labels=[],buttons=[],scrolls=[];function walk(n){if(!n.activeInHierarchy)return;const m=n.getComponent('StoryManager');if(m?.hasState())manager=m;const label=n.getComponent(cc.Label);if(label)labels.push(label.string);const b=n.getComponent(cc.Button);if(b){const t=n.children.find(c=>c.getComponent(cc.Label))?.getComponent(cc.Label)?.string;buttons.push({title:t,x:270+n.worldPosition.x/2,y:480-n.worldPosition.y/2,enabled:b.interactable})}const scroll=n.getComponent(cc.ScrollView);if(scroll)scrolls.push({offset:scroll.getScrollOffset().y,max:scroll.getMaxScrollOffset().y});for(const c of n.children)walk(c)}if(scene)walk(scene);return{scene:scene?.name,labels,buttons,scrolls,state:manager?.state,save:localStorage.getItem('yushengweiji.save.v1'),title:document.title}});
 const tap=async title=>{let s=await snapshot();let b=s.buttons.find(b=>b.title===title&&b.enabled);assert.ok(b,'Missing active button '+title+' at '+s.state?.progress.nodeId);await page.touchscreen.tap(b.x,b.y);await page.waitForTimeout(400)};
 const reload=async()=>{let before=(await snapshot()).state;await page.reload();await page.waitForTimeout(2200);await tap('继续');await page.waitForTimeout(800);const after=(await snapshot()).state;assert.equal(after.progress.nodeId,before.progress.nodeId);assert.deepEqual(after.flags,before.flags);assert.deepEqual(after.stats,before.stats);return after};
 await page.goto(url);await page.waitForTimeout(5000);await page.screenshot({path:path.join(out,'chapter01-menu.png')});await tap('继续');await page.waitForTimeout(800);
 let first=await snapshot();assert.ok(first.scrolls[0].max>0);const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:260,y:680}]});
 for(let y=650;y>=590;y-=20){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:260,y}]});await page.waitForTimeout(80)}
 await page.waitForTimeout(500);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(1300);
 const scrolled=await snapshot();assert.ok(scrolled.state.progress.readingOffset>0.1,'Drag must scroll and persist');const offset=scrolled.state.progress.readingOffset;
 await reload();const restored=await snapshot();assert.ok(Math.abs(restored.state.progress.readingOffset-offset)<0.03,'Reading offset state restored');assert.ok(Math.abs(restored.scrolls[0].offset/restored.scrolls[0].max-offset)<0.03,'Reading offset UI restored');
 await page.screenshot({path:path.join(out,'chapter01-reading.png')});
 const inspected=new Set(),resumed=new Set(['passage']);
 for(let guard=0;guard<80;guard++){
  let s=await snapshot();if(s.labels.includes('第一章片段结束。'))break;
  const n=nodes.get(s.state?.progress.nodeId);assert.ok(n,'Unknown displayed node');visited.push(n.id);
  if(!resumed.has(n.type)){await reload();resumed.add(n.type);s=await snapshot()}
  if(n.type==='passage'||n.type==='phone')await tap('继续');
  else if(n.type==='investigation'){
   const item=n.items.find(i=>!inspected.has(i.id));if(item){inspected.add(item.id);await tap(item.text+(s.state.flags[item.viewedFlag]?'（看过）':''))}else await tap('收好纸箱');
  }else if(n.type==='photo'){if(n.backText)await tap('翻面');await tap('放回去')}
  else if(n.type==='letter'){await tap(n.actionText??'查看');await tap('放回去')}
  else if(n.type==='choice'){await page.screenshot({path:path.join(out,'chapter01-decision.png')});await tap(n.options[1].text)}
  else if(n.type==='audioInteraction'){await tap('播放');assert.ok((await snapshot()).labels.includes('录音暂时无法播放。可以读文字继续。'));await tap('继续')}
  else if(n.type==='transition'){await page.waitForTimeout(600);await tap('继续')}
  else throw new Error('Unexpected '+n.type);
  if(n.id==='CH01_EP04_BUS')await page.screenshot({path:path.join(out,'chapter01-bus.png')});
 }
 let end=await snapshot();assert.ok(end.labels.includes('第一章片段结束。'));assert.equal(end.state.life.time.year,2007);assert.equal(end.state.life.stage,'student');assert.ok(end.state.flags.TOLD_PARTNER_XIA);assert.ok(visited.includes('CH01_EP03_N006A'));assert.ok(!visited.includes('CH01_EP03_N006B'));
 await reload();assert.ok((await snapshot()).labels.includes('第一章片段结束。'));
 const report={viewport:'540x960 touch',title:end.title,visited,inspectionItems:inspected.size,readingOffset:offset,resumedTypes:[...resumed],endState:end.state,errors,failedRequests:requests};fs.writeFileSync(path.join(out,'browser-smoke.json'),JSON.stringify(report,null,2));
 assert.equal(errors.filter(e=>!e.includes('404')).length,0);assert.equal(requests.filter(r=>!r.url.endsWith('/favicon.ico')).length,0);
 console.log(JSON.stringify({result:'PASS',visitedNodes:visited.length,inspectionItems:inspected.size,readingOffset:offset,resumedTypes:[...resumed],errors,requests},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

