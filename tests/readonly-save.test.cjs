const {test}=require('node:test'), assert=require('node:assert/strict');
const {LocalSave}=require('../work/core/save/LocalSave.js');
const {createInitialState}=require('../work/core/core/GameState.js');
function snapshot(raw){let writes=0;return {port:{getItem:()=>raw,setItem:()=>{writes++;throw Error('Read-only writes prohibited')},removeItem:()=>{writes++;throw Error('Read-only removal prohibited')}},writes:()=>writes}}
test('lookback snapshot preserves progress and returns an independent state without writes',()=>{
 const state=createInitialState();state.flags.VIEWED_OLD_PHOTO=true;state.updatedAt=123;state.progress.readingOffset=.61;
 const s=snapshot(JSON.stringify(state)),local=new LocalSave(s.port,'save');
 const viewed=local.peek();assert.deepEqual(viewed,state);viewed.flags.VIEWED_OLD_PHOTO=false;
 assert.deepEqual(local.peek(),state);assert.equal(s.writes(),0);
});
test('lookback rejects corrupt, future or unreadable records without backup or overwrite',()=>{
 for(const raw of ['{bad',JSON.stringify({saveVersion:3}),JSON.stringify(null)]){
  const s=snapshot(raw);assert.throws(()=>new LocalSave(s.port,'save').peek());assert.equal(s.writes(),0);
 }
 assert.throws(()=>new LocalSave({getItem(){throw Error('Storage unavailable')},setItem(){assert.fail('write')},removeItem(){assert.fail('delete')}},'save').peek());
});
test('lookback can inspect old or malformed collections without inventing history or mutating raw data',()=>{
 const old=createInitialState();old.saveVersion=1;old.flags.VIEWED_OLD_PHOTO=true;
 const malformed=createInitialState();malformed.readNodeIds=[{},'known'];malformed.life.memoryRecords.TEST={title:'memory',status:'fragmentary',evidence:[{},'source']};
 for(const input of [old,malformed]){
  const s=snapshot(JSON.stringify(input)),state=new LocalSave(s.port,'save').peek();assert.equal(s.writes(),0);
  if(input===malformed){assert.deepEqual(state.readNodeIds,['known']);assert.deepEqual(state.life.memoryRecords.TEST.evidence,['source']);}
  else assert.equal(state.flags.VIEWED_OLD_PHOTO,true);
 }
});
