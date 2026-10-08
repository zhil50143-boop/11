const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv');
const validate = new Ajv({allErrors:true}).compile(require('./story.schema.json'));
const links = node => [node.type !== 'episodeEnd' ? node.next : undefined,node.fallback,...(node.options??[]).map(x=>x.next),...(node.branches??[]).map(x=>x.next),...(node.items??[]).map(x=>x.next)].filter(Boolean);
function validateStoryTree(resourceRoot = path.resolve(__dirname,'../assets/resources')) {
  const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
  const storyRoot = path.join(resourceRoot,'data/story');
  const catalog = read(path.join(storyRoot,'catalog.json'));
  const speakers = read(path.join(resourceRoot,'data/presentation.json')).speakers;
  if (!Array.isArray(catalog.chapters) || !catalog.chapters.length) throw new Error('Empty story catalog');
  const chapters = new Map(), episodes = new Map(), files = new Set(), globalNodes = new Set();
  const resourceFile = resource => {
    if (typeof resource !== 'string' || !/^data\/story\/chapter\d{2}\/[a-z0-9_]+$/.test(resource)) throw new Error('Invalid story resource: '+resource);
    return path.resolve(resourceRoot,resource+'.json');
  };
  for (const entry of catalog.chapters) {
    if (!/^CH\d{2}$/.test(entry.id) || chapters.has(entry.id)) throw new Error('Invalid/duplicate chapter: '+entry.id);
    const manifestFile = resourceFile(entry.resource);
    const manifest = read(manifestFile);
    if (manifest.chapterId !== entry.id || !manifest.title || !/^CH\d{2}$/.test(manifest.nextChapter) || !Array.isArray(manifest.episodes) || !manifest.episodes.length) throw new Error('Invalid manifest: '+entry.id);
    const folder = path.dirname(manifestFile);
    chapters.set(entry.id,{manifest,folder});files.add(manifestFile);
    for (const ref of manifest.episodes) {
      const file = resourceFile(ref.resource);
      if (path.dirname(file) !== folder || files.has(file) || episodes.has(ref.id)) throw new Error('Duplicate/misplaced episode: '+ref.id);
      files.add(file);
      const ep = read(file);
      if (!validate(ep)) throw new Error(ref.id + ': ' + JSON.stringify(validate.errors));
      if (ep.episodeId !== ref.id || ep.startNode !== ref.startNode) throw new Error('Manifest mismatch: '+ref.id);
      const nodes = new Map(ep.nodes.map(n=>[n.id,n]));
      if (nodes.size !== ep.nodes.length || !nodes.has(ep.startNode)) throw new Error('Invalid node IDs: '+ref.id);
      for (const target of Object.values(ep.nodeAliases??{})) if (!nodes.has(target)) throw new Error('Invalid save migration target: '+target);
      for (const node of ep.nodes) {
        if (globalNodes.has(node.id)) throw new Error('Duplicate global node: '+node.id);globalNodes.add(node.id);
        for (const target of links(node)) if (!nodes.has(target)) throw new Error('Missing target: '+node.id+' -> '+target);
        for (const list of [node.options,node.items]) if (list && new Set(list.map(x=>x.id)).size !== list.length) throw new Error('Duplicate option/item IDs');
        if (node.type === 'investigation' && (!node.items?.length || !Array.isArray(node.requiredFlags) || (!node.requiredFlags.length && !node.optional))) throw new Error('Incomplete investigation');
        if (node.requireReadToEnd && !['letter','audioInteraction'].includes(node.type)) throw new Error('Read-to-end requires a document: '+node.id);
        if (node.type === 'audioInteraction' && node.requireReadToEnd && !node.transcript) throw new Error('Full audio requires readable fallback: '+node.id);
        for (const speaker of [node.speaker,...(node.paragraphs??[]).map(p=>p.speaker)].filter(Boolean)) if (!speakers[speaker]) throw new Error('Unknown speaker: '+speaker);
      }
      const reached = new Set(), queue = [ep.startNode];
      while(queue.length) { const id=queue.pop();if(reached.has(id))continue;reached.add(id);queue.push(...links(nodes.get(id))); }
      if (reached.size !== nodes.size) throw new Error('Unreachable nodes: '+[...nodes.keys()].filter(x=>!reached.has(x)));
      if (!ep.nodes.some(n=>n.type==='episodeEnd')) throw new Error('Episode has no exit: '+ref.id);
      episodes.set(ref.id,{ep,chapterId:entry.id});
    }
  }
  // A file existing on disk is not proof that the playable manifest registers it.
  for (const dir of fs.readdirSync(storyRoot,{withFileTypes:true}).filter(d=>d.isDirectory()&&/^chapter\d{2}$/.test(d.name))) {
    if (![...chapters.values()].some(c=>path.basename(c.folder)===dir.name)) throw new Error('Unregistered chapter: '+dir.name);
    for (const name of fs.readdirSync(path.join(storyRoot,dir.name)).filter(f=>f.endsWith('.json'))) {
      if (!files.has(path.resolve(storyRoot,dir.name,name))) throw new Error('Unregistered story file: '+name);
    }
  }
  if (!chapters.has(catalog.startChapter)) throw new Error('Missing start chapter');
  if (!/^CH\d{2}$/.test(catalog.pendingChapter) || chapters.has(catalog.pendingChapter)) throw new Error('Invalid pending chapter boundary');
  const edges = new Map();
  for (const [id,{ep,chapterId}] of episodes) {
    const manifest = chapters.get(chapterId).manifest;
    const targets = [];
    for (const node of ep.nodes.filter(n=>n.type==='episodeEnd')) {
      const local = manifest.episodes.find(e=>e.id===node.next);
      if (local) targets.push(local.id);
      else if (node.next !== manifest.nextChapter) throw new Error('Missing episode: '+node.next);
      else if (chapters.has(node.next)) targets.push(chapters.get(node.next).manifest.episodes[0].id);
      else if (node.next !== catalog.pendingChapter || chapterId !== catalog.chapters.at(-1).id) throw new Error('Invalid chapter boundary: '+chapterId+' -> '+node.next);
    }
    edges.set(id,targets);
  }
  const reached = new Set(), queue = [chapters.get(catalog.startChapter).manifest.episodes[0].id];
  while(queue.length) { const id=queue.pop();if(reached.has(id))continue;reached.add(id);queue.push(...edges.get(id)); }
  if (reached.size !== episodes.size) throw new Error('Unreachable episodes: '+[...episodes.keys()].filter(id=>!reached.has(id)));
  return {chapters:chapters.size,episodes:episodes.size,nodes:globalNodes.size,pendingChapter:catalog.pendingChapter};
}
module.exports = {validateStoryTree};
if (require.main === module) {
  const r=validateStoryTree();console.log(`Story catalog and graph PASS: ${r.chapters} chapters, ${r.episodes} episodes, ${r.nodes} nodes; pending ${r.pendingChapter}`);
}
