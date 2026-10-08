const fs=require('node:fs'),path=require('node:path');const{loadStory,prose}=require('./story-analysis-lib.cjs');
const out=path.resolve(process.argv[2]||'docs/baseline');fs.mkdirSync(out,{recursive:true});const story=loadStory(),hits=[],frequencies={};
const rules=[['解释式结尾',/(?:原来(?!的|那)|也许|终究|终于明白|这才明白|他明白了|她明白了)/],['对称结论句',/(?:不是.{2,35}而是|没有.{2,25}只是)/],['时间感叹',/(?:很多年|这么多年|那些年|那一刻)/]];
const atmosphere=['沉默','窗外','雨','没有说话','没说话','低头','纸箱','饭桌'];
const spoken=new Map(),repeated=new Map();
for(const r of story.records){const n=r.node;
 for(const p of prose(n)){for(const term of atmosphere)frequencies[term]=(frequencies[term]||0)+p.split(term).length-1;
  const sentences=p.split(/(?<=[。！？])/u).map(s=>s.trim()).filter(Boolean);sentences.forEach((sentence,i)=>{for(const[name,re]of rules)if(re.test(sentence))hits.push({chapter:r.chapter,episode:r.episode,nodeId:n.id,file:r.file,kind:name,sentence,isLastSentence:i===sentences.length-1,reason:'启发式命中，须结合上下文人工复核；不自动判为错误或删改。'});if(sentence.length>=12){if(!repeated.has(sentence))repeated.set(sentence,[]);repeated.get(sentence).push(n.id)}});
 }
 for(const p of n.paragraphs||[]){if(!p.speaker)continue;if(!spoken.has(p.text))spoken.set(p.text,[]);spoken.get(p.text).push({speaker:p.speaker,nodeId:n.id})}
}
const duplicates=Array.from(repeated).filter(([,v])=>new Set(v).size>=3).map(([sentence,nodes])=>({sentence,nodes:Array.from(new Set(nodes)),note:'May be intentional quoted evidence or mutually exclusive branches; review before editing.'}));
const sharedDialogue=Array.from(spoken).filter(([text,records])=>text.length>=8&&new Set(records.map(r=>r.speaker)).size>=3).map(([text,records])=>({text,records}));
const report={inputHash:story.inputHash,method:'Editorial clues from actual source text, never an AI quality score, automatic rewrite, or proof of human reading.',hits,atmosphere:frequencies,duplicates,sharedDialogue};fs.writeFileSync(path.join(out,'prose-lint.json'),JSON.stringify(report,null,2)+'\n');
const lines=['# 文本审读线索','',report.method,'','命中允许保留；要核对具体动作、人物想做的事、真实语境与跨章后果。重复引述信件、照片和互斥回应不能机械去重。','',`待人工复核线索 ${hits.length} 条；跨节点重复句 ${duplicates.length} 条；三人以上共用较长对白 ${sharedDialogue.length} 条。`,''];
for(const hit of hits)lines.push(`- ${hit.chapter} / ${hit.nodeId} / ${hit.kind}${hit.isLastSentence?' / 段尾':''}：${hit.sentence}`);
fs.writeFileSync(path.join(out,'PROSE_REVIEW.md'),lines.join('\n')+'\n');console.log(`Editorial clues exported: ${hits.length} hits, no story edits`);
