// Exact site-owned keys only; authentication and advertising storage are never enumerated.
const plain = value => value && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const bytes = value => new TextEncoder().encode(JSON.stringify(value)).length;
export function createLocalStateAdapter({siteId, keys, storage, maxBytes=24*1024*1024, validateValues=()=>{}}) {
  const allowed=[...new Set(keys)];
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(siteId) || !allowed.length || allowed.some(k=>typeof k!=='string'||!k||['__proto__','constructor','prototype'].includes(k))) throw Error('사이트 저장 설정을 확인해 주세요.');
  function validate(value) {
    if (!plain(value)||value.version!==1||value.siteId!==siteId||!plain(value.values)||Object.keys(value.values).length!==allowed.length||
        allowed.some(k=>!Object.hasOwn(value.values,k)||(value.values[k]!==null&&typeof value.values[k]!=='string'))||
        Object.keys(value.values).some(k=>!allowed.includes(k))||bytes(value)>maxBytes) throw Error('이 사이트의 지원되는 백업 자료가 아닙니다.');
    validateValues(value.values);
    return {version:1,siteId,values:Object.fromEntries(allowed.map(k=>[k,value.values[k]]))};
  }
  function read() {
    if(!storage)throw Error('기기 저장소를 사용할 수 없습니다. 브라우저 저장 권한을 확인해 주세요.');
    return validate({version:1,siteId,values:Object.fromEntries(allowed.map(k=>[k,storage.getItem(k)]))});
  }
  function write(value) {
    const next=validate(value),before=read(),written=[];
    try {
      for (const key of allowed) {
        written.push(key);
        if(next.values[key]===null)storage.removeItem(key);else storage.setItem(key,next.values[key]);
      }
      if(JSON.stringify(read())!==JSON.stringify(next))throw Error('기기 저장 결과를 확인하지 못했습니다.');
    } catch(error) {
      let rollbackFailed=false;
      for(const key of written.reverse())try{if(before.values[key]===null)storage.removeItem(key);else storage.setItem(key,before.values[key]);}catch{rollbackFailed=true;}
      if(rollbackFailed)throw Error('기기 저장 공간이 부족해 복원을 중단했습니다. 원격 저장본을 유지했으니 공간을 확보한 뒤 다시 복원해 주세요.');
      throw Error('기기에 복원하지 못해 기존 자료로 되돌렸습니다. 저장 공간을 확인해 주세요.');
    }
  }
  return Object.freeze({read,write,validate});
}
