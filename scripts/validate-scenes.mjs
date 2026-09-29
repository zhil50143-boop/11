import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function compress(uuid) {
  const hex = uuid.replaceAll('-', '');
  const bits = hex.slice(5).split('').map(char => parseInt(char, 16).toString(2).padStart(4, '0')).join('');
  let tail = '';
  for (let index = 0; index < bits.length; index += 6) tail += base64[parseInt(bits.slice(index, index + 6), 2)];
  return `${hex.slice(0, 5)}/${tail}`;
}
function visitIds(value, check) {
  if (!value || typeof value !== 'object') return;
  if (Object.hasOwn(value, '__id__')) check(value.__id__);
  for (const child of Object.values(value)) visitIds(child, check);
}

for (const sceneName of ['Boot', 'Main', 'Story']) {
  const scene = JSON.parse(await readFile(`assets/scenes/${sceneName}.scene`, 'utf8'));
  const sceneMeta = JSON.parse(await readFile(`assets/scenes/${sceneName}.scene.meta`, 'utf8'));
  const scriptMeta = JSON.parse(await readFile(`assets/scripts/scene/${sceneName}.ts.meta`, 'utf8'));
  assert.equal(scene[0].__type__, 'cc.SceneAsset', `${sceneName} SceneAsset is first`);
  assert.equal(scene[0]._name, sceneName);
  assert.equal(scene[1].__type__, 'cc.Scene');
  assert.equal(scene[1]._name, sceneName);
  assert.equal(sceneMeta.importer, 'scene');
  assert.equal(scriptMeta.importer, 'typescript');
  const scriptComponent = scene.find(object => object.__type__ === compress(scriptMeta.uuid));
  assert.ok(scriptComponent, `${sceneName} script UUID resolves to a scene component`);
  assert.equal(scriptComponent.node.__id__, 4, `${sceneName} script is attached to Canvas`);
  visitIds(scene, id => assert.ok(Number.isInteger(id) && id >= 0 && id < scene.length, `${sceneName} has valid object reference ${id}`));
}
console.log('Cocos scene assets validated: Boot, Main, Story; object refs and script UUIDs resolve.');
