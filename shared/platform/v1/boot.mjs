import {mountSiteVault} from './site-vault.mjs?v=20261029-account-1';
import {createAccountContext,mountSiteAccount} from './site-account.mjs?v=20261029-withdrawal-1';
import {createLocalStateAdapter} from './local-state.mjs';
import {SITE_INTEGRATIONS} from './site-integrations.mjs';
const siteId=new URL(import.meta.url).searchParams.get('site');
export function mountRegisteredSite(id=siteId) {
  const config=SITE_INTEGRATIONS[id];
  if(!config)throw Error('등록되지 않은 공통 보관소입니다.');
  if(location.hostname==='appassets.androidplatform.net'||location.protocol==='file:')return null;
  if(id==='evchargingstation'&&new URL(location.href).searchParams.get('demo')==='1')return null;
  let adapter;
  if(config.sessionKeys) {
    let storage;try{storage=window.sessionStorage;}catch{}
    adapter=createLocalStateAdapter({siteId:id,keys:config.sessionKeys,storage,validateValues(values){
      for(const value of Object.values(values)){if(value===null)continue;const ids=JSON.parse(value);if(!Array.isArray(ids)||ids.length>5000||ids.some(x=>typeof x!=='string'||x.length>180))throw Error('담은 기관 자료를 확인해 주세요.');}
    }});
  }
  if(config.bridge) {
    const bridge=()=>{const b=window.SoftmSiteState;if(b?.siteId!==id)throw Error('먼저 이 사이트에서 저장할 작업공간을 열어 주세요.');return b;};
    adapter={read:()=>bridge().read(),validate:v=>bridge().validate(v),write:v=>bridge().write(v),scope:()=>bridge().scope?.()};
  }
  const account=createAccountContext({siteId:id});
  const vault=mountSiteVault({siteId:id,...config,adapter,account,hideLauncher:true});
  if(!vault)return null;
  const ui=mountSiteAccount({siteId:id,...config,account,vault});
  window.SoftmAccounts ||= new Map();window.SoftmAccounts.set(id,account);
  window.dispatchEvent(new CustomEvent('softm:account-ready',{detail:{siteId:id,account}}));
  return {account,element:ui.element,open:()=>vault.open(),destroy(){ui.destroy();vault.destroy();account.destroy();}};
}
if(siteId) {
  const mount=()=>{try{mountRegisteredSite();}catch(error){console.warn('공통 보관소를 준비하지 못했습니다. 기존 기기 기능은 계속 사용할 수 있습니다.');}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
}



