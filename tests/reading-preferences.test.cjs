const test=require('node:test'),assert=require('node:assert/strict');
const {ReadingPreferencesStore,readingPreferencesKey,defaultReadingPreferences}=require('../work/core/save/ReadingPreferences.js');
const storage=(raw=null)=>{const data=new Map([['yushengweiji.save.v1','original story facts']]);if(raw!==null)data.set(readingPreferencesKey,raw);return{data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
test('reading preferences survive restart and do not touch story storage',()=>{
 const s=storage(),store=new ReadingPreferencesStore(s),next={version:1,font:'extra',theme:'night',volume:0,reducedMotion:true};
 assert.deepEqual(store.current,defaultReadingPreferences());assert.equal(store.update(next),true);
 assert.deepEqual(new ReadingPreferencesStore(s).current,next);assert.equal(s.data.get('yushengweiji.save.v1'),'original story facts');
 const copy=store.current;copy.font='standard';assert.equal(store.current.font,'extra');
});
test('invalid or future preferences are not silently replaced by defaults',()=>{
 const malformed='{broken',s=storage(malformed),store=new ReadingPreferencesStore(s);assert.equal(store.warning,true);assert.equal(s.data.get(readingPreferencesKey),malformed);
 const raw=JSON.stringify({version:2,font:'future'}),future=storage(raw),reader=new ReadingPreferencesStore(future);
 assert.equal(reader.update({...reader.current,font:'large'}),false);assert.equal(reader.current.font,'large');assert.equal(future.data.get(readingPreferencesKey),raw);
 const invalid=new ReadingPreferencesStore(storage(JSON.stringify({version:1,font:'huge',theme:'bad',volume:-1,reducedMotion:'true'})));
 assert.deepEqual(invalid.current,defaultReadingPreferences());
});
test('preference write failure retains old raw values and can retry live choices',()=>{
 const s=storage(JSON.stringify(defaultReadingPreferences())),before=s.data.get(readingPreferencesKey);let fail=true;
 const store=new ReadingPreferencesStore({...s,setItem:(k,v)=>{if(fail)throw Error('quota');s.setItem(k,v)}}),next={...store.current,font:'large',volume:.5};
 assert.equal(store.update(next),false);assert.equal(store.warning,true);assert.equal(s.data.get(readingPreferencesKey),before);assert.deepEqual(store.current,next);
 fail=false;assert.equal(store.update(store.current),true);assert.equal(store.warning,false);assert.deepEqual(new ReadingPreferencesStore(s).current,next);
 assert.equal(s.data.get('yushengweiji.save.v1'),'original story facts');
});
