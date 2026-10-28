// Immutable encrypted snapshots + a revision-checked encrypted head.
export const STATE_ITEM='site-state-v1';
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function createVaultSession({siteId,client,adapter,seal,unseal,onStatus=()=>{}}) {
  let epoch=0,revision,head=null,aligned=false,busy=false,remembered=null,boundScope;
  const identity=()=>{const uid=client.currentUser?.uid;if(!uid)throw Error('먼저 공통 계정에 로그인해 주세요.');return uid;};
  const stamp=()=>({uid:identity(),epoch,scope:adapter.scope?.()});
  const assert=s=>{if(s.epoch!==epoch||client.currentUser?.uid!==s.uid||s.scope!==adapter.scope?.())throw Error('계정이 바뀌어 작업을 중단했습니다. 다시 연결해 주세요.');};
  const context=uid=>uid+'/'+siteId+'/'+STATE_ITEM+'/snapshot';
  const passwordOK=p=>{if(typeof p!=='string'||p.length<10)throw Error('보관소 암호는 10자 이상 입력해 주세요.');};
  function validateHead(value) {
    if(!plain(value)||value.kind!=='site-state-head'||value.version!==1||!Array.isArray(value.backups)||value.backups.length<1||value.backups.length>5||
       value.backups.some(b=>!plain(b)||typeof b.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(b.id)||typeof b.savedAt!=='string'||!Number.isFinite(Date.parse(b.savedAt)))||
       new Set(value.backups.map(b=>b.id)).size!==value.backups.length)throw Error('원격 저장 목록의 형식을 확인하지 못했습니다.');
    return value;
  }
  async function fetchHead(password,s) {
    const row=await client.get(STATE_ITEM,{password});assert(s);
    if(row){if(!Number.isSafeInteger(row.revision)||row.revision<1)throw Error('원격 저장 버전을 확인하지 못했습니다.');validateHead(row.value);}
    return row;
  }
  async function exclusive(work) {
    if(busy)throw Error('이전 작업을 마친 뒤 다시 시도해 주세요.');
    busy=true;try{return await work();}finally{busy=false;}
  }
  async function inspect(password) {
    passwordOK(password);
    return exclusive(async()=>{
      const s=stamp(),row=await fetchHead(password,s);
      revision=row?.revision||0;head=row?.value||null;aligned=!row;boundScope=s.scope;
      onStatus(row?'원격 저장본이 있습니다. 복원하거나 현재 자료로 교체 저장할 수 있습니다.':'원격 저장본이 없습니다. 현재 자료를 처음 저장할 수 있습니다.');
      return {exists:!!row,revision,backups:head?.backups||[]};
    });
  }
  async function save(password,{replace=false,automatic=false}={}) {
    passwordOK(password);
    return exclusive(async()=>{
      const s=stamp();
      if(revision===undefined)throw Error('먼저 암호를 입력하고 저장본 확인을 눌러 주세요.');
      if(!aligned&&!replace)throw Error('원격 저장본이 있습니다. 먼저 복원하거나 교체 저장을 선택해 주세요.');
      if(automatic&&!aligned)throw Error('처음 연결한 자료는 자동으로 덮어쓰지 않습니다.');
      if(boundScope!==s.scope)throw Error('열어 둔 작업공간이 바뀌었습니다. 자동 저장을 끄고 저장본을 다시 확인해 주세요.');
      const current=await fetchHead(password,s);
      if((current?.revision||0)!==revision)throw Error('다른 기기에서 자료가 변경되었습니다. 저장본을 다시 확인해 주세요.');
      const snapshot=adapter.validate(await adapter.read());assert(s);
      if(automatic&&remembered&&same(snapshot,remembered))return {unchanged:true};
      const savedAt=new Date().toISOString(),encrypted=await seal({version:1,siteId,savedAt,snapshot},password,context(s.uid));assert(s);
      onStatus('암호화된 자료를 저장하고 있습니다.');
      const uploaded=await client.uploadEncryptedBackup(JSON.stringify(encrypted));assert(s);
      const old=head?.backups||[],backups=[{id:uploaded.id,savedAt},...old].slice(0,5);
      const next={kind:'site-state-head',version:1,backups};
      // No deletion on an ambiguous commit failure: the server may already have accepted it.
      const nextRevision=await client.put(STATE_ITEM,next,{password,expectedRevision:revision});assert(s);
      revision=nextRevision;head=next;aligned=true;remembered=snapshot;
      // Remove only snapshots created and superseded by this module after the head commits.
      for(const item of old.slice(4))try{assert(s);await client.deleteBackup(item.id);}catch{break;}
      onStatus('암호화 저장을 완료했습니다.');
      return {revision,backups};
    });
  }
  async function restore(password,{backupId,confirm=async()=>false}={}) {
    passwordOK(password);
    return exclusive(async()=>{
      const s=stamp(),row=await fetchHead(password,s);
      if(!row)throw Error('복원할 원격 저장본이 없습니다.');
      const id=backupId||row.value.backups[0].id;
      if(!row.value.backups.some(b=>b.id===id))throw Error('현재 보관소에 속한 저장본이 아닙니다.');
      const text=await client.downloadBackup(id);assert(s);
      const body=await unseal(JSON.parse(text),password,context(s.uid));assert(s);
      if(body?.version!==1||body.siteId!==siteId)throw Error('이 사이트의 저장본이 아닙니다.');
      const snapshot=adapter.validate(body.snapshot),before=await adapter.read();assert(s);
      if(!await confirm({savedAt:body.savedAt,snapshot}))return {cancelled:true};
      assert(s);
      if(!same(before,await adapter.read()))throw Error('확인 중 기기 자료가 변경되었습니다. 다시 복원해 주세요.');
      assert(s);await adapter.write(snapshot);assert({...s,scope:adapter.scope?.()});
      revision=row.revision;head=row.value;aligned=true;remembered=snapshot;boundScope=adapter.scope?.();
      onStatus('기기에 복원했습니다. 사이트를 새로 열면 복원한 자료를 사용할 수 있습니다.');
      return {restored:true,backups:head.backups};
    });
  }
  async function erase(password,{confirm=async()=>false}={}) {
    passwordOK(password);
    return exclusive(async()=>{
      const s=stamp(),row=await fetchHead(password,s);
      if(!row)return {empty:true};
      if(!await confirm())return {cancelled:true};
      assert(s);await client.remove(STATE_ITEM,{expectedRevision:row.revision});assert(s);
      revision=0;head=null;aligned=true;remembered=null;
      let remaining=0;
      for(const b of row.value.backups)try{assert(s);await client.deleteBackup(b.id);}catch{remaining++;}
      onStatus(remaining?'현재 저장 연결을 삭제했습니다. 일부 백업 조각 정리는 완료하지 못했습니다.':'이 모듈의 원격 저장본을 삭제했습니다. 기기 자료는 유지됩니다.');
      return {remaining};
    });
  }
  function reset(){epoch++;revision=undefined;head=null;aligned=false;remembered=null;boundScope=undefined;}
  return Object.freeze({inspect,save,restore,erase,reset,get ready(){return aligned&&revision!==undefined&&remembered!==null;},get busy(){return busy;},get backups(){return head?.backups||[];}});
}
