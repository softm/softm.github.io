import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLocalStateAdapter} from '../../../shared/platform/v1/local-state.mjs';
import {createVaultSession,STATE_ITEM} from '../../../shared/platform/v1/vault-session.mjs';
function storage(initial={}) {
  const values=new Map(Object.entries(initial));
  return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k),values};
}
function setup(store=storage({favorite:'["one"]',authToken:'never-export'}),remote) {
  const adapter=createLocalStateAdapter({siteId:'testsite',keys:['favorite','note'],storage:store});
  const shared=remote||{row:null,backups:new Map(),counter:0},client={
    currentUser:{uid:'owner'},
    get:async()=>structuredClone(shared.row),
    put:async(id,value,{expectedRevision})=>{assert.equal(id,STATE_ITEM);if((shared.row?.revision||0)!==expectedRevision)throw Error('conflict');shared.row={revision:expectedRevision+1,value:structuredClone(value)};return shared.row.revision;},
    remove:async(id,{expectedRevision})=>{if(shared.row?.revision!==expectedRevision)throw Error('conflict');shared.row=null;},
    uploadEncryptedBackup:async text=>{const id='backup-'+(++shared.counter);shared.backups.set(id,text);return {id};},
    downloadBackup:async id=>{if(!shared.backups.has(id))throw Error('missing backup');return shared.backups.get(id);},
    deleteBackup:async id=>shared.backups.delete(id)
  };
  // Deterministic cipher double for controller behavior; real AES-GCM is covered by crypto.test.mjs.
  const seal=async(value,password,context)=>({value,password,context});
  const unseal=async(cipher,password,context)=>{if(cipher.password!==password||cipher.context!==context)throw Error('wrong password or context');return cipher.value;};
  const session=createVaultSession({siteId:'testsite',adapter,client,seal,unseal});
  return {store,adapter,shared,client,session};
}
const pw='test-password-123';
test('exact allowlist excludes authentication; restore preserves unrelated keys',()=>{
  const {store,adapter}=setup();const value=adapter.read();
  assert.deepEqual(Object.keys(value.values),['favorite','note']);
  assert.equal(JSON.stringify(value).includes('never-export'),false);
  assert.throws(()=>adapter.write({...value,siteId:'other'}));
  assert.throws(()=>adapter.write({...value,values:{...value.values,authToken:'stolen'}}));
  adapter.write({...value,values:{favorite:'["two"]',note:'hello'}});
  assert.equal(store.getItem('authToken'),'never-export');
});
test('failed local writes roll back earlier changed keys',()=>{
  const s=storage({favorite:'old',note:'before'}),set=s.setItem;let fail=true;
  s.setItem=(k,v)=>{if(k==='note'&&v==='after'&&fail){fail=false;throw Error('quota');}return set(k,v);};
  const {adapter}=setup(s);
  assert.throws(()=>adapter.write({version:1,siteId:'testsite',values:{favorite:'new',note:'after'}}),/되돌렸/);
  assert.equal(s.getItem('favorite'),'old');assert.equal(s.getItem('note'),'before');
});
test('first save requires inspect, then restore decrypts before writing',async()=>{
  const x=setup();await assert.rejects(x.session.save(pw),/저장본 확인/);
  await x.session.inspect(pw);await x.session.save(pw);x.store.setItem('favorite','["local-change"]');
  let confirmations=0;
  await x.session.restore(pw,{confirm:async()=>{confirmations++;return true;}});
  assert.equal(confirmations,1);assert.equal(x.store.getItem('favorite'),'["one"]');
});
test('existing remote data cannot be overwritten by automatic first sync',async()=>{
  const first=setup();await first.session.inspect(pw);await first.session.save(pw);
  const second=setup(storage({favorite:'[]'}),first.shared);await second.session.inspect(pw);
  await assert.rejects(second.session.save(pw,{automatic:true}),/먼저 복원|자동/);
  assert.equal(second.session.ready,false);assert.equal(first.shared.row.revision,1);
});
test('two devices cannot silently overwrite the same revision',async()=>{
  const first=setup();await first.session.inspect(pw);await first.session.save(pw);
  const second=setup(storage({favorite:'["two"]'}),first.shared);await second.session.inspect(pw);
  first.store.setItem('note','updated');await first.session.save(pw);
  await assert.rejects(second.session.save(pw,{replace:true}),/다른 기기/);
  assert.equal(first.shared.row.revision,2);
});
test('cancel and local changes during confirmation leave current local data intact',async()=>{
  const x=setup();await x.session.inspect(pw);await x.session.save(pw);x.store.setItem('note','current');
  assert.equal((await x.session.restore(pw,{confirm:async()=>false})).cancelled,true);
  assert.equal(x.store.getItem('note'),'current');
  await assert.rejects(x.session.restore(pw,{confirm:async()=>{x.store.setItem('note','typing');return true;}}),/기기 자료가 변경/);
  assert.equal(x.store.getItem('note'),'typing');
});
test('account changes and a lock invalidate in-flight snapshots',async()=>{
  const x=setup();await x.session.inspect(pw);
  const old=x.client.uploadEncryptedBackup;x.client.uploadEncryptedBackup=async text=>{const r=await old(text);x.client.currentUser={uid:'other'};return r;};
  await assert.rejects(x.session.save(pw),/계정이 바뀌어/);
  assert.equal(x.shared.row,null);
});
test('tampered site payload and wrong encryption context never reach the local adapter',async()=>{
  const x=setup();await x.session.inspect(pw);await x.session.save(pw);
  const id=x.session.backups[0].id,cipher=JSON.parse(x.shared.backups.get(id));
  cipher.value.siteId='other';x.shared.backups.set(id,JSON.stringify(cipher));
  await assert.rejects(x.session.restore(pw,{confirm:async()=>true}),/이 사이트/);
  assert.equal(x.store.getItem('favorite'),'["one"]');
});
test('retains five snapshots and deletes only module-owned superseded snapshots',async()=>{
  const x=setup();x.shared.backups.set('unrelated','keep');
  await x.session.inspect(pw);for(let i=0;i<7;i++){x.store.setItem('note',String(i));await x.session.save(pw);}
  assert.equal(x.session.backups.length,5);assert.equal(x.shared.backups.size,6);assert.equal(x.shared.backups.get('unrelated'),'keep');
  await x.session.erase(pw,{confirm:async()=>true});
  assert.equal(x.shared.row,null);assert.equal(x.shared.backups.size,1);assert.equal(x.store.getItem('note'),'6');
});
test('uncertain commit failures preserve uploaded data for later reconciliation',async()=>{
  const x=setup();await x.session.inspect(pw);
  const put=x.client.put;x.client.put=async(...args)=>{await put(...args);throw Error('network response lost');};
  await assert.rejects(x.session.save(pw),/response lost/);
  assert.equal(x.shared.backups.size,1);
  const fresh=setup(x.store,x.shared);await fresh.session.inspect(pw);
  await fresh.session.restore(pw,{confirm:async()=>true});
  assert.equal(x.store.getItem('favorite'),'["one"]');
});
