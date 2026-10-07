const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv');
const schema = require('./story.schema.json');
const validate = new Ajv({allErrors:true}).compile(schema);
const folder = path.resolve(__dirname,'../assets/resources/data/story/chapter01');
const manifest = JSON.parse(fs.readFileSync(path.join(folder,'chapter01_manifest.json'),'utf8'));
const ids = new Set(manifest.episodes.map(e=>e.id));
if (ids.size !== manifest.episodes.length) throw new Error('Duplicate episode IDs');
let total = 0;
for (const ref of manifest.episodes) {
  const file = path.resolve(__dirname,'../assets/resources',ref.resource+'.json');
  const ep = JSON.parse(fs.readFileSync(file,'utf8'));
  if (!validate(ep)) throw new Error(ref.id + ': ' + JSON.stringify(validate.errors));
  if (ep.episodeId !== ref.id || ep.startNode !== ref.startNode) throw new Error('Manifest mismatch: '+ref.id);
  const nodes = new Map(ep.nodes.map(n=>[n.id,n]));
  if (nodes.size !== ep.nodes.length || !nodes.has(ep.startNode)) throw new Error('Invalid node IDs: '+ref.id);
  for (const target of Object.values(ep.nodeAliases??{})) if (!nodes.has(target)) throw new Error('Invalid save migration target: '+target);
  const links = node => [node.type !== 'episodeEnd' ? node.next : undefined,node.fallback,...(node.options??[]).map(x=>x.next),...(node.branches??[]).map(x=>x.next),...(node.items??[]).map(x=>x.next)].filter(Boolean);
  for (const node of ep.nodes) {
    for (const target of links(node)) if (!nodes.has(target)) throw new Error('Missing target: '+node.id+' -> '+target);
    if (node.type === 'episodeEnd' && !ids.has(node.next) && node.next !== manifest.nextChapter) throw new Error('Missing episode: '+node.next);
    for (const list of [node.options,node.items]) if (list && new Set(list.map(x=>x.id)).size !== list.length) throw new Error('Duplicate option/item IDs');
    if (node.type === 'investigation' && (!node.items?.length || !node.requiredFlags?.length)) throw new Error('Incomplete investigation');
  }
  const reached = new Set(); const queue = [ep.startNode];
  while(queue.length) { const id=queue.pop(); if(reached.has(id))continue; reached.add(id); queue.push(...links(nodes.get(id))); }
  if (reached.size !== nodes.size) throw new Error('Unreachable nodes: '+[...nodes.keys()].filter(x=>!reached.has(x)));
  total += nodes.size;
}
console.log('Story schema and graph PASS: '+manifest.episodes.length+' episodes, '+total+' nodes');
