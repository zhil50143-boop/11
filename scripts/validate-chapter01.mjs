import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../assets/resources/data/story/chapter01/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('chapter01_manifest.json', root), 'utf8'));
const episodeIds = new Set(manifest.episodes.map(item => item.id));
const episodes = new Map();
for (const entry of manifest.episodes) {
  const data = JSON.parse(await readFile(new URL(`${entry.resource.split('/').at(-1)}.json`, root), 'utf8'));
  assert.equal(data.episodeId, entry.id, `episode id mismatch for ${entry.id}`);
  const nodes = new Map(data.nodes.map(node => [node.id, node]));
  assert.equal(nodes.size, data.nodes.length, `${entry.id} contains duplicate node ids`);
  assert.ok(nodes.has(entry.startNode), `${entry.id} start node is missing`);
  for (const node of data.nodes) {
    const links = [node.next, node.fallback, ...(node.branches ?? []).map(branch => branch.next), ...(node.options ?? []).map(option => option.next)];
    for (const target of links.filter(Boolean)) {
      assert.ok(nodes.has(target) || episodeIds.has(target) || target === 'CH02', `${node.id} points to missing node ${target}`);
    }
  }
  episodes.set(entry.id, { data, nodes });
}

const seen = new Set();
const visitEpisode = id => {
  const episode = episodes.get(id);
  assert.ok(episode, `manifest references missing episode ${id}`);
  const visit = nodeId => {
    if (seen.has(nodeId)) return;
    const node = episode.nodes.get(nodeId);
    assert.ok(node, `reachable node ${nodeId} is missing`);
    seen.add(nodeId);
    const links = [node.next, node.fallback, ...(node.branches ?? []).map(branch => branch.next), ...(node.options ?? []).map(option => option.next)];
    for (const target of links.filter(Boolean)) if (episode.nodes.has(target)) visit(target);
  };
  visit(episode.data.startNode);
};
for (const item of manifest.episodes) visitEpisode(item.id);

const allText = [...episodes.values()].flatMap(({ data }) => data.nodes.flatMap(node => [node.text, ...(node.options ?? []).map(option => option.text)].filter(Boolean))).join('\n');
for (const phrase of ['2037年', '旧照片', '许知夏', 'MP3', '雨声', '十七路公交']) {
  assert.ok(allText.includes(phrase), `Chapter 01 is missing required story beat: ${phrase}`);
}
assert.ok([...episodes.values()].some(({ data }) => data.nodes.some(node => node.type === 'photo')));
assert.ok([...episodes.values()].some(({ data }) => data.nodes.some(node => node.type === 'letter')));
assert.ok([...episodes.values()].some(({ data }) => data.nodes.some(node => node.type === 'audioInteraction')));
assert.ok([...episodes.values()].some(({ data }) => data.nodes.some(node => node.type === 'transition')));
console.log(`Chapter 01 validated: ${manifest.episodes.length} episodes, ${seen.size} reachable nodes.`);
