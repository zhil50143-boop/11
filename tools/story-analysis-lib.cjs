const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),resources=path.join(root,'assets/resources');
const read=r=>JSON.parse(fs.readFileSync(path.join(resources,r+'.json'),'utf8'));
function loadStory(){
 const catalog=read('data/story/catalog'),chapters=catalog.chapters.map(c=>({...read(c.resource),episodes:read(c.resource).episodes.map(e=>({...e,data:read(e.resource)}))}));
 const records=chapters.flatMap(c=>c.episodes.flatMap(e=>e.data.nodes.map(n=>({chapter:c.chapterId,chapterTitle:c.title,episode:e.id,episodeTitle:e.name,file:'assets/resources/'+e.resource+'.json',node:n}))));
 return{chapters,records,nodes:new Map(records.map(r=>[r.node.id,r])),inputHash:crypto.createHash('sha256').update(records.map(r=>JSON.stringify(r.node)).join('\n')).digest('hex')};
}
function prose(node){return[node.text,...(node.paragraphs||[]).map(p=>p.text),node.backText,node.transcript].filter(Boolean)}
const characters=text=>Array.from(text.replace(/\s/g,'')).length;
const baseChoices={CH01_EP02_C002:'B',CH02_EP06_CHOICE:'TELL',CH03_EP04_CHOICE:'DISCUSS',CH04_EP04_CHOICE:'ASK',CH05_EP05_CHOICE:'SHARE',CH07_EP04_CHOICE:'TOGETHER',CH09_EP01_CONTACT_CHOICE:'SEND',CH09_EP02_DISCLOSE_CHOICE:'TELL',CH09_EP04_MEETING_CHOICE:'MEET'};
function play(story,choices=baseChoices,evidence='FULL',state,onNode=()=>{}){
 const{StoryRuntime}=require('../work/core/story/StoryRuntime.js'),{createInitialState}=require('../work/core/core/GameState.js');state=state||createInitialState();const visited=[];
 for(const chapter of story.chapters)for(const episode of chapter.episodes){
  const runtime=new StoryRuntime(state,()=>{});runtime.load(episode.data,chapter.chapterId);let stopped=false;
  for(let guard=0;guard<100;guard++){
   const n=runtime.current();onNode(n,state);visited.push(n.id);
   if(n.type==='episodeEnd'){stopped=true;break}
   if(n.type==='ending'){runtime.finish(n.id);stopped=true;break}
   if(n.type==='choice')runtime.choose(choices[n.id]||n.options[0].id,n.id);
   else if(n.type==='investigation'){const item=n.items.find(i=>!state.flags[i.viewedFlag]&&(!n.optional||evidence==='FULL'||i.id===evidence));if(item)runtime.inspect(item.id,n.id);else runtime.complete(n.id)}
   else if(['passage','phone','narration','dialogue'].includes(n.type))runtime.advance(n.id);
   else{if(n.requireReadToEnd)state.progress.readingOffset=1;runtime.complete(n.id)}
  }
  if(!stopped)throw Error('Route guard exceeded: '+episode.id);
 }
 return{state,visited};
}
module.exports={loadStory,prose,characters,baseChoices,play};
