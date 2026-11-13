// Identity-only Cloudflare account boot; legacy Firebase vault is opt-in.
import {createAccountContext} from './site-account.mjs?v=20261113-policyfundfinder-1';
import {mountSiteAccount} from './account-menu.mjs?v=20261112-header-slot-1';

const siteId=new URL(import.meta.url).searchParams.get('site');
const SITES=Object.freeze({
  policyfundfinder:{
    name:'지원한눈',
    accountTarget:'.topbar .header-actions, .mobile-header',
    legacyVaultUrl:'https://policyfundfinder.designboard.net/?legacyAccount=1'
  }
});

function mount(){
  const settings=SITES[siteId];
  if(!settings||location.protocol==='file:'||location.hostname==='appassets.androidplatform.net')return;
  if(new URL(location.href).searchParams.get('legacyAccount')==='1'){
    // Explicit recovery of old encrypted backups; never silently merge UID or data.
    import('./boot.mjs?site=policyfundfinder&v=20261029-account-1')
      .catch(()=>console.warn('이전 보관소 화면을 불러올 수 없습니다.'));
    return;
  }
  const account=createAccountContext({
    siteId,
    sdkLoader:()=>import('./cloudflare-site-sdk.mjs?v=20261113-policyfundfinder-1'),
    accountPageUrl:'https://softm-hannun-account.softm.workers.dev/account',
    legacyVaultUrl:settings.legacyVaultUrl
  });
  const ui=mountSiteAccount({
    siteId,name:settings.name,account,accountTarget:settings.accountTarget,vault:null
  });
  window.SoftmAccounts ||= new Map();
  window.SoftmAccounts.set(siteId,account);
  window.dispatchEvent(new CustomEvent('softm:account-ready',{detail:{siteId,account,backend:'cloudflare'}}));
  window.addEventListener('pagehide',()=>{
    ui.destroy();
    account.destroy();
    if(window.SoftmAccounts?.get(siteId)===account)window.SoftmAccounts.delete(siteId);
  },{once:true});
}
if(siteId){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
}
