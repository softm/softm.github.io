// GoldSignal Cloudflare account entrypoint. Do not load Firebase by default.
import {createAccountContext} from './site-account.mjs?v=20261113-goldsignal-auth-1';
import {mountSiteAccount} from './account-menu.mjs?v=20261112-header-slot-1';

const siteId=new URL(import.meta.url).searchParams.get('site');
function mount(){
  if(siteId!=='goldsignal')return;
  // Offline Android assets remain usable but cannot authenticate or sync.
  if(location.protocol==='file:'||location.hostname==='appassets.androidplatform.net')return;

  const account=createAccountContext({
    siteId,
    sdkLoader:()=>import('./cloudflare-goldsignal-sdk.mjs?v=20261113-goldsignal-auth-1'),
    accountPageUrl:'https://softm-hannun-account.softm.workers.dev/account',
    legacyVaultUrl:null
  });
  const ui=mountSiteAccount({
    siteId,
    name:'금시그널',
    account,
    accountTarget:'#siteAccountSlot, .topbar-actions, .topbar',
    vault:null
  });
  window.SoftmAccounts ||= new Map();
  window.SoftmAccounts.set(siteId,account);
  window.dispatchEvent(new CustomEvent('softm:account-ready',{detail:{siteId,account,backend:'cloudflare'}}));
  window.addEventListener('pagehide',()=>{ui.destroy();account.destroy();},{once:true});
}
if(siteId){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
}
