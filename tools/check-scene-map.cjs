const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm'),assert=require('node:assert/strict'),{loadStory,play,baseChoices}=require('./story-analysis-lib.cjs');
const moduleBox={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/ui/SharedScenes.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:moduleBox.exports});
const {sharedScene}=moduleBox.exports,story=loadStory(),states=new Map();
for(const evidence of ['FULL','NONE','LETTER','RECORDING'])for(const variant of [baseChoices,...story.records.filter(r=>r.node.type==='choice').flatMap(r=>r.node.options.map(o=>({...baseChoices,[r.node.id]:o.id})))]){
 play(story,variant,evidence,undefined,(n,s)=>{if(!states.has(n.id))states.set(n.id,structuredClone(s))});
}
const m=JSON.parse(fs.readFileSync('art/visual-v2/manifest.json')),assets=new Map(m.assets.map(a=>[a.id,a]));
const rows=story.records.filter(r=>['passage','choice','phone'].includes(r.node.type)).map(r=>{
 const t=r.node.lifeContext?.time||states.get(r.node.id)?.life.time;
 const scene=r.node.type==='phone'?(t?.year<2014?'phone_early_v2':'phone_current_v1'):t&&sharedScene(t,r.node.id);
 if(scene){assert.ok(assets.has(scene),scene);assert.ok(fs.existsSync(assets.get(scene).file));assert.ok(!['phone_early_v1','station_2013_v1','photo_shop_2007_v1'].includes(scene));}
 return{nodeId:r.node.id,chapter:r.chapter,type:r.node.type,time:t||null,scene:scene||null,reachableFixture:states.has(r.node.id),fallback:scene?null:'Same paper layout; unsupported exact place, mixed setting, season or time. No invented visual facts.'};
});
for(const chapter of story.chapters)assert.ok(rows.some(r=>r.chapter===chapter.chapterId&&r.scene),'No mapped scene in '+chapter.chapterId);
const known=rows.filter(r=>r.scene),used=[...new Set(known.map(r=>r.scene))],fallback=rows.filter(r=>!r.scene);
const report={result:'PASS',inputHash:story.inputHash,method:'Source presentation map and reachable domain-action fixtures, not physical or human visual acceptance. Source locations corrected only to existing prose.',renderableNodes:rows.length,mappedNodes:known.length,paperFallbackNodes:fallback.length,sceneAssetsUsed:used.length,used,rows};
fs.writeFileSync('docs/validation/V2_SCENE_MAP.json',JSON.stringify(report,null,2)+'\n');
for(const a of m.assets)if(used.includes(a.id)){a.productionStatus='Mapped presentation; source and desktop H5 checked, human and physical-device acceptance pending';a.useSites=rows.filter(r=>r.scene===a.id).map(r=>r.nodeId);}
fs.writeFileSync('art/visual-v2/manifest.json',JSON.stringify(m,null,2)+'\n');
console.log(JSON.stringify({result:report.result,renderableNodes:rows.length,mappedNodes:known.length,paperFallbackNodes:fallback.length,used}));
