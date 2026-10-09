// Adds the licenses of code included in the web runtime; never copies model
// weights, development dependencies or unrelated proprietary editor files.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(path.join(root, 'index.html'))) throw Error('Usage: node tools/prepare-delivery.cjs existing-web-build');
const notices = [
  '遗憾 — H5 runtime third-party notices',
  'Original story, Image-generated art and synthetic fictional voice assets: see source art/original and art/visual-v2 provenance.',
  'Voice model weights and synthesis software are not included in this H5 package.',
  'Runtime libraries below retain their original notices and permissions.',
  ...['cocos-engine-3.8.8/LICENSE.md','mitt/LICENSE'].map(file => '\n--- '+file+' ---\n'+fs.readFileSync(path.join(__dirname,'../third_party',file),'utf8')),
].join('\n');
fs.writeFileSync(path.join(root,'THIRD_PARTY_NOTICES.txt'),notices+'\n');
console.log('Runtime notices saved in '+root);
