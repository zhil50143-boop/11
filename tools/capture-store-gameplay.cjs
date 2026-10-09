// Capture the running Cocos game. No generated UI, captions or extra voice.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.argv[2], out = path.resolve(process.argv[3] || 'work/store-capture');
if (!url) throw Error('Usage: node tools/capture-store-gameplay.cjs URL OUTPUT');
fs.mkdirSync(out, {recursive:true});
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE,
    args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const context = await browser.newContext({viewport:{width:540,height:960},deviceScaleFactor:2,hasTouch:true,isMobile:true});
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const snapshot = () => page.evaluate(() => {
      const cc=window.cc, scene=cc?.director.getScene(), labels=[], buttons=[];
      let state;
      function walk(n) {
        if (!n.activeInHierarchy) return;
        const manager=n.getComponent('StoryManager'); if(manager?.hasState())state=manager.state;
        const label=n.getComponent(cc.Label); if(label)labels.push(label.string);
        const b=n.getComponent(cc.Button);
        if(b?.interactable)buttons.push({text:n.children.find(c=>c.getComponent(cc.Label))?.getComponent(cc.Label)?.string,
          x:270+n.worldPosition.x/2,y:480-n.worldPosition.y/2});
        n.children.forEach(walk);
      }
      if(scene)walk(scene); return {state,labels,buttons};
    });
    const tap = async text => {
      await page.waitForFunction(text=>{
        let ready=false;function walk(n){if(!n.activeInHierarchy)return;
          if(n.getComponent(window.cc.Button)?.interactable&&n.children.some(c=>c.getComponent(window.cc.Label)?.string===text))ready=true;
          n.children.forEach(walk)}const scene=window.cc?.director.getScene();if(scene)walk(scene);return ready;
      },text,{timeout:30000});
      const b=(await snapshot()).buttons.find(b=>b.text===text); assert.ok(b,text);
      await page.touchscreen.tap(b.x,b.y);await page.waitForTimeout(1000);
    };
    await page.goto(url);
    await page.waitForFunction(()=>window.cc?.director.getScene()?.name==='Main',{}, {timeout:30000});
    await page.waitForTimeout(1500);
    assert.equal(await page.title(),'遗憾'); assert.ok((await snapshot()).labels.includes('遗憾'));
    await page.screenshot({path:path.join(out,'01-title.png')});
    await tap('继续'); await page.waitForTimeout(1500);
    await page.screenshot({path:path.join(out,'02-reading.png')});
    for(let i=0;i<8&&(await snapshot()).state?.progress.nodeId!=='CH01_EP02_C001';i++)await tap('继续');
    assert.equal((await snapshot()).state.progress.nodeId,'CH01_EP02_C001');
    await page.screenshot({path:path.join(out,'03-investigation.png')});
    const codec=await page.evaluate(()=>{
      const mime=['video/mp4;codecs=avc1.42001E','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
      if(!mime)throw Error('This browser cannot record MP4');
      const canvas=document.querySelector('canvas'),stream=canvas.captureStream(25), chunks=[];
      const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1800000});
      window.__storeRecording={recorder,chunks,stream,started:performance.now(),width:canvas.width,height:canvas.height};
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.start(500);return mime;
    });
    await page.waitForTimeout(5000); await tap('旧照片'); await page.waitForTimeout(5000);
    await page.screenshot({path:path.join(out,'04-photo.png')});
    await tap('翻面'); await page.waitForTimeout(6000);
    await page.screenshot({path:path.join(out,'05-photo-back.png')});
    await tap('放回去'); await page.waitForTimeout(3000); await tap('信封');
    await tap('查看信封'); await page.waitForTimeout(7000);
    await page.screenshot({path:path.join(out,'06-envelope.png')});
    await tap('放回去'); await page.waitForTimeout(5000);
    const result=await page.evaluate(()=>new Promise(resolve=>{
      const r=window.__storeRecording;
      r.recorder.onstop=()=>{
        const blob=new Blob(r.chunks,{type:r.recorder.mimeType}),reader=new FileReader();
        reader.onload=()=>resolve({data:reader.result,duration:(performance.now()-r.started)/1000,width:r.width,height:r.height});
        reader.readAsDataURL(blob);r.stream.getTracks().forEach(t=>t.stop());
      };r.recorder.stop();
    }));
    fs.writeFileSync(path.join(out,'gameplay.mp4'),Buffer.from(result.data.split(',')[1],'base64'));
    assert.ok(result.duration>=15);assert.ok(result.width>=540&&result.height>=540);assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({url,codec,duration:result.duration,width:result.width,
      height:result.height,source:'Actual Cocos H5 in desktop Chrome, touch viewport; not physical phone evidence',
      startNode:'CH01_EP02_C001',errors,additionalVoice:false,additionalCaptions:false},null,2));
    console.log(JSON.stringify({codec,duration:result.duration,width:result.width,height:result.height,errors}));
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
