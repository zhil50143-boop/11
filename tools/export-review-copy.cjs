// Export every branch directly from the shipped catalog, not a single playthrough.
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto'), assert=require('node:assert/strict'), ts=require('typescript');
const root=path.resolve(__dirname,'..'), target=path.resolve(process.argv[2]||path.join(root,'docs/PLATFORM_REVIEW_COPY.md'));
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const chinese=/[\u3400-\u9fff]/;
const records=[], inputs=[], nodes=[], sections=[], contextRows=[];
const inventory=(file,object)=>{
 inputs.push({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')});
 const visit=(v,key)=>{if(typeof v==='string'&&chinese.test(v))records.push({file,path:key,text:v});else if(v&&typeof v==='object')for(const[k,x]of Object.entries(v))visit(x,key?(Array.isArray(v)?key+'['+k+']':key+'.'+k):k)};
 visit(object,'');
};
const resource=r=>'assets/resources/'+r+'.json';
const presentationFile='assets/resources/data/presentation.json', presentation=read(presentationFile);inventory(presentationFile,presentation);
const catalogFile='assets/resources/data/story/catalog.json',catalog=read(catalogFile);inventory(catalogFile,catalog);
const known=new Set(['id','type','next','lifeContext','setFlags','title','category','paragraphs','text','speaker','expression','position','prompt','consequence','options','branches','fallback','actionText','backText','resource','from','to','transcript','requireReadToEnd','requiredHint','doneText','optional','items','requiredFlags','effects','targets','endingId']);
const names={passage:'生活正文',phone:'电话／短信',dialogue:'对白',narration:'叙述',choice:'重要决定',investigation:'旧物调查',photo:'照片',letter:'信件／纸页',audioInteraction:'录音',transition:'时间转场',ending:'结局'};
let chapterCount=0,episodeCount=0,endingCount=0;
for(const ref of catalog.chapters){
 const manifestFile=resource(ref.resource), manifest=read(manifestFile);inventory(manifestFile,manifest);chapterCount++;
 sections.push('## 第'+chapterCount+'章 '+manifest.title+'\n');
 for(const epref of manifest.episodes){
  const file=resource(epref.resource),episode=read(file);inventory(file,episode);episodeCount++;
  sections.push('### '+episode.name+'\n');
  for(const node of episode.nodes){
   for(const key of Object.keys(node))assert.ok(known.has(key),'Unmapped story field '+file+':'+node.id+'.'+key);
   nodes.push({chapter:ref.id,episode:episode.episodeId,id:node.id,type:node.type,file});
   if(node.lifeContext)contextRows.push({id:node.id,file,context:node.lifeContext});
   if(['condition','endingRoute','save','episodeEnd'].includes(node.type))continue;
   const meta=node.lifeContext?.time;
   const lines=['#### '+(node.title||names[node.type]||node.type)+'\n','原文位置：'+node.id+'（'+file+'）\n'];
   if(meta)lines.push('场景标注：'+meta.label+'｜'+meta.location+'\n');
   if(node.title)lines.push('标题：'+node.title+'\n');
   if(node.text)lines.push((node.speaker?(presentation.speakers[node.speaker]||node.speaker)+'：':'')+node.text+'\n');
   for(const p of node.paragraphs||[])lines.push((p.speaker?(presentation.speakers[p.speaker]||p.speaker)+'：':'')+p.text+'\n');
   if(node.prompt)lines.push('选择提示：'+node.prompt+'\n');
   if(node.consequence)lines.push('选择背景说明（数据原文，不作为新增界面内容）：'+node.consequence+'\n');
   for(const o of node.options||[])lines.push('- 选项'+o.id+'：'+o.text);
   for(const o of node.items||[])lines.push('- 调查入口：'+o.text);
   if(node.backText)lines.push('\n照片背面：\n\n'+node.backText+'\n');
   if(node.transcript)lines.push('录音文字：\n\n'+node.transcript+'\n');
   for(const[key,label]of [['actionText','展开操作'],['requiredHint','调查提示'],['doneText','收起操作'],['from','转场起点'],['to','转场终点']])if(node[key])lines.push(label+'：'+node[key]+'\n');
   if(node.type==='ending')endingCount++;
   sections.push(lines.join('\n')+'\n');
  }
 }
}
assert.equal(chapterCount,10);assert.equal(episodeCount,60);assert.equal(nodes.length,467);assert.equal(endingCount,6);
const uiRows=[];
const walk=dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(dir+'/'+d.name):d.name.endsWith('.ts')?[dir+'/'+d.name]:[]);
for(const file of walk('assets/scripts').filter(f=>!f.includes('/vendor/'))){
 const raw=fs.readFileSync(path.join(root,file),'utf8'),source=ts.createSourceFile(file,raw,ts.ScriptTarget.Latest,true);
 const visit=node=>{
  if((ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node))&&chinese.test(node.text)){
   const line=source.getLineAndCharacterOfPosition(node.getStart(source)).line+1;
   uiRows.push({file,line,text:node.text,format:'literal'});
  }else if(ts.isTemplateExpression(node)&&chinese.test(node.getText(source))){
   const line=source.getLineAndCharacterOfPosition(node.getStart(source)).line+1;
   uiRows.push({file,line,text:node.getText(source),format:'template'});
  }
  ts.forEachChild(node,visit);
 };visit(source);
 inputs.push({file,sha256:crypto.createHash('sha256').update(raw).digest('hex')});
}
sections.push('## 界面、操作、存档与异常提示全集\n\n下列直接提取当前游戏源码中的中文文字，含加载、按钮、翻面、播放、阅读、重读、存档及异常情况。为保守覆盖，也收录源码内部背景和诊断的中文常量；它们不全部展示给玩家，可按来源区分。重复原文按来源保留。模板中的动态部分按源码保留，人物与场景变量来自前面的实际正文与场景标注。\n');
for(const row of uiRows)sections.push('### '+row.file+':'+row.line+'\n\n'+row.text+'\n');
sections.push('## 人物显示名称与默认场景\n');
for(const [id,name]of Object.entries(presentation.speakers))sections.push('- '+id+'：'+name);
sections.push('\n默认现实标注：'+presentation.present+'\n\n默认回忆标注：'+presentation.memory+'\n');
const audioFile='art/original/audio/manifest.json',audio=read(audioFile);
sections.push('## 实际录音口述台词\n\n第三版两名角色音色已由用户确认固定。以下按音频制作清单保留实际口述台词，不以识别转写替换。完整录音约63.53秒；第一章只使用前16.66秒，第八章使用完整文件。\n');
for(const event of audio.events)sections.push(event.role+'（'+event.start.toFixed(2)+'～'+event.end.toFixed(2)+'秒）：'+event.text+'\n');
sections.push('## 原始文字覆盖附录\n\n为避免任一分支、场景标注或背景文字遗漏，以下逐条保留所有入包剧情及人物JSON中的中文字符串。主文已整理阅读顺序；这里包含重复场景与内部关系背景原文，后者并不展示为关系分数。控制标识、数值、资源路径不是玩家文案，不计入本文字表；完整节点清单另见JSON索引。\n');
for(const r of records)sections.push('来源：'+r.file+'｜'+r.path+'\n\n'+r.text+'\n');
let sourceCommit;try{sourceCommit=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()}catch{sourceCommit='unknown'}
const header='# 《余生未寄》全部游戏文案审核汇总\n\n版本：1.0.0-rc.2｜整理日期：2026-10-08｜剧情与界面源码基线：'+sourceCommit+'\n\n本汇总从当前实际入包清单与游戏源码生成，完整收录十章、所有条件分支、选择、旧物、短信、照片背文、信件、录音、六个结局及界面提示，包含剧透和隐藏结局。共10章、60片段、467个节点、6个结局，不是单条通关路线或剧情摘要。每处保留来源以便GPT/平台核对，原文不改写。\n\n当前为发布候选：音色已确认；真人阅读节奏、TapTap实际容器与手机尚待验收。本汇总不代表平台已审核或已发布。最终版本将按最终提交重新生成，后续任何文案修改都需重导出。照片与声音二进制另随源码/素材保留，本文不把图像鉴定或ASR当作内容批准。\n\n';
const body=header+sections.join('\n');
// The raw appendix is an exhaustive coverage witness independent of the formatted body.
assert.ok(records.every(r=>body.includes(r.text)),'Missing JSON copy');assert.ok(uiRows.every(r=>body.includes(r.text)),'Missing source copy');
fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,body,'utf8');
const index={version:'1.0.0-rc.2',sourceCommit,chapters:chapterCount,episodes:episodeCount,nodeCount:nodes.length,endings:endingCount,jsonTextEntries:records.length,sourceTextEntries:uiRows.length,coverage:{json:'all Chinese string values, no branch filtering',source:'all Chinese TypeScript literals/templates outside vendor',voice:'all manifest events'},nodes,textRecords:records,interfaceText:uiRows,inputs,export:{bytes:Buffer.byteLength(body),sha256:crypto.createHash('sha256').update(body).digest('hex')},limitations:['Current candidate, regenerate on final commit','Images/audio require separate review','Human reading and physical TapTap device pending']};
fs.writeFileSync(target.replace(/\.md$/i,'.index.json'),JSON.stringify(index,null,2)+'\n');
console.log(JSON.stringify({file:target,chapters:chapterCount,episodes:episodeCount,nodes:nodes.length,endings:endingCount,jsonTextEntries:records.length,sourceTextEntries:uiRows.length,bytes:index.export.bytes,sha256:index.export.sha256},null,2));
