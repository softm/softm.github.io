// WeatherHannun Cloudflare account entrypoint. Do not load Firebase by default.
import {createAccountContext,mountSiteAccount} from './site-account.mjs?v=20261112-weather-cloudflare-1';

const siteId=new URL(import.meta.url).searchParams.get('site');
function mount(){
  if(siteId!=='weatherhannun')return;
  if(location.protocol==='file:'||location.hostname==='appassets.androidplatform.net')return;
  if(new URL(location.href).searchParams.get('legacyAccount')==='1'){
    // Read/restore old encrypted Firebase backups ONLY when user explicitly opts in.
    // This mode never deletes or automatically imports old data.
    import('./boot.mjs?site=weatherhannun&v=20261029-weather-header-1').catch(()=>
      console.warn('기존 보관소 연결을 불러오지 못했습니다.'));
    return;
  }
  const legacy=new URL(location.href);
  legacy.searchParams.set('legacyAccount','1');
  const account=createAccountContext({
    siteId,
    sdkLoader:()=>import('./cloudflare-weather-sdk.mjs?v=20261112-cloudflare-1'),
    accountPageUrl:'https://softm-hannun-account.softm.workers.dev/account',
    legacyVaultUrl:legacy.href
  });
  // Cloudflare's encrypted item API has a different backup schema. Until a
  // verified migration is implemented, don't mount the Firebase vault against
  // the new UID or silently overwrite backups.
  const ui=mountSiteAccount({siteId,name:'날씨한눈',account,
    accountTarget:'#siteAccountSlot, .topbar .topbar-actions, .topbar',vault:null});
  window.SoftmAccounts ||= new Map();
  window.SoftmAccounts.set(siteId,account);
  window.dispatchEvent(new CustomEvent('softm:account-ready',{detail:{siteId,account,backend:'cloudflare'}}));
  window.addEventListener('pagehide',()=>{ui.destroy();account.destroy();},{once:true});
}
if(siteId){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
}
